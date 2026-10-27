import Link from "next/link";
import type { Booking, Lead } from "@/db/schema";
import { Icon, type IconName } from "@/components/icons";
import type { Tone } from "./data-table";

const BOOKING_TONE: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-700",
};

const PAYMENT_TONE: Record<Booking["paymentStatus"], string> = {
  unpaid: "bg-rose-100 text-rose-800",
  deposit_paid: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
  refunded: "bg-zinc-200 text-zinc-700",
};

const LEAD_TONE: Record<Lead["status"], string> = {
  new: "bg-amber-100 text-amber-800",
  contacted: "bg-sky-100 text-sky-800",
  site_visit: "bg-violet-100 text-violet-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-zinc-200 text-zinc-700",
};

export const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " ");

function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{children}</span>;
}

export const BookingBadge = ({ status }: { status: Booking["status"] }) => <Badge tone={BOOKING_TONE[status]}>{label(status)}</Badge>;
export const PaymentBadge = ({ status }: { status: Booking["paymentStatus"] }) => <Badge tone={PAYMENT_TONE[status]}>{label(status)}</Badge>;
const INVOICE_TONE: Record<string, string> = {
  draft: "bg-zinc-200 text-zinc-700",
  unpaid: "bg-amber-100 text-amber-800",
  part_paid: "bg-sky-100 text-sky-800",
  overdue: "bg-rose-100 text-rose-800",
  paid: "bg-emerald-100 text-emerald-800",
  void: "bg-zinc-200 text-zinc-500 line-through",
};
export const InvoiceBadge = ({ state }: { state: string }) => <Badge tone={INVOICE_TONE[state] ?? INVOICE_TONE.draft}>{label(state)}</Badge>;

export const LeadBadge = ({ status }: { status: Lead["status"] }) => <Badge tone={LEAD_TONE[status]}>{label(status)}</Badge>;

export const mur = (n: number) =>
  new Intl.NumberFormat("en-MU", { style: "currency", currency: "MUR", maximumFractionDigits: 0 }).format(n);

export const shortDate = (d: string | Date) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Indian/Mauritius" }).format(
    typeof d === "string" ? new Date(`${d}T12:00:00+04:00`) : d,
  );

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="card p-8 text-center text-sm text-ink-soft">{children}</p>;
}

// --- Colourful stat cards and helpers for the restyled admin ---------------

const CARD: Record<string, { solid: string; icon: string; soft: string }> = {
  orange: { solid: "from-[#e5501a] to-[#b03600]", icon: "bg-brand-soft text-brand-strong", soft: "border-orange-100" },
  navy: { solid: "from-[#0b2a41] to-[#031432]", icon: "bg-slate-100 text-navy", soft: "border-slate-200" },
  emerald: { solid: "from-emerald-600 to-emerald-800", icon: "bg-emerald-50 text-emerald-700", soft: "border-emerald-100" },
  sky: { solid: "from-sky-600 to-sky-800", icon: "bg-sky-50 text-sky-700", soft: "border-sky-100" },
  violet: { solid: "from-violet-600 to-violet-800", icon: "bg-violet-50 text-violet-700", soft: "border-violet-100" },
  amber: { solid: "from-amber-500 to-amber-700", icon: "bg-amber-50 text-amber-700", soft: "border-amber-100" },
  rose: { solid: "from-rose-600 to-rose-800", icon: "bg-rose-50 text-rose-700", soft: "border-rose-100" },
};
export type CardColor = keyof typeof CARD;

/** A headline number. "solid" = coloured gradient card; "soft" = white card with a coloured icon. */
export function StatCard({
  label,
  value,
  note,
  icon,
  color,
  href,
  solid,
}: {
  label: string;
  value: string;
  note?: string;
  icon: IconName;
  color: CardColor;
  href?: string;
  solid?: boolean;
}) {
  const c = CARD[color];
  const body = solid ? (
    <div className={`relative h-full overflow-hidden rounded-2xl bg-gradient-to-br ${c.solid} p-5 text-white shadow-lg shadow-black/5 transition-transform group-hover:-translate-y-0.5`}>
      <Icon name={icon} width={88} height={88} className="pointer-events-none absolute -right-4 -bottom-4 opacity-15" aria-hidden />
      <span className="grid size-10 place-items-center rounded-xl bg-white/15"><Icon name={icon} width={20} height={20} /></span>
      <p className="mt-4 text-sm text-white/80">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-white/75">{note}</p>}
    </div>
  ) : (
    <div className={`flex h-full items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm transition-shadow group-hover:shadow-md ${c.soft}`}>
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${c.icon}`}><Icon name={icon} width={22} height={22} /></span>
      <span className="min-w-0">
        <span className="block text-sm text-ink-soft">{label}</span>
        <span className="mt-0.5 block text-2xl font-bold tabular-nums">{value}</span>
        {note && <span className="mt-0.5 block text-xs text-ink-soft">{note}</span>}
      </span>
    </div>
  );
  return href ? <Link href={href} className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">{body}</Link> : <div className="group">{body}</div>;
}

/** Orange "+ New …" button for page headers. */
export function NewButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="btn-primary min-h-10 gap-1.5 px-4 text-sm">
      <Icon name="plus" width={16} height={16} /> {label}
    </Link>
  );
}

export const BOOKING_TONE_NAME: Record<Booking["status"], Tone> = { pending: "amber", confirmed: "sky", completed: "emerald", cancelled: "gray" };
export const PAYMENT_TONE_NAME: Record<Booking["paymentStatus"], Tone> = { unpaid: "rose", deposit_paid: "sky", paid: "emerald", refunded: "gray" };
export const LEAD_TONE_NAME: Record<Lead["status"], Tone> = { new: "amber", contacted: "sky", site_visit: "violet", won: "emerald", lost: "gray" };

/** Shared error / success line under admin forms. */
export function FormMessage({ state }: { state: { status: string; message?: string } }) {
  if (!state.message || state.status === "idle") return null;
  const error = state.status === "error";
  return (
    <p role={error ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-sm font-medium ${error ? "bg-danger/10 text-danger" : "bg-emerald-50 text-emerald-900"}`}>
      {state.message}
    </p>
  );
}
