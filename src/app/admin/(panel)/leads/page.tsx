import { desc } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import en from "@/dictionaries/en";
import { getService } from "@/content/services";
import { LEAD_TONE_NAME, NewButton, PageHeader, StatCard, label, shortDate } from "../ui";
import { DataTable, type Row } from "../data-table";
import { deleteLead } from "./actions";

export const metadata = { title: "Business leads" };

const SOURCES: Record<string, string> = { "home-request": "Home page", "business-page": "Business page", office: "Office" };

export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  await requireAdmin();
  const { saved, deleted } = await searchParams;
  const db = await getDb();
  const leads = await db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(2000);

  const by = (s: string) => leads.filter((l) => l.status === s).length;
  const decided = by("won") + by("lost");

  const rows: Row[] = leads.map((lead) => ({
    id: lead.id,
    href: `/admin/leads/${lead.id}`,
    editHref: `/admin/leads/${lead.id}`,
    canDelete: true,
    filter: lead.status,
    cells: {
      company: { text: lead.company, sub: en.business.sectors[lead.sector as keyof typeof en.business.sectors] ?? lead.sector },
      contact: { text: lead.contactName, sub: lead.phone },
      need: {
        text: lead.service ? (getService(lead.service)?.name.en ?? lead.service) : "Not specified",
        sub: [lead.town, lead.preferredDate && `start ${shortDate(lead.preferredDate)}`].filter(Boolean).join(" · ") || undefined,
      },
      source: { text: SOURCES[lead.source] ?? lead.source },
      received: { text: shortDate(lead.createdAt), sort: lead.createdAt.toISOString() },
      status: { text: label(lead.status), badge: LEAD_TONE_NAME[lead.status] },
    },
  }));

  return (
    <>
      <PageHeader title="Business leads" subtitle="Enquiries and booking requests, from the website and the office">
        <NewButton href="/admin/leads/new" label="New lead" />
      </PageHeader>

      {(saved || deleted) && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{deleted ? "Lead deleted." : "Lead saved."}</p>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New, not yet contacted" value={String(by("new"))} icon="alert" color="amber" />
        <StatCard label="In progress" value={String(by("contacted") + by("site_visit"))} note={`${by("site_visit")} site visits`} icon="clock" color="sky" />
        <StatCard label="Won" value={String(by("won"))} note={decided ? `${Math.round((by("won") / decided) * 100)}% of decided leads` : undefined} icon="check" color="emerald" />
        <StatCard label="All leads" value={String(leads.length)} icon="briefcase" color="navy" />
      </div>

      <DataTable
        columns={[
          { key: "company", label: "Company" },
          { key: "contact", label: "Contact" },
          { key: "need", label: "Need", hideOnMobile: true },
          { key: "source", label: "Source", hideOnMobile: true },
          { key: "received", label: "Received" },
          { key: "status", label: "Status" },
        ]}
        rows={rows}
        filters={schema.leadStatus.enumValues.map((s) => ({ value: s, label: label(s) }))}
        defaultSort={{ key: "received", dir: "desc" }}
        searchPlaceholder="Search company, contact, phone, town"
        empty="No leads yet. Website enquiries appear here, or add one with New lead."
        deleteAction={deleteLead}
        deleteNoun="lead"
      />
    </>
  );
}
