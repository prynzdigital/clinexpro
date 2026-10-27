import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { TOWNS } from "@/content/towns";
import { PageHeader } from "../../../ui";
import { CustomerForm } from "../../customer-form";

export const metadata = { title: "Edit customer" };

export default async function EditCustomerPage({ params }: PageProps<"/admin/customers/[id]/edit">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = await getDb();
  const [c] = await db.select().from(schema.customers).where(eq(schema.customers.id, id));
  if (!c) notFound();
  const towns = [...TOWNS].sort((a, b) => a.name.localeCompare(b.name)).map((t) => ({ value: t.slug, label: t.name }));
  return (
    <>
      <Link href={`/admin/customers/${c.id}`} className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← {c.name}</Link>
      <PageHeader title={`Edit ${c.name}`} subtitle="Invoices already issued keep the details they were issued with" />
      <CustomerForm
        towns={towns}
        cancelHref={`/admin/customers/${c.id}`}
        initial={{ id: c.id, name: c.name, phone: c.phone, email: c.email ?? "", address: c.address ?? "", town: c.town ?? "", lang: c.lang, notes: c.notes ?? "" }}
      />
    </>
  );
}
