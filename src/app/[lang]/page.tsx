import Image from "next/image";
import Link from "next/link";
import { hasLocale } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { SERVICES, getService, serviceImage } from "@/content/services";
import { getPricedService, formatMur } from "@/lib/pricing";
import { HeroSlider, type HeroSlide } from "@/components/hero-slider";
import { RatingBadge } from "@/components/rating-badge";
import { TOWNS } from "@/content/towns";
import { ServiceCard } from "@/components/service-card";
import { Icon, type IconName } from "@/components/icons";
import { notFound } from "next/navigation";
import heroCommercial from "../../../public/images/hero-commercial.jpg";
import familyBooking from "../../../public/images/family-booking.jpg";
import officeCleaning from "../../../public/images/services/office-cleaning.jpg";
import mauritiusMap from "../../../public/images/mauritius-map.png";

const TRUST_ICONS: IconName[] = ["leaf", "shield", "calendar", "star"];

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const home = SERVICES.filter((s) => s.category === "home");
  const slides: HeroSlide[] = t.home.slides.map((s, i) => {
    const service = getService(s.service)!;
    const priced = getPricedService(s.service);
    const serviceHref = `/${lang}/services/${s.service}`;
    return {
      key: s.service,
      // The hotel slide uses Clinex Pro's one full-HD photo; the rest are 750px service photos.
      image: s.service === "hotel-hospitality" ? heroCommercial : serviceImage(s.service),
      label: service.name[lang],
      eyebrow: s.eyebrow,
      title: s.title,
      body: s.body,
      price: priced ? `${t.services.from} ${formatMur(priced.minimumMur, lang)}` : t.home.siteVisit,
      cta: { href: service.bookable ? `/${lang}/book?service=${s.service}` : `/${lang}/business`, label: s.cta },
      secondary:
        i === 0
          ? { href: `/${lang}/business`, label: t.home.ctaBusiness }
          : { href: serviceHref, label: t.services.learnMore },
    };
  });

  return (
    <>
      <HeroSlider
        slides={slides}
        labels={{ prev: t.home.prevSlide, next: t.home.nextSlide, pause: t.home.slidePause, play: t.home.slidePlay, show: t.home.slideShow }}
      >
        <RatingBadge label={t.home.reviews} light />
      </HeroSlider>

      <div className="container-page relative z-10 -mt-px pt-6 lg:-mt-10 lg:pt-0">
        <ul className="grid grid-cols-2 gap-3 rounded-3xl bg-white p-4 text-sm font-semibold shadow-[0_20px_50px_-20px_rgba(3,20,50,0.3)] sm:p-5 lg:grid-cols-4 lg:gap-6 lg:px-8">
          {t.home.trust.map((item, i) => (
            <li key={item} className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
                <Icon name={TRUST_ICONS[i]} width={18} height={18} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

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
