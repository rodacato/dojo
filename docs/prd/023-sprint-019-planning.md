# PRD-023: Sprint 019 — Course content quality v2 (pedagogy)

> **Status:** draft
> **Date:** 2026-04-16
> **Author:** Lucía Navarro (S4) — input del panel curricular: Dr. Elif Yıldız (S5), Valentina Cruz (S2), Soren Bachmann (C6), Dr. Emeka Obi (S6), Bruno Tanaka (JS), Sofia Marchetti (SQL), Priya Menon (C1)

---

## Idea en una frase

Cerrar los carry-forwards pedagógicos de Sprint 018 — slots semánticos renderizados, external references por sub-course, "alternative approaches" post-pass y el LAG/LEAD intro — para que los 3 cursos shippeados respeten el framework antes de tocar acquisition (share cards) o expandir el catálogo.

---

## Por qué ahora

Sprint 018 cerró la **estructura** del catálogo: schema `step.title` / `step.solution`, reclasificación `exercise` vs `challenge`, solution reveal post-pass, CI gate `validate:courses`. Pero explícitamente descopó 4 items que viven en la misma capa — la **pedagogía**:

- **Part 4 (slots renderer)** quedó sin shippear por budget. Sin él, instructions con `## Why this matters` / `## Your task` / `## Examples` se ven iguales que cualquier otro markdown — el autor lo escribe, el learner no lo percibe.
- **External references (§8 del framework)** — 0/3 cursos citan books, docs o talks. El framework lo lista como requerido.
- **"After solving: alternative approaches"** — collapsible post-pass que muestra un segundo approach idiomático. Soren lo pide desde Sprint 015; Sprint 018 no lo tocó porque "solution reveal" era el mínimo viable. Ahora que el tab 🔒 Solution existe, agregar un segundo approach es una extensión natural.
- **SQL L1.4 LAG/LEAD intro** — Sofia Marchetti lo marcó como "would push past ≤15 steps" durante Sprint 018. Ahora que sabemos que TS quedó en 11, hay budget en SQL (12 steps post-018) para meterlo sin romper el sizing.

Si arrancamos share cards o migración de TS/JS DOM a público antes de cerrar esto, consolidamos una versión del contenido que el panel curricular ya identificó como incompleta. "Use it before building around it" aplica aquí — el "it" es el contenido, no la tech.

---

## Perspectivas

### Como learner abriendo SQL Deep Cuts L1.3 (running totals)

El step me enseña `SUM(...) OVER (ORDER BY ...)` y pasa al challenge de L3.3. En el medio — nada sobre `LAG` / `LEAD`, que son las otras window functions básicas. Cuando llego al challenge ("slow churn report") necesito comparar month-over-month y el framework asume que sé hacerlo. La curva tiene un hueco.

Paso el step. Aparece la pestaña 🔒 Solution → destrabada. Bien. Pero no hay **otra forma de hacerlo**. ¿Es mi versión la idiomática o solo "una" correcta? No sé.

Abro el curso y no hay un link a la docs de SQLite, a `Use The Index, Luke!`, a nada. ¿Cómo profundizo si quiero? Google.

### Como author escribiendo un step

El framework de `docs/courses/README.md` dice que use `## Why this matters` / `## Your task` / `## Examples`. Los escribo. Render: markdown plano — pierdo la señal visual que los distingue. ¿Vale la pena respetar el convention si no tiene impacto? El próximo autor los va a omitir.

### Como la plataforma

Sprint 018 cerró el schema; los 3 cursos respetan la taxonomía. Sprint 019 cierra la capa encima — cómo se **lee** y cómo se **conecta** cada step. Misma intención, nivel superior. Después de esto, la decisión de abrir TS/JS DOM al público, o arrancar share cards, se toma sobre una base consistente.

---

## Tensiones

| Tensión | Resolución |
|---|---|
| Slots renderer — detectar automáticamente vs marker explícito | Detectar el literal `## Why this matters` / `## Your task` / `## Examples` / `## Edge cases` al inicio del instruction. Backwards compat total: si no aparecen, render normal. Spec 024 ya lo diseñó así. |
| External references — un campo por sub-course vs por step | Por sub-course. §8 del framework lo pide al nivel del sub-course ("what did we draw from?"). Granularidad por step es noise. |
| "Alternative approaches" — un segundo `solution` o texto libre | Texto libre (`alternativeApproach?: string` en `StepDTO`, visible post-pass junto al Solution tab). Hacer "un segundo solution" con testCode propio duplica validación sin ganar pedagogía. |
| Alt approach — tab separado o dentro del Solution tab | Dentro del Solution tab, como segunda sección colapsable debajo de "Reference solution". Un tab nuevo infla la UI por un add-on opcional. |
| SQL L1.4 LAG/LEAD — ¿empuja el sub-course a 13 steps? | Sí — SQL queda en 13 (post-018 en 12). Framework permite hasta ~15 por sub-course. Margen. |
| Retrieval interleaving (Dr. Elif) — incluir o defer | **Defer a Sprint 020.** Es un cambio pedagógico profundo (Lesson N usa ids de Lesson N-1), requiere audit cruzado curso-por-curso, PRD propio. Sprint 019 son deltas acotados sobre 018; retrieval es nueva dirección. |
| Diff visual learner vs reference | **Defer.** Sólo si Part 1-4 cierran rápido. Sin diff, el aprendizaje ya mejora; con diff es polish. |

---

## Scope — Sprint 019

### Part 1 — Semantic slots renderer (carry-forward de Sprint 018 Part 4)

**File:** `apps/web/src/pages/CoursePlayerPage.tsx` → `MarkdownContent`

- Detectar los 4 headings literales al inicio del instruction: `## Why this matters`, `## Your task`, `## Examples`, `## Edge cases`
- Render como cards distintas (accent / neutral / muted / warning) respetando BRANDING.md
- Fallback total: si no aparecen slots, render markdown normal
- Unit test: `renderSlots(md)` retorna array cuando el instruction abre con slot, `null` en caso contrario

**No:** no migrar instructions existentes a slots en este sprint. Los autores que quieran usarlos, escriben el markdown con esas headings. El renderer está habilitado.

### Part 2 — External references por sub-course (framework §8)

**Schema migration 0015:**
- `sub_courses.external_references TEXT NULL` (JSON array de `{title, url, kind: 'book' | 'docs' | 'talk' | 'article'}`)

**Backfill:**
- SQL Deep Cuts → `Use The Index, Luke!`, `SQLite docs: Window functions`, `Learn SQL the Hard Way`
- JS DOM Fundamentals → `MDN: DOM introduction`, `MDN: Event delegation`, `You Don't Know JS: DOM`
- TypeScript Fundamentals → `TypeScript Handbook`, `Effective TypeScript (Dan Vanderkam)`, `Matt Pocock's TS Tips`

_Referencias exactas a validar con Dr. Emeka / Bruno / Sofia durante spec._

**DTO + UI:**
- `SubCourseDTO` añade `externalReferences: ExternalReference[]`
- Sección "Further reading" al final del sub-course sidebar (o en el course landing) — list de links con ícono por `kind`

### Part 3 — "Alternative approach" post-pass

**Schema migration 0015 (misma migration, campo adicional):**
- `steps.alternative_approach TEXT NULL` (markdown libre)

**Backfill:**
- Rellenar `alternative_approach` sólo en los steps donde realmente haya un segundo approach idiomático. Pasada editorial por sub-course. Target inicial: 6-8 steps (no los 19 solucionables).

**DTO + UI:**
- `StepDTO` añade `alternativeApproach?: string | null` (expuesto al learner **sólo post-pass**, igual que `solution`)
- `GET /learn/courses/:slug/steps/:stepId/solution` extiende response a `{ solution, alternativeApproach? }`
- Solution tab: debajo de "Reference solution", sección colapsable "Alternative approach" (si hay). Sin espacio si `alternativeApproach` es null.

**validate:courses:** no aplica a `alternative_approach` (texto libre, no ejecutable).

### Part 4 — SQL L1.4 LAG/LEAD intro

**Content-only** — cambio en `seed-sql-deep-cuts.ts`:

- Nuevo step `L1.4` tipo `exercise` titulado "Compare each row to the previous"
- Introduce `LAG(amount, 1) OVER (ORDER BY month)` con test simple (month-over-month delta)
- Solution + test code + mesurable pass criteria
- Total SQL Deep Cuts queda en 13 steps (framework permite ≤15)

---

## Qué NO está en Sprint 019

- **Retrieval interleaving** (Lesson N usa ids de Lesson N-1) — Sprint 020 o propio PRD. Cambio pedagógico profundo, cross-curso.
- **Diff visual** learner vs reference solution — polish. Defer.
- **Share card de completación + badge por curso** — Amara. Acquisition, no pedagogía. Defer post-019.
- **Migrar TS Fundamentals + JS DOM a público** — sigue dependiendo de validar que SQL Deep Cuts retiene. Defer.
- **Python course** — defer hasta que el quality loop esté cerrado.
- **"Ask the sensei" on-demand en course player** — Yemi, Phase 2 del CODE_SCHOOL_PLAN.

---

## Opciones evaluadas

### Option A: Pedagogy carry-forwards (elegida)

Cerrar los 4 items descopados de Sprint 018 + el LAG/LEAD. Sprint acotado, aditivo, sin tocar core. Migration 0015 chica (2 columnas).

**Pros:** Cierra la deuda pedagógica abierta. No interrumpe share cards — Sprint 020 arranca limpio. `externalReferences` + `alternativeApproach` son campos que **sobreviven** al contenido actual (útiles en cualquier curso futuro).
**Contras:** Sprint "boring" — no desbloquea nuevas capabilities visibles al usuario, excepto slots y alt approach. Share cards se retrasa.
**Mitigación:** Sprint corto, scope ajustado (3 parts contentosas + 1 content-only). Si Part 3 infla, sale completo y se redistribuye.

### Option B: Arrancar share cards + badge por curso ahora

Aprovechar que el contenido "está bien" y atacar acquisition. Amara / Priya push.

**Descartado:** Priya: "no shippeamos acquisition sobre contenido que sabemos que tiene huecos". El panel curricular ya identificó las gaps; cerrarlas es la jugada honesta.

### Option C: Retrieval interleaving + slots

Slots + pedagogía profunda (Dr. Elif). Sprint grande, cambio cross-curso.

**Descartado:** Retrieval interleaving es un PRD propio — decidir cómo se estructura la dependencia entre lessons es diseño, no ejecución. Forzar dos cambios grandes en un sprint rompe el principio "thin vertical slices".

---

## Expert panel notes

**Dr. Elif Yıldız (S5):** Slots renderer es el que más impact tiene por complejidad — cheap to ship, makes the framework visible. External references también. Retrieval interleaving necesita su propio PRD; no lo mezclen en Sprint 019.

**Valentina Cruz (S2):** Alternative approach + slots renderer juntos cierran la UX post-pass que siempre faltó — "lo resolviste, acá hay una referencia y acá hay otra forma de pensarlo". Budget: no más de 8 steps con alternativeApproach en v1.

**Soren Bachmann (C6):** Slots como cards con color distinto. Alternative approach dentro del Solution tab, no tab nuevo. Further reading al final del sub-course, no en cada step.

**Dr. Emeka Obi (S6 — TS):** External references para TS: TypeScript Handbook (canónico), Effective TypeScript (Vanderkam), Matt Pocock. Alt approach para L1.3 (greet): `const greet = (name: string) => ...` arrow + template literal vs function + concat.

**Bruno Tanaka (JS):** External references: MDN DOM + Event delegation + YDKJS. Alt approach ejemplo: L1.2 querySelector vs getElementById cuando hay id único.

**Sofia Marchetti (SQL):** L1.4 LAG/LEAD finalmente entra — budget ya lo permite (SQL queda en 13/15). External references: `Use The Index, Luke!` es canónico, `SQLite docs: Window functions` específico al harness, `Learn SQL the Hard Way` como entrada.

**Priya Menon (C1):** Sprint 019 es pasada de calidad v2. No mezclar con share cards. Orden: Part 1 (slots, unlocks author effort) → Part 2 (external refs, visible) → Part 3 (alt approach, schema + content) → Part 4 (LAG/LEAD, content-only). Cortar cualquier parte antes de inflar el sprint.

---

## Carry-forwards a Sprint 020

- **Retrieval interleaving** entre lessons (Dr. Elif — PRD propio)
- **Diff visual** learner solution vs reference (Soren)
- **Share card de completación + badge por curso** (Amara — acquisition)
- **Migrar TS + JS DOM a público** (si SQL Deep Cuts valida retention)

---

## Next step

- [ ] Crear spec: `docs/specs/025-sprint-019-course-quality-v2.md`
- [ ] Activar `docs/sprints/current.md` con las 4 parts
- [ ] Mover items movidos a Sprint 019 fuera de `docs/sprints/backlog.md` "Sprint 019 candidates"
