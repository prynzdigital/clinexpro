"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { bookingRef } from "@/lib/booking-ref";
import { DEPOSIT_RATE } from "@/lib/pricing";
import { isIsoDate } from "@/lib/schedule";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import { bookingDeleteBlocker } from "./queries";

export type BookingFormState = { status: "idle" | "error"; message?: string; values?: Record<string, string> };

const optionalEmail = z.union([z.email().max(200), z.literal("")]);

const Fields = z.object({
  id: z.coerce.number().int().positive().optional(),
  customerMode: z.enum(["existing", "new"]).optional(),
  customerId: z.coerce.number().int().positive().optional(),
  newName: z.string().trim().max(120).optional(),
  newPhone: z.string().trim().max(30).optional(),
  newEmail: optionalEmail.optional(),
  service: z.string().refine((s) => Boolean(getService(s)), "Pick a service"),
  frequency: z.enum(schema.frequency.enumValues),
  date: z.string().refine(isIsoDate, "Pick a date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time"),
  address: z.string().trim().min(5, "Enter the address").max(300),
  town: z.string().refine((t) => Boolean(getTown(t)), "Pick a town"),
  price: z.coerce.number().int("Whole rupees only").min(0).max(1_000_000),
  deposit: z.union([z.literal(""), z.coerce.number().int().min(0).max(1_000_000)]),
  status: z.enum(schema.bookingStatus.enumValues),
  paymentStatus: z.enum(schema.paymentStatus.enumValues),
  notes: z.string().trim().max(1000),
});

const fail = (message: string, formData: FormData): BookingFormState => ({
  status: "error",
  message,
  values: Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>,
});

/** Create (no id) or update a booking from the admin form. */
export async function saveBooking(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  await requireAdmin();
  const parsed = Fields.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(parsed.error.issues[0].message, formData);
  const f = parsed.data;
  if (f.deposit !== "" && f.deposit > f.price) return fail("The deposit can't be more than the price.", formData);
  const depositMur = f.deposit === "" ? Math.round((f.price * DEPOSIT_RATE) / 50) * 50 : f.deposit;

  const db = await getDb();
  const fields = {
    service: f.service,
    frequency: f.frequency,
    date: f.date,
    timeSlot: f.time,
    address: f.address,
    town: f.town,
    estimateMur: f.price,
    depositMur,
    status: f.status,
    paymentStatus: f.paymentStatus,
    notes: f.notes || null,
  };

  if (f.id) {
    const [updated] = await db.update(schema.bookings).set(fields).where(eq(schema.bookings.id, f.id)).returning({ id: schema.bookings.id });
    if (!updated) return fail("This booking no longer exists.", formData);
    revalidatePath("/admin", "layout");
    redirect(`/admin/bookings/${f.id}?saved=1`);
  }

  // New booking: an existing customer, or a new one typed in.
  let customerId = f.customerId;
  if (f.customerMode === "new") {
    if (!f.newName || f.newName.length < 2) return fail("Enter the new customer's name.", formData);
    if (!f.newPhone || f.newPhone.replace(/\D/g, "").length < 7) return fail("Enter the new customer's phone number.", formData);
    const email = f.newEmail ? f.newEmail.toLowerCase() : null;
    if (email) {
      const [taken] = await db.select({ id: schema.customers.id }).from(schema.customers).where(eq(schema.customers.email, email));
      if (taken) return fail("A customer with this email already exists. Choose them from the list instead.", formData);
    }
    const [created] = await db
      .insert(schema.customers)
      .values({ name: f.newName, phone: f.newPhone, email, address: f.address, town: f.town })
      .returning({ id: schema.customers.id });
    customerId = created.id;
  }
  if (!customerId) return fail("Choose a customer.", formData);

  const [booking] = await db
    .insert(schema.bookings)
    .values({ ...fields, ref: bookingRef(), customerId, details: {} })
    .returning({ id: schema.bookings.id });
  revalidatePath("/admin", "layout");
  redirect(`/admin/bookings/${booking.id}?saved=1`);
}

/**
 * Deletes a booking that has no invoice and no payment on record. Anything with
 * money attached must be kept for the accounts: cancel it instead.
 */
export async function deleteBooking(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return;
  if (await bookingDeleteBlocker(id.data)) return;
  const db = await getDb();
  await db.delete(schema.bookings).where(eq(schema.bookings.id, id.data));
  revalidatePath("/admin", "layout");
  if (formData.get("from") === "detail") redirect("/admin/bookings?deleted=1");
}
