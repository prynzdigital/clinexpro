"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const DISMISS_KEY = "clinex-install-dismissed";

/** Registers the service worker and offers an install banner where the browser supports it. */
export function Pwa({ labels }: { labels: { install: string; installBody: string; installCta: string; dismiss: string } }) {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      try {
        if (localStorage.getItem(DISMISS_KEY)) return;
      } catch {}
      setInstallEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!installEvent) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setInstallEvent(null);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-lg">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{labels.install}</p>
        <p className="text-sm text-ink-soft">{labels.installBody}</p>
      </div>
      <button type="button" onClick={dismiss} className="text-sm text-ink-soft hover:text-ink">
        {labels.dismiss}
      </button>
      <button
        type="button"
        className="btn-primary min-h-10 px-4 text-sm"
        onClick={async () => {
          await installEvent.prompt();
          await installEvent.userChoice;
          setInstallEvent(null);
        }}
      >
        {labels.installCta}
      </button>
    </div>
  );
}
