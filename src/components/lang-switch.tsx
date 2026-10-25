"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function LangSwitch({ lang, label, className = "" }: { lang: Locale; label: string; className?: string }) {
  const pathname = usePathname();
  const other: Locale = lang === "en" ? "fr" : "en";
  const href = pathname.replace(/^\/(en|fr)(?=\/|$)/, `/${other}`);
  return (
    <Link
      href={href}
      hrefLang={other}
      className={`items-center rounded-full px-3 py-2 text-sm font-medium text-ink-soft hover:text-brand-strong ${className}`}
    >
      {label}
    </Link>
  );
}
