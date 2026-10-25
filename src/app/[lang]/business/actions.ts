"use server";

import { z } from "zod";
import { after } from "next/server";
import { getDb, schema } from "@/db";
import { alertNewLead } from "@/lib/notify";

const LeadInput = z.object({
  company: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().min(7).max(30),
  sector: z.enum(["office", "retail", "clinic", "hotel", "villa", "other"]),
  town: z.string().trim().max(80).optional(),
  message: z.string().trim().max(2000).optional(),
});

export type LeadState = { status: "idle" | "sent" | "error"; fieldErrors?: string[]; values?: Record<string, string> };

/** What the visitor typed, sent back on errors so the form keeps it after React resets it. */
function typedValues(formData: FormData) {
  const values: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (k !== "website" && typeof v === "string") values[k] = v;
  });
  return values;
}

export async function createLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  // Honeypot field is invisible to people; bots that fill it get a silent "success".
  if (formData.get("website")) return { status: "sent" };
  const parsed = LeadInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.issues.map((i) => String(i.path[0])),
      values: typedValues(formData),
    };
  }
  const lead = parsed.data;
  const db = await getDb();
  await db.insert(schema.leads).values({ ...lead, email: lead.email.toLowerCase() });
  after(() =>
    alertNewLead({
      kind: "business",
      company: lead.company,
      contactName: lead.contactName,
      email: lead.email,
      phone: lead.phone,
      summary: [`${lead.sector}${lead.town ? ` in ${lead.town}` : ""}`, ...(lead.message ? [lead.message] : [])],
    }),
  );
  return { status: "sent" };
}
