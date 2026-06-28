// /api/[collection]/[id]
//   GET    -> un documento por id
//   PUT    -> reemplaza/crea (upsert) el documento por id
//   DELETE -> elimina el documento por id
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/mongodb.js";
import { ENTITY_COLLECTIONS, toDoc, fromDoc } from "../../../../lib/collections.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isValid(name) {
  return ENTITY_COLLECTIONS.includes(name);
}

export async function GET(_request, { params }) {
  const { collection, id } = params;
  if (!isValid(collection)) {
    return NextResponse.json({ error: "Colección desconocida" }, { status: 404 });
  }
  try {
    const db = await getDb();
    const doc = await db.collection(collection).findOne({ _id: id });
    if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(fromDoc(doc));
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { collection, id } = params;
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
    const doc = toDoc({ ...body, id });
    await db.collection(collection).replaceOne({ _id: id }, doc, { upsert: true });
    return NextResponse.json(fromDoc(doc));
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const { collection, id } = params;
  if (!isValid(collection)) {
    return NextResponse.json({ error: "Colección desconocida" }, { status: 404 });
  }
  try {
    const db = await getDb();
    const res = await db.collection(collection).deleteOne({ _id: id });
    return NextResponse.json({ ok: true, deleted: res.deletedCount });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
