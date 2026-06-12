// =============================================================================
// TypeScript — scroll seed, W3 batch 1 (Lessons 0-2). The dojo's TypeScript
// crash course for JavaScript developers who shipped "TS-strict" without ever
// being sold the delta. Polyglot-first order, slug 'typescript':
//   order 1 — Lesson 0 (TypeScript in context) — 2 steps (read, predict)
//   order 2 — Lesson 1 (Inference)              — 3 steps (read, predict, kata)
//   order 3 — Lesson 2 (Shapes / structural)    — 3 steps (read, kata, playground)
// 8 steps seeded in batch 1 / 3 lessons. Batch 2 (L3-L5) seeds next.
//
// Direction: spec docs/courses/curricula/typescript/typescript.md; authoring
// drafts in typescript/lesson-{0,1,2}.md (content transcribed VERBATIM here,
// minus the smoke-marker comments). Figures registered in
// apps/web/src/scrolls/figures/data/typescript-figures.ts.
//
// COEXISTENCE NOTE: this NEW scroll uses slug 'typescript' and seeds as
// draft / isPublic:false. The LEGACY scroll (slug 'typescript-fundamentals',
// COURSE_DATA in seed-scrolls.ts) is NOT touched here — the rebuild-not-migrate
// hard-delete of the legacy slug is a publish-time decision deferred to the
// full-set smoke gate (Adrian's call). Until then the two coexist: legacy stays
// published, the new 'typescript' scroll stays a draft.
//
// Test harness: manual _t/_eq pattern (mirrors Ruby/Python/Rust), TS-shaped.
// The PistonAdapter combines the learner's `code` BEFORE the testCode
// (code + "\n\n" + testCode), so the harness header's _t/_eq/Equal and the
// learner's functions/types are both in scope for the assertions. Type-level
// assertions (Equal<...> lines, @ts-expect-error) live in testCode too — they
// gate at compile time. _eq is key-presence-aware per the §5 gate: it
// distinguishes {} from { k: undefined }. __DOJO_RESULT__ JSON footer for
// ExecuteStep parsing. Sandbox runs TypeScript 5.0.3 under strict.
//
// PROVISIONAL: the tsc error excerpts in reads/reveals are draft text pasted
// as-is; they get live-recaptured next (the figure footprint blocks too).
// =============================================================================

import { createHash } from 'node:crypto'

function seedUuid(name: string): string {
  const hash = createHash('sha256').update(`dojo-scroll-${name}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-')
}

const COURSE_ID = seedUuid('typescript')

const LESSON_0_ID = seedUuid('ts-l0-context')
const LESSON_1_ID = seedUuid('ts-l1-inference')
const LESSON_2_ID = seedUuid('ts-l2-shapes')

const STEP_0_1_ID = seedUuid('ts-s0-1-what-typescript-adds')
const STEP_0_2_ID = seedUuid('ts-s0-2-predict-which-command-catches')

const STEP_1_1_ID = seedUuid('ts-s1-1-the-compiler-already-knows')
const STEP_1_2_ID = seedUuid('ts-s1-2-predict-what-type-is-total')
const STEP_1_3_ID = seedUuid('ts-s1-3-kata-give-this-function-a-signature')

const STEP_2_1_ID = seedUuid('ts-s2-1-shapes-structure-not-names')
const STEP_2_2_ID = seedUuid('ts-s2-2-kata-define-a-user-shape')
const STEP_2_3_ID = seedUuid('ts-s2-3-playground-structural-compatibility')

const TYPESCRIPT_HARNESS_HEADER = String.raw`// ── dojo harness ──────────────────────────────────
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

const _results: Array<{ name: string; passed: boolean; message?: string }> = [];

function _show(v: unknown): string {
  if (v === undefined) return "undefined";
  if (v === null) return "null";
  if (typeof v !== "object") return JSON.stringify(v) ?? String(v);
  if (Array.isArray(v)) return "[" + v.map(_show).join(", ") + "]";
  const keys = Object.keys(v as object);
  return "{ " + keys.map((k) => k + ": " + _show((v as Record<string, unknown>)[k])).join(", ") + " }";
}

function _deepEq(a: unknown, b: unknown): boolean {
  if (a === b || (a !== a && b !== b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => _deepEq(x, (b as unknown[])[i]));
  }
  const ak = Object.keys(a as object);
  const bk = Object.keys(b as object);
  if (ak.length !== bk.length) return false;
  return ak.every(
    (k) =>
      Object.prototype.hasOwnProperty.call(b, k) &&
      _deepEq((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

function _eq<T>(actual: T, expected: T): void {
  if (!_deepEq(actual, expected)) {
    throw new Error("expected " + _show(expected) + " but got " + _show(actual));
  }
}

function _eqClose(actual: number, expected: number): void {
  if (Math.abs(actual - expected) > 1e-9) {
    throw new Error("expected " + expected + " but got " + actual);
  }
}

function _t(name: string, fn: () => void): void {
  try {
    fn();
    _results.push({ name, passed: true });
  } catch (e) {
    _results.push({ name, passed: false, message: e instanceof Error ? e.message : String(e) });
  }
}
// ──────────────────────────────────────────────────`

const TYPESCRIPT_HARNESS_FOOTER = String.raw`
// ── dojo harness footer ───────────────────────────
for (const r of _results) console.log(r.passed ? "✓ " + r.name : "✗ " + r.name + ": " + (r.message ?? ""));
const _ok = _results.every((r) => r.passed);
console.log("__DOJO_RESULT__ " + JSON.stringify({ ok: _ok, tests: _results }));`

export const TYPESCRIPT_COURSE_DATA = {
  id: COURSE_ID,
  slug: 'typescript',
  title: 'TypeScript',
  description:
    "The dojo's TypeScript crash course. For JavaScript developers who shipped \"TS-strict\" for a year without anyone selling them the delta. One mental model at a time — inference over annotation, the structural type system, the boundary types — taught with the compiler as second reader: the errors are the curriculum. Annotate the signature, infer the rest.",
  language: 'typescript',
  accentColor: '#3178C6',
  status: 'draft' as const,
  isPublic: false,
  externalReferences: [
    {
      title: 'TypeScript Handbook',
      url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
      kind: 'docs' as const,
    },
    {
      title: 'Effective TypeScript (Dan Vanderkam)',
      url: 'https://effectivetypescript.com/',
      kind: 'book' as const,
    },
    {
      title: 'Total TypeScript Tips (Matt Pocock)',
      url: 'https://www.totaltypescript.com/tips',
      kind: 'article' as const,
    },
  ],
}

// =============================================================================
// Lesson 0 — TypeScript in context
// =============================================================================
//
// 2 steps (read + predict). The read establishes the check-vs-strip split and
// stops; the tool-by-tool verdict is predict 0.2's reveal (de-spoiling, §2.3).

const STEP_0_1 = {
  id: STEP_0_1_ID,
  lessonId: LESSON_0_ID,
  order: 1,
  type: 'read' as const,
  title: 'What TypeScript adds — and where the benefit lives',
  instruction: `## Why this matters

You've shipped "TS-strict" code for a year without anyone selling you the delta. Here it is, in one read: what the type system actually buys you, the one cost it charges, and the toolchain fact that decides whether you're getting the benefit at all.

## The one-sentence contract

TypeScript is your JavaScript plus a static second reader. That reader catches shape mistakes before runtime, documents intent at function boundaries, and powers refactors — rename a field, add a variant, change a signature, and it tells you every site that broke. Then it **erases completely**: every type you write is stripped before the code runs. \`function add(a: number, b: number)\` ships as \`function add(a, b)\`. No runtime cost, and no runtime guarantee — the types are gone before the first line executes.

So the benefit isn't in the running program. It's in a pass that happens *before* the program runs.

## Checking is a separate pass from running

This is the fact most JavaScript developers half-know and get burned by: **checking your types and running your code are two different operations.** Much of the modern toolchain that runs or builds TypeScript skips the check entirely — that's where its speed comes from. Which means a pipeline can execute \`.ts\` files all day while the second reader you're paying for never opens the file once.

A pipeline with no checking pass is paying TypeScript's annotation cost for none of its benefit. *Which* of the tools you use check, and which only strip, is the next step's whole question — hold that thought.

## \`tsconfig.json\`, briefly

The config file exists; \`strict\` is the first flag that matters, and this scroll assumes it. The flag-by-flag tour is a different scroll.

## This sandbox

This scroll runs single-file TypeScript 5.0.3 in the sandbox — no DOM, no React, no \`npm install\`. The compile pass runs before your code: a type error here fails the step. That is exactly the behavior you want from CI.

So: which command would have caught a type error before your code ran?`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

// The tool-by-tool verdict — appended to every option's feedback at seed (per
// the lesson file's reveal section), so each answer path sees it. The player's
// predict schema has no separate reveal field.
const TS_TOOLING_REVEAL = `The split the read promised, made concrete:

| Command | Runs the file? | Checks the types? |
|---|---|---|
| \`tsc --noEmit\` | no — it only checks | **yes** |
| \`tsx\` | yes | no — strips and runs |
| \`node\` (≥23) | yes | no — strips and runs |
| \`esbuild\` | no — it builds | no — strips and emits |

One rule underneath all four: **stripping types is not checking them.** The speed of \`tsx\` / \`node\` / \`esbuild\` comes precisely from skipping the check. That's fine — that's the production pattern: a fast stripper runs and builds your code, and \`tsc --noEmit\` (in your editor and in CI) is the gate that actually reads it.

The benefit you came for — the second reader — only exists where that checking pass runs. If your pipeline strips and never checks, you're paying the annotation cost for none of the benefit. The rest of this scroll is about what that reader can do for you once it's actually running.`

const STEP_0_2 = {
  id: STEP_0_2_ID,
  lessonId: LESSON_0_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: which command catches the bug?',
  instruction: `The read said checking is a separate pass from running. Here's the file that proves it — commit to an answer before you reveal.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question:
      'Four commands, one file with a type error. Which one warns you about the bug *before* the code runs?',
    snippet: `// retries.ts
const retries: number = "3";
const remaining = retries - 1;
console.log(\`retries left: \${remaining}\`);`,
    options: [
      { id: 'a', text: '`tsc --noEmit retries.ts`' },
      { id: 'b', text: '`tsx retries.ts`' },
      { id: 'c', text: '`node retries.ts`' },
      { id: 'd', text: '`esbuild retries.ts`' },
    ],
    correct: 'a',
    feedback: {
      a: `Correct. \`tsc\` is the checker — the second reader from the read, run on demand. \`--noEmit\` says "check, but don't write any JavaScript out": you want the verdict, not the build. It reports the error and produces nothing. This is the command your editor runs on every keystroke and the one your CI runs before merge. Everything else in this list runs the file; only this one reads it first.\n\n${TS_TOOLING_REVEAL}`,
      b: `The fast-iteration reflex — \`tsx\` is what you reach for to run a \`.ts\` file without a build step, and it's genuinely great at that. But it strips the types and runs, by design: skipping the check is *where the speed comes from*. \`retries - 1\` becomes \`"3" - 1\`, JavaScript coerces, and you get \`2\` with no warning that \`retries\` was never a number. Running is not checking. The bug ships.\n\n${TS_TOOLING_REVEAL}`,
      c: `Two stale beliefs collide here. The old one — "Node can't run TypeScript" — is no longer true: since Node 23, \`node retries.ts\` strips the types and runs the file directly, no \`ts-node\`, no build. The trap is concluding that because it *runs* TS, it *checks* TS. It doesn't — Node strips and executes exactly like \`tsx\`, with zero type-checking. The file runs, coerces \`"3" - 1\` to \`2\`, and the bug ships. Node runs your TypeScript; it never reads it.\n\n${TS_TOOLING_REVEAL}`,
      d: `The build-tool reflex. \`esbuild\` is a transpiler — it converts TypeScript to JavaScript at high speed by *stripping* the types, never *checking* them. It's a type-eraser with a build step bolted on, not a type-checker. It will happily emit the broken file and report success. Fast, and silent about the bug. It ships.\n\n${TS_TOOLING_REVEAL}`,
    },
  },
}

const LESSON_0 = {
  id: LESSON_0_ID,
  scrollId: COURSE_ID,
  order: 1,
  title: 'TypeScript in context',
}

// =============================================================================
// Lesson 1 — Inference: annotate less, the compiler already knows
// =============================================================================
//
// 3 steps (read + predict + kata). The read embeds the before-after figure
// ts-annotation-maximalism. Kata 1.3 is production gesture G1 — sign the
// function (typed params, one optional param, explicit return type).

const STEP_1_1 = {
  id: STEP_1_1_ID,
  lessonId: LESSON_1_ID,
  order: 1,
  type: 'read' as const,
  title: 'The compiler already knows',
  instruction: `## Why this matters

Open your last TypeScript file. Every local has an annotation — \`const total: number = 0\`, \`const items: string[] = []\` — the signatures are half-duplicated into comments, and somewhere a value crossed a boundary as \`any\` and a typo rode it all the way to production. Here's the part the year of "TS-strict" never told you: the annotations on those locals were never the type safety. The *checker* was. And it was already doing its job on the lines you didn't annotate.

## Inference is the default, not a fallback

The compiler types un-annotated code from the values and the flow. \`const items = ["a", "b"]\` is \`string[]\` with zero annotations. A function's return type flows out of its body. A callback gets its parameter types from context — in \`items.map(s => s.length)\` the compiler already knows \`s\` is a \`string\`, so \`.length\` is checked. Annotation-free is not untyped. It never was.

## \`const\` infers the literal; \`let\` widens

\`\`\`typescript
const status = "shipped"; // type is "shipped" — the exact literal
let phase = "shipped";    // type is string — it has to stay reassignable
\`\`\`

This is your first sighting of literal types; Lesson 2 builds whole unions out of them. (\`as const\` freezes that literal inference across an object — named here, used there.)

## The rule: annotate the signature, infer the rest

Parameters can't be inferred from thin air — they **are** the contract, and annotating them is documentation the compiler enforces. So annotate signatures; let inference carry the locals.

\`\`\`typescript
// Annotate the boundary. Let the body infer.
function totalPrice(prices: number[]): number {
  const subtotal = prices.reduce((sum, p) => sum + p, 0); // subtotal: number, inferred
  return subtotal * 1.08;                                  // return checked against : number
}
\`\`\`

A return-type annotation is optional but worth it on exported functions: it locks the contract, so a mistake in the body errors *at the function*, not at fifty call sites. One signature form surprises every JS dev on day one — an \`async\` function's return annotation is \`Promise<T>\`, never just \`T\`.

:figure[before-after]{id="ts-annotation-maximalism"}

Before you write a signature, predict what the compiler already knows from the values alone.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

// The inference walk — appended to every option's feedback at seed (per the
// lesson file's reveal section), so each answer path sees it.
const TS_INFERENCE_REVEAL = `The chain, link by link:

- \`const prices = [120, 80, 95]\` — inferred \`number[]\` from the literal. No annotation.
- \`reduce\`'s initial value \`0\` is a \`number\`, which fixes the accumulator type: \`sum\` is \`number\`.
- \`prices\` is \`number[]\`, so the element \`p\` is \`number\`.
- \`sum + p\` is \`number\`; that's what each step returns, so \`reduce\` returns \`number\`.
- \`total\` is \`number\`.

The thesis of this lesson, restated: **un-annotated is not untyped.** The compiler inferred a precise type through a whole chain you didn't touch. The annotation you owe is the *signature* — the boundary where the compiler can't read your intent from values. Everything inside, it already knows.`

const STEP_1_2 = {
  id: STEP_1_2_ID,
  lessonId: LESSON_1_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: what type is total?',
  instruction: `Not one annotation in this snippet. Commit to a type for \`total\` before you reveal.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'What type does `total` have?',
    snippet: `const prices = [120, 80, 95];
const total = prices.reduce((sum, p) => sum + p, 0);`,
    options: [
      { id: 'a', text: '`any` — nothing was annotated' },
      { id: 'b', text: '`number`' },
      { id: 'c', text: "`unknown` — the compiler can't be sure" },
      { id: 'd', text: '`number | undefined` — empty arrays exist' },
    ],
    correct: 'b',
    feedback: {
      a: `This is the model the whole lesson exists to break, so it's worth sitting with. \`any\` is what you get when the type system gives up — and it never gave up here. \`prices\` is \`number[]\` (inferred from the literal), \`reduce\`'s signature carries that element type into \`sum\` and \`p\`, the initial value \`0\` fixes the accumulator as \`number\`, and \`sum + p\` stays \`number\` the whole way down. TypeScript infers through the entire chain. You've been paying annotation tax on information the compiler already had.\n\n${TS_INFERENCE_REVEAL}`,
      b: `Correct, and there's no annotation anywhere that says so. Inference flows from the array literal (\`number[]\`) into \`reduce\`, whose signature ties the accumulator's type to the initial value \`0\` — a \`number\`. \`sum + p\` is \`number\`; the result is \`number\`. The compiler read the values and the call, and concluded the type you'd have typed by hand.\n\n${TS_INFERENCE_REVEAL}`,
      c: `This confuses inference with the boundary type. \`unknown\` is for values the compiler genuinely *cannot see* — JSON off the wire, a thrown error, anything that entered your program from outside the type system (Lesson 4). Here nothing entered from outside: \`prices\` is a literal the compiler can read end to end, so there's nothing to be unsure about. It infers \`number\`.\n\n${TS_INFERENCE_REVEAL}`,
      d: `A sharp guess, and it's a real distinction — just not this overload. \`reduce\` *with an initial value* (the \`0\` here) always returns the initial value's type: \`number\`, never \`number | undefined\`, because the initial value is what comes back when the array is empty. The overload that omits the initial value is the dangerous one — \`[].reduce((a, b) => a + b)\` throws at runtime on an empty array. The \`0\` is what makes this safe and makes the type plain \`number\`.\n\n${TS_INFERENCE_REVEAL}`,
    },
  },
}

const STEP_1_3 = {
  id: STEP_1_3_ID,
  lessonId: LESSON_1_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Give this function a signature',
  instruction: `## Your task

\`applyDiscount\` works today — it just has no types. Give it a signature: annotate the parameters, mark the one that's optional, and declare the return type. The body stays exactly as it is; the work is the contract on the first line.

One parameter doesn't always arrive. The caller may pass a discount \`code\` or may not:

\`\`\`typescript
applyDiscount(200, 10)        // -> 180   (no code)
applyDiscount(200, 10, "VIP") // -> 171   (VIP code, extra 5% off)
\`\`\`

Mark that parameter optional in the signature, and notice what its type becomes *inside* the function once you do — the body already handles the case where it's absent, so the type should reflect that it might be.

**On the test block below — read it, don't write it.** The tests mix two kinds of assertion:

- \`_t("...", () => { _eq(actual, expected) })\` — ordinary runtime checks on the three behaviors.
- Lines using \`@ts-expect-error\`, \`Equal<...>\`, and \`ReturnType<typeof ...>\` — these are *type-level* assertions, harness furniture. Read them as assertions; you don't write or edit them. The operators behind them (\`ReturnType\`, indexed access, \`Equal\`) are taught later in the scroll.

A word on \`@ts-expect-error\`, since this is where you first meet it: the directive **is** the assertion — it says "the next line must fail to compile." If that line ever starts compiling (because someone fixed the underlying type), the compiler flags the *directive itself* and the step fails. That makes it a sharp tool, not a test framework: a stale \`@ts-expect-error\` flips to a failure of its own. In this scroll it's test furniture; in your own code, keep it narrow and temporary.`,
  starterCode: `// applyDiscount(200, 10) -> 180 ; applyDiscount(200, 10, "VIP") -> 171
// Give this function a signature: typed params, an optional param, a return type.
function applyDiscount(price, percent, code) {
  const base = price * (1 - percent / 100);
  return code === "VIP" ? base * 0.95 : base;
}
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
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
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: `The third argument sometimes doesn't arrive — the body already guards for that with \`code === "VIP"\`. TypeScript has a way to mark a parameter as *may-be-absent* in the signature itself, rather than forcing every caller to pass it.

Once you mark it that way, ask what \`code\`'s type becomes *inside* the function: it's no longer just the text type you'd expect — the "might not be here" possibility is now part of the type, and the body has to be written so it survives that. The first two parameters carry no such doubt; they're always there.`,
  solution: `function applyDiscount(price: number, percent: number, code?: string): number {
  const base = price * (1 - percent / 100);
  return code === "VIP" ? base * 0.95 : base;
}
`,
  alternativeApproach: `You may have spelled the optional parameter the long way:

\`\`\`typescript
function applyDiscount(price: number, percent: number, code: string | undefined): number {
\`\`\`

This compiles and types the body identically — \`code\` is \`string | undefined\` either way. The difference is at the *call site*: \`code?: string\` makes the argument genuinely optional (\`applyDiscount(120, 10)\` is legal), while \`code: string | undefined\` forces every caller to pass *something*, even if it's \`undefined\` (\`applyDiscount(120, 10, undefined)\`). When a parameter can be omitted, \`?\` is the honest spelling — it says "optional" at the boundary, not just "could be undefined" inside. The two only coincide on the body's view of the type; they differ on what callers are allowed to write.`,
}

const LESSON_1 = {
  id: LESSON_1_ID,
  scrollId: COURSE_ID,
  order: 2,
  title: 'Inference: annotate less, the compiler already knows',
}

// =============================================================================
// Lesson 2 — Shapes: the type system is structural
// =============================================================================
//
// 3 steps (read + kata + playground). The read embeds the disambiguation
// figure ts-union-vs-enum. Kata 2.2 is production gesture G2 (write the shape).
// Its _eq must be key-presence-aware: { name: undefined } is distinct from {}.
// Playground 2.3 is a kata with data.kind 'playground' and a trivially-true
// assertion; the four prompts ship as numbered comments in the starter.

const STEP_2_1 = {
  id: STEP_2_1_ID,
  lessonId: LESSON_2_ID,
  order: 1,
  type: 'read' as const,
  title: 'Shapes: the compiler reads structure, not names',
  instruction: `## Why this matters

A field that should only ever hold \`"idle"\`, \`"loading"\`, or \`"ready"\`, typed as \`string\`. Someone writes \`"laoding"\`, review approves it, and it breaks in production where no test was looking. The type system has two tools that make that typo a compile error: shapes pin down what a value contains; literal unions pin down which values a field may hold.

## Object types and optional fields

A \`type\` describes the shape a value must have:

\`\`\`typescript
type User = { id: string; name?: string };
\`\`\`

The \`?\` on \`name\` means the field may be absent, and the compiler forces every read of it to handle that. The \`user.name.trim()\` that crashed with *Cannot read properties of undefined* in your JS is a compile error here: \`name\` is \`string | undefined\`, and \`undefined\` has no \`.trim()\`. The benefit isn't the annotation — it's that the absent case can no longer be forgotten.

## Structural compatibility: shape, not name

Two types with matching shapes are interchangeable — no \`implements\`, no registration, no shared base class. This is the duck typing you already practise in JS, with a reader checking the duck. A value with **extra** fields still satisfies a narrower type, as long as it arrives through a variable:

\`\`\`typescript
type Named = { name: string };
const account = { name: "Ada", role: "admin" };
const n: Named = account; // fine — account has everything Named needs
\`\`\`

## The excess-property surprise

The one asymmetry that bites everyone in week one: the same extra field is *rejected* when the value is an object literal written directly at the annotation.

\`\`\`typescript
type User = { id: string };
const a: User = { id: "1", age: 3 };   // error: 'age' does not exist in type 'User'
const raw = { id: "1", age: 3 };
const b: User = raw;                    // no error — same fields, via a variable
\`\`\`

Excess-property checking is a deliberate extra pass that fires only on fresh literals, to catch typo'd property names (\`naem\`) where you wrote them. Through a variable, structural compatibility takes over and the extra field is allowed. The playground pokes exactly this.

## \`type\` vs \`interface\`, in one rule

Reach for \`type\` by default; reach for \`interface\` only when you need declaration merging or are augmenting an external module's types — both rare in application code. That's the whole rule.

## Literal unions, over strings and over \`enum\`

For a fixed set of named values, the right type is a **literal union**:

\`\`\`typescript
type Status = "idle" | "loading" | "ready";
\`\`\`

This beats \`string\` (the typo \`"laoding"\` is now a compile error) and it beats \`enum\`. The difference from \`enum\` isn't style — it's **runtime footprint**: a literal union erases to nothing, while an \`enum\` emits a real JavaScript object into your bundle. The figure shows the actual emitted output of each, side by side.

:figure[disambiguation]{id="ts-union-vs-enum"}

\`enum\` still has a place — interop with code that already ships one — but that's a deep-dive concern (\`typescript-build-and-config\`), not your default. Default to the union.

Next: write a shape with optional fields and a function that survives them.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_2_2 = {
  id: STEP_2_2_ID,
  lessonId: LESSON_2_ID,
  order: 2,
  type: 'kata' as const,
  title: 'Define a User shape and read its optional fields safely',
  instruction: `## Your task

Define a \`User\` shape and a function that reads it without crashing on the missing pieces.

1. **\`type User\`** — three fields: \`id\` is always present (a \`string\`); \`name\` and \`email\` are **optional** strings. The optionality is the point — say it in the type, so the compiler holds you to it.
2. **\`getDisplayName(user: User): string\`** — return the first of these that's present: \`name\`, then \`email\`, then \`id\`. \`id\` is never absent, so the function always returns a \`string\`.

\`User\` is the shape you'll keep using — it comes back in Lesson 4 (a boundary guard) and Lesson 5 (a key-picking helper). Get its three fields right here and you read it without re-explanation later.

### What's expected

\`\`\`typescript
getDisplayName({ id: "u1", name: "Ada" })                    // "Ada"
getDisplayName({ id: "u2", email: "ada@dojo.dev" })          // "ada@dojo.dev"
getDisplayName({ id: "u3" })                                 // "u3"
getDisplayName({ id: "u4", name: "Ada", email: "x@y.z" })    // "Ada"
\`\`\``,
  starterCode: `// Define \`type User\` here: id (always present), name and email (optional).

function getDisplayName(user: User): string {
  // Your code here
}
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
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

// A key set to \`undefined\` must behave like an absent key — falls through to id.
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
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: `Two of the three fields may be missing, and the type has to say so — once you mark a field optional, its type inside the function becomes "the string, or \`undefined\`". The body then has to survive that: which JS operator you already reach for every day collapses "the first one of these that actually exists" into a single expression? The shape is the new work; the fallback chain is the JS you already write.`,
  solution: `type User = { id: string; name?: string; email?: string };

function getDisplayName(user: User): string {
  return user.name ?? user.email ?? user.id;
}
`,
  alternativeApproach: `\`??\` is the precise tool here (it falls through only on \`null\`/\`undefined\`), but \`user.name || user.email || user.id\` also passes — the fields are strings, and an empty \`name\` falling through to \`email\` is arguably the behavior you want anyway. The reason \`??\` is the safer default in real code: \`||\` also falls through on \`""\`, \`0\`, and \`false\`, which bites the day a legitimate empty-string or zero value should have been kept. Either way, the work was the *shape* — the compiler now refuses any call site that forgets \`id\`.`,
}

const STEP_2_3 = {
  id: STEP_2_3_ID,
  lessonId: LESSON_2_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Playground: explore structural compatibility',
  instruction: `## Try it

This step is a playground — no verdict, no pass/fail. The button runs whatever the file says. The catch for a type-system playground: **the output you're reading is the compiler's, not the program's.** A red squiggle (and the \`tsc\` error under it) is the result you came to see — not a failure to fix. When a prompt below says "what does the compiler say", the error message *is* the answer.

The starter carries **four numbered prompts as comments** — work through them in order. Each is an uncomment or a one-token edit; none asks you to re-type code from this instruction.

1. **Prompt 1** removes a required field. You know the assignment will break — the question is *what the compiler says, and on which line*. Read the message: that's the skill.
2. **Prompt 2** is the excess-property asymmetry from the read: the same extra field, once on a direct literal and once through a variable. One errors, one doesn't. Predict which before you uncomment.
3. **Prompt 3** makes a field optional on one side only. The assignment breaks in exactly one direction. Find which, and say why in your head before checking.
4. **Prompt 4** is open: change a field's type on one side and watch where the incompatibility surfaces. There's no "right" answer — you're building a feel for which direction structural compatibility flows.`,
  starterCode: `type Contact = { id: string; name: string };

const full = { id: "c1", name: "Ada" };
const ok: Contact = full; // compiles — shape matches

// 1. Remove \`id\` from \`Contact\` above (leave \`full\` as it is). What does the
//    compiler say about the \`ok\` assignment, and on which line — the type, or
//    the assignment? Predict, then check.

// 2. Excess-property asymmetry. Uncomment both lines:
// const direct: Contact = { id: "c2", name: "Bo", role: "admin" };
// const viaVar = { id: "c3", name: "Cy", role: "admin" };
// const indirect: Contact = viaVar;
//    One of these errors on \`role\`, one does not. Which, and why?

// 3. Optionality is directional. Uncomment:
// type Loose = { id: string; name?: string };
// const strict: Contact = ({ id: "c4", name: "Di" } as Loose);
//    The assignment breaks in one direction only. Which way is safe — a value
//    that MIGHT be missing a field flowing into one that REQUIRES it, or the
//    reverse? Read the error to confirm your guess.

// 4. Open: give \`full\` a field a number where \`Contact\` wants a string, or vice
//    versa, and watch which line the incompatibility lands on.
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
// Playground: trivially-true assertion keeps the backend uniform; the frontend
// hides the verdict UI.
_t("explored structural compatibility", () => { _eq(true, true); });
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: null,
  solution: `// Playground — no solution to reach. The prompts are observations, not a target.
// Prompt 1 surfaces TS2741 ("Property 'id' is missing"); prompt 2 surfaces TS2353
// ("Object literal may only specify known properties") on the direct literal only;
// prompt 3 surfaces TS2741/TS2322 in the unsafe direction. Each is the lesson.
`,
  alternativeApproach: null,
  data: { kind: 'playground' as const },
}

const LESSON_2 = {
  id: LESSON_2_ID,
  scrollId: COURSE_ID,
  order: 3,
  title: 'Shapes: the type system is structural',
}

export const TYPESCRIPT_LESSONS = [LESSON_0, LESSON_1, LESSON_2]

export const TYPESCRIPT_STEPS = [
  STEP_0_1, STEP_0_2,
  STEP_1_1, STEP_1_2, STEP_1_3,
  STEP_2_1, STEP_2_2, STEP_2_3,
]
