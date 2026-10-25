"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries";
import {
  estimate,
  formatMur,
  getPricedService,
  FREQUENCY_DISCOUNT,
  TIME_SLOTS,
  type Frequency,
} from "@/lib/pricing";
import { track } from "@/lib/track";
import { serviceImage } from "@/content/services";
import { Icon } from "@/components/icons";
import { createBooking } from "./actions";
import { Req, RequiredNote } from "@/components/required-mark";

type Props = {
  lang: Locale;
  t: Dictionary["booking"];
  businessHref: string;
  initialService?: string;
  services: { slug: string; name: string; tagline: string }[];
  towns: { slug: string; name: string }[];
};

type Step = 0 | 1 | 2;
const SLOT_GROUPS = [
  { key: "morning", slots: TIME_SLOTS.filter((s) => s < "12:00") },
  { key: "afternoon", slots: TIME_SLOTS.filter((s) => s >= "12:00") },
] as const;

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

const chip = (on: boolean) =>
  `rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
    on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink hover:border-navy"
  }`;

export function BookingWizard({ lang, t, businessHref, initialService, services, towns }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [service, setService] = useState(initialService ?? "");
  const [values, setValues] = useState<Record<string, number>>(() => defaultsFor(initialService ?? ""));
  const [addons, setAddons] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<Frequency>(() => getPricedService(initialService ?? "")?.frequencies[0] ?? "once");
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [contact, setContact] = useState({ name: "", email: "", phone: "", address: "", town: "", notes: "" });
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const sizeRef = useRef<HTMLDivElement>(null);

  const priced = getPricedService(service);
  const days = useMemo(() => upcomingDays(), []);
  const price = priced ? estimate({ service, values, addons, frequency }) : null;
  const locale = lang === "fr" ? "fr-MU" : "en-MU";
  const dayPart = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, opts).format(new Date(`${iso}T12:00:00`));
  const longDay = (iso: string) => dayPart(iso, { weekday: "long", day: "numeric", month: "long" });
  const selected = services.find((s) => s.slug === service);

  const chooseService = (slug: string) => {
    if (slug === service) return;
    setService(slug);
    setValues(defaultsFor(slug));
    setAddons([]);
    setFrequency(getPricedService(slug)?.frequencies[0] ?? "once");
    track("quote_started", { service: slug });
    requestAnimationFrame(() => sizeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email);
  const detailsOk =
    contact.name.trim().length >= 2 &&
    emailOk &&
    contact.phone.trim().length >= 7 &&
    contact.address.trim().length >= 5 &&
    Boolean(contact.town) &&
    consent;
  const canContinue = [Boolean(price), Boolean(date && timeSlot), detailsOk][step];

  const goTo = (next: Step) => {
    setError("");
    if (next > step) track("quote_step", { step: next + 1, service });
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  const primary =
    step < 2 ? (
      <button type="button" onClick={() => goTo((step + 1) as Step)} disabled={!canContinue} className="btn-primary w-full">
        {t.next}
        <Icon name="arrow" width={18} height={18} />
      </button>
    ) : (
      <button type="button" onClick={submit} disabled={!canContinue || pending} className="btn-primary w-full">
        {pending ? t.submitting : t.submit}
      </button>
    );

  return (
    <div className="grid gap-8 pb-36 lg:grid-cols-[1fr_360px] lg:pb-0">
      <div className="min-w-0 space-y-8">
        {/* Progress */}
        <ol className="flex items-center gap-2" aria-label="Progress">
          {t.steps.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={label} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => goTo(i as Step)}
                  aria-current={current ? "step" : undefined}
                  className="flex items-center gap-2 disabled:cursor-default"
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                      current ? "bg-brand text-white" : done ? "bg-navy text-white" : "bg-line text-ink-soft"
                    }`}
                  >
                    {done ? <Icon name="check" width={16} height={16} /> : i + 1}
                  </span>
                  <span className={`hidden text-sm sm:inline ${current ? "font-semibold text-ink" : "text-ink-soft"}`}>{label}</span>
                </button>
                {i < t.steps.length - 1 && <span className={`h-0.5 flex-1 rounded ${done ? "bg-navy" : "bg-line"}`} />}
              </li>
            );
          })}
        </ol>

        {step === 0 && (
          <>
            <section className="space-y-4">
              <h2 className="text-xl font-bold">{t.chooseService}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {services.map((s) => {
                  const on = s.slug === service;
                  const from = getPricedService(s.slug)?.minimumMur;
                  return (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => chooseService(s.slug)}
                      aria-pressed={on}
                      className={`group relative overflow-hidden rounded-2xl text-left ring-offset-2 transition ${on ? "ring-3 ring-brand" : "hover:ring-2 hover:ring-line"}`}
                    >
                      <div className="relative aspect-[4/3]">
                        <Image src={serviceImage(s.slug)} alt="" fill sizes="(min-width: 640px) 240px, 50vw" className="object-cover transition duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/30 to-transparent" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                        <span className="block text-sm font-bold leading-tight sm:text-base">{s.name}</span>
                        {from !== undefined && (
                          <span className="text-xs text-white/80">
                            {lang === "fr" ? "Dès" : "From"} {formatMur(from, lang)}
                          </span>
                        )}
                      </div>
                      {on && (
                        <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-brand text-white">
                          <Icon name="check" width={16} height={16} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-ink-soft">
                {t.businessHint}{" "}
                <Link href={businessHref} className="font-semibold text-brand-strong underline-offset-2 hover:underline">
                  {t.businessLink}
                </Link>
              </p>
            </section>

            {priced && (
              <section ref={sizeRef} className="card scroll-mt-24 space-y-6 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">{t.sizeTitle}</h2>
                  <p className="text-sm text-ink-soft">{selected?.tagline}</p>
                </div>

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
                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">{t.addonsTitle}</legend>
                    <div className="flex flex-wrap gap-2">
                      {priced.addons.map((a) => {
                        const on = addons.includes(a.key);
                        return (
                          <button
                            key={a.key}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setAddons((prev) => (on ? prev.filter((k) => k !== a.key) : [...prev, a.key]))}
                            className={chip(on)}
                          >
                            {on ? "✓ " : "+ "}
                            {t.addons[a.key] ?? a.key}
                            <span className={on ? "text-white/70" : "text-ink-soft"}> · {formatMur(a.priceMur, lang)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {priced.frequencies.length > 1 && (
                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">{t.frequencyTitle}</legend>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {priced.frequencies.map((f) => {
                        const on = frequency === f;
                        const saving = FREQUENCY_DISCOUNT[f];
                        return (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFrequency(f)}
                            aria-pressed={on}
                            className={`relative rounded-xl border px-3 pb-2.5 pt-3 text-sm font-medium ${on ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-navy"}`}
                          >
                            {t.frequency[f]}
                            {saving > 0 && (
                              <span className={`mt-0.5 block text-xs font-bold ${on ? "text-accent" : "text-brand-strong"}`}>
                                −{Math.round(saving * 100)}%
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
              </section>
            )}
          </>
        )}

        {step === 1 && (
          <section className="space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-bold">{t.dateTitle}</h2>
              <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-6 sm:overflow-visible sm:px-0">
                {days.map((d) => {
                  const on = date === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDate(d)}
                      aria-pressed={on}
                      aria-label={longDay(d)}
                      className={`flex w-[4.5rem] shrink-0 snap-start flex-col items-center rounded-2xl border py-3 sm:w-auto ${on ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-navy"}`}
                    >
                      <span className={`text-xs uppercase ${on ? "text-white/75" : "text-ink-soft"}`}>{dayPart(d, { weekday: "short" })}</span>
                      <span className="text-2xl font-bold leading-tight">{dayPart(d, { day: "numeric" })}</span>
                      <span className={`text-xs ${on ? "text-white/75" : "text-ink-soft"}`}>{dayPart(d, { month: "short" })}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{t.slotTitle}</h2>
              {SLOT_GROUPS.map((g) => (
                <div key={g.key}>
                  <p className="mb-2 text-sm font-semibold text-ink-soft">{t[g.key]}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {g.slots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTimeSlot(s)}
                        aria-pressed={timeSlot === s}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-3.5 text-base font-semibold ${timeSlot === s ? "border-navy bg-navy text-white" : "border-line bg-white hover:border-navy"}`}
                      >
                        <Icon name="clock" width={16} height={16} />
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 2 && price && selected && (
          <section className="space-y-6">
            <div className="card flex items-center gap-4 p-3">
              <Image src={serviceImage(service)} alt="" width={80} height={80} className="size-20 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-bold">{selected.name}</p>
                <p className="text-ink-soft">{t.frequency[frequency]}</p>
                <p className="text-ink-soft first-letter:uppercase">{longDay(date)} · {timeSlot}</p>
              </div>
              <button type="button" onClick={() => goTo(0)} className="self-start text-sm font-semibold text-brand-strong hover:underline">
                {t.edit}
              </button>
            </div>

            <RequiredNote text={t.requiredNote} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field required label={t.name} value={contact.name} autoComplete="name" onChange={(v) => setContact({ ...contact, name: v })} className="sm:col-span-2" />
              <Field required label={t.phone} type="tel" value={contact.phone} autoComplete="tel" onChange={(v) => setContact({ ...contact, phone: v })} />
              <Field required label={t.email} type="email" value={contact.email} autoComplete="email" onChange={(v) => setContact({ ...contact, email: v })} />
              <Field required label={t.address} value={contact.address} autoComplete="street-address" onChange={(v) => setContact({ ...contact, address: v })} />
              <label>
                <span className="label">{t.town}<Req /></span>
                <select required className="field" value={contact.town} onChange={(e) => setContact({ ...contact, town: e.target.value })}>
                  <option value="">{t.chooseTown}</option>
                  {towns.map((town) => (
                    <option key={town.slug} value={town.slug}>{town.name}</option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="label">{t.notes}</span>
                <textarea className="field" rows={2} value={contact.notes} onChange={(e) => setContact({ ...contact, notes: e.target.value })} />
              </label>
              <label className="flex items-start gap-3 text-sm sm:col-span-2">
                <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 accent-[var(--brand)]" />
                <span>{t.consent}<Req /></span>
              </label>
            </div>
          </section>
        )}

        {error && <p className="rounded-xl bg-danger/10 p-3 text-sm text-danger" role="alert">{error}</p>}

        {step > 0 && (
          <button type="button" onClick={() => goTo((step - 1) as Step)} className="text-sm font-semibold text-ink-soft hover:text-ink">
            ← {t.back}
          </button>
        )}
      </div>

      {/* Price: fixed bar on phones, sticky summary card on desktop */}
      <aside className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-4 shadow-[0_-8px_30px_rgba(3,20,50,0.08)] backdrop-blur lg:sticky lg:top-24 lg:self-start lg:overflow-hidden lg:rounded-3xl lg:border lg:p-0 lg:shadow-none">
        {selected && (
          <div className="relative hidden aspect-[16/9] lg:block">
            <Image src={serviceImage(service)} alt="" fill sizes="360px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/80 to-transparent" />
            <p className="absolute bottom-3 left-4 font-bold text-white">{selected.name}</p>
          </div>
        )}
        <div className="mx-auto max-w-xl space-y-3 lg:space-y-4 lg:p-6">
          {price ? (
            <>
              <dl className="hidden space-y-2 text-sm lg:block">
                <Line label={t.base} value={formatMur(price.baseMur, lang)} />
                {price.addonsMur > 0 && <Line label={t.extras} value={`+${formatMur(price.addonsMur, lang)}`} />}
                {price.discountMur > 0 && <Line label={t.discount} value={`−${formatMur(price.discountMur, lang)}`} accent />}
                {date && timeSlot && <Line label={t.steps[1]} value={`${dayPart(date, { day: "numeric", month: "short" })} · ${timeSlot}`} />}
              </dl>
              <div className="flex items-end justify-between gap-4 lg:border-t lg:border-line lg:pt-4">
                <div>
                  <p className="text-xs text-ink-soft">{t.total}</p>
                  <p className="text-2xl font-extrabold leading-tight">{formatMur(price.totalMur, lang)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink-soft">{t.deposit}</p>
                  <p className="font-bold text-brand-strong">{formatMur(price.depositMur, lang)}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-ink-soft">{t.pickService}</p>
          )}
          {primary}
        </div>
      </aside>
    </div>
  );
}

function Stepper({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-alt p-3.5">
      <span className="font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`${label} −`} onClick={() => onChange(clamp(value - step))} disabled={value <= min} className="grid size-10 place-items-center rounded-full bg-white text-lg shadow-sm hover:text-brand-strong disabled:opacity-40">−</button>
        <output className="w-12 text-center text-lg font-bold" aria-live="polite">{value}</output>
        <button type="button" aria-label={`${label} +`} onClick={() => onChange(clamp(value + step))} disabled={value >= max} className="grid size-10 place-items-center rounded-full bg-white text-lg shadow-sm hover:text-brand-strong disabled:opacity-40">+</button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", autoComplete, required = false, className = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; autoComplete?: string; required?: boolean; className?: string }) {
  return (
    <label className={className}>
      <span className="label">
        {label}
        {required && <Req />}
      </span>
      <input className="field" type={type} value={value} required={required} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={accent ? "font-medium text-brand-strong" : ""}>{value}</dd>
    </div>
  );
}
