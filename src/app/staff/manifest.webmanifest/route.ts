// The staff app's own install manifest (separate from the customer website's),
// scoped to /staff so it opens straight into the cleaner's jobs.
export const dynamic = "force-static";

export function GET() {
  const manifest = {
    id: "/staff",
    name: "Clinex Pro Staff",
    short_name: "Clinex Staff",
    description: "Your Clinex Pro jobs, directions and check-in.",
    start_url: "/staff?source=pwa",
    scope: "/staff",
    display: "standalone",
    orientation: "portrait",
    background_color: "#031432",
    theme_color: "#031432",
    icons: [
      { src: "/icons/staff/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/staff/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/staff/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Today", url: "/staff/today" },
      { name: "This week", url: "/staff/week" },
      { name: "My hours", url: "/staff/hours" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" },
  });
}
