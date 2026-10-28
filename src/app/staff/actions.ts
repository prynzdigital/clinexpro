"use server";

import { z } from "zod";
import { and, eq, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { mauritiusDate } from "@/lib/dates";
import { endStaffSession, requireStaff } from "@/lib/staff-auth";
import { CLOCK_IN_EARLY_MINUTES, shiftWindow } from "@/lib/roster";

const bookingId = z.coerce.number().int().positive();

/** The signed-in cleaner's place on a job that happens today (not cancelled). */
async function myJobToday(staffId: number, id: number) {
  const db = await getDb();
  const { bookings: b, bookingAssignments: a } = schema;
  const [row] = await db
    .select({ assignment: a })
    .from(a)
    .innerJoin(b, eq(a.bookingId, b.id))
    .where(and(eq(a.bookingId, id), eq(a.staffId, staffId), eq(b.date, mauritiusDate()), ne(b.status, "cancelled")))
    .limit(1);
  return row?.assignment;
}

export async function checkIn(formData: FormData) {
  const me = await requireStaff();
  const id = bookingId.safeParse(formData.get("bookingId"));
  if (!id.success) return;
  if (!(await myJobToday(me.id, id.data))) return;
  const db = await getDb();
  const { bookingAssignments: a } = schema;
  await db
    .update(a)
    .set({ checkedInAt: new Date() })
    .where(and(eq(a.bookingId, id.data), eq(a.staffId, me.id), isNull(a.checkedInAt)));
  revalidatePath("/staff", "layout");
  revalidatePath("/admin", "layout");
}

export async function checkOut(formData: FormData) {
  const me = await requireStaff();
  const input = z
    .object({ bookingId, report: z.string().trim().max(2000).optional() })
    .safeParse(Object.fromEntries(formData));
  if (!input.success) return;
  const job = await myJobToday(me.id, input.data.bookingId);
  if (!job?.checkedInAt || job.checkedOutAt) return;

  const db = await getDb();
  const { bookingAssignments: a, bookings: b } = schema;
  await db.transaction(async (tx) => {
    await tx
      .update(a)
      .set({ checkedOutAt: new Date(), report: input.data.report || null })
      .where(and(eq(a.bookingId, job.bookingId), eq(a.staffId, me.id)));
    // When the whole team has finished, the job is done.
    const team = await tx.select({ out: a.checkedOutAt }).from(a).where(eq(a.bookingId, job.bookingId));
    if (team.every((t) => t.out)) {
      await tx.update(b).set({ status: "completed" }).where(and(eq(b.id, job.bookingId), ne(b.status, "cancelled")));
    }
  });
  revalidatePath("/staff", "layout");
  revalidatePath("/admin", "layout");
}

const shiftId = z.coerce.number().int().positive();

/** The signed-in person's place on a shift. */
async function myShift(staffId: number, id: number) {
  const db = await getDb();
  const { shifts: sh, shiftAssignments: a } = schema;
  const [row] = await db
    .select({ shift: sh, me: a })
    .from(a)
    .innerJoin(sh, eq(a.shiftId, sh.id))
    .where(and(eq(a.shiftId, id), eq(a.staffId, staffId)))
    .limit(1);
  return row;
}

/** Clock in: from an hour before the shift starts until its planned end. */
export async function clockIn(formData: FormData) {
  const me = await requireStaff();
  const id = shiftId.safeParse(formData.get("shiftId"));
  if (!id.success) return;
  const row = await myShift(me.id, id.data);
  if (!row || row.me.clockInAt) return;
  const { from, to } = shiftWindow(row.shift.date, row.shift.start, row.shift.end);
  const now = Date.now();
  if (now < from - CLOCK_IN_EARLY_MINUTES * 60_000 || now > to) return;
  const db = await getDb();
  await db
    .update(schema.shiftAssignments)
    .set({ clockInAt: new Date() })
    .where(and(eq(schema.shiftAssignments.shiftId, id.data), eq(schema.shiftAssignments.staffId, me.id), isNull(schema.shiftAssignments.clockInAt)));
  revalidatePath("/staff", "layout");
  revalidatePath("/admin", "layout");
}

export async function clockOut(formData: FormData) {
  const me = await requireStaff();
  const id = shiftId.safeParse(formData.get("shiftId"));
  if (!id.success) return;
  const row = await myShift(me.id, id.data);
  if (!row?.me.clockInAt || row.me.clockOutAt) return;
  const db = await getDb();
  await db
    .update(schema.shiftAssignments)
    .set({ clockOutAt: new Date() })
    .where(and(eq(schema.shiftAssignments.shiftId, id.data), eq(schema.shiftAssignments.staffId, me.id)));
  revalidatePath("/staff", "layout");
  revalidatePath("/admin", "layout");
}

export async function staffLogout() {
  await endStaffSession();
  redirect("/staff/login");
}
