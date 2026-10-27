import "server-only";
import { count, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

// Read-only helpers for the booking pages (kept out of actions.ts, where every
// export would become a callable server action).

/** Why a booking can't be deleted, or null if it can. */
export async function bookingDeleteBlocker(id: number) {
  const db = await getDb();
  const [[inv], [pay]] = await Promise.all([
    db.select({ n: count() }).from(schema.invoices).where(eq(schema.invoices.bookingId, id)),
    db.select({ n: count() }).from(schema.payments).where(eq(schema.payments.bookingId, id)),
  ]);
  if (inv.n) return "It has an invoice. Cancel the booking instead (or void the invoice first).";
  if (pay.n) return "It has an online payment on record. Cancel the booking instead.";
  return null;
}

/** For list pages: which of these bookings can't be deleted, and why. */
export async function bookingBlockers() {
  const db = await getDb();
  const rows = await db.execute<{ id: number; invoices: number; payments: number }>(sql`
    select b.id,
      (select count(*) from ${schema.invoices} i where i.booking_id = b.id)::int as invoices,
      (select count(*) from ${schema.payments} p where p.booking_id = b.id)::int as payments
    from ${schema.bookings} b
  `);
  const map = new Map<number, string>();
  for (const r of rows.rows) {
    if (r.invoices) map.set(r.id, "It has an invoice. Cancel the booking instead.");
    else if (r.payments) map.set(r.id, "It has an online payment on record. Cancel the booking instead.");
  }
  return map;
}
