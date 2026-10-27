import { asc, count, desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Empty, PageHeader, StatCard, shortDate } from "../ui";
import { DeleteButton } from "../delete-button";
import { addStaff, deleteStaff, updateStaff } from "./actions";
import { AppAccess } from "./app-access";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  await requireAdmin();
  const db = await getDb();
  const people = await db.select().from(schema.staff).orderBy(desc(schema.staff.active), asc(schema.staff.name));
  const jobs = await db
    .select({ staffId: schema.bookingAssignments.staffId, n: count() })
    .from(schema.bookingAssignments)
    .groupBy(schema.bookingAssignments.staffId);
  const jobCount = new Map(jobs.map((j) => [j.staffId, j.n]));
  const active = people.filter((p) => p.active);

  return (
    <>
      <PageHeader title="Staff" subtitle="Cleaners and supervisors you can put on jobs" />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active staff" value={String(active.length)} note={`${people.length - active.length} inactive`} icon="badge" color="navy" />
        <StatCard label="Using the staff app" value={String(active.filter((p) => p.pinHash).length)} note="have a PIN" icon="phone" color="emerald" />
        <StatCard label="Jobs assigned" value={String(jobs.reduce((s, j) => s + j.n, 0))} note="all time" icon="board" color="orange" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-3">
          {people.length === 0 && <Empty>Add your cleaners to start planning jobs on the schedule.</Empty>}
          {people.map((p) => (
            <div key={p.id} className={`card space-y-3 p-4 ${p.active ? "" : "opacity-70"}`}>
              <form action={updateStaff} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="id" value={p.id} />
                <span className="mb-3 size-4 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                <label className="min-w-40 flex-1">
                  <span className="label">Name</span>
                  <input name="name" defaultValue={p.name} required minLength={2} className="field" />
                </label>
                <label className="min-w-36 flex-1">
                  <span className="label">Mobile</span>
                  <input name="phone" type="tel" defaultValue={p.phone ?? ""} className="field" />
                </label>
                <label className="min-w-32">
                  <span className="label">Status</span>
                  <select name="active" defaultValue={String(p.active)} className="field">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </label>
                <button type="submit" className="btn-secondary min-h-11">Save</button>
              </form>
              <AppAccess id={p.id} name={p.name} hasPin={Boolean(p.pinHash)} active={p.active} lastLogin={p.lastLoginAt ? shortDate(p.lastLoginAt) : null} />
              <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
                <span className="text-ink-soft">{jobCount.get(p.id) ?? 0} job{jobCount.get(p.id) === 1 ? "" : "s"} assigned</span>
                <DeleteButton
                  action={deleteStaff}
                  id={p.id}
                  noun="person"
                  blockedReason={jobCount.get(p.id) ? "They have job history. Set them to Inactive instead." : null}
                />
              </div>
            </div>
          ))}
        </section>

        <aside>
          <form action={addStaff} className="card space-y-3 p-5">
            <h2 className="font-semibold">Add a person</h2>
            <label className="block">
              <span className="label">Full name</span>
              <input name="name" required minLength={2} className="field" autoComplete="off" />
            </label>
            <label className="block">
              <span className="label">Mobile (needed for the staff app)</span>
              <input name="phone" type="tel" className="field" autoComplete="off" />
            </label>
            <button type="submit" className="btn-primary w-full">Add</button>
            <p className="text-xs text-ink-soft">Inactive people stay on past jobs but can&apos;t be put on new ones.</p>
          </form>
        </aside>
      </div>
    </>
  );
}
