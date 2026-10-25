"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

const FRONT_MS = 6000;
const BACK_MS = 9000;

type Props = {
  trust: { icon: IconName; label: string }[];
  ad: {
    image: StaticImageData;
    imageAlt: string;
    title: string;
    body: string;
    plans: { label: string; saving: string }[];
    cta: { href: string; label: string };
  };
  labels: { showOffer: string; showHighlights: string };
};

/**
 * Card under the hero: shows the trust points, then flips to a regular-plan ad
 * and back. Pauses on hover/focus; a button flips it by hand. With reduced
 * motion it doesn't auto-flip and swaps faces without the 3D turn.
 */
export function PromoFlipCard({ trust, ad, labels }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setFlipped((f) => !f), flipped ? BACK_MS : FRONT_MS);
    return () => clearTimeout(timer);
  }, [flipped, held]);

  const face = (side: "front" | "back", children: ReactNode) => {
    const visible = (side === "back") === flipped;
    return (
      <div
        aria-hidden={!visible}
        inert={!visible}
        className={`col-start-1 row-start-1 grid overflow-hidden rounded-[1.75rem] bg-white [backface-visibility:hidden] motion-reduce:transition-opacity ${
          side === "back" ? "[transform:rotateX(180deg)]" : ""
        } motion-reduce:[transform:none] ${visible ? "motion-reduce:opacity-100" : "motion-reduce:pointer-events-none motion-reduce:opacity-0"}`}
      >
        {children}
      </div>
    );
  };

  return (
    <div
      className="relative [perspective:1800px]"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
    >
      {/* Soft orange-and-blue glow underneath */}
      <div
        aria-hidden="true"
        className="absolute inset-x-10 -bottom-6 top-8 -z-10 rounded-[2rem] bg-gradient-to-r from-brand/35 via-accent/25 to-[#1e73be]/35 blur-2xl"
      />
      <div
        className={`grid shadow-[0_24px_60px_-24px_rgba(3,20,50,0.35)] transition-transform duration-[900ms] ease-[cubic-bezier(0.4,0.2,0.2,1)] [transform-style:preserve-3d] motion-reduce:transition-none rounded-[1.75rem] ${
          flipped ? "[transform:rotateX(180deg)] motion-reduce:[transform:none]" : ""
        }`}
      >
        {face(
          "front",
          <ul className="grid h-full grid-cols-2 content-center gap-x-4 gap-y-6 p-6 text-sm font-semibold sm:p-8 lg:grid-cols-4 lg:gap-6 lg:px-10 lg:py-9 lg:text-base">
            {trust.map((item) => (
              <li key={item.label} className="flex items-center gap-3 lg:gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong lg:size-14">
                  <Icon name={item.icon} width={22} height={22} />
                </span>
                {item.label}
              </li>
            ))}
          </ul>,
        )}
        {face(
          "back",
          <div className="grid h-full grid-cols-[96px_1fr] items-center gap-4 p-4 sm:grid-cols-[160px_1fr] sm:gap-6 sm:p-5 lg:grid-cols-[260px_1fr_auto] lg:gap-8 lg:p-5 lg:pr-10">
            <div className="relative h-full min-h-24 overflow-hidden rounded-2xl sm:min-h-32">
              <Image src={ad.image} alt={ad.imageAlt} fill sizes="(min-width: 1024px) 260px, 160px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight text-ink sm:text-2xl">{ad.title}</h2>
              <p className="mt-1 hidden text-sm text-ink-soft sm:block">{ad.body}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {ad.plans.map((p) => (
                  <li key={p.label} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
                    {p.label} · {p.saving}
                  </li>
                ))}
              </ul>
            </div>
            <Link href={ad.cta.href} className="btn-glow col-span-2 lg:col-span-1">
              {ad.cta.label}
              <Icon name="arrow" width={18} height={18} />
            </Link>
          </div>,
        )}
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="absolute -top-3 right-6 z-10 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink-soft shadow-sm hover:text-brand-strong"
      >
        {flipped ? labels.showHighlights : labels.showOffer}
      </button>
    </div>
  );
}
