// =============================================================================
// Rust — scroll seed, ALL 4 batches (Lessons 0-6). The dojo's Rust crash
// course for polyglot developers. Full scroll seeded: 25 steps / 7 lessons.
//
// Direction: ADR 022 (crash-course pivot); spec promoted to canon S028 W1
// (docs/courses/curricula/rust.md + rust/rust.md). Polyglot-first order:
//   order 1 — Lesson 0 (Rust in context)   — 2 steps (read, predict)
//   order 2 — Lesson 1 (Ownership)          — 5 steps (read, predict, 2 kata, playground)
//   order 3 — Lesson 2 (Borrowing)          — 5 steps (read, predict, kata, read+inline, kata)
//   order 4 — Lesson 3 (Result, ?, errors)  — 3 steps (read, 2 kata)
//   order 5 — Lesson 4 (Traits, generics)   — 4 steps (read, predict, 2 kata)
//   order 6 — Lesson 5 (Enums, Option)      — 4 steps (read, predict, 2 kata)
//   order 7 — Lesson 6 (Integration)        — 2 steps (read, challenge — the capstone)
// 25 steps total seeded. Full scroll: 25 steps / ~120 min target.
// Lessons 0-5's errors were captured at smoke (2026-06-12); Lesson 6 has no
// rustc error excerpts (the 6.1 deferral map is prose; the 6.2 capstone is
// pass/fail tests, integration rather than a new error reveal).
// The batch-2 quoted rustc excerpts
// (2.2 E0499, 2.4 fresh E0499 + E0502, 3.1 E0277) are pasted verbatim from
// the live Piston rustc 1.68.2 capture (2026-06-12). The batch-3 quoted
// excerpts (4.2 E0277-unsized, 5.2 E0004, 5.1 E0004 headline) are likewise
// pasted verbatim from the live Piston rustc 1.68.2 capture (2026-06-12).
// The Lesson 1 real-Piston smoke ran
// 2026-06-12 against rustc 1.68.2: compile-errors-as-feedback validated
// (rustc stderr surfaces through ExecuteStep; Piston noise scrubbed by the
// adapter), entry-point handled via the fn-main rename, and the quoted
// excerpts below are pasted verbatim from that capture.
// Authoring drafts live in docs/courses/curricula/rust/lesson-{0..6}.md;
// figures registered in apps/web/src/scrolls/figures/data/rust-figures.ts.
//
// Status: published. isPublic: true (S029). Rust joined the anonymous-execution
// whitelist in /scrolls/execute (apps/api/src/infrastructure/http/routes/
// scrolls.ts) so logged-out visitors can run the katas. Prod reseed
// precondition: full-set Piston smoke green.
//
// Test harness: manual _t/_eq pattern (mirrors Ruby/Python), Rust-shaped.
// The PistonAdapter renames a learner-written `fn main` to `__learner_main`
// (see PistonAdapter.ts), so starters may define their own fn main and the
// harness owns the real entry point. Learner code stays at the file's top
// level — same-file items need no `pub`. (A `mod solution` wrap was the
// first design; it failed on module privacy at the L1 smoke against real
// rustc 1.68.2 — E0425/E0603.) Each step's bare _t statements sit INSIDE
// the harness's fn main — between RUST_HARNESS_HEADER and RUST_HARNESS_FOOTER.
// Playground testCode calls `__learner_main()` to run the learner's main.
// __DOJO_RESULT__ JSON footer for ExecuteStep parsing; `cargo test` is not
// available on Piston — real #[test] testing is rust-testing-deep's territory.
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

const COURSE_ID = seedUuid('rust')

const LESSON_0_ID = seedUuid('rust-l0-context')
const LESSON_1_ID = seedUuid('rust-l1-ownership')
const LESSON_2_ID = seedUuid('rust-l2-borrowing')
const LESSON_3_ID = seedUuid('rust-l3-result')
const LESSON_4_ID = seedUuid('rust-l4-traits')
const LESSON_5_ID = seedUuid('rust-l5-enums')
const LESSON_6_ID = seedUuid('rust-l6-integration')

const STEP_0_1_ID = seedUuid('rust-s0-1-context-and-toolchain')
const STEP_0_2_ID = seedUuid('rust-s0-2-predict-first-command')

const STEP_1_1_ID = seedUuid('rust-s1-1-ownership')
const STEP_1_2_ID = seedUuid('rust-s1-2-predict-does-this-compile')
const STEP_1_3_ID = seedUuid('rust-s1-3-kata-fix-the-move')
const STEP_1_4_ID = seedUuid('rust-s1-4-kata-take-and-give-back')
const STEP_1_5_ID = seedUuid('rust-s1-5-playground-function-boundaries')

const STEP_2_1_ID = seedUuid('rust-s2-1-borrowing')
const STEP_2_2_ID = seedUuid('rust-s2-2-predict-does-this-compile')
const STEP_2_3_ID = seedUuid('rust-s2-3-kata-first-word')
const STEP_2_4_ID = seedUuid('rust-s2-4-read-inline-borrow-error')
const STEP_2_5_ID = seedUuid('rust-s2-5-kata-fix-overlapping-borrows')

const STEP_3_1_ID = seedUuid('rust-s3-1-result-and-question-mark')
const STEP_3_2_ID = seedUuid('rust-s3-2-kata-parse-and-double')
const STEP_3_3_ID = seedUuid('rust-s3-3-kata-custom-error-enum')

const STEP_4_1_ID = seedUuid('rust-s4-1-traits-and-dispatch')
const STEP_4_2_ID = seedUuid('rust-s4-2-predict-which-signatures-compile')
const STEP_4_3_ID = seedUuid('rust-s4-3-kata-define-struct-implement-trait')
const STEP_4_4_ID = seedUuid('rust-s4-4-kata-generic-function-with-bound')

const STEP_5_1_ID = seedUuid('rust-s5-1-enums-option-and-match')
const STEP_5_2_ID = seedUuid('rust-s5-2-predict-does-this-compile')
const STEP_5_3_ID = seedUuid('rust-s5-3-kata-define-enum-match-every-shape')
const STEP_5_4_ID = seedUuid('rust-s5-4-kata-first-even')

const STEP_6_1_ID = seedUuid('rust-s6-1-deferral-map')
const STEP_6_2_ID = seedUuid('rust-s6-2-capstone-log-triage')

const RUST_HARNESS_HEADER = String.raw`// ── dojo harness ──────────────────────────────────
use std::panic::{catch_unwind, AssertUnwindSafe};

thread_local! {
    static _RESULTS: std::cell::RefCell<Vec<(String, bool, String)>> =
        std::cell::RefCell::new(Vec::new());
}

fn _t<F: FnOnce() -> Result<(), String>>(name: &str, f: F) {
    let outcome = catch_unwind(AssertUnwindSafe(f));
    let (passed, message) = match outcome {
        Ok(Ok(())) => (true, String::new()),
        Ok(Err(m)) => (false, m),
        Err(payload) => {
            let msg = payload
                .downcast_ref::<&str>()
                .map(|s| s.to_string())
                .or_else(|| payload.downcast_ref::<String>().cloned())
                .unwrap_or_else(|| "panicked".to_string());
            (false, msg)
        }
    };
    _RESULTS.with(|r| r.borrow_mut().push((name.to_string(), passed, message)));
}

#[allow(dead_code)]
fn _eq<T: std::fmt::Debug + PartialEq>(actual: T, expected: T) -> Result<(), String> {
    if actual == expected {
        Ok(())
    } else {
        Err(format!("expected {:?} but got {:?}", expected, actual))
    }
}

#[allow(dead_code)]
fn _eq_close(actual: f64, expected: f64) -> Result<(), String> {
    if (actual - expected).abs() < 1e-9 {
        Ok(())
    } else {
        Err(format!("expected {} but got {}", expected, actual))
    }
}

fn _json_escape(s: &str) -> String {
    let mut out = String::new();
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out
}

fn main() {
    std::panic::set_hook(Box::new(|_| {}));
// ──────────────────────────────────────────────────`

const RUST_HARNESS_FOOTER = String.raw`
// ── dojo harness footer ───────────────────────────
    _RESULTS.with(|results| {
        let results = results.borrow();
        // Emit ONLY the __DOJO_RESULT__ line — no per-test echo. ExecuteStep
        // parses the JSON; the echo duplicated it and risks Piston's stdout
        // cap. Mirrors the TS footer fix.
        let ok = results.iter().all(|(_, p, _)| *p);
        let tests: Vec<String> = results
            .iter()
            .map(|(name, passed, message)| {
                if *passed {
                    format!("{{\"name\":\"{}\",\"passed\":true}}", _json_escape(name))
                } else {
                    format!(
                        "{{\"name\":\"{}\",\"passed\":false,\"message\":\"{}\"}}",
                        _json_escape(name),
                        _json_escape(message)
                    )
                }
            })
            .collect();
        println!("__DOJO_RESULT__ {{\"ok\":{},\"tests\":[{}]}}", ok, tests.join(","));
    });
}`

export const RUST_COURSE_DATA = {
  id: COURSE_ID,
  slug: 'rust',
  title: 'Rust',
  description:
    'The dojo\'s Rust crash course. For developers who already program in another language and need to read Rust by Friday. One mental model taught from scratch — ownership and borrowing — with the compiler as co-teacher: the error messages are the curriculum, not the obstacle. Traits, enums, Result and ? land as deltas, in ~120 minutes.',
  language: 'rust',
  accentColor: '#CE422B',
  status: 'published' as const,
  isPublic: true,
  estimatedMinutes: 120,
  externalReferences: [
    {
      title: 'The Rust Programming Language (Klabnik & Nichols)',
      url: 'https://doc.rust-lang.org/book/',
      kind: 'book' as const,
    },
    {
      title: 'The Rust error code index',
      url: 'https://doc.rust-lang.org/error_codes/error-index.html',
      kind: 'docs' as const,
    },
    {
      title: 'Rustlings — small exercises in reading compiler errors',
      url: 'https://github.com/rust-lang/rustlings',
      kind: 'article' as const,
    },
  ],
}

// =============================================================================
// Lesson 0 — Rust in context
// =============================================================================
//
// 2 steps (read + predict). The read deliberately ends on E0308, not E0382 —
// an E0382 teaser here would front predict 1.2 (the de-spoiling decision in
// the spec). The E0308 excerpt is verbatim from the L1 smoke capture
// (Piston rustc 1.68.2, 2026-06-12); note 1.68.2 emits no help: line for
// this snippet — the dual-span line + "expected due to this" label carry it.

const STEP_0_1 = {
  id: STEP_0_1_ID,
  lessonId: LESSON_0_ID,
  order: 1,
  type: 'read' as const,
  title: 'What Rust is for, how it runs, and why the compiler is your tutor',
  instruction: `## What this is

A **crash course, not a tutorial.** It assumes you already program in another language and have met Rust's syntax somewhere — a video, the docs, a colleague's PR. You're here to *practice under pressure*, not to be told "what a variable is". Six lessons, ~120 minutes, no hand-holding. The compiler is your co-teacher: its errors aren't obstacles to sneak past, they're the curriculum — you'll predict them before you read them, and read them like a brief. Some katas hand you code that won't compile by design; others ask you to write from scratch. Either way, the tests judge — and when you fail twice, the hints sharpen, but the answer stays yours to earn.

## Why this matters

This scroll spends ~120 minutes on one mental model (ownership) and one skill (reading compiler errors). Before that: whether Rust is for you, the toolchain names every README assumes, and what this sandbox runs.

## The sweet spot — and what Rust is not for

Rust earns its compile times where memory safety and performance matter at the same time: high-performance CLI tools (\`ripgrep\`, \`fd\`, \`bat\`), services under real load (Discord's read-states service, Cloudflare's proxies, AWS's Bottlerocket OS), and WebAssembly targets. It is a poor fit for quick prototypes (compile times tax iteration), notebooks, CRUD apps where developer-hours dominate runtime cost, and 30-line scripts — there, the borrow checker is pure overhead. If everything you ship lives in that second list, close the tab with a clear conscience — unless you're here for what the borrow checker teaches you about your own designs, which is a workload-independent reason to stay.

## The toolchain in one breath

Four names map onto things you already use. \`rustup\` installs and switches toolchain versions — your \`nvm\` or \`pyenv\`. \`cargo\` is build tool, package manager, test runner, and doc generator in one binary — THE tool, no make/webpack layer on top. \`Cargo.toml\` declares the project and its dependencies and \`Cargo.lock\` pins them — \`package.json\` and its lockfile. \`crates.io\` is the registry — npm or PyPI. One wrinkle with no analog: **editions** (2015, 2018, 2021) are opt-in language snapshots declared per project; new code is 2021 or later.

\`\`\`toml
# Cargo.toml — the manifest cargo reads
[package]
name = "log-triage"
version = "0.1.0"
edition = "2021"
\`\`\`

## What this sandbox runs

This scroll runs **Rust 1.68.2**, std-only, single file — no \`tokio\`, no \`serde\`, no \`thiserror\`, no \`cargo test\` (a small manual harness stands in; real \`#[test]\` testing is \`rust-testing-deep\`'s territory). Where modern Rust has something newer — \`async fn\` in traits (1.75), \`OnceLock\` (1.70) — the prose marks it *newer Rust* and never asks you to run it. On your machine \`rustup\` gives you current stable; nothing here breaks on it.

## The compiler is your tutor

The frame the whole scroll runs on: \`rustc\` is not a gate to sneak code past. Its errors carry a stable code you can look up, spans pointing at the exact expressions involved, a \`help:\` line that frequently contains the fix, and \`note:\` lines with context. When code in this scroll fails to compile, **the message is the lesson** — you will be asked to predict it before you read it, repeatedly. The anatomy, on neutral ground — a plain type mismatch, nothing exotic:

\`\`\`rust
fn main() {
    let count: i32 = "three";
}
\`\`\`

The load-bearing lines:

\`\`\`text
error[E0308]: mismatched types
  |                ---   ^^^^^^^ expected \`i32\`, found \`&str\`
  |                |
  |                expected due to this
\`\`\``,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_0_2 = {
  id: STEP_0_2_ID,
  lessonId: LESSON_0_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: what do you run first?',
  instruction: `Before ownership, one check on the toolchain model.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question:
      'You cloned a Rust project and want to see it run. Which command goes first?',
    snippet: `$ git clone https://github.com/example/log-triage.git
$ cd log-triage
$ ls
Cargo.toml  Cargo.lock  README.md  src/
$ ???`,
    options: [
      { id: 'a', text: '`rustc src/main.rs`' },
      { id: 'b', text: '`cargo run`' },
      { id: 'c', text: '`cargo install`' },
      { id: 'd', text: '`cargo add`' },
    ],
    correct: 'b',
    feedback: {
      a: "The direct-compile reflex — `gcc main.c` muscle memory. `rustc` compiles exactly the file you hand it: it does not read `Cargo.toml`, does not resolve dependencies, and fails on the first `use` of an external crate. This scroll's sandbox *does* run bare `rustc` on a single std-only file — which works precisely because the exercises have zero dependencies. A cloned project has them; `rustc`-by-hand is not how anyone builds one.",
      b: 'Correct. `cargo run` reads `Cargo.toml`, fetches dependencies pinned by `Cargo.lock`, compiles the project, and runs the binary — one command, no separate install step. The npm-style two-step (install, then run) collapses into this. It is the daily inner loop: edit, `cargo run`, read what the compiler says. Which is the right segue — Lesson 1 is about what the compiler says.',
      c: "The `gem install` / `pipx install` reflex — and where bare `npm install` or `mvn clean install` muscle memory lands. What actually happens: cargo refuses and points you at `cargo install --path .` — that flag is how you'd install *this* project's binary globally into `~/.cargo/bin`; bare `cargo install` is for fetching tools from the registry (`cargo install ripgrep`). Either way, nothing runs the project in front of you.",
      d: 'The `npm install <pkg>` reflex. `cargo add <crate>` edits `Cargo.toml` to declare a **new** dependency — it modifies the project and runs nothing. And the reflex behind it ("I must install dependencies before running") doesn\'t transfer: there is no separate install step to perform. Fetching what `Cargo.lock` already pins is part of the run command itself.',
    },
  },
}

const LESSON_0 = {
  id: LESSON_0_ID,
  scrollId: COURSE_ID,
  order: 1,
  title: 'Rust in context',
}

// =============================================================================
// Lesson 1 — Ownership: the mental model that replaces the GC
// =============================================================================
//
// 5 steps (read + predict + 2 kata + playground). The format exception's
// from-scratch lesson #1 (spec §2.2); the first compiler-error reveal lands
// in step 1.2, inside the scroll's first 25 minutes. The read carries the
// cliffhanger snippet + the E0382 headline line only (pairing clause); the
// full walk ships appended to every predict option's feedback because the
// player's predict schema has no separate reveal field. Katas 1.3/1.4 are
// fail-by-design: the starter's compile error is the brief.

const STEP_1_1 = {
  id: STEP_1_1_ID,
  lessonId: LESSON_1_ID,
  order: 1,
  type: 'read' as const,
  title: 'Every value has exactly one owner',
  instruction: `## Why this matters

Rust has no garbage collector and no manual \`free\`. What replaces both is one rule, enforced at compile time. This read gives you the rule; the rest of the scroll is the compiler teaching you its consequences. Everything else — borrowing, lifetimes, why functions take \`&str\` — sits on top of this.

## The rule

Every value has exactly one owner: the binding that holds it. When the owner goes out of scope, the value is dropped — deterministically, at a line you can point to. (If you know C++ RAII, this is that; if you don't, the clause costs you nothing.) Assignment and passing-to-a-function **move** ownership, unless the type is \`Copy\` or you pass a borrow — borrows are Lesson 2.

\`\`\`rust
fn main() {
    let report = String::from("4 errors, 12 warnings");
    {
        let scratch = String::from("temp buffer");
        println!("{} / {}", report, scratch);
    } // scratch dropped here — deterministic, no GC involved
    println!("{}", report);
}
\`\`\`

## \`Copy\` types vs owned heap types

\`i32\`, \`bool\`, \`char\`, \`f64\`, and tuples or arrays of \`Copy\` types are duplicated on assignment — copying fixed bytes is cheap for these types. \`String\`, \`Vec<T>\`, and \`Box<T>\` own a heap allocation, and for them assignment moves. The why is concrete: if assignment duplicated *ownership* of a heap buffer, two owners would each free it at scope exit — a double-free, the classic C bug. So Rust moves instead: the new binding owns the buffer, the old binding is dead. When you genuinely want a second, independent copy of owned data, that exists too — as an explicit, possibly-allocating call, never as a silent assignment. The figure pins the contrast.

\`\`\`rust
fn main() {
    let count = 42;        // i32 is Copy
    let snapshot = count;  // duplicated — both stay valid
    println!("{} {}", count, snapshot);
}
\`\`\`

:figure[disambiguation]{id="copy-vs-clone"}

## The reflex to unlearn

In JavaScript, Java, or Python, \`let s2 = s1\` copies a value or a reference — either way both names stay valid and the runtime cleans up after you. Your fingers will type that pattern in Rust within ten minutes. In Rust, for a non-\`Copy\` type, that same line moves ownership: \`s2\` owns the data now, and \`s1\` is no longer a usable name. Internalize this — everything else in the scroll sits on it.

So, concretely. You have the rule. Does this compile — and if not, what exactly does the compiler say?

\`\`\`rust
fn main() {
    let s1 = String::from("dojo");
    let s2 = s1;
    println!("{}", s1);
}
\`\`\`

\`rustc\`'s answer starts like this:

\`\`\`text
error[E0382]: borrow of moved value: \`s1\`
\`\`\``,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

// The E0382 walk — appended to every option's feedback at seed, so each
// answer path sees it (per the lesson file's reveal section). Output is
// verbatim from the L1 smoke capture (Piston rustc 1.68.2, 2026-06-12),
// minus one sanctioned trim: the macro-origin "= note: this error
// originates in the macro..." line — noise for a beginner's first error.
const E0382_REVEAL = `Here is the full output:

\`\`\`text
error[E0382]: borrow of moved value: \`s1\`
 --> main.rs:4:29
  |
2 |     let s1 = String::from("dojo");
  |         -- move occurs because \`s1\` has type \`String\`, which does not implement the \`Copy\` trait
3 |     let s2 = s1;
  |              -- value moved here
4 |     println!("{} meets {}", s1, s2);
  |                             ^^ value borrowed here after move
  |
help: consider cloning the value if the performance cost is acceptable
  |
3 |     let s2 = s1.clone();
  |                ++++++++

error: aborting due to previous error

For more information about this error, try \`rustc --explain E0382\`.
\`\`\`

Line by line:

- \`\`error[E0382]: borrow of moved value: \`s1\` \`\` — the headline: a stable code you can look up, the value involved, and the charge.
- \`\`move occurs because \`s1\` has type \`String\`, which does not implement the \`Copy\` trait\`\` — the *why*. The compiler names the exact rule from the read: \`String\` isn't \`Copy\`, so assignment moved.
- \`\`value moved here\`\` — the move site. Ownership left \`s1\` on \`let s2 = s1;\`.
- \`\`value borrowed here after move\`\` — the use site. (\`println!\` borrows its arguments, which is why the headline says *borrow* of moved value, not *use*.)
- \`\`help: consider cloning the value if the performance cost is acceptable\`\` — the compiler proposes a fix, down to the exact edit (\`s1.clone()\`) spelled out under it. Read \`help:\` lines; they often *are* the fix — and notice the honesty in "if the performance cost is acceptable".
- The footer hands you a habit: \`rustc --explain E0382\` prints a long-form explanation. It works for every error code in this scroll — bookmark the command.

Three responses to \`E0382\` exist, and you will choose between them for the rest of your Rust life:

1. **Clone** — duplicate the data. This is the compiler's own \`help:\` suggestion above. Legitimate when two owners are genuinely needed; a reflex when they aren't — the compiler proposes it because it provably compiles, not because it's always the right call.
2. **Restructure** — reorder the code, or return ownership, so one owner suffices. The fix the compiler can't see.
3. **Borrow** — use the value without taking ownership at all. That's Lesson 2.

The next kata hands you this exact error and asks for the fix. The first two responses are on the table; the third isn't yet.`

const STEP_1_2 = {
  id: STEP_1_2_ID,
  lessonId: LESSON_1_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: does this compile?',
  instruction: `The read ended on this cliffhanger, expanded by one use. Commit to an answer before you reveal.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'Does this compile — and if not, what does rustc say?',
    snippet: `fn main() {
    let s1 = String::from("dojo");
    let s2 = s1;
    println!("{} meets {}", s1, s2);
}`,
    options: [
      { id: 'a', text: 'Compiles — prints `dojo meets dojo`' },
      { id: 'b', text: 'Compiles, with a warning about the moved value' },
      { id: 'c', text: 'Fails to compile — `E0382`, borrow of moved value' },
      {
        id: 'd',
        text: 'Compiles — the language allows the misuse and you find out at runtime',
      },
    ],
    correct: 'c',
    feedback: {
      a: `The JS/Java/Python reflex: \`let s2 = s1\` copies a reference, both names point at the same string, everyone's happy. In Rust there is no shared reference here to copy — \`String\` owns its heap buffer, and assignment of a non-\`Copy\` type moves that ownership. After line 3, \`s1\` is not a stale pointer; it is not a usable name at all. The compiler proves that before a binary exists. The real output is below.\n\n${E0382_REVEAL}`,
      b: `The C reflex: the compiler warns about the sketchy thing and lets you ship it. Rust draws the line differently — ownership violations are **errors**, never warnings. There is no \`-Wmove-after-use\` to ignore; the program is rejected until the ownership story is coherent. The real output is below.\n\n${E0382_REVEAL}`,
      c: `Correct — and the message is worth more than the verdict. Walk it line by line below: this error is the scroll's recurring character.\n\n${E0382_REVEAL}`,
      d: `The generic systems-language reflex: the compiler accepts the misuse and the consequences are yours to discover later. That *is* how C behaves with a dangling pointer. C++ is subtler than the folklore: a moved-from \`std::string\` is valid-but-unspecified — not undefined behavior, typically no crash, just a value you must not rely on. Rust took the same move semantics and drew the line elsewhere: the misuse never compiles, so there is no runtime in which to find out. The real output is below.\n\n${E0382_REVEAL}`,
    },
  },
}

const STEP_1_3 = {
  id: STEP_1_3_ID,
  lessonId: LESSON_1_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Fix the move',
  instruction: `**This starter does not compile — by design. The \`E0382\` error you get when you run it is the brief: read it — all the way down to its \`help:\` line — before you touch the code.**

## Your task

\`banner\` builds the string \`"dojo meets dojo"\`, but ownership of \`s1\` is gone by the time the last line needs it. Make the minimal change so the code compiles and \`banner()\` still returns \`"dojo meets dojo"\`.

From the predict's reveal, three responses to \`E0382\` exist. Two are available right now, and **both are accepted**:

1. **Duplicate the data** with \`.clone()\` — the fix the error's own \`help:\` line proposes, edit included. Legitimate here, since the code as written wants two owners.
2. **Restructure** so one owner is enough — the fix the compiler can't propose for you.

The third — borrowing, using the value without owning it — is Lesson 2's whole topic. Pick one of the two, and be able to say why.`,
  starterCode: `fn banner() -> String {
    let s1 = String::from("dojo");
    let s2 = s1;
    format!("{} meets {}", s1, s2)
}

fn main() {
    println!("{}", banner());
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("banner still produces the expected text after your fix", || _eq(banner(), String::from("dojo meets dojo")));

_t("banner can be called more than once", || {
    let first = banner();
    let second = banner();
    _eq(first, second)
});
${RUST_HARNESS_FOOTER}`,
  hint: `What the compiler is asking: you handed ownership of the data away on the marked line — after that, \`s1\` is a dead name, and the \`format!\` line tries to use it anyway.

Two honest ways out exist in your toolbox right now:

1. **Duplicate the data.** \`String\` has a method that produces a second, independent copy — an honest choice when two owners are real, as they are here.
2. **Restructure.** Does this function actually need two bindings? One owner, used twice, also satisfies the compiler — \`format!\` borrows its arguments rather than consuming them.

Pick one and defend it. The third response — borrowing across the function boundary — arrives next lesson.`,
  solution: `// Response 1 from the predict's reveal — clone: two owners are real here
fn banner() -> String {
    let s1 = String::from("dojo");
    let s2 = s1.clone();
    format!("{} meets {}", s1, s2)
}

fn main() {
    println!("{}", banner());
}
`,
  alternativeApproach: `The other accepted fix — Response 2, restructure:

\`\`\`rust
fn banner() -> String {
    let s = String::from("dojo");
    format!("{} meets {}", s, s)
}
\`\`\`

One owner, used twice — \`format!\` borrows its arguments, so a single binding serves both slots and nothing is duplicated. When does restructuring beat cloning? When the second owner is an accident of how the code grew rather than a real requirement: here \`s2\` exists only because the starter created it, so deleting the binding is cheaper than copying the buffer. Clone earns its allocation when two independent owners genuinely need the data; when a small reorder makes the question disappear, reorder.`,
}

const STEP_1_4 = {
  id: STEP_1_4_ID,
  lessonId: LESSON_1_ID,
  order: 4,
  type: 'kata' as const,
  title: 'Take ownership, give it back',
  instruction: `## Your task

**This starter does not compile — by design.** The error is the brief.

Write \`shout\`: it takes **ownership** of a \`String\` and returns ownership of the transformed value — every character uppercased. \`"dojo"\` comes back as \`"DOJO"\`.

There are two jobs here, and the second is the lesson:

1. Fill in \`shout\`'s body.
2. Fix the provided \`main\` — as written, it repeats this lesson's error: it gives \`s\` away and then tries to print it. \`shout\`'s signature already promises the value back; \`main\` has to catch it.

**No \`.clone()\`.** The signature makes duplication unnecessary — ownership flows out and comes back. (The "what's expected" below is the contract the tests assert.)

### What's expected

\`\`\`rust
shout(String::from("dojo"))            // returns String::from("DOJO")
shout(String::from("Rust by Friday"))  // returns String::from("RUST BY FRIDAY")
\`\`\``,
  starterCode: `fn shout(s: String) -> String {
    // your code: return the uppercased value, handing ownership back
    todo!()
}

fn main() {
    let s = String::from("dojo");
    shout(s);
    println!("{}", s); // fix this flow: main should print DOJO
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("shout returns the uppercased text", || _eq(shout(String::from("dojo")), String::from("DOJO")));

_t("works for mixed-case input with spaces", || _eq(shout(String::from("Rust by Friday")), String::from("RUST BY FRIDAY")));

_t("the caller keeps a usable value after the call", || {
    let banner = String::from("dojo");
    let banner = shout(banner);
    _eq(banner.len(), 4)
});
${RUST_HARNESS_FOOTER}`,
  hint: `Ownership flows out of \`main\` into \`shout\`, and — because of the return type — back out again. The idiom: catch the function's result in a binding. Rust even lets you bind it to the **same name** (shadowing): the old, moved-from binding ends, and a fresh one owns the returned \`String\`. Nothing is duplicated anywhere in that round trip.

For the body: you need an owned, uppercased \`String\` out of an owned \`String\` in. The standard library does the case work; your job is only to make sure ownership of the result leaves the function.`,
  solution: `fn shout(s: String) -> String {
    s.to_uppercase()
}

fn main() {
    let s = String::from("dojo");
    let s = shout(s);
    println!("{}", s);
}
`,
  alternativeApproach: `The detour the instruction banned:

\`\`\`rust
let s = String::from("dojo");
let shouted = shout(s.clone());
println!("{} {}", s, shouted);
\`\`\`

This compiles — and buys a second heap allocation to avoid thinking about where ownership went. The signature already promises the value back; re-binding the return is free. When a function returns ownership, take it. Clone is for when two owners are *real*, like kata 1.3's banner — not for dodging the flow.`,
}

const STEP_1_5 = {
  id: STEP_1_5_ID,
  lessonId: LESSON_1_ID,
  order: 5,
  type: 'kata' as const,
  title: 'Playground: poke ownership at function boundaries',
  instruction: `## Try it

This step is a playground — no verdict, no pass/fail. The button runs whatever the file says and shows you the output. The point: this lesson's move rule applies to **function calls** exactly as it applied to \`=\`. Passing \`s\` to \`print_and_consume\` moves it, the same way \`let s2 = s1\` did.

The starter carries **three numbered prompts as comments**. Trying each one is an uncomment or a one-token edit — work through them in order:

1. **Prompt 1** uses the value after the call. You know *that* it fails — the question is: which error code, and what fix does the output point you toward? Predict both, then uncomment and check yourself.
2. **Prompts 2 and 3 are a Lesson 2 teaser.** Each is a one-token change to the parameter type that makes prompt 1's line legal. You can see *that* they work; *why* they work — borrowing, and why \`&str\` accepts a \`&String\` — is the next lesson's job.`,
  starterCode: `fn print_and_consume(s: String) {
    println!("consumed: {}", s);
}

fn main() {
    let s = String::from("dojo");
    print_and_consume(s);

    // 1. Uncomment the next line. Which error code do you get, and what
    //    fix does the output point you toward? Predict before you run.
    // println!("still here: {}", s);

    // 2. Lesson 2 teaser: change the parameter type \`String\` to \`&String\`
    //    and the call to \`print_and_consume(&s)\`. Re-run with prompt 1
    //    uncommented — \`s\` survives the call.

    // 3. Lesson 2 teaser: now change \`&String\` to \`&str\`. Same call, still
    //    compiles. You can see THAT both work; WHY is the next lesson.
}
`,
  testCode: `${RUST_HARNESS_HEADER}
    __learner_main();
    _t("explored", || _eq(true, true));
${RUST_HARNESS_FOOTER}`,
  hint: null,
  solution: `// Playground — no solution to reach. End state after prompt 3:
fn print_and_consume(s: &str) {
    println!("consumed: {}", s);
}

fn main() {
    let s = String::from("dojo");
    print_and_consume(&s);
    println!("still here: {}", s);
}
`,
  alternativeApproach: null,
  data: { kind: 'playground' as const },
}

const LESSON_1 = {
  id: LESSON_1_ID,
  scrollId: COURSE_ID,
  order: 2,
  title: 'Ownership: the mental model that replaces the GC',
}

// =============================================================================
// Lesson 2 — Borrowing and references
// =============================================================================
//
// 5 steps (read + predict + kata + read+inline + kata). The read reorders
// topics (&T → &str → &mut T + cliffhanger) so both the &str-default sample
// and the cliffhanger keep their code-terminated shape; it ends on the E0499
// headline line only (pairing clause — predict 2.2 owns the full output).
// Kata 2.3 (first_word) drills production gesture G3: take &str, return a
// borrowed slice, allocate nothing. Read+inline 2.4 walks a FRESH E0499
// (element borrow + push, not 2.2's two named bindings) and closes with the
// 'a lifetimes-lite cameo + the rustc --explain habit. Kata 2.5 is
// fail-by-design: the starter's E0499 is the brief.

const STEP_2_1 = {
  id: STEP_2_1_ID,
  lessonId: LESSON_2_ID,
  order: 1,
  type: 'read' as const,
  title: 'Borrowing: read access for many, write access for one',
  instruction: `## Why this matters

Lesson 1 ended with you returning ownership just to keep using a value — \`let s = shout(s);\` works, but threading ownership through every call is bureaucracy. Borrowing dissolves that problem: a reference lets a function use a value without taking it. The borrow checker's whole job is two guarantees — no reference outlives its value, and nobody mutates data someone else is reading.

## \`&T\` — shared borrows, as many as you like

\`\`\`rust
fn measure(s: &String) -> usize {
    s.len()
}

fn main() {
    let name = String::from("dojo");
    let a = &name;
    let b = &name;
    println!("{} {} {}", a, b, measure(&name));
}
\`\`\`

A \`&T\` is read access (\`&String\` on purpose — the next section improves it). Any number can coexist, because readers can't invalidate each other. Nothing moves: \`name\` is still owned by \`main\` after every borrow. If you come from JS, Java, or Python, this is the share-don't-copy argument passing you already do everywhere — except the compiler tracks who's looking, and while anyone is looking, nobody writes — not even the owner.

## \`&String\` vs \`&str\` — take the slice

:figure[disambiguation]{id="string-vs-str"}

\`String\` owns and grows a heap buffer; \`&str\` is a borrowed view into string data — anyone's string data, including a literal's. The idiomatic argument type is \`&str\`. A \`&String\` coerces to \`&str\` at the call site (a compile-checked conversion — nothing like JS coercion; it's the deref coercion the Lesson 1 playground let you feel), so a \`&str\` parameter accepts both. Take \`&str\` unless taking ownership is the point.

\`\`\`rust
fn greet(name: &str) -> String {
    format!("hello, {}", name)
}

fn main() {
    let owned = String::from("Mariana");
    println!("{}", greet(&owned));  // &String coerces to &str
    println!("{}", greet("Yui"));   // a literal already is a &str
}
\`\`\`

## \`&mut T\` — exactly one, no readers alongside

Write access is exclusive: one \`&mut T\`, and while it lives, no other borrow of any kind — not even a \`&T\`. This is the aliasing-XOR-mutation rule: many readers or one writer, never both at once. It isn't pedantry. If aliased data can never be mutated, a data race cannot be expressed — and the check runs at compile time, not in production at 3 a.m. Methods get the same three modes in Lesson 4: \`&self\`, \`&mut self\`, and \`self\` are these access levels as receivers.

So what happens when you hold two write handles at once? Predict the compiler's full answer before the next step reveals it — here is the code and only the headline:

\`\`\`rust
fn main() {
    let mut report = String::from("draft");
    let editor = &mut report;
    let reviewer = &mut report;
    editor.push_str(" v2");
    println!("{}", reviewer);
}
\`\`\`

\`\`\`text
error[E0499]: cannot borrow \`report\` as mutable more than once at a time
\`\`\``,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

// The E0499 walk — appended to every option's feedback at seed (per the
// lesson file's reveal section), so each answer path sees it. The captured
// 1.68.2 E0499 output for this snippet carries three labeled spans and the
// --explain trailer, and emits no literal help: line. Captured at smoke.
const E0499_REVEAL = `Here is the full output the read step withheld:

\`\`\`text
error[E0499]: cannot borrow \`v\` as mutable more than once at a time
 --> main.rs:4:14
  |
3 |     let r1 = &mut v;
  |              ------ first mutable borrow occurs here
4 |     let r2 = &mut v;
  |              ^^^^^^ second mutable borrow occurs here
5 |     println!("{:?} {:?}", r1, r2);
  |                           -- first borrow later used here

error: aborting due to previous error

For more information about this error, try \`rustc --explain E0499\`.
\`\`\`

Read it like the compiler wrote it for you, because it did. The headline names the owner (\`v\`) and the broken rule. The first span marks where the first exclusive borrow began (\`r1\`). The caret span marks the borrow that broke the rule (\`r2\`). The third label is the proof of overlap — \`r1\` is *used later*, on the \`println!\` line, so its borrow is still alive when \`r2\` is created. That label is also the fix in disguise: if \`r1\`'s last use came **before** \`let r2\`, the first borrow would already be over and this would compile. Borrows end at their last use, and rustc points the guidance at exactly that. The next-but-one step walks a fresh \`E0499\` line by line; first, a kata.`

const STEP_2_2 = {
  id: STEP_2_2_ID,
  lessonId: LESSON_2_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: does this compile?',
  instruction: `The read step showed you the headline. Now commit to the full answer: does this compile, and if not, what exactly does rustc say?`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'Does this compile — and if not, what does rustc say?',
    snippet: `fn main() {
    let mut v = vec![1, 2, 3];
    let r1 = &mut v;
    let r2 = &mut v;
    println!("{:?} {:?}", r1, r2);
}`,
    options: [
      { id: 'a', text: 'Compiles — prints \`[1, 2, 3] [1, 2, 3]\`' },
      { id: 'b', text: 'Compiles with an aliasing warning' },
      {
        id: 'c',
        text: 'Fails to compile — \`E0499\`, cannot borrow \`v\` as mutable more than once at a time',
      },
      {
        id: 'd',
        text: 'Fails to compile — \`E0502\`, cannot borrow \`v\` as mutable because it is also borrowed as immutable',
      },
    ],
    correct: 'c',
    feedback: {
      a: `The JS/Java/Python reflex: references are free, take as many as you like, the runtime keeps them all valid. In Rust a \`&mut\` is an exclusive capability — the compiler hands out at most one at a time, precisely so that nobody else (reader *or* writer) can observe the data mid-mutation. Two live \`&mut v\` bindings is the textbook violation, and it's a compile error, not a runtime surprise. The real output is below.\n\n${E0499_REVEAL}`,
      b: `The C reflex — aliasing rules as something the compiler warns about (or silently miscompiles around) while the program ships anyway. Rust's aliasing-XOR-mutation rule is a hard gate, not a lint: code that breaks it does not produce a binary. That hardness is the trade the whole language makes — you negotiate with the compiler now instead of with a debugger later. The real output is below.\n\n${E0499_REVEAL}`,
      c: `Correct. The full output the read step withheld is below — walk it line by line.\n\n${E0499_REVEAL}`,
      d: `Close — right family, wrong code, and the distinction matters because you'll meet both in your first real week. \`E0499\` is two **writers**: two \`&mut\` borrows alive at once (this snippet). \`E0502\` is a writer **plus a reader**: a \`&mut\` alive while a plain \`&\` borrow of the same value is also alive. Both spell the same rule — many readers or one writer — from its two failure sides. The next-but-one step shows you an \`E0502\` excerpt next to a fresh \`E0499\` so the pair sticks. The real output is below.\n\n${E0499_REVEAL}`,
    },
  },
}

const STEP_2_3 = {
  id: STEP_2_3_ID,
  lessonId: LESSON_2_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Return the first word as a borrowed slice',
  instruction: `## Your task

Write \`first_word(s: &str) -> &str\`: return the slice of \`s\` up to (not including) the first space. If there is no space, return the whole input.

The signature is the lesson. The function **takes \`&str\`** — so it accepts a \`String\`, a literal, or another slice — and **returns \`&str\`**: a borrowed view into the caller's data. No \`String\` allocation, no clone. This take-a-slice-return-a-slice shape is the default for every string function you'll write in real Rust, and every later kata in this scroll holds it.

### What's expected

\`\`\`rust
first_word("hello world")   // "hello"
first_word("single")        // "single"
first_word("")              // ""
\`\`\``,
  starterCode: `fn first_word(s: &str) -> &str {
    // your code
    todo!()
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("returns the slice before the first space", || _eq(first_word("hello world"), "hello"));

_t("returns the whole input when there is no space", || _eq(first_word("single"), "single"));

_t("returns an empty slice for empty input", || _eq(first_word(""), ""));

_t("stops at the first space, not the last", || _eq(first_word("ship it friday"), "ship"));
${RUST_HARNESS_FOOTER}`,
  hint: null,
  hints: [
    `Two sub-problems, in order: find where the first word ends, then hand back that piece of the input. The first is a search over the characters; the second is a borrowed view, not a new allocation. And ask yourself what should happen when the search finds nothing — that case is the second test.`,
    `For the search, \`str\` has a family of position-finding methods — \`str::find\` is the direct one — that give you the byte index of the first space, if any. For the hand-back, the slice form \`&s[..i]\` is a borrowed view of \`s\` from the start up to index \`i\` — no new \`String\`, which is why the signature says \`&str\`. You still have to decide what the no-space case returns.`,
  ],
  solution: `fn first_word(s: &str) -> &str {
    match s.find(' ') {
        Some(i) => &s[..i],
        None => s,
    }
}
`,
  alternativeApproach: `An iterator-flavored version: \`s.split(' ').next().unwrap_or("")\` — \`split\` always yields at least one piece (the empty string for empty input), so \`next()\` is never \`None\` in practice. Both versions borrow; neither allocates. If you wrote \`.to_string()\` anywhere, you paid for an allocation the signature promised the caller you wouldn't.`,
}

const STEP_2_4 = {
  id: STEP_2_4_ID,
  lessonId: LESSON_2_ID,
  order: 4,
  type: 'read+inline' as const,
  title: 'Read a borrow error like the compiler wrote it for you',
  instruction: `## Why this matters

You predicted one \`E0499\`. The durable skill is reading the *next* one cold — a borrow error you've never seen, in code you wrote at 6 p.m. Same anatomy every time: headline, first borrow span, conflicting span, overlap proof. Walk it once on a fresh case and you own the shape.

Here's the fresh case — no two bindings to the whole vector this time:

\`\`\`rust
fn main() {
    let mut scores = vec![80, 91, 73];
    let top = &mut scores[0];
    scores.push(88);
    *top += 5;
    println!("{:?}", scores);
}
\`\`\`

It refuses to compile. The output starts:

\`\`\`text
error[E0499]: cannot borrow \`scores\` as mutable more than once at a time
 --> main.rs:4:5
  |
3 |     let top = &mut scores[0];
  |                    ------ first mutable borrow occurs here
\`\`\`

The headline names the owner and the rule. The first span marks where the first exclusive borrow began — and notice what it says: \`top\` borrows *one element*, but the label charges the borrow against \`scores\`. Borrowing an element borrows the whole vector. The compiler can't prove a future \`push\` won't reallocate the buffer out from under your element pointer (a \`Vec\` keeps its elements in one contiguous buffer; growing it may move that buffer) — so it doesn't try; it forbids the overlap.

<!-- interact:second-span -->

Here is the rest of the output:

\`\`\`text
4 |     scores.push(88);
  |     ^^^^^^^^^^^^^^^ second mutable borrow occurs here
5 |     *top += 5;
  |     --------- first borrow later used here

error: aborting due to previous error
\`\`\`

The caret span is the line that broke the rule: \`push\` needs \`&mut\` access to the whole vector, and \`top\` already holds it. The last label is the overlap proof — \`top\` is **used later**, at \`*top += 5\`, so its borrow is still alive at the \`push\`. Borrows end at their last use; that label tells you exactly where this one refuses to die.

<!-- interact:fix-shape -->

One more turn of the same anatomy. \`push\` needs *write* access — that's why this is two-writers, \`E0499\`. What if the second access only needed to *read*?

<!-- interact:e0499-vs-e0502 -->

## The cameo: \`'a\`

Sometimes the compiler's question isn't "which borrows overlap" but "how long must this borrow live". When a function returns a reference and the compiler can't infer which input it borrows from, the signature carries an explicit lifetime:

\`\`\`rust
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}
\`\`\`

Read \`'a\` as: "the returned reference is only valid while both inputs are." That's your entire job with lifetimes in this scroll — **recognize \`'a\` in errors and signatures**, the same span-reading you just did. Writing annotations, elision rules, \`'static\`: scattering \`'a\` everywhere because one signature needed it is the classic footgun, and the depth belongs to \`rust-lifetimes-and-borrowing-deep\`.

## The habit: \`rustc --explain\`

Every Rust error code has a long-form explanation built into the toolchain: \`rustc --explain E0499\` prints the full story with examples, offline. The error message is the diagnosis; \`--explain\` is the textbook page. Bookmark the habit — it works for every code this scroll shows you and every one it doesn't.

Next: a starter that fails with exactly the error you just learned to read. Fix it.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    interactions: [
      {
        kind: 'reveal' as const,
        after: 'second-span',
        prompt: 'Before you scroll: in any borrow error, what does the second span — the ^^^ one — point at?',
        answer: 'The conflicting borrow: the place that tried to take access while the first borrow was still alive. Here that will be `scores.push(88)` — push needs `&mut` to the whole vector, and `top` already holds one. First span = where the existing borrow began; caret span = who collided with it. That pairing holds in every E0499 and E0502 you will ever read.',
      },
      {
        kind: 'reveal' as const,
        after: 'fix-shape',
        prompt: 'You can see the overlap. This E0499 prints no `help:` line — so read the span labels (and reach for `rustc --explain E0499`). What shape of fix do they point you toward?',
        answer: 'End one borrow before the other starts. The "first borrow later used here" label on `*top += 5` is the signpost: move that line above the push — a borrow dies at its last use — or wrap the element work in its own `{ }` scope. The fix re-orders WHEN each access happens; it does not change WHAT the code does. That re-sequencing move is the standard answer to E0499, and it is exactly what the next kata asks of you.',
      },
      {
        kind: 'micro-quiz' as const,
        after: 'e0499-vs-e0502',
        question: 'Replace the push with a read — `let count = scores.len();` — while `top` is still alive. Which code does rustc raise?',
        options: [
          'E0499 — still two overlapping borrows',
          'E0502 — a writer and a reader collide',
        ] as [string, string],
        correct: 1 as const,
        feedback: [
          'Overlapping, yes — but not two writers. E0499 is reserved for two `&mut` borrows. A `&mut` overlapping a plain `&` (and `len` takes `&self`) is its sibling: E0502 — "cannot borrow `scores` as immutable because it is also borrowed as mutable". Two codes, one rule: many readers or one writer.',
          'Correct. One writer plus one reader is the other half of the aliasing-XOR-mutation rule, and it gets its own code:\n\n```text\nerror[E0502]: cannot borrow `scores` as immutable because it is also borrowed as mutable\n --> main.rs:4:17\n  |\n3 |     let top = &mut scores[0];\n  |                    ------ mutable borrow occurs here\n4 |     let count = scores.len();\n  |                 ^^^^^^^^^^^^ immutable borrow occurs here\n5 |     *top += 5;\n  |     --------- mutable borrow later used here\n\nerror: aborting due to previous error\n\nFor more information about this error, try `rustc --explain E0502`.\n```\n\nSame anatomy you just walked — headline, spans, overlap. E0499: two writers. E0502: writer plus reader. You now hold both codes the lesson outcomes promised.',
        ] as [string, string],
      },
    ],
  },
}

const STEP_2_5 = {
  id: STEP_2_5_ID,
  lessonId: LESSON_2_ID,
  order: 5,
  type: 'kata' as const,
  title: 'Make the overlapping borrows compile',
  instruction: `**This starter does not compile — by design.** Run it, read the \`E0499\`, and treat the compiler's output as the brief: the error is telling you which two borrows overlap and where the first one refuses to end.

## Your task

\`restock\` builds a stock list: one handle pushes incoming units, another audits the first entry. The *work* is fine — the expected final vector is \`[10, 7, 2, 5, 8]\` — but the two \`&mut\` borrows overlap, so the borrow checker rejects it.

Make the minimal change that compiles **and** keeps the same final contents. Two honest shapes exist (step 2.4's walk named the move): let one writer finish before the next begins, or scope a borrow so it ends early. Both pass; pick one and be able to say why.`,
  starterCode: `fn restock() -> Vec<i32> {
    let mut stock = vec![3, 7, 2];
    let receiver = &mut stock;
    receiver.push(5);
    let auditor = &mut stock;
    auditor[0] = 10;
    receiver.push(8);
    stock
}

fn main() {
    println!("{:?}", restock());
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("the audit lands on the first element", || _eq(restock()[0], 10));

_t("every push survives the fix", || _eq(restock(), vec![10, 7, 2, 5, 8]));
${RUST_HARNESS_FOOTER}`,
  hint: null,
  hints: [
    `The compiler marked three places:

\`\`\`text
  |              ------ first mutable borrow occurs here
  |              ^^^^^^ second mutable borrow occurs here
  |     ---------------- first borrow later used here
\`\`\`

A borrow doesn't end where it's created — it ends at its **last use**. So the question the spans are asking is: when does \`receiver\`'s borrow actually end, and is \`auditor\` created before or after that point?`,
    `\`receiver\`'s last use (\`receiver.push(8)\`) sits *after* \`auditor\` is created, so the two \`&mut\` borrows overlap. The fix shape: make the first writer's borrow finish before the second begins — either by moving its last use up so it ends earlier, or by scoping it in a \`{ }\` block so it drops at the brace. The final contents don't depend on the order, which is why both shapes pass.`,
  ],
  solution: `fn restock() -> Vec<i32> {
    let mut stock = vec![3, 7, 2];
    {
        let receiver = &mut stock;
        receiver.push(5);
        receiver.push(8);
    }
    let auditor = &mut stock;
    auditor[0] = 10;
    stock
}

fn main() {
    println!("{:?}", restock());
}
`,
  alternativeApproach: `The other honest fix: drop the intermediate handles entirely and let each statement borrow and release on its own — \`stock.push(5); stock[0] = 10; stock.push(8);\`. Each method call takes \`&mut stock\` for exactly one statement, so nothing overlaps. In real code this is usually the answer: named long-lived \`&mut\` bindings are rarer than the starter made them look, and most E0499s dissolve when you stop hoarding a write handle you only needed for one line.`,
}

const LESSON_2 = {
  id: LESSON_2_ID,
  scrollId: COURSE_ID,
  order: 3,
  title: 'Borrowing and references',
}

// =============================================================================
// Lesson 3 — Result, ?, and errors as values
// =============================================================================
//
// 3 steps (read + 2 kata). No predict: the compile-refusal moment (? in a
// non-Result function → E0277) lands as a deliberately-non-compiling sample
// inside read 3.1, full output INCLUDING its help: line (the scroll's one
// full-reveal error with no predict or walk attached). Kata 3.2
// (parse_and_double) drills the ? gesture; kata 3.3 hand-rolls a custom error
// enum with Display + From (todo!-stubbed skeletons pre-written — fail-by-
// tests, not fail-by-design).

const STEP_3_1 = {
  id: STEP_3_1_ID,
  lessonId: LESSON_3_ID,
  order: 1,
  type: 'read' as const,
  title: 'Errors are values the compiler makes you handle',
  instruction: `## Why this matters

You already encode "this can fail" somewhere: the TS result-object union — \`{ ok: true, value } | { ok: false, error }\` — written to escape exceptions; Node's \`(err, data)\` callbacks. From Java: checked exceptions had the right instinct — failure in the signature — and mechanics that don't compose, so everyone catches and swallows. \`Result<T, E>\` is that instinct with compiler enforcement, kin to Go's \`(value, err)\` pairs and functional \`Either\`.

## \`Result\` is an ordinary enum

Two variants, no runtime machinery — and the type won't let you forget the error arm:

\`\`\`rust
fn main() {
    let parsed = "42".parse::<i32>();
    match parsed {
        Ok(n) => println!("doubled: {}", n * 2),
        Err(e) => println!("not a number: {}", e),
    }
}
\`\`\`

\`parse\` returns \`Result<i32, ParseIntError>\`. There is no \`n\` outside the \`Ok\` arm — the forgotten error path is a type error, not a review comment.

## \`?\` — the match ladder, collapsed

A full \`match\` per \`Result\` turns three fallible calls into a staircase; \`?\` is the staircase as one character:

:figure[before-after]{id="match-ladder-vs-question-mark"}

The desugaring is the lesson: \`expr?\` means *if \`Ok(v)\`, evaluate to \`v\`; if \`Err(e)\`, \`return Err(From::from(e))\` now*. Two consequences: \`?\` is a \`return\` in disguise, so the enclosing function must itself return \`Result\` (or \`Option\`); and the error passes through \`From::from\` on the way out — the next section. Break the first rule and you hit an error every Rust beginner meets:

\`\`\`rust
fn double_input(s: &str) -> i32 {
    let n: i32 = s.parse()?;
    n * 2
}
\`\`\`

\`\`\`text
error[E0277]: the \`?\` operator can only be used in a function that returns \`Result\` or \`Option\` (or another type that implements \`FromResidual\`)
 --> main.rs:2:27
  |
1 | fn double_input(s: &str) -> i32 {
  | ------------------------------- this function should return \`Result\` or \`Option\` to accept \`?\`
2 |     let n: i32 = s.parse()?;
  |                           ^ cannot use the \`?\` operator in a function that returns \`i32\`
  |
  = help: the trait \`FromResidual<Result<Infallible, _>>\` is not implemented for \`i32\`

error: aborting due to previous error

For more information about this error, try \`rustc --explain E0277\`.
\`\`\`

Read the anatomy: the span under the signature contains the fix; the \`help:\` line names the mechanism — \`?\` needs somewhere typed for the error to go. The trait it mentions is desugar plumbing; act on the span's sentence.

## \`From\` is how \`?\` converts errors

Real pipelines fail in more than one way. Because \`?\` calls \`From::from\` as it propagates, a function returning \`Result<T, AppError>\` can use \`?\` on a \`Result<_, ParseIntError>\` — *if* the conversion impl exists (\`impl … for\`: pattern-match the spelling; Lesson 4 teaches it):

\`\`\`rust
impl From<std::num::ParseIntError> for AppError {
    fn from(err: std::num::ParseIntError) -> AppError { AppError::Parse(err) }
}
\`\`\`

Three lines; every \`?\` now wraps the parse error into your type. (Compiles next to kata 3.3's \`AppError\` enum.)

## \`unwrap\`, \`expect\`, and where \`panic!\` belongs

\`unwrap()\` and \`expect()\` extract the \`Ok\` value or crash — **invariant assertions**, not error handling: the \`expect\` string is a claim about your own logic. Caller can plausibly handle the failure → \`Result\`; broken internal assumptions → \`panic!\`/\`expect\`.

\`\`\`rust
fn main() {
    let port: u16 = "8080".parse().expect("hardcoded port is a valid u16");
    println!("listening on {}", port);
}
\`\`\`

Production error enums are derived with \`thiserror\`, context added with \`anyhow\` — absent here, so you hand-write \`Display\` and \`From\`: the mechanics are the lesson, the boilerplate is what the crates remove. Next: the \`?\` shape, then the whole error enum.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_3_2 = {
  id: STEP_3_2_ID,
  lessonId: LESSON_3_ID,
  order: 2,
  type: 'kata' as const,
  title: 'Propagate a parse failure with ?',
  instruction: `## Your task

Write \`parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError>\`: parse \`s\` as an \`i32\`, return double its value on success, and propagate the parse error on failure.

**Use \`?\` — no \`match\`, no \`unwrap\`.** The tests can't see inside your function, so this rule is on your honor; the point of the kata is writing the propagation idiom your hands will use daily, not proving the ladder works (the read step already showed both). After you pass, the alternative approach shows the \`match\` version for contrast.

### What's expected

\`\`\`rust
parse_and_double("5")     // Ok(10)
parse_and_double("-3")    // Ok(-6)
parse_and_double("abc")   // Err(ParseIntError { .. })
\`\`\``,
  starterCode: `fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    // your code
    todo!()
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("doubles a parsed positive number", || _eq(parse_and_double("5"), Ok(10)));

_t("doubles a parsed negative number", || _eq(parse_and_double("-3"), Ok(-6)));

_t("propagates the error for non-numeric input", || _eq(parse_and_double("abc").is_err(), true));

_t("propagates the error for empty input", || _eq(parse_and_double("").is_err(), true));
${RUST_HARNESS_FOOTER}`,
  hint: `\`s.parse::<i32>()\` returns \`Result<i32, ParseIntError>\` — exactly the error type your signature promises. So the propagation needs no conversion at all: \`?\` unwraps the \`Ok\` value into your expression on success and early-returns the \`Err\` for you on failure. If you wrote a \`match\`, you re-built \`?\` by hand — read the desugar paragraph again and collapse it.`,
  solution: `fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    Ok(s.parse::<i32>()? * 2)
}
`,
  alternativeApproach: `The ladder \`?\` replaces — same behavior, four lines for one character:

\`\`\`rust
fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    match s.parse::<i32>() {
        Ok(n) => Ok(n * 2),
        Err(e) => Err(e),
    }
}
\`\`\``,
}

const STEP_3_3 = {
  id: STEP_3_3_ID,
  lessonId: LESSON_3_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Fill in a custom error enum: Display, From, and one fallible function',
  instruction: `## Your task

The starter hands you a complete error enum and the skeletons of its two trait impls — the syntax you haven't been taught yet is already written. You fill three things:

1. **\`Display\`'s body** — \`AppError::Empty\` must display exactly \`input was empty\`; \`AppError::Parse(e)\` must include the inner error's own message in what it writes.
2. **\`From\`'s body** — wrap the \`ParseIntError\` in the right variant. The read step's three-line sample is your model.
3. **\`parse_first(input: &[&str]) -> Result<i32, AppError>\`** — return \`Err(AppError::Empty)\` for an empty slice; otherwise parse the **first** element as \`i32\`, letting \`?\` convert a parse failure into your error type. That conversion is the whole reason \`From\` exists: once your impl is in place, \`?\` does the wrapping without you naming \`AppError\` at the call site.

This is the hand-rolled version of what \`thiserror\` derives in production — write it once so the derive never looks like magic.`,
  starterCode: `use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Parse(ParseIntError),
    Empty,
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        // your code: one write! per variant
        todo!()
    }
}

impl From<ParseIntError> for AppError {
    fn from(err: ParseIntError) -> AppError {
        // your code
        todo!()
    }
}

fn parse_first(input: &[&str]) -> Result<i32, AppError> {
    // your code
    todo!()
}

fn main() {
    println!("{:?}", parse_first(&["42", "ignored"]));
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("parses the first element of a valid slice", || _eq(matches!(parse_first(&["42", "junk"]), Ok(42)), true));

_t("an empty slice is the Empty error", || _eq(matches!(parse_first(&[]), Err(AppError::Empty)), true));

_t("a bad first element becomes a Parse error via From", || _eq(matches!(parse_first(&["nope", "7"]), Err(AppError::Parse(_))), true));

_t("Empty displays its exact message", || _eq(format!("{}", AppError::Empty), String::from("input was empty")));

_t("Parse's display carries the inner error's message", || {
    let err = "x".parse::<i32>().unwrap_err();
    let shown = format!("{}", AppError::Parse(err.clone()));
    _eq(shown.contains(&err.to_string()), true)
});
${RUST_HARNESS_FOOTER}`,
  hint: `Three bodies, three jobs:

- **\`Display\`** must produce text for each variant: the exact \`input was empty\` string for one, and for the other, something that *embeds the inner error's message* — \`Display\` types interpolate into \`write!\` the same way they do into \`println!\`.
- **\`From\`** receives a \`ParseIntError\` and must return an \`AppError\`. The enum has exactly one variant built to carry it. (The read step's three-line \`From\` sample did this exact job for this exact enum.)
- **\`parse_first\`** has two failure paths with different mechanics: the empty-slice case is *yours to construct* — no conversion exists for "the slice was empty", so you name the variant yourself. The parse case is *\`?\`'s to convert* — once your \`From\` impl exists, \`?\` on the parse result wraps the error for you. If the compiler complains at your \`?\`, ask: which trait impl is it looking for, and does mine return the right variant?`,
  solution: `use std::num::ParseIntError;

#[derive(Debug)]
enum AppError {
    Parse(ParseIntError),
    Empty,
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::Parse(err) => write!(f, "could not parse number: {}", err),
            AppError::Empty => write!(f, "input was empty"),
        }
    }
}

impl From<ParseIntError> for AppError {
    fn from(err: ParseIntError) -> AppError {
        AppError::Parse(err)
    }
}

fn parse_first(input: &[&str]) -> Result<i32, AppError> {
    match input.first() {
        None => Err(AppError::Empty),
        Some(first) => Ok(first.parse::<i32>()?),
    }
}

fn main() {
    println!("{:?}", parse_first(&["42", "ignored"]));
}
`,
  alternativeApproach: `\`parse_first\`'s empty check also writes as \`let first = input.first().ok_or(AppError::Empty)?;\` — \`ok_or\` turns the \`Option\` into a \`Result\`, and then the same \`?\` you used for parsing handles the early return. One idiom, both failure paths. And the forward hook: \`From\`/\`Into\` is a real trait pair you just implemented by hand — \`rust-traits-deep\` picks it up from here, and \`thiserror\`'s \`#[from]\` attribute generates *exactly* the impl you wrote.`,
}

const LESSON_3 = {
  id: LESSON_3_ID,
  scrollId: COURSE_ID,
  order: 4,
  title: 'Result, ?, and errors as values',
}

// =============================================================================
// Lesson 4 — Traits and generics: interfaces with a twist
// =============================================================================
//
// 4 steps (read + predict + 2 kata). Delta-framed: traits anchored to the
// TS/Java interface the personas already write; monomorphization named as the
// inverse of Java's type erasure. Read 4.1 carries no error excerpt (every
// sample compiles) and embeds the dispatch-decision tabbed-card figure; it
// closes by posing predict 4.2's question. Predict 4.2 reveals the scroll's
// E0277 in its unsized-`dyn` form — a DISTINCT member of the same family as
// 3.1's `?`-in-non-Result E0277 (Sized, not FromResidual). Kata 4.3 (G1) has
// the learner write a struct + inherent impl + trait impl; kata 4.4 a single
// generic function the tests call with two concrete types (monomorphization
// observable). The 4.2 E0277-unsized excerpt is the verbatim Piston 1.68.2 capture.

const STEP_4_1 = {
  id: STEP_4_1_ID,
  lessonId: LESSON_4_ID,
  order: 1,
  type: 'read' as const,
  title: 'Traits: the interface you know, the dispatch you choose',
  instruction: `## Why this matters

You already hold this concept: a Rust **trait** is the interface you write in TypeScript or Java — a named contract of methods. The twist is threefold: no inheritance between types (traits attach behavior to otherwise-flat types), a single *blanket impl* can cover every type matching a bound (a power your interfaces lack — \`rust-traits-deep\` owns it), and — the heart of this lesson — **dispatch** (which function body actually runs) **is a choice you spell**.

One inversion, for Java readers: your generics **erase** — one compiled body, type parameters gone by runtime. Rust **monomorphizes** — one generic body in source, one specialized copy per concrete type in the binary. Your erasure model running backwards: flip it once and the rest is bookkeeping.

## Define, implement

Two statements: the contract, and a type honoring it. A trait method may ship a default body — implementors get it free and may override. The \`&self\` receiver is Lesson 2's shared borrow wearing method syntax.

\`\`\`rust
trait Greet {
    fn name(&self) -> String;
    fn greet(&self) -> String {
        format!("hello, {}", self.name())
    }
}

struct Person { name: String }

impl Greet for Person {
    fn name(&self) -> String {
        self.name.clone()
    }
}

fn main() {
    let dev = Person { name: String::from("Mariana") };
    println!("{}", dev.greet());
}
\`\`\`

## Consuming the contract: static by default

The generic bound is the workhorse. It compiles to a specialized \`announce\` per concrete type — direct calls, zero runtime cost, a bigger binary:

\`\`\`rust
fn announce<T: Greet>(guest: &T) -> String {
    format!("now arriving: {}", guest.name())
}
\`\`\`

\`fn announce(guest: &impl Greet)\` is sugar for that exact generic — same monomorphization; you only lose naming \`T\` at a call site. (In **return** position: "one concrete type, unnamed.") The third spelling is different machinery:

\`\`\`rust
let guests: Vec<Box<dyn Greet>> = vec![
    Box::new(Person { name: String::from("Mariana") }),
    Box::new(Robot),
];
\`\`\`

(Compiles given the definitions above plus a \`struct Robot;\` impl.) \`Box<dyn Greet>\` is **runtime dispatch**: one compiled body, every call through a vtable — a per-type table of method pointers looked up at runtime — the value behind a heap allocation. That buys what monomorphization cannot: one collection holding *different* concrete types. Deeper trait-object territory (\`&dyn\`, explicit lifetimes) is \`rust-traits-deep\`'s too.

## The decision — and the reflex to retire

The Java/C# reflex says interface-typed values are always dynamically dispatched, so \`dyn\` looks like the honest default; in Rust it is the escape hatch. The tree: one concrete type → take it plainly; several types, known at compile time → generic bound; genuine runtime heterogeneity → \`Box<dyn Trait>\`. The figure holds the three spellings side by side:

:figure[tabbed-card]{id="dispatch-decision"}

## \`#[derive]\`: traits the compiler writes

Some impls are mechanical enough to request instead of write:

\`\`\`rust
#[derive(Debug, Clone, PartialEq)]
struct Session { id: u32 }

fn main() {
    let a = Session { id: 7 };
    let b = a.clone();
    println!("{:?} equals {:?}: {}", a, b, a == b);
}
\`\`\`

\`derive\` is a macro — the mechanism belongs to \`rust-macros-declarative-and-procedural\`; this scroll only asks you to read and use it. Next: four \`announce\`-shaped signatures — which ones does the compiler accept? Commit before you peek.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

// The E0277-unsized walk — appended to every option's feedback at seed (per
// the lesson file's reveal section), so each answer path sees it. DISTINCT
// from batch-2's E0277_REVEAL (3.1, ?-in-non-Result / FromResidual): this is
// the Sized form on a bare `dyn` parameter. Output is the verbatim Piston
// 1.68.2 capture (2026-06-12).
const E0277_UNSIZED_REVEAL = `Three of the four compile. Here is what rustc says about \`greet_dyn\`:

\`\`\`text
error[E0277]: the size for values of type \`(dyn Greet + 'static)\` cannot be known at compilation time
 --> main.rs:8:14
  |
8 | fn greet_dyn(guest: dyn Greet) -> String { guest.name() }
  |              ^^^^^ doesn't have a size known at compile-time
  |
  = help: the trait \`Sized\` is not implemented for \`(dyn Greet + 'static)\`
help: you can use \`impl Trait\` as the argument type
  |
8 | fn greet_dyn(guest: impl Greet) -> String { guest.name() }
  |                     ~~~~
help: function arguments must have a statically known size, borrowed types always have a known size
  |
8 | fn greet_dyn(guest: &dyn Greet) -> String { guest.name() }
  |                     +

error: aborting due to previous error

For more information about this error, try \`rustc --explain E0277\`.
\`\`\`

First, the code. You have met \`E0277\` before: in Lesson 3 it refused \`?\` inside a function returning \`i32\`. \`E0277\` is not one error — it is the **family** "a required trait bound is not satisfied," and the unsatisfied trait is named in the headline or a \`help:\` line — read both. There it was the \`?\`-plumbing's \`FromResidual\`; here it is \`Sized\`, the implicit bound every by-value parameter carries. When you meet the next family member, those are the lines to read first.

Why \`dyn Greet\` specifically: parameters are passed by value, and a value needs a compile-time size to get a stack slot. \`dyn Greet\` is the type whose concrete implementor — and therefore size — is only known at runtime. The compiler writes **two** fixes for you, and they are two of the three signatures that compile: the first \`help:\` rewrites the parameter to \`impl Greet\` (the sized, monomorphized form); the second puts it behind a pointer, \`&dyn Greet\`. \`&dyn Greet\` and \`Box<dyn Greet>\` are both pointer-sized, and pointers always have a known size. The compiler is pointing you back at the very signatures the predict asked about. (The \`'static\` in the message is the lifetime cameo from Lesson 2's error walk — recognize it, don't write it; owned trait objects default to it, and the full story belongs to \`rust-traits-deep\`.)

Now the three that compile — they are not interchangeable:

- \`greet_generic\` and \`greet_impl\` produce **identical machine code**: static dispatch, monomorphized per concrete type, zero runtime cost. The only difference is at the call site — the generic's type can be named explicitly (\`greet_generic::<Person>(dev)\`); the \`impl Trait\` version's cannot.
- \`greet_boxed\` is **dynamic dispatch**: one compiled body, a vtable lookup per call, a heap allocation per value. The right signature when the caller genuinely holds mixed concrete types — and a silent tax everywhere else.

Name the reflex once more, because this is where it picks wrongly: the Java/C# instinct says "interface parameter means dynamic dispatch, always" — which makes \`greet_boxed\` look like the workhorse and \`greet_generic\` look exotic. Rust's default runs the other way: reach for the bound; pay for the box only when heterogeneity is real. The next two katas have you write both halves — the contract with its impls, then the generic consumer.`

const STEP_4_2 = {
  id: STEP_4_2_ID,
  lessonId: LESSON_4_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: which of these signatures compile?',
  instruction: `The read ended pointing here: four signatures, one trait — the same \`Greet\`. Commit to an answer before you reveal.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'Which of these four signatures compile?',
    snippet: `trait Greet {
    fn name(&self) -> String;
}

fn greet_generic<T: Greet>(guest: T) -> String { guest.name() }
fn greet_impl(guest: impl Greet) -> String { guest.name() }
fn greet_boxed(guest: Box<dyn Greet>) -> String { guest.name() }
fn greet_dyn(guest: dyn Greet) -> String { guest.name() }`,
    options: [
      { id: 'a', text: 'All four — they are four spellings of the same contract' },
      { id: 'b', text: 'Three — \`greet_dyn\` is rejected; the other three compile' },
      {
        id: 'c',
        text: 'Two — only \`greet_generic\` and \`greet_impl\`; trait objects cannot be function parameters at all',
      },
      {
        id: 'd',
        text: 'Three — \`greet_impl\` is rejected; \`impl Trait\` is only legal as a return type',
      },
    ],
    correct: 'b',
    feedback: {
      a: `The Java/C# reflex, in its purest form: there, \`String f(Greet guest)\` is the daily signature, an interface-typed parameter is just a reference, and dispatch is dynamic — always, invisibly. \`fn greet_dyn(guest: dyn Greet)\` is that signature transliterated, which is exactly why it reads as the *normal* one. But Rust passes parameters by value, a value needs a compile-time size to get a stack slot, and \`dyn Greet\` is precisely the type whose size depends on which implementor shows up at runtime. The real output is below.\n\n${E0277_UNSIZED_REVEAL}`,
      b: `Correct — and the three that compile are not three spellings of one thing. Two of them are the same machine code and the third is different machinery. The error and the dispatch walk are below.\n\n${E0277_UNSIZED_REVEAL}`,
      c: `The overcorrection that follows first contact with the unsized rule: "trait objects can't cross function boundaries." They can — behind a pointer. \`Box<dyn Greet>\` is a fat pointer (data pointer + vtable pointer), a perfectly fixed-size parameter; \`&dyn Greet\` works the same way. The rule was never "no trait objects in signatures" — it is "no unsized values *by value*." The real output is below.\n\n${E0277_UNSIZED_REVEAL}`,
      d: `The half-remembered rule. \`impl Trait\` did premiere in return position — and that is where it is irreplaceable ("one concrete type, unnamed"). But argument position is legal, stable for years, and is pure sugar for the generic on the line above it: same monomorphization, same zero cost. The real output is below.\n\n${E0277_UNSIZED_REVEAL}`,
    },
  },
}

const STEP_4_3 = {
  id: STEP_4_3_ID,
  lessonId: LESSON_4_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Define a struct, implement a trait',
  instruction: `## Your task

The starter is a complete worked example: \`struct Person\`, its **inherent impl** (\`impl Person\` — the type's own methods, here a constructor), and its **trait impl** (\`impl Describe for Person\` — the promise that \`Person\` honors the contract). Your job is the same three blocks for a new type, typed with your own hands:

1. **Define \`struct Point\`** with two fields: \`x: i32\` and \`y: i32\`.
2. **Give it an inherent impl** with a constructor, so \`Point::new(3, 4)\` builds the point.
3. **Implement \`Describe\` for it**, so \`Point::new(3, 4).describe()\` returns exactly \`"(3, 4)"\`.

The two impl blocks are different statements on purpose: \`impl Point\` is where a type's own API lives; \`impl Describe for Point\` is the contract being honored. Production Rust types routinely carry both — which is why you write both.

### What's expected

\`\`\`rust
Person::new("Mariana").describe()  // "Mariana (person)" — the worked example, already passing
Point::new(3, 4).describe()        // "(3, 4)"
Point::new(-1, 12).describe()      // "(-1, 12)"
\`\`\``,
  starterCode: `trait Describe {
    fn describe(&self) -> String;
}

// Worked example — a complete type: struct + inherent impl + trait impl.
struct Person {
    name: String,
}

impl Person {
    fn new(name: &str) -> Person {
        Person { name: String::from(name) }
    }
}

impl Describe for Person {
    fn describe(&self) -> String {
        format!("{} (person)", self.name)
    }
}

// Your turn: the same three blocks for \`Point\` (fields x: i32, y: i32).

fn main() {
    println!("{}", Person::new("Mariana").describe());
    // once Point exists, try:
    // println!("{}", Point::new(3, 4).describe());
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("Point::new stores both coordinates for describe to use", || _eq(Point::new(3, 4).describe(), String::from("(3, 4)")));

_t("a different point describes itself, not the example", || _eq(Point::new(-1, 12).describe(), String::from("(-1, 12)")));

_t("the worked example still describes itself", || _eq(Person::new("Mariana").describe(), String::from("Mariana (person)")));
${RUST_HARNESS_FOOTER}`,
  hint: `All three blocks you need are already on screen with different names: the worked example is the skeleton — the struct, the inherent \`impl Type { ... }\`, the trait \`impl Trait for Type { ... }\`. Only the fields, the constructor's parameters, and the produced text change. For the text itself, \`format!\` does the assembling, and the expected output is the two fields with parentheses and a comma around them — the instruction's examples pin it exactly.`,
  solution: `trait Describe {
    fn describe(&self) -> String;
}

struct Person {
    name: String,
}

impl Person {
    fn new(name: &str) -> Person {
        Person { name: String::from(name) }
    }
}

impl Describe for Person {
    fn describe(&self) -> String {
        format!("{} (person)", self.name)
    }
}

struct Point {
    x: i32,
    y: i32,
}

impl Point {
    fn new(x: i32, y: i32) -> Point {
        Point { x, y }
    }
}

impl Describe for Point {
    fn describe(&self) -> String {
        format!("({}, {})", self.x, self.y)
    }
}

fn main() {
    println!("{}", Person::new("Mariana").describe());
    println!("{}", Point::new(3, 4).describe());
}
`,
  alternativeApproach: `Two derive experiments worth five minutes each, right here in this editor:

1. Add \`#[derive(Debug)]\` above your \`Point\`, print it with \`println!("{:?}", Point::new(3, 4))\`, and look at the output you didn't write. Then **delete the derive and run again** — the error that comes back is \`E0277\`, the trait-bound family from the predict: \`{:?}\` requires the \`Debug\` bound, and your type no longer satisfies it. A derive is a trait impl the compiler wrote; removing it un-implements the trait.
2. With the derive back in place, change \`{:?}\` to \`{}\`. It refuses — \`{}\` requires \`Display\`, and \`Display\` is **not derivable**. The standard library declines to guess what a user-facing rendering of your type should look like; that is a judgment call, so you write it. You already made exactly this call twice: \`Display\` by hand in Lesson 3, and \`describe\` here. \`{:?}\` is for developers and derivable; \`{}\` is for users and written.`,
}

const STEP_4_4 = {
  id: STEP_4_4_ID,
  lessonId: LESSON_4_ID,
  order: 4,
  type: 'kata' as const,
  title: 'A generic function with a bound',
  instruction: `## Your task

Write \`announce\`: a single generic function that takes a slice of values of **any type implementing \`Describe\`** and returns a \`Vec<String>\` holding one description per item, in order. An empty slice announces nothing — an empty \`Vec\`.

The starter already carries \`Describe\`, \`Person\`, and \`Point\` with their impls — kata 4.3's work, pre-written so this step stands alone. You write one function. The tests then call it with a slice of \`Person\` **and** a slice of \`Point\` — that second call is the lesson: one body in your source, and the compiler monomorphizes a specialized copy per concrete type. The read's inverse-of-erasure point, observable.

### What's expected

\`\`\`rust
announce(&team)    // &[Person] -> vec!["Mariana (person)", "Yui (person)"]
announce(&path)    // &[Point]  -> vec!["(0, 0)", "(3, 4)"]
announce(&nobody)  // empty     -> vec![]
\`\`\``,
  starterCode: `trait Describe {
    fn describe(&self) -> String;
}

struct Person {
    name: String,
}

impl Describe for Person {
    fn describe(&self) -> String {
        format!("{} (person)", self.name)
    }
}

struct Point {
    x: i32,
    y: i32,
}

impl Describe for Point {
    fn describe(&self) -> String {
        format!("({}, {})", self.x, self.y)
    }
}

// Your code: write \`announce\` here — generic, bounded, slice in, Vec<String> out.

fn main() {
    // once announce exists, try:
    // let team = vec![Person { name: String::from("Mariana") }];
    // println!("{:?}", announce(&team));
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("announces every person in a slice, in order", || {
    let team = vec![
        Person { name: String::from("Mariana") },
        Person { name: String::from("Yui") },
    ];
    _eq(announce(&team), vec![
        String::from("Mariana (person)"),
        String::from("Yui (person)"),
    ])
});

_t("the same function announces points — one source body, two compiled copies", || {
    let path = vec![Point { x: 0, y: 0 }, Point { x: 3, y: 4 }];
    _eq(announce(&path), vec![
        String::from("(0, 0)"),
        String::from("(3, 4)"),
    ])
});

_t("an empty slice announces nothing", || {
    let nobody: Vec<Person> = vec![];
    _eq(announce(&nobody), Vec::<String>::new())
});
${RUST_HARNESS_FOOTER}`,
  hint: `The signature is the kata: a type parameter constrained to the trait — the read's \`announce\` and the figure's first tab show the \`<T: Trait>\` shape on a different trait — and a parameter that is a borrowed slice of that type. The return type is in the instruction.

For the body: walk the slice, build a \`Vec<String>\` from what each item produces. The explicit loop-and-push and the \`.iter()\` / \`.map(...)\` / \`.collect()\` family both land the same place — write whichever your hands prefer; the alternative approach shows the other.`,
  solution: `trait Describe {
    fn describe(&self) -> String;
}

struct Person {
    name: String,
}

impl Describe for Person {
    fn describe(&self) -> String {
        format!("{} (person)", self.name)
    }
}

struct Point {
    x: i32,
    y: i32,
}

impl Describe for Point {
    fn describe(&self) -> String {
        format!("({}, {})", self.x, self.y)
    }
}

fn announce<T: Describe>(items: &[T]) -> Vec<String> {
    items.iter().map(|item| item.describe()).collect()
}

fn main() {}
`,
  alternativeApproach: `The explicit loop — same monomorphization, same result:

\`\`\`rust
fn announce<T: Describe>(items: &[T]) -> Vec<String> {
    let mut descriptions = Vec::new();
    for item in items {
        descriptions.push(item.describe());
    }
    descriptions
}
\`\`\`

Two notes. The bound also spells as a \`where\` clause — \`fn announce<T>(items: &[T]) -> Vec<String> where T: Describe\` — identical meaning, preferred when bounds pile up. And the \`dyn\` version (\`items: &[Box<dyn Describe>]\`) would type-check too — type-check, not pass: these tests hand over plain \`&[Person]\` and \`&[Point]\` slices, which that signature refuses until every item is boxed first. It would pay a heap allocation per item and a vtable call per \`describe\` to buy heterogeneity these tests never ask for. Both slices here are homogeneous — the generic is the right tool, which is exactly what read 4.1's decision tree was selling.`,
}

const LESSON_4 = {
  id: LESSON_4_ID,
  scrollId: COURSE_ID,
  order: 5,
  title: 'Traits and generics: interfaces with a twist',
}

// =============================================================================
// Lesson 5 — Enums, Option, and exhaustive match
// =============================================================================
//
// 4 steps (read + predict + 2 kata). Delta-framed: enums anchored to TS
// discriminated unions and Java sealed types; Option to the null-handling
// every persona already does, made compiler-checked. Pairing clause: read 5.1
// carries the E0004 headline line ONLY; predict 5.2 owns the full reveal.
// Kata 5.3 (G2) has the learner define an enum + an exhaustive match with NO
// `_` arm (honor-system, refactor-safety reason attached); kata 5.4 writes
// first_even returning Option<i32>. The 5.2 E0004 and 5.1 E0004-headline
// excerpts are the verbatim Piston 1.68.2 capture (2026-06-12).

const STEP_5_1 = {
  id: STEP_5_1_ID,
  lessonId: LESSON_5_ID,
  order: 1,
  type: 'read' as const,
  title: 'Enums you already know, a match that refuses to forget',
  instruction: `## Why this matters

You have modeled "one of several known shapes" in every codebase you ship: discriminated unions in TypeScript — \`{ kind: "circle", radius: number } | { kind: "square", side: number }\` — sealed classes switched over exhaustively in Java — except here it is not opt-in: every \`match\` on every enum is checked, statements included, no sealed hierarchy or switch-expression required. Rust's \`enum\` is that concept as a first-class type. And if "enum" still means a list of named constants to you (C, older Java), widen it one notch: **each variant can carry its own data**. The twist this lesson sells is not the type — it is the \`match\`: exhaustive by construction, where a missing case is a compile error instead of a runtime surprise.

## \`Option<T>\`: the null check, compiler-enforced

Rust has no null. "Might be absent" is itself an enum — \`Option<T>\` is \`Some(value)\` or \`None\` — and the value is unreachable except by going through both possibilities. This is the null-handling you already do in every language, minus the version where you forgot. The \`match\` you wrote on \`Result\` in Lesson 3 was this exact machinery: \`Result\` and \`Option\` are both plain enums whose variants carry data.

\`\`\`rust
fn describe_port(port: Option<u16>) -> String {
    match port {
        Some(p) => format!("listening on {}", p),
        None => String::from("no port configured"),
    }
}
\`\`\`

## \`if let\`, and the everyday methods

When only one arm matters, a full \`match\` is ceremony — \`if let\` destructures a single pattern and ignores the rest. \`Option\` also ships combinators you will read daily: \`unwrap_or\` (the value or a default), \`map\` (transform the inside, if any), \`and_then\` (chain a step that may itself produce \`None\`). Named here so you can read them in the wild; the katas only need \`match\` and \`if let\`.

\`\`\`rust
fn main() {
    let port: Option<u16> = Some(8080);
    if let Some(p) = port {
        println!("explicit: {}", p);
    }
    println!("effective: {}", port.unwrap_or(3000));
}
\`\`\`

## Exhaustiveness is a refactor tool

Here is the sell, and it lands hardest if you have ever maintained a \`switch\` over a growing union: **add a variant, and the compiler lists every \`match\` that must now make a decision** — file, line, missing pattern. A \`match\` is not checked against the cases you remembered; it is checked against the *type*. That turns an enum's matches into a compiler-maintained TODO list — the property the next kata will forbid you to trade away.

So: three variants, two arms. Does this compile — and what exactly does the compiler refuse to let slide?

\`\`\`rust
enum Status { Active, Idle, Banned }

fn main() {
    let status = Status::Idle;
    match status {
        Status::Active => println!("running drills"),
        Status::Idle => println!("waiting for a kata"),
    }
}
\`\`\`

\`rustc\`'s answer starts like this:

\`\`\`text
error[E0004]: non-exhaustive patterns: \`Status::Banned\` not covered
\`\`\``,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

// The E0004 walk — appended to every option's feedback at seed (per the lesson
// file's reveal section), so each answer path sees it. Output is the verbatim
// Piston 1.68.2 capture (2026-06-12).
const E0004_REVEAL = `Here is the full output:

\`\`\`text
error[E0004]: non-exhaustive patterns: \`Status::Banned\` not covered
 --> main.rs:4:11
  |
4 |     match status {
  |           ^^^^^^ pattern \`Status::Banned\` not covered
  |
note: \`Status\` defined here
 --> main.rs:1:29
  |
1 | enum Status { Active, Idle, Banned }
  |      ------                 ^^^^^^ not covered
  = note: the matched value is of type \`Status\`
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown
  |
6 ~         Status::Idle => String::from("waiting for a kata"),
7 ~         Status::Banned => todo!(),
  |

error: aborting due to previous error

For more information about this error, try \`rustc --explain E0004\`.
\`\`\`

Line by line:

- \`\`error[E0004]: non-exhaustive patterns: \`Status::Banned\` not covered\`\` — the headline names the exact missing pattern. Not "something's missing": *which* variant, by name.
- The span under \`match status\` marks the match being judged; the \`\`note: \`Status\` defined here\`\` span points **into your enum definition** and underlines the uncovered variant. The error reads in both directions — from the match to the type and back.
- The \`help:\` writes the fix arm for you, \`todo!()\` body included — paste it and the program compiles (and panics honestly at runtime until you decide what \`Banned\` means).
- The same \`help:\` offers a second exit: a wildcard. Take \`_\` and this error never fires again *for this match* — including the day a fourth variant lands and this match silently mishandles it. That is the refactor-safety trade the read named: \`_\` sells it back.

This is exhaustiveness as a design tool, demonstrated: add a variant to a production enum and the build fails at every \`match\` that now needs a decision — file, line, missing pattern. The compiler turned a grep-and-pray refactor into a checklist. The next kata has you write the full exhaustive form with your own hands; the wildcard is off the table there for exactly this reason.`

const STEP_5_2 = {
  id: STEP_5_2_ID,
  lessonId: LESSON_5_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: does this compile?',
  instruction: `The read ended on this match. Here it is again, one notch more honest — the match is now an expression whose value gets used. Commit to an answer before you reveal.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'Does this compile — and if not, what does rustc say?',
    snippet: `enum Status { Active, Idle, Banned }

fn announce(status: Status) -> String {
    match status {
        Status::Active => String::from("running drills"),
        Status::Idle => String::from("waiting for a kata"),
    }
}

fn main() {
    println!("{}", announce(Status::Idle));
}`,
    options: [
      {
        id: 'a',
        text: 'Fails to compile — but only because this match is used as an expression; as a statement it would compile',
      },
      { id: 'b', text: 'Compiles, with a warning that \`Banned\` is not covered' },
      {
        id: 'c',
        text: 'Fails to compile — \`E0004\`: the match misses a variant the type can produce',
      },
      {
        id: 'd',
        text: 'Fails to compile — but because the enum is missing a default variant, which Rust enums require',
      },
    ],
    correct: 'c',
    feedback: {
      a: `A near-miss built from the read's own emphasis — and a model worth correcting now. Yes, this \`match\` is an expression whose \`String\` the function must produce; no, that is not what trips the error. Exhaustiveness is checked on **every** \`match\`, expression or statement alike: rewrite this as a bare \`match status { ... }\` statement with \`println!\` arms and the same \`E0004\` fires. The error doesn't care where the match sits — it cares that the arms don't cover the type. The real output is below.\n\n${E0004_REVEAL}`,
      b: `The lint-vs-gate misread. Plenty of ecosystems treat missing cases as advisory — TS only catches a non-exhaustive union switch if you wired a \`never\`-typed check yourself; linters flag a missing \`default\` and you ship anyway. In Rust, exhaustiveness is the type system, not a style opinion: \`E0004\` is a hard error, the same severity as a type mismatch. Nothing ships until the match covers the type. The real output is below.\n\n${E0004_REVEAL}`,
      c: `Correct — and the output is worth more than the verdict: it names the missing pattern, points into your enum definition, and writes the fix arm for you. Walk it below.\n\n${E0004_REVEAL}`,
      d: `The misread that puts exhaustiveness on the wrong artifact. The enum owes you nothing — it just declares what can exist. Covering it is each **match**'s job, and \`_\` is the per-match opt-out (which the next kata forbids, on purpose). There is no "default variant" concept in Rust, and adding a \`Banned\`-shaped catch-all variant to satisfy an imagined rule would corrupt the type to appease a misreading of the error. The real output is below.\n\n${E0004_REVEAL}`,
    },
  },
}

const STEP_5_3 = {
  id: STEP_5_3_ID,
  lessonId: LESSON_5_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Define an enum, match every shape',
  instruction: `## Your task

Two definitions, written with your own hands:

1. **Define \`enum Shape\`** with three data-carrying variants: \`Circle(f64)\` (the radius), \`Square(f64)\` (the side), and \`Rect(f64, f64)\` (width, height).
2. **Write \`fn area(s: &Shape) -> f64\`** with one \`match\` covering all three variants. Circle area is π·r² — std ships π as \`std::f64::consts::PI\` — square is side², rectangle is width·height.

**No \`_\` arm.** A wildcard would pass these tests — and it would sell back the one property the predict just demonstrated: with three explicit arms, adding a \`Triangle\` variant next month makes the compiler list this \`match\` as needing a decision; with a \`_\`, it silently computes nonsense instead. The tests can't see your match arms, so this rule is on your honor — like 3.2's no-\`match\` rule, the point is the gesture your hands learn, not outsmarting the suite.

\`area\` won't compile until the enum exists — write the two definitions together.

### What's expected

\`\`\`rust
area(&Shape::Circle(3.0))     // PI * 9.0
area(&Shape::Square(2.5))     // 6.25
area(&Shape::Rect(3.0, 4.5))  // 13.5
\`\`\``,
  starterCode: `// 1. Define \`enum Shape\` here: Circle(f64), Square(f64), Rect(f64, f64).

// 2. Write \`fn area(s: &Shape) -> f64\` here: one match, three arms, no wildcard.

fn main() {
    // once both exist, try:
    // println!("{}", area(&Shape::Square(2.0)));
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("a circle's area is pi times radius squared", || _eq_close(area(&Shape::Circle(3.0)), std::f64::consts::PI * 9.0));

_t("a square's area is its side squared", || _eq_close(area(&Shape::Square(2.5)), 6.25));

_t("a rectangle's area is width times height, not either squared", || _eq_close(area(&Shape::Rect(3.0, 4.5)), 13.5));
${RUST_HARNESS_FOOTER}`,
  hint: `A match arm on a data-carrying variant destructures the payload into a name you choose: \`Shape::Circle(radius) => ...\` — the pattern on the left, the binding usable on the right. Three variants, three patterns of that shape; the rectangle's pattern binds two names. The arithmetic is yours. The compiler's only demand is that the three patterns together leave nothing uncovered — and if you mistype one, the error that comes back is the predict's \`E0004\`, now working for you.`,
  solution: `enum Shape {
    Circle(f64),
    Square(f64),
    Rect(f64, f64),
}

fn area(s: &Shape) -> f64 {
    match s {
        Shape::Circle(radius) => std::f64::consts::PI * radius * radius,
        Shape::Square(side) => side * side,
        Shape::Rect(width, height) => width * height,
    }
}

fn main() {
    println!("{}", area(&Shape::Square(2.0)));
}
`,
  alternativeApproach: null,
}

const STEP_5_4 = {
  id: STEP_5_4_ID,
  lessonId: LESSON_5_ID,
  order: 4,
  type: 'kata' as const,
  title: 'Return the first even number, if any',
  instruction: `## Your task

Write \`first_even\`: it takes a slice of \`i32\` and returns the **first** even number as an \`Option<i32>\` — \`Some(n)\` when one exists, \`None\` when none does, including for the empty slice.

\`Option\` is the return type doing honest work here: the no-result case is in the signature, and every caller is forced to deal with it — no sentinel \`-1\`, no null, no exception. This is the shape std itself uses everywhere a search can come up empty.

Two implementations count as idiomatic: the explicit loop that returns early, and the iterator one-liner. Write whichever your hands prefer — the alternative approach shows the other after you pass.

### What's expected

\`\`\`rust
first_even(&[1, 2, 3])     // Some(2)
first_even(&[1, 3, 5])     // None
first_even(&[])            // None
first_even(&[7, 4, 8, 2])  // Some(4) — the first, not the largest or last
\`\`\``,
  starterCode: `fn first_even(v: &[i32]) -> Option<i32> {
    // your code
    todo!()
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("returns the first even number when one exists", || _eq(first_even(&[1, 2, 3]), Some(2)));

_t("returns None when no number is even", || _eq(first_even(&[1, 3, 5]), None));

_t("returns None for an empty slice", || _eq(first_even(&[]), None));

_t("returns the first even number, not the largest or the last", || _eq(first_even(&[7, 4, 8, 2]), Some(4)));
${RUST_HARNESS_FOOTER}`,
  hint: `Even means \`n % 2 == 0\`. If you're looping: the moment you see an even number you already know the whole answer — return it wrapped in its variant, and let the code after the loop be the other variant. If you'd rather not loop: the iterator family has a method for "the first element satisfying a predicate" — \`find\` — and it already returns an \`Option\`. Mind what it hands your closure when you iterate a slice of \`i32\`; the compiler will tell you if you ignore it.`,
  solution: `fn first_even(v: &[i32]) -> Option<i32> {
    v.iter().copied().find(|n| n % 2 == 0)
}
`,
  alternativeApproach: `The explicit loop — same semantics, the early return doing \`find\`'s job:

\`\`\`rust
fn first_even(v: &[i32]) -> Option<i32> {
    for &n in v {
        if n % 2 == 0 {
            return Some(n);
        }
    }
    None
}
\`\`\`

If you wrote the loop: the one-liner's \`.copied()\` adapter does what your \`&n\` pattern does — turns the slice's \`&i32\` items into \`i32\` values (without it, \`find\`'s closure receives a reference to a reference and the types complain). If you wrote the one-liner: the loop is not the beginner version — it is roughly what the iterator compiles down to, and production Rust reaches for it whenever the predicate grows past one line. *Using* iterators is this scroll's scope; *implementing* the \`Iterator\` trait is \`rust-iterators-deep\`'s.`,
}

const LESSON_5 = {
  id: LESSON_5_ID,
  scrollId: COURSE_ID,
  order: 6,
  title: 'Enums, Option, and exhaustive match',
}

// =============================================================================
// Lesson 6 — Integration: the capstone
// =============================================================================
//
// 2 steps (read + challenge). The read 6.1 is the deferral map: a one-paragraph
// recap ending in a compiling miniature (the capstone's shape — &str + .lines()
// + ? + match), then the eight sanctioned omissions with owning deep-dive slugs,
// then the forward prompt naming Lessons 2-5. No figure (none committed for L6),
// no quoted rustc output (the capstone is integration, not a new error). The
// challenge 6.2 (capstone "Log triage") is the scroll's last step: ONE hint
// (challenge rules, README §5.3), todo!()-stubbed starter so the scaffold
// compiles, and a self-contained referenceSolution — Summary + LogError ship in
// the starter (the tests construct/match them) and the solution re-declares them
// so it runs standalone against testCode (the kata-4.4 pattern). No rustc error
// excerpts captured: the deferral map is prose and the capstone is pass/fail.

const STEP_6_1 = {
  id: STEP_6_1_ID,
  lessonId: LESSON_6_ID,
  order: 1,
  type: 'read' as const,
  title: 'What you can now read — and what we deliberately didn\'t teach',
  instruction: `## What you can now read

Two hours ago, \`let s2 = s1\` ended your program. Here is what you now read without slowing down: ownership and borrowing decide every signature you meet — you know why this scroll's functions took \`&str\`, and what \`E0382\` is asking when a move goes wrong. Errors are values: \`Result<T, E>\`, \`?\` propagation, a hand-written error enum with \`Display\` and \`From\`. Behavior lives in traits, statically dispatched until heterogeneity forces \`Box<dyn Trait>\`. Every \`match\` on an enum is exhaustive, because the compiler refuses anything less. That is most of the first real Rust file you will open. Here it is as one compiling function — \`str::lines\` is std's iterator over a string's lines, and \`Option::ok_or\` is the std bridge from \`Option\` to \`Result\`, the same method family as Lesson 5's \`unwrap_or\`:

\`\`\`rust
fn head_level(log: &str) -> Result<&str, String> {
    let line = log.lines().next().ok_or(String::from("empty log"))?;
    match line.split_whitespace().next() {
        Some(token) => Ok(token),
        None => Err(String::from("blank first line")),
    }
}

fn main() {
    println!("{:?}", head_level("WARN disk usage at 91%\\nINFO all clear"));
}
\`\`\`

## What we deliberately didn't teach

Eight omissions, all deliberate. One sentence each: how it bites, and which deep-dive owns it.

- **\`unsafe\`** — for soundness you can prove and the compiler can't, never for borrows you'd rather not think about; the proof discipline is \`rust-unsafe-and-ffi\`.
- **Lifetime annotations at depth** — you can recognize \`'a\` since Lesson 2; learned under deadline pressure, it gets sprayed everywhere because one signature needed it — \`rust-lifetimes-and-borrowing-deep\`.
- **Async, \`tokio\`, \`Pin\`** — async without a runtime is confusingly-written sync code, and this sandbox cannot host a runtime; \`rust-async-with-tokio\`.
- **\`Rc<RefCell<T>>\`** — the poor-man's-GC reflex, and usually a data-model smell the arena pattern dissolves; covered alongside lifetimes in \`rust-lifetimes-and-borrowing-deep\`.
- **Trait objects beyond \`Box<dyn Trait>\` literacy** — reaching for \`dyn\` because "interface" maps to it linguistically buys a vtable and an allocation you didn't price; \`rust-traits-deep\`.
- **Macros** — \`macro_rules!\` where a plain function would do, and proc macros cannot even build in this sandbox; \`rust-macros-declarative-and-procedural\`.
- **Implementing \`Iterator\`** — this scroll *used* \`.iter()\`, \`.find()\`, \`.collect()\`; writing index loops because the trait felt advanced is the failure mode \`rust-iterators-deep\` exists to remove.
- **Real testing** — the \`_t\` harness here is a sandbox workaround; actual Rust tests are \`#[test]\` functions run by \`cargo test\`, and \`rust-testing-deep\` owns that story.

## The last step

What remains is one function a working developer would actually write. It needs Lesson 2's borrowed parsing, Lesson 3's error model, Lesson 4's trait gesture, and Lesson 5's exhaustive match — at the same time, in the same file. That's the point.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_6_2 = {
  id: STEP_6_2_ID,
  lessonId: LESSON_6_ID,
  order: 2,
  type: 'challenge' as const,
  title: 'Capstone: log triage — parse, classify, summarize',
  instruction: `**Budget: ~25 minutes — twice a kata. Not a gate:** skipping it costs you nothing downstream. But this is the scroll's promise made checkable, and failing it is useful data — it names the lesson to go re-run. The routing is at the end of this brief.

You run a service. It logs lines like this — a level token first, the message after:

\`\`\`text
INFO server started
WARN disk usage at 91%
ERROR disk full
\`\`\`

Write \`fn summarize(log: &str) -> Result<Summary, LogError>\`:

- Count the \`INFO\`, \`WARN\`, and \`ERROR\` lines into a \`Summary\`.
- A line's level is its **first token**. Blank lines — no tokens at all — are skipped, not counted.
- The first unrecognized level token aborts the triage: \`Err(LogError::UnknownLevel(token.to_string()))\`.
- An input with no non-blank lines is \`Err(LogError::Empty)\` — an all-zero summary would be a lie.
- \`Summary\` displays as \`2 info, 1 warn, 1 error\`: counts in that order, labels singular no matter the count.

\`Summary\` and \`LogError\` are pinned in the starter — the tests construct and match them, so their shape isn't yours to choose. Everything else is yours. Define \`Level\` yourself: three variants, no payload.

This is Lessons 2 through 5 in one file, by name:

- **Lesson 2 — borrowed parsing.** \`summarize\` takes \`&str\`; lines and tokens stay borrowed all the way down. Turning a line into its first token is the \`first_word\` gesture you already wrote in kata 2.3. \`str::lines\` exists in std — 6.1's sample used it — and looking up its exact shape, and its neighbors', is allowed at challenge level.
- **Lesson 3 — errors as values.** A custom error enum and \`?\` doing the propagation: kata 3.3's shape. A small fallible function that turns one token into a \`Level\` keeps \`summarize\` honest — \`?\` is built for exactly that seam.
- **Lesson 4 — the trait gesture.** \`impl Display for Summary\`, like kata 4.3's \`Describe\` — against std's trait this time.
- **Lesson 5 — your enum, matched exhaustively.** Every \`match\` on \`Level\` covers all three variants. No \`_\` arm on \`Level\`.

One precision before your Lesson 5 reflex files a complaint: exhaustiveness is the **enum** match's contract. The match that classifies a token is a match on \`&str\`, and strings aren't enumerable — that match needs its catch-all arm. That arm also holds the solution's one allocation: the token is borrowed from \`log\`, and an error that borrows from the input would drag a lifetime parameter into \`LogError\` — owning the offending token with \`.to_string()\` is the honest copy. It is the only allocation you need.

If you stall, the stall is information. Can't get from a line to its borrowed token: Lesson 2. Tangled in the error plumbing: Lesson 3. \`Display\` won't compile: Lesson 4. The compiler complains about your \`match\`: Lesson 5. Go close the gap, then come back.`,
  starterCode: `#[derive(Debug, PartialEq)]
struct Summary {
    infos: usize,
    warns: usize,
    errors: usize,
}

#[derive(Debug, PartialEq)]
enum LogError {
    Empty,
    UnknownLevel(String),
}

// Your Level enum goes here: three variants, no payload.

impl std::fmt::Display for Summary {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        todo!()
    }
}

fn summarize(log: &str) -> Result<Summary, LogError> {
    todo!()
}

fn main() {
    let log = "INFO server started\\nWARN disk usage at 91%\\nERROR disk full";
    match summarize(log) {
        Ok(summary) => println!("{}", summary),
        Err(problem) => println!("triage failed: {:?}", problem),
    }
}
`,
  testCode: `${RUST_HARNESS_HEADER}
_t("counts every level across a mixed log, skipping blank lines", || {
    let log = "INFO server started\\n\\nWARN disk usage at 91%\\nINFO request served\\n\\nERROR disk full";
    _eq(summarize(log), Ok(Summary { infos: 2, warns: 1, errors: 1 }))
});

_t("an unknown level token is an error carrying that token", || {
    let log = "INFO ok\\nTRACE deep in the weeds";
    _eq(summarize(log), Err(LogError::UnknownLevel(String::from("TRACE"))))
});

_t("empty input is an error, not a zero summary", || _eq(summarize(""), Err(LogError::Empty)));

_t("input with only blank lines is just as empty", || _eq(summarize("\\n\\n"), Err(LogError::Empty)));

_t("a summary displays as '2 info, 1 warn, 1 error'", || {
    let summary = Summary { infos: 2, warns: 1, errors: 1 };
    _eq(format!("{}", summary), String::from("2 info, 1 warn, 1 error"))
});
${RUST_HARNESS_FOOTER}`,
  hint: `Three sub-problems: split the input into candidate lines, turn a line's first token into a \`Level\` (one fallible function — \`?\` is your friend), and accumulate counts. Solve them in that order.`,
  solution: `#[derive(Debug, PartialEq)]
struct Summary {
    infos: usize,
    warns: usize,
    errors: usize,
}

#[derive(Debug, PartialEq)]
enum LogError {
    Empty,
    UnknownLevel(String),
}

enum Level {
    Info,
    Warn,
    Error,
}

fn parse_level(token: &str) -> Result<Level, LogError> {
    match token {
        "INFO" => Ok(Level::Info),
        "WARN" => Ok(Level::Warn),
        "ERROR" => Ok(Level::Error),
        unknown => Err(LogError::UnknownLevel(unknown.to_string())),
    }
}

fn summarize(log: &str) -> Result<Summary, LogError> {
    let mut summary = Summary { infos: 0, warns: 0, errors: 0 };
    let mut saw_line = false;
    for line in log.lines() {
        let token = match line.split_whitespace().next() {
            Some(token) => token,
            None => continue,
        };
        saw_line = true;
        match parse_level(token)? {
            Level::Info => summary.infos += 1,
            Level::Warn => summary.warns += 1,
            Level::Error => summary.errors += 1,
        }
    }
    if saw_line {
        Ok(summary)
    } else {
        Err(LogError::Empty)
    }
}

impl std::fmt::Display for Summary {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} info, {} warn, {} error", self.infos, self.warns, self.errors)
    }
}

fn main() {
    let log = "INFO server started\\n\\nWARN disk usage at 91%\\nINFO request served\\n\\nERROR disk full";
    match summarize(log) {
        Ok(summary) => println!("{}", summary),
        Err(problem) => println!("triage failed: {:?}", problem),
    }
}
`,
  alternativeApproach: null,
}

const LESSON_6 = {
  id: LESSON_6_ID,
  scrollId: COURSE_ID,
  order: 7,
  title: 'Integration: the capstone',
}

export const RUST_LESSONS = [LESSON_0, LESSON_1, LESSON_2, LESSON_3, LESSON_4, LESSON_5, LESSON_6]

export const RUST_STEPS = [
  STEP_0_1, STEP_0_2,
  STEP_1_1, STEP_1_2, STEP_1_3, STEP_1_4, STEP_1_5,
  STEP_2_1, STEP_2_2, STEP_2_3, STEP_2_4, STEP_2_5,
  STEP_3_1, STEP_3_2, STEP_3_3,
  STEP_4_1, STEP_4_2, STEP_4_3, STEP_4_4,
  STEP_5_1, STEP_5_2, STEP_5_3, STEP_5_4,
  STEP_6_1, STEP_6_2,
]
