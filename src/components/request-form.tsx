"use client";

import { useActionState, useEffect } from "react";
import { track } from "@/lib/track";
import type { Dictionary } from "@/dictionaries";
import { createBookingRequest, type RequestState } from "@/app/[lang]/request-actions";
import { Icon } from "./icons";
import { Req, RequiredNote } from "./required-mark";

type Labels = Dictionary["home"]["requestForm"];

const input =
  "block w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-base text-ink placeholder:text-ink-soft/60 shadow-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20";

export function RequestForm({
  t,
  services,
  minDate,
}: {
  t: Labels;
  services: { slug: string; name: string }[];
  minDate: string;
}) {
  const [state, action, pending] = useActionState<RequestState, FormData>(createBookingRequest, { status: "idle" });

  useEffect(() => {
    if (state.status === "sent") track("generate_lead", { lead_type: "booking_request", service: state.service });
  }, [state]);

  if (state.status === "sent") {
    return (
      <div className="grid h-full place-items-center p-8 text-center" role="status">
        <div className="space-y-4">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-brand text-white shadow-[0_0_40px_rgba(252,81,29,0.45)]">
            <Icon name="check" width={30} height={30} />
          </span>
          <p className="max-w-sm text-lg font-semibold text-ink">{t.sent}</p>
        </div>
      </div>
    );
  }

  const bad = (name: string) => (state.fieldErrors?.includes(name) ? " border-danger ring-2 ring-danger/20" : "");
  const label = "mb-1.5 block text-sm font-semibold text-ink";

  return (
    <form
      action={action}
      // Rebuild with the returned values after an error so dropdowns keep them too
      // (React only reads a select's defaultValue when it first renders).
      key={state.values ? JSON.stringify(state.values) : "blank"} className="grid gap-4 p-6 sm:grid-cols-2 sm:gap-5 sm:p-8">
      <RequiredNote text={t.requiredNote} className="sm:col-span-2" />
      <label>
        <span className={label}>{t.name}<Req /></span>
        <input name="name" defaultValue={state.values?.name ?? ""} required autoComplete="name" className={input + bad("name")} />
      </label>
      <label>
        <span className={label}>{t.company}</span>
        <input name="company" defaultValue={state.values?.company ?? ""} autoComplete="organization" className={input + bad("company")} />
      </label>
      <label>
        <span className={label}>{t.phone}<Req /></span>
        <input name="phone" defaultValue={state.values?.phone ?? ""} type="tel" required autoComplete="tel" className={input + bad("phone")} />
      </label>
      <label>
        <span className={label}>{t.email}<Req /></span>
        <input name="email" defaultValue={state.values?.email ?? ""} type="email" required autoComplete="email" className={input + bad("email")} />
      </label>
      <label className="sm:col-span-2">
        <span className={label}>{t.address}<Req /></span>
        <input name="address" defaultValue={state.values?.address ?? ""} required autoComplete="street-address" className={input + bad("address")} />
      </label>
      <label className="sm:col-span-2">
        <span className={label}>{t.service}</span>
        <select name="service" defaultValue={state.values?.service ?? ""} className={input + bad("service")}>
          <option value="">{t.serviceOther}</option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </select>
      </label>
      <label>
        <span className={label}>{t.startDate}</span>
        <input name="startDate" defaultValue={state.values?.startDate ?? ""} type="date" min={minDate} className={input + bad("startDate")} />
      </label>
      <label>
        <span className={label}>{t.contactTime}<Req /></span>
        <select name="contactTime" required defaultValue={state.values?.contactTime ?? "morning"} className={input + bad("contactTime")}>
          {Object.entries(t.contactTimes).map(([value, text]) => (
            <option key={value} value={value}>{text}</option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className={label}>{t.notes}</span>
        <textarea name="notes" defaultValue={state.values?.notes ?? ""} rows={3} placeholder={t.notesPlaceholder} className={input + bad("notes")} />
      </label>
      {/* Honeypot: hidden from people, filled by bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state.status === "error" && (
        <p className="text-sm font-medium text-danger sm:col-span-2" role="alert">{t.error}</p>
      )}
      <button type="submit" disabled={pending} className="btn-glow w-full sm:col-span-2">
        <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
        </svg>
        {pending ? t.submitting : t.submit}
      </button>
    </form>
  );
}
