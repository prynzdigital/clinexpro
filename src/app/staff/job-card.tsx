import { Icon } from "@/components/icons";
import { hoursLabel } from "@/lib/schedule";
import type { StaffJob } from "@/lib/staff-jobs";
import { ActionButton, Elapsed } from "./app-client";
import { checkIn, checkOut } from "./actions";
import { CrewList } from "./crew-list";

const clock = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mauritius" }).format(new Date(iso));

const mapsUrl = (job: StaffJob) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.address}, ${job.town}, Mauritius`)}`;

// Local numbers (7–8 digits) get the Mauritius code for WhatsApp links.
const whatsappUrl = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "").replace(/^(\d{7,8})$/, "230$1")}`;

const STATE = {
  todo: { bar: "bg-slate-300", pill: "bg-slate-100 text-slate-700", label: "Not started" },
  upcoming: { bar: "bg-sky-400", pill: "bg-sky-50 text-sky-800", label: "Upcoming" },
  onsite: { bar: "bg-brand", pill: "bg-brand-soft text-brand-strong", label: "On site" },
  done: { bar: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-800", label: "Done" },
};

/** One job, as the cleaner sees it: when, where, what, and the one thing to do next. */
export function JobCard({ job, isToday, highlight }: { job: StaffJob; isToday: boolean; highlight?: boolean }) {
  const state = job.checkedOutAt ? "done" : job.checkedInAt ? "onsite" : isToday ? "todo" : "upcoming";
  const s = STATE[state];

  return (
    <article className={`relative overflow-hidden rounded-3xl bg-white shadow-sm ${highlight ? "ring-2 ring-brand" : ""}`}>
      <span className={`absolute inset-y-0 left-0 w-1.5 ${s.bar}`} aria-hidden />
      <div className="space-y-4 p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tabular-nums leading-none">{job.start}</p>
            <p className="mt-1 text-sm text-ink-soft">until {job.end} · {hoursLabel(job.minutes)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${s.pill}`}>
            {state === "onsite" ? <>On site · <Elapsed since={job.checkedInAt!} /></> : state === "done" ? `Done ${clock(job.checkedOutAt!)}` : s.label}
          </span>
        </div>

        <div>
          <h2 className="text-lg font-bold">{job.service}</h2>
          <p className="text-ink-soft">{job.customer}</p>
          <p className="mt-2 flex items-start gap-2">
            <Icon name="pin" width={18} height={18} className="mt-0.5 shrink-0 text-brand" />
            <span>{job.address}, <strong>{job.town}</strong></span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <a href={mapsUrl(job)} target="_blank" rel="noopener" className="flex flex-col items-center gap-1 rounded-2xl bg-sky-50 py-3 text-xs font-semibold text-sky-800 active:scale-95">
            <Icon name="pin" width={22} height={22} /> Directions
          </a>
          <a href={`tel:${job.phone}`} className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-50 py-3 text-xs font-semibold text-emerald-800 active:scale-95">
            <Icon name="phone" width={22} height={22} /> Call
          </a>
          <a href={whatsappUrl(job.phone)} target="_blank" rel="noopener" className="flex flex-col items-center gap-1 rounded-2xl bg-green-50 py-3 text-xs font-semibold text-green-800 active:scale-95">
            <Icon name="chat" width={22} height={22} /> WhatsApp
          </a>
        </div>

        {(job.details.length > 0 || job.extras.length > 0) && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Job details">
            {job.details.map((d) => <li key={d} className="rounded-full bg-surface-alt px-3 py-1 text-xs font-medium">{d}</li>)}
            {job.extras.map((x) => <li key={x} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800">+ {x}</li>)}
          </ul>
        )}

        {job.notes && (
          <p className="flex gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-950">
            <Icon name="alert" width={18} height={18} className="mt-0.5 shrink-0 text-amber-600" />
            <span><span className="font-semibold">Customer notes: </span>{job.notes}</span>
          </p>
        )}

        {job.crew.length > 1 && <CrewList crew={job.crew} />}

        {state === "todo" && (
          <form action={checkIn}>
            <input type="hidden" name="bookingId" value={job.id} />
            <ActionButton
              label="I've arrived · Check in"
              pendingLabel="Checking in…"
              className="min-h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow-[0_10px_24px_-12px_rgba(209,64,0,0.9)] active:scale-[0.99]"
            />
          </form>
        )}

        {state === "onsite" && (
          <form action={checkOut} className="space-y-3">
            <input type="hidden" name="bookingId" value={job.id} />
            <details className="group rounded-2xl bg-surface-alt">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold">
                <span className="group-open:hidden">+ Add a note for the office (optional)</span>
                <span className="hidden group-open:inline">Note for the office</span>
              </summary>
              <textarea name="report" rows={3} maxLength={2000} placeholder="Broken item, extra work, customer request…" className="field mx-3 mb-3 w-[calc(100%-1.5rem)]" />
            </details>
            <ActionButton
              label="Job finished · Check out"
              pendingLabel="Checking out…"
              className="min-h-14 w-full rounded-2xl bg-emerald-600 text-lg font-bold text-white shadow-[0_10px_24px_-12px_rgba(5,150,105,0.9)] active:scale-[0.99]"
            />
          </form>
        )}

        {state === "done" && (
          <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900">
            <p className="font-semibold">In {clock(job.checkedInAt!)} · out {clock(job.checkedOutAt!)}. Thank you!</p>
            {job.report && <p className="mt-1">Your note: {job.report}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
