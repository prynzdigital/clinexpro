"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries";
import { Logo } from "./logo";
import { LangSwitch } from "./lang-switch";
import { MobileMenu } from "./mobile-menu";

/**
 * Sticky header. Over the home hero it starts transparent with light text;
 * once the page scrolls it becomes a floating frosted-glass bar. Its outer
 * height never changes, so nothing below it jumps.
 */
export function SiteHeader({ lang, nav }: { lang: Locale; nav: Dictionary["nav"] }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const overHero = pathname === `/${lang}` && !scrolled;
  const links = [
    { href: `/${lang}/services`, label: nav.services },
    { href: `/${lang}/areas`, label: nav.areas },
    { href: `/${lang}/business`, label: nav.business },
    { href: `/${lang}/about`, label: nav.about },
    { href: `/${lang}/contact`, label: nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 h-20 px-2 pt-2 sm:px-3">
      <div
        className={`mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 rounded-2xl px-3 transition-all duration-300 sm:px-5 ${
          overHero
            ? "bg-transparent"
            : "border border-white/60 bg-gradient-to-b from-white/85 to-white/65 shadow-[0_10px_40px_-12px_rgba(3,20,50,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl backdrop-saturate-150"
        }`}
      >
        <Link href={`/${lang}`} aria-label="Clinex Pro home" className="shrink-0">
          <Logo eager variant={overHero ? "light" : "default"} />
        </Link>
        <nav className={`hidden items-center gap-1 text-sm font-medium lg:flex ${overHero ? "text-white/85" : "text-ink-soft"}`}>
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-2 transition-colors ${
                  overHero
                    ? "hover:bg-white/15 hover:text-white"
                    : active
                      ? "bg-brand-soft text-brand-strong"
                      : "hover:bg-white hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LangSwitch
            lang={lang}
            label={nav.language}
            light={overHero}
            className="hidden sm:inline-flex"
          />
          <Link href={`/${lang}/book`} className="btn-primary min-h-10 px-4 text-sm shadow-md shadow-brand/25">
            {nav.book}
          </Link>
          <MobileMenu
            links={links}
            lang={lang}
            light={overHero}
            labels={{ menu: nav.menu, close: nav.close, language: nav.language, book: nav.book, call: nav.call }}
          />
        </div>
      </div>
    </header>
  );
}
