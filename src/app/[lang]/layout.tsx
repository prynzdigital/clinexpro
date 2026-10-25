import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Open_Sans } from "next/font/google";
import "../globals.css";
import { hasLocale, LOCALES, SITE_URL, alternates } from "@/lib/i18n";
import { getDictionary } from "@/dictionaries";
import { BUSINESS } from "@/content/business";
import { TOWNS } from "@/content/towns";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { JsonLd } from "@/components/json-ld";
import { Pwa } from "@/components/pwa";

const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-open-sans" });

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const viewport: Viewport = {
  themeColor: "#031432",
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.meta.siteTitle, template: "%s | Clinex Pro" },
    description: t.meta.siteDescription,
    alternates: alternates(lang, "/"),
    applicationName: "Clinex Pro",
    appleWebApp: { capable: true, title: "Clinex Pro", statusBarStyle: "default" },
    icons: { icon: [{ url: "/brand/icon-192.png", type: "image/png" }], apple: "/brand/apple-icon-180.png" },
    openGraph: {
      type: "website",
      siteName: "Clinex Pro",
      locale: lang === "fr" ? "fr_MU" : "en_MU",
      title: t.meta.siteTitle,
      description: t.meta.siteDescription,
      images: [{ url: "/images/family-booking.jpg", width: 750, height: 501, alt: "Clinex Pro" }],
    },
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);

  const business = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    legalName: BUSINESS.legalName,
    url: SITE_URL,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    image: `${SITE_URL}/icons/512`,
    priceRange: "MUR",
    address: { "@type": "PostalAddress", streetAddress: BUSINESS.street, addressLocality: BUSINESS.locality, addressCountry: "MU" },
    areaServed: TOWNS.map((town) => ({ "@type": "City", name: town.name })),
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "17:00",
    },
    sameAs: [BUSINESS.facebook, BUSINESS.youtube],
  };

  return (
    <html lang={lang} data-scroll-behavior="smooth" className={`${openSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <JsonLd data={business} />
        <SiteHeader lang={lang} t={t} />
        <main className="flex-1">{children}</main>
        <SiteFooter lang={lang} t={t} />
        <Pwa labels={t.pwa} />
      </body>
    </html>
  );
}
