import "server-only";
import { and, eq } from "drizzle-orm";
import { after } from "next/server";
import { getDb, schema } from "@/db";
import type { Locale } from "@/lib/i18n";
import { alertPayment } from "@/lib/notify";
import { getProvider } from "./providers";

export { getProvider } from "./providers";

/**
 * Opens a deposit payment for a booking and returns the gateway URL, or null
 * when online payment is off or the booking no longer owes a deposit.
 */
export async function startDepositCheckout(ref: string, lang: Locale, origin: string) {
  const provider = getProvider();
  if (!provider) return null;

  const db = await getDb();
  const [row] = await db
    .select({ booking: schema.bookings, customer: schema.customers })
    .from(schema.bookings)
    .innerJoin(schema.customers, eq(schema.bookings.customerId, schema.customers.id))
    .where(eq(schema.bookings.ref, ref))
    .limit(1);
  if (!row || row.booking.paymentStatus !== "unpaid" || row.booking.status === "cancelled") return null;

  // The amount always comes from the stored booking, never from the browser.
  const [payment] = await db
    .insert(schema.payments)
    .values({ bookingId: row.booking.id, provider: provider.id, amountMur: row.booking.depositMur })
    .returning({ id: schema.payments.id });

  const checkout = await provider.createCheckout({
    paymentId: payment.id,
    bookingRef: ref,
    amountMur: row.booking.depositMur,
    lang,
    customer: { name: row.customer.name, email: row.customer.email, phone: row.customer.phone },
    origin,
  });
  if (checkout.providerRef) {
    await db.update(schema.payments).set({ providerRef: checkout.providerRef }).where(eq(schema.payments.id, payment.id));
  }
  return checkout.redirectUrl;
}

type Outcome = { providerRef?: string; raw?: Record<string, unknown> };

/**
 * Records a successful payment and marks the booking's deposit paid. Safe to
 * call twice (the gateway's redirect and its webhook can both arrive): only
 * the first call changes anything or sends the alert.
 */
export async function markPaymentSucceeded(paymentId: number, outcome: Outcome = {}) {
  const db = await getDb();
  const result = await db.transaction(async (tx) => {
    const [payment] = await tx
      .update(schema.payments)
      .set({ status: "succeeded", updatedAt: new Date(), ...outcome })
      .where(and(eq(schema.payments.id, paymentId), eq(schema.payments.status, "pending")))
      .returning();
    if (!payment) return null;
    await tx
      .update(schema.bookings)
      .set({ paymentStatus: "deposit_paid" })
      .where(and(eq(schema.bookings.id, payment.bookingId), eq(schema.bookings.paymentStatus, "unpaid")));
    const [row] = await tx
      .select({ ref: schema.bookings.ref, name: schema.customers.name })
      .from(schema.bookings)
      .innerJoin(schema.customers, eq(schema.bookings.customerId, schema.customers.id))
      .where(eq(schema.bookings.id, payment.bookingId));
    return { payment, ...row };
  });
  if (!result) return false;

  const { payment, ref, name } = result;
  after(() =>
    alertPayment({
      bookingId: payment.bookingId,
      ref,
      name,
      amountMur: payment.amountMur,
      provider: payment.provider,
      providerRef: payment.providerRef ?? String(payment.id),
    }),
  );
  return true;
}

export async function markPaymentFailed(paymentId: number, status: "failed" | "cancelled", outcome: Outcome = {}) {
  const db = await getDb();
  await db
    .update(schema.payments)
    .set({ status, updatedAt: new Date(), ...outcome })
    .where(and(eq(schema.payments.id, paymentId), eq(schema.payments.status, "pending")));
}

/** Booking ref and language for a payment, to send the customer back to their confirmation page. */
export async function paymentBooking(paymentId: number) {
  const db = await getDb();
  const [row] = await db
    .select({ payment: schema.payments, ref: schema.bookings.ref, lang: schema.customers.lang })
    .from(schema.payments)
    .innerJoin(schema.bookings, eq(schema.payments.bookingId, schema.bookings.id))
    .innerJoin(schema.customers, eq(schema.bookings.customerId, schema.customers.id))
    .where(eq(schema.payments.id, paymentId))
    .limit(1);
  return row ?? null;
}
