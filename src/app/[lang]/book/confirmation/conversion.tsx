"use client";

import { useEffect } from "react";
import { trackOnce } from "@/lib/track";

/** Booking and deposit conversions, sent once per booking (only with consent). */
export function Conversion({ bookingRef, service, serviceName, valueMur, depositMur, depositPaid }: {
  bookingRef: string;
  service: string;
  serviceName: string;
  valueMur: number;
  depositMur: number;
  depositPaid: boolean;
}) {
  useEffect(() => {
    trackOnce(`purchase:${bookingRef}`, "purchase", {
      transaction_id: bookingRef,
      value: valueMur,
      currency: "MUR",
      items: [{ item_id: service, item_name: serviceName, price: valueMur, quantity: 1 }],
    });
    if (depositPaid) trackOnce(`deposit:${bookingRef}`, "deposit_paid", { transaction_id: bookingRef, value: depositMur, currency: "MUR" });
  }, [bookingRef, service, serviceName, valueMur, depositMur, depositPaid]);
  return null;
}
