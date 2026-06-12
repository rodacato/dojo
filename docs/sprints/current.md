# Sprint 029 — Go crash scroll + the full-set smoke gate

> **Status:** Open 2026-06-12. Active focus: Go — the fifth and final language scroll — then the full-set real-Piston smoke + publish decisions that have been deferred since S027. Once Go seeds, all five language scrolls exist, and the gate Adrian has been holding fires.
> **Direction:** [ADR 022 — crash-course pivot](../adr/022-crash-course-pivot.md) · [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) · [`docs/courses/README.md`](../courses/README.md) §5.3 *The scroll capstone* + §4.4 *production-gesture rule*
> **Predecessor:** [Sprint 028 — Rust + TypeScript crash scrolls](archive/sprint-028-rust-typescript-crash-scrolls.md)

## Sprint thesis

Four of the five language scrolls are seeded and smoked (Ruby, Python, Rust, TypeScript). Go closes the set. The pipeline is proven twice at 2× — S029's risk is not "can we author a scroll" but two specific things: Go's pre-generics sandbox (Piston ships Go 1.16.2) and the **transition from authoring to shipping**. Once Go seeds, the full-set smoke gate — deferred since S027, Adrian-driven — becomes the actual next move, and it carries real infra dependencies (the TS scroll cannot publish until the Piston deploy config is raised).

S029 is deliberately lighter on authoring than S028 (one scroll, not two) because the back half is the gate: smoke all five against real Piston, make publish decisions, and land the deploy-config raises. That is its own kind of work and it is the point of having built five scrolls.

## Mandatory (sprint blockers if not done)

- **Go crash scroll end-to-end.** Kenji Watanabe (S6) lens. Full pipeline: scope block (lens, panel, outline + capstone + gesture audit, outline-level user test), prose, suite voice audit, panel + audience prose review, seed in batches each smoked live against **Piston Go 1.16.2**. The scratch draft at `.kwik-e/tmp/curricula-drafts/go/` informs scope.
- **Sprint admin discipline.** Close with retro, archive, CHANGELOG, S030 open. Two commits.

## Stretch (ship if Go closes cleanly)

- **THE full-set smoke gate** (may slip to S030 — it's Adrian-driven and infra-gated). Once Go seeds, all five scrolls exist. Walk each against real Piston with `FF_CODE_EXECUTION_ENABLED=true`: every kata's starter + solution, the predicts, the playgrounds, the read+inline interactions, the figures, the capstones. Fix what surfaces. Then the publish decisions (`isPublic` per scroll) and the **Piston deploy-config raises** the TS scroll needs (`max_run_timeout` ≥8000, `output_max_size` above the 1024-byte default). This is the move five scrolls were built for.
- **Render-test infra** (jsdom + @testing-library) — flagged every sprint since S027; finally land it or explicitly defer with a reason.

## Out of scope (deferred, with explicit triggers)

- **Sixth scroll / deep-dives** — the five-language set is the closed commitment. Deep-dives (rust-lifetimes, ruby-blocks, the algorithms 101 course) are Phase-3 candidates, triggered by a real audience need, not by having capacity.
- **Algo-trace step type / GSAP** — deferred kit in `INTERACTIVITY-PATTERNS.md` §Deferred device kit; trigger is a committed algorithms course.
- **Curricula docs Spanish cleanup** (`ruby/ruby.md` ~200 lines) + **TS lesson/seed drift** (S028's strip-and-run seed fixes weren't back-ported to the lesson .md drafts) — docs-only; back-port before any re-seed. Filler work.
- **Catalog UI grouping** (Languages / Topics) — trigger fires when the full-set smoke publishes scrolls and `/scrolls` holds 5+ live.
- **Contrast audit of `--color-state-*`** + stale S022/S023 carries — review at trigger.

## Open decisions for the Go scope block

| Question | Default |
|---|---|
| Go lens | **"Go's small surface and its sharp edges: goroutines/channels, the error-value convention, interfaces-by-satisfaction, zero values, and the gotchas (nil interfaces, loop-variable capture, slice aliasing)."** Confirm at scope block with Kenji (S6). The polyglot knows concurrency conceptually; Go's *model* (CSP, `go`/`chan`/`select`) and its deliberate omissions are the delta. |
| Go sandbox reality | **Declare Go 1.16.2 in Lesson 0's sandbox-honesty section.** Pre-generics (no type parameters — 1.18+), no `slices`/`maps` stdlib packages, older `errors` API. If a planned idiom needs >1.16, it moves to prose with a "newer Go" marker, not a kata. The loop-variable-capture gotcha (fixed in 1.22) is *live* on 1.16 — teach it as the real footgun it is on this sandbox. |
| Go format | **Pure delta, no exception.** Go does NOT inherit Rust's format exception (S028 said so explicitly). Concurrency is the one place that tempts a from-scratch teach — resist it; frame goroutines/channels against the async models the polyglot already holds. |
| Go test harness | **Manual `_t`/`_eq` consistent with the other four** — Piston runs `go run`, not `go test` as the harness (real `testing` package deferred to a go-testing deep-dive). |
| Capstone + gestures | **One capstone integrating ≥3 lessons; production-gesture audit at outline** (define a struct + methods, handle an error-value return, use a goroutine+channel). Now canon. |

## Open questions (real, blocking specific decisions)

1. **Does the loop-variable-capture footgun belong in the crash scroll or the deep-dive?** It's Go's most famous gotcha and it's *live* on the 1.16.2 sandbox (1.22 fixed it). Teaching it is honest to the sandbox but teaches a thing newer Go developers won't hit. Default: **teach it, marked as version-specific** — the polyglot reading Go today still meets pre-1.22 code everywhere. Kenji + Elif decide at scope block.
2. **Concurrency depth.** Goroutines + channels + `select` is a lot for a ~100-min crash scroll. How much is delta-able vs how much needs real teaching? If it needs more than the format allows, concurrency becomes a named-and-deferred deep-dive and the crash scroll covers the sequential surface + a single goroutine/channel taste. Scope-block call.

## Working order (hypothesis, not contract)

| Block | Work |
|---|---|
| W1 | Go scope block (lens, panel, outline + capstone + gesture audit, outline-level user test, interaction-plan confirmation). |
| W2 | Go authoring (prose, gates, suite voice audit, panel + audience prose review). |
| W3 | Go seed + per-batch smoke against Piston Go 1.16.2. |
| W4 | Full-set smoke gate (if Go closes clean) + publish decisions + Piston deploy-config raises. Sprint admin close. |

## Reading order if you're picking this up cold

1. [ADR 022](../adr/022-crash-course-pivot.md) — the crash-course pivot.
2. [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) — the pipeline, proven four times now.
3. [`docs/courses/README.md`](../courses/README.md) §5.3 + §4.4 — capstone + production-gesture canon.
4. [`docs/courses/AUDIENCE.md`](../courses/AUDIENCE.md) — personas; Go's row.
5. [`docs/courses/INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md) — step types, figures, the 6 acceleration principles.
6. The four shipped scroll specs under [`curricula/`](../courses/curricula/) — Ruby/Python/Rust/TypeScript as precedent; Rust's is the closest in shape (compiled-language sandbox, error-as-curriculum).
7. [`docs/sprints/archive/sprint-028-rust-typescript-crash-scrolls.md`](archive/sprint-028-rust-typescript-crash-scrolls.md) §Retro — the carry-forwards and the infra lessons (Piston TS overhead, the deploy-config gate).
8. This file.

## Out of scope, parked

- Kumite feature (still the `/kumite` placeholder).
- Per-track belt marks, rust indicator (PRD-031 v1.1).
- LLM telemetry table (backlog carry).
- Aggressive sensei voice rewrite (calibration-gated).
