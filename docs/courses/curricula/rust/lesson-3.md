# Rust — Lesson 3: `Result`, `?`, and errors as values

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [rust.md §4 Lesson 3](rust.md#lesson-3--result--and-errors-as-values) · gates: [rust.md §2.1–§2.7](rust.md#2-sub-course-authoring-notes)
> **Primary audience:** A1 Mariana (JS senior) + A4 Felipe (TS modernizer) + A3 Yui (Java senior). Secondary: A2 Esteban (Python mid-senior).
> **Step count:** 3 (1 `read` + 2 `kata`). **No predict** — the lesson's compile-refusal moment (`?` in a non-`Result` function → `E0277`) lands as a deliberately-non-compiling sample inside read 3.1, full output **including its `help:` line** (the scroll's one full-reveal error with no predict or walk attached; rust.md §2.3).
> **What changes in the learner's head:** "Fallible functions return `Result<T, E>`; callers handle both arms or propagate with `?`. `?` only works in functions that return `Result` — I saw the `E0277` refusal. `panic!`/`unwrap` are for invariant violations, not control flow. `thiserror`/`anyhow` exist in production; here I hand-roll `From` to see the mechanism."

This file holds the **production prose** for each step's `instruction` / `feedback` / etc. fields. All content in English. Delta-framed throughout (§2.2 rule 1): `Result` is anchored to models the primary personas already hold, not taught from scratch. Every quoted `rustc` excerpt is a smoke-capture placeholder re-captured from Piston 1.68.2 at smoke.

**Harness note (applies to every `testCode` block below):** tests are written against the planned manual harness contract — `_t("user-facing sentence", || _eq(actual, expected))`, where `_eq` returns `Result<(), String>`. The exact harness header/footer (the `_t`/`_eq` definitions, runner `main`, `__DOJO_RESULT__` emission, `catch_unwind` wrapping) lands at seed (W3) per rust.md §5. The learner-`main`-vs-harness-`main` merge question stays flagged where lesson-1.md raised it.

---

## Step 3.1 — `read` — "`Result<T, E>` and propagation with `?`"

**Title:** `Errors are values the compiler makes you handle`
**Type:** `read`
**Word count target:** ~400 hard ceiling (landed ~400 — audit below). Embeds one `before-after` figure (match ladder vs `?`) beside the desugar paragraph. Delta anchors: TS result-object union + Node `(err, data)` callbacks (Mariana/Felipe); checked-exceptions-that-compose (Yui); Go/`Either` in one clause.

### `instruction` (markdown body)

```markdown
## Why this matters

You already encode "this can fail" somewhere. In TS you may have written the result-object union — `{ ok: true, value } | { ok: false, error }` — to escape exceptions; Node's older convention threads `(err, data)` through every callback. From Java: checked exceptions had the right instinct — failure in the signature — and mechanics that don't compose, so everyone catches and swallows. `Result<T, E>` is that instinct with compiler enforcement, the same family as Go's `(value, err)` pairs and functional `Either`.

## `Result` is an ordinary enum

Two variants, no runtime machinery — and you can't reach the success value without going through both arms:

```rust
fn main() {
    let parsed = "42".parse::<i32>();
    match parsed {
        Ok(n) => println!("doubled: {}", n * 2),
        Err(e) => println!("not a number: {}", e),
    }
}
```

`parse` returns `Result<i32, ParseIntError>`. There is no `n` outside the `Ok` arm — the forgotten error path is a type error here, not a review comment.

## `?` — the match ladder, collapsed

A full `match` per `Result` turns three fallible calls into a staircase. `?` is the staircase as one character:

:figure[before-after]{id="match-ladder-vs-question-mark"}

The desugaring is the lesson: `expr?` means *if `Ok(v)`, evaluate to `v`; if `Err(e)`, `return Err(From::from(e))` right now*. Two consequences. First, `?` is a `return` in disguise, so the enclosing function must itself return a `Result` (or `Option`). Second, the error passes through `From::from` on the way out — that's the next section. Break the first rule and you hit one of the first errors every real Rust beginner meets:

```rust
fn double_input(s: &str) -> i32 {
    let n: i32 = s.parse()?;
    n * 2
}
```

```text
error[E0277]: the `?` operator can only be used in a function that returns `Result` or `Option` (or another type that implements `FromResidual`)
 --> main.rs:2:27
  |
1 | fn double_input(s: &str) -> i32 {
  | ------------------------------- this function should return `Result` or `Option` to accept `?`
2 |     let n: i32 = s.parse()?;
  |                           ^ cannot use the `?` operator in a function that returns `i32`
  |
  = help: the trait `FromResidual<Result<Infallible, ParseIntError>>` is not implemented for `i32`
```
<!-- verify-at-smoke: rustc 1.68.2 -->

Read the anatomy: the span under the signature contains the fix, and the `help:` line names the mechanism — `?` needs somewhere typed for the error to go. The trait it mentions is desugar plumbing; the span's sentence is what you act on.

## `From` is how `?` converts errors

Real pipelines fail in more than one way. Because `?` calls `From::from` as it propagates, a function returning `Result<T, AppError>` can use `?` directly on a `Result<_, ParseIntError>` — *if* the conversion impl exists:

```rust
impl From<std::num::ParseIntError> for AppError {
    fn from(err: std::num::ParseIntError) -> AppError { AppError::Parse(err) }
}
```

Three lines; every `?` in the pipeline now wraps the parse error into your type. (Compiles next to `enum AppError { Parse(std::num::ParseIntError), Empty }` — the enum kata 3.3 hands you.)

## `unwrap`, `expect`, and where `panic!` belongs

`unwrap()` and `expect()` extract the `Ok` value or crash the program. Not error handling — **invariant assertions**: the `expect` string is a claim about your own logic, not anxiety. Decision matrix, two lines: caller can plausibly handle the failure → `Result`. Failure means the program's own assumptions are broken → `panic!`/`expect`.

```rust
fn main() {
    let port: u16 = "8080".parse().expect("hardcoded port is a valid u16");
    println!("listening on {}", port);
}
```

Production error enums are derived with `thiserror`, context added with `anyhow` — no crates in this sandbox, so you hand-write `Display` and `From`; the mechanics are the lesson, the boilerplate is what the crates remove. Next: write the `?` shape yourself, then the whole error enum.
```

### Paragraph-test audit (borrow-check test §2.1 — Valentina/Björn gate)

| Paragraph | Delta anchor (not from-scratch? — §2.2 rule 1, Valentina's lens) | Verdict |
|---|---|---|
| "Why this matters" | TS result-object union, Node `(err, data)`, Java checked-exceptions-that-compose; Go/`Either` in one clause exactly | KEEP (opener — licensed lead-in) |
| "`Result` is an ordinary enum" | "the union you already wrote, enforced" — no enum theory (data-carrying variants are Lesson 5's job; this read only *uses* the shape) | KEEP — ends in a compiling sample (`match` on `parse`) |
| "`?` — the match ladder, collapsed" + figure | Pain-led (the staircase); desugar stated as mechanics, not philosophy | KEEP — ends in the non-compiling sample + **full `E0277` output incl. `help:`** |
| "`From` is how `?` converts errors" | Anchored to "real pipelines fail in more than one way" — the multi-error ache every persona has shipped around | KEEP — ends in the compiling 3-line `From` impl (the kata 3.3 model) |
| "`unwrap`/`expect`/`panic!`" | Maps to assertion culture every persona holds; 2-line decision matrix | KEEP — ends in a compiling sample (`expect` as invariant claim) |
| Sandbox-honesty marker + forward prompt | Names `thiserror`/`anyhow` and why they're absent | KEEP (pointer paragraph — exempt per §2.6 framing) |

**What got cut:** `Box<dyn Error>` as an error type (trait objects land in Lesson 4; using one here would lean on untaught machinery), `unwrap_or`/`map_err` combinator tour (Lesson 5 names `Option`'s combinators; drilling `Result`'s here would blow the budget), `main() -> Result<...>` (works since 1.26 but adds a second `E0277` surface for no new mechanism), and error-trait-object vs enum design debate (Rust for Rustaceans territory — deferred with the `thiserror` marker).

**E0277 family note:** the read does not name the unsized-`dyn` form — predict 4.2 owns that reveal and names the family linkage back to this read, per the spec's de-spoiling direction.

---

## Step 3.2 — `kata` — `parse_and_double`

**Title:** `Propagate a parse failure with ?`
**Type:** `kata`
**1-line task:** `fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError>` — parse, double, propagate. The body is the `?` gesture; the signature holds the Lesson 2 `&str` default.

### `instruction` (markdown body)

```markdown
## Your task

Write `parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError>`: parse `s` as an `i32`, return double its value on success, and propagate the parse error on failure.

**Use `?` — no `match`, no `unwrap`.** The tests can't see inside your function, so this rule is on your honor; the point of the kata is writing the propagation idiom your hands will use daily, not proving the ladder works (the read step already showed both). After you pass, the alternative approach shows the `match` version for contrast.

### What's expected

```rust
parse_and_double("5")     // Ok(10)
parse_and_double("-3")    // Ok(-6)
parse_and_double("abc")   // Err(ParseIntError { .. })
```
```

### `starterCode`

```rust
fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    // your code
    todo!()
}
```

### `testCode`

> Harness preamble (`_t`/`_eq` definitions, panic capture, the `__DOJO_RESULT__` footer) is finalized at seed (W3) per rust.md §5 — the `_t("sentence", || _eq(...))` calls below are the contract.

```rust
_t("doubles a parsed positive number", || _eq(parse_and_double("5"), Ok(10)));

_t("doubles a parsed negative number", || _eq(parse_and_double("-3"), Ok(-6)));

_t("propagates the error for non-numeric input", || _eq(parse_and_double("abc").is_err(), true));

_t("propagates the error for empty input", || _eq(parse_and_double("").is_err(), true));
```

### `hint`

```markdown
`s.parse::<i32>()` returns `Result<i32, ParseIntError>` — exactly the error type your signature promises. So the propagation needs no conversion at all: `?` unwraps the `Ok` value into your expression on success and early-returns the `Err` for you on failure. If you wrote a `match`, you re-built `?` by hand — read the desugar paragraph again and collapse it.
```

### `referenceSolution`

```rust
fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    Ok(s.parse::<i32>()? * 2)
}
```

### `alternative_approach` (shown after pass)

```rust
// The ladder ? replaces — same behavior, four lines for one character:
fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    match s.parse::<i32>() {
        Ok(n) => Ok(n * 2),
        Err(e) => Err(e),
    }
}
```

### Why these tests

| Test | Lands |
|---|---|
| Positive number | Base case — parse, double, wrap in `Ok`. |
| Negative number | Catches `u32`-flavored parsing and absolute-value mistakes. |
| Non-numeric input | The `Err` arm propagates (asserted via `.is_err()` — the error's payload is rustc's business, not the learner's). |
| Empty input | Second distinct failure shape (`Empty` kind vs `InvalidDigit`); both must propagate, not panic. |

---

## Step 3.3 — `kata` — "A custom error enum with `From`"

**Title:** `Fill in a custom error enum: Display, From, and one fallible function`
**Type:** `kata`
**1-line task:** Starter pre-defines `enum AppError { Parse(ParseIntError), Empty }` and both impl skeletons; learner fills the two bodies and writes `parse_first`. The panel fix holds: data-carrying variants (taught in 5.1) and `impl … for` (taught in 4.1) arrive pre-written — the learner's work is the `Result` + `From` mechanics.

### `instruction` (markdown body)

```markdown
## Your task

The starter hands you a complete error enum and the skeletons of its two trait impls — the syntax you haven't been taught yet is already written. You fill three things:

1. **`Display`'s body** — `AppError::Empty` must display exactly `input was empty`; `AppError::Parse(e)` must include the inner error's own message in what it writes.
2. **`From`'s body** — wrap the `ParseIntError` in the right variant. The read step's three-line sample is your model.
3. **`parse_first(input: &[&str]) -> Result<i32, AppError>`** — return `Err(AppError::Empty)` for an empty slice; otherwise parse the **first** element as `i32`, letting `?` convert a parse failure into your error type. That conversion is the whole reason `From` exists: once your impl is in place, `?` does the wrapping without you naming `AppError` at the call site.

This is the hand-rolled version of what `thiserror` derives in production — write it once so the derive never looks like magic.
```

### `starterCode`

```rust
use std::num::ParseIntError;

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
```

### `testCode`

> Harness preamble (`_t`/`_eq` definitions, panic capture, the `__DOJO_RESULT__` footer) is finalized at seed (W3) per rust.md §5 — the `_t("sentence", || _eq(...))` calls below are the contract. The `matches!` macro is stable since 1.42 — fine under 1.68.2.

```rust
_t("parses the first element of a valid slice", || _eq(matches!(parse_first(&["42", "junk"]), Ok(42)), true));

_t("an empty slice is the Empty error", || _eq(matches!(parse_first(&[]), Err(AppError::Empty)), true));

_t("a bad first element becomes a Parse error via From", || _eq(matches!(parse_first(&["nope", "7"]), Err(AppError::Parse(_))), true));

_t("Empty displays its exact message", || _eq(format!("{}", AppError::Empty), String::from("input was empty")));

_t("Parse's display carries the inner error's message", || {
    let err = "x".parse::<i32>().unwrap_err();
    let shown = format!("{}", AppError::Parse(err.clone()));
    _eq(shown.contains(&err.to_string()), true)
});
```

### `hint`

```markdown
Three bodies, three jobs:

- **`Display`** must produce text for each variant: the exact `input was empty` string for one, and for the other, something that *embeds the inner error's message* — `Display` types interpolate into `write!` the same way they do into `println!`.
- **`From`** receives a `ParseIntError` and must return an `AppError`. The enum has exactly one variant built to carry it. (The read step's three-line `From` sample did this exact job for this exact enum.)
- **`parse_first`** has two failure paths with different mechanics: the empty-slice case is *yours to construct* — no conversion exists for "the slice was empty", so you name the variant yourself. The parse case is *`?`'s to convert* — once your `From` impl exists, `?` on the parse result wraps the error for you. If the compiler complains at your `?`, ask: which trait impl is it looking for, and does mine return the right variant?
```

### `referenceSolution`

```rust
use std::num::ParseIntError;

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
```

### `alternative_approach` (shown after pass)

```markdown
`parse_first`'s empty check also writes as `let first = input.first().ok_or(AppError::Empty)?;` — `ok_or` turns the `Option` into a `Result`, and then the same `?` you used for parsing handles the early return. One idiom, both failure paths. And the forward hook: `From`/`Into` is a real trait pair you just implemented by hand — `rust-traits-deep` picks it up from here, and `thiserror`'s `#[from]` attribute generates *exactly* the impl you wrote.
```

### Why these tests

| Test | Lands |
|---|---|
| Valid slice → `Ok(42)` | The happy path through `parse_first` (`matches!` with a literal pattern — no `PartialEq` needed on `AppError`). |
| Empty slice → `Err(Empty)` | The learner-constructed variant; catches solutions that panic or try to parse a missing element. |
| Bad first element → `Err(Parse(_))` | The `?`-conversion arm — passes only if the `From` body wraps into the right variant (a `From` returning `Empty` fails here). All three arms per the outline. |
| `Empty` display text | Verifies the first `Display` body against the exact string the instruction pins. |
| `Parse` display carries the source | Verifies the second `Display` body without pinning rustc's own `ParseIntError` text (asserted via `contains` on `err.to_string()` — version-drift-proof and deterministic). |

*(The outline's test list names the three arms; the two `Display` assertions are added so the learner-written `Display` body is verified, not decorative — §5.4's tests-verify-the-behavior rule. Flagged in the W2 report.)*

---

## Self-review checkpoint (before commit)

- [x] Read 3.1 at the ~400-word ceiling; every section terminates in a compiling sample or the quoted `E0277` (audit table above). No predict in this lesson per rust.md §2.3.
- [x] The `E0277` quoted output **includes its `help:` line**, and the prose walks the `help:` anatomy explicitly — this is the scroll's one full-reveal error with no predict attached.
- [x] Delta rule (§2.2.1): TS result-object union + Node `(err, data)` for Mariana/Felipe, checked-exceptions-that-compose for Yui, Go/`Either` in exactly one clause. No from-scratch enum theory (variant syntax arrives pre-written in 3.3's starter; taught properly in 5.1).
- [x] The `From` paragraph closes with the 3-line compiling `From`-impl sample, explicitly named as kata 3.3's model.
- [x] Before-after figure (match ladder vs `?`) lands beside the desugar paragraph; ladder uses `sum_pair`, **not** kata 3.2's `parse_and_double`, so the kata isn't pre-solved on the same page.
- [x] Kata 3.2 holds the Lesson 2 `&str` signature default; instruction states the `?`-no-`match` rule and admits tests can't enforce it; `alternative_approach` shows the match ladder.
- [x] Kata 3.3 starter pre-defines the complete enum + both impl skeletons with signatures present, bodies stubbed (`todo!()` compiles — fail-by-tests, not fail-by-design). Hint points at what each body must produce and at `?`-needs-the-right-trait-impl — never the body code, never `parse_first`'s structure.
- [x] Sandbox honesty: `thiserror`/`anyhow` named-and-deferred with the boilerplate-is-the-lesson framing. Std-only, single-file, nothing post-1.68 (`matches!` 1.42, `todo!` 1.40).
- [x] Every `rustc` excerpt fence is followed by `<!-- verify-at-smoke: rustc 1.68.2 -->`. testCode uses the `_t`/`_eq` contract shape with the harness-at-seed note; all tests deterministic.
- [x] All content in English. No emoji, no celebration.

---

## Figure data spec

The step prose above embeds `:figure[before-after]{id="match-ladder-vs-question-mark"}`. Data:

### `match-ladder-vs-question-mark` (`before-after`) — embedded in Step 3.1

- **Slot:** inside "`?` — the match ladder, collapsed", directly before the desugar paragraph it illustrates.
- **Pipeline choice:** `sum_pair` (two fallible parses) rather than kata 3.2's `parse_and_double` — the figure must teach the collapse without printing the kata's answer one scroll-height above the kata. Two parses also make the "ladder" literal: the boilerplate visibly *repeats*, which one parse can't show.
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ```ts
  {
    type: 'before-after',
    id: 'match-ladder-vs-question-mark',
    language: 'rust',
    left: {
      title: 'The match ladder',
      code: `fn sum_pair(a: &str, b: &str) -> Result<i32, ParseIntError> {
    let first = match a.parse::<i32>() {
        Ok(n) => n,
        Err(e) => return Err(e),
    };
    let second = match b.parse::<i32>() {
        Ok(n) => n,
        Err(e) => return Err(e),
    };
    Ok(first + second)
}`,
      annotations: [
        { line: 4, mark: '✕', text: 'Unwrap-or-early-return boilerplate…' },
        { line: 8, mark: '✕', text: '…repeated verbatim for every fallible call' },
      ],
    },
    right: {
      title: 'The same pipeline with ?',
      code: `fn sum_pair(a: &str, b: &str) -> Result<i32, ParseIntError> {
    Ok(a.parse::<i32>()? + b.parse::<i32>()?)
}`,
      annotations: [
        { line: 2, mark: '✓', text: 'Each ? is one whole Ok/Err match, inlined' },
      ],
    },
    caption:
      'Identical behavior, identical signature, identical early returns — ? is the left pane\'s ladder compressed to one character per fallible call. Both panes assume use std::num::ParseIntError; and both compile.',
  }
  ```
- **Why this earns embedding:** the desugar paragraph claims `?` *is* the match ladder; the figure makes the claim checkable at a glance — same signature, same arms, nine body lines against one. Removing it forces the prose to narrate the correspondence line by line, which is exactly the prose wall the figure contract exists to break. Pedagogy lives in the contrast (✕ on the repeated arms, ✓ on the inlined `?`), per the Tier S rule.
