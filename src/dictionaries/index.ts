import type { Locale } from "@/lib/i18n";
import en from "./en";
import fr from "./fr";

const dictionaries = { en, fr };

export const getDictionary = (locale: Locale) => dictionaries[locale];
export type { Dictionary } from "./en";

/** Replaces {key} placeholders. */
export const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");
