import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { TOWNS } from "@/content/towns";
import { Icon } from "@/components/icons";

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
    <div className="container-page space-y-8 py-12 sm:py-16">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">{t.areas.title}</h1>
        <p className="text-lg text-ink-soft">{t.areas.subtitle}</p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
