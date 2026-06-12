# Sprint 028 — Rust + TypeScript crash scrolls

> **Status:** Open 2026-06-11. Active focus: two language scrolls per sprint (cadence decision at S027 close). Rust and TypeScript end-to-end under the polyglot-first lens, with the S027 canon additions (capstone + production-gesture) applied from outline stage. Go queued for S029.
> **Direction:** [ADR 022 — crash-course pivot](../adr/022-crash-course-pivot.md) · [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) · [`docs/courses/README.md`](../courses/README.md) §5.3 *The scroll capstone* + §4.4 *production-gesture rule*
> **Predecessor:** [Sprint 027 — Python crash scroll](archive/sprint-027-python-crash-scroll.md)

## Sprint thesis

S026 proved the format with Ruby; S027 applied the flow to Python and hardened the player (registry, read+inline, figures, capstones). The authoring machine is now warm: specs, personas, gates, figure catalog, and the 15-stage flow all exist. S028 tests whether the machine actually runs at 2× — two scrolls in one sprint, with the lessons-learned applied *from the outline* instead of retrofitted:

- **Capstone planned at outline stage** (README §5.3) — the outline-level audience test includes "sketch an attack on the capstone using only the outlined lessons".
- **Production-gesture audit at outline stage** (README §4.4) — list the 2-3 daily gestures per language; each must be *written* in a kata, not read about.
- **Smoke per seeded batch**, not at the end (S026/S027 lesson, twice-proved).

Honest framing on risk: Python ran ~8-12 hours because its surprise surface was small. Rust's is the largest of the five (ownership, borrowing, lifetimes — real new mental models, not idiom deltas), and TypeScript has a legacy scroll to migrate rather than a green field. If the 2× cadence breaks, the declared fallback is: **Rust ships complete, TypeScript carries to S029 with no admin debt** — same fallback shape that worked for Python in S026.

## Mandatory (sprint blockers if not done)

- **Rust crash scroll end-to-end.** Björn (S8) lens with compiler-as-tutor as the central pedagogical bet. ~120 min target (vs ~100-115 for the others) per Rust's surprise surface. Scratch draft at `.kwik-e/tmp/curricula-drafts/rust/` informs the scope block. Capstone + production-gesture from outline. Sandbox honesty: Piston ships Rust 1.68.2 — the scroll declares what that excludes up front.
- **TypeScript crash scroll end-to-end.** Leo (S9) lens (language pedagogy; infra TS stays with Tomás). Open decision below on migrate-vs-rebuild for the legacy TS scroll. Capstone + production-gesture from outline.
- **Sprint admin discipline.** Close with retro, archive, CHANGELOG, S029 open. Two commits.

## Stretch (ship if both scrolls close cleanly)

- **Go scope block** — only the scope block; authoring is S029. Kenji (S6→S6? — Kenji Watanabe, S6 in AGENTS table) lens. Piston Go 1.16.2 is pre-generics: that constraint shapes the lens decision and must be on the table at scope, not discovered at seeding.
- **Catalog UI grouping** (Languages / Topics per README §4.5) — with Rust + TS live the catalog holds 5+ scrolls and the trigger has arrived.
- **Render-test infra** (jsdom + @testing-library) — half-hour setup; makes the 6 figures and step renderers testable. Best pending cost/benefit in the codebase.

## Out of scope (deferred, with explicit triggers)

- **THE smoke gate** — one full-set real-Piston smoke of all five scrolls + publish decisions (`isPublic`), Adrian-driven. **Trigger: all five scrolls seeded** (S029 when Go lands). Absorbs all prior per-scroll smoke carries — see S027 retro "Closed at this retro". Not a task in this sprint; do not re-add it per scroll.
- **Algo-trace step type / algorithms 101 course / GSAP** — deferred kit recorded in `INTERACTIVITY-PATTERNS.md` §Deferred device kit with adoption triggers.
- **Curricula docs Spanish cleanup** (`ruby/ruby.md` ~200 lines) — docs-only pass, take it as filler work if a block stalls.
- **ROADMAP sprint-history reconcile** (stale at S023) — same filler-work status.
- **Contrast audit of `--color-state-*` tokens** — pending designer calibration; rides with the Sumi-e work whenever that lands.
- **Stale S022/S023 carries** (sensei calibration, friend invites, DESIGN §Motion reconcile) — review at midpoint. Friend-invite trigger ("Ruby + Python live") fires when the smoke gate publishes them.

## Open decisions for the scope blocks

| Question | Default |
|---|---|
| Rust lens | **"Compiler-as-tutor: ownership, borrowing, and the error messages that teach them."** Per the S026 cross-lang draft. Confirm at scope block with Björn (S8). |
| Rust sandbox reality | **Declare Rust 1.68.2 in Lesson 0's sandbox-honesty section.** No `let-else` (1.65 ok), no newer stdlib. If a planned idiom needs >1.68, the idiom moves to prose with a "newer Rust" marker, not to a kata. |
| TypeScript: migrate or rebuild | **Rebuild under polyglot-first; salvage individual steps where they survive the paragraph test.** The legacy TS scroll predates ADR 022 and the audience contract. Ruby's L3 migration (S026) is the precedent: re-tighten, don't transplant. Final call at scope block with Leo (S9). |
| TS lens | **"What TypeScript adds to the JavaScript you already write — benefits forward."** The reader knows JS cold; the scroll sells and drills the delta: inference over annotation, narrowing, structural typing, the compiler as a second reader during refactors. Not a JS reteach, not framework typings (React props etc. out of scope). |
| TS execution target | **Keep the existing Piston TS path** (already allowlisted at `/scrolls/execute`). The iframe-sandbox is for `javascript-dom` only. |
| Step count targets | **Rust ~24-26 steps / ~120 min; TS ~20-22 steps / ~95 min.** |
| Figures + capstones | **Each scroll: figures where they earn their place (≥1 disambiguation), one capstone, production-gesture audit at outline.** Now canon, not per-scroll debate. |

## Open questions — resolved 2026-06-11 (Adrian)

1. **Who is the TS scroll for?** ~~Open~~ **Resolved: the JS developer adopting TypeScript** — *"alguien que ya sabe JavaScript que quiere aprender a usar TypeScript y conocer sus beneficios"*. That is A4 Felipe's exact shape (5yr JS→TS modernizer), with A1 Mariana secondary. The swap-for-Go option is closed; TS stays in S028. Lens follows from the audience (see decisions table).
2. **Rust authoring cost.** ~~Open~~ **Resolved: Rust gets a scoped format exception** — *"hagamos una excepción porque son importantes"*. The exception, shaped so it can't leak: the scroll teaches **exactly one new mental model from scratch** (ownership → borrowing → lifetimes-lite); everything else in Rust stays delta-style like every other scroll (traits ≈ interfaces with a twist, enums ≈ ADTs the polyglot knows, pattern matching ≈ familiar). The format *bends*, not breaks: same polyglot audience, ~120 min, no fundamentals reteach — but a heavier predict ratio ("does this compile? what does rustc say?") and compiler-output-as-feedback in katas, because for Rust the error message IS the curriculum. Fail-by-design is structurally central, not a garnish. **The exception is Rust-scoped: Go and TS do not inherit it.** Björn + Elif shape the details at scope block; the exception itself is decided.

Still genuinely open:

3. **Does the 2× cadence survive contact?** Declared fallback: Rust completes, TS carries. The cadence is the experiment; the fallback is the control. The Rust exception raises the risk on this one — flagged honestly.

## Working order (hypothesis, not contract)

| Block | Work |
|---|---|
| W1 | Rust scope block (lens, panel, outline + capstone + gesture audit, outline-level user test — Björn + Elif shape the format exception here). TS scope block (audience resolved: Felipe primary; lens follows). |
| W2 | Rust authoring (lesson drafts, gates, voice audit, panel + audience review). TS authoring. |
| W3 | Rust seed + per-batch smoke. TS seed + per-batch smoke. |
| W4 | Stretch items. Sprint admin close. |

## Reading order if you're picking this up cold

1. [ADR 022](../adr/022-crash-course-pivot.md) — the crash-course pivot.
2. [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) — the flow, including "What we'd do differently" #5 (capstone at outline).
3. [`docs/courses/README.md`](../courses/README.md) §5.3 + §4.4 — the S027 canon additions.
4. [`docs/courses/AUDIENCE.md`](../courses/AUDIENCE.md) — personas; note open question #1 (TS audience).
5. [`docs/courses/INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md) — step types (read+inline now shipped), figures (6), acceleration principles, deferred kit.
6. `.kwik-e/tmp/curricula-drafts/{rust,typescript}/` — the S026 parallel-draft scratch material.
7. [`docs/sprints/archive/sprint-027-python-crash-scroll.md`](archive/sprint-027-python-crash-scroll.md) §Retro — carry-forwards and the smoke-gate consolidation.
8. This file.

## Out of scope, parked

- Kumite feature (still the `/kumite` placeholder).
- Per-track belt marks, rust indicator (PRD-031 v1.1).
- LLM telemetry table (backlog carry).
- Aggressive sensei voice rewrite (calibration-gated).

---

## Retro — closed 2026-06-12

### What shipped

**Both mandatory scrolls, end-to-end, under the 2-per-sprint cadence — the cadence held.**

- **Rust crash scroll** — 7 lessons / 25 steps, the full Phase-A→W3 pipeline: spec→canon, interaction-plan confirmation (architect + 2 audience users), prose (3 parallel writers), suite voice audit, panel + audience prose review, seed in 4 batches each smoked live against **Piston rustc 1.68.2** (installed into the local Piston this sprint). All 13 reference solutions pass; every quoted rustc error is a verbatim capture. The Rust-scoped format exception (one mental model from scratch: ownership→borrowing→lifetimes-lite) held without leaking. `isPublic:false`.
- **TypeScript crash scroll** — 6 lessons / 20 steps, same pipeline, **Piston TS 5.0.3**. Benefits-forward lens for A4 Felipe (JS dev adopting TS). All 11 solutions pass; the key-presence-aware `_eq` harness (distinguishes `{}` from `{k:undefined}`) was validated before seeding. `isPublic:false`. Legacy `typescript-fundamentals` left intact — the rebuild-not-migrate hard-delete is a publish-time call.
- **Execution infra hardened by what the smokes exposed** (the load-bearing reason to smoke per-batch against the real compiler):
  - PistonAdapter renames a learner `fn main`→`__learner_main` for Rust (the mod-solution wrap failed on module privacy — E0425/E0603) and scrubs Piston's sandbox-keeper/chmod noise from compile stderr.
  - `errorKind` now recognizes compiler-error signatures (`error TS####`, `error[E####]`, go/javac) so TS and Rust compile failures read as "did not compile," not "crashed."
  - `PISTON_RUN_TIMEOUT` 3000→8000 (Piston compiles TS at run — a ~2.7s floor even for `console.log`).
  - The TS harness footer drops the legacy ✓/✗ echo (Piston caps stdout at 1024 bytes; the capstone's 10-test result tipped over).
- **Spec/canon work:** both scrolls' specs promoted from pre-pivot Course-Track files to crash-format canon, the `metric-pair` figure adjudication recorded for both (consciously unserved — no honest ≥3× magnitude), AUDIENCE.md corrected (Esteban has no JS background; the row I'd invented "fullstack years" — fixed), and the compile-result-as-feedback gate validated before TS prose.

### What did NOT ship (and why)

- **Go scope block** (stretch) — not opened. Both mandatory scrolls consumed the sprint; Go is S029's first scroll.
- **Catalog UI grouping** (stretch) — untouched; trigger (5+ live scrolls) arrives only once scrolls publish.
- **Render-test infra** (jsdom) — flagged again, still not done. Carries.
- **Publishing either scroll** — deliberate: `isPublic:false` until the full-set real-Piston smoke + the Piston deploy-config raises (max_run_timeout ≥8000, output_max_size) land. Adrian's call.

### What we learned

- **Smoking per-batch against the real compiler is non-negotiable, and it pays every time.** Rust: the mod-solution wrap died on module privacy; a kata solution wasn't self-contained; `help: consider cloning` exists on 1.68.2 (the drafts guessed wrong). TS: the suite voice audit (which compiled the code) caught two compile-breakers; the live smoke caught the strip-and-run type-assertion-runs-and-throws trap, a stale `@ts-expect-error` inside a comment, a content arithmetic bug (108×0.95≠102), and the stdout-cap overflow. None of these survive a real-compiler smoke; none are caught by reading.
- **The full Phase-A→W3 pipeline is now proven repeatable at 2×.** Same agent choreography ran twice with consistent quality. The cost is real (many agent-rounds per scroll) but the output is consistent and the quality gates catch their classes of bug.
- **TS on Piston is infrastructure-fragile.** The ~2.7s tsc-at-run floor + Piston's 1024-byte stdout cap + run-timeout cap make TS the tightest of the languages. The scroll works, but publishing it needs the deploy-config raises documented in the seed header — not optional.
- **Honest persona discipline matters.** The AUDIENCE.md row I'd fabricated for Esteban ("JS from his fullstack years") was caught at the TS confirmation; personas drive real authoring decisions, so an invented detail is a real bug.

### Carry-forwards to S029

| # | Item | Why it carries |
|---|---|---|
| 1 | **Go crash scroll** | S028 stretch never opened; S029 mandatory scroll #1. Piston Go 1.16.2 is pre-generics — that constraint shapes the lens, on the table at scope. |
| 2 | **Fifth language scroll** (the 2-per-sprint cadence's second slot) | Candidates: a deep-dive, or revisit. Decide at S029 open. |
| 3 | **THE full-set smoke gate + publish decisions** (`isPublic` for all five) + **Piston deploy config** (max_run_timeout ≥8000, output_max_size raise for TS) | Adrian-driven, when all five scrolls are seeded. The TS scroll specifically cannot publish until the Piston config lands. |
| 4 | **Render-test infra** (jsdom + @testing-library) | Flagged every sprint since S027; still the best pending cost/benefit. |
| 5 | **Curricula docs Spanish cleanup** (`ruby/ruby.md` ~200 lines) + **TS lesson/seed drift** (the seed's strip-and-run bug fixes weren't back-ported to the lesson .md drafts) | Docs-only; back-port before any re-seed. |
| 6 | **Catalog UI grouping** + **contrast audit of `--color-state-*`** + stale S022/S023 carries | Same review-at-trigger status. |
