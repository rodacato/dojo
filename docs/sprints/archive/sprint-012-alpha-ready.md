# Sprint 012 — Alpha-Ready

**Started:** 2026-03-26
**Phase:** Phase 1 Alpha prep → Alpha launch

**Expected outcome:** 5 invited users can complete katas with real code execution and want to come back. Post-kata insight screen gives structured growth feedback. Dashboard handles multi-user load.

**Strategy:** Finish what Sprint 011 started (Piston without testCode is a feature at 80%), add the retention hook (post-kata insight), and fix the multi-user blocker (N+1 queries).

---

## Part 1 — Code Exercises with testCode (P0)

- [x] 15 new exercises across TypeScript (4), Ruby (2), Python (2), Go (3), SQL (4), plus carry-forward — total catalog 76 exercises
- [x] Each exercise has 5-8 test cases covering edge cases and boundary conditions
- [x] TypeScript: Node assert / vitest-style assertions
- [x] Python: pytest-style
- [x] Go: testing package
- [x] SQL: @SCHEMA / @SEED / @EXPECTED comment format
- [x] Verified each exercise runs correctly through Piston
- [x] Sensei receives and cites execution results in evaluation

---

## Part 2 — Post-Kata Insight Screen (P0)

- [x] Sensei prompt extended to produce `<strengths>`, `<improvements>`, `<approach_note>` XML tags
- [x] Client-side tag parsing with graceful fallback to unstructured text if tags absent
- [x] ResultsPage updated — structured cards: green (strengths), amber (improvements), accent (approach note)
- [x] Share card pulls from approach_note as highlight
- [x] Mobile-responsive layout

---

## Part 3 — Dashboard N+1 Fix (P0)

- [x] Active session query: cascaded lookups collapsed to single JOINed query
- [x] Today session query: same treatment
- [x] 10 → 6 queries per dashboard load
- [x] EXPLAIN ANALYZE verified in dev — deferred to production (Sprint 013 carry-forward)

---

## Part 4 — Weekly Kata Mechanic (P1)

Chose Option B (weekly goals) per Priya's recommendation — mid-senior developers don't have time for daily pressure.

- [x] `goal_weekly_target` field in user_preferences (1–7 sessions/week)
- [x] Dashboard progress bar: "2 of 3 this week"
- [x] Computed from sessions — no new table needed

---

## Part 5 — Deferred Items from Sprint 011 (P1-P2)

- [x] WCAG AA audit — `--color-muted` brightened from #475569 to #64748B (4.5:1 minimum on all surfaces)
- [ ] WebSocket handler tests — deferred to Sprint 013 (required WS test harness)
- [ ] Move timer enforcement to `Session.isExpired()` — deferred to Sprint 013
- [ ] API client split — deferred to Sprint 013
- [ ] Route file split — deferred to Sprint 013

---

## Verification

1. [x] 15 exercises with working testCode — submit → Piston runs → sensei cites results
2. [x] Post-kata insight screen shows structured feedback after every kata
3. [x] Dashboard N+1 fixed (10 → 6 queries per load)
4. [x] Weekly goal progress visible on dashboard
5. [x] WCAG AA passes on all text-muted elements
6. [ ] WS handler tests — deferred to Sprint 013
7. [ ] EXPLAIN ANALYZE in production — deferred to Sprint 013

---

## Carry-forward to Sprint 013

- WebSocket handler tests
- `Session.isExpired()` domain method
- API client split into modules
- Route file split (feedback.ts, preferences.ts)
- Dashboard EXPLAIN ANALYZE on production
- Piston production verification (Kamal)
