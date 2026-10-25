import { BUSINESS } from "./business";

// The four service regions listed on clinexpro.net; every town belongs to one.
export type Region = (typeof BUSINESS.regions)[number];

export type Town = { slug: string; name: string; region: Region };

const [WEST_CENTRE, NORTH_EAST, MOKA_PORT_LOUIS, SOUTH_EAST] = BUSINESS.regions;

export const TOWNS: Town[] = [
  { slug: "port-louis", name: "Port Louis", region: MOKA_PORT_LOUIS },
  { slug: "moka", name: "Moka", region: MOKA_PORT_LOUIS },
  { slug: "ebene", name: "Ebène", region: WEST_CENTRE },
  { slug: "quatre-bornes", name: "Quatre Bornes", region: WEST_CENTRE },
  { slug: "rose-hill", name: "Rose Hill", region: WEST_CENTRE },
  { slug: "curepipe", name: "Curepipe", region: WEST_CENTRE },
  { slug: "vacoas-phoenix", name: "Vacoas-Phoenix", region: WEST_CENTRE },
  { slug: "flic-en-flac", name: "Flic en Flac", region: WEST_CENTRE },
  { slug: "tamarin", name: "Tamarin", region: WEST_CENTRE },
  { slug: "grand-baie", name: "Grand Baie", region: NORTH_EAST },
  { slug: "pereybere", name: "Pereybère", region: NORTH_EAST },
  { slug: "mahebourg", name: "Mahébourg", region: SOUTH_EAST },
];

export const getTown = (slug: string) => TOWNS.find((t) => t.slug === slug);
export const townsIn = (region: Region) => TOWNS.filter((t) => t.region === region);
