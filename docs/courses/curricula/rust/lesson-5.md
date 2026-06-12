# Rust — Lesson 5: Enums, `Option`, and exhaustive `match`

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [rust.md §4 Lesson 5](rust.md#lesson-5--enums-option-and-exhaustive-match) — the contract. Gates §2.1 (borrow-check test), §2.2 rule 1 (**delta rule** — enums ≈ discriminated unions / sealed types, no from-scratch ADT prose) + rule 2's **pairing clause** (read 5.1 carries the `E0004` headline line only; predict 5.2 owns the full reveal), §2.5 (hint ladder), §2.7 (compiler-error reveal) apply.
> **Primary audience:** A4 Felipe (TS modernizer) + A1 Mariana (JS senior) + A3 Yui (Java senior). Secondary: A2 Esteban (Python mid-senior).
> **Step count:** 4 (1 `read` + 1 `predict` + 2 `kata`).
> **What changes in the learner's head:** "Rust enums are the discriminated unions / sealed types I know — the twist is that `match` is exhaustive by construction and the compiler refuses a missing arm (`E0004`). `Option<T>` is null replaced by an enum I must destructure. `if let` is the one-arm shortcut."

This file holds the **production prose** for each step's fields. All content and meta-notes in English. Delta-framed throughout (spec §2.2 rule 1): enums anchor to TS discriminated unions (Mariana/Felipe) and sealed classes + exhaustive switch (Yui); `Option` anchors to the null-handling every persona already does, made compiler-checked. No figure is committed for this lesson (spec §4 commits none — the read's anchor is the `E0004` cliffhanger, not a visual).

**Harness note (applies to every `testCode` block below):** tests are written against the planned manual harness contract — `_t("user-facing sentence", || _eq(actual, expected))`, where `_eq` returns `Result<(), String>`. Kata 5.3 additionally uses the float-epsilon helper `_eq_close(actual, expected, epsilon)`, which rust.md §5 commits the harness to ship. The exact harness header/footer (the `_t`/`_eq`/`_eq_close` definitions, runner `main`, `__DOJO_RESULT__` emission, `catch_unwind` wrapping) lands at seed (W3).

---

## Step 5.1 — `read` — "`Option<T>` and `match` exhaustiveness as a design tool"

**Title:** `Enums you already know, a match that refuses to forget`
**Type:** `read`
**Word count target:** ~350 (code blocks excluded; spec sets this read at ~350, under the framework's ~400 ceiling). Borrow-check test §2.1 applied. Ends with the cliffhanger snippet + **E0004 headline line only**, per §2.2 rule 2's pairing clause — the full multi-line output belongs to predict 5.2's reveal, not here.

### `instruction` (markdown body)

```markdown
## Why this matters

You have modeled "one of several known shapes" in every codebase you ship: discriminated unions in TypeScript — `{ kind: "circle", radius: number } | { kind: "square", side: number }` — sealed classes switched over exhaustively in Java. Rust's `enum` is that concept as a first-class type. And if "enum" still means a list of named constants to you (C, older Java), widen it one notch: **each variant can carry its own data**. The twist this lesson sells is not the type — it is the `match`: exhaustive by construction, where a missing case is a compile error instead of a runtime surprise.

## `Option<T>`: the null check, compiler-enforced

Rust has no null. "Might be absent" is itself an enum — `Option<T>` is `Some(value)` or `None` — and the value is unreachable except by going through both possibilities. This is the null-handling you already do in every language, minus the version where you forgot. The `match` you wrote on `Result` in Lesson 3 was this exact machinery: `Result` and `Option` are both plain enums whose variants carry data.

```rust
fn describe_port(port: Option<u16>) -> String {
    match port {
        Some(p) => format!("listening on {}", p),
        None => String::from("no port configured"),
    }
}
```

## `if let`, and the everyday methods

When only one arm matters, a full `match` is ceremony — `if let` destructures a single pattern and ignores the rest. `Option` also ships combinators you will read daily: `unwrap_or` (the value or a default), `map` (transform the inside, if any), `and_then` (chain a step that may itself produce `None`). Named here so you can read them in the wild; the katas only need `match` and `if let`.

```rust
fn main() {
    let port: Option<u16> = Some(8080);
    if let Some(p) = port {
        println!("explicit: {}", p);
    }
    println!("effective: {}", port.unwrap_or(3000));
}
```

## Exhaustiveness is a refactor tool

Here is the sell, and it lands hardest if you have ever maintained a `switch` over a growing union: **add a variant, and the compiler lists every `match` that must now make a decision** — file, line, missing pattern. A `match` is not checked against the cases you remembered; it is checked against the *type*. That turns an enum's matches into a compiler-maintained TODO list — the property the next kata will forbid you to trade away.

So: three variants, two arms. Does this compile — and what exactly does the compiler refuse to let slide?

```rust
enum Status { Active, Idle, Banned }

fn main() {
    let status = Status::Idle;
    match status {
        Status::Active => println!("running drills"),
        Status::Idle => println!("waiting for a kata"),
    }
}
```

`rustc`'s answer starts like this:

```text
error[E0004]: non-exhaustive patterns: `Status::Banned` not covered
```
<!-- verify-at-smoke: rustc 1.68.2 -->
```

### Authoring notes

- **Pairing clause honored (§2.2 rule 2):** the read carries the cliffhanger snippet plus the `E0004` **headline line only**. The full multi-line output — the `note:` pointing into the enum, the `help:` that writes the fix arm, the wildcard caveat — lives in predict 5.2's reveal; quoting it here would pre-answer the predict. Same construction as read 1.1 / predict 1.2.
- **Section order vs the spec's topic list:** the spec's body-topics list places the `E0004` anchor mid-read (before `if let`); this draft moves the exhaustiveness paragraph and its anchor to the close so the read ends in the cliffhanger, per the lesson-1 precedent and the W2 instruction that the read end with snippet + headline. All spec voice_check constraints still hold (the headline anchors the exhaustiveness paragraph; the `if let` paragraph ends in code). Flagged in the W2 report, not improvised silently.
- The Lesson 3 back-reference ("your `match` on `Result` was this exact machinery") closes the loop the spec's §3 demands, placed *before* the `Option` sample so the section still terminates in code.
- The cliffhanger's `Banned` variant is never constructed — 1.68.2 may add a dead-code warning above the error; the headline line is what the read quotes, and the recapture at smoke settles surrounding noise.

### Paragraph-test audit (borrow-check test §2.1 — Valentina/Björn gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Is this a new concept or my unions/sealed types renamed?" — C-enum widening in exactly one line (delta voice) | KEEP (delta opener — licensed lead-in; the match twist it promises is delivered below) |
| "`Option<T>`" | "Where did null go, and is this the `Optional`/`?.` dance again?" + the Lesson 3 loop closed | KEEP — ends in a compiling sample, both arms |
| "`if let`, and the everyday methods" | "Do I write a full match every time? What are the combinators I'll see in real code?" | KEEP — methods are one-liners (used, not drilled, per spec); ends in a compiling sample |
| "Exhaustiveness is a refactor tool" | The refactor-safety pitch (Yui's lens): add a variant, the compiler lists every match to update | KEEP — flows into the cliffhanger; ends in code + quoted headline, not prose |

**What got cut:** `match` guards and binding patterns (`x @ 1..=5`) — real but not crash-scope; `Option`/`Result` interop (`ok_or` already cameoed in 3.3's `alternative_approach`); `while let` (one idiom per read); any C-style discriminant talk (`as i32`, `#[repr]`) — the C-enum mention is one widening clause, not a section; exhaustive-`switch` comparison tables (the prose names the deltas inline — TS `never`-checks and Java sealed switches surface in 5.2's feedback instead, where the misconceptions live).

---

## Step 5.2 — `predict` — "Does this compile?"

**Title:** `Predict: does this compile?`
**Type:** `predict`
**Mental model under test:** `match` is checked against the *type*, not the values the author expected — a missing variant is `E0004`, a hard error, not a warning, not a fall-through. The traps: the JS/Java switch-fallthrough reflex, the lint-vs-gate misread (Mariana's prior, per the spec), and the "enums require a default variant" misconception (exhaustiveness misattributed to the enum instead of the match).

### `instruction` (short intro shown above the snippet)

```markdown
The read ended on this match. Here it is again, one notch more honest — the match is now an expression whose value gets used. Commit to an answer before you reveal.
```

### `question`

```
Does this compile — and if not, what does rustc say?
```

### `snippet`

```rust
enum Status { Active, Idle, Banned }

fn announce(status: Status) -> String {
    match status {
        Status::Active => String::from("running drills"),
        Status::Idle => String::from("waiting for a kata"),
    }
}

fn main() {
    println!("{}", announce(Status::Idle));
}
```

### `options`

```yaml
- id: a
  text: "Compiles — an unmatched value just falls through, like a `switch` with no `default`"
- id: b
  text: "Compiles, with a warning that `Banned` is not covered"
- id: c
  text: "Fails to compile — `E0004`, non-exhaustive patterns: `Banned` not covered"
- id: d
  text: "Fails to compile — but because the enum is missing a default variant, which Rust enums require"
correct: c
```

### `feedback` (per option, sensei voice)

**a — Falls through like a `switch`:**
> The switch-fallthrough reflex, JS and Java vintage: a missing `case` means execution skips the block and life goes on. Two Rust facts forbid it here. This `match` is an **expression** — `announce` must produce a `String` for every possible `status`, and a fallen-through `Banned` would have no value to produce. And `match` has no implicit default: the arms you write are the whole story, checked against the type, not against the values you expect tonight. The real output is below.

**b — Compiles with a warning:**
> The lint-vs-gate misread. Plenty of ecosystems treat missing cases as advisory — TS only catches a non-exhaustive union switch if you wired a `never`-typed check yourself; linters flag a missing `default` and you ship anyway. In Rust, exhaustiveness is the type system, not a style opinion: `E0004` is a hard error, the same severity as a type mismatch. Nothing ships until the match covers the type. The real output is below.

**c — Fails, `E0004`:**
> Correct — and the output is worth more than the verdict: it names the missing pattern, points into your enum definition, and writes the fix arm for you. Walk it below.

**d — Enums require a default variant:**
> The misread that puts exhaustiveness on the wrong artifact. The enum owes you nothing — it just declares what can exist. Covering it is each **match**'s job, and `_` is the per-match opt-out (which the next kata forbids, on purpose). There is no "default variant" concept in Rust, and adding a `Banned`-shaped catch-all variant to satisfy an imagined rule would corrupt the type to appease a misreading of the error. The real output is below.

### `reveal` — the E0004 walk (appended to every option's feedback at seed, so each path sees it)

```markdown
Here is the full output:

```text
error[E0004]: non-exhaustive patterns: `Status::Banned` not covered
 --> main.rs:4:11
  |
4 |     match status {
  |           ^^^^^^ pattern `Status::Banned` not covered
  |
note: `Status` defined here
 --> main.rs:1:6
  |
1 | enum Status { Active, Idle, Banned }
  |      ^^^^^^               ------ not covered
  = note: the matched value is of type `Status`
help: ensure that all possible cases are being handled by adding a match arm with a wildcard pattern or an explicit pattern as shown
  |
6 ~         Status::Idle => String::from("waiting for a kata"),
7 ~         Status::Banned => todo!(),
  |
error: aborting due to previous error

For more information about this error, try `rustc --explain E0004`.
```
<!-- verify-at-smoke: rustc 1.68.2 -->

Line by line:

- ``error[E0004]: non-exhaustive patterns: `Status::Banned` not covered`` — the headline names the exact missing pattern. Not "something's missing": *which* variant, by name.
- The span under `match status` marks the match being judged; the ``note: `Status` defined here`` span points **into your enum definition** and underlines the uncovered variant. The error reads in both directions — from the match to the type and back.
- The `help:` writes the fix arm for you, `todo!()` body included — paste it and the program compiles (and panics honestly at runtime until you decide what `Banned` means).
- The same `help:` offers a second exit: a wildcard. Take `_` and this error never fires again *for this match* — including the day a fourth variant lands and this match silently mishandles it. That is the refactor-safety trade the read named: `_` sells it back.

This is exhaustiveness as a design tool, demonstrated: add a variant to a production enum and the build fails at every `match` that now needs a decision — file, line, missing pattern. The compiler turned a grep-and-pray refactor into a checklist. The next kata has you write the full exhaustive form with your own hands; the wildcard is off the table there for exactly this reason.
```

### Authoring notes

- The quoted output is expected-from-knowledge; smoke recaptures from Piston's 1.68.2 and the seed pastes the recaptured text verbatim (spec §2.7). What the recapture settles: the exact rendering of the suggestion block (the `~` lines), whether 1.68.2 collapses the one-line enum definition span as shown, and any dead-code warning noise above the error (`Banned` is never constructed). Stable anchors: the `E0004` code, the named missing pattern, the `note:` into the definition, the wildcard-or-explicit `help:`.
- Per-option feedback stays reflex-specific (predict voice contract); the shared walk ships appended to each feedback entry at seed since the player's `predict` schema has no separate reveal field — same convention as 1.2 and 4.2.
- The snippet is read 5.1's cliffhanger "expanded by one use" (match as a used expression), mirroring the 1.1 → 1.2 construction; the expression form is also what makes option (a) concretely impossible, which the feedback exploits.
- Option (b) is Mariana's prior and option (d) the plausible misread, both per the spec's own 5.2 outline; (d)'s feedback delivers the spec-mandated correction "exhaustiveness is the match's job, `_` is the opt-out".

---

## Step 5.3 — `kata` — "Define an enum, match every shape" *(production gesture G2)*

**Title:** `Define an enum, match every shape`
**Type:** `kata`
**1-line task:** Learner defines `enum Shape { Circle(f64), Square(f64), Rect(f64, f64) }` and writes `fn area(s: &Shape) -> f64` with one exhaustive `match` — **no `_` arm**, so the gesture practiced is the full exhaustive form the predict just motivated.

### `instruction` (markdown body)

```markdown
## Your task

Two definitions, written with your own hands:

1. **Define `enum Shape`** with three data-carrying variants: `Circle(f64)` (the radius), `Square(f64)` (the side), and `Rect(f64, f64)` (width, height).
2. **Write `fn area(s: &Shape) -> f64`** with one `match` covering all three variants. Circle area is π·r² — std ships π as `std::f64::consts::PI` — square is side², rectangle is width·height.

**No `_` arm.** A wildcard would pass these tests — and it would sell back the one property the predict just demonstrated: with three explicit arms, adding a `Triangle` variant next month makes the compiler list this `match` as needing a decision; with a `_`, it silently computes nonsense instead. The tests can't see your match arms, so this rule is on your honor — like 3.2's no-`match` rule, the point is the gesture your hands learn, not outsmarting the suite.

The file won't compile until the enum exists — write the two definitions together.

### What's expected

```rust
area(&Shape::Circle(3.0))     // PI * 9.0
area(&Shape::Square(2.5))     // 6.25
area(&Shape::Rect(3.0, 4.5))  // 13.5
```
```

### `starterCode`

```rust
// 1. Define `enum Shape` here: Circle(f64), Square(f64), Rect(f64, f64).

// 2. Write `fn area(s: &Shape) -> f64` here: one match, three arms, no wildcard.

fn main() {
    // once both exist, try:
    // println!("{}", area(&Shape::Square(2.0)));
}
```

### `testCode`

> Harness preamble (`_t`/`_eq`/`_eq_close` definitions, panic capture, the `__DOJO_RESULT__` footer) is finalized at seed (W3) per rust.md §5 — the calls below are the contract. `_eq_close(actual, expected, epsilon)` is the harness's float-epsilon helper, committed for this kata in rust.md §5.

```rust
_t("a circle's area is pi times radius squared", || _eq_close(area(&Shape::Circle(3.0)), std::f64::consts::PI * 9.0, 1e-9));

_t("a square's area is its side squared", || _eq_close(area(&Shape::Square(2.5)), 6.25, 1e-9));

_t("a rectangle's area is width times height, not either squared", || _eq_close(area(&Shape::Rect(3.0, 4.5)), 13.5, 1e-9));
```

### `hint`

```markdown
A match arm on a data-carrying variant destructures the payload into a name you choose: `Shape::Circle(radius) => ...` — the pattern on the left, the binding usable on the right. Three variants, three patterns of that shape; the rectangle's pattern binds two names. The arithmetic is yours. The compiler's only demand is that the three patterns together leave nothing uncovered — and if you mistype one, the error that comes back is the predict's `E0004`, now working for you.
```

### `referenceSolution`

```rust
enum Shape {
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
```

### Why these tests

| Test | Lands |
|---|---|
| Circle | One test per variant, per the outline; asserted with `_eq_close` because π·r² is irrational — exact float equality would be a lie waiting for an optimization flag. The expected value is computed from the same `PI` constant, not a pasted decimal. |
| Square | Second variant; 2.5² = 6.25 is exactly representable, but the epsilon helper is used uniformly — modeling the float-comparison habit is part of the test's pedagogy. |
| Rect | Third variant; 3.0 × 4.5 catches arms that square one payload (w·w = 9, h·h = 20.25) instead of multiplying both. The test name says what the failure means. |

### Hint-discipline check (§2.5)

The hint shows the destructuring pattern *shape* (`Shape::Circle(radius) =>`) — sanctioned by the spec's own 5.3 outline ("points at destructuring variant payloads in match arms (`Shape::Circle(r) =>`) as a shape — not at the arithmetic") — and never the arithmetic or the other two arms. `std::f64::consts::PI` is named in the *instruction* as domain plumbing (it prevents hardcoded `3.14159` noise, and π is not the concept under test); the match is the kata, and the hint stays one rung below it. The no-`_` rule rides the instruction with its *reason* attached (refactor safety), honor-system framing per the 3.2 precedent.

### Authoring note — starter shape

The learner defines both the enum and the function, so the starter is a comment scaffold plus an inert `main` (it compiles alone; the first run after writing `area` without the enum fails with a find-the-type error, which is honest feedback, not fail-by-design — that label stays reserved for 1.3/2.5). The production-gesture rule (README §4.4) takes precedence over the signature-present default (README §5.4) here, same trade as kata 4.4 — flagged in the W2 report.

---

## Step 5.4 — `kata` — `first_even`

**Title:** `Return the first even number, if any`
**Type:** `kata`
**1-line task:** `fn first_even(v: &[i32]) -> Option<i32>` — `Some` of the first even number, `None` when there isn't one. Both the explicit loop and the iterator one-liner are blessed; the `alternative_approach` shows whichever the learner didn't write.

### `instruction` (markdown body)

```markdown
## Your task

Write `first_even`: it takes a slice of `i32` and returns the **first** even number as an `Option<i32>` — `Some(n)` when one exists, `None` when none does, including for the empty slice.

`Option` is the return type doing honest work here: the no-result case is in the signature, and every caller is forced to deal with it — no sentinel `-1`, no null, no exception. This is the shape std itself uses everywhere a search can come up empty.

Two implementations count as idiomatic: the explicit loop that returns early, and the iterator one-liner. Write whichever your hands prefer — the alternative approach shows the other after you pass.

### What's expected

```rust
first_even(&[1, 2, 3])     // Some(2)
first_even(&[1, 3, 5])     // None
first_even(&[])            // None
first_even(&[7, 4, 8, 2])  // Some(4) — the first, not the largest or last
```
```

### `starterCode`

```rust
fn first_even(v: &[i32]) -> Option<i32> {
    // your code
    todo!()
}
```

### `testCode`

> Harness preamble (`_t`/`_eq` definitions, panic capture, the `__DOJO_RESULT__` footer) is finalized at seed (W3) per rust.md §5 — the `_t("sentence", || _eq(...))` calls below are the contract.

```rust
_t("returns the first even number when one exists", || _eq(first_even(&[1, 2, 3]), Some(2)));

_t("returns None when no number is even", || _eq(first_even(&[1, 3, 5]), None));

_t("returns None for an empty slice", || _eq(first_even(&[]), None));

_t("returns the first even number, not the largest or the last", || _eq(first_even(&[7, 4, 8, 2]), Some(4)));
```

### `hint`

```markdown
Even means `n % 2 == 0`. If you're looping: the moment you see an even number you already know the whole answer — return it wrapped in its variant, and let the code after the loop be the other variant. If you'd rather not loop: the iterator family has a method for "the first element satisfying a predicate" — `find` — and it already returns an `Option`. Mind what it hands your closure when you iterate a slice of `i32`; the compiler will tell you if you ignore it.
```

### `referenceSolution`

```rust
fn first_even(v: &[i32]) -> Option<i32> {
    v.iter().copied().find(|n| n % 2 == 0)
}
```

### `alternative_approach` (shown after pass)

```markdown
The explicit loop — same semantics, the early return doing `find`'s job:

```rust
fn first_even(v: &[i32]) -> Option<i32> {
    for &n in v {
        if n % 2 == 0 {
            return Some(n);
        }
    }
    None
}
```

If you wrote the loop: the one-liner's `.copied()` adapter does what your `&n` pattern does — turns the slice's `&i32` items into `i32` values (without it, `find`'s closure receives a reference to a reference and the types complain). If you wrote the one-liner: the loop is not the beginner version — it is roughly what the iterator compiles down to, and production Rust reaches for it whenever the predicate grows past one line. *Using* iterators is this scroll's scope; *implementing* the `Iterator` trait is `rust-iterators-deep`'s.
```

### Why these tests

| Test | Lands |
|---|---|
| `[1, 2, 3]` → `Some(2)` | The happy path, per the outline: an even number exists and comes back wrapped. |
| `[1, 3, 5]` → `None` | The no-result arm is a value, not an exception — the signature's whole point. |
| `[]` → `None` | Boundary; catches bodies that index before checking. |
| `[7, 4, 8, 2]` → `Some(4)` | Pins **first** semantics (added to the outline's three: without it, "any even" and "last even" implementations pass — §5.2's one-behavior rule needs the behavior actually asserted). Flagged in the W2 report. |

### Hint-discipline check (§2.5)

The hint names `find` as the family member — sanctioned by the spec's own 5.4 outline ("points at the iterator method *family* (`find`)") — and never assembles the chain: `.iter()`, `.copied()`, and the closure stay unnamed (the reference-vs-value caveat is posed as a question the compiler will answer, not as the adapter to type). For the loop path, the hint names early-return as a concept and "the other variant" without writing `Some`/`None` into a body. The instruction's examples pin the contract; the hint stays a rung below both solutions.

---

## Self-review checkpoint (before commit)

- [x] Read 5.1 at the ~350-word target (spec-set, under the framework ceiling), code blocks excluded; paragraph audit included; what got cut is named.
- [x] **Pairing clause (§2.2 rule 2):** read 5.1 ends with the cliffhanger snippet + the `E0004` **headline line only**. The full output, the `note:`-into-the-definition walk, the `help:` fix arm, and the wildcard caveat live in 5.2's reveal — nowhere in the read.
- [x] **Delta rule (§2.2.1):** enums anchored to TS discriminated unions and Java sealed classes + exhaustive switch; the C-enum widening is exactly one line; `Option` anchored to the null-handling every persona already does. Zero from-scratch ADT prose.
- [x] The read's core sell is refactor safety ("add a variant, the compiler lists every match that must now make a decision") — Yui's lens, per the outline — and the Lesson 3 loop is closed ("your `match` on `Result` was this exact machinery").
- [x] Predict 5.2 options include "compiles with a warning" (Mariana's prior) and "enums require a default variant" (the plausible misread); feedback names the switch-fallthrough reflex, the lint-vs-gate misread, and corrects the default-variant misconception with "exhaustiveness is the match's job, `_` is the opt-out". Full expected `E0004` output in the reveal with `<!-- verify-at-smoke: rustc 1.68.2 -->`.
- [x] Kata 5.3 (gesture G2): learner defines the enum **and** the exhaustive `match`; the instruction forbids the `_` arm with the refactor-safety reason attached and honest honor-system framing; `_eq_close` used per the spec's harness commitment.
- [x] Kata 5.4 holds the outline's `first_even` shape (`&[i32]` per the Lesson 2 signature default, `Option<i32>` out); both implementations blessed in the instruction; `alternative_approach` shows the loop and the iterator-deferral hook.
- [x] **Hint discipline (§2.5):** 5.3 hint shows the pattern shape only (spec-sanctioned), never the arithmetic; 5.4 hint names `find` (spec-sanctioned), never the chain. Hint-discipline check sections included per kata.
- [x] All code compiles under rustc 1.68.2, std only, single file — match ergonomics on `&Shape` (1.26), `.copied()` (1.36), `todo!` (1.40), `matches!`-free tests; nothing post-1.68 anywhere.
- [x] testCode uses the `_t`/`_eq` contract shape with the harness-at-seed note; all tests deterministic (float comparisons through the epsilon helper); test names are user-facing sentences.
- [x] No figure in this lesson (none committed by the spec); max-figures rule trivially holds.
- [x] Every word in English — titles, instructions, hints, options, feedback, code comments, meta-notes. No emoji, no celebration.
