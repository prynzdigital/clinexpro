"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { requireAdmin, startSession } from "@/lib/auth";
import { PASSWORD_MIN_LENGTH, checkPassword, hashPassword } from "@/lib/passwords";

export type PasswordState = { error?: string; fieldErrors?: ("current" | "next" | "confirm")[] };

export async function changePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const session = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < PASSWORD_MIN_LENGTH) {
    return { error: `Choose a password of at least ${PASSWORD_MIN_LENGTH} characters.`, fieldErrors: ["next"] };
  }
  if (next !== confirm) return { error: "The two new passwords don't match.", fieldErrors: ["confirm"] };
  if (next === current) return { error: "Choose a password different from the current one.", fieldErrors: ["next"] };

  const db = await getDb();
  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, session.uid)).limit(1);
  if (!(await checkPassword(current, user.passwordHash))) {
    return { error: "Your current password is incorrect.", fieldErrors: ["current"] };
  }

  // Signs out every other device, then keeps this one signed in with a fresh session.
  const [updated] = await db
    .update(schema.adminUsers)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false, sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` })
    .where(eq(schema.adminUsers.id, session.uid))
    .returning();
  await startSession(updated);
  redirect("/admin/account?changed=1");
}
