"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CONSENT_OPEN_EVENT,
  GA_ID,
  GTM_ID,
  gtag,
  saveConsent,
  setTrackingAllowed,
  storedConsent,
  track,
  trackingConfigured,
  type Consent,
} from "@/lib/track";

type Labels = { title: string; body: string; accept: string; decline: string; more: string };

const DENIED = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" };
const GRANTED = { ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted", analytics_storage: "granted" };

let loaded = false;

/** Injects GTM or gtag.js once, after consent. */
function loadTags() {
  if (loaded) return;
  loaded = true;
  const script = document.createElement("script");
  script.async = true;
  if (GTM_ID) {
    (window as Window & { dataLayer?: unknown[] }).dataLayer?.push({ "gtm.start": Date.now(), event: "gtm.js" });
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  } else if (GA_ID) {
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    gtag("js", new Date());
    // Page changes inside the site are counted by GA4's enhanced measurement (history events).
    gtag("config", GA_ID);
  }
  document.head.appendChild(script);
}

function apply(choice: Consent) {
  gtag("consent", "update", choice === "granted" ? GRANTED : DENIED);
  setTrackingAllowed(choice === "granted");
  if (choice === "granted") loadTags();
}

/**
 * Consent banner plus the tag loader. Renders nothing when no tracking ID is
 * set. Until the visitor accepts, no Google script is loaded.
 */
export function Analytics({ lang, t }: { lang: string; t: Labels }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!trackingConfigured) return;
    // Consent Mode v2: everything denied until the visitor says yes.
    gtag("consent", "default", { ...DENIED, wait_for_update: 500 });
    const choice = storedConsent();
    if (choice) apply(choice);
    // No choice yet: drop anything queued on this page; it happened before consent.
    else setTrackingAllowed(false);
    const show = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, show);
    // Asking is a response to the stored state, which only the browser knows.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!choice) setOpen(true);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, show);
  }, []);

  // Contact taps anywhere on the site (call, WhatsApp, email links).
  useEffect(() => {
    if (!trackingConfigured) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      const method = href.startsWith("tel:") ? "phone" : href.includes("wa.me/") ? "whatsapp" : href.startsWith("mailto:") ? "email" : null;
      if (method) track("contact_click", { method, location: window.location.pathname.replace(/^\/(en|fr)/, "") || "/" });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!trackingConfigured || !open) return null;

  const choose = (choice: Consent) => {
    saveConsent(choice);
    apply(choice);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      aria-describedby="consent-body"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-xl rounded-2xl border border-line bg-white p-5 text-sm text-ink shadow-2xl sm:bottom-5"
    >
      <h2 id="consent-title" className="text-base font-semibold">{t.title}</h2>
      <p id="consent-body" className="mt-1 text-ink-soft">
        {t.body}{" "}
        <Link href={`/${lang}/privacy#cookies`} className="font-medium text-brand-strong underline">{t.more}</Link>
      </p>
      {/* Equal weight: declining is as easy as accepting. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => choose("denied")} className="btn-secondary min-h-11">{t.decline}</button>
        <button type="button" onClick={() => choose("granted")} className="btn-primary min-h-11">{t.accept}</button>
      </div>
    </div>
  );
}

/** Footer link to change the choice later. Hidden when nothing is tracked. */
export function ConsentSettingsLink({ label, className }: { label: string; className?: string }) {
  if (!trackingConfigured) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))} className={className}>
      {label}
    </button>
  );
}
