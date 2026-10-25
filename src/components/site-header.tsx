import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries";
import { Logo } from "./logo";
import { LangSwitch } from "./lang-switch";
import { MobileMenu } from "./mobile-menu";

export function SiteHeader({ lang, t }: { lang: Locale; t: Dictionary }) {
  const links = [
    { href: `/${lang}/services`, label: t.nav.services },
    { href: `/${lang}/areas`, label: t.nav.areas },
    { href: `/${lang}/business`, label: t.nav.business },
    { href: `/${lang}/about`, label: t.nav.about },
    { href: `/${lang}/contact`, label: t.nav.contact },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href={`/${lang}`} aria-label="Clinex Pro home">
          <Logo priority />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-strong">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch lang={lang} label={t.nav.language} className="hidden sm:inline-flex" />
          <Link href={`/${lang}/book`} className="btn-primary min-h-10 px-4 text-sm">
            {t.nav.book}
          </Link>
          <MobileMenu
            links={links}
            lang={lang}
            labels={{ menu: t.nav.menu, close: t.nav.close, language: t.nav.language }}
          />
        </div>
      </div>
    </header>
  );
}
