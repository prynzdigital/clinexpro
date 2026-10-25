import Image from "next/image";
import Link from "next/link";
import { hasLocale } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { SERVICES } from "@/content/services";
import { TOWNS } from "@/content/towns";
import { ServiceCard } from "@/components/service-card";
import { Icon, type IconName } from "@/components/icons";
import { notFound } from "next/navigation";
import heroCleaner from "../../../public/images/hero-cleaner.png";
import familyBooking from "../../../public/images/family-booking.jpg";
import officeCleaning from "../../../public/images/services/office-cleaning.jpg";
import mauritiusMap from "../../../public/images/mauritius-map.png";

const TRUST_ICONS: IconName[] = ["leaf", "shield", "calendar", "star"];

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const home = SERVICES.filter((s) => s.category === "home");

  return (
    <>
      <section className="overflow-hidden bg-gradient-to-b from-brand-soft to-white">
        <div className="container-page grid gap-6 pt-10 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10 lg:pt-12">
          <div className="space-y-6 lg:pb-16">
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
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3 pt-2 text-sm font-semibold">
              {t.home.trust.map((item, i) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-brand-strong shadow-sm">
                    <Icon name={TRUST_ICONS[i]} width={16} height={16} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-[300px] self-end sm:max-w-[360px] lg:max-w-[440px]">
            <div className="absolute inset-x-0 bottom-0 top-[18%] rounded-t-full bg-navy" aria-hidden="true" />
            <div className="absolute -right-2 top-[14%] size-16 rounded-full bg-accent sm:size-20" aria-hidden="true" />
            <Image
              src={heroCleaner}
              alt="Smiling Clinex Pro cleaner putting on gloves"
              priority
              sizes="(min-width: 1024px) 440px, (min-width: 640px) 360px, 300px"
              className="relative h-auto w-full"
            />
          </div>
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
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="mb-8 text-3xl font-bold tracking-tight">{t.home.howTitle}</h2>
            <ol className="space-y-4">
              {t.home.how.map((step, i) => (
                <li key={step.title} className="card flex gap-4 p-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">{step.title}</h3>
                    <p className="text-sm text-ink-soft">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Image
            src={familyBooking}
            alt="Family booking a cleaning on a laptop"
            sizes="(min-width: 1024px) 540px, 100vw"
            className="h-auto w-full rounded-3xl object-cover"
          />
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
        <div className="card grid overflow-hidden lg:grid-cols-[1fr_1.1fr]">
          <Image
            src={officeCleaning}
            alt="Clinex Pro team cleaning an office"
            sizes="(min-width: 1024px) 520px, 100vw"
            className="h-56 w-full object-cover object-[50%_15%] sm:h-72 lg:h-full"
          />
          <div className="space-y-4 p-6 sm:p-10 lg:self-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.home.businessTitle}</h2>
            <p className="text-ink-soft">{t.home.businessBody}</p>
            <Link href={`/${lang}/business`} className="btn-primary">
              {t.home.businessCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-surface-alt py-14">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">{t.home.areasTitle}</h2>
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
          <Image
            src={mauritiusMap}
            alt="Map of Mauritius showing Clinex Pro coverage across the island"
            sizes="(min-width: 1024px) 520px, 100vw"
            className="mx-auto h-auto w-full max-w-md"
          />
        </div>
      </section>
    </>
  );
}
