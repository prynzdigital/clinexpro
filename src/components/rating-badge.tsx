import { REVIEWS } from "@/content/reviews";

/** "★★★★★ 5.0 · 36 reviews" badge. Renders nothing until real review data is set. */
export function RatingBadge({ label }: { label: string }) {
  const { rating, count, initials, source, sourceUrl } = REVIEWS;
  if (rating === null || count === 0) return null;

  const body = (
    <>
      {initials.length > 0 && (
        <span className="flex -space-x-2">
          {initials.slice(0, 4).map((i) => (
            <span key={i} className="grid size-8 place-items-center rounded-full border-2 border-white bg-navy text-[11px] font-bold text-white">
              {i}
            </span>
          ))}
        </span>
      )}
      <span>
        <span className="flex items-center gap-1 text-accent" aria-hidden="true">
          {Array.from({ length: 5 }, (_, i) => (
            <svg key={i} viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
              <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
            </svg>
          ))}
        </span>
        <span className="text-sm text-ink-soft">
          <strong className="text-ink">{rating.toFixed(1)}</strong> · {count} {label} · {source}
        </span>
      </span>
    </>
  );

  return sourceUrl ? (
    <a href={sourceUrl} target="_blank" rel="noopener" className="inline-flex items-center gap-3 hover:opacity-80">
      {body}
    </a>
  ) : (
    <div className="inline-flex items-center gap-3">{body}</div>
  );
}
