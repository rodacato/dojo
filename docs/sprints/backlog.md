# Backlog

The backlog is not a task list — it is a set of prioritized intentions. Items arrive as raw ideas, get triaged before each block, and advance or get discarded based on the value they bring to the core loop.

---

## Untriaged

_Ideas that arrived and have not been evaluated yet. Candidates for the next triage._

_(cleared 2026-03-27)_

---

## Triaged — next block

_Confirmed for the next work block. Moved here after triage._

<!-- Sprint 020 items moved to current.md — 2026-04-20 -->

---

## Triaged — later

_Good ideas, not urgent. Not in the next block._

### Sprint 021+ candidates

Deferred desde Sprint 019:

- **Retrieval interleaving** — Lesson N tests usan identifiers introducidos en Lesson N-1. §3 del framework. Necesita PRD propio antes de sprint (Dr. Elif Yıldız)
- **Diff visual** entre la solución del learner y la `step.solution` reference. Polish posterior al "Alternative approach" ya shippeado en Sprint 019 (Soren)

Carry-forward from Sprint 020:

- **Dashboard EXPLAIN ANALYZE re-run** — S020 ran the 3 hottest queries against prod; plans were clean but DB volume was too small to validate the sprint-012 N+1 fix. Re-run once the alpha cohort has been active 2-3 weeks to catch seq scans that should have become index scans.

Carry-forward from 2026-04-22 kata-prep bugfix session (commits dfd2214, 469dd89, 64c565f):

- **Streaming in `generateSessionBody`** — `AnthropicStreamAdapter` already streams for `evaluate` but prep uses the blocking `.messages.create()`. Switching to `.messages.stream()` + SSE would bring perceived latency from ~30s to ~2s. Needs a mid-stream error strategy + feature flag fallback to the current blocking path (Yemi C4 + Tomás C3)
- **LLM telemetry table** — persist `llm_calls` (purpose, refId, model, input/output tokens, latencyMs, prompt/response preview, status) behind a `TelemetrySinkPort` with a Postgres adapter. Current state (stdout JSON + Sentry on error + `PostgresErrorReporter`) is enough for debug; this unlocks historical queries and an admin view (Darius C2 + Tomás C3)
- **Per-purpose LLM model config** — split `LLM_MODEL` into `LLM_MODEL_EVAL` + `LLM_MODEL_PREP` so prep can run on a cheaper/faster model (Haiku) independently of evaluation. Less urgent with Sonnet 4.6 in place, but still a latency lever if prep slows down again (Yemi C4)
- **Graceful deploy of web assets** — preserve old chunk files for N minutes on each deploy so tabs open across deploys don't need `lazyWithRetry` to reload. Polish — the reload path already works (Tomás C3)

Known issues (no action needed yet):

- Sessions with `status='failed'` and no attempts from before commit dfd2214 stay in the DB. They don't affect the streak (heatmap filters `EXISTS attempt with isFinalEvaluation`), don't show up in the dashboard (ResultsPage compact layout handles them), and the new code no longer creates them. Leave as-is.
- Rotating the LLM API key still requires editing `.env` and restarting the API. Addressed by the admin-settings PRD below.

Conditional on Sprint 020 checkpoint:

- **Python course full curriculum** — PRD 025 shippea en S020; el curso completo (2-3 sub-cursos × 8-12 steps) es S021+ (Nadia S7)
- **"Ask the sensei" full chat/quota** — si S020 solo shippea MVP (Opción A), threaded chat y quota-based son S021+ (Yemi)
- **"Code Review" full format** — schema change + UI + rubric + 3 katas. S020 solo shippea POC de 1 kata (Priya + Hiroshi)

UX gaps surfaced by the Sprint 020 Part 1 audit (kept standalone for Triaged — later):

- **F-4** — `SettingsPage` is fire-and-forget on every field (small "saving…/✓ saved" indicator). Users miss the signal. Panel recommendation: keep fire-and-forget, add a success toast (Soren)
- **F-5** — DayStart "Surprise me" fetches `/exercises` even when mood + duration are already selected. Skip the fetch and resolve to "go" directly
- **F-6** — `CoursePlayerPage` runs the anonymous→auth progress merge on every auth state change. Gate on a `hasMerged` ref so double-fires (focus loss + refreshed token) don't race
- **P-1** — Inconsistent headers: `HistoryPage` renders `<LogoWordmark />`, `ResultsPage` does not, both under the same AppShell. Pick one
- **P-2** — Loading states split between `<PageLoader />` and ad-hoc (e.g., `LearnPage` checks `!courses`, `ResultsPage` has its own shape). One contract per layout
- **P-3** — `console.error` in production code at `AuthContext:31`, `ResultsPage:20`, `AdminEditExercisePage:71`. Route through the logger or remove
- **P-4** — `AdminCoursesPage` line ~38: `refresh().catch(...)` on mount is not awaited — lossy loading boundary. Move to `useEffect` that awaits
- **P-5** — Web test coverage: 1 unit test file (`slots.test.ts`) for 66 pages/components. Regression risk high — needs a dedicated "testing backbone" sprint (Hiroshi S1)
- **P-6** — `SharePage` uses raw `fetch` instead of the API client — bypasses interceptors and error normalization. Switch to the shared client

### Acquisition hooks (post-S021)

- **Language playground console** — anonymous `/playground` surface so visitors can try a language + version (reusing Piston runtimes) with zero persistence, as a top-of-funnel hook into the kata loop. Phased: v0 hook only, v1 "ask the sensei" public surface, v2 course exit-ramp. Behind `FF_PLAYGROUND_CONSOLE_ENABLED`. PRD: [docs/prd/029-playground-console.md](../prd/029-playground-console.md). Promotion target: S023+ conditional on S021 closing cleanly and Phase 1 metrics validating the cohort.

### Phase 2 — The Scoreboard

- Psychological analysis view: patterns in how you respond (do you rush? do you avoid certain types?)
- Drawhaus diagram saved per session (whiteboard kata history)
- **Pre-generated kata-body bucket** — worker that keeps N ready-to-use bodies per `(exercise, variation)` so POST /sessions returns instantly instead of paying the LLM roundtrip. Panel agreed streaming first, bucket later; justify only when volume makes streaming-at-request insufficient (Tomás C3 + Yemi C4)

### Phase 3 — Feed the Dojo

- Invited users can propose exercises
- LLM QA gate: proposed exercises evaluated before human review
- Creator review queue: approve, reject, request changes
- Exercise versioning: update a kata without breaking active sessions
- `created_by` attribution: contributors get credit on the exercise card

---

## Explore (PRD needed)

_Ideas that need a PRD before deciding whether they advance._

- **Admin UI for runtime settings (LLM key rotation + friends)** — rotate the LLM key and other operational configs from `/admin` without a redeploy. Non-negotiables surfaced by the panel: `pgcrypto` encrypt-at-rest with a master key kept in env, append-only audit log of every change (who / when / IP), UI that only surfaces the last 4 characters after save, and a "Test connection" button. PRD needs to decide scope (LLM only vs. general settings), threat model of widening the admin surface, and migration path from env-based config (Marta C5 + Darius C2 + Soren C6)
- ~~Interest-based kata selection~~ — **Completed in Sprint 011** (user_preferences, weighted ordering, DayStart customization)

---

## Discarded

_Evaluated and discarded. Documented so the debate does not happen again._

- **Dojocho** (dedicated kata curation tool at scale) — out of scope for now, complexity not justified at current phases
- **Team dojos** (shared practice spaces for engineering teams) — contradicts the individual practice and curated community focus
- **Native mobile** — the web app is sufficient, mobile browser works
- **AI-generated exercises on demand** — too variable in quality, cannot guarantee the sensei's standard
- **Timed competitions** — contradicts the "practice over competition" philosophy
- **Certificates or badges for employers** — not the purpose of the product
