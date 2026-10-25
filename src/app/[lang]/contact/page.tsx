import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import cleanerSupplies from "../../../../public/images/cleaner-supplies.png";
import { BUSINESS } from "@/content/business";
import { Icon, type IconName } from "@/components/icons";
import { SocialLinks } from "@/components/social-links";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.contact.title, description: t.contact.subtitle, alternates: alternates(lang, "/contact") };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const items: { icon: IconName; label: string; value: string; href?: string }[] = [
    { icon: "phone", label: t.contact.phone, value: BUSINESS.phone, href: BUSINESS.phoneHref },
    { icon: "chat", label: t.contact.whatsapp, value: t.contact.chat, href: BUSINESS.whatsappHref },
    { icon: "mail", label: t.contact.email, value: BUSINESS.email, href: `mailto:${BUSINESS.email}` },
    { icon: "clock", label: t.contact.hours, value: BUSINESS.hours[lang] },
  ];
  return (
    <div className="container-page grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
      <div className="space-y-8">
        <header className="max-w-2xl space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">{t.contact.title}</h1>
          <p className="text-lg text-ink-soft">{t.contact.subtitle}</p>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const body = (
              <>
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-strong">
                  <Icon name={item.icon} />
                </span>
                <span>
                  <span className="block text-sm text-ink-soft">{item.label}</span>
                  <span className="text-lg font-semibold">{item.value}</span>
                </span>
              </>
            );
            return (
              <li key={item.label}>
                {item.href ? (
                  <a href={item.href} className="card flex items-center gap-4 p-5 hover:border-brand">{body}</a>
                ) : (
                  <div className="card flex items-center gap-4 p-5">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
        <div>
          <p className="mb-3 text-sm font-semibold text-ink-soft">{t.contact.follow}</p>
          <SocialLinks tone="dark" />
        </div>
      </div>
      <div className="relative mx-auto w-full max-w-[280px] lg:max-w-[360px]">
        <div className="absolute inset-x-0 bottom-0 top-[20%] rounded-t-full bg-brand-soft" aria-hidden="true" />
        <Image
          src={cleanerSupplies}
          alt="Clinex Pro cleaner holding eco-friendly cleaning products"
          sizes="(min-width: 1024px) 360px, 280px"
          className="relative h-auto w-full"
        />
      </div>
    </div>
  );
}
