#!/usr/bin/env node
// Migración / seed de la base panel-psicope.
//
// Uso:
//   npm run seed                         -> crea índices y carga seed-data/backup.json (upsert idempotente)
//   npm run seed -- --file=otro.json     -> usa otro archivo de backup
//   npm run seed -- --wipe               -> borra el contenido de cada colección antes de cargar
//   npm run ensure-indexes               -> solo crea/asegura los índices (no toca datos)
//
// Lee MONGODB_URI (y opcional MONGODB_DB) desde el entorno o desde .env.local
import { MongoClient } from "mongodb";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---- carga simple de .env.local (sin dependencias) ----
function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnv();

const {
  ENTITY_COLLECTIONS,
  CONFIG_COLLECTION,
  CONFIG_ID,
  INDEXES,
  DB_NAME,
  toDoc,
} = await import("../lib/collections.mjs");

// ---- args ----
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const getOpt = (name, def) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=").slice(1).join("=") : def;
};
const INDEXES_ONLY = has("--indexes-only");
const WIPE = has("--wipe");
const BACKUP_FILE = getOpt("file", path.join(ROOT, "seed-data", "backup.json"));

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("✖ Falta MONGODB_URI. Definila en .env.local o como variable de entorno.");
  process.exit(1);
}

async function ensureIndexes(db) {
  console.log("→ Asegurando índices…");
  for (const [name, defs] of Object.entries(INDEXES)) {
    await db.createCollection(name).catch(() => {}); // ignora si ya existe
    for (const { keys, options } of defs) {
      await db.collection(name).createIndex(keys, options);
      console.log(`   ✓ ${name}.${options?.name || JSON.stringify(keys)}`);
    }
  }
  await db.createCollection(CONFIG_COLLECTION).catch(() => {});
}

async function seedData(db) {
  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`✖ No se encontró el backup: ${BACKUP_FILE}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(BACKUP_FILE, "utf8"));
  console.log(`→ Cargando datos desde ${path.basename(BACKUP_FILE)}…`);

  for (const name of ENTITY_COLLECTIONS) {
    const arr = Array.isArray(data[name]) ? data[name] : [];
    const col = db.collection(name);
    if (WIPE) await col.deleteMany({});
    if (!arr.length) {
      console.log(`   • ${name}: 0`);
      continue;
    }
    const ops = arr
      .map(toDoc)
      .filter((d) => d._id != null)
      .map((d) => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }));
    if (ops.length) await col.bulkWrite(ops, { ordered: false });
    const count = await col.countDocuments();
    console.log(`   • ${name}: ${arr.length} cargados (total en colección: ${count})`);
  }

  // config (singleton)
  if (data.config && typeof data.config === "object") {
    await db
      .collection(CONFIG_COLLECTION)
      .replaceOne({ _id: CONFIG_ID }, { _id: CONFIG_ID, ...data.config }, { upsert: true });
    console.log("   • config: ok");
  }
}

async function main() {
  console.log(`\n== Migración panel-psicope ==`);
  console.log(`   DB: ${DB_NAME}`);
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db(DB_NAME);

  await ensureIndexes(db);
  if (!INDEXES_ONLY) await seedData(db);

  console.log("\n✔ Listo.\n");
  await client.close();
}

main().catch((err) => {
  console.error("\n✖ Error en la migración:", err.message);
  process.exit(1);
});
