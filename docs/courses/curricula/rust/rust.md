# Rust — Authoring Spec

> Executable authoring brief for the `rust` scroll — the dojo's Rust crash course.
> Inherits the Rust Course Authoring Profile from [`../rust.md`](../rust.md) §2. Template: [`../../authoring-spec-template.md`](../../authoring-spec-template.md). Framework: [`../../README.md`](../../README.md). Direction: [ADR 022](../../../adr/022-crash-course-pivot.md) + Sprint 028 decisions ([`../../../sprints/current.md`](../../../sprints/current.md)).
>
> **Re-scoped 2026-06-07** (polyglot-first, superseding the pre-pivot 7-course / ~118-step design). **Promoted to canon 2026-06-11 under Sprint 028 W1** with three structural changes vs the S026 scratch draft: (1) the Rust-scoped **format exception** baked in (one mental model from scratch, heavier predict ratio, fail-by-design central); (2) **capstone + production-gesture audit** at outline per README §5.3 / §4.4; (3) sandbox truth corrected to **Piston Rust 1.68.2** (the draft assumed 1.75+ — see §7).

## Header

```yaml
slug: rust
title: "Rust"
kind: language-scroll
language: rust
sandbox: piston                    # Rust 1.68.2, rustc + run, single file, std-only
prereqs: []
audience: "polyglot developer who already programs in another language"
learner_time: "~120 minutes (60-120 range, at the ceiling)"
status: outline-canon              # outline + capstone + gesture audit done; prose W2, seed W3
maintainers:
  - S8 Björn Lindqvist             # language pedagogy (compiler-as-tutor, format-exception scope)
  - S5 Elif Yıldız                 # curriculum architecture
  - S2 Valentina Cruz              # content quality
  - S11 Maya Lindqvist             # predict / playground / read+inline review
primary_audience:
  - A1 Mariana Vargas              # JS senior
  - A3 Yui Tanaka                  # Java senior
  - A4 Felipe Reyes                # TS modernizer
secondary_audience:
  - A2 Esteban Morales             # Python mid-senior
```

---

## 1. Learning Outcomes

After finishing this scroll, the learner can…

- Locate Rust on their internal language map: what it's for, what `rustup` / `cargo` / `crates.io` do, why the compiler is the primary feedback channel, what version family to learn (and what the sandbox's 1.68.2 excludes). Predict the first command to run on a cloned Rust project.
- **Read compiler errors confidently — the load-bearing outcome; everything else is downstream.** Recognise the shape of `E0382` (move after use), `E0499` (second mutable borrow), `E0502` (mutable + immutable conflict), `E0277` in its `?`-operator form, `E0004` (non-exhaustive patterns). Predict which error a snippet produces before running it. Read and apply `help:` suggestions. Know `rustc --explain <code>` as a habit.
- Reason about ownership: predict whether a value is moved, borrowed, or copied at a function boundary; explain why `String` is not `Copy` and `i32` is; restructure a use-after-move without reflexive `.clone()`.
- Read and write borrowing: `&T`, `&mut T`, the aliasing-XOR-mutation rule. Write functions that take `&str` and return borrowed slices. Recognise the lifetime annotation `'a` when elision can't infer it (lifetimes-lite: recognizable, never written from scratch in this scroll).
- Use `Result<T, E>` as the default fallible return type; propagate with `?`; hand-write a custom error enum with `Display` and `From` (sandbox-honest: `thiserror`/`anyhow` named-and-deferred); treat `unwrap`/`expect` as invariant assertions.
- Define a struct with an `impl` block, define a trait, implement it, and consume it generically. Choose between `<T: Trait>`, `impl Trait`, and `Box<dyn Trait>` by dispatch need.
- Define an enum and `match` exhaustively on it; use `Option<T>` over null and `if let` for one-arm matches; predict why a non-exhaustive match fails to compile.
- **Beat the capstone** (§4 Lesson 6): one small real deliverable integrating Lessons 2, 3, 4, 5.
- Name the deferred footguns (`unsafe`, lifetimes at depth, async, macros, `Rc<RefCell<T>>`, trait objects, implementing `Iterator`) and which deep-dive owns each.

Each outcome maps to at least one kata, `predict`, playground, or challenge step in §4. Outcomes without a step are aspirational and must be cut or backed by a step.

---

## 2. Sub-course Authoring Notes

Inherits the Rust Course Authoring Profile ([`../rust.md`](../rust.md) §2) without structural deviation. Explicit local gates:

### 2.1 The borrow-check test — gate for every `read` step

Before any `read` paragraph ships, it passes:

> *Every paragraph that explains a Rust concept must end with a code sample that COMPILES — or a code sample with a deliberate compiler error whose message IS the lesson. If the paragraph doesn't terminate in a green check or a quoted `rustc` message, it is tour-guide prose: cut or restructure.*

This is the Rust equivalent of Ruby's paragraph test and Python's Pythonic test, stricter than both because Rust's prose is in dialogue with the compiler. *"Rust uses move semantics: assignment invalidates the original binding"* and stopping is Wikipedia. The same paragraph ending in `let s2 = s1; println!("{}", s1);` plus the quoted `E0382` output has done the actual teaching. Two sample flavours:

- **Compiling sample** — copy into a fresh `main`, it compiles and runs under **rustc 1.68.2**. If it doesn't, the prose is lying.
- **Deliberately-non-compiling sample** — followed by the actual `rustc` output (or its load-bearing 3-line excerpt with the error code), captured from the sandbox's 1.68.2 at smoke. Never paraphrased, never invented.

### 2.2 The format-exception gate (Rust-scoped — the new gate this scroll adds)

Sprint 028 granted Rust one exception: the scroll teaches **exactly one mental model from scratch — ownership → borrowing → lifetimes-lite**. Two enforcement rules keep the exception from leaking:

1. **The delta rule.** Any paragraph teaching a concept *outside* ownership/borrowing/lifetimes-lite must be framed as a delta from something the primary personas already hold (traits ≈ interfaces with a twist; enums ≈ discriminated unions / sealed types; `match` ≈ switch-with-teeth; `Option` ≈ the null-handling they already do, made compiler-checked). A from-scratch explanation of traits or enums is out of contract: rewrite as delta or cut. Go and TS do not inherit this exception — authors citing this spec as precedent for other scrolls get pointed at the S028 decision.
2. **The error-anchor rule.** Every ownership, borrowing, or lifetime explanation must show **the `rustc` error it prevents** — quoted, with its code. From-scratch teaching is licensed only because the compiler co-authors it; an ownership paragraph with no error anchor is the memorize-three-rules pedagogy this scroll exists to replace. (Applies to the predicts too: the reveal of every "does this compile?" predict is real compiler output, not prose saying "no".)

Valentina (S2) enforces rule 1 at review; Björn (S8) enforces rule 2.

### 2.3 `predict` placement

**Five predicts — Lessons 0, 1, 2, 4, 5 (20% of 25 steps).** Above the 10-15% heuristic, sanctioned by the format exception: the native Rust predict form ("does this compile? what does rustc say?") is the cheapest hypothesis-activation surface the language offers and the exception explicitly buys more of it.

- **0.2 — "You cloned a Rust project. What do you run first?"** Orientation predict (the only non-compile-shaped one). Correct: `cargo run`. Wrong options encode: `rustc src/main.rs` (the C/direct-compile reflex — doesn't resolve dependencies), `cargo install` (the `gem install` / `pip install .` reflex — builds a global binary), `cargo add` (the `npm install <pkg>` reflex — modifies deps, doesn't run).
- **1.2 — "Does this compile?"** `String` used after move. Correct: no, `E0382`. Wrong options encode: JS reflex ("`let s2 = s1` copies a reference, both valid"), C reflex ("compiles with a warning"), C++ reflex ("compiles, crashes at runtime with use-after-free"). Reveal quotes the 1.68.2 `E0382` output. **First compiler-error reveal.**
- **2.2 — "Does this compile?"** Two simultaneous `&mut` borrows. Correct: no, `E0499`. Wrong options include the near-miss **`E0502`** as a distractor — the polyglot will meet both codes and the distinction (two muts vs mut+immutable) is the lesson. Reveal quotes `E0499` and walks its `help:`.
- **4.2 — "Which of these signatures compile?"** `fn f<T: Greet>(x: T)` / `fn f(x: impl Greet)` / `fn f(x: Box<dyn Greet>)`. Correct: all three — the model-building moment is *why*, and how dispatch differs. The one predict that isn't fail-shaped; Maya (S11) reviews whether it stays a predict or converts to `read+inline`.
- **5.2 — "Does this compile?"** A `match` on a three-variant enum covering two arms. Correct: no, `E0004` non-exhaustive patterns. Wrong options encode: the JS/Java switch reflex ("unmatched cases just fall through / return unit"), "compiles with a warning", and "no — but because the enum needs a `default` variant" (the misread that exhaustiveness is about the enum, not the match). *(Promoted from the S026 draft's "don't promote" default — the format exception inverts that call; see §7.)*

Lesson 3 carries no predict: its compile-refusal moment (`?` in a function returning `i32` → `E0277`) lands as a deliberately-non-compiling sample inside read 3.1 instead — the read needs the anchor (rule 2.2.2) and a sixth predict would push past even the exception's budget.

### 2.4 Playground as `kata` variant (inherited from Ruby/Python)

**One playground in this scroll (step 1.5).** Same contract as Ruby/Python: a `kata` with `data.kind: "playground"`, verdict UI hidden, button reads "Ejecutar", trivially-true harness assertion. The instruction pre-loads specific things to try with motivation — Maya (S11) blocks any playground whose instruction reduces to "play around".

The S026 draft proposed a second playground in Lesson 4 (`derive` exploration); cut at outline to hold the 25-step / ~120-min budget — it was also the draft's own declared first cut. The derive exploration survives as two prompts folded into kata 4.3's `alternative_approach`. If the playground pattern has been retired by seed time, drop 1.5 and re-budget Lesson 1 to 4 steps.

### 2.5 Hint discipline (+ the Rust hint ladder)

> *A hint must NOT name the exact method, operator, or syntax that solves the kata. If removing the hint would not change which Rust identifier the learner types, the hint is the solution.*

Rust-specific extension — **compiler output is part of the hint calculus**, in three layers (salvaged from the pre-pivot track's hint model, which combined Rustlings' and Exercism's):

1. **The raw error.** Always available — it's on screen. Never paraphrased in the hint.
2. **"What is the compiler asking?"** — one line of translation. For `E0382`: *"you handed ownership away on the marked line; you can give it back, duplicate it, or not take it in the first place."* Quoting the `help:` line verbatim is teaching the learner to read it — NOT giving away the solution.
3. **Concept-level direction** — points at the choice (clone vs borrow vs restructure), never at the call site. ❌ *"Use `s1.clone()`"* — solution in disguise. ✅ *"Two honest fixes exist: duplicate the data (String has a method for exactly that) or print through a borrow instead of a move. Pick one and defend it."*

Same rule for `instruction` text. Applies to all katas, Lessons 1-6; authoring against this gate is a precondition for seeding.

### 2.6 Footgun deferral discipline

Every named-but-not-taught topic gets **one sentence**: the failure mode + a deep-dive slug (placeholder slugs are fine — they anchor the deferral honestly).

| Topic | Surfaces where | Footgun named | Deferred to |
|---|---|---|---|
| `unsafe` | Lesson 6 closer | "for soundness you can prove and the compiler can't — not for borrows you'd rather not think about" | `rust-unsafe-and-ffi` |
| Lifetime annotations at depth (elision rules, HRTBs, variance, `'static`) | Lesson 2 read (named once) + Lesson 6 closer | writing `'a` everywhere because one signature needed it | `rust-lifetimes-and-borrowing-deep` |
| Async / `tokio` / `Pin` | Lesson 6 closer | async without a runtime is confusingly-written sync code; Piston can't host a runtime | `rust-async-with-tokio` |
| `Rc<RefCell<T>>` | Lesson 6 closer | the poor-man's-GC pattern; usually a data-model smell (arena pattern wins) | `rust-lifetimes-and-borrowing-deep` |
| Trait objects beyond `Box<dyn Trait>` literacy | Lesson 4 read | reaching for `dyn` because "interfaces" maps to it linguistically; vtable + allocation cost | `rust-traits-deep` |
| Macros (`macro_rules!`, proc macros) | Lesson 6 closer | macros instead of functions; proc macros can't even build in this sandbox | `rust-macros-declarative-and-procedural` |
| Implementing `Iterator` | Lesson 6 closer (the scroll *uses* `.iter()`/`.find()`/`.collect()`, never implements) | writing index loops because the trait felt advanced | `rust-iterators-deep` |
| `#[test]` / `cargo test` | Lesson 0 read (sandbox honesty) | the manual harness is a sandbox workaround, not how real Rust tests | `rust-testing-deep` |

### 2.7 Compiler-error reveal contract

The scroll's signature pattern. Locations: 1.2 (`E0382`), 2.2 (`E0499`), 2.4 read+inline (the `E0499` walk), 3.1 inline (`E0277`), 5.2 (`E0004`). Contract per reveal:

- Snippet is **minimal**: 4-7 lines, single concept, readable in 5 seconds.
- Output is **quoted verbatim from rustc 1.68.2** — error code + `help:`/`note:` lines included. Captured during smoke (run each snippet through Piston, paste the real output into the seed). If Piston ever upgrades rustc, re-capture; codes are stable, surrounding text drifts.
- Wrong-answer feedback **names the polyglot reflex** that produced it (predict voice contract per [`../../INTERACTIVITY-PATTERNS.md`](../../INTERACTIVITY-PATTERNS.md)).

### 2.8 Production-gesture audit (README §4.4, done at outline)

The 2-3 gestures a working Rust developer performs daily. Each is **written in a kata** — not read about:

| # | Gesture | Written in |
|---|---|---|
| G1 | Define a struct + `impl` block with a `&self` method | Kata 4.3 (learner defines `struct Point` and both trait impls); repeated in capstone 6.2 (`Summary` + `impl Display`) |
| G2 | Match exhaustively on an enum / `Option` / `Result` | Kata 5.3 (learner-defined enum + exhaustive `match`); kata 5.4 (`Option`); katas 3.2/3.3 (`Result`) |
| G3 | Write a function taking `&str` (not `String`) returning borrowed data | Kata 2.3 (`first_word`); held as the signature default in every later kata |

A fourth daily gesture — `Result`-returning function propagating with `?` — is written in 3.2, 3.3, and the capstone. Audit verdict: no gesture is read-only; the scroll passes §4.4.

### 2.9 Std-only, no `unsafe`, version honesty

Only `std`, under **rustc 1.68.2**. No `unsafe` in any starter code or reference solution. Any idiom stabilized after 1.68 (e.g. `OnceLock` 1.70, `is_some_and` 1.70, `async fn` in traits 1.75) appears **only in prose with a "newer Rust" marker — never in a kata**, per the S028 decision. `let-else` (1.65) is available but unused (no kata needs it). Authors check stabilization versions against the release notes before putting any API in starter/test code.

---

## 3. Retrieval & Cross-references

- **From prior scrolls:** none — entry scroll of the Rust track.
- **Within this scroll:**
  - Lesson 1's move semantics set up Lesson 2's borrowing: kata 1.4's take-and-give-back is explicitly named in read 2.1 as "the problem borrowing dissolves".
  - Lesson 2's `&T`/`&mut T` reappears silently in Lesson 4's method receivers (`&self`, `&mut self`) — read 4.1 surfaces the connection in one sentence, no re-teach.
  - Lesson 2's `&str`-as-default is held by katas 3.2 (`parse_and_double(s: &str)`), 5.4, and the capstone (`summarize(log: &str)`).
  - Lesson 3's `Result` + custom-error-enum shape is the capstone's error model; the capstone instruction points back at 3.3 by name.
  - Lesson 3's `match` on `Result` is *used* before exhaustiveness is *motivated*; read 5.1 closes that loop ("the match you wrote in Lesson 3 was exhaustive — here's why the compiler insisted").
  - Lesson 5's learner-defined enum (5.3) rehearses exactly the gesture the capstone's `Level` enum requires.
- **Forward hooks:** the deferral table in §2.6; `From`/`Into` (surfaces in 3.3) named as the entry to `rust-traits-deep`; iterator *use* (5.4's hint territory) vs iterator *implementation* (deferred).

---

## 4. Lessons

Step totals: L0 2 · L1 5 · L2 5 · L3 3 · L4 4 · L5 4 · L6 2 = **25 steps** (10 katas + 1 playground + 1 capstone challenge + 5 predicts + 1 read+inline + 7 reads). Time ≈ 120 min. Cut order if over budget: 1.5 playground, then 5.4.

### Lesson 0 — Rust in context

> *What changes in the learner's head:* "I know whether Rust earns my Friday, what `rustup`/`cargo`/`crates.io` are, why the compiler is a tutor rather than an obstacle, and exactly what this sandbox can and can't run — before I invest in syntax."

**Step distribution:** 1 `read`, 1 `predict` = 2 steps. No kata — orientation, not drilling. *(Collapsed from the draft's two reads: the README's no-two-consecutive-reads rule applies, and the Python precedent holds — one ruthless ~400-word read beats two comfortable ones.)*

#### Step 0.1 — `read` — "What Rust is for, how it runs, and why the compiler is your tutor"

- **why_care:** before 120 minutes of ownership, the polyglot needs (1) the is-Rust-for-me paragraph, (2) the toolchain map, (3) the frame the whole scroll runs on, (4) the sandbox contract.
- **body topics (~400 words, hard ceiling):**
  - **Sweet spot / not:** high-performance CLI tools (`ripgrep`, `fd`, `bat`), services where memory safety + perf both matter (Discord read-states, Cloudflare, AWS Bottlerocket), Wasm targets. Not: quick prototypes (compile times), notebooks, CRUD apps where dev-hours dominate runtime cost, 30-line scripts (the borrow checker is overhead there).
  - **Toolchain in one breath, one cross-language analog each:** `rustup` (≈ nvm/pyenv), `cargo` (build tool + package manager + test runner + doc generator — THE tool, no make/webpack layer), `Cargo.toml`/`Cargo.lock` (≈ package.json/lockfile), `crates.io` (≈ npm/PyPI), `cargo run` as the 90% inner-loop command. Editions exist (2015/2018/2021); new code is 2021+.
  - **The compiler-as-tutor frame:** rustc errors carry `help:` suggestions, `note:` context, and stable error codes. When code doesn't compile in this scroll, the message is the lesson — the scroll will repeatedly ask you to predict it before reading it. Ends with a real 3-line `E0382` excerpt (the Lesson 1 teaser; honors the borrow-check test).
  - **Sandbox honesty (load-bearing, per S028):** "This scroll runs **Rust 1.68.2** in the sandbox, std-only, single file — no `tokio`, `serde`, `thiserror`, no `cargo test` (the scroll uses a small manual harness instead; real Rust tests with `#[test]`, deferred to `rust-testing-deep`). Where modern Rust has something newer — `async fn` in traits (1.75), `OnceLock` (1.70) — the prose marks it *newer Rust* and you won't be asked to run it. On your machine, `rustup` gives you current stable; nothing in this scroll breaks on it."
  - **NOT to include:** "most loved language" trivia, pre-1.0 history, what a compiled language is, marketing for memory safety.
- **voice_check:** every paragraph passes the borrow-check test (§2.1); the toolchain paragraph names each cross-language analog exactly once; ends with the `E0382` excerpt, not prose.

#### Step 0.2 — `predict` — "You cloned a Rust project. What do you run first?"

- **snippet:** shell session — `git clone`, `cd`, `ls` revealing `Cargo.toml`, `Cargo.lock`, `src/`, `README.md`, then `???`.
- **options:** (a) `rustc src/main.rs` (b) `cargo run` (c) `cargo install` (d) `cargo add`.
- **correct:** b.
- **feedback:** per §2.3 — each wrong option names its reflex (direct-compile / global-install / add-a-dependency) and explains what the command actually does; (b) explains `cargo run` = read manifest → fetch per lockfile → compile → run.

---

### Lesson 1 — Ownership: the mental model that replaces the GC

> *What changes in the learner's head:* "Every value has exactly one owner; when the owner goes out of scope the value is dropped; assignment MOVES ownership for non-`Copy` types. I just read `E0382` and I know what the compiler is asking. Cloning is an option — a thoughtful one, not a reflex."

**Step distribution:** 1 `read`, 1 `predict`, 2 `kata`, 1 `playground` = 5 steps. This is the format exception's from-scratch lesson #1; the first compiler-error reveal lands within the scroll's first 25 minutes (Björn's constraint).

#### Step 1.1 — `read` — "Every value has exactly one owner"

- **body topics (~400 words):** the ownership rule (one owner; drop at scope exit; assignment and function calls move unless `Copy` or borrowed); `Copy` types (`i32`, `bool`, `char`, `f64`, tuples/arrays of `Copy`) vs owned heap types (`String`, `Vec<T>`, `Box<T>`) and *why* (duplicating ownership of a heap buffer would mean double-free); the inline non-compiling sample (`let s1 = String::from("dojo"); let s2 = s1; println!("{}", s1);`) followed by the **verbatim 1.68.2 `E0382` output**; how to read the error (move site, use site, the `note:` naming the missing `Copy`); **three responses to `E0382`** — clone (legitimate when two owners are real), restructure to return ownership, borrow (next lesson); the polyglot reflex callout ("in JS/Java/Python, `let s2 = s1` copies a reference and both stay valid; in Rust it moves — internalize this, everything else sits on it"); drop ≈ deterministic RAII ("this is what GC does for you elsewhere, done at scope exit with no runtime" — the C++ analogy used once, with its limit named).
- **figure (proposal, not committed):** `disambiguation` — **`Copy` vs `Clone`**, divergent attribute **Explicitness** (implicit bitwise copy vs explicit, possibly-allocating call). Embed only if the Copy-vs-owned paragraph reads muddy without it; max 2 figures per read.
- **voice_check:** ends with the `E0382` excerpt, not prose. Error-anchor rule (§2.2.2) satisfied by construction.

#### Step 1.2 — `predict` — "Does this compile?"

- **snippet:** `fn main() { let s1 = String::from("hello"); let s2 = s1; println!("{} {}", s1, s2); }`
- **options:** (a) compiles, prints `hello hello` (b) compiles with a warning (c) fails — `E0382` borrow of moved value (d) compiles, panics at runtime with use-after-free.
- **correct:** c. Feedback per §2.3 (JS / C / C++ reflexes named); reveal quotes the actual output and walks it line by line.

#### Step 1.3 — `kata` — "Fix the move" *(fail-by-design)*

- Starter: a `main` that uses `s1` after moving it into `s2`; **does not compile** (`E0382`). Learner makes the minimal change that compiles AND produces the expected stdout (asserted via harness on a returned/captured string, not raw stdout matching).
- Two valid fixes at this point: `.clone()` (legitimate — borrowing doesn't exist yet) or restructuring. Instruction says both are acceptable and that the more idiomatic fix is next lesson's topic.
- Hint: ladder per §2.5 — layer-2 translation of `E0382`, layer-3 names the clone-vs-restructure choice without the call site.

#### Step 1.4 — `kata` — "Take ownership, give it back"

- Signature: `fn shout(s: String) -> String` — takes ownership, returns (modified) ownership; learner also fixes the provided `main` to re-bind (`let s = shout(s);`). **No `.clone()`** — the test's `alternative_approach` calls clones out.
- Tests: round-trip semantics — caller uses the returned value after the call; content assertion (`"dojo"` → `"DOJO"`).
- Hint: points at re-binding as the idiom without showing the call site.

#### Step 1.5 — `playground` — "Poke ownership at function boundaries"

- `data.kind: "playground"`. Starter pre-loads `print_and_consume(s: String)` called from `main`, with a commented-out post-call `println!("{}", s)`.
- Exploration prompts: uncomment the second `println!` — what error code, what `help:`? Change the parameter to `&String` — does `s` stay valid, why? Change it to `&str` and call with `&s` — why does `&String` coerce? (Deref coercion named here in one line, depth deferred.)
- Harness: trivially-true assertion; frontend hides verdict UI per the inherited contract.

---

### Lesson 2 — Borrowing and references

> *What changes in the learner's head:* "Borrowing is how functions use a value without taking it: `&T` = read access, many allowed; `&mut T` = write access, exactly one, no readers alongside. `&str` is the default string argument type. I read `E0499` and the lifetime `'a` made a cameo — I can recognize it; I don't have to write it."

**Step distribution:** 1 `read`, 1 `predict`, 1 `kata`, 1 `read+inline`, 1 `kata` = 5 steps. Format-exception lesson #2 + lifetimes-lite.

#### Step 2.1 — `read` — "`&T`, `&mut T`, and the aliasing-XOR-mutation rule"

- **body topics (~400 words):** `&T` shared borrow (many simultaneous; compiling sample); `&mut T` exclusive borrow (exactly one, no other borrow of any kind; non-compiling sample with the 3-line `E0499` excerpt — error anchor); WHY the rule exists (it makes data races unprovable-by-construction, checked statically); `&self` / `&mut self` / `self` previewed in one sentence as Lesson 4's receivers; **`&String` vs `&str`** — `&str` is the idiomatic argument type, `&String` coerces to it, take `&str` unless ownership transfer is the point; **lifetimes-lite:** the `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str` signature shown ONCE with the framing "when elision can't infer how long a borrow lives, the compiler asks for this annotation; you need to *recognize* it in errors and library signatures — writing it is `rust-lifetimes-and-borrowing-deep`'s job".
- **figure (committed — satisfies the scroll's ≥1 disambiguation mandate):** `disambiguation` — **`String` vs `&str`**, divergent attribute **Ownership** (owns-and-grows heap buffer vs borrowed view), cascading to mutability, function-signature defaults, and where `.to_string()` sits. Lands beside the `&String`/`&str` paragraph.
- **voice_check:** ends with the `longest` signature and its one-sentence deferral, not with prose about lifetimes.

#### Step 2.2 — `predict` — "Does this compile?"

- **snippet:** `let mut v = vec![1, 2, 3]; let r1 = &mut v; let r2 = &mut v; println!("{:?} {:?}", r1, r2);`
- **options:** (a) compiles, prints both (b) compiles with an aliasing warning (c) fails — `E0499` cannot borrow `v` as mutable more than once (d) fails — `E0502` mutable-while-immutable.
- **correct:** c. Option (d) is the deliberate near-miss: feedback explains the `E0499`/`E0502` distinction because the learner will read both codes in practice. Reveal quotes 1.68.2 output incl. the `help:`.

#### Step 2.3 — `kata` — `first_word` *(production gesture G3)*

- Signature: `fn first_word(s: &str) -> &str` — the slice up to the first space, or the whole input. No `String` allocation, no clone; tests: `"hello world"` → `"hello"`, `"single"` → `"single"`, `""` → `""`.
- Hint: points at `str::find` *or* `char_indices` as the search family and at slice syntax `&s[..i]` as a shape — without assembling the body.

#### Step 2.4 — `read+inline` — "Reading the compiler: `E0499`, line by line"

- Walks the full `E0499` output from 2.2's snippet: error code → first borrow span → second borrow span → `help:` → `note:`. Max 4 embedded interactions:
  1. After the error code + first span: "what will the next line point at?" → reveal: the second borrow's span.
  2. After both spans: "what will `help:` suggest?" → reveal: scoping one of the borrows.
  3. Micro-quiz: "if `r2` were `&v` (immutable) instead, which code?" → options `E0499` / `E0502`, correct `E0502`.
- Closes with the habit: `rustc --explain E0499` — every Rust error code has a long-form explanation; bookmark the command.

#### Step 2.5 — `kata` — "Fix the overlapping borrows" *(fail-by-design)*

- Starter: two `&mut v` borrows held in overlapping scopes; fails with `E0499`. Valid fixes: scope the first borrow with `{}`, or restructure to a single `&mut`. Tests assert on the final vector contents.
- Hint: quotes the `help:` line verbatim (allowed per §2.5) and asks what "scoping a borrow" means in Rust — when does a binding's borrow end?

---

### Lesson 3 — `Result`, `?`, and errors as values

> *What changes in the learner's head:* "Fallible functions return `Result<T, E>`; callers handle both arms or propagate with `?`. `?` only works in functions that return `Result` — I saw the `E0277` refusal. `panic!`/`unwrap` are for invariant violations, not control flow. `thiserror`/`anyhow` exist in production; here I hand-roll `From` to see the mechanism."

**Step distribution:** 1 `read`, 2 `kata` = 3 steps. Delta-framed (errors-as-values ≈ what the polyglot knows from Go-style returns or functional `Either`; the delta is the compiler forcing both arms + `?` sugar). No predict — the `E0277` anchor lives in the read; see §2.3.

#### Step 3.1 — `read` — "`Result<T, E>` and propagation with `?`"

- **body topics (~400 words):** `Result` as a two-variant enum (`Ok(T)` / `Err(E)`); the `match`-on-`Result` form first, then the same operation collapsed with `?` — **the desugaring is the lesson**; the `E0277` error anchor: a non-compiling sample using `?` inside `fn main() -> ()` (or a fn returning `i32`), with the verbatim 1.68.2 output ("the `?` operator can only be used in a function that returns `Result` or `Option`") — this is among the first errors every real Rust beginner hits; `?` + `From` conversion in one paragraph (how multi-error pipelines stay readable; sets up 3.3); `unwrap()`/`expect()` as honest post-condition assertions — `expect` strings are invariant claims ("non-empty by construction"), not anxiety; the `panic!`-vs-`Result` decision matrix in two lines; **sandbox-honesty marker:** "production error enums are derived with `thiserror`, context added with `anyhow`; no crates here, so we hand-write `Display` and `From` — the mechanics are the lesson, the boilerplate is what the crates remove."
- **figure (proposal):** `before-after` — the 9-line `match` ladder vs the 2-line `?` version of the same parse pipeline. Embed if the desugar paragraph wants the visual; skip if the two inline samples carry it.
- **voice_check:** both the match form and the `?` form compile; the `E0277` sample doesn't, and its quoted output closes the section.

#### Step 3.2 — `kata` — `parse_and_double`

- Signature: `fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError>`. Use `?` — no `match`, no `unwrap` (instruction states this; test can't enforce it, `alternative_approach` shows the match version for contrast).
- Tests: `"5"` → `Ok(10)`, `"-3"` → `Ok(-6)`, `"abc"` → `Err(_)` (asserted via `.is_err()`).
- Hint: points at `s.parse::<i32>()`'s return type and at `?` as the propagation idiom — not at the one-line body.

#### Step 3.3 — `kata` — "A custom error enum with `From`"

- Shape: `enum AppError { Parse(std::num::ParseIntError), Empty }` + `impl Display` + `impl From<ParseIntError> for AppError`; then `fn parse_first(input: &[&str]) -> Result<i32, AppError>` — `Empty` on empty slice, `Parse` via `?`-conversion on a bad first element.
- Tests: all three arms (`Ok`, `Err(Empty)`, `Err(Parse(_))` via `matches!`-style assertion in the harness).
- Hint: names the three structures to write (`enum`, two `impl`s) and that `?` does the conversion *if* the right trait impl exists — never the impl bodies.
- *(The S026 draft's mini-CSV challenge that followed this kata is superseded by the capstone — same skill surface, scroll-level integration. See §7.)*

---

### Lesson 4 — Traits and generics: interfaces with a twist

> *What changes in the learner's head:* "Traits are the interfaces I know — the twist is dispatch. `<T: Trait>` and `impl Trait` are static dispatch, monomorphized, free at runtime. `Box<dyn Trait>` is the vtable escape hatch for heterogeneity, not the default. My Java/C# instinct to reach for `dyn` first is the named anti-reflex."

**Step distribution:** 1 `read`, 1 `predict`, 2 `kata` = 4 steps. **Delta-framed throughout** (§2.2 rule 1) — no from-scratch "what is an interface" prose.

#### Step 4.1 — `read` — "Behavior contracts with static dispatch by default"

- **body topics (~400 words):** trait ≈ interface, the twist stated in the first paragraph (no inheritance, blanket impls exist, dispatch is a *choice*); defining + implementing (`trait Greet` / `impl Greet for Person`, compiling sample); default methods; generic bounds `fn announce<T: Greet>(x: &T)` and monomorphization (zero runtime cost, bigger binary); `impl Trait` in argument position = sugar for the generic; `impl Trait` in return position ("one concrete type, unnamed"); `Box<dyn Trait>` = runtime dispatch via vtable, the answer when a collection must hold *different* concrete types; the decision tree (one type → use it; many types known at compile time → generic; runtime heterogeneity → `dyn`); the Java/C# anti-reflex named explicitly; `#[derive(Debug, Clone, PartialEq)]` in one paragraph (the scroll uses it; the macro mechanism is deferred); trait objects with lifetimes named-and-deferred (one sentence → `rust-traits-deep`).
- **figure (proposal):** `tabbed-card` — three tabs (`<T: Trait>` / `impl Trait` / `Box<dyn Trait>`), same `announce` contract per tab, dispatch + cost as the per-tab delta. Embed if the decision-tree paragraph runs dense.
- **voice_check:** every sample compiles; the decision tree is the load-bearing summary; receivers (`&self`) get the one-sentence Lesson 2 back-reference, no re-teach.

#### Step 4.2 — `predict` — "Which of these signatures compile?"

- Three signatures (generic bound / `impl Trait` arg / `Box<dyn Trait>` arg); 4 options proposing compile/no combinations; **correct: all three compile** — the feedback teaches dispatch difference per option, naming the C#/Java reflexes that pick wrongly. Maya (S11) reviews predict-vs-read+inline fit (carried from draft).

#### Step 4.3 — `kata` — "Define a struct, implement a trait" *(production gesture G1)*

- Starter gives `trait Describe { fn describe(&self) -> String; }` and a completed `struct Person` example impl. Learner **defines `struct Point { x: i32, y: i32 }` themselves** and writes `impl Describe for Point` (returns `"(3, 4)"` form) — typing `struct`, `impl … for`, and a `&self` method with their own hands.
- Tests: construct both types, assert both `describe()` outputs.
- `alternative_approach` carries the two derive-exploration prompts salvaged from the cut Lesson 4 playground (remove a `derive`, watch the error; `{}` vs `{:?}` and why `Display` isn't derivable).
- Hint: points at the `impl Trait for Type` shape and at f-string-equivalent `format!` — not at the bodies.

#### Step 4.4 — `kata` — "A generic function with a bound"

- Signature: `fn announce<T: Describe>(items: &[T]) -> Vec<String>` — one description per item (returns the Vec instead of printing: deterministic assertion, no stdout capture).
- Tests: call with `Vec<Person>` and with `Vec<Point>` — the monomorphization point made by the test itself.
- Hint: points at the bound syntax and at iterating a slice; names `.iter().map(…).collect()` as *a* family without assembling the chain.

---

### Lesson 5 — Enums, `Option`, and exhaustive `match`

> *What changes in the learner's head:* "Rust enums are the discriminated unions / sealed types I know — the twist is that `match` is exhaustive by construction and the compiler refuses a missing arm (`E0004`). `Option<T>` is null replaced by an enum I must destructure. `if let` is the one-arm shortcut."

**Step distribution:** 1 `read`, 1 `predict`, 2 `kata` = 4 steps. Delta-framed (enums ≈ ADTs the polyglot knows: TS discriminated unions for Mariana/Felipe, sealed classes + switch for Yui).

#### Step 5.1 — `read` — "`Option<T>` and `match` exhaustiveness as a design tool"

- **body topics (~350 words):** enums hold data per variant (delta from C-style enums stated in one line); `Option<T>` as the no-null story — the compiler won't let you pretend `None` can't happen; `match` on `Option` (compiling sample, both arms); the **`E0004` error anchor**: a non-compiling match missing a variant, with verbatim 1.68.2 "non-exhaustive patterns" output; exhaustiveness as a *design tool* — add a variant, the compiler lists every match to update (the refactor-safety pitch, Yui's lens); `if let` for one-arm matches; the back-reference closing Lesson 3's loop ("your `match` on `Result` was this same machinery"); useful `Option` methods named with one-liners (`unwrap_or`, `map`, `and_then`) — used, not drilled.
- **voice_check:** the `E0004` excerpt anchors the exhaustiveness paragraph; the `if let` paragraph ends in code.

#### Step 5.2 — `predict` — "Does this compile?"

- **snippet:** a 3-variant enum (`enum Status { Active, Idle, Banned }`) and a `match` covering two arms.
- **options:** (a) compiles — unmatched values fall through like a `switch` (b) compiles with a warning (c) fails — `E0004` non-exhaustive patterns, `Banned` not covered (d) fails — enums require a default variant.
- **correct:** c. Feedback names the switch-fallthrough reflex (JS/Java), the lint-vs-gate misread, and the "default variant" misconception (exhaustiveness is the match's job, `_` is the opt-out). Reveal quotes 1.68.2 output. *(Promoted per the format exception — see §7.)*

#### Step 5.3 — `kata` — "Define an enum, match every shape" *(production gesture G2; salvaged from the pre-pivot fundamentals course)*

- Learner defines `enum Shape { Circle(f64), Square(f64), Rect(f64, f64) }` and writes `fn area(s: &Shape) -> f64` with an exhaustive `match` (no `_` arm — instruction forbids it so the gesture is the full exhaustive form).
- Tests: one per variant + a float-epsilon assertion helper from the harness for `Circle`.
- Hint: points at destructuring variant payloads in match arms (`Shape::Circle(r) =>`) as a shape — not at the arithmetic.

#### Step 5.4 — `kata` — `first_even`

- Signature: `fn first_even(v: &[i32]) -> Option<i32>`. Tests: `[1, 2, 3]` → `Some(2)`, `[1, 3, 5]` → `None`, `[]` → `None`.
- Instruction allows both the iterator one-liner and the explicit loop+match; `alternative_approach` shows the other one. Hint points at the iterator method *family* (`find`) without naming the exact chain (`.iter().copied().find(…)`).

---

### Lesson 6 — Integration: the capstone

> *What changes in the learner's head:* "I can read most idiomatic Rust and write a small real function end-to-end. I know exactly what this scroll didn't teach, why, and where each depth lives."

**Step distribution:** 1 `read`, 1 `challenge` (the scroll capstone) = 2 steps.

#### Step 6.1 — `read` — "What you can now read — and what we deliberately didn't teach"

- **body topics (~350 words):** the capability recap in one tight paragraph (ownership/borrowing as the substrate; errors as values; traits with static dispatch; exhaustive matching) — framed as "what you'll recognize in the first real Rust file you open"; then the **named-and-deferred map**, one sentence per item from the §2.6 table (`unsafe`, lifetimes at depth, async/`tokio`/`Pin`, `Rc<RefCell<T>>`, macros, trait-object depth, implementing `Iterator`, real `#[test]` testing), each with its failure mode and deep-dive slug; closes by setting up the capstone explicitly: "the last step is one function a working developer would actually write — it needs Lessons 2, 3, 4, and 5 at once. That's the point."
- **voice_check:** the recap paragraph ends with a compiling sample (a 6-line function using `&str` + `?` + `match` — the capstone's shape in miniature, per the borrow-check test). The deferral list is the one place one-sentence items are exempt from the code-sample rule (they are pointers, not teaching).

#### Step 6.2 — `challenge` — **Capstone: "Log triage — parse, classify, summarize"**

- **Deliverable (one small, real function a working dev would plausibly write):**
  ```rust
  enum Level { Info, Warn, Error }

  #[derive(Debug, PartialEq)]
  struct Summary { infos: usize, warns: usize, errors: usize }

  enum LogError { Empty, UnknownLevel(String) }

  fn summarize(log: &str) -> Result<Summary, LogError>

  impl std::fmt::Display for Summary   // "2 info, 1 warn, 1 error"
  ```
  Input: a multi-line log where each non-blank line starts with a level token (`"WARN disk usage at 91%"`). Blank lines are skipped. An unrecognized level token → `Err(LogError::UnknownLevel(token.to_string()))`; an input with no non-blank lines → `Err(LogError::Empty)`.
- **Lessons integrated (named in the learner-facing instruction, per README §5.3):** **Lesson 2** (takes `&str`, splits lines and tokens as borrows; the only allocation is the error variant's `.to_string()` — and the instruction says why that one is honest); **Lesson 3** (custom error enum, `?` propagation via a `parse_level(token: &str) -> Result<Level, LogError>` helper the learner is nudged toward structuring); **Lesson 4** (`impl Display for Summary` — the trait gesture, again); **Lesson 5** (learner-defined `Level` enum + exhaustive `match`, no `_` arm on `Level`).
- **Tests (cover every arm):** mixed valid log → `Ok(Summary { infos: 2, warns: 1, errors: 1 })` AND `format!("{}", summary)` equals the expected string; a log containing `"TRACE …"` → `Err(UnknownLevel("TRACE"))`; `""` and `"\n\n"` → `Err(Empty)`; blank-line skipping verified inside the mixed case.
- **Budget & rules:** ~25 min (2× kata, stated in the instruction). **≤1 hint**, high-level only: *"Three sub-problems: split the input into candidate lines, turn a line's first token into a `Level` (one fallible function — `?` is your friend), and accumulate counts. Solve them in that order."* Not a gate; skippable.
- **Outline-level persona attack sketches (README §5.3 — the lesson set is validated against these):**
  - **Mariana (A1):** lines→tokens→reduce is her JS reflex verbatim; her predicted snag is `UnknownLevel(String)` requiring `.to_string()` on a `&str` token — that's Lessons 1-2 paying off, and the instruction's allocation note is aimed at her.
  - **Yui (A3):** maps `Level` to a Java enum + switch and `Display` to `toString()`; her predicted snag is wanting a `default:` arm — Lesson 5's no-`_`-on-`Level` rule is the correction.
  - **Felipe (A4):** discriminated-union reflex covers the enum; his predicted snag is reaching for throw-shaped control flow — Lesson 3's both-arms tests are the correction.
  - All three can sketch an attack using only outlined lessons → the lesson set passes the capstone test. *(If W2 authoring changes a lesson's scope, re-run this sketch before seeding.)*
- *(The S026 draft's mini-`Json` pretty-printer challenge is superseded by this capstone; its enum-recursion exercise migrates to `rust-iterators-deep` / future deep-dive material. See §7.)*

---

## 5. Sandbox notes

- **Runner:** Piston **Rust 1.68.2** (declared in Lesson 0; the S026 draft's 1.75+ assumption is void). Single-file `rustc` + run — **no `cargo`, no `cargo test`, no external crates.** Confirm at smoke which edition flag (if any) Piston passes to `rustc`; bare `rustc` defaults to edition 2015, so avoid edition-sensitive idioms (e.g. by-value array iteration in method position) regardless.
- **Test harness:** **manual `_t`/`_eq` pattern, consistent with Ruby and Python** (S028 decision — the draft's manual-vs-`cargo test` open question is closed). Shape sketch, finalized at seed:
  ```rust
  fn _eq<T: std::fmt::Debug + PartialEq>(actual: T, expected: T) -> Result<(), String> {
      if actual == expected { Ok(()) }
      else { Err(format!("expected {:?} but got {:?}", expected, actual)) }
  }

  fn _t(results: &mut Vec<(String, Result<(), String>)>, name: &str,
        f: impl FnOnce() -> Result<(), String> + std::panic::UnwindSafe) {
      let outcome = std::panic::catch_unwind(f)
          .unwrap_or_else(|_| Err("panicked".to_string()));
      results.push((name.to_string(), outcome));
  }
  ```
  `main` runs the `_t` calls and emits the `__DOJO_RESULT__ <json>` footer (JSON assembled with `format!` — no `serde`). `catch_unwind` keeps one panicking test from killing the suite. A float-epsilon helper (`_eq_close`) ships for kata 5.3. Test names are user-facing sentences, per framework rules.
- **Fail-by-design katas and the compile verdict:** for katas 1.3 and 2.5 the starter intentionally fails to compile; ExecuteStep must surface the compile error as the feedback channel (stderr passthrough), not as an infrastructure failure. Verify this contract with Tomás (C3) at the Lesson 1 smoke — it is the single most load-bearing infra assumption in the scroll.
- **Std-only.** `String`, `Vec`, `Option`, `Result`, `std::fmt`, `std::num::ParseIntError`, iterator methods — fair game. No `tokio`/`serde`/`thiserror`/`anyhow`/`rand`/`chrono`. Nothing stabilized after 1.68.2 in any starter, test, or solution (§2.9).
- **Determinism:** no `std::time::Instant` in assertions; no `HashMap` iteration order in asserted output (capstone counts by named struct fields precisely to avoid a map); no thread/atomic interleaving; no STDIN — inputs are function arguments and hardcoded literals.
- **Compile-latency budget:** 10-15s/step assumed, **pending smoke** (Rust compile time is the dominant Piston cost). Guesses: Lessons 1-3 katas 2-5s; Lesson 4 generics 3-7s; capstone 5-10s. If a step consistently exceeds ~12s: shrink test inputs first, split second; never trivialize the pedagogy to fit the clock.
- **Quoted error output:** every quoted `rustc` message (steps 0.1, 1.1, 1.2, 2.1, 2.2, 2.4, 3.1, 5.1, 5.2) is captured from Piston's actual 1.68.2 during the Lesson 1 smoke batch and pasted into the seeds. Error codes are stable; `help:`/`note:` phrasing drifts across versions — never trust training-data memory of an error string.

---

## 6. References

- *The Rust Programming Language* (Klabnik & Nichols) — ch. 4 (ownership → Lessons 1-2), ch. 9 (errors → Lesson 3), ch. 10 (traits/generics → Lesson 4), ch. 6 (enums/match → Lesson 5). <https://doc.rust-lang.org/book/>
- *Programming Rust, 2nd ed.* — the `impl Trait` vs `dyn Trait` treatment behind read 4.1.
- *Rust for Rustaceans* (Gjengset) — the library-vs-binary error-handling distinction behind Lesson 3's `thiserror`/`anyhow` deferral.
- The `rustc` error code index — <https://doc.rust-lang.org/error_codes/error-index.html> (`E0382`, `E0499`, `E0502`, `E0277`, `E0004`).
- std API docs — <https://doc.rust-lang.org/std/>: `String`, `str`, `Option`, `Result`, `Iterator`, `ParseIntError`, `fmt::Display`.
- Rustlings — <https://github.com/rust-lang/rustlings>: the "make this compile" pattern for katas 1.3 and 2.5 (adapted, not copied).
- Cargo docs — <https://doc.rust-lang.org/cargo/> for read 0.1.

---

## 7. Open questions / known gaps

> Tagged like the Python spec: **`✓ resolved`** (decision applied), **`◐ partially resolved`**, **`◯ open`**.

- **`✓ resolved` — Harness: manual vs `cargo test`.** The S026 draft left this open with manual as default. S028 closed it: Piston runs `rustc` + run, no `cargo test` exists to choose; the manual `_t`/`_eq` harness (Ruby/Python-consistent) is the decision, not a fallback. `rust-testing-deep` inherits the `#[test]` story if sandbox capability ever lands.
- **`✓ resolved` — Sandbox Rust version.** The draft assumed 1.75+ throughout (Lesson 0 prose, error-message pinning, the `async fn`-in-traits mention). S028 truth: **1.68.2**. Applied: Lesson 0 declares it; post-1.68 idioms are prose-only with a "newer Rust" marker; all quoted errors re-captured from 1.68.2 at smoke. Residual risk: none of the outlined katas need a post-1.68 API (audited at outline against stabilization notes); if W2 prose-drafting surfaces one, the idiom moves to prose, never the kata — that rule is canon, not preference.
- **`✓ resolved` — Predict count.** Draft default was 3-4 with E0004 explicitly not promoted. The format exception inverts it: 5 predicts (20%), E0004 promoted, four of five in the native "does this compile?" form. Above the framework heuristic, sanctioned for Rust only.
- **`✓ resolved` — Capstone vs the draft's two challenges.** The draft carried a Lesson 3 mini-CSV challenge and a Lesson 5 mini-`Json` challenge, both pre-capstone-canon. Both are superseded by the single capstone (log triage) — the CSV challenge duplicated the capstone's parse-line-multi-error surface; the `Json` recursion exercise migrates to deep-dive material. The scroll ships exactly one challenge (the capstone), satisfying README §4.3's no-zero-challenges floor; flag for the W2 review whether Rust wants a mid-scroll challenge back if time allows (it currently doesn't).
- **`◐ partially resolved` — Exercise share at 48%.** 12 writing steps (10 katas + playground + capstone) of 25 = 48%, below the 55% framework floor. Defense: the format exception trades kata share for predict-driven hypothesis activation, and the `read+inline` (2.4) carries deliberate-practice load; the floor stays non-negotiable for Go/TS. Residual: if W2 authoring cuts a read by merging, prefer that over adding a read anywhere — the share must not drop further.
- **`◯ open` — Compile-error surfacing for fail-by-design katas.** The scroll structurally depends on Piston returning compile errors as learner-visible feedback (not as runner failures). Validate at Lesson 1 smoke with Tomás (C3) before seeding anything past Lesson 1. If the contract doesn't hold, katas 1.3/2.5 restructure to compiling-but-wrong starters — a real pedagogical loss, so fix the pipe first.
- **`◯ open` — Compile latency.** 10-15s/step is a guess. Smoke kata 4.4 (most generics-heavy) early and scale the budget from that data point.
- **`◯ open` — Lesson titles language.** This spec writes lesson titles and all content in English per the S028 scope-block instruction; the seeded Ruby/Python scrolls carry Spanish lesson titles ("Python en contexto"). Suite-level consistency decision needed before W3 seeding: localize Rust's titles at seed, or migrate the suite to English. Flagged, not resolved here.
- **`◯ open` — Playground survival.** One playground (1.5) ships pending the pattern's continued existence; the contract inherits Ruby/Python verbatim. If retired before seed, drop 1.5, Lesson 1 goes to 4 steps, scroll to 24 — still in the 24-26 band.
