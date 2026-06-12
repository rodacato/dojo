# Rust — Lesson 4: Traits and generics: interfaces with a twist

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [rust.md §4 Lesson 4](rust.md#lesson-4--traits-and-generics-interfaces-with-a-twist) — the contract. Gates §2.1 (borrow-check test), §2.2 rule 1 (**delta rule** — traits ≈ interfaces with a twist, no from-scratch interface prose), §2.5 (hint ladder), §2.7 (compiler-error reveal) apply.
> **Primary audience:** A3 Yui (Java senior) + A1 Mariana (JS senior) + A4 Felipe (TS modernizer). Secondary: A2 Esteban (Python mid-senior).
> **Step count:** 4 (1 `read` + 1 `predict` + 2 `kata`).
> **What changes in the learner's head:** "Traits are the interfaces I know — the twist is dispatch. `<T: Trait>` and `impl Trait` are static dispatch, monomorphized, free at runtime. `Box<dyn Trait>` is the vtable escape hatch for heterogeneity, not the default. My Java/C# instinct to reach for `dyn` first is the named anti-reflex."

This file holds the **production prose** for each step's fields. All content and meta-notes in English. **Delta-framed throughout** (spec §2.2 rule 1): traits are anchored to the interfaces the primary personas already write — Java for Yui (with monomorphization named as the inverse of her type-erasure model), TS for Mariana and Felipe. The error-anchor rule (§2.2.2) does not bind this lesson's read — it scopes to ownership/borrowing/lifetimes — but the scroll's signature compiler-error reveal still lands here, in predict 4.2 (`E0277`, unsized-`dyn` form).

**Harness note (applies to every `testCode` block below):** tests are written against the planned manual harness contract — `_t("user-facing sentence", || { _eq(actual, expected); })`, where `_eq` returns `Result<(), String>`. The exact harness header/footer (the `_t`/`_eq` definitions, runner `main`, `__DOJO_RESULT__` emission, `catch_unwind` wrapping) lands at seed (W3) per rust.md §5. The learner-`main`-vs-harness-`main` merge question stays flagged where lesson-1.md raised it.

---

## Step 4.1 — `read` — "Behavior contracts with static dispatch by default"

**Title:** `Traits: the interface you know, the dispatch you choose`
**Type:** `read`
**Word count target:** ~400 hard ceiling (code blocks and figure directive excluded). Borrow-check test §2.1 applied — **every sample compiles**; no error excerpt belongs in this read (predict 4.2 owns the lesson's reveal, and the read closes by posing its question). Embeds one `tabbed-card` figure (`dispatch-decision`, committed at the Phase A panel review) beside the decision-tree paragraph.

### `instruction` (markdown body)

```markdown
## Why this matters

You already hold this concept: a Rust **trait** is the interface you write in TypeScript or Java — a named contract of methods a type promises to honor. The twist has three parts: there is no inheritance (traits attach behavior to otherwise-flat types), a single *blanket impl* can cover every type matching a bound (a power your interfaces lack — `rust-traits-deep` owns it), and — the heart of this lesson — **dispatch is a choice you spell**, not a property of the language.

One inversion before the syntax, for the Java readers: your generics **erase** — one compiled method body, type parameters gone by runtime. Rust **monomorphizes** — one generic body in source, one specialized copy per concrete type in the binary. It is your erasure model running backwards. Flip it once and the rest is bookkeeping.

## Define, implement

Two statements: the contract, and a type honoring it. A trait method may ship a default body — implementors get it free and may override. The `&self` receiver is Lesson 2's shared borrow wearing method syntax; nothing new there.

```rust
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
```

## Consuming the contract: static by default

The generic bound is the workhorse. This compiles to a specialized `announce` per concrete type — direct calls, zero runtime cost, a slightly bigger binary:

```rust
fn announce<T: Greet>(guest: &T) -> String {
    format!("now arriving: {}", guest.name())
}
```

`fn announce(guest: &impl Greet)` is sugar for that exact generic — same monomorphization; you only lose the ability to name `T` at a call site. In **return** position, `impl Greet` means something else: "one concrete type, which I decline to name." The third spelling is different machinery:

```rust
let guests: Vec<Box<dyn Greet>> = vec![
    Box::new(Person { name: String::from("Mariana") }),
    Box::new(Robot),
];
```

(Compiles next to the definitions above plus a one-line `struct Robot;` with its own `impl Greet`.) `Box<dyn Greet>` is **runtime dispatch**: one compiled body, every call through a vtable, the value behind a heap allocation. That price buys the one thing monomorphization cannot do: a collection holding *different* concrete types at once. Trait objects run deeper than this literacy — `&dyn`, explicit lifetimes on the object — and that depth is `rust-traits-deep`'s too.

## The decision — and the reflex to retire

If you write Java or C#, your reflex says an interface-typed value is always dynamically dispatched, so `dyn` looks like the honest default. In Rust it is the escape hatch. The tree: one concrete type → take it plainly; several types, all known at compile time → generic bound; genuine runtime heterogeneity → `Box<dyn Trait>`. The figure holds the three spellings of one contract side by side:

:figure[tabbed-card]{id="dispatch-decision"}

## `#[derive]`: traits the compiler writes

Some impls are mechanical enough to request instead of write:

```rust
#[derive(Debug, Clone, PartialEq)]
struct Session { id: u32 }

fn main() {
    let a = Session { id: 7 };
    let b = a.clone();
    println!("{:?} equals {:?}: {}", a, b, a == b);
}
```

`derive` is a macro — the mechanism is `rust-macros-declarative-and-procedural`'s topic; this scroll only asks you to read and use it. Next: four `announce`-shaped signatures, and the question of which ones the compiler accepts. Commit before you peek.
```

### Authoring notes

- **Delta rule (§2.2.1) is the load-bearing gate here:** the opening paragraph anchors to the TS/Java interface the personas already write; Yui's erasure model is explicitly named and inverted ("your erasure model running backwards") rather than monomorphization being taught from scratch. No "what is an interface" prose anywhere.
- No error excerpt in this read by design — the spec's voice_check demands every sample compile, and the closing line poses 4.2's question without front-running it.
- The `Vec<Box<dyn Greet>>` sample states its required context in one parenthetical, same convention as lesson-3's `From` sample.
- The read's `Greet`/`announce` example is deliberately distinct from the katas' `Describe` trait: same shape (worked-example effect), different identifiers, so the katas aren't pre-solved on this page.

### Paragraph-test audit (borrow-check test §2.1 — Valentina/Björn gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" (2 paragraphs) | "Is this a new concept or my interfaces renamed?" + Yui's erasure inversion, named | KEEP (delta opener — licensed lead-in; every concept it names ends in a sample below) |
| "Define, implement" | "How do I declare and honor the contract? What's a default method? What's `&self` here?" | KEEP — ends in a compiling sample covering all three |
| "Consuming the contract" | "Which of the three consuming signatures do I write, and what does each cost?" | KEEP — two compiling samples; `impl Trait` return position in one clause; both deferral sentences are one-line pointers per §2.6 |
| "The decision — and the reflex to retire" | Names the Java/C# `dyn`-first reflex; the decision tree is the load-bearing summary | KEEP — terminates in the tabbed-card (three compiling samples, one per tab) |
| "`#[derive]`" | "Why does Rust code start with attribute soup, and may I use it without understanding macros?" | KEEP — ends in a compiling sample; macro mechanism deferred in one sentence; flows into the forward prompt |

**What got cut:** trait inheritance / supertraits (deep-dive territory), `where` clauses (named in kata 4.4's `alternative_approach` instead — one spelling is enough for a read), associated types and generic traits (`rust-traits-deep`), orphan-rule mechanics (the blanket-impl sentence points at the deep-dive that owns coherence), any `&dyn Greet` sample (4.2's reveal introduces it as the compiler's own suggestion — stronger placement).

---

## Step 4.2 — `predict` — "Which of these signatures compile?"

**Title:** `Predict: which of these signatures compile?`
**Type:** `predict`
**Mental model under test:** the three consuming signatures from the read all compile; the fourth — the bare `dyn Trait` parameter, which *is* the Java/C# signature transliterated — is unsized and rejected with `E0277`. The traps: the Java/C# dyn-first reflex (most important — it makes the broken signature look like the normal one), the trait-objects-are-radioactive overcorrection, and the half-remembered "impl Trait is return-only" rule. **Fail-shaped per the panel fix that satisfied Maya's (S11) gate.**

### `instruction` (short intro shown above the snippet)

```markdown
The read ended pointing here: four signatures, one trait — the same `Greet`. Commit to an answer before you reveal.
```

### `question`

```
Which of these four signatures compile?
```

### `snippet`

```rust
trait Greet {
    fn name(&self) -> String;
}

fn greet_generic<T: Greet>(guest: T) -> String { guest.name() }

fn greet_impl(guest: impl Greet) -> String { guest.name() }

fn greet_boxed(guest: Box<dyn Greet>) -> String { guest.name() }

fn greet_dyn(guest: dyn Greet) -> String { guest.name() }
```

### `options`

```yaml
- id: a
  text: "All four — they are four spellings of the same contract"
- id: b
  text: "Three — `greet_dyn` is rejected; the other three compile"
- id: c
  text: "Two — only `greet_generic` and `greet_impl`; trait objects cannot be function parameters at all"
- id: d
  text: "Three — `greet_impl` is rejected; `impl Trait` is only legal as a return type"
correct: b
```

### `feedback` (per option, sensei voice)

**a — All four compile:**
> The Java/C# reflex, in its purest form: there, `String f(Greet guest)` is the daily signature, an interface-typed parameter is just a reference, and dispatch is dynamic — always, invisibly. `fn greet_dyn(guest: dyn Greet)` is that signature transliterated, which is exactly why it reads as the *normal* one. But Rust passes parameters by value, a value needs a compile-time size to get a stack slot, and `dyn Greet` is precisely the type whose size depends on which implementor shows up at runtime. The real output is below.

**b — Three compile, `greet_dyn` fails:**
> Correct — and the three that compile are not three spellings of one thing. Two of them are the same machine code and the third is different machinery. The error and the dispatch walk are below.

**c — Two compile, both `dyn` forms fail:**
> The overcorrection that follows first contact with the unsized rule: "trait objects can't cross function boundaries." They can — behind a pointer. `Box<dyn Greet>` is a fat pointer (data pointer + vtable pointer), a perfectly fixed-size parameter; `&dyn Greet` works the same way. The rule was never "no trait objects in signatures" — it is "no unsized values *by value*." The real output is below.

**d — Three compile, `greet_impl` fails:**
> The half-remembered rule. `impl Trait` did premiere in return position — and that is where it is irreplaceable ("one concrete type, unnamed"). But argument position is legal, stable for years, and is pure sugar for the generic on the line above it: same monomorphization, same zero cost. The real output is below.

### `reveal` — the E0277 walk (appended to every option's feedback at seed, so each path sees it)

```markdown
Three of the four compile. Here is what rustc says about `greet_dyn`:

```text
error[E0277]: the size for values of type `(dyn Greet + 'static)` cannot be known at compilation time
  --> src/main.rs:11:14
   |
11 | fn greet_dyn(guest: dyn Greet) -> String { guest.name() }
   |              ^^^^^ doesn't have a size known at compile-time
   |
   = help: the trait `Sized` is not implemented for `(dyn Greet + 'static)`
   = help: unsized fn params are gated as an unstable feature
help: function arguments must have a statically known size, borrowed types always have a known size
   |
11 | fn greet_dyn(guest: &dyn Greet) -> String { guest.name() }
   |                     +
```
<!-- verify-at-smoke: rustc 1.68.2 -->

First, the code. You have met `E0277` before: in Lesson 3 it refused `?` inside a function returning `i32`. `E0277` is not one error — it is the **family** "a required trait bound is not satisfied," and the unsatisfied trait is named in the first `help:` line each time. There it was the `?`-plumbing's `FromResidual`; here it is `Sized`, the implicit bound every by-value parameter carries. When you meet the next family member, that `help:` line is where you look first.

Why `dyn Greet` specifically: parameters are passed by value, and a value needs a compile-time size to get a stack slot. `dyn Greet` is the type whose concrete implementor — and therefore size — is only known at runtime. The compiler's last `help:` writes the fix for you: put it behind a pointer. `&dyn Greet` and `Box<dyn Greet>` are both pointer-sized, and pointers always have a known size. (The `'static` in the message is the lifetime cameo from Lesson 2's error walk — recognize it, don't write it; owned trait objects default to it, and the full story belongs to `rust-traits-deep`.)

Now the three that compile — they are not interchangeable:

- `greet_generic` and `greet_impl` produce **identical machine code**: static dispatch, monomorphized per concrete type, zero runtime cost. The only difference is at the call site — the generic's type can be named explicitly (`greet_generic::<Person>(dev)`); the `impl Trait` version's cannot.
- `greet_boxed` is **dynamic dispatch**: one compiled body, a vtable lookup per call, a heap allocation per value. The right signature when the caller genuinely holds mixed concrete types — and a silent tax everywhere else.

Name the reflex once more, because this is where it picks wrongly: the Java/C# instinct says "interface parameter means dynamic dispatch, always" — which makes `greet_boxed` look like the workhorse and `greet_generic` look exotic. Rust's default runs the other way: reach for the bound; pay for the box only when heterogeneity is real. The next two katas have you write both halves — the contract with its impls, then the generic consumer.
```

### Authoring notes

- The quoted output is expected-from-knowledge; smoke recaptures from Piston's 1.68.2 and the seed pastes the recaptured text verbatim (spec §2.7). What the recapture settles: whether 1.68.2 emits the `unsized fn params are gated` help line in this position, the exact suggestion rendering (`+` underline form), and the spans (the snippet is captured wrapped in a `fn main() {}` stub, which shifts line numbers). The walk's stable anchors: the `E0277` code, `Sized` not implemented for `(dyn Greet + 'static)`, and the borrow suggestion.
- The spec writes all four signatures as `fn f(...)`; they are renamed `greet_generic` / `greet_impl` / `greet_boxed` / `greet_dyn` so the snippet is a single compilable-except-one file and the error output names the failing one unambiguously. Flagged in the W2 report, not improvised silently.
- Per-option feedback stays reflex-specific (predict voice contract per INTERACTIVITY-PATTERNS); the shared walk ships appended to each feedback entry at seed since the player's `predict` schema has no separate reveal field — same convention as 1.2.
- Family naming honors the spec's de-spoiling direction: Lesson 3's read did not mention the unsized form; this reveal owns the linkage backwards.

---

## Step 4.3 — `kata` — "Define a struct, implement a trait" *(production gesture G1)*

**Title:** `Define a struct, implement a trait`
**Type:** `kata`
**1-line task:** The starter shows a complete worked example (`Person`: struct + inherent impl + trait impl); the learner types the same three blocks for `Point` — struct definition, inherent `impl` with a constructor, and `impl Describe for Point`.

### `instruction` (markdown body)

```markdown
## Your task

The starter is a complete worked example: `struct Person`, its **inherent impl** (`impl Person` — the type's own methods, here a constructor), and its **trait impl** (`impl Describe for Person` — the promise that `Person` honors the contract). Your job is the same three blocks for a new type, typed with your own hands:

1. **Define `struct Point`** with two fields: `x: i32` and `y: i32`.
2. **Give it an inherent impl** with a constructor, so `Point::new(3, 4)` builds the point.
3. **Implement `Describe` for it**, so `Point::new(3, 4).describe()` returns exactly `"(3, 4)"`.

The two impl blocks are different statements on purpose: `impl Point` is where a type's own API lives; `impl Describe for Point` is the contract being honored. Production Rust types routinely carry both — which is why you write both.

### What's expected

```rust
Person::new("Mariana").describe()  // "Mariana (person)" — the worked example, already passing
Point::new(3, 4).describe()        // "(3, 4)"
Point::new(-1, 12).describe()      // "(-1, 12)"
```
```

### `starterCode`

```rust
trait Describe {
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

// Your turn: the same three blocks for `Point` (fields x: i32, y: i32).

fn main() {
    println!("{}", Person::new("Mariana").describe());
    // once Point exists, try:
    // println!("{}", Point::new(3, 4).describe());
}
```

### `testCode`

> Harness preamble (`_t`/`_eq` definitions, panic capture, the `__DOJO_RESULT__` footer) is finalized at seed (W3) per rust.md §5 — the `_t("sentence", || { _eq(...); })` calls below are the contract.

```rust
fn main() {
    _t("Point::new stores both coordinates for describe to use", || {
        _eq(Point::new(3, 4).describe(), String::from("(3, 4)"));
    });
    _t("a different point describes itself, not the example", || {
        _eq(Point::new(-1, 12).describe(), String::from("(-1, 12)"));
    });
    _t("the worked example still describes itself", || {
        _eq(Person::new("Mariana").describe(), String::from("Mariana (person)"));
    });
}
```

### `hint`

```markdown
All three blocks you need are already on screen with different names: the worked example is the skeleton — the struct, the inherent `impl Type { ... }`, the trait `impl Trait for Type { ... }`. Only the fields, the constructor's parameters, and the produced text change. For the text itself, `format!` does the assembling, and the expected output is the two fields with parentheses and a comma around them — the instruction's examples pin it exactly.
```

### `referenceSolution`

```rust
trait Describe {
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
```

### `alternative_approach` (shown after pass — the derive-exploration prompts, per the panel decision: no second playground)

```markdown
Two derive experiments worth five minutes each, right here in this editor:

1. Add `#[derive(Debug)]` above your `Point`, print it with `println!("{:?}", Point::new(3, 4))`, and look at the output you didn't write. Then **delete the derive and run again** — the error that comes back is `E0277`, the trait-bound family from the predict: `{:?}` requires the `Debug` bound, and your type no longer satisfies it. A derive is just a trait impl the compiler wrote; removing it un-implements the trait.
2. With the derive back in place, change `{:?}` to `{}`. It refuses — `{}` requires `Display`, and `Display` is **not derivable**. The standard library declines to guess what a user-facing rendering of your type should look like; that is a judgment call, so you write it. You already made exactly this call twice: `Display` by hand in Lesson 3, and `describe` here. `{:?}` is for developers and derivable; `{}` is for users and written.
```

### Why these tests

| Test | Lands |
|---|---|
| `Point::new(3, 4).describe()` → `"(3, 4)"` | The core gesture: all three learner-written blocks must exist and cooperate — struct fields, constructor, `&self` trait method. |
| A different point | Catches a `describe` that hardcodes the instruction's example instead of reading `self`. |
| The worked example still passes | Guards against "solving" the kata by editing `Person` to satisfy the suite; also makes the outline's both-types assertion explicit. |

### Hint-discipline check (§2.5)

The hint names the three-block *shape* and `format!` — both sanctioned by the spec's own 4.3 outline ("points at the `impl Trait for Type` shape and at f-string-equivalent `format!` — not at the bodies"). It does not show a single line of `Point`'s code; the expected strings are pinned by the instruction's contract, not leaked by the hint. The starter's placeholder comment states *what* to define (the contract), never *how*.

---

## Step 4.4 — `kata` — "A generic function with a bound"

**Title:** `A generic function with a bound`
**Type:** `kata`
**1-line task:** Write `announce` — generic over any `T: Describe`, taking `&[T]`, returning one description per item. The tests call it with `Person` *and* `Point`: monomorphization made observable.

### `instruction` (markdown body)

```markdown
## Your task

Write `announce`: a single generic function that takes a slice of values of **any type implementing `Describe`** and returns a `Vec<String>` holding one description per item, in order. An empty slice announces nothing — an empty `Vec`.

The starter already carries `Describe`, `Person`, and `Point` with their impls — kata 4.3's work, pre-written so this step stands alone. You write one function. The tests then call it with a slice of `Person` **and** a slice of `Point` — that second call is the lesson: one body in your source, and the compiler monomorphizes a specialized copy per concrete type. The read's inverse-of-erasure point, observable.

### What's expected

```rust
announce(&team)    // &[Person] -> vec!["Mariana (person)", "Yui (person)"]
announce(&path)    // &[Point]  -> vec!["(0, 0)", "(3, 4)"]
announce(&nobody)  // empty     -> vec![]
```
```

### `starterCode`

```rust
trait Describe {
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

// Your code: write `announce` here — generic, bounded, slice in, Vec<String> out.

fn main() {
    // once announce exists, try:
    // let team = vec![Person { name: String::from("Mariana") }];
    // println!("{:?}", announce(&team));
}
```

### `testCode`

> Harness preamble (`_t`/`_eq` definitions, panic capture, the `__DOJO_RESULT__` footer) is finalized at seed (W3) per rust.md §5 — the `_t("sentence", || { _eq(...); })` calls below are the contract.

```rust
fn main() {
    _t("announces every person in a slice, in order", || {
        let team = vec![
            Person { name: String::from("Mariana") },
            Person { name: String::from("Yui") },
        ];
        _eq(announce(&team), vec![
            String::from("Mariana (person)"),
            String::from("Yui (person)"),
        ]);
    });
    _t("the same function announces points — one source body, two compiled copies", || {
        let path = vec![Point { x: 0, y: 0 }, Point { x: 3, y: 4 }];
        _eq(announce(&path), vec![
            String::from("(0, 0)"),
            String::from("(3, 4)"),
        ]);
    });
    _t("an empty slice announces nothing", || {
        let nobody: Vec<Person> = vec![];
        _eq(announce(&nobody), Vec::<String>::new());
    });
}
```

### `hint`

```markdown
The signature is the kata: a type parameter constrained to the trait — the read's `announce` and the figure's first tab show the `<T: Trait>` shape on a different trait — and a parameter that is a borrowed slice of that type. The return type is in the instruction.

For the body: walk the slice, build a `Vec<String>` from what each item produces. The explicit loop-and-push and the `.iter()` / `.map(...)` / `.collect()` family both land the same place — write whichever your hands prefer; the alternative approach shows the other.
```

### `referenceSolution`

```rust
fn announce<T: Describe>(items: &[T]) -> Vec<String> {
    items.iter().map(|item| item.describe()).collect()
}
```

### `alternative_approach` (shown after pass)

```markdown
The explicit loop — same monomorphization, same result:

```rust
fn announce<T: Describe>(items: &[T]) -> Vec<String> {
    let mut descriptions = Vec::new();
    for item in items {
        descriptions.push(item.describe());
    }
    descriptions
}
```

Two notes. The bound also spells as a `where` clause — `fn announce<T>(items: &[T]) -> Vec<String> where T: Describe` — identical meaning, preferred when bounds pile up. And the `dyn` version (`items: &[Box<dyn Describe>]`) would type-check too: it would pay a heap allocation per item and a vtable call per `describe` to buy heterogeneity these tests never ask for. Both slices here are homogeneous — the generic is the right tool, which is exactly what read 4.1's decision tree was selling.
```

### Why these tests

| Test | Lands |
|---|---|
| Slice of `Person`, in order | The base contract: one description per item, order preserved, `Vec<String>` out. |
| Slice of `Point` | The monomorphization point made by the test itself (per the outline): the same source function serves a second concrete type. A non-generic `announce(&[Person])` passes test 1 and dies here. |
| Empty slice | Boundary case; also catches bodies that index unconditionally. |

### Hint-discipline check (§2.5)

The instruction states the contract in words ("a slice of values of any type implementing `Describe`") and deliberately never prints the signature — assembling `fn announce<T: Describe>(items: &[T]) -> Vec<String>` *is* the production gesture. The hint points at the `<T: Trait>` shape by reference to the read and the figure, and names `.iter()`/`.map(…)`/`.collect()` as a family without assembling the chain or showing the closure — both moves sanctioned by the spec's own 4.4 outline. The starter scaffold (trait + both types + impls) is complete; only the learner's function is a comment placeholder, per the production-gesture rule (README §4.4) taking precedence over the signature-present default (README §5.4) — flagged in the W2 report.

---

## Self-review checkpoint (before commit)

- [x] Read 4.1 under the ~400-word ceiling (code blocks and figure directive excluded); paragraph audit included; what got cut is named.
- [x] **Delta rule (§2.2.1):** traits framed as the TS/Java interface with a named twist; Yui's monomorphization-as-inverse-of-erasure named explicitly ("your erasure model running backwards"); the Java/C# `dyn`-first reflex named in the read and again in 4.2's feedback and reveal. Zero from-scratch interface prose.
- [x] Every sample in read 4.1 **compiles** under rustc 1.68.2 (voice_check) — no error excerpt in the read; predict 4.2 owns the lesson's reveal.
- [x] Predict 4.2: four signatures, correct answer "three of four"; the bare `dyn Greet` fails with `E0277` (unsized); full expected output quoted with `<!-- verify-at-smoke: rustc 1.68.2 -->`; `E0277` named as an error **family** with the explicit back-link to Lesson 3's `?` form; dispatch difference taught across the three that compile; per-option feedback names the reflex (Java/C# transliteration / overcorrection / return-only misremembering).
- [x] Kata 4.3 (gesture G1): learner defines the struct **and both impl blocks** — inherent (`Point::new`) + trait (`impl Describe for Point`); tests construct both types and assert both `describe()` outputs; the two derive-exploration prompts live in `alternative_approach` per the panel decision (no second playground).
- [x] Kata 4.4: generic bound written by the learner (signature stated in words, not printed); tests call with `Person` and `Point` so monomorphization is the test's own point; `where`-clause spelling and the dyn-cost contrast live in `alternative_approach`.
- [x] **Hint discipline (§2.5):** 4.3 hint names shape + `format!` (spec-sanctioned), never the bodies; 4.4 hint names the method family without assembling the chain (spec-sanctioned). Hint-discipline check sections included per kata.
- [x] All code compiles under rustc 1.68.2, std only, single file — `Box`, `vec!`, `#[derive]`, field-init shorthand, `impl Trait` in argument position are all well pre-1.68; nothing post-1.68 anywhere.
- [x] testCode uses the `_t`/`_eq` contract shape with the harness-at-seed note; all tests deterministic; test names are user-facing sentences.
- [x] One figure embedded (`tabbed-card` — `dispatch-decision`), data spec below; three tabs, same contract per tab, cost/capability one-liner each.
- [x] Every word in English — titles, instructions, hints, options, feedback, code comments, captions, meta-notes. No emoji, no celebration.

---

## Figure data spec

Read 4.1 embeds `:figure[tabbed-card]{id="dispatch-decision"}` beside the decision-tree paragraph.

### `dispatch-decision` (`tabbed-card`) — embedded in Step 4.1

- **Slot:** terminates "The decision — and the reflex to retire", after the decision tree it visualizes, before the `#[derive]` section.
- **Tab contract:** three tabs = the `<T: Trait>` / `impl Trait` / `Box<dyn Trait>` decision; every tab is a lens on the *same* `Greet`/`announce` contract (one identity, multiple views — the pattern's own rule), each closing with a cost/capability one-liner.
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ````ts
  {
    type: 'tabbed-card',
    id: 'dispatch-decision',
    defaultTab: 0,
    tabs: [
      {
        label: '<T: Greet>',
        body: `\`\`\`rust
fn announce<T: Greet>(guest: &T) -> String {
    format!("now arriving: {}", guest.name())
}
\`\`\`
**Static dispatch, monomorphized.** One specialized copy per concrete \`T\` in the binary; calls are direct and cost nothing at runtime, and callers can name the type (\`announce::<Person>(&dev)\`). Cost: binary size grows per type. **The default when the types are known at compile time.**`,
      },
      {
        label: 'impl Greet',
        body: `\`\`\`rust
fn announce(guest: &impl Greet) -> String {
    format!("now arriving: {}", guest.name())
}
\`\`\`
**The same static dispatch, sugared.** Compiles to exactly the first tab — same monomorphization, same zero runtime cost. What you trade away: callers can no longer name the type explicitly. **Reads lighter for one-off bounds; identical machinery.**`,
      },
      {
        label: 'Box<dyn Greet>',
        body: `\`\`\`rust
fn announce(guest: Box<dyn Greet>) -> String {
    format!("now arriving: {}", guest.name())
}
\`\`\`
**Dynamic dispatch.** One compiled body; every call goes through a vtable and the value lives behind a heap allocation. What that buys: runtime heterogeneity — a \`Vec<Box<dyn Greet>>\` holds different concrete types at once. **The escape hatch, not the default.**`,
      },
    ],
    caption:
      'Three signatures, one contract. The first two compile to the same monomorphized code — pick by call-site ergonomics. The third buys runtime heterogeneity with a vtable and an allocation. Choose by dispatch need, not by which spelling resembles home.',
  }
  ````
- **Maya-gate (every tab earns its open):** the reader arrives holding the read's decision tree and a concrete question per tab — "what does the workhorse look like?", "what's the sugar and what does it drop?", "what does the escape hatch cost?". No metadata tabs; each body answers its question and ends with the cost/capability line.
- **Why this earns embedding:** the dispatch decision is one identity (the `announce` contract) under three lenses — the tabbed-card's exact use case. Inline, the three signatures would read as a wall of near-identical code blocks whose *differences* are the entire lesson; the tab switch makes the sameness of the contract and the difference of the machinery the interaction itself. It also pre-loads predict 4.2: three of its four signatures are these tabs.
