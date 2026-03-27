# Sprint 013 — Hardening + Courses Pre-work

**Started:** 2026-03-27
**Phase:** Phase 1 Alpha hardening

**Expected outcome:** All Sprint 012 deferred items resolved. WS handler tested. Piston verified in production. Courses DB schema ready for Sprint 014. Anonymous rate limiting in place.

**Strategy:** Resolve deferred tech debt first, then pre-work for courses that doesn't depend on content or UX.

---

## Part 0 — Piston Production Verification

- [ ] Confirm Piston accessory boots via Kamal (GitHub vars: PISTON_URL, CODE_EXECUTION_ENABLED) — deferred to deploy
- [ ] Verify testCode exercises run end-to-end in prod — deferred to deploy
- [ ] Verify sensei receives and cites execution results — deferred to deploy

---

## Part 1 — Domain Cleanup

- [x] Session.isExpired(durationMinutes) domain method — encapsulate 10% grace window
- [x] Move timer check from practice.ts route handler to domain method
- [x] EvaluationResult types — insight parsed client-side from analysis text (by design, no type change needed)

---

## Part 2 — Route + API Client Split

### Routes
- [x] Extract feedback.ts (POST/GET /sessions/:id/feedback)
- [x] Extract preferences.ts (GET/PUT /preferences)
- [x] Update router.ts — 7 route files mounted

### API Client
- [x] Split api.ts into modules: client.ts, types.ts, auth.ts, practice.ts, admin.ts, profile.ts
- [x] Barrel export from api/index.ts — api.ts is thin re-export shim

---

## Part 3 — WebSocket Handler Tests

- [x] Extract handleSubmit/handleReconnect into ws-handlers.ts
- [x] Tests: ATTEMPT_NOT_FOUND for unknown attemptId
- [x] Tests: SESSION_NOT_FOUND when session missing
- [x] Tests: ATTEMPT_LIMIT_REACHED (max 2)
- [x] Tests: reconnect cache miss, token replay, complete+close

---

## Part 4 — UX Polish

- [x] Share card: approach_note as pull quote (fallback to truncated analysis)
- [x] Weekly goal target: GET/PUT /preferences includes goalWeeklyTarget (1-7)
- [x] WCAG audit: replaced old #475569 in email templates + OG image, no bypass classes found

---

## Part 5 — Performance Verification

- [ ] EXPLAIN ANALYZE on dashboard queries in production — deferred to next deploy
- [ ] Benchmark dashboard <200ms with existing session data — deferred to next deploy
- [ ] Verify indexes (migration 0009) are active — deferred to next deploy

---

## Part 6 — Courses Pre-work (ADR 015)

### DB Schema
- [x] Migration 0011: courses, lessons, steps, course_progress tables + indexes
- [x] Drizzle schema + relations

### Domain skeleton
- [x] domain/learning/course.ts — Course, Lesson, Step interfaces
- [x] domain/learning/ports.ts — CourseRepositoryPort, CourseProgressPort
- [x] domain/learning/values.ts — StepType, CourseStatus

### Public route middleware
- [x] /learn/* routes public (no auth), mounted in router.ts

---

## Part 7 — Anonymous Rate Limiting

- [x] executionLimiter: 10/min per IP (anonymous Piston)
- [x] authExecutionLimiter: 60/min per IP (authenticated)
- [x] Applied to POST /learn/execute stub
- [ ] Test: 11th anonymous execution returns 429 — deferred (requires integration test)

---

## Backlog Cleanup

- [x] Interest-based selection marked as completed in backlog
- [ ] Archive Sprint 012 to sprints/archive/ — deferred

---

## Verification

1. ~~Piston runs testCode exercises in production~~ (Part 0 — pending deploy)
2. ✅ Session.isExpired() used in route handler
3. ✅ practice.ts at 374 lines (was 1,312 → 492 → 374)
4. ✅ API client split into 7 modules
5. ✅ WS handler has 6 new tests (62 total)
6. ✅ Share card shows approach_note
7. ✅ WCAG AA: old color replaced in 3 files
8. ~~Dashboard <200ms in production~~ (Part 5 — pending deploy)
9. ✅ Courses tables in schema (4 tables + indexes)
10. ✅ Rate limiter configured (10/min anon, 60/min auth)
11. ✅ All tests pass: 62/62 across 15 files

---

## Retro

**What worked:** Splitting this as a cleanup sprint was the right call. Domain cleanup + route split + WS tests gave a solid foundation. Courses pre-work (ADR 015, schema, domain skeleton) means Sprint 014 can jump straight to implementation.

**What didn't:** Piston production verification and performance benchmarks are still pending — both require a deploy. Sprint 012 archive was missed.

**Carry forward:**
- Piston production verification (Part 0)
- Performance verification (Part 5)
- Rate limiter integration test
- Archive Sprint 012
