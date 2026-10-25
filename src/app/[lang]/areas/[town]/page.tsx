import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, alternates, LOCALES } from "@/lib/i18n";
import { getDictionary, fill } from "@/dictionaries";
import { TOWNS, getTown } from "@/content/towns";
import { SERVICES } from "@/content/services";
import { ServiceCard } from "@/components/service-card";

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.flatMap((lang) => TOWNS.map((t) => ({ lang, town: t.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/areas/[town]">): Promise<Metadata> {
  const { lang, town: slug } = await params;
  const town = getTown(slug);
  if (!hasLocale(lang) || !town) return {};
  const t = getDictionary(lang);
  return {
    title: fill(t.areas.inTown, { town: town.name }),
    description: fill(t.areas.townIntro, { town: town.name, region: town.region[lang] }),
    alternates: alternates(lang, `/areas/${slug}`),
  };
}

export default async function TownPage({ params }: PageProps<"/[lang]/areas/[town]">) {
  const { lang, town: slug } = await params;
  const town = getTown(slug);
  if (!hasLocale(lang) || !town) notFound();
  const t = getDictionary(lang);
  const nearby = TOWNS.filter((x) => x.slug !== town.slug && x.region.en === town.region.en);

  return (
    <div className="container-page space-y-10 py-12 sm:py-16">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">{fill(t.areas.inTown, { town: town.name })}</h1>
        <p className="text-lg text-ink-soft">{fill(t.areas.townIntro, { town: town.name, region: town.region[lang] })}</p>
        <Link href={`/${lang}/book`} className="btn-primary">{t.home.ctaBook}</Link>
      </header>
      <section className="space-y-5">
        <h2 className="text-2xl font-bold">{fill(t.areas.servicesIn, { town: town.name })}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <ServiceCard key={s.slug} service={s} lang={lang} labels={t.services} />
          ))}
        </div>
      </section>
      {nearby.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">{t.areas.nearby}</h2>
          <ul className="flex flex-wrap gap-2 text-sm">
            {nearby.map((n) => (
              <li key={n.slug}>
                <Link href={`/${lang}/areas/${n.slug}`} className="inline-block rounded-full border border-line px-3 py-1.5 hover:border-brand hover:text-brand-strong">
                  {n.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
