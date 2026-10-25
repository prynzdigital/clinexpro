import type { MetadataRoute } from "next";
import { LOCALES, SITE_URL } from "@/lib/i18n";
import { SERVICES } from "@/content/services";
import { TOWNS } from "@/content/towns";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/services",
    "/areas",
    "/book",
    "/business",
    "/about",
    "/contact",
    "/privacy",
    ...SERVICES.map((s) => `/services/${s.slug}`),
    ...TOWNS.map((t) => `/areas/${t.slug}`),
  ];
  return paths.flatMap((path) =>
    LOCALES.map((lang) => ({
      url: `${SITE_URL}/${lang}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path.startsWith("/services") || path === "/book" ? 0.8 : 0.6,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`])),
      },
    })),
  );
}
