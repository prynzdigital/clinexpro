import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDictionary(lang).privacy.title, alternates: alternates(lang, "/privacy") };
}

export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <div className="container-page max-w-3xl space-y-4 py-12 sm:py-16">
      <h1 className="text-4xl font-extrabold tracking-tight">{t.privacy.title}</h1>
      {t.privacy.body.map((p) => (
        <p key={p} className="text-ink-soft">{p}</p>
      ))}
    </div>
  );
}
