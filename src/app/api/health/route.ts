import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { emailEnabled, whatsappEnabled } from "@/lib/notify/channels";
import { getProvider } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Launch check: is the database reachable, and which services are switched on?
// Reports only yes/no, never configuration values.
export async function GET() {
  let database = false;
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    database = true;
  } catch (err) {
    console.error("[health] database:", err instanceof Error ? err.message : err);
  }
  const body = {
    ok: database,
    database,
    sessionSecret: Boolean(process.env.SESSION_SECRET),
    email: emailEnabled(),
    whatsapp: whatsappEnabled(),
    payments: getProvider()?.id ?? "off",
  };
  return NextResponse.json(body, { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
