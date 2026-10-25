// Needs the database running (`npm run db` locally).
// Creates (or resets) the admin user from ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME,
// and with --demo adds sample customers, bookings and leads for local testing.
//
//   npm run seed           # admin user only
//   npm run seed -- --demo # admin user + demo data
import path from "node:path";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "../src/db/schema";
import { estimate, type Frequency } from "../src/lib/pricing";

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:54329/postgres",
  });
  const db = drizzle(pool, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  const close = () => pool.end();

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 10) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (10+ characters) in .env.local");
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const name = process.env.ADMIN_NAME ?? "Owner";
  await db
    .insert(schema.adminUsers)
    .values({ email, name, passwordHash })
    .onConflictDoUpdate({ target: schema.adminUsers.email, set: { passwordHash, name } });
  console.log(`Admin user ready: ${email}`);

  if (process.argv.includes("--demo")) {
    const day = (offset: number) => {
      const d = new Date(Date.now() + offset * 864e5);
      if (d.getUTCDay() === 0) d.setUTCDate(d.getUTCDate() + 1);
      return d.toISOString().slice(0, 10);
    };
    const people = [
      { name: "Demo — Anjali Ramdin", email: "anjali.demo@example.com", phone: "+230 5700 0001", town: "quatre-bornes" },
      { name: "Demo — Kevin Lagesse", email: "kevin.demo@example.com", phone: "+230 5700 0002", town: "grand-baie" },
      { name: "Demo — Marie Dupont", email: "marie.demo@example.com", phone: "+230 5700 0003", town: "curepipe", lang: "fr" },
    ];
    const jobs: { who: number; service: string; values: Record<string, number>; addons: string[]; frequency: Frequency; offset: number; status: "pending" | "confirmed" | "completed" }[] = [
      { who: 0, service: "home-cleaning", values: { bedrooms: 3, bathrooms: 2 }, addons: ["oven"], frequency: "weekly", offset: 1, status: "confirmed" },
      { who: 1, service: "deep-cleaning", values: { bedrooms: 4, bathrooms: 3 }, addons: ["windows", "balcony"], frequency: "once", offset: 3, status: "pending" },
      { who: 2, service: "sofa-carpet", values: { seats: 5, carpets: 2, mattresses: 0 }, addons: [], frequency: "once", offset: 5, status: "pending" },
      { who: 0, service: "home-cleaning", values: { bedrooms: 3, bathrooms: 2 }, addons: [], frequency: "weekly", offset: -6, status: "completed" },
    ];
    for (const p of people) {
      const [c] = await db
        .insert(schema.customers)
        .values({ ...p, address: "Demo address", lang: p.lang ?? "en" })
        .onConflictDoUpdate({ target: schema.customers.email, set: { name: p.name } })
        .returning();
      for (const [i, j] of jobs.entries()) {
        if (people[j.who] !== p) continue;
        const price = estimate({ service: j.service, values: j.values, addons: j.addons, frequency: j.frequency })!;
        await db
          .insert(schema.bookings)
          .values({
            ref: `CP-DEMO${i + 1}`,
            customerId: c.id,
            service: j.service,
            details: { ...j.values, addons: j.addons },
            frequency: j.frequency,
            date: day(j.offset),
            timeSlot: "10:00",
            address: "Demo address",
            town: p.town,
            estimateMur: price.totalMur,
            depositMur: price.depositMur,
            status: j.status,
            paymentStatus: j.status === "completed" ? "paid" : "unpaid",
          })
          .onConflictDoNothing();
      }
    }
    await db.insert(schema.leads).values({
      company: "Demo — Ebène Business Hub",
      contactName: "Demo Contact",
      email: "facilities.demo@example.com",
      phone: "+230 5700 0010",
      sector: "office",
      town: "Ebène",
      message: "Daily cleaning for 2 floors, about 60 staff.",
    });
    console.log("Demo data added.");
  }
  await close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
