# Sprint 027 — Python crash scroll (Rust queued)

> **Status:** Open 2026-06-08. Active focus: Python crash scroll end-to-end under the polyglot-first lens, applying the figures pattern from day 1. Rust queued behind Python — visible-but-deferred; we don't look at it until Python ships.
> **Direction:** [ADR 022 — crash-course pivot](../adr/022-crash-course-pivot.md) · [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) · [`docs/courses/INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md) §Embeddable visual figures
> **Predecessor:** [Sprint 026 — Ruby crash scroll end-to-end](archive/sprint-026-ruby-crash-course.md)

## Sprint thesis

S026 shipped Ruby end-to-end and validated the polyglot-first format. The AUTHORING.md retrospective documents the 15-stage flow. S027 applies that flow to Python with one structural addition: **figures land in Python from day 1, not as a backport**. The figure renderer components + the semantic-state CSS variables are W1 work, unblocking `:figure[...]` directives in every Python lesson from the start.

Honest framing on size: Python's surprise surface for the polyglot is lower than Ruby's (the polyglot already knows what a dict is). Estimated 8-12 hours scoped to ~22 steps / ~100 min. The audience contract (A1 Mariana JS Senior + A4 Felipe TS Modernizer primary; A3 Yui Java Senior secondary; A2 Esteban out-of-scope as Python mid-senior) is tighter than Ruby's. Less drift expected.

Rust is queued — **visible-but-deferred** — so the order from S026 (Python → Rust → TypeScript → Go) doesn't drift. **We do not start Rust until Python ships.** The scratch draft from S026's cross-language parallel run lives at `.kwik-e/tmp/curricula-drafts/rust/` and informs scope when we get there.

## Working method

Same flow as Ruby in S026, codified in [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md). For Python specifically:

1. **Scope block.** Confirm lens, panel (Nadia S7 + Elif S5 + Valentina S2 + Maya S11), audience matrix per [`AUDIENCE.md`](../courses/AUDIENCE.md), §2 gates (Python equivalents to Ruby's "paragraph test" and "hint discipline"). Promote the scratch drafts at `.kwik-e/tmp/curricula-drafts/python/` to canon at `docs/courses/curricula/python.md` + `docs/courses/curricula/python/python.md`.
2. **Authoring block.** Lesson drafts in `lesson-N.md` files (one per lesson). Self-review per lesson against §2 gates. Final voice audit as suite. Formal panel + audience review. Feedback loop. Apply changes. Seed via subagents.
3. **Smoke.** Real Piston Ruby smoke first (carry-forward from S026). Then Python lesson-by-lesson smoke as each lesson seeds — *not* all at once. S026's anti-pattern documented in AUTHORING.md §"What we'd do differently".

## Mandatory (sprint blockers if not done)

- **Real Piston Ruby smoke + bugfixes.** S026 closed with mock-adapter local smoke only. Boot dev with `FF_CODE_EXECUTION_ENABLED=true`, walk the Ruby scroll, fix anything Piston-real surfaces (timing under cascading test failures, edge cases in reference solutions against Ruby 3.0.1, the `__DOJO_RESULT__` marker round-trip). Single dev-day budget; if it balloons, Python authoring carries to W2.
- **Figure renderer components + state palette.** `apps/web/src/scrolls/figures/{BeforeAfter,TwoByTwo,Disambiguation,ArrayTrack,TabbedCard}.tsx` per the catalogue in [`INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md) §Embeddable visual figures. Plus the `--color-state-*` CSS variables in `apps/web/src/styles/main.css` per [`DESIGN.md`](../DESIGN.md) §Semantic state tokens. Unblocks figure embeddings in Python lessons from day 1.
- **Python crash scroll end-to-end.** Polyglot-first order, ~22 steps, ~100 min target. Reviewed through Nadia (S7) + Elif (S5) + Valentina (S2) + Maya (S11) lenses. Audience review through Mariana (A1) + Felipe (A4) primary, Yui (A3) secondary. Apply figure patterns where they earn their place — at minimum one `disambiguation` figure for a near-look-alike confusion (list vs tuple vs set, or EAFP vs LBYL, or `is` vs `==`).
- **Sprint admin discipline.** Sprint closes with current.md cleared, retro filled, archive moved, CHANGELOG entry, S028 open. Two commits (close + open) per the discipline reaffirmed in S026.

## Stretch (ship if Python closes cleanly)

- **Backport figures into Ruby seed.** Lesson 0 (`:figure[before-after]{id="npm-vs-bundle"}`), Lesson 1 (`:figure[before-after]{id="foreach-vs-each-block"}`), Lesson 2 (`:figure[disambiguation]{id="string-vs-symbol"}`), Lesson 3 (`:figure[two-by-two]{id="operators-as-messages"}`). Drafts already propose these in the `lesson-N.md` files; the work is updating seed `instruction` markdown. Backport, not new authoring.
- **Catalog UI grouping** (Languages / Topics) per [`README.md`](../courses/README.md) §4.5 — only if `/scrolls` starts feeling crowded with Ruby + Python live + `sql-deep-cuts`.
- **Rust scope block opens.** Only if Python is fully shipped, smoked, and the figures backport landed. Scratch draft + Björn's (S8) compiler-as-tutor framing. Estimated 120-min target (vs ~100 for the others) per Rust's surprise surface. If Rust starts this sprint, *only the scope block* — authoring carries to S028.

## Queued behind Python — do not start until Python ships

- **Rust scope block.** Per S026's order: Ruby → Python → Rust. The scratch draft at `.kwik-e/tmp/curricula-drafts/rust/` informs scope; Björn (S8) lens with compiler-as-tutor as the central pedagogical bet.

## Out of scope (deferred, not blocking)

- **TypeScript and Go scrolls.** Carry to S028+.
- **Algo-trace step type, /atlas surface, algorithms deep-dive.** Rejected for v1 in [`PROTOTYPES-101-REVIEW.md`](../../.kwik-e/local/scrolls/PROTOTYPES-101-REVIEW.md); revisit only when an algorithms scroll becomes a real commitment.
- **DESIGN.md §Motion reconcile** with `INTERACTIVITY-PATTERNS.md §Animation tech` (Sprint 026 GSAP+CSS reversal). Five-minute fix; do it when drift bites or as part of the Sumi-e migration sprint that will rewrite that section anyway.
- **Sensei calibration real run** (S023 carry). Stale; promote when a prompt change needs validation.
- **Staging smoke environment** (S022 carry). Same; review at S027 midpoint.
- **First friend invite dispatch** (S022 carry). Trigger may now be "Ruby + Python live"; review at S027 midpoint.

## Open decisions for the Python scope block

These need to be resolved before authoring starts. Defaults in **bold**; subject to panel review.

| Question | Default |
|---|---|
| Python lens | **"Protocol surface + EAFP — dunders, iterables, context managers, decorators."** Asyncio cut from crash, deferred to deep-dive. The scratch-draft subagent sharpened it from the original "context managers + asyncio mental model + EAFP/LBYL + type hints" by cutting asyncio. |
| Python angle (the Ruby-not-Rails equivalent) | **"Python the language, not Django/Flask/data-science."** Explicitly out of scope: web frameworks AND the pandas/numpy/PyTorch stack. |
| Test harness shape | **Manual `_t` / `_eq`** consistent with Ruby's pattern. Decorator-style harness (`@_t("name")`) was the scratch-draft initial proposal but was rejected because it exposes decorators *before* Lesson 5 teaches them. The cross-lang audit D2 endorses "manual default + Go-style carve-out when stdlib testing IS curriculum" — Python doesn't have that carve-out reason. |
| Step count target | **22 steps** (3 + 3 + 4 + 4 + 4 + 4), ~100 min. Three fewer than Ruby's 25 because Lesson 1 is calibration-only without kata in the draft proposal. |
| Lesson 5 challenge | **`@retry(times=N)`** decorator. Subagent flagged this vs `@cache_for(seconds=N)`; retry is simpler (no clock dependency, deterministic tests). |
| Number of playgrounds in Python | **0 or 1.** Subagent draft proposed 1-2; final decision at scope block based on fit. Below the playground promotion gate either way. |
| Figure adoption from day 1 | **At least 1 `disambiguation` figure.** Maximum 2 figures per `read` step per `INTERACTIVITY-PATTERNS.md`. Each one earns its place via the paragraph test. |

## Open questions (real, blocking specific decisions)

1. **Yui's Python column.** S026's canon-fix added a scripting-lane Python row for A3 Yui. Confirm the row earns its place after the Python scope block — does the Java-senior-learning-Python-for-scripting persona surface real things the primary personas miss? If not, demote her back to Go/Rust/TS only.
2. **Figure adoption discipline.** Each Python lesson's draft should propose figures *where they earn their place*. The temptation is to embed a figure per lesson because "we built the renderer, let's use it." Maya's veto from `INTERACTIVITY-PATTERNS.md §When NOT to interactivate` applies: a figure that doesn't change what the learner does is decoration. Per-figure paragraph-test discipline.
3. **Ruby smoke bug surface.** Real Piston smoke of Ruby (W1 mandatory) might surface kata or harness issues that don't show in mock. If bugfixes balloon beyond the single dev-day budget, Python authoring carries to W2 — flagged here so it's not a surprise when the clock ticks.

## Working order (hypothesis, not contract)

| Block | Work |
|---|---|
| W1 | Real Piston Ruby smoke + bugfixes. Figure renderer components + CSS state palette vars. Python scope block: promote scratch drafts to canon, panel review of the spec, outline-level user testing (Mariana + Felipe), apply user-test fixes, panel re-review. |
| W2 | Python authoring block: 6 lesson markdown drafts in `lesson-N.md` files, self-review per lesson against §2 gates, final voice audit as suite, formal panel + audience review, feedback loop, apply final changes. |
| W3 | Python seed (subagents for independent lessons), integration, lesson-by-lesson smoke through Piston. Backport figures into Ruby seed if time. |
| W4 | Rust scope block opens (only if Python is shipped and smoked clean). Sprint admin close. |

Real timing depends on what Ruby smoke surfaces and on how cleanly figures slot into Python's lesson drafts. The 22-step Python target is honest; the figures from day 1 are new tax we're paying voluntarily.

## Reading order if you're picking this up cold

1. [ADR 022](../adr/022-crash-course-pivot.md) — what the crash-course pivot is.
2. [`docs/courses/AUTHORING.md`](../courses/AUTHORING.md) — the 15-stage flow reference from S026's Ruby work. Reference, not contract.
3. [`docs/courses/AUDIENCE.md`](../courses/AUDIENCE.md) — the 4 personas and which scrolls each one applies to.
4. [`docs/courses/INTERACTIVITY-PATTERNS.md`](../courses/INTERACTIVITY-PATTERNS.md) §Embeddable visual figures — the 5 figures canonicalized in S026.
5. [`docs/courses/curricula/ruby.md`](../courses/curricula/ruby.md) + [`docs/courses/curricula/ruby/ruby.md`](../courses/curricula/ruby/ruby.md) — the Ruby precedent.
6. `.kwik-e/tmp/curricula-drafts/python/` — the parallel-subagent scratch drafts for Python (outer + inner). Lens candidate, lesson outline, §2 gates proposals. Workspace-local, not in repo.
7. [`docs/sprints/archive/sprint-026-ruby-crash-course.md`](archive/sprint-026-ruby-crash-course.md) §Retro — the carry-forwards list.
8. This file — what we said we'd do.

## Out of scope, parked

- Kumite feature itself (still only the `/kumite` placeholder).
- Per-track belt marks, rust indicator (PRD-031 v1.1).
- DB table renames (mapping at adapter layer per ADR 020 — stable).
- LLM telemetry table (backlog carry-forward).
- Aggressive sensei voice rewrite (calibration-gated, not in this sprint).

---

## Retro — closed 2026-06-11

### What shipped

**The sprint's mandatory core:**

- **Python crash scroll end-to-end** under the polyglot-first lens. 6 lessons / 23 steps (~105 min), figures from day 1 (5 embeds: `array-track` comp-vs-gen, `metric-pair` list-vs-gen memory, `disambiguation` EAFP-vs-LBYL, `before-after` try-finally-vs-with, `tabbed-card` decorator family). Authored W2, seeded W3 in 3 batches, capstone added at close. `isPublic: false` until real-Piston smoke.
- **Figure renderer components + semantic-state CSS variables** — the S026 carry-forward. Six components now live in `apps/web/src/scrolls/figures/` (the 5 canon ones + `metric-pair`, added this sprint), with the directive parser tested.
- **Ruby figures backport** (stretch) — all 4 proposed embeds landed in the seed, plus this sprint's additions took Ruby to 27 steps.

**The unplanned middle: a full scroll-hardening pass** (Adrian asked for a review of content/UX/UI mid-sprint; the review became a work program):

- **XSS closed in the markdown renderer** — regex pipeline interpolated into `dangerouslySetInnerHTML` with zero escaping. Latent (single author) but admin-scrolls existed; 3-line escape + unit tests.
- **Player UX fixes** — mobile sidebar was unclosable below `md` (280px on a 375px screen), scroll position persisted across steps, predict lacked arrow-key nav, solution fetch errors latched without retry.
- **ScrollPlayerPage god-component refactor** — 1,470 lines → 169-line orchestrator + `scrolls/player/` modules. The headline: a **step-type registry** (exhaustive `Record` over `StepDTO['type']`) — a new step type is a component + one registry entry, and the compiler refuses partial wiring. *Honest cost:* the registry dropped the old `else → editor` branch and crashed on the legacy `'kata'` DB value; caught in Adrian's smoke, fixed with a runtime fallback same day.
- **`read+inline` step type shipped end-to-end** — schema (`readInlineDataSchema` in shared), `<!-- interact:id -->` marker contract with visible degradation, reveal + micro-quiz renderers. First two uses live (Python L5.1a reveal, Ruby L3 micro-quiz). The canon's draft `figure` interaction kind was dropped — the `:figure` directive already resolves inside prose.
- **Canon extended from the 101-prototypes second pass** — `INTERACTIVITY-PATTERNS.md` gained the six acceleration principles (prediction-before-revelation, cost-as-number, invariants-over-time, dual representation, fail-by-design, agency-over-abstraction), the `metric-pair` figure, and the deferred device kit (`algo-trace` architecture recorded with adoption triggers so the next decision starts from the design).
- **Capstone + production-gesture rules** (README §5.3, §4.4; AUTHORING #5) — born from Adrian's smoke signal *"se me hace poco — ¿puedo hacer Ruby o Python básico al final?"*. Both scrolls now end with an integrative capstone (`roster` for Ruby, `parse_prices` for Python — the latter validated 5/5 against CPython 3.11), and Ruby got the Money kata: the first `class` the scroll makes the learner write, with `send(:+)` as the object-model payoff.
- **Spanish content fix** — 4 Python lesson titles seeded in Spanish (carried from the Spanish-language curricula drafts). Product content is English; fixed in seed.

### What did NOT ship (and why)

- **Real Piston smoke as a *completed* gate.** Adrian started it (it caught the Spanish titles and the kata regression — working as intended) but deferred the full pass until all five scrolls exist. Deliberate call, carries.
- **Ruby new-step solutions validated against real Piston** (Money, roster) — no Ruby runtime in the devcontainer; pending `validate-scroll-solutions` in a real environment.
- **Catalog UI grouping** (stretch) — untouched; trigger (crowded catalog) arrives with Rust + TS.
- **Rust scope block** (stretch) — untouched; promoted to S028 mandatory.
- **Render-test infra** (jsdom + @testing-library) — flagged twice this sprint as the best pending cost/benefit; still not done.

### What we learned

- **The first real smoke is a review multiplier.** One smoke session surfaced a content-language bug, a player-crashing regression, and the product-level gap that became the capstone rule. Smoke earlier, smoke per-batch — S026 already said it; S027 re-proved it.
- **Refactors that narrow dispatch need runtime fallbacks.** The DB speaks `'kata'`; the type union doesn't. An exhaustive registry is great until reality exceeds the union — degrade, don't crash.
- **"Did the learner prove it?" is a structural question, not a content question.** The capstone rule exists because both scrolls shipped without an answer. Now it's planned at outline stage, where it doubles as a lesson-set completeness test.
- **Seeds-as-TS is approaching its volume ceiling.** ~2,000 lines of prose per scroll inside template literals. With Rust + TS landing next sprint, evaluate moving prose to markdown-with-frontmatter parsed at seed time (flagged in the scroll review; decision deferred to when the pain is real).
- **The 101 prototypes were worth distilling, not porting.** The durable extraction was six principles and a deferred-kit design doc — not components. `metric-pair` was the only piece cheap and universal enough to build now, and it shipped same-day with real measured numbers.

### Carry-forwards to S028

| # | Item | Why it carries |
|---|---|---|
| 1 | **Rust crash scroll** | S027 stretch never opened. S028 mandatory under the new 2-scrolls-per-sprint cadence. |
| 2 | **TypeScript crash scroll** | Next in the S026 order. S028 mandatory (cadence decision: Adrian, 2026-06-11). |
| 3 | **THE smoke gate** — one full-set real-Piston smoke of all five scrolls + publish decisions (`isPublic` for everything). Absorbs every prior smoke carry: S026's "real Piston Ruby smoke", Python lesson-by-lesson smoke, and the Money/roster solution validation (run `validate-scroll-solutions` as part of the same session). | Adrian's explicit call (2026-06-11): one smoke pass against the complete catalog, Adrian-driven. Trigger: all five scrolls seeded (end of S028 if Go lands in S029, else S029). Not a per-sprint carry anymore — it has a trigger, not a deadline. |
| 4 | **Render-test infra** (jsdom + @testing-library) | Step components and 6 figures have zero render coverage; half-hour setup, repeatedly flagged. |
| 5 | **Curricula docs Spanish cleanup** (`ruby/ruby.md` ~200 lines, python lesson headers) | Repo artifacts are English; the seeds are clean but the specs aren't. Docs-only pass. |
| 6 | **Contrast audit of `--color-state-*` tokens** | DESIGN.md marks them "v1 draft pending designer calibration"; 6 figures now depend on them. |
| 7 | **Catalog UI grouping** (Languages / Topics) | Trigger arrives when Rust + TS make 5+ scrolls live. |
| 8 | **ROADMAP sprint-history table drift** (stale at S023) | Three closes missed it; reconcile in one pass. |
| 9 | **Stale S022/S023 carries** (sensei calibration, friend invites, DESIGN §Motion reconcile) | Same review-at-midpoint status as S027. Friend-invite trigger ("Ruby + Python live") is close. |

### Closed at this retro (no longer carried)

- **Real Piston Ruby smoke as a standalone task** (S026 carry #5, S027 W1 mandatory) — partially executed this sprint (it caught the Spanish titles and the kata-fallback regression, which was its job); the remainder is absorbed into the single full-set smoke gate above. Two sprints of dragging a per-scroll smoke task ends here.
- **Python lesson-by-lesson smoke as a standalone task** — same absorption, same gate.
- **Staging smoke environment** (S022 carry) — retired. Three sprints without a trigger; the full-set smoke runs against local-real Piston, and a staging environment re-enters the backlog only if/when the friend-invite dispatch makes remote smoke a real need. Kept in `backlog.md` lineage, not in carry tables.
