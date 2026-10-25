import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { SERVICES } from "@/content/services";
import { ServiceCard } from "@/components/service-card";

export async function generateMetadata({ params }: PageProps<"/[lang]/services">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.services.title, description: t.services.subtitle, alternates: alternates(lang, "/services") };
}

export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const groups = [
    { title: t.services.home, items: SERVICES.filter((s) => s.category === "home") },
    { title: t.services.business, items: SERVICES.filter((s) => s.category === "business") },
  ];
  return (
    <div className="container-page space-y-12 py-12 sm:py-16">
      <header className="max-w-2xl space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">{t.services.title}</h1>
        <p className="text-lg text-ink-soft">{t.services.subtitle}</p>
      </header>
      {groups.map((g) => (
        <section key={g.title} className="space-y-5">
          <h2 className="text-2xl font-bold">{g.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((s) => (
              <ServiceCard key={s.slug} service={s} lang={lang} labels={t.services} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
