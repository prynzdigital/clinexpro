import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { SERVICES, serviceImage } from "@/content/services";
import { Icon } from "@/components/icons";
import { LeadForm } from "./lead-form";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({ params }: PageProps<"/[lang]/business">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.business.title, description: t.business.subtitle, alternates: alternates(lang, "/business") };
}

export default async function BusinessPage({ params }: PageProps<"/[lang]/business">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const business = SERVICES.filter((s) => s.category === "business");
  return (
    <>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: `/${lang}` }, { label: t.nav.business }]}
        eyebrow={t.nav.business}
        title={t.business.title}
        intro={t.business.subtitle}
      />
      <div className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          {business.map((s) => (
            <section key={s.slug} className="card overflow-hidden">
              <div className="relative aspect-[5/2]">
                <Image src={serviceImage(s.slug)} alt={s.name[lang]} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
              </div>
              <div className="space-y-3 p-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Icon name={s.icon} className="text-brand-strong" /> {s.name[lang]}
                </h2>
                <ul className="space-y-1.5 text-sm text-ink-soft">
                  {s.includes[lang].slice(0, 4).map((item) => (
                    <li key={item} className="flex gap-2">
                      <Icon name="check" width={16} height={16} className="mt-0.5 shrink-0 text-brand-strong" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
        <LeadForm t={t.business} />
      </div>
    </>
  );
}
