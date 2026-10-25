import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AVIF first (smaller), WebP for browsers without AVIF support.
  images: { formats: ["image/avif", "image/webp"] },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Keep rankings from the old WordPress URLs.
  async redirects() {
    return [
      { source: "/quotation", destination: "/en/book", permanent: true },
      { source: "/our-services", destination: "/en/services", permanent: true },
      { source: "/about-us", destination: "/en/about", permanent: true },
      { source: "/contacts", destination: "/en/contact", permanent: true },
    ];
  },
};

export default nextConfig;
