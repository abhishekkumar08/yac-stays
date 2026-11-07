import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildApp } from "./app.js";
import { openDb } from "./db.js";

const dataDir = process.env.STAYS_DATA_DIR ? `${process.env.STAYS_DATA_DIR}/` : fileURLToPath(new URL("../data/", import.meta.url));
const photosDir = `${dataDir}photos`;
mkdirSync(photosDir, { recursive: true });

const port = Number(process.env.API_PORT ?? 3111);
const app = buildApp({ db: openDb(`${dataDir}stays.db`), photosDir });
await app.listen({ port, host: "127.0.0.1" });
process.stdout.write(`yac-stays API on http://127.0.0.1:${port}\n`);
