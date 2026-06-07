# Crash Course Scroll — Authoring Flow

> **Status:** Reference (not prescriptive) · **Last reviewed:** 2026-06-07
> **Sourced from:** Ruby scroll authoring, Sprint 026 (commits `c80e2df..9b90842`).

A retrospective on how the Ruby crash scroll got authored end-to-end, kept around so the next scroll author can borrow what worked and skip what didn't. The Ruby scroll was the first one under the polyglot-first scope; the flow below is a candidate template, not a contract.

## Why this doc exists

The canonical docs ([README.md](README.md), [INTERACTIVITY-PATTERNS.md](INTERACTIVITY-PATTERNS.md), [AUDIENCE.md](AUDIENCE.md), [`../EXPERTS.md`](../EXPERTS.md)) define **what** a scroll is. None of them define **how** to author one — what order to do things in, when to consult the panel, when to consult the audience, when to write prose vs code. This doc fills that gap by describing what we actually did for Ruby.

## What this doc is NOT

- **Not a checklist.** Future scrolls may skip stages, compress them, or run them in a different order. Adrian decides per scroll.
- **Not canonical.** Canon lives in the docs above. This is a retrospective. If a pattern here contradicts a canonical doc, the canonical doc wins.
- **Not a substitute for judgment.** The 15 stages worked for Ruby because Ruby was content-heavy and the maintainer wasn't a Ruby expert. A scroll in a domain Adrian knows cold may compress stages 2-5 into one quick panel pass.

## The flow at a glance

```
Phase A — Scope (cheap, before any prose)
  1. Open sprint with explicit lens
  2. Panel review of the spec / outline
  3. User testing on outline-level (highest ROI stage)
  4. Apply user-test fixes
  5. Panel re-review with the fixes — catches what users missed

Phase B — Prose (lesson-by-lesson markdown drafts)
  6. Author prose in markdown, one file per lesson
  7. Self-review per lesson against scroll-specific gates
  8. Final voice audit as a suite
  9. Formal panel review on complete prose
  10. Formal audience review on complete prose
  11. Audience → Panel feedback loop
  12. Apply final changes

Phase C — Code (seed integration)
  13. Parallel subagents for independent lessons
  14. Single subagent for complex lessons
  15. Orchestrator integration + typecheck/lint

Phase D — Smoke + bugfixes
  (separate commits, not bundled with the main pipeline)
```

---

## Stages

### Phase A — Scope

#### 1. Open the sprint with an explicit lens

Ruby's lens, decided mid-sprint: *"crash course for experienced programmers — idioms and peculiarities, not fundamentals."* Stated explicitly in [`current.md`](../sprints/current.md) §"Mid-sprint scope adjustment".

**What worked:** every later decision could test against the lens. The polyglot-first reorder, the cuts to the "tour guide" prose, the `paragraph test` — all flowed from this one sentence.

**What we'd do differently:** state the lens at sprint open, not after a panel review reveals it should change. Saved a few hours but cost some re-litigation of the existing spec.

#### 2. Panel review of the spec

Run the spec by the language steward + curriculum architect + content reviewer + interactive UX reviewer + scope discipline. For Ruby: Rhea (S10) + Elif (S5) + Valentina (S2) + Maya (S11) + Priya (C1).

Surfaced 5 critical tensions before any prose was written. Each expert flagged different things; the conflicts surfaced where the spec was making a hidden bet.

**Reference:** [`../EXPERTS.md`](../EXPERTS.md) for the panel.

#### 3. User testing on outline-level (the highest-ROI stage)

Two primary personas read the outline YAML — not prose, just the step descriptions and intended mechanics. They flagged 9 issues at zero authoring cost: a typo, a contradiction (block-is-syntax vs block-is-object), a forward-reference bug (`#{}` before Lesson 2 introduces it), a leading predict (puts template revealed the answer), a hint that was the solution, the Python-`yield` trap, a wrong analogy (`&block ≈ **kwargs`), `bundle exec` vs venv, and `transform_keys` collision behaviour.

**Why this stage matters:** finding these in prose would have cost 10× more. The outline is where you read fast and pattern-match against your stack reflexes — exactly the audience profile.

**For Ruby:** Mariana (A1, JS senior) + Esteban (A2, Python mid-senior).

**Reference:** [AUDIENCE.md](AUDIENCE.md) for which personas to pick.

#### 4. Apply user-test fixes

Single commit. For Ruby: `203d28b`.

#### 5. Panel re-review with the fixes

After applying user-test fixes, run the panel again. The audience misses things from a pedagogy lens; the panel catches them. For Ruby this added 4 more refinements (named-and-defer `block_given?`, multi-arg block syntax, `do/{}` precedence, the `Hint discipline §2.4` rule that's now in the spec).

**The pattern:** audience surfaces, panel refines. Run both, in this order.

For Ruby: `cebc759`.

---

### Phase B — Prose

#### 6. Author prose in markdown, one file per lesson

For Ruby: [`docs/courses/curricula/ruby/lesson-0.md`](curricula/ruby/lesson-0.md) ... `lesson-5.md`. Each file holds the production prose for every step's `instruction`, `feedback`, `hint`, `solution`, `alternativeApproach`.

**Why prose-first:** if the voice doesn't land, fix it in markdown. Seed code is for wiring. Decoupling these means the panel/audience review happens against the actual reader-facing text, not against TS templates with escape sequences.

**Time:** ~30-60 minutes per lesson to draft from the outline.

#### 7. Self-review per lesson against scroll-specific gates

Each scroll's `<lang>/<lang>.md` §2 defines its own gates. For Ruby (see [`curricula/ruby/ruby.md`](curricula/ruby/ruby.md) §2):

- **§2.1 Paragraph test** — every `read` paragraph must remove a polyglot decision. If removing it doesn't change anything, cut it.
- **§2.4 Hint discipline** — hints reduce search space, don't eliminate it. *"`n.times { yield }`"* in a hint is the failure mode.

Other scrolls should define analogous gates that capture their own failure modes.

#### 8. Final voice audit as a suite

When all lessons drafted, re-read the `read` steps as a suite (not lesson-by-lesson). Check: voice drift in the last lessons? Paragraph counts honest? Any lesson notably weaker?

**Budget:** 30 min. Drift is real in long-form authoring.

#### 9. Formal panel review on complete prose

Different from stage 2 (which reviewed the spec). This reviews prose as the learner would. For Ruby surfaced 4 cross-cutting issues: a dense `&block` paragraph, missing bridge L0 → L1, kata 5.2 too thin, predict option D too easy.

#### 10. Formal audience review on complete prose

The same primaries read the prose. For Ruby: Mariana + Esteban + Felipe (secondary).

**Surprise from Ruby:** Esteban reversed an earlier panel rejection — the panel had vetoed the `**kwargs` analogy, but Esteban argued it holds for `**opts` (just not for `&block`). The audience was right. The pattern: audience can override panel when panel was generalizing from a different scope.

#### 11. Audience → Panel feedback loop

The audience says *"X feels off"*. The panel says *"here's how to fix it"*. Audience surfaces; panel refines.

This stage was Adrian's explicit ask in Ruby. It surfaced 9 concrete changes from the combined loop.

#### 12. Apply final changes

Single commit. For Ruby: `ed6ad68`.

---

### Phase C — Code

#### 13. Parallel subagents for independent lessons

Lessons that don't cross-reference each other can be seeded in parallel. For Ruby: 4 subagents (Lesson 0, 2, 4, 5) in parallel, ~90s wall-clock. Sequential would have been ~6 minutes.

**Subagent prompt must be DENSE.** Subagents don't see your context. Include:
- File paths to read (lesson markdown source, existing seed for shape templates).
- Exact UUID conventions (`seedUuid('ruby-l0-context')`, etc.).
- Output location (`/tmp/lesson-N-seed.ts`).
- Step-type shape rules per type (read / predict / kata / challenge / playground).
- Content fidelity rules (copy verbatim, don't paraphrase, escape backticks).
- Explicit "do not" list (don't redefine the harness constants, don't add imports, don't modify other files).
- Return contract (brief summary + line count).

**Naming collisions must be solved up front.** Ruby had `LESSON_1_ID` legacy (Object model) and new Lesson 1 (Blocks). We used `LESSON_BLOCKS_*` for the new one. For future scrolls without legacy, prefer numeric naming (`LESSON_1_*`, `STEP_1_*_ID`).

#### 14. Single subagent for complex lessons

Lessons with new step variants or that modify existing code go to a single subagent with deeper context.

For Ruby: Lesson 1 (Blocks, with playground variant) and Lesson 3 (Object model migration replacing existing kata content). Each was its own subagent run after the parallel 4.

#### 15. Orchestrator integration + typecheck/lint

Subagent outputs land in `/tmp/`; orchestrator (Claude main session) integrates via `sed + cat` for bulk inserts and `Edit` for targeted updates.

Always typecheck + lint after each integration. For Ruby: every commit landed clean before the next stage.

---

### Phase D — Smoke + bugfixes

Smoke test should happen **between batches**, not at the end.

**Ruby anti-pattern:** smoke was deferred until everything was seeded. Two bugs surfaced (CodeEditor had no Ruby language support; legacy `ruby-fundamentals` slug was never cleaned from DB). Both would have been caught earlier if Lesson 0 had been smoked before seeding the rest.

**For future scrolls:** smoke after Lesson 0 (or the first kata-bearing lesson). Cheap. Catches infra gaps early.

Bug fixes from smoke go in their own commits, not bundled with the main pipeline. Each bug has its own narrative.

---

## Patterns that emerged here (reusable across scrolls)

- **Audience → Panel feedback loop** (stage 11). Codifies the "audience surfaces, panel refines" dynamic.
- **Outline-level user testing** (stage 3). The single highest-ROI stage. Cheap signal before expensive prose.
- **Prose-first markdown drafts in `lesson-N.md`** (stage 6). Decouple voice review from code wiring.
- **Per-scroll authoring gates in §2 of the scroll spec** (stage 7). Each scroll defines its own gates; the *patterns* (paragraph-style test, hint-style discipline) reuse across scrolls but the *specific rules* vary.
- **Parallel subagents for independent code generation** (stage 13). Wall-clock win when lessons don't cross-reference.
- **Smoke between batches, not at the end** (stage D — learned from Ruby's anti-pattern).

## Patterns that were Ruby-specific (probably not reusable)

- **Legacy POC migration.** Other scrolls don't have an existing seed to honour. Skip Phase C step 14 unless there's a legacy lesson to repurpose.
- **Slug cleanup helper.** Ruby was renamed (`ruby-fundamentals` → `ruby`); the cleanup at the tail of `seedAllScrolls` is for Ruby specifically. Other scrolls won't need this unless they're also renamed.
- **The Rails-not-Ruby angle.** Each scroll has its own analogous voice angle (Python-not-Django? Rust-not-just-Rustlings? TypeScript-not-Just-JS-with-Types?). Decide the angle in stage 1.

## What we'd do differently

1. **State the lens at sprint open**, not mid-sprint (stage 1).
2. **Smoke after the first lesson seed**, not after all of them (stage D).
3. **Decide naming conventions up front** when there's a legacy lesson (stage 13 — saved hours).
4. **The 6-persona AUDIENCE.md draft** was overkill; we cut to 4. For next-scroll AUDIENCE updates, start from 4.

## Open questions for the next scroll

These are honestly open — Adrian decides per scroll:

1. **Do we always do the full Phase A (5 stages)?** Ruby was the first scroll under the polyglot-first pivot, so stakes were high. Python may compress stages 2-5 into one panel pass.
2. **Do `lesson-N.md` drafts persist in the repo, or move to an archive after seed?** Currently they stay (useful for reviewers); they do add ~2000 lines per scroll to the repo.
3. **When a subagent catches a flaw** (e.g., the stale hint phrasing in Ruby 5.2), should it auto-fix or flag? Ruby's subagents flagged. Worked because the orchestrator was in the loop.
4. **At what scroll do we promote `playground` from kata-variant to canonical step type?** Per [INTERACTIVITY-PATTERNS.md](INTERACTIVITY-PATTERNS.md) §"Authoring checklist", ≥20 instances across the catalog. Ruby ships 2. We need 2-3 more lessons across at least one other scroll to validate.

## Starting the next scroll — what you need beyond this doc

To pick this up cold and start, say, Python:

1. **Read the canonical docs in order:** [README.md](README.md) → [INTERACTIVITY-PATTERNS.md](INTERACTIVITY-PATTERNS.md) → [AUDIENCE.md](AUDIENCE.md) → [`../EXPERTS.md`](../EXPERTS.md) → this doc.
2. **Decide the lens** (stage 1). For Python it might be *"crash course for polyglots who already know what a dict is — go straight to context managers, asyncio mental model, and the EAFP/LBYL choice."*
3. **Pick the panel** (from [`../EXPERTS.md`](../EXPERTS.md)). For Python: Nadia (S7, language steward) + Elif (S5, curriculum) + Valentina (S2, content) + Maya (S11, interactive).
4. **Pick the audience matrix** (from [AUDIENCE.md](AUDIENCE.md)). For Python: A1 Mariana + A3 Diego (refresher) + A4 Felipe primary; A2 Esteban out-of-scope (he's already a Python mid-senior, not a learner here).
5. **Define the scroll's §2 gates** in `curricula/python/python.md`. Python's failure modes are different from Ruby's — tour-guide on dict iteration probably less likely, but Pythonic-vs-non-Pythonic confusion is real (EAFP vs LBYL, list comp vs `for` loop). Define the gates that catch *those* failure modes.
6. **Open the sprint** with the lens explicit.
7. **Run the flow** — borrow stages, skip stages, adapt as needed.

The most important thing: this doc is a starting point, not a contract.

## References

- [README.md](README.md) — Crash-course framework. **Canon.**
- [INTERACTIVITY-PATTERNS.md](INTERACTIVITY-PATTERNS.md) — Step types and authoring contracts. **Canon.**
- [AUDIENCE.md](AUDIENCE.md) — Target personas. **Canon.**
- [`../EXPERTS.md`](../EXPERTS.md) — Panel personas. **Canon.**
- [`curricula/ruby/ruby.md`](curricula/ruby/ruby.md) §2 — Concrete example of per-scroll authoring gates (paragraph test, predict placement, playground decision, hint discipline, footgun deferral, no-Minitest). Useful template for any new scroll's §2.
- [`../adr/022-crash-course-pivot.md`](../adr/022-crash-course-pivot.md) — Why we're authoring crash scrolls at all.
- Sprint 026 commits `c80e2df..9b90842` — the trail of this flow in action.
