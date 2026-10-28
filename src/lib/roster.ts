// Shift rules shared by the roster (browser) and the server. Times are "HH:MM"
// in Mauritius (UTC+4, no daylight saving); an end before the start means the
// shift runs past midnight.

import { toMinutes } from "./schedule";

export const SHIFT_PRESETS = [
  { label: "Morning", start: "07:00", end: "15:00" },
  { label: "Afternoon", start: "15:00", end: "23:00" },
  { label: "Night", start: "23:00", end: "07:00" },
  { label: "Day", start: "08:00", end: "17:00" },
] as const;

export const SITE_COLORS = ["#0e7490", "#7c3aed", "#b45309", "#be123c", "#15803d", "#1d4ed8", "#a21caf", "#0f766e"];

/** Length of a shift in minutes (overnight shifts wrap). */
export const shiftMinutes = (start: string, end: string) => {
  const m = toMinutes(end) - toMinutes(start);
  return m > 0 ? m : m + 24 * 60;
};

/** Start and end as epoch milliseconds (Mauritius time). */
export function shiftWindow(date: string, start: string, end: string) {
  const from = Date.parse(`${date}T${start}:00+04:00`);
  return { from, to: from + shiftMinutes(start, end) * 60_000 };
}

export const overlaps = (a: { from: number; to: number }, b: { from: number; to: number }) => a.from < b.to && b.from < a.to;

/** "7h30" from minutes. */
export const hm = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

/** Worked minutes from clock times (null while still on shift or not clocked). */
export const workedMinutes = (inAt: Date | string | null, outAt: Date | string | null) =>
  inAt && outAt ? Math.max(0, Math.round((new Date(outAt).getTime() - new Date(inAt).getTime()) / 60_000)) : null;

/** Clock-in is open from an hour before the start until the planned end. */
export const CLOCK_IN_EARLY_MINUTES = 60;
