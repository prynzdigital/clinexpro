import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import en from "@/dictionaries/en";
import { BookingBadge, PageHeader, PaymentBadge, label, mur, shortDate } from "../../ui";
import { updateBooking } from "../../actions";

export const metadata = { title: "Booking" };

export default async function BookingDetail({ params }: PageProps<"/admin/bookings/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = await getDb();
  const [row] = await db
    .select({ booking: schema.bookings, customer: schema.customers })
    .from(schema.bookings)
    .innerJoin(schema.customers, eq(schema.bookings.customerId, schema.customers.id))
    .where(eq(schema.bookings.id, id))
    .limit(1);
  if (!row) notFound();
  const { booking, customer } = row;
  const { addons = [], ...counts } = booking.details as Record<string, number> & { addons?: string[] };
  const whatsapp = `https://wa.me/${customer.phone.replace(/\D/g, "")}`;

  return (
    <>
      <Link href="/admin/bookings" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Bookings</Link>
      <PageHeader title={`Booking ${booking.ref}`} subtitle={`Created ${shortDate(booking.createdAt)}`}>
        <div className="flex gap-2">
          <BookingBadge status={booking.status} />
          <PaymentBadge status={booking.paymentStatus} />
        </div>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card divide-y divide-line">
          <Item label="Service" value={`${getService(booking.service)?.name.en} · ${label(booking.frequency)}`} />
          <Item label="When" value={`${shortDate(booking.date)} at ${booking.timeSlot}`} />
          <Item label="Address" value={`${booking.address}, ${getTown(booking.town)?.name ?? booking.town}`} />
          <Item
            label="Details"
            value={Object.entries(counts).map(([k, v]) => `${en.booking.fields[k] ?? k}: ${v}`).join(" · ")}
          />
          <Item label="Extras" value={addons.length ? addons.map((a) => en.booking.addons[a] ?? a).join(", ") : "None"} />
          <Item label="Notes" value={booking.notes ?? "—"} />
          <Item label="Estimate" value={`${mur(booking.estimateMur)} (deposit ${mur(booking.depositMur)})`} />
        </section>

        <div className="space-y-6">
          <section className="card space-y-1 p-5">
            <h2 className="mb-2 font-semibold">Customer</h2>
            <Link href={`/admin/customers/${customer.id}`} className="font-medium text-brand-strong hover:underline">{customer.name}</Link>
            <p className="text-sm"><a href={`tel:${customer.phone}`} className="hover:underline">{customer.phone}</a></p>
            <p className="text-sm"><a href={`mailto:${customer.email}`} className="hover:underline">{customer.email}</a></p>
            <a href={whatsapp} target="_blank" rel="noopener" className="btn-secondary mt-3 min-h-10 w-full text-sm">Message on WhatsApp</a>
          </section>

          <form action={updateBooking} className="card space-y-4 p-5">
            <h2 className="font-semibold">Update</h2>
            <input type="hidden" name="id" value={booking.id} />
            <label className="block">
              <span className="label">Job status</span>
              <select name="status" defaultValue={booking.status} className="field">
                {schema.bookingStatus.enumValues.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Payment</span>
              <select name="paymentStatus" defaultValue={booking.paymentStatus} className="field">
                {schema.paymentStatus.enumValues.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </label>
            <button type="submit" className="btn-primary w-full">Save</button>
          </form>
        </div>
      </div>
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 p-4 sm:grid-cols-[140px_1fr]">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="whitespace-pre-line">{value}</dd>
    </div>
  );
}
