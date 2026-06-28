// /api/state
//   GET  -> arma el estado completo (forma original) leyendo todas las colecciones.
//   PUT  -> reemplaza el estado completo (sincroniza cada colección) en una transacción.
//
// El frontend usa GET al iniciar y PUT (con debounce) al guardar.
import { NextResponse } from "next/server";
import { getClient, getDb } from "../../../lib/mongodb.js";
import {
  ENTITY_COLLECTIONS,
  CONFIG_COLLECTION,
  CONFIG_ID,
  toDoc,
  fromDoc,
} from "../../../lib/collections.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const db = await getDb();
    const state = {};

    await Promise.all(
      ENTITY_COLLECTIONS.map(async (name) => {
        const docs = await db.collection(name).find({}).toArray();
        state[name] = docs.map(fromDoc);
      })
    );

    const configDoc = await db.collection(CONFIG_COLLECTION).findOne({ _id: CONFIG_ID });
    if (configDoc) {
      const { _id, ...cfg } = configDoc;
      state.config = cfg;
    } else {
      state.config = null;
    }

    return NextResponse.json(state, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("GET /api/state", err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function PUT(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const client = await getClient();
  const db = await getDb();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      for (const name of ENTITY_COLLECTIONS) {
        if (!Array.isArray(body[name])) continue; // si no viene, no se toca
        const col = db.collection(name);
        await col.deleteMany({}, { session });
        const docs = body[name].map(toDoc).filter((d) => d._id != null);
        if (docs.length) await col.insertMany(docs, { session, ordered: false });
      }
      if (body.config && typeof body.config === "object") {
        await db
          .collection(CONFIG_COLLECTION)
          .replaceOne({ _id: CONFIG_ID }, { _id: CONFIG_ID, ...body.config }, { upsert: true, session });
      }
    });

    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error("PUT /api/state", err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
