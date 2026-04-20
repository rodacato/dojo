# PRD-026: "Ask the sensei" in course player

> **Status:** draft
> **Date:** 2026-04-20
> **Author:** Yemi Okafor (C4) — pending: Marta Kowalczyk (C5) security/rate-limiting, Soren Bachmann (C6) UI placement, Hiroshi Nakamura (S1) prompt evaluation

---

## Idea in one sentence

An on-demand contextual LLM nudge inside the course player — the learner can ask the sensei a scoped question about the current step without leaving the player or corrupting the solution reveal flow.

---

## Why now

- Course player has all the scaffolding (instructions, starter code, pass criteria, solution tab post-pass) but no *escape hatch* when the learner is stuck short of giving up.
- Current options when stuck: (a) abandon, (b) guess, (c) peek at hint if exists, (d) leave the course entirely to open the main sensei view and lose context.
- Phase 2 of the `CODE_SCHOOL_PLAN` explicitly lists this feature. We've been deferring it until static hints prove insufficient — they do.
- The LLM adapter layer shipped in Sprint 008. Streaming works. Prompt infrastructure exists. Adding one more contextual prompt is incremental, not net-new infra.

---

## Perspectives

### As a stuck learner mid-step

I've tried twice. The tests fail on edge case. I don't want to burn the solution reveal (that feels like giving up). I want a hint — one paragraph — that points me toward what I'm missing without giving me the answer.

### As the dojo administrator

_Fill in: prompt budget per step? Rate limit per user? Cost per learner per course?_

### As the sensei (the product voice)

_Fill in: how does "ask for help" preserve sensei honesty? The sensei doesn't coddle. A nudge that gives away too much breaks the practice. A nudge that's too terse is useless. Where's the line?_

### As the product

_Fill in: this is the first "interactive" element inside the course player (beyond code execution). Is the UX frame (sidebar? modal? inline?) consistent with the rest of the dojo?_

---

## Tensions

- **Hint strength.** Too strong → breaks practice (solution reveal by another name). Too weak → useless.
- **Cost.** Every click is an LLM call. Rate limiting (Marta) is mandatory.
- **Scope creep.** Is it 1 question per step? Unlimited? Does it remember the conversation within a step?
- **Evaluation.** How do we know the nudges are good? Hiroshi's LLM output validation — do we eval these offline?
- **Prompt injection.** Learner submits arbitrary code to the sensei. Existing adapters handle this, but the course-player entry point needs the same hardening.

---

## Options

_To fill during PRD authoring. Placeholders:_

### Option A: Single nudge button — one question per step, no memory
### Option B: Threaded chat within the step — full history, retained per step
### Option C: Quota-based — N nudges per course, learner chooses when to spend

---

## Provisional conclusion

_TBD — Yemi to draft. Kira's instinct: Option A (single nudge, no memory) for MVP. Threaded chat is a Phase 2 polish._

---

## Next step

- [ ] Yemi fills in "Perspectives", "Tensions", "Options"
- [ ] Marta reviews rate-limiting + prompt injection surface
- [ ] Soren proposes UI placement (sidebar? inline below instruction?)
- [ ] Hiroshi defines eval criteria — what does a "good nudge" look like?
- [ ] Decide: ship MVP in S020 or defer implementation to S021
