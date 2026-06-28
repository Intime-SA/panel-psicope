// /api/[collection]
//   GET  -> lista documentos de una colección (acepta ?filtros via query simples).
//   POST -> inserta un documento (genera id si falta).
// Para "config" (singleton): GET devuelve el objeto, POST/PUT lo reemplaza.
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/mongodb.js";
import {
  ENTITY_COLLECTIONS,
  CONFIG_COLLECTION,
  CONFIG_ID,
  toDoc,
  fromDoc,
} from "../../../lib/collections.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function nuevoId() {
  return "id_" + Math.random().toString(36).slice(2, 10);
}

function isValid(name) {
  return ENTITY_COLLECTIONS.includes(name) || name === CONFIG_COLLECTION;
}

export async function GET(request, { params }) {
  const { collection } = params;
  if (!isValid(collection)) {
    return NextResponse.json({ error: "Colección desconocida" }, { status: 404 });
  }
  try {
    const db = await getDb();

    if (collection === CONFIG_COLLECTION) {
      const doc = await db.collection(CONFIG_COLLECTION).findOne({ _id: CONFIG_ID });
      const { _id, ...cfg } = doc || {};
      return NextResponse.json(doc ? cfg : null);
    }

    // Filtros simples desde querystring (?campo=valor)
    const filter = {};
    const url = new URL(request.url);
    for (const [k, v] of url.searchParams.entries()) {
      if (["limit", "sort", "order"].includes(k)) continue;
      filter[k] = v;
    }
    const limit = parseInt(url.searchParams.get("limit") || "0", 10);
    let cursor = db.collection(collection).find(filter);
    if (limit > 0) cursor = cursor.limit(limit);
    const docs = await cursor.toArray();
    return NextResponse.json(docs.map(fromDoc));
  } catch (err) {
    console.error(`GET /api/${collection}`, err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const { collection } = params;
  if (!isValid(collection)) {
    return NextResponse.json({ error: "Colección desconocida" }, { status: 404 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  try {
    const db = await getDb();

    if (collection === CONFIG_COLLECTION) {
      await db
        .collection(CONFIG_COLLECTION)
        .replaceOne({ _id: CONFIG_ID }, { _id: CONFIG_ID, ...body }, { upsert: true });
      return NextResponse.json({ ok: true });
    }

    if (!body.id) body.id = nuevoId();
    const doc = toDoc(body);
    await db.collection(collection).replaceOne({ _id: doc._id }, doc, { upsert: true });
    return NextResponse.json(fromDoc(doc), { status: 201 });
  } catch (err) {
    console.error(`POST /api/${collection}`, err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
