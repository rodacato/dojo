# Spec 027: Sprint 022 — Open the door: friend cohort + public playground

> **Status:** ready-to-implement
> **Depends on:** PRD 029 (playground console), Spec 026 Part 5 (Piston liveness design — carried forward), ADR 018 (cgroupns host)
> **Sprint:** 022
> **Cohort size for validation:** creator + 1 invited friend (single invite dispatched mid-sprint, after Parts 1-3 close)

---

## Overview

Ambitious eight-part sprint. Parts 1-3 are infra prerequisites that unlock the playground surface safely. Parts 4-5 are the product work (playground v0 anonymous + v1 ask-sensei authed). Part 6 is a latency win opportunistically landed in the same LLM codepath Part 5 touches. Part 7 is the long-deferred first-friend validation.

```
Day 1-3:  Part 1 + Part 3            (Piston hardening + smoke tests, parallel)
          + Part 2                   (errors cron, short)
Day 4-7:  Part 4                     (playground v0)
          + Part 6                   (prep streaming, can start late)
Day 7:    Part 7 gate check          (dispatch invite if Parts 1-3 clean)
Day 8-10: Part 5                     (playground v1 ask-sensei)
Day 11:   Part 7 validation window
Day 12:   Retro + close-out
```

**New schema:** `playground_runs` (abuse log, no source code). `llm_requests_log` (cost accountability for ask-sensei).
**New config:** `FF_PLAYGROUND_CONSOLE_ENABLED`, `FF_PLAYGROUND_ASK_SENSEI_ENABLED`, `FF_LLM_PREP_STREAMING_ENABLED`, `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`, playground rate-limit envs.
**New ops file:** `scripts/piston-reprovision.sh` (finally).

---

## Part 0 — Reactive buffer

Standing rule, no sub-tasks. Bugs surfaced during the sprint are triaged in-flight:

- Non-blocker → batched into a mid-sprint patch
- Blocker → mini-patch commit
- Unknown severity → creator decides, err on patching

---

## Part 1 — Piston hardening + multi-version runtimes (Tomás C3)

### 1.1 Goal

Turn Piston into infra we can open to the internet without holding our breath: monitored, reprovisionable in one command, and running pedagogically-relevant versions.

### 1.2 Liveness

- Synthetic `/health/piston` check every 5 min
- Alert on 2 consecutive failures (not single — Piston flakes occasionally)
- Implementation: pick one of the three options from spec 026 §5 (GHA cron / Uptime Robot / custom tiny endpoint). Decide during execution; document in ADR 019.

### 1.3 Reprovision script

- `scripts/piston-reprovision.sh` — idempotent, safe to re-run
- Installs every runtime declared in the script (source of truth)
- Runs `piston ppman install <lang>=<version>` per entry
- Verifies via `piston runtimes` at the end
- Documented in README under "Operations → Piston recovery"

### 1.4 Runtime bump + multi-version

Target set after bump:

| Language | Version(s) after bump | Rationale |
|---|---|---|
| Python | 3.10.x + 3.12.x | `match` landed at 3.10, courses want 3.12. Multi-version is the first honest use case. |
| TypeScript | 5.0.3 (stays) | No pedagogy reason to add 5.3/5.4 yet. |
| Go | latest stable | 1.16.2 is four years behind. `loopvar` semantics change the pedagogy. |
| Ruby | 3.3.x | 3.0.1 is pre-pattern-matching polish. |
| Rust | latest stable | 1.68.2 is behind. Stay on stable — no nightly. |
| SQLite | 3.36.0 (stays) | Single version is fine. |

Node (18 + 20) is a decision point — add only if Part 4 drops TypeScript and introduces vanilla JS as a playground language. Default: leave out.

### 1.5 Concurrency decision

Current `PISTON_MAX_CONCURRENT=3`. Two options, decide during execution:

- **Option A:** bump to 6, share the pool between kata and playground. Simpler.
- **Option B:** second Piston accessory reserved for playground traffic. Stronger isolation.

Measure single-pool contention risk with a synthetic burst before deciding.

### 1.6 Acceptance

- `/health/piston` alerts on a simulated outage
- `scripts/piston-reprovision.sh` restores all runtimes on a freshly-reset Piston VM
- Version dropdown data for Part 4 is queryable from the `/runtimes` endpoint
- ADR 019 committed with liveness + reprovision design rationale

---

## Part 2 — Errors retention cron (Tomás C3)

### 2.1 Goal

30-day cleanup mechanism reusable by Part 4 for `playground_runs`.

### 2.2 Protocol

- Pick one of: pg_cron / Kamal accessory cron / GitHub Actions scheduled workflow
- Implement cleanup on the `errors` table (created by `PostgresErrorReporter`)
- Observable: log line on each run, or a `cleanup_runs` metadata table
- Manual escape-hatch: a make target or script that runs the same cleanup on demand

### 2.3 Reuse contract

Whatever mechanism Part 2 picks, Part 4 applies the same mechanism to `playground_runs` with ~1 hour of copy-paste. No new infra required for the second use.

### 2.4 Acceptance

- Errors older than 30 days removed on schedule
- Log line or metadata row confirms each run
- Manual escape-hatch documented in README

---

## Part 3 — Smoke test expansion (Hiroshi S1)

### 3.1 Goal

Tests that run on `workflow_dispatch` against prod or staging, catching regressions a reactive cohort runway can't afford to miss.

### 3.2 Specs to ship

| File | Flow | Notes |
|---|---|---|
| `sign-in.smoke.spec.ts` | GitHub OAuth happy path | Mock OAuth for determinism; assert session cookie + landing page |
| `complete-kata.smoke.spec.ts` | Pick → solve → evaluate | Mock LLM (`LLM_ADAPTER_FORMAT=mock` + deterministic verdict) |
| `complete-course-step.smoke.spec.ts` | Course player, one step, pass | Uses Piston real, not mock |
| `view-dashboard.smoke.spec.ts` | Dashboard renders, widgets load | Heatmap + streak + recent sessions |
| `view-profile.smoke.spec.ts` | `/u/:username` public profile loads | Guards against the chunk-load class of bug |
| `playground-anon-run.smoke.spec.ts` | **Added** — runs after Part 4 | Anon run through Turnstile (bypassed in test env) + rate-limit headers present |

### 3.3 Acceptance

- Full suite < 3 min on prod or staging
- Runs from CI on `workflow_dispatch`
- Red suite fails the workflow with a clear per-spec message

---

## Part 4 — Playground v0 (Tomás C3 + Marta C5 + Soren C6)

### 4.1 Goal

Public, anonymous, zero-persistence code execution behind Marta's 4-layer abuse stack. PRD 029 Option A scope.

### 4.2 Data model

```sql
-- playground_runs (abuse log only, no source code)
id            uuid primary key
ip_hash       text not null    -- sha256(ip + server-pepper)
session_hash  text not null    -- sha256(browser-session-cookie + pepper)
language      text not null
version       text not null
exit_code     integer
runtime_ms    integer
created_at    timestamp not null default now()

index on (ip_hash, created_at desc)
index on (session_hash, created_at desc)
index on (created_at)           -- for the 30-day purge
```

No `code` column. No `stdout`/`stderr`. The log is for abuse detection, not telemetry.

### 4.3 Routes

- `GET /playground` → default language (TypeScript for v0)
- `GET /playground/:language` → language pre-selected (SEO-friendly)
- `POST /playground/run` → execute code
- Both pages return 404 when `FF_PLAYGROUND_CONSOLE_ENABLED=false`

### 4.4 API contract

```
POST /playground/run
{
  language: "python" | "typescript" | "go" | "ruby" | "rust" | "sql",
  version: string,                  // validated against /runtimes
  code: string,                     // ≤ 16 KB (Zod cap)
  turnstileToken?: string           // required after first-run heuristic
}

→ 200 { stdout, stderr, exitCode, runtimeMs }
→ 400 { error: "invalid_language" | "code_too_large" | "invalid_version" }
→ 403 { error: "turnstile_required" | "turnstile_failed" }
→ 429 { error: "rate_limited", retryAfter: seconds }
→ 503 { error: "quota_exceeded", retryAfter: seconds }
```

### 4.5 Abuse stack (all four, non-negotiable)

**Layer 1 — Cloudflare Turnstile**

- Widget mounted invisibly on first page load
- Server-validates token before every `/playground/run`
- Invisible mode by default; challenge triggered on suspicious score
- Env: `TURNSTILE_SECRET_KEY`, `TURNSTILE_SITE_KEY`

**Layer 2 — Per-IP rate limit**

- Anon: 10/min + 100/day per IP
- Authed: 60/min + 1000/day per user (bypasses IP limit)
- Storage: in-memory sliding window with 1-hour TTL (single Node process — if it scales out, move to Redis)
- Returns 429 with `retryAfter` header

**Layer 3 — Per-session rate limit**

- Signed browser-session cookie (not auth), same ceilings as IP anon
- Makes IP rotation harder — a single attacker switching IPs still hits the cookie limit
- Cookie set on first `/playground` page load, 24-hour TTL

**Layer 4 — Global daily quota**

- Counter separate from kata + courses
- Daily ceiling (start at 5000 runs/day, revisit after 1 week of data)
- When hit: all `/playground/run` returns 503 "playground is recovering, try again in N minutes" — kata and courses unaffected
- Counter resets at UTC midnight

### 4.6 Piston request hardening

Every `/playground/run` call passes these explicitly (do not rely on defaults):

- `run_timeout: 3000` (ms)
- `compile_timeout: 10000` (ms)
- `memory_limit`: Piston default or explicit cap
- `network_disabled: true` — no outbound from the runtime

### 4.7 UI

- Editor: CodeMirror (already in bundle from kata flow — do not add Monaco)
- Layout: editor occupies main area, output panel below (collapsible on mobile)
- Dropdowns top-left: `[Language ▼]` + `[Version ▼]`
  - Version shows current version by default
  - Older versions under a collapsible "advanced versions" section (Soren)
- Top-right: `▶ Run` button
- Top banner (persistent): "Like running code? **Practice with a kata →**" linking to `/request-access` (anon) or `/dashboard` (authed)
- **No persistence in v0** — not even localStorage. Session-pure.

### 4.8 Metrics

Instrument from day 1:

- `playground_run` — on each execution (success + failure)
- `playground_cta_click` — when the top banner CTA is clicked
- `playground_signup_conversion` — fired on first kata-attempt submission by a user whose earliest recorded action was a playground run

Without all three, v1 (ask-sensei) cannot be evaluated honestly.

### 4.9 Feature flag

- `FF_PLAYGROUND_CONSOLE_ENABLED` (Zod-coerced boolean, default `false`) in `apps/api/src/config.ts`
- When off: `/playground*` returns 404, `POST /playground/run` returns 404
- Frontend reads the flag via the existing config-exposure pattern; when off, `/playground` redirects to `/`

### 4.10 Acceptance

- Flag on, anonymous visitor runs code end-to-end through the 4-layer stack
- `playground_run` event lands in metrics
- CTA click is instrumented
- 200 req/min burst from a single IP is stopped by Layer 2 before reaching Piston (verified in staging)
- `playground_runs` purge runs via Part 2 mechanism
- Flag off reverts the surface — no 5xx, no lingering state

---

## Part 5 — Playground v1: ask-sensei (logged-in) (Yemi C4 + Marta C5)

### 5.1 Goal

Authenticated users can ask a short, free-form question inside the playground and get a streamed sensei answer. Anonymous users never see this.

### 5.2 Hard constraints

- **Auth required.** No anonymous ask-sensei, this sprint or any sprint until a new PRD says otherwise.
- **Per-user daily quota.** Default 30 asks/day. Exceeded → 429 with quota-reset time.
- **Output token cap.** ≤ 512 tokens per response. Enforced server-side.
- **Model.** Sonnet 4.6 (same as current eval/prep). Do not introduce a new model in this part.

### 5.3 Data model

```sql
-- llm_requests_log (cost accountability, not full telemetry)
id             uuid primary key
user_id        uuid not null references users(id)
purpose        text not null         -- "playground_ask" | future values
model          text not null
input_tokens   integer
output_tokens  integer
latency_ms     integer
created_at     timestamp not null default now()

index on (user_id, created_at desc)
index on (created_at)               -- for purge / cost rollup
```

This is intentionally NOT the full `TelemetrySinkPort` design from the backlog. It is a minimum accountability table. The full design lives when someone asks for per-prompt analytics.

### 5.4 Prompt design (Yemi in-sprint)

- New prompt template: free-form question answering. No rubric, no `ownerContext`, no session history.
- Behavioral constraints in the prompt:
  - Stay on the topic of programming / the code/question provided
  - Decline politely for off-topic (math homework, life advice, etc.) — return "I only help with code in the playground"
  - Prefer references to language idioms over code solutions when the question is conceptual
- Yemi reviews the prompt **before** the flag flips on in prod.

### 5.5 API contract

```
POST /playground/ask
{
  question: string,        // Zod cap 2 KB
  code?: string,           // Zod cap 16 KB — same as run
  language?: string
}

→ 200 stream of SSE events:
   event: token    data: "..."
   event: token    data: "..."
   event: done     data: { totalTokens, quotaRemaining }
→ 401 { error: "auth_required" }
→ 429 { error: "quota_exceeded", resetAt: iso-timestamp }
→ 400 { error: "question_too_large" | "code_too_large" }
```

### 5.6 UI

- "Ask the sensei" button visible only when `isAuthed && FF_PLAYGROUND_ASK_SENSEI_ENABLED`
- Clicking opens a compact panel beside the output panel
- Streams tokens as they arrive
- Footer line on the response: "This is a free exploration tool, not graded practice. Kata is where the sensei actually evaluates."
- Quota indicator: "N asks left today" visible when hover/focus on the button

### 5.7 Feature flag + cost guardrails

- `FF_PLAYGROUND_ASK_SENSEI_ENABLED` — **separate** from `FF_PLAYGROUND_CONSOLE_ENABLED`. v0 ships standalone if v1 hits prompt issues.
- Sentry alert: daily cost rollup on `llm_requests_log` crossing a threshold (start: $5/day for playground asks)
- Cost rollup job: same cron as Part 2 / Part 4 purge, or a separate nightly GHA — pick during execution

### 5.8 Acceptance

- Authed user asks a question, receives a streamed answer
- Anonymous session sees only the code-execution playground (no Ask button)
- Per-user daily quota decrements visibly, enforces server-side at 30
- Off-topic question returns the decline message cleanly (verified in Yemi review)
- Flipping `FF_PLAYGROUND_ASK_SENSEI_ENABLED=false` disables the button + 403s the endpoint, without touching v0

---

## Part 6 — Streaming in `generateSessionBody` (Yemi C4 + Tomás C3)

### 6.1 Goal

Cut kata-prep perceived latency from ~30s to ~2s. Opportunistic ride along Part 5's LLM codepath touches.

### 6.2 Scope

- `AnthropicStreamAdapter.generateSessionBody()` swaps `.messages.create()` for `.messages.stream()`
- New endpoint: `GET /sessions/:id/body-stream` — SSE stream of body tokens
- `KataActivePage` replaces its 2s polling with an SSE subscription
- Mid-stream error: client keeps the partial text, shows "connection dropped, click to retry" affordance
- Feature flag `FF_LLM_PREP_STREAMING_ENABLED`, default off. Flip on only after a staging smoke run with the real LLM.
- Fallback: current blocking-plus-polling path stays alive under the flag off.

### 6.3 Acceptance

- User sees the kata body appear token-by-token within ~2s of starting a session
- `FF_LLM_PREP_STREAMING_ENABLED=false` reverts to the polling path cleanly, no 5xx
- Mid-stream disconnect surfaces a retry affordance instead of hanging

---

## Part 7 — First invite dispatch (validation)

### 7.1 Gate

Dispatch the invite only when:

- [x] Part 1 closed (Piston monitored + reprovisionable)
- [x] Part 3 closed (smoke suite green)
- [x] Part 2 closed OR in its tail (cron does not have to be live to dispatch, just not be a blocker)

Parts 4-6 can still be in progress — the friend doesn't have to see playground on day 1. What matters is kata + courses + dashboard work cleanly.

### 7.2 Protocol

- Creator sends the single invite, in-product (not raw link) to force the real redeem flow
- Friend onboards without creator intervention — creator is available only if the friend asks, not prompted
- Optionally: friend touches the playground if Part 4 is live; observe whether they came in via landing → playground → signup or direct invite

### 7.3 Output

- `docs/audits/2026-04-friend-feedback.md` — new scaffold, dated, populated or cut within this sprint. No ghost audit docs.
- Findings classified same as S021 audit would have been: Blocker / Friction / Polish

### 7.4 Acceptance

- Friend completes ≥1 kata without creator intervention
- Feedback doc committed
- Blocker findings either mini-patched in Part 0 or triaged to S023 with explicit rationale

---

## Environment additions

New env vars introduced by this sprint. All go in `.env.example` and in the Kamal secrets path.

```
FF_PLAYGROUND_CONSOLE_ENABLED=false
FF_PLAYGROUND_ASK_SENSEI_ENABLED=false
FF_LLM_PREP_STREAMING_ENABLED=false

TURNSTILE_SECRET_KEY=
TURNSTILE_SITE_KEY=

PLAYGROUND_RATE_LIMIT_ANON_PER_MIN=10
PLAYGROUND_RATE_LIMIT_ANON_PER_DAY=100
PLAYGROUND_RATE_LIMIT_AUTHED_PER_MIN=60
PLAYGROUND_RATE_LIMIT_AUTHED_PER_DAY=1000
PLAYGROUND_DAILY_QUOTA_GLOBAL=5000

PLAYGROUND_ASK_SENSEI_DAILY_QUOTA_PER_USER=30
PLAYGROUND_ASK_SENSEI_OUTPUT_TOKEN_CAP=512
```

`TURNSTILE_*` are required when `FF_PLAYGROUND_CONSOLE_ENABLED=true`. Config validation fails the API startup otherwise.

---

## Out of scope (explicit)

- Playground persistence (save / share URL / localStorage)
- Anonymous ask-sensei
- Multi-version beyond Python 3.10+3.12
- Per-purpose LLM model split (`LLM_MODEL_EVAL` / `LLM_MODEL_PREP`)
- UX backlog gaps F-4..F-6 + P-1..P-6
- Admin UI for runtime settings
- Reminder email verification (stretch only; reactive-buffer eligible)

---

## Risks

- **Scope too wide.** Parts 1+4+5 stacked is a lot. Cut order if slipping: Part 6 → Part 5 → Part 7. Parts 1-4 are the hard floor.
- **Piston contention under playground bursts.** Mitigated by Part 1.5 concurrency decision before Part 4 flag flips on.
- **Anonymous abuse at v0 launch.** Mitigated by 4-layer stack — any missing layer blocks merge.
- **Ask-sensei cost runaway.** Mitigated by per-user quota (server-side enforced) + Sentry cost alert.
- **First-friend invite delayed again.** Mitigated by gating Part 7 on 1-3 only, decoupled from playground.
- **Prompt drift on ask-sensei.** Mitigated by Yemi review before flag flip.
