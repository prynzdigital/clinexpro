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
      <section className="bg-gradient-to-b from-brand-soft to-white">
        <div className="container-page grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-5">
            <nav className="text-sm text-ink-soft">
              <Link href={`/${lang}/services`} className="hover:text-brand-strong">{t.nav.services}</Link> / {service.name[lang]}
            </nav>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">{service.name[lang]}</h1>
            <p className="max-w-2xl text-lg text-ink-soft">{service.intro[lang]}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href={cta.href} className="btn-primary">{cta.label}</Link>
              {priced && (
                <span className="text-ink-soft">
                  {t.services.from} <strong className="text-ink">{formatMur(priced.minimumMur, lang)}</strong>
                </span>
              )}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl lg:aspect-[15/13]">
            <Image
              src={serviceImage(service.slug)}
              alt={service.name[lang]}
              fill
              priority
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <div className="container-page grid gap-10 py-12 lg:grid-cols-2">
        <section>
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
