# Sprint 026 — Ruby crash scroll end-to-end

> **Status:** **Closed** 2026-06-08. Ruby crash scroll shipped end-to-end under the polyglot-first lens. Python downgraded to S027 per explicit fallback (Ruby exceeded the 16h budget). Rust/TS/Go stretch — none touched.
> **Direction:** [ADR 022 — crash-course pivot](../../adr/022-crash-course-pivot.md) · [`docs/courses/README.md`](../../courses/README.md) · [`docs/courses/INTERACTIVITY-PATTERNS.md`](../../courses/INTERACTIVITY-PATTERNS.md)
> **Predecessor:** [Sprint 025 — Crash-course pivot + predict step type](sprint-025-crash-course-pivot.md)
> **Successor:** Sprint 027 — Python crash scroll (mandatory) + Rust queued behind
> **Retro:** See bottom of this file.

## Sprint thesis

The pivot is committed; the architecture is in place; the format is proven via Ruby Lesson 1. Sprint 026 is about content + interactions for the five language scrolls — finishing Ruby, then doing the rest **in a deliberate order, one language at a time, with each language scoped on its own terms** before authoring begins.

The honest framing on size: a single complete crash scroll (spec + content + interactions + smoke) is **8-15 hours per language** depending on the language's surprise surface. Rust is the expected outlier — Björn (S8) will defend that ownership pedagogy needs 120 min and probably 1.5× the per-step time. Realistic for one sprint is **two to three languages end-to-end**, not all five. Stretch is more.

Closing the sprint with two production-grade language scrolls + clean specs for the remaining three is success. All five shipped is the celebration outcome.

### Mid-sprint scope adjustment (2026-06-07)

After re-opening Ruby with the panel under the lens *"crash course for experienced programmers — idioms and peculiarities, not fundamentals"*, three changes land before Ruby authoring resumes:

1. **Lesson order flipped to polyglot-first.** New order: Lesson 0 (Contexto) → Lesson 1 (Blocks) → Lesson 2 (Literales que sorprenden) → Lesson 3 (Object model) → Lesson 4 (Control flow + truthiness) → Lesson 5 (Methods). Reason: a polyglot exits this scroll having to read Ruby code on Friday; what they will encounter first is `do |x| ... end` and symbol-key hashes, not `1.+(2)`. The object model becomes the explanation *behind* the idioms, not the entry gate. The current `Lesson 1 (Object model)` shipped in the seed becomes Lesson 3 in the new order.
2. **Lesson 0 added — "Ruby en contexto".** 3 steps (read + read + predict): what Ruby is for, where it doesn't fit, RubyGems/Bundler, `bundle exec`, how to run Ruby in real life. Not padding — orienting information the polyglot can't get from the official docs without burning hours. Voice gate: every paragraph must remove one decision the polyglot would have made in another browser tab.
3. **Playgrounds as `kata` variant (Option B2).** Two playground steps in the Ruby scroll: one after the `&:method` kata in Lesson 1 (Blocks), one after the read in Lesson 3 (Object model). Implemented as `kata` steps with `data.kind: "playground"` flag; frontend reads the flag and renders without verdict UI. Scoped to Ruby for now; promote to canonical step type only if 2-3 lessons validate the pattern. Doc decision lives in `curricula/ruby/ruby.md`, NOT in `INTERACTIVITY-PATTERNS.md` — that doc updates only after the pattern proves itself across scrolls.

**Honest cost:** ~7-8 extra hours (Lesson 0 authoring + playground frontend B2 + 2 playground steps). Ruby budget moves from 8-15h to 14-18h. **Python remains mandatory** but with explicit fallback: *if Ruby exceeds 16 hours, Python downgrades to stretch without sprint-admin debt.* No re-opening this decision mid-authoring — the trigger is the clock.

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

- **Ruby crash scroll ships end-to-end** with the new polyglot-first structure. Lesson 0 + Lessons 1-5 spec-complete + content authored + seeded + smoke verified through Piston. The seed of the old `Object model` lesson (currently Lesson 1 in DB) gets re-positioned to Lesson 3 and re-tightened against the "idioms-not-fundamentals" lens. One hint per kata. Reviewed through Rhea (S10) + Elif (S5) + Valentina (S2) + Maya (S11) lenses. Two playground steps with B2 frontend flag.
- **Python crash scroll ships end-to-end.** Full scope-then-authoring loop. Reviewed through Nadia (S7) + Elif (S5) + Valentina (S2). *Fallback:* if Ruby exceeds 16 hours, Python downgrades to stretch — no admin debt, no sprint re-open.
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
| W1 | Ruby spec re-skeleton (polyglot-first reorder + Lesson 0). Lesson 0 + Lesson 1 (Blocks) authored + seeded + smoke. Playground frontend B2 implemented when first playground step lands. |
| W2 | Ruby Lessons 2-5 authored + seeded + smoke. Old Lesson 1 (Object model) re-tightened and re-seeded as Lesson 3. Ruby end-to-end demo. **Time check:** if Ruby cumulative > 16h at end of W2, Python downgrades to stretch per fallback. |
| W3 | Python scope block (Authoring Profile + spec). Python authoring block (lessons + content + seed + smoke). End-to-end demo. Sprint midpoint retro: format calibration check + playground pattern validation (promote to canonical step type if signal holds, drop otherwise). |
| W4 | TS scope block + slug swap. TS authoring block. Go scope block + authoring if anything remains. Rust deferred to S027 by default. Sprint close. |

Real timing depends on how cleanly the format scales from Ruby. The polyglot-first reorder + Lesson 0 + playground infra are the new tax; rest stays per original estimate.

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

---

## Retro — closed 2026-06-08

### What shipped

- **Ruby crash scroll end-to-end** under the polyglot-first lens. 6 lessons / 25 steps:
  - Lesson 0 NEW — Ruby in context (3 steps: 2 read + 1 predict)
  - Lesson 1 NEW — Blocks (5 steps including playground 1.5)
  - Lesson 2 NEW — Literals that surprise (4 steps)
  - Lesson 3 MIGRATED — Object model (5 steps with playground 3.5; replaces legacy "First contact with the object model" content via re-tightened reads + `safe_call`/`compare_views` katas)
  - Lesson 4 NEW — Control flow + truthiness (4 steps)
  - Lesson 5 NEW — Methods (4 steps)
- **[`docs/courses/AUDIENCE.md`](../../courses/AUDIENCE.md)** — 4-persona authoring toolkit (A1 Mariana JS senior, A2 Esteban Python mid-senior, A3 Yui Java senior, A4 Felipe TS modernizer). Started at 6 personas; cut to 4 after leverage analysis.
- **[`docs/courses/AUTHORING.md`](../../courses/AUTHORING.md)** — 15-stage retrospective flow reference for future scrolls, written explicitly as reference (not contract).
- **5 embeddable figures canonicalized** in `INTERACTIVITY-PATTERNS.md` (sister-session work, see [`PROTOTYPES-101-REVIEW.md`](../../../.kwik-e/local/scrolls/PROTOTYPES-101-REVIEW.md)): `before-after`, `two-by-two`, `disambiguation`, `array-track`, `tabbed-card`. Schema + authoring rules + anti-patterns documented. Ruby lesson drafts propose figure embeds in 4 places.
- **Playground frontend B2** — kata variant with `data.kind: "playground"` flag; renderer hides verdict UI, replaces StatusChip with `↻ explored` chip.
- **CodeEditor Ruby support** via `@codemirror/legacy-modes/mode/ruby` + fallback for unknown languages (prevents future crashes).
- **Legacy slug cleanup helper** — `removeLegacyScrollBySlug` in seed orchestrator. Retires `ruby-fundamentals` cleanly (walks the FK chain manually since schema has no ON DELETE CASCADE).
- **MockExecutionAdapter fix** — emits `__DOJO_RESULT__` marker so dev flows without `FF_CODE_EXECUTION_ENABLED=true` don't show contradictory "passed" vs "1/1 failed" UI state.
- **Solution-unlock UX fix** — split auto-advance into `onMarkComplete` + `onAdvance`. Kata pass no longer hides the unlocked Solution tab by jumping to the next step. (Sister session further refined this with `navigateToStep` + URL hash sync.)
- **4 canon-doc consistency fixes** surfaced by the cross-language audit subagent: AUTHORING.md `A3 Diego` stale ref, AUDIENCE.md A3 Yui missing Python column, ruby.md phantom cite pointing wrong doc, AUTHORING.md playground promotion gate unreachable math.

### What did NOT ship (and why)

- **Python crash scroll** — downgraded per explicit fallback declared in the 2026-06-07 mid-sprint adjustment ("if Ruby exceeds 16 hours, Python downgrades to stretch — no admin debt"). Ruby cumulative work exceeded the trigger. No admin debt.
- **Rust, TypeScript, Go scrolls** — all stretch from sprint open; none touched. Carry to S027+.
- **Smoke beyond one developer machine** — Adrian smoked locally with Piston disabled (mock adapter). Real Piston smoke deferred to S027 W1 first thing.
- **Figure renderer components** in `apps/web/src/scrolls/figures/` — design landed in INTERACTIVITY-PATTERNS, implementation deferred. ScrollPlayerPage already imports `FigureRenderer`; the components and the `splitOnFigureDirectives` helper are the work item.
- **Semantic-state CSS variables** (`--color-state-*`) in `apps/web/src/styles/main.css` — declared in `docs/DESIGN.md`, not yet written as CSS variables.

### What we learned

- **Outline-level user testing (AUTHORING.md stage 3) is the highest-ROI stage.** Caught 9 issues at zero authoring cost on Ruby. Will be applied to Python from day 1.
- **Subagent parallelization for independent lesson code generation works.** 4 parallel subagents shipped Lessons 0/2/4/5 in ~90s wall-clock vs ~6 min sequential.
- **Smoke should happen lesson-by-lesson, not all at once.** The CodeEditor Ruby language-extension gap would have been caught after Lesson 0 if smoke had been incremental. Will be the discipline for Python.
- **Naming collisions need decision up front.** `LESSON_1_ID` legacy (Object model) vs new Lesson 1 (Blocks) cost a mid-stream decision (`LESSON_BLOCKS_*` naming). For Python: numeric `LESSON_N_ID` from day 1, no legacy to inherit.
- **Audience can override panel.** Esteban (A2) overturned a panel rejection on the `**opts ≈ **kwargs` analogy — the panel had vetoed it broadly, but Esteban argued the analogy holds for `**opts` (just not for `&block`). This refines the AUTHORING.md panel/audience flow.
- **5 figures pattern (sister session) is a real opportunity for Python.** `disambiguation` (list vs tuple vs set, EAFP vs LBYL), `before-after` (verbose Java-style → Pythonic), `two-by-two` (orthogonal axes like `mutable × hashable` for collections) all fit Python's surprise surface. Consider from Python's scope-block onwards.

### Carry-forwards to S027

| # | Item | Why it carries |
|---|---|---|
| 1 | **Python crash scroll end-to-end** | S026 mandatory, downgraded per fallback. S027 mandatory. |
| 2 | **Rust scope block** (queued behind Python) | New for S027. Visible-but-deferred so the order doesn't drift. |
| 3 | **Figure renderer components + CSS state palette vars** | Adopted in docs S026; implementation work item for S027. Unblocks figure embeddings in Python from day 1 (cleaner than backporting to Ruby first). |
| 4 | **Ruby lesson edits applying figures** (`disambiguation` in L2, `before-after` in L0+L1, `two-by-two` in L3) | Drafts already exist in the lesson-N.md files; seed not yet updated. Backport when renderers ship. |
| 5 | **Real Piston smoke of Ruby** | Mock-adapter local smoke was a partial signal. S027 W1 starts here. |
| 6 | **Sensei calibration real run** (S023 carry) | Stale. Review at S027 midpoint, promote if prompt change needs validation. |
| 7 | **Staging smoke environment** (S022 carry) | Stale. Review at S027 midpoint. |
| 8 | **First friend invite dispatch** (S022 carry) | Trigger may now be "Ruby + Python live", per AUDIENCE.md. Review at S027 midpoint. |
| 9 | **DESIGN.md §Motion section reconcile** with `INTERACTIVITY-PATTERNS.md §Animation tech` (Sprint 026 GSAP+CSS reversal) | Flagged in PROTOTYPES-101-REVIEW.md. Five-minute fix; do at S027 open or whenever drift bites. |
