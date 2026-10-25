import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import en from "@/dictionaries/en";
import { Empty, LeadBadge, PageHeader, label, shortDate } from "../ui";
import { updateLeadStatus } from "../actions";

export const metadata = { title: "Business leads" };

export default async function LeadsPage() {
  await requireAdmin();
  const db = await getDb();
  const leads = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(200);

  return (
    <>
      <PageHeader title="Business leads" subtitle="Office, hotel and villa enquiries from the website" />
      {leads.length === 0 ? (
        <Empty>No enquiries yet.</Empty>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="card grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{lead.company}</h2>
                  <LeadBadge status={lead.status} />
                </div>
                <p className="text-sm text-ink-soft">
                  {en.business.sectors[lead.sector as keyof typeof en.business.sectors] ?? lead.sector}
                  {lead.town ? ` · ${lead.town}` : ""} · received {shortDate(lead.createdAt)}
                </p>
                <p className="text-sm">
                  {lead.contactName} · <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a> ·{" "}
                  <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                </p>
                {lead.message && <p className="whitespace-pre-line pt-1 text-sm text-ink-soft">{lead.message}</p>}
              </div>
              <form action={updateLeadStatus} className="flex items-center gap-2 self-start">
                <input type="hidden" name="id" value={lead.id} />
                <select name="status" defaultValue={lead.status} className="field py-2 text-sm" aria-label="Lead status">
                  {schema.leadStatus.enumValues.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                </select>
                <button type="submit" className="btn-secondary min-h-10 px-4 text-sm">Save</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
