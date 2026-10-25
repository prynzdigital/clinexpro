import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/dictionaries";
import { BUSINESS } from "@/content/business";
import { Icon } from "./icons";

// 3×3 keycap grid seen in isometric perspective; the centre key is the glossy
// orange Clinex key, the rest are soft white tiles.
const TILES = Array.from({ length: 9 }, (_, i) => i);

/** Closing call to action shown above the footer on every public page. */
export function CtaCard({ lang, t }: { lang: Locale; t: Dictionary["cta"] }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#faf6f1] via-[#f6efe7] to-[#efe6dc] shadow-[0_30px_70px_-30px_rgba(3,20,50,0.5)] ring-1 ring-black/5">
      <div className="grid items-center gap-8 p-7 sm:p-10 md:grid-cols-[1.3fr_auto] lg:grid-cols-[1.2fr_auto_1fr] lg:gap-10 lg:py-12 lg:pl-14 lg:pr-0">
        <div>
          <h2 className="max-w-md text-3xl font-light leading-[1.1] tracking-tight text-ink text-balance sm:text-4xl">{t.title}</h2>
          <p className="mt-4 max-w-md text-ink-soft">{t.body}</p>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-center">
          <Link href={`/${lang}/book`} className="btn-glow">
            {t.button}
            <Icon name="arrow" width={18} height={18} />
          </Link>
          <a href={BUSINESS.phoneHref} className="text-sm text-ink-soft hover:text-brand-strong">
            {t.call} <span className="font-semibold text-ink">{BUSINESS.phone}</span>
          </a>
        </div>

        {/* Decorative keycaps */}
        <div aria-hidden="true" className="relative hidden h-56 lg:block">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/3 -translate-y-1/2 [perspective:900px]">
            <div className="grid grid-cols-3 gap-3 [transform:rotateX(55deg)_rotateZ(-38deg)] [transform-style:preserve-3d]">
              {TILES.map((i) =>
                i === 4 ? (
                  <div
                    key={i}
                    className="relative grid size-24 place-items-center rounded-[1.4rem] bg-gradient-to-br from-[#ff8a4c] via-brand to-[#c23a02] shadow-[0_18px_0_#a83202,0_30px_50px_rgba(236,73,4,0.55)] [transform:translateZ(26px)]"
                  >
                    <span className="absolute inset-1.5 rounded-[1.1rem] bg-gradient-to-b from-white/45 to-transparent opacity-70" />
                    <Image src="/brand/icon-mark-white.png" alt="" width={56} height={56} className="relative drop-shadow-[0_2px_2px_rgba(120,30,0,0.4)]" />
                  </div>
                ) : (
                  <div
                    key={i}
                    className="size-24 rounded-[1.4rem] bg-gradient-to-br from-white to-[#ece6df] shadow-[0_12px_0_#d9d1c8,0_20px_30px_rgba(3,20,50,0.12)]"
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
