import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import mauritiusMap from "../../../../public/images/mauritius-map.png";
import { TOWNS } from "@/content/towns";
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
        <ul className="grid gap-3 sm:grid-cols-2">
          {TOWNS.map((town) => (
            <li key={town.slug}>
              <Link href={`/${lang}/areas/${town.slug}`} className="card flex items-center gap-3 p-4 hover:border-brand">
                <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand-strong">
                  <Icon name="pin" width={20} height={20} />
                </span>
                <span>
                  <span className="block font-semibold">{town.name}</span>
                  <span className="text-sm capitalize text-ink-soft">{town.region[lang]}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
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
