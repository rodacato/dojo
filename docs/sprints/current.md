# Sprint 020 — Phase 1 expansion

**Started:** 2026-04-20
**Phase:** Phase 1 Alpha
**Theme:** Extend the catalog, close the acquisition loop, open new kata formats.

**PRDs:**
- [docs/prd/024-sprint-020-planning.md](../prd/024-sprint-020-planning.md) — sprint planning
- [docs/prd/025-python-course.md](../prd/025-python-course.md) — Python course "Python for the Practiced"
- [docs/prd/026-ask-the-sensei.md](../prd/026-ask-the-sensei.md) — "Ask the sensei" in course player
- [docs/prd/027-code-review-kata.md](../prd/027-code-review-kata.md) — "Code Review" kata format

**Spec:** _(to be written after Part 3 checkpoint)_

---

## Part 1 — UX/UI flow gap audit (Soren C6)

- [x] Walkthrough of key flows: onboarding, kata, course player, dashboard, profile, share
- [x] `docs/ux-gaps-2026-04.md` — 13 findings classified (2 blocker / 6 friction / 5 polish)
- [x] `ErrorState` component (`apps/web/src/components/ui/ErrorState.tsx`) — reusable full-screen / inline error UI with primary + secondary actions
- [x] **B-1** — Kata prepare: reduced poll ceiling 30→10 (~60s→20s), added "taking longer than usual" notice after ~8s, non-retryable errors surface immediately
- [x] **B-2** — `ResultsPage` handles `getSession` failure with ErrorState + retry (no more perpetual loader)
- [x] **F-1** — ErrorState retrofitted into `CoursePlayerPage`, `SharePage` (distinguishes 404 vs network), `PublicProfilePage` (distinguishes notfound vs network)
- [x] **F-2** — SenseiEvalPage shows "Evaluation complete — opening full analysis..." during the 1.5s auto-redirect window
- [x] **F-3** — `useEvaluationStream` WS close handler: unexpected close codes now set error state with reconnect affordance; only 1000 (clean) and 4001 (session expired) bypass the error UI
- [x] Remaining findings (F-4/F-5/F-6 + P-1..P-6) promoted to backlog (`docs/sprints/backlog.md` → Triaged — later)

---

## Part 2 — Acquisition loop (Amara C7 + Priya C1)

- [ ] Share card de completación de curso — dynamic OG image + `/share/course/:slug/:userId`
- [ ] Badge por curso completado — Recognition context extension
- [ ] CTA "Share your completion" en pantalla final del curso
- [ ] Migrar TS Fundamentals + JS DOM a público — flag + copy review

---

## Part 3 — PRDs (parallel — gate Part 4)

- [ ] PRD 025 — Python course "Python for the Practiced" (Nadia S7)
- [ ] PRD 026 — "Ask the sensei" in course player (Yemi C4)
- [ ] PRD 027 — "Code Review" kata format (Priya C1 + Hiroshi S1)

**Checkpoint:** once the 3 PRDs land, re-scope Part 4. If any reveals >1 week of effort, defer to Sprint 021.

---

## Part 4 — Implementation (post-PRD)

- [ ] Python course v1 skeleton — first 2-3 steps (L1) to validate format
- [ ] "Ask the sensei" MVP — contextual button, streaming, single prompt
- [ ] "Code Review" kata — 1 proof-of-concept kata end-to-end

---

## Part 5 — Editorial backfill

- [ ] `alternativeApproach` content for 6-8 key steps across TS / JS DOM / SQL

---

## Part 6 — Deploy + verify (Tomás C3 + Marta C5)

- [ ] Push 24+ pending commits → deploy
- [ ] Piston production verification (carry-forward S019)
- [ ] Dashboard EXPLAIN ANALYZE in production (carry-forward S019)

---

## Part 7 — Observability: error reporting (Tomás C3 + Marta C5)

Surfaced from the Part 1 audit — a `GET /u/rodacato` 500 in prod showed we have zero error management beyond `console.error` to stdout. See [ADR 017](../adr/017-error-reporting-port.md) for design rationale.

- [x] **7.4** — ADR 017: `ErrorReporterPort` + composable adapters (port lives in `infrastructure/observability/`, not domain)
- [x] **7.1** — API port + 4 adapters (`Console`, `Postgres`, `Sentry`, `Composite`) + 5 unit tests for `CompositeErrorReporter` fault isolation
- [x] **7.2** — Migration 0016 `errors` table + schema entry (retention policy script deferred — manual 30-day delete until traffic justifies a cron)
- [x] **7.3** — `router.ts` `onError` uses `errorReporter.report(...)`; `requestIdMiddleware` captures `requestId` into context; `POST /errors` endpoint for web reports (rate-limited, 30/min/IP)
- [x] **7.5** — Web `ErrorReporter` + 4 adapters (`Console`, `Api`, `SentryBrowser`, `Composite`) + wiring in `ErrorBoundary.componentDidCatch`, `window.onerror`, `unhandledrejection`
- [x] **7.6** — `GET /admin/errors?source=&status=&limit=` + `/admin/errors` page (reuses `AdminLayout`), newest-first, expandable rows, pagination
- [x] **7.7** — Sentry SDKs installed (`@sentry/node`, `@sentry/react`); adapters gated on `SENTRY_DSN` / `VITE_SENTRY_DSN` — **Sentry project provisioning still pending** (ops action, not code)
- [x] **7.8** — Source map upload on web build via `@sentry/vite-plugin`, activates only when `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` are all set; release = `VITE_SENTRY_RELEASE` (typically git SHA)
- [x] **7.9** — `README.md` + `.env.example` updated; new section "Observability" in README with all env vars
- [ ] **7.10** — End-to-end verification: trigger an error in prod → appears in all three sinks (Sentry, Postgres `errors` table, container stdout)

**Risks:**
- PII in Sentry breadcrumbs — sanitize user code/responses before send (Marta C5 review)
- Reporting loop — `CompositeErrorReporter` must swallow per-reporter failures; covered by unit test
- Sentry free quota cliff (5k/mo) — Postgres fallback catches overflow; alert on quota near-full configured in Sentry

---

## Risks

- **Scope creep** — 6 parts + 3 PRDs. Mitigation: mandatory checkpoint post-Part 3
- **Deploy blocking** — 24 commits ahead; blocks Part 6 and S019 carry-forwards
- **"Ask the sensei"** — touches sensei flow; prompt evaluation + rate limiting critical (Marta C5 must review)
- **"Code Review"** — new format, may require exercise-type changes or sensei-eval changes (Hiroshi S1)
- **Python course** — full course is too big; only the skeleton (2-3 steps) is realistic here

## Fallback

If mid-sprint we see we're not making it:
1. Parts 1, 2, 5, 6 are **non-negotiable** (acquisition + deploy)
2. From Parts 3-4 priority order: **Ask the sensei > Code Review > Python course** (Ask the sensei improves retention directly; Python is the 4th course — nice-to-have)
