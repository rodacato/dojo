# ADR 023: Progressive hint reveal + broken→fix katas

**Status:** Accepted
**Date:** 2026-06-17
**Context:** Sprint 026 — re-evaluation of the scroll/kata format after the creator found the courses "boring, too much text, no felt learning" and questioned whether a text-heavy crash course can compete with high-production video. Extends [ADR 022](022-crash-course-pivot.md) (crash-course pivot) without reopening it.

## Decision

Two changes to how kata steps inside scrolls teach, both scoped to the **course (Piston pass/fail) surface** — the sensei stays the kata-side evaluator and is deliberately kept out of this loop (cost, and a clean two-mode product: courses = compiler-as-teacher, katas = sensei).

1. **Broken→fix katas.** A `code`/`kata` step may ship plausible-but-wrong `starterCode` for the learner to debug, instead of a blank scaffold. It is a *usage pattern* of the existing step type — no new type, no ADR-worthy schema beyond (2). Adopt it only where the planted bug embodies the misconception the kata targets *and* the fix teaches the intended idiom; otherwise keep write-from-scratch. Do not homogenize a scroll to one shape. (Spec: [INTERACTIVITY-PATTERNS.md](../courses/INTERACTIVITY-PATTERNS.md) §"Broken→fix katas".)

2. **Progressive hint reveal.** Kata steps may carry `hints: string[]` (tier-ordered). The player reveals tier 1 on the first failed run and tier 2 on the second, driven by an **ephemeral client-side failure count**. The reference `solution` stays gated behind the existing post-pass `403` — escalating hints, not the answer.

New nullable `steps.hints jsonb` column (migration `0023_step_hints`); `hints` falls back to `[hint]` for steps with only the legacy single hint, so no existing step changes.

First applied to the Ruby scroll: `repeat`, `lookup`, `safe_call`, `classify` converted to broken→fix with tiered hints; the crash-course contract made explicit up front in Lesson 0.

## Why this, and not the alternatives

- **Why not reveal the reference solution after N failures?** That was the original ask. Rejected: serving the solution pre-pass means relaxing the server-side `403` gate, reopening the leak it closes on purpose — and it violates the brand rule that no feature softens the evaluation (IDENTITY.md). A stronger *hint* gives the same frustration relief without either cost. If solution-on-failure is ever wanted, it is a separate decision (gate relaxation + its own threat-model note).
- **Why ephemeral, client-side failure count?** The server already has no per-learner attempt counter, and adding one would be real persistence work for a buffer that only needs to live for the current sitting. Keeping it client-only means zero backend churn and no new auth surface.
- **Why not a new "broken→fix" step type?** It is `starterCode` + a failing `testCode`. A new type would demand a renderer, voice review, and ≥20 instances to justify itself (per INTERACTIVITY-PATTERNS.md authoring gate). It earns none of that — it is a content pattern.
- **Why courses, not katas, for broken→fix?** The course's teacher is the compiler/test runner ("compiler-as-teacher"); the kata's teacher is the sensei. Keeping the sensei out of the course loop holds LLM cost down and keeps the two surfaces distinct.

## Consequences

- The failure count resets on step change and on reload — a learner who reloads loses tier-2 until they fail again. Accepted: the buffer is for the current attempt, not a durable record.
- Iframe-sandbox languages (`javascript-dom`) run client-side; the failure-count logic lives in the same component and works for them too, but broken→fix authoring guidance here is written against the Piston scrolls. No divergence today.
- Doc-sync: [INTERACTIVITY-PATTERNS.md](../courses/INTERACTIVITY-PATTERNS.md), [AUTHORING.md](../courses/AUTHORING.md), and the per-language hint discipline (`curricula/*/*.md`) carry the authoring rules; CHANGELOG records the feature.

## Panel input (synthesized)

Consulted: Maya (S11, interactive learning), Elif (S5, learning science), Soren (C6, brand), Marta (C5, security), Yemi (C4, LLM cost).

- **Maya / Elif:** escalating hints are retention infrastructure only if they don't bypass the desirable difficulty. Tier 1 must not name the identifier; auto-revealing the full solution after 2 fails would have regressed learning. The tiered rule encodes this.
- **Soren:** the broken→fix framing fits the brand (the developer debugging plausible code is doing real work) where confetti would not. Crash-course honesty up front is on-voice.
- **Marta:** keeping the `403` solution gate untouched is the right call — no new leak surface. The ephemeral counter carries no PII and never reaches the server.
- **Yemi:** keeping the sensei out of the course loop is correct for cost and for the two-mode product story.
