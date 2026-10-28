import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { OfflineBar } from "./app-client";
import { StaffBackdrop } from "./backdrop";
import { t, type Lang } from "./i18n";

type Tab = "home" | "today" | "week" | "hours" | "me";

const TABS: { href: string; icon: IconName; key: Tab }[] = [
  { href: "/staff", icon: "home", key: "home" },
  { href: "/staff/today", icon: "clock", key: "today" },
  { href: "/staff/week", icon: "calendar", key: "week" },
  { href: "/staff/hours", icon: "trend", key: "hours" },
  { href: "/staff/me", icon: "person", key: "me" },
];

export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** App frame: navy header with greeting, offline banner, bottom tab bar (safe-area aware). */
export function StaffShell({
  me,
  tab,
  title,
  subtitle,
  children,
}: {
  me: { name: string; color: string; lang: Lang };
  tab: Tab;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const x = t(me.lang);
  return (
    <div lang={me.lang} className="relative isolate mx-auto flex min-h-svh max-w-lg flex-col">
      <StaffBackdrop tone="light" />
      {/* See-through navy: the photo shows behind the header. */}
      <header className="sticky top-0 z-20 bg-navy/75 px-5 backdrop-blur-md pt-[max(1rem,env(safe-area-inset-top))] pb-5 text-white shadow-lg shadow-navy/20">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold ring-2 ring-white/20" style={{ background: me.color }} aria-hidden>
            {initials(me.name)}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{title}</h1>
            {subtitle && <p className="truncate text-sm text-white/70">{subtitle}</p>}
          </div>
        </div>
      </header>
      <OfflineBar text={x.offline} />
      <main className="flex-1 space-y-4 px-4 pt-4 pb-28">{children}</main>
      <nav
        aria-label={x.nav}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map((tb) => {
            const active = tb.key === tab;
            return (
              <li key={tb.key}>
                <Link
                  href={tb.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-brand-strong" : "text-ink-soft"}`}
                >
                  <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${active ? "bg-brand text-white shadow-[0_6px_14px_-6px_rgba(209,64,0,0.9)]" : ""}`}>
                    <Icon name={tb.icon} width={22} height={22} />
                  </span>
                  {x.tabs[tb.key]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
