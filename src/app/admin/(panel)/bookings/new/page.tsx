import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { mauritiusDate } from "@/lib/dates";
import { PageHeader } from "../../ui";
import { BookingForm } from "../booking-form";
import { bookingFormOptions } from "../form-options";

export const metadata = { title: "New booking" };

export default async function NewBookingPage({ searchParams }: PageProps<"/admin/bookings/new">) {
  await requireAdmin();
  const { customer } = await searchParams;
  const options = await bookingFormOptions();
  return (
    <>
      <Link href="/admin/bookings" className="mb-3 inline-block text-sm text-ink-soft hover:text-ink">← Bookings</Link>
      <PageHeader title="New booking" subtitle="For bookings taken by phone, WhatsApp or in person" />
      <BookingForm
        {...options}
        cancelHref="/admin/bookings"
        initial={{
          customerId: typeof customer === "string" ? Number(customer) : undefined,
          service: "",
          frequency: "once",
          date: mauritiusDate(1),
          time: "08:00",
          address: "",
          town: "",
          price: "",
          deposit: "",
          status: "confirmed",
          paymentStatus: "unpaid",
          notes: "",
        }}
      />
    </>
  );
}
