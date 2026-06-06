# Scroll Interactivity Patterns

> **Status:** Canonical · **Last reviewed:** 2026-06-06
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

### Tier 2 — proposed (Sprint 023+ decision)

These types are pedagogical bets. Each must justify its authoring cost and its implementation cost before it ships. Two-week panel review with Elif (S5) + Valentina (S2) + Maya (S11) is the contract.

| `step.type` | Pedagogical job | What earns its existence | Status |
|---|---|---|---|
| **`predict`** | Activate the learner's hypothesis before reading the answer | The reveal is the moment of learning. The wrong-answer feedback addresses the *specific* wrong answer's mental model. | Approved — v1 for TS scroll |
| **`trace`** | Make runtime visible. Step through execution and watch state. | Only meaningful for languages where execution is observable. Skip for TypeScript pure (defer to type-inference walk in v2). | Approved — v1 for JS DOM, SQL, Python |
| **`read+inline`** | A `read` step with embedded mini-interactions to break the prose wall | Cognitive load: the developer cannot skim because they have to decide something every 150-200 words | Approved — v1 across all scrolls |
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
- Animation: state machine with three states — `unanswered → reviewing → revealed`. Recommended runtime: Rive (see §[Animation tech](#animation-tech-recommendation)).

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
- Animation: each step transition is a state machine update (Rive) OR a CSS variable update + transition (lighter option for simple variable-flow). Procedural updates driven by `steps[i]`.

**Voice:**
- Sensei voice is minimal in trace — only appears as the `hint` field at gotcha steps.
- Hints are specific: *"notice `event.target` stays the original `<button>` even as `currentTarget` walks up — this is what makes event delegation work."*
- Off-brand: a sensei voice narrating every step ("now we move to line 3…"). The developer narrates by stepping.

#### `read+inline` (read with mini-interactions)

**Schema:** the existing `read` step plus an `interactions: Array<Interaction>` field where each `Interaction` is one of two shapes:

```ts
type Interaction =
  | { kind: 'reveal'; after: string; prompt: string; answer: string }
  | { kind: 'micro-quiz'; after: string; question: string; options: [string, string]; correct: 0 | 1; feedback: [string, string] }
```

`after` is a marker in the prose (e.g. a `<!-- INTERACT -->` HTML comment) telling the renderer where to insert the interaction.

**Authoring:**
- Maximum 4 interactions per `read+inline` step.
- If a prose block between two interactions exceeds 200 words, split the step.
- Reveals are for "before you read on, what do you think?". Micro-quizzes are for "did you catch this point?" — they go after the relevant prose, not before.

**Renderer:**
- Inline expansion of reveals (tap to expand). State machine: `collapsed → expanded`.
- Micro-quizzes: 2 options as buttons. State machine: `unanswered → answered`. Wrong feedback follows the predict voice contract.
- Animation: lightweight — CSS transitions sufficient for collapse/expand. No Rive needed unless a specific reveal carries a diagram.

**Voice:**
- Mini-quiz wrong feedback: same as predict — specific to the wrong answer.
- Reveal answers should be self-contained — the prose around them doesn't have to repeat what the reveal said.

---

## Animation tech recommendation

S12 Felix's framework. The library picked per step type per use case, not per project.

### Decision matrix

| Use case | Recommended | Why | Bundle cost |
|---|---|---|---|
| `predict` state machine (unanswered → reviewing → revealed) | **Rive** | Designer-driven states, future cross-platform parity, file size tiny | ~30KB runtime + <5KB per .riv |
| `trace` step transitions (line highlight, state panel update) | **CSS transitions + React state** | Simple variable-driven UI; doesn't need a state machine | 0 — no new runtime |
| `read+inline` collapse/expand | **CSS transitions** | One-axis animation; reduced-motion respected by default | 0 |
| Trace for DOM (dot animating through event flow) | **Rive** OR **motion-one** | Path animation along DOM tree; Rive gives state visualization | ~30KB Rive OR ~3KB motion-one |
| Trace for SQL (query plan walk) | **CSS + React state** | Tree nodes are React components with className transitions; no path animation needed | 0 |
| Decorative animations (header pulses, cursor blinks) | **CSS only** | Already used across the rest of Dojo | 0 |
| Anything that needs a designer-iterable artifact | **Rive** | Designer ships .riv, code triggers states — the designer-developer contract Felix endorses | per use |

### Felix's rule

> "Rive when the animation is a designed artifact with states. CSS when state is binary. Motion-one when bundle size dominates. GSAP only when you need timeline scrubbing or sequenced procedural animations that the other three can't reach — and you have a specific named case, not 'because it's GSAP'."

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
- **State machine logic in component code instead of Rive** — when the step type uses Rive, the state transitions belong in the .riv file. Engineers shouldn't be re-implementing the state machine in React. (Felix S12)
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
