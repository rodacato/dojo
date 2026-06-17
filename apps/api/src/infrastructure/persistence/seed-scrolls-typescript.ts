// =============================================================================
// TypeScript — scroll seed, COMPLETE (Lessons 0-5). The dojo's TypeScript
// crash course for JavaScript developers who shipped "TS-strict" without ever
// being sold the delta. Polyglot-first order, slug 'typescript':
//   order 1 — Lesson 0 (TypeScript in context) — 2 steps (read, predict)
//   order 2 — Lesson 1 (Inference)              — 3 steps (read, predict, kata)
//   order 3 — Lesson 2 (Shapes / structural)    — 3 steps (read, kata, playground)
//   order 4 — Lesson 3 (Narrowing)              — 5 steps (predict, read, kata, kata, challenge)
//   order 5 — Lesson 4 (Escape hatches)         — 3 steps (read+inline, kata, playground)
//   order 6 — Lesson 5 (Generics + capstone)    — 4 steps (read+inline, kata, kata, challenge)
// 20 steps seeded / 6 lessons. Full scroll seeded across W3 batches 1-2.
//
// Direction: spec docs/courses/curricula/typescript/typescript.md; authoring
// drafts in typescript/lesson-{0..5}.md (content transcribed VERBATIM here,
// minus the smoke-marker comments). Figures registered in
// apps/web/src/scrolls/figures/data/typescript-figures.ts.
//
// Legacy slug `typescript-fundamentals` is hard-deleted at the tail of
// seedAllScrolls() via removeLegacyScrollBySlug — the crash-course this
// file seeds replaces it.
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
const LESSON_3_ID = seedUuid('ts-l3-narrowing')
const LESSON_4_ID = seedUuid('ts-l4-escape-hatches')
const LESSON_5_ID = seedUuid('ts-l5-generics')

const STEP_0_1_ID = seedUuid('ts-s0-1-what-typescript-adds')
const STEP_0_2_ID = seedUuid('ts-s0-2-predict-which-command-catches')

const STEP_1_1_ID = seedUuid('ts-s1-1-the-compiler-already-knows')
const STEP_1_2_ID = seedUuid('ts-s1-2-predict-what-type-is-total')
const STEP_1_3_ID = seedUuid('ts-s1-3-kata-give-this-function-a-signature')

const STEP_2_1_ID = seedUuid('ts-s2-1-shapes-structure-not-names')
const STEP_2_2_ID = seedUuid('ts-s2-2-kata-define-a-user-shape')
const STEP_2_3_ID = seedUuid('ts-s2-3-playground-structural-compatibility')

const STEP_3_1_ID = seedUuid('ts-s3-1-predict-inside-the-if-what-type')
const STEP_3_2_ID = seedUuid('ts-s3-2-narrowing-every-if-teaches')
const STEP_3_3_ID = seedUuid('ts-s3-3-kata-narrow-a-three-way-union')
const STEP_3_4_ID = seedUuid('ts-s3-4-kata-finish-the-paymentstatus-union')
const STEP_3_5_ID = seedUuid('ts-s3-5-challenge-add-a-variant')

const STEP_4_1_ID = seedUuid('ts-s4-1-three-escape-valves')
const STEP_4_2_ID = seedUuid('ts-s4-2-kata-unknown-in-user-out')
const STEP_4_3_ID = seedUuid('ts-s4-3-playground-escape-hatches')

const STEP_5_1_ID = seedUuid('ts-s5-1-motivated-generics')
const STEP_5_2_ID = seedUuid('ts-s5-2-kata-write-the-generic')
const STEP_5_3_ID = seedUuid('ts-s5-3-kata-pick-a-subset-of-keys')
const STEP_5_4_ID = seedUuid('ts-s5-4-challenge-capstone-typed-webhook')

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

// Footer emits ONLY the __DOJO_RESULT__ line — no per-test ✓/✗ echo. Piston's
// default stdout cap is 1024 bytes; the capstone's 10-test result already nears
// it, and the legacy ✓/✗ lines (which ExecuteStep ignores once __DOJO_RESULT__
// is present) pushed the total over the cap → "stdout length exceeded". Raising
// Piston's output_max_size at deploy is the headroom fix; this is the floor.
const TYPESCRIPT_HARNESS_FOOTER = String.raw`
// ── dojo harness footer ───────────────────────────
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
  // PUBLISH GATE (prod reseed precondition): before reseeding production with
  // this published, the Piston deploy MUST raise max_run_timeout (>=8000) and
  // output_max_size — TS compiles at run (~2.7s floor) and the capstone's test
  // output exceeds Piston's 1024-byte stdout cap. Published without it, TS
  // katas time out. See CHANGELOG (S030) and docs/ROADMAP.md.
  status: 'published' as const,
  isPublic: true,
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
  instruction: `## What this is

A **crash course, not a tutorial.** It's for JavaScript developers who already shipped "TS-strict" code without ever being sold the delta — you've met the syntax, you're here to *practice under pressure*, not to be walked through "what a type is". Six lessons, no hand-holding. The compiler is your **second reader**, and its errors *are* the curriculum: every kata is judged by the tests and the type-checker, not by a vibe. When you fail twice, the hints sharpen — but the answer stays yours to earn.

## Why this matters

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
  hint: null,
  hints: [
    `The third argument sometimes doesn't arrive — the body already guards for that with \`code === "VIP"\`. TypeScript has a way to mark a parameter as *may-be-absent* in the signature itself, rather than forcing every caller to pass it. The first two parameters carry no such doubt; they're always there.`,
    `Mark that parameter optional with a \`?\` after its name. Notice what it does to the type *inside* the function: an optional parameter is the text type *or* \`undefined\`, and the body has to survive that. The two required params get plain type annotations; the return type goes after the parameter list.`,
  ],
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

// =============================================================================
// Lesson 3 — Narrowing: the compiler reads your control flow
// =============================================================================
//
// 5 steps (predict + read + kata + kata + challenge). Predict 3.1 OPENS the
// lesson, before the read (§2.3): Felipe holds "static types can't change in a
// branch" with commitment, so predict-first is the honest order. The narrowing
// reveal is appended to every 3.1 option's feedback. assertNever ships in the
// harness prelude from this lesson on; here it lives in each kata/challenge
// testCode so the type-level switch closures compile.

// The narrowing reveal — appended to every option's feedback at seed (per the
// lesson file's reveal section), so each answer path sees it.
const TS_NARROWING_REVEAL = `The shape to carry into the read: **every \`if\`, \`typeof\`, and equality check you write teaches the compiler something about the variable**, and the type inside the branch reflects it. Inside \`typeof x === "string"\`, \`x\` is \`string\`. After it, \`x\` is \`number\` — the compiler subtracted what the branch ruled out. You've written these checks for a decade; what's new is that they're now load-bearing for types, not just for runtime.`

const STEP_3_1 = {
  id: STEP_3_1_ID,
  lessonId: LESSON_3_ID,
  order: 1,
  type: 'predict' as const,
  title: 'Predict: inside the if, what type does x have?',
  instruction: `No read yet. Before this lesson explains anything, commit to an answer — your guess here is the lesson's starting line.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'Inside the `if`, on the marked line, what type does `x` have?',
    snippet: `function format(x: string | number): string {
  if (typeof x === "string") {
    // what type is \`x\` here?
    return x;
  }
  return x.toFixed(2);
}`,
    options: [
      { id: 'a', text: '`string` — the compiler knows the typeof check passed' },
      { id: 'b', text: "`string | number` — a static type can't change inside a branch" },
      { id: 'c', text: '`string & number` — both, intersected, since both were possible' },
      {
        id: 'd',
        text: "`any` — type checks happen at compile time, the compiler can't read a runtime `if`",
      },
    ],
    correct: 'a',
    feedback: {
      a: `Correct. The \`typeof x === "string"\` check isn't just a runtime guard — the compiler reads it and **re-types \`x\` to \`string\` for the rest of that branch**. And it subtracts what it learned: in the code after the \`if\`, \`x\` is \`number\`, which is why \`x.toFixed(2)\` is legal there and would have been an error above. This is *narrowing*, and the read step is about how much of your existing control flow already does it.\n\n${TS_NARROWING_REVEAL}`,
      b: `This is the model the whole lesson exists to break — the daily-driver assumption from JS and most other languages that a variable's static type is fixed once declared. In TypeScript it isn't: the type flows through your control flow. The \`typeof\` check narrows \`x\` to \`string\` inside the branch, and to \`number\` after it. The check you wrote to make the code *run* correctly is the same check the compiler reads to make the code *type* correctly.\n\n${TS_NARROWING_REVEAL}`,
      c: `The intersection of \`string\` and \`number\` is \`never\` — no value is both at once, so this can't be what \`x\` is inside a branch you can actually reach. The check *removes* the \`number\` possibility rather than combining the two: inside \`typeof x === "string"\`, \`x\` is exactly \`string\`. Narrowing subtracts, it doesn't intersect.\n\n${TS_NARROWING_REVEAL}`,
      d: `The "checks are runtime-only, the compiler can't see into an \`if\`" model. It can — control-flow analysis is one of the type system's core jobs. The compiler reads \`typeof x === "string"\` at *compile* time and narrows \`x\` to \`string\` for that branch; nothing becomes \`any\`. (\`any\` is a real type with real costs, but it's something you opt into, not what narrowing produces — that's Lesson 4.)\n\n${TS_NARROWING_REVEAL}`,
    },
  },
}

const STEP_3_2 = {
  id: STEP_3_2_ID,
  lessonId: LESSON_3_ID,
  order: 2,
  type: 'read' as const,
  title: 'Narrowing: every if teaches the compiler something',
  instruction: `## Why this matters

Lesson 2's optional fields handed you a \`string | undefined\` — a value that might not be there. So did the optional parameter in Lesson 1. You already narrow these in JS by reflex (\`typeof\`, \`Array.isArray\`); the delta is that the compiler now reads the same checks and tracks the type through each branch. If you just predicted \`string | number\` for that branch, you were holding the old model; here's the one that's actually true.

## The narrowing toolbox

Four checks, in rough order of how often you'll reach for them. Each one re-types the variable *inside* its branch:

\`\`\`typescript
function describe(x: string | number | string[]): string {
  if (typeof x === "string") return x.toUpperCase();   // x: string here
  if (Array.isArray(x)) return \`\${x.length} items\`;    // x: string[] here
  return x.toFixed(2);                                  // x: number — what's left
}
\`\`\`

- **\`typeof\`** for primitives (\`"string"\`, \`"number"\`, \`"boolean"\`, …).
- **Equality against a literal** (\`if (status === "ready")\`) narrows to that literal.
- **\`in\`** for property presence (\`if ("email" in user)\`).
- **\`Array.isArray\`** for arrays — needed because \`typeof [] === "object"\`, so \`typeof\` alone can't separate an array from other objects.

These are JS idioms you've written for years. The delta is the comment on each line: the *static type changes* inside the branch.

## Discriminated unions: the shape that doesn't lie

When you model a value that's in one of several states, the reflex is a bag of optionals:

\`\`\`typescript
// The shape that lies — every field optional, no field tells you which state you're in.
type Payment = { status: string; auth?: string; tx?: string; reason?: string };
\`\`\`

The honest shape gives each state its own variant, joined by a shared **tag** field:

\`\`\`typescript
type PaymentStatus =
  | { kind: "pending" }
  | { kind: "authorized"; auth: string }
  | { kind: "captured"; tx: string }
  | { kind: "failed"; reason: string };
\`\`\`

Now \`switch (s.kind)\` narrows each \`case\` to exactly its variant — inside \`case "authorized"\`, \`s.auth\` exists and is a \`string\`; reach for \`s.tx\` there and it's a compile error.

## Exhaustiveness with \`assertNever\`

Here's the payoff the scroll has been promising. Put this in the \`default\`:

\`\`\`typescript
function assertNever(x: never): never {
  throw new Error(\`unhandled: \${JSON.stringify(x)}\`);
}
\`\`\`

If every variant is handled, the value reaching \`default\` is \`never\`, and \`assertNever(s)\` compiles. Add a fifth variant and forget to handle it — that value is no longer \`never\`, the call stops compiling, and the compiler points at the exact \`switch\` you missed. That's the **compiler as a second reader during refactors**: the next two steps make it physical.

## When built-in checks can't see the shape

For a value whose type the compiler genuinely can't infer — JSON off the wire, an \`unknown\` from a boundary — you write a **user-defined type guard**: a function whose return type is \`x is User\`. One example; Lesson 4 puts it to work.

Next: chain the toolbox on a three-way union.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_3_3 = {
  id: STEP_3_3_ID,
  lessonId: LESSON_3_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Narrow a three-way union with the toolbox',
  instruction: `## Your task

Write \`describe(x: string | number | string[]): string\`. The input is one of three types; the output names which:

- a \`string\` → \`"text: "\` followed by the string itself (e.g. \`"text: hello"\`)
- a \`number\` → \`"count: "\` followed by the number (e.g. \`"count: 42"\`)
- a \`string[]\` → \`"list of N"\` where \`N\` is the array's length (e.g. \`"list of 3"\`)

Each branch narrows \`x\` to one type, and inside that branch \`x\` has only that type's methods. One ordering trap is built into the tests — find it.

### What's expected

\`\`\`typescript
describe("hello")        // "text: hello"
describe(42)             // "count: 42"
describe(["a", "b"])     // "list of 2"
describe([])             // "list of 0"
\`\`\``,
  starterCode: `function describe(x: string | number | string[]): string {
  // Your code here
}
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
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
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: null,
  hints: [
    `One of the three union members is not a primitive, and \`typeof\` will tell you something unhelpful about it — the same word it gives every object. Which built-in check, that you already use, distinguishes that one case? And note the ordering trap: that check has to run *before* you treat \`x\` as a plain value.`,
    `Use \`Array.isArray(x)\` for the array case, and put it *first* — \`typeof\` can't separate an array from other objects. The \`string\` and \`number\` arms follow with \`typeof\`; narrowing subtracts as it goes, so the last \`return\` already has the remaining type.`,
  ],
  solution: `function describe(x: string | number | string[]): string {
  if (Array.isArray(x)) return \`list of \${x.length}\`;
  if (typeof x === "string") return \`text: \${x}\`;
  return \`count: \${x}\`;
}
`,
  alternativeApproach: `The branch order is flexible *as long as* \`Array.isArray\` is tested before you lean on \`x\` being a scalar — put the \`typeof x === "string"\` check first and the array case still works, because narrowing subtracts as it goes: by the final \`return\`, \`x\` is whatever the earlier branches didn't claim. What breaks is \`typeof x === "object"\` as a stand-in for "it's the array" — that's the exact reason \`Array.isArray\` exists, since \`typeof [] === "object"\` and so does \`typeof {}\`.`,
}

const STEP_3_4 = {
  id: STEP_3_4_ID,
  lessonId: LESSON_3_ID,
  order: 4,
  type: 'kata' as const,
  title: 'Finish the PaymentStatus union and dispatch it exhaustively',
  instruction: `## Your task

The starter defines two variants of \`PaymentStatus\` — \`pending\` and \`authorized\`. Finish the type and the function:

1. **Add the two missing variants** to the union: \`captured\` (carries a \`tx: string\`) and \`failed\` (carries a \`reason: string\`). Each variant has the shared \`kind\` tag plus its own fields.
2. **Implement \`nextStates(s)\`** — a \`switch (s.kind)\` returning the legal next states for each:
   - \`pending\` → \`["authorized", "failed"]\`
   - \`authorized\` → \`["captured", "failed"]\`
   - \`captured\` → \`[]\` (terminal)
   - \`failed\` → \`[]\` (terminal)
3. **Close the \`switch\` with \`assertNever\`** in the \`default\`. If you've handled every variant, the value reaching \`default\` is \`never\` and the call compiles. That's not decoration — it's the compiler guaranteeing your \`switch\` is exhaustive, the next challenge proves why.

The signature \`nextStates(s: PaymentStatus): PaymentStatus["kind"][]\` is provided. \`PaymentStatus["kind"]\` is *indexed access* — "the type of the \`kind\` field", i.e. \`"pending" | "authorized" | "captured" | "failed"\`. Lesson 5 teaches it properly; here, just read it as "an array of kind strings".

### What's expected

\`\`\`typescript
nextStates({ kind: "pending" })                  // ["authorized", "failed"]
nextStates({ kind: "authorized", auth: "a1" })   // ["captured", "failed"]
nextStates({ kind: "captured", tx: "t1" })       // []
nextStates({ kind: "failed", reason: "card" })   // []
\`\`\``,
  starterCode: `type PaymentStatus =
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
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
function assertNever(x: never): never {
  throw new Error("unhandled: " + JSON.stringify(x));
}

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

// Type-only (never executed — the call would throw via assertNever at runtime):
function _typeChecks(): void {
  // @ts-expect-error — "shipped" is not a variant of PaymentStatus.
  nextStates({ kind: "shipped" });
}
void _typeChecks;
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: null,
  hints: [
    `Two jobs. First, each missing variant is a shape with the shared \`kind\` tag plus one field that only that state needs — model \`captured\` and \`failed\` on the two the starter already shows you. Second, your \`switch\` default should be *unreachable*: there's a way to have the compiler **guarantee** that instead of you promising it at review. What type does a value have once the \`switch\` has ruled out every variant it can be?`,
    `Once every \`case\` returns, the value reaching \`default\` is \`never\` — and the starter already calls \`assertNever(s)\` there, which only compiles when its argument is \`never\`. So handle all four variants and the exhaustive switch type-checks itself; miss one and \`assertNever\` stops compiling and points at the gap. You still write the four \`case\` arms.`,
  ],
  solution: `type PaymentStatus =
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
`,
  alternativeApproach: `You could drop the \`assertNever\` and let the function compile without it — every case returns, so TypeScript is happy today. The reason to keep it: it's the difference between a \`switch\` that's *currently* exhaustive and one the compiler *holds* exhaustive forever. The next challenge adds a variant; with \`assertNever\` in place, this function stops compiling and tells you it needs a new case. Without it, the function would compile fine and silently fall through to a \`default\` you didn't write — a bug that ships. The three-line guard is cheap insurance against the refactor you'll do six months from now.`,
}

const STEP_3_5 = {
  id: STEP_3_5_ID,
  lessonId: LESSON_3_ID,
  order: 5,
  type: 'challenge' as const,
  title: 'Add a variant and let the compiler find every site',
  instruction: `## The challenge

This is the benefit the scroll's lens promised: **the compiler as a second reader during a refactor.** In JavaScript, adding a state to a payment model is a grep across the codebase and a prayer that you found every place that switches on it. Here, the compiler hands you the checklist.

The starter ships \`PaymentStatus\` and **three consumers** of it — \`nextStates\`, \`labelFor\`, and \`isTerminal\` — each one a \`switch (s.kind)\` closed with \`assertNever\`. You didn't write these in this step; treat them as code you inherited.

Add one variant: \`{ kind: "disputed"; case: string }\` — a payment a customer has contested. The moment you add it, **all three consumers stop compiling**, because each one's \`assertNever\` now receives a value that isn't \`never\` anymore. Follow each error to its \`switch\` and add the \`disputed\` case:

- **\`nextStates\`** — a dispute resolves back to \`captured\` or reverses to \`failed\`, so \`disputed → ["captured", "failed"]\`.
- **\`labelFor\`** — return \`"disputed (case #…)"\` interpolating the \`case\` field.
- **\`isTerminal\`** — \`disputed\` is not terminal (it can still move), so \`false\`.

Leave the other variants' behavior unchanged.

**Budget:** ~15 minutes (about 2× a kata). One hint available. This isn't a gate — if you stall, the solution is there.`,
  starterCode: `type PaymentStatus =
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
      return \`authorized (\${s.auth})\`;
    case "captured":
      return \`captured (\${s.tx})\`;
    case "failed":
      return \`failed: \${s.reason}\`;
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
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
function assertNever(x: never): never {
  throw new Error("unhandled: " + JSON.stringify(x));
}

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
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: `Don't go hunting for the call sites by reading the code — let the compiler hand them to you. Add the \`disputed\` variant to the type first, then run: the three \`assertNever\` calls each light up because each now receives a value that's still a live variant instead of \`never\`. Each error names the function and the line. Fix them in any order; the type tells you when you've caught all three (the errors stop). That's the entire workflow this lesson was built to teach — the change is the variant, the checklist is the compiler's.`,
  solution: `type PaymentStatus =
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
      return \`authorized (\${s.auth})\`;
    case "captured":
      return \`captured (\${s.tx})\`;
    case "failed":
      return \`failed: \${s.reason}\`;
    case "disputed":
      return \`disputed (case #\${s.case})\`;
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
`,
  alternativeApproach: `Notice what you *didn't* do: you never grepped for \`"pending"\` to find the switches, and you never wondered whether there was a fourth consumer hiding in a file you forgot. The compiler enumerated the sites for you — three errors, three fixes, done when the errors stop. That's the whole argument for discriminated unions plus \`assertNever\` over a bag of optional fields: the bag-of-optionals version would have compiled fine with \`disputed\` half-handled, and the gap would have surfaced as a wrong label in production. The exhaustiveness check converts a runtime bug into a compile error you can't ignore.`,
}

const LESSON_3 = {
  id: LESSON_3_ID,
  scrollId: COURSE_ID,
  order: 4,
  title: 'Narrowing: the compiler reads your control flow',
}

// =============================================================================
// Lesson 4 — any, unknown, and the boundary
// =============================================================================
//
// 3 steps (read+inline + kata + playground). The read+inline embeds the
// disambiguation figure ts-unknown-vs-any and carries one micro-quiz
// (catch-is-unknown) anchored after the unknown paragraph. Kata 4.2 re-performs
// G2 at a real boundary; its _eq must be key-presence-aware. Playground 4.3 is
// a kata with data.kind 'playground' and a trivially-true assertion.

const STEP_4_1 = {
  id: STEP_4_1_ID,
  lessonId: LESSON_4_ID,
  order: 1,
  type: 'read+inline' as const,
  title: 'any, unknown, never — the three escape valves',
  instruction: `## Why this matters

You have written this \`any\`. Mid-migration, a third-party payload came in untyped, a red squiggle wouldn't go away, and \`: any\` made it stop — and then for six months a renamed field (\`user.fullName\` that was now \`user.name\`) read as \`undefined\` in production and nobody's editor said a word. That \`any\` didn't type the value. It turned the type checker off and let the hole travel. This lesson is about the three types you reach for at a boundary, and which one is honest.

## \`any\` — the off-switch that spreads

\`any\` is not "some type". It is "stop checking", and the damage is that it **propagates**:

\`\`\`typescript
const data: any = JSON.parse(payload);
const first = data.user.name.first;  // first is \`any\` — no error, no help
first.toUpperCase().slice(99).whatever();  // all of this compiles
\`\`\`

Every access off an \`any\` is \`any\` again, all the way down, so the bug surfaces at runtime far from where the \`any\` entered. The one legitimate use is a deliberate escape hatch with a \`// TODO\` and a named cost — an untyped third-party lib, a mid-migration seam — a *promise to come back*, never a resting state.

## \`unknown\` — the honest boundary type

\`unknown\` accepts anything \`any\` accepts, and permits nothing until you narrow it:

\`\`\`typescript
const data: unknown = JSON.parse(payload);
data.user;  // Error: 'data' is of type 'unknown'.
\`\`\`

This is what \`JSON.parse\` *should* return and what \`catch (e)\` binds since TS 4.4. It pairs with the user-defined type guards from Lesson 3: \`unknown\` in, a guard proves the shape, a typed value out. The compiler makes you earn every property access.

<!-- interact:catch-is-unknown -->

:figure[disambiguation]{id="ts-unknown-vs-any"}

## \`never\` — the type no value inhabits

\`never\` is the bottom type: no value is assignable to it. You have already met it — \`assertNever(x: never)\` from Lesson 3's exhaustive \`switch\`. It is also the type of a function that only ever \`throw\`s, and the residue of a union that narrowing has fully emptied. One mechanism you'll use in the playground: \`string | never\` collapses to \`string\` — adding \`never\` to a union removes it. That collapse is exactly why \`assertNever\` works: handle every variant and the value reaching it is \`never\`.

## The closer: \`as\` is a promise, a guard is proof

\`\`\`typescript
const user = JSON.parse(payload) as User;  // compiles
user.name.toUpperCase();  // crashes at runtime if payload had no name
\`\`\`

A cast (\`as\`) tells the compiler "trust me, it's a \`User\`" — and the compiler *can't check it*, so a wrong cast is a runtime bug it can no longer catch. A guard returns proof the compiler verifies. Prefer proof. This scroll deliberately does not drill \`as\`, and that gap is on purpose: the capstone in Lesson 5 will let an \`as\` shortcut **compile and then fail at runtime**, so you see the broken promise for yourself. Cast-vs-guard at depth lives in \`typescript-advanced-types\`; the schema-first version of this boundary (validate once, infer the type) is where Zod lives — \`typescript-zod-as-type-design\`.

Next: the boundary kata — take \`unknown\` in, narrow it with a guard, hand a typed value out.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    interactions: [
      {
        kind: 'micro-quiz' as const,
        after: 'catch-is-unknown',
        question: 'In a `catch (e)` clause under modern TS, what type is `e`?',
        options: ['any', 'unknown'] as [string, string],
        correct: 1 as const,
        feedback: [
          'That was the rule before TS 4.4, and many JS devs still assume it — but `any` here is exactly the silent-propagation hole this lesson is about: nothing stops you from reading `e.response.data` off a thrown string.',
          'Right — since TS 4.4 (`useUnknownInCatchVariables`, on under `strict`; this scroll runs TS 5.0.3) `e` is `unknown`, so you must narrow it (`e instanceof Error`, a guard) before using it. The compiler makes you prove what you caught.',
        ] as [string, string],
      },
    ],
  },
}

const STEP_4_2 = {
  id: STEP_4_2_ID,
  lessonId: LESSON_4_ID,
  order: 2,
  type: 'kata' as const,
  title: 'Take unknown in, narrow with a guard, hand User out',
  instruction: `## Your task

\`JSON.parse\` is typed to return \`any\` by the standard library — that's the silent hole this lesson opened with. Every webhook, every \`fetch().json()\`, every \`process.env\` value enters your program this way: shaped however the outside world felt like shaping it, and typed as "stop checking". Closing that hole *once*, at the boundary, with a guard — so everything downstream is a real \`User\`, not a hope — is the single most transferable TypeScript skill for a working JS developer, and it's what you build here.

\`User\` is the shape you defined in Lesson 2: \`type User = { id: string; name?: string; email?: string }\` — \`id\` required, the other two optional. The starter gives you \`parseJson\`, which already downgrades \`JSON.parse\`'s \`any\` to \`unknown\` (a \`try/catch\` returning \`null\` on malformed input). You write two things:

- \`isUser(x: unknown): x is User\` — a guard that proves the shape: an object, not null, with a string \`id\`; optional fields, when present, are strings.
- \`parseUser(input: string): User | string\` — parse, guard, and return the typed \`User\`, or the string \`"invalid user"\` when the input is malformed or the wrong shape.

### What's expected

\`\`\`typescript
parseUser('{"id":"u1","name":"Ada"}')   // { id: "u1", name: "Ada" }
parseUser('{"id":"u1"}')                 // { id: "u1" }  (optionals absent is valid)
parseUser('{"name":"Ada"}')              // "invalid user"  (missing required id)
parseUser('not json')                    // "invalid user"
parseUser('[1,2,3]')                     // "invalid user"
\`\`\``,
  starterCode: `// \`User\` is the Lesson 2 shape, available in the prelude:
//   type User = { id: string; name?: string; email?: string }

// Provided: JSON.parse is typed \`any\` by the stdlib — this wrap downgrades it to \`unknown\`,
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
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
type User = { id: string; name?: string; email?: string };

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

// Illustrative (commented): the un-narrowed value refuses property access — this is the point of \`unknown\`.
// const raw: unknown = parseJson('{"id":"u1"}');
// raw.id;  // would error: 'raw' is of type 'unknown' (a @ts-expect-error would bite here).
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: null,
  hints: [
    `The compiler will not let you read \`.id\` off the value \`parseJson\` returns — it's \`unknown\`, and until you prove something about it, every property access is an error. So the work is the proof: a function whose return type *teaches the compiler something about its argument* when it returns true.`,
    `Give \`isUser\` the return type \`x is User\` — that type-predicate shape is what narrows \`unknown\` to \`User\` at the call site. Inside, prove the shape in order: first that the value is a non-\`null\` object (a \`null\` slips past \`typeof x === "object"\`), then that \`id\` is a string, then that each optional field is a string *only when it's present*. \`parseUser\` then just calls the guard and returns the value or \`"invalid user"\`.`,
  ],
  solution: `const parseJson = (s: string): unknown => {
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
`,
  alternativeApproach: null,
}

const STEP_4_3 = {
  id: STEP_4_3_ID,
  lessonId: LESSON_4_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Explore the escape hatches at a boundary',
  instruction: `**This is a playground.** There's no pass to earn — the compiler's acceptance and refusal *is* the output you're here to read. A type error in this step is a finding, not a failure: it's the compiler showing you where the line is. Edit, run, and chase the things-to-try below.

The starter has the same parsed value typed two ways — \`any\` and \`unknown\` — plus a \`never\`-returning function and a union with \`never\` in it. Work through the numbered comments.`,
  starterCode: `const raw = '{"user":{"name":"Ada"}}';

// The honest version: \`unknown\` refuses every access until you narrow.
const strict: unknown = JSON.parse(raw);
// const b = strict.user;  // <- uncomment for try #1

// The dangerous version: \`any\` turns checking off and lets any chain compile.
const loose: any = JSON.parse(raw);
const a = loose.user.name.first;

function fail(message: string): never {
  throw new Error(message);
}

type Collapsed = string | never;

// ── Things to try ──────────────────────────────────────────────
// 1. Uncomment the \`strict.user\` line. Which exact line does the compiler light up,
//    and what is the message? (No output runs — the compiler refusal IS the result.)
// 2. Chain two more accesses onto the \`any\` version: \`loose.user.name.first.x.y\`.
//    Run it. At what point does the compiler warn you?
// 3. Add a branch that calls \`fail("boom")\` and then tries to use a value after it —
//    what type does the compiler think the code after a \`never\`-returning call has?
// 4. Hover \`Collapsed\`. What single type is left, and why does that make \`assertNever\` work?
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
// Playground: trivially-true assertion keeps the backend uniform; the frontend
// hides the verdict UI.
_t("explored the escape hatches at a boundary", () => { _eq(true, true); });
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: null,
  solution: `// Playground — no solution to reach. The prompts are observations, not a target.
// Try 1 surfaces the 'unknown' refusal on the \`strict.user\` line; try 2 stays silent
// (the \`any\` chain compiles all the way down); try 3 shows the code after a never-call
// is unreachable; try 4 collapses \`string | never\` to \`string\`. Each is the lesson.
`,
  alternativeApproach: null,
  data: { kind: 'playground' as const },
}

const LESSON_4 = {
  id: LESSON_4_ID,
  scrollId: COURSE_ID,
  order: 5,
  title: 'any, unknown, and the boundary',
}

// =============================================================================
// Lesson 5 — Generics that earn their place — and the close
// =============================================================================
//
// 4 steps (read+inline + kata + kata + challenge). The read+inline carries one
// micro-quiz (keyof-indexed) anchored after the keyof/T[K] paragraph. Katas 5.2
// and 5.3 use instantiation expressions (typeof f<T>, TS ≥4.7). Challenge 5.4 is
// THE CAPSTONE: L2+L3+L4+L5 in one file. Its starter ships a placeholder
// ShipmentEvent so the scaffold compiles (the learner redefines it); its
// referenceSolution is self-contained (assertNever + every type the tests touch).

const STEP_5_1 = {
  id: STEP_5_1_ID,
  lessonId: LESSON_5_ID,
  order: 1,
  type: 'read+inline' as const,
  title: 'Generics you reach for — and the map of what comes next',
  instruction: `## Why this matters

Look at what your own scroll made you almost write:

\`\`\`typescript
function firstString(arr: string[]): string | undefined { return arr[0]; }
function firstNumber(arr: number[]): number | undefined { return arr[0]; }
function firstUser(arr: User[]): User | undefined { return arr[0]; }
\`\`\`

Three functions, one idea, copied per type. You felt the duplication before you had a name for the fix. A generic is that name: \`<T>\` is the parameter you would have written for the *type*, the same way \`arr\` is the parameter you wrote for the *value*.

## \`<T>\`, and inference at the call site

\`\`\`typescript
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
\`\`\`

One function, every element type. And you almost never write \`first<string>([...])\` — the compiler reads \`T\` from the argument: \`first([1, 2])\` infers \`T = number\`, so the result is \`number | undefined\`. Inference, the Lesson 1 idea, now flowing through a type parameter.

## \`extends\` — the promise about what T supports

A bare \`<T>\` knows nothing about \`T\`, so you can't touch its properties. \`extends\` is a constraint — a promise about T's shape:

\`\`\`typescript
function tag<T extends { id: string }>(x: T): string {
  return \`#\${x.id}\`;  // allowed: every T is guaranteed to have a string id
}
\`\`\`

\`<T extends { id: string }>\` reads "T is anything, as long as it has at least an \`id\`".

## \`keyof\` and indexed access \`T[K]\`

\`keyof T\` is the union of T's keys; \`T[K]\` is the type *at* a key. Together they keep a key-based helper typed end to end:

\`\`\`typescript
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
\`\`\`

\`K extends keyof T\` means the key must really be a key of T — a mistyped key is a compile error, not a runtime \`undefined\`. You already read \`T[K]\` in the wild: kata 3.4's provided signature was \`PaymentStatus["kind"][]\` — "the type of the \`kind\` field, as an array".

<!-- interact:keyof-indexed -->

One more shape you'll *read* but not drill: a parameter spelled \`guard: (x: unknown) => x is T\` — a function-typed parameter carrying a user-defined type guard. The capstone's \`parseWith\` signature uses it; you don't have to write that signature, only its body.

## When NOT to be generic

A function called with exactly one type isn't generic — it just has a parameter that never varies. Speculative \`<T>\` "in case we need it later" is Lesson 1's annotation-maximalism wearing a costume: it adds surface for a flexibility nobody asked for. Reach for \`<T>\` when real duplication pushes you there, the way it just did.

## The map: what you can now recognise

You won't write these today; you'll *recognise* them, and you know where each depth lives:

- **Conditional types** — a type-level \`if\` (\`NonNullable<T>\` strips \`null\`). → \`typescript-advanced-types\`
- **Mapped types** — a loop over keys (\`Partial<T>\` makes every field optional). → \`typescript-advanced-types\`
- **\`infer\`** — names a matched part of a type (\`ReturnType<F>\`). → \`typescript-advanced-types\`
- **Template literal types** — type-level string building (event-name remapping). → \`typescript-advanced-types\`
- **Brand types** — nominal islands in a structural sea, so \`UserId\` ≠ \`PostId\`. → \`typescript-domain-modeling\`
- **\`satisfies\`** — constrain a value's type without widening it. → \`typescript-advanced-types\`

Each is clever, and clever types cost compile time and the next reader. Recognition is the bar for today.

Next: two katas, then the last step of the scroll — everything at once, on purpose.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
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
  },
}

const STEP_5_2 = {
  id: STEP_5_2_ID,
  lessonId: LESSON_5_ID,
  order: 2,
  type: 'kata' as const,
  title: 'Write the generic the duplication asked for',
  instruction: `## Your task

Write \`first<T>(arr: T[]): T | undefined\` — return the first element of the array, or \`undefined\` when it's empty. One generic replaces the three copied functions you read at the start of the lesson.

The implementation is trivial JavaScript. The point is the **signature**: \`T\` ties the element type of the input to the type of the output, so the compiler knows — at each call site, without you annotating anything — exactly what came back.

### What's expected

\`\`\`typescript
first([10, 20, 30])   // 10   (type: number | undefined)
first(["a", "b"])     // "a"                        (type: string | undefined)
first([])             // undefined
\`\`\``,
  starterCode: `function first/* <T>? */(arr: unknown[]): unknown {
  // your code — and fix the signature so the return type depends on the element type
  return undefined;
}
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
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
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: null,
  hints: [
    `The return type has to *depend on* the element type of the argument — \`number\` in means \`number | undefined\` out, \`string\` in means \`string | undefined\` out. A fixed return type can't do that. What syntax introduces a name for a type you don't know yet, so a signature can refer to "whatever element type the caller passed"? Lesson 5.1 opened with exactly the duplication this collapses.`,
    `Add a type parameter \`<T>\` after the function name, type the argument as \`T[]\`, and let the return type be built from \`T\`. The compiler infers \`T\` from each call — you never write \`first<number>(...)\`. The body stays one line.`,
  ],
  solution: `function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
`,
  alternativeApproach: null,
}

const STEP_5_3 = {
  id: STEP_5_3_ID,
  lessonId: LESSON_5_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Pick a subset of keys, typed end to end',
  instruction: `## Your task

Write \`pickKeys<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>\` — return a new object holding only the listed keys of \`obj\`. You meet \`Pick<T, K>\` here because you need it: it's the type "T narrowed to just the keys in K", which is exactly what this function returns.

The constraint is the lesson. \`K extends keyof T\` means the keys you ask for must actually be keys of \`T\` — so \`pickKeys(user, ["password"])\` on a \`User\` that has no \`password\` is a **compile error**, caught before it ever runs. Drop the constraint and \`keys\` becomes \`string[]\`, the compiler stops checking, and you're back to runtime \`undefined\`.

### What's expected

\`\`\`typescript
const user: User = { id: "u1", name: "Ada", email: "ada@dojo.dev" };
pickKeys(user, ["id", "name"])   // { id: "u1", name: "Ada" }
pickKeys(user, ["id"])           // { id: "u1" }
pickKeys(user, ["password"])     // compile error — "password" is not a key of User
\`\`\``,
  starterCode: `// \`User\` is the Lesson 2 shape, available in the prelude:
//   type User = { id: string; name?: string; email?: string }

function pickKeys/* <T, K ...>? */(obj: object, keys: string[]): object {
  // your code — and fix the signature so mistyped keys are a compile error
  return {};
}
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
type User = { id: string; name?: string; email?: string };

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
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: `The \`keys\` parameter can't just be \`string[]\` — any string would be allowed, including ones that aren't on the object, and the compiler would wave them through. You need the type to say "these are *keys of T*".

Lesson 5.1 named the operator that produces "the keys of a type". Constrain the key parameter with it, and the return type that says "T, but only those keys" is a built-in utility the lesson also named.`,
  solution: `function pickKeys<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    result[key] = obj[key];
  }
  return result;
}
`,
  alternativeApproach: null,
}

const STEP_5_4 = {
  id: STEP_5_4_ID,
  lessonId: LESSON_5_ID,
  order: 4,
  type: 'challenge' as const,
  title: 'Capstone: a typed shipment webhook, end to end',
  instruction: `**Budget: ~20-25 minutes — twice a kata. Not a gate:** skipping it costs you nothing downstream. But this is the scroll's promise made checkable, and failing it is useful data — it names the lesson to go re-run. The routing is at the end of this brief.

You work at a logistics scale-up. A webhook delivers shipment events as JSON strings — a \`kind\` tag first, then the fields that kind carries. Write the processor that turns a raw string into a human-readable line, or rejects it honestly.

You write five things:

1. **\`type ShipmentEvent\`** — a discriminated union with four variants, tagged by \`kind\`:
   - \`"created"\` with \`id: string\`
   - \`"scanned"\` with \`id: string\`, \`location: string\`
   - \`"delivered"\` with \`id: string\`, optional \`signedBy?: string\`
   - \`"lost"\` with \`id: string\`, optional \`lastSeen?: string\`
   (shapes with optional fields — Lesson 2; discriminated union — Lesson 3.)
2. **\`isShipmentEvent(x: unknown): x is ShipmentEvent\`** — the boundary guard (Lesson 3's guard shape over Lesson 4's \`unknown\`): validate the \`kind\` tag and the required fields each variant demands. Unlike \`isUser\`'s flat check, this guard branches on the \`kind\` tag — each variant has its own required fields to verify.
3. **\`parseWith<T>\`** — its signature is **already in the starter**; you write only the body: \`JSON.parse\` inside a \`try/catch\`, call the guard, return the value on success or \`null\` on failure.
4. **\`describeShipment(e: ShipmentEvent): string\`** — an exhaustive \`switch\` on \`kind\`, closed with \`assertNever\` (provided), the output varying with the optional fields (e.g. \`"delivered #s1 (signed by Ada)"\` vs \`"delivered #s1"\`).
5. **\`handleShipmentWebhook(raw: string): string\`** — the composition: parse-and-guard, then describe; \`"invalid payload"\` when the parse-and-guard returns \`null\`.

This is Lessons 2 through 5 in one file, by name:

- **Lesson 2 — shapes.** The four variants are object shapes with optional fields; you wrote one in kata 2.2 (\`User\`).
- **Lesson 3 — discriminated unions + narrowing.** The \`kind\` tag, the exhaustive \`switch\`, \`assertNever\` — kata 3.4's \`nextStates\` shape, fresh domain.
- **Lesson 4 — \`unknown\` at the boundary.** The guard takes \`unknown\` and proves the shape — kata 4.2's \`parseUser\`, generalised.
- **Lesson 5 — generics.** \`parseWith<T>\` is the boundary wrap made generic, the way \`first<T>\` collapsed three functions into one.

One precision before your reflex from Lesson 4 reaches for a shortcut: do **not** cast inside the guard. \`JSON.parse(raw) as ShipmentEvent\` would compile — and then a wrong-shaped payload flows through \`handleShipmentWebhook\` and crashes in \`describeShipment\`, exactly where it lies, because a cast is a promise the compiler couldn't check. The wrong-shape tests run through the *composed* handler for that reason: the shortcut fails at runtime where you'd ship it, not just at the guard. Prove the shape; don't promise it.

If you stall, the stall is information. Can't shape the union: Lesson 2. Tangled in the \`switch\` or \`assertNever\`: Lesson 3. The guard won't narrow \`unknown\`: Lesson 4. \`parseWith\`'s body fights you: Lesson 5. Go close the gap, then come back.`,
  starterCode: `// Provided in the prelude: assertNever and the Equal<...> type-only helper.
//   function assertNever(x: never): never { throw new Error("unexpected: " + JSON.stringify(x)); }

// 1. Your ShipmentEvent union goes here: four variants tagged by \`kind\`.
//    created/scanned/delivered/lost — see the brief for each variant's fields.
type ShipmentEvent = { kind: string; id: string }; // replace this with the real discriminated union (4 variants)

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
`,
  testCode: `${TYPESCRIPT_HARNESS_HEADER}
function assertNever(x: never): never {
  throw new Error("unexpected: " + JSON.stringify(x));
}

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

// ── Boundary failures: MUST flow through the composed handler (an \`as\` shortcut fails here) ──
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

// @ts-expect-error  an un-guarded \`unknown\` is not assignable to ShipmentEvent.
// 'as unknown' only forces the @ts-expect-error to bite — not a shape claim; contrast the broken 'as' the brief warns about.
describeShipment(JSON.parse('{"kind":"created","id":"s1"}') as unknown);
${TYPESCRIPT_HARNESS_FOOTER}`,
  hint: `The flow is \`string → unknown → ShipmentEvent | null → string\`. Each arrow is a function you already wrote once in Lessons 3-5 — here you write them again over a fresh domain and compose them.`,
  solution: `type ShipmentEvent =
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
      return \`created #\${e.id}\`;
    case "scanned":
      return \`scanned #\${e.id} at \${e.location}\`;
    case "delivered":
      return e.signedBy === undefined
        ? \`delivered #\${e.id}\`
        : \`delivered #\${e.id} (signed by \${e.signedBy})\`;
    case "lost":
      return e.lastSeen === undefined
        ? \`lost #\${e.id}\`
        : \`lost #\${e.id} (last seen \${e.lastSeen})\`;
    default:
      return assertNever(e);
  }
}

function handleShipmentWebhook(raw: string): string {
  const event = parseWith(raw, isShipmentEvent);
  return event === null ? "invalid payload" : describeShipment(event);
}
`,
  alternativeApproach: null,
}

const LESSON_5 = {
  id: LESSON_5_ID,
  scrollId: COURSE_ID,
  order: 6,
  title: 'Generics that earn their place — and the close',
}

export const TYPESCRIPT_LESSONS = [LESSON_0, LESSON_1, LESSON_2, LESSON_3, LESSON_4, LESSON_5]

export const TYPESCRIPT_STEPS = [
  STEP_0_1, STEP_0_2,
  STEP_1_1, STEP_1_2, STEP_1_3,
  STEP_2_1, STEP_2_2, STEP_2_3,
  STEP_3_1, STEP_3_2, STEP_3_3, STEP_3_4, STEP_3_5,
  STEP_4_1, STEP_4_2, STEP_4_3,
  STEP_5_1, STEP_5_2, STEP_5_3, STEP_5_4,
]
