import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { OfflineBar } from "./app-client";

const TABS: { href: string; label: string; icon: IconName; key: "today" | "week" | "me" }[] = [
  { href: "/staff", label: "Today", icon: "clock", key: "today" },
  { href: "/staff/week", label: "Week", icon: "calendar", key: "week" },
  { href: "/staff/me", label: "Me", icon: "person", key: "me" },
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
  me: { name: string; color: string };
  tab: "today" | "week" | "me";
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col">
      <header className="sticky top-0 z-20 bg-gradient-to-br from-[#0b2a41] to-navy px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-5 text-white shadow-lg shadow-navy/20">
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
      <OfflineBar />
      <main className="flex-1 space-y-4 px-4 pt-4 pb-28">{children}</main>
      <nav
        aria-label="Staff app"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-3">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <li key={t.key}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${active ? "text-brand-strong" : "text-ink-soft"}`}
                >
                  <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${active ? "bg-brand-soft" : ""}`}>
                    <Icon name={t.icon} width={22} height={22} />
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
