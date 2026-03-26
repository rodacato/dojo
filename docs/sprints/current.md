# Active Block: Sprint 011 — Refactoring + Landing + Execution + Interests + E2E

**Started:** 2026-03-26
**Phase:** Phase 2 closing → Phase 1 Alpha prep

**Expected outcome:** Codebase limpio y mantenible, landing page lista para invitados, code execution real con Piston, selección de kata personalizada, smoke tests para prevenir regresiones.

**Strategy:** Refactoring primero (no amplificar deuda), luego features en orden de impacto per panel de expertos. Proposals (Phase 3) diferido a Sprint 012.

---

## Part 0 — Code Health & Architecture Refactoring

### Route file split
- [x] Split `practice.ts` (1,312 → 492 lines) into: practice.ts, dashboard.ts, profile.ts, admin-exercises.ts
- [x] Update router.ts to mount all new route files
- [x] Extract query-helpers.ts (verdictSubquery, calculateStreak)

### Frontend component extraction
- [x] Extract `TodayCard` and `RecentSessionRow` from DashboardPage → components/dashboard/
- [x] Move `useRotatingMessage` to hooks/useRotatingMessage.ts

### Error handling + Type safety
- [x] Fix silent email error swallowing (cron reminders logs with context)
- [x] Fix frontend `.catch(() => {})` patterns (ResultsPage, AdminEdit, AuthContext)
- [x] Remove `as unknown` in container.ts (BadgeEventHandler accepts DB type)
- [x] Fix `TOPICS as unknown as string[]` in admin pages (ChipSelect accepts readonly)

---

## Part 1 — Contrast/Legibility Fix

- [x] Change `--color-muted` from #475569 to #64748B in main.css
- [ ] Visual audit: verify all text-muted on bg-surface/bg-elevated passes WCAG AA

---

## Part 2 — Landing Page Redesign (Stitch)

- [x] Navbar: sticky, transparent → solid on scroll
- [x] Hero: eyebrow + typewriter headline + "To themselves." fade-in + terminal demo + DotGridBackground
- [x] "The Problem": 2-col prose with eyebrow "why it exists"
- [x] "How It Works": 4-step horizontal flow with arrow connectors
- [x] Social proof: 60+ kata counters + practitioner quotes
- [x] "Open Source": GitHub stats (live fetch + fallback) + CTAs
- [x] Access: 2-col with RequestAccessForm
- [x] Footer: redesign with Philosophy link + GitHub "Built in public"
- [x] Components: DotGridBackground.tsx (90 lines), ScrollFadeIn.tsx (54 lines)
- [x] Removed "What It's Not" section (per Soren)

---

## Part 5 — Sandboxed Code Execution (Piston)

### Infra
- [x] Add Piston to devcontainer docker-compose + production docker-compose (with healthcheck)
- [x] Add env vars: CODE_EXECUTION_ENABLED, PISTON_URL, PISTON_MAX_CONCURRENT, PISTON_RUN_TIMEOUT, PISTON_COMPILE_TIMEOUT
- [x] Update .env.example and config.ts

### Domain + Adapters
- [x] CodeExecutionPort + ExecutionResult in domain/practice/ports.ts
- [x] PistonAdapter (maps to Piston REST API, handles compile errors, timeouts)
- [x] MockExecutionAdapter (simple heuristic mock)
- [x] ExecutionQueue with concurrency limit + queue timeout
- [x] Exercise domain model gains testCode field

### Schema
- [x] Migration 0007: exercises.test_code TEXT, attempts.execution_result JSONB

### Integration
- [x] SubmitAttempt: accepts executionContext param, injects into LLM prompt
- [x] WS handler: runs code via queue before LLM, sends {executing} + {execution_result}
- [x] Sensei prompt context: 4 variants (all pass, some fail, compile error, timeout)
- [x] Frontend: ExecutionResultCard component + SenseiEvalPage integration (shows during wait + above sensei stream)
- [x] useEvaluationStream: executing + execution_done + executionResult states

### Seed
- [ ] Add testCode to 5-10 existing code exercises (deferred — current exercises are prose/refactoring, new test-friendly exercises needed)

---

## Part 3 — Interest-Based Kata Selection

### DB + Domain
- [x] Migration 0008: user_preferences table (level, interests[], randomness)
- [x] Drizzle schema + relations
- [x] ExerciseFilters extended with userLevel, interests, randomness

### API + Repository
- [x] findEligible with weighted ORDER BY (interest + level preference, controlled by randomness)
- [x] GET/PUT /preferences extended with level, interests, randomness
- [x] GetExerciseOptions fetches preferences before querying

### Frontend
- [x] DayStart: expandable "Customize your practice" (level, interest chips, randomness slider)
- [x] API client updated

### Tests
- [x] GetExerciseOptions.test.ts updated with DB mock

---

## Part 6 — E2E Smoke Tests + CI

- [x] Playwright setup in apps/e2e/ (workspace, tsconfig, playwright.config with webServer)
- [x] landing.spec.ts — hero headline, request access link, footer
- [x] auth-redirect.spec.ts — /dashboard without auth → redirect to /
- [x] dashboard.spec.ts — mocked auth + dashboard data, verifies streak
- [x] kata-flow.spec.ts — mocked auth, mood/duration selection, submit enabled
- [x] CI: e2e job in parallel with existing ci job
- [x] turbo.json: @dojo/e2e#test task (cache: false)

---

---

## Part 7 — Pre-Launch Hardening (per expert audit)

### Domain purity
- [x] Refactor GetExerciseOptions — UserPreferencesPort + PostgresPreferencesRepository, zero infra imports
- [ ] Move timer enforcement to Session.isExpired() domain method (deferred — low risk)

### Database performance
- [ ] Fix dashboard N+1 queries (deferred — needs Drizzle relational rewrite, medium effort)
- [x] Add DB indexes: sessions(user_id, status), attempts(session_id, submitted_at), exercises(status), kata_feedback(exercise_id)
- [x] Configure connection pool (max: 20, idle: 20s, max_lifetime: 30min)

### Test coverage (critical paths)
- [x] ExecutionQueue tests: concurrency limit, FIFO order, queue timeout, depth reporting (5 tests)
- [x] PistonAdapter tests: unsupported lang, success, compile error, SIGKILL timeout, HTTP error, network failure, SQL (7 tests)
- [ ] WebSocket handler tests (deferred — requires WS test harness, highest effort)
- [x] GetExerciseOptions.test.ts: proper port mocks, preference merging, override behavior (4 tests)

### Error handling
- [x] WS onError: log user ID + session ID + event before closing
- [x] LLM stream error: persist partial tokens from cache (not empty string), log error context
- [x] Error message to client stays generic (no detail leak per Marta)

---

## Deferred to Sprint 012

- Part 4: Exercise Proposals (Phase 3) — needs users generating feedback first
- Frontend execution (iframe/Sandpack for HTML/CSS/React katas)
- Guided courses mode
- API client split into modules
- Route file further split (feedback.ts, preferences.ts)

---

## Carried

- Landing page terminal demo with real kata evaluation (per Amara)
- Seed testCode for existing exercises (needs new test-friendly exercise design)
