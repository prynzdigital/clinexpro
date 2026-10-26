import { asc, desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Empty, PageHeader } from "../ui";
import { addStaff, updateStaff } from "./actions";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  await requireAdmin();
  const db = await getDb();
  const people = await db.select().from(schema.staff).orderBy(desc(schema.staff.active), asc(schema.staff.name));

  return (
    <>
      <PageHeader title="Staff" subtitle="Cleaners and supervisors you can put on jobs" />
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-3">
          {people.length === 0 && <Empty>Add your cleaners to start planning jobs on the schedule.</Empty>}
          {people.map((p) => (
            <form key={p.id} action={updateStaff} className={`card flex flex-wrap items-end gap-3 p-4 ${p.active ? "" : "opacity-70"}`}>
              <input type="hidden" name="id" value={p.id} />
              <span className="mb-3 size-4 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
              <label className="min-w-40 flex-1">
                <span className="label">Name</span>
                <input name="name" defaultValue={p.name} required minLength={2} className="field" />
              </label>
              <label className="min-w-36 flex-1">
                <span className="label">Phone</span>
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
              <span className="label">Phone (optional)</span>
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
