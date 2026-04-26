# Sprint 022 — Open the door: friend cohort + public playground

**Started:** 2026-04-22
**Closed:** 2026-04-26
**Phase:** Phase 1 Alpha → hook experiment
**Theme:** Close the non-reactive carry-forward from S021 and ship the public playground hook (PRD 029, with v1 ask-sensei included in-sprint). The friend-cohort validation runs end-of-sprint on a product that is demonstrably stable AND has its first top-of-funnel surface.

**Shape:** ambitious. 8 parts including Part 0 reactive buffer. Built deliberately on top of each other — Piston hardening before playground, smoke tests before first invite, v0 before v1.

**PRD:** [docs/prd/029-playground-console.md](../../prd/029-playground-console.md) (covers the playground surface; v1 scope widened — see Part 5)
**Spec:** [docs/specs/027-sprint-022-playground.md](../../specs/027-sprint-022-playground.md)

**Cohort:** creator + 1 friend. Invite dispatch carried forward to S023 — code surface is shipped, dispatch is a humans-only follow-up and was not blocked by anything in this sprint.

---

## What actually shipped

All seven engineering parts landed; the eighth (invite dispatch) is a human action and is carried into S023 alongside the friend-feedback audit doc that is now scaffolded and waiting to be populated.

Highlights:

- **Playground v0** end-to-end with all four abuse layers — anonymous code execution at `/playground`, four-language Piston whitelist, `playground_runs` log without source code, Turnstile + per-IP + per-session + global daily quota, funnel metrics from day one.
- **Playground v1 — ask-sensei** auth-only, SSE-streamed, hard daily quota per user (default 30/day), `llm_requests_log` table without question or answer text, in-product disclaimer baked into the modal.
- **Streaming kata prep** behind `FF_LLM_PREP_STREAMING_ENABLED` — `GET /sessions/:id/body-stream` SSE endpoint, frontend prefers SSE and falls back to the 2s polling path on 404 so the flag rollout is safe.
- **Smoke suite** at six specs (sign-in, view-profile, view-dashboard, complete-course-step, complete-kata, playground-anon-run). `complete-kata` and `playground-anon-run` skip cleanly on prod runs that don't carry the mock-LLM / Turnstile-bypass env, so a single workflow run works against both staging and prod.
- **Errors retention cron** + Piston liveness + idempotent reprovision script + ADR 019 — operational floor for an anonymous-traffic surface.

Commits in the window (2026-04-22 → 2026-04-26):

- `b7b4c89` docs: Spec 027 — Sprint 022 playground + friend cohort
- `694d831`–`274e049` Part 3 — smoke scaffold + sign-in / public profile / complete-course-step specs
- `c44a57d` Part 2 — errors retention cron
- `51564ca` Part 1 — Piston liveness + idempotent reprovision
- `b86dbfd`–`98ea6b1` Part 4 — playground v0 in seven steps (table → endpoint → rate limiters → global quota → Turnstile → UI → metrics)
- `73de99d`, `971851c` deploy plumbing — playground + cron env vars through GHA + Kamal
- `df636ed`, `3d60857` Turnstile widget + layout polish
- `6a6d972`, `14e1d44` deploy fixes — VITE_TURNSTILE_SITE_KEY ARG, Turnstile origin in CSP
- `c25b541` Part 0 — sync public-courses fixtures with current code
- `68523c2` Turnstile invisible-size fix
- `24cc7a2` Piston liveness — use repo var, drop cadence to 30 min
- `d6a16b2` Part 3 — finish smoke suite (complete-kata + playground-anon-run) + document Piston upstream bump block
- `17f60dd` Part 6 — stream kata-prep body via SSE behind FF
- `5e9d1ef` Part 5 — ask-sensei v1 auth-only streaming Q&A behind FF

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

---

## Closed status by part

- **Part 0 — Reactive buffer.** Held as planned: kata-prep edge cases caught in S021 stayed quiet, layout / Turnstile / CSP fixes batched as patch commits without derailing planned work.
- **Part 1 — Piston hardening + multi-version runtimes.** Liveness + reprovision + ADR 019 + runbook shipped (`51564ca`, `24cc7a2`). Multi-version Python 3.10+3.12 wired in. **Runtime bumps for Go / Ruby / Rust were upstream-blocked** — `engineer-man/piston` ships only Go 1.16.2, Ruby up to 3.0.1, Rust up to 1.68.2. The bump moved to backlog as a conditional item on adopting a maintained fork or building our own package layer.
- **Part 2 — Errors retention cron.** Done (`c44a57d`). Reused as the `playground_runs` 30-day purge mechanism in Part 4 as planned.
- **Part 3 — Smoke test expansion.** Six specs shipped end-to-end. `complete-kata` is gated on `SMOKE_USE_MOCK_LLM=1` so prod runs never burn tokens; `playground-anon-run` is gated on `SMOKE_PLAYGROUND_ENABLED=1` so a real Turnstile secret on prod doesn't fail it.
- **Part 4 — Playground v0.** Done with the full four-layer abuse stack and zero-persistence guarantee, including funnel metrics from day one. Pinned to `FF_PLAYGROUND_CONSOLE_ENABLED`.
- **Part 5 — Playground v1: ask-sensei.** Done — streamed answer, `llm_requests_log` cost log, hard 30/day quota per user, in-modal disclaimer. Anonymous LLM access stayed out of scope. Pinned to `FF_PLAYGROUND_ASK_SENSEI_ENABLED`.
- **Part 6 — Streaming `generateSessionBody`.** Done. SSE endpoint with idempotent replay on already-persisted bodies and 409 on concurrent streams. Frontend prefers SSE and falls back to polling on 404. Pinned to `FF_LLM_PREP_STREAMING_ENABLED`.
- **Part 7 — First invite dispatch.** Code surface ready; dispatch deferred to S023 (humans-only step). Audit doc scaffolded at `docs/audits/2026-04-friend-feedback.md`, dated, with a hard rule that it gets populated or cut — no more ghost audit docs.

## Retro

**What went right**

- Compass discipline. The seven engineering parts all served the landing → playground → signup → first kata path. Nothing extra slipped in. Even the runtime-bump non-shipping was on-compass: documenting an upstream block without burning days on a fork swap is the right call when the path doesn't depend on it.
- Three feature flags that genuinely roll back. `FF_PLAYGROUND_CONSOLE_ENABLED`, `FF_PLAYGROUND_ASK_SENSEI_ENABLED`, `FF_LLM_PREP_STREAMING_ENABLED` are all default-off and the frontend falls back gracefully when the API answers 404. We can flip any of the three independently in prod.
- The S021 reactive-buffer lesson held: Part 0 absorbed a handful of mid-sprint deploy / Turnstile / CSP fixes without delaying the planned parts. The structure bent the right way.
- Streaming + non-streaming paths coexist for kata prep. The flag rollout is genuinely safe — old deploys and new deploys both work, and the same client code handles both.

**What went wrong**

- Pre-flight should have caught the Piston upstream block. We staged the runtime bump as a "separate operational decision" without checking whether the package versions even existed; closing the sprint was the moment we discovered they don't. Five minutes of `gh api` would have moved that item to backlog at sprint planning instead of sprint close.
- The `complete-kata` and `playground-anon-run` smoke specs require operator-set env vars (`SMOKE_USE_MOCK_LLM`, `SMOKE_PLAYGROUND_ENABLED`) on the target environment. As written, a prod-only smoke run skips both — meaning the post-deploy safety net doesn't catch regressions in the two surfaces this sprint actually built. The fix is a staging environment configured to satisfy both gates; tracked as a follow-up.

**What to try next**

- Pre-flight check on every external-dependency-shaped sprint task: "does this version exist?" before the task is committed to a Part.
- Stand up a staging environment with `LLM_ADAPTER_FORMAT=mock` + Turnstile dummy keys so the full smoke suite runs green on every deploy, not just in prod where two specs skip.
- For the friend invite — gate the dispatch on the audit doc actually being filled in within 7 days, or the friend slot rotates. The Part 7 rule about ghost audit docs needs teeth.

**Risks carried forward**

- Friend invite still not dispatched. The S021 → S022 → S023 carry is now two sprints deep; the product is ready, the human action is the bottleneck.
- Single-process rate-limit + ask-sensei concurrency tracking. The in-flight stream guard is `Set<string>` in memory; if we ever scale to two API processes, two clients on the same session can both kick off the LLM call. Acceptable now; not acceptable on day one of multi-process.
- All three new flags are off in prod by default. Flipping them in prod requires a smoke run on staging first per the part DoDs — discipline only, no automation enforces it.
