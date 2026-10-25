import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clinex Pro — Cleaning Services",
    short_name: "Clinex Pro",
    description: "Book trusted cleaning services across Mauritius.",
    start_url: "/en?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#031432",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Book a cleaning", url: "/en/book?source=pwa" },
      { name: "Réserver", url: "/fr/book?source=pwa" },
    ],
  };
}
