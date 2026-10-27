"use server";

import { z } from "zod";
import { and, eq, isNull, ne, notExists } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { isIsoDate } from "@/lib/schedule";
import { blankDraft, draftForBooking, issue, loadInvoice, summarise, syncBooking, totals } from "@/lib/invoices";
import { sendInvoiceEmail } from "@/lib/notify";
import { emailEnabled } from "@/lib/notify/channels";

const id = z.coerce.number().int().positive();
const done = () => revalidatePath("/admin", "layout");

export async function createForBooking(formData: FormData) {
  await requireAdmin();
  const invoiceId = await draftForBooking(id.parse(formData.get("bookingId")));
  if (!invoiceId) return;
  done();
  redirect(`/admin/invoices/${invoiceId}`);
}

export async function createForCustomer(formData: FormData) {
  await requireAdmin();
  const invoiceId = await blankDraft(id.parse(formData.get("customerId")));
  if (!invoiceId) return;
  done();
  redirect(`/admin/invoices/${invoiceId}`);
}

/** Drafts for every completed job that has no invoice yet. */
export async function draftAllCompleted() {
  await requireAdmin();
  const db = await getDb();
  const { bookings: b, invoices: i } = schema;
  const ready = await db
    .select({ id: b.id })
    .from(b)
    .where(and(eq(b.status, "completed"), notExists(db.select().from(i).where(and(eq(i.bookingId, b.id), ne(i.status, "void"))))));
  for (const r of ready) await draftForBooking(r.id);
  done();
  redirect(`/admin/invoices?status=draft&created=${ready.length}`);
}

export type FormState = { status: "idle" | "saved" | "error"; message?: string };

const rupees = z
  .string()
  .trim()
  .regex(/^-?\d+(\.\d{1,2})?$/, "Use numbers like 1500 or 1500.50")
  .transform((v) => Math.round(Number(v) * 100));

const Draft = z.object({
  id,
  billName: z.string().trim().min(2).max(160),
  billEmail: z.union([z.email().max(200), z.literal("")]),
  billAddress: z.string().trim().max(300),
  dueDate: z.union([z.string().refine(isIsoDate), z.literal("")]),
  notes: z.string().trim().max(2000),
  lines: z
    .array(z.object({ description: z.string().trim().min(1).max(300), quantity: z.coerce.number().int().min(1).max(999), unit: rupees }))
    .min(1, "Add at least one line")
    .max(50),
});

export async function saveDraft(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const descriptions = formData.getAll("description").map(String);
  const quantities = formData.getAll("quantity").map(String);
  const units = formData.getAll("unit").map(String);
  const parsed = Draft.safeParse({
    ...Object.fromEntries(formData),
    lines: descriptions
      .map((description, i) => ({ description, quantity: quantities[i], unit: units[i] }))
      .filter((l) => l.description.trim() || l.unit.trim()),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue.path[0] === "lines" && typeof issue.path[1] === "number" ? `Line ${issue.path[1] + 1}: ` : "";
    return { status: "error", message: `${where}${issue.message}` };
  }
  const d = parsed.data;
  const db = await getDb();
  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, d.id));
  if (invoice?.status !== "draft") return { status: "error", message: "Only drafts can be edited." };
  const lines = d.lines.map((l) => ({ description: l.description, quantity: l.quantity, unitCents: l.unit }));
  if (totals(lines, invoice.vatRateBp).totalCents < 0) return { status: "error", message: "The total can't be below zero." };

  await db.transaction(async (tx) => {
    await tx
      .update(schema.invoices)
      .set({
        billName: d.billName,
        billEmail: d.billEmail || null,
        billAddress: d.billAddress || null,
        dueDate: d.dueDate || null,
        notes: d.notes || null,
        ...totals(lines, invoice.vatRateBp),
      })
      .where(eq(schema.invoices.id, d.id));
    await tx.delete(schema.invoiceLines).where(eq(schema.invoiceLines.invoiceId, d.id));
    await tx.insert(schema.invoiceLines).values(lines.map((l, i) => ({ ...l, invoiceId: d.id, position: i })));
  });
  done();
  return { status: "saved", message: "Draft saved." };
}

export async function deleteDraft(formData: FormData) {
  await requireAdmin();
  const invoiceId = id.parse(formData.get("id"));
  const db = await getDb();
  await db.delete(schema.invoices).where(and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.status, "draft")));
  done();
  redirect("/admin/invoices");
}

export async function issueInvoice(formData: FormData) {
  await requireAdmin();
  await issue(id.parse(formData.get("id")));
  done();
}

const Payment = z.object({
  id,
  amount: rupees.refine((c) => c > 0, "Enter the amount received"),
  method: z.enum(schema.paymentMethod.enumValues),
  receivedOn: z.string().refine(isIsoDate, "Pick the date"),
  reference: z.string().trim().max(120),
});

export async function recordPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const parsed = Payment.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const p = parsed.data;
  if (p.receivedOn > mauritiusDate()) return { status: "error", message: "The date can't be in the future." };

  const loaded = await loadInvoice({ id: p.id });
  if (loaded?.invoice.status !== "issued") return { status: "error", message: "Payments can only be added to issued invoices." };
  if (p.amount > loaded.balanceCents) return { status: "error", message: "That's more than the balance due." };

  const db = await getDb();
  await db.insert(schema.invoicePayments).values({
    invoiceId: p.id,
    amountCents: p.amount,
    method: p.method,
    receivedOn: p.receivedOn,
    reference: p.reference || null,
    recordedBy: session.uid,
  });
  await syncBooking(p.id);
  done();
  return { status: "saved", message: "Payment recorded." };
}

/** Undo a payment typed in by mistake. Online payments can't be removed here. */
export async function removePayment(formData: FormData) {
  await requireAdmin();
  const paymentId = id.parse(formData.get("paymentId"));
  const db = await getDb();
  const [row] = await db
    .delete(schema.invoicePayments)
    .where(and(eq(schema.invoicePayments.id, paymentId), isNull(schema.invoicePayments.paymentId)))
    .returning({ invoiceId: schema.invoicePayments.invoiceId });
  if (row) await syncBooking(row.invoiceId);
  done();
}

export async function voidInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = z.object({ id, reason: z.string().trim().min(3, "Say why it's being voided").max(300) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const loaded = await loadInvoice({ id: parsed.data.id });
  if (loaded?.invoice.status !== "issued") return { status: "error", message: "Only issued invoices can be voided." };
  if (loaded.paidCents > 0) return { status: "error", message: "Remove or refund its payments first; an invoice with money on it can't be voided." };
  const db = await getDb();
  await db.update(schema.invoices).set({ status: "void", voidReason: parsed.data.reason }).where(eq(schema.invoices.id, parsed.data.id));
  done();
  return { status: "saved", message: "Invoice voided." };
}

export async function sendInvoice(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const loaded = await loadInvoice({ id: id.parse(formData.get("id")) });
  if (loaded?.invoice.status !== "issued") return { status: "error", message: "Issue the invoice before sending it." };
  if (!loaded.invoice.billEmail) return { status: "error", message: "This invoice has no email address. Copy the link and send it by WhatsApp instead." };
  if (!emailEnabled()) return { status: "error", message: "Email sending isn't set up yet (see DEPLOY.md). Copy the link or use WhatsApp for now." };

  const db = await getDb();
  await db.update(schema.invoices).set({ sentAt: new Date() }).where(eq(schema.invoices.id, loaded.invoice.id));
  after(() => sendInvoiceEmail({ ...loaded.invoice, number: loaded.invoice.number!, balanceCents: summarise(loaded.invoice, loaded.paid).balanceCents }));
  done();
  return { status: "saved", message: `Sent to ${loaded.invoice.billEmail}.` };
}
