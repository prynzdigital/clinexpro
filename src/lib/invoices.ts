import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { Invoice, InvoicePayment } from "@/db/schema";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import en from "@/dictionaries/en";
import fr from "@/dictionaries/fr";
import { mauritiusDate } from "@/lib/dates";
import { addDays } from "@/lib/schedule";
import { estimate, type Frequency } from "@/lib/pricing";

// --- Settings (environment; see DEPLOY.md) --------------------------------

const env = (k: string) => process.env[k]?.trim() || undefined;

export function invoiceSettings() {
  const vatPercent = Number(env("VAT_RATE_PERCENT") ?? 0);
  return {
    // 0 until Clinex Pro confirms VAT registration; 15 is the Mauritius standard rate.
    vatRateBp: Number.isFinite(vatPercent) && vatPercent > 0 ? Math.round(vatPercent * 100) : 0,
    vatNumber: env("VAT_NUMBER"),
    brn: env("BUSINESS_BRN"),
    dueDays: Number(env("INVOICE_DUE_DAYS") ?? 7),
    // How to pay: bank account, Juice number... printed on every invoice.
    paymentInstructions: env("INVOICE_PAYMENT_INSTRUCTIONS")?.replace(/\\n/g, "\n"),
  };
}

// --- Money ---------------------------------------------------------------

type Line = { quantity: number; unitCents: number };

/** Line prices include VAT; the VAT part is worked back out of the total. */
export function totals(lines: Line[], vatRateBp: number) {
  const totalCents = lines.reduce((sum, l) => sum + l.quantity * l.unitCents, 0);
  const vatCents = vatRateBp ? Math.round((totalCents * vatRateBp) / (10000 + vatRateBp)) : 0;
  return { totalCents, vatCents };
}

export const money = (cents: number, lang = "en") =>
  new Intl.NumberFormat(lang === "fr" ? "fr-MU" : "en-MU", { style: "currency", currency: "MUR", minimumFractionDigits: 2 }).format(cents / 100);

export type InvoiceState = "draft" | "void" | "paid" | "part_paid" | "unpaid" | "overdue";

export function summarise(invoice: Pick<Invoice, "status" | "totalCents" | "dueDate">, paid: Pick<InvoicePayment, "amountCents">[]) {
  const paidCents = paid.reduce((sum, p) => sum + p.amountCents, 0);
  const balanceCents = invoice.totalCents - paidCents;
  let state: InvoiceState;
  if (invoice.status === "draft" || invoice.status === "void") state = invoice.status;
  else if (balanceCents <= 0) state = "paid";
  else if (invoice.dueDate && invoice.dueDate < mauritiusDate()) state = "overdue";
  else state = paidCents > 0 ? "part_paid" : "unpaid";
  return { paidCents, balanceCents, state };
}

// --- Drafts ---------------------------------------------------------------

const newToken = () => randomBytes(18).toString("base64url");

/** Lines for a booking: the price breakdown when it still matches what the customer was quoted, else one line. */
function bookingLines(booking: typeof schema.bookings.$inferSelect, lang: string) {
  const t = lang === "fr" ? fr : en;
  const service = getService(booking.service)?.name[lang === "fr" ? "fr" : "en"] ?? booking.service;
  const { addons = [], ...values } = booking.details as Record<string, number> & { addons?: string[] };
  const when = new Intl.DateTimeFormat(lang === "fr" ? "fr-MU" : "en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${booking.date}T00:00:00Z`),
  );
  const detail = Object.entries(values).map(([k, v]) => `${t.booking.fields[k] ?? k}: ${v}`).join(", ");
  const title = `${service} (${when})${detail ? `, ${detail}` : ""}`;

  const price = estimate({ service: booking.service, values, addons, frequency: booking.frequency as Frequency });
  if (!price || price.totalMur !== booking.estimateMur) {
    return [{ description: title, quantity: 1, unitCents: booking.estimateMur * 100 }];
  }
  // Base and extras are priced before the frequency discount, which gets its own line.
  const frequency = booking.frequency as Frequency;
  const lines = [{ description: title, quantity: 1, unitCents: price.baseMur * 100 }];
  for (const key of addons) {
    const one = estimate({ service: booking.service, values, addons: [key], frequency })!;
    lines.push({ description: t.booking.addons[key] ?? key, quantity: 1, unitCents: one.addonsMur * 100 });
  }
  if (price.discountMur) {
    lines.push({ description: `${t.booking.frequency[booking.frequency]}: discount`, quantity: 1, unitCents: -price.discountMur * 100 });
  }
  return lines;
}

/** The booking's live invoice, or a new draft for it. */
export async function draftForBooking(bookingId: number) {
  const db = await getDb();
  const [existing] = await db
    .select({ id: schema.invoices.id })
    .from(schema.invoices)
    .where(and(eq(schema.invoices.bookingId, bookingId), ne(schema.invoices.status, "void")));
  if (existing) return existing.id;

  const [row] = await db
    .select({ booking: schema.bookings, customer: schema.customers })
    .from(schema.bookings)
    .innerJoin(schema.customers, eq(schema.bookings.customerId, schema.customers.id))
    .where(eq(schema.bookings.id, bookingId));
  if (!row) return null;
  const { booking, customer } = row;
  const lines = bookingLines(booking, customer.lang);
  const { vatRateBp } = invoiceSettings();

  return db.transaction(async (tx) => {
    const [invoice] = await tx
      .insert(schema.invoices)
      .values({
        token: newToken(),
        customerId: customer.id,
        bookingId: booking.id,
        billName: customer.name,
        billEmail: customer.email,
        billAddress: [booking.address, getTown(booking.town)?.name ?? booking.town].join(", "),
        lang: customer.lang,
        vatRateBp,
        ...totals(lines, vatRateBp),
      })
      .returning({ id: schema.invoices.id });
    await tx.insert(schema.invoiceLines).values(lines.map((l, i) => ({ ...l, invoiceId: invoice.id, position: i })));
    return invoice.id;
  });
}

/** A blank draft for a customer, for work that wasn't booked online (offices, extras). */
export async function blankDraft(customerId: number) {
  const db = await getDb();
  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, customerId));
  if (!customer) return null;
  const [invoice] = await db
    .insert(schema.invoices)
    .values({
      token: newToken(),
      customerId,
      billName: customer.name,
      billEmail: customer.email,
      billAddress: [customer.address, customer.town && (getTown(customer.town)?.name ?? customer.town)].filter(Boolean).join(", ") || null,
      lang: customer.lang,
      vatRateBp: invoiceSettings().vatRateBp,
    })
    .returning({ id: schema.invoices.id });
  return invoice.id;
}

// --- Issuing ----------------------------------------------------------------

/** Gives a draft the next number for this year and locks it. Returns the number. */
export async function issue(invoiceId: number) {
  const db = await getDb();
  const today = mauritiusDate();
  const year = Number(today.slice(0, 4));
  const number = await db.transaction(async (tx) => {
    const [invoice] = await tx.select().from(schema.invoices).where(eq(schema.invoices.id, invoiceId)).for("update");
    if (!invoice || invoice.status !== "draft") return null;
    const lines = await tx.select().from(schema.invoiceLines).where(eq(schema.invoiceLines.invoiceId, invoiceId));
    if (!lines.length) return null;

    // Row lock on the year's counter: two people issuing at once get consecutive numbers.
    const [counter] = await tx
      .insert(schema.invoiceCounters)
      .values({ year, last: 1 })
      .onConflictDoUpdate({ target: schema.invoiceCounters.year, set: { last: sql`${schema.invoiceCounters.last} + 1` } })
      .returning({ last: schema.invoiceCounters.last });
    const number = `INV-${year}-${String(counter.last).padStart(4, "0")}`;
    await tx
      .update(schema.invoices)
      .set({
        number,
        status: "issued",
        issueDate: today,
        dueDate: invoice.dueDate ?? addDays(today, invoiceSettings().dueDays),
        ...totals(lines, invoice.vatRateBp),
      })
      .where(eq(schema.invoices.id, invoiceId));
    return number;
  });
  if (number) await creditOnlinePayments(invoiceId);
  return number;
}

// --- Payments -------------------------------------------------------------

/** Copies the booking's successful online payments (e.g. the deposit) onto its issued invoice, once each. */
export async function creditOnlinePayments(invoiceId: number) {
  const db = await getDb();
  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, invoiceId));
  if (!invoice?.bookingId || invoice.status !== "issued") return;
  const online = await db
    .select()
    .from(schema.payments)
    .leftJoin(schema.invoicePayments, eq(schema.invoicePayments.paymentId, schema.payments.id))
    .where(and(eq(schema.payments.bookingId, invoice.bookingId), eq(schema.payments.status, "succeeded"), isNull(schema.invoicePayments.id)));
  for (const { payments: p } of online) {
    await db
      .insert(schema.invoicePayments)
      .values({
        invoiceId,
        amountCents: p.amountMur * 100,
        method: "card_online",
        receivedOn: mauritiusDate(),
        reference: p.providerRef ?? `Online payment ${p.id}`,
        paymentId: p.id,
      })
      .onConflictDoNothing();
  }
  await syncBooking(invoiceId);
}

/** After a successful online payment: credit it if the booking already has an issued invoice. */
export async function creditBookingInvoice(bookingId: number) {
  const db = await getDb();
  const [invoice] = await db
    .select({ id: schema.invoices.id })
    .from(schema.invoices)
    .where(and(eq(schema.invoices.bookingId, bookingId), eq(schema.invoices.status, "issued")));
  if (invoice) await creditOnlinePayments(invoice.id);
}

/** Keeps the booking's payment badge in line with its invoice. */
export async function syncBooking(invoiceId: number) {
  const db = await getDb();
  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, invoiceId));
  if (!invoice?.bookingId || invoice.status !== "issued") return;
  const paid = await db.select().from(schema.invoicePayments).where(eq(schema.invoicePayments.invoiceId, invoiceId));
  const { paidCents, balanceCents } = summarise(invoice, paid);
  const status = balanceCents <= 0 ? "paid" : paidCents > 0 ? "deposit_paid" : "unpaid";
  await db
    .update(schema.bookings)
    .set({ paymentStatus: status })
    .where(and(eq(schema.bookings.id, invoice.bookingId), ne(schema.bookings.paymentStatus, "refunded")));
}

/** Everything needed to show one invoice. */
export async function loadInvoice(where: { id: number } | { token: string }) {
  const db = await getDb();
  const [invoice] = await db
    .select()
    .from(schema.invoices)
    .where("id" in where ? eq(schema.invoices.id, where.id) : eq(schema.invoices.token, where.token));
  if (!invoice) return null;
  const [lines, paid] = await Promise.all([
    db.select().from(schema.invoiceLines).where(eq(schema.invoiceLines.invoiceId, invoice.id)).orderBy(asc(schema.invoiceLines.position)),
    db.select().from(schema.invoicePayments).where(eq(schema.invoicePayments.invoiceId, invoice.id)).orderBy(asc(schema.invoicePayments.receivedOn)),
  ]);
  return { invoice, lines, paid, ...summarise(invoice, paid) };
}
