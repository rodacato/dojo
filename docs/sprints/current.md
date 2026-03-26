# Active Block: Sprint 012 — Alpha-Ready: Code Execution + Insight + Retention

**Started:** 2026-03-26
**Phase:** Phase 1 Alpha prep → Alpha launch

**Expected outcome:** 5 invited users can complete katas with real code execution, see structured post-kata insights, and have weekly goals that bring them back. Dashboard handles concurrent users without N+1 queries.

**Strategy:** testCode exercises first (unlocks Piston value), then N+1 fix (unblocks multi-user), then Insight Screen (biggest UX impact), then weekly goals (retention), then tech debt.

---

## Part 1 — 15 Code Exercises with testCode (P0)

- [ ] Design + implement 15 function-oriented exercises with testCode
  - TypeScript (4): flatten arrays, retry with backoff, groupBy, debounce
  - Ruby (2): FizzBuzz without conditionals, validate JSON schema
  - Python (2): parse CSV, matrix rotation
  - Go (3): bounded worker pool, LRU cache, error type hierarchy
  - SQL (4): rank by dept salary, find churned users, recursive CTE org chart, CTE refactor
- [ ] Verify each exercise runs through Piston end-to-end
- [ ] Verify sensei receives and cites execution results

---

## Part 2 — Post-Kata Insight Screen (P0)

- [ ] Update sensei prompt to include XML tags: `<strengths>`, `<improvements>`, `<approach_note>`
- [ ] Parse XML tags from evaluation stream (with fallback to raw prose)
- [ ] Enhance ResultsPage with structured insight sections (strengths → improvements → approach note)
- [ ] Update share card to use approach_note as hook
- [ ] Update EvaluationResult types in shared package

---

## Part 3 — Dashboard N+1 Fix (P0)

- [ ] Rewrite dashboard query using Drizzle relational joins (5-6 queries → 1-2)
- [ ] EXPLAIN ANALYZE verification
- [ ] Benchmark: <200ms with 50+ sessions

---

## Part 4 — Weekly Goals (P1)

- [ ] Add `goal_weekly_target` (integer, default 3) to user_preferences
- [ ] Migration for new column
- [ ] Dashboard: compute completed sessions this week vs target
- [ ] Frontend: progress bar below streak card ("2 of 3 this week")
- [ ] Include in GET /preferences and PUT /preferences

---

## Part 5 — Deferred Tech Debt (P1-P2)

### P1
- [ ] WCAG visual audit: verify text-muted on all surface backgrounds
- [ ] WebSocket handler tests (extract handleSubmit/handleReconnect, test with mock ws)
- [ ] Session.isExpired() domain method

### P2
- [ ] API client split into modules
- [ ] Route file further split (feedback.ts, preferences.ts)

---

## Deferred to Sprint 013+

- Exercise Proposals (Phase 3)
- Frontend execution (Sandpack)
- Guided courses mode

---

## Verification

1. 15 exercises with testCode run through Piston end-to-end
2. Insight screen shows structured strengths/improvements/approach after every kata
3. Dashboard <200ms with 50+ sessions
4. Weekly goal progress visible on dashboard
5. All tests pass (56+ existing + new)
6. Lint + typecheck clean
