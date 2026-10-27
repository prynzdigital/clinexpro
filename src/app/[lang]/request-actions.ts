"use server";

import { z } from "zod";
import { after } from "next/server";
import { getDb, schema } from "@/db";
import { getService } from "@/content/services";
import { alertNewLead } from "@/lib/notify";
import { mauritiusDate } from "@/lib/dates";

const RequestInput = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().min(7).max(30),
  email: z.email().max(200),
  address: z.string().trim().min(5).max(300),
  service: z.string().max(60).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => d >= mauritiusDate(), "past")
    .optional()
    .or(z.literal("")),
  contactTime: z.enum(["morning", "midday", "afternoon"]),
  notes: z.string().trim().max(2000).optional(),
});

export type RequestState = {
  status: "idle" | "sent" | "error";
  fieldErrors?: string[];
  values?: Record<string, string>;
  /** For the conversion event only; never personal details. */
  service?: string;
};

/** What the visitor typed, sent back on errors so the form keeps it after React resets it. */
function typedValues(formData: FormData) {
  const values: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (k !== "website" && typeof v === "string") values[k] = v;
  });
  return values;
}

// Business services map onto the lead's sector; everything else is "other".
const SECTOR_BY_SERVICE: Record<string, "office" | "hotel"> = {
  "office-cleaning": "office",
  "hotel-hospitality": "hotel",
};

export async function createBookingRequest(_prev: RequestState, formData: FormData): Promise<RequestState> {
  // Honeypot field is invisible to people; bots that fill it get a silent "success".
  if (formData.get("website")) return { status: "sent" };
  const parsed = RequestInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.issues.map((i) => String(i.path[0])),
      values: typedValues(formData),
    };
  }
  const r = parsed.data;
  const service = r.service && getService(r.service) ? r.service : null;

  const db = await getDb();
  await db.insert(schema.leads).values({
    company: r.company || r.name,
    contactName: r.name,
    email: r.email.toLowerCase(),
    phone: r.phone,
    sector: (service && SECTOR_BY_SERVICE[service]) || "other",
    message: r.notes || null,
    address: r.address,
    service,
    preferredDate: r.startDate || null,
    contactTime: r.contactTime,
    source: "home-request",
  });

  after(() =>
    alertNewLead({
      kind: "request",
      company: r.company || r.name,
      contactName: r.name,
      email: r.email,
      phone: r.phone,
      summary: [
        `${service ? getService(service)!.name.en : "Service not specified"} · ${r.address}`,
        `Start ${r.startDate || "flexible"} · call in the ${r.contactTime}`,
        ...(r.notes ? [r.notes] : []),
      ],
    }),
  );
  return { status: "sent", service: service ?? undefined };
}
