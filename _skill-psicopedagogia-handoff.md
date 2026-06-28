# Skill `psicopedagogia-materiales` — Handoff

Documento para pasar contexto a otro agente que continúe trabajando sobre la skill de Cowork **psicopedagogia-materiales** de Melina Sol.

> **Alcance:** este handoff describe la estructura, contenido y lógica de la skill tal como quedó instalada. Si el otro agente va a continuar trabajando dentro de la misma carpeta de la skill, este documento le da el mapa. Si va a hacer una reescritura desde cero (por ejemplo, migrar a otra forma de skill), también le sirve como inventario de lo que debe replicar.

---

## Qué es la skill

Una skill de Cowork (formato `.skill`) que le da al agente la "impronta clínica" de Melina cuando se le piden materiales psicopedagógicos. Cubre:

- Marco teórico (encuadre clínico de Melina + guías de evaluación de **Melina Bella**).
- Reglas de organización del consultorio CTP (estructura de carpetas, dónde vive qué).
- Cómo leer informes de pacientes (escolares, fono, psicología, neurocog, ADOS, WISC, etc.).
- Banco de fichas modelo reales de Melina (10 PDFs) con patrones de diseño extraídos (personajes recurrentes, tono, estructura).
- Índice de informes y documentos existentes por paciente.
- Pictogramas SVG reutilizables.
- Sistema de snapshot: la skill lee `_dashboard-snapshot.json` exportado desde el dashboard para conocer datos vivos de los pacientes (grado, dx, objetivos vigentes, últimas sesiones).

---

## Ubicaciones físicas

- **Skill empaquetada (lista para instalar):**
  `C:\Users\Melina_Sol\OneDrive\Documentos\CTP\psicopedagogia-materiales.skill` (≈38 MB)
- **Carpeta editable (donde se hacen los cambios):**
  `C:\Users\Melina_Sol\OneDrive\Documentos\CTP\_skill-psicopedagogia-materiales\` (con guión bajo al inicio para distinguirla de la instalada)
- **Skill instalada en Cowork:**
  `%APPDATA%\Claude\local-agent-mode-sessions\skills-plugin\1f49e807-ef6c-49ac-9fc1-22f33585b46b\b39cd0f7-913b-4cff-92ef-68b27729dc26\skills\psicopedagogia-materiales\`
- **Snapshot del dashboard (consume la skill):**
  `C:\Users\Melina_Sol\OneDrive\Documentos\CTP\_dashboard-snapshot.json`
- **Carpetas de pacientes (la skill las referencia):**
  `C:\Users\Melina_Sol\OneDrive\Documentos\CTP\<año>\<Nombre Apellido - OS ...>\`

---

## Estructura interna de la skill

```
psicopedagogia-materiales/
├── SKILL.md                              # entry point, frontmatter + instrucciones del agente
├── INSTALL.md                            # instrucciones de instalación para Melina
├── references/                           # 13-14 .md con marco clínico
│   ├── evaluacion-psicopedagogica.md    # contenido de las dos guías de Melina Bella
│   ├── lectura-informes.md              # cómo procesar informes que llegan al consultorio
│   ├── organizacion-consultorio.md      # estructura de CTP/, qué vive dónde
│   ├── indice-informes-pacientes.md     # mapa por paciente de qué documentos existen y en qué ruta
│   ├── produccion-escrita.md            # marco teórico de producción escrita
│   ├── fundamentos-neurocognitivos.md   # FE, memoria, atención, inhibición
│   ├── lectoescritura.md
│   ├── calculo.md
│   ├── atencion-fe.md
│   ├── estrategias-aprendizaje.md
│   ├── vincular-emocional.md
│   ├── trastornos-aprendizaje.md
│   └── (otras según se hayan ido sumando)
├── assets/
│   ├── fichas-modelo/
│   │   ├── README.md                    # patrones de diseño extraídos de las 10 fichas
│   │   └── originales/                  # 10 PDFs reales de Melina (≈35 MB)
│   │       ├── PruebaPedagogicaLecto.pdf
│   │       ├── DISLEXIA-animales-letras-espejo.pdf
│   │       ├── MEGA-CUADERNILLO-ALFABETIZACION.pdf
│   │       ├── NOCIONES-MATEMATICAS.pdf
│   │       ├── Casita-de-numeros-2026.pdf
│   │       ├── NUMERACION-10-AL-100.pdf
│   │       ├── VALOR-POSICIONAL.pdf
│   │       ├── Calculo-mental-EspacioPsicope.pdf
│   │       ├── KIT-OPERATORIA.pdf
│   │       └── MATEMATICA-2024-alienigenas.pdf
│   └── pictogramas/                     # SVGs reutilizables
│       └── *.svg
```

---

## Reglas clave del `SKILL.md`

(Reconstruidas de los cambios hechos en la sesión original. Si el agente va a editar el SKILL.md, deben preservarse estas reglas o adaptarlas.)

1. **Antes de generar cualquier material para un paciente nombrado:**
   - Leer `_dashboard-snapshot.json` (en la raíz de CTP) para obtener grado, dx, objetivos vigentes y últimas sesiones del paciente. Si el snapshot existe y el paciente está, **no preguntar el grado** — usar lo que está ahí.
   - Si el paciente está en `references/indice-informes-pacientes.md`, **abrir su informe de evaluación** (PDF/DOCX en la ruta indicada) antes de preguntar nada. Recién después de leerlo, pedir lo que falte.

2. **Al diseñar fichas / material visual:**
   - Consultar `assets/fichas-modelo/README.md` para el patrón general.
   - **Además abrir los PDFs reales** correspondientes al tipo de material pedido (lectoescritura → 3 modelos; matemática → 7 modelos). Replicar tipografía, estilo de imágenes, distribución, tono, personajes.

3. **Tono y encuadre clínico:**
   - Rioplatense, cariñoso pero no infantilizante.
   - Vocabulario psicopedagógico preciso.
   - Encuadre fenomenológico-clínico cuando se interpreta material o se diseña intervención (siguiendo guías de Melina Bella).

4. **Privacidad:**
   - Los informes clínicos NO están embedded en la skill (privacidad + tamaño). La skill solo tiene el **índice de qué existe y dónde**. Cuando hace falta el contenido literal, se lee el archivo en el momento.

---

## Patrones de diseño extraídos (resumen del banco de fichas)

Del análisis de las 10 fichas modelo originales se extrajeron estos patrones reusables:

- **Personajes recurrentes**: animales (de fichas de lectoescritura), dinosaurios, piratas, alienígenas (sets temáticos por habilidad).
- **Una sección = una habilidad**: las fichas no mezclan, cada bloque trabaja UN aspecto.
- **Definiciones explícitas antes de los ejercicios**: si trabaja "valor posicional", primero hay un cuadro recordatorio del concepto.
- **Vocabulario matemático identificado**: términos como "antecesor / sucesor", "decena / centena", "operatoria" se usan literal, no parafraseados.
- **Consignas en imperativo en mayúsculas**: ej. *"ESCRIBÍ EL NÚMERO ANTERIOR"*, *"DIBUJÁ TANTAS PATAS COMO INDIQUE EL CARTEL"*.
- **Tono cariñoso pero serio**: no usa "amiguito", sí usa "podés", "te invito a", "vamos a probar".
- **Material manipulativo cuando aplica**: recortables, casitas armables, ruletas para imprimir.
- **Tipografía Comic Sans MS o similar redondeada** para el cuerpo, sans-serif gruesa para títulos.
- **Pictogramas vector** que se pueden recolorear (rojo/azul/verde) sin perder claridad.

---

## Sistema de snapshot dashboard ↔ skill

El dashboard tiene en su pestaña **Backup** una tarjeta "Snapshot para la skill" con un botón que descarga `_dashboard-snapshot.json`. Melina lo guarda en la raíz de CTP. La skill lo lee cada vez que se nombra un paciente.

**Schema esperado del snapshot** (resumen — la implementación actual está en el código del dashboard v1):

```json
{
  "generadoEn": "2026-06-15T10:30:00.000Z",
  "pacientes": [
    {
      "id": "ferreyra-felipe",
      "nombre": "Felipe",
      "apellido": "Ferreyra",
      "edad": 9,
      "grado": "3°",
      "escuela": "...",
      "obraSocial": "Medife",
      "diagnostico": "Hipótesis: dislexia + dificultades de FE...",
      "motivoConsulta": "...",
      "fortalezas": "...",
      "desafios": "...",
      "objetivosVigentes": [
        { "mes": "2026-05", "area": "lectoescritura", "descripcion": "Estimular fluidez...", "estado": "en curso" }
      ],
      "ultimasSesiones": [
        { "fecha": "2026-05-15", "foco": "...", "observaciones": "..." }
        // hasta 5
      ]
    }
  ]
}
```

**Si el proyecto del dashboard se migró a Next + DB**, este snapshot puede generarse desde un endpoint API (`GET /api/snapshot`) que devuelve el mismo schema, y la skill puede leer un archivo descargado o, si Cowork lo permite, hacer fetch al endpoint directamente.

---

## Pacientes del índice de informes

Hay 19 pacientes mapeados en `references/indice-informes-pacientes.md` (incluye algunos que no están todavía cargados en el dashboard, como Agustín Marino, Juana Bergara, Rosalia Soriano). Por cada uno se lista:

- Nombre + obra social/modalidad + año de la carpeta.
- Ruta de la carpeta principal (`2025/...` o `2026/...`).
- Documentos clínicos existentes con nombre exacto: informes psicopedagógicos, planes de abordaje, ADOS, observaciones áulicas, WISC, constancias, orientaciones, historia social, devoluciones, anexos.
- Si tiene subcarpeta `INFORMES/` o `Informes/`, se distingue.
- **Excluye** lo administrativo (facturas, asistencias mensuales).

El índice es estático: cuando Melina suma pacientes o informes, hay que **regenerarlo** (se hace pidiéndole al agente *"actualizá el índice de informes"* y escanea CTP nuevamente).

---

## Cómo instalar la skill (referencia para Melina)

Si el otro agente o Melina necesitan reinstalar:

1. Cerrá Cowork por completo.
2. Abrí: `%APPDATA%\Claude\local-agent-mode-sessions\skills-plugin\1f49e807-ef6c-49ac-9fc1-22f33585b46b\b39cd0f7-913b-4cff-92ef-68b27729dc26\skills\`
3. Borrá la carpeta `psicopedagogia-materiales` si existe.
4. Desde `C:\Users\Melina_Sol\OneDrive\Documentos\CTP\`, copiá la carpeta `_skill-psicopedagogia-materiales`.
5. Pegala en `skills\` (paso 2).
6. Renombrala sacándole el guión bajo del principio → debe quedar `psicopedagogia-materiales`.
7. Reabrí Cowork.

---

## Cómo trabajar con Melina (igual que en el handoff del dashboard)

- Tutearla, registro profesional cálido.
- Es psicopedagoga clínica argentina (rioplatense). Valora la coherencia clínica más que la sofisticación técnica.
- Trabaja con niños 7-12 años (algunos más chicos).
- Está muy abierta a iterar — si una feature/regla no funciona en su workflow, lo va a decir.
- Le importa que la skill capte SU encuadre (Bella + experiencia clínica), no producir genéricos.
- Si pide algo que requiere herramientas no disponibles (sandbox caído), avisarle y poner el pedido en cola.

---

## Mejoras posibles / pendientes

- **Más fichas modelo**: Melina mencionó que tiene más (no las pasó todavía). Cuando lleguen, sumarlas a `assets/fichas-modelo/originales/` y actualizar el README de patrones.
- **Regla del SKILL.md para usar Excel/PowerPoint**: hoy se enfoca en fichas en PDF/imagen. Si necesita generar planillas o presentaciones, falta una regla específica que integre con `xlsx`/`pptx` skills base de Cowork.
- **Endpoint para snapshot**: cuando el dashboard esté en Next, evaluar si la skill puede hacer fetch directo del endpoint en lugar de leer archivo local (depende de si Cowork permite fetch desde skill).
- **Versionado del snapshot**: agregar campo `version` al JSON para que la skill detecte snapshots viejos y avise.
- **Inclusión de evaluaciones más recientes**: si Melina actualiza el dx o pruebas administradas de un paciente, asegurar que el snapshot refleje eso (campo "ultimaActualizacion" por paciente).
- **Multilingüe**: la skill hoy es solo en español rioplatense. No es prioridad pero queda anotado.

---

## Cómo arrancar la otra conversación

Pegale al nuevo agente este documento + el handoff del dashboard. Después le decís lo que quieras seguir trabajando. El otro agente va a tener todo el contexto sin necesidad de empezar de cero.
