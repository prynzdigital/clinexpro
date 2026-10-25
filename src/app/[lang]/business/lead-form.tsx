"use client";

import { useActionState } from "react";
import type { Dictionary } from "@/dictionaries";
import { TOWNS } from "@/content/towns";
import { createLead, type LeadState } from "./actions";

export function LeadForm({ t }: { t: Dictionary["business"] }) {
  const [state, action, pending] = useActionState<LeadState, FormData>(createLead, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="card self-start bg-brand-soft p-8 text-lg font-medium" role="status">
        {t.sent}
      </div>
    );
  }

  const invalid = (name: string) => state.fieldErrors?.includes(name);
  const field = (name: string) => `field ${invalid(name) ? "border-danger" : ""}`;

  return (
    <form action={action} className="card space-y-4 self-start p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="label">{t.company}</span>
          <input name="company" required className={field("company")} autoComplete="organization" />
        </label>
        <label>
          <span className="label">{t.contactName}</span>
          <input name="contactName" required className={field("contactName")} autoComplete="name" />
        </label>
        <label>
          <span className="label">{t.phone}</span>
          <input name="phone" type="tel" required className={field("phone")} autoComplete="tel" />
        </label>
        <label className="sm:col-span-2">
          <span className="label">{t.email}</span>
          <input name="email" type="email" required className={field("email")} autoComplete="email" />
        </label>
        <label>
          <span className="label">{t.sector}</span>
          <select name="sector" required className={field("sector")} defaultValue="office">
            {Object.entries(t.sectors).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">{t.town}</span>
          <select name="town" className="field" defaultValue="">
            <option value="">—</option>
            {TOWNS.map((town) => (
              <option key={town.slug} value={town.name}>{town.name}</option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="label">{t.message}</span>
          <textarea name="message" rows={4} className="field" />
        </label>
        {/* Honeypot: hidden from people, filled by bots. */}
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {t.submit}
      </button>
    </form>
  );
}
