# Dashboard Consultorio CTP — Handoff v2

Documento para pasar contexto a otro agente que continúe trabajando sobre el dashboard del consultorio psicopedagógico de **Melina Sol** (Lic. en Psicopedagogía). Estado actual del feature set y modelo de datos a junio 2026.

---

## Contexto del proyecto

- **Usuaria:** Melina, psicopedagoga clínica argentina (rioplatense). Trabaja con niños 7-12 años (algunos más chicos). Tutear, registro profesional cálido.
- **Stack actual (v1):** un único HTML self-contained corriendo como artifact de Cowork desktop. Datos en `localStorage` del navegador.
- **Migración en curso (v2):** Next.js + base de datos + Vercel para acceso multi-dispositivo desde cualquier browser. Este documento describe **qué** tiene que hacer el sistema, no cómo está hecho hoy.
- **Estructura física asociada (no se toca, solo se referencia):** carpeta `C:\Users\Melina_Sol\OneDrive\Documentos\CTP\` organizada por año (`2025/`, `2026/`) con subcarpetas por paciente formato `<Nombre Apellido> - OS <Obra Social>`.

---

## Modelo de datos completo

Storage key actual: `consultorio_ctp_v1` (localStorage).

```ts
type State = {
  pacientes: Paciente[];
  sesiones: Sesion[];
  turnos: Turno[];
  facturacion: LineaFacturacion[];
  gastos: Gasto[];
  presentaciones: Presentacion[];
  objetivos: Objetivo[];
  papelera: ItemPapelera[];
  anotador: NotaLibreta[];
  notasCalendario: NotaDia[];
  leyendas: Leyenda[];
  config: Config;
};
```

### `Paciente`

```ts
type Paciente = {
  id: string;             // ej "ferreyra-felipe" (kebab-case apellido-nombre)
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;    // ISO yyyy-mm-dd
  edad: number | null;        // se calcula desde fechaNacimiento
  grado: string;
  escuela: string;
  obraSocial: string;
  tipo: "obraSocial" | "particular";
  importePorSesion: number;
  carpetaCTP: string;         // ruta absoluta a su carpeta física
  fechaInicio: string;        // ISO yyyy-mm-dd inicio del tratamiento
  activo: boolean;

  // Horario habitual del paciente (genera turnos automáticos)
  horariosFijos: { diaSemana: number; hora: string }[];
  // diaSemana: 1=Lun, 2=Mar, ..., 6=Sáb (0=Dom no se usa)

  // Familia / tutores
  tutores: {
    nombre: string;
    relacion: "madre" | "padre" | "tutor" | "abuelo" | "otro";
    ocupacion: string;
    telefono: string;
  }[];

  // Historia clínica
  motivoConsulta: string;
  antecedentes: string;
  entrevistaInicial: string;

  // Evaluación
  pruebasAdministradas: string;
  diagnostico: string;
  planAbordaje: string;

  // Fortalezas / desafíos
  fortalezas: string;
  desafios: string;

  // Cierre
  evolucion: string;
  cierre: string;
};
```

### `Sesion`

```ts
type Sesion = {
  id: string;
  pacienteId: string;
  fecha: string;          // ISO yyyy-mm-dd
  hora: string;           // hoy NO se muestra en el modal (ya está en agenda); legacy.
  estado: "planificada" | "realizada" | "cancelada";
  foco: string;
  planificacion: string;  // antes de la sesión (objetivo, materiales, andamiajes)
  materiales: string;     // usados en sesión
  observaciones: string;  // registro post-sesión
  proximosPasos: string;
  imagenes: ImagenAdjunta[];
};

type ImagenAdjunta = {
  id: string;
  nombre: string;
  dataUrl: string;        // base64 JPEG; resize a 900px lado largo, calidad 0.78
  tamañoKB: number;
  timestamp: number;
};
```

### `Turno`

```ts
type Turno = {
  id: string;             // formato auto: `auto_<pacienteId>_<fecha>_<HHMM>` si fue generado, sino random
  fecha: string;          // ISO yyyy-mm-dd
  hora: string;           // HH:mm
  pacienteId: string;     // vacío si es turno puntual
  etiquetaLibre: string;  // descripción si es turno puntual (reunión, supervisión, etc)
  estado: "agendada" | "realizada" | "cancelada";
  notas: string;
  auto?: boolean;         // true si fue generado por horariosFijos
};
```

### `LineaFacturacion`

```ts
type LineaFacturacion = {
  id: string;
  mes: string;            // ISO yyyy-mm
  pacienteId: string;
  sesiones: number;
  sesionesAbonadas: number;  // 0..sesiones (pago granular por sesión)
  importePorSesion: number;
  obraSocialFact: string;
  estadoPago: "abonada" | "debe" | "parcial"; // derivado de sesionesAbonadas vs sesiones
  factura: string;        // número de factura
  detalles: string;       // notas libres
  auto?: boolean;         // true si fue generada desde un cobro de OS
  autoOrigen?: "cobranza";
};
```

### `Gasto`

```ts
type Gasto = {
  id: string;
  mes: string;            // ISO yyyy-mm
  concepto: string;
  monto: number;
};
```

### `Presentacion` (cobranzas por OS)

```ts
type Presentacion = {
  id: string;
  mesFacturado: string;   // ISO yyyy-mm: mes al que corresponde
  obraSocial: string;
  pacienteId: string;     // opcional, para distinguir cuando hay varias presentaciones de la misma OS
  monto: number;
  fechaPresentacion: string; // ISO
  fechaCobro: string;        // ISO (vacío si no cobrada)
  estado: "pendiente" | "cobrado" | "rechazado";
  notas: string;
};
```

### `Objetivo` (mensuales por paciente)

```ts
type Objetivo = {
  id: string;
  pacienteId: string;
  mes: string;            // ISO yyyy-mm
  area: "lectoescritura" | "calculo" | "atencion-fe" | "estrategias" | "vincular" | "otro";
  descripcion: string;
  estado: "pendiente" | "en curso" | "logrado" | "suspendido";
};
```

### `Leyenda` (plantillas de facturación)

```ts
type Leyenda = {
  id: string;
  nombre: string;          // por convención = obraSocial
  obraSocial: string;
  pacienteIds: string[];   // vinculados; puede haber varios
  datosFacturacion: string; // CUIT, condición IVA, etc. (sección "Datos de facturación")
  texto: string;           // cuerpo de la leyenda (con variables)
};
```

**Variables soportadas en `texto` y `datosFacturacion`:**
`{paciente}` `{pacienteUC}` `{nombre}` `{apellido}` `{nombreCompleto}` `{nombreCompletoUC}` `{dni}` `{mes}` `{mesAnt}` `{mesUC}` `{mesAntUC}` `{año}` `{ano}` `{fecha}` `{sesiones}` `{sesionesTexto}` (formato "8 (ocho)") `{valor}` `{total}`.

El contexto se arma con el paciente seleccionado + la línea de facturación del paciente en el mes actual (de la vista facturación). Si no hay dato, se reemplaza por `____` o `$ ____`.

### `NotaDia` (calendario)

```ts
type NotaDia = {
  id: string;
  fecha: string;   // ISO yyyy-mm-dd
  texto: string;
};
```

### `NotaLibreta` (anotador personal)

```ts
type NotaLibreta = {
  id: string;
  texto: string;
  hecho: boolean;
  timestamp: number;
};
```

### `ItemPapelera`

```ts
type ItemPapelera = {
  id: string;
  tipo: "paciente"|"sesion"|"turno"|"fac"|"gasto"|"presentacion"|"objetivo"|"reset";
  descripcion: string;
  data: any;             // copia completa del item eliminado
  relacionados?: any;    // para paciente: sesiones, facturacion, turnos asociados
  timestamp: number;
};
// Máximo 200 items en la papelera (FIFO).
```

### `Config`

```ts
type Config = {
  horaInicio: string;     // ej "08:00"
  horaFin: string;        // ej "20:00"
  slotMinutes: 30 | 45 | 60 | 90;
  diasLaborales: number[]; // [1,2,3,4,5,6]
  obrasSociales: string[]; // lista de OS para datalist autocomplete
};
```

---

## Estructura de navegación

Sidebar izquierdo con saludo personalizado + nav vertical:

- **Header sidebar**: "¡Bienvenida, **Melina**!" (con highlight amarillo de pincel detrás del nombre) · "Licenciada en Psicopedagogía" · chip `2026`.
- **Nav**: Hoy · Agenda · Pacientes · Facturación · Plantillas · Papelera (con contador) · Backup.
- **Footer sidebar**: botón "Deshacer último cambio" (Ctrl+Z también).

**Tercera columna (solo en vista "Hoy"):** libreta personal (anotador) tipo papel cuadriculado con fondo crema. Redimensionable en alto y ancho (handle esquina inferior derecha). Tamaño persiste en localStorage. Las notas se guardan en `state.anotador`.

---

## Funcionalidades por vista

### 1. Hoy

- KPIs: pacientes activos · turnos esta semana · sesiones registradas en el mes.
- Sesiones de hoy (turnos del día con hora, paciente y estado). Click → modal turno.
- Próximos turnos (5 más cercanos no cancelados).
- Botones: "🎙 Por voz" (registrar sesión por voz, ver §Grabador) · "+ Nuevo turno".
- Libreta (anotador) a la derecha en pantallas ≥850px.

### 2. Agenda

Toggle **Semana / Mes** arriba.

**Vista Semana**: grilla Lun-Sáb × slots horarios (configurables: 30/45/60/90 min, hora inicio/fin desde Config). Click en celda vacía → nuevo turno con fecha+hora pre-cargadas. Click en chip → editar turno.

**Vista Mes**: grilla 7×6 (semana arranca lunes, días de otros meses con opacity). Cada celda muestra número, hasta 2 turnos compactos, badge violeta con cantidad total. Hoy resaltado en lila. Banderita amarilla si hay nota del día. Click → modal de día con: lista de turnos + textarea de notas libres del día + botón "Nuevo turno".

**Turnos puntuales** (no atados a paciente registrado): checkbox amarillo "📌 Turno puntual" en el modal → reemplaza el selector de paciente por un input "Concepto" libre. Aparecen con chip durazno + ícono 📌.

**Generación automática de turnos**: para cada paciente con `horariosFijos`, al cargar el dashboard se generan turnos del mes actual y siguiente. ID determinístico (`auto_<pid>_<fecha>_<HHMM>`) para evitar duplicados. Función `dedupTurnos()` corre en cada save y al cargar — dedup por id y por combo `pacienteId|fecha|hora`, prefiere turnos con estado distinto a "agendada".

**Sincronización Cobranza → Facturación**: cuando una `Presentacion` queda `estado: "cobrado"` con `fechaCobro`, se genera/actualiza una línea de facturación automática (`id = auto_cobro_<presentacionId>`) en el mes del cobro, con `estadoPago: "abonada"`, chip verde "📥 OS" en la tabla, y bloquea edición desde Facturación (redirige a Cobranzas).

### 3. Pacientes

**Lista**: grid de cards. Activos primero, archivados al final con opacity. Cada card muestra nombre, edad, grado, chips de OS / Particular / cantidad de horarios fijos, cantidad de sesiones registradas.

**Detalle del paciente** (8 pestañas, con `flex-wrap`):

1. **Paciente** — Datos personales (fechaNac/edad calculada, grado, escuela, OS, modalidad, carpetaCTP) · Datos de familia/tutor (CRUD inline) · Horario habitual (CRUD inline, genera turnos al guardar).
2. **Historia clínica** — Motivo de consulta · Antecedentes · Entrevista inicial.
3. **Evaluación** — Pruebas administradas · Diagnóstico/hipótesis · Plan de abordaje.
4. **Objetivos** — Objetivos mensuales (CRUD por área, navegación entre meses, botón "Duplicar de mes anterior", botón "Copiar para skill" que arma un snippet para pegar en el chat con la skill psicopedagógica).
5. **Fortalezas y desafíos** — Dos cards separadas, accent verde (🌱 fortalezas) y durazno (🎯 desafíos).
6. **Sesiones** — Lista agrupada por mes con headers colapsables tipo `📁 Mayo 2026 · 4 sesiones (3 realizadas, 1 planificada)`. Mes más reciente abierto por default. Si hay borrador sin guardar, aparece arriba como card amarilla con borde dashed y badge "📝 BORRADOR" + preview + click para continuar + botón "Descartar". Cada sesión muestra fecha, estado, foco, observaciones (200 chars), thumbs de hasta 6 imágenes con `+N` si hay más.
7. **Cierre** — Evolución · Cierre del tratamiento.
8. **Informes** — Ruta a la carpeta CTP del paciente con botón copiar.

**Header del paciente**: botones "📤 Exportar" (genera markdown completo de la ficha para copiar/pegar en otra conversación con Claude — devolución, informe, etc.) · "Imprimir HC" (window.print, oculta sidebar) · "Editar" (modal paciente) · "Archivar/Reactivar".

### 4. Facturación (4 sub-tabs)

**Mes actual**:
- Tabla por línea: Paciente · Sesiones · Importe · OS/Cobertura · Sub-total · Pago (chip verde "Abonada" / rojo "Debe" / ámbar "X/Y pagas" según `sesionesAbonadas`) · Factura · Detalles. Filas con fondo rosa si "Debe", durazno si parcial.
- Columna **Pago** se basa en `sesionesAbonadas` vs `sesiones` (granular).
- Líneas auto-generadas desde cobranzas tienen chip "📥 OS" verde.
- Bloque "Gastos del mes" (CRUD).
- Bloque "Resumen": Abonado · Pendiente de pago · Gastos · Total mes (neto cobrado = abonado − gastos).
- Bloque "⚠ Pendiente de pago" si hay deudas: lista con paciente, cantidad de sesiones impagas, monto. Total al final. Badges con cantidad de sesiones y pacientes adeudando.
- Parser de montos AR robusto: acepta "150.050,44" (AR), "150050.44" (US), "$ 150.050,44", etc. Detecta formato por presencia de coma y/o número de dígitos tras el punto.

**Cobranzas por OS**: tabla de `Presentaciones` con paciente (opcional, importante cuando hay varias presentaciones de misma OS), monto, estado (chips coloreados), fechas presentación/cobro, demora calculada en días (color: gris/ámbar/rojo según umbral). KPIs presentado/cobrado/pendiente. Al marcar cobrado con fecha → sync automático a Mes actual (ver §sync).

**Resumen anual**: KPIs Abonado/Pendiente de cobro/Cobrado de OS/Gastos. Gráfico de barras por mes. Demora promedio de cobro por OS (colorea naranja >60d, rojo >90d).

**Leyendas**: plantillas de facturación.
- Cada leyenda tiene `obraSocial` (título grande), `pacienteIds[]` (chips), `datosFacturacion` (sección destacada en lila claro), `texto` (sección "Leyenda" debajo).
- Vista previa con variables ya reemplazadas usando el paciente principal del array y el mes en curso de facturación.
- Botón **📋 Copiar**: si hay 1 paciente vinculado, copia directo con variables aplicadas. Si hay varios → abre picker "¿Para qué paciente?" con un botón por cada uno.
- Modal de edición: input OS, checkboxes con scroll para multi-paciente, textarea datos facturación, textarea leyenda, hint con lista de variables disponibles.

### 5. Plantillas

Pantalla estática de referencia: estructura de la carpeta CTP, qué generar con la skill psicopedagógica, documentos administrativos por paciente (plan, presupuesto, autorización OS, informe inicial, planilla asistencia, factura).

### 6. Papelera

Toda eliminación va acá (paciente, sesión, turno, fac, gasto, presentación, objetivo, reset total). Tabla con tipo, descripción, fecha. Botones por item: Restaurar / Eliminar definitivo. Botón global "Vaciar papelera". Contador en sidebar.

### 7. Backup

- Estado (cantidad pacientes/sesiones/turnos, tamaño en KB).
- Botones Exportar JSON / Importar JSON.
- Botón "Borrar todo" (con doble confirmación).

---

## Grabador de sesión por voz

Botón verde **"🎙 Por voz"** en Hoy y en la tab Sesiones del paciente. Abre modal:

- Selector de paciente · Fecha (default hoy).
- Botón "Empezar a grabar" (verde) / "Detener" (rojo) con indicador parpadeante.
- Pre-chequeo `getUserMedia({ audio: true })` antes de SpeechRecognition para forzar prompt de permiso.
- Reconocimiento en `es-AR` con `continuous: true; interimResults: true`. Reinicio automático en `onend` mientras `_voiceState === "recording"` (Chrome corta cada ~1min).
- Mensajes de error inline en card roja (NUNCA `alert()` — bloquea webview de Cowork). Tip visible: si no funciona el mic, usar **Win + H** (dictado de Windows) en el textarea.
- Botón **"✨ Reorganizar con AI"**: llama `window.cowork.askClaude(prompt, [])` con instrucción de devolver JSON estricto con `{foco, observaciones, materiales, proximosPasos}`. Si falla, fallback a "todo en observaciones".
- Borrador automático del texto en `localStorage` con key `consultorio_ctp_borrador_grabacion`. Caduca a los 7 días.
- Al guardar: crea sesión con `estado: "realizada"`, agrupa por paciente, refresca render.

---

## Sistema de borrador (modal de sesión normal)

Storage key: `consultorio_ctp_borrador_sesion`. Caduca a los 7 días.

**Cuándo se guarda:**
1. Auto-save mientras tipea: debounce 200ms en `input` de los textareas.
2. `blur` instantáneo cuando un campo pierde foco.
3. Click en × o "Cancelar".
4. Click fuera del modal (backdrop).
5. `window.beforeunload` (recarga del browser).

**Cuándo se recupera:** al abrir un modal de "Nueva sesión" del mismo paciente. Aparece como banner amarillo arriba del modal + botón "Descartar borrador" + se pre-llenan todos los campos.

**Cuándo se limpia:** al guardar la sesión exitosamente.

**Card visible en la lista de sesiones del paciente**: si hay borrador, se ve arriba como card amarilla con badge "📝 BORRADOR", preview, timestamp, cantidad de imágenes. Click → continuar editando. Botón "Descartar".

---

## Sistema de deshacer (Undo)

Cada delete dispara:
1. `enviarAPapelera(tipo, descripcion, data, relacionados?)` que push a `state.papelera`.
2. Toast abajo del centro con botón "Deshacer" (8 segundos).
3. Botón persistente "↶ Deshacer último cambio" en footer del sidebar.
4. Atajo **Ctrl+Z / Cmd+Z** (excepto cuando el foco está en input/textarea/select).

`doUndo()` toma el último item de papelera, lo restaura según su tipo, y si era paciente también restaura sesiones/facturacion/turnos asociados.

---

## Paleta y estilo

**Filosofía**: pasteles cálidos, fondo blanco, decoraciones sutiles psicopedagógicas, tipografía limpia (NO cursive en general). Inspirado en estética de @espacio.psicope (Instagram).

**Colores principales:**
- Background: `#FFFFFF` (blanco puro).
- Primary lila amigable: `#9B89D9` (botones, tabs activas).
- Primary lila oscuro (hover/headers): `#7E6BC5` · `#6B5BA8`.
- Surface alt (cards activos, hover suave): `#F4F1FA` · `#EEEAF7`.
- Borders: `#E5E0F0` · `#ECE8F5`.
- Text principal: `#2D3142` (grafito azul).
- Text soft: `#6B7390`.
- Text muted: `#8B91A8` · `#A4ABBE`.
- Title: `#1D2138`.

**Acentos:**
- Success / cobrado / realizada: sage `#7FB89A` (bg `#DCEFE2`, text `#2C5C42`).
- Warning / pendiente / parcial: caramelo `#FFB97A` · `#C49560` (bg `#FFEBD5` · `#FFF1D6`, text `#A05F1A`).
- Danger / debe / cancelada: coral `#E68A8A` · `#B85D5D` (bg `#FBE0E0`, text `#8A3030`).
- Highlight amarillo crema (sidebar h1): `#FBE6B0`.
- Borrador (libreta, banner): bg `#FFF8DA` / `#FFFBE9`, border `#F2D27A`.

**Áreas de objetivos:**
| Área | Color | Background |
|------|-------|------------|
| Lectoescritura | `#9B7BA8` | `#EDE5F2` |
| Cálculo | `#B08D5C` | `#F4ECDF` |
| Atención y FE | `#C49097` | `#F2E5E7` |
| Estrategias | `#7A9B7E` | `#E0EDE0` |
| Vincular | `#D08585` | `#F5DAD5` |
| Otro | `#8A7466` | `#F0E5D6` |

**Tipografía:** sans-serif system stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial`), 14px base. NO cursive en UI principal. Highlight amarillo detrás del nombre "Melina" en sidebar como guiño al logo de Psicope.

**Bordes:** redondeados (cards 14px, modales 16px, botones/inputs 9-10px, chips 12px).

**Background pattern del body:** SVG inline con trazos de pincel orgánicos multicolor (amarillo crema, menta, durazno, lavanda, rosa pálido) y dots dispersos. Tile 620x620, opacity 0.35, fixed. Sutil, no compite con el contenido.

**Formato monetario argentino:** `$ 124.000` con punto como separador de miles, coma para decimales. `fmtMoney(n)` para mostrar, `parseMoney(s)` para leer (acepta AR, US, con/sin signo).

---

## Convenciones técnicas relevantes

1. **Light mode obligatorio** (`<html lang="es-AR">`, `:root { color-scheme: light }`).
2. **Sin librerías externas** salvo whitelist (Chart.js, Grid.js, Mermaid). En la versión Next, libertad total.
3. **Cada delete envía a papelera** en vez de eliminar; nunca delete sin papelera.
4. **Edits siempre por modal**, eliminaciones siempre con `enviarAPapelera` + toast con undo.
5. **Migración aditiva** del state: nunca pisar lo editado por la usuaria. Si en INITIAL_STATE aparecen campos nuevos, agregar solo a items que no los tengan.
6. **Convención de IDs de pacientes:** kebab-case `<apellido>-<nombre>` (ej `ferreyra-felipe`). Display: `Apellido, Nombre`.
7. **Spellcheck `es-AR`** en todos los inputs/textareas. En Cowork desktop no muestra sugerencias (limitación del webview); en browsers normales sí.
8. **Imágenes**: resize cliente con canvas a max 900px lado largo, JPEG calidad 0.78. Se guardan como base64 en `Sesion.imagenes`. En Next, conviene pasar a un blob storage (Vercel Blob, S3) y guardar solo URLs en la DB.

---

## Datos pre-cargados actualmente

**Pacientes (16):** Dante Ferrero (DASUTEN), Dante Aristegui (OSPIT), Tahiel Contreras (UNION PERSONAL), Benjamin Suarez (SUMA — $124k), Leon Gonzalez Orozco (OSDE), Felipe Ferreyra (Medife — $146k), Isabella Galarraga (particular — $30k), Jose Ignacio Espina (particular-MEDIFE — $28k), Juana Casabone Larrañaga (particular — $30k), Giovanni Zabaleta (particular-GALENO — $30k), Mateo Barzola (particular-IOMA — $30k), Antonia de Francesco (particular — $30k), Tomas Perez Bazo (OSDE — $102.176), Amelie Silva (particular — $30k), Thiago D'Agosto (particular — $30k), Nando Pontin (PAMI — $65k).

**Facturación 2026:** Enero-Mayo cargado con líneas reales (50+ items, gastos de alquiler/otros mes a mes, presentaciones a OS con tracking de cobranza).

**Objetivos Mayo 2026:** 36 objetivos para 10 pacientes (Amelie, Juana, Tomas, Thiago, Mateo, Leon, Felipe, Isabella, Benjamin, Antonia), agrupados por área.

**Leyendas (5):** OSDE (Tomas + Leon), MEDIFE (Felipe), SUMA (Benjamin), UNION PERSONAL (Amelie), OSDEPYM (Thiago) — todas con variables dinámicas y datos de facturación separados.

---

## Tareas pendientes / mejoras posibles

- **Búsqueda global** de pacientes por nombre (la lista crece y va a costar encontrar). Crítico cuando hay >20 pacientes.
- **Vista "Tareas pendientes"** consolidada — informes a entregar, facturas a presentar, asistencias por completar.
- **Recordatorios / notificaciones** ("Felipe no viene hace 2 semanas", "Falta factura de marzo de Mateo").
- **Gráfico de evolución por paciente** (sesiones por mes, objetivos logrados a lo largo del tiempo).
- **Importación de Excel** para futuras planillas mensuales.
- **Búsqueda en la papelera**.
- **Histórico de cambios (auditoría)** por paciente, más allá de la papelera.
- **Multi-usuario / auth** (cuando migre a Next esto es natural).
- **Sincronización móvil real** (cuando esté en Next con DB, esto se resuelve solo).
- **PWA / instalable en celu**.
- **Imágenes a blob storage** en lugar de base64 en DB (más performante).
- **Botón "Enviar a familia"** para devoluciones automáticas (a explorar).

---

## Cómo trabajar con Melina

- Tutearla, registro profesional cálido.
- Es psicopedagoga clínica argentina (rioplatense). Valora la coherencia clínica más que la sofisticación técnica.
- Trabaja con niños 7-12 años (algunos más chicos).
- Está muy abierta a iterar — si una feature no funciona en su workflow, lo va a decir.
- Le importa: poder editar todo desde el dashboard, no perder datos por error (papelera + undo), respetar la estructura física existente de su carpeta CTP, no que la UI sea invasiva.
- **No le gusta**: cursive en la UI (la sacamos), exceso de tonos rosados (preferir lila friendly + acentos varios), banner/modales que tapen mucho, alerts bloqueantes.
- **Le gusta**: highlight amarillo detrás de "Melina", colores pasteles balanceados, bordes redondeados, indicaciones claras de qué está pasando (toast, banners suaves).
- Si pide algo que requiere herramientas que no funcionan en la sesión (sandbox caído), avisarle y poner el pedido en cola — no ignorar el blocker.

---

## Cómo arrancar la otra conversación

Pegale al nuevo agente este documento completo + el link a tu repo de Next + URL de Vercel. Después le decís lo que quieras seguir trabajando. El agente nuevo va a tener todo el contexto del feature set y el modelo de datos sin necesidad de empezar de cero.
