import "server-only";
import { count, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

/** Why a customer can't be deleted, or null if they can. */
export async function customerDeleteBlocker(id: number) {
  const db = await getDb();
  const [[bookings], [invoices]] = await Promise.all([
    db.select({ n: count() }).from(schema.bookings).where(eq(schema.bookings.customerId, id)),
    db.select({ n: count() }).from(schema.invoices).where(eq(schema.invoices.customerId, id)),
  ]);
  if (bookings.n) return `They have ${bookings.n} booking${bookings.n === 1 ? "" : "s"} on record; their history is kept for the accounts.`;
  if (invoices.n) return "They have invoices on record; their history is kept for the accounts.";
  return null;
}

/** Customer ids that have bookings or invoices (so can't be deleted). */
export async function customersWithHistory() {
  const db = await getDb();
  const rows = await db.execute<{ id: number }>(sql`
    select customer_id as id from ${schema.bookings}
    union
    select customer_id as id from ${schema.invoices}
  `);
  return new Set(rows.rows.map((r) => r.id));
}
