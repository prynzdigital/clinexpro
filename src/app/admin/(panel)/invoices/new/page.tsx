import Link from "next/link";
import { and, asc, desc, eq, ne, notExists } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getService } from "@/content/services";
import { PageHeader, label, mur, shortDate } from "../../ui";
import { NewInvoiceForm } from "./new-invoice-form";

export const metadata = { title: "New invoice" };

export default async function NewInvoicePage({ searchParams }: PageProps<"/admin/invoices/new">) {
  await requireAdmin();
  const { customer } = await searchParams;
  const db = await getDb();
  const { customers: c, bookings: b, invoices: i } = schema;

  const [customers, jobs] = await Promise.all([
    db.select({ id: c.id, name: c.name, phone: c.phone }).from(c).orderBy(asc(c.name)),
    // Jobs not yet on a live invoice (cancelled ones can't be billed).
    db
      .select({ id: b.id, customerId: b.customerId, ref: b.ref, service: b.service, date: b.date, status: b.status, price: b.estimateMur })
      .from(b)
      .where(and(ne(b.status, "cancelled"), notExists(db.select().from(i).where(and(eq(i.bookingId, b.id), ne(i.status, "void"))))))
      .orderBy(desc(b.date)),
  ]);

  return (
    <>
      <Link href="/admin/invoices" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Invoices</Link>
      <PageHeader title="New invoice" subtitle="It starts as a draft you can edit; it gets its number when you issue it" />
      <NewInvoiceForm
        initialCustomer={typeof customer === "string" ? Number(customer) || undefined : undefined}
        customers={customers.map((x) => ({ id: x.id, label: `${x.name} · ${x.phone}` }))}
        jobs={jobs.map((j) => ({
          id: j.id,
          customerId: j.customerId,
          label: `${getService(j.service)?.name.en ?? j.service} · ${shortDate(j.date)} · ${j.ref} · ${mur(j.price)} (${label(j.status)})`,
        }))}
      />
    </>
  );
}
