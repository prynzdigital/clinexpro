"use server";

import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getTown } from "@/content/towns";
import { customerDeleteBlocker } from "./queries";

export type CustomerFormState = { status: "idle" | "error"; message?: string; values?: Record<string, string> };

const Customer = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2, "Enter the customer's name").max(120),
  phone: z.string().trim().min(7, "Enter a phone number").max(30),
  email: z.union([z.email("That email doesn't look right").max(200), z.literal("")]),
  address: z.string().trim().max(300),
  town: z.union([z.literal(""), z.string().refine((t) => Boolean(getTown(t)), "Pick a town")]),
  lang: z.enum(["en", "fr"]),
  notes: z.string().trim().max(5000),
});

export async function saveCustomer(_prev: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  await requireAdmin();
  const values = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = Customer.safeParse(values);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0].message, values };
  const { id, email, address, town, notes, ...rest } = parsed.data;
  const row = { ...rest, email: email ? email.toLowerCase() : null, address: address || null, town: town || null, notes: notes || null };

  const db = await getDb();
  if (row.email) {
    const [taken] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(id ? and(eq(schema.customers.email, row.email), ne(schema.customers.id, id)) : eq(schema.customers.email, row.email));
    if (taken) return { status: "error", message: "Another customer already uses this email.", values };
  }

  let savedId = id;
  if (id) {
    const [updated] = await db.update(schema.customers).set(row).where(eq(schema.customers.id, id)).returning({ id: schema.customers.id });
    if (!updated) return { status: "error", message: "This customer no longer exists.", values };
  } else {
    const [created] = await db.insert(schema.customers).values(row).returning({ id: schema.customers.id });
    savedId = created.id;
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/customers/${savedId}?saved=1`);
}

/** Only customers with no bookings and no invoices; otherwise their history must stay. */
export async function deleteCustomer(formData: FormData) {
  await requireAdmin();
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success || (await customerDeleteBlocker(id.data))) return;
  const db = await getDb();
  await db.delete(schema.customers).where(eq(schema.customers.id, id.data));
  revalidatePath("/admin", "layout");
  if (formData.get("from") === "detail") redirect("/admin/customers?deleted=1");
}
