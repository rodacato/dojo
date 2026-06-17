# Scroll Interactivity Patterns

> **Status:** Canonical · **Last reviewed:** 2026-06-11
>
> Catalog of step types and the interaction patterns they ship with. This is the **how the screen behaves** side of scroll design. The **what the curriculum teaches** side lives in [`README.md`](README.md) (the design framework) and [`curricula/`](curricula/) (per-language plans).
>
> Maintainer personas: S11 Maya Lindqvist (interactive learning UX) + S12 Felix Park (animation engineering) + S5 Elif Yıldız (curriculum architect) + S2 Valentina Cruz (content design).

---

## Why this document exists

The design framework in [`README.md`](README.md) was written when the only step types were `explanation`, `exercise`, and `challenge` — a model inherited from Code School / Codecademy / Exercism. That model works, but it stops at "read text, then run code". It does not capture *active cognitive engagement during reading* — the moment when a Brilliant learner predicts an output before reading the answer, or watches an animation trace through state.

Sprint 023 introduced ubiquitous-language renames (`course → scroll`, `exercise → kata`, etc.) and surfaced a separate question: **what new step types should the scroll player support, and how do we judge whether each one is worth its implementation cost?**

This document answers that question. It is the contract for adding interactive step types to scrolls without corrupting the brand (no encouragement-fluff, no celebrations, no Brilliant-style mascot pedagogy).

---

## Catalog of step types

Eight step types in two tiers. Tier 1 is shipped and stable. Tier 2 is proposed and under design — each has a sprint-level decision attached.

### Tier 1 — shipped today

These types are part of the live schema. The catalog and authoring contract for them is documented in [`README.md`](README.md) §5.

| `step.type` | Pedagogical job | Interaction shape today |
|---|---|---|
| **`read`** (`explanation`) | Introduce a concept with a worked example | Static markdown. Code blocks may run inline; otherwise prose only. |
| **`code`** | Practice writing the concept just introduced | CodeMirror editor + Piston (or iframe) Run. Tests fail with specific messages. |
| **`exercise`** | The dominant exercise format — one behavior per step | Same as `code`; the type tag distinguishes pedagogical role |
| **`challenge`** | Stretch goal at the end of a lesson | Same surface as `exercise` with no hints by default |

#### Broken→fix katas (a usage pattern, not a new type)

A `code`/`exercise`/`kata` step can ship `starterCode` that is **plausible-but-wrong** instead of a blank scaffold — the learner debugs working-looking code rather than writing from a clean slate (the Rustlings shape). This needs no new step type or schema: it is `starterCode` + a `testCode` whose assertions fail on the planted bug. Precedent: the `debugging` category in `apps/api/.../katas/debugging.ts` (broken starter + descriptive assert messages + sensei `variations` that judge root-cause reasoning).

The bar — both must hold, or keep the kata write-from-scratch:
1. **The bug embodies the misconception the kata targets** (e.g. a polyglot dispatching on `x.class`, or `||` swallowing a present-`nil`).
2. **Fixing it teaches the intended idiom.** If the natural fix leads *away* from the idiom (correcting an off-by-one in a hand-rolled loop instead of reaching for the stdlib method), a blank slate teaches better. A broken→fix that fights the lesson is worse than no conversion.

Do not convert a whole scroll to broken→fix — the format mix (predict / write-from-scratch / broken→fix / playground / challenge) is a feature. Rustlings is monotone because it is all fill-the-blank; don't copy that.

#### Progressive hint reveal

Kata steps may carry `hints: string[]` (tier-ordered) instead of a single `hint`. The player tracks an **ephemeral, client-only** failure count and reveals tiers progressively: tier 1 auto-opens on the first failed run, tier 2 on the second. The failure count is not persisted and the reference `solution` stays gated post-pass — escalating hints reduce frustration without surrendering the answer (the brand rule: no feature softens the evaluation). `hints` falls back to `[hint]` for steps with only the legacy single hint. Tier-discipline lives in each curriculum's hint section (e.g. `curricula/ruby/ruby.md` §2.4): tier 1 never names the solving identifier; tier 2 may name it but not write the full expression.

### Tier 2 — proposed (Sprint 023+ decision)

These types are pedagogical bets. Each must justify its authoring cost and its implementation cost before it ships. Two-week panel review with Elif (S5) + Valentina (S2) + Maya (S11) is the contract.

| `step.type` | Pedagogical job | What earns its existence | Status |
|---|---|---|---|
| **`predict`** | Activate the learner's hypothesis before reading the answer | The reveal is the moment of learning. The wrong-answer feedback addresses the *specific* wrong answer's mental model. | **Shipped** (Sprint 025, CSS state machine) |
| **`trace`** | Make runtime visible. Step through execution and watch state. | Only meaningful for languages where execution is observable. Skip for TypeScript pure (defer to type-inference walk in v2). | Approved — v1 for JS DOM, SQL, Python |
| **`read+inline`** | A `read` step with embedded mini-interactions to break the prose wall | Cognitive load: the developer cannot skim because they have to decide something every 150-200 words | **Shipped** (2026-06-11 — schema + player renderer; no seeded content yet) |
| **`spot-the-bug`** | Identify the buggy line in a snippet | Predict covers ~60% of the overlap. Defer until v1 measures real engagement signal. | Deferred — v2 reconsideration |
| **`build`** (drag tokens) | Construct a valid expression by ordering tokens | Tests recognition, not production. The learner who drags may not type from scratch (Elif). | Rejected — v2 only if signal forces it |
| **`match`** (concept ↔ definition) | Pair related items | Association is shallow for code concepts. Drag-with-lines is fragile on mobile (Soren). | Rejected — v2 only if signal forces it |

The pedagogical reasoning for the rejections lives in the panel review in [.kwik-e/tmp/scroll-redesign/](../../.kwik-e/tmp/scroll-redesign/) (workspace-local), and a short summary is in the per-scroll designs.

---

## When to use each step type

The table that authors actually consult while planning a lesson.

| If you want to… | Use | Don't use |
|---|---|---|
| Introduce a new concept with a worked example | `read` (and split if >400 words) | `predict` — the learner has no model yet, prediction is guessing |
| Test the learner's hypothesis before showing the answer | `predict` | `exercise` — too high-cost; predict is faster and more focused |
| Make a stepwise execution visible | `trace` | A long `read` with prose narrating the steps |
| Break a long prose passage | `read+inline` (with embedded tap-to-reveal or 2-option quizzes) | Keep prose long. ~400 words is the hard ceiling per `README.md` §5.1 |
| Have the learner write code that produces a specific output | `code` / `exercise` | `predict` — predict is hypothesis; exercise is production |
| Stretch the learner at the end of a lesson | `challenge` | Multiple consecutive challenges — that's a problem set, not a course |
| Prove the scroll's promise at the very end | the capstone `challenge` — one per scroll, integrates ≥3 lessons ([`README.md`](README.md) §5.3) | A recap quiz or summary read — recognition isn't demonstration |
| Make abstract concepts feel concrete | `trace` (if runtime) OR `read+inline` (if conceptual) | Decorative animation that doesn't change the learner's actions |

### When NOT to interactivate at all

Maya's veto is reliable. An interactive step that fails any of these tests should be a plain `read` or `exercise`:

1. **The interaction doesn't change what the learner does.** Tapping "Next" through 5 slides is not interactivity. It is paginated reading.
2. **The interaction has only one outcome.** A "drag this to the right place" with one slot doesn't teach. It performs.
3. **The interaction can be skimmed.** If the learner can solve it without thinking, the cognitive engagement was zero.
4. **The reveal teaches nothing the prose wouldn't.** If the explanation after the interaction is what you would have written anyway, drop the interaction.
5. **The authoring cost exceeds the pedagogical gain.** A trace step that takes 45 minutes to pre-record for a 30-second learner moment is overpriced.

The last rule is the harshest. Valentina (S2) enforces it: *"If you wouldn't author 20 of these for one scroll, you're not designing a step type — you're designing a stunt."*

---

## Step type contract — what every interactive step ships with

A step type is not just a renderer. It is a contract across four surfaces:

1. **Schema** — the data fields the step carries. Each Tier 2 type is a discriminated union variant on `step.type`.
2. **Authoring** — the YAML / DB shape the author fills. What's required, what's optional, what fails the validate gate.
3. **Renderer** — the React component in `ScrollPlayerPage` that displays the step. Owns the local state for "answered" / "revealed" / "stepped to N of M".
4. **Voice** — the on-brand patterns for prompts, reveals, and feedback. The sensei never says "Great try!" inside any step type.

A step type that lacks any of these four is incomplete. Authors cannot ship steps for an incomplete type.

### Per-type contracts

#### `predict`

**Schema:**
- `question: string` — one sentence, ends in `?`
- `snippet: string` — the code under question (always visible)
- `options: Array<{ id: string; text: string }>` — 3-4 entries
- `correct: string` — id of correct option
- `feedback: Record<string, string>` — keyed by option id; the sensei's specific feedback for picking that option (right or wrong)

**Authoring:**
- The `feedback` map MUST include an entry for every option, including the correct one. The right-answer feedback explains *why* the right answer is right; the wrong-answer feedback addresses the specific mental model that produces that wrong answer.
- Generic feedback ("The right answer is C because…") fails review. Each wrong-answer feedback names what the learner was probably thinking.

**Renderer:**
- Snippet always visible during question AND reveal — never collapsed.
- Selected wrong option: `border-color: var(--color-danger)`. Selected right option: `border-color: var(--color-success)`.
- Reveal expands in place, not as a modal or new screen.
- Animation: Rive state machine with three states — `unanswered → reviewing → revealed`. Author the state machine in the Rive editor; React triggers state transitions via `useStateMachineInput`. See §[Animation tech](#animation-tech-recommendation).

**Voice:**
- Right-answer feedback: *"correct. and you noticed `B` returns the prototype property — that's the trap most readers fall into."*
- Wrong-answer feedback: *"you picked `B`. that returns the prototype property, not the instance. `C` is what you actually evaluate at runtime — here's why."*
- Off-brand: any feedback that doesn't reference the *specific* option the user picked.

#### `trace`

**Schema:**
- `code: string` — the snippet
- `steps: Array<{ lineIndex: number; state: Record<string, unknown>; hint?: string }>` — pre-recorded execution states
- `language: string` — for syntax highlighting and renderer routing (e.g. SQL uses a query-plan walk variant; see [`curricula/`](curricula/) per language)

**Authoring:**
- Each step records the next state as a JSON object: variables, call stack, DOM tree, or query plan node depending on the language.
- The author pre-records by hand for v1. LLM-assisted state generation is a v2 question.
- Maximum 12 steps per trace. If a trace needs more, split the code being traced.
- `hint` is contextual — emerges only at known gotcha steps (mutable default, late binding, race condition). Most steps have no hint.

**Renderer:**
- The developer controls advancement. No autoplay. No "skip to end".
- Layout: split — code on one side (with current line highlighted), state panel on the other. The state panel's shape varies by language; see [`curricula/`](curricula/) per language for guidance.
- Animation: a CSS variable update + transition for the common case (line highlight + state panel updates). Reach for Rive only when the step needs choreographed visual state — DOM trace specifically, where a dot moves along the event-propagation path with capture/target/bubbling phase states.

**Voice:**
- Sensei voice is minimal in trace — only appears as the `hint` field at gotcha steps.
- Hints are specific: *"notice `event.target` stays the original `<button>` even as `currentTarget` walks up — this is what makes event delegation work."*
- Off-brand: a sensei voice narrating every step ("now we move to line 3…"). The developer narrates by stepping.

#### `read+inline` (read with mini-interactions)

**Schema:** `step.type === 'read+inline'`, with `step.data = { interactions: Interaction[] }` where each `Interaction` is one of two shapes (Zod: `readInlineDataSchema` in `@dojo/shared`):

```ts
type Interaction =
  | { kind: 'reveal'; after: string; prompt: string; answer: string }
  | { kind: 'micro-quiz'; after: string; question: string; options: [string, string]; correct: 0 | 1; feedback: [string, string] }
```

`after` names a marker in the prose: the instruction markdown contains `<!-- interact:<after> -->` where the interaction should render. A marker with no matching interaction renders as plain prose; an interaction whose marker never appears renders at the end of the step — a typo degrades visibly instead of silently. Figures need no interaction kind: the `:figure[...]` markdown directive resolves inside the prose segments as it does in plain `read` steps.

**Authoring:**
- Maximum 4 interactions per `read+inline` step.
- If a prose block between two interactions exceeds 200 words, split the step.
- Reveals are for "before you read on, what do you think?". Micro-quizzes are for "did you catch this point?" — they go after the relevant prose, not before.

**Renderer:**
- Inline expansion of reveals (tap to expand). State machine: `collapsed → expanded`.
- Micro-quizzes: 2 options as buttons. State machine: `unanswered → answered`. Wrong feedback follows the predict voice contract.
- Animation: lightweight — CSS transitions sufficient for collapse/expand. No Rive needed.

**Voice:**
- Mini-quiz wrong feedback: same as predict — specific to the wrong answer.
- Reveal answers should be self-contained — the prose around them doesn't have to repeat what the reveal said.

---

## Embeddable visual figures

> A figure is a *visual atom* — a layout convention or small interactive component that embeds **inside** a `read` or `read+inline` step. Figures are not step types. They do not own the screen, they break up prose. The container (the step) supplies the pedagogical purpose; the figure supplies the visual relief.

This catalog exists because a Sprint 026 review of external interactive-learning prototypes surfaced a class of visual elements — before/after panes, look-alike disambiguation strips, 2×2 confusion grids, iteration tracks — that are *valuable individually* but *do not earn their own step type*. They land as figures.

### Why this section exists

A scroll authored from canon today has one tool to break a prose wall: split the `read` step and insert an `exercise`. That works when the next concept can be exercised. It does not work when the next concept is *clarifying a misconception* or *contrasting two near-look-alikes* — those moments want a visual, not a kata. The catalog below names the visuals authors can reach for without inventing a new step type each time.

### Figure catalog

Five figures are canon. Each one passes the Maya test (interaction-teaches-or-distracts) **as a layout**, not as an animation — the pedagogy lives in the *contrast* or *correspondence* the figure makes visible. Three are universal (Tier S — embed wherever they help). Two are concept-bound (Tier A — embed when the concept fits).

#### Tier S — universal (embed wherever the prose needs a break)

| Figure | Markdown directive | Pedagogical job |
|---|---|---|
| **`before-after`** | `:figure[before-after]{id:"slug"}` | Two code panes side-by-side: left = the smell / verbose / wrong-feeling version, right = the idiomatic / fixed version. Per-line annotations (`✕` on the culprit, `✓` on the fix). Pedagogy lives in the *contrast*. |
| **`two-by-two`** | `:figure[two-by-two]{id:"slug"}` | A 2×2 grid that surfaces an orthogonal-axes confusion (e.g. *Monorepo × Microservices*: runtime style and code organisation are independent). One axis label per row, one per column; one statement per cell. The cell that names the confusion is highlighted. |
| **`disambiguation`** | `:figure[disambiguation]{id:"slug"}` | Two (or three) near-look-alikes presented in identical skeletons. Color-token `--color-state-active` (amber) highlights only the divergent attribute. The reader's eye is forced to the difference. Example: *Strategy vs State*, *String vs Symbol*, *each vs map vs inject*. |

#### Tier A — concept-bound (embed only when the concept fits)

| Figure | Markdown directive | Pedagogical job |
|---|---|---|
| **`array-track`** | `:figure[array-track]{id:"slug" data:"yaml"}` | A horizontal track of N cells representing a sequence (array, hash entries, iteration steps). Each cell carries a state token from the semantic-state palette (`neutral / cand / active / out / done`). Used for any "iterate over a collection" concept; especially powerful when comparing the same input under *different* methods (`each` vs `map` vs `select`). |
| **`tabbed-card`** | `:figure[tabbed-card]{id:"slug"}` | A single concept presented through 2-4 tabs that switch lenses without changing the artifact (e.g. *Estructura* / *Antes→Después* / *En acción*). Tab switch is the interaction; no animation library needed. Best when a concept has *one identity* but *multiple useful views*. |
| **`metric-pair`** | `:figure[metric-pair]{id:"slug"}` | The same measured cost under 2-3 conditions, side by side (*without memo: 177 calls / with memo: 13*; *list comp: O(n) memory / generator: O(1)*). Pedagogy lives in the **magnitude gap** — the number replaces the adjective. Embed when prose is about to say "much faster" or "way fewer allocations": show the count instead. |

#### Deliberately not in v1 (raised, rejected or deferred with a trigger)

- **`sequence-play`** (dot animating along a sequence diagram). Approved-on-paper for `algo-trace` (see §[Embeddable figures and `algo-trace`](#embeddable-figures-and-algo-trace) below), out of scope as a standalone figure until that step type ships.
- **`grid-canvas`** (BFS/DFS/A* maze). Joya pedagogical for algorithms scrolls; meaningless for language scrolls. Defer to the future algorithms deep-dive.
- **`recursion-stack`** (visible call frames). Same — defer.
- **`filter-chips`** (recovery-by-context with highlighted matches). Only earns embedding when content is reference-shaped (a catalog) — language scrolls are sequence-shaped. Defer to any future `/atlas` surface.
- **`tradeoff-bars`** (2-3 options compared over fixed, named axes as paired horizontal bars — never radar charts, which distort perception). Strong for decision-shaped content; language crash scrolls haven't shipped a genuine multi-axis decision yet. **Trigger:** the first architecture/design deep-dive scroll, or the first language lesson that compares tools across ≥3 named axes. Axis values are curated opinions — each bar needs a one-line "how we scored this" footnote.

### Schema (per figure)

Figures embed via a markdown directive (`:figure[name]{attrs}`) in the markdown body of a `read` step or via the `interactions` array of a `read+inline` step. Each figure type has its own data shape:

```ts
type Figure =
  | { type: 'before-after'; id: string; language: string;
      left:  { title: string; code: string; annotations?: Array<{ line: number; mark: '✕' | '✓'; text?: string }> };
      right: { title: string; code: string; annotations?: Array<{ line: number; mark: '✕' | '✓'; text?: string }> };
      caption?: string }
  | { type: 'two-by-two'; id: string;
      rowAxis: { label: string; values: [string, string] };
      colAxis: { label: string; values: [string, string] };
      cells: [[Cell, Cell], [Cell, Cell]];   // [row][col]
      highlightCell?: [0 | 1, 0 | 1];          // the cell that names the confusion
      caption?: string }
  | { type: 'disambiguation'; id: string;
      sharedSkeletonLabel: string;
      attributes: string[];                            // ordered attribute names
      entries: Array<{ title: string; values: Record<string, string> }>;
      highlightAttribute: string;                      // must be one of attributes[]
      caption?: string }
  | { type: 'array-track'; id: string;
      input: Array<string | number>;
      tracks: Array<{ label: string;
                      states: Array<'neutral' | 'cand' | 'active' | 'out' | 'done'>;
                      output?: string }>;
      caption?: string }
  | { type: 'tabbed-card'; id: string;
      tabs: Array<{ label: string; body: string /* markdown */ }>;
      defaultTab?: number;
      caption?: string }
  | { type: 'metric-pair'; id: string;
      metric: string;                                  // what is measured: "calls", "objects allocated", "comparisons"
      entries: Array<{ label: string; value: string; detail?: string }>;  // 2-3 conditions, same metric
      highlight?: number;                              // index of the entry that makes the point
      caption?: string };

type Cell = { eyebrow: string; title: string; body: string };
```

The `id` is stable across renders — used for analytics, deep-linking, and contributor-side reuse search.

### Authoring rules

- **Each figure earns its caption.** One sentence under the figure naming what the reader should now be able to do. If you cannot write the caption, the figure is decoration — remove it.
- **Maximum 2 figures per `read` step.** A third figure means the step is overloaded. Split.
- **Figures do not replace exercises.** A figure breaks a wall; a `kata` proves the learner internalised the concept. A scroll that ships 8 figures and 2 katas has degraded into a brochure.
- **Tier S figures pass the paragraph test the same way prose does** (per [`README.md`](README.md) §5.1). Ask: *if I delete this figure, does the polyglot lose something language-specific?* If no, the figure does not ship.
- **`array-track` with identical state sequences across tracks is forbidden.** The whole point is the *contrast* between methods. If `each` and `map` produce identical state arrays, you are not teaching `map`.
- **`disambiguation` requires the divergent attribute to be a *single* dimension** (intent, mutability, ownership, etc.). Multi-axis differences belong in a `two-by-two`, not a side-by-side.
- **`metric-pair` values must be real.** Run the code, count the thing. An invented number teaches a lie with confidence. When the metric depends on input size, name the input in the caption (*"fib(12), counted calls"*).

### Anti-patterns (auto-reject at review)

- **Decorative `before-after`** — left and right are syntactic variants of the same idiom (e.g. `puts x` vs `print x`). No pedagogical contrast. *(Valentina S2)*
- **`two-by-two` with no highlighted cell** — if the grid doesn't name a confusion, it's a matrix, not a figure. Use a table. *(Maya S11)*
- **`disambiguation` with three entries that share *no* attribute** — those aren't look-alikes, they're a list. *(Rhea S10 / language specialists)*
- **`array-track` with > 10 cells** — at that scale the cells become unreadable and the figure becomes a stunt. Split or pick a smaller input. *(Felix S12)*
- **`tabbed-card` with a tab the reader cannot motivate to open** — every tab must be answer to a question the reader has. A "References" tab is metadata, not a lens. *(Soren C6)*
- **`metric-pair` where the gap is unimpressive** — "11 vs 13 calls" is a rounding error, not an aha. If the ratio isn't roughly ≥3×, pick a bigger input or drop the figure. *(Elif S5)*

### Renderer contract

- All figures live under `apps/web/src/scrolls/figures/<FigureName>.tsx`, one file per type. They are pure presentational components — props in, JSX out, no fetching, no global state.
- State tokens come from the semantic-state palette defined in [`../DESIGN.md`](../DESIGN.md) §Semantic state tokens. No inline hex.
- Tab switches in `tabbed-card`, hover reveals on `before-after` annotations, and any other intra-figure interaction use **CSS only**. No GSAP, no motion library inside the figure layer. (See §Animation tech.)
- All figures respect `prefers-reduced-motion` by virtue of being CSS-only.
- Each figure carries a server-rendered fallback that displays correctly without JavaScript (the `tabbed-card` falls back to a series of `<details>` blocks, `before-after` falls back to two stacked code blocks, etc.). The scroll catalog should be readable in `noscript`.

### Embeddable figures and `algo-trace`

If a future `algo-trace` step type ships — a pure-function frame generator driving a scrubber, motivated by the same Sprint 026 review but deferred indefinitely — several of the visual primitives behind the Tier B figures above (sequence-play, grid-canvas, recursion-stack) become *components of `algo-trace`* rather than standalone embeddable figures. The scoping rule:

- If the visual is **embedded in a `read` step to break a prose wall**, it is a figure (this section).
- If the visual is **the entire surface of a step** with frame-by-frame playback, it is an `algo-trace` step (not yet shipped).

This split keeps the figure schema small and the step-type schema honest. A future `algo-trace` decision does not require revisiting the figure catalog.

### Cross-references from existing step type contracts

An earlier draft of this section proposed a third `Interaction` kind (`{ kind: 'figure'; figure: Figure }`) for embedding figures in `read+inline` steps. The shipped implementation (2026-06-11) dropped it: the `:figure[name]{...}` markdown directive resolves inside `read+inline` prose segments exactly as it does in plain `read` steps, so a dedicated interaction kind would duplicate the directive path for no gain. Figures embed via the directive everywhere; the `interactions` array stays two-kinded (`reveal`, `micro-quiz`).

---

## Acceleration principles — what earns "aha per minute"

> Distilled 2026-06-11 from the 101 prototypes (Algorithms / Architectures / Design Patterns; workspace-local review at `.kwik-e/local/scrolls/PROTOTYPES-101-REVIEW.md`). The step types and figures in this document are *implementations* of these principles. The principles outlive any single component: when authoring, apply each one with the cheapest tool available — most have a prose-only or existing-figure version today. A device that embodies none of them is decoration.

1. **Prediction before revelation.** The aha doesn't happen on seeing the answer; it happens when a committed prediction turns out wrong. Any surface that can ask for commitment before showing the result should.
   *Today:* `predict` step, `micro-quiz` in `read+inline`, or a plain prose prompt before a code block ("what does this print? decide before reading on").
   *Full version:* predict-gates at decision frames inside `algo-trace` (deferred).

2. **Make cost visible — the number, not the adjective.** "Much faster" teaches nothing; "177 calls vs 13" teaches magnitude. Counting beats labeling.
   *Today:* `metric-pair` figure; kata feedback that names the measured difference (the Python `tally` kata's O(n²)-vs-O(n) note is this principle in prose).
   *Full version:* live comparison/swap counters during `algo-trace` playback.

3. **Make invariants visible over time.** An invariant stated once in prose evaporates; an invariant *seen holding* across three snapshots sticks ("everything left of `lo` is already discarded").
   *Today:* `array-track` with 2-3 rows as time snapshots; name the invariant in the caption.
   *Full version:* the frame player — the invariant holds visibly on every frame while scrubbing.

4. **Dual representation.** A concept understood from two models simultaneously anchors better than from one (heap: tree + array; graph: picture + adjacency table; closure: code + captured-scope diagram). The correspondence *is* the lesson.
   *Today:* `tabbed-card` is the weak sequential version (lenses one at a time); a `two-by-two` can name the correspondence statically.
   *Full version:* synchronized dual-view (one `activeId`, two views) inside `algo-trace`.

5. **Break it on purpose (fail-by-design).** Every precondition deserves its violation demo. Seeing binary search fail on an unsorted array beats reading "requires sorted input". **Authoring rule, effective now:** when a lesson teaches something with a precondition, the nearest playground invites breaking it ("now remove the sort and run it again"), or the `read` shows one snapshot of the failure. A named precondition with no visible failure is a missed aha.

6. **Agency over abstraction.** When the learner must *assume* something works, give them a control that performs the assumption instead of narrating it. The prototypes' "trust the recursion" button (collapses a subtree, seeks past its frames) is the canonical example: the leap of faith becomes a click.
   *Today:* limited — playgrounds approximate it ("change this and see").
   *Full version:* collapse-subtree control in `algo-trace`.

**Transversal:** the semantic-state palette (`neutral / cand / active / out / done / path / goal`, always color + shape + label — [`../DESIGN.md`](../DESIGN.md) §Semantic state tokens) compounds only if *every* device respects it. The learner pays the vocabulary cost once; every later figure and step type gets it for free. A component that invents its own state colors breaks the compounding and fails review.

---

## Deferred device kit — the 101 prototypes backlog

The interaction architecture from the 101 prototypes that is **not** being built yet, recorded here so the next decision starts from the design, not from zero. Decision of record: 2026-06-07 review (`algo-trace` deferred until an algorithms-style course is a real sprint commitment) — reaffirmed 2026-06-11.

| Device | What it is | Adoption trigger |
|---|---|---|
| **`algo-trace` step type** | Pure-function frame generator → immutable snapshot array; UI moves a cursor (play/pause/scrub/step, keyboard nav). The engine everything below plugs into. | First 101-style course (sorting, data structures, graphs) enters a sprint. GSAP enters the repo with it (continuous-playback timeline; single-frame advance stays CSS). |
| **Predict-gates** | Playback pauses at frames marked `decision`; learner predicts before reveal. Per-decision-frame only — per-frame everywhere fails Maya's gate. | Ships inside `algo-trace`. |
| **Practice-mode toggle** | Gates on/off switch: passive watch vs forced prediction. | Ships inside `algo-trace`. |
| **Live metric counters** | Comparisons/swaps/calls counting up during playback (principle 2, live version). | Ships inside `algo-trace`. |
| **Dual-view sync** | Two representations of the same frame, one `activeId` highlighting both (tree+array, graph+table). | Ships inside `algo-trace`; not a standalone figure. |
| **Collapse-subtree** ("trust the recursion") | Button on a non-leaf call node that seeks to its exit frame. One `seek()` — trivial once frames exist. | Ships inside `algo-trace` for any recursive trace. |
| **Parameter controls + fail toggles** | Inputs (size, target, strategy, "break the precondition") that rebuild frames deterministically (seeded). | Ships inside `algo-trace`. The *principle* (fail-by-design) applies today via playgrounds — see Acceleration principles §5. |
| **Kill-a-node cascade** | Topology diagram where the learner kills a service and watches failure propagate; resilience patterns (circuit breaker, bulkhead) as toggles. Specified in the architectures prototype docs; never prototyped. | Architectures deep-dive scroll only. High effort — needs failure-propagation simulation. |

**Deliberately not adopted from the prototypes** (assessed and rejected, so they don't get re-proposed): pseudocode toggle (near-zero engagement — the trace already explained the algorithm; ship pseudocode as prose if needed), decorative state badges redundant with cell color (keep glyphs only for milestone states), recursion trees *without* a collapse action (visual confirmation, not teaching — principle 6 unfulfilled).

---

## Animation tech recommendation

**Per Sprint 026 reversal: on `/scrolls/*` routes the motion runtime budget is GSAP + CSS. Rive is parked indefinitely** — reopen only if a real designer enters the picture with a separate iteration loop (Phase 3+). The Sprint 025 "Rive + CSS only on scrolls" policy didn't survive a second look: the Rive value proposition is the designer-iterates-without-engineer loop, which doesn't exist in Phase 0 where the creator is also the designer and the engineer. GSAP is JS-declarative, already loaded for other surfaces, versionable in code, and shipped without a separate editor or binary asset format. Cleaner choice for the one-person-team reality.

The route-scoped rule:

- **`/scrolls/*` (scroll player + catalog):** GSAP when motion needs a real timeline or scroll-driven choreography (idiom comparisons, sequence reveals, future `trace` step animations). CSS for everything else (step transitions, status reveal, button feedback, focus accents, hover states, binary state machines like `predict`). **Rive is not loaded on these routes.**
- **`/katas/*`, `/belts`, `/sensei-eval`, landing, dashboard:** GSAP for site motion identity (enso loader, brushstroke reveals, hanko stamp on verdicts) per [`../DESIGN.md`](../DESIGN.md) §Motion. CSS for everything else. Same GSAP runtime as scrolls — shared lazy-load chunk.

### Decision matrix

| Use case | Recommended | Why | Bundle cost |
|---|---|---|---|
| `predict` state machine (unanswered → revealed) | **CSS state machine in React** | 3-state binary transition; CSS handles it cleanly without a runtime; the PredictStep component shipped in Sprint 025 stays as-is | 0 |
| `trace` step transitions (line highlight, state panel update) | **CSS transitions + React state** | Simple variable-driven UI; binary state change doesn't need a library | 0 |
| `read+inline` collapse/expand | **CSS transitions** | One-axis animation; reduced-motion respected automatically | 0 |
| Trace for DOM (dot animating through event flow, when shipped) | **GSAP timeline** | Path animation along the DOM tree visualization with capture/target/bubbling phase markers; GSAP timelines model the phased choreography in code | shared GSAP runtime |
| Trace for SQL (query plan walk) | **CSS + React state** | Tree nodes are React components with className transitions; no path animation needed | 0 |
| Step transition between `activeStepId` changes | **CSS keyframe** (`step-fade-in`) | Triggered on remount via `key={step.id}` — no JS animation needed | 0 |
| Status chip reveal on test result arrival | **CSS keyframe** (`status-reveal`) | Triggered on component mount | 0 |
| Test result row stagger | **CSS keyframe + per-row `animation-delay`** | Index-based delay; no library | 0 |
| Idiom comparison reveals (side-by-side Python vs Ruby, etc.) | **GSAP timeline** | Sequenced reveal needs declarative timeline — fade-in left, then right, then highlight differences; CSS keyframes scale poorly here | shared GSAP runtime |
| Ink-stroke reveal of H1 on scroll player | **GSAP DrawSVG** | Same brand motion signature as `/katas/*` and `/belts`; consistent across the product | shared GSAP runtime |
| Decorative animations (header pulses, cursor blinks) | **CSS only** | Already used across the rest of Dojo | 0 |

### Combined bundle cost on `/scrolls/*` routes

GSAP core ~50KB + DrawSVG plugin ~10KB = ~60KB lazy-loaded motion runtime — but **shared** with the rest of the product (landing, katas, belts), so the marginal cost on scrolls is roughly the cost of evicting unused tree-shakeable code, not the full library.

CodeMirror (~200KB) and Mermaid (~400KB on some scrolls) remain the dominant route-cost drivers; motion is a marginal concern.

### Felix's rule (post-S026 reversal)

> "GSAP earns its keep through DrawSVG and timelines that real motion needs. CSS handles binary state and simple transitions. Rive earns its keep when a designer iterates animations as files; in a one-person team that loop doesn't exist, so Rive doesn't earn anything. When motion is being added, ask: 'Is this a timeline, a state machine, or a transition?' Timeline → GSAP. State machine → CSS in React. Transition → CSS. Never reach for Rive unless a separate designer with a Rive editor practice has actually appeared."

### Panel disagreement history

Five rounds on this surface — the doc has been re-litigated more than it should have, kept honestly so the reasoning survives the next re-litigation:

1. **Original:** Rive-only on scrolls.
2. **Revision:** GSAP-only on everything ("one mental model").
3. **Counter-revision (the two-library era, Sprint 024):** GSAP + Rive co-load on scrolls, scoped by domain.
4. **Sprint 025 simplification (ADR 022):** Rive + CSS only on scrolls; GSAP excluded from scroll routes.
5. **Sprint 026 reversal (current):** GSAP + CSS on scrolls; Rive parked indefinitely.

What flipped between 4 and 5: realising the Rive value prop is the designer-iteration loop, which is vapor in Phase 0. CSS state machine for predict already shipped and stays. GSAP returns to scrolls because timelines + DrawSVG are useful and don't carry the binary-asset-format friction Rive does.

Maya (S11) is unchanged across all five rounds — her domain is pedagogy of interaction (does this teach or decorate), runtime-agnostic. Felix (S12) was the GSAP-only voice from round 2 onward; round 5 is finally his preferred shape codified.

The PredictStep component shipped in Sprint 025 is **stays CSS** — no Rive swap was ever necessary and isn't now. Future timeline-heavy motion uses GSAP from this sprint forward.

### Lazy-load boundary

The animation runtime is lazy-loaded with the scroll player route. The landing page and the dashboard do not pay for it. Felix owns the bundle budget; he reviews each new runtime addition.

### Accessibility floor

Every animation respects `prefers-reduced-motion`. A user with the OS setting reduces all animations to instant-state transitions — no fades, no slides, no spinners. Tested via Playwright with the reduced-motion mode active. This is not optional.

---

## Authoring failure modes (anti-patterns)

The catalog of mistakes that get a step rejected at review. Each anti-pattern names the panel member who would block it.

### Pedagogy failures

- **Generic feedback** — *"the correct answer is C because the prototype is on the prototype chain."* No reference to the wrong answer the user actually picked. (Maya S11)
- **Decorative interactivity** — a tap-to-reveal whose answer is "yes" or "no" with no follow-up explanation. (Maya S11)
- **The interaction is the punchline** — a `predict` where the joke of the wrong answer is the whole pedagogical point. Funny, but the learner doesn't transfer skill. (Elif S5)
- **Encouragement fluff** — "great try!" or "almost!" anywhere in feedback. (Voice gate — automatic reject)
- **Skip affordance** — any "I already know this" or "skip step" button. The dojo doesn't babysit. (Voice gate)

### Authoring cost failures

- **One-off step types** — a custom interaction designed for one specific concept that won't be reused. Authoring cost without amortization. (Valentina S2)
- **Trace steps with >12 steps** — split the code, or accept the step is too dense. (Valentina S2)
- **Predict steps with 5+ options** — the cognitive load of comparing 5 plausible options exceeds the learning value. (Elif S5)
- **Read+inline with >4 interactions** — the prose has been reduced to filler between widgets. Split. (Valentina S2)

### Technical failures

- **Animations without `prefers-reduced-motion` support** — automatic reject from Felix S12.
- **State machine logic in React component code instead of Rive** — when a step type uses Rive, the state transitions belong in the .riv file. Engineers shouldn't be re-implementing the state machine via React state + className flips. (Felix S12) · Same rule applies if the step uses GSAP: timelines belong in a `useGSAP` hook with stable refs, not constructed inline on each render.
- **Bundle weight without justification** — adding GSAP for a single fade-in. Use CSS. (Felix S12)
- **Animations that block the accessibility tree** — `aria-busy` left true after the animation completes. (Felix S12)

---

## Authoring checklist for a new step type

Before proposing a new `step.type` to the schema, the author answers:

1. **What pedagogical job does this step type do that no existing type does?** One sentence. If it's "make `read` more interactive", that's a `read+inline` variant, not a new type.
2. **What is the authoring time per step?** Estimate. If >45 minutes for a typical step, the type is too expensive.
3. **Will this type be used in at least 20 steps across the catalog?** If no, it's a stunt.
4. **Who on the panel signs off on the voice?** Default: Valentina (S2). Reveal feedback patterns ship behind voice review.
5. **What animation runtime does this require?** Felix S12 reviews the perf budget.
6. **What's the failure mode if the animation breaks (e.g. Rive runtime fails to load)?** A graceful degradation to a non-animated state must exist. The scroll player must not blank out.
7. **How does this type respect `prefers-reduced-motion`?**
8. **What's the test plan?** Both unit (renderer behavior) and visual (Playwright snapshot with reduced motion).

A type that has answers to 1-8 is ready for panel review. A type with hand-waves on any of them is a draft.

---

## Implementation order (v1)

The order step types ship, based on panel converge:

1. **`predict`** — highest ROI per authoring hour. Implement first in TS scroll.
2. **`read+inline`** — converts existing `read` steps incrementally. Backwards-compatible (old `read` steps still render fine).
3. **`trace`** — implement after `predict` proves engagement signal. JS DOM scroll is the first target; SQL second (query-plan variant); Python third.
4. **Tier 2 deferred** — `spot-the-bug`, `build`, `match`: reconsider only if v1's engagement metrics show interactive steps are working but a specific concept isn't covered by predict/trace/read+inline.

Per-scroll layout proposals live in [`.kwik-e/tmp/scroll-redesign/`](../../.kwik-e/tmp/scroll-redesign/) (workspace-local) — those are the working prompts and mockup reviews, not canonical curriculum docs.

---

## Related documents

- [`README.md`](README.md) — the design framework (course/scroll philosophy, structure, voice). The What of curriculum.
- [`curricula/`](curricula/) — per-language plans (go, python, ruby, rust, typescript). The Where of each scroll.
- [`testcode-pattern.md`](testcode-pattern.md) — the iframe testCode contract for browser-side steps.
- [`../BRANDING.md`](../BRANDING.md) §Glosario — vocabulary (kata, scroll, sensei, belt, milestone).
- [`../EXPERTS.md`](../EXPERTS.md) — panel personas, including S11 Maya and S12 Felix who own this document's review.
- [`../adr/020-ubiquitous-language-pass.md`](../adr/020-ubiquitous-language-pass.md) — the Sprint 023 rename that surfaced the need for this document.
