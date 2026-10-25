import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, alternates, LOCALES, SITE_URL } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { SERVICES, getService, serviceImage } from "@/content/services";
import { TOWNS } from "@/content/towns";
import { getPricedService, formatMur } from "@/lib/pricing";
import { Icon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { PageHeader } from "@/components/page-header";

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.flatMap((lang) => SERVICES.map((s) => ({ lang, slug: s.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/services/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const service = getService(slug);
  if (!hasLocale(lang) || !service) return {};
  return {
    title: `${service.name[lang]} — ${lang === "fr" ? "Maurice" : "Mauritius"}`,
    description: `${service.tagline[lang]} ${service.intro[lang]}`.slice(0, 160),
    alternates: alternates(lang, `/services/${slug}`),
  };
}

export default async function ServicePage({ params }: PageProps<"/[lang]/services/[slug]">) {
  const { lang, slug } = await params;
  const service = getService(slug);
  if (!hasLocale(lang) || !service) notFound();
  const t = getDictionary(lang);
  const priced = getPricedService(slug);
  const cta = service.bookable
    ? { href: `/${lang}/book?service=${slug}`, label: t.services.bookThis }
    : { href: `/${lang}/business`, label: t.services.quoteThis };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.name[lang],
      description: service.intro[lang],
      serviceType: service.name.en,
      provider: { "@id": `${SITE_URL}/#business` },
      areaServed: { "@type": "Country", name: "Mauritius" },
      ...(priced && {
        offers: { "@type": "Offer", priceCurrency: "MUR", price: priced.minimumMur, url: `${SITE_URL}/${lang}/book?service=${slug}` },
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Clinex Pro", item: `${SITE_URL}/${lang}` },
        { "@type": "ListItem", position: 2, name: t.nav.services, item: `${SITE_URL}/${lang}/services` },
        { "@type": "ListItem", position: 3, name: service.name[lang] },
      ],
    },
  ];

  return (
    <article>
      <JsonLd data={jsonLd} />
      <PageHeader
        crumbs={[{ label: t.nav.home, href: `/${lang}` }, { label: t.nav.services, href: `/${lang}/services` }, { label: service.name[lang] }]}
        eyebrow={service.category === "business" ? t.nav.business : t.nav.services}
        title={service.name[lang]}
        intro={service.intro[lang]}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <Link href={cta.href} className="btn-glow">{cta.label}</Link>
          {priced && (
            <span className="text-ink-soft">
              {t.services.from} <strong className="text-ink">{formatMur(priced.minimumMur, lang)}</strong>
            </span>
          )}
        </div>
      </PageHeader>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-2">
        <section>
          <div className="relative mb-8 aspect-[16/10] overflow-hidden rounded-3xl">
            <Image
              src={serviceImage(service.slug)}
              alt={service.name[lang]}
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
          <h2 className="mb-4 text-2xl font-bold">{t.services.included}</h2>
          <ul className="space-y-3">
            {service.includes[lang].map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
                  <Icon name="check" width={14} height={14} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-4 text-2xl font-bold">{t.services.faq}</h2>
          <div className="space-y-3">
            {service.faq[lang].map((f) => (
              <details key={f.q} className="card group p-4 open:border-brand">
                <summary className="cursor-pointer list-none font-semibold">{f.q}</summary>
                <p className="mt-2 text-ink-soft">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {service.rooms && (
        <section className="container-page pb-14">
          <h2 className="mb-5 text-2xl font-bold">{t.services.rooms}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {service.rooms.map((room) => (
              <li key={room.title.en} className="card p-6">
                <span className="mb-4 grid size-11 place-items-center rounded-xl bg-brand-soft text-brand-strong">
                  <Icon name={room.icon} width={22} height={22} />
                </span>
                <h3 className="mb-1 text-lg font-semibold">{room.title[lang]}</h3>
                <p className="text-ink-soft">{room.body[lang]}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-page pb-14">
        <h2 className="mb-4 text-xl font-bold">{t.areas.title}</h2>
        <ul className="flex flex-wrap gap-2 text-sm">
          {TOWNS.map((town) => (
            <li key={town.slug}>
              <Link href={`/${lang}/areas/${town.slug}`} className="inline-block rounded-full border border-line px-3 py-1.5 hover:border-brand hover:text-brand-strong">
                {town.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
