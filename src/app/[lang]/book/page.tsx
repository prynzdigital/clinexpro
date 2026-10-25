import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { BOOKABLE_SERVICES } from "@/content/services";
import { TOWNS } from "@/content/towns";
import { BookingWizard } from "./booking-wizard";

export async function generateMetadata({ params }: PageProps<"/[lang]/book">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.booking.title, description: t.booking.subtitle, alternates: alternates(lang, "/book") };
}

export default async function BookPage({ params, searchParams }: PageProps<"/[lang]/book">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { service } = await searchParams;
  const t = getDictionary(lang);
  const initial = BOOKABLE_SERVICES.find((s) => s.slug === service)?.slug;

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="mb-6 max-w-2xl space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t.booking.title}</h1>
        <p className="text-ink-soft">{t.booking.subtitle}</p>
      </header>
      <BookingWizard
        lang={lang}
        t={t.booking}
        businessHref={`/${lang}/business`}
        initialService={initial}
        services={BOOKABLE_SERVICES.map((s) => ({ slug: s.slug, name: s.name[lang], tagline: s.tagline[lang], icon: s.icon }))}
        towns={TOWNS.map((town) => ({ slug: town.slug, name: town.name }))}
      />
    </div>
  );
}
