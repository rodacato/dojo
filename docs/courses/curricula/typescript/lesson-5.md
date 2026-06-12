# TypeScript — Lesson 5: Generics that earn their place — and the close

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [typescript.md §4 Lesson 5](typescript.md#lesson-5--generics-that-earn-their-place--and-the-close) — the contract. Gates: [typescript.md §2.1 Felipe test](typescript.md#21-the-felipe-test--gate-for-every-read-paragraph), [§2.2 no-type-system-flexing](typescript.md#22-the-no-type-system-flexing-gate--for-every-type-shown), [§2.4a read+inline](typescript.md#24a-readinline-placement), [§2.5 hint discipline](typescript.md#25-hint-discipline), [§2.6 footgun deferral](typescript.md#26-footgun-deferral-discipline), [§2.7 production-gesture audit](typescript.md#27-production-gesture-audit-canon-2026-06-11-applied-at-outline). Capstone rules per [README §5.3 "The scroll capstone"](../../README.md#the-scroll-capstone-added-2026-06-11).
> **Primary audience:** A4 Felipe (5yr JS, follows Pocock — has *seen* the clever types, can't place them). Reviewer lens: A1 Mariana (asks "is the generic forced?").
> **Step count:** 4 (1 `read+inline` + 2 `kata` + 1 `challenge` — the scroll capstone).
> **What changes in the learner's head:** "I felt the duplication before `<T>` showed up, so generics read as 'the parameter I would have written for the type'. `extends` is the promise about what T supports; `keyof`/`T[K]` is how key-based helpers stay typed end to end. The clever stuff I can now *recognise*, and I know where the depth lives. And the capstone proved I can put the whole scroll together."

This file holds the **production prose** for each step's fields. All content in English. Every quoted `tsc` excerpt is a smoke-capture placeholder for the 5.0.3 family; exact text re-captured from Piston at the Lesson 5 smoke batch (typescript.md §5).

**Harness note (applies to every `testCode` block below):** tests use the manual harness contract — `_t("user-facing sentence", () => { _eq(actual, expected) })` — with `Equal<A, B>` and `@ts-expect-error` as the type-only assertion channels. The `Equal<A, B>` helper, `assertNever`, the `_t`/`_eq` definitions, and the `__DOJO_RESULT__` footer land with the seed harness (W3) per typescript.md §5. **Key-presence-aware `_eq` (BINDING, §5 gate):** the capstone is full of optional fields (`signedBy?`, `lastSeen?`), and a `JSON.stringify`-based `_eq` cannot tell a missing key from one set to `undefined`. The seeded `_eq` must distinguish them (structural deep-equal), or the optional-field fixtures pass tests that don't verify the shape. Smoke an optional-field fixture against the harness before seeding the capstone.

---

## Step 5.1 — `read+inline` — "Motivated generics — and the map of what comes next"

**Title:** `Generics you reach for — and the map of what comes next`
**Type:** `read+inline`
**Word count target:** ~350 (the scroll's longest read, spec §4 5.1). Felipe test §2.1: every paragraph names a type-system mechanism (the type parameter, the constraint, indexed-access distribution) or places a deep-dive — none re-teaches JS. No-flexing gate §2.2: `<T>` enters from the learner's *own* duplication, and `Pick`/the clever types arrive named-with-a-use-case, not toured. **One interaction** (`keyof-indexed` micro-quiz, §2.4a), anchored after the `keyof`/`T[K]` paragraph.

### `instruction` (markdown body, with interaction marker)

```markdown
## Why this matters

Look at what your own scroll made you almost write:

```typescript
function firstString(arr: string[]): string | undefined { return arr[0]; }
function firstNumber(arr: number[]): number | undefined { return arr[0]; }
function firstUser(arr: User[]): User | undefined { return arr[0]; }
```

Three functions, one idea, copied per type. You felt the duplication before you had a name for the fix. A generic is that name: `<T>` is the parameter you would have written for the *type*, the same way `arr` is the parameter you wrote for the *value*.

## `<T>`, and inference at the call site

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

One function, every element type. And you almost never write `first<string>([...])` — the compiler reads `T` from the argument: `first([1, 2])` infers `T = number`, so the result is `number | undefined`. Inference, the Lesson 1 idea, now flowing through a type parameter.

## `extends` — the promise about what T supports

A bare `<T>` knows nothing about `T`, so you can't touch its properties. `extends` is a constraint — a promise about T's shape:

```typescript
function tag<T extends { id: string }>(x: T): string {
  return `#${x.id}`;  // allowed: every T is guaranteed to have a string id
}
```

`<T extends { id: string }>` reads "T is anything, as long as it has at least an `id`".

## `keyof` and indexed access `T[K]`

`keyof T` is the union of T's keys; `T[K]` is the type *at* a key. Together they keep a key-based helper typed end to end:

```typescript
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

`K extends keyof T` means the key must really be a key of T — a mistyped key is a compile error, not a runtime `undefined`. You already read `T[K]` in the wild: kata 3.4's provided signature was `PaymentStatus["kind"][]` — "the type of the `kind` field, as an array".

<!-- interact:keyof-indexed -->

One more shape you'll *read* but not drill: a parameter spelled `guard: (x: unknown) => x is T` — a function-typed parameter carrying a user-defined type guard. The capstone's `parseWith` signature uses it; you don't have to write that signature, only its body.

## When NOT to be generic

A function called with exactly one type isn't generic — it just has a parameter that never varies. Speculative `<T>` "in case we need it later" is Lesson 1's annotation-maximalism wearing a costume: it adds surface for a flexibility nobody asked for. Reach for `<T>` when real duplication pushes you there, the way it just did.

## The map: what you can now recognise

You won't write these today; you'll *recognise* them, and you know where each depth lives:

- **Conditional types** — a type-level `if` (`NonNullable<T>` strips `null`). → `typescript-advanced-types`
- **Mapped types** — a loop over keys (`Partial<T>` makes every field optional). → `typescript-advanced-types`
- **`infer`** — names a matched part of a type (`ReturnType<F>`). → `typescript-advanced-types`
- **Template literal types** — type-level string building (event-name remapping). → `typescript-advanced-types`
- **Brand types** — nominal islands in a structural sea, so `UserId` ≠ `PostId`. → `typescript-domain-modeling`
- **`satisfies`** — constrain a value's type without widening it. → `typescript-advanced-types`

Each is clever, and clever types cost compile time and the next reader. Recognition is the bar for today.

Next: two katas, then the last step of the scroll — everything at once, on purpose.
```

### `data.interactions` (per `readInlineDataSchema` — marker above anchors it)

> Transcribed verbatim from typescript.md §4 step 5.1. One `micro-quiz`, valid per `readInlineDataSchema`.

```ts
{
  interactions: [
    {
      kind: 'micro-quiz' as const,
      after: 'keyof-indexed',
      question: "Given `type User = { id: string; age: number }`, what is `User['id' | 'age']`?",
      options: ['string | number', 'never'] as [string, string],
      correct: 0 as const,
      feedback: [
        "Right — indexing a type with a *union* of keys distributes: `User['id' | 'age']` is `User['id'] | User['age']` = `string | number`. That's the exact mechanism katas 5.2/5.3 lean on to keep key-based helpers typed end to end.",
        "`never` is what you'd get indexing with a key the type doesn't have. `'id' | 'age'` are both real keys, so indexed access with that union distributes over each: `User['id'] | User['age']` = `string | number`.",
      ] as [string, string],
    },
  ],
}
```

### Authoring notes

- **Prose budget:** body prose (code blocks and the deep-dive list excluded) ≈ 350 words, the spec's longest read. Every prose block between sections is under 200 words.
- **Felipe test audit:** `<T>` enters from the learner's own three-function duplication (the §2.2 lead-with-the-pain shape); `extends`, `keyof`/`T[K]` each name a mechanism JS doesn't have; the "when NOT to be generic" beat is the L1 callback; the closer is recognition-only with one use case + deep-dive per item (§2.6). The function-typed-guard parameter is *shown, not drilled*, solely so the capstone's `parseWith` signature is readable when it lands.
- **Interaction placement:** `keyof-indexed` micro-quiz **after** the `keyof`/`T[K]` paragraph (§2.4a), checking the distribution fact katas 5.2/5.3 depend on.
- **Retrieval (§3):** the duplication fixtures echo `User` (kata 2.2) and the element-of-array shape from kata 3.3; `PaymentStatus["kind"][]` is recalled-without-warning from kata 3.4's provided signature.
- **Do-not-include held:** no `<T, U, V>` cascades, no writing any conditional/mapped type, no React generic component (`<T,>` oddity deferred with it).
- All compiling samples single-file, TS 5.0.3, `strict`. <!-- verify-at-smoke: tsc 5.0.3 -->

---

## Step 5.2 — `kata` — `first<T>` *(the motivated generic; call-site-inference reveal)*

**Title:** `Write the generic the duplication asked for`
**Type:** `kata`
**1-line task:** Write `first<T>(arr: T[]): T | undefined`. The body is one line of JS; the work is the signature and what it makes the call sites know.

### `instruction` (markdown body)

```markdown
## Your task

Write `first<T>(arr: T[]): T | undefined` — return the first element of the array, or `undefined` when it's empty. One generic replaces the three copied functions you read at the start of the lesson.

The implementation is trivial JavaScript. The point is the **signature**: `T` ties the element type of the input to the type of the output, so the compiler knows — at each call site, without you annotating anything — exactly what came back.

### What's expected

```typescript
first([10, 20, 30])   // 30? no — the first: 10   (type: number | undefined)
first(["a", "b"])     // "a"                        (type: string | undefined)
first([])             // undefined
```
```

### `starterCode`

```typescript
function first/* <T>? */(arr: unknown[]): unknown {
  // your code — and fix the signature so the return type depends on the element type
  return undefined;
}
```

### `testCode`

> Harness preamble (`_t`/`_eq`, the `Equal` prelude, footer) lands at seed (W3) per typescript.md §5.

```typescript
_t("returns the first element of a number array", () => {
  _eq(first([10, 20, 30]), 10);
});

_t("returns the first element of a string array", () => {
  _eq(first(["a", "b"]), "a");
});

_t("returns undefined for an empty array", () => {
  _eq(first([]), undefined);
});

// Type-only: the call-site-inference reveal. These fail the compile if T is not inferred per call.
type _t1 = Equal<ReturnType<typeof first<number>>, number | undefined> extends true ? true : never;
type _t2 = Equal<ReturnType<typeof first<string>>, string | undefined> extends true ? true : never;
const _check1: _t1 = true;
const _check2: _t2 = true;
```

### `hint`

```markdown
The return type has to *depend on* the element type of the argument — `number` in means `number | undefined` out, `string` in means `string | undefined` out. A fixed return type can't do that.

What syntax introduces a name for a type you don't know yet, so a signature can refer to "whatever element type the caller passed"? Lesson 5.1 opened with exactly the duplication this collapses.
```

### `referenceSolution`

```typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
```

### Why these tests

| Test | Lands |
|---|---|
| First of a number array | The base case; with `noUncheckedIndexedAccess` off (default), `arr[0]` is `T`, the `| undefined` comes from the annotated return. |
| First of a string array | Same shape, different `T` — proves one function serves both. |
| Empty array → `undefined` | The reason the return type is `T | undefined`, not `T`. |
| `Equal<ReturnType<typeof first<number>>, number \| undefined>` | The call-site-inference reveal as a type-only assertion: `T` resolves per instantiation. This is where the draft's fifth predict went — the reveal is an `Equal` line, not a guess. The `typeof first<number>` instantiation expression needs TS ≥4.7; 5.0.3 clears it. |

### Authoring notes

- **§2.2 no-flexing:** the un-generic version (`unknown[] → unknown`) demonstrably fails the type-only tests — `ReturnType` would be `unknown`, not `number | undefined` — so the generic earns its place at compile time, visibly.
- **Hint discipline §2.5:** points at "a name for a type you don't know yet" and the dependency between in and out; never writes `<T>`.
- **Confidence slot:** 80% opener of the lesson's kata pair — anyone who read 5.1 passes.
- Single-file, TS 5.0.3, `strict`; the `typeof first<…>` assertions are instantiation expressions (≥4.7, fine on 5.0.3). <!-- verify-at-smoke: tsc 5.0.3 -->

---

## Step 5.3 — `kata` — `pickKeys<T, K extends keyof T>` *(the constraint earns its place)*

**Title:** `Pick a subset of keys, typed end to end`
**Type:** `kata`
**1-line task:** Write `pickKeys<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>` — copy the named keys into a new object, with the constraint making a mistyped key a compile error.

### `instruction` (markdown body)

```markdown
## Your task

Write `pickKeys<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>` — return a new object holding only the listed keys of `obj`. You meet `Pick<T, K>` here because you need it: it's the type "T narrowed to just the keys in K", which is exactly what this function returns.

The constraint is the lesson. `K extends keyof T` means the keys you ask for must actually be keys of `T` — so `pickKeys(user, ["password"])` on a `User` that has no `password` is a **compile error**, caught before it ever runs. Drop the constraint and `keys` becomes `string[]`, the compiler stops checking, and you're back to runtime `undefined`.

### What's expected

```typescript
const user: User = { id: "u1", name: "Ada", email: "ada@dojo.dev" };
pickKeys(user, ["id", "name"])   // { id: "u1", name: "Ada" }
pickKeys(user, ["id"])           // { id: "u1" }
pickKeys(user, ["password"])     // compile error — "password" is not a key of User
```
```

### `starterCode`

```typescript
// `User` is the Lesson 2 shape, available in the prelude:
//   type User = { id: string; name?: string; email?: string }

function pickKeys/* <T, K ...>? */(obj: object, keys: string[]): object {
  // your code — and fix the signature so mistyped keys are a compile error
  return {};
}
```

### `testCode`

> Harness preamble lands at seed (W3) per typescript.md §5. `_eq` must be key-presence-aware (§5 gate) for the subset fixtures.

```typescript
const user: User = { id: "u1", name: "Ada", email: "ada@dojo.dev" };

_t("copies the listed keys into a new object", () => {
  _eq(pickKeys(user, ["id", "name"]), { id: "u1", name: "Ada" });
});

_t("copies a single listed key", () => {
  _eq(pickKeys(user, ["id"]), { id: "u1" });
});

_t("returns a new object, not the original", () => {
  const picked = pickKeys(user, ["id"]);
  _eq(picked === user, false);
});

// Type-only: the constraint rejects a key that isn't on User.
// @ts-expect-error  "password" is not assignable to keyof User.
pickKeys(user, ["password"]);

// Type-only: the result type is Pick<User, "id" | "name">, not the whole User.
type _t1 = Equal<ReturnType<typeof pickKeys<User, "id" | "name">>, Pick<User, "id" | "name">> extends true ? true : never;
const _check1: _t1 = true;
```

### `hint`

```markdown
The `keys` parameter can't just be `string[]` — any string would be allowed, including ones that aren't on the object, and the compiler would wave them through. You need the type to say "these are *keys of T*".

Lesson 5.1 named the operator that produces "the keys of a type". Constrain the key parameter with it, and the return type that says "T, but only those keys" is a built-in utility the lesson also named.
```

### `referenceSolution`

```typescript
function pickKeys<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
```

### Why these tests

| Test | Lands |
|---|---|
| Copies two listed keys | The happy path: subset object built, shape preserved (`User` retrieval, §3). |
| Copies a single key | Smallest subset; the `Pick` result is `{ id }`, not the whole `User`. |
| Returns a new object | Catches a "fix" that returns `obj` itself or mutates it. |
| `@ts-expect-error` on `["password"]` | The constraint's whole reason for existing: a non-key is a *compile* error. If the learner left `keys: string[]`, this line compiles and `@ts-expect-error` flips to a failure — the constraint is what the test enforces. |
| `Equal<ReturnType<…>, Pick<User, "id" \| "name">>` | The return type is the narrowed `Pick`, not `User` and not `object`. |

### Authoring notes

- **§2.2 no-flexing:** `Pick` is introduced *in the kata because it's needed* for the return type — never toured. The un-constrained version fails the `@ts-expect-error` test (it would compile), so the constraint pays off visibly.
- **Hint discipline §2.5:** points at "the operator that produces the keys of a type" and "a built-in utility that says T-but-only-those-keys" — never writes `keyof` or `Pick`.
- **Confidence slot:** 40% — the last regular exercise of the scroll, per the lesson-ordering heuristic.
- The `{} as Pick<T, K>` in the reference solution is the one place a cast is idiomatic (building a typed object key by key); it is *not* shown to the learner before pass and is not the kata's subject.
- Single-file, TS 5.0.3, `strict`; `typeof pickKeys<User, …>` is an instantiation expression (≥4.7). <!-- verify-at-smoke: tsc 5.0.3 -->

---

## Step 5.4 — `challenge` — **Capstone: "A typed webhook, end to end"**

**Title:** `Capstone: a typed shipment webhook, end to end`
**Type:** `challenge` (the scroll capstone — last step of the last lesson, per README §5.3)
**1-line task:** Write the `ShipmentEvent` union, the `isShipmentEvent` guard, the body of the pre-written generic `parseWith<T>`, the exhaustive `describeShipment`, and compose them into `handleShipmentWebhook` — Lessons 2, 3, 4, 5 in one file.

### `instruction` (markdown body)

```markdown
**Budget: ~20-25 minutes — twice a kata. Not a gate:** skipping it costs you nothing downstream. But this is the scroll's promise made checkable, and failing it is useful data — it names the lesson to go re-run. The routing is at the end of this brief.

You work at a logistics scale-up. A webhook delivers shipment events as JSON strings — a `kind` tag first, then the fields that kind carries. Write the processor that turns a raw string into a human-readable line, or rejects it honestly.

You write five things:

1. **`type ShipmentEvent`** — a discriminated union with four variants, tagged by `kind`:
   - `"created"` with `id: string`
   - `"scanned"` with `id: string`, `location: string`
   - `"delivered"` with `id: string`, optional `signedBy?: string`
   - `"lost"` with `id: string`, optional `lastSeen?: string`
   (shapes with optional fields — Lesson 2; discriminated union — Lesson 3.)
2. **`isShipmentEvent(x: unknown): x is ShipmentEvent`** — the boundary guard (Lesson 3's guard shape over Lesson 4's `unknown`): validate the `kind` tag and the required fields each variant demands.
3. **`parseWith<T>`** — its signature is **already in the starter**; you write only the body: `JSON.parse` inside a `try/catch`, call the guard, return the value on success or `null` on failure.
4. **`describeShipment(e: ShipmentEvent): string`** — an exhaustive `switch` on `kind`, closed with `assertNever` (provided), the output varying with the optional fields (e.g. `"delivered #s1 (signed by Ada)"` vs `"delivered #s1"`).
5. **`handleShipmentWebhook(raw: string): string`** — the composition: parse-and-guard, then describe; `"invalid payload"` when the parse-and-guard returns `null`.

This is Lessons 2 through 5 in one file, by name:

- **Lesson 2 — shapes.** The four variants are object shapes with optional fields; you wrote one in kata 2.2 (`User`).
- **Lesson 3 — discriminated unions + narrowing.** The `kind` tag, the exhaustive `switch`, `assertNever` — kata 3.4's `nextStates` shape, fresh domain.
- **Lesson 4 — `unknown` at the boundary.** The guard takes `unknown` and proves the shape — kata 4.2's `parseUser`, generalised.
- **Lesson 5 — generics.** `parseWith<T>` is the boundary wrap made generic, the way `first<T>` collapsed three functions into one.

One precision before your reflex from Lesson 4 reaches for a shortcut: do **not** cast inside the guard. `JSON.parse(raw) as ShipmentEvent` would compile — and then a wrong-shaped payload flows through `handleShipmentWebhook` and crashes in `describeShipment`, exactly where it lies, because a cast is a promise the compiler couldn't check. The wrong-shape tests run through the *composed* handler for that reason: the shortcut fails at runtime where you'd ship it, not just at the guard. Prove the shape; don't promise it.

If you stall, the stall is information. Can't shape the union: Lesson 2. Tangled in the `switch` or `assertNever`: Lesson 3. The guard won't narrow `unknown`: Lesson 4. `parseWith`'s body fights you: Lesson 5. Go close the gap, then come back.
```

### `starterCode`

```typescript
// Provided in the prelude: assertNever and the Equal<...> type-only helper.
//   function assertNever(x: never): never { throw new Error("unexpected: " + JSON.stringify(x)); }

// 1. Your ShipmentEvent union goes here: four variants tagged by `kind`.
//    created/scanned/delivered/lost — see the brief for each variant's fields.

// 2. Your guard goes here.
function isShipmentEvent(x: unknown): x is ShipmentEvent {
  // your code
  return false;
}

// 3. Signature provided — write only the body: try/catch JSON.parse, call the guard, null on failure.
function parseWith<T>(raw: string, guard: (x: unknown) => x is T): T | null {
  // your code
  return null;
}

// 4. Your exhaustive describe goes here.
function describeShipment(e: ShipmentEvent): string {
  // your code — switch on e.kind, close with assertNever
  return "";
}

// 5. The composition: parse-and-guard, then describe; "invalid payload" on null.
function handleShipmentWebhook(raw: string): string {
  // your code
  return "invalid payload";
}
```

### `testCode`

> Harness preamble (`_t`/`_eq`, `assertNever`, the `Equal` prelude, footer) lands with the seed harness (W3) per typescript.md §5. `_eq` MUST be key-presence-aware (§5 gate): the `delivered`/`lost` optional-field fixtures below distinguish a missing key from `undefined`.

```typescript
// ── Happy path: one valid payload per kind, through the composed handler ──
_t("describes a created event", () => {
  _eq(handleShipmentWebhook('{"kind":"created","id":"s1"}'), "created #s1");
});

_t("describes a scanned event with its location", () => {
  _eq(handleShipmentWebhook('{"kind":"scanned","id":"s1","location":"depot-7"}'), "scanned #s1 at depot-7");
});

_t("describes a delivered event with a signer", () => {
  _eq(handleShipmentWebhook('{"kind":"delivered","id":"s1","signedBy":"Ada"}'), "delivered #s1 (signed by Ada)");
});

_t("describes a delivered event with no signer", () => {
  _eq(handleShipmentWebhook('{"kind":"delivered","id":"s1"}'), "delivered #s1");
});

_t("describes a lost event with a last-seen location", () => {
  _eq(handleShipmentWebhook('{"kind":"lost","id":"s1","lastSeen":"depot-7"}'), "lost #s1 (last seen depot-7)");
});

_t("describes a lost event with no last-seen", () => {
  _eq(handleShipmentWebhook('{"kind":"lost","id":"s1"}'), "lost #s1");
});

// ── Boundary failures: MUST flow through the composed handler (an `as` shortcut fails here) ──
_t("rejects malformed JSON as an invalid payload", () => {
  _eq(handleShipmentWebhook('not json'), "invalid payload");
});

_t("rejects valid JSON with no kind tag", () => {
  _eq(handleShipmentWebhook('{"id":"s1"}'), "invalid payload");
});

_t("rejects valid JSON with an unknown kind tag", () => {
  _eq(handleShipmentWebhook('{"kind":"teleported","id":"s1"}'), "invalid payload");
});

_t("rejects a scanned event missing its required location", () => {
  _eq(handleShipmentWebhook('{"kind":"scanned","id":"s1"}'), "invalid payload");
});

// ── Type-only: parseWith is forced to be generic, and describeShipment refuses unknown ──
type _t1 = Equal<ReturnType<typeof parseWith<ShipmentEvent>>, ShipmentEvent | null> extends true ? true : never;
const _check1: _t1 = true;

// @ts-expect-error  an un-guarded `unknown` is not assignable to ShipmentEvent.
describeShipment(JSON.parse('{"kind":"created","id":"s1"}') as unknown);
```

### `hint` (the only one — challenge rules, README §5.3)

```markdown
The flow is `string → unknown → ShipmentEvent | null → string`. Each arrow is a function you already wrote once in Lessons 3-5 — here you write them again over a fresh domain and compose them.
```

### `referenceSolution`

```typescript
function assertNever(x: never): never {
  throw new Error("unexpected: " + JSON.stringify(x));
}

type ShipmentEvent =
  | { kind: "created"; id: string }
  | { kind: "scanned"; id: string; location: string }
  | { kind: "delivered"; id: string; signedBy?: string }
  | { kind: "lost"; id: string; lastSeen?: string };

function isShipmentEvent(x: unknown): x is ShipmentEvent {
  if (typeof x !== "object" || x === null) return false;
  const e = x as Record<string, unknown>;
  if (typeof e.id !== "string") return false;
  switch (e.kind) {
    case "created":
      return true;
    case "scanned":
      return typeof e.location === "string";
    case "delivered":
      return e.signedBy === undefined || typeof e.signedBy === "string";
    case "lost":
      return e.lastSeen === undefined || typeof e.lastSeen === "string";
    default:
      return false;
  }
}

function parseWith<T>(raw: string, guard: (x: unknown) => x is T): T | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  return guard(value) ? value : null;
}

function describeShipment(e: ShipmentEvent): string {
  switch (e.kind) {
    case "created":
      return `created #${e.id}`;
    case "scanned":
      return `scanned #${e.id} at ${e.location}`;
    case "delivered":
      return e.signedBy === undefined
        ? `delivered #${e.id}`
        : `delivered #${e.id} (signed by ${e.signedBy})`;
    case "lost":
      return e.lastSeen === undefined
        ? `lost #${e.id}`
        : `lost #${e.id} (last seen ${e.lastSeen})`;
    default:
      return assertNever(e);
  }
}

function handleShipmentWebhook(raw: string): string {
  const event = parseWith(raw, isShipmentEvent);
  return event === null ? "invalid payload" : describeShipment(event);
}
```

### Why these tests

| Test | Lands |
|---|---|
| One happy payload per `kind` (created/scanned/delivered/lost) | Each variant parses, guards true, and describes — the full `string → string` path per branch. Run through `handleShipmentWebhook`, not the pieces. |
| `delivered` with and without `signedBy`; `lost` with and without `lastSeen` | The Lesson 2 optional-field thesis under test — the description varies with presence. Requires the key-presence-aware `_eq` (§5 gate): the guard must accept the field absent, and `describeShipment` must branch on it. |
| Malformed JSON → `"invalid payload"` | `parseWith`'s `catch` path returning `null`, composed into the handler. |
| Missing tag / unknown tag → `"invalid payload"` | The guard's tag validation; **these run through the composed handler**, so a `JSON.parse(raw) as ShipmentEvent` shortcut inside the guard passes the guard but crashes in `describeShipment` at runtime — the Felipe attack caught where it lies (S028 panel). |
| `scanned` missing `location` → `"invalid payload"` | The per-variant required-field check — a guard that validates only the tag lets this through. |
| `Equal<ReturnType<typeof parseWith<ShipmentEvent>>, ShipmentEvent \| null>` | Forces `parseWith` to actually be generic — a non-generic body that hard-codes `ShipmentEvent` would pass the runtime tests but is pinned here. Instantiation expression, TS ≥4.7 (5.0.3 clears it); load-bearing, do not simplify away. |
| `@ts-expect-error` on `describeShipment(JSON.parse(...) as unknown)` | `describeShipment` refuses an un-guarded `unknown` — the boundary discipline holds at the type level too. The `as unknown` cast is load-bearing: `JSON.parse` returns `any`, which is assignable to `ShipmentEvent`, so without it the directive goes unused (TS2578) and the capstone fails to compile. |

### Lesson-name map (the brief names where each piece comes from)

| Capstone piece | Leans on | Kata it re-performs |
|---|---|---|
| `ShipmentEvent` union (shapes + optional fields) | **Lesson 2** (shapes), **Lesson 3** (discriminated union) | 2.2 `User` shape, 3.4 `PaymentStatus` union |
| `isShipmentEvent` guard | **Lesson 3** (guard shape) + **Lesson 4** (`unknown` boundary) | 4.2 `isUser` over a real boundary |
| `parseWith<T>` body | **Lesson 5** (generics) + **Lesson 4** (`try/catch` + guard) | 4.2 `parseUser`, generalised like 5.2 `first<T>` |
| `describeShipment` exhaustive switch | **Lesson 3** (`switch` + `assertNever`) | 3.4 `nextStates` |
| `handleShipmentWebhook` composition | all four — the integration | — |

### The one hint (recorded for review)

> *"The flow is `string → unknown → ShipmentEvent | null → string`. Each arrow is a function you already wrote once in Lessons 3-5 — here you write them again over a fresh domain and compose them."*

Concept-level, names no solving identifier (not `parseWith`, not `is`, not `switch`, no match arm). Exactly one, per challenge rules (README §5.3).

### Persona attack-sketch validation (outline → W2 re-check)

The outline's §4 5.4 sketch was made against outlined lessons; W2 prose for Lessons 2-5 shipped to outline scope, so the sketch stands. Re-checked against this brief:

- **Felipe (A4):** define the union like `PaymentStatus`, guard like `isUser` plus a tag check, switch like `nextStates` with `assertNever`, wrap parse like `parseUser` but generic like `first` — with `parseWith`'s signature already on the page, only its body to fill. Every move maps to a written kata → the lesson set covers its own capstone. His shortcut attack (`as ShipmentEvent` inside the guard) is caught because the wrong-shape fixtures run through the composed `handleShipmentWebhook`.
- **Mariana (A1):** her W2 review question — "is `parseWith` forced?" — is answered by the type-only `Equal<ReturnType<typeof parseWith<ShipmentEvent>>, …>` assertion: a non-generic body fails the compile. If W2 smoke says the generic walls learners, the declared fallback (spec §4 5.4 / §7) is to provide `parseWith` in full and keep 1-2-4-5 as the work — the capstone still integrates L2/L3/L4.

### Authoring notes

- **Starter compiles as stubs.** The union (piece 1) is *not* pre-written — but `isShipmentEvent`, `parseWith`, `describeShipment`, and `handleShipmentWebhook` all reference `ShipmentEvent`, so the starter as shown would not compile until the learner declares the type. **Seed-time resolution (flag):** either (a) the starter ships a minimal placeholder `type ShipmentEvent = { kind: string; id: string }` with a `// replace me` comment so the scaffold compiles and the learner *redefines* it (mirrors kata 3.4, where the learner completes a partially-given union), or (b) the starter leaves the type absent and the runner surfaces the `Cannot find name 'ShipmentEvent'` as the first readable compile error. Option (a) keeps the "starter compiles" canon (README §5.4) and the define-the-union gesture (G2/G3) both intact; recommend (a). Decide at seed and smoke the chosen scaffold.
- **`parseWith` signature pre-written**, body is the work — the function-typed + type-guard-parameter syntax is *read* in 5.1, never drilled (spec §4 5.4).
- **`referenceSolution` is complete and self-contained:** every type the tests reference (`ShipmentEvent`, the four variants, `parseWith`, `describeShipment`, `handleShipmentWebhook`) is defined in the solution; `assertNever` is reproduced at the top for self-containment (it ships in the prelude at seed). No `as` anywhere except the idiomatic `x as Record<string, unknown>` widening inside the guard — which is the read's own example of a *bounded* cast, not the broken-promise kind the capstone tests against (the guard still *proves* every field after widening).
- **Budget stated up front** (~20-25 min / 2× kata), not-a-gate stated, failure routed to a named lesson — direct, no softening (README §5.3 + §7).
- Single-file, TS 5.0.3, `strict`. The `typeof parseWith<ShipmentEvent>` assertion is an instantiation expression (≥4.7). <!-- verify-at-smoke: tsc 5.0.3 -->

---

## Self-review checkpoint (before commit)

- [x] Read 5.1 at ~350 words (prose only), the scroll's longest; `<T>` motivated by the learner's own three-function duplication; `extends`, `keyof`, `T[K]` each with a worked sample; function-typed-guard parameter *shown not drilled* for the capstone's readability; named-and-deferred closer (conditional/mapped/`infer`/template-literal/brand/`satisfies`), one use case + deep-dive each (§2.6).
- [x] One interaction (`keyof-indexed` micro-quiz), data transcribed verbatim from spec §4 5.1, marker `<!-- interact:keyof-indexed -->` **after the `keyof`/`T[K]` paragraph**; ≤4 interactions; marker matches `after` id.
- [x] Kata 5.2 `first<T>` free generic; predict-the-inferred-T via `Equal<ReturnType<typeof first<number>>, number | undefined>` assertions at multiple call sites (instantiation expressions, ≥4.7).
- [x] Kata 5.3 `pickKeys<T, K extends keyof T>`; the constraint earns its place — `@ts-expect-error` on a mistyped key is the test that enforces it; `Pick` introduced because the return type needs it (§2.2), not toured.
- [x] Capstone 5.4: learner writes `ShipmentEvent` union (optional fields), `isShipmentEvent` guard, `parseWith<T>` **body** (signature pre-written), exhaustive `describeShipment` + `assertNever`, composes `handleShipmentWebhook`; names L2/L3/L4/L5 + the kata each re-performs; ~20-25 min budget stated; ≤1 high-level hint.
- [x] Wrong-shape + malformed fixtures flow through the **composed** `handleShipmentWebhook` (not just the guard) so an `as` shortcut fails at runtime; not a gate; failure routes to a named lesson.
- [x] `starterCode` compiles (stubs) — **flagged** the `ShipmentEvent`-referenced-before-declared scaffold question with a recommended resolution (placeholder type to redefine); `referenceSolution` complete + self-contained (every test-referenced type present).
- [x] Harness: `_t("sentence", () => { _eq(...) })` + `Equal`/`@ts-expect-error`; key-presence-aware `_eq` requirement flagged (§5, capstone optional fields); harness lands at seed.
- [x] Hints concept-level, no solving identifier; voice direct, no fluff, no emoji, no celebration; every compiling-sample claim carries `<!-- verify-at-smoke: tsc 5.0.3 -->`.
- [x] All content English. All code single-file, TS 5.0.3, `strict`; the only feature beyond baseline (`typeof f<T>` instantiation expressions, ≥4.7) is cleared by 5.0.3. No code needing >5.0.3.
```
