# Active Block: Sprint 013 — Hardening + Courses Pre-work

**Started:** 2026-03-27
**Phase:** Phase 1 Alpha hardening

**Expected outcome:** All Sprint 012 deferred items resolved. WS handler tested. Piston verified in production. Courses DB schema ready for Sprint 014. Anonymous rate limiting in place.

**Strategy:** Resolve deferred tech debt first, then pre-work for courses that doesn't depend on content or UX.

---

## Part 0 — Piston Production Verification

- [ ] Confirm Piston accessory boots via Kamal (GitHub vars: PISTON_URL, CODE_EXECUTION_ENABLED)
- [ ] Verify testCode exercises run end-to-end in prod
- [ ] Verify sensei receives and cites execution results

---

## Part 1 — Domain Cleanup

- [ ] Session.isExpired(durationMinutes) domain method — encapsulate 10% grace window
- [ ] Move timer check from practice.ts route handler to domain method
- [ ] Update EvaluationResult types in shared package (add strengths, improvements, approachNote)

---

## Part 2 — Route + API Client Split

### Routes
- [ ] Extract feedback.ts (POST/GET /sessions/:id/feedback)
- [ ] Extract preferences.ts (GET/PUT /preferences)
- [ ] Update router.ts

### API Client
- [ ] Split api.ts into modules: auth.ts, practice.ts, admin.ts, profile.ts, client.ts
- [ ] Barrel export from api/index.ts

---

## Part 3 — WebSocket Handler Tests

- [ ] Extract handleSubmit() and handleReconnect() into testable functions
- [ ] Tests: submit with valid/invalid attemptId
- [ ] Tests: attempt limit enforcement (max 2)
- [ ] Tests: reconnect from cache, cache expiry
- [ ] Tests: execution context injection (Piston results)

---

## Part 4 — UX Polish

- [ ] Share card: use approach_note from insight as pull quote hook
- [ ] Weekly goal target: include in GET/PUT /preferences (allow users to change 1-7)
- [ ] WCAG visual audit: verify text-muted contrast on all surface backgrounds

---

## Part 5 — Performance Verification

- [ ] EXPLAIN ANALYZE on dashboard queries in production
- [ ] Benchmark dashboard <200ms with existing session data
- [ ] Verify indexes (migration 0009) are active

---

## Part 6 — Courses Pre-work (ADR 015)

### DB Schema
- [ ] Migration: courses table (id, slug, title, description, language, status, accent_color, created_at)
- [ ] Migration: lessons table (id, course_id, order, title)
- [ ] Migration: steps table (id, lesson_id, order, type, instruction, starter_code, test_code, hint)
- [ ] Migration: course_progress table (id, user_id nullable, course_id, completed_steps jsonb, last_accessed_at)
- [ ] Drizzle schema + relations

### Domain skeleton
- [ ] domain/learning/course.ts — Course aggregate, Lesson entity, Step value object
- [ ] domain/learning/ports.ts — CourseRepositoryPort, CourseProgressPort
- [ ] domain/learning/values.ts — StepType, CourseStatus

### Public route middleware
- [ ] Configure /learn/* routes to skip requireAuth

---

## Part 7 — Anonymous Rate Limiting

- [ ] IP-based rate limiter for Piston executions (10/min without auth, 60/min with auth)
- [ ] Apply to POST /execute or wherever Piston is triggered from public routes
- [ ] Test: 11th anonymous execution returns 429

---

## Backlog Cleanup

- [ ] Remove "interest-based selection" from Explore (implemented in Sprint 011)
- [ ] Update backlog with courses reference
- [ ] Archive Sprint 012

---

## Verification

1. Piston runs testCode exercises in production
2. Session.isExpired() used in route handler, tested
3. practice.ts < 350 lines after split
4. API client split into 4+ modules
5. WS handler has 5+ new tests
6. Share card shows approach_note
7. WCAG AA passes on all text-muted elements
8. Dashboard <200ms in production
9. Courses tables exist in schema (empty, ready for content)
10. Anonymous rate limit: 429 after 10 Piston calls/min
11. All existing tests pass (56+) + new WS tests
