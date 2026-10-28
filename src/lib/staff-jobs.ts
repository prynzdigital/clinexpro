import "server-only";
import { and, asc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import en from "@/dictionaries/en";
import { fromMinutes, jobMinutes, toMinutes } from "@/lib/schedule";
import type { Mate } from "@/lib/staff-shifts";

export type StaffJob = {
  id: number;
  ref: string;
  date: string;
  start: string;
  end: string;
  minutes: number;
  service: string;
  customer: string;
  phone: string;
  address: string;
  town: string;
  details: string[];
  extras: string[];
  notes: string | null;
  /** Everyone on the job, leader first (including the signed-in person). */
  crew: Mate[];
  checkedInAt: string | null;
  checkedOutAt: string | null;
  report: string | null;
};

/** The signed-in cleaner's own jobs between two dates (only what they need, nothing else). */
export async function myJobs(staffId: number, from: string, to: string): Promise<StaffJob[]> {
  const db = await getDb();
  const { bookings: b, bookingAssignments: a, customers: c, staff: s } = schema;
  const rows = await db
    .select({ booking: b, assignment: a, customer: c.name, phone: c.phone })
    .from(a)
    .innerJoin(b, eq(a.bookingId, b.id))
    .innerJoin(c, eq(b.customerId, c.id))
    .where(and(eq(a.staffId, staffId), ne(b.status, "cancelled"), gte(b.date, from), lte(b.date, to)))
    .orderBy(asc(b.date), asc(b.timeSlot));
  const crew = rows.length
    ? await db
        .select({ bookingId: a.bookingId, staffId: a.staffId, isLeader: a.isLeader, name: s.name, phone: s.phone, color: s.color })
        .from(a)
        .innerJoin(s, eq(a.staffId, s.id))
        .where(inArray(a.bookingId, rows.map((r) => r.booking.id)))
    : [];

  return rows.map(({ booking, assignment, customer, phone }) => {
    const minutes = jobMinutes(booking);
    const { addons = [], ...counts } = booking.details as Record<string, number> & { addons?: string[] };
    return {
      id: booking.id,
      ref: booking.ref,
      date: booking.date,
      start: booking.timeSlot,
      end: fromMinutes(toMinutes(booking.timeSlot) + minutes),
      minutes,
      service: getService(booking.service)?.name.en ?? booking.service,
      customer,
      phone,
      address: booking.address,
      town: getTown(booking.town)?.name ?? booking.town,
      details: Object.entries(counts).map(([k, v]) => `${en.booking.fields[k] ?? k}: ${v}`),
      extras: addons.map((x) => en.booking.addons[x] ?? x),
      notes: booking.notes,
      crew: crew
        .filter((c) => c.bookingId === booking.id)
        .map((c) => ({ name: c.name, phone: c.phone, isLeader: c.isLeader, color: c.color, isMe: c.staffId === staffId }))
        .sort((x, y) => Number(y.isLeader) - Number(x.isLeader) || x.name.localeCompare(y.name)),
      checkedInAt: assignment.checkedInAt?.toISOString() ?? null,
      checkedOutAt: assignment.checkedOutAt?.toISOString() ?? null,
      report: assignment.report,
    };
  });
}
