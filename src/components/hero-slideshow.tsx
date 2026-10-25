"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "./icons";

export type Slide = { slug: string; src: string; name: string; meta: string; href: string };

const INTERVAL_MS = 5500;

/** Cross-fading photo slideshow with a caption that links to the shown service. */
export function HeroSlideshow({ slides, labels }: { slides: Slide[]; labels: { show: string; pause: string; play: string } }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    // No autoplay for people who asked their device for reduced motion.
    if (!playing || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [playing, slides.length]);

  const current = slides[index];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-navy shadow-xl" aria-roledescription="carousel">
      <div className="relative aspect-[4/3] sm:aspect-[15/13]">
        {slides.map((s, i) => (
          <Image
            key={s.slug}
            src={s.src}
            alt={s.name}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 560px, 100vw"
            aria-hidden={i !== index}
            className={`object-cover transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-navy/85 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
        <Link href={current.href} className="group min-w-0 text-white" aria-live="polite">
          <span className="block truncate text-lg font-bold">{current.name}</span>
          <span className="inline-flex items-center gap-1 text-sm text-white/80 group-hover:text-white">
            {current.meta}
            <Icon name="arrow" width={14} height={14} />
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => {
                setIndex(i);
                setPlaying(false);
              }}
              aria-label={`${labels.show} ${s.name}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-accent" : "w-2 bg-white/60 hover:bg-white"}`}
            />
          ))}
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? labels.pause : labels.play}
            className="ml-1 grid size-7 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
