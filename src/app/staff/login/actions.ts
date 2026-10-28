"use server";

import { and, eq, isNotNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { checkPassword } from "@/lib/passwords";
import { STAFF_LANG_COOKIE, deviceStaffLang, rememberStaffLang, staffLang, startStaffSession } from "@/lib/staff-auth";
import { cookies } from "next/headers";
import { t } from "../i18n";
import { toE164Digits } from "@/lib/notify/channels";

const MAX_TRIES = 5;
const LOCK_MINUTES = 15;
// Compared against when the number is unknown, so timing doesn't reveal who has access.
const DUMMY_HASH = "$2b$12$J9juwAhENTnJ92b0Rthleuyh6g2rrXcFw280ctN6gafO1FaYUHwRi";

export type StaffLoginState = { error: string; phone: string };

/** EN/FR toggle on the sign-in screen (before we know who it is). */
export async function chooseLoginLang(formData: FormData) {
  await rememberStaffLang(staffLang(String(formData.get("lang"))));
  redirect("/staff/login");
}

export async function staffLogin(_prev: StaffLoginState, formData: FormData): Promise<StaffLoginState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").replace(/\D/g, "");
  const x = t(await deviceStaffLang()).login;
  const wrong = { error: x.wrong, phone };
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
    return { error: x.locked(minutes), phone };
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

  // A language picked on the sign-in screen wins; otherwise this phone follows the profile.
  const picked = (await cookies()).get(STAFF_LANG_COOKIE)?.value;
  const lang = picked ? staffLang(picked) : staffLang(person.lang);
  await db
    .update(schema.staff)
    .set({ failedPinAttempts: 0, pinLockedUntil: null, lastLoginAt: new Date(), lang })
    .where(eq(schema.staff.id, person.id));
  await rememberStaffLang(lang);
  await startStaffSession(person);
  redirect("/staff");
}
