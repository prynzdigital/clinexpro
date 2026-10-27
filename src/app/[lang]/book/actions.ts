"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getDb, schema } from "@/db";
import { estimate, TIME_SLOTS } from "@/lib/pricing";
import { getTown } from "@/content/towns";
import { getService } from "@/content/services";
import { LOCALES } from "@/lib/i18n";
import { alertNewBooking } from "@/lib/notify";
import { bookingRef } from "@/lib/booking-ref";

const BookingInput = z.object({
  lang: z.enum(LOCALES),
  service: z.string(),
  values: z.record(z.string(), z.number().int()),
  addons: z.array(z.string()).max(10),
  frequency: z.enum(["once", "weekly", "fortnightly", "monthly"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.enum(TIME_SLOTS),
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().min(7).max(30),
  address: z.string().trim().min(5).max(300),
  town: z.string(),
  notes: z.string().trim().max(1000).optional(),
  consent: z.literal(true),
});

export type BookingInput = z.infer<typeof BookingInput>;
export type BookingResult = { ok: false; error: string } | undefined;

function bookableDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  const today = new Date();
  const tomorrow = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1);
  const limit = tomorrow + 90 * 864e5;
  return !Number.isNaN(d.getTime()) && d.getTime() >= tomorrow && d.getTime() <= limit && d.getUTCDay() !== 0;
}

export async function createBooking(raw: BookingInput): Promise<BookingResult> {
  const parsed = BookingInput.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const input = parsed.data;

  const town = getTown(input.town);
  const service = getService(input.service);
  if (!town || !service?.bookable || !bookableDate(input.date)) return { ok: false, error: "invalid" };

  // The server prices the job itself; the client figure is only a preview.
  const price = estimate(input);
  if (!price) return { ok: false, error: "invalid" };

  const db = await getDb();
  const email = input.email.toLowerCase();
  const [customer] = await db
    .insert(schema.customers)
    .values({ name: input.name, email, phone: input.phone, address: input.address, town: town.slug, lang: input.lang })
    // An existing customer is kept as-is: a public form must not overwrite
    // someone's record just by knowing their email. The booking keeps its own address.
    .onConflictDoUpdate({ target: schema.customers.email, set: { email } })
    .returning();

  const ref = bookingRef();
  const [booking] = await db.insert(schema.bookings).values({
    ref,
    customerId: customer.id,
    service: service.slug,
    details: { ...input.values, addons: input.addons },
    frequency: input.frequency,
    date: input.date,
    timeSlot: input.timeSlot,
    address: input.address,
    town: town.slug,
    notes: input.notes || null,
    estimateMur: price.totalMur,
    depositMur: price.depositMur,
  }).returning({ id: schema.bookings.id });

  // Sent after the response, so the visitor reaches the confirmation page at once.
  after(() =>
    alertNewBooking({
      id: booking.id,
      ref,
      lang: input.lang,
      service: service.name,
      date: input.date,
      timeSlot: input.timeSlot,
      town: town.name,
      address: input.address,
      name: input.name,
      email,
      phone: input.phone,
      notes: input.notes,
      totalMur: price.totalMur,
      depositMur: price.depositMur,
    }),
  );

  redirect(`/${input.lang}/book/confirmation?ref=${ref}`);
}
