import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { hm } from "@/lib/roster";
import { LATE_AFTER_MINUTES, STATUS_LABEL, timesheet } from "@/lib/timesheets";
import { BUSINESS } from "@/content/business";
import { PageHeader, StatCard } from "../../ui";
import { DataTable, type Row, type Tone } from "../../data-table";
import { PrintButton } from "./print-button";

export const metadata = { title: "Timesheets" };

const STATUS_TONE: Record<string, Tone> = { ok: "emerald", late: "amber", no_clock_out: "rose", absent: "rose", upcoming: "gray" };
const clock = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mauritius" }).format(d) : "—";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const monthName = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
const dayName = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
};

export default async function TimesheetsPage({ searchParams }: PageProps<"/admin/roster/timesheets">) {
  await requireAdmin();
  const params = await searchParams;
  const month = typeof params.month === "string" && /^\d{4}-\d{2}$/.test(params.month) ? params.month : mauritiusDate().slice(0, 7);
  const siteId = typeof params.site === "string" && /^\d+$/.test(params.site) ? Number(params.site) : null;

  const db = await getDb();
  const sites = await db.select({ id: schema.sites.id, name: schema.sites.name }).from(schema.sites).orderBy(asc(schema.sites.name));
  const rows = await timesheet(month, siteId);
  const siteName = siteId ? sites.find((s) => s.id === siteId)?.name : null;

  const worked = rows.reduce((s, r) => s + (r.workedMinutes ?? 0), 0);
  const planned = rows.reduce((s, r) => s + r.plannedMinutes, 0);
  const problems = rows.filter((r) => r.status === "no_clock_out" || r.status === "absent").length;
  const late = rows.filter((r) => r.status === "late").length;

  // Per person totals, the figure hotels and payroll ask for.
  const people = [...new Set(rows.map((r) => r.staffId))].map((id) => {
    const mine = rows.filter((r) => r.staffId === id);
    return {
      id,
      name: mine[0].person,
      shifts: mine.length,
      worked: mine.reduce((s, r) => s + (r.workedMinutes ?? 0), 0),
      planned: mine.reduce((s, r) => s + r.plannedMinutes, 0),
      late: mine.filter((r) => r.status === "late").length,
      problems: mine.filter((r) => r.status === "no_clock_out" || r.status === "absent").length,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const detail: Row[] = rows.map((r, i) => ({
    id: i + 1,
    filter: r.status,
    cells: {
      date: { text: dayName(r.date), sort: `${r.date} ${r.start}` },
      site: { text: r.site, sub: `${r.shift} ${r.start}–${r.end}` },
      person: { text: `${r.isLeader ? "★ " : ""}${r.person}` },
      in: { text: clock(r.clockInAt), sub: r.lateMinutes > LATE_AFTER_MINUTES ? `${r.lateMinutes} min late` : undefined },
      out: { text: clock(r.clockOutAt) },
      worked: { text: r.workedMinutes === null ? "—" : hm(r.workedMinutes), sort: r.workedMinutes ?? -1 },
      status: { text: STATUS_LABEL[r.status], badge: STATUS_TONE[r.status] },
    },
  }));

  const query = (m: string) => `/admin/roster/timesheets?month=${m}${siteId ? `&site=${siteId}` : ""}`;
  const shiftMonth = (delta: number) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    return d.toISOString().slice(0, 7);
  };

  return (
    <>
      <div className="print:hidden">
        <Link href="/admin/roster" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Roster</Link>
        <PageHeader title="Timesheets" subtitle="Hours worked from shift clock-ins, for payroll and for the hotels">
          <div className="flex flex-wrap gap-2">
            <a href={`/admin/roster/timesheets/export?month=${month}${siteId ? `&site=${siteId}` : ""}`} className="btn-secondary min-h-10 px-4 text-sm">Download CSV</a>
            <PrintButton />
          </div>
        </PageHeader>

        <form className="mb-6 flex flex-wrap items-end gap-3">
          <nav className="flex items-center gap-2" aria-label="Month">
            <Link href={query(shiftMonth(-1))} className="btn-secondary min-h-10 px-3 text-sm" aria-label="Previous month">←</Link>
            <span className="min-w-36 text-center font-semibold">{monthName(month)}</span>
            <Link href={query(shiftMonth(1))} className="btn-secondary min-h-10 px-3 text-sm" aria-label="Next month">→</Link>
          </nav>
          <input type="hidden" name="month" value={month} />
          <label>
            <span className="label">Site</span>
            <select name="site" defaultValue={siteId ?? ""} className="field py-2">
              <option value="">All sites</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <button type="submit" className="btn-secondary min-h-10 px-4 text-sm">Show</button>
        </form>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Hours worked" value={hm(worked)} note={`of ${hm(planned)} planned`} icon="clock" color="navy" />
          <StatCard label="Shift places" value={String(rows.length)} note={`${people.length} people`} icon="roster" color="sky" />
          <StatCard label="Late arrivals" value={String(late)} note={`more than ${LATE_AFTER_MINUTES} min after start`} icon="alert" color={late ? "amber" : "emerald"} />
          <StatCard label="Missing clock-in/out" value={String(problems)} note={problems ? "fix in the roster's shift editor" : "all complete"} icon="wallet" color={problems ? "rose" : "emerald"} />
        </div>
      </div>

      {/* Printable sheet: what a hotel signs off at month end. */}
      <section className="card mb-6 p-5 print:border-0 print:p-0 print:shadow-none">
        <div className="mb-4 hidden print:block">
          <p className="text-xl font-bold">{BUSINESS.legalName}: timesheet</p>
          <p>{siteName ?? "All sites"} · {monthName(month)}</p>
        </div>
        <h2 className="mb-3 font-semibold print:hidden">Hours per person · {siteName ?? "all sites"} · {monthName(month)}</h2>
        {people.length === 0 ? (
          <p className="text-sm text-ink-soft">No shifts this month{siteName ? ` at ${siteName}` : ""}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b-2 border-navy text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="py-2 pr-3">Name</th>
                  <th className="px-3 py-2 text-right">Shifts</th>
                  <th className="px-3 py-2 text-right">Planned</th>
                  <th className="px-3 py-2 text-right">Worked</th>
                  <th className="px-3 py-2 text-right">Late</th>
                  <th className="py-2 pl-3 text-right">Missing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {people.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 pr-3 font-medium">{p.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{p.shifts}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{hm(p.planned)}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{hm(p.worked)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums ${p.late ? "text-amber-700" : ""}`}>{p.late}</td>
                    <td className={`py-2 pl-3 text-right tabular-nums ${p.problems ? "font-semibold text-rose-700" : ""}`}>{p.problems}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-navy font-bold">
                <tr>
                  <td className="py-2 pr-3">Total</td>
                  <td className="px-3 py-2 text-right tabular-nums">{rows.length}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{hm(planned)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{hm(worked)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{late}</td>
                  <td className="py-2 pl-3 text-right tabular-nums">{problems}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <div className="mt-10 hidden grid-cols-2 gap-12 text-sm print:grid">
          <p className="border-t border-ink pt-2">For {BUSINESS.legalName}: name, signature, date</p>
          <p className="border-t border-ink pt-2">For {siteName ?? "the client"}: name, signature, date</p>
        </div>
      </section>

      <div className="print:hidden">
        <h2 className="mb-3 font-semibold">Every shift</h2>
        <DataTable
          columns={[
            { key: "date", label: "Date" },
            { key: "site", label: "Site / shift" },
            { key: "person", label: "Person" },
            { key: "in", label: "In" },
            { key: "out", label: "Out" },
            { key: "worked", label: "Worked", align: "right" },
            { key: "status", label: "Status" },
          ]}
          rows={detail}
          filters={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          defaultSort={{ key: "date", dir: "asc" }}
          searchPlaceholder="Search person or site"
          empty="No shifts this month."
        />
      </div>
    </>
  );
}
