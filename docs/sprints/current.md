# Active Block: Sprint 017 — SQL Deep Cuts + Public Courses + Debugging Sensei

**Started:** 2026-03-28
**Phase:** Phase 1 Alpha

**PRD:** [docs/prd/021-sprint-017-planning.md](../prd/021-sprint-017-planning.md)
**Spec:** [docs/specs/023-sprint-017-sql-deep-cuts.md](../specs/023-sprint-017-sql-deep-cuts.md)

---

## Part 1 — SQL Deep Cuts wire-up

- [ ] Renombrar `seed-courses-draft-sql.ts` → `seed-courses-sql-deep-cuts.ts` y descomentar
- [ ] Alinear `step.type` al convenio `read | code | challenge` (migration + seed)
- [ ] Escribir `testCode` para los 6 steps `challenge`
  - [ ] 1.2 — `RANK() OVER (PARTITION BY)` — department rankings
  - [ ] 1.3 — `SUM() OVER ROWS UNBOUNDED PRECEDING` — running totals
  - [ ] 2.2 — Refactor subquery 3-niveles → CTE
  - [ ] 2.3 — CTE encadenada (ratio sobre agregado previo)
  - [ ] 3.2 — Cohort analysis por mes de signup
  - [ ] 3.3 — Challenge final: "Fix this slow report"
- [ ] Verificar cada `testCode` contra Piston local antes del seed
- [ ] Integrar en `seed-courses.ts` vía `seedOneCourse()`
- [ ] Marcar curso como `isPublic: true`

---

## Part 2 — Cursos públicos + progreso híbrido

### Backend
- [ ] Migration 0013: `courses.is_public` + `course_progress.user_id` nullable + `anonymous_session_id` + check constraint
- [ ] Schema update en drizzle/schema.ts
- [ ] `CourseProgress` aggregate: owner como union type `{ userId } | { anonymousSessionId }`
- [ ] `TrackProgress`: acepta userId o anonymousSessionId (exclusivos)
- [ ] `GetCourseProgress`: carga por cualquiera de los dos
- [ ] `MergeAnonymousProgress` (nuevo use case): union + reasign + delete anónimo
- [ ] Helper `optionalAuth` middleware
- [ ] Endpoints `/learn/*` con auth opcional:
  - [ ] `GET /learn/courses` — filtra por `isPublic` si no hay userId
  - [ ] `GET /learn/courses/:slug` — 404 si no público y no hay userId
  - [ ] `POST /learn/execute` — 401 si no público y no hay userId; whitelist de lenguajes anónimos
  - [ ] `POST /learn/progress` — acepta `anonymousSessionId` en body
  - [ ] `GET /learn/progress/:courseId` — acepta `?anonymousSessionId=` en query
  - [ ] `POST /learn/progress/merge` — requiere auth, ejecuta `MergeAnonymousProgress`
- [ ] Rate limiter anónimo (10/min) en `/learn/execute` y `/learn/progress`

### Frontend
- [ ] `apps/web/src/lib/anonymousId.ts` — get/create/clear
- [ ] `CoursePlayerPage`: usa `anonymousSessionId` si no hay sesión
- [ ] Post-login: llamar `POST /learn/progress/merge` + `clearAnonymousId()`
- [ ] `LearnCatalogPage`: badge "Public" cuando `course.isPublic`

### Tests
- [ ] Unit: `CourseProgress.mergeFromAnonymous`
- [ ] Use case: `MergeAnonymousProgress` (3 casos: con overlap, sin overlap, anónimo vacío)
- [ ] Use case: `TrackProgress` rechaza si curso no-público sin userId
- [ ] Use case: `GetCourseProgress` por anonymousSessionId
- [ ] Integration: `POST /learn/progress` público OK, no-público 401

---

## Part 3 — Step type `read` UI

- [ ] Componente `ReadOnlyStep.tsx` (markdown + "Next →")
- [ ] Routing condicional en `CoursePlayerPage` por `step.type`
- [ ] Step nav: icono distinto para `read` (📖) vs `challenge` (✓)

---

## Part 4 — Sensei prompt para `debugging`

- [ ] Localizar construcción del prompt (application/practice o adapter Anthropic)
- [ ] Añadir `debuggingContext` cuando `exercise.category === 'debugging'`
- [ ] Verificar manualmente con `fix-pagination-offset` — sensei menciona causa raíz

---

## Part 5 — Docs + verificación

- [ ] CHANGELOG.md actualizado
- [ ] README.md actualizado (nuevo curso + flag público)
- [ ] ROADMAP.md actualizado
- [ ] `pnpm typecheck` pasa
- [ ] `pnpm lint` pasa
- [ ] `pnpm test --filter=api` pasa

---

## Carry-forward desde Sprint 016

- [ ] Piston production verification (Kamal) — requiere deploy
- [ ] Dashboard EXPLAIN ANALYZE en producción — requiere deploy

---

## Defer a Sprint 018

- Share card de completación de curso (Amara)
- "After solving: approaches" en course player (Soren)
- Badge específico por curso completado (Recognition context)
- Migrar cursos previos (TS Fundamentals, JS DOM) a público (si SQL Deep Cuts valida el modelo)
