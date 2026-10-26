"use server";

import { z } from "zod";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { STAFF_COLORS } from "@/lib/schedule";

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
  await db.update(schema.staff).set({ name, phone: phone || null, active }).where(eq(schema.staff.id, id));
  revalidatePath("/admin", "layout");
}
