# TypeScript — Lesson 3: Narrowing: the compiler reads your control flow

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [typescript.md §4 Lesson 3](typescript.md#lesson-3--narrowing-the-compiler-reads-your-control-flow) · gates: [typescript.md §2.1–§2.7](typescript.md#2-sub-course-authoring-notes)
> **Primary audience:** A4 Felipe (5yr JS → TS, `any`-reflex, follows Pocock). Benefits auditor: A1 Mariana (TS senior).
> **Step count:** 5 (1 `predict` + 1 `read` + 2 `kata` + 1 `challenge`). **The predict opens the lesson, before the read** (typescript.md §2.3): Felipe holds "static types can't change inside a branch" with commitment, so predict-first is the honest order — a read-first sequence would spoil the reveal.
> **What changes in the learner's head:** "Every `if (typeof x === …)` I've written for years is load-bearing now — the compiler re-types the variable inside the branch. A discriminated union plus an exhaustive `switch` turns 'did I handle every case?' from a code-review prayer into a compile error. Adding a variant and following the red squiggles to every broken site IS the refactor workflow."

This file holds the **production prose** for each step's `instruction` / `feedback` / `starterCode` / `testCode` fields. All content in English. Every quoted `tsc` excerpt is a smoke-capture placeholder: shape is correct for TypeScript 5.0.3 under `strict`, exact text re-captured from Piston at the Lesson 3 smoke batch (typescript.md §5).

**Harness note (applies to every `testCode` block below):** tests are written against the planned manual harness contract — `_t("user-facing sentence", () => { _eq(actual, expected) })`, plus `@ts-expect-error` and `Equal<A, B>` lines for type-only assertions. `assertNever(x: never): never` is provided in the starter prelude from this lesson on (typescript.md §3 retrieval). The exact harness header/footer lands at seed (W3) per typescript.md §5; `_eq` is key-presence-aware (see Lesson 2's harness note).

---

## Step 3.1 — `predict` — "Inside the `if`, what type does `x` have?" *(lesson opener)*

**Title:** `Predict: inside the if, what type does x have?`
**Type:** `predict`
**Lesson opener — no explanation precedes it** (typescript.md §2.3). **Mental model under test:** "the static type can't change inside a branch" — the JS/polyglot daily-driver folk model. The whole lesson is the unlearning, so the predict has to come first or the read spoils it.

### `instruction` (short intro shown above the snippet)

```markdown
No read yet. Before this lesson explains anything, commit to an answer — your guess here is the lesson's starting line.
```

### `question`

```
Inside the `if`, on the marked line, what type does `x` have?
```

### `snippet`

```typescript
function format(x: string | number): string {
  if (typeof x === "string") {
    // what type is `x` here?
    return x;
  }
  return x.toFixed(2);
}
```

### `options`

```yaml
- id: a
  text: "`string` — the compiler knows the typeof check passed"
- id: b
  text: "`string | number` — a static type can't change inside a branch"
- id: c
  text: "`string & number` — both, intersected, since both were possible"
- id: d
  text: "`any` — type checks happen at compile time, the compiler can't read a runtime `if`"
correct: a
```

### `feedback` (per option, sensei voice)

**a — `string`:**
> Correct. The `typeof x === "string"` check isn't just a runtime guard — the compiler reads it and **re-types `x` to `string` for the rest of that branch**. And it subtracts what it learned: in the code after the `if`, `x` is `number`, which is why `x.toFixed(2)` is legal there and would have been an error above. This is *narrowing*, and the read step is about how much of your existing control flow already does it.

**b — `string | number`:**
> This is the model the whole lesson exists to break — the daily-driver assumption from JS and most other languages that a variable's static type is fixed once declared. In TypeScript it isn't: the type flows through your control flow. The `typeof` check narrows `x` to `string` inside the branch, and to `number` after it. The check you wrote to make the code *run* correctly is the same check the compiler reads to make the code *type* correctly.

**c — `string & number`:**
> The intersection of `string` and `number` is `never` — no value is both at once, so this can't be what `x` is inside a branch you can actually reach. The check *removes* the `number` possibility rather than combining the two: inside `typeof x === "string"`, `x` is exactly `string`. Narrowing subtracts, it doesn't intersect.

**d — `any`:**
> The "checks are runtime-only, the compiler can't see into an `if`" model. It can — control-flow analysis is one of the type system's core jobs. The compiler reads `typeof x === "string"` at *compile* time and narrows `x` to `string` for that branch; nothing becomes `any`. (`any` is a real type with real costs, but it's something you opt into, not what narrowing produces — that's Lesson 4.)
```

### `reveal` (appended to every option's feedback at seed, so each path sees it)

```markdown
The shape to carry into the read: **every `if`, `typeof`, and equality check you write teaches the compiler something about the variable**, and the type inside the branch reflects it. Inside `typeof x === "string"`, `x` is `string`. After it, `x` is `number` — the compiler subtracted what the branch ruled out. You've written these checks for a decade; what's new is that they're now load-bearing for types, not just for runtime.
```

### W2/seed smoke gate (authoring, not learner-facing)

Per typescript.md §2.3 / §4 step 3.1: if the correct-answer rate on 3.1 exceeds ~60% at smoke, Felipe's committed folk model ("static types can't change in a branch") isn't as committed as assumed — **demote 3.1 to a post-read micro-quiz or cut it**. Predict-first is justified *only* by the committed wrong model; without it, the predict spoils nothing and earns nothing, and the read should lead the lesson instead. Decide at the Lesson 3 smoke before seeding.

---

## Step 3.2 — `read` — "Narrowing: every `if` teaches the compiler something"

**Title:** `Narrowing: every if teaches the compiler something`
**Type:** `read`
**Word count target:** ~350 (Felipe test §2.1 applied — audit below; no-flexing gate §2.2: each tool opens with the bug it prevents). **Comes after the predict** (typescript.md §2.3): the predict the learner just took is the proof they held the old model, and the read names that.

### `instruction` (markdown body)

```markdown
## Why this matters

Lesson 2's optional fields handed you a `string | undefined` — a value that might not be there. So did the optional parameter in Lesson 1. You already narrow these in JS by reflex (`typeof`, `Array.isArray`); the delta is that the compiler now reads the same checks and tracks the type through each branch. If you just predicted `string | number` for that branch, you were holding the old model; here's the one that's actually true.

## The narrowing toolbox

Four checks, in rough order of how often you'll reach for them. Each one re-types the variable *inside* its branch:

```typescript
function describe(x: string | number | string[]): string {
  if (typeof x === "string") return x.toUpperCase();   // x: string here
  if (Array.isArray(x)) return `${x.length} items`;    // x: string[] here
  return x.toFixed(2);                                  // x: number — what's left
}
```

- **`typeof`** for primitives (`"string"`, `"number"`, `"boolean"`, …).
- **Equality against a literal** (`if (status === "ready")`) narrows to that literal.
- **`in`** for property presence (`if ("email" in user)`).
- **`Array.isArray`** for arrays — needed because `typeof [] === "object"`, so `typeof` alone can't separate an array from other objects.

These are JS idioms you've written for years. The delta is the comment on each line: the *static type changes* inside the branch.

## Discriminated unions: the shape that doesn't lie

When you model a value that's in one of several states, the reflex is a bag of optionals:

```typescript
// The shape that lies — every field optional, no field tells you which state you're in.
type Payment = { status: string; auth?: string; tx?: string; reason?: string };
```

The honest shape gives each state its own variant, joined by a shared **tag** field:

```typescript
type PaymentStatus =
  | { kind: "pending" }
  | { kind: "authorized"; auth: string }
  | { kind: "captured"; tx: string }
  | { kind: "failed"; reason: string };
```

Now `switch (s.kind)` narrows each `case` to exactly its variant — inside `case "authorized"`, `s.auth` exists and is a `string`; reach for `s.tx` there and it's a compile error.

## Exhaustiveness with `assertNever`

Here's the payoff the scroll has been promising. Put this in the `default`:

```typescript
function assertNever(x: never): never {
  throw new Error(`unhandled: ${JSON.stringify(x)}`);
}
```

If every variant is handled, the value reaching `default` is `never`, and `assertNever(s)` compiles. Add a fifth variant and forget to handle it — that value is no longer `never`, the call stops compiling, and the compiler points at the exact `switch` you missed. That's the **compiler as a second reader during refactors**: the next two steps make it physical.

## When built-in checks can't see the shape

For a value whose type the compiler genuinely can't infer — JSON off the wire, an `unknown` from a boundary — you write a **user-defined type guard**: a function whose return type is `x is User`. One example; Lesson 4 puts it to work.

Next: chain the toolbox on a three-way union.
```

### Felipe-test audit (§2.1 — every paragraph must lose something TS-specific if cut)

| Paragraph | What a JS-fluent reader loses if cut | Verdict |
|---|---|---|
| "Why this matters" | the pain (a `string \| undefined` / multi-type value) + names the predict as proof of the old model | KEEP (opener — licensed lead-in) |
| "The narrowing toolbox" | the four checks re-typing the variable inside the branch — the type-system effect, not the JS check | KEEP — ends in a compiling sample |
| "Discriminated unions" | the tag field + why it beats a bag of optionals (the shape that lies); per-case narrowing | KEEP — both shapes shown |
| "Exhaustiveness with `assertNever`" | the `never`-reaches-default mechanism = compile-time exhaustiveness; the refactor benefit's mechanism | KEEP — the lesson's thesis |
| "Type guards" | `x is User` as the escape when built-in narrowing can't see the shape; sets up Lesson 4 | KEEP (one example) |

**What got cut (per §2.1 / §2.6):** `instanceof` / class narrowing (no classes in this scroll); the full control-flow-analysis table (drilling it is tour-grade); `unknown` at depth (Lesson 4 — named here only as the guard's parameter type); user-defined guard *internals* (one example, exercised in Lesson 4, not drilled here).

---

## Step 3.3 — `kata` — `describe(x: string | number | string[]): string`

**Title:** `Narrow a three-way union with the toolbox`
**Type:** `kata`
**1-line task:** `describe(x: string | number | string[]): string` — return `"text: …"`, `"count: …"`, `"list of N"` per branch, using the narrowing toolbox.

### `instruction` (markdown body)

```markdown
## Your task

Write `describe(x: string | number | string[]): string`. The input is one of three types; the output names which:

- a `string` → `"text: "` followed by the string itself (e.g. `"text: hello"`)
- a `number` → `"count: "` followed by the number (e.g. `"count: 42"`)
- a `string[]` → `"list of N"` where `N` is the array's length (e.g. `"list of 3"`)

Each branch narrows `x` to one type, and inside that branch `x` has only that type's methods. One ordering trap is built into the tests — find it.

### What's expected

```typescript
describe("hello")        // "text: hello"
describe(42)             // "count: 42"
describe(["a", "b"])     // "list of 2"
describe([])             // "list of 0"
```
```

### `starterCode`

```typescript
function describe(x: string | number | string[]): string {
  // Your code here
}
```

### `testCode`

> Harness preamble lands at seed (W3) per typescript.md §5. The `_t("sentence", () => { _eq(...) })` calls below are the contract.

```typescript
_t("labels a string as text", () => {
  _eq(describe("hello"), "text: hello");
});

_t("labels a number as a count", () => {
  _eq(describe(42), "count: 42");
});

_t("labels an array by its length, not its contents", () => {
  _eq(describe(["a", "b"]), "list of 2");
});

_t("handles an empty array", () => {
  _eq(describe([]), "list of 0");
});

// @ts-expect-error — boolean is not in the union; the signature rejects it.
describe(true);
```

### `hint`

```markdown
One of the three union members is not a primitive, and `typeof` will tell you something unhelpful about it — the same word it gives every object. Which built-in check, that you already use, distinguishes that one case? And here's the ordering trap: that check has to run *before* you treat `x` as a plain value, or the branch order narrows the array case away into the wrong arm.
```

### `referenceSolution`

```typescript
function describe(x: string | number | string[]): string {
  if (Array.isArray(x)) return `list of ${x.length}`;
  if (typeof x === "string") return `text: ${x}`;
  return `count: ${x}`;
}
```

### `alternative_approach` (shown after pass)

```markdown
The branch order is flexible *as long as* `Array.isArray` is tested before you lean on `x` being a scalar — put the `typeof x === "string"` check first and the array case still works, because narrowing subtracts as it goes: by the final `return`, `x` is whatever the earlier branches didn't claim. What breaks is `typeof x === "object"` as a stand-in for "it's the array" — that's the exact reason `Array.isArray` exists, since `typeof [] === "object"` and so does `typeof {}`.
```

### Why these tests

| Test | Lands |
|---|---|
| string → text | Base case, the `typeof === "string"` arm. |
| number → count | The fall-through arm; `x` is `number` once string and array are subtracted. |
| array → list of 2 | The `Array.isArray` arm; checks length, not contents. |
| empty array | Smallest array; `0` must come through, not be treated as falsy and skipped. |
| `@ts-expect-error` on `describe(true)` | The signature is the contract — a type outside the union is a compile error, so `unknown` never has to enter the picture (it isn't taught yet). |

---

## Step 3.4 — `kata` — Complete and dispatch a discriminated union *(production gesture G3)*

**Title:** `Finish the PaymentStatus union and dispatch it exhaustively`
**Type:** `kata`
**1-line task:** The starter defines two of `PaymentStatus`'s four variants; write the other two, then implement `nextStates` as a `switch` on `s.kind`, closed by `assertNever`.

### `instruction` (markdown body)

```markdown
## Your task

The starter defines two variants of `PaymentStatus` — `pending` and `authorized`. Finish the type and the function:

1. **Add the two missing variants** to the union: `captured` (carries a `tx: string`) and `failed` (carries a `reason: string`). Each variant has the shared `kind` tag plus its own fields.
2. **Implement `nextStates(s)`** — a `switch (s.kind)` returning the legal next states for each:
   - `pending` → `["authorized", "failed"]`
   - `authorized` → `["captured", "failed"]`
   - `captured` → `[]` (terminal)
   - `failed` → `[]` (terminal)
3. **Close the `switch` with `assertNever`** in the `default`. If you've handled every variant, the value reaching `default` is `never` and the call compiles. That's not decoration — it's the compiler guaranteeing your `switch` is exhaustive, the next challenge proves why.

The signature `nextStates(s: PaymentStatus): PaymentStatus["kind"][]` is provided. `PaymentStatus["kind"]` is *indexed access* — "the type of the `kind` field", i.e. `"pending" | "authorized" | "captured" | "failed"`. Lesson 5 teaches it properly; here, just read it as "an array of kind strings".

### What's expected

```typescript
nextStates({ kind: "pending" })                  // ["authorized", "failed"]
nextStates({ kind: "authorized", auth: "a1" })   // ["captured", "failed"]
nextStates({ kind: "captured", tx: "t1" })       // []
nextStates({ kind: "failed", reason: "card" })   // []
```
```

### `starterCode`

```typescript
type PaymentStatus =
  | { kind: "pending" }
  | { kind: "authorized"; auth: string };
  // Add the two missing variants: captured (tx: string), failed (reason: string).

function nextStates(s: PaymentStatus): PaymentStatus["kind"][] {
  switch (s.kind) {
    // Your cases here.
    default:
      return assertNever(s);
  }
}
```

### `testCode`

> Harness preamble lands at seed (W3); `assertNever` is provided in the prelude. The `_t("sentence", () => { _eq(...) })` calls below are the contract.

```typescript
_t("pending can move to authorized or failed", () => {
  _eq(nextStates({ kind: "pending" }), ["authorized", "failed"]);
});

_t("authorized can move to captured or failed", () => {
  _eq(nextStates({ kind: "authorized", auth: "a1" }), ["captured", "failed"]);
});

_t("captured is terminal", () => {
  _eq(nextStates({ kind: "captured", tx: "t1" }), []);
});

_t("failed is terminal", () => {
  _eq(nextStates({ kind: "failed", reason: "card" }), []);
});

// @ts-expect-error — "shipped" is not a variant of PaymentStatus.
nextStates({ kind: "shipped" });
```

### `hint`

```markdown
Two jobs. First, each missing variant is a shape with the shared `kind` tag plus one field that only that state needs — model `captured` and `failed` on the two the starter already shows you. Second, your `switch` default should be *unreachable*: there's a way to have the compiler **guarantee** that instead of you promising it at review. What type does a value have once the `switch` has ruled out every variant it can be — and what does passing that value to a function expecting exactly that type tell the compiler?
```

### `referenceSolution`

```typescript
type PaymentStatus =
  | { kind: "pending" }
  | { kind: "authorized"; auth: string }
  | { kind: "captured"; tx: string }
  | { kind: "failed"; reason: string };

function nextStates(s: PaymentStatus): PaymentStatus["kind"][] {
  switch (s.kind) {
    case "pending":
      return ["authorized", "failed"];
    case "authorized":
      return ["captured", "failed"];
    case "captured":
      return [];
    case "failed":
      return [];
    default:
      return assertNever(s);
  }
}
```

### `alternative_approach` (shown after pass)

```markdown
You could drop the `assertNever` and let the function compile without it — every case returns, so TypeScript is happy today. The reason to keep it: it's the difference between a `switch` that's *currently* exhaustive and one the compiler *holds* exhaustive forever. The next challenge adds a variant; with `assertNever` in place, this function stops compiling and tells you it needs a new case. Without it, the function would compile fine and silently fall through to a `default` you didn't write — a bug that ships. The three-line guard is cheap insurance against the refactor you'll do six months from now.
```

### Why these tests

| Test | Lands |
|---|---|
| pending → [authorized, failed] | The transition table's branching state. |
| authorized → [captured, failed] | The second branching state; per-variant fields (`auth`) accessible only inside its case. |
| captured terminal | An empty-array return; catches a `default`-driven solution that returns the wrong thing. |
| failed terminal | The fourth variant present and handled; without it `assertNever` would refuse to compile. |
| `@ts-expect-error` on `{ kind: "shipped" }` | A non-variant tag is a compile error — the union is closed, which is what makes exhaustiveness checkable. |

---

## Step 3.5 — `challenge` — Add the `disputed` variant *(the second-reader moment)*

**Title:** `Add a variant and let the compiler find every site`
**Type:** `challenge`
**1-line task:** Add a fifth variant to `PaymentStatus`. Three pre-written consumers — each closed with `assertNever` — break at once; follow the compiler to all three.

### `instruction` (markdown body)

```markdown
## The challenge

This is the benefit the scroll's lens promised: **the compiler as a second reader during a refactor.** In JavaScript, adding a state to a payment model is a grep across the codebase and a prayer that you found every place that switches on it. Here, the compiler hands you the checklist.

The starter ships `PaymentStatus` and **three consumers** of it — `nextStates`, `labelFor`, and `isTerminal` — each one a `switch (s.kind)` closed with `assertNever`. You didn't write these in this step; treat them as code you inherited.

Add one variant: `{ kind: "disputed"; case: string }` — a payment a customer has contested. The moment you add it, **all three consumers stop compiling**, because each one's `assertNever` now receives a value that isn't `never` anymore. Follow each error to its `switch` and add the `disputed` case:

- **`nextStates`** — a dispute resolves back to `captured` or reverses to `failed`, so `disputed → ["captured", "failed"]`.
- **`labelFor`** — return `"disputed (case #…)"` interpolating the `case` field.
- **`isTerminal`** — `disputed` is not terminal (it can still move), so `false`.

Leave the other variants' behavior unchanged.

**Budget:** ~15 minutes (about 2× a kata). One hint available. This isn't a gate — if you stall, the solution is there.
```

### `starterCode`

```typescript
type PaymentStatus =
  | { kind: "pending" }
  | { kind: "authorized"; auth: string }
  | { kind: "captured"; tx: string }
  | { kind: "failed"; reason: string };
  // Add the disputed variant: { kind: "disputed"; case: string }

function nextStates(s: PaymentStatus): PaymentStatus["kind"][] {
  switch (s.kind) {
    case "pending":
      return ["authorized", "failed"];
    case "authorized":
      return ["captured", "failed"];
    case "captured":
      return [];
    case "failed":
      return [];
    default:
      return assertNever(s);
  }
}

function labelFor(s: PaymentStatus): string {
  switch (s.kind) {
    case "pending":
      return "awaiting authorization";
    case "authorized":
      return `authorized (${s.auth})`;
    case "captured":
      return `captured (${s.tx})`;
    case "failed":
      return `failed: ${s.reason}`;
    default:
      return assertNever(s);
  }
}

function isTerminal(s: PaymentStatus): boolean {
  switch (s.kind) {
    case "pending":
      return false;
    case "authorized":
      return false;
    case "captured":
      return true;
    case "failed":
      return true;
    default:
      return assertNever(s);
  }
}
```

### `testCode`

> Harness preamble lands at seed (W3); `assertNever` is provided in the prelude. The pre-fix compile failure is experienced live on first run — three errors, three sites — per the instruction narrative; these tests assert the post-fix behavior.

```typescript
// The new variant's behavior across all three consumers.
_t("a disputed payment can return to captured or move to failed", () => {
  _eq(nextStates({ kind: "disputed", case: "c1" }), ["captured", "failed"]);
});

_t("a disputed payment labels with its case number", () => {
  _eq(labelFor({ kind: "disputed", case: "c1" }), "disputed (case #c1)");
});

_t("a disputed payment is not terminal", () => {
  _eq(isTerminal({ kind: "disputed", case: "c1" }), false);
});

// The old variants must be untouched across all three consumers.
_t("existing transitions are unchanged", () => {
  _eq(nextStates({ kind: "pending" }), ["authorized", "failed"]);
  _eq(nextStates({ kind: "authorized", auth: "a1" }), ["captured", "failed"]);
});

_t("existing labels are unchanged", () => {
  _eq(labelFor({ kind: "captured", tx: "t1" }), "captured (t1)");
  _eq(labelFor({ kind: "failed", reason: "card" }), "failed: card");
});

_t("existing terminality is unchanged", () => {
  _eq(isTerminal({ kind: "captured", tx: "t1" }), true);
  _eq(isTerminal({ kind: "pending" }), false);
});
```

### `hint`

```markdown
Don't go hunting for the call sites by reading the code — let the compiler hand them to you. Add the `disputed` variant to the type first, then run: the three `assertNever` calls each light up because each now receives a value that's still a live variant instead of `never`. Each error names the function and the line. Fix them in any order; the type tells you when you've caught all three (the errors stop). That's the entire workflow this lesson was built to teach — the change is the variant, the checklist is the compiler's.
```

### `referenceSolution`

```typescript
type PaymentStatus =
  | { kind: "pending" }
  | { kind: "authorized"; auth: string }
  | { kind: "captured"; tx: string }
  | { kind: "failed"; reason: string }
  | { kind: "disputed"; case: string };

function nextStates(s: PaymentStatus): PaymentStatus["kind"][] {
  switch (s.kind) {
    case "pending":
      return ["authorized", "failed"];
    case "authorized":
      return ["captured", "failed"];
    case "captured":
      return [];
    case "failed":
      return [];
    case "disputed":
      return ["captured", "failed"];
    default:
      return assertNever(s);
  }
}

function labelFor(s: PaymentStatus): string {
  switch (s.kind) {
    case "pending":
      return "awaiting authorization";
    case "authorized":
      return `authorized (${s.auth})`;
    case "captured":
      return `captured (${s.tx})`;
    case "failed":
      return `failed: ${s.reason}`;
    case "disputed":
      return `disputed (case #${s.case})`;
    default:
      return assertNever(s);
  }
}

function isTerminal(s: PaymentStatus): boolean {
  switch (s.kind) {
    case "pending":
      return false;
    case "authorized":
      return false;
    case "captured":
      return true;
    case "failed":
      return true;
    case "disputed":
      return false;
    default:
      return assertNever(s);
  }
}
```

### `alternative_approach` (shown after pass)

```markdown
Notice what you *didn't* do: you never grepped for `"pending"` to find the switches, and you never wondered whether there was a fourth consumer hiding in a file you forgot. The compiler enumerated the sites for you — three errors, three fixes, done when the errors stop. That's the whole argument for discriminated unions plus `assertNever` over a bag of optional fields: the bag-of-optionals version would have compiled fine with `disputed` half-handled, and the gap would have surfaced as a wrong label in production. The exhaustiveness check converts a runtime bug into a compile error you can't ignore.
```

### Seed-time gate (W3 — authoring, not learner-facing)

Per typescript.md §4 step 3.5 (C7): the "compiler hands you the checklist of three sites" benefit only lands if **each** pre-written consumer (`nextStates`, `labelFor`, `isTerminal`) closes its `switch` with `assertNever`. A string- or boolean-returning `switch` with no exhaustiveness check would fall through silently, and adding `disputed` would break **one** site (or none), gutting the challenge's whole point. Verify at seed that all three consumers in the seeded starter carry `assertNever`, and **smoke that adding the `disputed` variant produces three compile errors, not one**, before seeding.

### Why these tests

| Test | Lands |
|---|---|
| disputed → nextStates | The new variant's transition; passes only if the `nextStates` case was added. |
| disputed → labelFor | The new label, interpolating the `case` field — exercises the variant's own data. |
| disputed → isTerminal | The new variant marked non-terminal; the third consumer was found and fixed. |
| existing transitions unchanged | Catches a "fix" that broke an old `nextStates` case while adding the new one. |
| existing labels unchanged | Same, for `labelFor` — the refactor touched only what it should. |
| existing terminality unchanged | Same, for `isTerminal` — all three consumers correct, old behavior intact. |

---

## Self-review checkpoint (before commit)

- [x] Lesson is **predict-first** (3.1 opens, before read 3.2) per typescript.md §2.3; the predict's intro states "no read yet"; the W2/seed smoke gate (demote/cut if >60% correct at smoke) is recorded.
- [x] Predict 3.1 options include the correct `string` and the folk model `string | number` ("types can't change in a branch"), plus `string & number` (intersection confusion) and `any` (checks-are-runtime model); per-option feedback names the specific model (predict voice contract); the correct-answer feedback extends to the `else` being `number`.
- [x] Read 3.2 under ~350 words (code excluded); leads with the pain (the `string | undefined` from the optional param) and names the predict as proof of the old model; Felipe-test audit table included; what got cut is named.
- [x] Read 3.2 covers the toolbox (`typeof`, equality, `in`, `Array.isArray`), discriminated unions with a tag vs the bag-of-optionals that lies, `assertNever` exhaustiveness, and user-defined guards (one example, deferred to L4).
- [x] Kata 3.3: narrowing toolbox on `string | number | string[]`; `Array.isArray`-before-scalar ordering trap built into fixtures and tests (empty array + the `typeof [] === "object"` note in `alternative_approach`); `@ts-expect-error` on a non-union type keeps `unknown` out.
- [x] Kata 3.4 (gesture G3): starter gives 2 of 4 variants; learner writes the other 2 plus the `switch` closed with `assertNever` (provided in prelude); `PaymentStatus["kind"]` indexed-access glossed and deferred to L5; `@ts-expect-error` on a non-variant tag.
- [x] Challenge 3.5: starter ships **three** pre-written consumers (`nextStates`, `labelFor`, `isTerminal`), **each** closed with `assertNever`; adding `disputed` breaks all three (sites the learner didn't write); ≤1 high-level hint; ~15 min budget stated; not a gate. The seed-time gate (all three must carry `assertNever`; smoke that the variant produces three errors, not one) is recorded per C7.
- [x] Harness: `_t("sentence", () => { _eq(...) })` + `@ts-expect-error`/`Equal<>` for type assertions; `assertNever` in prelude; harness-lands-at-seed and key-presence-aware-`_eq` notes carried. All tests deterministic, user-facing names.
- [x] Hint discipline (§2.5): 3.3's hint names neither `Array.isArray` nor the order outright as a solution; 3.4's hint points at "what type does a value have once every variant is ruled out" without naming `never` or `assertNever`; 3.5's single hint is high-level (let the compiler enumerate the sites).
- [x] All code TypeScript 5.0.3 under `strict`, single-file, nothing needing >5.0.3 (no `satisfies`, no `const` type params, no instantiation expressions in this lesson).
- [x] Voice direct, "you", no celebration, no "simply/just/obviously", no emoji. Every word in English — titles, instructions, hints, options, feedback, comments.
