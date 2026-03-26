# Active Block: Sprint 011 — Refactoring + Landing + Execution + Interests + E2E

**Started:** 2026-03-26
**Phase:** Phase 2 closing → Phase 1 Alpha prep

**Expected outcome:** Codebase limpio y mantenible, landing page lista para invitados, code execution real con Piston, selección de kata personalizada, smoke tests para prevenir regresiones.

**Strategy:** Refactoring primero (no amplificar deuda), luego features en orden de impacto per panel de expertos. Proposals (Phase 3) diferido a Sprint 012.

---

## Part 0 — Code Health & Architecture Refactoring

### Route file split
- [ ] Split `practice.ts` (1,312 líneas) into: practice.ts, dashboard.ts, profile.ts, admin-exercises.ts
- [ ] Update router.ts to mount all new route files

### Reusable helpers
- [ ] Extract `verdictSubquery()` helper (repeated 5x)
- [ ] Extract `streakFromSessions()` helper (repeated 3x)
- [ ] Move timer enforcement to `Session.isExpired()` domain method

### Frontend component extraction
- [ ] Extract `TodayCard` and `RecentSessionRow` from DashboardPage
- [ ] Extract `ChatMessage` and `FollowUpForm` from SenseiEvalPage
- [ ] Move `useRotatingMessage` to hooks/

### Error handling + Type safety
- [ ] Fix silent email error swallowing (practice.ts)
- [ ] Fix frontend `.catch(() => {})` patterns
- [ ] Remove `as any` in share.ts, `as unknown` in container.ts, admin pages

---

## Part 1 — Contrast/Legibility Fix

- [ ] Change `--color-muted` from #475569 to #64748B in main.css
- [ ] Visual audit: verify all text-muted on bg-surface/bg-elevated passes WCAG AA

---

## Part 2 — Landing Page Redesign (Stitch)

- [ ] Navbar: transparent → solid on scroll
- [ ] Hero: eyebrow + typewriter headline + terminal demo + dot grid background
- [ ] "The Problem": 2-col prose
- [ ] "How It Works": 4-step horizontal flow
- [ ] Social proof: counters + practitioner quotes
- [ ] "Open Source": GitHub stats + CTAs
- [ ] Access: refined form + copy
- [ ] Footer: redesign
- [ ] Components: DotGridBackground.tsx, ScrollFadeIn.tsx

---

## Part 5 — Sandboxed Code Execution (Piston)

### Infra
- [ ] Add Piston to docker-compose.yml with healthcheck
- [ ] Add env vars: CODE_EXECUTION_ENABLED, PISTON_URL, PISTON_MAX_CONCURRENT
- [ ] Update .env.example

### Domain + Adapters
- [ ] CodeExecutionPort in domain/practice/ports.ts
- [ ] ExecutionResult, TestResult value objects
- [ ] PistonAdapter + MockExecutionAdapter
- [ ] ExecutionQueue with concurrency limit

### Schema
- [ ] Migration: exercises.test_code TEXT, attempts.execution_result JSONB

### Integration
- [ ] Modify SubmitAttempt to run execution before LLM
- [ ] WS messages: {type: 'executing'}, {type: 'execution_result'}
- [ ] Sensei prompt: conditional ## Test Results section (3 variants per Yemi)
- [ ] Frontend: show test results before sensei streaming in SenseiEvalPage

### Seed
- [ ] Add testCode to 5-10 existing code exercises

---

## Part 3 — Interest-Based Kata Selection

### DB + Domain
- [ ] Migration: user_preferences table (user_id, level, interests, randomness)
- [ ] UserPreferences value object in domain/identity/
- [ ] Extend ExerciseFilters with userLevel, interests, randomness

### API + Repository
- [ ] PostgresPreferencesRepository
- [ ] Extend GET/PUT /preferences endpoints
- [ ] Modify findEligible with weighted ordering query

### Frontend
- [ ] DayStart: optional "Customize" step (level + interests + randomness) per Soren
- [ ] API client methods

### Tests
- [ ] Update GetExerciseOptions.test.ts

---

## Part 6 — E2E Smoke Tests + CI

- [ ] Playwright setup in apps/e2e/
- [ ] landing.spec.ts — hero visible, nav, access form
- [ ] auth-redirect.spec.ts — /dashboard without auth → redirect
- [ ] dashboard.spec.ts — with mocked auth
- [ ] kata-flow.spec.ts — mood/duration → /kata navigation
- [ ] CI: add e2e job in parallel

---

## Deferred to Sprint 012

- Part 4: Exercise Proposals (Phase 3) — needs users generating feedback first
- Frontend execution (iframe/Sandpack for HTML/CSS/React katas)
- Guided courses mode

---

## Carried

- Landing page terminal demo with real kata evaluation (per Amara)
