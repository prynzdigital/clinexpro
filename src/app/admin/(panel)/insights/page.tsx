import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { RANGES, breakdowns, headline, monthly, period, receivables, repeatRate, team, type Range } from "@/lib/insights";
import { money } from "@/lib/invoices";
import { hoursLabel } from "@/lib/schedule";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import { PageHeader, shortDate } from "../ui";
import { ColumnChart, RankedBars } from "./charts";

export const metadata = { title: "Business insights" };

const BRAND = "#d14000";
const NAVY = "#0b2a41";

const whole = (cents: number) =>
  new Intl.NumberFormat("en-MU", { style: "currency", currency: "MUR", maximumFractionDigits: 0 }).format(Math.round(cents / 100));
const pct = (n: number) => `${Math.round(n * 100)}%`;
const monthName = (ym: string, style: "short" | "long") =>
  new Intl.DateTimeFormat("en-GB", { month: style, year: style === "long" ? "numeric" : undefined, timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));

export default async function InsightsPage({ searchParams }: PageProps<"/admin/insights">) {
  await requireOwner();
  const { range: requested } = await searchParams;
  const range: Range = typeof requested === "string" && requested in RANGES ? (requested as Range) : "month";
  const { from, to, prevFrom, prevTo } = period(range);

  const [now, before, owed, months, mix, people, repeat] = await Promise.all([
    headline(from, to),
    headline(prevFrom, prevTo),
    receivables(),
    monthly(),
    breakdowns(from, to),
    team(from, to),
    repeatRate(from, to),
  ]);

  const tiles = [
    { label: "Work booked", value: whole(now.bookedCents), delta: change(now.bookedCents, before.bookedCents), note: `${now.jobs} jobs · avg ${whole(now.avgJobCents)}` },
    { label: "Cash collected", value: whole(now.collectedCents), delta: change(now.collectedCents, before.collectedCents), note: "payments received in the period" },
    { label: "Invoiced", value: whole(now.invoicedCents), delta: change(now.invoicedCents, before.invoicedCents), note: `${now.completed} jobs completed` },
    { label: "Owed to you now", value: whole(owed.outstanding), note: owed.overdue ? `${whole(owed.overdue)} overdue (${owed.overdueCount})` : "nothing overdue", href: "/admin/invoices?status=overdue", alert: owed.overdue > 0 },
  ];

  const leadRate = now.leads ? now.leadsWon / now.leads : 0;
  const growth = [
    { label: "Online bookings placed", value: String(now.onlineBookings), delta: change(now.onlineBookings, before.onlineBookings) },
    { label: "New customers", value: String(now.newCustomers), delta: change(now.newCustomers, before.newCustomers) },
    { label: "Customers who came back", value: repeat.customers ? pct(repeat.repeat / repeat.customers) : "—", note: `${repeat.repeat} of ${repeat.customers} booked before` },
    { label: "Enquiries won", value: now.leads ? pct(leadRate) : "—", note: `${now.leadsWon} won of ${now.leads} · ${now.leadsOpen} still open` },
    { label: "Cancelled", value: pct(now.cancelRate), note: "of jobs in the period" },
  ];

  const latest = months[months.length - 1];

  return (
    <>
      <PageHeader title="Business insights" subtitle={`${shortDate(from)} – ${shortDate(to)} · compared with the period before`}>
        <nav className="flex gap-1.5 overflow-x-auto" aria-label="Period">
          {(Object.keys(RANGES) as Range[]).map((r) => (
            <Link
              key={r}
              href={r === "month" ? "/admin/insights" : `/admin/insights?range=${r}`}
              aria-current={r === range ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${r === range ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-ink"}`}
            >
              {RANGES[r]}
            </Link>
          ))}
        </nav>
      </PageHeader>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => {
          const body = (
            <>
              <p className="text-sm text-ink-soft">{t.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{t.value}</p>
              {t.delta && <Delta {...t.delta} />}
              <p className={`mt-1 text-xs ${t.alert ? "font-medium text-rose-700" : "text-ink-soft"}`}>
                {t.alert && <span aria-hidden>⚠ </span>}
                {t.note}
              </p>
            </>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="card p-4 hover:border-brand">{body}</Link>
          ) : (
            <div key={t.label} className="card p-4">{body}</div>
          );
        })}
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <ColumnChart
          title="Work booked per month"
          color={BRAND}
          summary={`Last 12 months; ${monthName(latest.month, "long")}: ${money(latest.bookedCents)}.`}
          points={months.map((m) => ({ label: monthName(m.month, "short"), long: monthName(m.month, "long"), value: m.bookedCents, display: whole(m.bookedCents) }))}
        />
        <ColumnChart
          title="Cash collected per month"
          color={NAVY}
          summary={`Last 12 months; ${monthName(latest.month, "long")}: ${money(latest.collectedCents)}.`}
          points={months.map((m) => ({ label: monthName(m.month, "short"), long: monthName(m.month, "long"), value: m.collectedCents, display: whole(m.collectedCents) }))}
        />
      </div>

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Growth">
        {growth.map((g) => (
          <div key={g.label} className="card p-4">
            <p className="text-sm text-ink-soft">{g.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{g.value}</p>
            {g.delta && <Delta {...g.delta} />}
            {g.note && <p className="mt-1 text-xs text-ink-soft">{g.note}</p>}
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <RankedBars
          title="Services by value"
          color={BRAND}
          columns={["Service", "Booked"]}
          empty="No jobs in this period."
          rows={mix.services.map((s) => ({ label: getService(s.key)?.name.en ?? s.key, value: s.cents, display: whole(s.cents), note: `${s.jobs} job${s.jobs === 1 ? "" : "s"}` }))}
        />
        <RankedBars
          title="Towns by value"
          color={BRAND}
          columns={["Town", "Booked"]}
          empty="No jobs in this period."
          rows={mix.towns.slice(0, 8).map((t) => ({ label: getTown(t.key)?.name ?? t.key, value: t.cents, display: whole(t.cents), note: `${t.jobs} job${t.jobs === 1 ? "" : "s"}` }))}
        />
        <RankedBars
          title="Team: planned hours"
          color={NAVY}
          columns={["Person", "Hours"]}
          empty="No jobs assigned in this period."
          rows={people.map((p) => ({
            label: p.name,
            value: p.minutes,
            display: hoursLabel(p.minutes),
            note: `${p.jobs} jobs · ${p.finished} done${p.checkedIn ? ` · ${pct(p.onTime / p.checkedIn)} on time` : ""}`,
          }))}
        />
      </div>

      <p className="mt-6 text-xs text-ink-soft">
        Work booked counts jobs by their date (cancelled jobs excluded), at the price quoted. Cash collected counts invoice payments and online deposits by the day received. On time means checked in within 15 minutes of the planned start.
      </p>
    </>
  );
}

/** Change against the previous period, shown with an arrow and words, not colour alone. */
function change(now: number, before: number) {
  if (before === 0) return now === 0 ? null : { text: "new this period", direction: "up" as const };
  const ratio = (now - before) / before;
  if (Math.abs(ratio) < 0.005) return { text: "same as before", direction: "flat" as const };
  // Big jumps read better as a multiple than as "18011%".
  if (ratio >= 2) return { text: `${(now / before).toFixed(now / before < 10 ? 1 : 0)}× previous`, direction: "up" as const };
  return { text: `${Math.abs(Math.round(ratio * 100))}% ${ratio > 0 ? "up" : "down"} on previous`, direction: ratio > 0 ? ("up" as const) : ("down" as const) };
}

function Delta({ text, direction }: { text: string; direction: "up" | "down" | "flat" }) {
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "▬";
  const tone = direction === "up" ? "text-emerald-700" : direction === "down" ? "text-rose-700" : "text-ink-soft";
  return (
    <p className={`mt-0.5 text-xs font-medium ${tone}`}>
      <span aria-hidden>{arrow} </span>
      {text}
    </p>
  );
}
