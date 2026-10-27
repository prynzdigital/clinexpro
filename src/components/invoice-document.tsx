import type { Invoice, InvoiceLine, InvoicePayment } from "@/db/schema";
import { BUSINESS } from "@/content/business";
import { money } from "@/lib/invoices";
import { Logo } from "./logo";

// The invoice as the customer sees it, in their language. Server component;
// also used inside the admin page. Prints cleanly on A4 (see /i/[token]).

const COPY = {
  en: {
    invoice: "Invoice",
    draft: "Draft (not yet issued)",
    void: "Void",
    billTo: "Bill to",
    number: "Invoice no.",
    date: "Date",
    due: "Due by",
    description: "Description",
    qty: "Qty",
    unit: "Unit price",
    amount: "Amount",
    total: "Total",
    vatIncl: (rate: string) => `Including VAT ${rate}`,
    paid: "Paid",
    balance: "Balance due",
    paidInFull: "Paid in full. Thank you!",
    payments: "Payments received",
    howToPay: "How to pay",
    payRef: (n: string) => `Please quote ${n} as the payment reference.`,
    brn: "BRN",
    vatNo: "VAT no.",
    methods: { cash: "Cash", bank_transfer: "Bank transfer", juice: "Juice", card_online: "Card (online)", cheque: "Cheque", other: "Other" },
  },
  fr: {
    invoice: "Facture",
    draft: "Brouillon (non émise)",
    void: "Annulée",
    billTo: "Facturé à",
    number: "Facture n°",
    date: "Date",
    due: "À régler avant le",
    description: "Désignation",
    qty: "Qté",
    unit: "Prix unitaire",
    amount: "Montant",
    total: "Total",
    vatIncl: (rate: string) => `Dont TVA ${rate}`,
    paid: "Déjà réglé",
    balance: "Reste à payer",
    paidInFull: "Facture réglée. Merci !",
    payments: "Paiements reçus",
    howToPay: "Moyens de paiement",
    payRef: (n: string) => `Merci d'indiquer ${n} en référence du paiement.`,
    brn: "BRN",
    vatNo: "N° TVA",
    methods: { cash: "Espèces", bank_transfer: "Virement", juice: "Juice", card_online: "Carte (en ligne)", cheque: "Chèque", other: "Autre" },
  },
};

export type Seller = { brn?: string; vatNumber?: string; paymentInstructions?: string };

export function InvoiceDocument({
  invoice,
  lines,
  paid,
  paidCents,
  balanceCents,
  seller,
}: {
  invoice: Invoice;
  lines: InvoiceLine[];
  paid: InvoicePayment[];
  paidCents: number;
  balanceCents: number;
  seller: Seller;
}) {
  const lang = invoice.lang === "fr" ? "fr" : "en";
  const t = COPY[lang];
  const m = (cents: number) => money(cents, lang);
  const date = (iso: string) =>
    new Intl.DateTimeFormat(lang === "fr" ? "fr-MU" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(`${iso}T00:00:00Z`),
    );

  return (
    <article className="relative overflow-hidden bg-white p-6 text-sm text-ink sm:p-10 print:p-0">
      {invoice.status !== "issued" && (
        <p aria-hidden className="pointer-events-none absolute inset-0 grid -rotate-12 place-items-center text-7xl font-black uppercase tracking-widest text-ink/5">
          {invoice.status === "void" ? t.void : t.draft.split(" ")[0]}
        </p>
      )}

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-1">
          <Logo className="h-9 w-auto" />
          <p className="pt-2 font-semibold">{BUSINESS.legalName}</p>
          <p className="text-ink-soft">{BUSINESS.street}, {BUSINESS.locality}, Mauritius</p>
          <p className="text-ink-soft">{BUSINESS.phone} · {BUSINESS.email}</p>
          {seller.brn && <p className="text-ink-soft">{t.brn} {seller.brn}</p>}
          {seller.vatNumber && invoice.vatRateBp > 0 && <p className="text-ink-soft">{t.vatNo} {seller.vatNumber}</p>}
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-extrabold uppercase tracking-wide text-navy">{t.invoice}</h1>
          {invoice.status === "draft" && <p className="font-semibold text-amber-700">{t.draft}</p>}
          {invoice.status === "void" && <p className="font-semibold text-rose-700">{t.void}</p>}
          <dl className="mt-3 grid grid-cols-[auto_auto] justify-end gap-x-3 gap-y-0.5">
            {invoice.number && <><dt className="text-ink-soft">{t.number}</dt><dd className="font-semibold">{invoice.number}</dd></>}
            {invoice.issueDate && <><dt className="text-ink-soft">{t.date}</dt><dd>{date(invoice.issueDate)}</dd></>}
            {invoice.dueDate && <><dt className="text-ink-soft">{t.due}</dt><dd>{date(invoice.dueDate)}</dd></>}
          </dl>
        </div>
      </header>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.billTo}</h2>
        <p className="mt-1 font-semibold">{invoice.billName}</p>
        {invoice.billAddress && <p>{invoice.billAddress}</p>}
        {invoice.billEmail && <p className="text-ink-soft">{invoice.billEmail}</p>}
      </section>

      <table className="mt-8 w-full text-left">
        <thead className="border-b-2 border-navy text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="py-2 pr-2 font-semibold">{t.description}</th>
            <th className="w-12 px-2 py-2 text-right font-semibold">{t.qty}</th>
            <th className="hidden w-32 px-2 py-2 text-right font-semibold sm:table-cell print:table-cell">{t.unit}</th>
            <th className="w-32 py-2 pl-2 text-right font-semibold">{t.amount}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {lines.map((l) => (
            <tr key={l.id}>
              <td className="py-2.5 pr-2">{l.description}</td>
              <td className="px-2 py-2.5 text-right tabular-nums">{l.quantity}</td>
              <td className="hidden px-2 py-2.5 text-right tabular-nums sm:table-cell print:table-cell">{m(l.unitCents)}</td>
              <td className="py-2.5 pl-2 text-right tabular-nums">{m(l.quantity * l.unitCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 border-t-2 border-navy pt-3">
        <div className="flex justify-between text-base font-bold"><dt>{t.total}</dt><dd className="tabular-nums">{m(invoice.totalCents)}</dd></div>
        {invoice.vatRateBp > 0 && (
          <div className="flex justify-between text-ink-soft"><dt>{t.vatIncl(`${invoice.vatRateBp / 100}%`)}</dt><dd className="tabular-nums">{m(invoice.vatCents)}</dd></div>
        )}
        {invoice.status === "issued" && paidCents > 0 && (
          <div className="flex justify-between"><dt>{t.paid}</dt><dd className="tabular-nums">−{m(paidCents)}</dd></div>
        )}
        {invoice.status === "issued" && (
          <div className="flex justify-between rounded-lg bg-brand-soft px-2 py-1.5 text-base font-bold text-brand-strong">
            <dt>{t.balance}</dt><dd className="tabular-nums">{m(Math.max(balanceCents, 0))}</dd>
          </div>
        )}
      </dl>

      {invoice.status === "issued" && balanceCents <= 0 && <p className="mt-4 text-right font-semibold text-emerald-700">{t.paidInFull}</p>}

      {paid.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{t.payments}</h2>
          <ul className="mt-1 space-y-0.5">
            {paid.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>{date(p.receivedOn)} · {t.methods[p.method]}{p.reference ? ` · ${p.reference}` : ""}</span>
                <span className="tabular-nums">{m(p.amountCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {invoice.notes && <p className="mt-8 whitespace-pre-line">{invoice.notes}</p>}

      {invoice.status === "issued" && balanceCents > 0 && seller.paymentInstructions && (
        <section className="mt-8 rounded-xl border border-line p-4">
          <h2 className="font-semibold">{t.howToPay}</h2>
          <p className="mt-1 whitespace-pre-line">{seller.paymentInstructions}</p>
          {invoice.number && <p className="mt-2 text-ink-soft">{t.payRef(invoice.number)}</p>}
        </section>
      )}
    </article>
  );
}
