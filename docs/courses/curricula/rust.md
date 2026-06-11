# Rust Scroll Track

> Maintainer persona: S8 Björn Lindqvist (Rust steward) + S5 Dr. Elif Yıldız (curriculum architect) + S2 Valentina Cruz (content quality) + S11 Maya Lindqvist (interactive learning UX).
> Last researched: 2026-04-14 · Pre-pivot multi-sub-course draft superseded 2026-06-07 · Re-scoped polyglot-first 2026-06-07 under Sprint 026 · **Promoted to canon 2026-06-11 under Sprint 028 W1**, with the S027 canon additions (capstone, production-gesture audit) and the Rust-scoped format exception applied from the outline.

## 1. Learning Philosophy for Rust

Rust has a teaching problem nobody has fully solved: every other mainstream language can be learned by typing the wrong thing and debugging the runtime error. Rust refuses to ship code it cannot prove safe — and the messages it produces while refusing are, taken seriously, the best free systems-programming tutorial ever written. This track is built around that asymmetry. **The lens: compiler-as-tutor — ownership, borrowing, and the error messages that teach them.** The crash scroll's job is to get out of the compiler's way: hand the learner a snippet that won't compile for a Rust-specific reason, let `rustc` deliver the lesson, then explain what the learner just read in the compiler output — not before, after. This is the inverse of how most Rust courses are structured ("here are the three rules of ownership, memorize them"), and it is the only order that respects the polyglot's reflexes: a senior developer's instinct is to read errors, not to study rules.

**The format exception (Rust-scoped, decided 2026-06-11).** Every other crash scroll teaches pure deltas — the polyglot already has every concept; only the local shape is new. Rust is the one language in the catalog where that isn't true: ownership/borrowing/lifetimes is a genuinely new mental model with no analog in JS, Java, Python, or Go. So the scroll bends the format for **exactly one mental model taught from scratch — ownership → borrowing → lifetimes-lite** — and holds the delta discipline everywhere else: traits ≈ interfaces with a twist, enums ≈ the ADTs/discriminated unions the polyglot knows, pattern matching ≈ familiar. The bend, concretely: a heavier `predict` ratio using the native Rust form ("does this compile? what does rustc say?"), compiler-output-as-feedback in katas, and fail-by-design exercises as a structural centerpiece rather than a garnish — because for Rust the error message IS the curriculum. The format bends, it does not break: same polyglot audience, ~120 min, no fundamentals reteach. **The exception is Rust-scoped. Go and TypeScript do not inherit it** — their surprise surfaces are idiom deltas, and a scroll that claims a from-scratch mental model it doesn't have is padding.

The split inside the one mental model matters. The pedagogical mistake almost everyone makes is to front-load ownership, borrowing, *and* lifetime annotation syntax as a triple. The crash scroll sequences them: ownership first (three lines of Rust cannot exist without it), borrowing immediately after (functions need arguments), and **lifetimes-lite** — the annotation `'a` is named exactly once, in the context of the elision-rule compiler prompt, recognized but never written from scratch. Depth lives in a deep-dive. The Rust Book spent years iterating to roughly this order; Björn (S8) signed off on inheriting it.

The idiom layer matters as much as the safety layer. A Rust scroll that produces learners who write Java-in-Rust has failed. The non-negotiables: **`Result<T, E>` and `?` over exceptions**, **`match` exhaustiveness as a design tool**, **`Option<T>` over null**, **traits as behavior contracts with static dispatch as the default**, and **`&str` as the default string argument type**. Every lesson forces the learner into a corner where the idiomatic answer is the path of least resistance; where the polyglot reflex is cloning, unwrapping, or `Box<dyn Whatever>`, the scroll names the reflex and corrects it.

Before any lesson on the language proper, **Lesson 0 orients the polyglot** — what Rust is for, `rustup` / `cargo` / `crates.io`, why the compiler is a co-teacher, and the sandbox honesty the rest of the scroll depends on: **Piston ships Rust 1.68.2**, std-only. Anything stabilized after 1.68 appears in prose with a "newer Rust" marker, never in a kata. Deliberately not taught (named-and-deferred, each with its failure mode and a deep-dive pointer): async/`tokio`, web frameworks, FFI, embedded/`no_std`, `unsafe`, advanced lifetimes (HRTBs, variance), macros, proc macros.

Dead ends we actively avoid: dumping the ownership rules as a memorized triple before the learner has felt any of them; teaching `unsafe` early "to show what's underneath" (it teaches the worst possible intuition — that `unsafe` is a shortcut around the borrow checker); teaching async without a runtime; treating compile errors as failures instead of as the curriculum itself; `read` steps as tour-guide prose re-explaining variables and `if/else` to a working developer. A note on tone: when the compiler says something, the scroll quotes the actual `rustc` output verbatim — real error codes (`E0382`, `E0499`, `E0502`, `E0004`) appear in the prose because they appear on the learner's terminal.

## 2. Course Authoring Profile

> Course-level voice and authoring decisions for the Rust track. Per [`docs/courses/README.md`](../README.md) §8.1. The Rust scroll inherits these defaults; each lesson's spec deviations are declared in the inner spec's §2 Authoring Notes.

**Voice & angle.** Rust-the-language-with-the-compiler-as-co-author. The audience is the polyglot (JS/TS senior, Java senior, TS modernizer) who needs to read Rust by Friday and write a small CLI tool by Monday — not a systems programmer learning what a stack frame is. We do not apologise for the borrow checker, we do not soften when the language is genuinely strange ("`String` and `&str` are not the same thing, and the difference matters in every function signature"), and we do not perform sympathy for the cliff — we prepare the learner to climb it. The borrow checker is right; the scroll is the second in the learner's corner.

**Step density & rhythm.** Higher prose-per-step than the framework default: **300-400 words per `read` step**. Rust surprises with compiler refusals, not object-model curiosities; the prose budget exists to *frame* what the compiler is about to say and *explain* what the learner just saw. Prose is in dialogue with compiler output — a paragraph that explains ownership without terminating in a green check or a quoted `rustc` message is rejected (the borrow-check test, inner spec §2.1). Rust is the longest scroll in the catalog: ~120 min, at the ceiling of the 60-120 range per [`README.md`](../README.md) §4.2, justified by the one from-scratch mental model.

**Interactivity menu.**

- **IN:** `read`, `read+inline`, `exercise` (kata), `challenge` (including the scroll capstone per README §5.3), `predict`, `playground` (`kata` with `data.kind: "playground"`, inherited from Ruby).
- **Predict ratio (the format exception's visible surface):** 5 predicts in 25 steps (20%), above the 10-15% heuristic, sanctioned by the Rust-scoped exception. Four of five use the native form: "does this compile? what does rustc say?" with the reveal quoting actual 1.68.2 output.
- **OUT:** `trace`. Rust's runtime has no steppable surface that earns the authoring cost. The compiler's reasoning is already observable in error output, and the "predict the error code" pattern covers it as a `predict` shape — no new step type (per [`INTERACTIVITY-PATTERNS.md`](../INTERACTIVITY-PATTERNS.md) §Anti-patterns).

**Figures menu** *(per the S028 mandate: figures where they earn their place, ≥1 `disambiguation`; max 2 figures per read step).*

- **IN, committed:** **`disambiguation`** — *primary landing: Lesson 2, `String` vs `&str`* with **Ownership** as the divergent attribute (owns-the-heap-buffer vs borrowed-view, cascading to mutability, function-signature defaults, and the `.to_string()` boundary). This is the pair every polyglot conflates in week one. Satisfies the ≥1 mandate.
- **IN, committed (promoted from proposed at the Phase A panel review, 2026-06-11):** second `disambiguation` in Lesson 1 — `Copy` vs `Clone`, divergent attribute **Explicitness** (implicit bitwise duplication vs explicit, possibly-expensive call); **`before-after`** in Lesson 3 — `match`-on-`Result` ladder vs `?` propagation, the verbose-collapses-to-idiom contrast; **`tabbed-card`** in Lesson 4 — `<T: Trait>` / `impl Trait` / `Box<dyn Trait>` as three tabs over the same behavior contract, dispatch strategy as the per-tab delta.
- **OUT:** `array-track` (no comprehension-shaped content), `two-by-two` (a "dispatch × position" grid was considered for Lesson 4 and rejected — the tabbed-card covers it without forcing orthogonality), `sequence-play` / `grid-canvas` / `recursion-stack` (none earned; `sequence-play` becomes a candidate in a future async deep-dive for executor stepping, not before).

**Pedagogical bets.**

1. **Compiler-error reveals as the load-bearing teaching surface.** Each "does this compile?" `predict` calibrates its wrong-answer options to the specific polyglot reflex that would produce them (JS: "references are just references"; Java: "the GC handles this"; C: "the compiler warns and lets it through"). The reveal quotes the actual `rustc` output with its error code. *First use:* Lesson 1. *Failure mode without it:* learners memorize the three ownership rules as trivia.
2. **Worked-error-then-fix katas (fail-by-design).** Several katas ship intentionally non-compiling starter code; the learner reads the `rustc` output and makes the minimal change that compiles AND passes the assertions. Borrowed from Rustlings. *First use:* Lesson 1. *Failure mode without it:* learners never internalise that the compiler is a collaborator.
3. **Retrieval interleaving across the ownership → borrowing → traits → matching arc.** Lesson 2's `&T`/`&mut T` reappears silently in Lesson 4's `&self` signatures; Lesson 3's `Result` returns in the capstone; Lesson 5's exhaustiveness explains why Lesson 3's `match` worked. *Failure mode without it:* hermetic lessons; the learner never sees that ownership is the substrate of everything.
4. **Footgun awareness, not footgun fear.** Every named-but-not-taught topic (`unsafe`, lifetimes at depth, trait objects, async, macros, `Rc<RefCell<T>>`) gets one sentence: the failure mode plus a deep-dive pointer. *Failure mode without it:* learners reach for `Box<dyn Trait>` because the scroll showed the syntax but not the cost.
5. **Sandbox-honesty markers.** Rust has the largest sandbox-vs-reality gap in the catalog: Piston Rust **1.68.2**, std-only, no `tokio`/`serde`/`thiserror`/`anyhow`, no `cargo test`. Lesson 0 declares the version; Lesson 3 names the error-crate gap; Lesson 6 names the async gap. Idioms requiring >1.68 live in prose with a "newer Rust" marker, never in a kata. *Failure mode without it:* learners assume the gap is Rust's, not the sandbox's.

**Maintainer experts.** S8 Björn Lindqvist (compiler-as-tutor discipline + the format exception's scope), S5 Elif Yıldız (cognitive-load sizing of the one from-scratch model), S2 Valentina Cruz (paragraph-test enforcement), S11 Maya Lindqvist (predict/playground/read+inline review). S12 Felix Park only if a lesson proposes a new animation runtime; default is none.

## 3. Scroll Catalog

| Slug | Kind | Steps (target) | Time (target) | Status |
|---|---|---|---|---|
| `rust` | Language scroll (crash course) | 25 | ~120 min | **Spec promoted to canon 2026-06-11 (S028 W1)** — outer + inner spec finalised with capstone + production-gesture audit at outline; lesson prose targets W2; seed + per-batch smoke W3 |

That is the whole catalog for Rust in v1. Per [ADR 022](../../adr/022-crash-course-pivot.md), one language scroll per language is the anchored set.

**Why 120 min, not 90-100.** Rust is the only scroll where the central difficulty is a from-scratch mental model rather than an idiom delta. Compressing ownership/borrowing to 90 min produces either three-rules-memorize pedagogy or undersized kata practice. Björn (S8) signed off with the constraint that the extra time is spent on ownership/borrowing/`Result` katas, not on surveying more syntax. If post-authoring the time creeps past 120, the cut order (panel-corrected, 2026-06-11) is: Lesson 1's playground first, then fold predict 4.2 into read 4.1 as a `read+inline` micro-quiz, then trim read 6.1. **Katas are exempt from the cut list** — cutting a written gesture would contradict the exercise-share defense (inner spec §7); every cut candidate is a non-writing step. Don't cut Lessons 1-2 — the scroll exists for them.

### 3.1 Future deep-dive candidates (not in scope for v1)

Salvaged and consolidated from the pre-pivot course track (the seven-course, ~118-step design this file replaces — see git history for the full shape). Listed so the crash scroll can name-and-defer without inventing on the spot:

- **`rust-async-with-tokio`** — the full async story: `Future`, `Poll`, `Waker`, `Pin`, the `tokio` runtime, structured concurrency. Largest deferred surface; requires a bundled-image Piston plan. The pre-pivot draft's std-only toy executor (a `Ready<T>` leaf future, a `CountTo` self-waking future, a 50-line run loop) survives as this deep-dive's conceptual on-ramp — it was honest pedagogy, wrong scroll.
- **`rust-lifetimes-and-borrowing-deep`** — explicit annotations, the three elision rules, `'static`, variance in one paragraph, interior mutability (`Cell`/`RefCell` and the runtime-panic-as-lesson exercise), `Rc<RefCell<T>>` vs the arena pattern, `Cow<'_, T>`. "You've felt the borrow checker; now learn its grammar."
- **`rust-traits-deep`** — associated types vs generic parameters, blanket impls, orphan rules, supertraits, trait objects with lifetimes, `From`/`Into`, `Deref` coercion, `Drop`, manual `PartialEq` on a field subset.
- **`rust-iterators-deep`** — implementing `Iterator` (the `Fibonacci` and windowed-slices exercises from the pre-pivot draft), adaptors, `collect::<Result<Vec<_>, _>>()`, and the pre-pivot draft's best exercise idea: *refactoring an overcomplicated iterator chain back into a loop* — the only exercise where the right answer is fewer iterators.
- **`rust-unsafe-and-ffi`** — the five superpowers, `split_at_mut` as the canonical justified-`unsafe`, raw pointers, `extern "C"`, the Rustonomicon. "What the borrow checker can't prove and you can."
- **`rust-macros-declarative-and-procedural`** — `macro_rules!` (the `vec_of!` and `assert_close!` exercises from the pre-pivot draft are keepers), then proc macros read-only (Piston cannot build a proc-macro crate).
- **`rust-testing-deep`** — `#[test]`, `#[should_panic]`, `Result`-returning tests with `?`, table-driven tests, the property-testing impulse. Salvaged from the pre-pivot optional testing course; hard-gated on Piston supporting `cargo test` or `rustc --test`, which it currently does not.
- **`rust-embedded`** — `no_std`, different audience entirely; ships if an embedded-shaped sandbox ever exists.

None of these are committed.

## 4. The Rust Scroll

**Slug:** `rust`
**Kind:** Language scroll (crash course)
**Audience:** per [`AUDIENCE.md`](../AUDIENCE.md) — **Primary:** A1 Mariana (JS senior) + A3 Yui (Java senior) + A4 Felipe (TS modernizer). **Secondary:** A2 Esteban (Python mid-senior). No out-of-scope persona — Rust is the one scroll all four personas converge on.
**Learner time:** ~120 minutes (at the 60-120 ceiling).
**Spec file:** [`rust/rust.md`](rust/rust.md) — the executable authoring brief.

**Learning outcomes.** After this scroll, the learner can:

- Locate Rust on their language map: what it's for, `rustup`/`cargo`/`crates.io`, how a project is structured, and why the compiler is the primary feedback channel. Predict the first command to run on a cloned Rust project.
- **Read compiler errors confidently** — the load-bearing outcome. Recognise `E0382` (move after use), `E0499` (second mutable borrow), `E0502` (mutable+immutable conflict), `E0277` as an error family (its `?`-operator form and its unsized-`dyn`-argument form), and `E0004` (non-exhaustive match). Predict which error a snippet produces before running it; apply the `help:` suggestions.
- Reason about ownership: predict moved/borrowed/copied at a function boundary; explain why `String` is not `Copy`; fix a use-after-move without reflexive `.clone()`.
- Read and write borrowing: `&T`, `&mut T`, the aliasing-XOR-mutation rule. Recognise the lifetime annotation `'a` when elision can't infer it, and know its depth is a deep-dive (lifetimes-lite).
- Use `Result<T, E>` and `?` as the error model; hand-write a custom error enum with `From` (sandbox-honest: `thiserror` named-and-deferred); treat `unwrap`/`expect` as invariant assertions, not shortcuts.
- Define a struct, write `impl` blocks, define and implement traits, and choose between `<T: Trait>`, `impl Trait`, and `Box<dyn Trait>` by dispatch need — with static dispatch as the default.
- Define enums and `match` exhaustively on them; use `Option<T>` as the null replacement and `if let` for one-arm matches.
- **Beat the capstone:** a log-triage function integrating borrowing, errors-as-values, a trait impl, and exhaustive matching (Lessons 2, 3, 4, 5) into one small real deliverable.
- Name the deferred footguns (`unsafe`, lifetimes at depth, async, macros, `Rc<RefCell<T>>`, trait objects) and which deep-dive owns each.

**Production-gesture audit (README §4.4, done at outline).** The 2-3 gestures a working Rust developer performs daily, each *written* in a kata:

1. **Define a struct + `impl` block** (a method taking `&self`) — written in Lesson 4's trait kata, repeated in the capstone.
2. **Match exhaustively on an enum / `Option` / `Result`** — written in Lesson 5's `Shape`/`area` kata (enum the learner defines), Lesson 5's `first_even` (Option), and Lesson 3's katas (Result).
3. **Write a function taking `&str` (not `String`) and returning borrowed data** — written in Lesson 2's `first_word` kata; the signature default every later kata holds.

A fourth daily gesture — a `Result`-returning function propagating with `?` — is covered by both Lesson 3 katas and the capstone.

**Lessons (polyglot-first order, 25 steps).**

- **Lesson 0 — Rust in context.** What Rust is for and isn't, `rustup`/`cargo`/`crates.io`, the compiler-as-tutor frame, sandbox honesty (Rust 1.68.2 declared, "newer Rust" marker policy). 2 steps: 1 `read` + 1 `predict`.
- **Lesson 1 — Ownership: the mental model that replaces the GC.** Move semantics, `Copy` vs owned, drop, the first `E0382` reveal, the three responses to a move error. 5 steps: 1 `read`, 1 `predict`, 2 `kata` (fix-the-move; take-and-give-back), 1 `playground`.
- **Lesson 2 — Borrowing and references.** `&T`, `&mut T`, aliasing-XOR-mutation, `&str` as the signature default (committed `disambiguation` figure), lifetimes-lite (`'a` named once). 5 steps: 1 `read`, 1 `predict` (`E0499`), 1 `kata` (`first_word`), 1 `read+inline` (the `E0499` error walked line by line), 1 `kata` (fix the overlapping borrows).
- **Lesson 3 — `Result`, `?`, and errors as values.** `match`-on-`Result` then the `?` desugar, the `E0277` "`?` in a function that doesn't return `Result`" sample, custom error enum + `From`, `unwrap`/`expect` honesty. 3 steps: 1 `read`, 2 `kata`.
- **Lesson 4 — Traits and generics: interfaces with a twist.** Delta-framed: behavior contracts ≈ interfaces, but static dispatch by default; `impl Trait`; `Box<dyn Trait>` as the heterogeneity escape hatch; `derive`. 4 steps: 1 `read`, 1 `predict`, 2 `kata` (define a struct + implement a trait; generic function with a bound).
- **Lesson 5 — Enums, `Option`, and exhaustive `match`.** Delta-framed: enums ≈ discriminated unions/sealed types, but the compiler enforces exhaustiveness (`E0004` reveal); `Option<T>`; `if let`. 4 steps: 1 `read`, 1 `predict` (`E0004`), 2 `kata` (`Shape`/`area`; `first_even`).
- **Lesson 6 — Integration: the capstone.** The named-and-deferred map (what we deliberately didn't teach, with deep-dive pointers), then the capstone challenge: **log triage** — `fn summarize(log: &str) -> Result<Summary, LogError>` with a `Level` enum, exhaustive matching, `?` propagation, and `impl Display for Summary`. Integrates Lessons 2, 3, 4, 5 (named in the instruction per README §5.3). 2 steps: 1 `read`, 1 `challenge` (capstone).

The full step-by-step authoring lives in [`rust/rust.md`](rust/rust.md).

**Polyglot-first rationale.** The textbook order (types → variables → functions → control flow → ownership) is right for a beginner. The polyglot already has everything except ownership, and will hit `E0382` in their first non-trivial Rust file regardless — so ownership lands in Lesson 1, within the first 25 minutes. **No syntax warm-up lesson** (Björn's veto): the 5 minutes re-teaching `let`/`fn`/`if` is 5 minutes not spent reading their first `rustc` error; unfamiliar syntax is explained inline where it appears.

**Sandbox notes.** Piston Rust **1.68.2** (declared in Lesson 0; pinned, not assumed). Std-only, single-file `rustc` + run — no `cargo`, no external crates, **no `cargo test`**. Test harness is the manual `_t`/`_eq` pattern consistent with Ruby and Python (see inner spec §5), emitting the `__DOJO_RESULT__ <json>` footer. Any idiom stabilized after 1.68 moves to prose with a "newer Rust" marker, never a kata. Quoted compiler output is captured from 1.68.2 at smoke. Compile-latency budget 10-15s/step pending smoke. Deterministic only: no `Instant` in assertions, no `HashMap` iteration order (use `BTreeMap` or sort), no STDIN.

**Reference material for this scroll specifically.** *The Rust Programming Language* ch. 4/6/9/10 (the spine); *Programming Rust, 2nd ed.* for trait/dispatch precision; *Rust for Rustaceans* for the named-and-deferred discipline; the `rustc` error index (quoted by code); Rustlings (the "make this compile" pattern, adapted not copied).

## 5. Cross-lesson exercise patterns

- **Pure functions over slices.** `fn name(input: &[T]) -> U`. Default shape across lessons.
- **Fix-the-compiler-error katas (fail-by-design).** Starter code intentionally fails to compile; the learner reads the `rustc` output and makes the minimal change that compiles AND passes the runtime assertions. The compiler verdict is the first half of the test. Lessons 1 and 2.
- **Ownership-respecting builds.** Produce the output without unnecessary clones; from Lesson 2 onward, clones in reference solutions are smells called out in `alternative_approach`.
- **Trait implementations on learner-defined types.** Define a struct, implement a trait for it, consume it generically. Lesson 4 and the capstone.
- **`Result`-returning functions with `?`.** Every Lesson 3 kata and the capstone; tests cover both arms.
- **Predict-then-implement pairs.** The `predict` snippet becomes (or shapes) the next kata's starter; the learner forms the hypothesis, sees the rustc answer, then writes code that depends on the model. Lessons 1, 2, 5.
- **Error-code vocabulary surfacing.** `E0382`, `E0499`, `E0502`, `E0277`, `E0004` are named in reads and asked for in predicts. Rust-specific: no other scroll has an error-code vocabulary to teach.

**Piston constraint reminder:** stdlib only — no `tokio`, `serde`, `thiserror`, `anyhow`, `rand`, `chrono`. No `cargo add`/`install`/`test`. Every exercise reproducible from a single Rust file under rustc 1.68.2.

## 6. Known pedagogical pitfalls

- **Teaching lifetimes explicitly before learners hit them.** The most common Rust-teaching failure. *The scroll names `'a` exactly once (Lesson 2, in the elision-prompt context) and defers depth. Lifetimes-lite is the contract: recognizable, not writable.*
- **Teaching async before sync ownership is solid.** *No async whatsoever. Lesson 6's closer names the gap in one sentence with the sandbox reason.*
- **Teaching `unsafe` as a hack around the borrow checker.** *Not taught. Lesson 6 names it with the failure mode explicit: `unsafe` is for soundness you can prove and the compiler can't — not for borrows you'd rather not think about.*
- **Trait objects before generics.** The Java/C# reflex maps interfaces → `Box<dyn Trait>`. *Lesson 4 teaches generics first; `dyn` is the answer when heterogeneity demands it.*
- **`clone()` to silence the borrow checker.** *Legitimate in Lesson 1 (borrowing doesn't exist yet); a named smell from Lesson 2 onward; absent from reference solutions by Lesson 4.*
- **`String` everywhere, ignoring `&str`.** *Lesson 2's read + figure make `&str` the signature default; katas hold it.*
- **Treating compile errors as failures.** *They are the curriculum — fail-by-design katas are structurally central per the format exception, and the voice never apologises for an error.*
- **Letting the format exception leak.** The exception covers ownership/borrowing/lifetimes-lite only. *A traits or enums paragraph that teaches from scratch instead of as a delta is out of contract — the inner spec's §2.2 gate rejects it. And Go/TS authors citing "Rust did it" get pointed at the sprint decision: the exception is Rust-scoped.*
- **`expect("this should never happen")` as anxiety.** *`expect` strings are invariant claims ("non-empty by construction"), modeled in Lesson 3.*
- **Teaching `?` before `match` on `Result`.** *`?` is sugar; Lesson 3 shows the `match` form first, then collapses it — the desugaring is the lesson (and the committed `before-after` figure).*
- **Asking learners to fight the borrow checker before they trust it.** *Each compiler-error reveal is preceded by a predict that makes the error the expected answer to a hypothesis, not an ambush.*

## 7. External references

### Books

- *The Rust Programming Language* (free) — Klabnik & Nichols. <https://doc.rust-lang.org/book/>. Ground truth for ordering and definitions; ch. 4 maps to Lessons 1-2, ch. 9 to Lesson 3, ch. 10 to Lesson 4, ch. 6 to Lesson 5.
- *Programming Rust, 2nd ed.* — Blandy, Orendorff, Tindall. Denser on the type system; the Lesson 4 reference.
- *Rust for Rustaceans* — Jon Gjengset. Informs the named-and-deferred discipline (error handling for libraries vs binaries → Lesson 3's `thiserror` deferral).
- *The Rustonomicon* (free) — <https://doc.rust-lang.org/nomicon/>. Named in Lesson 6's closer for the future `unsafe` deep-dive.
- *Asynchronous Programming in Rust* (free) — <https://rust-lang.github.io/async-book/>. The async deep-dive's entry point; its ch. 2 toy executor is the salvaged pre-pivot on-ramp.
- *Rust Atomics and Locks* — Mara Bos. Future concurrency/interior-mutability framing.
- *Zero to Production in Rust* — Luca Palmieri. The "what comes next" for production async, named in Lesson 6.
- *Rust in Action* — Tim McNamara. Future `unsafe` deep-dive reference.
- *Hands-on Rust* — Herbert Wolverson. Exercise-inspiration reservoir, not directly cited.
- *The Little Book of Rust Macros* — Daniel Keep. The `macro_rules!` reference for the macros deep-dive.

### Online platforms

- **Rustlings** — <https://github.com/rust-lang/rustlings>. The closest analog to this scroll's pedagogy; the "make this compile" pattern is borrowed wholesale (`move_semantics/`, `structs/`, `enums/`, `options/`, `error_handling/` inspire the kata shapes). Adapt, don't copy.
- **Exercism Rust track** — <https://exercism.org/tracks/rust>. Exercise reservoir at the iterator/trait level.
- **Rust by Example** — <https://doc.rust-lang.org/rust-by-example/>. Runnable official examples; learner "what next" material.
- **Google's Comprehensive Rust** — <https://google.github.io/comprehensive-rust/>. Best ordering/pacing in the industry; cross-check Lessons 1-2 against it.
- **Jon Gjengset's "Crust of Rust"** — the recommended next step after the scroll; named in Lesson 6's closer.
- **Ardan Labs Rust Foundations** / **Udemy "Ultimate Rust Crash Course"** (Nathan Stocks) — commercial intros; scope sanity checks only, no content reuse.

### Official documentation

- **The Rust Book** — <https://doc.rust-lang.org/book/> · **The Rust Reference** — <https://doc.rust-lang.org/reference/> · **std API docs** — <https://doc.rust-lang.org/std/> (every type has runnable examples — the underrated resource).
- **The Rust error code index** — <https://doc.rust-lang.org/error_codes/error-index.html>. Quoted by code in Lessons 1-5; `rustc --explain` is taught as a habit in Lesson 2's read+inline.

### Community learning resources

- **This Week in Rust** — <https://this-week-in-rust.org/>. Post-scroll learner material.
- **users.rust-lang.org / r/rust** — sourcing real beginner pain points; the most-asked lifetime questions inform Lesson 2's framing.
- **Niko Matsakis's blog** — reference for the future lifetimes deep-dive, not the crash.

## 8. Implementation order

One Rust scroll to ship; order applies to its lessons:

1. **Lesson 0 — Rust in context.** Establishes the voice gate and the sandbox-honesty discipline (1.68.2 declared, "newer Rust" marker policy). W2.
2. **Lesson 1 — Ownership.** Establishes the kata shape (manual harness), the first "does this compile?" predict, the first reveal (`E0382`), the playground. Highest-stakes lesson — if learners drop here, nothing else saves the scroll. W2.
3. **Lesson 2 — Borrowing and references.** Second reveal (`E0499`), the committed `String`-vs-`&str` disambiguation figure, lifetimes-lite, the error-code `read+inline`. Second highest-stakes. W2.
4. **Lesson 3 — `Result` and `?`.** Errors-as-values; the `thiserror`/`anyhow` sandbox-honesty marker. W2.
5. **Lesson 4 — Traits and generics.** Delta-framed; production gesture #1 (struct + impl). W2.
6. **Lesson 5 — Enums, `Option`, `match`.** Third reveal (`E0004`); production gesture #2. W2.
7. **Lesson 6 — Integration.** The deferral map + the capstone. Authored last but **designed first** — the capstone was sketched at outline stage and the lesson set validated against it per README §5.3 (personas must be able to attack it with only the outlined lessons; the attack sketches live in the inner spec §4).

**Smoke discipline (per [AUTHORING.md](../AUTHORING.md), S026/S027 lesson twice-proved):** smoke per seeded batch, not at the end. Lesson 1 smokes first — it pins the actual 1.68.2 error strings the predicts quote, validates compile latency, and confirms the harness contract. Quoted compiler output anywhere in the scroll is re-captured from Piston at smoke.

**Playground frontend dependency:** the `data.kind: "playground"` contract shipped with Ruby and is reused by Python; Rust's single playground (Lesson 1) inherits it with no frontend work. If the playground pattern is retired by the time Rust seeds, drop it and re-budget Lesson 1 to 4 steps.
