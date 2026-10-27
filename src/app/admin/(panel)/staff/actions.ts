"use server";

import { z } from "zod";
import { and, count, eq, isNotNull, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { STAFF_COLORS } from "@/lib/schedule";
import { hashPassword } from "@/lib/passwords";
import { toE164Digits } from "@/lib/notify/channels";

const Person = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
});

// The form's own `required`/`minLength` stop bad input in the browser; anything
// that still fails here is ignored rather than shown.

export async function addStaff(formData: FormData) {
  await requireAdmin();
  const input = Person.safeParse(Object.fromEntries(formData));
  if (!input.success) return;
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.staff);
  await db.insert(schema.staff).values({
    name: input.data.name,
    phone: input.data.phone || null,
    color: STAFF_COLORS[n % STAFF_COLORS.length],
  });
  revalidatePath("/admin", "layout");
}

export async function updateStaff(formData: FormData) {
  await requireAdmin();
  const input = Person.extend({
    id: z.coerce.number().int().positive(),
    active: z.enum(["true", "false"]).transform((v) => v === "true"),
  }).safeParse(Object.fromEntries(formData));
  if (!input.success) return;
  const { id, name, phone, active } = input.data;
  const db = await getDb();
  const [before] = await db.select({ active: schema.staff.active }).from(schema.staff).where(eq(schema.staff.id, id));
  await db
    .update(schema.staff)
    .set({
      name,
      phone: phone || null,
      active,
      // Deactivating signs their phone out of the staff app straight away.
      ...(before?.active && !active && { sessionVersion: sql`${schema.staff.sessionVersion} + 1` }),
    })
    .where(eq(schema.staff.id, id));
  revalidatePath("/admin", "layout");
}

export type PinState = { status: "idle" | "done" | "error"; message?: string; pin?: string };

/** Gives a cleaner staff-app access (or a new PIN). The PIN is shown once to the admin. */
export async function setPin(_prev: PinState, formData: FormData): Promise<PinState> {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return { status: "error", message: "Reload and try again." };

  const db = await getDb();
  const [person] = await db.select().from(schema.staff).where(eq(schema.staff.id, id.data));
  if (!person?.active) return { status: "error", message: "Only active staff can use the app." };
  const phone = person.phone && toE164Digits(person.phone);
  if (!phone) return { status: "error", message: "Add their mobile number first (and save); they sign in with it." };

  // Phone numbers are the sign-in name, so two people with app access can't share one.
  const others = await db
    .select({ phone: schema.staff.phone, name: schema.staff.name })
    .from(schema.staff)
    .where(and(ne(schema.staff.id, person.id), isNotNull(schema.staff.pinHash)));
  const clash = others.find((o) => o.phone && toE164Digits(o.phone) === phone);
  if (clash) return { status: "error", message: `${clash.name} already signs in with this number.` };

  const pin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  await db
    .update(schema.staff)
    .set({
      pinHash: await hashPassword(pin),
      failedPinAttempts: 0,
      pinLockedUntil: null,
      sessionVersion: sql`${schema.staff.sessionVersion} + 1`,
    })
    .where(eq(schema.staff.id, person.id));
  revalidatePath("/admin/staff");
  return { status: "done", message: `${person.name} signs in at /staff with ${person.phone} and this PIN:`, pin };
}

export async function removeAppAccess(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return;
  const db = await getDb();
  await db
    .update(schema.staff)
    .set({ pinHash: null, sessionVersion: sql`${schema.staff.sessionVersion} + 1` })
    .where(eq(schema.staff.id, id.data));
  revalidatePath("/admin/staff");
}

/** Only people never put on a job; anyone with job history is set to Inactive instead. */
export async function deleteStaff(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return;
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.bookingAssignments).where(eq(schema.bookingAssignments.staffId, id.data));
  if (n) return;
  await db.delete(schema.staff).where(eq(schema.staff.id, id.data));
  revalidatePath("/admin", "layout");
}
