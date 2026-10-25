import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import headerPhoto from "../../public/images/page-header.jpg";

export type Crumb = { label: string; href?: string };

/**
 * Header for inner pages: cream panel with breadcrumbs, eyebrow, light heading
 * and intro, with a photo fading in from the right. It slides under the sticky
 * glass header (-mt-20) the way the home hero does.
 */
export function PageHeader({
  crumbs,
  eyebrow,
  title,
  intro,
  children,
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative -mt-20 overflow-hidden bg-[#f6f0e8]">
      <div aria-hidden="true" className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
        <Image src={headerPhoto} alt="" fill loading="eager" fetchPriority="high" sizes="(min-width: 1024px) 64vw, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-[#f6f0e8]/80 lg:hidden" />
        <div className="absolute inset-0 hidden bg-gradient-to-r from-[#f6f0e8] via-[#f6f0e8]/75 to-transparent lg:block" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#f6f0e8]/70 to-transparent" />
      </div>

      <div className="container-page relative pb-12 pt-32 sm:pb-14 sm:pt-36 lg:pb-16">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-soft">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {crumbs.map((c, i) => (
              <li key={c.label} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true" className="text-ink-soft/50">/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-brand-strong">{c.label}</Link>
                ) : (
                  <span aria-current="page" className="text-ink">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-strong">{eyebrow}</p>
        <h1 className="max-w-4xl text-4xl font-light leading-[1.08] tracking-tight text-ink text-balance sm:text-5xl lg:text-[3.5rem]">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{intro}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
