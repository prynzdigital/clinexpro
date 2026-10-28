"use server";

import { z } from "zod";
import { and, eq, inArray, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { clashingJobs, isIsoDate } from "@/lib/schedule";

export type ScheduleResult = { ok: true; warning?: string } | { ok: false; error: string };

const bookingId = z.number().int().positive();
const staffId = z.number().int().positive();
const isoDate = z.string().refine(isIsoDate);

/** Drag and drop: move one person's place on a job to another day and/or person. */
export async function moveJob(input: { bookingId: number; date: string; from: number | null; to: number | null }): Promise<ScheduleResult> {
  await requireAdmin();
  const parsed = z
    .object({ bookingId, date: isoDate, from: staffId.nullable(), to: staffId.nullable() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "That move isn't valid." };
  const { from, to } = parsed.data;

  const db = await getDb();
  const job = await editableJob(parsed.data.bookingId);
  if (!job) return { ok: false, error: "This job was cancelled or no longer exists." };
  if (to !== null && !(await activeStaff([to])).length) return { ok: false, error: "That person is inactive." };

  await db.transaction(async (tx) => {
    await tx.update(schema.bookings).set({ date: parsed.data.date }).where(eq(schema.bookings.id, job.id));
    if (from !== to) {
      if (from !== null) {
        await tx
          .delete(schema.bookingAssignments)
          .where(and(eq(schema.bookingAssignments.bookingId, job.id), eq(schema.bookingAssignments.staffId, from)));
      }
      if (to !== null) await tx.insert(schema.bookingAssignments).values({ bookingId: job.id, staffId: to }).onConflictDoNothing();
    }
  });

  revalidatePath("/admin", "layout");
  return { ok: true, warning: await clashWarning(job.id) };
}

/** The job editor: date, start time, length and the whole team at once. */
export async function saveJob(input: {
  bookingId: number;
  date: string;
  time: string;
  durationMinutes: number | null;
  staffIds: number[];
  leaderId?: number | null;
}): Promise<ScheduleResult> {
  await requireAdmin();
  const parsed = z
    .object({
      bookingId,
      date: isoDate,
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      durationMinutes: z.number().int().min(30).max(720).nullable(),
      staffIds: z.array(staffId).max(50),
      leaderId: staffId.nullable().optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the date, time and length." };
  const { date, time, durationMinutes } = parsed.data;
  const staffIds = [...new Set(parsed.data.staffIds)];
  const leaderId = parsed.data.leaderId && staffIds.includes(parsed.data.leaderId) ? parsed.data.leaderId : null;

  const db = await getDb();
  const job = await editableJob(parsed.data.bookingId);
  if (!job) return { ok: false, error: "This job was cancelled or no longer exists." };

  // People already on the job may stay even if since made inactive; new ones must be active.
  const current = await db
    .select({ staffId: schema.bookingAssignments.staffId })
    .from(schema.bookingAssignments)
    .where(eq(schema.bookingAssignments.bookingId, job.id));
  const added = staffIds.filter((id) => !current.some((c) => c.staffId === id));
  if (added.length && (await activeStaff(added)).length !== added.length) {
    return { ok: false, error: "One of the people you picked is inactive." };
  }

  await db.transaction(async (tx) => {
    await tx.update(schema.bookings).set({ date, timeSlot: time, durationMinutes }).where(eq(schema.bookings.id, job.id));
    // Remove only the people taken off; those who stay keep their check-in times.
    const gone = current.map((c) => c.staffId).filter((id) => !staffIds.includes(id));
    if (gone.length) {
      await tx
        .delete(schema.bookingAssignments)
        .where(and(eq(schema.bookingAssignments.bookingId, job.id), inArray(schema.bookingAssignments.staffId, gone)));
    }
    for (const id of staffIds) {
      await tx
        .insert(schema.bookingAssignments)
        .values({ bookingId: job.id, staffId: id, isLeader: id === leaderId })
        .onConflictDoUpdate({ target: [schema.bookingAssignments.bookingId, schema.bookingAssignments.staffId], set: { isLeader: id === leaderId } });
    }
  });

  revalidatePath("/admin", "layout");
  return { ok: true, warning: await clashWarning(job.id) };
}

async function editableJob(id: number) {
  const db = await getDb();
  const [job] = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(and(eq(schema.bookings.id, id), ne(schema.bookings.status, "cancelled")))
    .limit(1);
  return job;
}

async function activeStaff(ids: number[]) {
  const db = await getDb();
  return db
    .select({ id: schema.staff.id })
    .from(schema.staff)
    .where(and(inArray(schema.staff.id, ids), eq(schema.staff.active, true)));
}

/** "Priya is also on CP-ABC123 at 10:00": a warning only; the team may mean it. */
async function clashWarning(jobId: number) {
  const db = await getDb();
  const { bookings: b, bookingAssignments: a, staff: s } = schema;
  const [job] = await db.select().from(b).where(eq(b.id, jobId));
  const team = await db.select({ staffId: a.staffId }).from(a).where(eq(a.bookingId, jobId));
  if (!team.length) return undefined;

  const sameDay = await db
    .select({ id: b.id, ref: b.ref, date: b.date, timeSlot: b.timeSlot, service: b.service, durationMinutes: b.durationMinutes, staffId: a.staffId, name: s.name })
    .from(a)
    .innerJoin(b, eq(a.bookingId, b.id))
    .innerJoin(s, eq(a.staffId, s.id))
    .where(and(eq(b.date, job.date), ne(b.status, "cancelled"), inArray(a.staffId, team.map((t) => t.staffId))));

  const notes: string[] = [];
  for (const { staffId: personId } of team) {
    const theirs = sameDay.filter((r) => r.staffId === personId);
    const self = theirs.find((r) => r.id === jobId)!;
    const other = theirs.find((r) => r.id !== jobId && clashingJobs([self, r]).size > 0);
    if (other) notes.push(`${other.name} is also on ${other.ref} at ${other.timeSlot}`);
  }
  return notes.length ? `Overlap: ${notes.join("; ")}.` : undefined;
}
