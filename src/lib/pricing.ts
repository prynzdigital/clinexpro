// Pricing rules for the instant estimate. Shared by the booking form (live
// estimate) and the server (authoritative price on submit).
//
// PLACEHOLDER FIGURES — every MUR amount below must be confirmed with
// Clinex Pro in Phase 0 before launch.

export type Frequency = "once" | "weekly" | "fortnightly" | "monthly";

export type CountField = {
  key: string;
  kind: "count";
  min: number;
  max: number;
  default: number;
};

export type PricedService = {
  slug: string;
  fields: CountField[];
  addons: { key: string; priceMur: number }[];
  frequencies: Frequency[];
  minimumMur: number;
  price: (values: Record<string, number>) => number;
};

export const FREQUENCY_DISCOUNT: Record<Frequency, number> = {
  once: 0,
  weekly: 0.15,
  fortnightly: 0.1,
  monthly: 0.05,
};

export const DEPOSIT_RATE = 0.2;

const homeAddons = [
  { key: "oven", priceMur: 600 },
  { key: "fridge", priceMur: 500 },
  { key: "windows", priceMur: 800 },
  { key: "balcony", priceMur: 500 },
  { key: "ironing", priceMur: 400 },
];

export const PRICED_SERVICES: PricedService[] = [
  {
    slug: "home-cleaning",
    fields: [
      { key: "bedrooms", kind: "count", min: 1, max: 8, default: 2 },
      { key: "bathrooms", kind: "count", min: 1, max: 6, default: 1 },
    ],
    addons: homeAddons,
    frequencies: ["once", "weekly", "fortnightly", "monthly"],
    minimumMur: 1200,
    price: (v) => 1200 + 300 * (v.bedrooms - 1) + 250 * (v.bathrooms - 1),
  },
  {
    slug: "deep-cleaning",
    fields: [
      { key: "bedrooms", kind: "count", min: 1, max: 8, default: 2 },
      { key: "bathrooms", kind: "count", min: 1, max: 6, default: 1 },
    ],
    addons: homeAddons,
    frequencies: ["once"],
    minimumMur: 3500,
    price: (v) => 3500 + 900 * (v.bedrooms - 1) + 600 * (v.bathrooms - 1),
  },
  {
    slug: "maid-service",
    fields: [{ key: "hours", kind: "count", min: 3, max: 8, default: 4 }],
    addons: [{ key: "ironing", priceMur: 400 }],
    frequencies: ["weekly", "fortnightly", "monthly", "once"],
    minimumMur: 1050,
    price: (v) => 350 * v.hours,
  },
  {
    slug: "sofa-carpet",
    fields: [
      { key: "seats", kind: "count", min: 0, max: 15, default: 3 },
      { key: "carpets", kind: "count", min: 0, max: 8, default: 0 },
      { key: "mattresses", kind: "count", min: 0, max: 6, default: 0 },
    ],
    addons: [],
    frequencies: ["once"],
    minimumMur: 1500,
    price: (v) => 400 * v.seats + 600 * v.carpets + 700 * v.mattresses,
  },
  {
    slug: "pressure-washing",
    fields: [{ key: "area", kind: "count", min: 20, max: 1000, default: 60 }],
    addons: [],
    frequencies: ["once"],
    minimumMur: 2000,
    price: (v) => 45 * v.area,
  },
];

export function getPricedService(slug: string) {
  return PRICED_SERVICES.find((s) => s.slug === slug);
}

export type EstimateInput = {
  service: string;
  values: Record<string, number>;
  addons: string[];
  frequency: Frequency;
};

export type Estimate = {
  baseMur: number;
  addonsMur: number;
  discountMur: number;
  totalMur: number;
  depositMur: number;
};

const roundTo = (n: number, step: number) => Math.round(n / step) * step;

/** Returns null when the input doesn't match the service's rules. */
export function estimate(input: EstimateInput): Estimate | null {
  const svc = getPricedService(input.service);
  if (!svc || !svc.frequencies.includes(input.frequency)) return null;

  const values: Record<string, number> = {};
  for (const f of svc.fields) {
    const v = input.values[f.key];
    if (!Number.isInteger(v) || v < f.min || v > f.max) return null;
    values[f.key] = v;
  }

  const addonsMur = input.addons.reduce((sum, key) => {
    const addon = svc.addons.find((a) => a.key === key);
    return addon ? sum + addon.priceMur : NaN;
  }, 0);
  if (Number.isNaN(addonsMur)) return null;

  const baseMur = Math.max(svc.price(values), svc.minimumMur);
  const subtotal = baseMur + addonsMur;
  const discountMur = roundTo(subtotal * FREQUENCY_DISCOUNT[input.frequency], 10);
  const totalMur = subtotal - discountMur;
  return {
    baseMur,
    addonsMur,
    discountMur,
    totalMur,
    depositMur: roundTo(totalMur * DEPOSIT_RATE, 50),
  };
}

export const TIME_SLOTS = ["08:00", "10:00", "13:00", "15:00"] as const;

export function formatMur(n: number, locale: string) {
  return new Intl.NumberFormat(locale === "fr" ? "fr-MU" : "en-MU", {
    style: "currency",
    currency: "MUR",
    maximumFractionDigits: 0,
  }).format(n);
}
