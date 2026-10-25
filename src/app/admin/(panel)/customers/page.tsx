import Link from "next/link";
import { count, desc, eq, ilike, max, or, sum } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { getTown } from "@/content/towns";
import { Empty, PageHeader, mur, shortDate } from "../ui";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const db = await getDb();
  const { customers: c, bookings: b } = schema;
  const pattern = `%${query.replace(/[%_\\]/g, "\\$&")}%`;

  const rows = await db
    .select({
      customer: c,
      jobs: count(b.id),
      value: sum(b.estimateMur),
      lastJob: max(b.date),
    })
    .from(c)
    .leftJoin(b, eq(b.customerId, c.id))
    .where(query ? or(ilike(c.name, pattern), ilike(c.email, pattern), ilike(c.phone, pattern)) : undefined)
    .groupBy(c.id)
    .orderBy(desc(c.createdAt))
    .limit(200);

  return (
    <>
      <PageHeader title="Customers" subtitle={`${rows.length} shown`}>
        <form className="w-full sm:w-72">
          <input name="q" defaultValue={query} placeholder="Search name, email or phone" className="field py-2" />
        </form>
      </PageHeader>
      {rows.length === 0 ? (
        <Empty>{query ? "No customers match that search." : "No customers yet."}</Empty>
      ) : (
        <ul className="card divide-y divide-line">
          {rows.map(({ customer, jobs, value, lastJob }) => (
            <li key={customer.id}>
              <Link href={`/admin/customers/${customer.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-1 p-4 hover:bg-surface-alt">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{customer.name}</p>
                  <p className="truncate text-sm text-ink-soft">
                    {customer.phone} · {customer.email}{customer.town ? ` · ${getTown(customer.town)?.name ?? customer.town}` : ""}
                  </p>
                </div>
                <div className="text-sm text-ink-soft">
                  <span className="font-semibold text-ink">{jobs}</span> jobs · {mur(Number(value ?? 0))}
                  {lastJob && <> · last {shortDate(lastJob)}</>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
