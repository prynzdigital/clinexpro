"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries";
import { estimate, formatMur, getPricedService, TIME_SLOTS, type Frequency } from "@/lib/pricing";
import { track } from "@/lib/track";
import { Icon, type IconName } from "@/components/icons";
import { createBooking } from "./actions";

type Props = {
  lang: Locale;
  t: Dictionary["booking"];
  businessHref: string;
  initialService?: string;
  services: { slug: string; name: string; tagline: string; icon: IconName }[];
  towns: { slug: string; name: string }[];
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Next 24 working days (Mon–Sat), starting tomorrow. */
function upcomingDays() {
  const days: string[] = [];
  const now = new Date();
  for (let i = 1; days.length < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (d.getDay() !== 0) days.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }
  return days;
}

function defaultsFor(slug: string) {
  const svc = getPricedService(slug);
  return Object.fromEntries((svc?.fields ?? []).map((f) => [f.key, f.default]));
}

export function BookingWizard({ lang, t, businessHref, initialService, services, towns }: Props) {
  const [step, setStep] = useState(initialService ? 1 : 0);
  const [service, setService] = useState(initialService ?? "");
  const [values, setValues] = useState<Record<string, number>>(() => defaultsFor(initialService ?? ""));
  const [addons, setAddons] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Frequency>(() => getPricedService(initialService ?? "")?.frequencies[0] ?? "once");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "", address: "", town: "", notes: "" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const priced = getPricedService(service);
  const days = useMemo(() => upcomingDays(), []);
  const price = priced ? estimate({ service, values, addons, frequency }) : null;
  const dateFmt = new Intl.DateTimeFormat(lang === "fr" ? "fr-MU" : "en-MU", { weekday: "short", day: "numeric", month: "short" });
  const formatDay = (iso: string) => dateFmt.format(new Date(`${iso}T12:00:00`));

  const chooseService = (slug: string) => {
    const svc = getPricedService(slug);
    setService(slug);
    setValues(defaultsFor(slug));
    setAddons([]);
    setFrequency(svc?.frequencies[0] ?? "once");
    track("quote_started", { service: slug });
    setStep(1);
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
  const canContinue = [
    Boolean(service),
    Boolean(price),
    Boolean(date && timeSlot),
    contact.name.trim().length >= 2 && emailOk && contact.phone.trim().length >= 7 && contact.address.trim().length >= 5 && Boolean(contact.town) && consent,
    true,
  ][step];

  const next = () => {
    setError("");
    track("quote_step", { step: step + 1, service });
    setStep((s) => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = () => {
    setError("");
    startTransition(async () => {
      track("booking_submitted", { service, value: price?.totalMur, currency: "MUR" });
      const result = await createBooking({
        lang,
        service,
        values,
        addons,
        frequency,
        date,
        timeSlot: timeSlot as (typeof TIME_SLOTS)[number],
        ...contact,
        consent: consent as true,
      });
      if (result && !result.ok) setError(t.errors.generic);
    });
  };

  const serviceName = services.find((s) => s.slug === service)?.name;
  const townName = towns.find((x) => x.slug === contact.town)?.name;

  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-[1fr_340px] lg:pb-0">
      <div className="min-w-0 space-y-6">
        <ol className="flex gap-1.5" aria-label="Progress">
          {t.steps.map((label, i) => (
            <li key={label} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
              <span className={`mt-1.5 hidden text-xs sm:block ${i === step ? "font-semibold text-ink" : "text-ink-soft"}`}>{label}</span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">{t.chooseService}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => chooseService(s.slug)}
                  className={`card flex items-start gap-3 p-4 text-left hover:border-brand ${service === s.slug ? "border-brand ring-2 ring-brand/20" : ""}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-strong">
                    <Icon name={s.icon} />
                  </span>
                  <span>
                    <span className="block font-semibold">{s.name}</span>
                    <span className="text-sm text-ink-soft">{s.tagline}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="text-sm text-ink-soft">
              {t.businessHint}{" "}
              <Link href={businessHref} className="font-semibold text-brand-strong underline-offset-2 hover:underline">{t.businessLink}</Link>
            </p>
          </section>
        )}

        {step === 1 && priced && (
          <section className="space-y-6">
            <h2 className="text-xl font-bold">{serviceName}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {priced.fields.map((f) => (
                <Stepper
                  key={f.key}
                  label={t.fields[f.key] ?? f.key}
                  value={values[f.key]}
                  min={f.min}
                  max={f.max}
                  step={f.key === "area" ? 10 : 1}
                  onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                />
              ))}
            </div>

            {priced.addons.length > 0 && (
              <fieldset className="space-y-3">
                <legend className="mb-3 font-semibold">{t.addonsTitle}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {priced.addons.map((a) => {
                    const on = addons.includes(a.key);
                    return (
                      <label key={a.key} className={`card flex cursor-pointer items-center justify-between gap-3 p-3.5 ${on ? "border-brand bg-brand-soft/50" : ""}`}>
                        <span className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => setAddons((prev) => (on ? prev.filter((k) => k !== a.key) : [...prev, a.key]))}
                            className="size-5 accent-[var(--brand)]"
                          />
                          {t.addons[a.key] ?? a.key}
                        </span>
                        <span className="text-sm text-ink-soft">+{formatMur(a.priceMur, lang)}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {priced.frequencies.length > 1 && (
              <fieldset>
                <legend className="mb-3 font-semibold">{t.frequencyTitle}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {priced.frequencies.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFrequency(f)}
                      aria-pressed={frequency === f}
                      className={`rounded-xl border px-3 py-3 text-sm font-medium ${frequency === f ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-brand"}`}
                    >
                      {t.frequency[f]}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            <div>
              <h2 className="mb-3 text-xl font-bold">{t.dateTitle}</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {days.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    aria-pressed={date === d}
                    className={`rounded-xl border px-2 py-3 text-sm capitalize ${date === d ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-brand"}`}
                  >
                    {formatDay(d)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-xl font-bold">{t.slotTitle}</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TIME_SLOTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTimeSlot(s)}
                    aria-pressed={timeSlot === s}
                    className={`rounded-xl border px-3 py-3 font-medium ${timeSlot === s ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-brand"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">{t.detailsTitle}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.name} value={contact.name} autoComplete="name" onChange={(v) => setContact({ ...contact, name: v })} className="sm:col-span-2" />
              <Field label={t.email} type="email" value={contact.email} autoComplete="email" onChange={(v) => setContact({ ...contact, email: v })} />
              <Field label={t.phone} type="tel" value={contact.phone} autoComplete="tel" onChange={(v) => setContact({ ...contact, phone: v })} />
              <Field label={t.address} value={contact.address} autoComplete="street-address" onChange={(v) => setContact({ ...contact, address: v })} className="sm:col-span-2" />
              <label className="sm:col-span-2">
                <span className="label">{t.town}</span>
                <select className="field" value={contact.town} onChange={(e) => setContact({ ...contact, town: e.target.value })}>
                  <option value="">{t.chooseTown}</option>
                  {towns.map((town) => (
                    <option key={town.slug} value={town.slug}>{town.name}</option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="label">{t.notes}</span>
                <textarea className="field" rows={3} value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} />
              </label>
              <label className="flex items-start gap-3 text-sm sm:col-span-2">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 accent-[var(--brand)]" />
                {t.consent}
              </label>
            </div>
          </section>
        )}

        {step === 4 && price && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold">{t.reviewTitle}</h2>
            <dl className="card divide-y divide-line">
              <Row label={t.steps[0]} value={`${serviceName} · ${t.frequency[frequency]}`} />
              <Row label={t.steps[2]} value={`${formatDay(date)} · ${timeSlot}`} />
              <Row label={t.address} value={`${contact.address}, ${townName}`} />
              <Row label={t.name} value={`${contact.name} · ${contact.phone}`} />
            </dl>
          </section>
        )}

        {error && <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p>}

        <div className="flex gap-3">
          {step > 0 && (
            <button type="button" onClick={back} className="btn-secondary">{t.back}</button>
          )}
          {step > 0 && step < 4 && (
            <button type="button" onClick={next} disabled={!canContinue} className="btn-primary flex-1 sm:flex-none">
              {t.next}
            </button>
          )}
          {step === 4 && (
            <button type="button" onClick={submit} disabled={pending} className="btn-primary flex-1 sm:flex-none">
              {pending ? t.submitting : t.submit}
            </button>
          )}
        </div>
      </div>

      {price && (
        <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:sticky lg:top-24 lg:self-start lg:rounded-2xl lg:border lg:p-6 lg:shadow-none">
          <h2 className="hidden font-semibold lg:mb-4 lg:block">{t.estimate}</h2>
          <dl className="hidden space-y-2 text-sm lg:block">
            <Line label={t.base} value={formatMur(price.baseMur, lang)} />
            {price.addonsMur > 0 && <Line label={t.extras} value={`+${formatMur(price.addonsMur, lang)}`} />}
            {price.discountMur > 0 && <Line label={t.discount} value={`−${formatMur(price.discountMur, lang)}`} accent />}
          </dl>
          <div className="flex items-end justify-between gap-4 lg:mt-4 lg:border-t lg:border-line lg:pt-4">
            <div>
              <p className="text-xs text-ink-soft">{t.total}</p>
              <p className="text-2xl font-extrabold">{formatMur(price.totalMur, lang)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-soft">{t.deposit}</p>
              <p className="font-semibold text-brand-strong">{formatMur(price.depositMur, lang)}</p>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

function Stepper({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="card flex items-center justify-between gap-3 p-3.5">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`${label} −`} onClick={() => onChange(clamp(value - step))} disabled={value <= min} className="grid size-10 place-items-center rounded-full border border-line text-lg hover:border-brand disabled:opacity-40">−</button>
        <output className="w-12 text-center text-lg font-semibold" aria-live="polite">{value}</output>
        <button type="button" aria-label={`${label} +`} onClick={() => onChange(clamp(value + step))} disabled={value >= max} className="grid size-10 place-items-center rounded-full border border-line text-lg hover:border-brand disabled:opacity-40">+</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", autoComplete, className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; autoComplete?: string; className?: string }) {
  return (
    <label className={className}>
      <span className="label">{label}</span>
      <input className="field" type={type} value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-4 sm:flex-row sm:justify-between">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="font-medium sm:text-right">{value}</dd>
    </div>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={accent ? "font-medium text-brand-strong" : ""}>{value}</dd>
    </div>
  );
}
