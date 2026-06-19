# Sprint 029 — Scroll format revision + publish all four

> **Status:** Closed 2026-06-19 (work 2026-06-17 – 06-19).
> **Predecessor:** [Sprint 028 — Rust + TypeScript crash scrolls](sprint-028-rust-typescript-crash-scrolls.md)
> **Successor:** [Sprint 030 — Go crash scroll + the full-set smoke gate](../current.md)
> **Unplanned.** The planned S029 was the Go scroll. This interlude took the slot; Go moved to S030.

## What triggered it

A gut-check from Adrian: the courses felt *"boring, too much text, no felt learning,"* and the first instinct was to gamify — Three.js, a game engine, a "game per course." Brutal-honest pushback held: that competes with YouTube on production value, the one axis a solo author loses. And it was a tech answer to a content problem (fuga, not strategy). The real gap was the *interaction shape* — katas were write-from-scratch over a blank scaffold, never "debug plausible-but-wrong code" — and the positioning, which never said out loud "this is a crash course."

## What shipped

**The mechanism (ADR 023):**
- **Broken→fix katas** — a usage pattern of the existing `code`/`kata` step (broken `starterCode` + failing `testCode`), *not* a new step type. Adopted only where the planted bug *is* the misconception the kata targets and the fix teaches the idiom.
- **Progressive hint reveal** — `hints: string[]` (tier-ordered), revealed on an ephemeral client-side failure count (tier 1 on first fail, tier 2 on second). The reference `solution` stays gated post-pass. New nullable `steps.hints jsonb` column (migration `0023_step_hints`); falls back to `[hint]`.
- **Crash-course contract** — an explicit "What this is" block at each scroll's Lesson 0.

**Piloted on Ruby** (commit `ae01552`): 4 katas converted (`repeat`, `lookup`, `safe_call`, `classify`); 6 audited and kept write-from-scratch; tiered hints; L0 block.

**Rolled across the catalog** (commit `1f8ec02`): L0 block + tiered hints on Rust/Python/TS; Python +3 broken→fix (`temp_state`, `flatten`, `safe_get`, each hand-verified). Rust/TS: zero broken→fix, by design.

**Published the four existing scrolls**: Ruby/Python/Rust/TS → `status: 'published'` + `isPublic: true`; `ruby`+`rust` joined the anonymous-execution whitelist.

## Key decisions (and the honest ones)

- **Hints escalate; the answer doesn't.** Rejected the literal ask ("reveal the solution after 2 fails") — it would relax the server `403` gate and reopen the leak it closes on purpose, and it violates the brand rule that no feature softens the evaluation. A stronger *hint* gives the frustration relief without either cost.
- **Don't homogenize.** The honest finding rolling to Rust/TS: broken→fix barely transfers to compiled/typed languages — the compiler/type-system is already the misconception-corrector (Rust's fail-by-design katas, TS's `@ts-expect-error`/`Equal<>`). Forcing planted bugs there would have been the exact anti-pattern the pilot's own rule forbids. Only Python (dynamic) earned conversions.
- **The scope shrank, honestly.** Rust/Python/TS were authored post-pivot (S027/S028) and already carried crash-course framing, paragraph-test discipline, figures, polyglot-first. "Apply everything Ruby got" turned out to be mostly L0 + tiered hints, not a rewrite.

## The mistake to carry forward

**We published before the gate that was supposed to precede it.** The deferred plan (since S027) was *full-set real-Piston smoke → then publish decisions*. S029 flipped the four scrolls public first, on Adrian's call. Consequences pushed into S030:

- The **full-set smoke never ran** — and now it guards *live* content, not drafts. Ruby's four conversions were validated by logic, never executed (no local Ruby).
- **TS will time out in production** until the Piston deploy raises `max_run_timeout` (≥8000) + `output_max_size`. It is live without that config.

The seed flip ships the scrolls ready on reseed; it does **not** bypass the smoke. The reseed is the real publish event and its gates are unchanged — they just moved from "before publish" to "before the next reseed," which is a worse place to hold them.

## Verification

typecheck / lint / api (161) / web (53) green. Broken→fix logic hand-validated per kata. Live full-set Piston smoke: **not run** (carries to S030).

## Carry-forward to S030

1. Full-set real-Piston smoke of all five (Ruby especially) — now mandatory, guards live content.
2. TS Piston deploy-config raise — urgent, TS is live.
3. The Go scroll (the originally-planned S029 work).
4. ROADMAP sprint table was stale (jumped 024→live); backfilled 025–029 + opened 030 during this reconciliation. Sprint-023's "calibration gate pending" marker is still stale — left untouched (closure unconfirmed).
