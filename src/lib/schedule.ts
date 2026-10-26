// Scheduling rules shared by the board (browser) and its server actions.

/**
 * Usual job length when the team hasn't set one. PLACEHOLDER: confirm typical
 * durations with Clinex Pro; a job's own durationMinutes always wins.
 */
const USUAL_MINUTES: Record<string, number> = {
  "home-cleaning": 180,
  "deep-cleaning": 300,
  "maid-service": 240,
  "sofa-carpet": 120,
  "pressure-washing": 180,
  "office-cleaning": 180,
  "hotel-hospitality": 240,
};

export const jobMinutes = (job: { service: string; durationMinutes: number | null }) =>
  job.durationMinutes ?? USUAL_MINUTES[job.service] ?? 180;

export const DURATION_CHOICES = [60, 90, 120, 150, 180, 240, 300, 360, 480];

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fromMinutes = (total: number) =>
  `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

export const hoursLabel = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
};

type Timed = { id: number; date: string; timeSlot: string; service: string; durationMinutes: number | null };

/** Ids of jobs that overlap another job on the same day (for one person). */
export function clashingJobs(jobs: Timed[]) {
  const clashes = new Set<number>();
  const byDay = new Map<string, Timed[]>();
  for (const job of jobs) byDay.set(job.date, [...(byDay.get(job.date) ?? []), job]);
  for (const dayJobs of byDay.values()) {
    for (let i = 0; i < dayJobs.length; i++) {
      for (let k = i + 1; k < dayJobs.length; k++) {
        const a = dayJobs[i];
        const b = dayJobs[k];
        const aStart = toMinutes(a.timeSlot);
        const bStart = toMinutes(b.timeSlot);
        if (aStart < bStart + jobMinutes(b) && bStart < aStart + jobMinutes(a)) {
          clashes.add(a.id);
          clashes.add(b.id);
        }
      }
    }
  }
  return clashes;
}

// --- Dates (plain YYYY-MM-DD strings, no time zones involved) ------------

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);
const format = (d: Date) => d.toISOString().slice(0, 10);

export const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parse(value).getTime());

export const addDays = (iso: string, days: number) => {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return format(d);
};

/** The Monday of the week containing `iso`. */
export const mondayOf = (iso: string) => addDays(iso, -((parse(iso).getUTCDay() + 6) % 7));

export const weekDays = (monday: string) => Array.from({ length: 7 }, (_, i) => addDays(monday, i));

/** Distinct, readable on white, and different from the brand orange. */
export const STAFF_COLORS = ["#2563eb", "#059669", "#7c3aed", "#db2777", "#0891b2", "#ca8a04", "#4f46e5", "#16a34a", "#9333ea", "#0d9488"];
