"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./icons";

/** Floating button that appears after scrolling down and returns to the top. */
export function BackToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  // The booking page pins its price bar to the bottom on phones; sit above it there.
  const raised = /\/book$/.test(pathname);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      aria-label={label}
      tabIndex={visible ? 0 : -1}
      className={`fixed right-4 z-40 grid size-12 place-items-center rounded-full border border-white/15 bg-navy text-white shadow-[0_10px_30px_-6px_rgba(3,20,50,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand sm:right-6 ${
        raised ? "bottom-40 lg:bottom-6" : "bottom-5 sm:bottom-6"
      } ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <Icon name="arrow" width={20} height={20} className="-rotate-90" />
    </button>
  );
}
