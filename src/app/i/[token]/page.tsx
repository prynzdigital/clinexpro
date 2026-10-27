import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BUSINESS } from "@/content/business";
import { invoiceSettings, loadInvoice } from "@/lib/invoices";
import { InvoiceDocument } from "@/components/invoice-document";
import { PrintButton } from "./print-button";

async function load(token: string) {
  // Tokens are 24 url-safe characters; anything else can't be one.
  if (!/^[A-Za-z0-9_-]{24}$/.test(token)) return null;
  const loaded = await loadInvoice({ token });
  // Drafts aren't the customer's business until issued.
  return loaded && loaded.invoice.status !== "draft" ? loaded : null;
}

export async function generateMetadata({ params }: PageProps<"/i/[token]">): Promise<Metadata> {
  const loaded = await load((await params).token);
  return { title: loaded?.invoice.number ?? "Invoice" };
}

export default async function CustomerInvoicePage({ params }: PageProps<"/i/[token]">) {
  const loaded = await load((await params).token);
  if (!loaded) notFound();
  const fr = loaded.invoice.lang === "fr";

  return (
    <main lang={fr ? "fr" : "en"} className="mx-auto max-w-3xl px-3 py-6 sm:py-10 print:max-w-none print:p-0">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-ink-soft">
          {fr ? "Une question ? " : "Questions? "}
          <a href={BUSINESS.whatsappHref} className="font-medium text-brand-strong hover:underline">WhatsApp {BUSINESS.phone}</a>
        </p>
        <PrintButton label={fr ? "Imprimer / PDF" : "Print / save as PDF"} />
      </div>
      <div className="overflow-hidden rounded-2xl shadow-sm print:rounded-none print:shadow-none">
        <InvoiceDocument {...loaded} seller={invoiceSettings()} />
      </div>
    </main>
  );
}
