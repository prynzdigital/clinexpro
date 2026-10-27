import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { SITE_URL } from "@/lib/i18n";
import { invoiceSettings, loadInvoice, money } from "@/lib/invoices";
import { InvoiceDocument } from "@/components/invoice-document";
import { InvoiceBadge, PageHeader, shortDate } from "../../ui";
import { removePayment } from "../actions";
import { DraftEditor, PaymentForm, SendAndShare, VoidForm } from "./invoice-forms";

export const metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: PageProps<"/admin/invoices/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const loaded = await loadInvoice({ id });
  if (!loaded) notFound();
  const { invoice, lines, paid, paidCents, balanceCents, state } = loaded;
  const settings = invoiceSettings();

  const db = await getDb();
  const [booking] = invoice.bookingId
    ? await db.select({ id: schema.bookings.id, ref: schema.bookings.ref }).from(schema.bookings).where(eq(schema.bookings.id, invoice.bookingId))
    : [];

  return (
    <>
      <Link href="/admin/invoices" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Invoices</Link>
      <PageHeader
        title={invoice.number ?? "Draft invoice"}
        subtitle={[
          invoice.billName,
          booking && `booking ${booking.ref}`,
          invoice.issueDate && `issued ${shortDate(invoice.issueDate)}`,
        ].filter(Boolean).join(" · ")}
      >
        <InvoiceBadge state={state} />
      </PageHeader>

      {invoice.status === "draft" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_1fr]">
          <DraftEditor invoice={invoice} lines={lines} vatRateBp={invoice.vatRateBp} />
          <aside className="space-y-3 text-sm">
            <div className="card space-y-2 p-5">
              <h2 className="font-semibold">Before issuing</h2>
              <p>Check the lines and amounts. Issuing gives the invoice its number ({`INV-${mauritiusDate().slice(0, 4)}-…`}) and locks it.</p>
              {invoice.bookingId && <p>Any deposit already paid online for this booking is credited automatically.</p>}
              <p className="text-ink-soft">{invoice.vatRateBp ? `VAT: ${invoice.vatRateBp / 100}%, included in prices.` : "VAT: not charged (not set up)."}</p>
            </div>
            {booking && <Link href={`/admin/bookings/${booking.id}`} className="block font-medium text-brand-strong hover:underline">Open booking {booking.ref}</Link>}
          </aside>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="card overflow-hidden">
            <InvoiceDocument invoice={invoice} lines={lines} paid={paid} paidCents={paidCents} balanceCents={balanceCents} seller={settings} />
          </div>

          <aside className="space-y-6">
            {invoice.status === "void" ? (
              <section className="card p-5 text-sm">
                <h2 className="font-semibold">Voided</h2>
                <p className="mt-1">{invoice.voidReason}</p>
              </section>
            ) : (
              <>
                <section className="card space-y-3 p-5">
                  <h2 className="font-semibold">Send to the customer</h2>
                  <SendAndShare id={invoice.id} link={`${SITE_URL}/i/${invoice.token}`} email={invoice.billEmail} sentAt={invoice.sentAt ? shortDate(invoice.sentAt) : null} />
                </section>

                {balanceCents > 0 && (
                  <section className="card space-y-3 p-5">
                    <h2 className="font-semibold">Record a payment <span className="font-normal text-ink-soft">· {money(balanceCents)} due</span></h2>
                    <PaymentForm id={invoice.id} balance={balanceCents} today={mauritiusDate()} />
                  </section>
                )}

                {paid.some((p) => !p.paymentId) && (
                  <section className="card space-y-2 p-5 text-sm">
                    <h2 className="font-semibold">Payments entered by hand</h2>
                    <ul className="divide-y divide-line">
                      {paid.filter((p) => !p.paymentId).map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                          <span>{shortDate(p.receivedOn)} · {money(p.amountCents)}</span>
                          <form action={removePayment}>
                            <input type="hidden" name="paymentId" value={p.id} />
                            <button type="submit" className="text-ink-soft hover:text-danger hover:underline">Remove</button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {paidCents === 0 && (
                  <section className="card p-5">
                    <VoidForm id={invoice.id} />
                  </section>
                )}
              </>
            )}
            {booking && <Link href={`/admin/bookings/${booking.id}`} className="block text-sm font-medium text-brand-strong hover:underline">Open booking {booking.ref}</Link>}
          </aside>
        </div>
      )}
    </>
  );
}
