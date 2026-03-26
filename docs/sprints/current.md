# Active Block: Sprint 012 — Alpha-Ready: Code Execution + Insight + Retention

**Started:** 2026-03-26
**Phase:** Phase 1 Alpha prep → Alpha launch

**Expected outcome:** 5 invited users can complete katas with real code execution, see structured post-kata insights, and have weekly goals that bring them back. Dashboard handles concurrent users without N+1 queries.

**Strategy:** testCode exercises first (unlocks Piston value), then N+1 fix (unblocks multi-user), then Insight Screen (biggest UX impact), then weekly goals (retention), then tech debt.

---

## Part 1 — 15 Code Exercises with testCode (P0)

- [x] Design + implement 15 function-oriented exercises with testCode
  - TypeScript (4): flatten arrays, retry with backoff, groupBy, debounce
  - Ruby (2): FizzBuzz without conditionals, validate JSON schema
  - Python (2): parse CSV, matrix rotation
  - Go (3): bounded worker pool, LRU cache, error type hierarchy
  - SQL (4): rank by dept salary, find churned users, recursive CTE org chart, CTE refactor
- [ ] Verify each exercise runs through Piston end-to-end (requires Piston running)
- [ ] Verify sensei receives and cites execution results (requires LLM)

---

## Part 2 — Post-Kata Insight Screen (P0)

- [x] Update sensei prompt to include XML tags: `<strengths>`, `<improvements>`, `<approach_note>`
- [x] Parse XML tags from evaluation stream (parse-insight.ts with fallback)
- [x] Enhance ResultsPage with InsightCards (strengths → improvements → approach note)
- [ ] Update share card to use approach_note as hook (deferred — needs real data to test)
- [ ] Update EvaluationResult types in shared package (deferred — insight parsed client-side)

---

## Part 3 — Dashboard N+1 Fix (P0)

- [x] Rewrite dashboard active session + today session queries (10 → 6 queries via JOINs)
- [ ] EXPLAIN ANALYZE verification (requires production data)
- [ ] Benchmark: <200ms with 50+ sessions (requires production data)

---

## Part 4 — Weekly Goals (P1)

- [x] Add `goal_weekly_target` (integer, default 3) to user_preferences
- [x] Migration 0010 for new column
- [x] Dashboard: compute completed sessions this week vs target
- [x] Frontend: progress bar with dots below streak card
- [ ] Include in GET/PUT /preferences (allow users to change target)

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
