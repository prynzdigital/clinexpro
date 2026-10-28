import "server-only";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getTown } from "@/content/towns";
import { shiftMinutes } from "@/lib/roster";

export type Mate = { name: string; phone: string | null; isLeader: boolean; color: string; isMe: boolean };

export type StaffShift = {
  id: number;
  date: string;
  start: string;
  end: string;
  minutes: number;
  label: string | null;
  notes: string | null;
  site: { name: string; address: string | null; town: string | null; instructions: string | null; color: string };
  crew: Mate[];
  clockInAt: string | null;
  clockOutAt: string | null;
};

/** The signed-in person's shifts between two dates, with their crew for each. */
export async function myShifts(staffId: number, from: string, to: string): Promise<StaffShift[]> {
  const db = await getDb();
  const { shifts: sh, shiftAssignments: a, sites, staff } = schema;
  const rows = await db
    .select({ shift: sh, me: a, site: sites })
    .from(a)
    .innerJoin(sh, eq(a.shiftId, sh.id))
    .innerJoin(sites, eq(sh.siteId, sites.id))
    .where(and(eq(a.staffId, staffId), gte(sh.date, from), lte(sh.date, to)))
    .orderBy(asc(sh.date), asc(sh.start));
  const crew = rows.length
    ? await db
        .select({ shiftId: a.shiftId, staffId: a.staffId, isLeader: a.isLeader, name: staff.name, phone: staff.phone, color: staff.color })
        .from(a)
        .innerJoin(staff, eq(a.staffId, staff.id))
        .where(inArray(a.shiftId, rows.map((r) => r.shift.id)))
    : [];

  return rows.map(({ shift, me, site }) => ({
    id: shift.id,
    date: shift.date,
    start: shift.start,
    end: shift.end,
    minutes: shiftMinutes(shift.start, shift.end),
    label: shift.label,
    notes: shift.notes,
    site: { name: site.name, address: site.address, town: site.town && (getTown(site.town)?.name ?? site.town), instructions: site.instructions, color: site.color },
    crew: crew
      .filter((c) => c.shiftId === shift.id)
      .map((c) => ({ name: c.name, phone: c.phone, isLeader: c.isLeader, color: c.color, isMe: c.staffId === staffId }))
      .sort((x, y) => Number(y.isLeader) - Number(x.isLeader) || x.name.localeCompare(y.name)),
    clockInAt: me.clockInAt?.toISOString() ?? null,
    clockOutAt: me.clockOutAt?.toISOString() ?? null,
  }));
}
