// =============================================================================
// Rust — scroll seed, batches 1-2 of 4 (Lessons 0-3). The dojo's Rust crash
// course for polyglot developers.
//
// Direction: ADR 022 (crash-course pivot); spec promoted to canon S028 W1
// (docs/courses/curricula/rust.md + rust/rust.md). Polyglot-first order:
//   order 1 — Lesson 0 (Rust in context)   — 2 steps (read, predict)
//   order 2 — Lesson 1 (Ownership)          — 5 steps (read, predict, 2 kata, playground)
//   order 3 — Lesson 2 (Borrowing)          — 5 steps (read, predict, kata, read+inline, kata)
//   order 4 — Lesson 3 (Result, ?, errors)  — 3 steps (read, 2 kata)
// These batches: 15 steps total seeded. Full scroll: 25 steps / ~120 min target.
// Lessons 4-6 seed in later batches. The batch-2 quoted rustc excerpts
// (2.2 E0499, 2.4 fresh E0499 + E0502, 3.1 E0277) are pasted verbatim from
// the live Piston rustc 1.68.2 capture (2026-06-12).
// The Lesson 1 real-Piston smoke ran
// 2026-06-12 against rustc 1.68.2: compile-errors-as-feedback validated
// (rustc stderr surfaces through ExecuteStep; Piston noise scrubbed by the
// adapter), entry-point handled via the fn-main rename, and the quoted
// excerpts below are pasted verbatim from that capture.
// Authoring drafts live in docs/courses/curricula/rust/lesson-{0..6}.md;
// figures registered in apps/web/src/scrolls/figures/data/rust-figures.ts.
//
// Status: draft. isPublic: false. Rust execution requires auth (like Ruby) —
// the /scrolls/execute endpoint (apps/api/src/infrastructure/http/routes/
// scrolls.ts) only allows anonymous calls for sql/typescript/python/
// javascript-dom; rust is NOT in that whitelist.
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
        for (name, passed, message) in results.iter() {
            if *passed {
                println!("\u{2713} {}", name);
            } else {
                println!("\u{2717} {}: {}", name, message);
            }
        }
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
  status: 'draft' as const,
  isPublic: false,
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
  instruction: `## Why this matters

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
  hint: `Two sub-problems: find where the first word ends, then hand back that piece of the input.

- For the search, \`str\` has a whole family of position-finding methods — \`str::find\` is the direct one, \`char_indices\` the manual one. Either tells you the byte index of the first space, if any.
- For the hand-back, slice syntax \`&s[..i]\` is the shape: a borrowed view of \`s\` from the start up to index \`i\`. No new \`String\` anywhere — the return value points into the caller's data, which is exactly why the signature says \`&str\`.

What should happen when the search finds nothing? That case is the second test.`,
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
  hint: `The compiler marked three places:

\`\`\`text
  |              ------ first mutable borrow occurs here
  |              ^^^^^^ second mutable borrow occurs here
  |     ---------------- first borrow later used here
\`\`\`

Translation: \`receiver\` is still alive when \`auditor\` is created — because Rust keeps a borrow alive until its **last use**, and \`receiver\`'s last use (\`receiver.push(8)\`) sits *after* \`auditor\`'s first. So ask the question the spans are asking: when does a binding's borrow end? Re-order the work so one writer is finished before the next begins — the final contents don't depend on the order, which is why both fix shapes pass the same tests.`,
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

export const RUST_LESSONS = [LESSON_0, LESSON_1, LESSON_2, LESSON_3]

export const RUST_STEPS = [
  STEP_0_1, STEP_0_2,
  STEP_1_1, STEP_1_2, STEP_1_3, STEP_1_4, STEP_1_5,
  STEP_2_1, STEP_2_2, STEP_2_3, STEP_2_4, STEP_2_5,
  STEP_3_1, STEP_3_2, STEP_3_3,
]
