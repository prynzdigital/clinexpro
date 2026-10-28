import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Empty, PageHeader } from "../../ui";
import { DeleteButton } from "../../delete-button";
import { CrewForm } from "../setup-forms";
import { deleteCrew } from "../setup-actions";

export const metadata = { title: "Saved crews" };

export default async function CrewsPage() {
  await requireAdmin();
  const db = await getDb();
  const [crews, members, staff] = await Promise.all([
    db.select().from(schema.crews).orderBy(asc(schema.crews.name)),
    db.select().from(schema.crewMembers),
    db.select({ id: schema.staff.id, name: schema.staff.name, color: schema.staff.color }).from(schema.staff).where(eq(schema.staff.active, true)).orderBy(asc(schema.staff.name)),
  ]);
  const name = new Map(staff.map((s) => [s.id, s.name]));

  return (
    <>
      <Link href="/admin/roster" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Roster</Link>
      <PageHeader title="Saved crews" subtitle="Groups you often send together. Drop one onto a shift or job in one click, then swap people as needed." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-3">
          {crews.length === 0 && <Empty>No saved crews yet. They are optional: you can always pick people one by one.</Empty>}
          {crews.map((crew) => {
            const ids = members.filter((m) => m.crewId === crew.id).map((m) => m.staffId);
            return (
              <details key={crew.id} className="card group overflow-hidden">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{crew.name}</span>
                    <span className="block truncate text-sm text-ink-soft">
                      {ids.map((id) => (id === crew.leaderId ? `★ ${name.get(id)}` : name.get(id))).filter(Boolean).join(", ")}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-brand-strong group-open:hidden">Edit</span>
                </summary>
                <div className="space-y-4 border-t border-line p-4">
                  <CrewForm staff={staff} initial={{ id: crew.id, name: crew.name, leaderId: crew.leaderId ? String(crew.leaderId) : "", members: ids }} />
                  <div className="flex justify-end border-t border-line pt-3">
                    <DeleteButton action={deleteCrew} id={crew.id} noun="saved crew" />
                  </div>
                </div>
              </details>
            );
          })}
        </section>
        <aside className="card self-start p-5">
          <h2 className="mb-3 font-semibold">New saved crew</h2>
          {staff.length ? (
            <CrewForm key={crews.length} staff={staff} initial={{ name: "", leaderId: "", members: [] }} />
          ) : (
            <p className="text-sm text-ink-soft">Add staff first.</p>
          )}
        </aside>
      </div>
    </>
  );
}
