# TypeScript — Lesson 4: `any`, `unknown`, and the boundary

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [typescript.md §4 Lesson 4](typescript.md#lesson-4--any-unknown-and-the-boundary) — the contract. Gates: [typescript.md §2.1 Felipe test](typescript.md#21-the-felipe-test--gate-for-every-read-paragraph), [§2.2 no-type-system-flexing](typescript.md#22-the-no-type-system-flexing-gate--for-every-type-shown), [§2.4 playgrounds](typescript.md#24-playgrounds-as-kata-variant-inherited-from-ruby), [§2.4a read+inline](typescript.md#24a-readinline-placement), [§2.5 hint discipline](typescript.md#25-hint-discipline), [§2.6 footgun deferral](typescript.md#26-footgun-deferral-discipline).
> **Primary audience:** A4 Felipe (5yr JS, zero real TS — the `any`-reflex, the `as` that silences a red squiggle). Reviewer lens: A1 Mariana (TS senior, keeps the benefit claims honest).
> **Step count:** 3 (1 `read+inline` + 1 `kata` + 1 `playground`).
> **What changes in the learner's head:** "`any` isn't a type, it's an off-switch — and it spreads. `unknown` is the honest type for data crossing a boundary: the compiler refuses to let me touch it until a guard proves the shape. `never` is 'this can't happen'. My `JSON.parse` habit just changed."

This file holds the **production prose** for each step's `instruction` / `feedback` / `data.interactions` / `testCode` / etc. fields. All content in English. Every quoted `tsc` excerpt is a smoke-capture placeholder: shape is correct for the 5.0.3 family, exact text is re-captured from Piston at the Lesson 4 smoke batch (typescript.md §5).

**Harness note (applies to every `testCode` block below):** tests are written against the planned manual harness contract — `_t("user-facing sentence", () => { _eq(actual, expected) })`, with `Equal<A, B>` / `@ts-expect-error` as the type-only assertion channels. The exact harness header/footer (the `_t`/`_eq` definitions, the `Equal` prelude, `assertNever`, the `__DOJO_RESULT__` emission for `ExecuteStep`) lands at seed (W3) per typescript.md §5. **Key-presence-aware `_eq` (BINDING, §5 gate):** a `JSON.stringify`-based equality cannot tell a *missing* key from a key set to `undefined` (`{}` and `{ name: undefined }` stringify identically). Kata 4.2 accepts `User` values with optional fields present *and* absent, so the seeded `_eq` must treat missing-vs-`undefined` as distinct (a structural deep-equal), or the optional-field fixtures pass a test that doesn't verify the shape. Smoke an optional-field fixture against the harness before seeding this lesson.

---

## Step 4.1 — `read+inline` — "The three escape valves: when each one is fine"

**Title:** `any, unknown, never — the three escape valves`
**Type:** `read+inline`
**Word count target:** ~350 (spec §4 4.1). Felipe test §2.1 applied (every paragraph names something the *type system* adds — propagation, the boundary refusal, the bottom type — not a JS concept Felipe already owns). No-flexing gate §2.2: the read opens with the bug each valve prevents or causes. **One interaction** (`catch-is-unknown` micro-quiz, per §2.4a), anchored after the `unknown` paragraph. Carries one `disambiguation` figure (`ts-unknown-vs-any`, data at end of file).

### `instruction` (markdown body, with interaction marker)

```markdown
## Why this matters

You have written this `any`. Mid-migration, a third-party payload came in untyped, a red squiggle wouldn't go away, and `: any` made it stop — and then for six months a renamed field (`user.fullName` that was now `user.name`) read as `undefined` in production and nobody's editor said a word. That `any` didn't type the value. It turned the type checker off and let the hole travel. This lesson is about the three types you reach for at a boundary, and which one is honest.

## `any` — the off-switch that spreads

`any` is not "some type". It is "stop checking", and the damage is that it **propagates**:

```typescript
const data: any = JSON.parse(payload);
const first = data.user.name.first;  // first is `any` — no error, no help
first.toUpperCase().slice(99).whatever();  // all of this compiles
```

Every access off an `any` is `any` again, all the way down, so the bug surfaces at runtime far from where the `any` entered. The one legitimate use is a deliberate escape hatch with a `// TODO` and a named cost — an untyped third-party lib, a mid-migration seam — a *promise to come back*, never a resting state.

## `unknown` — the honest boundary type

`unknown` accepts anything `any` accepts, and permits nothing until you narrow it:

```typescript
const data: unknown = JSON.parse(payload);
data.user;  // Error: 'data' is of type 'unknown'.
```

This is what `JSON.parse` *should* return and what `catch (e)` binds since TS 4.4. It pairs with the user-defined type guards from Lesson 3: `unknown` in, a guard proves the shape, a typed value out. The compiler makes you earn every property access.

<!-- interact:catch-is-unknown -->

:figure[disambiguation]{id="ts-unknown-vs-any"}

## `never` — the type no value inhabits

`never` is the bottom type: no value is assignable to it. You have already met it — `assertNever(x: never)` from Lesson 3's exhaustive `switch`. It is also the type of a function that only ever `throw`s, and the residue of a union that narrowing has fully emptied. One mechanism you'll use in the playground: `string | never` collapses to `string` — adding `never` to a union removes it. That collapse is exactly why `assertNever` works: handle every variant and the value reaching it is `never`.

## The closer: `as` is a promise, a guard is proof

```typescript
const user = JSON.parse(payload) as User;  // compiles
user.name.toUpperCase();  // crashes at runtime if payload had no name
```

A cast (`as`) tells the compiler "trust me, it's a `User`" — and the compiler *can't check it*, so a wrong cast is a runtime bug it can no longer catch. A guard returns proof the compiler verifies. Prefer proof. This scroll deliberately does not drill `as`, and that gap is on purpose: the capstone in Lesson 5 will let an `as` shortcut **compile and then fail at runtime**, so you see the broken promise for yourself. Cast-vs-guard at depth lives in `typescript-advanced-types`; the schema-first version of this boundary (validate once, infer the type) is where Zod lives — `typescript-zod-as-type-design`.

Next: the boundary kata — take `unknown` in, narrow it with a guard, hand a typed value out.
```

### `data.interactions` (per `readInlineDataSchema` — marker above anchors it)

> Transcribed verbatim from typescript.md §4 step 4.1. One `micro-quiz`, valid per `readInlineDataSchema` (≤4 interactions; two options).

```ts
{
  interactions: [
    {
      kind: 'micro-quiz' as const,
      after: 'catch-is-unknown',
      question: 'In a `catch (e)` clause under modern TS, what type is `e`?',
      options: ['any', 'unknown'] as [string, string],
      correct: 1 as const,
      feedback: [
        "That was the rule before TS 4.4, and many JS devs still assume it — but `any` here is exactly the silent-propagation hole this lesson is about: nothing stops you from reading `e.response.data` off a thrown string.",
        "Right — since TS 4.4 (`useUnknownInCatchVariables`, on under `strict`; this scroll runs TS 5.0.3) `e` is `unknown`, so you must narrow it (`e instanceof Error`, a guard) before using it. The compiler makes you prove what you caught.",
      ] as [string, string],
    },
  ],
}
```

### Authoring notes

- **Prose budget:** body prose (code blocks and the figure directive excluded) is ~350 words, at the spec target. Every prose block between the marker and the figure is under 200 words (longest ≈ 130).
- **Felipe test audit:** the `any` paragraph names *propagation* (a type-system behavior, not "any means any" trivia); the `unknown` paragraph names the *refusal-until-narrowed* compatibility rule; the `never` paragraph names the *bottom type* and the union collapse — none of these is derivable from JS fluency. The opening pain is autobiographical for A4 per spec.
- **Interaction placement:** the `catch-is-unknown` micro-quiz sits **after** the `unknown` paragraph (per §2.4a), where the reader has just been told `unknown` must be narrowed — the quiz checks they hold that model before kata 4.2 leans on it.
- **Figure:** the `ts-unknown-vs-any` `disambiguation` directive sits after the micro-quiz marker and before the `never` paragraph (the visual contrast lands right after the two types it contrasts are both on the page). Data block at end of file.
- **`as` closer (§2.6, C6):** cast = promise the compiler can't check, guard = proof; the deferral to `typescript-advanced-types` is named, the Zod boundary is named-and-deferred, and the learner is explicitly warned the capstone lets an `as` shortcut compile-but-fail-at-runtime — the gap is by design, not omission. No kata in this scroll exercises `as`.
- **Do-not-include held:** no `as const` (named in L1, not re-taught), no `as unknown as T` double-cast (deep-dive), no `satisfies` (L5 closer).
- All compiling samples are single-file, TS 5.0.3, `strict`-clean except the lines deliberately shown as errors (the `data.user` line and the `as User`→runtime-crash line are illustrative, not run). <!-- verify-at-smoke: tsc 5.0.3 -->

---

## Step 4.2 — `kata` — `parseUser` *(boundary gesture — re-performs G2)*

**Title:** `Take unknown in, narrow with a guard, hand User out`
**Type:** `kata`
**1-line task:** Wrap `JSON.parse` so its result is `unknown`, write `isUser(x: unknown): x is User`, and return the typed `User` or an error string.

### `instruction` (markdown body)

```markdown
## Your task

`JSON.parse` is typed to return `any` by the standard library — that's the silent hole this lesson opened with. Every webhook, every `fetch().json()`, every `process.env` value enters your program this way: shaped however the outside world felt like shaping it, and typed as "stop checking". Closing that hole *once*, at the boundary, with a guard — so everything downstream is a real `User`, not a hope — is the single most transferable TypeScript skill for a working JS developer, and it's what you build here.

`User` is the shape you defined in Lesson 2: `type User = { id: string; name?: string; email?: string }` — `id` required, the other two optional. The starter gives you `parseJson`, which already downgrades `JSON.parse`'s `any` to `unknown` (a `try/catch` returning `null` on malformed input). You write two things:

- `isUser(x: unknown): x is User` — a guard that proves the shape: an object, not null, with a string `id`; optional fields, when present, are strings.
- `parseUser(input: string): User | string` — parse, guard, and return the typed `User`, or the string `"invalid user"` when the input is malformed or the wrong shape.

### What's expected

```typescript
parseUser('{"id":"u1","name":"Ada"}')   // { id: "u1", name: "Ada" }
parseUser('{"id":"u1"}')                 // { id: "u1" }  (optionals absent is valid)
parseUser('{"name":"Ada"}')              // "invalid user"  (missing required id)
parseUser('not json')                    // "invalid user"
parseUser('[1,2,3]')                     // "invalid user"
```
```

### `starterCode`

```typescript
// `User` is the Lesson 2 shape, available in the prelude:
//   type User = { id: string; name?: string; email?: string }

// Provided: JSON.parse is typed `any` by the stdlib — this wrap downgrades it to `unknown`,
// so the compiler refuses to let you touch the result until you prove its shape.
const parseJson = (s: string): unknown => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

function isUser(x: unknown): x is User {
  // your code
  return false;
}

function parseUser(input: string): User | string {
  // your code
  return "invalid user";
}
```

### `testCode`

> Harness preamble (`_t`/`_eq`, the `Equal` prelude, `__DOJO_RESULT__` footer) lands at seed (W3) per typescript.md §5. `_eq` must be key-presence-aware (§5 gate) so the optional-field fixtures below actually verify the shape.

```typescript
_t("returns the typed user for valid JSON of the right shape", () => {
  _eq(parseUser('{"id":"u1","name":"Ada"}'), { id: "u1", name: "Ada" });
});

_t("accepts a user with the optional fields absent", () => {
  _eq(parseUser('{"id":"u1"}'), { id: "u1" });
});

_t("rejects valid JSON that is missing the required id", () => {
  _eq(parseUser('{"name":"Ada"}'), "invalid user");
});

_t("rejects malformed JSON", () => {
  _eq(parseUser('not json'), "invalid user");
});

_t("rejects a JSON array — right syntax, wrong shape", () => {
  _eq(parseUser('[1,2,3]'), "invalid user");
});

_t("rejects a JSON primitive — right syntax, wrong shape", () => {
  _eq(parseUser('42'), "invalid user");
});

// Illustrative (commented): the un-narrowed value refuses property access — this is the point of `unknown`.
// const raw: unknown = parseJson('{"id":"u1"}');
// @ts-expect-error  'raw' is of type 'unknown'.
// raw.id;
```

### `hints` (tier-ordered — see §2.5)

> **Tier 1** (on first failure): The compiler will not let you read `.id` off the value `parseJson` returns — it's `unknown`, and until you prove something about it, every property access is an error. So the work is the proof: a function whose return type *teaches the compiler something about its argument* when it returns true.
>
> **Tier 2** (on second failure): Give `isUser` the return type `x is User` — that type-predicate shape is what narrows `unknown` to `User` at the call site. Inside, prove the shape in order: first that the value is a non-`null` object (a `null` slips past `typeof x === "object"`), then that `id` is a string, then that each optional field is a string *only when it's present*. `parseUser` then just calls the guard and returns the value or `"invalid user"`.

### `referenceSolution`

```typescript
const parseJson = (s: string): unknown => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

function isUser(x: unknown): x is User {
  if (typeof x !== "object" || x === null) return false;
  const obj = x as Record<string, unknown>;
  if (typeof obj.id !== "string") return false;
  if (obj.name !== undefined && typeof obj.name !== "string") return false;
  if (obj.email !== undefined && typeof obj.email !== "string") return false;
  return true;
}

function parseUser(input: string): User | string {
  const value = parseJson(input);
  return isUser(value) ? value : "invalid user";
}
```

### Why these tests

| Test | Lands |
|---|---|
| Valid JSON + full shape → typed `User` | The happy path: parse, guard true, value flows out typed. |
| Optional fields absent → `{ id }` | The Lesson 2 thesis under test — a `User` with `name`/`email` missing is still valid. Requires the key-presence-aware `_eq` (§5 gate); a `JSON.stringify` `_eq` would pass a guard that wrongly *required* the optionals. |
| Missing required `id` → error string | The guard's required-field check; the most common real-world wrong shape. |
| Malformed JSON → error string | The `parseJson` `catch` path returning `null`, which the guard rejects. |
| Array → error string | Arrays are `typeof "object"` and non-null — catches a guard that stops at the `typeof`/null check and forgets the `id` check. |
| Primitive (`42`) → error string | A non-object that parses fine; catches a guard missing the `typeof x !== "object"` gate. |

### Authoring notes

- **§2.2 no-flexing:** the un-typed version fails *at runtime* — without the guard, `parseUser` would hand a wrong-shaped object downstream typed as `User` and crash on first use. The `@ts-expect-error` illustrative line shows the compile-time half (the `unknown` refusal) without making the kata about `@ts-expect-error`.
- **Hint discipline §2.5 / §2.4 tiers:** tier 1 points at "a function whose return type teaches the compiler about its argument" without naming the predicate. Tier 2 may name the `x is User` type-predicate shape and the order of checks (object-and-not-null, then `id`, then optionals-only-when-present), but writes no full solving line — it never spells the `as Record<string, unknown>` widening or the complete guard body.
- **Retrieval:** `User` is the Lesson 2 fixture, read in the prelude without re-explanation (§3). The guard shape `(x: unknown) => x is User` is Lesson 3's user-defined-guard form, now exercised against a real boundary. This kata is direct rehearsal for the capstone's `isShipmentEvent`.
- **Confidence slot:** 40%-stretch of the lesson (the only kata here). The JS orchestration is trivial; the guard's narrowing is the work.
- Single-file, TS 5.0.3, `strict`. <!-- verify-at-smoke: tsc 5.0.3 -->

---

## Step 4.3 — `playground` — "Explore the escape hatches at a boundary"

**Title:** `Explore the escape hatches at a boundary`
**Type:** `kata` with `data.kind: "playground"`
**1-line task:** No verdict to chase — change the code, hit **↻ Try it**, and watch what the compiler accepts and refuses across `any`, `unknown`, and `never`.

### `instruction` (markdown body)

```markdown
**This is a playground.** There's no pass to earn — the compiler's acceptance and refusal *is* the output you're here to read. A type error in this step is a finding, not a failure: it's the compiler showing you where the line is. Edit, run, and chase the things-to-try below.

The starter has the same parsed value typed two ways — `any` and `unknown` — plus a `never`-returning function and a union with `never` in it. Work through the numbered comments.
```

### `starterCode`

```typescript
const raw = '{"user":{"name":"Ada"}}';

// The honest version: `unknown` refuses every access until you narrow.
const strict: unknown = JSON.parse(raw);
// const b = strict.user;  // <- uncomment for try #1

// The dangerous version: `any` turns checking off and lets any chain compile.
const loose: any = JSON.parse(raw);
const a = loose.user.name.first;

function fail(message: string): never {
  throw new Error(message);
}

type Collapsed = string | never;

// ── Things to try ──────────────────────────────────────────────
// 1. Uncomment the `strict.user` line. Which exact line does the compiler light up,
//    and what is the message? (No output runs — the compiler refusal IS the result.)
// 2. Chain two more accesses onto the `any` version: `loose.user.name.first.x.y`.
//    Run it. At what point does the compiler warn you?
// 3. Add a branch that calls `fail("boom")` and then tries to use a value after it —
//    what type does the compiler think the code after a `never`-returning call has?
// 4. Hover `Collapsed`. What single type is left, and why does that make `assertNever` work?
```

### `testCode`

```typescript
_t("explored the escape hatches at a boundary", () => { _eq(true, true); });
```

### Authoring notes

- **Playground contract (§2.4):** `data.kind: "playground"`, the trivially-true `_t("explored the escape hatches at a boundary", …)` assertion, button "↻ Try it", no verdict UI. A compile error here is pedagogical — the instruction says so in its first line. Frontend `data.kind === "playground"` branch shipped with Ruby, reused by Python — no new work.
- **Things-to-try as numbered starter comments (Maya contract):** four concrete edits — the `unknown` refusal lighting one exact line (try 1, compile-error-shaped with no stdout, so "the squiggle is the result" lands before any runtime-output reflex fires — §2.3 contract), the `any` deep-chain (answer to "when does it warn?" is *never*, but the comment doesn't say so — the learner runs it and finds the compiler silent), the `never`-after-`fail()` inference, and the `string | never` collapse that powers `assertNever`. **No `(spoiler: …)` that answers its own prompt** — each comment asks, the run answers. **No live `console.log` on the first run:** the starter prints nothing, so the learner's first action (uncommenting `strict.user`) yields a compiler error, not stdout.
- **Coverage:** the four tries map to the read's four beats — `unknown` refusal (try 1), `any` propagation (try 2), `never`-returning function (try 3), `T | never` collapse (try 4). The playground is where the read's claims become physical.
- Single-file, TS 5.0.3. The committed-error lines (try 1, try 2) are the point — the runner surfaces them as readable compile output, not a crash (§5). <!-- verify-at-smoke: tsc 5.0.3 -->

---

## Self-review checkpoint (before commit)

- [x] Read 4.1 at ~350 words (prose only); opens with the autobiographical `any` pain; three valves in order — `any` (propagation/cost), `unknown` (boundary), `never` (bottom type + union collapse); `as` closer names cast-as-promise vs guard-as-proof, defers to `typescript-advanced-types`, names the Zod boundary, and **warns the learner the capstone lets an `as` shortcut compile-but-fail-at-runtime** (gap by design).
- [x] One interaction (`catch-is-unknown` micro-quiz), data transcribed verbatim from spec §4 4.1, marker `<!-- interact:catch-is-unknown -->` placed **after the `unknown` paragraph**; ≤4 interactions; marker matches `after` id.
- [x] `ts-unknown-vs-any` `disambiguation` figure directive in prose; data block at end of file; `highlightAttribute` single-dimension ("what the compiler lets you do before narrowing").
- [x] Kata 4.2 names `JSON.parse`'s stdlib-`any` typing as the reason the wrap exists; learner takes `unknown` in (`parseJson` provided) and narrows out with a guard; tests cover valid+full, optionals-absent, missing-`id`, malformed, array, primitive; key-presence-aware `_eq` requirement flagged (§5 gate); `@ts-expect-error` on un-narrowed access as a commented illustration.
- [x] Hint 4.2 concept-level — points at the guard's return-type role and the order of checks, never names `is`/`typeof`/the widening.
- [x] Playground 4.3 `data.kind: "playground"`, trivially-true assertion, four numbered things-to-try (`unknown` refusal first — compile-error-shaped, no stdout — then `any` deep-chain, `never`-returning fn, `string | never` collapse), **no self-answering spoilers**, no live `console.log` on the first run.
- [x] Hints concept-level; voice direct, no celebration, no emoji; `tsc` excerpts (none quoted here — no error reveal in this lesson) would carry `<!-- verify-at-smoke: tsc 5.0.3 -->`; every compiling-sample claim carries the smoke marker.
- [x] All content English. All code single-file, TS 5.0.3, `strict`. No code needing >5.0.3.

---

## Figure data spec

The step prose above embeds `:figure[disambiguation]{id="ts-unknown-vs-any"}`. Data:

### `ts-unknown-vs-any` (`disambiguation`) — embedded in Step 4.1

- **Slot:** after the `catch-is-unknown` micro-quiz, before the `never` paragraph — the moment both `any` and `unknown` are on the page and the reader needs the contrast forced.
- **Authoring note (single-dimension rule, §Embeddable visual figures):** ONLY **what the compiler lets you do before narrowing** carries `highlightAttribute`. The other rows — *accepts on the way in*, *where it's the right type* — render as plain unhighlighted attribute rows. Multi-highlight would make this a `two-by-two` candidate, which it is not: the two types accept the same values (no divergence there); they diverge on exactly one axis, what you may *do* with the value.
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ```ts
  {
    type: 'disambiguation',
    id: 'ts-unknown-vs-any',
    sharedSkeletonLabel: 'A value from outside the program, and an attempted property access on it',
    attributes: [
      'What the compiler lets you do before narrowing',
      'Accepts on the way in',
      'Where it is the right type',
    ],
    entries: [
      {
        title: 'any',
        values: {
          'What the compiler lets you do before narrowing': 'Everything, silently — every access compiles and stays `any`, so a wrong one surfaces at runtime',
          'Accepts on the way in': 'Any value',
          'Where it is the right type': 'A deliberate escape hatch with a TODO — never a resting state',
        },
      },
      {
        title: 'unknown',
        values: {
          'What the compiler lets you do before narrowing': 'Nothing, loudly — every access is a compile error until a guard proves the shape',
          'Accepts on the way in': 'Any value',
          'Where it is the right type': 'The boundary: JSON.parse, catch (e), any payload from outside',
        },
      },
    ],
    highlightAttribute: 'What the compiler lets you do before narrowing',
    caption:
      'Both accept anything coming in; they diverge on exactly one thing — what you may do with the value before you have proven its shape. any says everything and says nothing; unknown says nothing until you prove something.',
  }
  ```
- **Why this earns embedding:** `any` and `unknown` are genuine near-look-alikes — identical acceptance, opposite permissions — and the whole lesson turns on the one divergent axis. The figure forces the eye to it; deleting it would push the read to re-describe the contrast in a paragraph it doesn't have the word budget for. Passes the Felipe test: the `any`-reflex developer's exact confusion is "aren't these the same?" — the figure answers in one glance.
```
