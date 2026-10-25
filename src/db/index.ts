import "server-only";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "./schema";

const LOCAL_DATABASE_URL = "postgres://postgres@127.0.0.1:54329/postgres";
const isProduction = process.env.NODE_ENV === "production";

function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (isProduction && process.env.ALLOW_LOCAL_DATABASE !== "1") {
    throw new Error(
      "DATABASE_URL is not set. Add your Postgres connection string in the hosting environment variables (see DEPLOY.md).",
    );
  }
  return LOCAL_DATABASE_URL; // `npm run db` (scripts/dev-db.mjs)
}

function create() {
  // Small pool: on serverless hosting each instance holds its own connections.
  const pool = new Pool({ connectionString: databaseUrl(), max: isProduction ? 3 : 5 });
  const db = drizzle(pool, { schema });
  // Production runs migrations once per deploy (`npm run db:migrate` in the build
  // command); development applies them automatically on first use.
  const ready = isProduction
    ? Promise.resolve()
    : migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
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
