import { NextResponse } from "next/server";
import { getProvider, markPaymentFailed, markPaymentSucceeded, paymentBooking } from "@/lib/payments";
import { verifyTestToken } from "@/lib/payments/providers";

// The test gateway's "Approve" / "Decline" buttons. Stands in for the redirect
// a real gateway sends after the customer pays.
export async function POST(request: Request) {
  if (getProvider()?.id !== "test") return NextResponse.json({ error: "Test gateway is off" }, { status: 404 });

  const form = await request.formData();
  const paymentId = Number(form.get("payment"));
  const token = String(form.get("token") ?? "");
  const approved = form.get("outcome") === "approve";
  if (!Number.isInteger(paymentId) || !verifyTestToken(paymentId, token)) {
    return NextResponse.json({ error: "Invalid payment link" }, { status: 400 });
  }

  const row = await paymentBooking(paymentId);
  if (!row) return NextResponse.json({ error: "Unknown payment" }, { status: 404 });

  if (approved) await markPaymentSucceeded(paymentId, { raw: { simulated: true, at: new Date().toISOString() } });
  else await markPaymentFailed(paymentId, "failed", { raw: { simulated: true, declined: true } });

  const back = new URL(`/${row.lang}/book/confirmation`, request.url);
  back.searchParams.set("ref", row.ref);
  back.searchParams.set("payment", approved ? "success" : "failed");
  return NextResponse.redirect(back, 303);
}
