// Definición central de colecciones, su clave de negocio e índices.
// Usado por la API (assemble/replace) y por el script de seed.
//
// Convención: cada documento de entidad guarda el `id` original del backup
// también como `_id` de Mongo (string), para upserts idempotentes y para
// evitar duplicados. `config` es un documento singleton con _id: "config".

export const DB_NAME = process.env.MONGODB_DB || "panel-psicope";

// Colecciones tipo "lista" (arrays en el estado original).
export const ENTITY_COLLECTIONS = [
  "pacientes",
  "sesiones",
  "turnos",
  "facturacion",
  "gastos",
  "presentaciones",
  "objetivos",
  "papelera",
  "anotador",
  "leyendas",
  "notasCalendario",
];

// Colección singleton.
export const CONFIG_COLLECTION = "config";
export const CONFIG_ID = "config";

export const ALL_COLLECTIONS = [...ENTITY_COLLECTIONS, CONFIG_COLLECTION];

// Definición de índices por colección.
// keys: spec de Mongo. options: { unique, name, ... }
export const INDEXES = {
  pacientes: [
    { keys: { apellido: 1, nombre: 1 }, options: { name: "apellido_nombre" } },
    { keys: { dni: 1 }, options: { name: "dni" } },
    { keys: { activo: 1 }, options: { name: "activo" } },
    { keys: { obraSocial: 1 }, options: { name: "obraSocial" } },
  ],
  sesiones: [
    { keys: { pacienteId: 1, fecha: -1 }, options: { name: "paciente_fecha" } },
    { keys: { fecha: -1 }, options: { name: "fecha" } },
    { keys: { estado: 1 }, options: { name: "estado" } },
  ],
  turnos: [
    { keys: { fecha: 1, hora: 1 }, options: { name: "fecha_hora" } },
    { keys: { pacienteId: 1 }, options: { name: "paciente" } },
    { keys: { estado: 1 }, options: { name: "estado" } },
  ],
  facturacion: [
    { keys: { mes: 1, pacienteId: 1 }, options: { name: "mes_paciente" } },
    { keys: { pacienteId: 1 }, options: { name: "paciente" } },
    { keys: { obraSocialFact: 1 }, options: { name: "obraSocialFact" } },
  ],
  gastos: [{ keys: { mes: 1 }, options: { name: "mes" } }],
  presentaciones: [
    { keys: { mesFacturado: 1 }, options: { name: "mesFacturado" } },
    { keys: { obraSocial: 1 }, options: { name: "obraSocial" } },
    { keys: { pacienteId: 1 }, options: { name: "paciente" } },
    { keys: { estado: 1 }, options: { name: "estado" } },
  ],
  objetivos: [
    { keys: { pacienteId: 1, mes: 1 }, options: { name: "paciente_mes" } },
    { keys: { area: 1 }, options: { name: "area" } },
    { keys: { estado: 1 }, options: { name: "estado" } },
  ],
  papelera: [
    { keys: { tipo: 1 }, options: { name: "tipo" } },
    { keys: { timestamp: -1 }, options: { name: "timestamp" } },
  ],
  anotador: [
    { keys: { timestamp: -1 }, options: { name: "timestamp" } },
    { keys: { hecho: 1 }, options: { name: "hecho" } },
  ],
  leyendas: [{ keys: { nombre: 1 }, options: { name: "nombre" } }],
  notasCalendario: [{ keys: { fecha: 1 }, options: { name: "fecha" } }],
};

// Normaliza un documento de entidad: usa el `id` de negocio como `_id`.
export function toDoc(item) {
  const id = item.id != null ? String(item.id) : undefined;
  return { _id: id, ...item };
}

// Quita `_id` para devolver el documento con la forma original (con `id`).
export function fromDoc(doc) {
  if (!doc) return doc;
  const { _id, ...rest } = doc;
  if (rest.id == null && _id != null) rest.id = _id;
  return rest;
}
