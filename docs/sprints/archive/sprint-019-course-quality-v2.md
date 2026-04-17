# Sprint 019 — Course content quality v2 (pedagogy)

**Started:** 2026-04-16
**Closed:** 2026-04-17
**Phase:** Phase 1 Alpha

**PRD:** [docs/prd/023-sprint-019-planning.md](../../prd/023-sprint-019-planning.md)
**Spec:** [docs/specs/025-sprint-019-course-quality-v2.md](../../specs/025-sprint-019-course-quality-v2.md)

---

## Part 1 — Semantic slots renderer

- [x] `renderSlots` parser detects `## Why this matters` / `## Your task` / `## Examples` / `## Edge cases`
- [x] `SlotCard` renders each section as a styled card (accent / neutral / muted / warning)
- [x] Fallback total: no slots → plain markdown
- [x] Unit test: 6 tests for `renderSlots` (null path, all-4-slots, nested heading, leading whitespace, empty body, non-slot first)
- [x] vitest added to `apps/web` for frontend unit testing

---

## Part 2 — External references per course (framework §8)

- [x] Migration 0015: `courses.external_references JSONB NOT NULL DEFAULT '[]'`
- [x] Domain model + `CourseDTO` expose `externalReferences: ExternalReference[]`
- [x] Backfill: 3 references per course (SQL Deep Cuts, JS DOM, TS Fundamentals)
- [x] UI: "Further reading" collapsible section at the bottom of the sidebar, icons by `kind`

---

## Part 3 — "Alternative approach" post-pass

- [x] Migration 0015 (same): `steps.alternative_approach TEXT`
- [x] `StepSolutionDTO` exposes `{ solution, alternativeApproach }`
- [x] `GET /learn/courses/:slug/steps/:stepId/solution` extended to return both fields
- [x] Solution tab: `<details>` collapsible "Alternative approach" below "Reference solution"
- [x] Schema + seed + route wiring complete; editorial backfill of `alternativeApproach` content deferred to per-step authoring (fields are null until populated)

---

## Part 4 — SQL L1.4 LAG/LEAD intro (content-only)

- [x] New step `L1.4` in `seed-sql-deep-cuts.ts`, type `exercise`
- [x] Title: "Compare each row to the previous" — `LAG(sales, 1, sales) OVER (ORDER BY month)`
- [x] testCode + solution + pass criteria — `validate:courses` 14/14 green
- [x] SQL Deep Cuts: 9 → 10 steps (framework allows ≤15)

---

## Part 5 — Docs + verification

- [x] CHANGELOG.md updated
- [x] ROADMAP.md updated
- [x] `pnpm typecheck` ✓
- [x] `pnpm lint` ✓
- [x] `pnpm test --filter=@dojo/api` ✓ (106/106)
- [x] `pnpm test --filter=@dojo/web` ✓ (6/6)
- [x] `pnpm validate:courses` 14/14 OK, 6 iframe skipped, 10 no-solution skipped

---

## Distribution after the sprint

30 total steps (+1 from Sprint 018) across 3 courses:

| Course | Steps | New |
|---|---|---|
| TypeScript Fundamentals | 11 | — |
| JavaScript DOM Fundamentals | 8 | — |
| SQL Deep Cuts | 10 | +1 (L1.4 LAG/LEAD) |

---

## Retro

**Wins:**
- Slots renderer shipped cheaply — pure function + 6 tests, zero coupling to the rest of the app. The capability is live; authors adopt it by writing `## Why this matters` at the top of an instruction. No migration, no schema change.
- Migration 0015 bundled two columns (`external_references` + `alternative_approach`) in one shot. Both are additive (JSONB default `[]`, TEXT nullable) — zero-risk rollback.
- `validate:courses` caught a LAG/LEAD default value edge case during development — the third argument to `LAG(sales, 1, sales)` needed to be `sales` (not `0`) so the delta formula `sales - LAG(...)` yields 0 for the first row. The CI gate continues to pay for itself.

**Surprises:**
- No `sub_courses` table exists — the framework's "sub-course" concept maps to the `courses` table directly. External references live in `courses.external_references`, not a separate entity. The spec was corrected mid-sprint; the PRD still says "per sub-course" but the implementation is per-course.
- Part 3 (alternative approach) shipped the full schema + API + UI wiring but **zero seed content** for `alternativeApproach`. The editorial pass (6-8 steps with alt approaches) is deferred to per-step authoring rather than done as a bulk backfill. The field is ready; the content will arrive incrementally.

**Carry-forward to Sprint 020:**
- Retrieval interleaving between lessons (Dr. Elif — needs its own PRD)
- Diff visual learner vs reference solution
- Share card de completación + badge por curso (Amara — acquisition)
- Migrar TS Fundamentals + JS DOM a público
- Editorial backfill of `alternativeApproach` for 6-8 key steps
- Piston production verification (Kamal) — requires deploy
- Dashboard EXPLAIN ANALYZE en producción — requires deploy
