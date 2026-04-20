# PRD-026: "Ask the sensei" in the course player

> **Status:** advancing to spec
> **Date:** 2026-04-20
> **Author:** Yemi Okafor (C4) — reviewed: Marta Kowalczyk (C5) abuse surface + PII, Soren Bachmann (C6) UI, Hiroshi Nakamura (S1) evaluation of hint quality

---

## Idea in one sentence

A contextual "nudge from the sensei" button inside the course player — the learner can ask a scoped question about the current step once they have tried and failed, and get a one-paragraph hint streamed back without leaving the player or burning the solution reveal.

---

## Why now

- The course player has everything except an escape hatch. When a learner is stuck, the current options are (a) abandon, (b) guess, (c) peek at the static `hint` if one exists, (d) leave the course, open the main sensei view, paste their code, lose context, come back. Option d breaks flow.
- The LLM adapter layer and streaming pipeline exist since Sprint 008. One more prompt endpoint is a small addition, not new infra.
- The kata flow already depends on the sensei being honest and on-voice. A nudge inside a course must not undermine that contract — it has to "point toward", not "give the answer". Designing this now, before invite-expansion, avoids retrofitting the honesty rules later.
- `CODE_SCHOOL_PLAN` Phase 2 lists this feature. We have been deferring it until the static hints proved insufficient. S018-019's course audit showed they do.

---

## Perspectives

### As a stuck learner

I've tried twice. The test output says `expected [1,2,3] got [3,2,1]`. I suspect I am reversing somewhere but I don't want to burn the solution reveal — that feels like quitting. I want one paragraph that points me at the mistake, not hands me the code. If the hint is too gentle I'll waste my third try; if too direct, the practice is cheapened.

### As the sensei (product voice)

The sensei does not coddle. It also does not ghost. "Ask the sensei" must read as the sensei noticing you are stuck and offering a pointer, still respecting the practice. The prompt has to embed that voice and the constraint — never reveal code, never name the exact fix, redirect to what to check next.

### As the dojo administrator (Kira)

Each click is an LLM call. At free-tier scale this is fine; at scale it is not. The rate limit is mandatory. Cost bounding is a product concern, not just infra — it shapes the UX (quota per course? per step? unlimited?).

### As the product

This is the first interactive LLM surface inside the course player. It sets precedent for how the sensei shows up in non-kata flows. Getting the voice and the escape-hatch frame right here protects future additions (e.g., a "challenge me further" button post-pass).

### As Marta (security)

The endpoint receives user-generated code. Every other kata path does too, so it's not net-new attack surface, but re-auditing prompt-injection resistance is worthwhile. A learner could try to jailbreak by submitting `# ignore previous instructions...` — the system prompt must be the source of truth on refusals.

---

## Tensions

- **Hint strength.** Too gentle = useless ("have you thought about the problem?"). Too direct = defeats the practice ("replace `a.sort()` with `sorted(a)`"). The system prompt must hold a narrow band.
- **Cost vs. affordance.** An unlimited "ask" encourages rapid-fire "just tell me". A low quota feels punitive if the first nudge happens to be too vague. A middle path — N nudges per step, reset per step — is more complex to build and explain.
- **Memory within a step.** Threaded chat (ask follow-ups) gives a richer experience but invites chatbot-style use. A single-shot nudge is honest but brittle if the first nudge misses the right thread.
- **Eval loop.** We do not know if a nudge is "good" unless we measure. Adding a "did this help?" thumbs up/down is ~4h of work but gives us a signal to iterate the prompt. Without it, we are authoring in the dark.
- **Error modes.** LLM timeouts, 429s from provider, filtered outputs — all need graceful UX, not a silent failure. Existing kata flow has these patterns; reuse them.

---

## Options

### Option A: Single-shot nudge, no memory, per-step unlimited

Button "Ask the sensei" is hidden until the learner has executed the step at least once. Clicking streams one paragraph into a side panel. No conversation state. Rate limit = 1 call / 15s per user.

- **Pros:** Simplest shape, smallest surface, hardest to abuse. Voice discipline is easiest to enforce in a single turn.
- **Cons:** If the first nudge is off, the learner has no way to steer. "No memory" may feel terse.
- **Complexity:** Low (~1-2 days).

### Option B: Single-shot nudge with quota (3 per step)

Same as A but capped at 3 requests per step with a counter. Resets per step.

- **Pros:** Signals scarcity without blocking — a learner can genuinely iterate if stuck. Clear message when they run out ("try the solution tab or come back fresh").
- **Cons:** Quota infra = persistent counter somewhere (could be sessionStorage locally, but then refresh resets it). Extra UI copy. Low-stakes complexity but real.
- **Complexity:** Medium (~2-3 days).

### Option C: Threaded nudge chat within the step

The learner can follow up. Memory scoped to the current step.

- **Pros:** Closest to how a real mentor works.
- **Cons:** Conversation state to manage (server-side for auth, client-side for anon). Risk: chatbot posture creeps in. Bigger prompt design surface.
- **Complexity:** High (~1 week).

---

## Provisional conclusion

**Option A for Sprint 020 Part 4.** Shipping the single-shot shape first lets us validate three things: (i) is the voice discipline in the prompt actually achievable, (ii) does the cost model hold up at 3-5 invited users, (iii) does the learner experience it as the escape hatch we think it is.

Quota (Option B) and threaded chat (Option C) wait for data — we will not know which tension bites harder until people use A.

**What A looks like concretely:**

- **UI:** "Ask the sensei" button in the step panel, enabled only after the learner has executed the step at least once. Clicking opens a slide-in side panel (right-side on desktop, bottom sheet on mobile). Streamed tokens render there. Close button and keyboard shortcut (Esc) to dismiss.
- **Endpoint:** `POST /learn/nudge` with body `{ stepId, userCode, executionResult? }`. Auth optional (public courses); rate-limited with a new `nudgeLimiter` at 4 req/min per IP (auth users) or 2 req/min (anon).
- **Prompt:** system prompt constrained to "point toward the gap, never write code, never name the specific fix, ≤80 words". Inject step `instruction`, `testCode`, learner's current `userCode`, last execution stdout/stderr if any.
- **LLM:** reuse `LLMPort` (no new adapter). Non-streaming first pass (Hono supports streaming but the UI side panel is small — a single fetch keeps this simple). If latency bites, swap to streaming without domain changes.
- **Logging:** the nudge, the prompt context, and the response land as a `NudgeRequested` event for later eval. Simple table `step_nudges` with `user_id` (nullable for anon), `step_id`, `prompt_hash`, `response`, `created_at`.
- **Eval hook:** thumbs up / thumbs down beneath the nudge. Writes to `step_nudges.feedback` field. Stays low-ceremony; gives Hiroshi a signal to tune the prompt.

---

## Risks

- **Prompt drift.** The nudge prompt must stay in the "hint, not answer" band across model upgrades. Hiroshi should review it quarterly.
- **Cost escalation.** At free tier we are fine. If invites grow 10× the cost becomes real. Monitor `step_nudges` volume / week and revisit quota.
- **PII in context.** The learner's code + stderr ship to the LLM. Marta: acceptable — same data the main sensei flow already sends. No new surface.
- **Abuse vector.** A crawler hitting `POST /learn/nudge` in a loop. Rate limiter + Zod cap on `userCode` length (say 8000 chars) handles it. Not worse than existing `/learn/execute`.

---

## Next step

- [x] Panel review complete — Yemi, Marta, Soren, Hiroshi
- [ ] Convert Option A to spec: `docs/specs/028-ask-the-sensei.md`
- [ ] Write and manually stress-test the system prompt (Yemi) — iterate until 10/10 example "stuck" scenarios produce nudges, not answers
- [ ] Quota design for Option B drafted in parallel; ship only if the S020 rollout surfaces abuse

---

## Panel recommendation

**Recommended option:** A — single-shot nudge, no memory, per-step unlimited, rate-limited.
**Key risks:** prompt discipline (requires Yemi review before ship); cost escalation past Phase 1 Alpha; silent hint-quality regressions.
**Fallback / rollback:** the "Ask the sensei" button is gated behind a `COURSE_NUDGE_ENABLED` feature flag in config. Off by default; turn on in prod once Yemi + Hiroshi sign off. Rolling back is a single env flip.
