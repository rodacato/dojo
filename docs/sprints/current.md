# Sprint 022 — Open the door: friend cohort + public playground

**Started:** 2026-04-22
**Phase:** Phase 1 Alpha → hook experiment
**Theme:** Close the non-reactive carry-forward from S021 and ship the public playground hook (PRD 029, with v1 ask-sensei included in-sprint). The friend-cohort validation runs end-of-sprint on a product that is demonstrably stable AND has its first top-of-funnel surface.

**Shape:** ambitious. 8 parts including Part 0 reactive buffer. Built deliberately on top of each other — Piston hardening before playground, smoke tests before first invite, v0 before v1.

**PRD:** [docs/prd/029-playground-console.md](../prd/029-playground-console.md) (covers the playground surface; v1 scope widened — see Part 5)
**Spec:** _(to be written in Part 1 as `docs/specs/027-sprint-022-playground.md` once the multi-version Piston decision is locked)_

**Cohort:** creator + 1 friend (single invite dispatched in Part 7 — the S021 Part 8 deferred validation).

---

## Part 0 — Reactive buffer

Standing rule for the cohort runway. Bugs surfaced during the sprint are triaged out-of-band:

- Non-blocker → batched into a mid-sprint patch if volume warrants
- Blocker → ship a mini-patch, document as a commit
- Unknown severity → creator decides; err on the side of patching

Explicit as Part 0 because S021's retro proved this structure needs room for unplanned work from day one.

---

## Part 1 — Piston hardening + multi-version runtimes (Tomás C3)

Prerequisite for the playground. Cannot open anonymous code execution on top of an unmonitored, single-version Piston pool.

- [ ] Synthetic `/health/piston` check every 5 min with alert (liveness design — pick A/B/C from S021 spec 026 during execution)
- [ ] `scripts/piston-reprovision.sh` — idempotent reinstall of runtimes, covers bump scenarios
- [ ] ADR 019 committed with liveness + reprovision design rationale
- [ ] README runbook section for on-call-equivalent recovery
- [ ] **Runtime bump**: upgrade Go (1.16.2 → current stable), Ruby (3.0.1 → 3.3+), Rust (1.68.2 → current stable). Python 3.12 and TypeScript 5.0.3 stay.
- [ ] **Multi-version install** — Python 3.10 alongside 3.12 (the pedagogical gap: `match` lands at 3.10, `TaskGroup` at 3.11, everything else at 3.12). Decide during execution whether to add Node 18+20 too.
- [ ] `PISTON_MAX_CONCURRENT` bump OR separate Piston pool for playground — pick one during execution after measuring single-pool contention risk.

**Done when:** `/health/piston` alerts fire on a simulated outage; reprovision script restores all runtimes on a clean VM; multi-version dropdown data is available to Part 4.

---

## Part 2 — Errors retention cron (Tomás C3)

Short, infrastructural. Reused as the mechanism for `playground_runs` 30-day purge in Part 4.

- [ ] 30-day cleanup on the `errors` table (pg_cron / accessory cron / GHA — pick one during execution)
- [ ] Observable (log line or metadata row on each run)
- [ ] Manual escape-hatch runs cleanly
- [ ] Mechanism documented clearly enough that Part 4 can apply it to `playground_runs` with ~1 hour of copy-paste

---

## Part 3 — Smoke test expansion (Hiroshi S1)

Ship the safety net **before** opening the playground surface. Playground regressions without smoke tests are invisible until a visitor sees them.

- [ ] `sign-in.smoke.spec.ts`
- [ ] `complete-kata.smoke.spec.ts` (mock LLM)
- [ ] `complete-course-step.smoke.spec.ts`
- [ ] `view-dashboard.smoke.spec.ts`
- [ ] `view-profile.smoke.spec.ts`
- [ ] **Added scope:** `playground-anon-run.smoke.spec.ts` once Part 4 lands
- [ ] Suite < 3 min on prod or staging from CI on `workflow_dispatch`

---

## Part 4 — Playground v0 (anonymous hook) (Tomás C3 + Marta C5 + Soren C6)

PRD 029 Option A scope. Marta's 4-layer abuse stack is non-negotiable — missing any one of the four blocks the merge.

**Surface:**
- [ ] Routes: `/playground` (default language) + `/playground/:language` (SEO-friendly)
- [ ] Editor (CodeMirror — already in the bundle from the kata flow)
- [ ] `[Language ▼] [Version ▼]` dropdowns. Version dropdown honest: current version by default; older versions collapsed under an "advanced versions" toggle (Soren)
- [ ] `▶ Run` button + output panel (stdout/stderr/exitCode/runtimeMs)
- [ ] Persistent CTA banner: "Like running code? **Practice with a kata →**" linking to `/request-access` or `/dashboard` if authed
- [ ] **Zero persistence v0** — not even localStorage. Session-pure.

**Backend:**
- [ ] `POST /playground/run` — body `{ language, version, code }`, returns execution result. Auth optional.
- [ ] Rate limiting via new `playgroundLimiter`:
  - Anon: 10/min + 100/day per IP, 10/min + 100/day per browser-session cookie
  - Authed: 60/min + 1000/day per user
- [ ] **Global daily quota** — separate bucket from kata/courses. Surface returns "playground is recovering, try again in N minutes" when hit, without affecting kata.
- [ ] **Cloudflare Turnstile** gate — invisible mode by default, interactive if score is suspicious; token validated server-side before forwarding to Piston
- [ ] **Piston hardening per request:** `run_timeout: 3000`, `compile_timeout: 10000`, memory cap explicit, network egress disabled
- [ ] **Input cap:** Zod schema limits `code` to 16 KB, rejects at boundary

**Data + ops:**
- [ ] `playground_runs` table — `id, ip_hash, session_hash, language, version, exit_code, runtime_ms, created_at`. **No source code persisted.**
- [ ] 30-day cron purge (reuses Part 2 mechanism)
- [ ] Metrics events from day 1: `playground_run`, `playground_cta_click`, `playground_signup_conversion`
- [ ] Feature flag `FF_PLAYGROUND_CONSOLE_ENABLED` (Zod-coerced boolean, default `false`) in `apps/api/src/config.ts`. When off: route returns 404, `/playground` page redirects to `/`.

**Done when:** flag on, a visitor runs code anonymously through the full abuse stack, `playground_run` event lands in metrics, CTA click is instrumented, and a 200 req/min burst from a single IP gets shut down by layer 2 before it reaches Piston.

---

## Part 5 — Playground v1: ask-sensei (logged-in) (Yemi C4 + Marta C5)

Widened from the PRD's deferred position because the user explicitly wants this in-sprint. Hard constraint: **authenticated users only** — anonymous LLM access is not in scope and will not be in this sprint no matter how nicely asked.

- [ ] New prompt design for free-form questions (no rubric, no `ownerContext`, no session lineage). Yemi owns the prompt; keep ≤ 512 output tokens by default.
- [ ] `POST /playground/ask` — body `{ question, code?, language? }`, auth required, streams response via SSE
- [ ] **Token quota per user per day** — hard cap (e.g. 30 asks/day). When hit: "you've hit the daily sensei limit, try again tomorrow".
- [ ] Cost budget: same model as kata-prep (currently Sonnet 4.6). Do NOT open to unbounded generation.
- [ ] UI integration: "Ask the sensei" button in the playground, visible only when authed. Response panel beside the output panel.
- [ ] Feature flag `FF_PLAYGROUND_ASK_SENSEI_ENABLED` (separate from playground v0 flag — v0 can ship without v1 if v1 runs into prompt issues)
- [ ] Log asks to `llm_requests_log` (new lightweight table, not the full telemetry design from the backlog — just `user_id, asked_at, input_tokens, output_tokens, model`) for cost accountability
- [ ] Add a "disclaimer" line under the ask result: "This is a free exploration tool, not graded practice. Kata is where the sensei actually evaluates."

**Done when:** authed user asks a question, sensei streams a focused answer, per-user daily quota visibly drains and enforces, and an unauthenticated session sees only the regular code-execution playground.

---

## Part 6 — Streaming in `generateSessionBody` (Yemi C4 + Tomás C3)

Latency win adjacent to the playground LLM surface. Same `AnthropicStreamAdapter` gets touched in Part 5; doing the prep-streaming conversion in the same sprint avoids a second round-trip to the same code.

- [ ] Swap `.messages.create()` for `.messages.stream()` in `generateSessionBody`
- [ ] SSE endpoint for the frontend polling loop replacement — `GET /sessions/:id/body-stream`
- [ ] Frontend switches from 2s polling to SSE subscription in `KataActivePage`
- [ ] Mid-stream error: client keeps the partial text + shows a "connection dropped, click to retry" affordance
- [ ] Feature flag `FF_LLM_PREP_STREAMING_ENABLED`, default off — flip to on only after a smoke run in staging with the real LLM
- [ ] Keep the current blocking path alive under the flag as fallback

**Done when:** user sees the kata body appear token-by-token within ~2s of submitting exercise selection, and turning the flag off reverts cleanly to the polling path.

---

## Part 7 — First invite dispatch (validation)

Carried from S021 Part 8. Only happens after Parts 1-6 are green.

- [ ] Creator sends the single invite at the **earliest** when Parts 1-3 close cleanly; playground parts may still be WIP
- [ ] Friend completes ≥1 kata without creator intervention
- [ ] Friend optionally touches the playground (observe conversion from landing → playground → signup → kata — this is the metric that matters for v0)
- [ ] Feedback captured in `docs/audits/2026-04-friend-feedback.md` (new scaffold, dated, must be populated or cut within the sprint — no more ghost audit docs)
- [ ] Blocker-severity findings → Part 0 reactive patch or next-sprint triage

---

## Out of scope (explicit)

Out this sprint no matter how tempting:

- **Playground v0.1 multi-version rollout beyond Python 3.10+3.12.** Go/Ruby/Rust stay single-version until there's user-voiced demand. TS stays single-version permanently (no one teaches TS <5).
- **Reminder email verification** (S021 Part 6) — bump to a reactive-buffer stretch task if energy allows, otherwise backlog.
- **Per-purpose LLM model split** (`LLM_MODEL_EVAL` / `LLM_MODEL_PREP`) — not coupled with Part 6, stays in backlog.
- **UX gaps F-4..F-6 + P-1..P-6** — backlog, unless audit-surfaced during Part 7.
- **Persistence in the playground** (save, share URL, localStorage) — deliberately deferred per PRD 029. Will show up as user requests within a week of launch — say no.
- **Admin UI for runtime settings** (LLM key rotation etc) — stays in Explore/PRD-needed; not a sprint-022 concern.

---

## Risks

- **Scope too wide for one sprint.** Parts 1 + 4 + 5 are each non-trivial; stacking them plus smoke tests plus LLM streaming is a lot. *Mitigation:* the order is deliberate — if we fall short, cut Part 6 (streaming) first, then Part 5 (ask-sensei v1 behind its own flag so it can slip), then Part 7 (dispatch can move to S023). Parts 1-4 are the hard floor.
- **Piston contention** — playground bursts delay kata evaluations. *Mitigation:* Part 1 decides between `PISTON_MAX_CONCURRENT` bump and separate pool before Part 4 opens the flag.
- **Abuse spike at launch** — anonymous code execution is the highest-risk surface ever shipped. *Mitigation:* Marta's 4-layer stack is enforced in Part 4 DoD; missing any of the four blocks merge.
- **Ask-sensei cost blow-up** — authed user with a 30/day quota at Sonnet 4.6 rates can still cost real money if the quota or model is misconfigured. *Mitigation:* Part 5 quota is hard-enforced server-side, not client-side; Sentry alert on `llm_requests_log` daily cost crossing threshold.
- **First-friend invite delayed again** — S021 Part 8 was deferred; Part 7 could be too if any Blocker emerges. *Mitigation:* decouple dispatch from playground completion — Parts 1-3 closing clean is sufficient to dispatch, playground can ship after friend is onboarded.
- **Prompt drift on ask-sensei** — the new free-form prompt is a new prompt surface, untested against Yemi's rubric. *Mitigation:* Yemi reviews the prompt in-sprint before `FF_PLAYGROUND_ASK_SENSEI_ENABLED` flips on in prod.

---

## Compass check (do not lose sight)

The whole sprint answers one question: **can a visitor go from landing → playground → signup → first kata pass without the creator holding anyone's hand?** If any part breaks that path, it is a blocker. If a part makes that path better, it is in scope. If a part is unrelated, it is out of scope, no matter how interesting.
