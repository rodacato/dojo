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
