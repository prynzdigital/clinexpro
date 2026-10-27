import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { STAFF_COOKIE, STAFF_SESSION_TTL_SECONDS, createStaffToken, verifyStaffToken } from "./session-token";

export async function startStaffSession(person: { id: number; sessionVersion: number }) {
  (await cookies()).set(STAFF_COOKIE, await createStaffToken({ sid: person.id, ver: person.sessionVersion }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: STAFF_SESSION_TTL_SECONDS,
  });
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
  return { id: person.id, name: person.name, color: person.color, phone: person.phone };
});
