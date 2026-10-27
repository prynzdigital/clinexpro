import Link from "next/link";
import { and, asc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { addDays, isIsoDate, mondayOf, weekDays } from "@/lib/schedule";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import { PageHeader, shortDate } from "../ui";
import { Board, type BoardJob } from "./board";

export const metadata = { title: "Schedule" };

export default async function SchedulePage({ searchParams }: PageProps<"/admin/schedule">) {
  await requireAdmin();
  const { week } = await searchParams;
  const today = mauritiusDate();
  const monday = mondayOf(isIsoDate(week) ? week : today);
  const days = weekDays(monday);

  const db = await getDb();
  const { bookings: b, customers: c, bookingAssignments: a } = schema;
  const rows = await db
    .select({ booking: b, customer: c.name, phone: c.phone })
    .from(b)
    .innerJoin(c, eq(b.customerId, c.id))
    .where(and(ne(b.status, "cancelled"), gte(b.date, days[0]), lte(b.date, days[6])))
    .orderBy(asc(b.date), asc(b.timeSlot));
  const assignments = rows.length
    ? await db.select().from(a).where(inArray(a.bookingId, rows.map((r) => r.booking.id)))
    : [];
  const staff = await db.select().from(schema.staff).orderBy(asc(schema.staff.name));

  const jobs: BoardJob[] = rows.map(({ booking, customer, phone }) => ({
    id: booking.id,
    ref: booking.ref,
    date: booking.date,
    timeSlot: booking.timeSlot,
    durationMinutes: booking.durationMinutes,
    service: booking.service,
    serviceName: getService(booking.service)?.name.en ?? booking.service,
    customer,
    phone,
    town: getTown(booking.town)?.name ?? booking.town,
    status: booking.status,
    staffIds: assignments.filter((x) => x.bookingId === booking.id).map((x) => x.staffId),
    progress: progressOf(assignments.filter((x) => x.bookingId === booking.id)),
  }));
  const unassigned = jobs.filter((j) => j.staffIds.length === 0).length;

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle={`${shortDate(days[0])} – ${shortDate(days[6])} · ${jobs.length} job${jobs.length === 1 ? "" : "s"}${unassigned ? ` · ${unassigned} need${unassigned === 1 ? "s" : ""} a cleaner` : ""}`}
      >
        <nav className="flex items-center gap-2" aria-label="Week">
          <Link href={`/admin/schedule?week=${addDays(monday, -7)}`} className="btn-secondary min-h-10 px-3 text-sm" aria-label="Previous week">←</Link>
          <Link href="/admin/schedule" className="btn-secondary min-h-10 px-3 text-sm">This week</Link>
          <Link href={`/admin/schedule?week=${addDays(monday, 7)}`} className="btn-secondary min-h-10 px-3 text-sm" aria-label="Next week">→</Link>
        </nav>
      </PageHeader>

      {staff.length === 0 && (
        <p className="card mb-4 p-4 text-sm">
          No staff yet. <Link href="/admin/staff" className="font-medium text-brand-strong hover:underline">Add your cleaners</Link> to assign jobs.
        </p>
      )}

      <Board
        key={monday}
        days={days}
        today={today}
        jobs={jobs}
        staff={staff.map((s) => ({ id: s.id, name: s.name, color: s.color, active: s.active }))}
      />
    </>
  );
}

/** From the staff app: has anyone arrived, and has everyone finished? */
function progressOf(team: { checkedInAt: Date | null; checkedOutAt: Date | null }[]): BoardJob["progress"] {
  if (team.length && team.every((t) => t.checkedOutAt)) return "done";
  return team.some((t) => t.checkedInAt) ? "on-site" : "none";
}
