import { and, asc, desc, eq, inArray, ne, notExists } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { money, summarise } from "@/lib/invoices";
import { getService } from "@/content/services";
import { PageHeader, StatCard, label, shortDate } from "../ui";
import { DataTable, type Row, type Tone } from "../data-table";
import { createForBooking, deleteDraft, draftAllCompleted } from "./actions";

const STATE_TONE: Record<string, Tone> = { draft: "gray", unpaid: "amber", part_paid: "sky", overdue: "rose", paid: "emerald", void: "gray" };

export const metadata = { title: "Invoices" };

const FILTERS = ["all", "draft", "unpaid", "overdue", "part_paid", "paid", "void"] as const;

export default async function InvoicesPage({ searchParams }: PageProps<"/admin/invoices">) {
  await requireAdmin();
  const { created } = await searchParams;
  const db = await getDb();
  const { invoices: i, invoicePayments: p, bookings: b, customers: c } = schema;

  const all = await db.select().from(i).orderBy(desc(i.createdAt)).limit(500);
  const paid = all.length ? await db.select().from(p).where(inArray(p.invoiceId, all.map((x) => x.id))) : [];
  const rows = all.map((invoice) => ({ invoice, ...summarise(invoice, paid.filter((x) => x.invoiceId === invoice.id)) }));

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

  const tableRows: Row[] = rows.map(({ invoice, balanceCents, state }) => ({
    id: invoice.id,
    href: `/admin/invoices/${invoice.id}`,
    canDelete: invoice.status === "draft",
    filter: state,
    cells: {
      number: { text: invoice.number ?? "Draft", mono: Boolean(invoice.number), sort: invoice.number ?? `~${invoice.id}` },
      customer: { text: invoice.billName, sub: invoice.billEmail ?? undefined },
      issued: { text: invoice.issueDate ? shortDate(invoice.issueDate) : "—", sort: invoice.issueDate ?? "" },
      due: { text: invoice.dueDate ? shortDate(invoice.dueDate) : "—", sort: invoice.dueDate ?? "" },
      total: { text: money(invoice.totalCents), sort: invoice.totalCents },
      balance: { text: invoice.status === "issued" ? money(balanceCents) : "—", sort: invoice.status === "issued" ? balanceCents : -1 },
      status: { text: label(state), badge: STATE_TONE[state] },
    },
  }));

  return (
    <>
      <PageHeader title="Invoices" subtitle="Bill finished jobs, record payments, export for the accountant" />

      {created && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {created} draft invoice{created === "1" ? "" : "s"} created. Check them, then issue.
        </p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={money(outstanding)} icon="wallet" color="orange" />
        <StatCard label="Overdue" value={money(overdue)} icon="alert" color={overdue ? "rose" : "emerald"} note={overdue ? "chase these first" : "nothing overdue"} />
        <StatCard label="Received this month" value={money(receivedThisMonth)} icon="trend" color="emerald" />
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

      <DataTable
        columns={[
          { key: "number", label: "Invoice" },
          { key: "customer", label: "Customer" },
          { key: "issued", label: "Issued", hideOnMobile: true },
          { key: "due", label: "Due", hideOnMobile: true },
          { key: "total", label: "Total", align: "right" },
          { key: "balance", label: "Balance", align: "right" },
          { key: "status", label: "Status" },
        ]}
        rows={tableRows}
        filters={FILTERS.filter((f) => f !== "all").map((f) => ({ value: f, label: label(f) }))}
        defaultSort={{ key: "number", dir: "desc" }}
        searchPlaceholder="Search number, customer, email"
        empty="No invoices yet. They start from finished jobs, or from a customer's page."
        deleteAction={deleteDraft}
        deleteNoun="draft invoice"
      />

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
