import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries";
import { BUSINESS } from "@/content/business";
import { Icon } from "./icons";
import cleaner from "../../public/images/hero-cleaner.png";

/**
 * Closing call to action shown above the footer on every public page. On large
 * screens the cut-out cleaner stands on the card's bottom edge and rises above
 * its top edge.
 */
export function CtaCard({ lang, t }: { lang: Locale; t: Dictionary["cta"] }) {
  return (
    <div className="relative rounded-[2rem] bg-gradient-to-br from-[#faf6f1] via-[#f6efe7] to-[#efe6dc] shadow-[0_30px_70px_-30px_rgba(3,20,50,0.5)] ring-1 ring-black/5">
      <div className="grid items-center gap-6 p-7 sm:p-8 md:grid-cols-[1fr_auto] md:gap-8 md:py-9 lg:grid-cols-[1.2fr_auto_220px] lg:pl-12">
        <div>
          <h2 className="max-w-md text-2xl font-light leading-[1.15] tracking-tight text-ink text-balance sm:text-3xl">{t.title}</h2>
          <p className="mt-3 max-w-md text-sm text-ink-soft sm:text-base">{t.body}</p>
        </div>

        <div className="flex flex-col items-start gap-2.5 md:items-center">
          <Link href={`/${lang}/book`} className="btn-glow">
            {t.button}
            <Icon name="arrow" width={18} height={18} />
          </Link>
          <a href={BUSINESS.phoneHref} className="text-sm text-ink-soft hover:text-brand-strong">
            {t.call} <span className="font-semibold text-ink">{BUSINESS.phone}</span>
          </a>
        </div>

        {/* Keeps room in the grid for the cleaner, who is positioned below. */}
        <div aria-hidden="true" className="hidden lg:block" />
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-10 hidden h-[250px] lg:block">
        <div className="absolute inset-x-6 bottom-6 top-1/3 -z-10 rounded-full bg-brand/30 blur-3xl" />
        <Image src={cleaner} alt="" sizes="180px" className="h-full w-auto drop-shadow-[0_20px_30px_rgba(3,20,50,0.25)]" />
      </div>
    </div>
  );
}
