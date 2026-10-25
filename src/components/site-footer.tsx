import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries";
import { BUSINESS } from "@/content/business";
import { SERVICES } from "@/content/services";
import { Icon } from "./icons";
import { CtaCard } from "./cta-card";
import { SocialLinks } from "./social-links";

const heading = "mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-accent";
const link = "text-white/75 transition-colors hover:text-white";

export function SiteFooter({ lang, t }: { lang: Locale; t: Dictionary }) {
  return (
    <>
      {/* Call-to-action card straddling the page / footer edge: it takes its
          own space in the page, and the footer slides up beneath its lower half. */}
      <div className="container-page relative z-10 mt-16 -mb-24 sm:mt-20 lg:mt-32">
        <CtaCard lang={lang} t={t.cta} />
      </div>
      <footer className="mt-auto bg-footer text-sm text-white">
        <div className="container-page grid gap-10 pb-14 pt-36 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div className="space-y-5">
            <Image src="/brand/clinexpro-logo-light.png" alt="Clinex Pro" width={1920} height={396} sizes="190px" className="h-9 w-auto" />
            <p className="max-w-xs text-white/75">{t.footer.tagline}</p>
            <div>
              <h2 className={heading}>{t.footer.follow}</h2>
              <SocialLinks />
            </div>
          </div>

          <div>
            <h2 className={heading}>{t.nav.services}</h2>
            <ul className="space-y-2.5">
              {SERVICES.map((s) => (
                <li key={s.slug}>
                  <Link href={`/${lang}/services/${s.slug}`} className={link}>{s.name[lang]}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className={heading}>{t.footer.company}</h2>
              <ul className="space-y-2.5">
                <li><Link href={`/${lang}/about`} className={link}>{t.nav.about}</Link></li>
                <li><Link href={`/${lang}/business`} className={link}>{t.nav.business}</Link></li>
                <li><Link href={`/${lang}/contact`} className={link}>{t.nav.contact}</Link></li>
                <li><Link href={`/${lang}/privacy`} className={link}>{t.footer.privacy}</Link></li>
              </ul>
            </div>
            <div>
              <h2 className={heading}>{t.footer.regions}</h2>
              <ul className="space-y-2.5">
                {BUSINESS.regions.map((r) => (
                  <li key={r}>
                    <Link href={`/${lang}/areas`} className={link}>{r}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h2 className={heading}>{t.footer.headOffice}</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <Icon name="pin" width={18} height={18} className="mt-0.5 shrink-0 text-accent" />
                <span className="text-white/75">{BUSINESS.street}, {BUSINESS.locality}, Mauritius</span>
              </li>
              <li className="flex gap-3">
                <Icon name="phone" width={18} height={18} className="mt-0.5 shrink-0 text-accent" />
                <a href={BUSINESS.phoneHref} className={link}>{BUSINESS.phone}</a>
              </li>
              <li className="flex gap-3">
                <Icon name="mail" width={18} height={18} className="mt-0.5 shrink-0 text-accent" />
                <a href={`mailto:${BUSINESS.email}`} className={link}>{BUSINESS.email}</a>
              </li>
              <li className="flex gap-3">
                <Icon name="clock" width={18} height={18} className="mt-0.5 shrink-0 text-accent" />
                <span className="text-white/75">{BUSINESS.hours[lang]}</span>
              </li>
            </ul>
            <Link href={`/${lang}/book`} className="btn-primary mt-6 min-h-11 px-5 text-sm">
              {t.nav.book}
            </Link>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container-page flex flex-col gap-3 py-5 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
            <span>© {new Date().getFullYear()} {BUSINESS.legalName}. {t.footer.rights}</span>
            <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href={`/${lang}/privacy`} className="hover:text-white">{t.footer.privacy}</Link>
              <span>
                {t.footer.credit}{" "}
                <a href="https://www.gostatenext.com/" target="_blank" rel="noopener" className="font-semibold text-white/85 hover:text-accent">
                  StateNext Labs
                </a>
              </span>
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
