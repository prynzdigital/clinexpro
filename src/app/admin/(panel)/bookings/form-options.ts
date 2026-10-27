import "server-only";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { SERVICES } from "@/content/services";
import { TOWNS } from "@/content/towns";

/** Dropdown choices for the admin booking form. */
export async function bookingFormOptions() {
  const db = await getDb();
  const customers = await db
    .select({ id: schema.customers.id, name: schema.customers.name, phone: schema.customers.phone })
    .from(schema.customers)
    .orderBy(asc(schema.customers.name));
  return {
    customers: customers.map((c) => ({ value: String(c.id), label: `${c.name} · ${c.phone}` })),
    services: SERVICES.map((s) => ({ value: s.slug, label: s.name.en })),
    towns: [...TOWNS].sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({ value: t.slug, label: t.name })),
    frequencies: [...schema.frequency.enumValues],
    statuses: [...schema.bookingStatus.enumValues],
    paymentStatuses: [...schema.paymentStatus.enumValues],
  };
}
