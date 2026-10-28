import { Icon } from "@/components/icons";
import type { Mate } from "@/lib/staff-shifts";

const initials = (name: string) => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/** "Your crew": leader first with a star, a call button for each teammate. */
export function CrewList({ crew }: { crew: Mate[] }) {
  const leader = crew.find((c) => c.isLeader);
  return (
    <section className="rounded-2xl bg-surface-alt p-3" aria-label="Your crew">
      <p className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-soft">
        <span>Your crew · {crew.length}</span>
        {leader && <span className="normal-case tracking-normal">{leader.isMe ? "You lead this one ★" : `Leader: ${leader.name.split(" ")[0]}`}</span>}
      </p>
      <ul className="space-y-1.5">
        {crew.map((m) => (
          <li key={m.name} className="flex items-center gap-3">
            <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${m.isLeader ? "ring-2 ring-yellow-400" : ""}`} style={{ background: m.color }} aria-hidden>
              {initials(m.name)}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {m.name}
              {m.isMe && <span className="text-ink-soft"> (you)</span>}
              {m.isLeader && <span className="ml-1 text-xs font-semibold text-amber-700">★ Leader</span>}
            </span>
            {!m.isMe && m.phone && (
              <a href={`tel:${m.phone}`} className="grid size-9 place-items-center rounded-full bg-white text-emerald-700 shadow-sm" aria-label={`Call ${m.name}`}>
                <Icon name="phone" width={16} height={16} />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
