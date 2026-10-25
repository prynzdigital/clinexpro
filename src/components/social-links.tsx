import { BUSINESS } from "@/content/business";

const SOCIALS = [
  { href: BUSINESS.facebook, label: "Facebook", path: "M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v6h4v-6h3l1-4h-4V8z" },
  {
    href: BUSINESS.youtube,
    label: "YouTube",
    path: "M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z",
  },
  { href: BUSINESS.whatsappHref, label: "WhatsApp", path: "M4 20l1.3-3.9A8 8 0 1 1 8 19.3z" },
];

/** Round social icons; "dark" for light backgrounds, "light" for navy ones. */
export function SocialLinks({ tone = "light", className = "" }: { tone?: "light" | "dark"; className?: string }) {
  const style =
    tone === "light"
      ? "bg-white/10 text-white hover:bg-brand"
      : "bg-brand-soft text-brand-strong hover:bg-brand hover:text-white";
  return (
    <ul className={`flex gap-2 ${className}`}>
      {SOCIALS.map((s) => (
        <li key={s.label}>
          <a
            href={s.href}
            target="_blank"
            rel="noopener"
            aria-label={s.label}
            className={`grid size-10 place-items-center rounded-full transition-colors ${style}`}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
              <path d={s.path} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
