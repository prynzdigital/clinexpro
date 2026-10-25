import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { PRIVACY_INTRO, PRIVACY_LAST_UPDATED, PRIVACY_SECTIONS } from "@/content/privacy";
import { BUSINESS } from "@/content/business";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.privacy.title, description: PRIVACY_INTRO[lang][0], alternates: alternates(lang, "/privacy") };
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const updated = new Intl.DateTimeFormat(lang === "fr" ? "fr-MU" : "en-MU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${PRIVACY_LAST_UPDATED}T00:00:00Z`),
  );

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-strong">{BUSINESS.legalName}</p>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t.privacy.title}</h1>
        <p className="text-sm text-ink-soft">
          {t.privacy.updated} <time dateTime={PRIVACY_LAST_UPDATED}>{updated}</time>
        </p>
        {PRIVACY_INTRO[lang].map((p) => (
          <p key={p} className="text-lg text-ink-soft">{p}</p>
        ))}
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <nav aria-label={t.privacy.contents} className="lg:sticky lg:top-28 lg:self-start">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-soft">{t.privacy.contents}</p>
          <ol className="space-y-2 text-sm">
            {PRIVACY_SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-ink-soft hover:text-brand-strong">{s.title[lang]}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl space-y-10">
          {PRIVACY_SECTIONS.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="mb-3 text-xl font-bold">{s.title[lang]}</h2>
              {s.body[lang].length > 1 ? (
                <ul className="space-y-2.5 text-ink-soft">
                  {s.body[lang].map((p) => (
                    <li key={p} className="flex gap-3">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-ink-soft">{s.body[lang][0]}</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
