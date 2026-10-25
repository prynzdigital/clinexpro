import { NextResponse } from "next/server";
import { hasLocale } from "@/lib/i18n";
import { startDepositCheckout } from "@/lib/payments";

// "Pay deposit" on the confirmation page posts here; we open a payment and
// hand the customer to the gateway.
export async function POST(request: Request) {
  const form = await request.formData();
  const ref = String(form.get("ref") ?? "");
  const lang = String(form.get("lang") ?? "en");
  const origin = new URL(request.url).origin;
  if (!/^CP-[A-Z0-9]{6}$/.test(ref) || !hasLocale(lang)) {
    return NextResponse.json({ error: "Invalid booking" }, { status: 400 });
  }

  const back = new URL(`/${lang}/book/confirmation`, origin);
  back.searchParams.set("ref", ref);
  try {
    const redirectUrl = await startDepositCheckout(ref, lang, origin);
    if (redirectUrl) return NextResponse.redirect(redirectUrl, 303);
  } catch (err) {
    console.error("[payments] checkout failed:", err);
    back.searchParams.set("payment", "failed");
  }
  return NextResponse.redirect(back, 303);
}
