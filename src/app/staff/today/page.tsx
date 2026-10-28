import Link from "next/link";
import { requireStaff } from "@/lib/staff-auth";
import { mauritiusDate, nowMs } from "@/lib/dates";
import { addDays, hoursLabel, isIsoDate } from "@/lib/schedule";
import { myJobs } from "@/lib/staff-jobs";
import { myShifts } from "@/lib/staff-shifts";
import { shiftWindow } from "@/lib/roster";
import { ShiftCard } from "../shift-card";
import { Icon } from "@/components/icons";
import { JobCard } from "../job-card";
import { StaffShell } from "../shell";
import { longDate, t, weekdayShort } from "../i18n";
import { staffTitle } from "../titles";

export const generateMetadata = staffTitle("today");

export default async function StaffToday({ searchParams }: PageProps<"/staff/today">) {
  const me = await requireStaff();
  const x = t(me.lang);
  const today = mauritiusDate();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const { day: requested } = await searchParams;
  const day = isIsoDate(requested) && week.includes(requested) ? requested : today;

  const [all, allShifts] = await Promise.all([myJobs(me.id, today, week[6], me.lang), myShifts(me.id, addDays(today, -1), week[6])]);
  const jobs = all.filter((j) => j.date === day);
  const now = nowMs();
  // A night shift from yesterday stays on Today until it's over and clocked out.
  const shifts = allShifts.filter(
    (s) => s.date === day || (day === today && s.date === addDays(today, -1) && !s.clockOutAt && shiftWindow(s.date, s.start, s.end).to > now),
  );
  const isToday = day === today;
  const done = jobs.filter((j) => j.checkedOutAt).length + shifts.filter((s) => s.clockOutAt).length;
  const minutes = jobs.reduce((s, j) => s + j.minutes, 0) + shifts.reduce((s, x) => s + x.minutes, 0);
  const count = jobs.length + shifts.length;
  // The job to focus on: the one on site, else the first not started.
  const focus = isToday ? (jobs.find((j) => j.checkedInAt && !j.checkedOutAt) ?? jobs.find((j) => !j.checkedInAt)) : undefined;

  return (
    <StaffShell
      me={me}
      tab="today"
      title={isToday ? x.todayTitle : longDate(day, me.lang)}
      subtitle={isToday ? longDate(day, me.lang) : x.planned}
    >
      <nav aria-label={x.tabs.today} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {week.map((d) => {
          const dayNum = Number(d.slice(8, 10));
          const n = all.filter((j) => j.date === d).length;
          const active = d === day;
          return (
            <Link
              key={d}
              href={d === today ? "/staff/today" : `/staff/today?day=${d}`}
              aria-current={active ? "date" : undefined}
              aria-label={`${longDate(d, me.lang)}: ${x.dayLabel(n)}`}
              className={`flex min-w-14 shrink-0 flex-col items-center rounded-2xl px-2 py-2 transition-colors ${active ? "bg-navy text-white shadow-md" : "bg-white text-ink"}`}
            >
              <span className={`text-[11px] font-semibold uppercase ${active ? "text-white/70" : "text-ink-soft"}`}>{d === today ? x.today : weekdayShort(d, me.lang)}</span>
              <span className="text-xl font-bold leading-tight">{dayNum}</span>
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${n ? (active ? "bg-accent" : "bg-brand") : "bg-transparent"}`} />
            </Link>
          );
        })}
      </nav>

      <section className="grid grid-cols-3 gap-2" aria-label={x.tiles.today}>
        <Summary icon="briefcase" value={String(count)} label={x.summary.items(count)} tone="bg-white" />
        <Summary icon="clock" value={minutes ? hoursLabel(minutes) : "0h"} label={x.summary.planned} tone="bg-white" />
        <Summary icon="check" value={`${done}/${count}`} label={x.summary.done} tone={count && done === count ? "bg-emerald-50 text-emerald-900" : "bg-white"} />
      </section>

      {count === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-surface-alt text-ink-soft"><Icon name="sparkle" width={26} height={26} /></span>
          <p className="mt-3 font-semibold">{x.empty.title(isToday)}</p>
          <p className="text-sm text-ink-soft">{x.empty.body}</p>
        </div>
      ) : (
        // Shifts and jobs together, in the order they start.
        [
          ...shifts.map((s) => ({ at: `${s.date} ${s.start}`, el: <ShiftCard key={`s${s.id}`} shift={s} now={now} lang={me.lang} /> })),
          ...jobs.map((job) => ({ at: `${job.date} ${job.start}`, el: <JobCard key={`j${job.id}`} job={job} isToday={isToday} highlight={job.id === focus?.id} lang={me.lang} /> })),
        ]
          .sort((a, b) => a.at.localeCompare(b.at))
          .map((c) => c.el)
      )}
    </StaffShell>
  );
}

function Summary({ icon, value, label, tone }: { icon: "briefcase" | "clock" | "check"; value: string; label: string; tone: string }) {
  return (
    <div className={`rounded-2xl p-3 text-center shadow-sm ${tone}`}>
      <Icon name={icon} width={18} height={18} className="mx-auto opacity-60" />
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
