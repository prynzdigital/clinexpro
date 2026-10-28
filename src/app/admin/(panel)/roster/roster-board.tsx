"use client";

import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition, type DragEvent } from "react";
import { Icon } from "@/components/icons";
import { SHIFT_PRESETS, hm, overlaps, shiftMinutes, shiftWindow } from "@/lib/roster";
import { addToShift, copyPreviousWeek, correctClock, deleteShift, moveShift, removeFromShift, saveShift, type RosterResult } from "./actions";

export type RosterShift = {
  id: number;
  siteId: number;
  date: string;
  start: string;
  end: string;
  label: string;
  headcount: number;
  notes: string;
  crew: { staffId: number; isLeader: boolean; clockInAt: string | null; clockOutAt: string | null }[];
};
export type Busy = { staffId: number; shiftId: number | null; from: number; to: number; what: string };
type Person = { id: number; name: string; color: string; active: boolean };
type Site = { id: number; name: string; color: string };
type Crew = { id: number; name: string; leaderId: number | null; members: number[] };

// Spelled out by hand so server and browser render the same text (no Intl differences).
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MO[d.getUTCMonth()]}`;
};
const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const WEEK_LIMIT_MINUTES = 48 * 60;

type Editing = { shift: RosterShift | null; siteId: number; date: string };

// What is being dragged: a whole shift, or one person (from the team strip or off a shift).
type Drag = { kind: "shift"; shiftId: number } | { kind: "person"; staffId: number; fromShiftId: number | null };
type Change =
  | { type: "move"; shiftId: number; siteId: number; date: string; copy: boolean }
  | { type: "add"; shiftId: number; staffId: number; fromShiftId: number | null }
  | { type: "remove"; shiftId: number; staffId: number };

/** The board as it will look once the server has saved the change. */
function applyChange(shifts: RosterShift[], c: Change): RosterShift[] {
  const without = (s: RosterShift, staffId: number) => ({ ...s, crew: s.crew.filter((x) => x.staffId !== staffId) });
  switch (c.type) {
    case "move": {
      const s = shifts.find((x) => x.id === c.shiftId);
      if (!s) return shifts;
      const moved = { ...s, siteId: c.siteId, date: c.date };
      if (!c.copy) return shifts.map((x) => (x.id === c.shiftId ? moved : x));
      return [...shifts, { ...moved, id: -Date.now(), crew: s.crew.map((x) => ({ ...x, clockInAt: null, clockOutAt: null })) }];
    }
    case "add":
      return shifts.map((s) =>
        s.id === c.shiftId && !s.crew.some((x) => x.staffId === c.staffId)
          ? { ...s, crew: [...s.crew, { staffId: c.staffId, isLeader: false, clockInAt: null, clockOutAt: null }] }
          : s.id === c.fromShiftId
            ? without(s, c.staffId)
            : s,
      );
    case "remove":
      return shifts.map((s) => (s.id === c.shiftId ? without(s, c.staffId) : s));
  }
}

export function RosterBoard({
  monday,
  days,
  today,
  sites,
  shifts: savedShifts,
  staff,
  crews,
  busy,
  jobMinutesByPerson,
}: {
  monday: string;
  days: string[];
  today: string;
  sites: Site[];
  shifts: RosterShift[];
  staff: Person[];
  crews: Crew[];
  busy: Busy[];
  jobMinutesByPerson: Record<number, number>;
}) {
  const [editing, setEditing] = useState<Editing | null>(null);
  const [notice, setNotice] = useState<{ tone: "error" | "warning" | "ok"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const person = useMemo(() => new Map(staff.map((p) => [p.id, p])), [staff]);
  const [shifts, preview] = useOptimistic(savedShifts, applyChange);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const run = (change: Change, done: string) =>
    start(async () => {
      preview(change);
      const r =
        change.type === "move"
          ? await moveShift(change)
          : change.type === "add"
            ? await addToShift(change)
            : await removeFromShift(change);
      report(r, done);
    });

  const startDrag = (e: DragEvent, d: Drag) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", JSON.stringify(d)); // Firefox only starts a drag with data set
    setDrag(d);
  };
  const endDrag = () => {
    setDrag(null);
    setOver(null);
  };
  /** Drop-target props; `accepts` says whether the current drag can land here. */
  const target = (key: string, accepts: boolean, onDrop: (e: DragEvent) => void) => ({
    onDragOver: (e: DragEvent) => {
      if (!accepts) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = drag?.kind === "shift" && (e.ctrlKey || e.metaKey || e.altKey) ? "copy" : "move";
      if (over !== key) setOver(key);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null) && over === key) setOver(null);
    },
    onDrop: (e: DragEvent) => {
      if (!accepts) return;
      e.preventDefault();
      e.stopPropagation();
      onDrop(e);
      endDrag();
    },
  });

  const clashOf = (s: RosterShift, staffId: number) => {
    const w = shiftWindow(s.date, s.start, s.end);
    return busy.filter((b) => b.staffId === staffId && b.shiftId !== s.id && overlaps(w, b));
  };

  const report = (r: RosterResult, done = "Saved.") => {
    if (!r.ok) setNotice({ tone: "error", text: r.error });
    else if (r.warning) setNotice({ tone: "warning", text: `${done} ${r.warning}` });
    else setNotice({ tone: "ok", text: done });
  };

  // Planned hours this week per person (shifts + jobs), to spot overwork.
  const load = staff
    .map((p) => {
      const shiftMins = shifts.filter((s) => s.crew.some((c) => c.staffId === p.id)).reduce((sum, s) => sum + shiftMinutes(s.start, s.end), 0);
      return { ...p, shiftMins, jobMins: jobMinutesByPerson[p.id] ?? 0 };
    })
    .filter((p) => p.shiftMins + p.jobMins > 0)
    .sort((a, b) => b.shiftMins + b.jobMins - (a.shiftMins + a.jobMins));

  const unfilled = shifts.filter((s) => s.crew.length < s.headcount).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => report(await copyPreviousWeek(monday)))}
          className="btn-secondary min-h-10 gap-1.5 px-4 text-sm"
        >
          <Icon name="board" width={16} height={16} /> Copy last week
        </button>
        <span className="text-sm text-ink-soft">
          {shifts.length} shift{shifts.length === 1 ? "" : "s"} this week
          {unfilled > 0 && <span className="ml-1 font-semibold text-rose-700">· {unfilled} short of people</span>}
        </span>
      </div>

      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium ${notice.tone === "error" ? "bg-danger/10 text-danger" : notice.tone === "warning" ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}
        >
          {notice.text}
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 underline">Dismiss</button>
        </p>
      )}

      <section
        aria-label="Team"
        {...target("team", drag?.kind === "person" && drag.fromShiftId !== null, () => {
          if (drag?.kind === "person" && drag.fromShiftId) run({ type: "remove", shiftId: drag.fromShiftId, staffId: drag.staffId }, `${person.get(drag.staffId)?.name} taken off the shift.`);
        })}
        className={`card flex flex-wrap items-center gap-2 p-3 transition-colors ${over === "team" ? "bg-rose-50 ring-2 ring-rose-300" : ""}`}
      >
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {drag?.kind === "person" && drag.fromShiftId ? "Drop here to take off the shift" : "Team · drag onto a shift"}
        </span>
        {staff.filter((p) => p.active).map((p) => (
          <span
            key={p.id}
            draggable
            onDragStart={(e) => startDrag(e, { kind: "person", staffId: p.id, fromShiftId: null })}
            onDragEnd={endDrag}
            className="flex cursor-grab items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm shadow-sm active:cursor-grabbing"
          >
            <span className="grid size-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: p.color }} aria-hidden>
              {initials(p.name)}
            </span>
            {p.name}
          </span>
        ))}
      </section>

      <div className="card overflow-x-auto">
        <div className="grid min-w-[1040px]" style={{ gridTemplateColumns: "170px repeat(7, minmax(0, 1fr))" }}>
          <div className="sticky left-0 z-10 border-b border-line bg-white" />
          {days.map((d) => (
            <div key={d} className={`border-b border-l border-line px-2 py-2 text-center text-xs font-semibold ${d === today ? "bg-brand-soft text-brand-strong" : "text-ink-soft"}`}>
              {dayLabel(d)}
            </div>
          ))}
          {sites.map((site) => (
            <div key={site.id} className="contents">
              <div className="sticky left-0 z-10 flex items-start gap-2 border-b border-line bg-white px-3 py-3 text-sm">
                <span className="mt-1 size-3 shrink-0 rounded" style={{ background: site.color }} aria-hidden />
                <span className="font-semibold">{site.name}</span>
              </div>
              {days.map((d) => {
                const list = shifts.filter((s) => s.siteId === site.id && s.date === d).sort((a, b) => a.start.localeCompare(b.start));
                const cell = `${site.id}:${d}`;
                return (
                  <div
                    key={d}
                    data-cell={cell}
                    {...target(cell, drag?.kind === "shift", (e) => {
                      if (drag?.kind !== "shift") return;
                      const copy = e.ctrlKey || e.metaKey || e.altKey;
                      run({ type: "move", shiftId: drag.shiftId, siteId: site.id, date: d, copy }, `Shift ${copy ? "copied" : "moved"} to ${site.name}, ${dayLabel(d)}.`);
                    })}
                    className={`group relative min-h-24 space-y-1.5 border-b border-l border-line p-1.5 transition-colors ${over === cell ? "bg-sky-50 outline-2 -outline-offset-2 outline-sky-400 outline-dashed" : d === today ? "bg-brand-soft/30" : ""}`}
                  >
                    {list.map((s) => {
                      const short = s.crew.length < s.headcount;
                      const clash = s.crew.some((c) => clashOf(s, c.staffId).length > 0);
                      const leader = s.crew.find((c) => c.isLeader);
                      const saved = s.id > 0;
                      const open = () => saved && setEditing({ shift: s, siteId: s.siteId, date: s.date });
                      const takesPerson = saved && drag?.kind === "person" && drag.fromShiftId !== s.id && !s.crew.some((c) => c.staffId === drag.staffId);
                      return (
                        <div
                          key={s.id}
                          role="button"
                          tabIndex={0}
                          data-shift={s.id}
                          draggable={saved}
                          onDragStart={(e) => startDrag(e, { kind: "shift", shiftId: s.id })}
                          onDragEnd={endDrag}
                          {...target(`s${s.id}`, takesPerson, () => {
                            if (drag?.kind !== "person") return;
                            const who = person.get(drag.staffId)?.name;
                            run({ type: "add", shiftId: s.id, staffId: drag.staffId, fromShiftId: drag.fromShiftId }, `${who} ${drag.fromShiftId ? "moved" : "added"} to ${s.label || "the shift"}, ${dayLabel(s.date)}.`);
                          })}
                          onClick={open}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              open();
                            }
                          }}
                          aria-label={`${s.label || "Shift"} ${s.start} to ${s.end}, ${s.crew.length} of ${s.headcount} people. Drag to move, Ctrl-drag to copy.`}
                          className={`block w-full cursor-grab rounded-lg border bg-white p-1.5 text-left text-xs shadow-sm transition hover:shadow active:cursor-grabbing ${clash ? "border-danger ring-1 ring-danger" : "border-line"} ${over === `s${s.id}` ? "ring-2 ring-sky-400" : ""} ${drag?.kind === "shift" && drag.shiftId === s.id ? "opacity-40" : ""} ${saved ? "" : "animate-pulse"}`}
                          style={{ borderLeft: `4px solid ${site.color}` }}
                        >
                          <span className="flex items-center justify-between gap-1 font-semibold">
                            <span>{s.label || "Shift"}</span>
                            <span className={`rounded px-1 text-[10px] ${short ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
                              {s.crew.length}/{s.headcount}
                            </span>
                          </span>
                          <span className="block text-ink-soft">{s.start}–{s.end}</span>
                          {s.crew.length > 0 && (
                            <span className="mt-1 flex flex-wrap gap-0.5">
                              {s.crew.map((c) => {
                                const p = person.get(c.staffId);
                                return (
                                  <span
                                    key={c.staffId}
                                    draggable={saved}
                                    onDragStart={(e) => startDrag(e, { kind: "person", staffId: c.staffId, fromShiftId: s.id })}
                                    onDragEnd={endDrag}
                                    title={`${p?.name}${c.isLeader ? " (leader)" : ""}. Drag to another shift, or back to the team to remove.`}
                                    className={`grid size-5 place-items-center rounded-full text-[9px] font-bold text-white ${c.isLeader ? "ring-2 ring-yellow-400" : ""}`}
                                    style={{ background: p?.color ?? "#64748b" }}
                                  >
                                    {initials(p?.name ?? "?")}
                                  </span>
                                );
                              })}
                            </span>
                          )}
                          {leader && <span className="mt-0.5 block truncate text-[10px] text-ink-soft">★ {person.get(leader.staffId)?.name}</span>}
                          {clash && <span className="block text-[10px] font-semibold text-danger">Overlap</span>}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setEditing({ shift: null, siteId: site.id, date: d })}
                      className="w-full rounded-lg border border-dashed border-line py-1 text-xs font-medium text-ink-soft opacity-60 hover:border-brand hover:text-brand-strong hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
                      aria-label={`Add shift at ${site.name} on ${dayLabel(d)}`}
                    >
                      + Shift
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-ink-soft">Click a shift to change its times or crew. Drag a shift to another day or site to move it; hold Ctrl to copy it. Drag people from the team onto a shift, between shifts, or back to the team to remove them. ★ marks the leader; a red outline means someone is booked twice.</p>

      {load.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">Planned hours this week</h2>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {load.map((p) => {
              const total = p.shiftMins + p.jobMins;
              const over = total > WEEK_LIMIT_MINUTES;
              return (
                <li key={p.id} className="flex items-center gap-3 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className={`tabular-nums ${over ? "font-semibold text-rose-700" : ""}`}>
                    {hm(total)}
                    <span className="ml-1 text-xs font-normal text-ink-soft">({hm(p.shiftMins)} shifts{p.jobMins ? ` + ${hm(p.jobMins)} jobs` : ""})</span>
                    {over && " ⚠"}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-ink-soft">⚠ over 48 hours planned this week.</p>
        </section>
      )}

      {editing && (
        <ShiftEditor
          key={editing.shift?.id ?? `${editing.siteId}:${editing.date}`}
          editing={editing}
          days={days}
          site={sites.find((s) => s.id === editing.siteId)!}
          staff={staff}
          crews={crews}
          clashOf={clashOf}
          onClose={() => setEditing(null)}
          onResult={(r) => {
            report(r);
            if (r.ok) setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ShiftEditor({
  editing,
  days,
  site,
  staff,
  crews,
  clashOf,
  onClose,
  onResult,
}: {
  editing: Editing;
  days: string[];
  site: Site;
  staff: Person[];
  crews: Crew[];
  clashOf: (s: RosterShift, staffId: number) => Busy[];
  onClose: () => void;
  onResult: (r: RosterResult) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const s = editing.shift;
  const [times, setTimes] = useState({ label: s?.label ?? "Morning", start: s?.start ?? "07:00", end: s?.end ?? "15:00" });
  const [headcount, setHeadcount] = useState(s?.headcount ?? 4);
  const [notes, setNotes] = useState(s?.notes ?? "");
  const [crew, setCrew] = useState<{ staffId: number; isLeader: boolean }[]>(s?.crew.map((c) => ({ staffId: c.staffId, isLeader: c.isLeader })) ?? []);
  const [repeatOn, setRepeatOn] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const draft: RosterShift = { id: s?.id ?? -1, siteId: site.id, date: editing.date, start: times.start, end: times.end, label: times.label, headcount, notes, crew: [] };
  const choosable = staff.filter((p) => p.active || crew.some((c) => c.staffId === p.id));
  const toggle = (id: number) => setCrew((c) => (c.some((x) => x.staffId === id) ? c.filter((x) => x.staffId !== id) : [...c, { staffId: id, isLeader: false }]));
  const makeLeader = (id: number) => setCrew((c) => c.map((x) => ({ ...x, isLeader: x.staffId === id ? !x.isLeader : false })));
  const clocked = s?.crew.filter((c) => c.clockInAt) ?? [];

  return (
    <dialog ref={dialog} onClose={onClose} className="m-auto w-[min(44rem,calc(100vw-2rem))] rounded-2xl p-0 shadow-xl backdrop:bg-ink/40" aria-labelledby="shift-title">
      <div className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="shift-title" className="text-lg font-bold">{s ? "Edit shift" : "New shift"}</h2>
            <p className="text-sm text-ink-soft">{site.name} · {dayLabel(editing.date)}</p>
          </div>
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-full px-2 text-2xl leading-none text-ink-soft hover:text-ink" aria-label="Close">×</button>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Shift presets">
          {SHIFT_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={times.start === p.start && times.end === p.end}
              onClick={() => setTimes({ label: p.label, start: p.start, end: p.end })}
              className={`rounded-full border px-3 py-1.5 text-sm ${times.start === p.start && times.end === p.end ? "border-navy bg-navy text-white" : "border-line hover:border-ink"}`}
            >
              {p.label} {p.start}–{p.end}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="col-span-2 sm:col-span-1">
            <span className="label">Name</span>
            <input value={times.label} onChange={(e) => setTimes({ ...times, label: e.target.value })} className="field" maxLength={40} />
          </label>
          <label>
            <span className="label">Start</span>
            <input type="time" value={times.start} onChange={(e) => setTimes({ ...times, start: e.target.value })} className="field" />
          </label>
          <label>
            <span className="label">End</span>
            <input type="time" value={times.end} onChange={(e) => setTimes({ ...times, end: e.target.value })} className="field" />
          </label>
          <label>
            <span className="label">People needed</span>
            <input type="number" min={1} max={200} value={headcount} onChange={(e) => setHeadcount(Number(e.target.value) || 1)} className="field" />
          </label>
        </div>
        <p className="-mt-3 text-xs text-ink-soft">{hm(shiftMinutes(times.start, times.end))}{times.end <= times.start ? " · ends the next morning" : ""}</p>

        <fieldset className="space-y-2">
          <legend className="flex w-full flex-wrap items-center justify-between gap-2">
            <span className="label">Crew <span className={`font-normal ${crew.length < headcount ? "text-rose-700" : "text-ink-soft"}`}>{crew.length}/{headcount} · ★ = leader</span></span>
            {crews.length > 0 && (
              <select
                aria-label="Fill from a saved crew"
                value=""
                onChange={(e) => {
                  const c = crews.find((x) => x.id === Number(e.target.value));
                  if (c) setCrew(c.members.map((id) => ({ staffId: id, isLeader: id === c.leaderId })));
                }}
                className="field w-auto py-1.5 text-sm"
              >
                <option value="">Fill from saved crew…</option>
                {crews.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.members.length})</option>)}
              </select>
            )}
          </legend>
          <div className="flex flex-wrap gap-2">
            {choosable.map((p) => {
              const member = crew.find((c) => c.staffId === p.id);
              const clash = clashOf(draft, p.id);
              return (
                <span
                  key={p.id}
                  className={`flex items-center overflow-hidden rounded-full border text-sm ${member ? "border-transparent text-white" : clash.length ? "border-rose-200 bg-rose-50" : "border-line bg-white"}`}
                  style={member ? { background: p.color } : undefined}
                  title={clash.length ? `Busy: ${clash.map((c) => c.what).join(", ")}` : undefined}
                >
                  <label className="flex cursor-pointer items-center gap-1.5 py-1.5 pl-3 pr-2">
                    <input type="checkbox" checked={Boolean(member)} onChange={() => toggle(p.id)} className="sr-only" />
                    {p.name}
                    {clash.length > 0 && <span className={member ? "text-yellow-200" : "text-rose-700"} aria-label="busy at that time">⚠</span>}
                  </label>
                  {member && (
                    <button type="button" onClick={() => makeLeader(p.id)} aria-pressed={member.isLeader} aria-label={`${member.isLeader ? "Remove" : "Make"} ${p.name} leader`} className={`px-2 py-1.5 ${member.isLeader ? "text-yellow-300" : "text-white/60 hover:text-white"}`}>
                      ★
                    </button>
                  )}
                </span>
              );
            })}
          </div>
          {crew.some((c) => clashOf(draft, c.staffId).length) && (
            <p className="text-xs text-rose-700">
              ⚠ {crew.filter((c) => clashOf(draft, c.staffId).length).map((c) => `${staff.find((p) => p.id === c.staffId)?.name}: ${clashOf(draft, c.staffId).map((b) => b.what).join(", ")}`).join("; ")}
            </p>
          )}
        </fieldset>

        <label className="block">
          <span className="label">Notes for the crew</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="field" placeholder="e.g. VIP arrivals on floors 4–6; deep clean of lobby" />
        </label>

        {!s && (
          <fieldset>
            <legend className="label">Also add this shift on</legend>
            <div className="flex flex-wrap gap-2">
              {days.filter((d) => d !== editing.date).map((d) => (
                <label key={d} className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm has-checked:border-navy has-checked:bg-navy has-checked:text-white">
                  <input type="checkbox" className="sr-only" checked={repeatOn.includes(d)} onChange={() => setRepeatOn((r) => (r.includes(d) ? r.filter((x) => x !== d) : [...r, d]))} />
                  {dayLabel(d)}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {s && s.crew.length > 0 && <ClockTimes shift={s} staff={staff} onResult={onResult} />}

        {error && <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          {s ? (
            <button
              type="button"
              disabled={pending || clocked.length > 0}
              title={clocked.length ? "Someone has clocked in; kept for the timesheets" : undefined}
              onClick={() => {
                if (confirm("Delete this shift?")) start(async () => onResult(await deleteShift(s.id)));
              }}
              className="text-sm font-medium text-ink-soft hover:text-danger disabled:opacity-40"
            >
              Delete shift
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                setError("");
                const r = await saveShift({ id: s?.id, siteId: site.id, date: editing.date, ...times, headcount, notes, crew, repeatOn });
                if (!r.ok) setError(r.error);
                else onResult(r);
              })
            }
            className="btn-primary"
          >
            {pending ? "Saving…" : s ? "Save shift" : repeatOn.length ? `Create ${repeatOn.length + 1} shifts` : "Create shift"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

/** Clock times per person, for fixing a forgotten clock-in or clock-out. */
function ClockTimes({ shift, staff, onResult }: { shift: RosterShift; staff: Person[]; onResult: (r: RosterResult) => void }) {
  const [pending, start] = useTransition();
  const local = (iso: string | null) =>
    iso ? new Date(new Date(iso).getTime() + 4 * 3600_000).toISOString().slice(0, 16) : "";
  return (
    <details className="rounded-xl border border-line">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Clock times (fix a forgotten clock-in or out)</summary>
      <ul className="divide-y divide-line border-t border-line">
        {shift.crew.map((c) => {
          const p = staff.find((x) => x.id === c.staffId);
          return (
            <li key={c.staffId}>
              <form
                className="flex flex-wrap items-end gap-2 px-4 py-3 text-sm"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  start(async () => onResult(await correctClock({ shiftId: shift.id, staffId: c.staffId, clockIn: String(f.get("in")), clockOut: String(f.get("out")) })));
                }}
              >
                <span className="w-32 truncate font-medium">{p?.name}</span>
                <label>
                  <span className="label">In</span>
                  <input name="in" type="datetime-local" defaultValue={local(c.clockInAt)} className="field py-1.5" />
                </label>
                <label>
                  <span className="label">Out</span>
                  <input name="out" type="datetime-local" defaultValue={local(c.clockOutAt)} className="field py-1.5" />
                </label>
                <button type="submit" disabled={pending} className="btn-secondary min-h-10 px-3 text-sm">Save</button>
              </form>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
