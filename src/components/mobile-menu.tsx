"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/lib/i18n";
import { BUSINESS } from "@/content/business";
import { Icon } from "./icons";
import { Logo } from "./logo";
import { LangSwitch } from "./lang-switch";

/**
 * Full-screen phone menu. Rendered into <body> through a portal: the header's
 * frosted glass (backdrop-filter) would otherwise trap a position: fixed panel
 * inside the header's own box.
 */
export function MobileMenu({
  links,
  lang,
  labels,
  light = false,
}: {
  links: { href: string; label: string }[];
  lang: Locale;
  labels: { menu: string; close: string; language: string; book: string; call: string };
  /** White icon, for use over the dark home hero. */
  light?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  // Lock page scroll, close on Escape, and move focus in and back out.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const trigger = openButton.current;
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        ref={openButton}
        type="button"
        onClick={() => setOpen(true)}
        className={`grid size-10 place-items-center rounded-full ${light ? "text-white hover:bg-white/15" : "text-ink hover:bg-surface-alt"}`}
        aria-label={labels.menu}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Icon name="menu" />
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={labels.menu}
            className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-navy text-white motion-safe:animate-[menu-in_220ms_ease-out]"
          >
            {/* soft brand glow behind the links */}
            <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-24 size-72 rounded-full bg-brand/25 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -left-24 bottom-24 size-72 rounded-full bg-[#1e73be]/25 blur-3xl" />

            <div className="relative flex h-20 shrink-0 items-center justify-between px-5">
              <Link href={`/${lang}`} onClick={close} aria-label="Clinex Pro home">
                <Logo variant="light" />
              </Link>
              <button
                ref={closeButton}
                type="button"
                onClick={close}
                className="grid size-11 place-items-center rounded-full border border-white/20 bg-white/10 hover:bg-white/20"
                aria-label={labels.close}
              >
                <Icon name="close" />
              </button>
            </div>

            <nav className="relative flex-1 px-5 pt-4">
              <ul className="divide-y divide-white/10 border-y border-white/10">
                {links.map((l, i) => {
                  const active = pathname.startsWith(l.href);
                  return (
                    <li
                      key={l.href}
                      style={{ animationDelay: `${60 + i * 50}ms` }}
                      className="motion-safe:animate-[menu-item-in_320ms_ease-out_both]"
                    >
                      <Link
                        href={l.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className="group flex items-center justify-between py-4"
                      >
                        <span className="flex items-baseline gap-4">
                          <span className="w-6 text-xs font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                          <span className={`text-2xl font-semibold ${active ? "text-accent" : "text-white"}`}>{l.label}</span>
                        </span>
                        <Icon name="arrow" width={20} height={20} className="text-white/40 transition group-hover:translate-x-1 group-hover:text-accent" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="relative space-y-3 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
              <Link href={`/${lang}/book`} onClick={close} className="btn-glow w-full">
                {labels.book}
                <Icon name="arrow" width={18} height={18} />
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <a href={BUSINESS.phoneHref} className="btn border border-white/20 bg-white/10 text-sm text-white hover:bg-white/20">
                  <Icon name="phone" width={18} height={18} />
                  {labels.call}
                </a>
                <a href={BUSINESS.whatsappHref} target="_blank" rel="noopener" className="btn border border-white/20 bg-white/10 text-sm text-white hover:bg-white/20">
                  <Icon name="chat" width={18} height={18} />
                  WhatsApp
                </a>
              </div>
              <div className="flex justify-center pt-1" onClick={close}>
                <LangSwitch lang={lang} label={labels.language} light className="inline-flex" />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
