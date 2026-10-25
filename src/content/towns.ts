import type { Localized } from "@/lib/i18n";

export type Town = { slug: string; name: string; region: Localized };

const north = { en: "the north", fr: "le Nord" };
const centre = { en: "the centre", fr: "le Centre" };
const west = { en: "the west coast", fr: "la côte Ouest" };
const south = { en: "the south-east", fr: "le Sud-Est" };

export const TOWNS: Town[] = [
  { slug: "port-louis", name: "Port Louis", region: { en: "the capital", fr: "la capitale" } },
  { slug: "ebene", name: "Ebène", region: centre },
  { slug: "quatre-bornes", name: "Quatre Bornes", region: centre },
  { slug: "rose-hill", name: "Rose Hill", region: centre },
  { slug: "curepipe", name: "Curepipe", region: centre },
  { slug: "vacoas-phoenix", name: "Vacoas-Phoenix", region: centre },
  { slug: "moka", name: "Moka", region: centre },
  { slug: "grand-baie", name: "Grand Baie", region: north },
  { slug: "pereybere", name: "Pereybère", region: north },
  { slug: "flic-en-flac", name: "Flic en Flac", region: west },
  { slug: "tamarin", name: "Tamarin", region: west },
  { slug: "mahebourg", name: "Mahébourg", region: south },
];

export const getTown = (slug: string) => TOWNS.find((t) => t.slug === slug);
