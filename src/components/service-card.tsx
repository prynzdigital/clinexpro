import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { ServiceContent } from "@/content/services";
import { getPricedService, formatMur } from "@/lib/pricing";
import { Icon } from "./icons";

export function ServiceCard({
  service,
  lang,
  labels,
}: {
  service: ServiceContent;
  lang: Locale;
  labels: { from: string; learnMore: string };
}) {
  const priced = getPricedService(service.slug);
  return (
    <Link
      href={`/${lang}/services/${service.slug}`}
      className="card group flex flex-col gap-4 p-5 transition hover:border-brand hover:shadow-sm"
    >
      <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand-strong">
        <Icon name={service.icon} />
      </span>
      <div className="flex-1 space-y-1.5">
        <h3 className="text-lg font-semibold">{service.name[lang]}</h3>
        <p className="text-sm text-ink-soft">{service.tagline[lang]}</p>
      </div>
      <div className="flex items-center justify-between text-sm">
        {priced ? (
          <span className="text-ink-soft">
            {labels.from} <strong className="text-ink">{formatMur(priced.minimumMur, lang)}</strong>
          </span>
        ) : (
          <span />
        )}
        <span className="inline-flex items-center gap-1 font-semibold text-brand-strong">
          {labels.learnMore}
          <Icon name="arrow" width={16} height={16} className="transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
