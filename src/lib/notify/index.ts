import "server-only";
import { SITE_URL, type Locale } from "@/lib/i18n";
import { formatMur } from "@/lib/pricing";
import { getProvider } from "@/lib/payments/providers";
import { notifyConfig, sendEmail, sendWhatsApp } from "./channels";

// Booking, request and payment alerts. Call these inside `after()` so the
// visitor's response never waits on, or fails because of, a slow provider.

export type BookingAlert = {
  id: number;
  ref: string;
  lang: Locale;
  service: { en: string; fr: string };
  date: string;
  timeSlot: string;
  town: string;
  address: string;
  name: string;
  email: string;
  phone: string;
  notes?: string | null;
  totalMur: number;
  depositMur: number;
};

export type LeadAlert = {
  kind: "business" | "request";
  company: string;
  contactName: string;
  email: string;
  phone: string;
  summary: string[];
};

export type PaymentAlert = { bookingId: number; ref: string; amountMur: number; provider: string; providerRef: string; name: string };

export async function alertNewBooking(b: BookingAlert) {
  const when = longDate(b.date, b.lang);
  const adminLink = `${SITE_URL}/admin/bookings/${b.id}`;
  const teamLines = [
    `${b.service.en} · ${longDate(b.date, "en")} at ${b.timeSlot}`,
    `${b.address}, ${b.town}`,
    `${b.name} · ${b.phone} · ${b.email}`,
    `Estimate ${formatMur(b.totalMur, "en")} · deposit ${formatMur(b.depositMur, "en")}`,
    ...(b.notes ? [`Notes: ${b.notes}`] : []),
  ];

  const c = b.lang === "fr" ? customerCopy.fr : customerCopy.en;
  const customerLines = [
    `${c.service}: ${b.service[b.lang]}`,
    `${c.when}: ${when} · ${b.timeSlot}`,
    `${c.where}: ${b.address}, ${b.town}`,
    `${c.total}: ${formatMur(b.totalMur, b.lang)}`,
    `${c.deposit}: ${formatMur(b.depositMur, b.lang)}`,
  ];

  await deliver(`booking ${b.ref}`, [
    () => sendEmail(teamEmail(`New booking ${b.ref}`, teamLines, adminLink, b.email)),
    () =>
      sendWhatsApp({
        to: notifyConfig.whatsapp.teamTo,
        template: notifyConfig.whatsapp.teamTemplate,
        lang: "en",
        params: [`booking ${b.ref}`, teamLines.slice(0, 3).join(" | "), adminLink],
      }),
    () =>
      sendEmail({
        to: b.email,
        subject: `${c.subject} ${b.ref}`,
        ...render(c.hello(firstName(b.name)), [c.intro(b.ref), ...customerLines, getProvider() ? c.nextOnline : c.next], {
          label: c.cta,
          href: `${SITE_URL}/${b.lang}/book/confirmation?ref=${b.ref}`,
        }),
        replyTo: notifyConfig.email.teamTo,
      }),
    () =>
      sendWhatsApp({
        to: b.phone,
        template: notifyConfig.whatsapp.customerTemplate,
        lang: b.lang,
        params: [firstName(b.name), b.ref, `${b.service[b.lang]}, ${when} ${b.timeSlot}`, formatMur(b.depositMur, b.lang)],
      }),
  ]);
}

export async function alertNewLead(l: LeadAlert) {
  const title = l.kind === "business" ? `New business enquiry: ${l.company}` : `New booking request: ${l.company}`;
  const lines = [`${l.contactName} · ${l.phone} · ${l.email}`, ...l.summary];
  const adminLink = `${SITE_URL}/admin/leads`;
  await deliver(title, [
    () => sendEmail(teamEmail(title, lines, adminLink, l.email)),
    () =>
      sendWhatsApp({
        to: notifyConfig.whatsapp.teamTo,
        template: notifyConfig.whatsapp.teamTemplate,
        lang: "en",
        params: [l.kind === "business" ? "business enquiry" : "booking request", lines.join(" | "), adminLink],
      }),
  ]);
}

export async function alertPayment(p: PaymentAlert) {
  const title = `Deposit received for ${p.ref}`;
  const lines = [`${formatMur(p.amountMur, "en")} from ${p.name}`, `${p.provider} reference ${p.providerRef}`];
  const adminLink = `${SITE_URL}/admin/bookings/${p.bookingId}`;
  await deliver(title, [
    () => sendEmail(teamEmail(title, lines, adminLink)),
    () =>
      sendWhatsApp({
        to: notifyConfig.whatsapp.teamTo,
        template: notifyConfig.whatsapp.teamTemplate,
        lang: "en",
        params: [`payment ${p.ref}`, lines.join(" | "), adminLink],
      }),
  ]);
}

/** Runs every send; one failing channel never stops the others. */
async function deliver(what: string, sends: (() => Promise<void>)[]) {
  const results = await Promise.allSettled(sends.map((send) => send()));
  for (const r of results) {
    if (r.status === "rejected") console.error(`[notify] ${what}:`, r.reason instanceof Error ? r.reason.message : r.reason);
  }
}

const customerCopy = {
  en: {
    subject: "We received your booking",
    hello: (name: string) => `Thank you, ${name}`,
    intro: (ref: string) => `Your booking reference is ${ref}. Here is what you asked for:`,
    service: "Service",
    when: "When",
    where: "Where",
    total: "Estimate",
    deposit: "Deposit to confirm",
    next: "Our team will call you within working hours to confirm the details and send your deposit link. Reply to this email if anything needs to change.",
    nextOnline: "Pay your deposit from your booking page to lock in the date. Our team will call you within working hours to confirm the details. Reply to this email if anything needs to change.",
    cta: "View your booking",
  },
  fr: {
    subject: "Nous avons reçu votre réservation",
    hello: (name: string) => `Merci, ${name}`,
    intro: (ref: string) => `Votre référence de réservation est ${ref}. Voici votre demande :`,
    service: "Service",
    when: "Date",
    where: "Adresse",
    total: "Estimation",
    deposit: "Acompte de confirmation",
    next: "Notre équipe vous appellera pendant les heures d'ouverture pour confirmer les détails et vous envoyer le lien de paiement de l'acompte. Répondez à cet e-mail pour toute modification.",
    nextOnline: "Réglez votre acompte depuis votre page de réservation pour bloquer la date. Notre équipe vous appellera pendant les heures d'ouverture pour confirmer les détails. Répondez à cet e-mail pour toute modification.",
    cta: "Voir ma réservation",
  },
};

function teamEmail(subject: string, lines: string[], href: string, replyTo?: string) {
  return {
    to: notifyConfig.email.teamTo,
    subject,
    ...render(subject, lines, { label: "Open in admin", href }),
    replyTo,
  };
}

const firstName = (name: string) => name.trim().split(/\s+/)[0];

function longDate(iso: string, lang: Locale) {
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-MU" : "en-MU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/** Plain, brand-coloured email that renders in every client (tables, inline styles). */
function render(heading: string, lines: string[], cta: { label: string; href: string }) {
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:Roboto,Arial,sans-serif;color:#0b2a41">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#061e2f;padding:18px 24px;color:#ffffff;font-weight:700;font-size:18px">Clinex Pro</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 16px;font-size:20px">${escape(heading)}</h1>
${lines.map((l) => `<p style="margin:0 0 10px;line-height:1.5">${escape(l)}</p>`).join("\n")}
<p style="margin:20px 0 0"><a href="${escape(cta.href)}" style="display:inline-block;background:#d14000;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">${escape(cta.label)}</a></p>
</td></tr>
<tr><td style="padding:16px 24px;background:#f4f6f8;font-size:12px;color:#55697a">Clinex Pro Contracting Ltd · +230 5504 7906 · info@clinexpro.net</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${heading}\n\n${lines.join("\n")}\n\n${cta.label}: ${cta.href}`;
  return { html, text };
}
