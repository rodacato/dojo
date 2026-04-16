# PRD-022: Sprint 018 — Course content quality v1

> **Status:** advancing to spec
> **Date:** 2026-04-16
> **Author:** Lucía Navarro (S4) — input del panel curricular: Dr. Elif Yıldız (S5), Valentina Cruz (S2), Soren Bachmann (C6), Dr. Emeka Obi (S6), Bruno Tanaka (JS), Sofia Marchetti (SQL), Hiroshi Nakamura (S1), Yemi Okafor (C4), Priya Menon (C1)

---

## Idea en una frase

Cerrar la primera brecha entre el framework `docs/courses/README.md` y los 3 cursos shippeados, restaurando la distinción `exercise` vs `challenge`, separando `step.title` y `step.solution` en el schema, reclasificando los 27 steps existentes y limpiando los problemas de progresión que el panel identificó por curso.

---

## Por qué ahora

Sprint 017 cerró con SQL Deep Cuts en vivo, harness unificado y UI con tabs Tests/Output, hint revelable y error cards. El UX de curso está en buen lugar. El **contenido** no:

- Los 27 steps de los 3 cursos están todos marcados como `read` o `challenge`. **Ningún step es `exercise`** — la distinción del framework (warmup 80% confidence vs stretch 40% confidence) se perdió en el seed inicial. El learner no tiene señal de cuándo debe sentirse confiado vs cuándo se está estirando.
- TS Fundamentals **no tiene un solo challenge real**. Viola §4.3 ("zero challenges = cut").
- `step.title` no existe como campo top-level — se extrae con regex del `# heading` del markdown, frágil y heredado del bug de Sprint 014.
- `step.solution` no existe — el learner no puede ver una implementación de referencia después de pasar, ni el CI puede validar que el harness sea coherente con la spec del autor (Hiroshi).
- Bugs de progresión específicos por curso: TS introduce template literals sin enseñarlos; JS DOM omite `getElementById`; SQL tiene un step con working memory load excesivo.

Si seguimos añadiendo cursos (Python pendiente, Rust planeado en CODE_SCHOOL_PLAN), heredan estos defectos. Sprint 018 es la pasada de calidad antes de escalar el catálogo.

---

## Perspectivas

### Como learner que abre el primer step de TS Fundamentals

"Step 2" en el sidebar no me dice nada. El header del step dice "Exercise: Write a greet function" — entonces **está marcado como challenge** (⚡ icono) pero la consigna habla en imperativo plano. ¿Tengo que estirarme o es warmup? ¿Cuánto tiempo me debo dar? Y si paso, ¿hay forma de ver cómo lo escribió el autor para comparar mi solución? No. Solo puedo seguir.

### Como creator escribiendo un nuevo curso

El framework de `docs/courses/README.md` me dice que respete una distribución 30/55/15 (read/exercise/challenge), que use slots semánticos, que rellene `solution`. Pero abro `seed-courses.ts` y veo que el schema solo tiene `read | code | challenge`. Tengo que dejar el `exercise` fuera o pretender que todos son challenges. El framework no es ejecutable.

### Como la plataforma

Tres cursos en producción, framework escrito post-hoc en abril, brecha visible entre los dos. La opción honesta es alinearlos antes de que la brecha se vuelva tradición. La opción cobarde es declarar los 3 cursos "legacy" y aplicar el framework solo a los nuevos. Elegimos la primera.

---

## Tensiones

| Tensión | Resolución |
|---|---|
| ¿Reescribir los 3 cursos o solo añadir el schema y backfill mecánico? | Mecánico primero (Part 1), audit de calidad por curso después (Part 2). Bloquear el schema work detrás de la calidad sería sprint creep. |
| `step.solution` visible al learner antes o después del pass | Después. §5.4 lo dice explícito ("hidden until pass"). Ver la solución antes corta el aprendizaje. |
| ¿Migrar los `challenge` actuales a `exercise` o al revés? | A `exercise` por default, dejar `challenge` solo donde el contenido **realmente** estira (3 steps confirmados). |
| Slots semánticos `## Why this matters` / `## Your task` ¿hard requirement o opcional? | Opcional con backwards compat. Sprint 018 los renderiza si están; los autores migran sus cursos cuando puedan. |
| ¿Schema migration o re-uso de un campo existente? | Migration. `type` necesita un nuevo valor enum (`exercise`); `title` y `solution` son columnas nuevas. La migración es chica (3 columnas, default null) y reversible. |
| ¿Mostrar la solución como diff vs. la del learner? | No en Sprint 018. Por ahora un panel de "Reference solution" plano. Diff es polish posterior. |

---

## Scope — Sprint 018

### Part 1 — Schema, taxonomy, layout (infra)

**Schema migration 0014:**
- `steps.title TEXT NULL` (UI usa este si está, fallback al regex actual)
- `steps.solution TEXT NULL` (oculto al learner hasta pass)
- `step.type` enum acepta `'exercise'` además de `'read' | 'code' | 'challenge'`

**Backfill (vía seed re-run):**
- Extraer el primer `# Heading` del `instruction` actual a `step.title`, limpio (sin prefijos `Exercise:` / `Challenge:`)
- Reclasificar los 27 steps:
  - `read` → `read` (sin cambios)
  - `challenge` → `exercise` por default. Excepciones explícitamente marcadas como `challenge`:
    - JS DOM L3.3: "Fix the event delegation bug"
    - SQL Deep Cuts L3.3: "Slow churn report rewrite"
    - TS Fundamentals L3.3: "Palindrome checker" (mantener como challenge, pero ver Part 2)

**DTO + Admin:**
- `StepDTO` añade `title?: string | null` y `solution?: string | null`
- Admin courses page muestra title + tipo en el listado expandible (opcional v1)

**Frontend layout:**
- `extractStepTitle` retirado a favor de `step.title ?? <regex fallback>` (transición sin breaking)
- Sidebar: distintivo visual `exercise` (icono `📝`) vs `challenge` (`⚡`) vs `read` (`📖`)
- StepEditor H1: usa `step.title` directo

### Part 2 — Reclassify + audit + content fixes (contenido)

Una pasada por cada curso aplicando los hallazgos del panel:

**SQL Deep Cuts** (más limpio, primero):
- L2.2 "Refactor nested subqueries" — partir el query input (12 líneas → 6 líneas) o split en dos exercises
- (opcional) L1.4 nuevo: `LAG`/`LEAD` antes del challenge final — solo si entra en el time budget

**JS DOM Fundamentals:**
- L1.1 explanation: añadir `getElementById` mention con su trade-off vs `querySelector`
- L3.3 challenge hint: rephrase para hablar del concepto ("¿qué pasa cuando el click cae en un descendiente del `<li>`?") en vez de revelar `closest("li")`

**TS Fundamentals** (más roto, último):
- Añadir 1 challenge real al final de L3 (FizzBuzz reclassified como `exercise`, palindrome bumped a challenge según Part 1, **y** un new challenge: "implement debounce" o equivalente — TBD en spec)
- Separar template literals en su propia explanation step en L1, antes de L1.2 que los usa

**Cross-cutting:**
- Drop el prefijo `Exercise:` / `Challenge:` del instruction de los 18 steps tipo code/challenge ahora que `step.title` lo cubre
- Rellenar `step.solution` para los 18 steps no-read

### Part 3 — Solution reveal + quality CI

**UI:**
- Después del primer pass de un step: aparece sección colapsable "Reference solution" (default colapsada) con la `step.solution`
- Si el step ya estaba completed al cargar (e.g. anonymous progress merge), mostrar el toggle desde el inicio

**CI smoke:**
- Nuevo script `pnpm --filter=@dojo/api test:harness` (o test target similar) que itera sobre los seeded steps con `solution` no nulo, ejecuta `testCode` con la `solution` como `code` contra el ExecuteStep use case (con MockExecutionAdapter o Piston si está disponible) y assert que `passed === true`. Detecta drift entre la spec del autor y el harness.

### Part 4 — Semantic slots renderer (si hay aire)

- `MarkdownContent` parsea opcional `## Why this matters` / `## Your task` / `## Examples` y los renderiza como mini-cards con header de color distinto
- Backwards compat total: si no aparecen esos headings, render normal

---

## Qué NO está en Sprint 018

- **Retrieval interleaving** (Lesson N usa identifiers de Lesson N-1) — defer a Sprint 019
- **"Ask the sensei" on-demand en el course player** — Phase 2 del CODE_SCHOOL_PLAN, no antes
- **Diff visual entre la solución del learner y la `step.solution`** — polish posterior
- **External references por sub-course** (§8 framework lo pide) — defer a Sprint 019
- **Share card de completación + badge por curso** — defer (no relacionado con calidad, ya está en backlog)
- **Migrar TS / JS DOM a público** — sigue dependiendo de validar que SQL Deep Cuts retiene
- **Python course** — defer hasta cerrar la pasada de calidad

---

## Opciones evaluadas

### Option A: Schema + reclassify + audit + solution reveal (elegida)

**Pros:** Cierra la brecha framework↔shipped. CI gate previene drift futuro. Layout ya soporta los 3 tipos visualmente.
**Contras:** 36 step rows tocadas. Riesgo de mis-clasificar y exponer un challenge donde el learner esperaba warmup.
**Mitigación:** reclassify revisable como diff en `seed-courses*.ts`. Cada cambio se ve en el PR. `wipe` button del admin disponible para revert local.

### Option B: Solo schema + dejar contenido para después

**Descartado:** El schema sin la audit no resuelve nada visible al learner. Ship "exercise" vs "challenge" sin reclassify es theatre.

### Option C: Reescribir un curso entero (TS Fundamentals) y dejar los otros

**Descartado:** Dr. Elif: "el framework no es ejecutable hasta que los tres cursos lo respetan". Ship un curso bien y dos rotos da peor señal que tres consistentes.

---

## Expert panel notes

**Dr. Elif Yıldız (S5):** El bug arquitectural #1 es la conflación `exercise/challenge`. Schema fix desbloquea todo lo demás. Sin él, el framework es decoración.

**Valentina Cruz (S2):** Los slots semánticos (`## Why this matters` / `## Your task` / `## Examples`) son polish. Si entran en Part 4, ok; si no, no bloquean el sprint. Lo que sí bloquea: limpiar los `Exercise:` prefijos del instruction body.

**Soren Bachmann (C6):** `step.title` como campo top-level es no-negociable. Hoy el sidebar y el H1 dependen de regex sobre markdown. Frágil y heredado. Migration 0014 se lo come.

**Dr. Emeka Obi (S6 — TS):** Tres bugs concretos en TS Fundamentals — template literals sin intro, cero challenges reales, cero retrieval entre lessons. Los dos primeros son Sprint 018; retrieval defer a 019.

**Bruno Tanaka (JS):** JS DOM está mejor. Fix L1.1 (`getElementById`) y L3.3 hint son cambios de 5 líneas de markdown.

**Sofia Marchetti (SQL):** SQL Deep Cuts es el que más se acerca al framework. Fix de L2.2 (working memory) y opcional L1.4 (LAG/LEAD). El challenge L3.3 es ejemplar — usar como modelo en cross-curso reviews.

**Hiroshi Nakamura (S1):** `step.solution` + CI gate es lo que evita que un harness silenciosamente pida algo distinto a la instruction. Sin esto, los autores podemos mover prosa y romper tests sin enterarnos.

**Yemi Okafor (C4):** Ningún LLM en Sprint 018. Hints estáticos primero, audit de calidad de cada hint existente. "Ask the sensei" gana mucho menos cuando los hints fallan en lo básico.

**Priya Menon (C1):** Order: 1) schema fix, 2) backfill mecánico, 3) audit por curso (SQL → JS → TS), 4) solution reveal + CI, 5) si hay aire, slots semánticos. No empezar Part 4 si Part 2 no está cerrado.

---

## Carry-forwards a Sprint 019

- Retrieval interleaving entre lessons
- External references por sub-course (§8 framework)
- Diff visual learner-solution vs reference-solution
- "After solving: alternative approaches" (Soren — deferido desde Sprint 015 / 017)

---

## Next step

- [ ] Crear spec: `docs/specs/024-sprint-018-course-content-quality.md`
