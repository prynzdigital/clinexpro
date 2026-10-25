"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { Icon } from "./icons";
import { LangSwitch } from "./lang-switch";

export function MobileMenu({
  links,
  lang,
  labels,
  light = false,
}: {
  links: { href: string; label: string }[];
  lang: Locale;
  labels: { menu: string; close: string; language: string };
  /** White icon, for use over the dark home hero. */
  light?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`grid size-10 place-items-center rounded-full ${light ? "text-white hover:bg-white/15" : "text-ink hover:bg-surface-alt"}`}
        aria-label={labels.menu}
        aria-expanded={open}
      >
        <Icon name="menu" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-white" role="dialog" aria-modal="true">
          <div className="container-page flex h-16 items-center justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid size-10 place-items-center rounded-full hover:bg-surface-alt"
              aria-label={labels.close}
            >
              <Icon name="close" />
            </button>
          </div>
          <nav className="container-page flex flex-col gap-1 pt-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-4 text-xl font-semibold text-ink hover:bg-surface-alt"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-4 border-t border-line pt-4" onClick={() => setOpen(false)}>
              <LangSwitch lang={lang} label={labels.language} className="inline-flex" />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
