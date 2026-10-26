import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import type { AdminUser } from "@/db/schema";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, verifySessionToken } from "./session-token";

export const ROLES = ["owner", "manager"] as const;
export type Role = (typeof ROLES)[number];

export async function startSession(user: Pick<AdminUser, "id" | "email" | "name" | "role" | "sessionVersion">) {
  const token = await createSessionToken({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    ver: user.sessionVersion,
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * Use in every admin page and action; redirects to login when the session is
 * missing. Also checks the account is still active and the session hasn't
 * been revoked (password change, reset, role change or deactivation), so
 * those take effect on the very next request rather than when the cookie expires.
 */
export const requireAdmin = cache(async () => {
  const token = await verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!token) redirect("/admin/login");
  const db = await getDb();
  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, token.uid)).limit(1);
  if (!user || !user.active || user.sessionVersion !== token.ver) redirect("/admin/login");
  return {
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    mustChangePassword: user.mustChangePassword,
  };
});

/** Team and settings pages: owners only. Managers are sent to the overview. */
export async function requireOwner() {
  const session = await requireAdmin();
  if (session.role !== "owner") redirect("/admin");
  return session;
}
