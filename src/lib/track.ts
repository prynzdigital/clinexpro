// Funnel events for GA4 / Meta Pixel via Google Tag Manager's dataLayer.
// No-op until a tag manager is installed on the page.
type DataLayerWindow = Window & { dataLayer?: Record<string, unknown>[] };

export function track(event: "quote_started" | "quote_step" | "booking_submitted", params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as DataLayerWindow;
  w.dataLayer?.push({ event, ...params });
}
