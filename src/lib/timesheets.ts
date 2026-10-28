import "server-only";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { addDays } from "@/lib/schedule";
import { shiftMinutes, shiftWindow, workedMinutes } from "@/lib/roster";

/** Minutes after the planned start that count as late. */
export const LATE_AFTER_MINUTES = 10;

export type TimesheetRow = {
  date: string;
  site: string;
  siteId: number;
  shift: string;
  start: string;
  end: string;
  person: string;
  staffId: number;
  isLeader: boolean;
  plannedMinutes: number;
  clockInAt: Date | null;
  clockOutAt: Date | null;
  workedMinutes: number | null;
  lateMinutes: number;
  status: "ok" | "late" | "no_clock_out" | "absent" | "upcoming";
};

export const monthRange = (month: string) => {
  const from = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return { from, to: addDays(next, -1) };
};

/** Every shift place in a month (optionally one site), with clock times and flags. */
export async function timesheet(month: string, siteId: number | null): Promise<TimesheetRow[]> {
  const { from, to } = monthRange(month);
  const db = await getDb();
  const { shifts: sh, shiftAssignments: a, sites, staff } = schema;
  const rows = await db
    .select({ shift: sh, a, site: sites.name, person: staff.name })
    .from(a)
    .innerJoin(sh, eq(a.shiftId, sh.id))
    .innerJoin(sites, eq(sh.siteId, sites.id))
    .innerJoin(staff, eq(a.staffId, staff.id))
    .where(and(gte(sh.date, from), lte(sh.date, to), siteId ? eq(sh.siteId, siteId) : undefined))
    .orderBy(asc(sh.date), asc(sh.start), asc(sites.name), asc(staff.name));

  const now = Date.now();
  return rows.map(({ shift, a, site, person }) => {
    const window = shiftWindow(shift.date, shift.start, shift.end);
    const late = a.clockInAt ? Math.max(0, Math.round((a.clockInAt.getTime() - window.from) / 60_000)) : 0;
    const status: TimesheetRow["status"] = !a.clockInAt
      ? window.to < now
        ? "absent"
        : "upcoming"
      : !a.clockOutAt
        ? window.to < now
          ? "no_clock_out"
          : "upcoming"
        : late > LATE_AFTER_MINUTES
          ? "late"
          : "ok";
    return {
      date: shift.date,
      site,
      siteId: shift.siteId,
      shift: shift.label ?? "Shift",
      start: shift.start,
      end: shift.end,
      person,
      staffId: a.staffId,
      isLeader: a.isLeader,
      plannedMinutes: shiftMinutes(shift.start, shift.end),
      clockInAt: a.clockInAt,
      clockOutAt: a.clockOutAt,
      workedMinutes: workedMinutes(a.clockInAt, a.clockOutAt),
      lateMinutes: late,
      status,
    };
  });
}

export const STATUS_LABEL: Record<TimesheetRow["status"], string> = {
  ok: "OK",
  late: "Late",
  no_clock_out: "No clock-out",
  absent: "Absent / not clocked",
  upcoming: "Not finished yet",
};
