# PRD-029: Language playground console

> **Status:** exploring
> **Date:** 2026-04-22
> **Author:** Lucía Navarro (S4) — reviewed: Amara Diallo (C7) growth/funnel, Marta Kowalczyk (C5) abuse surface, Soren Bachmann (C6) UX, Priya Menon (C1) scope discipline, Tomás Ríos (C3) Piston reuse. Deferred reviewers for later phases: Yemi Okafor (C4) for "ask the sensei" inside the playground; Dr. Elif Yıldız (S5) for the course exit-ramp use case.

PRDs are exploratory documents, not commitments. If something advances, it generates one or more specs. If it does not fit, it gets archived without shame.

---

## Idea in one sentence

A public, anonymous, zero-persistence playground at `/playground` where a visitor picks a language + version from the runtimes Piston already provides, types code, hits Run, and sees output — designed as an acquisition hook that funnels visitors into the kata loop.

---

## Why now

- The product is invite-only and Phase 1 Alpha. The bottleneck for visitors who land on the marketing page is **friction to try anything**. Today the only path is "request access → wait → log in → start a kata". A playground collapses that to one click.
- Piston is already deployed with 6 runtimes (spec 026 Part 5 will harden it further). Reusing the existing adapter is a small slice — no new infra.
- The `FF_CODE_EXECUTION_ENABLED` precedent (config.ts:18) shows the project already gates execution behind a flag. Same pattern works here.
- Strategic adjacency: the playground is the natural future home for two adjacent ideas the user already wants — a public "ask the sensei" surface and a free-experimentation exit-ramp from courses. Building the surface once and layering features later is cheaper than three separate sub-surfaces.
- Timing-wise: S021 is locked on stability for the first invited friend. Building this **during** S021 dilutes the focus. Documenting it now and shipping post-S021 is the right cadence.

---

## Perspectives

### As an unauthenticated visitor

I land on dojo.x from a tweet or a search result. I am curious but not committed. I want to know "is this thing real and does it actually run my code". The current site shows me marketing copy and a sign-in wall. A playground gives me 30 seconds of *doing* before I have to commit to anything. If the experience is good, the upgrade path is obvious — "you liked running code? practice with a kata that grades it".

### As a logged-in dojo user

I'm mid-course and I want to test a one-liner without leaving the player or polluting my kata history. The playground is a side-tab: try, throw away, return. Not part of my practice record on purpose.

### As the dojo administrator (Kira)

Anonymous code execution = abuse vector. Every execution costs CPU on the Piston VM that also serves the paying flow (kata + courses). I need (a) hard isolation of quota between playground and core flows, (b) visible metrics so I can tell within a day if a wave of abuse hits, (c) a single env flag to kill the surface without redeploying.

### As Marta (security)

Anonymous arbitrary code execution is the highest-risk surface this product has ever exposed. The mitigation stack must be designed up-front, not retrofitted:
- **Bot gating:** Cloudflare Turnstile (or hCaptcha) before the first execution per browser session. Invisible mode if score is high; interactive otherwise.
- **Rate limiting:** per-IP (e.g., 10 runs / minute, 100 / day) AND per-browser-session (signed cookie, not auth) to make IP rotation harder.
- **Global quota:** a daily ceiling for total playground runs separate from kata/courses, so abuse cannot starve real users. When the ceiling is hit the surface returns "playground is recovering, try again in N minutes" without affecting the rest of the product.
- **Piston limits:** run timeout = 3s, compile timeout = 10s, memory cap = sane default (Piston exposes both — set them explicitly per request, do not rely on defaults).
- **Sandbox network egress:** disable outbound network from the runtime (Piston supports it). Stops scanners and miners.
- **Input cap:** Zod schema caps `code` at e.g. 16 KB. Reject larger payloads at the boundary.
- **Logging:** anonymous run log (IP hash, ts, language, exit code, runtime ms) in a `playground_runs` table — no source code stored. Used for abuse pattern detection only; auto-purged at 30 days (reuse the errors-table cron from S021 Part 7).

### As the product

The playground is **complementary** to the kata loop, not competing with it. The CTA design is the whole game: "I ran some code, now what?" must answer with a thumb-on-the-scale to the kata. Without that, the playground is a juice-bar at the entrance of the gym — entertaining but no membership conversions.

---

## Tensions

- **Anonymous access vs. abuse risk.** Requiring auth would kill the hook value (the whole point is "no commitment"). Allowing anonymous access requires investing in Turnstile + rate limiting + quotas before launch.
- **"Try freely" vs. "feeds the loop".** The playground must be honest about what it is — a sandbox, not graded — without becoming so good that it cannibalizes practice. The CTA back to kata is non-negotiable.
- **Persistence pressure.** Users *will* ask for "save this snippet" / "share this URL" within a week of launch. The discipline is to say no in v0. Persistence opens a CRUD surface, share permalinks, abuse-of-share, and SEO-by-user-content — a different feature.
- **Multi-purpose creep.** The user already sees the playground as the future home for "ask the sensei (public)" and "course exit-ramp". Each is a separate problem with separate experts. If they all land in v0 the feature never ships.
- **Cost vs. signal.** Even with rate limits, every run costs cycles. We need a conversion metric from day 1 — `playground_run → signup → first_kata_pass` — or we cannot tell if the cost is producing growth.

---

## Options

### Option A: v0 hook only — anonymous playground, no auxiliary features

`/playground` (and `/playground/:language` for SEO). Editor (Monaco or CodeMirror — pick the lighter one), language + version dropdown, Run button, output panel. Anonymous. Zero persistence (not even localStorage in v0 — keep it pure session). Turnstile + rate limit + quota stack as Marta specified. Persistent CTA "Like running code? Practice with a real kata →" linking to the existing request-access flow (or directly into a sample kata for logged-in users). Behind `FF_PLAYGROUND_CONSOLE_ENABLED`, off by default.

- **Pros:** Minimal scope, ships in 3-5 days, the security surface is well-defined and testable, the kata loop stays sacred. Reuses Piston adapter as-is. Gives us conversion data before we invest more.
- **Cons:** No memory between page reloads (some users will bounce thinking it's broken). No "ask sensei" or course exit-ramp — those are real value adds we are postponing.
- **Complexity:** Low (~3-5 days end-to-end including Turnstile wiring and the abuse mitigation stack).

### Option B: v0 + localStorage persistence + share-by-URL

Same as A, plus: code persists in localStorage (last buffer per language), and a "Share" button generates a URL with the code base64-encoded in the fragment (`#code=...`). No server storage. The fragment-based share keeps the no-persistence promise on the backend.

- **Pros:** Solves the "I refreshed and lost my work" annoyance. Share-by-URL is a known growth lever for playgrounds (Go Playground, TypeScript Playground). Still no server CRUD.
- **Cons:** Fragment-encoded URLs are long and ugly (mitigatable but more UI). Share opens a moderation question — what if the encoded code is offensive and someone screenshots `/playground#...` showing dojo branding? Needs a "view-only" mode + "fork to your own" to be safe.
- **Complexity:** Medium (~5-7 days, mostly UX polish + share UX).

### Option C: Phased platform — v0 hook → v1 ask-sensei → v2 course exit-ramp

Single PRD covers v0 (Option A scope) shipped first, with explicit roadmap for v1 ("ask the sensei" public surface, gated by auth + quota, requires Yemi prompt review) and v2 ("experiment freely" CTA from end-of-step in the course player, links into `/playground/:language` with the step's code as the seed).

- **Pros:** Aligns the user's full vision into a coherent surface. Each phase reuses the previous one's chrome. Avoids inventing three separate UIs.
- **Cons:** Scope discipline gets harder once v0 is live ("we already have the surface, just add..."). Each phase needs its own risk + cost evaluation, not a free pass.
- **Complexity:** v0 is Option A. v1 ≈ +3-5 days (new prompt + auth gate + LLM cost path). v2 ≈ +1-2 days (just a CTA wire-up). Total over time: ~2 weeks of work spread across 2-3 sprints.

---

## Provisional conclusion

**Option C in shape, Option A in scope-for-v0.** Document the full phased vision so it does not get re-debated each sprint, but commit only to v0 (Option A) for the first ship. v1 (ask-sensei in playground) and v2 (course exit-ramp) advance only when v0 has data showing the surface is worth investing further.

**What v0 looks like concretely:**

- **Routes:** `/playground` (default language = TypeScript or whichever has most installs) + `/playground/:language` (SEO-friendly per-language URL). Both render the same component with different defaults.
- **UI:** Monaco editor occupying main area, `[Language ▼] [Version ▼]` dropdowns top-left, big `▶ Run` button top-right, output panel below editor (collapsible on mobile). Persistent CTA banner top: "Like running code? **Practice with a kata →**" linking to `/request-access` (or `/dashboard` if already authed).
- **Endpoint:** `POST /api/playground/run` — body `{ language, version, code }`. Returns `{ stdout, stderr, exitCode, runtimeMs }`. Auth optional. Rate-limited via a new `playgroundLimiter`: 10/min and 100/day per IP for anon; 60/min and 1000/day for authed.
- **Bot gating:** Turnstile widget shown after the first run per browser session if score is suspicious. Token validated on the API side before forwarding to Piston.
- **Piston reuse:** Same adapter as `LearnExecutePort`. Pass explicit `run_timeout: 3000`, `compile_timeout: 10000`, `memory_limit: <Piston default>`. Disable network in the request payload.
- **Logging:** `playground_runs` table — `id, ip_hash, session_hash, language, version, exit_code, runtime_ms, created_at`. No source code persisted. 30-day cron purge (reuse S021 Part 7 mechanism).
- **Feature flag:** `FF_PLAYGROUND_CONSOLE_ENABLED` (Zod-coerced boolean, default `false`) in `apps/api/src/config.ts`. Frontend reads it via the existing config-exposure pattern. When off, route returns 404 and the `/playground` page redirects to `/`.
- **Metrics from day 1:** instrument `playground_run`, `playground_cta_click`, `playground_signup_conversion` events. Without these we cannot tell if v1/v2 is worth it.

---

## Roadmap implications

This PRD is **post-S021**. It is not committed to any specific sprint yet. Provisional placement:

- **v0 (Option A above):** S023 candidate. S022 should remain reactive-buffer + Phase 1 metrics validation per the current strategy. Promotion to S023 is conditional on S021 closing cleanly and no Blocker emerging from the friend cohort.
- **v1 (ask the sensei in playground):** Deferred. Requires Yemi Okafor (C4) prompt design + a new abuse model evaluation (LLM cost is much higher per call than Piston runtime). Not earlier than S025.
- **v2 (course exit-ramp):** Deferred. Requires the course catalog to be at least L1+L2 across 2+ languages so the exit-ramp has substance to point to. Not earlier than S026.

The phased plan stays in this PRD. Each phase generates its own spec at promotion time.

---

## Risks

- **Anonymous abuse spike at launch.** Mitigation: the Marta stack above is non-negotiable for v0. Without all four layers (Turnstile + per-IP RL + per-session RL + global daily quota) the surface stays off.
- **Cost without conversion.** If `playground → signup` conversion is <2% after 30 days the feature is not earning its keep. Mitigation: feature flag off at the 30-day mark if the metric does not move.
- **Cannibalization of kata.** A user gets value from the playground and never signs up. Mitigation: the CTA design is the primary defense. Secondary: rate limit caps are tight enough that prolonged sessions become uncomfortable, nudging toward the kata loop.
- **Piston runtime contention.** A burst of playground runs delays kata evaluations. Mitigation: `PISTON_MAX_CONCURRENT` (config.ts:20) is already 3. Either bump it before launch or reserve a separate Piston pool for the playground.
- **Scope creep into v1/v2 during v0 build.** Mitigation: this PRD explicitly defines v0 = Option A. v1 and v2 require their own panel review + spec promotion.
- **Marketing-page intercept.** The playground link from the landing page might steal clicks from the existing "request access" CTA. Mitigation: A/B-style positioning — playground is *additional* CTA, request-access stays primary.

---

## Next step

- [x] Panel review (this PRD) — Lucía, Amara, Marta, Soren, Priya, Tomás
- [ ] Hold for S021 close. Re-evaluate at S022 planning whether to promote.
- [ ] When promoted: convert to spec `docs/specs/NNN-playground-console.md` covering v0 only.
- [ ] Yemi review of v1 prompt scope — only when v0 has 30 days of conversion data.
- [ ] Elif review of v2 pedagogy — only when course catalog has reached L2 in 2+ languages.

---

## Panel recommendation

**Recommended option:** C in shape (phased vision documented), A in v0 scope (anonymous hook only, behind `FF_PLAYGROUND_CONSOLE_ENABLED`, off by default).
**Key risks:** abuse on anonymous code execution (mitigated by Marta's 4-layer stack); cost without conversion (mitigated by 30-day metric gate); scope creep into v1/v2 during v0 build (mitigated by explicit phase boundaries in this PRD).
**Fallback / rollback:** `FF_PLAYGROUND_CONSOLE_ENABLED=false` reverts the surface in seconds — frontend hides the route, API returns 404. Zero coupling with kata or course flows means rollback breaks nothing else.
