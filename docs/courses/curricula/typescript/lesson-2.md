# TypeScript — Lesson 2: Shapes: the type system is structural

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [typescript.md §4 Lesson 2](typescript.md#lesson-2--shapes-the-type-system-is-structural) · gates: [typescript.md §2.1–§2.7](typescript.md#2-sub-course-authoring-notes)
> **Primary audience:** A4 Felipe (5yr JS → TS, `any`-reflex, follows Pocock). Benefits auditor: A1 Mariana (TS senior).
> **Step count:** 3 (1 `read` + 1 `kata` + 1 `playground`).
> **What changes in the learner's head:** "The compiler reads *shape*, not name — this is the duck typing I already practice in JS, now checked. Optional fields are part of the shape, and the compiler forces me to handle the absence. `type` by default, `interface` for one specific job. A fixed set of named values is a literal union — not a bare string, and not an `enum` that ships a runtime object."

This file holds the **production prose** for each step's `instruction` / `feedback` / `starterCode` / `testCode` fields. All content in English. Every quoted `tsc` excerpt is a smoke-capture placeholder: shape is correct for TypeScript 5.0.3 under `strict`, exact text is re-captured from Piston at the Lesson 2 smoke batch (typescript.md §5).

**Harness note (applies to every `testCode` block below):** tests are written against the planned manual harness contract — `_t("user-facing sentence", () => { _eq(actual, expected) })`, plus `@ts-expect-error` and `Equal<A, B>` lines for type-only assertions. The exact harness header/footer (the `_t`/`_eq` definitions, the `Equal` prelude, the `__DOJO_RESULT__` emission) lands at seed (W3) per typescript.md §5. **Binding seed-time gate for this lesson:** `_eq` must be **key-presence-aware** — it distinguishes a *missing* key from a key set to `undefined` (`{}` is not equal to `{ name: undefined }`). A bare `JSON.stringify` equality stringifies both identically and would silently pass the exact bug this lesson teaches against (optional fields). Kata 2.2's fixtures exercise this distinction directly; smoke the harness on them **before seeding Lesson 2** (typescript.md §5).

---

## Step 2.1 — `read` — "Shapes: the compiler reads structure, not names"

**Title:** `Shapes: the compiler reads structure, not names`
**Type:** `read`
**Word count target:** ~350 (Felipe test §2.1 applied to every paragraph — audit below; no-flexing gate §2.2 satisfied: each rule opens with the bug it prevents). Embeds one `disambiguation` figure (`ts-union-vs-enum`) beside the literal-unions paragraph; figure data at end of file.

### `instruction` (markdown body)

```markdown
## Why this matters

A field that should only ever hold `"idle"`, `"loading"`, or `"ready"`, typed as `string`. Someone writes `"laoding"`, review approves it, and it breaks in production where no test was looking. The type system has two tools that make that typo a compile error: shapes pin down what a value contains; literal unions pin down which values a field may hold.

## Object types and optional fields

A `type` describes the shape a value must have:

```typescript
type User = { id: string; name?: string };
```

The `?` on `name` means the field may be absent, and the compiler forces every read of it to handle that. The `user.name.trim()` that crashed with *Cannot read properties of undefined* in your JS is a compile error here: `name` is `string | undefined`, and `undefined` has no `.trim()`. The benefit isn't the annotation — it's that the absent case can no longer be forgotten.

## Structural compatibility: shape, not name

Two types with matching shapes are interchangeable — no `implements`, no registration, no shared base class. This is the duck typing you already practise in JS, with a reader checking the duck. A value with **extra** fields still satisfies a narrower type, as long as it arrives through a variable:

```typescript
type Named = { name: string };
const account = { name: "Ada", role: "admin" };
const n: Named = account; // fine — account has everything Named needs
```

## The excess-property surprise

The one asymmetry that bites everyone in week one: the same extra field is *rejected* when the value is an object literal written directly at the annotation.

```typescript
type User = { id: string };
const a: User = { id: "1", age: 3 };   // error: 'age' does not exist in type 'User'
const raw = { id: "1", age: 3 };
const b: User = raw;                    // no error — same fields, via a variable
```

Excess-property checking is a deliberate extra pass that fires only on fresh literals, to catch typo'd property names (`naem`) where you wrote them. Through a variable, structural compatibility takes over and the extra field is allowed. The playground pokes exactly this.

## `type` vs `interface`, in one rule

Reach for `type` by default; reach for `interface` only when you need declaration merging or are augmenting an external module's types — both rare in application code. That's the whole rule.

## Literal unions, over strings and over `enum`

For a fixed set of named values, the right type is a **literal union**:

```typescript
type Status = "idle" | "loading" | "ready";
```

This beats `string` (the typo `"laoding"` is now a compile error) and it beats `enum`. The difference from `enum` isn't style — it's **runtime footprint**: a literal union erases to nothing, while an `enum` emits a real JavaScript object into your bundle. The figure shows the actual emitted output of each, side by side.

:figure[disambiguation]{id="ts-union-vs-enum"}

`enum` still has a place — interop with code that already ships one — but that's a deep-dive concern (`typescript-build-and-config`), not your default. Default to the union.

Next: write a shape with optional fields and a function that survives them.
```

### Felipe-test audit (§2.1 — every paragraph must lose something TS-specific if cut)

| Paragraph | What a JS-fluent reader loses if cut | Verdict |
|---|---|---|
| "Why this matters" | the pain the two tools resolve (typo'd field, forgotten-absence crash) | KEEP (opener — licensed lead-in) |
| "Object types and optional fields" | `?` makes the field `T \| undefined` and the compiler *forces* handling the absence — a type-system effect, not JS | KEEP |
| "Structural compatibility" | shape-not-name + width subtyping via a variable; the explicit "this is your duck typing, now checked" delta | KEEP |
| "The excess-property surprise" | the literal-vs-variable asymmetry — pure type-system behaviour with no JS analogue | KEEP |
| "`type` vs `interface`" | the one daily-life rule (and which job picks `interface`) — a cultural rule §2.1 sanctions | KEEP (one sentence; never revisited) |
| "Literal unions" + figure | literal types as a typo gate + the runtime-footprint delta vs `enum` (the figure renders the real emitted JS) | KEEP |

**What got cut (per §2.1 / §2.6):** classes (out of crash scope); nominal-typing comparative theory (Felipe has no nominal reflex — one sentence of `enum` contrast is the whole nominal mention); `readonly` and index signatures beyond no mention at all; mapped/conditional types (Lesson 5 closer); declaration-merging mechanics (named, deferred to `typescript-advanced-types`); what static typing *is* (the reader gets it from the examples).

---

## Step 2.2 — `kata` — Define the shape and consume it *(production gesture G2)*

**Title:** `Define a User shape and read its optional fields safely`
**Type:** `kata`
**1-line task:** Define `type User = { id: string; name?: string; email?: string }` and implement `getDisplayName(user: User): string` — return `name` if present, else `email`, else `id`. The gesture is *writing the shape*; the body is JS you already know.

### `instruction` (markdown body)

```markdown
## Your task

Define a `User` shape and a function that reads it without crashing on the missing pieces.

1. **`type User`** — three fields: `id` is always present (a `string`); `name` and `email` are **optional** strings. The optionality is the point — say it in the type, so the compiler holds you to it.
2. **`getDisplayName(user: User): string`** — return the first of these that's present: `name`, then `email`, then `id`. `id` is never absent, so the function always returns a `string`.

`User` is the shape you'll keep using — it comes back in Lesson 4 (a boundary guard) and Lesson 5 (a key-picking helper). Get its three fields right here and you read it without re-explanation later.

### What's expected

```typescript
getDisplayName({ id: "u1", name: "Ada" })                    // "Ada"
getDisplayName({ id: "u2", email: "ada@dojo.dev" })          // "ada@dojo.dev"
getDisplayName({ id: "u3" })                                 // "u3"
getDisplayName({ id: "u4", name: "Ada", email: "x@y.z" })    // "Ada"
```
```

### `starterCode`

```typescript
// Define `type User` here: id (always present), name and email (optional).

function getDisplayName(user: User): string {
  // Your code here
}
```

### `testCode`

> Harness preamble (`_t` / `_eq` / `Equal` definitions, the `__DOJO_RESULT__` footer) lands at seed (W3) per typescript.md §5. The `_t("sentence", () => { _eq(...) })` calls below are the contract. **`_eq` is key-presence-aware** for the optional-field fixtures (see harness note at top); the absent-vs-present-but-`undefined` pair below depends on it.

```typescript
_t("uses name when name is present", () => {
  _eq(getDisplayName({ id: "u1", name: "Ada" }), "Ada");
});

_t("falls back to email when name is absent", () => {
  _eq(getDisplayName({ id: "u2", email: "ada@dojo.dev" }), "ada@dojo.dev");
});

_t("falls back to id when both name and email are absent", () => {
  _eq(getDisplayName({ id: "u3" }), "u3");
});

_t("prefers name over email when both are present", () => {
  _eq(getDisplayName({ id: "u4", name: "Ada", email: "x@y.z" }), "Ada");
});

// A key set to `undefined` must behave like an absent key — falls through to id.
// This is the fixture the key-presence-aware _eq exists for: { name: undefined }
// stringifies the same as {} but is a distinct shape the function must survive.
_t("treats a name set to undefined the same as a missing name", () => {
  _eq(getDisplayName({ id: "u5", name: undefined }), "u5");
});

// @ts-expect-error — id is required; a User without it does not type-check.
getDisplayName({ name: "Ada" });

// The return type is exactly string (never string | undefined), because id is the floor.
type _t1 = Equal<ReturnType<typeof getDisplayName>, string> extends true ? true : never;
const _check1: _t1 = true;
```

### `hint`

```markdown
Two of the three fields may be missing, and the type has to say so — once you mark a field optional, its type inside the function becomes "the string, or `undefined`". The body then has to survive that: which JS operator you already reach for every day collapses "the first one of these that actually exists" into a single expression? The shape is the new work; the fallback chain is the JS you already write.
```

### `referenceSolution`

```typescript
type User = { id: string; name?: string; email?: string };

function getDisplayName(user: User): string {
  return user.name ?? user.email ?? user.id;
}
```

### `alternative_approach` (shown after pass)

```markdown
`??` is the precise tool here (it falls through only on `null`/`undefined`), but `user.name || user.email || user.id` also passes — the fields are strings, and an empty `name` falling through to `email` is arguably the behavior you want anyway. The reason `??` is the safer default in real code: `||` also falls through on `""`, `0`, and `false`, which bites the day a legitimate empty-string or zero value should have been kept. Either way, the work was the *shape* — the compiler now refuses any call site that forgets `id`.
```

### Why these tests

| Test | Lands |
|---|---|
| name present | Base case — the first fallback link. |
| name absent, email present | The middle link; catches a body that only ever reads `name`. |
| both absent → id | The floor; `id` is the guaranteed return, which is why the type is `string` not `string \| undefined`. |
| both present → prefers name | Order matters; catches a fallback chain written backwards. |
| name set to `undefined` → id | The §5 key-presence gate made physical: `{ name: undefined }` is a distinct shape from `{}`, and both must fall through to `id`. Requires the key-presence-aware `_eq`. |
| `@ts-expect-error` on missing `id` | The shape's required field is enforced at compile time — the whole reason to write the type. |
| `Equal<ReturnType<…>, string>` | The return is exactly `string`; the optional fields don't leak `undefined` into the result. |

---

## Step 2.3 — `playground` — "Explore structural compatibility"

**Title:** `Playground: explore structural compatibility`
**Type:** `kata` (with `data.kind: "playground"` — verdict UI hidden, run button reads "↻ Try it", trivially-true harness assertion, per the contract inherited from Ruby/Python/Rust)
**Mental model under exploration:** the compiler reads shape not name; excess-property checking fires on literals but not through a variable; optionality is directional. **For a JS dev, the first thing to learn here is that the red squiggle IS the output** — a compile error in a playground is feedback, not failure.

### `instruction` (markdown body)

```markdown
## Try it

This step is a playground — no verdict, no pass/fail. The button runs whatever the file says. The catch for a type-system playground: **the output you're reading is the compiler's, not the program's.** A red squiggle (and the `tsc` error under it) is the result you came to see — not a failure to fix. When a prompt below says "what does the compiler say", the error message *is* the answer.

The starter carries **four numbered prompts as comments** — work through them in order. Each is an uncomment or a one-token edit; none asks you to re-type code from this instruction.

1. **Prompt 1** removes a required field. You know the assignment will break — the question is *what the compiler says, and on which line*. Read the message: that's the skill.
2. **Prompt 2** is the excess-property asymmetry from the read: the same extra field, once on a direct literal and once through a variable. One errors, one doesn't. Predict which before you uncomment.
3. **Prompt 3** makes a field optional on one side only. The assignment breaks in exactly one direction. Find which, and say why in your head before checking.
4. **Prompt 4** is open: change a field's type on one side and watch where the incompatibility surfaces. There's no "right" answer — you're building a feel for which direction structural compatibility flows.
```

### `starterCode`

```typescript
type Contact = { id: string; name: string };

const full = { id: "c1", name: "Ada" };
const ok: Contact = full; // compiles — shape matches

// 1. Remove `id` from `Contact` above (leave `full` as it is). What does the
//    compiler say about the `ok` assignment, and on which line — the type, or
//    the assignment? Predict, then check.

// 2. Excess-property asymmetry. Uncomment both lines:
// const direct: Contact = { id: "c2", name: "Bo", role: "admin" };
// const viaVar = { id: "c3", name: "Cy", role: "admin" };
// const indirect: Contact = viaVar;
//    One of these errors on `role`, one does not. Which, and why?

// 3. Optionality is directional. Uncomment:
// type Loose = { id: string; name?: string };
// const strict: Contact = ({ id: "c4", name: "Di" } as Loose);
//    The assignment breaks in one direction only. Which way is safe — a value
//    that MIGHT be missing a field flowing into one that REQUIRES it, or the
//    reverse? Read the error to confirm your guess.

// 4. Open: give `full` a field a number where `Contact` wants a string, or vice
//    versa, and watch which line the incompatibility lands on.
```

### `testCode`

```typescript
// Playground: trivially-true assertion keeps the backend uniform; the frontend
// hides the verdict UI. Harness header/footer land at seed (W3).

_t("explored structural compatibility", () => { _eq(true, true); });
```

### `referenceSolution`

```typescript
// Playground — no solution to reach. The prompts are observations, not a target.
// Prompt 1 surfaces TS2741 ("Property 'id' is missing"); prompt 2 surfaces TS2353
// ("Object literal may only specify known properties") on the direct literal only;
// prompt 3 surfaces TS2741/TS2322 in the unsafe direction. Each is the lesson.
```

### Maya-gate check (S11 — playground voice contract)

The instruction does not reduce to "play around": prompt 1 demands reading the message and locating the line; prompt 2 demands a prediction about the literal-vs-variable asymmetry before uncommenting; prompt 3 demands a directional prediction; only prompt 4 is open, and it's explicitly framed as feel-building, not a target. The prompts ship **inside the starter as numbered comments** — trying one is an uncomment or a one-token edit, never a re-type from the instruction. The "red squiggle IS the output" framing is stated in the instruction's first paragraph, per the W2 requirement for the JS-dev first-thing-to-try: a JS dev expects stdout, and the playground's whole point is that here the *compiler's* output is the result.

### Smoke note (authoring, not learner-facing)

Verify at the Lesson 2 smoke that tsc 5.0.3 emits the expected codes: prompt 1 → `TS2741` (property missing); prompt 2's direct literal → `TS2353` (excess property), the via-variable line → no error; prompt 3's unsafe direction → `TS2741`/`TS2322`. If any prompt produces a different code or compiles clean where an error is expected, the prompt wording ("what does the compiler say") still stands, but re-check the snippet against the captured behavior before seeding.

---

## Self-review checkpoint (before commit)

- [x] Read 2.1 under the ~350-word ceiling (code blocks excluded); Felipe-test audit table included; what got cut is named (§2.1 / §2.6).
- [x] No-flexing gate (§2.2): every rule opens with the bug it prevents — the typo'd field (literal unions), the forgotten-absence crash (optional `?`), the typo'd property name (excess-property check). No tour-grade prose.
- [x] Structural typing framed as "the duck typing you already practise, now checked" — **not** oversold as "now safe"; the benefit is the compiler checking the duck, stated as such.
- [x] Excess-property asymmetry shown with both halves (direct literal errors, via-variable doesn't) in the read and re-poked in the playground.
- [x] Literal unions framed over `string` AND over `enum`; the `enum` divergence is **runtime footprint only**; `enum` flagged legacy/interop and deferred (§2.6).
- [x] Figure `ts-union-vs-enum` is a `disambiguation`, `highlightAttribute: "runtime footprint"` ONLY; the typo-safety and interop rows render unhighlighted; entries carry the **real tsc-emitted output** (enum's runtime JS object vs the union's empty output), marked captured-at-seed (figure data below).
- [x] Kata 2.2 (gesture G2): learner writes the *shape* (starter does not pre-define `User`) plus the safe consumption; the optional-field handling is the point; `User` set up as the recurring fixture (§3).
- [x] Kata 2.2 harness distinguishes missing key from `undefined` (§5 gate): the `{ name: undefined }` fixture is present, with a note that `_eq` is key-presence-aware and a smoke-before-seed reminder.
- [x] Playground 2.3: `data.kind: "playground"`, trivially-true assertion; four numbered prompts inside the starter; **prompt 1 teaches that the red squiggle IS the output**; instruction states explicitly that a compile error here is feedback, not failure.
- [x] All `tsc` error mentions sit on a `text` fence where shown verbatim; smoke-verification noted (`<!-- verify-at-smoke -->` carried in the figure data and smoke notes). All code is TypeScript 5.0.3 under `strict`, single-file, no feature needing >5.0.3 (no `satisfies`, no `const` type params, no instantiation expressions in this lesson).
- [x] Hint discipline (§2.5): kata 2.2's hint points at optionality and at "the JS operator you already use" without naming `?`, `??`, or `||`.
- [x] Voice: direct, addresses "you", no celebration, no "simply/just/obviously", no emoji. Every word in English — titles, instructions, hints, comments, captions.

---

## Figure data spec

Read 2.1 embeds `:figure[disambiguation]{id="ts-union-vs-enum"}` beside the "Literal unions, over strings and over `enum`" paragraph.

### `ts-union-vs-enum` (`disambiguation`) — embedded in Step 2.1

- **Slot:** directly after the `type Status = "idle" | "loading" | "ready"` sample, before the "`enum` still has a place" deferral sentence.
- **Authoring note (typescript.md §4 step 2.1, orchestrator adjudication):** this stays a `disambiguation`, not a `metric-pair` — the runtime-footprint contrast is **categorical** (N lines vs 0), not a ≥3× ratio that would justify a metric device. ONLY **runtime footprint** carries `highlightAttribute` (single-dimension rule); the `typo safety` and `interop / reverse mapping` rows render as plain unhighlighted attribute rows. The footprint values render the **real `tsc`-emitted JavaScript** for each construct — the union's empty output and the enum's runtime object — **captured at seed** from tsc 5.0.3, not paraphrased. The point only lands if Felipe *sees* the lines the enum costs him.
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ```ts
  {
    type: 'disambiguation',
    id: 'ts-union-vs-enum',
    sharedSkeletonLabel: 'A fixed set of named string values',
    attributes: [
      'runtime footprint',
      'typo safety',
      'interop / reverse mapping',
    ],
    entries: [
      {
        title: 'Literal union',
        source: `type Status = "idle" | "loading" | "ready";`,
        values: {
          // verify-at-smoke: tsc 5.0.3 --emit on the `source` above.
          // Expected: types erase entirely — the emitted .js is empty.
          'runtime footprint':
            '// emitted JavaScript (captured at seed):\n// (empty — the type erased; zero bytes ship)',
          'typo safety':
            'A wrong value is a compile error: `"laoding"` does not satisfy the union.',
          'interop / reverse mapping':
            'No reverse map; you carry the string values directly — usually what you want.',
        },
      },
      {
        title: 'enum',
        source: `enum Status { Idle = "idle", Loading = "loading", Ready = "ready" }`,
        values: {
          // verify-at-smoke: tsc 5.0.3 --emit on the `source` above.
          // Expected shape (a real runtime object via an IIFE); exact text re-captured at seed.
          'runtime footprint':
            '// emitted JavaScript (captured at seed):\n' +
            'var Status;\n' +
            '(function (Status) {\n' +
            '    Status["Idle"] = "idle";\n' +
            '    Status["Loading"] = "loading";\n' +
            '    Status["Ready"] = "ready";\n' +
            '})(Status || (Status = {}));',
          'typo safety':
            'Also a compile error on a wrong member — same protection as the union.',
          'interop / reverse mapping':
            'Ships a runtime object; numeric enums also build a reverse map. The reason to reach for it is interop, not defaults.',
        },
      },
    ],
    highlightAttribute: 'runtime footprint',
    caption:
      'Same set of named values, one divergent attribute: the union erases to nothing, the enum emits a runtime object into your bundle. typo-safety is a tie. Default to the union; reach for enum only when interop forces it.',
  }
  ```
  <!-- verify-at-smoke: tsc 5.0.3 — capture the real emitted .js for both `source` fields and replace the placeholders above before seeding. -->
- **Why this earns embedding:** the union-vs-`enum` choice is a daily early-TS decision, and the two read as interchangeable until you see the bundle. The figure forces the eye to the one dimension (runtime footprint) that actually decides it, and renders the real emitted code so the magnitude is *seen*, not asserted — deleting it would push the read to describe the emitted object in a paragraph it doesn't have the word budget for.
