import "server-only";
import { shiftWindow, workedMinutes } from "@/lib/roster";
import { LATE_AFTER_MINUTES, monthRange } from "@/lib/timesheets";
import { myJobs } from "@/lib/staff-jobs";
import { myShifts } from "@/lib/staff-shifts";

export type WorkedEntry = {
  key: string;
  date: string;
  kind: "shift" | "job";
  title: string;
  place: string;
  start: string;
  inAt: string | null;
  outAt: string | null;
  minutes: number | null;
  lateMinutes: number;
  missing: boolean;
};

/** What a cleaner worked in a month: shifts (clock times) and jobs (check-in/out). */
export async function myMonth(staffId: number, month: string, today: string) {
  const { from, to } = monthRange(month);
  const until = to < today ? to : today;
  const [shifts, jobs] = await Promise.all([myShifts(staffId, from, until), myJobs(staffId, from, until)]);
  const now = Date.now();

  const entries: WorkedEntry[] = [
    ...shifts.map((s) => {
      const w = shiftWindow(s.date, s.start, s.end);
      const late = s.clockInAt ? Math.max(0, Math.round((Date.parse(s.clockInAt) - w.from) / 60_000)) : 0;
      return {
        key: `s${s.id}`,
        date: s.date,
        kind: "shift" as const,
        title: `${s.label ?? "Shift"} ${s.start}–${s.end}`,
        place: s.site.name,
        start: s.start,
        inAt: s.clockInAt,
        outAt: s.clockOutAt,
        minutes: workedMinutes(s.clockInAt, s.clockOutAt),
        lateMinutes: late > LATE_AFTER_MINUTES ? late : 0,
        missing: w.to < now && !s.clockOutAt,
      };
    }),
    ...jobs.map((j) => ({
      key: `j${j.id}`,
      date: j.date,
      kind: "job" as const,
      title: j.service,
      place: j.town,
      start: j.start,
      inAt: j.checkedInAt,
      outAt: j.checkedOutAt,
      minutes: workedMinutes(j.checkedInAt, j.checkedOutAt),
      lateMinutes: 0,
      missing: j.date < today && !j.checkedOutAt,
    })),
  ].sort((a, b) => (a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)));

  return {
    entries,
    workedMinutes: entries.reduce((s, e) => s + (e.minutes ?? 0), 0),
    shifts: entries.filter((e) => e.kind === "shift" && e.outAt).length,
    jobs: entries.filter((e) => e.kind === "job" && e.outAt).length,
    late: entries.filter((e) => e.lateMinutes).length,
    missing: entries.filter((e) => e.missing).length,
  };
}
