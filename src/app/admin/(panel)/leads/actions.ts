"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { isIsoDate } from "@/lib/schedule";
import { getService } from "@/content/services";
import { SECTORS } from "./options";

export type LeadFormState = { status: "idle" | "error"; message?: string; values?: Record<string, string> };

const Lead = z.object({
  id: z.coerce.number().int().positive().optional(),
  company: z.string().trim().min(2, "Enter the company or client name").max(160),
  contactName: z.string().trim().min(2, "Enter a contact name").max(120),
  phone: z.string().trim().min(7, "Enter a phone number").max(30),
  email: z.email("That email doesn't look right").max(200),
  sector: z.enum(SECTORS),
  town: z.string().trim().max(80),
  address: z.string().trim().max(300),
  service: z.union([z.literal(""), z.string().refine((s) => Boolean(getService(s)))]),
  preferredDate: z.union([z.literal(""), z.string().refine(isIsoDate, "Pick a valid date")]),
  status: z.enum(schema.leadStatus.enumValues),
  message: z.string().trim().max(2000),
});

export async function saveLead(_prev: LeadFormState, formData: FormData): Promise<LeadFormState> {
  await requireAdmin();
  const values = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = Lead.safeParse(values);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message, values };
  const { id, email, town, address, service, preferredDate, message, ...rest } = parsed.data;
  const row = {
    ...rest,
    email: email.toLowerCase(),
    town: town || null,
    address: address || null,
    service: service || null,
    preferredDate: preferredDate || null,
    message: message || null,
  };
  const db = await getDb();
  if (id) {
    const [updated] = await db.update(schema.leads).set(row).where(eq(schema.leads.id, id)).returning({ id: schema.leads.id });
    if (!updated) return { status: "error", message: "This lead no longer exists.", values };
  } else {
    await db.insert(schema.leads).values({ ...row, source: "office" });
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/leads?saved=1`);
}

export async function deleteLead(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return;
  const db = await getDb();
  await db.delete(schema.leads).where(eq(schema.leads.id, id.data));
  revalidatePath("/admin", "layout");
  if (formData.get("from") === "detail") redirect("/admin/leads?deleted=1");
}

/** Turns a won enquiry into a customer (or finds the one with the same email) and opens their page. */
export async function convertLead(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) return;
  const db = await getDb();
  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id.data));
  if (!lead) return;
  const email = lead.email.toLowerCase();
  const [existing] = await db.select({ id: schema.customers.id }).from(schema.customers).where(eq(schema.customers.email, email));
  const customerId =
    existing?.id ??
    (
      await db
        .insert(schema.customers)
        .values({
          name: lead.company === lead.contactName ? lead.contactName : `${lead.company} (${lead.contactName})`,
          email,
          phone: lead.phone,
          address: lead.address,
          notes: lead.message,
        })
        .returning({ id: schema.customers.id })
    )[0].id;
  await db.update(schema.leads).set({ status: "won" }).where(eq(schema.leads.id, lead.id));
  revalidatePath("/admin", "layout");
  redirect(`/admin/customers/${customerId}?saved=1`);
}
