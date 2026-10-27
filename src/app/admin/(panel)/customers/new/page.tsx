import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { TOWNS } from "@/content/towns";
import { PageHeader } from "../../ui";
import { CustomerForm } from "../customer-form";

export const metadata = { title: "New customer" };

export default async function NewCustomerPage() {
  await requireAdmin();
  const towns = [...TOWNS].sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({ value: t.slug, label: t.name }));
  return (
    <>
      <Link href="/admin/customers" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Customers</Link>
      <PageHeader title="New customer" />
      <CustomerForm towns={towns} cancelHref="/admin/customers" initial={{ name: "", phone: "", email: "", address: "", town: "", lang: "en", notes: "" }} />
    </>
  );
}
