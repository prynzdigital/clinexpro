import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { BOOKABLE_SERVICES } from "@/content/services";
import { TOWNS } from "@/content/towns";
import { BookingWizard } from "./booking-wizard";
import { PageHeader } from "@/components/page-header";

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
    <>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: `/${lang}` }, { label: t.nav.book }]}
        eyebrow={t.booking.eyebrow}
        title={t.booking.title}
        intro={t.booking.subtitle}
      />
      <div className="container-page py-8 sm:py-12">
        <BookingWizard
          lang={lang}
          t={t.booking}
          businessHref={`/${lang}/business`}
          initialService={initial}
          services={BOOKABLE_SERVICES.map((s) => ({ slug: s.slug, name: s.name[lang], tagline: s.tagline[lang] }))}
          towns={TOWNS.map((town) => ({ slug: town.slug, name: town.name }))}
        />
      </div>
    </>
  );
}
