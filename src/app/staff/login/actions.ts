"use server";

import { and, eq, isNotNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { checkPassword } from "@/lib/passwords";
import { startStaffSession } from "@/lib/staff-auth";
import { toE164Digits } from "@/lib/notify/channels";

const MAX_TRIES = 5;
const LOCK_MINUTES = 15;
// Compared against when the number is unknown, so timing doesn't reveal who has access.
const DUMMY_HASH = "$2b$12$J9juwAhENTnJ92b0Rthleuyh6g2rrXcFw280ctN6gafO1FaYUHwRi";

export type StaffLoginState = { error: string; phone: string };

export async function staffLogin(_prev: StaffLoginState, formData: FormData): Promise<StaffLoginState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").replace(/\D/g, "");
  const wrong = { error: "Wrong phone number or PIN.", phone };
  const digits = toE164Digits(phone);

  const db = await getDb();
  const candidates = digits
    ? await db
        .select()
        .from(schema.staff)
        .where(and(eq(schema.staff.active, true), isNotNull(schema.staff.pinHash)))
    : [];
  const person = candidates.find((p) => p.phone && toE164Digits(p.phone) === digits);

  if (person?.pinLockedUntil && person.pinLockedUntil > new Date()) {
    const minutes = Math.ceil((person.pinLockedUntil.getTime() - Date.now()) / 60000);
    return { error: `Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}, or ask the office for a new PIN.`, phone };
  }

  const ok = await checkPassword(pin, person?.pinHash ?? DUMMY_HASH);
  if (!person || !ok) {
    if (person) {
      const tries = person.failedPinAttempts + 1;
      await db
        .update(schema.staff)
        .set(
          tries >= MAX_TRIES
            ? { failedPinAttempts: 0, pinLockedUntil: sql`now() + make_interval(mins => ${LOCK_MINUTES})` }
            : { failedPinAttempts: tries },
        )
        .where(eq(schema.staff.id, person.id));
    }
    return wrong;
  }

  await db
    .update(schema.staff)
    .set({ failedPinAttempts: 0, pinLockedUntil: null, lastLoginAt: new Date() })
    .where(eq(schema.staff.id, person.id));
  await startStaffSession(person);
  redirect("/staff");
}
