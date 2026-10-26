"use client";

import Link from "next/link";
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from "react";
import { DURATION_CHOICES, clashingJobs, hoursLabel, jobMinutes } from "@/lib/schedule";
import { moveJob, saveJob, type ScheduleResult } from "./actions";

export type BoardJob = {
  id: number;
  ref: string;
  date: string;
  timeSlot: string;
  durationMinutes: number | null;
  service: string;
  serviceName: string;
  customer: string;
  phone: string;
  town: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  staffIds: number[];
};

type Person = { id: number; name: string; color: string; active: boolean };

type Change =
  | { kind: "move"; id: number; date: string; from: number | null; to: number | null }
  | { kind: "save"; id: number; date: string; time: string; durationMinutes: number | null; staffIds: number[] };

function apply(jobs: BoardJob[], change: Change): BoardJob[] {
  return jobs.map((job) => {
    if (job.id !== change.id) return job;
    if (change.kind === "save") {
      return { ...job, date: change.date, timeSlot: change.time, durationMinutes: change.durationMinutes, staffIds: change.staffIds };
    }
    let staffIds = job.staffIds;
    if (change.from !== change.to) {
      staffIds = staffIds.filter((s) => s !== change.from);
      if (change.to !== null && !staffIds.includes(change.to)) staffIds = [...staffIds, change.to];
    }
    return { ...job, date: change.date, staffIds };
  });
}

const dayName = (iso: string, style: "short" | "long" = "short") =>
  new Intl.DateTimeFormat("en-GB", { weekday: style, day: "numeric", month: style === "long" ? "long" : "short", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00Z`),
  );

const STATUS_DOT: Record<BoardJob["status"], string> = {
  pending: "bg-amber-400",
  confirmed: "bg-sky-500",
  completed: "bg-emerald-500",
  cancelled: "bg-zinc-400",
};

export function Board({ days, today, jobs, staff }: { days: string[]; today: string; jobs: BoardJob[]; staff: Person[] }) {
  const [shown, change] = useOptimistic(jobs, apply);
  const [, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "error" | "warning"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [mobileDay, setMobileDay] = useState(days.includes(today) ? today : days[0]);

  const people = useMemo(
    () => staff.filter((p) => p.active || shown.some((j) => j.staffIds.includes(p.id))),
    [staff, shown],
  );
  const personById = useMemo(() => new Map(staff.map((p) => [p.id, p])), [staff]);

  // A job clashes when one of its people has another overlapping job that day.
  const clashes = useMemo(() => {
    const ids = new Set<number>();
    for (const p of staff) for (const id of clashingJobs(shown.filter((j) => j.staffIds.includes(p.id)))) ids.add(id);
    return ids;
  }, [staff, shown]);

  const run = (c: Change, send: () => Promise<ScheduleResult>) => {
    setNotice(null);
    startTransition(async () => {
      change(c);
      const result = await send();
      if (!result.ok) setNotice({ tone: "error", text: result.error });
      else if (result.warning) setNotice({ tone: "warning", text: result.warning });
    });
  };

  const move = (id: number, date: string, from: number | null, to: number | null) => {
    const job = shown.find((j) => j.id === id);
    if (!job || (job.date === date && from === to)) return;
    // Dropping onto someone already on this job only changes the day.
    const target = to !== null && from !== to && job.staffIds.includes(to) ? from : to;
    run({ kind: "move", id, date, from, to: target }, () => moveJob({ bookingId: id, date, from, to: target }));
  };

  const cellJobs = (personId: number | null, date: string) =>
    shown
      .filter((j) => j.date === date && (personId === null ? j.staffIds.length === 0 : j.staffIds.includes(personId)))
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

  const rows: (Person | null)[] = [null, ...people];
  const editing = shown.find((j) => j.id === editingId) ?? null;

  return (
    <div className="space-y-4">
      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium ${notice.tone === "error" ? "bg-danger/10 text-danger" : "bg-amber-50 text-amber-900"}`}
        >
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 underline">Dismiss</button>
        </p>
      )}

      {/* Desktop and tablet: people × days, drag a job to change its day and/or person. */}
      <div className="card hidden overflow-x-auto md:block">
        <div className="grid min-w-[960px]" style={{ gridTemplateColumns: "150px repeat(7, minmax(0, 1fr))" }}>
          <div className="sticky left-0 z-10 border-b border-line bg-white" />
          {days.map((d) => (
            <div
              key={d}
              className={`border-b border-l border-line px-2 py-2 text-center text-xs font-semibold ${d === today ? "bg-brand-soft text-brand-strong" : "text-ink-soft"}`}
            >
              {dayName(d)}
            </div>
          ))}

          {rows.map((person) => {
            const pid = person?.id ?? null;
            return (
              <div key={pid ?? "none"} className="contents">
                <div className="sticky left-0 z-10 flex items-start gap-2 border-b border-line bg-white px-3 py-2 text-sm">
                  {person ? (
                    <>
                      <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: person.color }} aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{person.name}</span>
                        {!person.active && <span className="text-xs text-ink-soft">Inactive</span>}
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-amber-800">Unassigned</span>
                  )}
                </div>
                {days.map((d) => {
                  const key = `${pid}:${d}`;
                  const list = cellJobs(pid, d);
                  const load = list.reduce((sum, j) => sum + jobMinutes(j), 0);
                  return (
                    <div
                      key={key}
                      data-cell={key}
                      onDragOver={(e) => {
                        if (person && !person.active) return; // can't drop onto inactive people
                        e.preventDefault();
                        if (dropTarget !== key) setDropTarget(key);
                      }}
                      onDragLeave={() => setDropTarget((t) => (t === key ? null : t))}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDropTarget(null);
                        const data = JSON.parse(e.dataTransfer.getData("application/json") || "null") as { id: number; from: number | null } | null;
                        if (data) move(data.id, d, data.from, pid);
                      }}
                      className={`min-h-20 space-y-1.5 border-b border-l border-line p-1.5 transition-colors ${dropTarget === key ? "bg-brand-soft" : pid === null ? "bg-amber-50/40" : d === today ? "bg-brand-soft/30" : ""}`}
                    >
                      {list.map((job) => (
                        <JobChip
                          key={job.id}
                          job={job}
                          clash={clashes.has(job.id)}
                          team={job.staffIds.map((id) => personById.get(id)).filter((p): p is Person => !!p)}
                          onOpen={() => setEditingId(job.id)}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("application/json", JSON.stringify({ id: job.id, from: pid }));
                            e.dataTransfer.effectAllowed = "move";
                          }}
                        />
                      ))}
                      {person && load > 0 && <p className="px-1 text-right text-[11px] text-ink-soft">{hoursLabel(load)}</p>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <p className="hidden text-xs text-ink-soft md:block">
        Drag a job to another day or person. Click a job to change its time, length or team. A red outline means someone is booked on two jobs at once.
      </p>

      {/* Phones: one day at a time; tap a job to plan it. */}
      <div className="space-y-3 md:hidden">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map((d) => {
            const n = shown.filter((j) => j.date === d).length;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setMobileDay(d)}
                aria-pressed={mobileDay === d}
                className={`shrink-0 rounded-xl px-3 py-2 text-center text-xs font-semibold ${mobileDay === d ? "bg-ink text-white" : "bg-white text-ink-soft"}`}
              >
                {dayName(d).split(" ")[0]}
                <span className="block text-base">{d.slice(8)}</span>
                <span className="block font-normal">{n} job{n === 1 ? "" : "s"}</span>
              </button>
            );
          })}
        </div>
        <h2 className="font-semibold">{dayName(mobileDay, "long")}</h2>
        {shown.filter((j) => j.date === mobileDay).length === 0 && <p className="card p-6 text-center text-sm text-ink-soft">No jobs this day.</p>}
        {shown
          .filter((j) => j.date === mobileDay)
          .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
          .map((job) => (
            <JobChip
              key={job.id}
              job={job}
              large
              clash={clashes.has(job.id)}
              team={job.staffIds.map((id) => personById.get(id)).filter((p): p is Person => !!p)}
              onOpen={() => setEditingId(job.id)}
            />
          ))}
      </div>

      {editing && (
        <JobEditor
          key={editing.id}
          job={editing}
          staff={staff}
          onClose={() => setEditingId(null)}
          onSave={(c) => {
            setEditingId(null);
            run({ kind: "save", id: editing.id, ...c }, () => saveJob({ bookingId: editing.id, ...c }));
          }}
        />
      )}
    </div>
  );
}

function JobChip({
  job,
  team,
  clash,
  large,
  onOpen,
  onDragStart,
}: {
  job: BoardJob;
  team: Person[];
  clash: boolean;
  large?: boolean;
  onOpen: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  return (
    <button
      type="button"
      data-job={job.ref}
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart}
      onClick={onOpen}
      className={`block w-full rounded-lg border bg-white text-left shadow-sm hover:shadow ${onDragStart ? "cursor-grab active:cursor-grabbing" : ""} ${clash ? "border-danger ring-1 ring-danger" : "border-line"} ${large ? "p-4" : "p-1.5 text-xs"}`}
      aria-label={`${job.timeSlot} ${job.serviceName} for ${job.customer}${clash ? ", overlaps another job" : ""}. Open to plan.`}
    >
      <span className="flex items-center gap-1.5 font-semibold">
        <span className={`size-2 shrink-0 rounded-full ${STATUS_DOT[job.status]}`} aria-hidden />
        {job.timeSlot}
        <span className="font-normal text-ink-soft">· {hoursLabel(jobMinutes(job))}</span>
        {clash && <span className="ml-auto text-danger">Overlap</span>}
      </span>
      <span className="block truncate">{job.customer}</span>
      <span className="block truncate text-ink-soft">{job.serviceName} · {job.town}</span>
      {large && (
        <span className="mt-2 flex flex-wrap gap-1">
          {team.length ? (
            team.map((p) => (
              <span key={p.id} className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: p.color }}>{p.name}</span>
            ))
          ) : (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Needs a cleaner</span>
          )}
        </span>
      )}
      {!large && team.length > 1 && <span className="mt-0.5 block text-[11px] text-ink-soft">Team of {team.length}</span>}
    </button>
  );
}

function JobEditor({
  job,
  staff,
  onClose,
  onSave,
}: {
  job: BoardJob;
  staff: Person[];
  onClose: () => void;
  onSave: (c: { date: string; time: string; durationMinutes: number | null; staffIds: number[] }) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [team, setTeam] = useState(job.staffIds);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const choosable = staff.filter((p) => p.active || job.staffIds.includes(p.id));
  const usual = jobMinutes({ service: job.service, durationMinutes: null });

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-xl backdrop:bg-ink/40"
      aria-labelledby="job-editor-title"
    >
      <form
        className="space-y-4 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const length = String(f.get("duration"));
          onSave({
            date: String(f.get("date")),
            time: String(f.get("time")),
            durationMinutes: length === "usual" ? null : Number(length),
            staffIds: team,
          });
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="job-editor-title" className="text-lg font-bold">{job.customer}</h2>
            <p className="text-sm text-ink-soft">{job.serviceName} · {job.town} · {job.ref}</p>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-full px-2 text-2xl leading-none text-ink-soft hover:text-ink" aria-label="Close">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <label className="col-span-2 sm:col-span-1">
            <span className="label">Date</span>
            <input name="date" type="date" required defaultValue={job.date} className="field" />
          </label>
          <label>
            <span className="label">Start</span>
            <input name="time" type="time" required step={900} defaultValue={job.timeSlot} className="field" />
          </label>
          <label>
            <span className="label">Length</span>
            <select name="duration" defaultValue={job.durationMinutes ?? "usual"} className="field">
              <option value="usual">Usual ({hoursLabel(usual)})</option>
              {DURATION_CHOICES.map((m) => <option key={m} value={m}>{hoursLabel(m)}</option>)}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="label">Team</legend>
          {choosable.length === 0 ? (
            <p className="text-sm text-ink-soft">No staff yet. <Link href="/admin/staff" className="text-brand-strong underline">Add cleaners</Link> first.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {choosable.map((p) => {
                const on = team.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${on ? "border-transparent text-white" : "border-line bg-white"}`}
                    style={on ? { background: p.color } : undefined}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() => setTeam((t) => (on ? t.filter((id) => id !== p.id) : [...t, p.id]))}
                    />
                    {!on && <span className="size-2.5 rounded-full" style={{ background: p.color }} aria-hidden />}
                    {p.name}
                    {!p.active && " (inactive)"}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span className="flex gap-3 text-sm">
            <Link href={`/admin/bookings/${job.id}`} className="font-medium text-brand-strong hover:underline">Booking details</Link>
            <a href={`tel:${job.phone}`} className="font-medium text-brand-strong hover:underline">Call</a>
          </span>
          <button type="submit" className="btn-primary">Save</button>
        </div>
      </form>
    </dialog>
  );
}
