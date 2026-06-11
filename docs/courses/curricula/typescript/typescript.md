# TypeScript — Authoring Spec

> Executable authoring brief for the `typescript` scroll — the dojo's TypeScript crash course.
> Inherits the TypeScript Course Authoring Profile from [`../typescript.md`](../typescript.md) §2. Template: [`../../authoring-spec-template.md`](../../authoring-spec-template.md). Framework: [`../../README.md`](../../README.md). Direction: [ADR 022](../../../adr/022-crash-course-pivot.md).
>
> **Promoted to canon 2026-06-11 (Sprint 028 W1)** from the S026 scratch drafts, under the audience pivot: primary reader is the JS developer adopting TypeScript (A4 Felipe). Lens: *"what TypeScript adds to the JavaScript you already write — benefits forward."* Replaces the legacy `typescript-fundamentals` scroll (Sprint 014 MVP), hard-deleted at seed time — **rebuild, not migrate** (Ruby L3 precedent). First TS spec authored against the 2026-06-11 canon: scroll capstone ([README §5.3](../../README.md)) and production-gesture audit ([README §4.4](../../README.md)) applied from outline stage.

## Header

```yaml
slug: typescript
title: "TypeScript"
kind: language-scroll
language: typescript
sandbox: piston                  # existing allowlisted TS path; iframe is javascript-dom only (S028 decision)
prereqs: []                      # JS fluency is the audience contract, not a prereq scroll
audience: "JS developer who wants to learn TypeScript and its benefits — JS assumed fluent, TS assumed zero"
learner_time: "~95 minutes (60-120 range)"
status: scope-block-complete     # outline + capstone + gesture audit done (S028 W1); lesson prose is W2
maintainers:
  - S9 Leo Barros                # language pedagogy
  - S5 Elif Yıldız               # curriculum architecture
  - S2 Valentina Cruz            # content quality
  - S11 Maya Lindqvist           # predict / playground / read+inline / figure review
primary_audience:
  - A4 Felipe Reyes              # 5yr JS, "TS-strict" with more `any` than he'd admit — the scroll exists for him
secondary_audience:
  - A3 Yui Tanaka                # TS is her modernization target track; Java-first, so the JS-delta framing only partially serves her — flag at review, don't author for her
out_of_scope_audience:
  - A2 Esteban Morales           # Python-first, no JS background; the scroll's JS-fluency contract excludes him
  - A1 Mariana Vargas            # TS senior — not a learner; reviewer lens that keeps the claimed benefits honest
```

---

## 1. Learning Outcomes

After finishing this scroll, the learner can…

- State what TypeScript adds to the JavaScript they already write, and what it costs: types are erased at runtime (no runtime cost, no runtime guarantee); **checking is a separate pass from running** — `tsc --noEmit` checks, while `tsx`, `esbuild`, and modern `node` strip types without checking; `tsconfig.json` exists, `strict` is the first flag that matters, and the flag tour is someone else's scroll.
- Let inference carry the weight: predict the inferred type of un-annotated code (including through a `reduce` chain), explain `const`-literal vs `let`-widened inference, annotate **function signatures** as the checked contract, and stop annotating locals out of habit.
- Define object shapes with optional fields and consume them safely; explain structural compatibility ("the compiler reads shape, not name") and excess-property checking on literals; apply the `type`-by-default / `interface`-for-merging rule; reach for literal unions (`"created" | "scanned"`) where their JS reflex was bare strings and a typed-language reflex would be `enum`.
- Write narrowing-driven code: `typeof`, `in`, equality, `Array.isArray`; model state as a discriminated union with a tag field; close a `switch` with an `assertNever` exhaustiveness check; write a user-defined type guard (`x is Foo`) when built-in narrowing isn't enough.
- Use the compiler as a second reader during refactors: add a variant to a discriminated union and follow the compile errors to every site that needs updating, instead of grepping and hoping.
- Distinguish `any`, `unknown`, and `never` and pick the right one at three positions: a JSON/IO boundary (`unknown` + a guard), a "this branch can't happen" assertion (`never`), and a deliberate escape hatch (`any` with a TODO and a named cost). Name `as`'s broken-promise failure mode without ever using it as a teaching crutch.
- Write a generic function with a constraint when duplication motivates it (`<T>`, `extends`, `keyof`, indexed access `T[K]`); predict the inferred `T` at a call site; recognise when a function should NOT be generic.
- Recognise — not write — conditional types, mapped types, `infer`, and template literal types in real code, and know which deep-dive scroll earns each (`typescript-advanced-types`, `typescript-with-react`, `typescript-build-and-config`).

Each outcome maps to at least one `kata`, `predict`, playground, or challenge step in §4. Outcomes without a step are aspirational and must be cut or backed by a step.

---

## 2. Sub-course Authoring Notes

Inherits the TypeScript Course Authoring Profile ([`../typescript.md`](../typescript.md) §2) without deviation: benefits-forward voice, 200-350 word read steps, the interactivity and figures menus, all five pedagogical bets.

Explicit local choices for this scroll specifically:

### 2.1 The Felipe test — gate for every `read` paragraph

TypeScript-specific equivalent of Ruby's paragraph test and Python's Pythonic test. Before any `read` paragraph ships:

> *If I delete this paragraph, does Felipe — five years of fluent JavaScript, zero real TypeScript — lose something TypeScript-specific? If the paragraph re-teaches JavaScript, or explains a concept his JS fluency already gives him (closures, async, array methods, duck typing as a practice), it doesn't exist.*

The failure mode this gate catches is the **JS-reteach** — the single most common sin of TS course material, because TS syntax IS JS syntax and the temptation to narrate the host language is constant. A paragraph survives only if it names something the *type system* adds: an inference behavior, a compatibility rule, a narrowing effect, a cost (`any` propagation, `enum` runtime footprint), or a cultural rule (`type` by default; annotate signatures only).

### 2.2 The no-type-system-flexing gate — for every type shown

Before any type, annotation, or pattern ships in a `read`, `kata`, or figure:

> *Can this type be motivated by a bug it prevents in Felipe's day job? If I removed it, what specific production failure would the learner be unable to recognise or prevent? If the answer is "none — but it's a cool type," cut it.*

This absorbs and tightens the S026 draft's "type-pays-off test." Enforcement is concrete:

- Every pattern in a `read` opens with the failing/risky code (the silent `any`, the unhandled variant, the string that should be a literal union) before the type that fixes it.
- Every kata exercises a type in a context where the un-typed version demonstrably fails — at runtime in a test, or at compile time via `@ts-expect-error`.
- Tour-grade prose ("`Pick` selects properties; `Omit` excludes them; here is `Record`…") fails review. The learner meets `Pick` in Lesson 5's kata *because they needed it*.
- The benefits-forward lens cuts both ways: every benefit claimed must be demonstrated in a step (the refactor benefit is the Lesson 3 challenge, not a sentence), and every cost is named when its feature appears.

### 2.3 `predict` placement

Three predicts — Lessons 0, 1, and 3 — each targeting a specific wrong mental model the JS developer brings:

- **Lesson 0 — "Which command catches the bug?"** — a TS file with a type error; only `tsc --noEmit` reports it, while `tsx`, `esbuild`, and modern `node` happily strip-and-run. Wrong model targeted: *"if it runs TypeScript, it checks TypeScript."* This is the orientation predict (Ruby/Python L0 precedent) and the lens's foundation: the benefit only exists if the checking pass runs. **The predict owns the tool-by-tool reveal** — read 0.1 establishes that checking is a separate pass and stops there, so the predict stays a genuine prediction.
- **Lesson 1 — "What type is `total`?"** — un-annotated `reduce` chain. Wrong model targeted: *"no annotation = no type (it's all `any`)"* — Felipe's annotation-maximalism in predicate form.
- **Lesson 3 — Narrowing reveal** — `x: string | number` inside `if (typeof x === "string")`. Wrong model targeted: *"the static type can't change inside a branch."* The daily-driver model of the whole lesson. **Opens the lesson (step 3.1), before the narrowing read:** Felipe holds this folk model with commitment, so predict-first is the honest order — a read-first sequence would spoil the reveal.

Lessons 2, 4, and 5 carry no predict: Lesson 2's structural-assignment surprise is owned by its playground (the S028 panel review cut a fourth predict there — its reveal overlapped the playground's); Lesson 4's payoff is *choosing* between escape hatches (kata-shaped); Lesson 5's call-site-inference reveal lives in the kata's `Equal` assertions at multiple call sites (the S026 draft had a fifth predict here; folded into the kata to hold the step budget). 3 predicts of 20 steps = 15% — at the top of the framework's 10-15% heuristic. Exercise share after the cut: hands-on is 9/20 = 45% (11/20 = 55% counting the two challenges) — meets the floor.

### 2.4 Playgrounds as `kata` variant (inherited from Ruby)

Two playground steps (Lessons 2 and 4) — `kata` steps with `data.kind: "playground"`, identical contract to Ruby's and Python's (no verdict UI, button "↻ Try it", trivially-true harness assertion). With Ruby (2) + Python (2) + TypeScript (2), the catalog holds 6 playgrounds across 3 scrolls — still a local experiment below the ≥20-instance promotion gate; Rust/Go decide whether it graduates.

Type-system playgrounds are unusually strong because the output of interest is the *compile result*, not stdout: the learner adds `type _check = Equal<…>` lines and assignment statements, and the compiler's acceptance/rejection IS the feedback. A compile-error verdict in a playground is pedagogical, not a failure.

- **Lesson 2 playground — structural compatibility explorer.** Pre-loaded pairs of compatible and incompatible shapes, plus the excess-property surprise (`const u: User = { …, age: 3 }` errors on a literal but not via an intermediate variable). Specific things to try, per Maya's contract.
- **Lesson 4 playground — the escape hatches at a boundary.** `JSON.parse` as `any` (dangerous chain compiles) vs `unknown` (compiler refuses until narrowed); a `never`-returning function; `string | never` collapsing to `string`.

### 2.5 Hint discipline

Reused verbatim from [ruby/ruby.md §2.4](../ruby/ruby.md) — generalizable rule:

> *A hint must NOT name the exact operator, keyword, or utility type that solves the kata. If removing the hint would not change which identifier the learner types, the hint is the solution.*

Applied to TypeScript:
- ❌ `Use a type guard: 'function isUser(x: unknown): x is User'.` — names the construct and the signature. Solution in disguise.
- ✅ `The compiler won't let you touch '.name' on an 'unknown' value — you have to prove something about the value first. What shape does a function have whose return value teaches the compiler something about its argument?` — points at the gap, makes the learner find `is`.

Same rule for `instruction` text. Applies to all katas, Lessons 1-5. Challenges (3.5 and the capstone) carry ≤1 high-level hint per challenge canon.

### 2.6 Footgun deferral discipline

When a deep-dive topic surfaces, the scroll names it explicitly with its one-line footgun and pointer — never silently elides, never drills:

| Topic | Surfaces where | Footgun named | Deferred to |
|---|---|---|---|
| `as` casts beyond "we know more than the compiler" | Lesson 4 read | a cast is a promise; broken promise = runtime bug the compiler can no longer catch | `typescript-advanced-types` (cast-vs-guard) |
| `enum` | Lesson 2 read + figure | emits a runtime object; literal unions erase to nothing | `typescript-build-and-config` (interop cases) |
| Declaration merging | Lesson 2 read (the `interface` exception) | the only daily-life reason to pick `interface` | `typescript-advanced-types` |
| Conditional types, mapped types, `infer`, template literal types | Lesson 5 closer | clever types cost compile time + the next reader; recognise, don't write yet | `typescript-advanced-types` |
| Brand/phantom types | Lesson 5 closer | structural typing can't tell `UserId` from `PostId` | `typescript-domain-modeling` |
| `satisfies` | Lesson 5 closer | annotation-vs-inference trade-off it resolves | `typescript-advanced-types` |
| Decorators (legacy vs TC39 stage-3) | Lesson 5 closer | two incompatible implementations; don't learn either yet | `typescript-decorators-and-metadata` |
| React component typing | Lesson 5 closer | React surface, not TS surface | `typescript-with-react` |
| tsconfig flags at depth | Lesson 0 read | build configuration, not language syntax | `typescript-build-and-config` |
| Zod-style schema-first boundaries | Lesson 4 closer | the `unknown` boundary is where Zod lives | `typescript-zod-as-type-design` |

### 2.7 Production-gesture audit (canon 2026-06-11, applied at outline)

The 2-3 gestures a working TypeScript developer performs daily — each one **written by the learner in a kata**, not just read about:

| # | Gesture | Written in | Re-performed in |
|---|---|---|---|
| G1 | Type a function signature (params, optional param, return) | Kata 1.3 | Katas 3.3, 5.2-5.3, capstone |
| G2 | Type an object shape with optional fields and consume it safely | Kata 2.2 | Kata 4.2, capstone |
| G3 | Define a discriminated union and narrow it exhaustively (`switch` + `assertNever`) | Kata 3.4 — starter gives 2 of the 4 variants; the learner writes the other 2 plus the full `switch` (+ challenge 3.5) | Capstone (fresh domain, from scratch) |

Audit result: no gesture is read-only; all three recur in the capstone with a new domain so the re-performance isn't copy-paste.

---

## 3. Retrieval & Cross-references

- **From prior scrolls:** none — entry scroll of the TypeScript track.
- **Within this scroll:**
  - **`User`** (`{ id: string; name?: string; email?: string }`), defined by the learner in kata 2.2, reappears as Lesson 4's boundary target (kata 4.2's `isUser` guard) and in Lesson 5's `pickKeys` test fixtures. The learner reads `User` in later starters without re-explanation.
  - **`PaymentStatus`** (the discriminated union from kata 3.4) reappears in challenge 3.5 (new variant) and in the Lesson 4 playground's `assertNever` example. The retrieval builds the intuition that discriminated unions are the default state-modeling tool, not a one-lesson curiosity.
  - **`assertNever`** (starter prelude from Lesson 3 on) reappears in the Lesson 4 playground and the capstone, reused silently.
  - **`Equal<A, B>`** (starter prelude from Lesson 1's kata tests on) is the type-only assertion channel throughout; by Lesson 5 the learner reads `type _t1 = Equal<…>` lines as normal test code.
  - The capstone's domain (shipment webhook events) deliberately echoes Lesson 3's payments domain in *shape* but not in *content* — the learner re-performs G2 + G3 rather than pasting them.
- **Forward hooks for deep-dives:** per the §2.6 table — every closer pointer corresponds to a §3.1 candidate in the outer doc.

---

## 4. Lessons

### Lesson 0 — TypeScript in context

> *What changes in the learner's head:* "TypeScript is my JavaScript plus a second reader. The types are erased before anything runs — so the tools that *run* TS (`tsx`, `esbuild`, even modern `node`) aren't the tools that *check* it. If my pipeline only strips, the benefit I came for never executes. `tsconfig.json` exists, `strict` matters, and the rest of the flags are a later problem."

**Step distribution:** 1 `read`, 1 `predict` = 2 steps. No kata — orientation, not drill. *(Collapsed from the S026 draft's 3 steps, Python L0 precedent: Felipe already operates a JS toolchain daily — he has a tsconfig copied from a Matt Pocock template. He needs the one fact he's likely wrong about, not a build-tools tour.)*

**Status:** outlined; prose is W2.

#### Step 0.1 — `read` — "What TypeScript adds (and where the benefit lives)"

- **why_care topics:** Felipe has shipped "TS-strict" code for a year without being sold the delta. One read: what the type system actually buys him, the erasure truth, and the check-vs-strip split that decides whether he's getting the benefit at all.
- **body topic outline (~300 words):**
  - **The one-sentence contract:** TypeScript is your JavaScript plus a static second reader. It catches shape mistakes before runtime, documents intent at function boundaries, powers refactors (rename, add-a-variant, change-a-signature) — and then **erases completely**: no runtime cost, no runtime guarantee. `function add(a: number, b: number)` ships as `function add(a, b)`.
  - **Check vs strip — the 2026 toolchain truth:** checking is a **separate pass** from running. Much of the modern toolchain that runs or builds TypeScript deliberately skips the check — that's where its speed comes from — which means a pipeline can execute `.ts` files all day while the benefit Felipe is paying for never runs once. The read establishes the split and stops there: **which tools check and which only strip is predict 0.2's reveal, not this read's** (no tool-by-tool verdict list here). A pipeline without a checking pass is paying TS's annotation cost for none of its benefit.
  - **`tsconfig.json`:** the file exists; `strict` is the first flag that matters (and the scroll assumes it). The flag-by-flag tour belongs to a deep-dive, not to day one.
  - **Sandbox honesty:** "This scroll runs single-file TypeScript in the sandbox: no DOM, no React, no `npm install`. The compile pass runs before your code — a type error here fails the step, which is exactly the behavior you want from CI."
  - **Do NOT include:** what static typing is (the reader can guess); JS features of any kind; Flow comparison (dead); the tsconfig flag tour; bundler comparison; `module`/`moduleResolution` mechanics.
- **closer:** forward prompt into the predict — "Next: a file with a bug. Which command actually catches it?"

#### Step 0.2 — `predict` — "Which command catches the bug?"

- **snippet:** a small TS file with a real type error (`const retries: number = "3";`) plus a couple of innocent lines.
- **question:** "Four commands. Which one warns you about the bug *before* the code runs?"
- **options (4):**
  - `a`: `tsc --noEmit file.ts` — **correct**: the type-check pass; reports the error, emits nothing.
  - `b`: `tsx file.ts` — runs it; skips the check by design (speed). The bug ships.
  - `c`: `node file.ts` — modern Node strips types and runs; never checks. The bug ships.
  - `d`: `esbuild file.ts` — transpiles happily; a type-stripper, not a checker. The bug ships.
- **correct:** `a`
- **feedback sketch:** each wrong option gets the same structural reveal from its own angle — *"this tool runs/builds TypeScript, but running is not checking; the type system only earns its keep when the checking pass executes"* — plus the production pattern (strip-tool for speed + `tsc --noEmit` in CI). Option `c`'s feedback names the Node ≥23 type-stripping change explicitly, since "node can't run TS" is stale folklore Felipe may also carry.

---

### Lesson 1 — Inference: annotate less, the compiler already knows

> *What changes in the learner's head:* "I've been annotating everything because I thought un-annotated meant untyped. It doesn't — the compiler infers almost everything from the values and the flow. The contract I owe is the **function signature**; inside it, inference carries the weight. `const` infers the literal; `let` widens. My TS just got shorter than my JS habits expected."

**Step distribution:** 1 `read` (the `read+inline` candidate), 1 `predict`, 1 `kata` = 3 steps.

**Why inference first (lens defense):** the S026 draft led with structural typing, framed against nominal reflexes from Java/Python. Felipe has no such reflexes — his day-one pathology is annotation-maximalism. "The compiler already knows" is the single biggest behavior change available to him, and every later lesson (narrowing IS inference through control flow; generic inference at call sites) builds on it. Leo (S9) signed off with the constraint that the signature-annotation rule is stated as a positive duty (the checked contract), not as "annotations bad."

**Status:** outlined.

#### Step 1.1 — `read` — "The compiler already knows: inference over annotation"

- **why_care topics:** open with the pain (no-flexing gate §2.2): Felipe's real file — every local annotated, signatures duplicated into comments, and still an `any` leaking through a boundary. The annotations weren't the type safety; the *checker* was.
- **body topic outline (~300 words):**
  - **Inference is the default, not a fallback:** `const items = ["a", "b"]` is `string[]` with zero annotations; return types flow out of bodies; callbacks get parameter types from context (`items.map(s => s.length)` knows `s: string`). Annotation-free ≠ untyped.
  - **`const` vs `let` — literal vs widened:** `const status = "shipped"` is type `"shipped"`; `let status = "shipped"` is `string` (it must stay reassignable). First sighting of literal types — Lesson 2 builds unions out of them. `as const` named in one sentence (freeze the literal inference on objects), not exercised.
  - **The rule: annotate the signature, infer the rest.** Function parameters can't be inferred from thin air — they ARE the contract, and annotating them is documentation the compiler enforces. Return-type annotation: optional; worth it on public/exported functions (locks the contract; turns a body mistake into an error at the function, not at fifty call sites). One sentence names the async spelling: an `async` function's return annotation is `Promise<T>` — the one signature form that surprises a JS dev on day one.
  - **Figure:** `:figure[before-after]{id:"ts-annotation-maximalism"}` — left: every local annotated (✕ on the noise); right: signature-only + inference (✓ on the contract line). The lens, drawn.
  - **Do NOT include:** what type inference is conceptually (the reader gets it from the examples); Hindley-Milner trivia; `satisfies` (Lesson 5 closer); JS variable semantics.
- **closer:** forward prompt into the predict — "Before you write a signature, predict what the compiler already knows."

#### Step 1.2 — `predict` — "What type is `total`?"

- **snippet:**
  ```ts
  const prices = [120, 80, 95];
  const total = prices.reduce((sum, p) => sum + p, 0);
  ```
- **question:** "Not one annotation in sight — what type does `total` have?"
- **options (4):**
  - `a`: `any` — nothing was annotated *(the annotation-maximalist model: un-annotated = untyped — the exact model this lesson exists to break)*
  - `b`: `number` — **correct**: inference flows from the array literal through `reduce`'s signature and the initial value
  - `c`: `unknown` — the compiler can't be sure *(confuses inference with the boundary type; `unknown` is for values the compiler genuinely can't see, Lesson 4)*
  - `d`: `number | undefined` — empty arrays exist *(plausible-sounding; `reduce` with an initial value always produces the initial value's type — the feedback distinguishes it from the no-initial-value overload that DOES throw on empty)*
- **correct:** `b`
- **feedback per option** names the specific model, per the predict voice contract. Option `a`'s feedback is the lesson's thesis restated: "TS infers through the whole chain; you've been paying annotation tax on information the compiler already had."

#### Step 1.3 — `kata` — Give this function a signature *(production gesture G1)*

- **1-line task:** A working but un-annotated function ships in starter code; write its signature — typed params, an optional param, and an explicit return type.
- **starter shape:**
  ```ts
  // applyDiscount(120, 10) -> 108 ; applyDiscount(120, 10, "VIP") -> 102
  function applyDiscount(price, percent, code) {
    const base = price * (1 - percent / 100);
    return code === "VIP" ? base * 0.95 : base;
  }
  ```
  The learner adds: `price: number`, `percent: number`, `code?: string`, `): number`.
- **test shape:** `_t`/`_eq` runtime assertions on the three behaviors (no code, VIP code, non-VIP code); `@ts-expect-error` assertions on `applyDiscount("120", 10)` and on `applyDiscount()` (missing required args); `Equal<ReturnType<typeof applyDiscount>, number>` type-only assertion.
- **instruction note (test furniture — read, don't write):** one line in the instruction: the test block's `Equal` / `ReturnType` / type-level `typeof` lines are harness furniture — read them as assertions, don't write them; the scroll teaches the underlying operators later. Keep `Equal`'s definition out of the visible starter if the harness allows (prelude injection).
- **hint sketch:** *"The third argument sometimes does not arrive. TypeScript has a way to mark a parameter as optional in the signature itself — what happens to `code`'s type inside the function once you mark it that way?"* (points at `?` and at `string | undefined` without naming either).
- **why this kata:** 80%-confidence opener that lands gesture G1 and quietly plants `string | undefined` — Lesson 3's narrowing has a hook back to it.

---

### Lesson 2 — Shapes: the type system is structural

> *What changes in the learner's head:* "The compiler reads *shape*, not name — this is the duck typing I already practice in JS, now checked. Optional fields are part of the shape. `type` by default, `interface` for one specific job. And a fixed set of named values is a literal union, not a string and not an `enum`."

**Step distribution:** 1 `read`, 1 `kata`, 1 `playground` = 3 steps. *(The S026 draft's structural-assignment predict was cut at S028 panel review: its reveal overlapped the playground's, and read 2.1 spoiled its answer. The surprise is owned by playground 2.3 — see §2.3.)*

**Status:** outlined.

#### Step 2.1 — `read` — "Shapes: the compiler reads structure, not names"

- **why_care topics:** pain first: a `string` field that should only ever hold three values, and the typo (`"shiped"`) that sails through review and breaks at runtime. Shapes + literal unions are the fix.
- **body topic outline (~350 words):**
  - **Object types and optional fields:** `type User = { id: string; name?: string }` — `?` means the field may be absent, and the compiler forces the absence to be handled at every read. This is the benefit, framed: the `undefined.foo` crash Felipe has shipped becomes a compile error.
  - **Structural compatibility:** two types with matching shapes are interchangeable — no `implements`, no registration. For a JS developer this is good news: it's the duck typing they already practice, with a reader checking the duck. One worked example of width subtyping (extra fields are fine *via a variable*).
  - **Excess-property checking on literals:** the asymmetry that bites everyone in week one — `const u: User = { id: "1", age: 3 }` errors, but the same object passed through an intermediate variable doesn't. Named with one example; the playground pokes it.
  - **`type` vs `interface` — one rule:** `type` by default; `interface` only when you need declaration merging or are extending external module types (both rare). One sentence; never revisited. *(No figure — a figure would re-dignify the flame war.)*
  - **Literal unions over strings and over `enum`:** `type Status = "idle" | "loading" | "ready"` beats `string` (typo = compile error) and beats `enum` (which emits a runtime object). **Figure:** `:figure[disambiguation]{id:"ts-union-vs-enum"}` — identical skeletons (a set of named values); divergent attribute: **runtime footprint** (union erases to nothing; `enum` compiles to a JS object). `enum` flagged legacy/interop, deferred per §2.6.
  - **Do NOT include:** classes (out of crash scope); nominal-typing comparative theory (Felipe has no nominal reflexes — one sentence of contrast is plenty); mapped/conditional types; `readonly`/index signatures beyond a naming mention.
- **closer:** forward prompt into the kata — "You've read the shape rules; now write a shape and survive its optional fields."

#### Step 2.2 — `kata` — Define the shape and consume it *(production gesture G2)*

- **1-line task:** Define `type User = { id: string; name?: string; email?: string }` and implement `getDisplayName(user: User): string` — return `name` if present, else `email`, else `id`.
- **starter shape:** usage examples in comments; the learner writes both the type and the function (the gesture is *writing the shape*, so the starter does not pre-define it).
- **test shape:** runtime: name present / name absent + email present / both absent → id. Compile: `@ts-expect-error` on `getDisplayName({ name: "Ada" })` (missing required `id`); `Equal<ReturnType<typeof getDisplayName>, string>`.
- **hint sketch:** *"Two of the three fields may be missing — the shape has to say so, and the body has to survive it. Which JS operator you already use every day collapses 'the first one that exists' into a single expression?"* (points at `??`/`||` from his JS fluency, not at new syntax — the TS content is the shape).
- **why this kata:** gesture G2; first 40%-stretch is mild (the JS body is trivial; the type is the work). `User` becomes the recurring fixture (§3).

#### Step 2.3 — `playground` — "Explore structural compatibility"

- **starter code sketch:** three type pairs (compatible same-shape; incompatible missing-field; compatible-with-extra-field via variable), assignment lines for each, and the excess-property pair: direct literal (errors) vs through a variable (doesn't).
- **invite-variation prompts (Maya contract — specific things to try):** "Remove `id` from `Contact` — what does the compiler say, and on which line? Add an extra field to the direct literal vs to an intermediate variable — why does one fail and the other not? Make `name` optional on one side only — in which direction does the assignment break?"
- **data.kind:** `"playground"`; harness carries the trivially-true `_t('explored', …)` assertion. A compile error here is feedback, not failure — the instruction says so.

---

### Lesson 3 — Narrowing: the compiler reads your control flow

> *What changes in the learner's head:* "Every `if (typeof x === …)` I've written for years is load-bearing now — the compiler re-types the variable inside the branch. A discriminated union plus an exhaustive `switch` turns 'did I handle every case?' from a code-review prayer into a compile error. Adding a variant and following the red squiggles IS the refactor workflow."

**Step distribution:** 1 `predict`, 1 `read`, 2 `kata`, 1 `challenge` = 5 steps. **The predict opens the lesson, before the read** (S028 panel review): Felipe holds the "static types can't change in a branch" folk model with commitment — read-first would spoil the reveal; predict-first is honest.

**Status:** outlined.

#### Step 3.1 — `predict` — "Inside the `if`, what type does `x` have?"

- **Lesson opener — no explanation precedes it** (see step-distribution note and §2.3).
- **snippet:** `function format(x: string | number) { if (typeof x === "string") { /* type of x here? */ } … }`
- **options (4):** `string` (**correct**); `string | number` *(the "static types don't move" model — the polyglot/JS reflex)*; `string & number` *(the intersection confusion)*; `any` *(the "checks are runtime-only, the compiler can't know" model)*.
- **correct:** `string`. Feedback for the correct answer extends: and in the `else`, `x` is `number` — the compiler subtracts what it learned.

#### Step 3.2 — `read` — "Narrowing: every `if` teaches the compiler something"

- **why_care topics:** pain first: the `string | undefined` from kata 1.3's optional param — how does code *use* a value that might not be there? Answer: the checks Felipe already writes, now understood by the compiler (the predict the learner just took is the proof they hold the old model).
- **body topic outline (~350 words):**
  - **The narrowing toolbox, priority order:** `typeof` (primitives), equality against a literal, `in` (property presence), `Array.isArray`. Each shown narrowing a union in two lines. These are JS idioms the reader has written for a decade — the delta is that the *static type changes* inside the branch.
  - **Discriminated unions:** the tag field. `type PaymentStatus = { kind: "pending" } | { kind: "authorized"; auth: string } | { kind: "captured"; tx: string } | { kind: "failed"; reason: string }` — `switch (s.kind)` narrows each case to its variant. Why the tag beats a bag of optionals (`{ status: string; auth?: string; tx?: string; reason?: string }` — the shape that lies).
  - **Exhaustiveness via `assertNever`:** `function assertNever(x: never): never` in the default case; if every variant is handled, the value reaching `default` is `never` and the call compiles; add a variant and it doesn't. **This is the "compiler as second reader during refactors" benefit, mechanism revealed** — the challenge makes it physical.
  - **User-defined type guards:** `function isUser(x: unknown): x is User` — for when built-in narrowing can't see the shape. One example; Lesson 4's boundary kata exercises it.
  - **Do NOT include:** `instanceof`/class narrowing (no classes in this scroll); the full control-flow-analysis table; `unknown` at depth (next lesson — named here only as the guard's parameter type).
- **closer:** forward prompt into the kata — "Chain the whole toolbox on a three-way union."

#### Step 3.3 — `kata` — `describe(x: string | number | string[]): string`

- **1-line task:** Chain the narrowing toolbox: return `"text: …"`, `"count: …"`, `"list of N"` per branch.
- **test shape:** runtime per branch; `@ts-expect-error` on `describe(true)`; order-sensitivity built into fixtures (`Array.isArray` must run before treating it as `string`-vs-`number` — arrays are objects).
- **hint sketch:** *"One of the three union members is not a primitive — `typeof` will tell you something unhelpful about it. Which stdlib function you already know distinguishes that case, and why does it have to come first?"*
- **why this kata:** 80%-confidence opener for the toolbox; the union input keeps `unknown` out (it isn't taught yet).

#### Step 3.4 — `kata` — Complete and dispatch a discriminated union *(production gesture G3)*

- **1-line task:** The starter defines two of `PaymentStatus`'s four variants (`pending`, `authorized` — fields per 3.2); write the other two (`captured`, `failed`), then implement `nextStates` with a `switch` on `s.kind`, closed by `assertNever` (provided in prelude). Defining the union is part of the gesture, not just consuming it.
- **starter note (untaught syntax, glossed):** `nextStates`'s signature is provided in the starter — `nextStates(s: PaymentStatus): PaymentStatus["kind"][]` — with a one-line gloss: `PaymentStatus["kind"]` is indexed access, "the type of the `kind` field"; Lesson 5 teaches it properly.
- **test shape:** runtime per variant (legal transitions per a transitions table in the instruction); `@ts-expect-error` on `nextStates({ kind: "shipped" })`; the `assertNever` default case is required by a test that strips a case and expects the compile to fail (authoring note: implemented as a commented illustration + the 3.5 challenge does it for real).
- **hint sketch:** *"Your `switch` default should never be able to run — and there is a way to have the compiler *guarantee* that instead of you promising it at code review. What type does a value have once it can no longer be any of the variants?"*

#### Step 3.5 — `challenge` — Add the `disputed` variant *(the second-reader moment)*

- **prompt:** Add `{ kind: "disputed"; case: string }` to `PaymentStatus`. The starter ships **three pre-written consumers** of the union, each closed with `assertNever`: `nextStates` (the 3.4 shape), `labelFor(s: PaymentStatus): string`, and `isTerminal(s: PaymentStatus): boolean`. Adding the variant breaks all three at once — **three sites the learner didn't write in this step**. Follow the compiler to every one; encode the new transitions (instruction supplies the business rule: `captured → disputed → captured | failed` — a dispute resolves back to captured or reverses to failed; every named kind is a real variant) and the new label/terminality.
- **framing in instruction:** this is the benefit the scroll's lens promised — *the compiler as a second reader during refactors*. In JS this change is a grep and a prayer over code you've never read; here the compiler hands you the checklist of every site.
- **budget:** ~15 min (2× kata). ≤1 hint. Not a gate.
- **test shape:** runtime for the new variant's transitions + `labelFor`/`isTerminal` outputs for `disputed` + all old variants unchanged across all three consumers; the pre-fix compile failure is demonstrated via the step's instruction narrative (the learner experiences it live on first run — three errors, three sites).

---

### Lesson 4 — `any`, `unknown`, and the boundary

> *What changes in the learner's head:* "`any` isn't a type, it's an off-switch — and it spreads. `unknown` is the honest type for data crossing a boundary: the compiler refuses to let me touch it until a guard proves the shape. `never` is 'this can't happen', and it's how exhaustiveness checks work under the hood. My `JSON.parse` habit just changed."

**Step distribution:** 1 `read`, 1 `kata`, 1 `playground` = 3 steps. No predict — the payoff is *choosing*, which is kata-shaped. *(The S026 draft's second kata here — an `assertNever` drill — duplicated gesture G3 and was cut at promotion.)*

**Status:** outlined.

#### Step 4.1 — `read` — "The three escape valves: when each one is fine"

- **why_care topics:** pain first, and it's autobiographical for the primary persona: the migration `any` that silenced a typo for six months. Felipe wrote that `any`. This lesson is the unlearning.
- **body topic outline (~350 words):**
  - **`any` first — the cost:** it turns checking off *and propagates* — `data.user.name.first` off an `any` is `any` all the way down; the bug surfaces at runtime, far from its source. The legitimate use: a deliberate escape hatch with a TODO (untyped third-party lib, mid-migration), i.e. a promise to come back — never a permanent state.
  - **`unknown` second — the boundary type:** accepts anything (like `any`), permits nothing until narrowed (unlike `any`). What `JSON.parse` should return; what `catch (e)` binds since TS 4.4 — a fact most JS-to-TS developers don't know and hit in week one. Pairs with Lesson 3's user-defined guards: `unknown` in, guard proves, typed value out.
  - **Figure:** `:figure[disambiguation]{id:"ts-unknown-vs-any"}` — identical skeletons (a value from outside, an attempted property access); divergent attribute: **what the compiler lets you do before narrowing** (`any`: everything, silently; `unknown`: nothing, loudly).
  - **`never` third:** the bottom type — no value inhabits it. Where the reader has already met it: `assertNever`'s parameter (Lesson 3). Also: functions that only `throw`, and unions that narrowing has emptied. `T | never` collapses to `T` — named for the playground.
  - **Closer:** `as` named-and-bounded with one worked example (a wrong cast over a parse result → runtime crash the compiler could no longer prevent): "a cast is a promise to the compiler; a guard is proof. Prefer proof." Zod-shaped schema-first boundaries named-and-deferred (§2.6). No kata exercises `as`.
  - **Do NOT include:** `as const` (named in L1, not exercised); double-cast `as unknown as T` (deep-dive); `satisfies` (Lesson 5 closer).
- **closer:** forward prompt into the boundary kata.

#### Step 4.2 — `kata` — `parseUser(input: string): User | string`

- **1-line task:** The boundary kata. Wrap `JSON.parse` so its result is `unknown`; write `isUser(x: unknown): x is User` (the `User` from Lesson 2 — retrieval); return the typed `User` or an error string.
- **starter shape:** `const parseJson = (s: string): unknown => { try { return JSON.parse(s); } catch { return null; } }` provided; the learner writes the guard and the orchestration.
- **test shape:** valid JSON+shape → `User`; malformed JSON → error string; valid JSON wrong shape (array, primitive, object missing `id`) → error string; optional fields present and absent both accepted. `@ts-expect-error` on accessing `.name` of the un-narrowed `unknown` (asserted in a commented illustrative line in testCode).
- **hint sketch:** per §2.5 — points at "the compiler refuses property access on `unknown`; what must you *prove* first, and what function shape teaches the compiler a proof?" without naming `is`.
- **why this kata:** the single most transferable TS skill for a working JS dev (every webhook, every fetch, every env var); 40%-stretch slot of the lesson; direct rehearsal for the capstone.

#### Step 4.3 — `playground` — "Explore `any`, `unknown`, `never` at the boundary"

- **starter code sketch:** the same parsed value typed as `any` (a dangerous deep chain that compiles) and as `unknown` (the same chain, refused); a `never`-returning `fail()`; `type Collapsed = string | never`.
- **invite-variation prompts:** "Chain two more accesses onto the `any` version — at what point does the compiler warn you? Change `any` to `unknown` — which exact line lights up? Add a branch that calls `fail()` and watch what the compiler infers for the return type. What type is left in `Collapsed`, and why does that make `assertNever` work?"
- **data.kind:** `"playground"`; compile errors are the lesson, per §2.4.

---

### Lesson 5 — Generics that earn their place — and the close

> *What changes in the learner's head:* "I felt the duplication before `<T>` showed up, so generics read as 'the parameter I would have written for the type'. `extends` is the promise about what T supports; `keyof`/`T[K]` is how key-based helpers stay typed end-to-end. The clever stuff (conditional types, mapped types, `infer`) — I can now *recognise* it and I know where the depth lives. And the capstone proved I can put the whole scroll together."

**Step distribution:** 1 `read`, 2 `kata`, 1 `challenge` (capstone) = 4 steps. No predict (§2.3); the call-site-inference reveal lives in kata 5.2's `Equal` assertions. *(The S026 draft's standalone advanced-types lesson is compressed into this lesson's closer per the Sprint 028 name-and-defer decision; the freed budget funds the capstone.)*

**Status:** outlined.

#### Step 5.1 — `read` — "Motivated generics — and the map of what comes next"

- **why_care topics:** opens by reproducing duplication from the learner's own scroll: `firstString` / `firstNumber` / `firstUser` (fixtures echo katas 2.2 and 3.3 — retrieval). Name the duplication; `<T>` enters as the parameter you'd have written for the type.
- **body topic outline (~350 words, the scroll's longest read):**
  - **`<T>` motivated;** inference at the call site (you almost never write `first<string>(…)` — the compiler reads the argument). **`extends` constraints** with one concrete case: `<T extends { id: string }>` — "T must at least have an `id`". **`keyof` + indexed access:** `<T, K extends keyof T>(obj: T, key: K): T[K]` — the typed-helper shape; mistyped keys become compile errors. Re-surface, recall-without-warning: *you already read `T[K]` in the wild — kata 3.4's provided `nextStates` signature was `PaymentStatus["kind"][]`.*
  - **One function-type annotation shown in passing** (a parameter spelled `guard: (x: unknown) => x is T` in an example), so the capstone's pre-written `parseWith` signature is readable when it arrives — shown, not drilled.
  - **When NOT to be generic:** a function used with one type isn't generic; speculative `<T>` is annotation-maximalism wearing a costume (callback to Lesson 1's rule).
  - **The named-and-deferred closer (recognition, not writing — one concrete use case each, per the §2.2 gate):** conditional types (`NonNullable<T>` as type-level `if`), mapped types (`Partial<T>` as a loop over keys), `infer` (`ReturnType<F>` names a matched part), template literal types (event-name remapping), brand types (nominal islands in a structural sea), `satisfies` (constrain without widening). Each with its deep-dive pointer per §2.6. Felipe's recognition bar: he follows Pocock — he's *seen* these; now he can place them.
  - **Do NOT include:** `<T, U, V>` cascades; writing any conditional/mapped type; React generic components (`<T,>` oddity deferred with them).
- **closer:** sets up the two katas and names the capstone explicitly: "Last step of the scroll: everything at once, on purpose."

#### Step 5.2 — `kata` — `first<T>(arr: T[]): T | undefined`

- **1-line task:** The textbook motivated generic. Implementation is one line of JS; the work is the signature and what it makes the call sites know.
- **test shape:** runtime on numbers/strings/`User[]`; **type-only:** `Equal<typeof first([1, 2]), number | undefined>`, `Equal<typeof first(["a"]), string | undefined>` — the call-site-inference reveal as assertions (this is where the draft's fifth predict went).
- **hint sketch:** points at "the return type must *depend on* the argument's element type — what syntax introduces a name for a type you don't know yet?"

#### Step 5.3 — `kata` — `pickKeys<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`

- **1-line task:** The constraint + indexed-access kata. The learner meets `Pick` here *because they need it* for the return type (§2.2 gate: introduced in the kata, not toured in the read).
- **test shape:** runtime shape preservation on `User` (retrieval); `@ts-expect-error` on `pickKeys(user, ["password"])`; `Equal` on the picked result type.
- **hint sketch:** points at "the `keys` array can't be just `string[]` — the compiler needs to know the strings are *keys of T*. Lesson 5.1 named the operator that produces 'the keys of a type'."
- **confidence slot:** 40% — the last regular exercise of the scroll, per the lesson-ordering heuristic.

#### Step 5.4 — `challenge` (capstone) — "A typed webhook, end to end"

> The scroll capstone per [README §5.3](../../README.md): last step of the scroll, integrates four lessons, one small real deliverable. **The instruction names the lessons it leans on** — Lesson 2 (shapes), Lesson 3 (discriminated unions + exhaustive narrowing), Lesson 4 (`unknown` at the boundary), Lesson 5 (generics) — so a stuck learner knows where to go back.

- **Deliverable:** a typed webhook processor — the function a working JS dev writes the week they adopt TS. Domain: shipment events (Felipe works at a logistics scale-up; deliberately *not* Lesson 3's payments domain, so G2/G3 are re-performed, not pasted). The learner writes:
  1. `type ShipmentEvent = { kind: "created"; id: string } | { kind: "scanned"; id: string; location: string } | { kind: "delivered"; id: string; signedBy?: string } | { kind: "lost"; id: string; lastSeen?: string }` — shapes with optional fields (L2) + discriminated union (L3).
  2. `isShipmentEvent(x: unknown): x is ShipmentEvent` — the boundary guard (L3 guard shape + L4 `unknown`), validating the tag and per-variant required fields.
  3. `parseWith<T>(raw: string, guard: (x: unknown) => x is T): T | null` — generic boundary helper (L5): `JSON.parse` in `try/catch`, guard the result. **Its signature is pre-written in the starter** (function-type + type-guard-parameter syntax is read in 5.1, never drilled); **the body is the work**: `try/catch`, call the guard, `null` on failure.
  4. `describeShipment(e: ShipmentEvent): string` — exhaustive `switch` + `assertNever` (L3), output varying with the optional fields (e.g. `"delivered #id (signed by X)"` vs `"delivered #id"`).
  5. `handleShipmentWebhook(raw: string): string` — the composition; `"invalid payload"` on `null`.
- **starter shape:** `assertNever` and the `_t`/`_eq` + `Equal` prelude provided; function skeletons with signatures *not* pre-written for 1, 2, and 4 (the gestures are the work), **pre-written for 3** (`parseWith` — the signature's function-type + type-guard-parameter syntax is beyond the drilled surface; the body is the work) and for 5 (the composition contract is given so tests can anchor).
- **test shape:** runtime: one valid payload per `kind`, optional-field present/absent variants for `delivered` and `lost`, malformed JSON, valid JSON wrong shape (missing tag, wrong tag, missing per-variant field). **The malformed and wrong-shape fixtures must flow through the composed `handleShipmentWebhook`, not only through `isShipmentEvent` directly** — a guard shortcut-ed with `as` then gets caught at runtime where it lies, not just at the guard's own call site (Felipe attack analysis, S028 panel). Type-only: `Equal<ReturnType<typeof parseWith<ShipmentEvent>>, ShipmentEvent | null>`-shaped assertion (exact spelling resolved at W2 against the harness; instantiation expression — TS ≥4.7, §7; the shape is load-bearing — it forces the generic); `@ts-expect-error` on a `describeShipment` call with an un-guarded `unknown`.
- **budget:** 20-25 min (2× kata). **Hints:** exactly one, high-level: *"The flow is `string → unknown → ShipmentEvent | null → string`. Each arrow is a function you already wrote once in Lessons 3-5 — here you write them again over a fresh domain and compose them."* Not a gate; failure is fine.
- **Outline-stage persona attack test (per README §5.3, recorded):** Felipe, having done katas 2.2 / 3.4 / 4.2 / 5.2, sketches: define the union like `PaymentStatus`, guard like `isUser` plus a tag check, switch like `nextStates` with `assertNever`, wrap parse like `parseUser` but generic like `first` — with `parseWith`'s signature already on the page, only its body to fill. Every move maps to an outlined step → the lesson set covers its own capstone. Felipe's shortcut attack (`as ShipmentEvent` inside the guard) is caught because the wrong-shape fixtures run through the composed `handleShipmentWebhook` (see test shape). Mariana's review question for W2: "is `parseWith` forced?" — resolution: it's the same wrap-the-boundary move Felipe ships weekly, and the signature is already starter-provided; if W2 smoke says it walls, the fallback is providing `parseWith` in full and keeping 1-2-4-5 as the work (capstone still integrates L2/L3/L4).

---

## 5. Sandbox notes

- **Runner:** Piston TypeScript — the **existing allowlisted path** at `/scrolls/execute` (Sprint 028 decision; iframe stays `javascript-dom`-only). Single-file execution: no DOM, no React, no `npm install`, no project-mode tsconfig, no multi-file imports. TS version pin confirmed at seed time via Piston `/runtimes` (§7); no 5.x-only feature is *required* by any kata.
- **Test harness: manual `_t` / `_eq`, consistent with Ruby and Python (Sprint 028 decision).** The legacy `typescript-fundamentals` harness (`TS_HARNESS_HEADER`/`FOOTER` with `test()`/`expect()`) **retires with the legacy scroll** — the new scroll uses the cross-scroll shape, translated to TS:
  - `const _tests: Array<{ name: string; passed: boolean; message?: string }> = []`
  - `function _t(name: string, fn: () => void)` — try/catch, push result
  - `function _eq<T>(actual: T, expected: T)` — deep equality via `JSON.stringify` (number-vs-string caught cleanly; `undefined`-vs-missing-key is not — flagged per-kata where it could matter, notably capstone optional fields)
  - Footer emits `__DOJO_RESULT__ <json>` for `ExecuteStep` to parse — same contract as Ruby/Python.
- **Type-only assertions:** `Equal<A, B>` helper in the starter prelude (`type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false`), consumed as `type _t1 = Equal<X, Y> extends true ? true : never`-style lines that fail the compile when wrong. The compile pass is the evaluator for these.
- **`@ts-expect-error` semantics:** the directive is the assertion — if the next line compiles, the compiler flags the directive itself → compile failure → step failure. Used in Lessons 1-5.
- **Compile-error verdict (load-bearing, verify before W3):** both mechanisms above require the Piston adapter to treat a TS compile-error exit as a *test failure with readable output*, not an opaque runtime crash. The legacy scroll never exercised this path (runtime assertions only). Smoke-test with a deliberately failing `Equal` and a violated `@ts-expect-error` before seeding Lesson 1 (§7).
- **Playground harness:** trivially-true `_t('explored', …)`; frontend `data.kind === "playground"` branch shipped with Ruby, reused by Python — no new work.
- **Determinism:** no `Math.random()` unseeded, no wall clock, no timers, no network. STDIN never exercised; inputs are function arguments.
- **Run timeout:** Piston's default is comfortable for single-file compile+run at these kata sizes; verify on the capstone (largest file) at smoke time.

---

## 6. References

To fill with exact item/chapter citations when prose lands (W2). Placeholder structure:

- Lesson 0 — *Programming TypeScript* (Cherny) "10,000 foot view"; Node.js type-stripping docs (<https://nodejs.org/api/typescript.html>); TS Handbook intro.
- Lesson 1 — *Effective TypeScript* 2nd ed. items on inference vs annotation (~items 18-23 territory); Handbook "Everyday Types" + "Type Inference".
- Lesson 2 — *Effective TypeScript* items on structural typing and excess-property checks (~items 4, 11); Handbook "Object Types"; *Learning TypeScript* ch. 4.
- Lesson 3 — *Effective TypeScript* items on narrowing/exhaustiveness (~items 22, 27-28); Handbook "Narrowing"; *Domain Modeling Made Functional* (Wlaschin) for the discriminated-union framing.
- Lesson 4 — *Effective TypeScript* items on `any`/`unknown` (~items 38-46); TS 4.4 release notes (`useUnknownInCatchVariables`); Sandi Metz "Schemas of Trust" for the boundary intuition.
- Lesson 5 — *Effective TypeScript* items on generics (~items 14-25) and on when type-level work pays (~items 50-55); Handbook "Generics"; Total TypeScript *Type Transformations* (named-and-deferred pointer).

---

## 7. Open questions / known gaps

- **Piston adapter on TS compile-error exit codes.** Lessons 1-5 lean on `Equal` lines and `@ts-expect-error`; "passing" sometimes means "the file compiled." The adapter must surface a compile failure as a readable test failure. The legacy scroll never exercised this path. **Verify before seeding Lesson 1** (deliberately failing `Equal` + violated `@ts-expect-error` smoke). If the adapter only inspects the runtime stream, the runner needs a small change — same open question the S026 draft carried; still unresolved.
- **TypeScript version pin.** Confirm via Piston `/runtimes` at seed time. Nothing in the scroll *requires* 5.x (`satisfies` and `const` type params are named-and-deferred only), but Lesson 0's read must reflect the actual sandbox version. Two floors to verify: the `catch`-is-`unknown` claim needs **TS ≥4.4**, and the capstone's `Equal<ReturnType<typeof parseWith<ShipmentEvent>>, …>` assertion uses an instantiation expression — **TS ≥4.7**. That assertion shape is load-bearing (it's what forces the generic to actually be exercised); W2 must keep it, not simplify it away.
- **Legacy kata salvage (decide at W2, per-kata).** Sprint 028 decision is rebuild; salvage only what survives the paragraph test (Ruby L3 precedent). MVP kata inventory: `greet`, `add`, `sum`, `fullname`, `fizzbuzz`, `palindrome`, `memoize`. Honest expectation: **most fail the new lens** — they are JS exercises with annotations, the exact frame the scroll replaces. `memoize` is the only one with a plausible re-skin (generic constraint exercise), and Lesson 5 already has stronger katas. Default: salvage nothing; revisit only if a W2 slot proves weak.
- **Capstone difficulty.** Five functions in 20-25 min is the top of the 2× budget. Smoke with Felipe + Mariana walks after the first W2 pass; declared fallback (recorded in §4 / 5.4): provide `parseWith` in full (its signature is already starter-provided), keep the union + guard + exhaustive switch + composition as the work — the capstone still integrates L2/L3/L4 and stays canon-compliant (≥3 lessons).
- **Hard-delete cascade.** `removeLegacyScrollBySlug` (used for `ruby-fundamentals`) deletes "everything that hangs off" the scroll; verify at W3 that learner-progress rows from Phase-0 smoke users are included in the cascade (or cascade-deleted explicitly) so the seed doesn't foreign-key-fail. Phase 0: cost of being wrong is one re-seed.
