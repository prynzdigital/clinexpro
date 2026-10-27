"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { Icon } from "@/components/icons";

// Small client pieces of the staff app: service worker + install prompt,
// offline banner, live on-site timer, pending-aware buttons, sign-out.

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type InstallWindow = Window & { __clinexInstall?: InstallEvent | null };

const DISMISS_KEY = "clinex-staff-install-dismissed";

/** Registers the staff worker and keeps the browser's install offer for later. */
export function StaffPwa() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/staff-sw.js", { scope: "/staff" }).catch(() => {});
    }
    const keep = (e: Event) => {
      e.preventDefault();
      (window as InstallWindow).__clinexInstall = e as InstallEvent;
      window.dispatchEvent(new Event("clinex-install-ready"));
    };
    const installed = () => {
      (window as InstallWindow).__clinexInstall = null;
      window.dispatchEvent(new Event("clinex-install-ready"));
    };
    window.addEventListener("beforeinstallprompt", keep);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", keep);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  return null;
}

const subscribeInstall = (cb: () => void) => {
  window.addEventListener("clinex-install-ready", cb);
  return () => window.removeEventListener("clinex-install-ready", cb);
};

function usePlatform() {
  return useSyncExternalStore(
    subscribeInstall,
    () => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const canPrompt = Boolean((window as InstallWindow).__clinexInstall);
      return `${standalone ? 1 : 0}${ios ? 1 : 0}${canPrompt ? 1 : 0}`;
    },
    () => "000",
  );
}

/**
 * "Install the app" card: a one-tap install on Android/Chrome, step-by-step on
 * iPhone (Safari has no install button). Hidden once installed. On the Today
 * screen it can be dismissed; on the Me screen it stays.
 */
export function InstallCard({ dismissible }: { dismissible?: boolean }) {
  const flags = usePlatform();
  const [standalone, ios, canPrompt] = [flags[0] === "1", flags[1] === "1", flags[2] === "1"];
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!dismissible) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads a browser-only setting
      if (localStorage.getItem(DISMISS_KEY)) setHidden(true);
    } catch {}
  }, [dismissible]);

  if (standalone || hidden || (!ios && !canPrompt)) {
    return dismissible ? null : (
      <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <Icon name="check" width={18} height={18} /> {standalone ? "You're using the installed app." : "Open this page in Chrome or Safari on your phone to install the app."}
      </p>
    );
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setHidden(true);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-strong p-5 text-white shadow-lg">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Icon name="phone" width={24} height={24} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">Install Clinex Staff</h2>
          <p className="text-sm text-white/85">Open your jobs in one tap from your home screen, even with weak signal.</p>
        </div>
        {dismissible && (
          <button type="button" onClick={dismiss} className="-mr-1 -mt-1 grid size-8 place-items-center rounded-full text-white/80 hover:bg-white/15" aria-label="Not now">
            <Icon name="close" width={18} height={18} />
          </button>
        )}
      </div>
      {ios ? (
        <ol className="mt-4 space-y-2 rounded-2xl bg-white/10 p-4 text-sm">
          <li>1. Tap <strong>Share</strong> <span aria-hidden>⬆︎</span> at the bottom of Safari.</li>
          <li>2. Choose <strong>Add to Home Screen</strong>.</li>
          <li>3. Tap <strong>Add</strong>. Open Clinex Staff from your home screen.</li>
        </ol>
      ) : (
        <button
          type="button"
          onClick={async () => {
            const w = window as InstallWindow;
            const prompt = w.__clinexInstall;
            if (!prompt) return;
            await prompt.prompt();
            await prompt.userChoice;
            w.__clinexInstall = null;
            window.dispatchEvent(new Event("clinex-install-ready"));
          }}
          className="mt-4 min-h-12 w-full rounded-full bg-white text-base font-bold text-brand-strong shadow"
        >
          Install app
        </button>
      )}
    </section>
  );
}

const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** Thin banner while the phone has no connection. */
export function OfflineBar() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <p role="status" className="bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
      No signal: showing your jobs as last loaded. Check-in needs a connection.
    </p>
  );
}

/** "1 h 12 min" since check-in, updated every 30 seconds. */
export function Elapsed({ since }: { since: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return null;
  const mins = Math.max(0, Math.floor((now - Date.parse(since)) / 60_000));
  return <span className="tabular-nums">{mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`}</span>;
}

/** Big action button that shows progress while its form is being sent. */
export function ActionButton({ label, pendingLabel, className }: { label: string; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-70`}>
      {pending ? pendingLabel : label}
    </button>
  );
}

/** Signs out and wipes the offline copy of the job pages from this phone. */
export function SignOutButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={() => {
        navigator.serviceWorker?.controller?.postMessage("clear-pages");
        caches?.delete("clinex-staff-pages").catch(() => {});
      }}
    >
      <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white font-semibold text-danger">
        <Icon name="logout" width={18} height={18} /> Sign out
      </button>
    </form>
  );
}
