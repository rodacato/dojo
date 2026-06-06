# Rust Course Track

> Maintainer persona: S8 Björn Lindqvist (Rust educator) + S5 Dr. Elif Yıldız (curriculum architect)
> Last researched: 2026-04-14

## 1. Learning Philosophy for Rust

Rust is the only mainstream language where the compiler is a co-teacher. It refuses to ship code it cannot prove safe, and the error messages it produces — verbose, opinionated, often condescending — are arguably the best free tutorial on systems programming ever written. Any Rust course that does not lean on this is fighting the language. Dojo's pedagogy here mirrors **Rustlings**: the learner runs into a compile error, reads it, fixes it, and the friction *is* the lesson. We do not pre-explain ownership before they have felt it bite. We let them write `let s2 = s1; println!("{}", s1);` and watch the borrow checker do the teaching. Then we explain.

The hardest cliff in mainstream programming education is ownership, borrowing, and lifetimes. There is no analog in Python, JavaScript, Go, or even C — C lets you do the wrong thing silently; Rust refuses, loudly, in the editor. The pedagogical mistake is to front-load all three concepts as theory. The Rust Book itself spent years iterating on this and still treats lifetimes as a chapter learners "earn." We follow that lead: ownership in fundamentals (because you cannot write three lines without it), borrowing in fundamentals (because functions need arguments), but **lifetime annotation syntax (`'a`) is deferred to an advanced course**, after the learner has hit the elision rules and asked "why does this one need a tick?" That question is the prerequisite. Anything earlier is cargo-cult syntax memorization.

The idiom layer matters as much as the safety layer. A Rust course that produces learners who write Java-in-Rust has failed. The non-negotiables: `Result<T, E>` and `?` over exceptions, `match` exhaustiveness as a design tool (not a switch statement), iterator combinators over index loops, `trait` over inheritance, `Option<T>` over null. These are not stylistic preferences in Rust — they are the path of least resistance once you stop fighting the type system. Every course in this track teaches at least one of these idioms by forcing the learner into a corner where the idiomatic answer is the easy answer.

Dead ends to actively avoid: dumping the ownership rules as a memorized triple ("one owner, many readers, one writer") before the learner has felt any of them; teaching `unsafe` early to "show what's underneath" (it teaches the wrong intuition — `unsafe` is a last resort, not a foundation); teaching async before futures and `Poll` are motivated by an actual blocking problem (otherwise `async fn` is just colored magic). Rust rewards patience. The course should too.

## 2. Course Tree Overview

| Course | Level | Prereqs | Steps (approx) | Status |
|---|---|---|---|---|
| rust-fundamentals | Basic | — | ~22 | proposed |
| rust-error-handling | Intermediate | rust-fundamentals | ~16 | proposed |
| rust-traits-generics | Intermediate | rust-fundamentals | ~18 | proposed |
| rust-iterators | Intermediate | rust-fundamentals | ~16 | proposed |
| rust-lifetimes-borrowing | Advanced | rust-traits-generics, rust-iterators | ~18 | proposed |
| rust-async-foundations | Advanced / Specific | rust-traits-generics, rust-lifetimes-borrowing | ~14 | proposed |
| rust-unsafe-macros | Specific / Advanced | rust-lifetimes-borrowing | ~14 | proposed |
| rust-testing-patterns | Specific | rust-error-handling | ~10 | proposed (optional) |

Total: ~118 steps across 7 core courses. The optional eighth course (testing) is small but useful if Piston supports `cargo test`; flagged in section 4.

## 3. Sub-courses

### 3.1 Rust Fundamentals — Basic

**Slug:** `rust-fundamentals`
**Prereqs:** Familiarity with at least one statically-typed or dynamic language. Comfort reading compiler errors.
**Learner time:** ~8 hours
**Learning outcomes:**
- Read and write basic Rust syntax: `let`, `fn`, `mut`, `if`, `loop`, `while`, `for`.
- Distinguish stack vs. heap types via `Copy` vs. owned (`String`, `Vec<T>`).
- Predict ownership transfer at function boundaries and explain a "moved value" error.
- Use `&T` and `&mut T` references, respecting the aliasing-XOR-mutation rule.
- Define and destructure `struct` and `enum`, including `Option<T>`.
- Use `match` for exhaustiveness; reach for `if let` when match is overkill.

**Lesson 1: Hello, compiler**
- Step 1 (explanation): Rust's value proposition in two sentences. The compiler is a teacher, not an obstacle. How Piston runs your code in this course (single-file, std-only).
- Step 2 (exercise): Print `"Hello, dojo"`. Trivial — the point is to see the toolchain work and read a "main not found" error if you delete it. Test asserts stdout.
- Step 3 (explanation): `let`, `let mut`, type inference vs. annotation. Shadowing.
- Step 4 (exercise): Given a block that fails to compile because of mutation through an immutable binding, fix it. **The compile error IS the lesson.**

**Lesson 2: Scalar and compound types**
- Step 1 (explanation): Integer types (`i32`, `u64`, `usize`), `f64`, `bool`, `char`, tuples, arrays.
- Step 2 (exercise): Implement `fn fahrenheit_to_celsius(f: f64) -> f64`. Test on three known values.
- Step 3 (exercise): Return a tuple `(min, max)` from a slice of `i32`. Forces them into iterator-light territory without selling iterators yet.

**Lesson 3: Functions, control flow, expressions**
- Step 1 (explanation): Everything is an expression. `if` returns a value. `loop` with `break value`.
- Step 2 (exercise): FizzBuzz, but as a function returning `Vec<String>` so we can assert deterministically.
- Step 3 (challenge): Implement `nth_fibonacci(n: u32) -> u64` iteratively. Tests cover n=0, 1, 10, 50.

**Lesson 4: Ownership, the first cliff**
- Step 1 (exercise): Given `let s1 = String::from("dojo"); let s2 = s1; println!("{}", s1);` — make it compile. The compiler error names the move; the fix is `clone()` or rearranging. **The error is the teacher.**
- Step 2 (explanation): Move semantics, `Copy` types, why `String` isn't `Copy`. The drop model.
- Step 3 (exercise): Write `fn takes_and_gives_back(s: String) -> String` and use it correctly from `main`.

**Lesson 5: Borrowing and references**
- Step 1 (explanation): `&T` immutable borrow, `&mut T` mutable borrow, the aliasing rule.
- Step 2 (exercise): Write `fn longest(a: &str, b: &str) -> &str`. **This will trigger a lifetime error.** Provide a hint that says: "the compiler is asking a question we will answer in the lifetimes course. For now, return one of them by length using `if a.len() >= b.len()` and accept the suggested annotation if the compiler offers one."
- Step 3 (exercise): `fn append_exclamation(s: &mut String)` — mutate in place.

**Lesson 6: Structs and enums**
- Step 1 (explanation): `struct`, tuple struct, unit struct. `impl` blocks. `&self` vs. `self` vs. `&mut self`.
- Step 2 (exercise): Define `Rectangle { width, height }` with `area()` and `can_hold(&self, other: &Rectangle) -> bool`.
- Step 3 (explanation): `enum` as sum type. The contrast with C-style enums.
- Step 4 (exercise): Implement `enum Shape { Circle(f64), Square(f64), Rect(f64, f64) }` and a function `area(s: &Shape) -> f64` using `match`.

**Lesson 7: `Option<T>` and pattern matching**
- Step 1 (explanation): Why null is gone. `Option<T>::Some` vs. `None`. The cost of unwrapping.
- Step 2 (exercise): `fn first_even(v: &[i32]) -> Option<i32>` returning the first even number.
- Step 3 (challenge): Implement a tiny `enum Json { Null, Bool(bool), Num(f64), Str(String) }` and a function that pretty-prints it. Forces nested matches.

**Piston considerations:** All exercises are single-file, std-only, deterministic. Lesson 5 step 2 will likely require lifetime annotation `'a` to compile — the hint should pre-supply the signature `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str` or accept either form. This is the one place in fundamentals where we knowingly cheat: we tell them to copy the syntax and trust it for now. Flag for reviewer.

**Reference material:**
- Book: *The Rust Programming Language* (Klabnik & Nichols) — chapters 1-6 map almost 1:1 to lessons 1-7. Use as ground truth for ordering.
- Book: *Programming Rust, 2nd ed.* (Blandy, Orendorff, Tindall) — denser on the type system; useful for crisper definitions in explanation steps.
- Docs: <https://doc.rust-lang.org/book/>
- Community reference: Rustlings exercises in `intro/`, `variables/`, `functions/`, `if/`, `move_semantics/`, `structs/`, `enums/`, `options/` — borrow the "make this compile" pattern wholesale.

---

### 3.2 Rust Error Handling — Intermediate

**Slug:** `rust-error-handling`
**Prereqs:** `rust-fundamentals`
**Learner time:** ~5 hours
**Learning outcomes:**
- Use `Result<T, E>` as the default fallible return type.
- Apply `?` to propagate errors up the stack.
- Distinguish recoverable errors from `panic!`-worthy invariant violations.
- Define a custom error enum with `Display` and `From` implementations.
- Convert between error types at boundaries without `.unwrap()` reflexes.

**Lesson 1: `Result<T, E>` and the `?` operator**
- Step 1 (explanation): Why exceptions are a category mistake in systems code. `Result` as a value.
- Step 2 (exercise): `fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError>`. Use `s.parse::<i32>()?`.
- Step 3 (exercise): Chain two parses. The `?` operator does the work; the test asserts both success and failure paths.

**Lesson 2: `panic!` vs. `Result`**
- Step 1 (explanation): The decision matrix. Invariant violation in code-you-control = `panic!`. Anything coming from outside (input, parsing, IO) = `Result`. `unwrap()` and `expect()` as honest assertions, not lazy shortcuts.
- Step 2 (exercise): Refactor a function that uses `unwrap()` into one that returns `Result`. The old version's tests pass; new tests cover the `Err` arm.

**Lesson 3: Custom error types**
- Step 1 (explanation): Why `Box<dyn Error>` is fine for binaries and bad for libraries. Defining `enum AppError { Parse(...), Empty, OutOfRange }`.
- Step 2 (exercise): Implement `Display` for the enum manually. **No `thiserror` — Piston has no crates.** This is a flag: in the real world you would derive it; here we hand-write to make the trait explicit.
- Step 3 (exercise): Implement `From<ParseIntError> for AppError` so `?` works across error types.

**Lesson 4: Putting it together**
- Step 1 (challenge): A mini CSV-line parser. Input: `"name,age,score"`. Output: `Result<Record, AppError>`. Three failure modes: wrong field count, non-numeric age, score out of 0..=100. Test all four arms (success + 3 errors).

**Piston considerations:** Cleanly std-only. The compromise: idiomatic Rust uses `thiserror` and `anyhow`. We must explicitly tell learners "in production you would derive this; here you write it by hand to understand what derives." Flag prominently in the lesson 3 explanation step.

**Reference material:**
- Book: *Rust for Rustaceans* (Jon Gjengset) — chapter on error handling in libraries vs. binaries is the cleanest treatment in print.
- Book: *The Rust Programming Language* — chapter 9.
- Docs: <https://doc.rust-lang.org/std/result/>, <https://doc.rust-lang.org/book/ch09-00-error-handling.html>
- Community reference: Rustlings `error_handling/` series. *Zero to Production in Rust* (Luca Palmieri) for error-context patterns at scale (referenced, not required).

---

### 3.3 Rust Traits & Generics — Intermediate

**Slug:** `rust-traits-generics`
**Prereqs:** `rust-fundamentals`
**Learner time:** ~7 hours
**Learning outcomes:**
- Define traits and implement them for owned and foreign-style types.
- Use generic bounds (`<T: Trait>`, `where` clauses).
- Choose between `impl Trait`, generic parameter, and `dyn Trait` based on context.
- Read and use the `derive` family (`Debug`, `Clone`, `PartialEq`, `Eq`, `Hash`, `Default`).
- Understand associated types vs. generic parameters (e.g., `Iterator::Item`).

**Lesson 1: Trait basics**
- Step 1 (explanation): Trait as "behavior contract." Contrast with OO interfaces (no data, no inheritance, but blanket impls).
- Step 2 (exercise): Define `trait Greet { fn greet(&self) -> String; }`. Implement for `struct Person { name: String }`.
- Step 3 (exercise): Add a default method `fn shout(&self) -> String` using `self.greet().to_uppercase()`.

**Lesson 2: Generics and bounds**
- Step 1 (explanation): Monomorphization. Why `<T>` is zero-cost.
- Step 2 (exercise): Write `fn largest<T: PartialOrd + Copy>(list: &[T]) -> T`. Test on `i32` and `f64` (well, `f64` doesn't impl `Ord`, only `PartialOrd` — flag this).
- Step 3 (exercise): Add a `where` clause version of the same function. Cosmetic but important for readability.

**Lesson 3: `impl Trait` vs. generic vs. `dyn Trait`**
- Step 1 (explanation): The three are not interchangeable. `impl Trait` in argument position = anonymous generic. `impl Trait` in return position = "I promise one specific type." `dyn Trait` = runtime dispatch via vtable.
- Step 2 (exercise): Given three function signatures, predict which compile and which don't. Then write a function returning `impl Iterator<Item = i32>` that yields squares.
- Step 3 (exercise): Build a `Vec<Box<dyn Greet>>` with two different concrete types. Iterate and call `greet()` on each. **The point: heterogeneous collections require `dyn`.**

**Lesson 4: The `derive` family**
- Step 1 (explanation): What `#[derive(Debug, Clone, PartialEq)]` actually generates. The cost (compile time) and benefit (no boilerplate).
- Step 2 (exercise): Take a struct missing `Debug` derive, observe the error, fix it.
- Step 3 (challenge): Implement `PartialEq` manually for a struct that should compare on a subset of fields (e.g., `User` compares by `id`, ignoring `last_seen`).

**Lesson 5: Associated types**
- Step 1 (explanation): Why `Iterator` uses `type Item` instead of `Iterator<T>`. Output type uniqueness.
- Step 2 (exercise): Define a tiny `trait Counter { type Output; fn next(&mut self) -> Option<Self::Output>; }` and implement for a struct counting up to a max.

**Piston considerations:** Single-file is fine. Compile time grows with generic instantiations; keep test cases narrow.

**Reference material:**
- Book: *Rust for Rustaceans* — chapter 2 ("Types") and chapter 3 ("Designing Interfaces") are the canonical advanced reference.
- Book: *Programming Rust* — clearest explanation of `dyn` vs. `impl Trait`.
- Docs: <https://doc.rust-lang.org/book/ch10-00-generics.html>, <https://doc.rust-lang.org/reference/items/traits.html>
- Community reference: Jon Gjengset's "Crust of Rust: Iterators" episode for the associated-types model. Rustlings `traits/` and `generics/`.

---

### 3.4 Rust Iterators & Functional Patterns — Intermediate

**Slug:** `rust-iterators`
**Prereqs:** `rust-fundamentals`. Concurrent with `rust-traits-generics` is fine.
**Learner time:** ~5 hours
**Learning outcomes:**
- Build pipelines with `map`, `filter`, `fold`, `collect`.
- Distinguish `iter()`, `iter_mut()`, `into_iter()` and the ownership implications.
- Recognize when iterator chains are clearer than loops, and when they hurt readability.
- Implement the `Iterator` trait on a custom type.
- Use `collect::<Vec<_>>()` and `collect::<Result<Vec<_>, _>>()` (the latter is a chef's kiss).

**Lesson 1: The iterator trait**
- Step 1 (explanation): Lazy evaluation. Nothing happens until you consume. The `Item` associated type.
- Step 2 (exercise): `let v = vec![1, 2, 3, 4, 5]; let sum: i32 = v.iter().sum();` — make it compile, then change to product.
- Step 3 (exercise): Replace a `for` loop that pushes squares with `v.iter().map(|x| x * x).collect()`.

**Lesson 2: Combinators in anger**
- Step 1 (exercise): Given `Vec<&str>`, return a `Vec<String>` of those longer than 3 chars, uppercased.
- Step 2 (exercise): `fn average(v: &[f64]) -> Option<f64>` using `iter().sum::<f64>()` and length check. Returns `None` on empty.
- Step 3 (challenge): Word frequency count. Input `&str`, output `HashMap<String, usize>`. Use `split_whitespace` and `entry().or_insert(0)`. Tests assert deterministic counts.

**Lesson 3: `iter` vs. `iter_mut` vs. `into_iter`**
- Step 1 (explanation): The three flavors and their ownership stories. Why `for x in v` consumes.
- Step 2 (exercise): Given a `Vec<i32>`, double each element in place using `iter_mut`.
- Step 3 (exercise): Take a `Vec<String>`, return a `Vec<usize>` of lengths, **without cloning the strings**. Forces `iter().map(|s| s.len())`.

**Lesson 4: When iterators stop helping**
- Step 1 (explanation): A four-deep iterator chain is harder to debug than the equivalent loop. Heuristic: if you reached for `.skip().take().filter().fold()`, stop and ask if a `for` loop would be honest.
- Step 2 (exercise): Refactor a deliberately overcomplicated chain into a readable loop. **This is the only Dojo exercise where the "right" answer is fewer iterators.**

**Lesson 5: Implementing `Iterator`**
- Step 1 (exercise): Implement `Iterator for Fibonacci` yielding `u64` until overflow, then `None`.
- Step 2 (challenge): Implement a `Window<'a, T>` iterator that yields overlapping slices of size `n`. Tests on `&[1,2,3,4]` with `n=2` should yield `[1,2], [2,3], [3,4]`.

**Piston considerations:** All std. The challenge in lesson 5 will require lifetime annotation — this is intentional foreshadowing for course 3.5.

**Reference material:**
- Book: *Programming Rust* — chapter 15 is the gold standard.
- Book: *The Rust Programming Language* — chapter 13.
- Docs: <https://doc.rust-lang.org/std/iter/trait.Iterator.html>
- Community reference: Jon Gjengset's "Crust of Rust: Iterators" — full hour of implementing the trait. Rustlings `iterators/`.

---

### 3.5 Rust Lifetimes & Advanced Borrowing — Advanced

**Slug:** `rust-lifetimes-borrowing`
**Prereqs:** `rust-traits-generics`, `rust-iterators`
**Learner time:** ~7 hours
**Learning outcomes:**
- Read and write explicit lifetime annotations.
- Recite the three elision rules and predict when they apply.
- Use `Rc<T>`, `RefCell<T>`, and recognize the `Rc<RefCell<T>>` pattern (and its smell).
- Identify when fighting the borrow checker means the design is wrong, not the code.
- Use `Cow<'_, T>` for borrow-or-own returns.

**Lesson 1: Why lifetimes exist**
- Step 1 (explanation): A reference is a promise. Lifetimes are how the compiler enforces the promise. The dangling-pointer problem in C, removed by construction.
- Step 2 (exercise): The classic `fn longest` from fundamentals, now without the hint. Write the signature with explicit `'a`.
- Step 3 (explanation): The three elision rules, with the canonical example for each.

**Lesson 2: Lifetimes on structs**
- Step 1 (explanation): Why `struct Wrapper<'a> { inner: &'a str }` exists. Self-referential structs are a different problem (`Pin`) — out of scope.
- Step 2 (exercise): Define a `Tokenizer<'a>` that holds `&'a str` and yields `&'a str` tokens. Implement `Iterator` on it.

**Lesson 3: Subtyping and variance (light touch)**
- Step 1 (explanation): `'static` vs. shorter lifetimes. Why `&'static str` is special. Variance in one paragraph: covariant in `T` for `&T`, the rest you can look up when it bites.
- Step 2 (exercise): A function that returns `&'static str` vs. one that returns `&'a str` — explain why the test for the first is easier.

**Lesson 4: Interior mutability**
- Step 1 (explanation): The aliasing-XOR-mutation rule, broken safely. `Cell<T>` for `Copy`, `RefCell<T>` for everything else, runtime-checked.
- Step 2 (exercise): Wrap a counter in `RefCell<i32>` and mutate it through `&self`.
- Step 3 (exercise): Trigger a `RefCell` runtime panic by holding two `borrow_mut()` simultaneously. **The panic IS the lesson.** Test with `std::panic::catch_unwind`.

**Lesson 5: `Rc` and the `Rc<RefCell<T>>` smell**
- Step 1 (explanation): Reference counting for shared ownership. Combined with `RefCell`, you get a poor man's GC. This is sometimes the right answer; more often, it is a signal that your data model is wrong.
- Step 2 (exercise): Build a tiny tree with `Rc<RefCell<Node>>` children. Compute total node count.
- Step 3 (challenge): Refactor the same tree to use indices into a `Vec<Node>` (the arena pattern). Compare the two — discuss which is honest Rust.

**Lesson 6: `Cow` (Clone-on-Write)**
- Step 1 (exercise): `fn normalize(s: &str) -> Cow<str>` — return borrowed if already lowercase, owned if you had to allocate.

**Piston considerations:** Std-only is fine. `RefCell` panic exercise must use `catch_unwind` to keep the test deterministic — flag in lesson plan that this is the rare case where we want the panic to happen and assert on it.

**Reference material:**
- Book: *Rust for Rustaceans* — chapter 1 ("Foundations") covers lifetimes at the level this course needs.
- Book: *Programming Rust* — chapters 5 and 9.
- Book: *Rust Atomics and Locks* (Mara Bos) — referenced for the "why interior mutability exists at all" framing.
- Docs: <https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html>, <https://doc.rust-lang.org/std/cell/>
- Community reference: Jon Gjengset's "Crust of Rust: Subtyping and Variance" — the only sane introduction to variance for working programmers.

---

### 3.6 Rust Async Foundations (std-only) — Advanced / Specific

**Slug:** `rust-async-foundations`
**Prereqs:** `rust-traits-generics`, `rust-lifetimes-borrowing`
**Learner time:** ~6 hours
**Learning outcomes:**
- Read the `Future` trait and explain `Poll::Ready` vs. `Poll::Pending`.
- Write a manual `poll` implementation for a leaf future.
- Build a single-file executor that drives futures to completion.
- Articulate why production async needs a runtime (`tokio`, `async-std`) and what Dojo's std-only version omits.

**EXPLICIT FLAG:** This course teaches the *shape* of async Rust, not the production stack. There is no `tokio` here because Piston has no crate access. The course is about understanding what `async fn` desugars to, how `Poll` works, and what an executor does. Anyone writing real async networking code will need to learn `tokio` or `async-std` separately. This is stated in lesson 1 step 1 and again at the end.

**Lesson 1: What `async` actually is**
- Step 1 (explanation): `async fn` is sugar for "function that returns an `impl Future`." A future is a state machine. Nothing runs until something polls it. The `Waker` is how a future says "I'm ready, poll me again."
- Step 2 (exercise): Read a desugared async function (provided). Identify the state machine. No code change — comprehension only, validated by a fill-in-the-blank stdout assertion.

**Lesson 2: The `Future` trait**
- Step 1 (explanation): The trait, in full. `type Output`, `fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>`.
- Step 2 (exercise): Implement a `Ready<T>` future that returns `Poll::Ready(value)` immediately. The simplest possible leaf.
- Step 3 (exercise): Implement a `CountTo` future that returns `Poll::Pending` for the first N polls, then `Poll::Ready(())`. Wakes itself by calling `cx.waker().wake_by_ref()` to demand re-polling.

**Lesson 3: A single-file executor**
- Step 1 (explanation): What a runtime does in 50 lines: queue, poll loop, waker that re-enqueues. We are not building tokio; we are building the toy that explains tokio.
- Step 2 (exercise): Provided: a minimal `Executor` skeleton with a task queue. Fill in the `run` loop that pops a task, polls it, and re-queues if `Pending`. Test by running the `CountTo` future from lesson 2.

**Lesson 4: `async`/`await` on top of the executor**
- Step 1 (exercise): Use `async fn` and `.await` against your toy executor. Two awaiting tasks running on the same single-threaded executor. Assert on completion order.
- Step 2 (challenge): Implement a `join_two` combinator that polls both futures and resolves when both are done. **This is the cliff: you will discover why production runtimes exist.**

**Lesson 5: What we did not teach**
- Step 1 (explanation): No timers (would need OS integration). No IO (would need `epoll`/`io_uring`/`mio`). No work stealing. No `Send + Sync` story for multithreaded executors. Pin and `Unpin` only at surface level. Read *Asynchronous Programming in Rust* (the official book) and *Zero to Production* before shipping anything.

**Piston considerations:** This course pushes Piston's limits hardest. Compile times for executor exercises will be the longest in the track — keep test inputs tiny. **No `tokio` whatsoever.** The exercises must all fit in single files using `std::future`, `std::task::{Context, Poll, Waker}`, `std::pin::Pin`. Constructing a `Waker` from raw vtable parts is fiddly — provide the unsafe scaffolding in starter code so the learner is not also wrestling raw waker construction. Flag for reviewer: this is the one course where starter code carries `unsafe` blocks the learner does not modify.

**Reference material:**
- Book: *Asynchronous Programming in Rust* (the official async book, Rust async working group) — the toy executor in chapter 2 is essentially what this course rebuilds.
- Book: *Rust for Rustaceans* — chapter on async fundamentals.
- Book: *Zero to Production in Rust* (Luca Palmieri) — referenced for context on what production looks like; not used in exercises.
- Docs: <https://rust-lang.github.io/async-book/>, <https://doc.rust-lang.org/std/future/trait.Future.html>
- Community reference: Jon Gjengset's "Crust of Rust: Async/Await" episode is the closest match to this course's vibe.

---

### 3.7 Rust Unsafe & Macros (Deep Cuts) — Specific / Advanced

**Slug:** `rust-unsafe-macros`
**Prereqs:** `rust-lifetimes-borrowing`
**Learner time:** ~5 hours
**Learning outcomes:**
- Identify the five superpowers `unsafe` grants and the invariants the programmer must uphold.
- Write a small `unsafe` block correctly (e.g., dereferencing a raw pointer).
- Write a `macro_rules!` macro with a few match arms.
- Read a derive proc-macro signature and explain what it does, without writing one (procedural macros require a separate crate — Piston-incompatible).

**Lesson 1: When `unsafe` is justified**
- Step 1 (explanation): The five superpowers (deref raw pointer, call unsafe fn, access mutable static, implement unsafe trait, access union field). The mental model: `unsafe` does not turn off the borrow checker for safe code; it lets you write code the compiler cannot prove sound, on the condition that *you* can.
- Step 2 (exercise): Read three small `unsafe` blocks. Mark each as "justified" or "lazy unwrap dressed up as unsafe." Multiple-choice (validated via stdout marker).

**Lesson 2: Raw pointers**
- Step 1 (exercise): Convert `&i32` to `*const i32` and back; deref it inside `unsafe`. Test asserts the value round-trips.
- Step 2 (exercise): Build a tiny `unsafe fn split_at_mut<T>(slice: &mut [T], mid: usize) -> (&mut [T], &mut [T])` — yes, this is in the std book; replicating it is the point. **The learner sees why `unsafe` is needed: the borrow checker cannot prove the two halves are disjoint, but we can.**

**Lesson 3: `macro_rules!` basics**
- Step 1 (explanation): Token tree matching, fragment specifiers (`$x:expr`, `$x:ident`, `$x:ty`), repetition (`$($x),*`).
- Step 2 (exercise): Write a `vec_of!` macro: `vec_of![1, 2, 3]` expands to a `Vec<i32>` containing those values.
- Step 3 (exercise): Write an `assert_close!` macro for `f64` comparison within an epsilon. **This is genuinely useful and the macro shape is small.**

**Lesson 4: Proc macros (read-only)**
- Step 1 (explanation): The three flavors (derive, attribute, function-like). Why they live in their own crate (`proc-macro = true`). Why we cannot run them on Piston. Examples from `serde`, `tokio::main`, `sqlx::query!`.
- Step 2 (exercise): Given a derive macro signature, predict what fields it will access on the input struct. No code execution — comprehension only, validated by stdout marker.

**Piston considerations:** The proc-macro lesson is **read-only** because Piston cannot build a separate `proc-macro` crate. Flag prominently. Macros (`macro_rules!`) work fine in single-file. `unsafe` works fine and tests can assert the result, though clearly a sandbox crash from a miswritten unsafe block will surface as a Piston runtime error rather than a friendly compiler error — this is a teaching opportunity, not a bug.

**Reference material:**
- Book: *Rust for Rustaceans* — chapter on unsafe is the most pragmatic treatment available.
- Book: *Rust in Action* (Tim McNamara) — uses unsafe in earnest for systems-y exercises; useful for context.
- Book: *The Little Book of Rust Macros* (Daniel Keep, ongoing community work) — the `macro_rules!` reference.
- Docs: <https://doc.rust-lang.org/nomicon/> (Rustonomicon — required reading for the unsafe lesson), <https://doc.rust-lang.org/reference/macros-by-example.html>
- Community reference: Jon Gjengset's "Crust of Rust: Declarative Macros" episode.

---

### 3.8 Rust Testing Patterns — Specific (optional)

**Slug:** `rust-testing-patterns`
**Prereqs:** `rust-error-handling`
**Learner time:** ~3 hours
**Status:** Optional, dependent on Piston supporting `cargo test` directly. If Piston only supports `rustc` + run, this course collapses into "writing test functions you call manually from `main`" — still useful but smaller.

**Learning outcomes:**
- Use `#[test]`, `#[should_panic]`, `assert_eq!`, `assert!`.
- Structure tests as a `#[cfg(test)] mod tests`.
- Use `Result<(), E>` return from tests with `?` for cleaner failure paths.
- Recognize the property-testing impulse (and accept that Dojo cannot run `proptest`).

**Lesson 1: The `#[test]` attribute**
- Step 1 (explanation): Test functions, `#[cfg(test)]` modules, `cargo test` (or `rustc --test` — Piston-dependent).
- Step 2 (exercise): Add three test cases for a provided `add` function. One passes, two intentionally fail until the implementation is fixed.

**Lesson 2: Asserting on errors**
- Step 1 (explanation): `#[should_panic]`, `#[should_panic(expected = "...")]`, the `assert!(matches!(...))` pattern for `Result`.
- Step 2 (exercise): A function that returns `Result<i32, String>`. Test both arms.

**Lesson 3: `Result<(), E>` returning tests and `?` in tests**
- Step 1 (exercise): Convert tests that use `.unwrap()` to tests that return `Result` and use `?`. The failure messages get cleaner.
- Step 2 (challenge): A table-driven test using a `Vec<(input, expected)>` and a single `for` loop calling `assert_eq!`.

**Piston considerations:** **Hard dependency on Piston supporting `cargo test`** or at minimum `rustc --test`. If neither, drop this course or rewrite as "manual test runner you write yourself." Flag for reviewer — this is the open question that gates the course.

**Reference material:**
- Book: *The Rust Programming Language* — chapter 11.
- Docs: <https://doc.rust-lang.org/book/ch11-00-testing.html>
- Community reference: Rustlings `tests/` series.

---

## 4. Cross-course exercise patterns

### Exercise shapes

Across the track, four exercise shapes recur because they map to how Rust is actually written:

1. **Pure functions over slices.** `fn name(input: &[T]) -> U`. No mutation, no IO, fully testable. Used in fundamentals (FizzBuzz, average), iterators (word frequency), error handling (CSV parser).
2. **Iterator pipelines that collect.** Forces idiomatic Rust and short, readable solutions. Used heavily in 3.4 and dotted through 3.2 and 3.5.
3. **Error propagation via `?`.** Every non-trivial exercise from 3.2 onward returns `Result`. Tests cover both arms.
4. **Trait-based abstractions.** Define a behavior, implement it for two types, use a generic or `dyn` to consume both. Used in 3.3, 3.5 (RefCell), and 3.7 (the macro that builds a vec abstracts over element types).

### Test scaffolding strategy

Because we cannot assume `cargo test` (open question — see section 7), the default test shape is: starter code includes `fn main()` that calls assertion helpers and prints a deterministic success marker (e.g., `"OK"`) which Piston matches against expected stdout. For exercises that should fail at compile time when the learner's code is wrong, no test scaffolding is needed — the compiler verdict is the test. For exercises that should panic deliberately (3.5 lesson 4 on `RefCell`), wrap the panicking call in `std::panic::catch_unwind` and assert on the result inside `main`.

This works but it is uglier than `#[test]`. If Piston supports `rustc --test` (which produces a binary that runs annotated test functions), we should switch the entire track to that model — it is closer to how learners will write tests in real projects.

### Determinism rules

Every exercise output must be reproducible across runs. This forbids:

- `HashMap` iteration order in stdout (use `BTreeMap` or sort before printing).
- `std::time::Instant` in assertions (only use it as opaque in the async course).
- Anything resembling randomness — Rust has no `std::random`, which works in our favor.
- Floating-point exact equality across non-trivial computations (use `assert_close!` from 3.7 or epsilon comparison helpers in starter code).

### Piston no-crate constraint — explicit cost ledger

| Concept | Idiomatic crate | Dojo workaround | Pedagogical cost |
|---|---|---|---|
| Error type ergonomics | `thiserror`, `anyhow` | Hand-write `Display` and `From` impls | Medium — verbose, but exposes what derives generate |
| Async runtime | `tokio`, `async-std` | Toy single-file executor | High — learner ships nothing real after the course; explicit flag required |
| Serialization | `serde` + `serde_json` | Hand-rolled tiny `Json` enum (3.1 lesson 7) | Medium — fine for fundamentals, blocks any "real-world" parsing exercise |
| Property testing | `proptest`, `quickcheck` | Hand-listed test cases | Low — table-driven tests are clear enough |
| HTTP / IO | `reqwest`, `hyper`, `tokio` | Cannot teach. Out of scope entirely. | Total — Dojo cannot teach Rust web at all |
| Date/time | `chrono`, `time` | `std::time::Instant` only | Low — most date logic is out of scope anyway |
| Random numbers | `rand` | `std::collections::hash_map::RandomState` (hash-based, not great) | Medium — limits any exercise needing randomness; prefer deterministic seeds |

The `tokio`-free async problem is the single most jarring constraint. The course is honest about it: lesson 5 of 3.6 is a literal "what we did not teach you" page.

### Compile-time budget

Rust's compile times are the dominant Piston cost. Empirical rules of thumb (to validate during 3.1 development):

| Exercise type | Expected `rustc` time | Notes |
|---|---|---|
| Single-file fundamentals (3.1, 3.2) | 1-3s | Trivial code, fast monomorphization |
| Iterator-heavy (3.4) | 2-5s | More monomorphization, still fine |
| Generics + traits (3.3) | 3-7s | Each generic instantiation costs |
| Async executor (3.6) | 5-12s | Largest in the track; `Pin`, `Future` machinery |
| Macros (3.7) | 2-4s | `macro_rules!` expansion is cheap |

If any exercise pushes past Piston's timeout (~15-30s), shrink the test inputs first, then split the lesson. Do not let the compile-time budget force us into trivializing the pedagogy — split a step into two before cutting concept depth.

### Hint scaffolding

Each exercise should expose three layers, surfaced progressively:

1. **The compiler error itself.** No paraphrasing. Show it raw. For most ownership and lifetime errors, the rustc message is already a tutorial.
2. **A one-line "what is the compiler asking?"** translation. E.g., for E0382 ("borrow of moved value"): "you handed ownership away on line N — you can clone it, or restructure to keep ownership."
3. **A code-shaped hint.** Only on request. The starter signature, the missing token, the trait bound to add. Not the answer.

This three-layer model is borrowed from Rustlings (which only uses layers 1 and 2) and Exercism (which uses layers 2 and 3). Combining all three lets the learner stop at the level of help they actually need.

## 5. Known pedagogical pitfalls

- **Dumping `'a` lifetime syntax before the borrow checker has bitten.** This is the most common Rust-teaching failure. We delay it to course 3.5 and only foreshadow it once in 3.1 lesson 5 with a hint. Resist the temptation to "introduce lifetimes properly" in fundamentals.
- **`Box<dyn Trait>` as the answer to every trait question.** It is not. We teach `impl Trait` and generic bounds first (3.3 lessons 2 and 3), then introduce `dyn` only when heterogeneity demands it. The default should be static dispatch.
- **Macros as a parlor trick.** `macro_rules!` is genuinely useful for tiny DSLs (`assert_close!`, `vec_of!`); proc macros are useful in a narrow band (derive for serialization, attribute for routing). Teaching macros as "look how powerful Rust is" produces learners who reach for macros instead of functions. We teach them late and pragmatically (3.7).
- **Async without a reactor.** Async code with nothing to wait on is just confusingly-written sync code. The 3.6 sequence motivates async with a "this future yields N times" example before introducing the executor. No `async fn fetch_url()` examples (we cannot run them anyway).
- **Treating `unwrap()` as a beginner shortcut.** It is a production hazard. We introduce `unwrap` only in 3.2 lesson 2 as "the honest assertion form when you have proven the value is `Some`/`Ok`." Earlier exercises return `Result` from the start.
- **Teaching `Rc<RefCell<T>>` as the way to share mutable state.** It is sometimes the answer; more often it is a smell. 3.5 lesson 5 explicitly contrasts it with the arena pattern.
- **Using `String` everywhere, ignoring `&str`.** `&str` is the default; `String` is when you need ownership. The fundamentals course models this from lesson 4 onward.
- **Treating compile errors as failures.** They are the curriculum. Several exercises ship intentionally non-compiling starter code; the test passes when the learner makes it compile and produce the right output. Borrowed wholesale from Rustlings.
- **Over-using `clone()` to silence the borrow checker.** A learner who clones their way out of every borrow error has not learned Rust. We tolerate `clone()` in 3.1 lesson 4 (it is a legitimate fix there) and explicitly call it out as a smell from 3.4 onward — by the iterator course, exercises should be passable without cloning.
- **Conflating `String` and `&str` early.** In 3.1 we use them deliberately and explain the distinction in lesson 4. Skipping the distinction creates learners who write `fn greet(name: String)` for every function and then complain that Rust is verbose. It is not — they are.
- **Showing `expect("this should never happen")` without context.** `expect` strings should be claims about an invariant ("non-empty by construction at line N"), not anxiety. We model the good form in 3.2 lesson 2 and call out the bad form in starter code comments.
- **Teaching `?` before `match` on `Result`.** `?` is a shortcut. To use it well you have to know what it desugars to. 3.2 lesson 1 step 2 starts with explicit `match` on `Result`, then the same exercise step 3 rewrites with `?`. The desugaring is the lesson.
- **Ignoring `clippy`-style idiom feedback.** Dojo cannot run clippy on Piston, but starter-code comments and post-exercise hints can encode the most common clippy lints (e.g., "prefer `if let Some(x) = opt` over `if opt.is_some() { let x = opt.unwrap() }`"). Treat clippy as a documentation source, not a tool we can run.
- **Proc macros on Piston.** Cannot be done. Lesson 3.7.4 is read-only and explicitly flagged. Anyone trying to add a `derive` exercise is going to spend two days fighting Piston before realizing.

## 6. External references

### Books

- **The Rust Programming Language** — Steve Klabnik & Carol Nichols. The canonical free book. Treat as ground truth for ordering and definitions.
- **Programming Rust, 2nd ed.** — Jim Blandy, Jason Orendorff, Leonora Tindall. Denser, sharper on the type system. Best second book.
- **Rust for Rustaceans** — Jon Gjengset. Intermediate-to-advanced. Required reading for anyone designing a Rust API. Heavily informs 3.3, 3.5, 3.7.
- **Rust Atomics and Locks** — Mara Bos. Out of scope for direct exercises (no concurrency course in v1) but the conceptual framing of interior mutability informs 3.5.
- **Zero to Production in Rust** — Luca Palmieri. Production async + web. Referenced as the "what comes next" for 3.6 and 3.2.
- **Rust in Action** — Tim McNamara. Systems-y, uses `unsafe` in earnest. Referenced in 3.7.
- **Hands-on Rust** — Herbert Wolverson. Game-dev oriented. Useful for exercise inspiration but not directly cited.
- **The Rustonomicon** — Required reading for the unsafe lesson (3.7). Free, official.
- **Asynchronous Programming in Rust** — The official async book. The toy executor in chapter 2 is the model for 3.6.
- **The Little Book of Rust Macros** — Daniel Keep. Macro reference for 3.7.

### Online platforms

- **Rustlings** — <https://github.com/rust-lang/rustlings>. The closest existing analog to Dojo's Rust pedagogy. We borrow the "make this compile" exercise pattern wholesale; many of our fundamentals and error-handling exercises are direct adaptations.
- **Exercism Rust track** — <https://exercism.org/tracks/rust>. ~100 exercises with mentor feedback. Useful as a reservoir of exercise ideas at the iterator/trait level.
- **Rust by Example** — <https://doc.rust-lang.org/rust-by-example/>. Official, runnable examples. Useful for explanation-step content and as a reference for learners.
- **Google's Comprehensive Rust** — <https://google.github.io/comprehensive-rust/>. A 4-day classroom course. Excellent ordering for 3.1 through 3.5; cross-check our pacing against it.
- **Ardan Labs Rust Foundations** — Herbert Wolverson's commercial course. Industry-grade but commercial — we draw on its structure not its content.
- **Udemy: Ultimate Rust Crash Course** — Nathan Stocks. The most-recommended paid intro. Useful as a sanity check for the fundamentals scope.

### Official documentation

- **The Rust Book** — <https://doc.rust-lang.org/book/>
- **The Rust Reference** — <https://doc.rust-lang.org/reference/>
- **The Rustonomicon** — <https://doc.rust-lang.org/nomicon/>
- **The Async Book** — <https://rust-lang.github.io/async-book/>
- **The std API docs** — <https://doc.rust-lang.org/std/> (the most underrated learning resource — nearly every type has a runnable example)

### Community learning resources

- **Jon Gjengset's "Crust of Rust" YouTube series** — Long-form (1-3 hour) deep dives implementing standard library types from scratch. The conceptual reference for 3.3, 3.4, 3.5, 3.6, and 3.7. If a Dojo learner finishes our track and wants the next step, this is the recommendation.
- **This Week in Rust** — <https://this-week-in-rust.org/>. Newsletter, useful for learners but not a curriculum input.
- **The Rust Reddit and users.rust-lang.org forum** — Useful for sourcing real beginner pain points (e.g., the most-asked lifetime questions).
- **Niko Matsakis's blog** — Compiler internals, lifetime/variance discussions. Reference for course 3.5.

## 7. Suggested implementation order

Build order, with reasoning:

1. **Rust Fundamentals (3.1)** — first, alone. Without ownership and `match` muscle, every other course collapses. This is the largest course (~22 steps) and the highest-stakes one. Do not ship the Rust track at all until 3.1 is solid and three or four real learners have completed it without abandoning at lesson 4 (the ownership cliff). If we lose people there, no other course matters.
2. **Rust Error Handling (3.2)** — second, because every subsequent exercise wants to return `Result`. Small course, high leverage, validates the `Result` + `?` muscle that the rest of the track assumes.
3. **Rust Iterators (3.4)** — third (note: jumping over 3.3 deliberately). Iterators are the single biggest "feels like idiomatic Rust" payoff and they unblock more interesting exercises in every later course. They also do not require traits-as-design knowledge — just trait *use*.
4. **Rust Traits & Generics (3.3)** — fourth. By now learners have used traits (`Iterator`, `From`, `Display`); this course explains how to design with them.
5. **Rust Lifetimes & Advanced Borrowing (3.5)** — fifth. Only attempt when learners have hit lifetime errors enough times to want answers. The course assumes the question; it does not invent it.
6. **Rust Async Foundations (3.6)** OR **Rust Unsafe & Macros (3.7)** — sixth, in either order. Both are specialty courses. 3.6 is more conceptually demanding; 3.7 is more fun. Recommend 3.7 first for the dopamine, 3.6 second for the depth. Both are optional from a "Rust competence" standpoint.
7. **Rust Testing Patterns (3.8)** — last and only if Piston supports `cargo test`. Otherwise, fold the relevant content into a single lesson appended to 3.2.

The first three courses (3.1 → 3.2 → 3.4) form the **minimum viable Rust track**. A learner who completes them can write idiomatic Rust for non-trivial pure-function workloads and read most production code. Everything after is depth, not breadth.

### Open questions for the human reviewer

These need answers before sprint planning starts:

1. **Piston Rust execution mode.** Does Piston's Rust runtime invoke `rustc` on a single file, or does it offer `cargo` with a minimal scaffold? The entire track is currently designed around the single-file model. If `cargo` is available, four things change: (a) course 3.8 (testing) becomes a full first-class course, (b) all assertions across the track move from `main`-driven to `#[test]`-driven, (c) we can split larger exercises into multiple files, (d) we still cannot use external crates because Piston is offline, but `cargo test` on a no-deps `Cargo.toml` is meaningfully better than `rustc`.
2. **Compile timeout ceiling.** What is the actual Piston timeout for Rust? The 15-30s range is a guess. The async course (3.6) is the only one at risk. If the ceiling is below 10s, lesson 3.6.3 (executor) and lesson 3.6.4 (`join_two`) will need to be reshaped.
3. **`unsafe` policy.** Does Piston's sandbox tolerate `unsafe` blocks (raw pointer deref, calling unsafe functions)? It should — the sandbox is at the OS level, not the language level — but confirm. If the sandbox blocks `unsafe`, course 3.7 collapses to the macro half only.
4. **Stable Rust version.** What `rustc` version does Piston ship? We assume 1.75+ for stabilized features. If older, the async course needs to drop `async fn` in traits (stabilized 1.75) and a few other niceties.
5. **Stdin support.** Some exercises would benefit from stdin (e.g., the CSV parser in 3.2). Does Piston's course-mode pipe stdin? If not, all input must be hardcoded literals — workable, less realistic.
6. **Course 3.8 fate.** Conditional on (1). If `cargo test` is unavailable, fold the `#[test]` content into a single appended lesson on 3.2 and remove 3.8 entirely.
7. **Hint surfacing UX.** The three-layer hint model in section 4 assumes Dojo's UI can progressively reveal. Confirm the Learning surface supports this; if not, layer 2 is the default exposure and layer 3 must be a separate "show me" button.
8. **Solution visibility.** Does the platform show a reference solution after pass? For Rust this matters more than for other languages — a working-but-non-idiomatic solution is the most common learner output, and a side-by-side with the idiomatic version is the highest-leverage post-exercise teaching moment. Recommend yes.

### Build sequencing

If we estimate ~2 days per course for a Rust-fluent author, the track is ~16 working days. Realistic sprint plan:

- **Sprint A (1 sprint):** Build 3.1 only. Send to 3-5 real learners (invite-only, in keeping with Dojo philosophy). Iterate based on where they get stuck. Do not start anything else until 3.1 has a 70%+ completion rate among invitees who reach lesson 4.
- **Sprint B (1 sprint):** Build 3.2 and 3.4 in parallel — they are independent and the smallest courses.
- **Sprint C (1 sprint):** Build 3.3. Larger and design-heavy.
- **Sprint D (1 sprint):** Build 3.5. The hardest course pedagogically; expect rework after learner feedback.
- **Sprint E (optional, 1 sprint):** Build 3.7 (lighter) then 3.6 (heavier). Or skip and ship the track with 3.1-3.5 only as v1.
- **Sprint F (conditional):** Build 3.8 if Piston supports `cargo test`.

The ship-as-v1 cut is 3.1-3.5 — five courses, ~92 steps, the full "competent in Rust" arc minus specialty topics. Async and unsafe are bonus content that can land later without leaving the track feeling incomplete.

### Comparative pedagogy — what other Rust courses get wrong

Briefly, where the major existing Rust learning resources fall short, and what Dojo's Rust track does instead:

| Resource | Strength | Weakness | Dojo's response |
|---|---|---|---|
| The Rust Book | Authoritative, free, complete | Reading-heavy; few forced-failure moments; lifetimes introduced before learners feel pain | Dojo splits the Book's chapter 10 (lifetimes) out into a dedicated advanced course. We use the Book's ordering for chapters 1-9 mostly verbatim. |
| Rustlings | Forced-failure pedagogy, fast feedback | No conceptual scaffolding between exercises; learners can pass without understanding | Dojo wraps every Rustlings-style exercise with explanation steps and progressive hints. |
| Exercism Rust | Mentor feedback is excellent | Slow loop (mentor turnaround), exercises are language-agnostic in shape | Dojo loop is instant (Piston) and exercises are Rust-shaped from the start (ownership-aware, trait-aware). |
| Google's Comprehensive Rust | Best ordering and pacing in the industry | Designed for in-person delivery; not self-serve | Dojo borrows the ordering, replaces classroom interaction with progressive hints. |
| Jon Gjengset's Crust of Rust | Unmatched depth | 1-3 hour videos, no exercises, advanced from minute one | Recommended as the "what next" after Dojo's track. |
| Udemy "Ultimate Rust" | Approachable for beginners | Stops short of lifetimes/async; shallow on traits | Dojo covers the full arc Udemy stops short of. |

Dojo's distinctive contribution: the combination of forced-failure exercises (Rustlings), conceptual scaffolding (the Book + Comprehensive Rust), instant feedback (Exercism without the wait), and depth (Crust of Rust without the YouTube format). No existing platform combines all four for Rust.

### Risk register

A short list of things that can derail the Rust track:

- **3.1 lesson 4 (ownership cliff) abandonment rate.** If invitees drop here, no other course will save the track. Mitigation: add an extra explanation step between move and borrow, validate with 5+ real learners before scaling.
- **Piston compile times exceeding the timeout on async or generics-heavy lessons.** Mitigation: validate the compile budget table empirically in sprint A. If 3.6 cannot run on Piston at all, drop the course rather than ship something broken.
- **`#[test]` unavailability.** Already covered in open question 1. The fallback is uglier but functional.
- **Reviewer disagreement on lifetime placement.** Some Rust educators (notably the Programming Rust authors) believe lifetimes should be introduced earlier. Dojo's choice (delay to 3.5) is a defensible pedagogical bet, not a consensus position. Be prepared to defend it or revise.
- **Maintenance load.** Rust evolves quickly (edition changes, stabilizations every 6 weeks). The async course is the most version-sensitive. Plan to revisit the track at least once per Rust edition (currently every 3 years) and the async course annually.

### Glossary of intentionally-deferred concepts

Concepts learners may encounter in error messages or external reading before Dojo formally teaches them. The track does not pretend they don't exist — it acknowledges them in passing and points to the course where they get treated properly.

| Concept | First brushed in | Properly taught in | Why deferred |
|---|---|---|---|
| `'a` lifetime annotations | 3.1 lesson 5 (with hint) | 3.5 lesson 1 | Premature without borrow-checker pain |
| `Box<dyn Trait>` | 3.3 lesson 3 | 3.3 lesson 3 | Fine in place — just not the default answer |
| `Pin` and `Unpin` | 3.6 lesson 2 (surface) | Not taught beyond surface | Requires self-referential struct context, out of scope for std-only course |
| `Send` and `Sync` | 3.6 lesson 5 (mention) | Not taught | Requires multithreaded context, no thread-safety course in v1 |
| `unsafe` | 3.7 lesson 1 | 3.7 lesson 1-2 | Wrong intuition if taught early |
| Procedural macros | 3.7 lesson 4 (read-only) | Cannot teach hands-on | Piston cannot build proc-macro crates |
| Trait objects with lifetimes | 3.5 (briefly) | Not deeply | Niche; `'static` default suffices for v1 |
| `async fn` in traits | 3.6 (mention) | Not taught | Recently stabilized, evolving |
| Const generics | Nowhere | Not taught | Useful but not foundational; defer to v2 |
| FFI / `extern "C"` | Nowhere | Not taught | Out of scope for std-only sandbox |

This list is also a v2 backlog: any item marked "Not taught" is a candidate for a future deep-dive course if learner demand surfaces it.

### Success criteria for the v1 Rust track

A learner who completes courses 3.1 through 3.5 should be able to:

- Write a small command-line program in idiomatic Rust without reaching for an LLM.
- Read a third-party crate's source and explain what its public types do.
- Recognize a borrow-checker error category from the message alone, without recompiling.
- Decide between `&str` and `String`, `impl Trait` and `dyn Trait`, `Result` and `panic!`, without a coin flip.
- Write a function returning `Result<T, E>` with a custom error type and propagate errors via `?`.

Stretch (after 3.6 + 3.7): explain what `async fn` desugars to, write a `macro_rules!` macro for a small DSL, and identify whether a given `unsafe` block is justified.

### Final note on voice

Rust learners self-select for tolerance of friction. They are not the audience that needs softening. The course voice should match Dojo's overall tone: direct, honest about what is hard, dryly funny about the borrow checker without being snarky toward the learner. The compiler is the antagonist; the course is the second in their corner. "You will fight the borrow checker. The borrow checker is right. Fight it anyway — you will learn something." That is the register.
