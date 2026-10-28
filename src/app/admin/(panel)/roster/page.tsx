import Link from "next/link";
import { and, asc, eq, gte, inArray, lte, ne, or } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { addDays, isIsoDate, jobMinutes, mondayOf, weekDays } from "@/lib/schedule";
import { shiftWindow } from "@/lib/roster";
import { Icon } from "@/components/icons";
import { PageHeader, shortDate } from "../ui";
import { RosterBoard, type Busy, type RosterShift } from "./roster-board";

export const metadata = { title: "Roster" };

export default async function RosterPage({ searchParams }: PageProps<"/admin/roster">) {
  await requireAdmin();
  const { week } = await searchParams;
  const today = mauritiusDate();
  const monday = mondayOf(isIsoDate(week) ? week : today);
  const days = weekDays(monday);
  // A day either side, so overnight shifts and their clashes are seen.
  const from = addDays(days[0], -1);
  const to = addDays(days[6], 1);

  const db = await getDb();
  const [shiftRows, staff, crews, crewMembers, jobRows] = await Promise.all([
    db.select().from(schema.shifts).where(and(gte(schema.shifts.date, from), lte(schema.shifts.date, to))).orderBy(asc(schema.shifts.start)),
    db.select({ id: schema.staff.id, name: schema.staff.name, color: schema.staff.color, active: schema.staff.active }).from(schema.staff).orderBy(asc(schema.staff.name)),
    db.select().from(schema.crews).orderBy(asc(schema.crews.name)),
    db.select().from(schema.crewMembers),
    db
      .select({ booking: schema.bookings, staffId: schema.bookingAssignments.staffId })
      .from(schema.bookingAssignments)
      .innerJoin(schema.bookings, eq(schema.bookingAssignments.bookingId, schema.bookings.id))
      .where(and(ne(schema.bookings.status, "cancelled"), gte(schema.bookings.date, from), lte(schema.bookings.date, to))),
  ]);
  const assignments = shiftRows.length
    ? await db.select().from(schema.shiftAssignments).where(inArray(schema.shiftAssignments.shiftId, shiftRows.map((s) => s.id)))
    : [];
  const siteIdsThisWeek = [...new Set(shiftRows.filter((s) => s.date >= days[0] && s.date <= days[6]).map((s) => s.siteId))];
  const sites = await db
    .select()
    .from(schema.sites)
    .where(siteIdsThisWeek.length ? or(eq(schema.sites.active, true), inArray(schema.sites.id, siteIdsThisWeek)) : eq(schema.sites.active, true))
    .orderBy(asc(schema.sites.name));
  const siteName = new Map((await db.select({ id: schema.sites.id, name: schema.sites.name }).from(schema.sites)).map((s) => [s.id, s.name]));

  const shifts: RosterShift[] = shiftRows.map((s) => ({
    id: s.id,
    siteId: s.siteId,
    date: s.date,
    start: s.start,
    end: s.end,
    label: s.label ?? "",
    headcount: s.headcount,
    notes: s.notes ?? "",
    crew: assignments
      .filter((a) => a.shiftId === s.id)
      .map((a) => ({ staffId: a.staffId, isLeader: a.isLeader, clockInAt: a.clockInAt?.toISOString() ?? null, clockOutAt: a.clockOutAt?.toISOString() ?? null })),
  }));

  // Everything each person is already committed to, for clash warnings in the editor.
  const busy: Busy[] = [
    ...shifts.flatMap((s) =>
      s.crew.map((c) => ({ staffId: c.staffId, shiftId: s.id, ...shiftWindow(s.date, s.start, s.end), what: `${siteName.get(s.siteId)} ${s.start}–${s.end}` })),
    ),
    ...jobRows.map((j) => {
      const start = Date.parse(`${j.booking.date}T${j.booking.timeSlot}:00+04:00`);
      return { staffId: j.staffId, shiftId: null, from: start, to: start + jobMinutes(j.booking) * 60_000, what: `job ${j.booking.ref} ${j.booking.timeSlot}` };
    }),
  ];

  return (
    <>
      <PageHeader title="Roster" subtitle={`Shifts at hotels and offices · ${shortDate(days[0])} – ${shortDate(days[6])}`}>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/roster/sites" className="btn-secondary min-h-10 gap-1.5 px-3 text-sm"><Icon name="office" width={16} height={16} /> Sites</Link>
          <Link href="/admin/roster/crews" className="btn-secondary min-h-10 gap-1.5 px-3 text-sm"><Icon name="users" width={16} height={16} /> Saved crews</Link>
          <Link href="/admin/roster/timesheets" className="btn-secondary min-h-10 gap-1.5 px-3 text-sm"><Icon name="clock" width={16} height={16} /> Timesheets</Link>
        </div>
      </PageHeader>

      <nav className="mb-4 flex items-center gap-2" aria-label="Week">
        <Link href={`/admin/roster?week=${addDays(monday, -7)}`} className="btn-secondary min-h-10 px-3 text-sm" aria-label="Previous week">←</Link>
        <Link href="/admin/roster" className="btn-secondary min-h-10 px-3 text-sm">This week</Link>
        <Link href={`/admin/roster?week=${addDays(monday, 7)}`} className="btn-secondary min-h-10 px-3 text-sm" aria-label="Next week">→</Link>
      </nav>

      {sites.length === 0 ? (
        <p className="card p-6 text-sm">
          No sites yet. <Link href="/admin/roster/sites" className="font-medium text-brand-strong hover:underline">Add your first hotel or office</Link> to start planning shifts.
        </p>
      ) : (
        <RosterBoard
          key={monday}
          monday={monday}
          days={days}
          today={today}
          sites={sites.map((s) => ({ id: s.id, name: s.name, color: s.color }))}
          shifts={shifts.filter((s) => s.date >= days[0] && s.date <= days[6])}
          staff={staff}
          crews={crews.map((c) => ({ id: c.id, name: c.name, leaderId: c.leaderId, members: crewMembers.filter((m) => m.crewId === c.id).map((m) => m.staffId) }))}
          busy={busy}
          jobMinutesByPerson={Object.fromEntries(
            staff.map((p) => [p.id, jobRows.filter((j) => j.staffId === p.id && j.booking.date >= days[0] && j.booking.date <= days[6]).reduce((sum, j) => sum + jobMinutes(j.booking), 0)]),
          )}
        />
      )}
    </>
  );
}
