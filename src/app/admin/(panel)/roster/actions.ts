"use server";

import { z } from "zod";
import { and, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { addDays, isIsoDate, jobMinutes } from "@/lib/schedule";
import { overlaps, shiftWindow } from "@/lib/roster";

export type RosterResult = { ok: true; warning?: string } | { ok: false; error: string };

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 07:00");
const isoDate = z.string().refine(isIsoDate, "Pick a date");

const ShiftInput = z.object({
  id: z.number().int().positive().optional(),
  siteId: z.number().int().positive(),
  date: isoDate,
  start: hhmm,
  end: hhmm,
  label: z.string().trim().max(40),
  headcount: z.number().int().min(1).max(200),
  notes: z.string().trim().max(1000),
  crew: z.array(z.object({ staffId: z.number().int().positive(), isLeader: z.boolean() })).max(200),
  /** Also create the same shift on these dates (new shifts only). */
  repeatOn: z.array(isoDate).max(31).default([]),
});

export async function saveShift(input: z.input<typeof ShiftInput>): Promise<RosterResult> {
  await requireAdmin();
  const parsed = ShiftInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const s = parsed.data;
  if (s.start === s.end) return { ok: false, error: "Start and end can't be the same time." };
  const crew = s.crew.filter((c, i, all) => all.findIndex((x) => x.staffId === c.staffId) === i);
  if (crew.filter((c) => c.isLeader).length > 1) return { ok: false, error: "Choose one leader." };

  const db = await getDb();
  const ids = await db.transaction(async (tx) => {
    const fields = { siteId: s.siteId, start: s.start, end: s.end, label: s.label || null, headcount: s.headcount, notes: s.notes || null };
    const saved: number[] = [];
    if (s.id) {
      await tx.update(schema.shifts).set({ ...fields, date: s.date }).where(eq(schema.shifts.id, s.id));
      // Keep clock times for people who stay on the shift.
      const current = await tx.select().from(schema.shiftAssignments).where(eq(schema.shiftAssignments.shiftId, s.id));
      const keep = new Set(crew.map((c) => c.staffId));
      const gone = current.filter((c) => !keep.has(c.staffId)).map((c) => c.staffId);
      if (gone.some((id) => current.find((c) => c.staffId === id)?.clockInAt)) {
        throw new Error("Someone you removed has already clocked in. Correct their clock times instead of removing them.");
      }
      if (gone.length) {
        await tx.delete(schema.shiftAssignments).where(and(eq(schema.shiftAssignments.shiftId, s.id), inArray(schema.shiftAssignments.staffId, gone)));
      }
      for (const c of crew) {
        await tx
          .insert(schema.shiftAssignments)
          .values({ shiftId: s.id, staffId: c.staffId, isLeader: c.isLeader })
          .onConflictDoUpdate({ target: [schema.shiftAssignments.shiftId, schema.shiftAssignments.staffId], set: { isLeader: c.isLeader } });
      }
      saved.push(s.id);
    } else {
      for (const date of [s.date, ...s.repeatOn.filter((d) => d !== s.date)]) {
        const [row] = await tx.insert(schema.shifts).values({ ...fields, date }).returning({ id: schema.shifts.id });
        if (crew.length) await tx.insert(schema.shiftAssignments).values(crew.map((c) => ({ shiftId: row.id, ...c })));
        saved.push(row.id);
      }
    }
    return saved;
  }).catch((e: Error) => e);
  if (ids instanceof Error) return { ok: false, error: ids.message };

  revalidatePath("/admin", "layout");
  revalidatePath("/staff", "layout");
  return { ok: true, warning: await clashes(ids) };
}

export async function deleteShift(shiftId: number): Promise<RosterResult> {
  await requireAdmin();
  const db = await getDb();
  const crew = await db.select().from(schema.shiftAssignments).where(eq(schema.shiftAssignments.shiftId, shiftId));
  if (crew.some((c) => c.clockInAt)) return { ok: false, error: "Someone has clocked in on this shift, so it's kept for the timesheets." };
  await db.delete(schema.shifts).where(eq(schema.shifts.id, shiftId));
  revalidatePath("/admin", "layout");
  revalidatePath("/staff", "layout");
  return { ok: true };
}

const ids = z.object({ shiftId: z.number().int().positive(), staffId: z.number().int().positive() });

function changed() {
  revalidatePath("/admin", "layout");
  revalidatePath("/staff", "layout");
}

/** Drag a shift to another day or site; with `copy` the original stays and its crew comes along. */
export async function moveShift(input: { shiftId: number; siteId: number; date: string; copy: boolean }): Promise<RosterResult> {
  await requireAdmin();
  const parsed = z.object({ shiftId: z.number().int().positive(), siteId: z.number().int().positive(), date: isoDate, copy: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Couldn't move that shift." };
  const { shiftId, siteId, date, copy } = parsed.data;
  const db = await getDb();
  const [shift] = await db.select().from(schema.shifts).where(eq(schema.shifts.id, shiftId));
  if (!shift) return { ok: false, error: "That shift no longer exists." };
  const crew = await db.select().from(schema.shiftAssignments).where(eq(schema.shiftAssignments.shiftId, shiftId));

  let target = shiftId;
  if (copy) {
    target = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(schema.shifts)
        .values({ siteId, date, start: shift.start, end: shift.end, label: shift.label, headcount: shift.headcount, notes: shift.notes })
        .returning({ id: schema.shifts.id });
      if (crew.length) await tx.insert(schema.shiftAssignments).values(crew.map((c) => ({ shiftId: row.id, staffId: c.staffId, isLeader: c.isLeader })));
      return row.id;
    });
  } else {
    if (shift.siteId === siteId && shift.date === date) return { ok: true };
    if (crew.some((c) => c.clockInAt)) return { ok: false, error: "Someone has clocked in on this shift, so it stays put. Hold Ctrl while dragging to copy it instead." };
    await db.update(schema.shifts).set({ siteId, date }).where(eq(schema.shifts.id, shiftId));
  }
  changed();
  return { ok: true, warning: await clashes([target]) };
}

/** Drop a cleaner on a shift; `fromShiftId` when they were dragged off another shift. */
export async function addToShift(input: { shiftId: number; staffId: number; fromShiftId?: number | null }): Promise<RosterResult> {
  await requireAdmin();
  const parsed = ids.extend({ fromShiftId: z.number().int().positive().nullish() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Couldn't add that person." };
  const { shiftId, staffId, fromShiftId } = parsed.data;
  if (fromShiftId === shiftId) return { ok: true };
  const db = await getDb();
  const a = schema.shiftAssignments;
  const [person] = await db.select({ active: schema.staff.active }).from(schema.staff).where(eq(schema.staff.id, staffId));
  if (!person?.active) return { ok: false, error: "That person is no longer active." };
  if (fromShiftId) {
    const [from] = await db.select().from(a).where(and(eq(a.shiftId, fromShiftId), eq(a.staffId, staffId)));
    if (from?.clockInAt) return { ok: false, error: "They've already clocked in on their shift, so they can't be moved off it." };
  }
  await db.transaction(async (tx) => {
    await tx.insert(a).values({ shiftId, staffId, isLeader: false }).onConflictDoNothing();
    if (fromShiftId) await tx.delete(a).where(and(eq(a.shiftId, fromShiftId), eq(a.staffId, staffId)));
  });
  changed();
  return { ok: true, warning: await clashes([shiftId]) };
}

/** Drag a cleaner off a shift (back to the team list). */
export async function removeFromShift(input: { shiftId: number; staffId: number }): Promise<RosterResult> {
  await requireAdmin();
  const parsed = ids.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Couldn't remove that person." };
  const db = await getDb();
  const a = schema.shiftAssignments;
  const where = and(eq(a.shiftId, parsed.data.shiftId), eq(a.staffId, parsed.data.staffId));
  const [row] = await db.select().from(a).where(where);
  if (row?.clockInAt) return { ok: false, error: "They've already clocked in, so they stay on the timesheet. Correct their clock times instead." };
  await db.delete(a).where(where);
  changed();
  return { ok: true };
}

/** Copies the previous week's shifts and crews into this week (skipping ones already there). */
export async function copyPreviousWeek(monday: string): Promise<RosterResult> {
  await requireAdmin();
  if (!isIsoDate(monday)) return { ok: false, error: "Bad week." };
  const db = await getDb();
  const from = addDays(monday, -7);
  const source = await db.select().from(schema.shifts).where(and(gte(schema.shifts.date, from), lte(schema.shifts.date, addDays(from, 6))));
  if (!source.length) return { ok: false, error: "Last week has no shifts to copy." };
  const existing = await db.select().from(schema.shifts).where(and(gte(schema.shifts.date, monday), lte(schema.shifts.date, addDays(monday, 6))));
  const crews = await db.select().from(schema.shiftAssignments).where(inArray(schema.shiftAssignments.shiftId, source.map((s) => s.id)));

  let copied = 0;
  await db.transaction(async (tx) => {
    for (const s of source) {
      const date = addDays(s.date, 7);
      if (existing.some((e) => e.siteId === s.siteId && e.date === date && e.start === s.start)) continue;
      const [row] = await tx
        .insert(schema.shifts)
        .values({ siteId: s.siteId, date, start: s.start, end: s.end, label: s.label, headcount: s.headcount, notes: s.notes })
        .returning({ id: schema.shifts.id });
      const people = crews.filter((c) => c.shiftId === s.id);
      if (people.length) await tx.insert(schema.shiftAssignments).values(people.map((p) => ({ shiftId: row.id, staffId: p.staffId, isLeader: p.isLeader })));
      copied++;
    }
  });
  revalidatePath("/admin", "layout");
  revalidatePath("/staff", "layout");
  return copied ? { ok: true, warning: `${copied} shift${copied === 1 ? "" : "s"} copied from last week. Check for leave before publishing.` } : { ok: false, error: "Every shift from last week is already in this week." };
}

/** The office corrects a forgotten clock-in/out ("YYYY-MM-DDTHH:MM" in Mauritius time, or empty). */
export async function correctClock(input: { shiftId: number; staffId: number; clockIn: string; clockOut: string }): Promise<RosterResult> {
  await requireAdmin();
  const local = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)]);
  const parsed = z.object({ shiftId: z.number().int().positive(), staffId: z.number().int().positive(), clockIn: local, clockOut: local }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the times." };
  const toDate = (v: string) => (v ? new Date(`${v}:00+04:00`) : null);
  const clockInAt = toDate(parsed.data.clockIn);
  const clockOutAt = toDate(parsed.data.clockOut);
  if (clockOutAt && !clockInAt) return { ok: false, error: "Add the clock-in time too." };
  if (clockInAt && clockOutAt && clockOutAt <= clockInAt) return { ok: false, error: "Clock-out must be after clock-in." };
  const db = await getDb();
  await db
    .update(schema.shiftAssignments)
    .set({ clockInAt, clockOutAt })
    .where(and(eq(schema.shiftAssignments.shiftId, parsed.data.shiftId), eq(schema.shiftAssignments.staffId, parsed.data.staffId)));
  revalidatePath("/admin", "layout");
  revalidatePath("/staff", "layout");
  return { ok: true };
}

/** "Aisha is also on Hotel X 07:00 and job CP-ABC123": warnings only, the manager decides. */
async function clashes(shiftIds: number[]) {
  const db = await getDb();
  const mine = await db
    .select({ shift: schema.shifts, staffId: schema.shiftAssignments.staffId, name: schema.staff.name })
    .from(schema.shiftAssignments)
    .innerJoin(schema.shifts, eq(schema.shiftAssignments.shiftId, schema.shifts.id))
    .innerJoin(schema.staff, eq(schema.shiftAssignments.staffId, schema.staff.id))
    .where(inArray(schema.shiftAssignments.shiftId, shiftIds));
  if (!mine.length) return undefined;

  const people = [...new Set(mine.map((m) => m.staffId))];
  const dates = mine.map((m) => m.shift.date).sort();
  const from = addDays(dates[0], -1);
  const to = addDays(dates[dates.length - 1], 1);
  const [otherShifts, jobs] = await Promise.all([
    db
      .select({ shift: schema.shifts, staffId: schema.shiftAssignments.staffId, site: schema.sites.name })
      .from(schema.shiftAssignments)
      .innerJoin(schema.shifts, eq(schema.shiftAssignments.shiftId, schema.shifts.id))
      .innerJoin(schema.sites, eq(schema.shifts.siteId, schema.sites.id))
      .where(and(inArray(schema.shiftAssignments.staffId, people), gte(schema.shifts.date, from), lte(schema.shifts.date, to))),
    db
      .select({ booking: schema.bookings, staffId: schema.bookingAssignments.staffId })
      .from(schema.bookingAssignments)
      .innerJoin(schema.bookings, eq(schema.bookingAssignments.bookingId, schema.bookings.id))
      .where(and(inArray(schema.bookingAssignments.staffId, people), ne(schema.bookings.status, "cancelled"), gte(schema.bookings.date, from), lte(schema.bookings.date, to))),
  ]);

  const notes = new Set<string>();
  for (const m of mine) {
    const w = shiftWindow(m.shift.date, m.shift.start, m.shift.end);
    for (const o of otherShifts) {
      if (o.staffId !== m.staffId || o.shift.id === m.shift.id) continue;
      if (overlaps(w, shiftWindow(o.shift.date, o.shift.start, o.shift.end))) notes.add(`${m.name} is also on ${o.site} ${o.shift.start} (${o.shift.date})`);
    }
    for (const j of jobs) {
      if (j.staffId !== m.staffId) continue;
      const from = Date.parse(`${j.booking.date}T${j.booking.timeSlot}:00+04:00`);
      if (overlaps(w, { from, to: from + jobMinutes(j.booking) * 60_000 })) notes.add(`${m.name} has job ${j.booking.ref} at ${j.booking.timeSlot} (${j.booking.date})`);
    }
  }
  return notes.size ? `Overlap: ${[...notes].slice(0, 4).join("; ")}${notes.size > 4 ? "…" : ""}.` : undefined;
}
