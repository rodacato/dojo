# Sprint 017 — SQL Deep Cuts + Public Courses + Debugging Sensei

**Started:** 2026-03-28
**Closed:** 2026-04-15
**Phase:** Phase 1 Alpha

**PRD:** [docs/prd/021-sprint-017-planning.md](../../prd/021-sprint-017-planning.md)
**Spec:** [docs/specs/023-sprint-017-sql-deep-cuts.md](../../specs/023-sprint-017-sql-deep-cuts.md)

---

## Part 1 — SQL Deep Cuts wire-up

- [x] Module `seed-courses-sql-deep-cuts.ts` con 9 steps (3 read + 6 challenge)
- [x] Step types alineados al convenio `read | code | challenge` (migration 0013 normaliza existentes)
- [x] `testCode` SQLite-compatible escrito para los 6 steps `challenge`
  - [x] 1.2 — `RANK() OVER (PARTITION BY)` department rankings
  - [x] 1.3 — `SUM() OVER ROWS UNBOUNDED PRECEDING` running totals
  - [x] 2.2 — Refactor subquery 3-niveles → CTE
  - [x] 2.3 — CTE encadenada budget ratio
  - [x] 3.2 — Cohort sizes por mes de signup
  - [x] 3.3 — Challenge: rewrite slow churn report
- [x] Cada testCode verificado contra Piston local (correct → exit 0, known-wrong → exit 1)
- [x] Integrado en `seed-courses.ts` vía `seedOneCourse()`
- [x] Curso `isPublic: true`

### Bonus fix (descubierto en Part 1)
- [x] PistonAdapter: substitución `-- @SOLUTION_FILE` → `CREATE VIEW solution AS ...`
- [x] `sql-advanced.ts` — 3 katas reescritos a SQLite (082 running totals, 083 MoM LAG, 084 NTILE buckets) + starter code añadido. Sprint 016 había shipeado los 3 con sintaxis PostgreSQL que nunca corría en Piston (ADR 014 siempre fue SQLite)
- [x] `_journal.json` — añadidas entradas 0012 y 0013 que faltaban

---

## Part 2 — Cursos públicos + progreso híbrido

### Backend
- [x] Migration 0013: `courses.is_public`, `course_progress.anonymous_session_id`, check constraint, partial unique indexes, step type normalize
- [x] Schema update drizzle
- [x] `CourseProgress` port con `ProgressOwner` union
- [x] `TrackProgress` y `GetCourseProgress` refactorizados para owner union
- [x] `MergeAnonymousProgress` use case nuevo
- [x] Helper `optionalAuth` middleware
- [x] `/learn/*` endpoints con auth opcional, whitelist de lenguajes anónimos, endpoint `POST /learn/progress/merge`
- [x] Rate limiter anónimo reusado (10/min en `/learn/execute`)

### Frontend
- [x] `apps/web/src/lib/anonymousId.ts`
- [x] `CoursePlayerPage` flujo híbrido user/anon + merge al loguearse
- [x] `LearnPage` badge "public"
- [x] API client con `redirectOnAuth: false` para tolerar 401 en endpoints públicos

### Tests
- [x] Unit + use case tests para merge (3 casos)
- [x] TrackProgress / GetCourseProgress tests adaptados

---

## Part 3 — Step type `read` UI

- [x] Routing condicional en `CoursePlayerPage` (ya existente desde Sprint 014 — cerrado con el rename `explanation → read` en el commit de Part 2 backend)
- [x] Step nav icono distinto `📖` vs `⚡`

---

## Part 4 — Sensei prompt para `debugging`

- [x] `PromptParams.category` opcional + bloque `DEBUGGING_CONTEXT` inyectado en las 3 variantes
- [x] `category` threaded por `LLMPort.evaluate` → adapters (Anthropic, OpenAI) → SubmitAttempt
- [x] ws-handlers pasa `exercise.category` al use case
- [x] 9 tests nuevos (3 variantes × 3 escenarios)

---

## Part 5 — Docs + verificación

- [x] CHANGELOG.md actualizado
- [x] README.md actualizado (SQL Deep Cuts + aclaración público/anónimo)
- [x] ROADMAP.md actualizado
- [x] `pnpm typecheck` ✓
- [x] `pnpm lint` ✓
- [x] `pnpm test --filter=api` — 97/97 tests

---

## Retro

**Wins:**
- Sprint cerró con los 4 deliverables más los 2 bonus fixes (SQLite compat + journal recovery).
- SQL Deep Cuts es el primer curso que ejecuta realmente el contenido SQL pensado en Sprint 016 — todo lo anterior era decorativo.
- `CourseProgress` con `ProgressOwner` union quedó limpio: zero complejidad de agregado paralelo, merge idempotente.
- Panel de Part 1 nos obligó a verificar contra Piston **antes** del seed — descubrimos el bug heredado de Sprint 016 (PostgreSQL syntax).

**Surprises:**
- PRD 020 afirmaba *"PostgreSQL ya soportado en ADR 014"* — falso. ADR siempre dijo SQLite. El checkbox "verify testCode passes in Piston" de Sprint 016 se marcó completo sin verificar. **Lección:** cada checkbox de verificación requiere evidencia, no fe.
- `_journal.json` sin entradas para 0012/0013 hizo que `db:migrate` reportara éxito sin aplicar nada. No se detectó en Sprint 016 porque nada leía `starter_code` hasta hoy.
- El PRD listaba 5 katas SQL avanzados; el archivo real solo tenía 3. Fixed en Sprint 017.

**Carry-forward a Sprint 018:**
- Share card de completación de curso
- "After solving: approaches" en course player
- Badge específico por curso completado
- Migrar TS Fundamentals + JS DOM a público (si SQL Deep Cuts valida el modelo)
- Piston production verification (Kamal) — requires deploy
- Dashboard EXPLAIN ANALYZE en producción — requires deploy
