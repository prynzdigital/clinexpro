import { schema } from "@/db";
import en from "@/dictionaries/en";
import { SERVICES } from "@/content/services";

export const SECTORS = ["office", "retail", "clinic", "hotel", "villa", "other"] as const;

const label = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " ");

/** Dropdown choices for the lead form. */
export const leadFormOptions = () => ({
  sectors: SECTORS.map((s) => ({ value: s, label: en.business.sectors[s] })),
  services: SERVICES.map((s) => ({ value: s.slug, label: s.name.en })),
  statuses: schema.leadStatus.enumValues.map((s) => ({ value: s, label: label(s) })),
});
