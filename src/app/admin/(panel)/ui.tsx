import type { Booking, Lead } from "@/db/schema";

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
