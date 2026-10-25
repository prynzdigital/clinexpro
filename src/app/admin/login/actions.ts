"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { startSession } from "@/lib/auth";

// Compared against when the email is unknown, so timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser", 12);

export type LoginState = { error: string; email: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const db = await getDb();
  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)).limit(1);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  // The email is returned so the form can keep it; the password never is.
  if (!user || !ok) return { error: "Incorrect email or password.", email };

  await startSession({ uid: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/admin");
}
