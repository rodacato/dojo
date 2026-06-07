# Sprint 026 — The five crash-course scrolls

> **Status:** Open. Active focus: ship the five language crash-course scrolls per [ADR 022](../adr/022-crash-course-pivot.md), one at a time, with per-language objectives decided before each language's work block.
> **Direction:** [ADR 022 — crash-course pivot](../adr/022-crash-course-pivot.md) · [`docs/courses/README.md`](../courses/README.md) · [`docs/courses/INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md)
> **Predecessor:** [Sprint 025 — Crash-course pivot + predict step type](archive/sprint-025-crash-course-pivot.md)
> **Branch:** TBD (will branch from `master` once Sprint 025's commits land)

## Sprint thesis

The pivot is committed; the architecture is in place; the format is proven via Ruby Lesson 1. Sprint 026 is about content + interactions for the five language scrolls — finishing Ruby, then doing the rest **in a deliberate order, one language at a time, with each language scoped on its own terms** before authoring begins.

The honest framing on size: a single complete crash scroll (spec + content + interactions + smoke) is **8-15 hours per language** depending on the language's surprise surface. Rust is the expected outlier — Björn (S8) will defend that ownership pedagogy needs 120 min and probably 1.5× the per-step time. Realistic for one sprint is **two to three languages end-to-end**, not all five. Stretch is more.

Closing the sprint with two production-grade language scrolls + clean specs for the remaining three is success. All five shipped is the celebration outcome.

## Working method

For each language, two distinct blocks:

1. **Scope block.** Before any authoring: a conversation with the language specialist's lens (Kenji/Nadia/Björn/Leo/Rhea) about what curriculum to cover, what the language's irreducible surprises are, what idioms belong in 90 min, what gets deferred to deep-dive territory. Output: filled Course Authoring Profile in the language file + drafted Sub-course Authoring Spec in `curricula/<lang>/<lang>.md`. **Per-language done-bar is decided here, not globally.**
2. **Authoring block.** Lessons authored (prose + starter + tests + hints + solution + harness), seeded, smoke tested with reference solutions through Piston. End-to-end verification on `/scrolls/<lang>` in dev. Cheat sheet / interactive extensions only if the scope block explicitly decided them in scope.

Each language ships independently. No "must finish Ruby before starting Python" coupling — once Ruby's authoring block lands, the next language's scope block can run in parallel with smoke-passing of Ruby.

## Order

Per Adrian's call:

1. **Ruby** — finish (Lessons 2-5; Lesson 1 already in master).
2. **Python** — second proof point. Recommended by ADR 022 §"What stays open" for runtime cleanliness + audience.
3. **Rust** — third. Most expensive due to compiler-as-teacher pedagogy + ownership. Doing it third (not last) is a deliberate stress test of whether the format holds under the hardest language.
4. **TypeScript** — fourth. Decision pending on the existing `typescript-fundamentals` slot (see §Open decisions).
5. **Go** — last. Cleanest target; if sprint capacity runs out, easiest to roll to Sprint 027 without losing momentum.

This order is final for the sprint plan. Re-order only on a real surprise (e.g., a language's scope block reveals a blocker that bumps the next language ahead).

## Mandatory (sprint blockers if not done)

- **Ruby crash scroll ships end-to-end.** Lessons 2-5 spec-complete + content authored + seeded + smoke verified through Piston. One hint per kata. Reviewed through Rhea (S10) + Elif (S5) + Valentina (S2) lenses.
- **Python crash scroll ships end-to-end.** Full scope-then-authoring loop. Reviewed through Nadia (S7) + Elif (S5) + Valentina (S2).
- **Sprint admin discipline holds.** Sprint closes with `current.md` cleared, retro filled, archive moved, CHANGELOG entry, the next sprint's `current.md` rewritten — no more multi-sprint gaps.

## Stretch (ship if Ruby + Python close cleanly)

- **Rust crash scroll** end-to-end. Most likely third to land if sprint capacity holds.
- **TypeScript crash scroll** end-to-end. Includes the `typescript-fundamentals` slug swap decision.
- **Go crash scroll** end-to-end. Last in order; if not in this sprint, spills cleanly to Sprint 027.
- **Catalog UI grouping** (Languages / Topics) per the updated [`docs/courses/README.md`](../courses/README.md) §4.5 — if `/scrolls` starts to feel crowded once 3+ language scrolls are live.

## Out of scope (deferred, not blocking)

- **Cheat sheets / PDF export.** Tempting but feature creep before the underlying scroll content has shipped. Re-evaluate once 2 scrolls are live; the JTBD ("post-scroll reference" vs "shareable preview" vs "branded artifact") will be clearer in context.
- **`trace` and `read+inline` step types.** Doc-only today. Ship only if a language's scope block reveals one is genuinely needed; default expectation is that `read` + `predict` + `kata` + `challenge` covers all five languages.
- **Deep-dive scrolls** (Ruby metaprogramming, Python `asyncio`, SQL window functions, etc.). Listed as candidates in each language file's deep-dive section; no commitment in this sprint.
- **Rive integration.** Parked indefinitely per [`docs/courses/INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md) §Animation tech (Sprint 026 motion policy reversal). Reopen only if a real designer with a Rive editor practice enters the team.
- **Unit + Playwright tests** for the scroll player (`PredictStep`, CSS motion). Sprint 025 shipped without dedicated tests (POC tolerance); Sprint 026 should *consider* adding them if a content bug surfaces but they are not gating.
- **Other pre-pivot language files.** Each gets its re-scope when its turn arrives in the order above; the headers I added in Sprint 025 (`Pre-pivot draft. Re-scope per ADR 022 pending.`) keep them from being misread until then.
- **Sensei calibration carry-forward** from Sprint 023. Still pending; not in this sprint's critical path.

## Open decisions resolved (codified here)

| Question | Decision |
|---|---|
| Second language pick | **Python.** Then Rust, TS, Go. |
| Pre-pivot TS scroll handling | **Delete when the new TS crash course ships** (Phase 0, no real users to migrate). Until then `typescript-fundamentals` stays live in DB. |
| Per-language test harness | **Per-language** (no shared factor). Revisit only if maintenance hurts after 3+ languages ship. |
| Hints policy for crash scrolls | **One hint per kata.** Concept-level (per [`README.md`](../courses/README.md) §5.2). |
| Per-language "done" bar | **Decided in each language's scope block**, not globally. Common floor: prose + starter + tests + hints + solution + seed + smoke; everything above that is per-language judgement. |
| Motion runtime on `/scrolls/*` | **GSAP + CSS. Rive parked indefinitely.** Reversal of Sprint 025's "Rive + CSS only" — codified in [`INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md) §Animation tech. |
| Felix (S12) activation | **Episodic, not regular rotation.** Codified in [`EXPERTS.md`](../EXPERTS.md) S12 cadence note. |

## Open questions (real, blocking next decisions)

1. **TS slug swap timing.** When the new TypeScript crash course is ready, the swap is mechanical (delete `typescript-fundamentals` row, seed `typescript` row). But: do we keep the `typescript-fundamentals` slug routable as a 410 / redirect to `typescript` for any cached/shared links? Phase 0 suggests no — clean delete. Decision at TS work block.
2. **Per-language scroll catalog ordering.** With 5 language scrolls + topic scrolls (`sql-deep-cuts`), what's the default sort? Recommended-order (a curation), alphabetical, or by-recency? Decision when catalog UI is touched (stretch).
3. **First-language demo for friend cohort.** When Ruby + Python are end-to-end live, is that the trigger to dispatch the first friend invites (S022 carry-forward), or is the bar all five? Decision at Sprint 026 midpoint.

## Working order (hypothesis, not contract)

| Block | Work |
|---|---|
| W1 | Ruby Lessons 2-5 authored + seeded + smoke. Ruby end-to-end demo. |
| W2 | Python scope block (Authoring Profile + spec). Python authoring block (lessons + content + seed + smoke). End-to-end demo. |
| W3 | Sprint midpoint retro: format calibration check. Rust scope block. Rust authoring block if capacity holds. |
| W4 | TS scope block + slug swap. TS authoring block. Go scope block + authoring if anything remains. Sprint close. |

Real timing depends on how cleanly the format scales from Ruby. If Python's authoring block takes 8 hours, all five fit. If it takes 15, two more are stretch.

## Reading order if you're picking this up cold

1. [ADR 022](../adr/022-crash-course-pivot.md) — what we committed to.
2. [`docs/courses/README.md`](../courses/README.md) §1, §4, §7 — what a scroll is now.
3. [`docs/courses/INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md) §Animation tech — what runtime to reach for.
4. [`docs/courses/curricula/ruby.md`](../courses/curricula/ruby.md) — the language file shape post-pivot.
5. [`docs/courses/curricula/ruby/ruby.md`](../courses/curricula/ruby/ruby.md) — the executable spec shape per lesson.
6. [`docs/courses/authoring-spec-template.md`](../courses/authoring-spec-template.md) — the template to copy for each new language.
7. [`apps/api/src/infrastructure/persistence/seed-scrolls-ruby.ts`](../../apps/api/src/infrastructure/persistence/seed-scrolls-ruby.ts) — what shape a language's seed file takes.
8. This file — what we said we'd do.

## Open (deferred, not blocking the sprint open)

_Carry-forwards from Sprint 023 that didn't move in Sprint 024 or 025. Stale enough to triage at sprint midpoint:_

- **Sensei calibration real run** (S023) — `pnpm calibrate:sensei` against Anthropic. Costs tokens. Promote when a prompt change needs validation.
- **Staging smoke environment** (S022 carry) — `complete-kata` + `engawa-anon-run` smoke specs need a staging deploy with mock LLM to actually run on every deploy.
- **First friend invite dispatch** (S022 carry) — code surface ready since S021. Audit doc still waits at `docs/audits/2026-04-friend-feedback.md`. Trigger may now be "first two language scrolls live" rather than "Phase 1 generally ready" — decision tied to Sprint 026 midpoint check.

Sprint 026 midpoint: triage. Promote one, discard the rest, or carry forward with an explicit reason.

## Out of scope, parked

- Kumite feature itself (still only the `/kumite` placeholder).
- Per-track belt marks, rust indicator (PRD-031 v1.1).
- DB table renames (mapping at adapter layer per ADR 020 — stable).
- LLM telemetry table (backlog carry-forward).
- Aggressive sensei voice rewrite (calibration-gated, not in this sprint).
