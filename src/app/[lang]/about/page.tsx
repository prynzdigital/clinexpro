import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import officeTeam from "../../../../public/images/services/office-cleaning.jpg";
import housekeeper from "../../../../public/images/services/maid-service.jpg";
import { PageHeader } from "@/components/page-header";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.about.title, description: t.about.body[0], alternates: alternates(lang, "/about") };
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: `/${lang}` }, { label: t.nav.about }]}
        eyebrow={t.nav.about}
        title={t.about.title}
        intro={t.about.body[0]}
      />
      <div className="container-page space-y-12 py-12 sm:py-16">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-4">
            {t.about.body.slice(1).map((p) => (
              <p key={p} className="text-lg text-ink-soft">{p}</p>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Image src={officeTeam} alt="Clinex Pro team cleaning an office" sizes="(min-width: 1024px) 260px, 50vw" className="h-full w-full rounded-2xl object-cover" />
            <Image src={housekeeper} alt="Clinex Pro housekeeper with fresh towels" sizes="(min-width: 1024px) 260px, 50vw" className="mt-8 h-full w-full rounded-2xl object-cover" />
          </div>
        </section>
        <section>
          <h2 className="mb-5 text-2xl font-bold">{t.about.valuesTitle}</h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {t.about.values.map((v) => (
              <li key={v.title} className="card p-6">
                <h3 className="mb-1 text-lg font-semibold">{v.title}</h3>
                <p className="text-ink-soft">{v.body}</p>
              </li>
            ))}
          </ul>
        </section>
        <Link href={`/${lang}/book`} className="btn-primary">{t.home.ctaBook}</Link>
      </div>
    </>
  );
}
