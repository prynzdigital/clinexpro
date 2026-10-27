import { asc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireOwner } from "@/lib/auth";
import { PageHeader, label, shortDate } from "../ui";
import { AddMemberForm, MemberControls } from "./team-forms";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const session = await requireOwner();
  const db = await getDb();
  const members = await db.select().from(schema.adminUsers).orderBy(asc(schema.adminUsers.createdAt));

  return (
    <>
      <PageHeader title="Team" subtitle="Who can sign in to this dashboard, and what they can do" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-3">
          {members.map((m) => {
            const isYou = m.id === session.uid;
            return (
              <article key={m.id} className={`card space-y-3 p-5 ${m.active ? "" : "opacity-70"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-semibold">
                      {m.name} {isYou && <span className="text-sm font-normal text-ink-soft">(you)</span>}
                    </h2>
                    <p className="truncate text-sm text-ink-soft">{m.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-strong">{label(m.role)}</span>
                    {!m.active && <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">No access</span>}
                    {m.active && m.mustChangePassword && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Temporary password</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-ink-soft">
                  {m.lastLoginAt ? `Last signed in ${shortDate(m.lastLoginAt)}` : "Has not signed in yet"} · added {shortDate(m.createdAt)}
                </p>
                {!isYou && <MemberControls id={m.id} name={m.name} role={m.role} active={m.active} />}
              </article>
            );
          })}
        </section>

        <aside className="space-y-6">
          <AddMemberForm />
          <section className="card space-y-2 p-5 text-sm">
            <h2 className="font-semibold">Roles</h2>
            <p><strong>Owner</strong>: everything, including adding and removing team members.</p>
            <p><strong>Manager</strong>: bookings, customers and business leads. Can&apos;t manage the team.</p>
          </section>
        </aside>
      </div>
    </>
  );
}
