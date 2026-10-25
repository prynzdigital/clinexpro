import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n";
import { formatMur } from "@/lib/pricing";
import { getProvider, paymentBooking } from "@/lib/payments";
import { verifyTestToken } from "@/lib/payments/providers";

export const metadata: Metadata = { title: "Test payment", robots: { index: false } };

// Stand-in for a real gateway's hosted card page, used until the client's
// merchant account is live. Only reachable while PAYMENT_PROVIDER=test.
export default async function TestGatewayPage({ params, searchParams }: PageProps<"/[lang]/book/pay/test">) {
  const { lang } = await params;
  const { payment, token } = await searchParams;
  const paymentId = Number(payment);
  if (
    !hasLocale(lang) ||
    getProvider()?.id !== "test" ||
    !Number.isInteger(paymentId) ||
    typeof token !== "string" ||
    !verifyTestToken(paymentId, token)
  ) {
    notFound();
  }
  const row = await paymentBooking(paymentId);
  if (!row) notFound();
  const done = row.payment.status !== "pending";

  return (
    <div className="container-page max-w-md space-y-5 py-12 sm:py-16">
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Test mode.</strong> This page simulates the card gateway. No card is charged and no money moves.
      </p>
      <section className="card space-y-4 p-6">
        <div>
          <p className="eyebrow">Clinex Pro · deposit</p>
          <h1 className="mt-1 text-3xl font-extrabold">{formatMur(row.payment.amountMur, lang)}</h1>
          <p className="text-sm text-ink-soft">Booking {row.ref}</p>
        </div>
        {done ? (
          <p className="text-sm">This payment is already {row.payment.status}.</p>
        ) : (
          <form action="/api/payments/test/complete" method="post" className="grid gap-3">
            <input type="hidden" name="payment" value={paymentId} />
            <input type="hidden" name="token" value={token} />
            <button type="submit" name="outcome" value="approve" className="btn-primary">Approve payment</button>
            <button type="submit" name="outcome" value="decline" className="btn-secondary">Decline</button>
          </form>
        )}
      </section>
    </div>
  );
}
