"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { endSession, requireAdmin } from "@/lib/auth";

const id = z.coerce.number().int().positive();

export async function updateBooking(formData: FormData) {
  await requireAdmin();
  const input = z
    .object({
      id,
      status: z.enum(schema.bookingStatus.enumValues),
      paymentStatus: z.enum(schema.paymentStatus.enumValues),
    })
    .parse(Object.fromEntries(formData));
  const db = await getDb();
  await db
    .update(schema.bookings)
    .set({ status: input.status, paymentStatus: input.paymentStatus })
    .where(eq(schema.bookings.id, input.id));
  revalidatePath("/admin", "layout");
}

export async function updateCustomerNotes(formData: FormData) {
  await requireAdmin();
  const input = z.object({ id, notes: z.string().max(5000) }).parse(Object.fromEntries(formData));
  const db = await getDb();
  await db.update(schema.customers).set({ notes: input.notes || null }).where(eq(schema.customers.id, input.id));
  revalidatePath(`/admin/customers/${input.id}`);
}

export async function updateLeadStatus(formData: FormData) {
  await requireAdmin();
  const input = z.object({ id, status: z.enum(schema.leadStatus.enumValues) }).parse(Object.fromEntries(formData));
  const db = await getDb();
  await db.update(schema.leads).set({ status: input.status }).where(eq(schema.leads.id, input.id));
  revalidatePath("/admin", "layout");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}
