import { requireAdmin } from "@/lib/auth";
import { STATUS_LABEL, timesheet } from "@/lib/timesheets";

// Monthly timesheet as CSV (Excel-friendly, UTF-8 with BOM).

const cell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  const safe = /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};
const time = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mauritius" }).format(d) : "";
const hours = (m: number | null) => (m === null ? "" : (m / 60).toFixed(2));

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? "";
  const site = url.searchParams.get("site");
  if (!/^\d{4}-\d{2}$/.test(month)) return new Response("Pick a month.", { status: 400 });
  const rows = await timesheet(month, site && /^\d+$/.test(site) ? Number(site) : null);

  const lines = [
    ["Date", "Site", "Shift", "Planned start", "Planned end", "Person", "Leader", "Clock in", "Clock out", "Planned hours", "Worked hours", "Late (min)", "Status"],
    ...rows.map((r) => [
      r.date,
      r.site,
      r.shift,
      r.start,
      r.end,
      r.person,
      r.isLeader ? "Yes" : "",
      time(r.clockInAt),
      time(r.clockOutAt),
      hours(r.plannedMinutes),
      hours(r.workedMinutes),
      r.lateMinutes || "",
      STATUS_LABEL[r.status],
    ]),
  ];
  const body = "﻿" + lines.map((l) => l.map(cell).join(",")).join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clinexpro-timesheet-${month}${site ? `-site-${site}` : ""}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
