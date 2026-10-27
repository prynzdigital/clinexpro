// Marketing measurement: Google Tag Manager (recommended) or GA4 directly,
// chosen by NEXT_PUBLIC_GTM_ID / NEXT_PUBLIC_GA_ID. Nothing loads and nothing
// is recorded until the visitor accepts (components/analytics.tsx). Events
// never carry personal details: no names, emails or phone numbers.

export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID?.trim() || undefined;
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || undefined;
export const trackingConfigured = Boolean(GTM_ID || GA_ID);

export type Consent = "granted" | "denied";
const STORAGE_KEY = "clinex-consent";
export const CONSENT_OPEN_EVENT = "clinex:consent-open";

type Gtag = (...args: unknown[]) => void;
type TrackingWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag };

export function storedConsent(): Consent | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function saveConsent(value: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Private mode etc.: the choice simply lasts for this page view.
  }
}

/** gtag() as Google defines it: it must push the arguments object, not an array. */
export function gtag(...args: unknown[]) {
  const w = window as TrackingWindow;
  w.dataLayer = w.dataLayer ?? [];
  if (!w.gtag) {
    w.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
  }
  w.gtag(...args);
}

// Until the stored choice has been read (components/analytics.tsx), events wait
// here, so they never reach Google ahead of the consent signals. A choice made
// later in the banner does not replay them.
let state: "unknown" | "granted" | "denied" = "unknown";
let waiting: (() => void)[] = [];

export function setTrackingAllowed(allowed: boolean) {
  state = allowed ? "granted" : "denied";
  const queued = waiting;
  waiting = [];
  if (allowed) queued.forEach((send) => send());
}

type Events = {
  /** Picked a service in the booking form. */
  begin_checkout: { service: string; currency: "MUR"; value?: number };
  quote_step: { step: number; service: string };
  /** A confirmed online booking (fired once, on the confirmation page). */
  purchase: { transaction_id: string; value: number; currency: "MUR"; items: { item_id: string; item_name: string; price: number; quantity: 1 }[] };
  deposit_paid: { transaction_id: string; value: number; currency: "MUR" };
  /** Business enquiry or home-page booking request sent. */
  generate_lead: { lead_type: "business_enquiry" | "booking_request"; sector?: string; service?: string };
  contact_click: { method: "phone" | "whatsapp" | "email"; location: string };
};

/** Records a funnel event, only if the visitor has accepted. */
export function track<E extends keyof Events>(event: E, params: Events[E]) {
  if (typeof window === "undefined" || !trackingConfigured || state === "denied") return;
  const send = () => {
    if (GTM_ID) {
      // Tag Manager: GA4 / Google Ads / Meta tags are set up in GTM on these events.
      (window as TrackingWindow).dataLayer?.push({ event, ...params });
    } else {
      gtag("event", event, params);
    }
  };
  if (state === "granted") send();
  else waiting.push(send);
}

/** Counts a one-off conversion (e.g. a booking) at most once per browser. */
export function trackOnce<E extends keyof Events>(key: string, event: E, params: Events[E]) {
  if (typeof window === "undefined" || !trackingConfigured || storedConsent() !== "granted") return;
  try {
    if (localStorage.getItem(`clinex-sent:${key}`)) return;
    localStorage.setItem(`clinex-sent:${key}`, "1");
  } catch {
    // Without storage we can't dedupe; GA4 also dedupes purchases by transaction_id.
  }
  track(event, params);
}
