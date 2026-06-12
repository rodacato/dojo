# TypeScript — Lesson 1: Inference — annotate less, the compiler already knows

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [typescript.md §4 Lesson 1](typescript.md#lesson-1--inference-annotate-less-the-compiler-already-knows) — the contract. Gates §2.1 (the Felipe test), §2.2 (no-type-system-flexing), §2.3 (predict placement), §2.5 (hint discipline), §2.7 (production gesture G1) apply.
> **Primary audience:** A4 Felipe (5yr JS, forced TS-strict migration, annotation-maximalist, `any` everywhere — holds "no annotation = any"). Auditor: A1 Mariana (TS senior — keeps the claimed benefits honest).
> **Step count:** 3 (1 `read` + 1 `predict` + 1 `kata`).
> **What changes in the learner's head:** "I've been annotating everything because I thought un-annotated meant untyped. It doesn't — the compiler infers almost everything from the values and the flow. The contract I owe is the **function signature**; inside it, inference carries the weight. `const` infers the literal; `let` widens."

This file holds the **production prose** for each step's fields. All content and meta-notes in English. The sandbox runs **TypeScript 5.0.3** under `strict`; no code here needs anything past 5.0.3. Embeds one `before-after` figure (`ts-annotation-maximalism`) — the lens, drawn.

**Harness note (applies to the `testCode` block in 1.3):** tests are written against the manual harness contract — `_t("user-facing sentence", () => { _eq(actual, expected) })` (and `_eqClose` for floating-point results), with `Equal<A, B>` lines and `@ts-expect-error` directives for type-level assertions. The exact harness header/footer (the `_t`/`_eq` definitions, the `Equal` prelude, the runner, `__DOJO_RESULT__` emission, and the deep-equal that distinguishes a missing key from an `undefined`-valued one per spec §5) lands with the seed (W3, `seed-scrolls-typescript.ts`). Authors write `testCode` against the contract, not the header.

---

## Step 1.1 — `read` — "The compiler already knows: inference over annotation"

**Title:** `The compiler already knows`
**Type:** `read`
**Word count target:** ~300 words (code blocks excluded). Felipe test §2.1 applied — the read names what *inference* adds, never what a variable is. Leads with the pain (no-flexing gate §2.2): every local annotated and still an `any` leaking through. Embeds the `before-after` figure (`ts-annotation-maximalism`). Ends with a forward prompt into the predict.

### `instruction` (markdown body)

```markdown
## Why this matters

Open your last TypeScript file. Every local has an annotation — `const total: number = 0`, `const items: string[] = []` — the signatures are half-duplicated into comments, and somewhere a value crossed a boundary as `any` and a typo rode it all the way to production. Here's the part the year of "TS-strict" never told you: the annotations on those locals were never the type safety. The *checker* was. And it was already doing its job on the lines you didn't annotate.

## Inference is the default, not a fallback

The compiler types un-annotated code from the values and the flow. `const items = ["a", "b"]` is `string[]` with zero annotations. A function's return type flows out of its body. A callback gets its parameter types from context — in `items.map(s => s.length)` the compiler already knows `s` is a `string`, so `.length` is checked. Annotation-free is not untyped. It never was.

## `const` infers the literal; `let` widens

```typescript
const status = "shipped"; // type is "shipped" — the exact literal
let phase = "shipped";    // type is string — it has to stay reassignable
```

This is your first sighting of literal types; Lesson 2 builds whole unions out of them. (`as const` freezes that literal inference across an object — named here, used there.)

## The rule: annotate the signature, infer the rest

Parameters can't be inferred from thin air — they **are** the contract, and annotating them is documentation the compiler enforces. So annotate signatures; let inference carry the locals.

```typescript
// Annotate the boundary. Let the body infer.
function totalPrice(prices: number[]): number {
  const subtotal = prices.reduce((sum, p) => sum + p, 0); // subtotal: number, inferred
  return subtotal * 1.08;                                  // return checked against : number
}
```

A return-type annotation is optional but worth it on exported functions: it locks the contract, so a mistake in the body errors *at the function*, not at fifty call sites. One signature form surprises every JS dev on day one — an `async` function's return annotation is `Promise<T>`, never just `T`.

:figure[before-after]{id="ts-annotation-maximalism"}

Before you write a signature, predict what the compiler already knows from the values alone.
```

### Authoring notes

- **Pain-first opening (§2.2):** the read opens with Felipe's real file — every local annotated, an `any` still leaking — then names the reframe (annotations weren't the safety; the checker was). The type that "fixes" it is inference doing work he didn't credit.
- **Signature-annotation stated as a positive duty** (the checked contract / documentation the compiler enforces), not as "annotations bad" — Leo's (S9) sign-off constraint in the spec.
- **`as const` named in one clause, not exercised** (Lesson 5 closer territory); `Promise<T>` return spelling named in one sentence (the day-one surprise), not drilled.
- **Figure slot:** the `before-after` lands after the rule paragraph, before the closer — it *is* the rule, drawn. Max-2-figures-per-read holds (this is the only one).

### Paragraph-test audit (Felipe test §2.1 — Valentina/Leo gate)

| Paragraph | What TypeScript-specific thing it adds | Verdict |
|---|---|---|
| "Why this matters" | The reframe: annotations on locals weren't the safety, the checker was — the lesson's whole premise, in the pain. | KEEP (pain-first per §2.2; no JS concept taught) |
| "Inference is the default" | That un-annotated ≠ untyped: literals, return flow, contextual callback params. The behavior Felipe most needs to update. | KEEP — ends in the `map` example with `s: string` inferred |
| "`const` infers the literal; `let` widens" | Literal-vs-widened inference — the day-one mechanics, and the seed of Lesson 2's unions. | KEEP — ends in the two-line `const`/`let` sample |
| "The rule: annotate the signature, infer the rest" | The cultural rule stated as a positive duty + the exported-return-locks-the-contract benefit + the `Promise<T>` surprise. | KEEP — ends in the `totalPrice` sample; figure pins it |
| Closer | Forward prompt into predict 1.2 ("predict what the compiler already knows"). | KEEP — read ends in the prompt, not prose drift |

**What got cut:** what type inference is conceptually (the examples carry it); Hindley-Milner trivia; `satisfies` (Lesson 5 closer); any JS variable-semantics reteach (`var`/`let`/`const` scoping — Felipe writes JS for a living); a second figure.

---

## Step 1.2 — `predict` — "What type is `total`?"

**Title:** `Predict: what type is total?`
**Type:** `predict`
**Mental model under test:** "no annotation = no type — it's all `any`." Felipe's annotation-maximalism in predicate form, and the single highest-leverage reveal in the lesson. The reduce chain has zero annotations and still resolves to `number` because inference flows through `reduce`'s signature and the initial value.

### `instruction` (short intro shown above the snippet)

```markdown
Not one annotation in this snippet. Commit to a type for `total` before you reveal.
```

### `question`

```
What type does `total` have?
```

### `snippet`

```typescript
const prices = [120, 80, 95];
const total = prices.reduce((sum, p) => sum + p, 0);
```

### `options`

```yaml
- id: a
  text: "`any` — nothing was annotated"
- id: b
  text: "`number`"
- id: c
  text: "`unknown` — the compiler can't be sure"
- id: d
  text: "`number | undefined` — empty arrays exist"
correct: b
```

### `feedback` (per option, sensei voice)

**a — `any` — nothing was annotated:**
> This is the model the whole lesson exists to break, so it's worth sitting with. `any` is what you get when the type system gives up — and it never gave up here. `prices` is `number[]` (inferred from the literal), `reduce`'s signature carries that element type into `sum` and `p`, the initial value `0` fixes the accumulator as `number`, and `sum + p` stays `number` the whole way down. TypeScript infers through the entire chain. You've been paying annotation tax on information the compiler already had.

**b — `number`:**
> Correct, and there's no annotation anywhere that says so. Inference flows from the array literal (`number[]`) into `reduce`, whose signature ties the accumulator's type to the initial value `0` — a `number`. `sum + p` is `number`; the result is `number`. The compiler read the values and the call, and concluded the type you'd have typed by hand.

**c — `unknown` — the compiler can't be sure:**
> This confuses inference with the boundary type. `unknown` is for values the compiler genuinely *cannot see* — JSON off the wire, a thrown error, anything that entered your program from outside the type system (Lesson 4). Here nothing entered from outside: `prices` is a literal the compiler can read end to end, so there's nothing to be unsure about. It infers `number`.

**d — `number | undefined` — empty arrays exist:**
> A sharp guess, and it's a real distinction — just not this overload. `reduce` *with an initial value* (the `0` here) always returns the initial value's type: `number`, never `number | undefined`, because the initial value is what comes back when the array is empty. The overload that omits the initial value is the dangerous one — `[].reduce((a, b) => a + b)` throws at runtime on an empty array. The `0` is what makes this safe and makes the type plain `number`.

### `reveal` — the inference walk (appended to every option's feedback at seed, so each path sees it)

```markdown
The chain, link by link:

- `const prices = [120, 80, 95]` — inferred `number[]` from the literal. No annotation.
- `reduce`'s initial value `0` is a `number`, which fixes the accumulator type: `sum` is `number`.
- `prices` is `number[]`, so the element `p` is `number`.
- `sum + p` is `number`; that's what each step returns, so `reduce` returns `number`.
- `total` is `number`.

The thesis of this lesson, restated: **un-annotated is not untyped.** The compiler inferred a precise type through a whole chain you didn't touch. The annotation you owe is the *signature* — the boundary where the compiler can't read your intent from values. Everything inside, it already knows.
```

### Authoring notes

- **Option `a` is the highest-leverage reveal** (the literal "no annotation = `any`" model). Its feedback is the lesson's thesis restated verbatim per the spec: *"TS infers through the whole chain; you've been paying annotation tax on information the compiler already had."*
- **Option `d` distinguishes the two `reduce` overloads** (with vs without initial value) per the spec — names the real runtime-throw case on the no-initial-value overload so the distinction is honest, not hand-waved.
- **Per-option feedback names the specific model** each option encodes (gave-up / boundary-confusion / overload-confusion), per the predict voice contract.
- **Reveal ships appended to each option's feedback at seed** (player `predict` schema has no separate reveal field — Rust 1.2 precedent).

---

## Step 1.3 — `kata` — "Give this function a signature" *(production gesture G1)*

**Title:** `Give this function a signature`
**Type:** `kata`
**1-line task:** A working but un-annotated function ships in the starter; write its signature — typed params, one **optional** param producing `string | undefined`, and an explicit return type.

### `instruction` (markdown body)

```markdown
## Your task

`applyDiscount` works today — it just has no types. Give it a signature: annotate the parameters, mark the one that's optional, and declare the return type. The body stays exactly as it is; the work is the contract on the first line.

One parameter doesn't always arrive. The caller may pass a discount `code` or may not:

```typescript
applyDiscount(200, 10)        // -> 180   (no code)
applyDiscount(200, 10, "VIP") // -> 171   (VIP code, extra 5% off)
```

Mark that parameter optional in the signature, and notice what its type becomes *inside* the function once you do — the body already handles the case where it's absent, so the type should reflect that it might be.

**On the test block below — read it, don't write it.** The tests mix two kinds of assertion:

- `_t("...", () => { _eq(actual, expected) })` — ordinary runtime checks on the three behaviors.
- Lines using `@ts-expect-error`, `Equal<...>`, and `ReturnType<typeof ...>` — these are *type-level* assertions, harness furniture. Read them as assertions; you don't write or edit them. The operators behind them (`ReturnType`, indexed access, `Equal`) are taught later in the scroll.

A word on `@ts-expect-error`, since this is where you first meet it: the directive **is** the assertion — it says "the next line must fail to compile." If that line ever starts compiling (because someone fixed the underlying type), the compiler flags the *directive itself* and the step fails. That makes it a sharp tool, not a test framework: a stale `@ts-expect-error` flips to a failure of its own. In this scroll it's test furniture; in your own code, keep it narrow and temporary.
```

### `starterCode`

```typescript
// applyDiscount(200, 10) -> 180 ; applyDiscount(200, 10, "VIP") -> 171
// Give this function a signature: typed params, an optional param, a return type.
function applyDiscount(price, percent, code) {
  const base = price * (1 - percent / 100);
  return code === "VIP" ? base * 0.95 : base;
}
```

### `testCode`

```typescript
// Test furniture — read, don't write. The _t/_eq runner, the Equal<A,B>
// prelude, and the __DOJO_RESULT__ footer land with the seed harness (W3).

// Runtime behavior:
_t("applies the percentage discount when no code is given", () => {
  _eqClose(applyDiscount(200, 10), 180);
});

_t("applies an extra 5% for a VIP code", () => {
  _eqClose(applyDiscount(200, 10, "VIP"), 171);
});

_t("ignores an unrecognised code", () => {
  _eqClose(applyDiscount(200, 0, "NOPE"), 200);
});

// Type-level assertions (furniture):
// @ts-expect-error price must be a number, not a string
applyDiscount("120", 10);

// @ts-expect-error price and percent are required
applyDiscount();

// the return type must be exactly number
type _r1 = Equal<ReturnType<typeof applyDiscount>, number> extends true ? true : never;
const _check1: _r1 = true;
```

### `hint`

```markdown
The third argument sometimes doesn't arrive — the body already guards for that with `code === "VIP"`. TypeScript has a way to mark a parameter as *may-be-absent* in the signature itself, rather than forcing every caller to pass it.

Once you mark it that way, ask what `code`'s type becomes *inside* the function: it's no longer just the text type you'd expect — the "might not be here" possibility is now part of the type, and the body has to be written so it survives that. The first two parameters carry no such doubt; they're always there.
```

### `referenceSolution`

```typescript
function applyDiscount(price: number, percent: number, code?: string): number {
  const base = price * (1 - percent / 100);
  return code === "VIP" ? base * 0.95 : base;
}
```

### `alternative_approach` (shown after pass)

```markdown
You may have spelled the optional parameter the long way:

```typescript
function applyDiscount(price: number, percent: number, code: string | undefined): number {
```

This compiles and types the body identically — `code` is `string | undefined` either way. The difference is at the *call site*: `code?: string` makes the argument genuinely optional (`applyDiscount(200, 10)` is legal), while `code: string | undefined` forces every caller to pass *something*, even if it's `undefined` (`applyDiscount(200, 10, undefined)`). When a parameter can be omitted, `?` is the honest spelling — it says "optional" at the boundary, not just "could be undefined" inside. The two only coincide on the body's view of the type; they differ on what callers are allowed to write.
```

### Why these tests

| Test | Lands |
|---|---|
| No-code path returns 180 | The default branch — the body runs with `code` absent, proving the optional param's `undefined` case is handled. |
| VIP path returns 171 | The named-code branch — the extra 5% applies. |
| Unrecognised code returns input | Guards a "fix" that treats any truthy `code` as VIP; only the literal `"VIP"` discounts. |
| `@ts-expect-error` on `applyDiscount("200", 10)` | A string `price` must be rejected at compile time — proves `price: number` is actually annotated, not left implicit-`any`. |
| `@ts-expect-error` on `applyDiscount()` | Missing required args must be rejected — proves `price`/`percent` are *not* optional (the `?` belongs only on `code`). |
| `Equal<ReturnType<typeof applyDiscount>, number>` | The return type is exactly `number` — proves the return annotation (or its inference) is right, not `any` or `number \| undefined`. |

### Hint-discipline check (§2.5)

The hint points at the *gap* — "a way to mark a parameter as may-be-absent" and "what does its type become inside the function" — without naming `?` or `string | undefined`. Removing the hint wouldn't change which identifier the learner types from the instruction alone, so the hint adds direction, not the answer. The instruction states the optional-param behavior via the call examples (`applyDiscount(200, 10)` legal) rather than naming the operator.

---

## Self-review checkpoint (before commit)

- [x] Read 1.1 under ~300 words (code blocks excluded); paragraph audit included; what got cut is named.
- [x] Read 1.1 **leads with the pain** (annotated locals + leaking `any`; the checker, not the annotations, was the safety) per the no-flexing gate §2.2.
- [x] Read 1.1 covers **`const`-literal vs `let`-widened** inference and states the rule **"annotate the signature, infer the rest"** as a positive duty (Leo's constraint).
- [x] Read 1.1 carries the `:figure[before-after]{id="ts-annotation-maximalism"}` and ends with a **forward prompt into the predict**.
- [x] Predict 1.2 is the un-annotated `reduce` chain; options include `any` ("nothing was annotated") and the correct `number`; option `a`'s feedback **restates the lesson's thesis** verbatim; option `d` distinguishes the two `reduce` overloads.
- [x] Kata 1.3 is **production gesture G1** — the learner signs the function with typed params, one **optional** param (`string | undefined`), and a return type.
- [x] Kata 1.3 instruction carries the **`@ts-expect-error`-is-a-sharp-tool note** (assertion here, stale one flips to a failure) and the **"test furniture — read, don't write"** note for the `Equal`/`ReturnType`/`@ts-expect-error` scaffolding.
- [x] `testCode` is **mixed**: runtime `_t("sentence", () => _eq(...))` assertions AND `@ts-expect-error` / `Equal` type-level assertions; test names are user-facing sentences; deterministic.
- [x] Hint is concept-level (§2.5) — never names `?` or `string | undefined`; direct voice, no "great try," no "we'll see later."
- [x] All code compiles under TypeScript 5.0.3 under `strict`; nothing needs >5.0.3 (`@ts-expect-error` ≥3.9; `ReturnType`/indexed access/`Equal` all pre-5.0). No `tsc` error *output* is quoted in this lesson, so no `verify-at-smoke` text fence is required.
- [x] One figure embedded (`before-after` — `ts-annotation-maximalism`); data spec below.
- [x] Every word in English — titles, instructions, hints, options, feedback, code comments, captions, meta-notes.

---

## Figure data spec

Read 1.1 embeds `:figure[before-after]{id="ts-annotation-maximalism"}` after the "annotate the signature, infer the rest" paragraph.

### `ts-annotation-maximalism` (`before-after`) — embedded in Step 1.1

- **Slot:** after the `totalPrice` sample, before the closer prompt. Max-2-figures-per-read rule holds (this is the only one).
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Schema (per figure)](../../INTERACTIVITY-PATTERNS.md#schema-per-figure)):
  ```ts
  {
    type: 'before-after',
    id: 'ts-annotation-maximalism',
    language: 'typescript',
    left: {
      title: 'Annotation-maximalism — every local annotated',
      code: [
        'function totalPrice(prices: number[]): number {',
        '  const count: number = prices.length;',
        '  const subtotal: number = prices.reduce(',
        '    (sum: number, p: number): number => sum + p,',
        '    0',
        '  );',
        '  const taxed: number = subtotal * 1.08;',
        '  return taxed;',
        '}',
      ].join('\n'),
      annotations: [
        { line: 2, mark: '✕', text: 'prices.length is already number — the annotation restates the obvious' },
        { line: 4, mark: '✕', text: 'reduce already infers sum and p from prices and the initial value' },
        { line: 7, mark: '✕', text: 'subtotal * 1.08 is already number — noise, not safety' },
      ],
    },
    right: {
      title: 'Inference-led — annotate the signature, infer the rest',
      code: [
        'function totalPrice(prices: number[]): number {',
        '  const count = prices.length;',
        '  const subtotal = prices.reduce((sum, p) => sum + p, 0);',
        '  const taxed = subtotal * 1.08;',
        '  return taxed;',
        '}',
      ].join('\n'),
      annotations: [
        { line: 1, mark: '✓', text: 'the signature is the contract — parameters and return type, annotated once' },
        { line: 3, mark: '✓', text: 'sum, p, and subtotal are all inferred as number — zero annotations, fully checked' },
      ],
    },
    caption:
      'Both functions type-check identically. The left pane annotates every local — none of it adds safety the checker did not already provide; it adds noise that drifts out of sync the day the body changes. The right pane annotates only the signature (the boundary the compiler cannot read intent from) and lets inference carry the locals. The contract is the line worth writing by hand; the rest, the compiler already knows.',
  }
  ```
- **Why this earns embedding (Tier-S paragraph test):** the prose states the rule ("annotate the signature, infer the rest"); the figure makes the *contrast* physical — the same function, ✕ on every annotated local on the left, ✓ on the signature-only contract line on the right. Deleting it forces a prose walk through the before/after that the read has no word budget for, and loses the visual that *is* the lens. It also pre-loads kata 1.3, where the learner writes exactly the right-pane signature.
- **`before-after` fit:** left = the smell (annotation-maximalism, Felipe's habit), right = the idiom (signature-only). Pedagogy lives in the contrast, not in either pane alone — not a decorative variant (the panes differ in *what carries the type*, not in surface syntax), so it clears the §Anti-patterns "decorative `before-after`" auto-reject.
