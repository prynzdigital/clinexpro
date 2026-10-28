import Link from "next/link";
import { requireStaff } from "@/lib/staff-auth";
import { mauritiusDate } from "@/lib/dates";
import { addDays, hoursLabel } from "@/lib/schedule";
import { myJobs } from "@/lib/staff-jobs";
import { myShifts } from "@/lib/staff-shifts";
import { Icon } from "@/components/icons";
import { StaffShell } from "../shell";

export const metadata = { title: "This week" };

const LONG_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function StaffWeek() {
  const me = await requireStaff();
  const today = mauritiusDate();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const [jobs, shifts] = await Promise.all([myJobs(me.id, today, days[6]), myShifts(me.id, today, days[6])]);
  const total = jobs.reduce((s, j) => s + j.minutes, 0) + shifts.reduce((s, x) => s + x.minutes, 0);

  return (
    <StaffShell me={me} tab="week" title="Next 7 days" subtitle={`${shifts.length ? `${shifts.length} shift${shifts.length === 1 ? "" : "s"} · ` : ""}${jobs.length} job${jobs.length === 1 ? "" : "s"} · ${hoursLabel(total)} planned`}>
      {days.map((d) => {
        const date = new Date(`${d}T00:00:00Z`);
        const list = jobs.filter((j) => j.date === d);
        const dayShifts = shifts.filter((s) => s.date === d);
        return (
          <section key={d} aria-label={LONG_DAYS[date.getUTCDay()]}>
            <h2 className="mb-2 flex items-baseline justify-between rounded-xl bg-white/70 px-3 py-1.5 backdrop-blur-sm">
              <span className="font-bold">{d === today ? "Today" : LONG_DAYS[date.getUTCDay()]}</span>
              <span className="text-sm text-ink-soft">{date.getUTCDate()} {MONTHS[date.getUTCMonth()]}</span>
            </h2>
            {dayShifts.length > 0 && (
              <ul className="mb-2 space-y-2">
                {dayShifts.map((s) => {
                  const leader = s.crew.find((c) => c.isLeader);
                  return (
                    <li key={`s${s.id}`}>
                      <Link href={d === today ? "/staff" : `/staff?day=${d}`} className="flex items-center gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99]" style={{ borderLeft: `6px solid ${s.site.color}` }}>
                        <span className="w-14 shrink-0">
                          <span className="block text-lg font-bold tabular-nums leading-none">{s.start}</span>
                          <span className="text-xs text-ink-soft">to {s.end}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{s.label ?? "Shift"} · {s.site.name}</span>
                          <span className="block truncate text-sm text-ink-soft">
                            Crew of {s.crew.length}{leader ? ` · ★ ${leader.isMe ? "You lead" : leader.name.split(" ")[0]}` : ""}
                          </span>
                        </span>
                        {s.clockOutAt ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">Done</span> : <Icon name="arrow" width={18} height={18} className="text-ink-soft" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {list.length === 0 && dayShifts.length > 0 ? null : list.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-ink/15 bg-white/60 px-4 py-3 text-sm text-ink-soft backdrop-blur-sm">Free</p>
            ) : (
              <ul className="space-y-2">
                {list.map((j) => (
                  <li key={j.id}>
                    <Link href={d === today ? "/staff" : `/staff?day=${d}`} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm active:scale-[0.99]">
                      <span className="w-14 shrink-0">
                        <span className="block text-lg font-bold tabular-nums leading-none">{j.start}</span>
                        <span className="text-xs text-ink-soft">{hoursLabel(j.minutes)}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{j.service}</span>
                        <span className="flex items-center gap-1 truncate text-sm text-ink-soft"><Icon name="pin" width={14} height={14} /> {j.town}</span>
                      </span>
                      {j.checkedOutAt ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">Done</span>
                      ) : (
                        <Icon name="arrow" width={18} height={18} className="text-ink-soft" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </StaffShell>
  );
}
