import Link from "next/link";
import { asc, count, desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { TOWNS, getTown } from "@/content/towns";
import { Empty, PageHeader } from "../../ui";
import { DeleteButton } from "../../delete-button";
import { SiteForm } from "../setup-forms";
import { deleteSite } from "../setup-actions";

export const metadata = { title: "Sites" };

export default async function SitesPage() {
  await requireAdmin();
  const db = await getDb();
  const [sites, customers, shiftCounts] = await Promise.all([
    db.select().from(schema.sites).orderBy(desc(schema.sites.active), asc(schema.sites.name)),
    db.select({ id: schema.customers.id, name: schema.customers.name }).from(schema.customers).orderBy(asc(schema.customers.name)),
    db.select({ siteId: schema.shifts.siteId, n: count() }).from(schema.shifts).groupBy(schema.shifts.siteId),
  ]);
  const shiftsAt = new Map(shiftCounts.map((s) => [s.siteId, s.n]));
  const customerOptions = customers.map((c) => ({ value: String(c.id), label: c.name }));
  const towns = [...TOWNS].sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({ value: t.slug, label: t.name }));
  const clientName = new Map(customers.map((c) => [c.id, c.name]));

  return (
    <>
      <Link href="/admin/roster" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Roster</Link>
      <PageHeader title="Sites" subtitle="Hotels, offices and other contract locations staffed by shifts" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-3">
          {sites.length === 0 && <Empty>No sites yet. Add the hotels and offices you staff on a roster.</Empty>}
          {sites.map((site) => (
            <details key={site.id} className={`card group overflow-hidden ${site.active ? "" : "opacity-70"}`}>
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4">
                <span className="size-10 shrink-0 rounded-xl" style={{ background: site.color }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{site.name}</span>
                  <span className="block truncate text-sm text-ink-soft">
                    {[site.customerId && clientName.get(site.customerId), site.town && (getTown(site.town)?.name ?? site.town), `${shiftsAt.get(site.id) ?? 0} shifts`].filter(Boolean).join(" · ")}
                    {!site.active && " · inactive"}
                  </span>
                </span>
                <span className="text-sm font-medium text-brand-strong group-open:hidden">Edit</span>
              </summary>
              <div className="space-y-4 border-t border-line p-4">
                <SiteForm
                  customers={customerOptions}
                  towns={towns}
                  initial={{
                    id: site.id,
                    name: site.name,
                    customerId: site.customerId ? String(site.customerId) : "",
                    address: site.address ?? "",
                    town: site.town ?? "",
                    instructions: site.instructions ?? "",
                    active: site.active,
                  }}
                />
                <div className="flex justify-end border-t border-line pt-3">
                  <DeleteButton
                    action={deleteSite}
                    id={site.id}
                    noun="site"
                    blockedReason={shiftsAt.get(site.id) ? "It has shifts on record (needed for timesheets). Set it to Inactive instead." : null}
                  />
                </div>
              </div>
            </details>
          ))}
        </section>
        <aside className="card self-start p-5">
          <h2 className="mb-3 font-semibold">Add a site</h2>
          <SiteForm key={sites.length} customers={customerOptions} towns={towns} initial={{ name: "", customerId: "", address: "", town: "", instructions: "", active: true }} />
        </aside>
      </div>
    </>
  );
}
