# Sprint 031 — Go crash scroll + the carried full-set smoke

> **Status:** Open 2026-06-19. Active focus: Go — the fifth and final language scroll — preceded by the full-set real-Piston smoke carried from S030 (owed since S029).
> **Direction:** [ADR 022 — crash-course pivot](../adr/022-crash-course-pivot.md) · [ADR 023 — progressive hint reveal + broken→fix](../adr/023-progressive-hint-reveal.md) · [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) · [`docs/courses/README.md`](../courses/README.md) §5.3 + §4.4
> **Predecessor:** [Sprint 030 — Scrolls presentation reshape](archive/sprint-030-scrolls-reshape.md) *(re-scoped from Go; Go landed here)*

## Sprint thesis

Go closes the five-language set. The authoring pipeline is proven four times — the risk is not "can we author a scroll." It's two things: Go's pre-generics sandbox (Piston ships Go 1.16.2) and **the smoke debt carried twice now**. S029 published four scrolls ahead of the gate; S030 was presentation-only and didn't touch executable katas, so the smoke didn't get more dangerous — but it's still owed, and it runs *first* this sprint, before any Go seed touches the DB.

## Mandatory (sprint blockers if not done)

- **THE full-set real-Piston smoke — run it first.** Walk all four live scrolls against real Piston (`FF_CODE_EXECUTION_ENABLED=true pnpm --filter api validate:scrolls`): every kata's starter + solution, the predicts, playgrounds, read+inline interactions, figures, capstones. Ruby especially — its S029 broken→fix conversions were validated by logic, never executed. Fix what surfaces. This is W1, before Go authoring.
- **Go crash scroll end-to-end.** Kenji Watanabe (S6) lens. Full pipeline: scope block (lens, panel, outline + capstone + gesture audit, outline-level user test), prose, suite voice audit, panel + audience prose review, seed in batches each smoked live against **Piston Go 1.16.2**. Scratch draft at `.kwik-e/tmp/curricula-drafts/go/` informs scope. When it seeds + smokes clean, flip it to `published` + `isPublic: true` and add `go` to `PUBLIC_LANGUAGE_WHITELIST` (consistent with the other four). Add an `estimatedMinutes` value to its seed (S030 added the field).
- **Sprint admin discipline.** Close with retro, archive, CHANGELOG, S032 open.

## Stretch (carried from S030 — ship if Go closes cleanly)

- **Step player visual polish** — terminal `scroll/<language>` header, `THE CONTRACT` box styling to match the reshaped catalog/landing. Cosmetic; the player is already functionally solid (rail step-type tags + graceful runner states all present).
- **Engawa consistency pass** — align the playground with the reshaped surfaces.
- **Render-test infra** (jsdom + @testing-library) — flagged every sprint since S027; land it or explicitly defer with a reason.

## Open decisions for the Go scope block

| Question | Default |
|---|---|
| Go lens | **"Go's small surface and its sharp edges: goroutines/channels, the error-value convention, interfaces-by-satisfaction, zero values, and the gotchas (nil interfaces, loop-variable capture, slice aliasing)."** Confirm at scope block with Kenji (S6). |
| Go sandbox reality | **Declare Go 1.16.2 in Lesson 0's sandbox-honesty section.** Pre-generics (no type parameters), no `slices`/`maps` stdlib, older `errors` API. Idioms needing >1.16 move to prose with a "newer Go" marker, not a kata. The loop-variable-capture gotcha (fixed in 1.22) is *live* on 1.16 — teach it as the real footgun it is. |
| Go format | **Pure delta, no exception.** Go does NOT inherit Rust's one-model-from-scratch exception. Frame goroutines/channels against the async models the polyglot already holds. |
| Go test harness | **Manual `_t`/`_eq` consistent with the other four** — Piston runs `go run`, not `go test`. |
| Capstone + gestures | **One capstone integrating ≥3 lessons; production-gesture audit at outline** (define a struct + methods, handle an error-value return, use a goroutine+channel). |
| Broken→fix in Go? | **Decide at scope block.** Go is compiled — like Rust, much of the misconception-correction is the compiler's job, so default to write-from-scratch + fail-by-design; reach for broken→fix only where a planted bug embodies a genuine Go gotcha (nil-interface, loop-capture) and the fix teaches the idiom. See [ADR 023](../adr/023-progressive-hint-reveal.md). |

## Open questions (real, blocking specific decisions)

1. **Does the loop-variable-capture footgun belong in the crash scroll or the deep-dive?** Live on the 1.16.2 sandbox (1.22 fixed it). Default: **teach it, marked version-specific.** Kenji + Elif decide at scope block.
2. **Concurrency depth.** Goroutines + channels + `select` is a lot for ~100 min. How much is delta-able vs needs real teaching? If it overflows the format, concurrency becomes a named-and-deferred deep-dive and the crash scroll covers the sequential surface + a single goroutine/channel taste.

## Working order (hypothesis, not contract)

| Block | Work |
|---|---|
| W1 | The carried full-set Piston smoke against all four live scrolls. Fix what surfaces. Confirm `piston-execute-smoke` cron green. |
| W2 | Go scope block (lens, panel, outline + capstone + gesture audit, outline-level user test). |
| W3 | Go authoring (prose, gates, suite voice audit, panel + audience prose review). |
| W4 | Go seed (incl. `estimatedMinutes`) + per-batch smoke against Piston Go 1.16.2; Go publish flip; final full-set smoke incl. Go. Sprint admin close. |

## Reshape follow-ups (from S030 — triage before picking up)

- **`lessons.outcome` field** — the §4.4 "what changed in the learner's head" line the new landing can't yet show (lessons store only `title`). Small schema add, like `estimatedMinutes`.
- **Completed-scroll share reshape** (`ScrollSharePage`) — align with the reshaped surfaces.
- **`estimatedMinutes` tuning** — S030 seeded framework-anchored estimates; replace with real measured numbers when known.
- **`javascript-dom` grouping** — landed under "Topics" via the closed-5-language constant; revisit if it should sit elsewhere.
- **Turnstile on `/scrolls/execute`** — precautionary; only if real execution abuse shows (backlog).

## Reading order if you're picking this up cold

1. [`archive/sprint-030-scrolls-reshape.md`](archive/sprint-030-scrolls-reshape.md) — what just shipped + the carried smoke debt.
2. [ADR 022](../adr/022-crash-course-pivot.md) — the crash-course pivot.
3. [ADR 023](../adr/023-progressive-hint-reveal.md) — broken→fix + tiered hints.
4. [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) — the pipeline, proven four times.
5. [`docs/courses/README.md`](../courses/README.md) §5.3 + §4.4 — capstone + production-gesture canon.
6. [`docs/courses/AUDIENCE.md`](../courses/AUDIENCE.md) — personas; Go's row.
7. The four shipped scroll specs under [`curricula/`](../courses/curricula/) — Rust's is closest in shape (compiled-language sandbox, error-as-curriculum).

## Out of scope, parked

- Kumite feature (still the `/kumite` placeholder).
- Per-track belt marks, rust indicator (PRD-031 v1.1).
- LLM telemetry table (backlog carry).
- Aggressive sensei voice rewrite (calibration-gated).
- Sixth scroll / deep-dives — the five-language set is the closed commitment.
