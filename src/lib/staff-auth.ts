import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { STAFF_COOKIE, STAFF_SESSION_TTL_SECONDS, createStaffToken, verifyStaffToken } from "./session-token";

export type StaffLang = "en" | "fr";
export const STAFF_LANG_COOKIE = "clinex_staff_lang";
export const staffLang = (v: string | null | undefined): StaffLang => (v === "fr" ? "fr" : "en");

export async function startStaffSession(person: { id: number; sessionVersion: number }) {
  (await cookies()).set(STAFF_COOKIE, await createStaffToken({ sid: person.id, ver: person.sessionVersion }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_SESSION_TTL_SECONDS,
  });
}

/** The language chosen on this phone before sign-in (cookie), else the browser's. */
export async function deviceStaffLang(): Promise<StaffLang> {
  const saved = (await cookies()).get(STAFF_LANG_COOKIE)?.value;
  if (saved === "en" || saved === "fr") return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*fr\b/i.test(accept) ? "fr" : "en";
}

export async function rememberStaffLang(lang: StaffLang) {
  (await cookies()).set(STAFF_LANG_COOKIE, lang, { path: "/staff", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

export async function endStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}

/** Use in every staff-app page and action. Checks the person is still active with app access. */
export const requireStaff = cache(async () => {
  const token = await verifyStaffToken((await cookies()).get(STAFF_COOKIE)?.value);
  if (!token) redirect("/staff/login");
  const db = await getDb();
  const [person] = await db.select().from(schema.staff).where(eq(schema.staff.id, token.sid)).limit(1);
  if (!person || !person.active || !person.pinHash || person.sessionVersion !== token.ver) redirect("/staff/login");
  return { id: person.id, name: person.name, color: person.color, phone: person.phone, lang: staffLang(person.lang) };
});
