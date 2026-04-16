# Active Block: Sprint 018 — Course content quality v1

**Started:** 2026-04-16
**Phase:** Phase 1 Alpha

**PRD:** [docs/prd/022-sprint-018-planning.md](../prd/022-sprint-018-planning.md)
**Spec:** [docs/specs/024-sprint-018-course-content-quality.md](../specs/024-sprint-018-course-content-quality.md)

---

## Part 1 — Schema, taxonomy, layout

- [ ] Migration 0014: `steps.title TEXT NULL`, `steps.solution TEXT NULL`, default `type = 'exercise'`
- [ ] Schema + DTO: `StepType` adds `'exercise'`; `StepDTO.title` exposed; `solution` excluded from learner DTO
- [ ] Zod schemas updated (stepTypeSchema, stepDTOSchema)
- [ ] `GET /learn/courses/:slug` surfaces `step.title`
- [ ] `extractStepTitle` prefers `step.title`, regex fallback for legacy steps
- [ ] Sidebar icons distinguish exercise (📝) / challenge (⚡) / read (📖)

---

## Part 2 — Reclassify + content audit

### Cross-cutting
- [ ] Backfill `step.title` for the 27 seeded steps from existing H1
- [ ] Drop leading `# Heading\n\n` from the 18 non-read instruction bodies
- [ ] Reclassify defaults: every `'challenge'` → `'exercise'` except 3 explicit ones
- [ ] Fill `solution` for the 18 non-read steps

### SQL Deep Cuts
- [ ] L2.2 — shorten the starter query input (12 lines → 6)
- [ ] (optional) L1.4 NEW: LAG/LEAD intro before challenge — only if step count stays ≤ 15 and Part 4 doesn't ship

### JavaScript DOM Fundamentals
- [ ] L1.1 explanation — add `getElementById` paragraph + tradeoff
- [ ] L3.3 challenge hint — talk about DOM tree + ancestor concept (don't reveal `closest`)

### TypeScript Fundamentals
- [ ] L1 — split template literals into its own explanation step (insert before greet exercise)
- [ ] L3 — add NEW challenge: "Implement debounce" (with solution + tests)
- [ ] L3.3 Palindrome — keep as `challenge`

---

## Part 3 — Solution reveal + quality CI

- [ ] `GET /learn/courses/:slug/steps/:stepId/solution` endpoint (403 if not passed yet)
- [ ] API client: `learn.getStepSolution(slug, stepId, anonId?)`
- [ ] StepEditor: third tab "Solution" — disabled until `isCompleted`, lazy-fetched on tab open
- [ ] CI script `validate:courses` — runs each `solution` against its `testCode` via Piston, asserts pass
- [ ] Unit test: solution endpoint returns 403 before pass / 200 after

---

## Part 4 — Semantic slots renderer (only if budget allows)

- [ ] `MarkdownContent` detects `## Why this matters` / `## Your task` / `## Examples` / `## Edge cases`
- [ ] Renders each slot as a distinct mini-card with semantic colors
- [ ] Backwards compat: no slot headings → renders unchanged

---

## Part 5 — Docs + verificación

- [ ] CHANGELOG.md actualizado
- [ ] ROADMAP.md actualizado (sprint marker + spec entry)
- [ ] `pnpm typecheck` pasa
- [ ] `pnpm lint` pasa
- [ ] `pnpm test --filter=@dojo/api` pasa (101+ tests)
- [ ] `pnpm test --filter=@dojo/e2e` pasa (10 tests)
- [ ] Migration 0014 aplicada local + re-seed sin error
- [ ] `pnpm --filter=@dojo/api run validate:courses` (cuando Piston está arriba)

---

## Carry-forward (sigue desde Sprint 017)

- [ ] Piston production verification (Kamal) — requires deploy
- [ ] Dashboard EXPLAIN ANALYZE en producción — requires deploy

---

## Defer a Sprint 019

- Retrieval interleaving (Lesson N usa identifiers de Lesson N-1)
- External references por sub-course (§8 framework)
- "After solving: alternative approaches" (Soren — deferido desde Sprint 015 / 017)
- Diff visual entre la solución del learner y la `step.solution`
- Share card de completación de curso (Amara)
- Badge específico por curso completado
- Migrar TS / JS DOM a público
- Python course
- "Ask the sensei" en course player (Phase 2 CODE_SCHOOL_PLAN)
