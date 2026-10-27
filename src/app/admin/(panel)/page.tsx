import Link from "next/link";
import { and, asc, count, desc, eq, gte, inArray, lt, lte, ne, sum } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { receivables } from "@/lib/insights";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import { Icon, type IconName } from "@/components/icons";
import { BookingBadge, LeadBadge, PageHeader, StatCard, mur, shortDate } from "./ui";

export const metadata = { title: "Overview" };

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Indian/Mauritius" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

export default async function Overview() {
  const session = await requireAdmin();
  const db = await getDb();
  const { bookings: b, customers: c, leads: l, bookingAssignments: a, staff: s } = schema;

  const today = mauritiusDate();
  const weekEnd = mauritiusDate(7);
  const [year, monthNo] = today.split("-").map(Number);
  const monthStart = `${today.slice(0, 7)}-01`;
  const nextMonthStart = monthNo === 12 ? `${year + 1}-01-01` : `${year}-${String(monthNo + 1).padStart(2, "0")}-01`;
  const live = ne(b.status, "cancelled");

  const [[pending], [week], [month], [newLeads], todayJobs, upcoming, recentLeads, owed] = await Promise.all([
    db.select({ n: count() }).from(b).where(eq(b.status, "pending")),
    db.select({ n: count() }).from(b).where(and(live, gte(b.date, today), lte(b.date, weekEnd))),
    db.select({ total: sum(b.estimateMur), n: count() }).from(b).where(and(live, gte(b.date, monthStart), lt(b.date, nextMonthStart))),
    db.select({ n: count() }).from(l).where(eq(l.status, "new")),
    db
      .select({ booking: b, customer: c.name })
      .from(b)
      .innerJoin(c, eq(b.customerId, c.id))
      .where(and(live, eq(b.date, today)))
      .orderBy(asc(b.timeSlot)),
    db
      .select({ booking: b, customer: c.name })
      .from(b)
      .innerJoin(c, eq(b.customerId, c.id))
      .where(and(live, gte(b.date, mauritiusDate(1))))
      .orderBy(asc(b.date), asc(b.timeSlot))
      .limit(6),
    db.select().from(l).orderBy(desc(l.createdAt)).limit(5),
    receivables(),
  ]);

  const todayIds = todayJobs.map((j) => j.booking.id);
  const todayTeam = todayIds.length
    ? await db
        .select({ bookingId: a.bookingId, name: s.name, color: s.color, checkedInAt: a.checkedInAt, checkedOutAt: a.checkedOutAt })
        .from(a)
        .innerJoin(s, eq(a.staffId, s.id))
        .where(inArray(a.bookingId, todayIds))
    : [];

  const quick: { href: string; label: string; icon: IconName }[] = [
    { href: "/admin/bookings/new", label: "New booking", icon: "calendar" },
    { href: "/admin/customers/new", label: "New customer", icon: "users" },
    { href: "/admin/leads/new", label: "New lead", icon: "briefcase" },
    { href: "/admin/schedule", label: "Plan the week", icon: "board" },
    { href: "/admin/invoices", label: "Invoices", icon: "receipt" },
  ];

  return (
    <>
      <PageHeader title={`${greeting()}, ${session.name.split(" ")[0]}`} subtitle={new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${today}T00:00:00Z`))} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard solid label="Awaiting confirmation" value={String(pending.n)} note="pending bookings" icon="clock" color="orange" href="/admin/bookings" />
        <StatCard solid label="Jobs in the next 7 days" value={String(week.n)} note={`${todayJobs.length} today`} icon="calendar" color="navy" href="/admin/schedule" />
        <StatCard solid label="Booked this month" value={mur(Number(month.total ?? 0))} note={`${month.n} jobs`} icon="trend" color="emerald" />
        <StatCard
          solid
          label="Owed to you"
          value={mur(Math.round(owed.outstanding / 100))}
          note={owed.overdue ? `${mur(Math.round(owed.overdue / 100))} overdue` : `${newLeads.n} new leads waiting`}
          icon="wallet"
          color={owed.overdue ? "rose" : "violet"}
          href="/admin/invoices"
        />
      </div>

      <nav aria-label="Quick actions" className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {quick.map((q) => (
          <Link key={q.href} href={q.href} className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium shadow-sm hover:border-brand hover:text-brand-strong">
            <Icon name={q.icon} width={18} height={18} /> {q.label}
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-line bg-navy px-5 py-4 text-white">
              <h2 className="flex items-center gap-2 font-semibold"><Icon name="clock" width={18} height={18} /> Today</h2>
              <span className="text-sm text-white/70">{todayJobs.length} job{todayJobs.length === 1 ? "" : "s"}</span>
            </header>
            {todayJobs.length === 0 ? (
              <p className="p-6 text-sm text-ink-soft">Nothing booked for today.</p>
            ) : (
              <ul className="divide-y divide-line">
                {todayJobs.map(({ booking, customer }) => {
                  const team = todayTeam.filter((t) => t.bookingId === booking.id);
                  const state = team.length && team.every((t) => t.checkedOutAt) ? "Done" : team.some((t) => t.checkedInAt) ? "On site" : null;
                  return (
                    <li key={booking.id}>
                      <Link href={`/admin/bookings/${booking.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-brand-soft/40">
                        <span className="w-14 text-lg font-bold tabular-nums">{booking.timeSlot}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{customer}</span>
                          <span className="block truncate text-sm text-ink-soft">{getService(booking.service)?.name.en} · {getTown(booking.town)?.name}</span>
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5">
                          {team.length ? (
                            team.map((t) => <span key={t.name} className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: t.color }}>{t.name.split(" ")[0]}</span>)
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">No cleaner</span>
                          )}
                          {state && <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${state === "Done" ? "bg-emerald-100 text-emerald-800" : "bg-sky-100 text-sky-800"}`}>{state}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="font-semibold">Coming up</h2>
              <Link href="/admin/bookings" className="text-sm font-medium text-brand-strong hover:underline">All bookings →</Link>
            </header>
            {upcoming.length === 0 ? (
              <p className="p-6 text-sm text-ink-soft">No upcoming jobs yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map(({ booking, customer }) => {
                  const [, m, d] = booking.date.split("-");
                  return (
                    <li key={booking.id}>
                      <Link href={`/admin/bookings/${booking.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-brand-soft/40">
                        <span className="grid w-12 shrink-0 place-items-center rounded-xl bg-brand-soft py-1.5 text-brand-strong">
                          <span className="text-lg font-bold leading-none">{Number(d)}</span>
                          <span className="text-[10px] font-semibold uppercase">{new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(new Date(`2000-${m}-01T00:00:00Z`))}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{customer}</span>
                          <span className="block truncate text-sm text-ink-soft">{booking.timeSlot} · {getService(booking.service)?.name.en} · {getTown(booking.town)?.name}</span>
                        </span>
                        <BookingBadge status={booking.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="card self-start overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="font-semibold">Latest leads {newLeads.n > 0 && <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-white">{newLeads.n} new</span>}</h2>
            <Link href="/admin/leads" className="text-sm font-medium text-brand-strong hover:underline">All →</Link>
          </header>
          {recentLeads.length === 0 ? (
            <p className="p-6 text-sm text-ink-soft">No enquiries yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentLeads.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/admin/leads/${lead.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-brand-soft/40">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white" aria-hidden>
                      {lead.company.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{lead.company}</span>
                      <span className="block truncate text-sm text-ink-soft">{lead.contactName} · {shortDate(lead.createdAt)}</span>
                    </span>
                    <LeadBadge status={lead.status} />
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
