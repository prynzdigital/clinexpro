"use server";

import { z } from "zod";
import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { ROLES, requireOwner } from "@/lib/auth";
import { hashPassword, temporaryPassword } from "@/lib/passwords";

// Owner-only. Every change that affects someone's access bumps their
// sessionVersion, which signs them out everywhere on their next click.

/** Shown once to the owner, who passes it on; the member must change it at first sign-in. */
export type TeamState = { status: "idle" | "done" | "error"; message?: string; password?: string; values?: Record<string, string> };

const NewMember = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  role: z.enum(ROLES),
});

export async function addMember(_prev: TeamState, formData: FormData): Promise<TeamState> {
  await requireOwner();
  const values = { name: String(formData.get("name") ?? ""), email: String(formData.get("email") ?? ""), role: String(formData.get("role") ?? "manager") };
  const parsed = NewMember.safeParse(values);
  if (!parsed.success) return { status: "error", message: "Enter a name and a valid email.", values };

  const email = parsed.data.email.toLowerCase();
  const password = temporaryPassword();
  const db = await getDb();
  const [created] = await db
    .insert(schema.adminUsers)
    .values({ name: parsed.data.name, email, role: parsed.data.role, passwordHash: await hashPassword(password), mustChangePassword: true })
    .onConflictDoNothing({ target: schema.adminUsers.email })
    .returning({ id: schema.adminUsers.id });
  if (!created) return { status: "error", message: "Someone on the team already uses that email.", values };

  revalidatePath("/admin/team");
  return { status: "done", message: `${parsed.data.name} can now sign in as ${email}.`, password };
}

const memberId = z.coerce.number().int().positive();

export async function resetPassword(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const session = await requireOwner();
  const id = memberId.parse(formData.get("id"));
  if (id === session.uid) return { status: "error", message: "Use My account to change your own password." };

  const password = temporaryPassword();
  const db = await getDb();
  const [member] = await db
    .update(schema.adminUsers)
    .set({ passwordHash: await hashPassword(password), mustChangePassword: true, sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` })
    .where(eq(schema.adminUsers.id, id))
    .returning({ name: schema.adminUsers.name });
  if (!member) return { status: "error", message: "That team member no longer exists." };

  revalidatePath("/admin/team");
  return { status: "done", message: `New temporary password for ${member.name}. They have been signed out.`, password };
}

export async function updateMember(_prev: TeamState, formData: FormData): Promise<TeamState> {
  const session = await requireOwner();
  const input = z
    .object({ id: memberId, role: z.enum(ROLES), active: z.enum(["true", "false"]).transform((v) => v === "true") })
    .safeParse(Object.fromEntries(formData));
  if (!input.success) return { status: "error", message: "Something went wrong. Reload and try again." };
  const { id, role, active } = input.data;
  if (id === session.uid) return { status: "error", message: "You can't change your own role or access." };

  const db = await getDb();
  // Keep at least one active owner, or nobody could manage the team.
  if (role !== "owner" || !active) {
    const [{ others }] = await db
      .select({ others: sql<number>`count(*)::int` })
      .from(schema.adminUsers)
      .where(and(eq(schema.adminUsers.role, "owner"), eq(schema.adminUsers.active, true), ne(schema.adminUsers.id, id)));
    if (others === 0) return { status: "error", message: "There must always be at least one active owner." };
  }

  const [member] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).limit(1);
  if (!member) return { status: "error", message: "That team member no longer exists." };
  if (member.role === role && member.active === active) return { status: "idle" };

  await db
    .update(schema.adminUsers)
    .set({ role, active, sessionVersion: sql`${schema.adminUsers.sessionVersion} + 1` })
    .where(eq(schema.adminUsers.id, id));
  revalidatePath("/admin/team");
  return { status: "done", message: active ? `${member.name} is now ${role === "owner" ? "an owner" : "a manager"}.` : `${member.name} no longer has access and has been signed out.` };
}
