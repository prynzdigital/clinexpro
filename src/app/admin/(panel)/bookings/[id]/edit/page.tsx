import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "../../../ui";
import { BookingForm } from "../../booking-form";
import { bookingFormOptions } from "../../form-options";

export const metadata = { title: "Edit booking" };

export default async function EditBookingPage({ params }: PageProps<"/admin/bookings/[id]/edit">) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = await getDb();
  const [row] = await db
    .select({ booking: schema.bookings, customer: schema.customers })
    .from(schema.bookings)
    .innerJoin(schema.customers, eq(schema.bookings.customerId, schema.customers.id))
    .where(eq(schema.bookings.id, id));
  if (!row) notFound();
  const { booking: b, customer } = row;
  const options = await bookingFormOptions();

  return (
    <>
      <Link href={`/admin/bookings/${b.id}`} className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Booking {b.ref}</Link>
      <PageHeader title={`Edit booking ${b.ref}`} subtitle={customer.name} />
      <BookingForm
        {...options}
        cancelHref={`/admin/bookings/${b.id}`}
        initial={{
          id: b.id,
          customerId: customer.id,
          customerName: customer.name,
          service: b.service,
          frequency: b.frequency,
          date: b.date,
          time: b.timeSlot,
          address: b.address,
          town: b.town,
          price: String(b.estimateMur),
          deposit: String(b.depositMur),
          status: b.status,
          paymentStatus: b.paymentStatus,
          notes: b.notes ?? "",
        }}
      />
    </>
  );
}
