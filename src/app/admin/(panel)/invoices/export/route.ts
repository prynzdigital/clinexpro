import { and, asc, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { isIsoDate } from "@/lib/schedule";
import { summarise } from "@/lib/invoices";

// CSV for the accountant. Opens in Excel (UTF-8 with BOM) and Google Sheets.

const cell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote everything that needs it; neutralise spreadsheet formulas in text.
  const safe = /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const rupees = (cents: number) => (cents / 100).toFixed(2);
const csv = (rows: (string | number | null | undefined)[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";

const METHODS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  juice: "Juice",
  card_online: "Card (online)",
  cheque: "Cheque",
  other: "Other",
};

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const type = url.searchParams.get("type") === "payments" ? "payments" : "invoices";
  if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
    return new Response("Pick a valid date range.", { status: 400 });
  }

  const db = await getDb();
  const { invoices: i, invoicePayments: p, bookings: b } = schema;
  let body: string;

  if (type === "invoices") {
    // Issued and voided invoices dated in the range, in number order (so gaps would show).
    const rows = await db
      .select({ invoice: i, ref: b.ref })
      .from(i)
      .leftJoin(b, eq(i.bookingId, b.id))
      .where(and(isNotNull(i.number), gte(i.issueDate, from), lte(i.issueDate, to)))
      .orderBy(asc(i.number));
    const paid = rows.length ? await db.select().from(p).where(inArray(p.invoiceId, rows.map((r) => r.invoice.id))) : [];
    body = csv([
      ["Invoice", "Issue date", "Due date", "Customer", "Email", "Status", "Total (MUR)", "VAT (MUR)", "Excl. VAT (MUR)", "Paid to date (MUR)", "Balance (MUR)", "Booking", "Void reason"],
      ...rows.map(({ invoice, ref }) => {
        const s = summarise(invoice, paid.filter((x) => x.invoiceId === invoice.id));
        const isVoid = invoice.status === "void";
        return [
          invoice.number,
          invoice.issueDate,
          invoice.dueDate,
          invoice.billName,
          invoice.billEmail,
          s.state,
          rupees(isVoid ? 0 : invoice.totalCents),
          rupees(isVoid ? 0 : invoice.vatCents),
          rupees(isVoid ? 0 : invoice.totalCents - invoice.vatCents),
          rupees(s.paidCents),
          rupees(isVoid ? 0 : s.balanceCents),
          ref,
          invoice.voidReason,
        ];
      }),
    ]);
  } else {
    const rows = await db
      .select({ payment: p, number: i.number, customer: i.billName })
      .from(p)
      .innerJoin(i, eq(p.invoiceId, i.id))
      .where(and(gte(p.receivedOn, from), lte(p.receivedOn, to)))
      .orderBy(asc(p.receivedOn), asc(p.id));
    body = csv([
      ["Date received", "Invoice", "Customer", "Method", "Reference", "Amount (MUR)"],
      ...rows.map(({ payment, number, customer }) => [
        payment.receivedOn,
        number,
        customer,
        METHODS[payment.method] ?? payment.method,
        payment.reference,
        rupees(payment.amountCents),
      ]),
    ]);
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clinexpro-${type}-${from}-to-${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
