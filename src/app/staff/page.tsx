import Link from "next/link";
import { and, asc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireStaff } from "@/lib/staff-auth";
import { mauritiusDate } from "@/lib/dates";
import { addDays, fromMinutes, hoursLabel, isIsoDate, jobMinutes, toMinutes } from "@/lib/schedule";
import { getService } from "@/content/services";
import { getTown } from "@/content/towns";
import en from "@/dictionaries/en";
import { Logo } from "@/components/logo";
import { Icon } from "@/components/icons";
import { checkIn, checkOut, staffLogout } from "./actions";

export const metadata = { title: "My jobs" };

const time = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mauritius" }).format(d);

const dayLabel = (iso: string, style: "short" | "long") =>
  new Intl.DateTimeFormat("en-GB", { weekday: style, day: "numeric", month: style === "long" ? "long" : undefined, timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

export default async function StaffHome({ searchParams }: PageProps<"/staff">) {
  const me = await requireStaff();
  const today = mauritiusDate();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const { day: requested } = await searchParams;
  const day = isIsoDate(requested) && week.includes(requested) ? requested : today;

  const db = await getDb();
  const { bookings: b, bookingAssignments: a, customers: c } = schema;
  // Only jobs this person is on, from today to a week ahead.
  const mine = await db
    .select({ booking: b, assignment: a, customer: c.name, phone: c.phone })
    .from(a)
    .innerJoin(b, eq(a.bookingId, b.id))
    .innerJoin(c, eq(b.customerId, c.id))
    .where(and(eq(a.staffId, me.id), ne(b.status, "cancelled"), gte(b.date, today), lte(b.date, week[6])))
    .orderBy(asc(b.date), asc(b.timeSlot));
  const jobs = mine.filter((j) => j.booking.date === day);
  const teammates = jobs.length
    ? await db
        .select({ bookingId: a.bookingId, name: schema.staff.name })
        .from(a)
        .innerJoin(schema.staff, eq(a.staffId, schema.staff.id))
        .where(and(inArray(a.bookingId, jobs.map((j) => j.booking.id)), ne(a.staffId, me.id)))
    : [];

  return (
    <div className="mx-auto min-h-svh max-w-lg pb-10">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-4 py-3 backdrop-blur">
        <Logo className="h-7 w-auto" />
        <form action={staffLogout}>
          <button type="submit" className="flex items-center gap-1.5 text-sm text-ink-soft" aria-label="Sign out">
            {me.name.split(" ")[0]} <Icon name="logout" width={18} height={18} />
          </button>
        </form>
      </header>

      <nav className="flex gap-1.5 overflow-x-auto px-4 py-3" aria-label="Day">
        {week.map((d) => {
          const n = mine.filter((j) => j.booking.date === d).length;
          return (
            <Link
              key={d}
              href={d === today ? "/staff" : `/staff?day=${d}`}
              aria-current={d === day ? "date" : undefined}
              className={`min-w-14 shrink-0 rounded-xl px-2 py-2 text-center text-xs font-semibold ${d === day ? "bg-navy text-white" : "bg-white text-ink-soft"}`}
            >
              {d === today ? "Today" : dayLabel(d, "short").split(" ")[0]}
              <span className="block text-lg leading-tight">{d.slice(8)}</span>
              <span className={`mx-auto mt-0.5 block size-1.5 rounded-full ${n ? (d === day ? "bg-white" : "bg-brand") : "bg-transparent"}`} aria-label={`${n} jobs`} />
            </Link>
          );
        })}
      </nav>

      <main className="space-y-4 px-4">
        <h1 className="text-xl font-bold">
          {day === today ? "Today" : dayLabel(day, "long")}{" "}
          <span className="font-normal text-ink-soft">· {jobs.length ? `${jobs.length} job${jobs.length === 1 ? "" : "s"}` : "no jobs"}</span>
        </h1>

        {jobs.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-ink-soft">Nothing planned for you this day.</p>
        )}

        {jobs.map(({ booking, assignment, customer, phone }) => {
          const start = toMinutes(booking.timeSlot);
          const end = fromMinutes(start + jobMinutes(booking));
          const town = getTown(booking.town)?.name ?? booking.town;
          const place = `${booking.address}, ${town}, Mauritius`;
          const { addons = [], ...counts } = booking.details as Record<string, number> & { addons?: string[] };
          const team = teammates.filter((t) => t.bookingId === booking.id).map((t) => t.name);
          const isToday = booking.date === today;
          const state = assignment.checkedOutAt ? "done" : assignment.checkedInAt ? "on-site" : "to-do";

          return (
            <article key={booking.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className={`flex items-center justify-between px-4 py-2 text-sm font-semibold ${state === "done" ? "bg-emerald-50 text-emerald-800" : state === "on-site" ? "bg-sky-50 text-sky-800" : "bg-surface-alt text-ink"}`}>
                <span>{booking.timeSlot} – {end} <span className="font-normal">({hoursLabel(jobMinutes(booking))})</span></span>
                <span>
                  {state === "done" && `Done ${time(assignment.checkedOutAt!)}`}
                  {state === "on-site" && `On site since ${time(assignment.checkedInAt!)}`}
                  {state === "to-do" && (isToday ? "Not started" : "Upcoming")}
                </span>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <h2 className="text-lg font-bold">{getService(booking.service)?.name.en ?? booking.service}</h2>
                  <p className="text-ink-soft">{customer}</p>
                  <p className="mt-1">{booking.address}, {town}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`} target="_blank" rel="noopener" className="btn-secondary min-h-12">
                    <Icon name="pin" width={18} height={18} /> Directions
                  </a>
                  <a href={`tel:${phone}`} className="btn-secondary min-h-12">
                    <Icon name="phone" width={18} height={18} /> Call
                  </a>
                </div>

                <dl className="space-y-1 text-sm">
                  {Object.keys(counts).length > 0 && (
                    <div><dt className="inline font-medium">Job: </dt><dd className="inline">{Object.entries(counts).map(([k, v]) => `${en.booking.fields[k] ?? k}: ${v}`).join(" · ")}</dd></div>
                  )}
                  {addons.length > 0 && (
                    <div><dt className="inline font-medium">Extras: </dt><dd className="inline">{addons.map((x) => en.booking.addons[x] ?? x).join(", ")}</dd></div>
                  )}
                  {team.length > 0 && (
                    <div><dt className="inline font-medium">With: </dt><dd className="inline">{team.join(", ")}</dd></div>
                  )}
                </dl>

                {booking.notes && (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
                    <span className="font-semibold">Customer notes: </span>{booking.notes}
                  </p>
                )}

                {isToday && state === "to-do" && (
                  <form action={checkIn}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <button type="submit" className="btn-primary min-h-14 w-full text-lg">I&apos;ve arrived: check in</button>
                  </form>
                )}
                {state === "on-site" && (
                  <form action={checkOut} className="space-y-2">
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <label className="block">
                      <span className="label">Anything to report? (optional)</span>
                      <textarea name="report" rows={2} maxLength={2000} placeholder="Broken item, extra work, customer request…" className="field" />
                    </label>
                    <button type="submit" className="min-h-14 w-full rounded-full bg-emerald-600 px-6 text-lg font-semibold text-white hover:bg-emerald-700">Job finished: check out</button>
                  </form>
                )}
                {state === "done" && assignment.report && (
                  <p className="text-sm text-ink-soft"><span className="font-medium">Your report:</span> {assignment.report}</p>
                )}
              </div>
            </article>
          );
        })}
      </main>
    </div>
  );
}
