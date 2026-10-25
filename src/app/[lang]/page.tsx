import Link from "next/link";
import { hasLocale } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { SERVICES } from "@/content/services";
import { TOWNS } from "@/content/towns";
import { ServiceCard } from "@/components/service-card";
import { Icon, type IconName } from "@/components/icons";
import { notFound } from "next/navigation";

const TRUST_ICONS: IconName[] = ["leaf", "shield", "calendar", "star"];

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const home = SERVICES.filter((s) => s.category === "home");

  return (
    <>
      <section className="bg-gradient-to-b from-brand-soft to-white">
        <div className="container-page grid gap-10 py-12 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <p className="eyebrow">{t.home.eyebrow}</p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t.home.title}
            </h1>
            <p className="max-w-xl text-lg text-ink-soft">{t.home.subtitle}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/${lang}/book`} className="btn-primary">
                {t.home.ctaBook}
                <Icon name="arrow" width={18} height={18} />
              </Link>
              <Link href={`/${lang}/business`} className="btn-secondary">
                {t.home.ctaBusiness}
              </Link>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3">
            {t.home.trust.map((item, i) => (
              <li key={item} className="card flex flex-col gap-3 p-4">
                <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand-strong">
                  <Icon name={TRUST_ICONS[i]} width={20} height={20} />
                </span>
                <span className="font-semibold leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="mb-8 max-w-2xl space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t.home.servicesTitle}</h2>
          <p className="text-ink-soft">{t.home.servicesSubtitle}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {home.map((s) => (
            <ServiceCard key={s.slug} service={s} lang={lang} labels={t.services} />
          ))}
        </div>
      </section>

      <section className="bg-surface-alt py-14 sm:py-20">
        <div className="container-page">
          <h2 className="mb-8 text-3xl font-bold tracking-tight">{t.home.howTitle}</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {t.home.how.map((step, i) => (
              <li key={step.title} className="card p-6">
                <span className="mb-4 grid size-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mb-1 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20">
        <div className="grid gap-8 rounded-3xl bg-navy p-6 text-white sm:p-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">{t.home.plansTitle}</h2>
            <p className="text-white/75">{t.home.plansBody}</p>
            <Link href={`/${lang}/book?service=home-cleaning`} className="btn-primary mt-2">
              {t.home.ctaBook}
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3">
            {t.home.plans.map((p) => (
              <li key={p.label} className="rounded-2xl bg-white/10 p-5">
                <p className="text-sm text-white/75">{p.label}</p>
                <p className="text-2xl font-bold text-accent">{p.saving}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page pb-14 sm:pb-20">
        <div className="card grid gap-6 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-4">
            <span className="hidden size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-strong sm:grid">
              <Icon name="office" />
            </span>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">{t.home.businessTitle}</h2>
              <p className="max-w-2xl text-ink-soft">{t.home.businessBody}</p>
            </div>
          </div>
          <Link href={`/${lang}/business`} className="btn-primary">
            {t.home.businessCta}
          </Link>
        </div>
      </section>

      <section className="bg-surface-alt py-14">
        <div className="container-page">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{t.home.areasTitle}</h2>
          <ul className="flex flex-wrap gap-2">
            {TOWNS.map((town) => (
              <li key={town.slug}>
                <Link
                  href={`/${lang}/areas/${town.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand-strong"
                >
                  <Icon name="pin" width={16} height={16} />
                  {town.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
