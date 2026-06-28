# Panel Consultorio Psicopedagógico

Aplicación del consultorio (dashboard existente) migrada a **Next.js** con persistencia en **MongoDB Atlas**, lista para deployar en **Vercel**.

El dashboard que antes guardaba todo en `localStorage` ahora usa MongoDB como fuente de verdad. `localStorage` queda solo como cache instantánea / modo offline.

## Estructura

```
.
├── app/
│   ├── api/
│   │   ├── state/route.js            # GET estado completo · PUT reemplaza todo (transacción)
│   │   └── [collection]/
│   │       ├── route.js              # GET lista · POST insertar
│   │       └── [id]/route.js         # GET · PUT (upsert) · DELETE por id
│   ├── layout.jsx
│   └── page.jsx                      # fallback (la raíz redirige al dashboard)
├── lib/
│   ├── mongodb.js                    # cliente con cache de conexión (serverless)
│   └── collections.js                # colecciones, índices y helpers
├── public/
│   └── dashboard.html                # el dashboard (servido en "/")
├── scripts/
│   └── seed.mjs                      # migración: crea índices y carga el backup
├── seed-data/
│   └── backup.json                   # backup exportado del localStorage
├── legacy/
│   └── consultorio-dashboard.original.html   # versión original sin tocar (referencia)
├── .env.example
└── next.config.js
```

## Modelo de datos

Una colección por entidad. El `id` original de cada registro se usa como `_id` de Mongo (upserts idempotentes, sin duplicados).

| Colección         | Registros (backup) | Índices |
|-------------------|--------------------|---------|
| `pacientes`       | 16                 | apellido+nombre, dni, activo, obraSocial |
| `sesiones`        | 53                 | pacienteId+fecha, fecha, estado |
| `turnos`          | 130                | fecha+hora, pacienteId, estado |
| `facturacion`     | 52                 | mes+pacienteId, pacienteId, obraSocialFact |
| `gastos`          | 12                 | mes |
| `presentaciones`  | 24                 | mesFacturado, obraSocial, pacienteId, estado |
| `objetivos`       | 40                 | pacienteId+mes, area, estado |
| `papelera`        | 3                  | tipo, timestamp |
| `anotador`        | 4                  | timestamp, hecho |
| `leyendas`        | 5                  | nombre |
| `notasCalendario` | 1                  | fecha |
| `config`          | 1 (singleton)      | _id: "config" |

## Puesta en marcha (local)

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar variables de entorno: copiar `.env.example` a `.env.local` y completar `MONGODB_URI`. (Ya viene un `.env.local` con tu connection string.)
3. **Migrar los datos** (crea índices + carga el backup). Idempotente, se puede repetir:
   ```bash
   npm run seed
   ```
   - `npm run seed -- --wipe` borra cada colección antes de cargar.
   - `npm run ensure-indexes` solo crea los índices, no toca datos.
4. Levantar en desarrollo:
   ```bash
   npm run dev
   ```
   Abrir http://localhost:3000

## Deploy en Vercel

1. Subir el proyecto a un repo de GitHub.
2. En Vercel: **New Project** → importar el repo (framework: Next.js, se detecta solo).
3. En **Settings → Environment Variables** agregar:
   - `MONGODB_URI` = tu connection string de Atlas
   - `MONGODB_DB` = `panel-psicope` (opcional)
4. En **MongoDB Atlas → Network Access** permitir el acceso desde Vercel
   (lo más simple: `0.0.0.0/0`, o las IPs de Vercel).
5. **Deploy**.

> La migración (`npm run seed`) se corre **una vez desde tu máquina** (o desde cualquier
> entorno con acceso a Atlas). No hace falta correrla en Vercel.

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET    | `/api/state` | Estado completo (forma original del dashboard) |
| PUT    | `/api/state` | Reemplaza todo el estado (transacción) |
| GET    | `/api/:coleccion` | Lista (acepta filtros `?campo=valor&limit=N`) |
| POST   | `/api/:coleccion` | Inserta un registro |
| GET    | `/api/:coleccion/:id` | Un registro |
| PUT    | `/api/:coleccion/:id` | Crea/reemplaza un registro |
| DELETE | `/api/:coleccion/:id` | Elimina un registro |

`:coleccion` ∈ las de la tabla de arriba. `config` es singleton: `GET/POST /api/config`.
# panel-psicope
