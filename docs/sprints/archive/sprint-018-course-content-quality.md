# Sprint 018 — Course content quality v1

**Started:** 2026-04-16
**Closed:** 2026-04-16
**Phase:** Phase 1 Alpha

**PRD:** [docs/prd/022-sprint-018-planning.md](../../prd/022-sprint-018-planning.md)
**Spec:** [docs/specs/024-sprint-018-course-content-quality.md](../../specs/024-sprint-018-course-content-quality.md)

---

## Part 1 — Schema, taxonomy, layout

- [x] Migration 0014: `steps.title TEXT NULL`, `steps.solution TEXT NULL`, default `type = 'exercise'`
- [x] Schema + DTO: `StepType` adds `'exercise'`; `StepDTO.title` exposed; `solution` excluded from learner DTO
- [x] Zod schemas updated (`stepTypeSchema`, `stepDTOSchema`)
- [x] `GET /learn/courses/:slug` surfaces `step.title`
- [x] `extractStepTitle` prefers `step.title`, regex fallback for legacy
- [x] Sidebar icons: `📖 read`, `📝 exercise`, `⚡ challenge`, `💻 code`

---

## Part 2 — Reclassify + content audit

### Cross-cutting
- [x] Backfilled `step.title` for the 27 seeded steps (29 after Part 2 inserts)
- [x] Dropped leading `# Heading\n\n` from instruction bodies
- [x] Reclassified former `'challenge'` rows to `'exercise'` except 3 explicit stretches
- [x] Filled `solution` for the 19 non-read steps

### SQL Deep Cuts
- [x] L2.2 starter input shortened (12 → 8 lines)
- [ ] L1.4 LAG/LEAD intro — deferred to Sprint 019 (would push past framework's ≤15-step sub-course)

### JavaScript DOM Fundamentals
- [x] L1.1 — added `getElementById` paragraph + tradeoff
- [x] L3.3 — challenge hint reworded (DOM-tree concept, not `closest('li')`)

### TypeScript Fundamentals
- [x] L1 — split: NEW read step "Template literals" (1.2) before greet exercise. Existing exercise UUIDs preserved
- [x] L3 — bumped Palindrome to `challenge` and added NEW challenge `L3.4 Implement memoize` (originally drafted as debounce, replaced — see retro)

---

## Part 3 — Solution reveal + quality CI

- [x] `GET /learn/courses/:slug/steps/:stepId/solution` endpoint (403 until pass, 200 after)
- [x] API client: `learn.getStepSolution(slug, stepId, anonId?)`
- [x] StepEditor: third tab "Solution" — locked with 🔒 until isCompleted, lazy-fetched
- [x] `pnpm --filter=@dojo/api run validate:courses` — runs each `solution` against its `testCode` via Piston, asserts pass
- [x] 5 unit tests for the solution endpoint (404 / 403 / 200 / anon-public / private-404)

---

## Part 4 — Semantic slots renderer (deferred)

- [ ] Skipped this sprint per spec budget. Carry-forward to Sprint 019.

---

## Part 5 — Docs + verification

- [x] CHANGELOG.md actualizado
- [x] ROADMAP.md actualizado
- [x] `pnpm typecheck` ✓
- [x] `pnpm lint` ✓
- [x] `pnpm test --filter=@dojo/api` — 106/106
- [x] `pnpm test --filter=@dojo/e2e` — 10/10
- [x] Migration 0014 aplicada local + re-seed sin error
- [x] `pnpm validate:courses` reports 13/13 OK + 6 iframe skipped

---

## Distribution after the sprint

29 total steps across 3 courses:

| Type | Count | % | Framework target |
|---|---|---|---|
| `read` | 10 | 34 | ~30 |
| `exercise` | 15 | 52 | ~55 |
| `challenge` | 4 | 14 | ~15 |

3 courses, 4 challenges (TS Palindrome, TS Memoize, JS DOM Delegation bug, SQL Churn report). Every sub-course satisfies §4.3 of the framework.

---

## Retro

**Wins:**
- The schema fix (Part 1) was 12 files but mechanical — no learner-visible breakage. Sidebar now shows the actual exercise titles.
- The `validate:courses` script paid for itself on first run by catching two real bugs in our own seeds. That's the kind of CI gate that stops mattering when nothing breaks but matters a lot the day something does.
- Solution reveal as a 🔒 tab feels right — the affordance is visible, the gate is honest. Learners know there's a reference once they pass; before that, no nag.

**Surprises:**
- Piston's TypeScript runtime (5.0.3) defaults to **ES5 lib**. No `Array.from`, no `Promise`, no top-level `await`. We discovered this with the validator, not in dev. Two seeded steps had to be rewritten:
  - "Sum an array" replaced `Array.from({ length: 100 }, ...)` with a for-loop
  - "Implement debounce" was replaced with synchronous "Implement memoize" — debounce inherently needs `setTimeout` + a `Promise`-based test driver and the runtime can't host either. Memoize exercises the same closure/caching intuition without the runtime constraint.
- The framework gap was bigger than the sprint plan implied. Reclassifying 18 steps from `challenge` → `exercise` is a 90% rewrite of how the catalog reads. Worth doing before the catalog grows.
- TS Fundamentals went from 9 → 11 steps because of the L1.2 template literals insert and the L3.4 memoize add. The framework allows up to ~15 per sub-course; we're well within it.

**Carry-forward to Sprint 019:**
- Semantic slots renderer (`## Why this matters` / `## Your task` / `## Examples`) — Part 4 of this sprint, descoped on time
- Retrieval interleaving across lessons (framework §3 / §3.1)
- External references per sub-course (framework §8) — currently 0/3 courses cite books/docs/talks
- Diff visual: learner solution vs reference solution
- "After solving: alternative approaches" (Soren — deferred since Sprint 015)
- LAG/LEAD intro between SQL Deep Cuts L1.3 and L2.1
- Piston production verification (Kamal) — requires deploy
- Dashboard EXPLAIN ANALYZE en producción — requires deploy
