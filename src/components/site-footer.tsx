import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries";
import { BUSINESS } from "@/content/business";
import { SERVICES } from "@/content/services";
import { Logo } from "./logo";

export function SiteFooter({ lang, t }: { lang: Locale; t: Dictionary }) {
  return (
    <footer className="mt-auto border-t border-line bg-surface-alt">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-ink-soft">{t.footer.tagline}</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t.nav.services}</h2>
          <ul className="space-y-2 text-sm text-ink-soft">
            {SERVICES.map((s) => (
              <li key={s.slug}>
                <Link href={`/${lang}/services/${s.slug}`} className="hover:text-brand-strong">
                  {s.name[lang]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t.footer.company}</h2>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href={`/${lang}/about`} className="hover:text-brand-strong">{t.nav.about}</Link></li>
            <li><Link href={`/${lang}/areas`} className="hover:text-brand-strong">{t.nav.areas}</Link></li>
            <li><Link href={`/${lang}/business`} className="hover:text-brand-strong">{t.nav.business}</Link></li>
            <li><Link href={`/${lang}/privacy`} className="hover:text-brand-strong">{t.footer.privacy}</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t.nav.contact}</h2>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><a href={BUSINESS.phoneHref} className="hover:text-brand-strong">{BUSINESS.phone}</a></li>
            <li><a href={`mailto:${BUSINESS.email}`} className="hover:text-brand-strong">{BUSINESS.email}</a></li>
            <li><a href={BUSINESS.facebook} className="hover:text-brand-strong" rel="noopener" target="_blank">Facebook</a></li>
            <li><a href={BUSINESS.youtube} className="hover:text-brand-strong" rel="noopener" target="_blank">YouTube</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} {BUSINESS.legalName}. {t.footer.rights}
      </div>
    </footer>
  );
}
