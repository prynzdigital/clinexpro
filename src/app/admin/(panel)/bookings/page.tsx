import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import { BOOKING_TONE_NAME, NewButton, PAYMENT_TONE_NAME, PageHeader, StatCard, label, mur, shortDate } from "../ui";
import { DataTable, type Row } from "../data-table";
import { deleteBooking } from "./actions";
import { bookingBlockers } from "./queries";

export const metadata = { title: "Bookings" };

export default async function BookingsPage({ searchParams }: PageProps<"/admin/bookings">) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const db = await getDb();
  const { bookings: b, customers: c } = schema;

  const [list, blockers] = await Promise.all([
    db
      .select({ booking: b, customer: c.name, phone: c.phone })
      .from(b)
      .innerJoin(c, eq(b.customerId, c.id))
      .orderBy(desc(b.date))
      .limit(1000),
    bookingBlockers(),
  ]);

  const today = mauritiusDate();
  const live = list.filter((r) => r.booking.status !== "cancelled");
  const upcoming = live.filter((r) => r.booking.date >= today);
  const pending = live.filter((r) => r.booking.status === "pending").length;
  const unpaidDone = live.filter((r) => r.booking.status === "completed" && r.booking.paymentStatus === "unpaid").length;

  const rows: Row[] = list.map(({ booking: bk, customer, phone }) => ({
    id: bk.id,
    href: `/admin/bookings/${bk.id}`,
    editHref: `/admin/bookings/${bk.id}/edit`,
    canDelete: true,
    deleteBlockedReason: blockers.get(bk.id) ?? null,
    filter: bk.status,
    cells: {
      ref: { text: bk.ref, mono: true },
      date: { text: shortDate(bk.date), sub: bk.timeSlot, sort: `${bk.date} ${bk.timeSlot}` },
      customer: { text: customer, sub: phone },
      service: { text: getService(bk.service)?.name.en ?? bk.service, sub: `${getTown(bk.town)?.name ?? bk.town} · ${label(bk.frequency)}` },
      price: { text: mur(bk.estimateMur), sort: bk.estimateMur },
      status: { text: label(bk.status), badge: BOOKING_TONE_NAME[bk.status] },
      payment: { text: label(bk.paymentStatus), badge: PAYMENT_TONE_NAME[bk.paymentStatus] },
    },
  }));

  return (
    <>
      <PageHeader title="Bookings" subtitle="Every job, from the website and from the office">
        <NewButton href="/admin/bookings/new" label="New booking" />
      </PageHeader>

      {deleted && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">Booking deleted.</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming jobs" value={String(upcoming.length)} note={`worth ${mur(upcoming.reduce((s, r) => s + r.booking.estimateMur, 0))}`} icon="calendar" color="navy" />
        <StatCard label="Awaiting confirmation" value={String(pending)} note="pending bookings" icon="clock" color="amber" />
        <StatCard label="Finished, not paid" value={String(unpaidDone)} note="completed jobs still unpaid" icon="wallet" color="rose" href="/admin/invoices" />
        <StatCard label="All bookings" value={String(list.length)} note={`${list.length - live.length} cancelled`} icon="board" color="sky" />
      </div>

      <DataTable
        columns={[
          { key: "ref", label: "Ref" },
          { key: "date", label: "Date" },
          { key: "customer", label: "Customer" },
          { key: "service", label: "Service", hideOnMobile: true },
          { key: "price", label: "Price", align: "right" },
          { key: "status", label: "Status" },
          { key: "payment", label: "Payment", hideOnMobile: true },
        ]}
        rows={rows}
        filters={schema.bookingStatus.enumValues.map((s) => ({ value: s, label: label(s) }))}
        defaultSort={{ key: "date", dir: "desc" }}
        searchPlaceholder="Search ref, customer, phone, service, town"
        empty="No bookings yet. Website bookings appear here, or add one with New booking."
        deleteAction={deleteBooking}
        deleteNoun="booking"
      />
    </>
  );
}
