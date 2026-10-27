"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const LINKS: { href: string; label: string; icon: IconName; ownerOnly?: boolean }[] = [
  { href: "/admin", label: "Overview", icon: "home" },
  { href: "/admin/insights", label: "Insights", icon: "chart", ownerOnly: true },
  { href: "/admin/schedule", label: "Schedule", icon: "board" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { href: "/admin/invoices", label: "Invoices", icon: "receipt" },
  { href: "/admin/customers", label: "Customers", icon: "users" },
  { href: "/admin/leads", label: "Business leads", icon: "briefcase" },
  { href: "/admin/staff", label: "Staff", icon: "badge" },
  { href: "/admin/team", label: "Team", icon: "shield", ownerOnly: true },
  { href: "/admin/account", label: "My account", icon: "person" },
];

export function AdminNav({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-4 lg:pb-4">
      {LINKS.filter((l) => !l.ownerOnly || role === "owner").map((l) => {
        const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-brand text-white shadow-[0_8px_20px_-8px_rgba(209,64,0,0.8)]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
          >
            <Icon name={l.icon} width={18} height={18} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
