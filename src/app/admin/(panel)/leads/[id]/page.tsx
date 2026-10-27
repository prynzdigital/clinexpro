import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { Icon } from "@/components/icons";
import { LeadBadge, PageHeader, shortDate } from "../../ui";
import { DeleteButton } from "../../delete-button";
import { LeadForm } from "../lead-form";
import { leadFormOptions } from "../options";
import { convertLead, deleteLead } from "../actions";

export const metadata = { title: "Lead" };

const SOURCES: Record<string, string> = { "home-request": "Home page request", "business-page": "Business page", office: "Added by the office" };

export default async function LeadPage({ params }: PageProps<"/admin/leads/[id]">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = await getDb();
  const [lead] = await db.select().from(schema.leads).where(eq(schema.leads.id, id));
  if (!lead) notFound();
  const whatsapp = `https://wa.me/${lead.phone.replace(/\D/g, "").replace(/^(\d{7,8})$/, "230$1")}`;

  return (
    <>
      <Link href="/admin/leads" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Business leads</Link>
      <PageHeader title={lead.company} subtitle={`${SOURCES[lead.source] ?? lead.source} · received ${shortDate(lead.createdAt)}`}>
        <div className="flex flex-wrap items-center gap-2">
          <LeadBadge status={lead.status} />
          <a href={`tel:${lead.phone}`} className="btn-secondary min-h-10 gap-1.5 px-4 text-sm"><Icon name="phone" width={16} height={16} /> Call</a>
          <a href={whatsapp} target="_blank" rel="noopener" className="btn-secondary min-h-10 gap-1.5 px-4 text-sm"><Icon name="chat" width={16} height={16} /> WhatsApp</a>
          <form action={convertLead}>
            <input type="hidden" name="id" value={lead.id} />
            <button type="submit" className="btn-primary min-h-10 gap-1.5 px-4 text-sm"><Icon name="users" width={16} height={16} /> Convert to customer</button>
          </form>
          <DeleteButton action={deleteLead} id={lead.id} noun="lead" extra={{ from: "detail" }} />
        </div>
      </PageHeader>
      <LeadForm
        {...leadFormOptions()}
        initial={{
          id: lead.id,
          company: lead.company,
          contactName: lead.contactName,
          phone: lead.phone,
          email: lead.email,
          sector: lead.sector,
          town: lead.town ?? "",
          address: lead.address ?? "",
          service: lead.service ?? "",
          preferredDate: lead.preferredDate ?? "",
          status: lead.status,
          message: lead.message ?? "",
        }}
      />
    </>
  );
}
