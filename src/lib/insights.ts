import "server-only";
import { and, count, desc, eq, gte, isNull, lt, lte, ne, sql, sum } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { mauritiusDate } from "@/lib/dates";
import { addDays, jobMinutes } from "@/lib/schedule";
import { summarise } from "@/lib/invoices";

// Figures for the owner dashboard. Money from bookings is whole rupees;
// money from invoices is cents. Everything returned here is in cents.

export const RANGES = {
  month: "This month",
  last_month: "Last month",
  quarter: "Last 3 months",
  year: "This year",
} as const;
export type Range = keyof typeof RANGES;

const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;
const addMonths = (iso: string, n: number) => {
  const d = new Date(`${monthStart(iso)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
};

/** Inclusive date range for the period, plus the same-length period just before it. */
export function period(range: Range) {
  const today = mauritiusDate();
  let from: string;
  let to = today;
  if (range === "month") from = monthStart(today);
  else if (range === "last_month") {
    from = addMonths(today, -1);
    to = addDays(monthStart(today), -1);
  } else if (range === "quarter") from = addDays(today, -89);
  else from = `${today.slice(0, 4)}-01-01`;
  const days = Math.round((Date.parse(to) - Date.parse(from)) / 864e5) + 1;
  return { from, to, prevFrom: addDays(from, -days), prevTo: addDays(from, -1), days };
}

/** Mauritius midnight, for comparing timestamps with calendar days. */
const startOf = (iso: string) => new Date(`${iso}T00:00:00+04:00`);
const endOf = (iso: string) => new Date(`${addDays(iso, 1)}T00:00:00+04:00`);

/** Headline numbers for one period. */
export async function headline(from: string, to: string) {
  const db = await getDb();
  const { bookings: b, invoices: i, invoicePayments: ip, payments: p, customers: c, leads: l } = schema;
  const inPeriod = and(gte(b.date, from), lte(b.date, to));

  const [[jobs], [cancelled], [completed], [invoiced], [paidInvoices], [paidOnlineUninvoiced], [newCustomers], [booked], leads] =
    await Promise.all([
      db.select({ n: count(), total: sum(b.estimateMur) }).from(b).where(and(inPeriod, ne(b.status, "cancelled"))),
      db.select({ n: count() }).from(b).where(and(inPeriod, eq(b.status, "cancelled"))),
      db.select({ n: count() }).from(b).where(and(inPeriod, eq(b.status, "completed"))),
      db.select({ total: sum(i.totalCents) }).from(i).where(and(eq(i.status, "issued"), gte(i.issueDate, from), lte(i.issueDate, to))),
      db.select({ total: sum(ip.amountCents) }).from(ip).where(and(gte(ip.receivedOn, from), lte(ip.receivedOn, to))),
      // Online deposits not yet on an invoice (once invoiced they're counted above).
      db
        .select({ total: sum(p.amountMur) })
        .from(p)
        .leftJoin(ip, eq(ip.paymentId, p.id))
        .where(and(eq(p.status, "succeeded"), isNull(ip.id), gte(p.updatedAt, startOf(from)), lt(p.updatedAt, endOf(to)))),
      db.select({ n: count() }).from(c).where(and(gte(c.createdAt, startOf(from)), lt(c.createdAt, endOf(to)))),
      // Online bookings made in the period (by when they were placed, not the job date).
      db.select({ n: count() }).from(b).where(and(gte(b.createdAt, startOf(from)), lt(b.createdAt, endOf(to)))),
      db
        .select({ status: l.status, n: count() })
        .from(l)
        .where(and(gte(l.createdAt, startOf(from)), lt(l.createdAt, endOf(to))))
        .groupBy(l.status),
    ]);

  const leadTotal = leads.reduce((s, r) => s + r.n, 0);
  const leadsWon = leads.find((r) => r.status === "won")?.n ?? 0;
  const bookedCents = Number(jobs.total ?? 0) * 100;
  const scheduled = jobs.n + cancelled.n;

  return {
    bookedCents,
    jobs: jobs.n,
    completed: completed.n,
    avgJobCents: jobs.n ? Math.round(bookedCents / jobs.n) : 0,
    cancelRate: scheduled ? cancelled.n / scheduled : 0,
    invoicedCents: Number(invoiced.total ?? 0),
    collectedCents: Number(paidInvoices.total ?? 0) + Number(paidOnlineUninvoiced.total ?? 0) * 100,
    newCustomers: newCustomers.n,
    onlineBookings: booked.n,
    leads: leadTotal,
    leadsWon,
    leadsOpen: leads.filter((r) => r.status !== "won" && r.status !== "lost").reduce((s, r) => s + r.n, 0),
  };
}

/** Money owed right now, whatever the period. */
export async function receivables() {
  const db = await getDb();
  const issued = await db.select().from(schema.invoices).where(eq(schema.invoices.status, "issued"));
  const paid = issued.length ? await db.select().from(schema.invoicePayments) : [];
  let outstanding = 0;
  let overdue = 0;
  let overdueCount = 0;
  for (const inv of issued) {
    const s = summarise(inv, paid.filter((p) => p.invoiceId === inv.id));
    if (s.balanceCents <= 0) continue;
    outstanding += s.balanceCents;
    if (s.state === "overdue") {
      overdue += s.balanceCents;
      overdueCount++;
    }
  }
  return { outstanding, overdue, overdueCount };
}

/** Last 12 months: work booked (by job date) and money collected (by date received). */
export async function monthly() {
  const db = await getDb();
  const { bookings: b, invoicePayments: ip, payments: p } = schema;
  const first = addMonths(mauritiusDate(), -11);
  const months = Array.from({ length: 12 }, (_, k) => addMonths(first, k).slice(0, 7));

  const [booked, received, online] = await Promise.all([
    db
      .select({ month: sql<string>`to_char(${b.date}, 'YYYY-MM')`, total: sum(b.estimateMur) })
      .from(b)
      .where(and(ne(b.status, "cancelled"), gte(b.date, first)))
      .groupBy(sql`1`),
    db
      .select({ month: sql<string>`to_char(${ip.receivedOn}, 'YYYY-MM')`, total: sum(ip.amountCents) })
      .from(ip)
      .where(gte(ip.receivedOn, first))
      .groupBy(sql`1`),
    db
      .select({ month: sql<string>`to_char(${p.updatedAt} at time zone 'Indian/Mauritius', 'YYYY-MM')`, total: sum(p.amountMur) })
      .from(p)
      .leftJoin(ip, eq(ip.paymentId, p.id))
      .where(and(eq(p.status, "succeeded"), isNull(ip.id), gte(p.updatedAt, startOf(first))))
      .groupBy(sql`1`),
  ]);

  const pick = (rows: { month: string; total: string | null }[], m: string) => Number(rows.find((r) => r.month === m)?.total ?? 0);
  return months.map((m) => ({
    month: m,
    bookedCents: pick(booked, m) * 100,
    collectedCents: pick(received, m) + pick(online, m) * 100,
  }));
}

/** Where the work comes from in the period: services and towns, by value. */
export async function breakdowns(from: string, to: string) {
  const db = await getDb();
  const { bookings: b } = schema;
  const where = and(ne(b.status, "cancelled"), gte(b.date, from), lte(b.date, to));
  const [services, towns] = await Promise.all([
    db.select({ key: b.service, n: count(), total: sum(b.estimateMur) }).from(b).where(where).groupBy(b.service).orderBy(desc(sum(b.estimateMur))),
    db.select({ key: b.town, n: count(), total: sum(b.estimateMur) }).from(b).where(where).groupBy(b.town).orderBy(desc(sum(b.estimateMur))),
  ]);
  const toRow = (r: { key: string; n: number; total: string | null }) => ({ key: r.key, jobs: r.n, cents: Number(r.total ?? 0) * 100 });
  return { services: services.map(toRow), towns: towns.map(toRow) };
}

/** Per cleaner in the period: jobs, planned hours, finished jobs and on-time arrivals. */
export async function team(from: string, to: string) {
  const db = await getDb();
  const { bookings: b, bookingAssignments: a, staff: s } = schema;
  const rows = await db
    .select({ staffId: s.id, name: s.name, color: s.color, booking: b, checkedInAt: a.checkedInAt, checkedOutAt: a.checkedOutAt })
    .from(a)
    .innerJoin(b, eq(a.bookingId, b.id))
    .innerJoin(s, eq(a.staffId, s.id))
    .where(and(ne(b.status, "cancelled"), gte(b.date, from), lte(b.date, to)));

  const byPerson = new Map<number, { name: string; jobs: number; minutes: number; finished: number; onTime: number; checkedIn: number }>();
  for (const r of rows) {
    const p = byPerson.get(r.staffId) ?? { name: r.name, jobs: 0, minutes: 0, finished: 0, onTime: 0, checkedIn: 0 };
    p.jobs++;
    p.minutes += jobMinutes(r.booking);
    if (r.checkedOutAt) p.finished++;
    if (r.checkedInAt) {
      p.checkedIn++;
      // On time: checked in no more than 15 minutes after the planned start (Mauritius time).
      const planned = new Date(`${r.booking.date}T${r.booking.timeSlot}:00+04:00`).getTime();
      if (r.checkedInAt.getTime() <= planned + 15 * 60_000) p.onTime++;
    }
    byPerson.set(r.staffId, p);
  }
  return [...byPerson.values()].sort((x, y) => y.minutes - x.minutes);
}

/** Share of the period's customers who have booked more than once overall. */
export async function repeatRate(from: string, to: string) {
  const db = await getDb();
  const { bookings: b } = schema;
  const [row] = await db.execute<{ customers: number; repeat: number }>(sql`
    with active as (
      select distinct customer_id from ${b}
      where status <> 'cancelled' and date >= ${from} and date <= ${to}
    ), history as (
      select customer_id, count(*) as n from ${b} where status <> 'cancelled' group by customer_id
    )
    select count(*)::int as customers, count(*) filter (where h.n > 1)::int as repeat
    from active a join history h using (customer_id)
  `).then((r) => r.rows);
  return { customers: row?.customers ?? 0, repeat: row?.repeat ?? 0 };
}
