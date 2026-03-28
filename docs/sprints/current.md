# Active Block: Sprint 016 — Surprise me + Fix-the-bug + SQL Advanced

**Started:** 2026-03-27
**Phase:** Phase 1 Alpha

**PRD:** [docs/prd/020-sprint-016-planning.md](../prd/020-sprint-016-planning.md)
**Spec:** [docs/specs/022-sprint-016.md](../specs/022-sprint-016.md)

---

## Part 1 — Surprise me button

- [ ] Botón "Surprise me →" en `DayStartPage.tsx`
- [ ] Handler que llama a `api.getExerciseOptions()`, elige aleatoriamente, navega directo al kata
- [ ] Estado de loading independiente (`surpriseLoading`)

---

## Part 2 — Fix-the-bug kata (5 ejercicios)

- [ ] Crear `apps/api/src/infrastructure/persistence/exercises/debugging.ts` con 5 ejercicios
  - [ ] `fix-pagination-offset` (TypeScript) — off-by-one en paginación
  - [ ] `fix-mutable-default` (Python) — mutable default argument
  - [ ] `fix-race-condition` (Go) — goroutines sin mutex
  - [ ] `fix-parseint-radix` (TypeScript) — parseInt sin radix
  - [ ] `fix-nil-check` (Go) — wrong nil check
- [ ] Integrar en el seed de ejercicios existente
- [ ] Prompt del sensei — contexto adicional para `category === 'debugging'`

---

## Part 3 — SQL advanced kata (5 ejercicios)

- [ ] Crear `apps/api/src/infrastructure/persistence/exercises/sql-advanced.ts` con 5 ejercicios
  - [ ] `sql-department-rankings` — RANK() OVER PARTITION BY
  - [ ] `sql-running-monthly-totals` — SUM() acumulativo
  - [ ] `sql-org-chart-recursive` — Recursive CTE
  - [ ] `sql-flatten-nested-subquery` — CTEs legibles
  - [ ] `sql-churn-analysis` — churn real-world analysis
- [ ] Integrar en el seed de ejercicios existente
- [ ] Verificar que testCode SQL pasa en Piston

---

## Part 4 — SQL Deep Cuts course draft

- [ ] Crear `apps/api/src/infrastructure/persistence/seed-courses-draft-sql.ts` (comentado)
- [ ] Estructura completa: 3 lecciones, 9 steps, testCode pattern para Sprint 017

---

## Part 5 — Docs + verificación

- [ ] CHANGELOG.md actualizado
- [ ] `pnpm typecheck` pasa
- [ ] `pnpm lint` pasa
- [ ] `pnpm test --filter=api` — todos los tests pasan

---

## Carry-forward de Sprint 015

- [ ] Piston production verification (Kamal) — requiere deploy a producción
- [ ] Dashboard EXPLAIN ANALYZE en producción — requiere deploy a producción
