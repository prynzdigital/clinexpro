import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import { BookingBadge, Empty, PageHeader, PaymentBadge, label, mur, shortDate } from "../ui";

export const metadata = { title: "Bookings" };

const FILTERS = ["all", ...schema.bookingStatus.enumValues] as const;

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = FILTERS.find((f) => f === status) ?? "all";
  const db = await getDb();
  const { bookings: b, customers: c } = schema;

  const rows = await db
    .select({ booking: b, customer: c.name, phone: c.phone })
    .from(b)
    .innerJoin(c, eq(b.customerId, c.id))
    .where(filter === "all" ? undefined : eq(b.status, filter))
    .orderBy(desc(b.date))
    .limit(200);

  return (
    <>
      <PageHeader title="Bookings" subtitle="Newest dates first" />
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/bookings" : `/admin/bookings?status=${f}`}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === f ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-ink"}`}
          >
            {label(f)}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <Empty>No bookings here yet.</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="p-3 font-medium">Ref</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Service</th>
                <th className="p-3 text-right font-medium">Estimate</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ booking, customer, phone }) => (
                <tr key={booking.id} className="hover:bg-surface-alt">
                  <td className="p-3 font-mono text-xs">
                    <Link href={`/admin/bookings/${booking.id}`} className="font-semibold text-brand-strong hover:underline">{booking.ref}</Link>
                  </td>
                  <td className="p-3 whitespace-nowrap">{shortDate(booking.date)} · {booking.timeSlot}</td>
                  <td className="p-3">
                    <p className="font-medium">{customer}</p>
                    <p className="text-xs text-ink-soft">{phone}</p>
                  </td>
                  <td className="p-3">
                    <p>{getService(booking.service)?.name.en}</p>
                    <p className="text-xs text-ink-soft">{getTown(booking.town)?.name} · {label(booking.frequency)}</p>
                  </td>
                  <td className="p-3 text-right tabular-nums">{mur(booking.estimateMur)}</td>
                  <td className="p-3"><BookingBadge status={booking.status} /></td>
                  <td className="p-3"><PaymentBadge status={booking.paymentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
