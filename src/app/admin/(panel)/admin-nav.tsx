"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Overview", icon: "chart" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { href: "/admin/customers", label: "Customers", icon: "users" },
  { href: "/admin/leads", label: "Business leads", icon: "briefcase" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
      {LINKS.map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? "bg-brand-soft text-brand-strong" : "text-ink-soft hover:bg-surface-alt hover:text-ink"}`}
          >
            <Icon name={l.icon} width={18} height={18} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
