import Link from "next/link";
import { and, asc, count, desc, eq, gte, lt, lte, ne, sum } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import { BookingBadge, Empty, LeadBadge, PageHeader, mur, shortDate } from "./ui";

export const metadata = { title: "Overview" };

export default async function Overview() {
  const session = await requireAdmin();
  const db = await getDb();
  const { bookings: b, customers: c, leads: l } = schema;

  const today = mauritiusDate();
  const weekEnd = mauritiusDate(7);
  const [year, monthNo] = today.split("-").map(Number);
  const monthStart = `${today.slice(0, 7)}-01`;
  const nextMonthStart =
    monthNo === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNo + 1).padStart(2, "0")}-01`;
  const active = ne(b.status, "cancelled");

  const [[pending], [week], [month], [newLeads], upcoming, recentLeads] = await Promise.all([
    db.select({ n: count() }).from(b).where(eq(b.status, "pending")),
    db.select({ n: count() }).from(b).where(and(active, gte(b.date, today), lte(b.date, weekEnd))),
    db.select({ total: sum(b.estimateMur), n: count() }).from(b).where(and(active, gte(b.date, monthStart), lt(b.date, nextMonthStart))),
    db.select({ n: count() }).from(l).where(eq(l.status, "new")),
    db
      .select({ booking: b, customer: c.name })
      .from(b)
      .innerJoin(c, eq(b.customerId, c.id))
      .where(and(active, gte(b.date, today)))
      .orderBy(asc(b.date), asc(b.timeSlot))
      .limit(8),
    db.select().from(l).orderBy(desc(l.createdAt)).limit(5),
  ]);

  const kpis = [
    { label: "Awaiting confirmation", value: String(pending.n), href: "/admin/bookings?status=pending" },
    { label: "Jobs in the next 7 days", value: String(week.n), href: "/admin/bookings" },
    { label: "Booked this month", value: mur(Number(month.total ?? 0)), note: `${month.n} jobs` },
    { label: "New business leads", value: String(newLeads.n), href: "/admin/leads" },
  ];

  return (
    <>
      <PageHeader title={`Good day, ${session.name.split(" ")[0]}`} subtitle={shortDate(today)} />
      <div className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => {
          const body = (
            <>
              <p className="text-sm text-ink-soft">{k.label}</p>
              <p className="mt-1 text-2xl font-bold">{k.value}</p>
              {k.note && <p className="text-xs text-ink-soft">{k.note}</p>}
            </>
          );
          return k.href ? (
            <Link key={k.label} href={k.href} className="card p-4 hover:border-brand">{body}</Link>
          ) : (
            <div key={k.label} className="card p-4">{body}</div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="mb-3 font-semibold">Upcoming jobs</h2>
          {upcoming.length === 0 ? (
            <Empty>No upcoming jobs yet.</Empty>
          ) : (
            <ul className="card divide-y divide-line">
              {upcoming.map(({ booking, customer }) => (
                <li key={booking.id}>
                  <Link href={`/admin/bookings/${booking.id}`} className="flex items-center gap-4 p-4 hover:bg-surface-alt">
                    <div className="w-20 shrink-0 text-sm">
                      <p className="font-semibold">{shortDate(booking.date)}</p>
                      <p className="text-ink-soft">{booking.timeSlot}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{customer}</p>
                      <p className="truncate text-sm text-ink-soft">
                        {getService(booking.service)?.name.en} · {getTown(booking.town)?.name}
                      </p>
                    </div>
                    <BookingBadge status={booking.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-semibold">Latest business leads</h2>
          {recentLeads.length === 0 ? (
            <Empty>No enquiries yet.</Empty>
          ) : (
            <ul className="card divide-y divide-line">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{lead.company}</p>
                    <p className="truncate text-sm text-ink-soft">{lead.contactName} · {lead.phone}</p>
                  </div>
                  <LeadBadge status={lead.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
