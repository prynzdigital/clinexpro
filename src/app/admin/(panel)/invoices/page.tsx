import Link from "next/link";
import { and, asc, desc, eq, inArray, ne, notExists } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { money, summarise } from "@/lib/invoices";
import { getService } from "@/content/services";
import { Empty, InvoiceBadge, PageHeader, label, shortDate } from "../ui";
import { createForBooking, draftAllCompleted } from "./actions";

export const metadata = { title: "Invoices" };

const FILTERS = ["all", "draft", "unpaid", "overdue", "part_paid", "paid", "void"] as const;

export default async function InvoicesPage({ searchParams }: PageProps<"/admin/invoices">) {
  await requireAdmin();
  const { status, created } = await searchParams;
  const filter = FILTERS.find((f) => f === status) ?? "all";
  const db = await getDb();
  const { invoices: i, invoicePayments: p, bookings: b, customers: c } = schema;

  const all = await db.select().from(i).orderBy(desc(i.createdAt)).limit(500);
  const paid = all.length ? await db.select().from(p).where(inArray(p.invoiceId, all.map((x) => x.id))) : [];
  const rows = all.map((invoice) => ({ invoice, ...summarise(invoice, paid.filter((x) => x.invoiceId === invoice.id)) }));
  const shown = filter === "all" ? rows : rows.filter((r) => r.state === filter);

  const live = rows.filter((r) => r.invoice.status === "issued");
  const outstanding = live.reduce((sum, r) => sum + Math.max(r.balanceCents, 0), 0);
  const overdue = live.filter((r) => r.state === "overdue").reduce((sum, r) => sum + r.balanceCents, 0);
  const month = mauritiusDate().slice(0, 7);
  const receivedThisMonth = paid.filter((x) => x.receivedOn.startsWith(month)).reduce((sum, x) => sum + x.amountCents, 0);

  // Finished jobs with no invoice yet.
  const ready = await db
    .select({ booking: b, customer: c.name })
    .from(b)
    .innerJoin(c, eq(b.customerId, c.id))
    .where(and(eq(b.status, "completed"), notExists(db.select().from(i).where(and(eq(i.bookingId, b.id), ne(i.status, "void"))))))
    .orderBy(asc(b.date))
    .limit(50);

  const counts = Object.fromEntries(FILTERS.map((f) => [f, f === "all" ? rows.length : rows.filter((r) => r.state === f).length]));

  return (
    <>
      <PageHeader title="Invoices" subtitle="Bill finished jobs, record payments, export for the accountant" />

      {created && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {created} draft invoice{created === "1" ? "" : "s"} created. Check them, then issue.
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Outstanding" value={money(outstanding)} />
        <Stat label="Overdue" value={money(overdue)} tone={overdue ? "text-rose-700" : undefined} />
        <Stat label="Received this month" value={money(receivedThisMonth)} />
      </div>

      {ready.length > 0 && (
        <section className="card mb-6 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">
              Ready to invoice <span className="font-normal text-ink-soft">· {ready.length} finished job{ready.length === 1 ? "" : "s"}</span>
            </h2>
            <form action={draftAllCompleted}>
              <button type="submit" className="btn-primary min-h-10 text-sm">Create all drafts</button>
            </form>
          </div>
          <ul className="divide-y divide-line text-sm">
            {ready.slice(0, 8).map(({ booking, customer }) => (
              <li key={booking.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">
                  <strong>{customer}</strong> · {getService(booking.service)?.name.en} · {shortDate(booking.date)} · {booking.ref}
                </span>
                <form action={createForBooking}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button type="submit" className="font-medium text-brand-strong hover:underline">Create</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/invoices" : `/admin/invoices?status=${f}`}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${filter === f ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-ink"}`}
          >
            {label(f)} <span className="opacity-70">{counts[f]}</span>
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty>{rows.length ? "No invoices in this list." : "No invoices yet. They start from finished jobs, or from a customer's page."}</Empty>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="p-3 font-medium">Invoice</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium">Issued</th>
                <th className="p-3 font-medium">Due</th>
                <th className="p-3 text-right font-medium">Total</th>
                <th className="p-3 text-right font-medium">Balance</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map(({ invoice, balanceCents, state }) => (
                <tr key={invoice.id} className="hover:bg-surface-alt">
                  <td className="p-3 font-medium">
                    <Link href={`/admin/invoices/${invoice.id}`} className="text-brand-strong hover:underline">{invoice.number ?? "Draft"}</Link>
                  </td>
                  <td className="p-3">{invoice.billName}</td>
                  <td className="p-3">{invoice.issueDate ? shortDate(invoice.issueDate) : "—"}</td>
                  <td className="p-3">{invoice.dueDate ? shortDate(invoice.dueDate) : "—"}</td>
                  <td className="p-3 text-right tabular-nums">{money(invoice.totalCents)}</td>
                  <td className="p-3 text-right tabular-nums">{invoice.status === "issued" ? money(balanceCents) : "—"}</td>
                  <td className="p-3"><InvoiceBadge state={state} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="card mt-6 p-5">
        <h2 className="mb-1 font-semibold">Export for the accountant</h2>
        <p className="mb-3 text-sm text-ink-soft">Spreadsheet files (CSV) of issued invoices and of payments received, for the dates you pick.</p>
        <form action="/admin/invoices/export" method="get" className="flex flex-wrap items-end gap-3">
          <label>
            <span className="label">From</span>
            <input type="date" name="from" required defaultValue={`${month}-01`} className="field" />
          </label>
          <label>
            <span className="label">To</span>
            <input type="date" name="to" required defaultValue={mauritiusDate()} className="field" />
          </label>
          <button type="submit" name="type" value="invoices" className="btn-secondary min-h-11">Invoices CSV</button>
          <button type="submit" name="type" value="payments" className="btn-secondary min-h-11">Payments CSV</button>
        </form>
      </section>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
