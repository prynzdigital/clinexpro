import "server-only";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "./schema";

// Production: a hosted Postgres. Development: `npm run db` (see scripts/dev-db.mjs).
const DATABASE_URL = process.env.DATABASE_URL ?? "postgres://postgres@127.0.0.1:54329/postgres";

function create() {
  const pool = new Pool({ connectionString: DATABASE_URL, max: 5 });
  const db = drizzle(pool, { schema });
  const ready = migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return { db, ready };
}

export type Db = ReturnType<typeof create>["db"];
type Instance = ReturnType<typeof create>;
const globalForDb = globalThis as unknown as { __clinexDb?: Instance };

// Connected on first use, not on import; reused across hot reloads.
export async function getDb() {
  const instance = (globalForDb.__clinexDb ??= create());
  try {
    await instance.ready;
  } catch (err) {
    globalForDb.__clinexDb = undefined;
    throw err;
  }
  return instance.db;
}

export { schema };
