import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "../../ui";
import { LeadForm } from "../lead-form";
import { leadFormOptions } from "../options";

export const metadata = { title: "New lead" };

export default async function NewLeadPage() {
  await requireAdmin();
  return (
    <>
      <Link href="/admin/leads" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Business leads</Link>
      <PageHeader title="New lead" subtitle="An enquiry that came by phone, email, WhatsApp or a visit" />
      <LeadForm
        {...leadFormOptions()}
        initial={{ company: "", contactName: "", phone: "", email: "", sector: "office", town: "", address: "", service: "", preferredDate: "", status: "new", message: "" }}
      />
    </>
  );
}
