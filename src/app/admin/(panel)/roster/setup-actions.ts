"use server";

import { z } from "zod";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { SITE_COLORS } from "@/lib/roster";
import { getTown } from "@/content/towns";

// Sites (contract locations) and saved crews.

export type SetupState = { status: "idle" | "saved" | "error"; message?: string };

const Site = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2, "Give the site a name").max(120),
  customerId: z.union([z.literal(""), z.coerce.number().int().positive()]),
  address: z.string().trim().max(300),
  town: z.union([z.literal(""), z.string().refine((t) => Boolean(getTown(t)), "Pick a town")]),
  instructions: z.string().trim().max(2000),
  active: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function saveSite(_prev: SetupState, formData: FormData): Promise<SetupState> {
  await requireAdmin();
  const parsed = Site.safeParse({ active: "true", ...Object.fromEntries(formData) });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const { id, customerId, address, town, instructions, ...rest } = parsed.data;
  const row = {
    ...rest,
    customerId: customerId === "" ? null : customerId,
    address: address || null,
    town: town || null,
    instructions: instructions || null,
  };
  const db = await getDb();
  if (id) {
    await db.update(schema.sites).set(row).where(eq(schema.sites.id, id));
  } else {
    const [{ n }] = await db.select({ n: count() }).from(schema.sites);
    await db.insert(schema.sites).values({ ...row, color: SITE_COLORS[n % SITE_COLORS.length] });
  }
  revalidatePath("/admin", "layout");
  return { status: "saved", message: id ? "Site saved." : `${row.name} added.` };
}

/** Sites with shifts on record are kept (set them inactive instead). */
export async function deleteSite(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return;
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(schema.shifts).where(eq(schema.shifts.siteId, id.data));
  if (n) return;
  await db.delete(schema.sites).where(eq(schema.sites.id, id.data));
  revalidatePath("/admin", "layout");
}

const Crew = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2, "Give the crew a name").max(80),
  leaderId: z.union([z.literal(""), z.coerce.number().int().positive()]),
});

export async function saveCrew(_prev: SetupState, formData: FormData): Promise<SetupState> {
  await requireAdmin();
  const parsed = Crew.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message };
  const members = [...new Set(formData.getAll("members").map(Number).filter((n) => Number.isInteger(n) && n > 0))];
  const leaderId = parsed.data.leaderId === "" ? null : parsed.data.leaderId;
  if (!members.length) return { status: "error", message: "Tick at least one person." };
  if (leaderId && !members.includes(leaderId)) members.push(leaderId);

  const db = await getDb();
  await db.transaction(async (tx) => {
    let crewId = parsed.data.id;
    if (crewId) {
      await tx.update(schema.crews).set({ name: parsed.data.name, leaderId }).where(eq(schema.crews.id, crewId));
      await tx.delete(schema.crewMembers).where(eq(schema.crewMembers.crewId, crewId));
    } else {
      crewId = (await tx.insert(schema.crews).values({ name: parsed.data.name, leaderId }).returning({ id: schema.crews.id }))[0].id;
    }
    await tx.insert(schema.crewMembers).values(members.map((staffId) => ({ crewId: crewId!, staffId })));
  });
  revalidatePath("/admin", "layout");
  return { status: "saved", message: parsed.data.id ? "Crew saved." : `${parsed.data.name} created.` };
}

export async function deleteCrew(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return;
  const db = await getDb();
  await db.delete(schema.crews).where(eq(schema.crews.id, id.data));
  revalidatePath("/admin", "layout");
}
