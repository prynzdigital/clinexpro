import type { Locale } from "@/lib/i18n";
import { TESTIMONIALS } from "@/content/testimonials";
import { Reveal } from "./reveal";

const initials = (name: string) =>
  name
    .replace(/^(Mrs?|Ms)\.\s*/, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

/** Customer quotes in three cards; quotes are as published on clinexpro.net. */
export function Testimonials({ lang, eyebrow, title }: { lang: Locale; eyebrow: string; title: string }) {
  return (
    <section className="container-page py-20 sm:py-24">
      <Reveal className="mb-10 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-strong">{eyebrow}</p>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
          <span className="text-brand">.</span>
        </h2>
      </Reveal>
      <ul className="grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <li key={t.name}>
            <Reveal delay={i * 120} className="h-full">
              <figure className="flex h-full flex-col rounded-3xl border border-line bg-white p-7 shadow-[0_20px_50px_-30px_rgba(3,20,50,0.35)]">
                <svg viewBox="0 0 32 32" width={34} height={34} className="mb-5 text-brand" fill="currentColor" aria-hidden="true">
                  <path d="M13 8c-4.4 1.6-8 5.6-8 11v5h9v-9H9.4c.5-3 2.4-5.2 5.1-6.3zm14 0c-4.4 1.6-8 5.6-8 11v5h9v-9h-4.6c.5-3 2.4-5.2 5.1-6.3z" />
                </svg>
                <blockquote className="flex-1 text-lg leading-relaxed text-ink">“{t.quote[lang]}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <span className="grid size-11 place-items-center rounded-full bg-navy text-sm font-bold text-white">{initials(t.name)}</span>
                  <span>
                    <span className="block font-semibold">{t.name}</span>
                    <span className="text-sm text-ink-soft">{t.role[lang]}</span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
