# Sprint 020 — Phase 1 expansion

**Started:** 2026-04-20
**Closed:** 2026-04-21
**Phase:** Phase 1 Alpha
**Theme:** Extend the catalog, close the acquisition loop, open new kata formats.

**PRDs:**
- [docs/prd/024-sprint-020-planning.md](../../prd/024-sprint-020-planning.md) — sprint planning
- [docs/prd/025-python-course.md](../../prd/025-python-course.md) — Python course "Python for the Practiced"
- [docs/prd/026-ask-the-sensei.md](../../prd/026-ask-the-sensei.md) — "Ask the sensei" in course player
- [docs/prd/027-code-review-kata.md](../../prd/027-code-review-kata.md) — "Code Review" kata format

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

- [x] Share card de completación de curso — dynamic OG image + `/share/course/:slug/:userId` (satori-based, mirrors kata share)
- [x] Badge por curso completado — `CourseCompleted` domain event + 3 per-course badges (TS/JS DOM/SQL); migration 0017
- [x] CTA "Share your completion" en pantalla final del curso — banner in `CoursePlayerPage` with native share + clipboard + Twitter intent fallback
- [x] Migrar TS Fundamentals + JS DOM a público — `isPublic: true` in seed data; admin `/admin/courses` toggle also works

---

## Part 3 — PRDs (parallel — gate Part 4)

- [x] PRD 025 — Python course "Python for the Practiced" (Nadia S7) → **Option A: mini-course, 8-10 steps, ~15-20h authoring**
- [x] PRD 026 — "Ask the sensei" in course player (Yemi C4) → **Option A: single-shot nudge, no memory, ~1-2 days**
- [x] PRD 027 — "Code Review" kata format (Priya C1 + Hiroshi S1) → **Option A: 1 POC kata, schema additive, ~3-4 days**

**Checkpoint outcome:** all three PRDs landed on the "ship small and cheap" option. Combined budget is ~10-12 days of author/build time, which fits a sprint *if everything else stays tight*. Panel priority for Part 4 execution (matches Fallback in `current.md` header):

1. **Ask the sensei MVP** — ships first. Highest retention impact, smallest scope.
2. **Code Review POC (1 kata)** — ships second. Novel format, locally-testable.
3. **Python mini-course skeleton (L1 only, ~3 steps)** — ships third if time permits; full L1-L3 slides to S021.

---

## Part 4 — Implementation (post-PRD)

- [x] **4.1 Ask the sensei MVP** — LLMPort extension + GenerateNudge use case + POST /learn/nudge + rate limiter + COURSE_NUDGE_ENABLED flag + inline UI. Persistence layer (step_nudges table + 👍👎 feedback) shipped in the same sprint.
- [x] **4.2 "Code Review" kata POC** — `'review'` exercise type + nullable `rubric JSONB` (migration 0019) + buildReviewPrompt + GenerateSessionBody short-circuit + seeded "Inventory drift bug" kata with 5-issue rubric + TypeBadge REVIEW variant + editor wiring.
- [x] **4.3 Python course skeleton** — `python-for-the-practiced` (status: draft), L1 with 2 steps (intro read + `@dataclass` exercise). Python test harness in-file. L1.3 (match), L1.4 (Enum), L2+L3 slide to S021 per Part 3 checkpoint.

---

## Part 5 — Editorial backfill

- [x] `alternativeApproach` content for 6 key steps: TS L1.3 (template literal vs concatenation), TS L1.4 (arrow vs function), TS L2.2 (for-of vs reduce), TS L3.2 (concatenation form of FizzBuzz), JS DOM L1.2 (innerText vs textContent), SQL L1.2 (DENSE_RANK vs RANK).

---

## Part 6 — Deploy + verify (Tomás C3 + Marta C5)

- [x] Push 24+ pending commits → deploy
- [x] **Piston production verification** (carry-forward S019) — surfaced a 3-week-old crashloop. Root cause: cgroup v2 host upgrade silently broke the accessory. Fix: `privileged: true` + `cgroupns: host` + named volume for `/piston/packages` + pinned image digest. Captured in [ADR 018](../../adr/018-piston-cgroupns-host.md). 6 runtimes reinstalled (python 3.12.0, typescript 5.0.3, sqlite3 3.36.0, go 1.16.2, ruby 3.0.1, rust 1.68.2), `/health/piston` returns `status: ok` in prod.
- [x] **Dashboard EXPLAIN ANALYZE in production** (carry-forward S019) — 3 queries profiled (weak areas unnest, recent sessions + verdict subquery, heatmap 30d). Execution 0.07–0.27 ms, all plans clean. Seq scans are correct at this volume (1 session total in prod) — Postgres chooses seq scan over index for tiny tables. **Caveat:** insufficient data to validate the sprint-012 N+1 fix. Re-run after the alpha cohort has been active 2-3 weeks (tracked in S021+ backlog).

---

## Part 7 — Observability: error reporting (Tomás C3 + Marta C5)

Surfaced from the Part 1 audit — a `GET /u/rodacato` 500 in prod showed we have zero error management beyond `console.error` to stdout. See [ADR 017](../../adr/017-error-reporting-port.md) for design rationale.

- [x] **7.4** — ADR 017: `ErrorReporterPort` + composable adapters (port lives in `infrastructure/observability/`, not domain)
- [x] **7.1** — API port + 4 adapters (`Console`, `Postgres`, `Sentry`, `Composite`) + 5 unit tests for `CompositeErrorReporter` fault isolation
- [x] **7.2** — Migration 0016 `errors` table + schema entry (retention policy script deferred — manual 30-day delete until traffic justifies a cron)
- [x] **7.3** — `router.ts` `onError` uses `errorReporter.report(...)`; `requestIdMiddleware` captures `requestId` into context; `POST /errors` endpoint for web reports (rate-limited, 30/min/IP)
- [x] **7.5** — Web `ErrorReporter` + 4 adapters (`Console`, `Api`, `SentryBrowser`, `Composite`) + wiring in `ErrorBoundary.componentDidCatch`, `window.onerror`, `unhandledrejection`
- [x] **7.6** — `GET /admin/errors?source=&status=&limit=` + `/admin/errors` page (reuses `AdminLayout`), newest-first, expandable rows, pagination
- [x] **7.7** — Sentry SDKs installed (`@sentry/node`, `@sentry/react`); adapters gated on `SENTRY_DSN` / `VITE_SENTRY_DSN` — **Sentry project provisioning still pending** (ops action, not code)
- [x] **7.8** — Source map upload on web build via `@sentry/vite-plugin`, activates only when `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` are all set; release = `VITE_SENTRY_RELEASE` (typically git SHA)
- [x] **7.9** — `README.md` + `.env.example` updated; new section "Observability" in README with all env vars
- [x] **7.10** — End-to-end verification: all 3 sinks confirmed in prod. Test method note: `throw` directly in DevTools console does NOT fire `window.onerror` in Chrome (console has its own context) — had to use `setTimeout(() => { throw ... }, 0)` and `Promise.reject(...)` to exercise the handlers. Postgres `errors` table received both events; API + web container stdout showed the `[web]` ConsoleErrorReporter lines; Sentry received the events once the CSP `connect-src` was extended to allow `*.ingest.us.sentry.io` (commit 6f60520) and the build was redeployed.

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

---

## Retro

**Wins:**
- 7 parts shipped including all three PRD options at the "small and cheap" variant. The Part 3 checkpoint (matrix panel vote on Option A vs B vs C for each PRD) was the single highest-leverage decision in the sprint — without it we would have built at least one PRD in its full-scope form and run out of runway.
- Observability landed as a real port + adapter layer (ADR 017) rather than a Sentry SDK wired into `router.ts`. The `CompositeErrorReporter` earned its keep within 24 hours: Sentry was silently blocked by CSP in prod, yet Postgres + stdout kept receiving events, so nothing was lost while we debugged.
- `/health/piston` was a 30-minute fix that would have saved us from a real user-facing outage — except it revealed one that had already been happening for 3 weeks in the background. The "sprint-012 dashboard N+1" of observability: you build the monitor, then you find what was silently broken.

**Surprises:**
- **Piston had been crashlooping in prod for ~3 weeks** (ADR 018). A host kernel upgrade tightened cgroup v2 delegation; the Kamal config that used to work silently became insufficient. Neither the app container nor the proxy health check touched Piston, so the only signal was code execution returning sandbox errors — which the sensei evaluator swallowed. Fix was trivial once diagnosed (`cgroupns: host`); the lesson is that every self-hosted accessory needs its own health endpoint *before* prod.
- **CSP silently blocked Sentry web-direct** (commit 6f60520). The nginx CSP's `connect-src` had never included `*.ingest.us.sentry.io`. Server-side fan-out hid this from us until the 7.10 verification exposed it.
- **The verification method for 7.10 was itself a trap.** `throw new Error(...)` directly in the DevTools console does NOT fire `window.onerror` in Chrome — the console has its own context. We had to switch to `setTimeout(() => { throw … }, 0)` and `Promise.reject(...)` to exercise the global handlers. Documented in the Part 7.10 checkbox as a note for future verifications.
- **Prod DB has only 1 session**, so the Dashboard EXPLAIN ANALYZE ran against essentially an empty table. Plans are clean but the N+1 fix from sprint-012 can't be validated at this volume. Flagged as a carry-forward post-alpha cohort.

**Carry-forward to Sprint 021+:**
- Dashboard EXPLAIN ANALYZE re-run once the alpha cohort has been active 2-3 weeks (backlog → Triaged later)
- Operational gaps for Phase 1 Alpha — none of these have owners in-sprint yet:
  - Define a measurable criterion for "Alpha complete" — ROADMAP says *"3-5 invited users complete kata consistently and come back"*, but there is no metric. Without it, there is no Phase 2 gate.
  - Market study cohort — 15-30 designed contacts in `docs/MARKET_STUDY.md`; results section still blank. Needs to actually run before inviting alpha.
  - Activity dashboard for alpha tracking — no aggregate view of "who practiced, when, did they come back".
- Observability debt:
  - Retention policy for the `errors` table (cron, not manual 30-day delete)
  - Sentry project provisioning confirmed in prod — the *code* path works; the Sentry dashboard / alert rules / team access are ops work
- Editorial:
  - `alternativeApproach` for the remaining steps (Python course, TS L2 gaps, SQL L2+)
  - Python course L1.3 / L1.4 / L2 / L3 — deferred per Part 3 checkpoint
- Product features held for data:
  - "Ask the sensei" v2 (threaded chat, quota) — needs usage signal from MVP first
  - "Code Review" full format (3 katas, richer rubric UI) — one POC is live; second kata is the test of whether format fits
  - NoSQL / MongoDB / Cassandra kata infrastructure — *not* pursuing per the S020 exploration (see CHANGELOG; path is review/chat/whiteboard kata, not REPL-per-session infra)
