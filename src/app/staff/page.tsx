import Link from "next/link";
import { requireStaff } from "@/lib/staff-auth";
import { mauritiusDate } from "@/lib/dates";
import { addDays, hoursLabel, isIsoDate } from "@/lib/schedule";
import { myJobs } from "@/lib/staff-jobs";
import { Icon } from "@/components/icons";
import { InstallCard } from "./app-client";
import { JobCard } from "./job-card";
import { StaffShell } from "./shell";

export const metadata = { title: "Today" };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const parts = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return { wd: d.getUTCDay(), day: d.getUTCDate(), month: MONTHS[d.getUTCMonth()] };
};

const greeting = () => {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Indian/Mauritius" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
};

export default async function StaffToday({ searchParams }: PageProps<"/staff">) {
  const me = await requireStaff();
  const today = mauritiusDate();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const { day: requested } = await searchParams;
  const day = isIsoDate(requested) && week.includes(requested) ? requested : today;

  const all = await myJobs(me.id, today, week[6]);
  const jobs = all.filter((j) => j.date === day);
  const isToday = day === today;
  const done = jobs.filter((j) => j.checkedOutAt).length;
  const minutes = jobs.reduce((s, j) => s + j.minutes, 0);
  // The job to focus on: the one on site, else the first not started.
  const focus = isToday ? (jobs.find((j) => j.checkedInAt && !j.checkedOutAt) ?? jobs.find((j) => !j.checkedInAt)) : undefined;
  const p = parts(day);

  return (
    <StaffShell
      me={me}
      tab="today"
      title={isToday ? `${greeting()}, ${me.name.split(" ")[0]}` : `${LONG_DAYS[p.wd]} ${p.day} ${p.month}`}
      subtitle={isToday ? `${LONG_DAYS[p.wd]} ${p.day} ${p.month}` : "Planned jobs"}
    >
      <nav aria-label="Day" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {week.map((d) => {
          const q = parts(d);
          const n = all.filter((j) => j.date === d).length;
          const active = d === day;
          return (
            <Link
              key={d}
              href={d === today ? "/staff" : `/staff?day=${d}`}
              aria-current={active ? "date" : undefined}
              aria-label={`${LONG_DAYS[q.wd]} ${q.day}: ${n} job${n === 1 ? "" : "s"}`}
              className={`flex min-w-14 shrink-0 flex-col items-center rounded-2xl px-2 py-2 transition-colors ${active ? "bg-navy text-white shadow-md" : "bg-white text-ink"}`}
            >
              <span className={`text-[11px] font-semibold uppercase ${active ? "text-white/70" : "text-ink-soft"}`}>{d === today ? "Today" : WEEKDAYS[q.wd]}</span>
              <span className="text-xl font-bold leading-tight">{q.day}</span>
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${n ? (active ? "bg-accent" : "bg-brand") : "bg-transparent"}`} />
            </Link>
          );
        })}
      </nav>

      <section className="grid grid-cols-3 gap-2" aria-label="Summary">
        <Summary icon="briefcase" value={String(jobs.length)} label={jobs.length === 1 ? "job" : "jobs"} tone="bg-white" />
        <Summary icon="clock" value={minutes ? hoursLabel(minutes) : "0h"} label="planned" tone="bg-white" />
        <Summary icon="check" value={`${done}/${jobs.length}`} label="done" tone={jobs.length && done === jobs.length ? "bg-emerald-50 text-emerald-900" : "bg-white"} />
      </section>

      {isToday && <InstallCard dismissible />}

      {jobs.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-surface-alt text-ink-soft"><Icon name="sparkle" width={26} height={26} /></span>
          <p className="mt-3 font-semibold">No jobs {isToday ? "today" : "this day"}</p>
          <p className="text-sm text-ink-soft">The office will add them to your schedule.</p>
        </div>
      ) : (
        jobs.map((job) => <JobCard key={job.id} job={job} isToday={isToday} highlight={job.id === focus?.id} />)
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
