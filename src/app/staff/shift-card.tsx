import { Icon } from "@/components/icons";
import { CLOCK_IN_EARLY_MINUTES, hm, shiftWindow, workedMinutes } from "@/lib/roster";
import type { StaffShift } from "@/lib/staff-shifts";
import { ActionButton, Elapsed } from "./app-client";
import { clockIn, clockOut } from "./actions";
import { CrewList } from "./crew-list";

const clock = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mauritius" }).format(new Date(iso));

/** A shift at a hotel or office: where, when, who with, and clock in/out. */
export function ShiftCard({ shift, now }: { shift: StaffShift; now: number }) {
  const { from, to } = shiftWindow(shift.date, shift.start, shift.end);
  const state = shift.clockOutAt
    ? "done"
    : shift.clockInAt
      ? "on"
      : now > to
        ? "missed"
        : now >= from - CLOCK_IN_EARLY_MINUTES * 60_000
          ? "open"
          : "later";
  const place = [shift.site.address, shift.site.town].filter(Boolean).join(", ");
  const worked = workedMinutes(shift.clockInAt, shift.clockOutAt);

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 px-5 py-3 text-white" style={{ background: shift.site.color }}>
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
          <Icon name="roster" width={18} height={18} /> {shift.label ?? "Shift"}
        </span>
        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
          {state === "on" ? <>Clocked in · <Elapsed since={shift.clockInAt!} /></> : state === "done" ? `Done · ${hm(worked ?? 0)}` : state === "missed" ? "Not clocked in" : state === "open" ? "Clock-in open" : "Upcoming"}
        </span>
      </header>
      <div className="space-y-4 p-5">
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">
            {shift.start} <span className="text-base font-normal text-ink-soft">to</span> {shift.end}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{hm(shift.minutes)}{shift.end <= shift.start ? " · ends next morning" : ""}</p>
        </div>

        <div>
          <h2 className="text-lg font-bold">{shift.site.name}</h2>
          {place && (
            <p className="mt-1 flex items-start gap-2">
              <Icon name="pin" width={18} height={18} className="mt-0.5 shrink-0 text-brand" />
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shift.site.name}, ${place}, Mauritius`)}`} target="_blank" rel="noopener" className="underline decoration-line underline-offset-2">
                {place}
              </a>
            </p>
          )}
        </div>

        {(shift.site.instructions || shift.notes) && (
          <div className="space-y-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-950">
            {shift.site.instructions && <p><span className="font-semibold">On arrival: </span>{shift.site.instructions}</p>}
            {shift.notes && <p><span className="font-semibold">Today: </span>{shift.notes}</p>}
          </div>
        )}

        <CrewList crew={shift.crew} />

        {state === "open" && (
          <form action={clockIn}>
            <input type="hidden" name="shiftId" value={shift.id} />
            <ActionButton label="Clock in" pendingLabel="Clocking in…" className="min-h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow-[0_10px_24px_-12px_rgba(209,64,0,0.9)]" />
          </form>
        )}
        {state === "on" && (
          <form action={clockOut}>
            <input type="hidden" name="shiftId" value={shift.id} />
            <ActionButton label="Clock out" pendingLabel="Clocking out…" className="min-h-14 w-full rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-[0_10px_24px_-12px_rgba(5,150,105,0.9)]" />
          </form>
        )}
        {state === "done" && (
          <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
            In {clock(shift.clockInAt!)} · out {clock(shift.clockOutAt!)} · {hm(worked ?? 0)} worked. Thank you!
          </p>
        )}
        {state === "later" && <p className="text-center text-sm text-ink-soft">Clock-in opens {CLOCK_IN_EARLY_MINUTES} minutes before the start.</p>}
        {state === "missed" && <p className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-900">This shift has ended without a clock-in. Tell the office so your hours are counted.</p>}
      </div>
    </article>
  );
}
