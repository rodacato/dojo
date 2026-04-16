# Active Block: Sprint 019 — Course content quality v2 (pedagogy)

**Started:** 2026-04-16
**Phase:** Phase 1 Alpha

**PRD:** [docs/prd/023-sprint-019-planning.md](../prd/023-sprint-019-planning.md)
**Spec:** [docs/specs/025-sprint-019-course-quality-v2.md](../specs/025-sprint-019-course-quality-v2.md) _(TBD)_

---

## Part 1 — Semantic slots renderer

- [ ] `MarkdownContent` detecta `## Why this matters` / `## Your task` / `## Examples` / `## Edge cases` al inicio del instruction
- [ ] Render de cada slot como card distinta (accent / neutral / muted / warning)
- [ ] Fallback total: si no hay slots, render markdown normal
- [ ] Unit test: `renderSlots(md)` retorna array cuando aplica, `null` en caso contrario

---

## Part 2 — External references por sub-course (framework §8)

- [ ] Migration 0015: `sub_courses.external_references TEXT NULL` (JSON `{title, url, kind}[]`)
- [ ] `SubCourseDTO` expone `externalReferences`
- [ ] Backfill para los 3 cursos (SQL Deep Cuts, JS DOM, TS Fundamentals) — referencias validadas con panel
- [ ] UI: sección "Further reading" al final del sub-course, íconos por `kind` (`book` / `docs` / `talk` / `article`)

---

## Part 3 — "Alternative approach" post-pass

- [ ] Migration 0015 (misma): `steps.alternative_approach TEXT NULL`
- [ ] `StepDTO` añade `alternativeApproach` (expuesto **sólo post-pass**)
- [ ] `GET /learn/courses/:slug/steps/:stepId/solution` extiende response a `{ solution, alternativeApproach? }`
- [ ] Solution tab: sección colapsable debajo de "Reference solution"
- [ ] Backfill editorial: 6-8 steps con alt approach real (no los 19 solucionables)

---

## Part 4 — SQL L1.4 LAG/LEAD intro (content-only)

- [ ] Nuevo step `L1.4` en `seed-sql-deep-cuts.ts`, tipo `exercise`
- [ ] Title: "Compare each row to the previous" — `LAG(amount, 1) OVER (ORDER BY month)`
- [ ] testCode + solution + pass criteria
- [ ] SQL Deep Cuts queda en 13/15 steps

---

## Part 5 — Docs + verification

- [ ] CHANGELOG.md actualizado
- [ ] ROADMAP.md actualizado
- [ ] `pnpm typecheck` ✓
- [ ] `pnpm lint` ✓
- [ ] `pnpm test --filter=@dojo/api` ✓
- [ ] `pnpm test --filter=@dojo/e2e` ✓
- [ ] Migration 0015 aplicada local + re-seed sin error
- [ ] `pnpm validate:courses` sigue en verde

---

## Explícitamente fuera

- Retrieval interleaving (Dr. Elif — PRD propio, Sprint 020)
- Diff visual learner vs reference (Soren — polish)
- Share card de completación + badge por curso (Amara — acquisition)
- Migrar TS + JS DOM a público (depende de retention de SQL Deep Cuts)
- Python course

---

## Carry-forward (waiting on deploy)

- Piston production verification (Kamal) — requires deploy
- Dashboard EXPLAIN ANALYZE en producción — requires deploy
