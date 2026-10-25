// Local development database: PGlite (Postgres compiled to WASM) served over the
// normal Postgres protocol, so the app talks to it exactly like a hosted Postgres.
// One process owns the data folder and closes it cleanly on Ctrl+C.
//
//   npm run db   → postgres://postgres@127.0.0.1:54329/postgres
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const dataDir = path.join(process.cwd(), ".data", "pglite");
fs.mkdirSync(dataDir, { recursive: true });

const db = await PGlite.create(dataDir);
const server = new PGLiteSocketServer({ db, host: "127.0.0.1", port: 54329, maxConnections: 10 });
await server.start();
console.log("Dev database ready on postgres://postgres@127.0.0.1:54329/postgres");

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  await server.stop();
  await db.close();
  console.log("Dev database closed cleanly.");
  process.exit(0);
}
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"]) process.on(signal, shutdown);
