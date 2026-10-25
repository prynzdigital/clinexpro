// Applies database migrations (drizzle/). Runs in the production build command
// (see vercel.json) so schema changes deploy together with the code.
//
//   npm run db:migrate             # uses DATABASE_URL, or the local dev database
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

async function main() {
  const url = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:54329/postgres";
  const pool = new Pool({ connectionString: url });
  await migrate(drizzle(pool), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await pool.end();
  console.log(`Migrations applied (${process.env.DATABASE_URL ? "DATABASE_URL" : "local dev database"}).`);
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
