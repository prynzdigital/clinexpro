import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { hasLocale } from "@/lib/i18n";
import { getDictionary, fill } from "@/dictionaries";
import { getDb, schema } from "@/db";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import { formatMur } from "@/lib/pricing";
import { Icon } from "@/components/icons";
import { getProvider } from "@/lib/payments";
import { Conversion } from "./conversion";

export const metadata: Metadata = { robots: { index: false } };

export default async function ConfirmationPage({ params, searchParams }: PageProps<"/[lang]/book/confirmation">) {
  const { lang } = await params;
  const { ref, payment } = await searchParams;
  if (!hasLocale(lang) || typeof ref !== "string") notFound();
  const t = getDictionary(lang);

  const db = await getDb();
  const [row] = await db
    .select({ booking: schema.bookings, name: schema.customers.name })
    .from(schema.bookings)
    .innerJoin(schema.customers, eq(schema.bookings.customerId, schema.customers.id))
    .where(eq(schema.bookings.ref, ref))
    .limit(1);
  if (!row) notFound();
  const { booking } = row;
  const firstName = row.name.split(" ")[0];

  return (
    <div className="container-page max-w-2xl space-y-6 py-12 sm:py-16">
      <span className="grid size-14 place-items-center rounded-full bg-brand text-white">
        <Icon name="check" width={28} height={28} />
      </span>
      <h1 className="text-3xl font-extrabold tracking-tight">{t.confirmation.title}</h1>
      <p className="text-lg text-ink-soft">{fill(t.confirmation.body, { name: firstName, ref: booking.ref })}</p>

      <section className="card divide-y divide-line">
        <h2 className="p-4 font-semibold">{t.confirmation.summary}</h2>
        <p className="flex justify-between p-4"><span className="text-ink-soft">{t.booking.steps[0]}</span><span>{getService(booking.service)?.name[lang]} · {t.booking.frequency[booking.frequency]}</span></p>
        <p className="flex justify-between p-4"><span className="text-ink-soft">{t.booking.steps[1]}</span><span className="first-letter:uppercase">{new Intl.DateTimeFormat(lang === "fr" ? "fr-MU" : "en-MU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${booking.date}T00:00:00Z`))} · {booking.timeSlot}</span></p>
        <p className="flex justify-between p-4"><span className="text-ink-soft">{t.booking.town}</span><span>{getTown(booking.town)?.name}</span></p>
        <p className="flex justify-between p-4"><span className="text-ink-soft">{t.booking.total}</span><strong>{formatMur(booking.estimateMur, lang)}</strong></p>
        <p className="flex justify-between p-4"><span className="text-ink-soft">{t.booking.deposit}</span><strong className="text-brand-strong">{formatMur(booking.depositMur, lang)}</strong></p>
      </section>

      <PaymentPanel
        t={t.confirmation}
        lang={lang}
        refCode={booking.ref}
        deposit={formatMur(booking.depositMur, lang)}
        paid={booking.paymentStatus !== "unpaid"}
        failed={payment === "failed"}
        online={Boolean(getProvider()) && booking.status !== "cancelled"}
      />

      <Conversion
        bookingRef={booking.ref}
        service={booking.service}
        serviceName={getService(booking.service)?.name.en ?? booking.service}
        valueMur={booking.estimateMur}
        depositMur={booking.depositMur}
        depositPaid={booking.paymentStatus !== "unpaid"}
      />

      <Link href={`/${lang}`} className="btn-secondary">{t.confirmation.home}</Link>
    </div>
  );
}

type PaymentPanelProps = {
  t: ReturnType<typeof getDictionary>["confirmation"];
  lang: string;
  refCode: string;
  deposit: string;
  paid: boolean;
  failed: boolean;
  online: boolean;
};

function PaymentPanel({ t, lang, refCode, deposit, paid, failed, online }: PaymentPanelProps) {
  if (paid) {
    return (
      <section className="card flex gap-3 border-emerald-200 bg-emerald-50 p-5" role="status">
        <Icon name="check" width={22} height={22} className="mt-0.5 shrink-0 text-emerald-700" />
        <div>
          <h2 className="mb-1 font-semibold text-emerald-900">{t.paidTitle}</h2>
          <p className="text-sm text-emerald-900">{t.paidBody}</p>
        </div>
      </section>
    );
  }
  return (
    <section className="card space-y-3 bg-surface-alt p-5">
      <h2 className="font-semibold">{t.payTitle}</h2>
      {failed && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{t.payFailed}</p>}
      {online ? (
        <form action="/api/payments/checkout" method="post" className="space-y-3">
          <input type="hidden" name="ref" value={refCode} />
          <input type="hidden" name="lang" value={lang} />
          <p className="text-sm text-ink-soft">{t.payOnline}</p>
          <button type="submit" className="btn-primary w-full sm:w-auto">{fill(t.payButton, { amount: deposit })}</button>
        </form>
      ) : (
        <p className="text-sm text-ink-soft">{t.payBody}</p>
      )}
    </section>
  );
}
