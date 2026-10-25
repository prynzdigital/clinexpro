"use server";

import { z } from "zod";
import { getDb, schema } from "@/db";
import { notifyTeam } from "@/lib/notify";

const LeadInput = z.object({
  company: z.string().trim().min(2).max(160),
  contactName: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  phone: z.string().trim().min(7).max(30),
  sector: z.enum(["office", "retail", "clinic", "hotel", "villa", "other"]),
  town: z.string().trim().max(80).optional(),
  message: z.string().trim().max(2000).optional(),
});

export type LeadState = { status: "idle" | "sent" | "error"; fieldErrors?: string[] };

export async function createLead(_prev: LeadState, formData: FormData): Promise<LeadState> {
  // Honeypot field is invisible to people; bots that fill it get a silent "success".
  if (formData.get("website")) return { status: "sent" };
  const parsed = LeadInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.issues.map((i) => String(i.path[0])) };
  }
  const lead = parsed.data;
  const db = await getDb();
  await db.insert(schema.leads).values({ ...lead, email: lead.email.toLowerCase() });
  await notifyTeam(`New business enquiry: ${lead.company}`, [
    `${lead.contactName} · ${lead.phone} · ${lead.email}`,
    `${lead.sector}${lead.town ? ` in ${lead.town}` : ""}`,
  ]);
  return { status: "sent" };
}
