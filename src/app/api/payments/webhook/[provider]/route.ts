import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { getProvider, markPaymentFailed, markPaymentSucceeded } from "@/lib/payments";

// Server-to-server result from the gateway: the source of truth, since the
// customer may close the tab before being redirected back. Register
// https://<site>/api/payments/webhook/<provider> in the gateway dashboard.
export async function POST(request: Request, ctx: RouteContext<"/api/payments/webhook/[provider]">) {
  const { provider: id } = await ctx.params;
  const provider = getProvider();
  if (!provider || provider.id !== id || !provider.parseWebhook) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const event = await provider.parseWebhook(request);
  if (!event) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const db = await getDb();
  const [payment] = await db
    .select({ id: schema.payments.id })
    .from(schema.payments)
    .where(
      event.paymentId
        ? eq(schema.payments.id, event.paymentId)
        : and(eq(schema.payments.provider, provider.id), eq(schema.payments.providerRef, event.providerRef)),
    )
    .limit(1);
  // Acknowledge unknown payments too, or the gateway keeps retrying them.
  if (!payment) return NextResponse.json({ received: true, matched: false });

  const outcome = { providerRef: event.providerRef, raw: event.raw };
  if (event.outcome === "succeeded") await markPaymentSucceeded(payment.id, outcome);
  else await markPaymentFailed(payment.id, event.outcome, outcome);
  return NextResponse.json({ received: true });
}
