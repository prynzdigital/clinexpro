import Link from "next/link";
import { requireStaff } from "@/lib/staff-auth";
import { mauritiusDate, nowMs } from "@/lib/dates";
import { addDays, hoursLabel } from "@/lib/schedule";
import { CLOCK_IN_EARLY_MINUTES, hm, shiftWindow } from "@/lib/roster";
import { myJobs } from "@/lib/staff-jobs";
import { myShifts } from "@/lib/staff-shifts";
import { myMonth } from "@/lib/staff-hours";
import { BUSINESS } from "@/content/business";
import { Icon, type IconName } from "@/components/icons";
import { ActionButton, Elapsed, InstallCard } from "./app-client";
import { clockIn, clockOut, checkIn } from "./actions";
import { StaffShell } from "./shell";
import { greeting, longDate, t, type Lang, type StaffText } from "./i18n";
import { staffTitle } from "./titles";

export const generateMetadata = staffTitle("home");

const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const until = (ms: number, x: StaffText) => {
  const mins = Math.round(ms / 60_000);
  if (mins <= 0) return x.now.nowWord;
  return mins >= 60 ? x.now.inHours(Math.floor(mins / 60), mins % 60) : x.now.inMin(mins);
};

/** One thing on the plan today: a shift or a job, in a common shape for the dashboard. */
type Item = {
  key: string;
  anchor: string;
  kind: "shift" | "job";
  id: number;
  date: string;
  title: string;
  place: string;
  mapsQuery: string;
  start: string;
  end: string;
  from: number;
  to: number;
  inAt: string | null;
  outAt: string | null;
  color: string;
  crew: { name: string; color: string; isLeader: boolean; isMe: boolean }[];
};

export default async function StaffHome() {
  const me = await requireStaff();
  const x = t(me.lang);
  const today = mauritiusDate();
  const now = nowMs();
  const [jobs, shifts, month] = await Promise.all([
    myJobs(me.id, today, addDays(today, 6), me.lang),
    myShifts(me.id, addDays(today, -1), addDays(today, 6)),
    myMonth(me.id, today.slice(0, 7), today, me.lang),
  ]);

  const items: Item[] = [
    ...shifts.map((s) => ({
      key: `s${s.id}`,
      anchor: `shift-${s.id}`,
      kind: "shift" as const,
      id: s.id,
      date: s.date,
      title: x.now.shiftAt(s.label ?? x.shift.shift, s.site.name),
      place: [s.site.address, s.site.town].filter(Boolean).join(", ") || s.site.name,
      mapsQuery: [s.site.name, s.site.address, s.site.town, "Mauritius"].filter(Boolean).join(", "),
      start: s.start,
      end: s.end,
      ...shiftWindow(s.date, s.start, s.end),
      inAt: s.clockInAt,
      outAt: s.clockOutAt,
      color: s.site.color,
      crew: s.crew,
    })),
    ...jobs.map((j) => {
      const from = Date.parse(`${j.date}T${j.start}:00+04:00`);
      return {
        key: `j${j.id}`,
        anchor: `job-${j.id}`,
        kind: "job" as const,
        id: j.id,
        date: j.date,
        title: `${j.service} · ${j.customer}`,
        place: `${j.address}, ${j.town}`,
        mapsQuery: `${j.address}, ${j.town}, Mauritius`,
        start: j.start,
        end: j.end,
        from,
        to: from + j.minutes * 60_000,
        inAt: j.checkedInAt,
        outAt: j.checkedOutAt,
        color: "#d14000",
        crew: j.crew,
      };
    }),
  ].sort((a, b) => a.from - b.from);

  // Today's plan includes a night shift from yesterday that is still running.
  const todays = items.filter((i) => i.date === today || (i.date === addDays(today, -1) && !i.outAt && i.to > now));
  const current = todays.find((i) => i.inAt && !i.outAt);
  const next = todays.find((i) => !i.inAt && i.to > now);
  const later = items.find((i) => i.date > today);
  const focus = current ?? next;
  const doneToday = todays.filter((i) => i.outAt).length;
  const weekMinutes = items.filter((i) => i.date >= today).reduce((s, i) => s + Math.round((i.to - i.from) / 60_000), 0);
  const crewToday = [...new Map(todays.flatMap((i) => i.crew).filter((c) => !c.isMe).map((c) => [c.name, c])).values()];
  const firstName = me.name.split(" ")[0];
  const problemText = encodeURIComponent(x.quick.reportText(me.name, focus ? ` (${focus.title}, ${focus.start})` : ""));

  return (
    <StaffShell me={me} tab="home" title={`${greeting(me.lang)}, ${firstName}`} subtitle={longDate(today, me.lang)}>
      {/* The one thing to do now. */}
      <NowCard item={focus} current={Boolean(current)} now={now} later={later} allDone={todays.length > 0 && doneToday === todays.length} lang={me.lang} />

      <section aria-label="Shortcuts" className="grid grid-cols-2 gap-3">
        <Tile href="/staff/today" icon="clock" tone="bg-sky-500" title={x.tiles.today} value={todays.length ? x.tiles.items(todays.length) : x.tiles.free} note={todays.length ? x.tiles.done(doneToday) : x.tiles.nothingPlanned} />
        <Tile href="/staff/week" icon="calendar" tone="bg-violet-500" title={x.tiles.week} value={hoursLabel(weekMinutes) || "0h"} note={x.tiles.planned(items.filter((i) => i.date >= today).length)} />
        <Tile href="/staff/hours" icon="trend" tone="bg-emerald-500" title={x.tiles.hours} value={hm(month.workedMinutes)} note={x.tiles.workedIn(x.months[Number(today.slice(5, 7)) - 1])} />
        <Link href={focus ? `/staff/today#${focus.anchor}` : "/staff/today"} className="flex min-h-32 flex-col justify-between rounded-3xl bg-white p-4 shadow-sm active:scale-[0.98]">
          <span className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-2xl bg-amber-500 text-white"><Icon name="users" width={20} height={20} /></span>
            <Icon name="arrow" width={16} height={16} className="text-ink-soft" />
          </span>
          <span>
            <span className="block text-sm font-semibold">{x.tiles.crew}</span>
            {crewToday.length ? (
              <span className="mt-1 flex -space-x-2">
                {crewToday.slice(0, 5).map((c) => (
                  <span key={c.name} title={c.name} className={`grid size-8 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-white ${c.isLeader ? "outline-2 outline-yellow-400" : ""}`} style={{ background: c.color }}>
                    {initials(c.name)}
                  </span>
                ))}
                {crewToday.length > 5 && <span className="grid size-8 place-items-center rounded-full bg-surface-alt text-[10px] font-bold ring-2 ring-white">+{crewToday.length - 5}</span>}
              </span>
            ) : (
              <span className="block text-xs text-ink-soft">{todays.length ? x.tiles.solo : x.tiles.noWork}</span>
            )}
          </span>
        </Link>
      </section>

      <section aria-label="Quick actions" className="grid grid-cols-3 gap-3">
        <QuickAction
          href={focus ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(focus.mapsQuery)}` : undefined}
          icon="pin"
          label={x.quick.directions}
          tone="bg-sky-50 text-sky-800"
          external
        />
        <QuickAction href={BUSINESS.phoneHref} icon="phone" label={x.quick.call} tone="bg-emerald-50 text-emerald-800" />
        <QuickAction href={`${BUSINESS.whatsappHref}?text=${problemText}`} icon="alert" label={x.quick.report} tone="bg-rose-50 text-rose-800" external />
      </section>

      {todays.length > 0 && (
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm" aria-label={x.plan.title}>
          <h2 className="flex items-center justify-between px-5 pt-4 pb-2">
            <span className="font-bold">{x.plan.title}</span>
            <Link href="/staff/today" className="text-sm font-semibold text-brand-strong">{x.plan.open}</Link>
          </h2>
          <ol className="relative px-5 pb-4">
            {todays.map((i, n) => {
              const state = i.outAt ? "done" : i.inAt ? "on" : i.to < now ? "missed" : "todo";
              return (
                <li key={i.key} className="relative flex gap-4 pb-4 last:pb-0">
                  {n < todays.length - 1 && <span className="absolute top-6 bottom-0 left-[11px] w-0.5 bg-line" aria-hidden />}
                  <span
                    className={`relative z-10 mt-1 grid size-6 shrink-0 place-items-center rounded-full text-white ${state === "done" ? "bg-emerald-500" : state === "on" ? "bg-brand" : state === "missed" ? "bg-rose-400" : "bg-slate-300"}`}
                    aria-hidden
                  >
                    {state === "done" ? <Icon name="check" width={14} height={14} /> : <span className="size-2 rounded-full bg-white" />}
                  </span>
                  <Link href={`/staff/today#${i.anchor}`} className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold">{i.title}</span>
                      <span className="shrink-0 text-sm tabular-nums text-ink-soft">{i.start}–{i.end}</span>
                    </span>
                    <span className="block truncate text-sm text-ink-soft">
                      {state === "done" ? x.plan.done : state === "on" ? x.plan.onSite : state === "missed" ? x.plan.missed : i.kind === "shift" ? x.plan.shift : x.plan.job} · {i.place}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {(month.missing > 0 || month.late > 0) && (
        <Link href="/staff/hours" className="flex items-center gap-3 rounded-3xl bg-amber-50 p-4 text-sm text-amber-950 shadow-sm">
          <Icon name="alert" width={20} height={20} className="shrink-0 text-amber-600" />
          <span className="flex-1">
            {month.missing > 0 && x.heads.missing(month.missing)}
            {month.late > 0 && x.heads.late(month.late)}
            {x.heads.check}
          </span>
          <Icon name="arrow" width={16} height={16} />
        </Link>
      )}

      <InstallCard dismissible text={x.install} />
    </StaffShell>
  );
}

function NowCard({ item, current, now, later, allDone, lang }: { item: Item | undefined; current: boolean; now: number; later: Item | undefined; allDone: boolean; lang: Lang }) {
  const x = t(lang);
  if (!item) {
    return (
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/80">{allDone ? x.now.allDone : x.now.nothing}</p>
        <p className="mt-1 text-2xl font-bold">{allDone ? x.now.thanks : x.now.dayOff}</p>
        {later && (
          <Link href={`/staff/today?day=${later.date}#${later.anchor}`} className="mt-4 flex items-center justify-between rounded-2xl bg-white/15 p-3 text-sm">
            <span>
              <span className="block text-white/80">{x.now.nextUp}</span>
              <span className="font-semibold">{longDate(later.date, lang)} · {later.start} · {later.title}</span>
            </span>
            <Icon name="arrow" width={18} height={18} />
          </Link>
        )}
      </section>
    );
  }

  // The big button appears from an hour before the start, so it isn't tapped by mistake.
  const open = now >= item.from - CLOCK_IN_EARLY_MINUTES * 60_000;
  const canClockIn = item.kind === "shift" && open;
  const tone = current ? "from-brand to-brand-strong" : "from-[#0b2a41] to-navy";
  return (
    <section className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tone} p-5 text-white shadow-lg`}>
      <span className="absolute inset-y-0 left-0 w-2" style={{ background: item.color }} aria-hidden />
      <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
        {current ? <>{x.now.onSite} · <Elapsed since={item.inAt!} /></> : item.from > now ? x.now.nextIn(until(item.from - now, x)) : x.now.nextStarted}
      </p>
      <p className="mt-1 text-2xl font-bold leading-tight">{item.title}</p>
      <p className="mt-2 flex items-center gap-2 text-sm text-white/90">
        <Icon name="clock" width={16} height={16} className="shrink-0" /> <span className="tabular-nums">{item.start} – {item.end}</span>
      </p>
      <p className="mt-1 flex items-start gap-2 text-sm text-white/90">
        <Icon name="pin" width={16} height={16} className="mt-0.5 shrink-0" /> <span>{item.place}</span>
      </p>

      <div className="mt-5 grid gap-2">
        {item.kind === "shift" && current && (
          <form action={clockOut}>
            <input type="hidden" name="shiftId" value={item.id} />
            <ActionButton label={x.shift.clockOut} pendingLabel={x.shift.clockingOut} className="min-h-14 w-full rounded-2xl bg-white text-lg font-bold text-brand-strong shadow" />
          </form>
        )}
        {item.kind === "shift" && !current && canClockIn && (
          <form action={clockIn}>
            <input type="hidden" name="shiftId" value={item.id} />
            <ActionButton label={x.shift.clockIn} pendingLabel={x.shift.clockingIn} className="min-h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow-[0_10px_24px_-12px_rgba(252,81,29,0.9)]" />
          </form>
        )}
        {item.kind === "job" && !current && open && (
          <form action={checkIn}>
            <input type="hidden" name="bookingId" value={item.id} />
            <ActionButton label={x.job.checkIn} pendingLabel={x.job.checkingIn} className="min-h-14 w-full rounded-2xl bg-brand text-lg font-bold text-white shadow-[0_10px_24px_-12px_rgba(252,81,29,0.9)]" />
          </form>
        )}
        {item.kind === "job" && current && (
          <Link href={`/staff/today#${item.anchor}`} className="grid min-h-14 place-items-center rounded-2xl bg-white text-lg font-bold text-brand-strong shadow">
            {x.job.finish}
          </Link>
        )}
        {!current && !open && (
          <p className="rounded-2xl bg-white/10 p-3 text-center text-sm">
            {x.now.opens(item.kind, CLOCK_IN_EARLY_MINUTES)}
          </p>
        )}
        <Link href={`/staff/today#${item.anchor}`} className="grid min-h-12 place-items-center rounded-2xl bg-white/10 text-sm font-semibold ring-1 ring-white/20">
          {x.now.details}
        </Link>
      </div>
    </section>
  );
}

function Tile({ href, icon, tone, title, value, note }: { href: string; icon: IconName; tone: string; title: string; value: string; note: string }) {
  return (
    <Link href={href} className="flex min-h-32 flex-col justify-between rounded-3xl bg-white p-4 shadow-sm active:scale-[0.98]">
      <span className="flex items-center justify-between">
        <span className={`grid size-10 place-items-center rounded-2xl text-white ${tone}`}><Icon name={icon} width={20} height={20} /></span>
        <Icon name="arrow" width={16} height={16} className="text-ink-soft" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-2xl font-bold tabular-nums leading-tight">{value}</span>
        <span className="block text-xs text-ink-soft">{note}</span>
      </span>
    </Link>
  );
}

function QuickAction({ href, icon, label, tone, external }: { href?: string; icon: IconName; label: string; tone: string; external?: boolean }) {
  const body = (
    <>
      <Icon name={icon} width={24} height={24} />
      <span className="text-xs font-semibold">{label}</span>
    </>
  );
  const cls = `flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-3xl shadow-sm active:scale-[0.97] ${tone}`;
  if (!href) return <span className={`${cls} opacity-40`} aria-disabled>{body}</span>;
  return external ? (
    <a href={href} target="_blank" rel="noopener" className={cls}>{body}</a>
  ) : (
    <a href={href} className={cls}>{body}</a>
  );
}
