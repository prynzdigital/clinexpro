import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Locale } from "@/lib/i18n";

// The gateway slot. A real Mauritian gateway (MCB Juice/MIPS, Peach Payments,
// Paywise...) plugs in by implementing PaymentProvider and adding itself to
// PROVIDERS; nothing else in the booking flow changes.

export type CheckoutRequest = {
  paymentId: number;
  bookingRef: string;
  amountMur: number;
  lang: Locale;
  customer: { name: string; email: string | null; phone: string };
  /** Absolute site origin of this request, for return and webhook URLs. */
  origin: string;
};

export type WebhookEvent = {
  /** Our payment id, when the gateway echoes back the reference we sent. */
  paymentId?: number;
  providerRef: string;
  outcome: "succeeded" | "failed" | "cancelled";
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  id: string;
  label: string;
  /** Creates the gateway session and returns where to send the customer. */
  createCheckout(req: CheckoutRequest): Promise<{ redirectUrl: string; providerRef?: string }>;
  /** Verifies the gateway's signature and reads the result; null if not genuine. */
  parseWebhook?(req: Request): Promise<WebhookEvent | null>;
}

/** Simulated card page for development and staging. No money moves. */
const testProvider: PaymentProvider = {
  id: "test",
  label: "Test gateway",
  async createCheckout(req) {
    const url = new URL(`/${req.lang}/book/pay/test`, req.origin);
    url.searchParams.set("payment", String(req.paymentId));
    url.searchParams.set("token", testToken(req.paymentId));
    return { redirectUrl: url.toString(), providerRef: `TEST-${req.paymentId}` };
  },
};

const PROVIDERS: Record<string, PaymentProvider> = { test: testProvider };

/**
 * The configured gateway, or null while online payment is off (the default:
 * the team then sends payment links by hand). The test gateway is refused in
 * production unless PAYMENT_ALLOW_TEST=1, so it can't mark real bookings paid.
 */
export function getProvider(): PaymentProvider | null {
  const id = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (!id || id === "none") return null;
  const provider = PROVIDERS[id];
  if (!provider) {
    console.error(`[payments] Unknown PAYMENT_PROVIDER "${id}"; online payment is off.`);
    return null;
  }
  if (id === "test" && process.env.NODE_ENV === "production" && process.env.PAYMENT_ALLOW_TEST !== "1") {
    console.error("[payments] The test gateway is disabled in production (set PAYMENT_ALLOW_TEST=1 on staging only).");
    return null;
  }
  return provider;
}

// Signs test-gateway links so a payment can only be completed from the page we sent.
function testToken(paymentId: number) {
  const secret = process.env.SESSION_SECRET ?? "dev-only-secret";
  return createHmac("sha256", secret).update(`test-payment:${paymentId}`).digest("base64url");
}

export function verifyTestToken(paymentId: number, token: string) {
  const expected = Buffer.from(testToken(paymentId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
