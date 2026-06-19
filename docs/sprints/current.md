# Sprint 030 — Go crash scroll + the full-set smoke gate

> **Status:** Open 2026-06-19. Active focus: Go — the fifth and final language scroll — and the full-set real-Piston smoke that now guards **live** content. S029 published the four existing scrolls ahead of this gate, so the smoke is no longer stretch: it protects what's already public.
> **Direction:** [ADR 022 — crash-course pivot](../adr/022-crash-course-pivot.md) · [ADR 023 — progressive hint reveal + broken→fix](../adr/023-progressive-hint-reveal.md) · [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) · [`docs/courses/README.md`](../courses/README.md) §5.3 + §4.4
> **Predecessor:** [Sprint 029 — Scroll format revision + publish all four](archive/sprint-029-scroll-format-revision.md) *(unplanned interlude that took the S029 slot; Go moved here)*

## Sprint thesis

Go closes the five-language set. The pipeline is proven four times. The risk is not "can we author a scroll" — it's two things: Go's pre-generics sandbox (Piston ships Go 1.16.2) and the **transition from authoring to shipping**.

That transition got inverted in S029: the four existing scrolls (Ruby, Python, Rust, TypeScript) were flipped to `published` + `isPublic: true` *before* the full-set smoke ran, on Adrian's call. So the gate this sprint was built around is now urgent and protective, not exploratory — a broken kata is broken *in production* at the next reseed. The back half of S030 is that gate: smoke all five against real Piston, land the deploy-config raises TS needs, then Go's own publish flip.

## Mandatory (sprint blockers if not done)

- **Go crash scroll end-to-end.** Kenji Watanabe (S6) lens. Full pipeline: scope block (lens, panel, outline + capstone + gesture audit, outline-level user test), prose, suite voice audit, panel + audience prose review, seed in batches each smoked live against **Piston Go 1.16.2**. Scratch draft at `.kwik-e/tmp/curricula-drafts/go/` informs scope. When it seeds + smokes clean, flip it to `published` + `isPublic: true` and add `go` to `PUBLIC_LANGUAGE_WHITELIST` (consistent with the other four).
- **THE full-set real-Piston smoke — now guarding live content, no longer stretch.** Walk all five scrolls against real Piston (`FF_CODE_EXECUTION_ENABLED=true`): every kata's starter + solution, the predicts, playgrounds, read+inline interactions, figures, capstones. Ruby especially — its four S029 broken→fix conversions were validated by logic, never executed (no local Ruby). Fix what surfaces.
- **TS Piston deploy-config — DONE (verify, don't re-do).** `config/deploy.api.yml` already runs the Piston accessory with `PISTON_RUN_TIMEOUT=8000` + `PISTON_OUTPUT_MAX_SIZE=65536` (landed in the S029-adjacent Piston fixes). The `piston-execute-smoke` CI job (`/cron/piston-smoke`, every 30 min, production-scoped) executes a hello-world per language through `PistonAdapter` and goes red if the caps regress — that's the live verifier. Just confirm it's green after the next deploy; nothing to author.
- **Sprint admin discipline.** Close with retro, archive, CHANGELOG, S031 open. Two commits.

## Stretch (ship if Go closes cleanly)

- **Render-test infra** (jsdom + @testing-library) — flagged every sprint since S027; finally land it or explicitly defer with a reason.

## Out of scope (deferred, with explicit triggers)

- **Sixth scroll / deep-dives** — the five-language set is the closed commitment. Deep-dives (rust-lifetimes, ruby-blocks, the algorithms 101 course) are Phase-3 candidates, triggered by a real audience need.
- **Algo-trace step type / GSAP** — deferred kit in `INTERACTIVITY-PATTERNS.md` §Deferred device kit; trigger is a committed algorithms course.
- **Curricula docs Spanish cleanup** (`ruby/ruby.md`) + **TS lesson/seed drift** — docs-only; back-port before any re-seed. Filler.
- **Catalog UI grouping** (Languages / Topics) — trigger fires now that `/scrolls` will hold 5 live scrolls; promote from filler to real once Go publishes.
- **Contrast audit of `--color-state-*`** + stale S022/S023 carries — review at trigger.

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
| W1 | Confirm `piston-execute-smoke` is green post-deploy (TS caps already in config) + start the **full-set content smoke** of the four already-published scrolls — they guard production, do them first. |
| W2 | Go scope block (lens, panel, outline + capstone + gesture audit, outline-level user test). |
| W3 | Go authoring (prose, gates, suite voice audit, panel + audience prose review). |
| W4 | Go seed + per-batch smoke against Piston Go 1.16.2; Go publish flip; final full-set smoke incl. Go. Sprint admin close. |

## Reading order if you're picking this up cold

1. [ADR 022](../adr/022-crash-course-pivot.md) — the crash-course pivot.
2. [ADR 023](../adr/023-progressive-hint-reveal.md) — broken→fix + tiered hints (S029).
3. [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) — the pipeline, proven four times.
4. [`docs/courses/README.md`](../courses/README.md) §5.3 + §4.4 — capstone + production-gesture canon.
5. [`docs/courses/AUDIENCE.md`](../courses/AUDIENCE.md) — personas; Go's row.
6. [`docs/courses/INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md) — step types, figures, broken→fix, progressive hints.
7. The four shipped scroll specs under [`curricula/`](../courses/curricula/) — Rust's is closest in shape (compiled-language sandbox, error-as-curriculum).
8. [`archive/sprint-029-scroll-format-revision.md`](archive/sprint-029-scroll-format-revision.md) — the interlude + the published-ahead-of-gate decision and its consequences.
9. This file.

## Out of scope, parked

- Kumite feature (still the `/kumite` placeholder).
- Per-track belt marks, rust indicator (PRD-031 v1.1).
- LLM telemetry table (backlog carry).
- Aggressive sensei voice rewrite (calibration-gated).
