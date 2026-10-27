"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";

// Interactive table for admin lists: search, sortable columns, a status filter,
// paging and row actions. Rows arrive ready to show (plain data from the server
// page), so the same component serves bookings, customers, leads and more.

export type Tone = "gray" | "amber" | "sky" | "emerald" | "rose" | "violet" | "orange";

export type Cell = {
  text: string;
  /** Second line in smaller text. */
  sub?: string;
  /** Value used for sorting when it differs from the text (dates, money). */
  sort?: string | number;
  badge?: Tone;
  mono?: boolean;
};

export type Column = { key: string; label: string; align?: "right"; sortable?: boolean; hideOnMobile?: boolean };

export type Row = {
  id: number;
  href?: string;
  cells: Record<string, Cell>;
  /** Value matched by the status filter chips. */
  filter?: string;
  editHref?: string;
  /** Null hides Delete; a string explains why it can't be deleted. */
  deleteBlockedReason?: string | null;
  canDelete?: boolean;
};

const TONES: Record<Tone, string> = {
  gray: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rose: "bg-rose-50 text-rose-800 ring-rose-200",
  violet: "bg-violet-50 text-violet-800 ring-violet-200",
  orange: "bg-brand-soft text-brand-strong ring-orange-200",
};

const PAGE_SIZE = 15;

export function DataTable({
  columns,
  rows,
  searchPlaceholder = "Search",
  filters,
  defaultSort,
  empty,
  deleteAction,
  deleteNoun = "record",
}: {
  columns: Column[];
  rows: Row[];
  searchPlaceholder?: string;
  filters?: { value: string; label: string }[];
  defaultSort?: { key: string; dir: "asc" | "desc" };
  empty: string;
  deleteAction?: (formData: FormData) => Promise<void>;
  deleteNoun?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState(defaultSort ?? null);
  const [page, setPage] = useState(0);
  const hasActions = rows.some((r) => r.editHref || r.canDelete);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter(
      (r) =>
        (filter === "all" || r.filter === filter) &&
        (!q || Object.values(r.cells).some((c) => `${c.text} ${c.sub ?? ""}`.toLowerCase().includes(q))),
    );
    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        const x = a.cells[sort.key]?.sort ?? a.cells[sort.key]?.text ?? "";
        const y = b.cells[sort.key]?.sort ?? b.cells[sort.key]?.text ?? "";
        return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
      });
    }
    return list;
  }, [rows, query, filter, sort]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = shown.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-3 sm:p-4">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">{searchPlaceholder}</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="field py-2 pl-9"
          />
        </label>
        {filters && (
          <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Filter">
            {[{ value: "all", label: "All" }, ...filters].map((f) => {
              const n = f.value === "all" ? rows.length : rows.filter((r) => r.filter === f.value).length;
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={filter === f.value}
                  onClick={() => {
                    setFilter(f.value);
                    setPage(0);
                  }}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${filter === f.value ? "bg-navy text-white" : "bg-surface-alt text-ink-soft hover:text-ink"}`}
                >
                  {f.label} <span className="opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="p-10 text-center text-sm text-ink-soft">{rows.length ? "Nothing matches. Try another search or filter." : empty}</p>
      ) : (
        // relative: keeps screen-reader-only labels inside the scroll area, not the page.
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-alt/70 text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                {columns.map((col) => {
                  const active = sort?.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                      className={`px-4 py-3 font-semibold ${col.align === "right" ? "text-right" : ""} ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                    >
                      {col.sortable === false ? (
                        col.label
                      ) : (
                        <button type="button" onClick={() => toggleSort(col.key)} className={`inline-flex items-center gap-1 uppercase hover:text-ink ${active ? "text-ink" : ""}`}>
                          {col.label}
                          <span aria-hidden className={active ? "" : "opacity-30"}>{active && sort!.dir === "desc" ? "▼" : "▲"}</span>
                        </button>
                      )}
                    </th>
                  );
                })}
                {hasActions && <th scope="col" className="px-4 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((row) => (
                <tr
                  key={row.id}
                  onClick={(e) => {
                    // Whole row opens the record, except clicks on links, buttons and forms inside it.
                    if (row.href && !(e.target as Element).closest("a, button, form, input, select")) router.push(row.href);
                  }}
                  className={`transition-colors ${row.href ? "cursor-pointer hover:bg-brand-soft/40" : ""}`}
                >
                  {columns.map((col, i) => {
                    const cell = row.cells[col.key];
                    if (!cell) return <td key={col.key} className={`px-4 py-3 ${col.hideOnMobile ? "hidden md:table-cell" : ""}`} />;
                    const content = cell.badge ? (
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[cell.badge]}`}>{cell.text}</span>
                    ) : (
                      <span className={`${cell.mono ? "font-mono text-xs font-semibold" : ""} ${i === 0 ? "font-medium" : ""}`}>{cell.text}</span>
                    );
                    return (
                      <td key={col.key} className={`px-4 py-3 align-middle ${col.align === "right" ? "text-right tabular-nums" : ""} ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}>
                        {i === 0 && row.href ? <Link href={row.href} className="text-brand-strong hover:underline">{content}</Link> : content}
                        {cell.sub && <span className="block text-xs text-ink-soft">{cell.sub}</span>}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1">
                        {row.editHref && (
                          <Link href={row.editHref} className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-alt hover:text-ink" aria-label="Edit" title="Edit">
                            <Icon name="pencil" width={16} height={16} />
                          </Link>
                        )}
                        {row.canDelete && deleteAction && (
                          <form
                            action={deleteAction}
                            onSubmit={(e) => {
                              if (row.deleteBlockedReason) {
                                e.preventDefault();
                                alert(row.deleteBlockedReason);
                              } else if (!confirm(`Delete this ${deleteNoun}? This can't be undone.`)) e.preventDefault();
                            }}
                          >
                            <input type="hidden" name="id" value={row.id} />
                            <button
                              type="submit"
                              className={`grid size-8 place-items-center rounded-lg ${row.deleteBlockedReason ? "text-ink-soft/40" : "text-ink-soft hover:bg-rose-50 hover:text-danger"}`}
                              aria-label={row.deleteBlockedReason ? `Can't delete: ${row.deleteBlockedReason}` : "Delete"}
                              title={row.deleteBlockedReason ?? "Delete"}
                            >
                              <Icon name="trash" width={16} height={16} />
                            </button>
                          </form>
                        )}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {shown.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-ink-soft">
          <span>
            {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, shown.length)} of {shown.length}
            {shown.length !== rows.length && ` (filtered from ${rows.length})`}
          </span>
          {pages > 1 && (
            <span className="flex items-center gap-1">
              <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded-lg px-2.5 py-1.5 font-semibold hover:bg-surface-alt disabled:opacity-40" aria-label="Previous page">←</button>
              {Array.from({ length: pages }, (_, p) => p)
                .filter((p) => p === 0 || p === pages - 1 || Math.abs(p - current) <= 1)
                .map((p, i, list) => (
                  <span key={p} className="flex items-center">
                    {i > 0 && p - list[i - 1] > 1 && <span className="px-1">…</span>}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      aria-current={p === current ? "page" : undefined}
                      className={`min-w-8 rounded-lg px-2 py-1.5 font-semibold ${p === current ? "bg-navy text-white" : "hover:bg-surface-alt"}`}
                    >
                      {p + 1}
                    </button>
                  </span>
                ))}
              <button type="button" disabled={current === pages - 1} onClick={() => setPage(current + 1)} className="rounded-lg px-2.5 py-1.5 font-semibold hover:bg-surface-alt disabled:opacity-40" aria-label="Next page">→</button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
