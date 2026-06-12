// =============================================================================
// Rust — scroll seed, batch 1 of 4 (Lessons 0-1). The dojo's Rust crash
// course for polyglot developers.
//
// Direction: ADR 022 (crash-course pivot); spec promoted to canon S028 W1
// (docs/courses/curricula/rust.md + rust/rust.md). Polyglot-first order:
//   order 1 — Lesson 0 (Rust in context) — 2 steps (read, predict)
//   order 2 — Lesson 1 (Ownership)       — 5 steps (read, predict, 2 kata, playground)
// This batch: 7 steps. Full scroll: 25 steps / ~120 min target.
// Lessons 2-6 seed in later batches. The Lesson 1 real-Piston smoke ran
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

const STEP_0_1_ID = seedUuid('rust-s0-1-context-and-toolchain')
const STEP_0_2_ID = seedUuid('rust-s0-2-predict-first-command')

const STEP_1_1_ID = seedUuid('rust-s1-1-ownership')
const STEP_1_2_ID = seedUuid('rust-s1-2-predict-does-this-compile')
const STEP_1_3_ID = seedUuid('rust-s1-3-kata-fix-the-move')
const STEP_1_4_ID = seedUuid('rust-s1-4-kata-take-and-give-back')
const STEP_1_5_ID = seedUuid('rust-s1-5-playground-function-boundaries')

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

export const RUST_LESSONS = [LESSON_0, LESSON_1]

export const RUST_STEPS = [
  STEP_0_1, STEP_0_2,
  STEP_1_1, STEP_1_2, STEP_1_3, STEP_1_4, STEP_1_5,
]
