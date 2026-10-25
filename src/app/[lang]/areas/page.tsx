import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import mauritiusMap from "../../../../public/images/mauritius-map.png";
import { townsIn } from "@/content/towns";
import { BUSINESS } from "@/content/business";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({ params }: PageProps<"/[lang]/areas">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.areas.title, description: t.areas.subtitle, alternates: alternates(lang, "/areas") };
}

export default async function AreasPage({ params }: PageProps<"/[lang]/areas">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: `/${lang}` }, { label: t.nav.areas }]}
        eyebrow={t.nav.areas}
        title={t.areas.title}
        intro={t.areas.subtitle}
      />
      <div className="container-page space-y-8 py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-start">
          <div className="space-y-10">
            {BUSINESS.regions.map((region) => (
              <section key={region}>
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Icon name="pin" width={20} height={20} className="text-brand-strong" />
                  {region}
                </h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {townsIn(region).map((town) => (
                    <li key={town.slug}>
                      <Link
                        href={`/${lang}/areas/${town.slug}`}
                        className="card group flex items-center justify-between gap-3 p-4 hover:border-brand"
                      >
                        <span className="font-semibold">{town.name}</span>
                        <Icon name="arrow" width={18} height={18} className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-brand-strong" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <Image
            src={mauritiusMap}
            alt="Map of Mauritius showing Clinex Pro coverage across the island"
            sizes="(min-width: 1024px) 420px, 100vw"
            className="mx-auto h-auto w-full max-w-sm lg:sticky lg:top-28"
          />
        </div>
      </div>
    </>
  );
}
