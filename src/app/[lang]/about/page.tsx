import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";

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
    <div className="container-page space-y-12 py-12 sm:py-16">
      <header className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">{t.about.title}</h1>
        {t.about.body.map((p) => (
          <p key={p} className="text-lg text-ink-soft">{p}</p>
        ))}
      </header>
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
  );
}
