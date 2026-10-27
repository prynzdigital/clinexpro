// Small, dependency-free charts for the owner dashboard (server-rendered).
// One measure per chart, one colour, zero baseline, values in text tokens,
// a hover tooltip per mark, and a table view so nothing relies on colour alone.

type Point = { label: string; long: string; value: number; display: string };

/** Vertical bars over time (e.g. 12 months). Direct labels only on the latest and the highest bar. */
export function ColumnChart({ title, points, color, summary }: { title: string; points: Point[]; color: string; summary: string }) {
  const max = Math.max(...points.map((p) => p.value), 0);
  const top = niceCeil(max);
  const peak = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0);
  const ticks = [top, top / 2, 0];

  return (
    <figure className="card p-5">
      <figcaption className="mb-4 font-semibold">{title}</figcaption>
      <div className="relative" role="img" aria-label={`${title}. ${summary}`}>
        <div className="flex h-52 gap-2">
          {/* y-axis labels, recessive */}
          <div className="flex w-14 shrink-0 flex-col justify-between pb-6 text-right text-[11px] text-ink-soft" aria-hidden>
            {ticks.map((t, i) => <span key={i} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{short(t)}</span>)}
          </div>
          <div className="relative flex min-w-0 flex-1 flex-col">
            {/* gridlines */}
            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden>
              {ticks.map((t, i) => <span key={i} className={`border-t ${t === 0 ? "border-ink/40" : "border-line"}`} />)}
            </div>
            <ol className="relative flex flex-1 items-end gap-[2px] pb-px">
              {points.map((p, i) => {
                const h = top ? (p.value / top) * 100 : 0;
                const labelled = p.value > 0 && (i === points.length - 1 || i === peak);
                return (
                  <li key={p.label} className="group relative flex h-full flex-1 flex-col justify-end">
                    {labelled && (
                      <span className="pointer-events-none mb-1 text-center text-[11px] font-semibold text-ink group-hover:invisible">{short(p.value)}</span>
                    )}
                    <span
                      className="mx-auto block w-full max-w-7 rounded-t-[4px] transition-opacity group-hover:opacity-80"
                      style={{ height: `${h}%`, minHeight: p.value > 0 ? 2 : 0, background: color }}
                    />
                    {/* tooltip: the whole column is the hover target */}
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block"
                    >
                      <span className="block text-white/70">{p.long}</span>
                      <span className="font-semibold">{p.display}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <ol className="flex h-6 items-end gap-[2px] text-center text-[11px] text-ink-soft" aria-hidden>
              {points.map((p) => <li key={p.label} className="flex-1 truncate">{p.label}</li>)}
            </ol>
          </div>
        </div>
      </div>
      <TableView headers={["Month", title]} rows={points.map((p) => [p.long, p.display])} />
    </figure>
  );
}

/** Ranked horizontal bars (services, towns, people). Every bar is labelled. */
export function RankedBars({
  title,
  rows,
  color,
  empty,
  columns,
}: {
  title: string;
  rows: { label: string; value: number; display: string; note?: string }[];
  color: string;
  empty: string;
  columns: [string, string];
}) {
  const max = Math.max(...rows.map((r) => r.value), 0);
  return (
    <figure className="card p-5">
      <figcaption className="mb-4 font-semibold">{title}</figcaption>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft">{empty}</p>
      ) : (
        <ol className="space-y-3">
          {rows.map((r) => (
            <li key={r.label} className="text-sm" title={`${r.label}: ${r.display}${r.note ? ` (${r.note})` : ""}`}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="truncate">{r.label}</span>
                <span className="shrink-0 tabular-nums">
                  <span className="font-semibold">{r.display}</span>
                  {r.note && <span className="ml-1.5 text-xs text-ink-soft">{r.note}</span>}
                </span>
              </div>
              <span className="block h-2 rounded-full bg-surface-alt" aria-hidden>
                <span className="block h-2 rounded-full" style={{ width: `${max ? Math.max((r.value / max) * 100, 1.5) : 0}%`, background: color }} />
              </span>
            </li>
          ))}
        </ol>
      )}
      {rows.length > 0 && <TableView headers={columns} rows={rows.map((r) => [r.label, r.note ? `${r.display} (${r.note})` : r.display])} />}
    </figure>
  );
}

function TableView({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <details className="mt-4 text-sm">
      <summary className="cursor-pointer text-xs font-medium text-ink-soft hover:text-ink">Show as table</summary>
      <table className="mt-2 w-full text-left">
        <thead className="text-xs text-ink-soft">
          <tr>{headers.map((h) => <th key={h} className="py-1 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r) => (
            <tr key={r[0]}>{r.map((c, i) => <td key={i} className={`py-1 ${i ? "text-right tabular-nums" : ""}`}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** Rounds an axis maximum up to 1, 2 or 5 × a power of ten. */
function niceCeil(n: number) {
  if (n <= 0) return 0;
  const step = 10 ** Math.floor(Math.log10(n));
  return [1, 2, 5, 10].map((m) => m * step).find((v) => v >= n)!;
}

/** Axis-friendly rupees from cents: 1.2k, 35k, 1.4M. */
function short(cents: number) {
  const rs = cents / 100;
  if (rs >= 1_000_000) return `${(rs / 1_000_000).toFixed(rs >= 10_000_000 ? 0 : 1)}M`;
  if (rs >= 1_000) return `${(rs / 1_000).toFixed(rs >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(rs));
}
