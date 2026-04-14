# Active Block: Sprint 016 — Surprise me + Fix-the-bug + SQL Advanced

**Started:** 2026-03-27
**Closed:** 2026-03-28
**Phase:** Phase 1 Alpha

**PRD:** [docs/prd/020-sprint-016-planning.md](../prd/020-sprint-016-planning.md)
**Spec:** [docs/specs/022-sprint-016.md](../specs/022-sprint-016.md)

---

## Part 1 — Surprise me button

- [x] Botón "Surprise me →" en `DayStartPage.tsx`
- [x] Handler que llama a `api.getExercises()`, elige aleatoriamente, navega directo al kata
- [x] Estado de loading independiente (`surpriseLoading`)

---

## Part 2 — Fix-the-bug kata (5 ejercicios)

- [x] Crear `apps/api/src/infrastructure/persistence/exercises/debugging.ts` con 5 ejercicios
  - [x] `fix-pagination-offset` (TypeScript) — off-by-one en paginación
  - [x] `fix-mutable-default` (Python) — mutable default argument
  - [x] `fix-race-condition` (Go) — goroutines sin mutex
  - [x] `fix-parseint-radix` (TypeScript) — parseInt sin radix
  - [x] `fix-nil-check` (Go) — wrong nil check
- [x] Integrar en el seed de ejercicios existente
- [x] Campo `starterCode` en Exercise + migration 0012 + pre-fill en `KataActivePage`

---

## Part 3 — SQL advanced kata (5 ejercicios)

- [x] Crear `apps/api/src/infrastructure/persistence/exercises/sql-advanced.ts` con 5 ejercicios
  - [x] `sql-department-rankings` — RANK() OVER PARTITION BY
  - [x] `sql-running-monthly-totals` — SUM() acumulativo
  - [x] `sql-org-chart-recursive` — Recursive CTE
  - [x] `sql-flatten-nested-subquery` — CTEs legibles
  - [x] `sql-churn-analysis` — churn real-world analysis
- [x] Integrar en el seed de ejercicios existente
- [x] Verificar que testCode SQL pasa en Piston

---

## Part 4 — SQL Deep Cuts course draft

- [x] Crear `apps/api/src/infrastructure/persistence/seed-courses-draft-sql.ts` (fuera del runner)
- [x] Estructura completa: 3 lecciones, 9 steps, testCode pattern para Sprint 017

---

## Part 5 — Docs + verificación

- [x] CHANGELOG.md actualizado
- [x] `pnpm typecheck` pasa
- [x] `pnpm lint` pasa
- [x] `pnpm test --filter=api` — 79/79 tests pasan

---

## Carry-forward a Sprint 017

- [ ] Prompt del sensei — contexto adicional para `category === 'debugging'` (no se tocó en Sprint 016)
- [ ] Piston production verification (Kamal) — requiere deploy a producción
- [ ] Dashboard EXPLAIN ANALYZE en producción — requiere deploy a producción
- [ ] Wire-up del course "SQL Deep Cuts" (draft listo en `seed-courses-draft-sql.ts`)
