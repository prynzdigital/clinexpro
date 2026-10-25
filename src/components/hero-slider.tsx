"use client";

import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Icon } from "./icons";

export type HeroSlide = {
  key: string;
  image: string | StaticImageData;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  price?: string;
  cta: { href: string; label: string };
  secondary: { href: string; label: string };
};

const SLIDE_MS = 7000;

/**
 * Full-bleed hero carousel: each slide brings its own photo and copy.
 * Autoplay is driven by the progress bar's CSS animation, so pausing (hover,
 * focus, the pause button) and reduced motion (animation disabled) need no timers.
 */
export function HeroSlider({
  slides,
  labels,
  children,
}: {
  slides: HeroSlide[];
  labels: { prev: string; next: string; pause: string; play: string; show: string };
  children?: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = (i: number) => setIndex((i + slides.length) % slides.length);
  const running = !paused && !hovered;

  return (
    <section
      className="relative -mt-20 flex min-h-[640px] overflow-hidden bg-navy text-white sm:min-h-[700px] lg:h-[100svh] lg:max-h-[880px]"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "touch") touchX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (touchX.current === null) return;
        const dx = e.clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {/* Photos: full-bleed on phones; on large screens they fill the right
          62% and fade into the navy behind the copy, keeping subjects clear of the text. */}
      <div className="absolute inset-0 overflow-hidden lg:left-[38%]">
        {slides.map((s, i) => (
          <div
            key={s.key}
            aria-hidden="true"
            className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
          >
            <Image
              src={s.image}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 62vw, 100vw"
              className={`object-cover ${i === index ? "animate-hero-zoom motion-reduce:animate-none" : ""}`}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/40 lg:bg-gradient-to-r lg:from-navy lg:via-navy/25 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 hidden h-1/3 bg-gradient-to-t from-navy/80 to-transparent lg:block" />
      </div>
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-navy/70 to-transparent" />

      {/* Copy */}
      <div className="container-page relative z-10 flex flex-col justify-end pb-36 pt-32 sm:justify-center sm:pb-40 lg:pb-32">
        <div className="grid max-w-2xl">
          {slides.map((s, i) => {
            const active = i === index;
            const Title = i === 0 ? "h1" : "h2";
            return (
              <div
                key={s.key}
                aria-hidden={!active}
                className={`col-start-1 row-start-1 space-y-6 transition-all duration-700 ${
                  active ? "translate-y-0 opacity-100 delay-200" : "pointer-events-none translate-y-6 opacity-0"
                }`}
              >
                <p className="inline-flex flex-wrap items-center gap-x-2 rounded-2xl border border-white/20 sm:rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold backdrop-blur-md">
                  <span className="size-2 rounded-full bg-accent" />
                  {s.eyebrow}
                  {s.price && <span className="text-white/70">· {s.price}</span>}
                </p>
                <Title className="text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl">
                  {s.title}
                </Title>
                <p className="max-w-xl text-lg text-white/80 sm:text-xl">{s.body}</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href={s.cta.href} tabIndex={active ? 0 : -1} className="btn-primary shadow-lg shadow-brand/30">
                    {s.cta.label}
                    <Icon name="arrow" width={18} height={18} />
                  </Link>
                  <Link
                    href={s.secondary.href}
                    tabIndex={active ? 0 : -1}
                    className="btn border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20"
                  >
                    {s.secondary.label}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>

      {/* Controls */}
      <div className="absolute inset-x-0 bottom-0 z-10 pb-6 sm:pb-8">
        <div className="container-page flex items-end gap-4">
          <ol className="flex flex-1 gap-2 sm:gap-3">
            {slides.map((s, i) => (
              <li key={s.key} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`${labels.show} ${s.label}`}
                  aria-current={i === index}
                  className="group block w-full py-2 text-left"
                >
                  <span className={`mb-2 hidden truncate text-xs font-semibold uppercase tracking-wider lg:block ${i === index ? "text-white" : "text-white/55 group-hover:text-white/80"}`}>
                    {s.label}
                  </span>
                  <span className="block h-1 overflow-hidden rounded-full bg-white/25">
                    {i < index && <span className="block h-full w-full bg-white/70" />}
                    {i === index && (
                      <span
                        key={index}
                        onAnimationEnd={() => go(index + 1)}
                        style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }}
                        className="block h-full origin-left animate-hero-progress bg-accent motion-reduce:w-full motion-reduce:animate-none"
                      />
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => go(index - 1)} aria-label={labels.prev} className="grid size-10 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md hover:bg-white/20">
              <Icon name="arrow" width={18} height={18} className="rotate-180" />
            </button>
            <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? labels.play : labels.pause} className="hidden size-10 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md hover:bg-white/20 sm:grid">
              {paused ? (
                <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z" /></svg>
              )}
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label={labels.next} className="grid size-10 place-items-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md hover:bg-white/20">
              <Icon name="arrow" width={18} height={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
