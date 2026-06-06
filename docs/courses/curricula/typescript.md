# TypeScript Course Track

> Maintainer persona: S9 Leo Barros (TS educator) + S5 Dr. Elif Yıldız (curriculum architect)
> Infrastructure adjacency: C3 Tomás Ríos (TS in monorepo/infra contexts)
> Last researched: 2026-04-14

---

## 1. Learning Philosophy for TypeScript

Teaching TypeScript is not teaching a language. It is teaching a **second skill grafted onto a language the learner usually already speaks**. Almost everyone who shows up at a TS course can already write `arr.map(x => x * 2)` and crash a Node process. What they cannot do is *think in types*: reason about the shape of a value at a layer above the value itself, and trust the compiler enough to let it be a collaborator instead of a nag. The course track is built around that single shift. Every sub-course is one step further from "annotate what you already wrote in JS" and one step closer to "design with types first, then let the implementation fall out."

The hardest pedagogical trap in TS is the **generics-too-early bait**. Generics look like the impressive-looking part of the language, so courses tend to introduce `<T>` in the second hour and lose 60% of their audience by the end of the day. We refuse that. Generics are introduced only after the learner has felt the *pain of a type that should have been parametric*. Same rule for conditional types, `infer`, mapped types, and template literal types: the lesson must first manufacture a real situation where the simpler tool falls short. No party tricks. No `type IsNever<T> = [T] extends [never] ? true : false` until the learner has hit a `never` in production and asked why.

The second axis is **gradual vs. strict**. Real TS codebases live on a spectrum from "JS with sprinkles" to "the type system is a compiler-enforced spec." We name this spectrum explicitly in the fundamentals and let the learner navigate it on purpose. `any` is not the enemy — *unmotivated* `any` is. We teach the cost of `any` (it propagates and silences) alongside the legitimate uses (`unknown` boundary, third-party type holes, intentional escape hatch with a TODO). Same for `as`: a cast is a promise to the compiler, and breaking the promise is a runtime bug the compiler can no longer catch.

A third axis the curriculum treats explicitly: **TS for JS refugees vs. TS for people who think in types**. These are two real audiences with different needs. The JS refugee already ships software, has muscle memory for `Array.prototype` methods, and wants to know "what do I sprinkle on top of what I already write so it stops crashing in production?" The type-thinker — often a developer arriving from Rust, Haskell, F#, OCaml, or just a JS developer who's read enough Vanderkam — wants the type system to *carry weight*, to encode invariants, to fail to compile when the model is wrong. The fundamentals course speaks to the JS refugee directly. Course 3 (functional patterns), course 4 (Node/API), and especially course 5 (type-level) speak to the type-thinker. Course 2 (advanced types) is the bridge: it takes the JS refugee and walks them across, one motivated example at a time. Mixing the two audiences in a single lesson is the fastest way to lose both — we don't.

Dead ends we explicitly avoid: (1) treating `interface` vs `type` as a stylistic flame war — we pick one rule, explain when the other matters, and move on; (2) teaching decorators before they're standardized enough to matter (parked into a clearly-flagged optional sub-course); (3) building exercises that reward "make the red squiggle go away" instead of "model the domain"; (4) teaching `enum` as a default — we teach union literals first and treat `enum` as a legacy/interop topic; (5) reaching for OOP class hierarchies because TS supports them — we teach discriminated unions and ADT-style modeling as the default tool for state; (6) treating `satisfies` as a beginner-friendly replacement for explicit annotations — it's a precise tool with a specific job (preserve narrow inference while constraining shape) and we introduce it only after the learner has felt the inference-vs-annotation trade-off in their own code.

---

## 2. Course Tree Overview

| Course | Level | Prereqs | Sandbox | Steps (approx) | Status |
|---|---|---|---|---|---|
| `typescript-fundamentals` | Basic | JS familiarity | Piston | ~18 | extends Sprint 014 MVP (see §7) |
| `typescript-advanced-types` | Intermediate | fundamentals | Piston | ~22 | new |
| `typescript-functional-patterns` | Intermediate | fundamentals | Piston | ~16 | new |
| `typescript-node-api` | Intermediate | fundamentals + async JS | Piston | ~20 | new |
| `typescript-type-level` | Advanced / specific | advanced-types | Piston (type-only) | ~24 | new |
| `typescript-react-primer` | Specific | fundamentals + React basics | iframe-sandbox | ~14 | new |
| `typescript-tsconfig-for-humans` | Specific (optional) | fundamentals | Piston (compile-only) | ~8 | proposed |
| `typescript-zod-as-type-design` | Specific (optional) | fundamentals + node-api | Piston (with bundled mini-Zod) | ~10 | proposed, scope-flag |

The first six are the required spine. The last two are proposed deep-dives — a reviewer should green-light or cut them before content production.

**Total spine target:** ~114 steps across six courses, roughly 25–30 hours of focused learner time.

---

## 3. Sub-courses

### 3.1 TypeScript Fundamentals (Extended) — Basic

**Slug:** `typescript-fundamentals`
**Prereqs:** Comfortable with modern JS (arrow functions, destructuring, `const`/`let`, array methods, basic Promises). No prior TS required.
**Sandbox:** Piston (`typescript`)
**Learner time:** ~3–4 hours
**Learning outcomes:**
- Annotate any plain JS function with accurate parameter and return types.
- Read and explain a structural type error (the `Property 'x' is missing in type 'A' but required in type 'B'` family).
- Choose between `type`, `interface`, and inline object types using a stated rule.
- Distinguish `any`, `unknown`, and `never` and pick the right one at an I/O boundary.
- Narrow a union type using `typeof`, `in`, equality, and a user-defined type guard.

**Lesson 1: Why types** *(extends Sprint 014 Lesson 1)*
- Step 1 (explanation): "JS lies to you at runtime." Concrete scenario: a function that crashes on `undefined.foo`. We rewrite with TS and show the compile-time error. Frame TS as a *linter that understands shapes*, not a new language.
- Step 2 (exercise): Annotate three pre-written JS functions (`greet`, `add`, `pickRandom`) so they pass strict mode. testCode imports them and checks runtime behavior + uses `@ts-expect-error` on intentionally wrong calls.
- Step 3 (exercise): Given a function `parseAge(input: string): number`, fix the four bugs the type checker surfaces. Tests assert behavior on edge cases.

**Lesson 2: Primitives, literals, unions**
- Step 1 (explanation): Primitive types vs literal types. Why `type Status = "idle" | "loading" | "ready"` beats `type Status = string`. Width vs. specificity.
- Step 2 (exercise): Type a function `transition(current: Status, event: Event): Status` where `Status` and `Event` are literal unions. Tests check exhaustive transitions.
- Step 3 (exercise): A `formatBytes(n: number, unit: "B" | "KB" | "MB" | "GB"): string` — the test checks both runtime output and `@ts-expect-error` on `"TB"`.

**Lesson 3: Objects, interfaces, structural typing**
- Step 1 (explanation): Structural typing in 90 seconds. "If it walks like a duck, the compiler accepts it as a duck." Show two unrelated types satisfying the same shape. Pick rule for `type` vs `interface`: `type` by default, `interface` when extending or merging.
- Step 2 (exercise): Define a `User` type and a `getDisplayName(user: User): string` that handles optional fields. Tests cover missing-field cases.
- Step 3 (exercise): Refactor a function that currently takes `(id, name, email, age)` into one that takes a single `UserInput` object. Tests verify call sites.

**Lesson 4: Functions, overloads, and `this`**
- Step 1 (explanation): Function types, optional and default params, rest params with tuples, the rare-but-useful overload signature. Brief note on `this` typing.
- Step 2 (exercise): Write `pluck<...>` — first as a non-generic function on a fixed shape (the generic version is deliberately deferred to course 2).
- Step 3 (challenge): Implement `compose(f, g)` typed correctly for two functions. Hint that "for N functions" is a generics problem we'll meet later.

**Lesson 5: Narrowing, `unknown`, `never`**
- Step 1 (explanation): The narrowing toolbox: `typeof`, `in`, equality, `Array.isArray`, user-defined guards (`is` predicates). `unknown` as the polite `any`. `never` as the "this branch can't happen" signal.
- Step 2 (exercise): Write `safeJsonParse(input: string): unknown` and a guard `isUserShape(value: unknown): value is User`. Tests pass valid and malformed JSON.
- Step 3 (exercise): An exhaustiveness check on a discriminated union using `assertNever`. Test fails to compile if a new variant is added without handling — taught with `@ts-expect-error` flipping after the fix.
- Step 4 (challenge): Refactor a `try/catch` block where `error` is `unknown` (TS 4.4+ default) into a typed error handler.

**Piston considerations:** Pure functions, deterministic output, single-file. testCode lives next to user code and uses a tiny assertion helper (no dep). `@ts-expect-error` directives are used to *assert that a call should fail to compile* — Piston runs the compiler so this works natively. We document the runner's behavior on `tsc --noEmit` failures: a compile error counts as a failed test, not a runtime crash.

**Reference material:**
- Book: *Learning TypeScript* by Josh Goldberg (O'Reilly, 2022) — chapters 1–6 align almost 1:1 with this course. Use as the primary "if the learner wants a book on the side" recommendation.
- Book: *Programming TypeScript* by Boris Cherny (O'Reilly, 2019) — chapters 1–4. Slightly older, but its "TypeScript: A 10,000 Foot View" framing is still the cleanest mental model intro in print.
- Docs: <https://www.typescriptlang.org/docs/handbook/2/everyday-types.html> and <https://www.typescriptlang.org/docs/handbook/2/narrowing.html>
- Community reference: Total TypeScript — *Pro Essentials* free intro modules (Matt Pocock); Frontend Masters — Mike North's *TypeScript Fundamentals v3*; Execute Program *TypeScript Basics* course for spaced-repetition reinforcement.

---

### Voice notes specific to fundamentals

The fundamentals course is the entry point for the largest fraction of the audience and sets tone for the whole track. Two voice rules we hold:

- **Don't congratulate.** No "great job!" copy. The compile passing is its own reward; the platform doesn't need to add a sticker.
- **Name the cost.** Every time a feature is introduced, the explanation includes one sentence on what it costs (compile time, mental load, runtime cost, reader cost). This is the single largest deviation from most TS courses on the market and is an explicit BRANDING.md alignment.

---

### 3.2 TS Advanced Types — Intermediate

**Slug:** `typescript-advanced-types`
**Prereqs:** `typescript-fundamentals`. Learner should be comfortable annotating Node-style code without help.
**Sandbox:** Piston (`typescript`)
**Learner time:** ~5–6 hours
**Learning outcomes:**
- Write a generic function or type, motivated by a concrete duplication problem they just solved manually.
- Read and decompose a conditional type with `infer`.
- Use the standard utility types (`Pick`, `Omit`, `Partial`, `Required`, `Record`, `Readonly`, `ReturnType`, `Parameters`, `Awaited`, `NonNullable`) and explain when each applies.
- Build one custom mapped type and one custom utility from the standard set.

**Lesson 1: Generics, motivated**
- Step 1 (explanation): Start with three functions a learner just wrote in the fundamentals course: `firstString`, `firstNumber`, `firstUser`. Show the duplication. Introduce `<T>` as "the parameter you would have written for the type, if the language allowed it." No `<T, U, V, W>` cascade — one `T` at a time.
- Step 2 (exercise): Write `first<T>(arr: T[]): T | undefined`. Tests pass arrays of different element types.
- Step 3 (exercise): Write `groupBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T[]>`. Forces a constraint and a `Record`.
- Step 4 (exercise): Generic constraints — `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`. Now the standard utility `Pick` shows up because the learner *needs* it.

**Lesson 2: Mapped types**
- Step 1 (explanation): Mapped types as "loop over the keys." Build `Partial<T>` from scratch in three lines. Then build `Readonly<T>`. Then `Nullable<T>`.
- Step 2 (exercise): Implement `MyPartial<T>`, `MyRequired<T>`, `MyReadonly<T>` and prove they match the built-ins via type-level equality assertions (testCode uses `Equal<A, B>` helper).
- Step 3 (exercise): `Stringify<T>` — turn every property of `T` into a `string`. Tests use `Equal`.
- Step 4 (challenge): `DeepPartial<T>` — first attempt without recursion (fails on nested objects), then with.

**Lesson 3: Conditional types and `infer`**
- Step 1 (explanation): "Type-level if." Walk through `T extends U ? X : Y`. Show `NonNullable<T>` as one line. Then introduce `infer` as "give the matched part a name."
- Step 2 (exercise): `MyReturnType<F>`, `MyParameters<F>`, `MyAwaited<P>`. Tests with `Equal<MyAwaited<Promise<string>>, string>`.
- Step 3 (exercise): `Flatten<T>` — `T extends Array<infer U> ? U : T`.
- Step 4 (challenge): `LastOf<T>` on a tuple using `infer` with rest. Hard but well-motivated by the next lesson.

**Lesson 4: Template literal types and key remapping**
- Step 1 (explanation): String types as values at the type level. `` `on${Capitalize<K>}` `` patterns. Key remapping with `as`.
- Step 2 (exercise): `EventHandlers<T>` — turn `{ click: ..., hover: ... }` into `{ onClick: ..., onHover: ... }`. Tests with `Equal`.
- Step 3 (exercise): `Getters<T>` — `{ name: string }` → `{ getName: () => string }`.
- Step 4 (challenge): `Path<T>` — produce dotted-string union for all leaf paths in a nested object type. (This is a Type Challenges medium; we use a simpler 2-level version here and defer the recursive version to course 5.)

**Lesson 5: The standard utility types as a fluent vocabulary**
- Step 1 (explanation): Tour of the standard utilities, but framed as "things you would have built." Map each to the mapped/conditional pattern that produces it.
- Step 2 (exercise): A real-shaped task: given a `User` and a `UserUpdate = Partial<Pick<User, Updatable>>`, write the update function. Tests check field-by-field merge.
- Step 3 (exercise): API request/response shaping — given a `RouteSchema`, derive `Request` and `Response` types and write a typed handler signature.

**Piston considerations:** Heavy use of *type-only* assertions. testCode contains things like `type _t1 = Equal<MyReturnType<() => 1>, 1>` and a tiny helper `type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false`. Runtime is trivial — most tests pass if the file compiles. Piston returns the `tsc` exit code, which is enough.

**Reference material:**
- Book: *Effective TypeScript* by Dan Vanderkam (O'Reilly, 2nd ed. 2024) — items 14–25 cover generics and the type system in the form of "do this / not that," which slots straight into exercise rationale.
- Book: *Programming TypeScript* (Cherny) chapters 6–7 for the original walkthrough of conditional and mapped types.
- Docs: <https://www.typescriptlang.org/docs/handbook/2/generics.html> and <https://www.typescriptlang.org/docs/handbook/2/conditional-types.html>
- Community reference: Total TypeScript *Type Transformations* workshop (Matt Pocock) — the structure of lessons 2–4 above is heavily informed by it; *Type-Level TypeScript* by Gabriel Vergnaud, lessons on conditional types and `infer`.

---

### 3.3 TS Functional Patterns — Intermediate

**Slug:** `typescript-functional-patterns`
**Prereqs:** `typescript-fundamentals`. `typescript-advanced-types` recommended but not required (we use only single-parameter generics).
**Sandbox:** Piston (`typescript`)
**Learner time:** ~3–4 hours
**Learning outcomes:**
- Model state with discriminated unions instead of optional-field soup or class hierarchies.
- Write a function whose return type forces the caller to handle the failure case.
- Update nested immutable data without mutating, with type safety preserved.
- Recognize when an `if/else` chain wants to be a discriminated union.

**Lesson 1: Discriminated unions and exhaustiveness**
- Step 1 (explanation): The "tag field" pattern. Why a `RemoteData = Loading | Success<T> | Error` beats `{ loading: bool, data?, error? }`. Show the bug the bag-of-optionals enables that the union prevents.
- Step 2 (exercise): Model a `PaymentStatus = Pending | Authorized | Captured | Refunded | Failed` and write a `nextStates(s)` function returning the legal next states. Tests check transitions.
- Step 3 (exercise): Add a new variant. Use `assertNever` in a `switch` so the compiler points at every site that needs updating. Tests verify the compile error before the fix and the pass after.

**Lesson 2: Result / Either patterns**
- Step 1 (explanation): "Don't throw; return." Define `Result<T, E> = { ok: true; value: T } | { ok: false; error: E }`. Why this is better than `T | null` (you keep the error) and better than throwing (the type signals it).
- Step 2 (exercise): Rewrite a `parseConfig` that currently throws into one that returns `Result<Config, ConfigError>`. Tests check both branches.
- Step 3 (exercise): Compose two `Result`-returning functions with a `map` and `flatMap` you implement. Tests cover short-circuit behavior.
- Step 4 (challenge): A small `Result.all([...])` that collapses an array of results into a single `Result<T[], E[]>`.

**Lesson 3: Immutable updates, typed**
- Step 1 (explanation): The case for never mutating: type narrowing survives the update, undo/redo is trivial, render diffing works. The case against deep cloning everywhere: cost. Middle path: structural sharing, one level at a time.
- Step 2 (exercise): `updateUser(state, id, patch)` returning a new state with one user replaced. Type signature must preserve the array element type.
- Step 3 (exercise): `toggleNested(state, path)` for a 2-level structure. Path is typed as a dotted string from the previous course.
- Step 4 (challenge): Implement `produce`-style update with a recipe callback typed so the recipe can mutate locally but the outside type stays immutable. Hint at Immer without requiring it.

**Lesson 4: Pipe, curry, and the limits**
- Step 1 (explanation): What `pipe` buys you (reads top-down, no parens nesting). What it costs (typing N-arity is genuinely hard in TS). When a plain `const x = f(g(h(y)))` is just better.
- Step 2 (exercise): Write `pipe2(f, g)` and `pipe3(f, g, h)` typed correctly. Tests on string transforms.
- Step 3 (challenge): Write a typed `curry2`. Note: full variadic curry is parked as out-of-scope for sanity.

**Piston considerations:** All exercises are pure functions, single file, no external deps. The `Result` type is defined in the starter code. Tests use the same lightweight assertion helper as course 1.

**Reference material:**
- Book: *Effective TypeScript* (Vanderkam), items on union types and exhaustiveness (e.g., item 27, item 41).
- Book: *Domain Modeling Made Functional* by Scott Wlaschin (Pragmatic, 2018). F#-based, but the discriminated-union modeling style ports to TS almost line-by-line. This is the single best book on *why* you'd reach for ADTs in real code.
- Docs: <https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions>
- Community reference: Matt Pocock's "Discriminated unions" content (Total TypeScript Pro Essentials and YouTube shorts); Execute Program — *Modern JavaScript* immutable update modules (concepts port directly).

---

### 3.4 TS for Node / API — Intermediate

**Slug:** `typescript-node-api`
**Prereqs:** `typescript-fundamentals`. Comfortable with `async`/`await` and basic HTTP concepts.
**Sandbox:** Piston (`typescript` on Node, no network)
**Learner time:** ~4–5 hours
**Learning outcomes:**
- Type a request handler from request shape to response shape, including the failure path.
- Validate `unknown` JSON at the I/O boundary and produce a typed value on the inside.
- Type environment variables once and use them safely everywhere.
- Type async functions, including `Promise` rejection cases that don't appear in the type system (and what to do about it).

**Lesson 1: The boundary problem**
- Step 1 (explanation): "TypeScript's type system ends at the network." JSON arrives as `unknown`. The inside of the app is typed; the outside isn't. The job is to write a small set of functions that take `unknown` in and `T | ParseError` out.
- Step 2 (exercise): Write `parseUserPayload(input: unknown): Result<User, string>` using only structural checks (no Zod, no library). Tests pass valid, malformed, and adversarial payloads.
- Step 3 (exercise): Build a tiny `assert(condition, message)` that narrows when it returns. Tests use it in chained checks.

**Lesson 2: Typed environment**
- Step 1 (explanation): `process.env.X` is `string | undefined` everywhere it's read. The fix: parse it once, in one place, into a typed `Env` object. Crash early on missing required vars — never silently.
- Step 2 (exercise): Write a `loadEnv(raw: Record<string, string | undefined>): Env` that parses required strings, optional booleans, and a port number. Tests cover missing, malformed, and present.
- Step 3 (exercise): Type the `Env` object as `Readonly` and prove (with `@ts-expect-error`) that downstream code can't mutate it.

**Lesson 3: Async and errors**
- Step 1 (explanation): What a `Promise<T>` does and doesn't tell you (it tells you the resolve type; it tells you nothing about reject). The two responses: `Result`-wrap, or treat `catch` as an `unknown` boundary.
- Step 2 (exercise): Convert a function that throws on bad input into one returning `Promise<Result<T, E>>`. Tests on success and failure.
- Step 3 (exercise): A `withTimeout(promise, ms)` typed correctly, returning `Result<T, "timeout">`. Implementation via `Promise.race`.
- Step 4 (challenge): A `retry<T>(fn, { attempts, backoffMs })` with a typed `Result` return.

**Lesson 4: A typed mini HTTP layer**
- Step 1 (explanation): Build a *toy* request/response type — `Req<Body>` and `Res<Body>` — and a `Handler<ReqBody, ResBody>` type. No real HTTP server (Piston has no network); we simulate it with a function that takes a `Req` and returns a `Promise<Res>`.
- Step 2 (exercise): Write a `createUserHandler: Handler<CreateUserBody, UserResponse>`. Tests invoke it directly with mocked requests and assert the response shape and status.
- Step 3 (exercise): Add validation at the boundary using the patterns from lesson 1. Tests pass invalid bodies and assert a typed `400`.
- Step 4 (challenge): A typed `route(method, path, handler)` registry with literal types preserving the shape end-to-end. (Foreshadows what Hono/tRPC/Zod do for real.)

**Piston considerations:** No network, no real HTTP. We simulate the request/response layer in a single file. This is fine pedagogically — the goal is the *typing*, not the wire format. Flag in step copy: "in a real app, the framework gives you these types; we're building them once so you understand what the framework is doing."

**Reference material:**
- Book: *Effective TypeScript* (Vanderkam), chapters on type narrowing and on working with libraries — items 28 ("prefer types that always represent valid states"), 33, 46–48 are direct sources.
- Book: *Programming TypeScript* (Cherny) chapter on async, and chapter 11 on interop with JS.
- Docs: <https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-4.html#useunknownincatchvariables> and Node.js types reference.
- Community reference: Matt Pocock's videos on `Result` and on typing the boundary; Frontend Masters — *Production-Grade TypeScript* by Mike North (configuration and library design parts overlap); Execute Program *TypeScript Concepts*.

---

### 3.5 TS Type-Level Programming (Deep Cuts) — Advanced / Specific

**Slug:** `typescript-type-level`
**Prereqs:** `typescript-advanced-types`. The learner should be comfortable reading a 5-line conditional type without flinching.
**Sandbox:** Piston (`typescript`, type-only — runtime is trivial)
**Learner time:** ~6–8 hours. This is the longest course; we say so up front.
**Learning outcomes:**
- Write a recursive type and reason about its termination.
- Build a small template-literal parser at the type level (e.g., parse a path string into a tuple of segments).
- Use brand types and phantom types to enforce invariants the structural type system would otherwise erase.
- Read a `type-challenges` "hard" problem and decompose it into the patterns from this course.

**Lesson 1: Recursive types and tuple manipulation**
- Step 1 (explanation): Recursion at the type level — base case, recursive case, depth limits. TS has a recursion guard (~50 levels in practice); we name it.
- Step 2 (exercise): `Length<T extends readonly any[]>` — first attempt without recursion (use `T['length']`), then `Reverse<T>` which needs spread + recursion.
- Step 3 (exercise): `Concat<A, B>`, `Push<T, X>`, `Pop<T>`. Tests with `Equal`.
- Step 4 (challenge): `Flatten<T>` for nested tuples, with a depth parameter.

**Lesson 2: Template literal parsers**
- Step 1 (explanation): Strings as ASTs. The `${A}.${B}` pattern as a parser. Why this is a real tool, not a toy: think router path types, Tailwind class types, SQL column types.
- Step 2 (exercise): `Split<S, Sep>` returning a tuple of segments. Tests with several separators.
- Step 3 (exercise): `ParsePath<S>` for a router-style `/users/:id/posts/:postId` returning `{ id: string; postId: string }`.
- Step 4 (challenge): `Replace<S, From, To>` and `ReplaceAll<S, From, To>`.

**Lesson 3: Brand types and phantom types**
- Step 1 (explanation): Structural typing's blind spot. `UserId` and `PostId` are both `string` to TS by default; this is a real bug source. Brand types (`string & { __brand: "UserId" }`) make them distinct without runtime cost. Phantom types extend the idea to track invariants ("validated email," "non-empty array").
- Step 2 (exercise): Define `UserId` and `PostId` as branded strings and a `lookupUser(id: UserId)` that rejects a `PostId` at compile time. `@ts-expect-error` enforces it.
- Step 3 (exercise): A `NonEmptyArray<T>` brand and a `head` function on it that returns `T` (not `T | undefined`).
- Step 4 (challenge): An `Email` brand with a `parseEmail(s: string): Result<Email, string>` constructor — the only way to obtain an `Email`.

**Lesson 4: Decomposing a "hard" type challenge**
- Step 1 (explanation): A walkthrough of one `type-challenges` "hard" problem (e.g., `KebabCase` or `Camelize`). The lesson is the *decomposition method*: name the recursive shape, write the base case, write the recursive case, prove with `Equal`.
- Step 2 (exercise): `KebabCase<S>` from scratch.
- Step 3 (exercise): `Camelize<T>` over an object type — combines key remapping (course 2) with template literals.
- Step 4 (challenge): `DeepReadonly<T>` that handles arrays, tuples, and nested objects. Tests use `Equal` against a hand-written expected type and use `@ts-expect-error` to verify that mutation attempts at any nested level are rejected.
- Step 5 (challenge, optional): `Camelize<T>` extended to be recursive across nested objects. Hint at the depth limit and how to recognize when you're hitting it (a specific TS error: "Type instantiation is excessively deep and possibly infinite").

**Lesson 5: Knowing when to stop**
- Step 1 (explanation): Type-level programming has a real cost: compile time, error-message legibility, and the next person reading it. A short rant about the right moment to drop into runtime instead. We name the smell: "I have spent more than 30 minutes typing something that takes 5 minutes to write."
- Step 2 (exercise): Take an over-engineered type from lesson 4 and rewrite the API to need less type-level work. Tests: same external API, simpler internals.

**Piston considerations:** Type-only. The runtime program in many steps is `console.log("ok")`. Tests are `type _ = Equal<...>` lines. Piston's `tsc --noEmit` is the actual evaluator. We document this prominently in the course intro so learners aren't confused by the lack of runtime output.

**Reference material:**
- Book: *Effective TypeScript* (Vanderkam) — items on advanced type system use (items 50–55 in the 2nd edition discuss when type-level work pays and when it doesn't).
- Repo: `type-challenges/type-challenges` on GitHub — primary exercise source for inspiration, with credit. We **do not** copy challenges verbatim; we adapt and re-author.
- Docs: <https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html> and the `Recursive Conditional Types` section of the release notes for TS 4.1.
- Community reference: *Type-Level TypeScript* by Gabriel Vergnaud (full course is a reference for this entire sub-course); Matt Pocock's "Advanced Patterns" videos; Mike North's *Intermediate TypeScript* on Frontend Masters (brand types module specifically).

---

### 3.6 TS + React Primer — Specific

**Slug:** `typescript-react-primer`
**Prereqs:** `typescript-fundamentals`. Comfortable with React fundamentals (components, props, useState, useEffect). **Not** a React intro — we don't teach JSX from scratch.
**Sandbox:** **iframe-sandbox** (per ADR 016). Routed by `course.language === 'typescript-react'` (new language tag — flag for backend addition).
**Learner time:** ~3–4 hours
**Learning outcomes:**
- Type component props with literal unions, optional fields, and discriminated variants.
- Type the four hooks the learner uses every day (`useState`, `useEffect`, `useRef`, `useReducer`) without fighting the inferred types.
- Type event handlers without copying-pasting `React.ChangeEvent<HTMLInputElement>` from Stack Overflow.
- Build a generic component (e.g., a typed `Select<T>`) with a single type parameter.

**Lesson 1: Props, properly**
- Step 1 (explanation): `type Props = { ... }` vs `interface Props { ... }`. Why we use `type` for props (union props compose better). Optional vs required, default values, `children: ReactNode`.
- Step 2 (exercise): Type a `<Button>` with `variant: "primary" | "secondary" | "ghost"` and an optional `loading` boolean. Tests render and assert classes.
- Step 3 (exercise): Discriminated-union props — a `<Banner>` whose `kind: "info" | "warning" | "error"` requires different additional fields per kind. `@ts-expect-error` proves the misuse fails.

**Lesson 2: Hooks, typed**
- Step 1 (explanation): `useState` inference vs. explicit. When TS guesses wrong (`useState(null)` widening to `null`). `useRef<HTMLInputElement>(null)`. `useReducer` with a discriminated-union action.
- Step 2 (exercise): A counter component with `useReducer` and a typed action union. Tests fire actions and assert state.
- Step 3 (exercise): A typed `useDebouncedValue<T>` custom hook. Tests on string and number inputs.

**Lesson 3: Events, refs, and the DOM**
- Step 1 (explanation): The `React.SomethingEvent<HTMLSomething>` family. The trick: type the *handler*, not the event, by typing the prop you assign the handler to. Example: `const onChange: ChangeEventHandler<HTMLInputElement> = e => ...`.
- Step 2 (exercise): A controlled input with typed `onChange` and `onBlur`. Tests simulate input events.
- Step 3 (exercise): Forwarded ref to a child input. Tests assert focus behavior.

**Lesson 4: Generic components**
- Step 1 (explanation): When a component genuinely wants a generic. The classic case: `<Select<T> items={T[]} onChange={(t: T) => void} />`. Syntax oddity: generic components in `.tsx` need either a comma in `<T,>` or `extends unknown` to disambiguate from JSX.
- Step 2 (exercise): Build the typed `<Select<T>>`. Tests render with `Select<User>` and `Select<string>`.
- Step 3 (challenge): A typed `<Table<T>>` with a `columns: { key: keyof T; render: (row: T) => ReactNode }[]` prop.

**Lesson 5: The `satisfies` operator and friends**
- Step 1 (explanation): When a component author wants to *constrain* a config object's shape without losing the narrow inference of its literal values, `satisfies` is the right tool. Walk a concrete case (a `routes` object whose path strings should be inferred as literals while still satisfying a base shape).
- Step 2 (exercise): Refactor an over-annotated component config to use `satisfies`. Tests `Equal`-assert that the inferred narrow types survive.
- Step 3 (challenge, optional): Compare three approaches to typing a `theme` object — explicit annotation, no annotation, `satisfies`. Identify which one each preserves and loses.

**iframe considerations:** Per ADR 016, this course routes through `IframeSandboxRunner`, not Piston. Several constraints follow:
- **No real React installed in the iframe.** We bundle a pinned React + ReactDOM as inline `<script>` tags in the iframe `srcdoc`, plus an in-browser TS compiler (`@typescript/vfs` + `typescript` UMD, or `esbuild-wasm`). This is a non-trivial frontend infrastructure cost — flag for review.
- **Test runner via `postMessage`.** `testCode` mounts the component, asserts on the rendered DOM, and posts results back to the parent. Same contract as the existing `javascript-dom` course.
- **No JSX-runtime debate in the course copy.** We pick the classic runtime, document it, move on. Modern automatic JSX runtime is a bundler concern; this course teaches the type story, not the build story.
- **Compile-time type errors must be surfaced to the learner.** The browser TS compiler reports them; the test runner needs to display them as a "compile failed" panel separate from runtime test failures. A red runtime panel for a compile error is misleading and produces bug reports we don't want.
- **Cold-start latency.** First step in the course pays a ~300–800ms cost to load the in-browser TS compiler. We warm it on course-page mount, not on first "Run" click, to keep the first execution responsive.
- **No external network calls from inside the iframe in test scenarios.** Components that fetch data should mock the fetch in starter code; the iframe sandbox technically allows network calls but we avoid them for determinism and to honor the ADR's guidance about future Phase 3 review.

**Reference material:**
- Book: *Learning TypeScript* (Goldberg) chapter 12 (TS with React).
- Book: *Effective TypeScript* (Vanderkam) — selected items on library/framework typing apply.
- Docs: <https://react.dev/learn/typescript> and the React TypeScript Cheatsheet repo (`typescript-cheatsheets/react`).
- Community reference: Matt Pocock's *Advanced React and TypeScript* workshop (Total TypeScript) — single best paid resource on this material; Frontend Masters — *React and TypeScript v2* by Steve Kinney.

---

### 3.7 TS Build Config: tsconfig for Humans — Specific (proposed, optional)

**Slug:** `typescript-tsconfig-for-humans`
**Prereqs:** `typescript-fundamentals`.
**Sandbox:** Piston, compile-only (`tsc` invoked, output is the diagnostic stream)
**Learner time:** ~1.5 hours
**Learning outcomes:**
- Read an unfamiliar `tsconfig.json` and explain what each non-default flag is buying.
- Choose `target`, `module`, and `moduleResolution` for Node and for a bundler context, and know why "Node16" vs "NodeNext" vs "Bundler" exist.
- Predict which compile errors a given strictness flag will start producing on an untouched codebase.
- Diagnose a "works on my machine but not in CI" tsconfig drift in under five minutes.

**Lesson 1: The four flags that matter**
- Step 1 (explanation): Of the ~150 flags in `tsconfig.json`, four govern 90% of behavior: `strict`, `target`, `module`, `moduleResolution`. Everything else is a refinement.
- Step 2 (exercise): Given a `tsconfig.json` with `strict: false` and a source file, predict the compile errors and then enable `strict` to confirm.
- Step 3 (exercise): Same source file across `target: "ES2017"` vs `target: "ES2022"` — observe which down-leveling occurs in the emitted JS.

**Lesson 2: Strictness, flag by flag**
- Step 1 (explanation): What `strict: true` actually enables (eight flags in current TS). Walk each one with a one-line example. Highlight `noUncheckedIndexedAccess` (off by default even under `strict`, almost always worth turning on) and `exactOptionalPropertyTypes` (semantic gotchas worth knowing).
- Step 2 (exercise): Toggle `noUncheckedIndexedAccess` on a function that indexes into an array; fix the resulting errors with a guard.
- Step 3 (exercise): A tsconfig with `noImplicitAny: false` hides three real bugs in the source. Turn it on, find them, fix them.

**Lesson 3: Module resolution in 2026**
- Step 1 (explanation): The Node ESM/CJS situation, briefly. `moduleResolution: "Node16"` vs `"NodeNext"` vs `"Bundler"`. When `paths` and `baseUrl` are appropriate (almost only with a bundler) vs. when they cause runtime resolution to fail (Node, without a loader).
- Step 2 (exercise): Diagnose a `tsconfig` that compiles cleanly but produces JS that Node can't run. Fix by changing `module`/`moduleResolution`.

**Sandbox considerations:** Each step is a `tsconfig.json` + a tiny source file. The "test" is whether `tsc --noEmit` (or `tsc` for emit-checking steps) produces the expected diagnostic set. Piston needs to run `tsc -p .` against a multi-file working directory instead of single-file `ts-node` — verify the adapter supports a project-mode invocation, or extend it. **Flag for review.**

**Reference material:**
- Book: *Effective TypeScript* (Vanderkam) chapter on configuration (items 1–3 in current edition).
- Frontend Masters: Mike North's *Production-Grade TypeScript* — first module is the cleanest tsconfig walkthrough on video.
- Docs: <https://www.typescriptlang.org/tsconfig> (canonical reference) and <https://www.typescriptlang.org/docs/handbook/modules/reference.html> for module resolution specifics.
- Community reference: TypeScript team blog posts on `Bundler` resolution (TS 5.0); Andrew Branch's posts on Node ESM interop.

---

### 3.8 Zod as a Type-Design Tool — Specific (proposed, optional)

**Slug:** `typescript-zod-as-type-design`
**Prereqs:** `typescript-fundamentals` + `typescript-node-api`.
**Sandbox:** Piston with **bundled** Zod (single-file build of Zod inlined into starter code) — since `npm install` is forbidden in Piston steps, we ship the dep as part of the starter.
**Learner time:** ~2 hours
**Learning outcomes:**
- Reach for Zod when the runtime/compile-time gap is the *actual* problem (not as a default for every shape).
- Use `z.infer` to get the TypeScript type from the schema and explain why this is a one-source-of-truth win.
- Distinguish `z.input` and `z.output` and recognize the schemas where they differ (transforms, defaults).
- Compose Zod discriminated unions and connect them to the TS-side `switch`.

**Lesson 1: Schema-first vs. type-first**
- Step 1 (explanation): Two ways to start a model. Type-first: write `type User = { ... }`, parse manually at the boundary. Schema-first: write `const userSchema = z.object({ ... })`, derive the type from the schema. Each has costs; we pick a default (schema-first at the boundary, type-first in the core) and explain why.
- Step 2 (exercise): Convert a hand-written boundary parser from course 4 into a Zod schema. Tests are unchanged; behavior must match.

**Lesson 2: `infer`, `input`, `output`**
- Step 1 (explanation): `z.infer<typeof schema>` is the output type. For schemas with transforms or defaults, `z.input` and `z.output` differ — and that's a feature, not a bug. Walk the canonical example: a schema that takes a string and outputs a `Date`.
- Step 2 (exercise): Write a schema with `z.coerce.date()` and `z.string().default("anon")`. Assert the difference between input and output types using `Equal`.

**Lesson 3: Discriminated unions, both sides**
- Step 1 (explanation): `z.discriminatedUnion("kind", [...])` produces a TS discriminated union via `z.infer`. Show the `switch` on the inferred type with `assertNever` exhaustiveness.
- Step 2 (exercise): Model a small event log (`UserCreated`, `UserDeleted`, `EmailChanged`) as a discriminated union, validate, and reduce.
- Step 3 (challenge): Add a fourth event variant; the `switch` should fail to compile until handled.

**Lesson 4: The boundary, properly**
- Step 1 (explanation): Zod at the boundary, TS in the core. Inside the application, you never re-validate; you trust the type. The validation cost is paid once, at the edge.
- Step 2 (exercise): A request handler that validates with Zod, then passes a typed value through three internal functions. Tests cover invalid input → 400, valid input → 200.

**Sandbox considerations:** Bundling Zod into the starter file works but is ugly (~30KB of pre-amble per step). Alternative: extend the Piston runtime image to include a curated allowlist of common type-design libraries (Zod, Valibot, ArkType). **Flag for review** — this course is contingent on the bundling-vs-allowlist decision.

**Reference material:**
- Docs: <https://zod.dev>
- Talks: Colin McDonnell's conference talks on Zod design (multiple ReactConf / TSConf appearances).
- Book: *Effective TypeScript* (Vanderkam) items on validation libraries and the runtime-vs-compile-time boundary.
- Community reference: Matt Pocock's videos on Zod inference; Theo Browne's videos on Zod-at-the-boundary patterns; ArkType vs Zod comparison posts (useful as "we're not married to Zod" framing).

---

## 4. Cross-course exercise patterns

The curriculum reuses a small set of testable exercise shapes. Standardizing them keeps authoring sane and learner cognitive load low — the *exercise mechanic* shouldn't itself be a puzzle.

| Pattern | What it tests | Fits | Sandbox notes |
|---|---|---|---|
| **Pure function + value tests** | Runtime correctness | All Piston courses | Standard `assertEqual(actual, expected)` helper, no deps |
| **`@ts-expect-error` assertions** | The compiler catches what we expect | Fundamentals lesson 5; advanced types throughout; functional patterns lesson 1 | Comment is the assertion; if the next line *does not* error, `tsc` will flag the directive itself — that's our test |
| **Type-level `Equal<A, B>` assertions** | The derived type matches the expected one | Advanced types, type-level | Tiny helper in starter; runtime is trivial |
| **Discriminated-union exhaustiveness** | A new variant breaks the switch deliberately | Functional patterns; React primer (banner) | `assertNever` helper in starter |
| **Boundary parser tests** | `unknown` in, typed `Result` out, with adversarial inputs | Node/API course | Piston, no deps; adversarial JSON literals in testCode |
| **Render + assert** | Component renders; DOM has expected text/role | React primer only | iframe-sandbox; `postMessage` results contract per ADR 016 |
| **Compile-config tests** | A given `tsconfig.json` produces a given diagnostic | tsconfig-for-humans (proposed) | Requires `tsc -p .` support in Piston adapter — flag |

**Authoring conventions used across all courses:**

- Every starter file begins with a short, named comment block: `// Goal: ...` and `// Constraints: ...`. The learner reads the goal before reading code.
- testCode is a co-file (`*.test.ts`) referenced by the runner — never inlined in the same file as starter code. This keeps the editor view clean.
- Helpers (`assertEqual`, `assertNever`, `Equal<A,B>`) live in a single shared starter prelude per course, so the learner sees the same primitives every step.
- Hints, when present, are written as Socratic prompts ("what does the type of `x` resolve to on the failing line?"), not as solutions or near-solutions.
- Solutions are *not* shipped in-app. A learner who's stuck reads the hint, then walks away. The platform is for practice, not for completionism.

**Sandbox routing per sub-course:**

| Sub-course | Sandbox | Notes |
|---|---|---|
| `typescript-fundamentals` | Piston | No DOM, no React |
| `typescript-advanced-types` | Piston | Type-only assertions; `tsc --noEmit` is the evaluator |
| `typescript-functional-patterns` | Piston | Pure functions |
| `typescript-node-api` | Piston | Simulated request/response — Piston has no network |
| `typescript-type-level` | Piston | Type-only; runtime is `console.log("ok")` |
| `typescript-react-primer` | **iframe-sandbox** | Requires bundled React + in-browser TS compiler — infra task |
| `typescript-tsconfig-for-humans` | Piston (compile-only) | Needs `tsc -p .` — verify adapter supports it |
| `typescript-zod-as-type-design` | Piston | Zod bundled into starter (no `npm install`) — flag |

---

### Assessment philosophy

The course system has no LLM evaluator (per ADR 015). Pass/fail is what Piston (or the iframe runner) returns. This forces a discipline most LLM-evaluated courses skip: **the test cases are the rubric**. We hold three rules:

- **Tests must be readable.** A learner who fails a test should be able to read the test and understand what was expected. No clever assertion DSL, no magic; `assertEqual(actual, expected, "what we were checking")` is the spine.
- **Tests must catch the real failure modes, not just the happy path.** Every exercise carries at least one adversarial input or edge case (empty array, `undefined`, malformed JSON, off-by-one). A learner whose function passes only the happy-path test has not finished the exercise.
- **Tests don't grade style.** TS has no canonical style; we don't penalize code shape. The compiler and the runtime tests are the only judges.

For type-only steps, the rubric is `Equal<Actual, Expected>` plus, occasionally, `@ts-expect-error` directives on adversarial calls. We don't grade *how* the type was constructed — only that it satisfies the equality. This is intentional: there are usually multiple correct shapes for a type, and ranking them is not the platform's job.

---

## 5. Known pedagogical pitfalls

These are the failure modes we've watched other TS courses fall into. The curriculum is structured to avoid each one explicitly.

1. **The `any` shortcut.** Learners discover that adding `: any` makes the red squiggles stop. Without explicit cost framing, this becomes their default. **Mitigation:** in fundamentals lesson 5, an exercise where an `any` annotation makes a downstream test fail at runtime. The lesson is felt, not lectured.
2. **Generics as first-class topic.** Course outlines that introduce `<T>` in hour two lose people who haven't yet experienced the duplication that motivates parametricity. **Mitigation:** generics live in course 2, lesson 1 — and lesson 1 opens by reproducing the duplication from the previous course.
3. **`interface` vs `type` flame war.** Course copy that spends a paragraph debating this teaches nothing. **Mitigation:** we declare a default (`type`) and a one-line exception (`interface` for declaration merging or extending external module types) and never revisit it.
4. **`enum` as the obvious choice.** TS `enum` has runtime cost, weird semantics (numeric vs string), and no good interaction with the type system. **Mitigation:** literal unions everywhere; `enum` mentioned only in a "why we don't use this" paragraph in fundamentals lesson 2.
5. **Conditional types as a magic show.** `infer` and conditional types are easy to teach as puzzles and impossible to apply. **Mitigation:** every conditional-type exercise in course 2 is a type the learner has already used (`ReturnType`, `Awaited`) — they're rebuilding tools, not learning party tricks.
6. **Class hierarchies imported from Java/C#.** TS supports classes; this is not the same as them being the right tool. **Mitigation:** discriminated unions are the default for state in courses 3 and 6. Classes appear only when interop demands them (e.g., `Error` subclassing in course 4).
7. **`as` as type-checker bypass.** Learners use `as` to silence errors without the cost being explicit. **Mitigation:** course 1 lesson 5 explicitly frames `as` as "a promise to the compiler" and an exercise demonstrates a runtime crash from a broken cast.
8. **React types from copy-paste.** A learner who pastes `React.ChangeEvent<HTMLInputElement>` from Stack Overflow seven times is not a TS+React engineer. **Mitigation:** course 6 lesson 3 teaches the *handler-typing* technique that makes the event type fall out of context.
9. **Type-level programming for its own sake.** Course 5 risks producing learners who write incomprehensible utility types because they can. **Mitigation:** lesson 5 of that course is explicitly about *not* doing that — refactoring an over-engineered type back into something a colleague can read.
10. **Treating MVP fundamentals as "done."** The Sprint 014 fundamentals course is only 9 steps, half of them trivial. A learner who finishes it should not graduate to the advanced course directly. **Mitigation:** see §7 — we extend it.

---

## 6. External references

### Books

- **Josh Goldberg — *Learning TypeScript*** (O'Reilly, 2022). The single best modern intro. Maps almost 1:1 to courses 1 and 6. Recommended as the side-reading for fundamentals.
- **Dan Vanderkam — *Effective TypeScript: 83 Specific Ways to Improve Your TypeScript* (2nd ed., O'Reilly, 2024)**. The "items" format makes it the best exercise-rationale source: each item is essentially a lesson outline. Cited in courses 1, 2, 3, 4, 5, 7.
- **Boris Cherny — *Programming TypeScript*** (O'Reilly, 2019). Older, but its "10,000 foot view" framing and chapters on the type system remain pedagogically clean. Cited in courses 1, 2, 4.
- **Scott Wlaschin — *Domain Modeling Made Functional*** (Pragmatic Bookshelf, 2018). F# not TS, but the discriminated-union modeling style transfers directly. Primary reference for course 3.
- **Stefan Baumgartner — *TypeScript in 50 Lessons*** (Smashing Magazine, 2020). Useful as a counterpoint structure — short lessons, often DOM-flavored. Reference for the React primer's lesson sizing.
- **Marius Schulz — *TypeScript Evolution*** (blog series, ongoing — `mariusschulz.com`). Not a book, but the closest thing to a release-by-release narrative of the language. Useful when an exercise depends on a specific TS version's behavior.
- **Anton Korzunov — *Rebuilding the React TypeScript Cheatsheet*** (community resource, GitHub) — the maintenance notes are surprisingly good as a reference for course 6.

### Online platforms

- **Total TypeScript (Matt Pocock)** — `totaltypescript.com`. Workshops referenced: *Pro Essentials* (free intro), *Type Transformations* (course 2 backbone), *Advanced React and TypeScript* (course 6 backbone), *Advanced Patterns*. The `ts-reset` library and Pocock's blog posts are also useful supplementary material.
- **Type-Level TypeScript (Gabriel Vergnaud)** — `type-level-typescript.com`. The most rigorous treatment of conditional and recursive types in any paid course. Direct reference for course 5.
- **Frontend Masters** — `frontendmasters.com`. Mike North's *TypeScript Fundamentals v3*, *Intermediate TypeScript*, and *Production-Grade TypeScript* are the cleanest video walkthroughs of the same material. Steve Kinney's *React and TypeScript v2* is the React-side reference.
- **Execute Program** — `executeprogram.com`. *TypeScript Basics* and *TypeScript Concepts* courses. Spaced-repetition-driven; useful as a "after-class drill" recommendation, not as primary curriculum.
- **Egghead** — collections by Marius Schulz on Conditional Types and by John Lindquist on TS basics.
- **Udemy** — Stephen Grider's TS course is the most popular but skews toward "TS for Angular" and is not a great fit for our voice. Mention without recommending.

### Official documentation

- TypeScript Handbook — <https://www.typescriptlang.org/docs/handbook/intro.html> (the v2 handbook). Specific chapters cited per course.
- TypeScript Release Notes — <https://www.typescriptlang.org/docs/handbook/release-notes/> (especially 4.1 for template literal types, 4.4 for `unknown` in catch, 4.9 for `satisfies`, 5.x for the `const` type parameters).
- TSConfig Reference — <https://www.typescriptlang.org/tsconfig> (course 7).
- React TypeScript docs — <https://react.dev/learn/typescript>.
- React TypeScript Cheatsheets — <https://github.com/typescript-cheatsheets/react>.

### Community learning resources

- **`type-challenges/type-challenges`** GitHub repo — primary inspiration source for course 5 exercises. We adapt with credit; we do not copy verbatim.
- **`josh-goldberg/learning-typescript`** — companion exercises to the *Learning TypeScript* book.
- **Exercism — TypeScript track** — well-structured pure-function exercises, good for "if you want more drill" recommendations after course 1.
- **`typescript-cheatsheets`** umbrella org on GitHub — React, Next, others. Useful as quick-lookup material in course 6.
- **Matt Pocock's blog** (`mattpocock.com`) and YouTube channel — short-format reinforcement for almost every topic.
- **Sandi Metz's "Schemas of Trust"** talks — not TS-specific, but the intuition for "where do we validate, and once validated, what do we trust?" maps directly onto the boundary lessons in course 4.

---

## 7. Suggested implementation order

### Decision to flag for the reviewer: what to do with the Sprint 014 MVP

The current shipped course (`docs/specs/020-courses-mvp.md`, "TypeScript Fundamentals", 3 lessons / ~9 steps: Variables & Types, Arrays & Objects, Control Flow) is solid as far as it goes but does not produce a learner who can engage with the next course in this track. Two options:

**Option A — Replace.** Retire the MVP course slug `typescript-fundamentals` and replace its content with the 5-lesson `typescript-fundamentals` (Extended) defined in §3.1. The MVP's three lessons map cleanly into lessons 1–3 of the extension; the new lessons 4 (functions) and 5 (narrowing/`unknown`/`never`) are additive. Existing learner progress (completed step IDs) is invalidated — but the MVP shipped only weeks ago and the learner population is small.

**Option B — Stack.** Keep the MVP under its current slug, ship the extended fundamentals as a *separate* course (e.g., `typescript-fundamentals-2`), and link them in sequence on the catalog. Preserves progress; clutters the catalog and creates a confusing prereq story for downstream courses.

**Recommendation:** Option A. The MVP is a 9-step course whose stated purpose was "first vertical slice of the courses feature," not "the canonical fundamentals course." Replacing it now, while the learner base is small, costs less than living with a split track for years. Keep the MVP's exercise content — those exercises are good — and slot them into lessons 1–3 of the extended course.

**Open question for the reviewer:** is "invalidate existing progress on a course slug" a UX path we want, or do we need a one-time migration that maps old step IDs → new step IDs? This affects schema work in `course_progress` and is out of scope for this curriculum doc.

### Authoring rhythm

A note on production cadence, since "ship a 22-step course" is a non-trivial unit of work. We estimate, conservatively:

- Fundamentals (extended): ~3 author-days, mostly because the MVP exercises carry over.
- Functional patterns: ~3 author-days. Pure-function exercises author quickly; the hard part is exhaustiveness scenarios that feel real.
- Node/API: ~5 author-days. Each lesson needs a believable boundary scenario; bad fixtures here read as toy code.
- Advanced types: ~6 author-days. Type-level assertions are tedious to author by hand and easy to get subtly wrong (see open question 6 below).
- React primer: ~4 author-days for the *content*. Add an estimated sprint for the iframe-sandbox infra (bundled React + in-browser TS compiler).
- Type-level: ~8 author-days. Longest course, hardest to write, smallest audience — accept that the per-learner cost is high and ship it last.

These are author-days for a domain expert with a clean review pipeline, not calendar days. Reviews from C3 (Tomás Ríos) for any course that touches infra (4, 5, 6, 7, 8) and from Yemi Okafor are out of scope (no LLM in the learning context per ADR 015).

### Suggested ship order

| # | Sub-course | Why this position |
|---|---|---|
| 1 | `typescript-fundamentals` (extended, replacing MVP per Option A) | Prereq for everything else; the existing course is incomplete |
| 2 | `typescript-functional-patterns` | Short course; high payoff; reuses fundamentals patterns directly; doesn't require advanced types infrastructure |
| 3 | `typescript-node-api` | Demonstrates the platform's value to the working backend developer audience that overlaps heavily with Dojo's existing kata users |
| 4 | `typescript-advanced-types` | Bigger course, opens up the type-level track; ship after the platform has proven it can host content this size |
| 5 | `typescript-react-primer` | Requires iframe-sandbox infrastructure work (bundled React + in-browser TS compiler) — gated on that platform investment |
| 6 | `typescript-type-level` | Longest course, niche audience; ship last |
| 7 (optional) | `typescript-tsconfig-for-humans` | Gated on Piston `tsc -p .` support; small course, easy follow-up |
| 8 (optional) | `typescript-zod-as-type-design` | Gated on a decision about library bundling/allowlist in Piston |

**Open questions to resolve before content production:**

1. **Course slug migration** — see the Option A recommendation above. Needs a one-line product decision.
2. **`@ts-expect-error` semantics in the runner** — does the existing Piston adapter treat a `tsc` non-zero exit as a test failure? If yes, no work needed. If it currently only inspects the runtime stream, the runner needs a small change.
3. **iframe-sandbox + React** — bundling React + an in-browser TS compiler into the iframe `srcdoc` is a real frontend infra task. Estimate ~1 sprint of work before course 6 can be authored. Decide priority.
4. **Library allowlist in Piston** — needed for course 8 (Zod) and would unblock other courses (e.g., a hypothetical *Effect for TS*). Worth a separate ADR.
5. **Type-only test verdict UX** — courses 2 and 5 have steps where "passing" means "the file compiled." The course player's current results panel is built for runtime test cases (pass/fail with output). It needs to gracefully render "compile passed; no runtime tests" without looking broken.
6. **Authoring tool for type-level exercises** — type-level exercises with `Equal<A, B>` assertions are tedious to author by hand and easy to get subtly wrong. Worth a small internal CLI that takes a starter, a solution, and an expected type and emits the testCode. Not blocking, but worth noting.
