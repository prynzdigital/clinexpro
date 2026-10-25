"use client";

import Image, { type StaticImageData } from "next/image";
import { useState } from "react";

/**
 * YouTube video behind a poster: nothing from YouTube loads until the visitor
 * presses play, then the privacy-enhanced (no-cookie) player starts.
 */
export function VideoCard({
  videoId,
  poster,
  title,
  caption,
  playLabel,
}: {
  videoId: string;
  poster: StaticImageData;
  title: string;
  caption: string;
  playLabel: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-x-8 -bottom-6 top-10 -z-10 rounded-[2rem] bg-gradient-to-r from-brand/35 via-accent/20 to-[#1e73be]/35 blur-2xl"
      />
      <div className="relative aspect-video overflow-hidden rounded-[1.75rem] bg-navy shadow-[0_24px_60px_-24px_rgba(3,20,50,0.45)]">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} aria-label={playLabel} className="group absolute inset-0 text-left">
            <Image src={poster} alt="" fill sizes="(min-width: 1024px) 600px, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="relative grid size-20 place-items-center rounded-full bg-brand text-white shadow-[0_0_0_10px_rgba(236,73,4,0.25),0_0_50px_rgba(252,81,29,0.6)] transition group-hover:scale-110 sm:size-24">
                <span className="absolute inset-0 rounded-full bg-brand/50 motion-safe:animate-ping" />
                <svg viewBox="0 0 24 24" width={30} height={30} fill="currentColor" className="relative ml-1" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
            <span className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent">{caption}</span>
              <span className="mt-1 block text-xl font-bold sm:text-2xl">{title}</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
