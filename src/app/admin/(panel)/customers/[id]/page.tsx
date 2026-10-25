import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import { BookingBadge, Empty, PageHeader, PaymentBadge, mur, shortDate } from "../../ui";
import { updateCustomerNotes } from "../../actions";

export const metadata = { title: "Customer" };

export default async function CustomerDetail({ params }: PageProps<"/admin/customers/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = await getDb();
  const [customer] = await db.select().from(schema.customers).where(eq(schema.customers.id, id)).limit(1);
  if (!customer) notFound();
  const history = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.customerId, id))
    .orderBy(desc(schema.bookings.date));
  const lifetime = history.filter((h) => h.status !== "cancelled").reduce((s, h) => s + h.estimateMur, 0);

  return (
    <>
      <Link href="/admin/customers" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Customers</Link>
      <PageHeader title={customer.name} subtitle={`Customer since ${shortDate(customer.createdAt)} · ${customer.lang.toUpperCase()}`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <section className="card space-y-1 p-5 text-sm">
            <p><a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a></p>
            <p><a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a></p>
            {customer.address && <p className="text-ink-soft">{customer.address}{customer.town ? `, ${getTown(customer.town)?.name ?? customer.town}` : ""}</p>}
            <p className="pt-3 text-base"><span className="font-bold">{mur(lifetime)}</span> <span className="text-ink-soft">booked across {history.length} jobs</span></p>
          </section>
          <form action={updateCustomerNotes} className="card space-y-3 p-5">
            <input type="hidden" name="id" value={customer.id} />
            <label className="block">
              <span className="label">Notes (preferences, access, pets…)</span>
              <textarea name="notes" defaultValue={customer.notes ?? ""} rows={5} className="field" />
            </label>
            <button type="submit" className="btn-primary min-h-10 text-sm">Save notes</button>
          </form>
        </div>
        <section>
          <h2 className="mb-3 font-semibold">Booking history</h2>
          {history.length === 0 ? (
            <Empty>No bookings.</Empty>
          ) : (
            <ul className="card divide-y divide-line">
              {history.map((h) => (
                <li key={h.id}>
                  <Link href={`/admin/bookings/${h.id}`} className="flex flex-wrap items-center gap-3 p-4 hover:bg-surface-alt">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{getService(h.service)?.name.en}</p>
                      <p className="text-sm text-ink-soft">{shortDate(h.date)} · {h.timeSlot} · {mur(h.estimateMur)}</p>
                    </div>
                    <BookingBadge status={h.status} />
                    <PaymentBadge status={h.paymentStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
