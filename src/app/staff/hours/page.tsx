import Link from "next/link";
import { requireStaff } from "@/lib/staff-auth";
import { mauritiusDate } from "@/lib/dates";
import { hm } from "@/lib/roster";
import { myMonth } from "@/lib/staff-hours";
import { Icon } from "@/components/icons";
import { StaffShell } from "../shell";

export const metadata = { title: "My hours" };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const clock = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mauritius" }).format(new Date(iso)) : "—";

export default async function StaffHours({ searchParams }: PageProps<"/staff/hours">) {
  const me = await requireStaff();
  const today = mauritiusDate();
  const { month: requested } = await searchParams;
  const thisMonth = today.slice(0, 7);
  const month = typeof requested === "string" && /^\d{4}-\d{2}$/.test(requested) && requested <= thisMonth ? requested : thisMonth;
  const data = await myMonth(me.id, month, today);

  const shift = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
  };
  const label = `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
  const days = [...new Set(data.entries.map((e) => e.date))].sort().reverse();

  return (
    <StaffShell me={me} tab="hours" title="My hours" subtitle={label}>
      <nav className="flex items-center justify-between rounded-2xl bg-white/80 p-1.5 shadow-sm backdrop-blur-sm" aria-label="Month">
        <Link href={`/staff/hours?month=${shift(-1)}`} className="grid size-11 place-items-center rounded-xl hover:bg-surface-alt" aria-label="Previous month">
          <Icon name="arrow" width={18} height={18} className="rotate-180" />
        </Link>
        <span className="font-bold">{label}</span>
        {month < thisMonth ? (
          <Link href={`/staff/hours?month=${shift(1)}`} className="grid size-11 place-items-center rounded-xl hover:bg-surface-alt" aria-label="Next month">
            <Icon name="arrow" width={18} height={18} />
          </Link>
        ) : (
          <span className="size-11" />
        )}
      </nav>

      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg" aria-label="Summary">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">Worked {month === thisMonth ? "so far" : "in total"}</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">{hm(data.workedMinutes)}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <span className="rounded-2xl bg-white/15 p-2"><span className="block text-xl font-bold">{data.shifts}</span><span className="text-xs">shifts</span></span>
          <span className="rounded-2xl bg-white/15 p-2"><span className="block text-xl font-bold">{data.jobs}</span><span className="text-xs">jobs</span></span>
          <span className={`rounded-2xl p-2 ${data.late ? "bg-amber-400/30" : "bg-white/15"}`}><span className="block text-xl font-bold">{data.late}</span><span className="text-xs">late</span></span>
        </div>
      </section>

      {data.missing > 0 && (
        <p className="flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
          <Icon name="alert" width={18} height={18} className="mt-0.5 shrink-0 text-amber-600" />
          {data.missing} {data.missing === 1 ? "entry has" : "entries have"} no clock-out, so {data.missing === 1 ? "it isn't" : "they aren't"} counted yet. Tell the office so they can correct it.
        </p>
      )}

      {days.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-center text-ink-soft shadow-sm">No shifts or jobs recorded this month.</p>
      ) : (
        days.map((d) => {
          const date = new Date(`${d}T00:00:00Z`);
          const list = data.entries.filter((e) => e.date === d);
          const total = list.reduce((s, e) => s + (e.minutes ?? 0), 0);
          return (
            <section key={d} className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <h2 className="flex items-baseline justify-between bg-surface-alt px-4 py-2">
                <span className="font-bold">{d === today ? "Today" : `${WEEKDAYS[date.getUTCDay()]} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()].slice(0, 3)}`}</span>
                <span className="text-sm font-semibold tabular-nums">{hm(total)}</span>
              </h2>
              <ul className="divide-y divide-line">
                {list.map((e) => (
                  <li key={e.key} className="flex items-center gap-3 px-4 py-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${e.kind === "shift" ? "bg-sky-50 text-sky-700" : "bg-brand-soft text-brand-strong"}`}>
                      <Icon name={e.kind === "shift" ? "roster" : "sparkle"} width={18} height={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{e.title}</span>
                      <span className="block truncate text-xs text-ink-soft">
                        {e.place} · in {clock(e.inAt)} · out {clock(e.outAt)}
                        {e.lateMinutes > 0 && <span className="font-semibold text-amber-700"> · {e.lateMinutes} min late</span>}
                      </span>
                    </span>
                    <span className={`shrink-0 text-sm font-bold tabular-nums ${e.missing ? "text-rose-700" : ""}`}>{e.minutes !== null ? hm(e.minutes) : e.missing ? "Missing" : "—"}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
      <p className="px-2 text-xs text-ink-soft">Hours come from your clock-in and clock-out times. If something looks wrong, ask the office to correct it.</p>
    </StaffShell>
  );
}
