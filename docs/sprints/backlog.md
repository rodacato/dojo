# Backlog

The backlog is not a task list — it is a set of prioritized intentions. Items arrive as raw ideas, get triaged before each block, and advance or get discarded based on the value they bring to the core loop.

---

## Untriaged

_Ideas that arrived and have not been evaluated yet. Candidates for the next triage._

- **Prompt engineering kata** (new exercise type) — user is given a problem; user writes the prompt that would solve it; sensei evaluates the prompt by rubric (clarity, context, constraints, output format, edge cases, example provision) rather than "% likelihood it would resolve". Needs explicit `target model` field in exercise body. Risk: brand tension with Dojo's anti-vibe-coding stance — needs framing as "prompting is a directing skill, not a substitute skill" (consistent with VISION.md) before PRD. No domain change — new `Exercise` type + per-type `owner_context` template (Yemi C4 + Priya C1 + Valentina S2)
- **Design judgment kata** (new exercise type) — user is given a problem (or an existing solution) + real-world constraints (legacy code, junior-heavy team, short timeline); user proposes patterns/architecture; sensei evaluates whether the reasoning fits the constraints rather than whether the pattern is "correct". Constraints-first, patterns as candidate answers. Exercise body must carry enough context (code samples, system description) for constraints to bind — otherwise becomes a vocabulary quiz. On-brand: "process over correctness" applied to architecture. No domain change — new `Exercise` type + per-type `owner_context` template (Valentina S2 + Elif S5 + Darius C2)

---

## Triaged — next block

_Confirmed for the next work block. Moved here after triage._

<!-- Sprint 020 items moved to current.md — 2026-04-20 -->

---

## Triaged — later

_Good ideas, not urgent. Not in the next block._

### Sprint 023+ candidates

**Hard carry-forward from S022:**

- **First friend invite dispatch + audit doc fill-in** — code surface ready since S021. Audit doc scaffolded at [docs/audits/2026-04-friend-feedback.md](../audits/2026-04-friend-feedback.md) with the rule that it gets populated within 7 days of dispatch or the doc is cut and the slot rotates.
- **Smoke-suite staging environment** — S022 shipped `complete-kata.smoke.spec.ts` and `playground-anon-run.smoke.spec.ts`, both gated on operator-set env vars (`SMOKE_USE_MOCK_LLM`, `SMOKE_PLAYGROUND_ENABLED`). On prod runs both skip, so the post-deploy safety net misses two of the surfaces this sprint built. Stand up a staging deploy with `LLM_ADAPTER_FORMAT=mock` + Turnstile dummy keys so the full suite runs on every deploy.
- **Piston runtime bumps for Go / Ruby / Rust** — upstream-blocked. `engineer-man/piston` ships only Go 1.16.2, Ruby up to 3.0.1, Rust up to 1.68.2. Promote when there's a concrete pedagogical need; resolution requires either adopting a maintained fork or building a custom package layer.

**Carry-forward from earlier sprints (still valid):**

- **Retrieval interleaving** (S019) — Lesson N tests usan identifiers introducidos en Lesson N-1. §3 del framework. Necesita PRD propio antes de sprint (Dr. Elif Yıldız)
- **Diff visual** (S019) — entre la solución del learner y la `step.solution` reference. Polish posterior al "Alternative approach" ya shippeado en S019 (Soren)
- **Dashboard EXPLAIN ANALYZE re-run** (S020) — re-run the 3 hottest queries once the alpha cohort has been active 2-3 weeks; DB volume in S020 was too small to validate the sprint-012 N+1 fix.
- **LLM telemetry table** — persist `llm_calls` (purpose, refId, model, input/output tokens, latencyMs, prompt/response preview, status) behind a `TelemetrySinkPort` with a Postgres adapter. S022 added the lightweight `llm_requests_log` for ask-sensei cost only; the full telemetry table is still pending. Current state (stdout JSON + Sentry on error + `PostgresErrorReporter`) is enough for debug; this unlocks historical queries and an admin view (Darius C2 + Tomás C3)
- **Per-purpose LLM model config** — split `LLM_MODEL` into `LLM_MODEL_EVAL` + `LLM_MODEL_PREP` so prep can run on a cheaper/faster model (Haiku) independently of evaluation. Less urgent now that streaming has reduced the latency pain, but still a cost lever (Yemi C4)
- **Graceful deploy of web assets** — preserve old chunk files for N minutes on each deploy so tabs open across deploys don't need `lazyWithRetry` to reload. Polish — the reload path already works (Tomás C3)

**Known issues (no action needed yet):**

- Sessions with `status='failed'` and no attempts from before commit dfd2214 stay in the DB. They don't affect the streak (heatmap filters `EXISTS attempt with isFinalEvaluation`), don't show up in the dashboard, and the new code no longer creates them. Leave as-is.
- Rotating the LLM API key still requires editing `.env` and restarting the API. Addressed by the admin-settings PRD below.
- Single-process in-memory state for ask-sensei concurrency (`inFlightStreams: Set<string>`) and rate limiters. Acceptable now; not acceptable once we run > 1 API process. Move to Redis or DB-backed rate-limit if we ever scale horizontally.

**Conditional on S022 friend-cohort outcome:**

- **Python course full curriculum** (S020 carry) — PRD 025 shippea en S020; el curso completo (2-3 sub-cursos × 8-12 steps) sigue pendiente. Reabrir según señal del primer friend (Nadia S7)
- **"Code Review" full format** (S020 carry) — schema change + UI + rubric + 3 katas. POC de 1 kata ya shippeado; el formato completo es candidate (Priya + Hiroshi)
- **Playground v2 — course exit-ramp** — once a learner finishes a course step, surface a "keep exploring" affordance that lands them on `/playground/:language` with their last solution prefilled. Funnel-from-exit, not funnel-from-entry. Trigger: playground v0 + v1 metrics show non-trivial conversion (post-S023).

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
