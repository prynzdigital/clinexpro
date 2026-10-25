import Image from "next/image";
import Link from "next/link";
import { hasLocale } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { SERVICES, getService, serviceImage } from "@/content/services";
import { getPricedService, formatMur } from "@/lib/pricing";
import { HeroSlider, type HeroSlide } from "@/components/hero-slider";
import { RatingBadge } from "@/components/rating-badge";
import { Reveal } from "@/components/reveal";
import { PromoFlipCard } from "@/components/promo-flip-card";
import { VideoCard } from "@/components/video-card";
import { RequestForm } from "@/components/request-form";
import { BUSINESS } from "@/content/business";
import { mauritiusDate } from "@/lib/dates";
import { TOWNS } from "@/content/towns";
import { ServiceCard } from "@/components/service-card";
import { Icon, type IconName } from "@/components/icons";
import { notFound } from "next/navigation";
import heroCommercial from "../../../public/images/hero-commercial.jpg";
import familyBooking from "../../../public/images/family-booking.jpg";
import videoPoster from "../../../public/images/services/deep-cleaning.jpg";
import requestBackground from "../../../public/images/hero-commercial.jpg";
import howBackground from "../../../public/images/services/home-cleaning.jpg";
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

      <div className="container-page relative z-10 pt-8 lg:-mt-14 lg:pt-0">
        <PromoFlipCard
          trust={t.home.trust.map((label, i) => ({ label, icon: TRUST_ICONS[i] }))}
          ad={{
            image: familyBooking,
            imageAlt: t.home.plansImageAlt,
            title: t.home.plansTitle,
            body: t.home.plansBody,
            plans: t.home.plans,
            cta: { href: `/${lang}/book?service=home-cleaning`, label: t.home.ctaBook },
          }}
          labels={{ showOffer: t.home.showOffer, showHighlights: t.home.showHighlights }}
        />
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
          <Link
            href={`/${lang}/business`}
            className="group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-2xl bg-navy p-6 text-white shadow-[0_20px_50px_-20px_rgba(3,20,50,0.45)]"
          >
            <Image
              src={officeCleaning}
              alt="Clinex Pro team cleaning an office"
              fill
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              className="object-cover object-[50%_20%] transition duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/10" />
            <span className="relative space-y-3">
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-accent">{t.home.businessCardEyebrow}</span>
              <span className="block text-xl font-bold leading-snug">{t.home.businessTitle}</span>
              <span className="block text-sm text-white/75">{t.home.businessBody}</span>
              <span className="btn-glow mt-2 min-h-11 px-5 text-sm">
                {t.home.businessCta}
                <Icon name="arrow" width={16} height={16} />
              </span>
            </span>
          </Link>
        </div>
      </section>

      {/* How it works: compact band with a fixed background photo. The photo is
          position: fixed and clipped to this section by clip-path, which keeps it
          still while the page scrolls (also on iOS, unlike background-attachment). */}
      <section className="relative isolate overflow-hidden text-white [clip-path:inset(0)]">
        <div className="fixed inset-0 -z-10" aria-hidden="true">
          <Image src={howBackground} alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-navy/75" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-navy/60" />
        </div>

        <div className="container-page grid gap-12 py-20 sm:py-24 lg:grid-cols-[0.9fr_2fr] lg:items-center lg:gap-10">
          <Reveal>
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t.home.howEyebrow}</p>
            <h2 className="text-4xl font-light leading-[1.1] tracking-tight sm:text-5xl">
              {t.home.howTitle}
              <span className="text-accent">.</span>
            </h2>
            <p className="mt-5 max-w-xs text-lg font-light text-white/75">{t.home.howSubtitle}</p>
            <Link href={`/${lang}/book`} className="btn-glow mt-8">
              {t.home.ctaBook}
              <Icon name="arrow" width={18} height={18} />
            </Link>
          </Reveal>

          <ol className="grid grid-cols-2 lg:grid-cols-4">
            {t.home.how.map((step, i) => (
              <li
                key={step.title}
                className="border-t border-white/15 px-4 py-5 sm:px-6 [&:nth-child(-n+2)]:border-t-0 [&:nth-child(odd)]:pl-0 lg:border-l lg:border-t-0 lg:py-2 lg:pl-6 lg:[&:nth-child(odd)]:pl-6"
              >
                <Reveal delay={150 + i * 150}>
                  <span className="block text-4xl font-light leading-none text-accent sm:text-5xl">{String(i + 1).padStart(2, "0")}</span>
                  <svg viewBox="0 0 10 28" width={10} height={28} className="my-3 text-accent sm:my-5" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden="true">
                    <path d="M5 1v25M1.5 22.5 5 26l3.5-3.5" />
                  </svg>
                  <h3 className="mb-2 font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{step.body}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Who we are, with Clinex Pro's own YouTube video. */}
      <section className="container-page grid gap-12 py-20 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
        <Reveal>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-brand-strong">{t.home.whoEyebrow}</p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl">
            {t.home.whoTitle}
            <span className="text-brand">.</span>
          </h2>
          <div className="mt-5 space-y-4 text-ink-soft">
            {t.home.whoBody.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {t.home.whoPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm font-semibold">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
                  <Icon name="check" width={14} height={14} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <Link
            href={`/${lang}/about`}
            className="group mt-8 inline-flex items-center gap-2 border-b border-ink/40 pb-0.5 text-sm font-semibold hover:border-brand hover:text-brand-strong"
          >
            {t.home.whoCta}
            <Icon name="arrow" width={16} height={16} className="text-brand transition group-hover:translate-x-0.5" />
          </Link>
        </Reveal>
        <Reveal delay={200}>
          <VideoCard
            videoId="dqcwIcJlPOk"
            poster={videoPoster}
            title={t.home.videoTitle}
            caption={t.home.videoCaption}
            playLabel={t.home.videoPlay}
          />
        </Reveal>
      </section>

      {/* Booking request: dark glass info card + light glass form over a blurred photo. */}
      <section id="request" className="relative isolate overflow-hidden py-20 sm:py-24">
        <div className="absolute inset-0 -z-10" aria-hidden="true">
          <Image src={requestBackground} alt="" fill sizes="100vw" className="scale-110 object-cover blur-sm" />
          <div className="absolute inset-0 bg-navy/80" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e73be]/25 via-transparent to-brand/15" />
        </div>
        <div className="container-page grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8">
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-[1.75rem] border border-white/15 bg-white/10 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
              <h2 className="text-2xl font-bold sm:text-3xl">{t.home.requestTitle}</h2>
              <p className="mt-2 text-white/75">{t.home.requestSubtitle}</p>

              <ol className="mt-6 space-y-5">
                {t.home.requestSteps.map((step, i) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/30 text-sm font-bold">{i + 1}</span>
                    <span>
                      <span className="block font-semibold">{step.title}</span>
                      <span className="block text-sm text-white/70">{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <ul className="mt-7 divide-y divide-white/10 border-y border-white/10">
                {[
                  { icon: "phone" as const, label: t.home.requestCall, value: BUSINESS.phone, href: BUSINESS.phoneHref },
                  { icon: "mail" as const, label: t.home.requestEmail, value: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
                  { icon: "pin" as const, label: t.home.requestVisit, value: `${BUSINESS.street}, ${BUSINESS.locality}` },
                  { icon: "clock" as const, label: t.home.requestHours, value: BUSINESS.hours[lang] },
                ].map((row) => {
                  const body = (
                    <>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/5">
                        <Icon name={row.icon} width={18} height={18} />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-white/60">{row.label}</span>
                        <span className="block font-semibold">{row.value}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={row.label}>
                      {row.href ? (
                        <a href={row.href} className="flex items-center gap-4 py-4 hover:text-accent">{body}</a>
                      ) : (
                        <div className="flex items-center gap-4 py-4">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <ul className="mt-6 space-y-2 border-t border-dashed border-white/20 pt-5 text-sm text-white/80">
                {t.home.requestChecks.map((c) => (
                  <li key={c} className="flex gap-2">
                    <Icon name="check" width={16} height={16} className="mt-0.5 shrink-0 text-accent" />
                    {c}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <a href={BUSINESS.phoneHref} className="btn-glow w-full">
                  <Icon name="phone" width={18} height={18} />
                  {t.home.requestCallCta} {BUSINESS.phone}
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150} className="h-full">
            <div className="h-full rounded-[1.75rem] border border-white/60 bg-gradient-to-b from-white/85 to-white/70 shadow-2xl shadow-black/25 backdrop-blur-xl">
              <RequestForm
                t={t.home.requestForm}
                services={SERVICES.map((sv) => ({ slug: sv.slug, name: sv.name[lang] }))}
                minDate={mauritiusDate(1)}
              />
            </div>
          </Reveal>
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
