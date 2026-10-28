import { Icon } from "@/components/icons";
import type { Mate } from "@/lib/staff-shifts";
import { t, type Lang } from "./i18n";

const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/** "Your crew": leader first with a star, a call button for each teammate. */
export function CrewList({ crew, lang }: { crew: Mate[]; lang: Lang }) {
  const leader = crew.find((c) => c.isLeader);
  const x = t(lang).crew;
  return (
    <section className="rounded-2xl bg-surface-alt p-3" aria-label={x.title(crew.length)}>
      <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft">
        <span>{x.title(crew.length)}</span>
        {leader && <span className="normal-case tracking-normal">{leader.isMe ? x.youLead : x.leader(leader.name.split(" ")[0])}</span>}
      </p>
      <ul className="space-y-1.5">
        {crew.map((m) => (
          <li key={m.name} className="flex items-center gap-3">
            <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${m.isLeader ? "ring-2 ring-yellow-400" : ""}`} style={{ background: m.color }} aria-hidden>
              {initials(m.name)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {m.name}
              {m.isMe && <span className="text-ink-soft">{x.you}</span>}
              {m.isLeader && <span className="ml-1 text-xs font-semibold text-amber-700">{x.leaderTag}</span>}
            </span>
            {!m.isMe && m.phone && (
              <a href={`tel:${m.phone}`} className="grid size-9 place-items-center rounded-full bg-white text-emerald-700 shadow-sm" aria-label={x.call(m.name)}>
                <Icon name="phone" width={16} height={16} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
