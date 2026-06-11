# TypeScript Scroll Track

> Maintainer persona: S9 Leo Barros (TypeScript steward) + S5 Dr. Elif Yıldız (curriculum architect) + S2 Valentina Cruz (content quality) + S11 Maya Lindqvist (interactive learning UX).
> Infrastructure adjacency: C3 Tomás Ríos (TS in monorepo/infra contexts — *not* the language pedagogy lens).
> Last researched: 2026-04-14 · Re-scoped 2026-06-06 under [ADR 022](../../adr/022-crash-course-pivot.md) · Polyglot-first draft 2026-06-07 (Sprint 026) · **Audience pivot + promoted to canon 2026-06-11** under Sprint 028 W1: primary reader is the JS developer adopting TypeScript (A4 Felipe), lens is "what TypeScript adds to the JavaScript you already write — benefits forward."

## 1. Learning Philosophy for TypeScript

TypeScript has a specific teaching pathology for its actual audience — the working JavaScript developer. They arrive treating TS as paperwork: they annotate every parameter and every local (`const total: number = 0`), hit a real modeling problem in week three, reach for `any` to make the squiggles go away, and conclude TypeScript is a verbose JavaScript that occasionally yells. Felipe — five years of JS, two of "TS-strict" with more `any` than he'd admit — is not confused about JavaScript; he's never been *sold the delta*. This scroll is about **what TypeScript adds to the JavaScript you already write**: inference over annotation, narrowing as control-flow analysis, structural shapes, unions and literal types as design vocabulary, and the compiler as a second reader during refactors. It is NOT a JS reteach (the reader writes JS for a living), NOT framework typings (React props, `ChangeEventHandler` — out of scope), and NOT advanced type-level programming (conditional/mapped types are named and deferred to a deep-dive, never drilled here).

The core mental model is **the type system as a second reader of the JavaScript you already write** — a static layer that runs alongside the program and disappears before it runs (types are erased), reads structure rather than names (two unrelated shapes that match are compatible), infers far more than the newcomer annotates (annotation-free is not untyped), and re-reads the entire codebase every time you change a union (adding a variant breaks every unhandled `switch` — that's the feature, not the error). Every benefit this scroll sells reduces to that frame. The polyglot-first order for a JS developer is *delta-priority*: lead with the surprises they hit on day one of real TypeScript. Day one, Felipe over-annotates — so **inference is Lesson 1**, before any other type syntax, because "the compiler already knows" is the single biggest behavior change available to him. Day two he types his first object shape and meets structural compatibility (Lesson 2). Day three every `if (typeof x === "string")` he's written for years turns out to be load-bearing (narrowing, Lesson 3). Week one he reaches for `any` at a JSON boundary and needs `unknown` instead (Lesson 4). Generics arrive last among the daily drivers (Lesson 5), only after the duplication that motivates `<T>` has been felt in his own katas.

"Types are erased at runtime" lands in Lesson 0 as a property of the system, because every other lesson depends on it: `as` and type guards and discriminated unions read correctly only as compile-time tools that vanish before execution. Lesson 0 also lands the 2026 toolchain fact most JS developers half-know: almost everything that "runs TypeScript" (`tsx`, `esbuild`, modern `node` with type stripping) **strips types without checking them** — the benefit Felipe is paying for only exists if `tsc --noEmit` (or his editor's equivalent) actually runs. A learner who internalises "erased; inferred; structural; narrowed by control flow" can read any TS file on Friday. A learner who memorises `interface` vs `type` trivia without that frame can read none of it.

Dead ends we explicitly avoid: **annotation-maximalism as implicit pedagogy** (a scroll whose examples annotate every local teaches Felipe to keep doing the thing the scroll exists to stop); **teaching `any` without naming its cost** (it propagates and silences — Lesson 4 makes the cost felt, not lectured); **the `interface` vs `type` flame war** (one rule, one exception, move on); **`enum` as a default** (literal unions first; `enum` named as legacy/interop with its runtime footprint shown); **`as` as the way to silence errors** (a cast is a promise; a broken promise is a runtime bug the compiler can no longer catch); **generics as a `<T, U, V, W>` tour** (Lesson 5 opens with duplication the learner just wrote); **framing structural typing against Java/C# nominal reflexes** (the S026 draft did this — wrong enemy: Felipe has no nominal-typing reflexes; for him structural typing is "the duck typing you already practice, now checked"); **teaching React/Node API typings or the tsconfig flag tour** (deep-dive territory, named only to be excluded); **type-system flexing** (any type that can't be motivated by a bug it prevents in the reader's day job is cut — see the inner spec §2.2 gate).

Before any lesson on the type system proper, **Lesson 0 orients the reader in what TypeScript actually is and how it executes** — the JS-superset truth, type erasure, the check-vs-strip toolchain split (`tsc --noEmit` checks; `tsx`/`esbuild`/modern `node` strip), and `tsconfig.json` as a file that exists without the flag tour. This is short (2 steps) because Felipe already operates a JS toolchain daily — he needs the one fact he's likely wrong about (running ≠ checking), not a build-tools tour.

A note on tone: the Dojo voice is direct and assumes the reader **writes JavaScript fluently** — closures, async/await, array methods, destructuring are never explained. Every `read` step passes the test: *if I delete this paragraph, does a fluent JS developer lose something TypeScript-specific? If no, the paragraph doesn't exist.* When Piston's sandbox forces a compromise (no DOM, no `npm install`, single-file execution), the lesson body says so explicitly and names the real-world equivalent.

## 2. Course Authoring Profile

> Course-level voice and authoring decisions for the TypeScript track. Per [`docs/courses/README.md`](../README.md) §8.1. The TypeScript scroll inherits these defaults; each lesson's spec deviations are declared in the spec's §2 Authoring Notes.

**Voice & angle.** Benefits forward: "what TypeScript adds to the JavaScript you already write." The unifying angle is "inference over annotation, narrowing, structural shapes, unions/literal types, and the compiler as a second reader during refactors — annotations are the contract you write at function boundaries; everything else the compiler reads for you." React/Vue/Angular are named only to be excluded. tsconfig flags are named only to be deferred. Advanced type-level programming is named only to be recognised. The audience is the JS developer with zero TS (or TS-with-`any` habits to unlearn) — never the absolute beginner, never the Java/Python polyglot needing JS explained. No "Welcome to TypeScript!" preambles, no apologising for the compiler, no softening when an `any` habit gets named.

**Step density & rhythm.** Framework default (~200-300 words per `read` step) for Lessons 0-2; **250-350 words** for Lessons 3-5 where the mechanism needs unpacking (control-flow analysis, the escape-hatch triad, generic inference). TypeScript's syntax IS JavaScript, so the prose budget goes to *semantics* — what the compiler concludes and why — not to syntax re-framing. Reads that restate what a JS developer sees on the page fail review.

**Interactivity menu.**

- **IN:** `read`, `kata` (≡ `exercise`), `challenge`, `predict`, `read+inline`, and the `playground` local-experiment variant (`kata` with `data.kind: "playground"`, inherited from Ruby — see [ruby/ruby.md §2.3](ruby/ruby.md)).
- **OUT (deliberate exclusion):** `trace`. TypeScript's runtime is JavaScript; runtime tracing belongs to the JS DOM scroll. A "type inference walk" trace (the compiler narrowing a value step-by-step) would need a custom renderer no other scroll uses — fails the ≥20-step amortization gate in [`INTERACTIVITY-PATTERNS.md`](../INTERACTIVITY-PATTERNS.md). Defer to the advanced-types deep-dive if it ever proves load-bearing.
- **High-ROI for TypeScript specifically:** `predict` (the type-system reveal — guess the inferred type, see the answer, update the model) and `read+inline` (reveals are type signatures, small enough to live inline). Lesson 1's inference read is the first `read+inline` candidate.

**Figures menu** *(added at promotion, 2026-06-11 — the S026 draft predates the figure catalog).* Per [`INTERACTIVITY-PATTERNS.md`](../INTERACTIVITY-PATTERNS.md) §Embeddable visual figures:

- **IN, committed:**
  - **`disambiguation`** — two committed landings. *Lesson 4: `unknown` vs `any`* (divergent attribute: **what the compiler lets you do before narrowing** — `any` permits everything and propagates; `unknown` permits nothing until proven). *Lesson 2: literal union vs `enum`* (divergent attribute: **runtime footprint** — the union erases to nothing; `enum` emits a JavaScript object). Per the Sprint 028 mandate at least one `disambiguation` ships; Lesson 4 is the primary commitment, Lesson 2 the second. *Interface-vs-type was considered and rejected as a figure: the scroll settles it in one sentence; a figure would re-dignify the flame war.*
  - **`before-after`** — *Lesson 1: annotation-maximalism vs inference-led TS.* Left pane: Felipe's habitual style, every local annotated. Right pane: signature-only annotations, inference doing the rest. This figure IS the lens, drawn.
- **IN, situational:** **`tabbed-card`** — only if Lesson 3's narrowing read needs the multi-lens framing (`typeof` / `in` / equality / tag-field as four tabs over the same union). Default: don't embed unless the read pulls toward it.
- **OUT:** `two-by-two` (no orthogonal-axes confusion in this scope — gradual-vs-strict × checked-vs-stripped was considered and isn't crisp enough), `array-track`, `sequence-play`, `grid-canvas`, `recursion-stack` (nothing in the crash scope iterates or recurses in a way these teach). Max 2 figures per read step, per canon.

**Pedagogical bets.**

1. **Prediction-before-explanation on the type-system reveals.** Three predicts target three wrong mental models a JS developer brings: "running TS = checking TS" (Lesson 0), "no annotation = no type" (Lesson 1), "the static type can't change inside a branch" (Lesson 3 — placed *before* the narrowing read: Felipe holds this folk model with commitment, so predict-first is the honest order). Lesson 2's structural-compatibility surprise lives in its playground — a fourth predict there was cut at panel review because its reveal overlapped the playground's. Each wrong-answer feedback addresses the specific model the option encodes (per the predict voice contract). *Failure mode without it:* Felipe memorises syntax rules and keeps writing `any` because the model never updated.
2. **Generics only after felt duplication.** Lesson 5 opens by reproducing monomorphic duplication from the learner's own Lessons 2-3 katas; `<T>` enters as "the parameter you would have written for the type." Constraints (`extends`, `keyof`) arrive with one concrete use case each. No `<T, U, V, W>` cascade.
3. **Footgun awareness, not footgun fear.** `as`, `any` propagation, `enum`, declaration merging, decorators, conditional/mapped types — each named once with its specific failure mode and a deep-dive pointer (§3.1). Never silently elided, never drilled.
4. **Sandbox-honesty markers.** Piston runs single-file `ts-node`-style execution: no DOM, no React, no `npm install`, fixed tsconfig. Named in Lesson 0 and wherever a kata's shape is sandbox-constrained, with the real-world next step stated.
5. **The compiler as refactor partner, demonstrated not asserted.** Lesson 3's challenge adds a variant to a discriminated union whose starter ships multiple pre-written consumers — adding the variant breaks three sites the learner didn't write, and **the compiler hands them the checklist of every site** that needs updating. This is the "second reader during refactors" benefit from the lens, made physical. The capstone re-performs the union's *definition and exhaustive narrowing* on a fresh domain — not the add-a-variant refactor itself.

**Maintainer experts.** S9 Leo Barros (language), S5 Elif Yıldız (curriculum), S2 Valentina Cruz (content quality), S11 Maya Lindqvist (predict / playground / read+inline reviews). C3 Tomás Ríos only if a lesson drifts into Node API typing, monorepo TS, or tsconfig depth — the resolution there is usually "cut; deep-dive scope." S12 Felix Park only if a lesson proposes a new animation runtime; default is none (shared GSAP runtime available per the scrolls motion contract, no TS-specific need identified).

## 3. Scroll Catalog

| Slug | Kind | Steps (target) | Time (target) | Status |
|---|---|---|---|---|
| `typescript` | Language scroll (crash course) | 20 | ~95 min | **Scope block complete 2026-06-11 (S028 W1)** — outer + inner spec promoted from the S026 scratch drafts under the JS-dev-first audience pivot; capstone + production-gesture audit applied from outline per the 2026-06-11 canon. W2 authoring pending; W3 seed replaces the legacy `typescript-fundamentals` scroll. |

That is the whole catalog for TypeScript in v1. Per [ADR 022](../../adr/022-crash-course-pivot.md), one language scroll per language is the anchored set.

**Legacy scroll: rebuild, not migrate.** The `typescript-fundamentals` scroll (Sprint 014 MVP, 3 lessons / ~9 steps, seeded from `apps/api/src/infrastructure/persistence/seed-scrolls.ts`) predates ADR 022 and the audience contract. Sprint 028 decision: **rebuild under polyglot-first, salvaging individual steps only where they survive the paragraph test** — Ruby's L3 migration (S026) is the precedent: re-tighten, don't transplant. The legacy row is hard-deleted at seed time via the existing `removeLegacyScrollBySlug` helper (precedent: the `ruby-fundamentals` cleanup). No redirect — Phase 0 has no real users to migrate. Details in §8 and the inner spec §7.

### 3.1 Future deep-dive candidates (not in scope for v1)

Listed so the crash scroll can name-and-defer without inventing on the spot. The old pre-pivot course track (this file's previous content; see git history) sketched several of these as full courses — they survive here as deep-dive candidates:

- **`typescript-advanced-types`** — conditional types, mapped types, `infer`, template literal types, key remapping, recursion limits. "Type challenges with motivation": every pattern earns its place by solving a problem felt in the crash scroll. Likely first deep-dive (highest pull-through from Lesson 5's closer).
- **`typescript-domain-modeling`** — Result/Either patterns ("don't throw; return"), discriminated-union state machines at depth, brand and phantom types (`UserId` vs `PostId` as branded strings), immutable updates typed. Salvages the old `typescript-functional-patterns` course's spine; *Domain Modeling Made Functional* is the reference.
- **`typescript-for-node-api`** — the boundary problem at depth (`unknown` in, typed `Result` out), typed environment parsing, `Promise<T>` rejection as `unknown`, a typed mini HTTP layer. Tomás's lens with Leo on type design.
- **`typescript-with-react`** — typed components, hooks, event handlers without Stack Overflow copy-paste, generic components, `satisfies` for component config. Gated on the iframe-sandbox infrastructure path (bundled React + in-browser TS compiler).
- **`typescript-build-and-config`** — the tsconfig flag tour, module resolution (`Node16`/`NodeNext`/`Bundler`), the ESM/CJS situation, `import type` discipline. Requires Piston project-mode (`tsc -p .`).
- **`typescript-type-challenges`** — Type Challenges-style decomposition method: recursive types, tuple manipulation, template-literal parsers. Niche; ship last.
- **`typescript-decorators-and-metadata`** — TC39 stage-3 vs legacy `experimentalDecorators`. Gated on standardisation settling.
- **`typescript-zod-as-type-design`** — schema-first design, `z.infer`, validation at the boundary. Gated on a Piston library-allowlist/bundling decision.

None committed. They exist so the crash scroll's closers point at something honest.

## 4. The TypeScript Scroll

**Slug:** `typescript`
**Kind:** Language scroll (crash course)
**Audience (Sprint 028 decision, 2026-06-11):** the developer who **already knows JavaScript and wants to learn TypeScript and its benefits**. JS fluency assumed (closures, async/await, array methods — never re-taught); zero TS assumed (or TS-with-`any` habits, which the scroll explicitly unlearns). **Primary:** A4 Felipe (JS-heavy → TS-strict modernizer — the scroll exists for people in his position). **Secondary:** A1 Mariana (TS senior — reviewer lens: she verifies the claimed benefits are the real ones, not course-ware folklore). *Note: the [`AUDIENCE.md`](../AUDIENCE.md) matrix already carries the matching post-S028 row (Felipe primary, Mariana out-of-scope-as-reviewer).*
**Learner time:** ~95 minutes real work (60-120 range).
**Spec file:** [`typescript/typescript.md`](typescript/typescript.md) — the executable authoring brief.

**Learning outcomes.** After this scroll, the learner can:

- State what TypeScript adds to their JavaScript and what it costs: types are erased at runtime; checking (`tsc --noEmit`) is a separate pass from running (`tsx`, `esbuild`, modern `node` all strip without checking); `tsconfig.json` exists and `strict` is the flag that matters first.
- Annotate function signatures and let inference do the rest: predict inferred types of un-annotated code, explain `const`-literal vs `let`-widened inference, and stop annotating locals out of habit.
- Define object shapes with optional fields and consume them safely; explain structural compatibility ("shape decides, not name") and excess-property checks on literals; apply the `type`-by-default rule with its one `interface` exception; reach for literal unions where they'd have reached for strings or `enum`.
- Write narrowing-driven code: `typeof`, `in`, equality, `Array.isArray`; model state as a discriminated union; close a `switch` exhaustively with `assertNever`; write a user-defined type guard (`x is Foo`).
- Use the compiler as a refactor partner: add a variant to a union and follow the compile errors to every site that needs updating.
- Choose between `any`, `unknown`, and `never` at a boundary; type a JSON boundary as `unknown` and narrow it with a guard; name `any`'s propagation cost and `as`'s broken-promise cost.
- Write a generic function with a constraint when duplication motivates it (`<T>`, `extends`, `keyof`, `T[K]`); predict inferred `T` at a call site; recognise when NOT to make a function generic.
- Recognise (not write) conditional types, mapped types, `infer`, and template literal types in real code, and know which deep-dive covers each.

**Lessons (polyglot-first order — the day-one deltas for a JS developer first).**

- **Lesson 0 — TypeScript in context.** What TS adds to JS, type erasure, the check-vs-strip toolchain split, `tsconfig.json` named without the flag tour. 2 steps: 1 `read` + 1 `predict`. No kata — orientation, not drill.
- **Lesson 1 — Inference: annotate less, the compiler already knows.** Inference over annotation — the lens's first benefit. `const` literal inference vs `let` widening, inference through chains, the rule "annotate the signature, infer the rest." Production gesture #1 (type a function signature) lands here. Ships the `before-after` figure.
- **Lesson 2 — Shapes: the type system is structural.** Object types, optional fields, structural compatibility, excess-property checks, `type` vs `interface` in one rule, literal unions over `enum`. Production gesture #2 (type an object shape with optional fields). Ships the first playground and the union-vs-enum `disambiguation`.
- **Lesson 3 — Narrowing: the compiler reads your control flow.** The narrowing toolbox, discriminated unions, `assertNever` exhaustiveness, user-defined type guards. Production gesture #3 (define a discriminated union + narrow it exhaustively). The challenge demonstrates the compiler-as-second-reader benefit by adding a variant.
- **Lesson 4 — `any`, `unknown`, and the boundary.** `any` propagates and silences; `unknown` is the boundary type; `never` is "this can't happen"; `as` named and bounded. Ships the second playground and the unknown-vs-any `disambiguation`.
- **Lesson 5 — Generics that earn their place — and the close.** Generics motivated by the learner's own duplication; `extends`, `keyof`, `T[K]`; advanced types named-and-deferred in the closer; **the scroll capstone** (a typed webhook processor integrating Lessons 2-5) as the final step.

The full step-by-step authoring lives in [`typescript/typescript.md`](typescript/typescript.md). The titles here are the index, not the spec.

**Polyglot-first reordering rationale.** The S026 draft led with structural typing, framed against nominal-typing reflexes from Java/Python. The Sprint 028 audience decision invalidates that framing: Felipe has no nominal reflexes to unlearn — he has *annotation-maximalism* and *`any`-reflex* to unlearn, and he's never been shown that inference carries most of the weight. So inference leads (Lesson 1), shapes and structural compatibility follow (Lesson 2, reframed as "your duck typing, now checked"), narrowing is the daily driver (Lesson 3), the escape hatches get their own lesson because they're where Felipe's habits live (Lesson 4), and generics close (Lesson 5) after the duplication is felt. The draft's standalone advanced-types lesson is gone — per Sprint 028, conditional/mapped types are name-and-defer material, compressed into Lesson 5's closer; the freed budget funds the capstone. Leo (S9) holds the constraint that every advanced pattern named in the closer ties to a problem the learner felt in Lessons 1-5.

**Production-gesture audit** (per [`README.md`](../README.md) §4.4, applied at outline stage). The 2-3 gestures a working TS developer performs daily, each written in a kata: **(1) type a function signature** — Lesson 1 kata; **(2) type an object shape with optional fields** — Lesson 2 kata; **(3) define a discriminated union and narrow it exhaustively** — Lesson 3 kata + challenge. All three re-performed in the capstone.

**Sandbox notes.** Piston TypeScript (existing allowlisted path at `/scrolls/execute` — Sprint 028 decision: keep it; iframe is `javascript-dom` only). Single-file execution: no DOM, no React, no `npm install`, no multi-file tsconfig builds. Manual `_t` / `_eq` harness **consistent with the Ruby and Python scrolls** (Sprint 028 decision) — the legacy scroll's `test()`/`expect()` harness retires with it. Type-only assertions use a tiny `Equal<A, B>` helper; `@ts-expect-error` directives assert that a line should fail to compile. Compile errors must surface as test failures — adapter behavior verified before W3 seeding (inner spec §7). Deterministic only; STDIN never exercised.

**Reference material for this scroll specifically.**

- *Effective TypeScript*, 2nd ed. (Dan Vanderkam, O'Reilly 2024) — the spine for Lessons 1-5; each "item" is essentially a lesson outline.
- *Learning TypeScript* (Josh Goldberg, O'Reilly 2022) — the side-reading recommendation; maps nearly 1:1 to Lessons 1-4.
- *Programming TypeScript* (Boris Cherny, O'Reilly 2019) — the "type system as a parallel program" framing for Lesson 0.
- Total TypeScript (Matt Pocock) — *Pro Essentials* free modules; Felipe already follows Pocock, which makes the depth-pointer credible.
- TypeScript Handbook v2 — Everyday Types, Narrowing, Generics, Objects chapters, cited per lesson in the spec.

## 5. Cross-lesson exercise patterns

Repeatable shapes suited to Piston's stateless, single-file sandbox:

- **Pure functions with inference-asserting tests.** Runtime behavior via `_t`/`_eq`; inferred types via `Equal<A, B>` lines. Default for Lessons 1-2 and 5.
- **Discriminated-union state machines.** Tag field + `switch` + `assertNever`; adding a variant breaks the compile — the compiler is the test. Core to Lesson 3 and the capstone.
- **Boundary guards.** `unknown` in, typed value or error out, via a user-defined type guard. Lesson 4's dominant shape and the capstone's entry point.
- **Generic-with-constraint exercises.** Monomorphic duplication first, `<T>` second, `extends` only when required, `Equal` proofs at multiple call sites. Lesson 5.
- **Predict-then-implement pairs.** A predict's snippet becomes the next kata's starter or fixture. Lessons 1-3.
- **`@ts-expect-error` assertions.** The directive is the assertion: if the next line compiles, `tsc` flags the directive itself. Lessons 1-5.
- **`Equal<A, B>` type-only assertions.** `type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false` in the starter prelude; the compile pass is the evaluator.

**Piston constraint reminder:** single file, no `npm install`, no DOM, no network, no Jest/Vitest/`node:test`. Test harness is the manual `_t` / `_eq` pattern defined in [`typescript/typescript.md`](typescript/typescript.md) §5, mirroring Ruby's and Python's harness shape.

## 6. Known pedagogical pitfalls

Pitfalls the TypeScript scroll specifically defends against:

- **Re-teaching JavaScript.** The reader writes JS for a living. A read step that explains closures, `map`, or async/await fails the Felipe test (inner spec §2.1) and is cut. *This is the TS mirror of Ruby-not-Rails: the single biggest disservice would be teaching JS with annotations and calling it TypeScript.*
- **Annotation-maximalism by example.** Course code that annotates every local teaches the habit the scroll exists to break. *Every example in Lessons 1-5 annotates signatures only; Lesson 1's `before-after` figure makes the rule visible.*
- **Teaching `any` without naming the cost.** *Named first in Lesson 0 (erasure read), cost exercised in Lesson 4 (an `any` silences a downstream bug), paired immediately with `unknown`. Order matters: `any`'s sin first, `unknown` as the polite answer second — a learner who meets `unknown` cold reads it as "`any` with paperwork."*
- **Generics as a tour.** *Lesson 5 opens with the learner's own duplication; `<T>` enters motivated; no multi-parameter cascade in this scroll.*
- **The `interface` vs `type` flame war.** *Lesson 2 declares the default (`type`) and the one-line exception (`interface` for declaration merging / extending external module types), and never revisits it. No figure — a figure would re-dignify the debate.*
- **`enum` as the obvious choice.** Runtime cost, odd numeric semantics, wrong default for a JS developer. *Lesson 2 teaches literal unions as the default and shows what `enum` emits; the `disambiguation` figure carries the contrast.*
- **`as` as squiggle-silencer.** *Lesson 4 frames `as` as a promise to the compiler with one worked broken-promise-crashes example. No kata exercises `as`.*
- **Conflating TypeScript with React typing.** Props, hooks inference, `forwardRef` are React surface. *Never taught here; Lesson 5's closer points at the `typescript-with-react` deep-dive.*
- **Teaching tsconfig flags as language syntax.** *Lesson 0 names the file and `strict`; the flag tour is deferred to `typescript-build-and-config`.*
- **Teaching decorators before they're settled.** Legacy vs TC39 stage-3 are not source-compatible. *Named in Lesson 5's closer only.*
- **Type-system flexing.** A clever type that doesn't prevent a bug in the reader's day job is showing off. *The inner spec §2.2 gate cuts it at draft and at review.*

## 7. External references

### Books

- *Effective TypeScript: 83 Specific Ways to Improve Your TypeScript*, 2nd ed. — Dan Vanderkam, O'Reilly 2024. The single best source for this audience; each item is a lesson-rationale unit.
- *Learning TypeScript* — Josh Goldberg, O'Reilly 2022. Best modern intro; the side-reading recommendation. Companion exercises: `josh-goldberg/learning-typescript` on GitHub.
- *Programming TypeScript* — Boris Cherny, O'Reilly 2019. Older; the "10,000 foot view" mental-model framing remains the cleanest in print. Lesson 0 reference.
- *Domain Modeling Made Functional* — Scott Wlaschin, Pragmatic 2018. F#, but the discriminated-union modeling transfers line-by-line. Lesson 3 + the `typescript-domain-modeling` deep-dive reference.
- *TypeScript in 50 Lessons* — Stefan Baumgartner, Smashing 2020. Counterpoint for short-lesson sizing.
- *TypeScript Cookbook* — Stefan Baumgartner, O'Reilly 2024. Recipe reference for the advanced-types deep-dive.

### Online platforms

- **Total TypeScript** (Matt Pocock) — `totaltypescript.com`. *Pro Essentials* (free intro), *Type Transformations* (deep-dive reference). The single best paid resource on the modern canon; also the influencer the primary persona already follows.
- **Type-Level TypeScript** (Gabriel Vergnaud) — `type-level-typescript.com`. The rigorous conditional/recursive-types treatment; deep-dive reference only.
- **Frontend Masters** — Mike North's *TypeScript Fundamentals v3* / *Intermediate* / *Production-Grade TypeScript*; the video-course alternative.
- **Execute Program** — *TypeScript Basics* / *TypeScript Concepts*. Spaced-repetition; "after-class drill" recommendation, not curriculum.
- **Exercism TypeScript track** — pure-function drill recommendation after the scroll.
- **Type Challenges** (`type-challenges/type-challenges`) — deep-dive inspiration only; named in Lesson 5's closer so the pointer is credible. Adapt with credit, never copy.
- **Egghead** — Marius Schulz's conditional-types collections; deep-dive reference.

### Official documentation

- TypeScript Handbook v2 — <https://www.typescriptlang.org/docs/handbook/intro.html>; chapters cited per lesson in the spec (Everyday Types, Narrowing, Generics, Objects).
- TypeScript Release Notes — <https://www.typescriptlang.org/docs/handbook/release-notes/>. Key versions: 4.1 (template literal types), 4.4 (`unknown` in catch), 4.9 (`satisfies`), 5.0 (`const` type parameters, `Bundler` resolution).
- TSConfig Reference — <https://www.typescriptlang.org/tsconfig> (deferred; named in Lesson 0).
- Node.js type-stripping docs — <https://nodejs.org/api/typescript.html> (Lesson 0's check-vs-strip honesty).

### Community learning resources

- Matt Pocock's blog (`mattpocock.com`) and YouTube — short-format reinforcement for nearly every topic here.
- *TypeScript Evolution* (Marius Schulz, `mariusschulz.com`) — release-by-release narrative; useful when a step depends on version behavior.
- `typescript-cheatsheets` org on GitHub — quick-lookup; React sheet deferred with the React deep-dive.
- Sandi Metz's "Schemas of Trust" talks — not TS-specific; the "validate once at the edge, trust the type inside" intuition maps directly onto Lesson 4 and the capstone.

## 8. Implementation order

There is one TypeScript scroll to ship. Order applies to the lessons within it, in the Sprint 028 scope:

1. **Lesson 0 — TypeScript in context.** Orients; lands erasure + check-vs-strip. Status: outlined, target W2.
2. **Lesson 1 — Inference.** Establishes the scroll-level kata shape (`_t`/`_eq` harness, `@ts-expect-error` discipline) and the lens's first benefit. Ships the `before-after` figure. Status: outlined, target W2.
3. **Lesson 2 — Shapes.** Structural model + first playground + union-vs-enum `disambiguation`. Status: outlined, target W2.
4. **Lesson 3 — Narrowing.** Daily-driver lesson; discriminated unions; the compiler-as-second-reader challenge. Status: outlined, target W2.
5. **Lesson 4 — `any`, `unknown`, and the boundary.** Second playground + unknown-vs-any `disambiguation`. Status: outlined, target W2.
6. **Lesson 5 — Generics + close + capstone.** Closes with the named-and-deferred list and the scroll capstone (first TS scroll step authored against the 2026-06-11 capstone canon). Status: outlined, target W2.

**Legacy replacement discipline (Sprint 028 decision: REBUILD).** The legacy `typescript-fundamentals` scroll (Sprint 014 MVP, seeded pre-pivot from `apps/api/src/infrastructure/persistence/seed-scrolls.ts`) is **not migrated**. It predates ADR 022, the audience contract, and the polyglot-first lens; its read steps carry the "JS with annotations" frame this scroll exists to replace. The decision is rebuild under polyglot-first, **salvaging individual steps only where they survive the paragraph test** — the Ruby L3 migration (S026) is the precedent: re-tighten, don't transplant. Salvage candidates (the MVP's katas: `memoize`, `palindrome`, `fizzbuzz`, etc.) are evaluated per-kata at W2 authoring; the expectation is that most fail the new lens (inner spec §7). At W3 seed time, the new `typescript` scroll lands in its own seed file (`seed-scrolls-typescript.ts`, following the Ruby/Python precedent) and the legacy row is hard-deleted via `removeLegacyScrollBySlug('typescript-fundamentals')` — the same helper that retired `ruby-fundamentals`. The cleanup runs before the new rows insert so the `slug` unique constraint can't reject the seed.

**Figures registration:** the three committed figures register in `apps/web/src/scrolls/figures/data/typescript-figures.ts` at W2, following `python-figures.ts`.

**Playground frontend reuse:** the `data.kind === "playground"` branch shipped with Ruby and was reused by Python; TypeScript's two playgrounds (Lessons 2 and 4) reuse the same contract. No frontend work expected.

After the scroll ships, deep-dive prioritisation is a separate per-sprint decision; the likely first is `typescript-advanced-types` (highest pull-through from Lesson 5's closer), with `typescript-domain-modeling` second (highest Felipe-relevance).
