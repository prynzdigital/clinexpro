import { count, desc, eq, max, sum } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { getTown } from "@/content/towns";
import { NewButton, PageHeader, StatCard, mur, shortDate } from "../ui";
import { DataTable, type Row } from "../data-table";
import { deleteCustomer } from "./actions";
import { customersWithHistory } from "./queries";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  const { deleted } = await searchParams;
  const db = await getDb();
  const { customers: c, bookings: b } = schema;

  const [list, history] = await Promise.all([
    db
      .select({ customer: c, jobs: count(b.id), value: sum(b.estimateMur), lastJob: max(b.date) })
      .from(c)
      .leftJoin(b, eq(b.customerId, c.id))
      .groupBy(c.id)
      .orderBy(desc(c.createdAt))
      .limit(2000),
    customersWithHistory(),
  ]);

  const monthStart = `${mauritiusDate().slice(0, 7)}-01`;
  const newThisMonth = list.filter((r) => r.customer.createdAt >= new Date(`${monthStart}T00:00:00+04:00`)).length;
  const returning = list.filter((r) => r.jobs > 1).length;
  const lifetime = list.reduce((s, r) => s + Number(r.value ?? 0), 0);

  const rows: Row[] = list.map(({ customer, jobs, value, lastJob }) => ({
    id: customer.id,
    href: `/admin/customers/${customer.id}`,
    editHref: `/admin/customers/${customer.id}/edit`,
    canDelete: true,
    deleteBlockedReason: history.has(customer.id) ? "They have bookings or invoices on record; their history is kept for the accounts." : null,
    filter: jobs > 1 ? "returning" : jobs === 1 ? "one" : "none",
    cells: {
      name: { text: customer.name, sub: customer.lang === "fr" ? "Français" : undefined },
      contact: { text: customer.phone, sub: customer.email ?? "No email" },
      town: { text: customer.town ? (getTown(customer.town)?.name ?? customer.town) : "—" },
      jobs: { text: String(jobs), sort: jobs },
      value: { text: mur(Number(value ?? 0)), sort: Number(value ?? 0) },
      last: { text: lastJob ? shortDate(lastJob) : "—", sort: lastJob ?? "" },
    },
  }));

  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone who has booked, or that you've added">
        <NewButton href="/admin/customers/new" label="New customer" />
      </PageHeader>

      {deleted && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">Customer deleted.</p>}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={String(list.length)} icon="users" color="navy" />
        <StatCard label="New this month" value={String(newThisMonth)} icon="plus" color="emerald" />
        <StatCard label="Booked more than once" value={String(returning)} note={list.length ? `${Math.round((returning / list.length) * 100)}% of customers` : undefined} icon="star" color="violet" />
        <StatCard label="Total booked" value={mur(lifetime)} note="all bookings, all time" icon="wallet" color="orange" />
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "contact", label: "Contact" },
          { key: "town", label: "Town", hideOnMobile: true },
          { key: "jobs", label: "Jobs", align: "right" },
          { key: "value", label: "Booked", align: "right" },
          { key: "last", label: "Last job", hideOnMobile: true },
        ]}
        rows={rows}
        filters={[
          { value: "returning", label: "Returning" },
          { value: "one", label: "One job" },
          { value: "none", label: "No jobs yet" },
        ]}
        defaultSort={{ key: "name", dir: "asc" }}
        searchPlaceholder="Search name, phone, email, town"
        empty="No customers yet."
        deleteAction={deleteCustomer}
        deleteNoun="customer"
      />
    </>
  );
}
