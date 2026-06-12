# Rust — Lesson 1: Ownership: the mental model that replaces the GC

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [rust.md §4 Lesson 1](rust.md#lesson-1--ownership-the-mental-model-that-replaces-the-gc) — the contract. Gates §2.1 (borrow-check test), §2.2 (format exception: delta rule + error-anchor rule with pairing clause), §2.5 (hint ladder), §2.7 (compiler-error reveal) apply.
> **Primary audience:** A1 Mariana (JS senior) + A3 Yui (Java senior) + A4 Felipe (TS modernizer). Secondary: A2 Esteban (Python mid-senior).
> **Step count:** 5 (1 `read` + 1 `predict` + 2 `kata` + 1 `playground`).
> **What changes in the learner's head:** "Every value has exactly one owner; when the owner goes out of scope the value is dropped; assignment MOVES ownership for non-`Copy` types. I just read `E0382` and I know what the compiler is asking. Cloning is an option — a thoughtful one, not a reflex."

This file holds the **production prose** for each step's fields. All content and meta-notes in English. This is the format exception's from-scratch lesson #1 (spec §2.2); the first compiler-error reveal lands in step 1.2, inside the scroll's first 25 minutes (Björn's constraint).

**Harness note (applies to every `testCode` block below):** tests are written against the planned manual harness contract — `_t("user-facing sentence", || _eq(actual, expected))`, where `_eq` returns `Result<(), String>`. The exact harness header/footer (the `_t`/`_eq` definitions, `main` that runs the tests, `__DOJO_RESULT__` emission, `catch_unwind` wrapping) lands at seed (W3) per rust.md §5. Open seeding question, flagged: the §5 harness sketch owns `main`, while this lesson's starters include a learner-facing `main` per the spec's own outlines (1.3, 1.4, 1.5) — the merge mechanics (strip/rename the learner `main`, or run tests from the harness's entry) must be resolved with Tomás (C3) at the Lesson 1 smoke.

---

## Step 1.1 — `read` — "Every value has exactly one owner"

**Title:** `Every value has exactly one owner`
**Type:** `read`
**Word count target:** ~400 hard ceiling (code blocks excluded). Borrow-check test §2.1 applied. Ends with the cliffhanger snippet + **E0382 headline line only**, per §2.2 rule 2's pairing clause — the full error walk belongs to predict 1.2's reveal, not here. Embeds one `disambiguation` figure (`copy-vs-clone`, committed at the Phase A panel review).

### `instruction` (markdown body)

```markdown
## Why this matters

Rust has no garbage collector and no manual `free`. What replaces both is one rule, enforced at compile time. This read gives you the rule; the rest of the scroll is the compiler teaching you its consequences. Everything else — borrowing, lifetimes, why functions take `&str` — sits on top of this.

## The rule

Every value has exactly one owner: the binding that holds it. When the owner goes out of scope, the value is dropped — deterministically, at a line you can point to. (If you know C++ RAII, this is that; if you don't, the clause costs you nothing.) Assignment and passing-to-a-function **move** ownership, unless the type is `Copy` or you pass a borrow — borrows are Lesson 2.

```rust
fn main() {
    let report = String::from("4 errors, 12 warnings");
    {
        let scratch = String::from("temp buffer");
        println!("{} / {}", report, scratch);
    } // scratch dropped here — deterministic, no GC involved
    println!("{}", report);
}
```

## `Copy` types vs owned heap types

`i32`, `bool`, `char`, `f64`, and tuples or arrays of `Copy` types are duplicated on assignment — copying a few fixed bytes is free, so there is nothing to own exclusively. `String`, `Vec<T>`, and `Box<T>` own a heap allocation, and for them assignment moves. The why is concrete: if assignment duplicated *ownership* of a heap buffer, two owners would each free it at scope exit — a double-free, the classic C bug. So Rust transfers instead: the new binding owns the buffer, the old binding is dead. When you genuinely want a second, independent copy of owned data, that exists too — as an explicit, possibly-allocating call, never as a silent assignment. The figure pins the contrast.

```rust
fn main() {
    let count = 42;        // i32 is Copy
    let snapshot = count;  // duplicated — both stay valid
    println!("{} {}", count, snapshot);
}
```

:figure[disambiguation]{id="copy-vs-clone"}

## The reflex to unlearn

In JavaScript, Java, or Python, `let s2 = s1` copies a reference; both names stay valid and the runtime cleans up eventually. Your fingers will type that pattern in Rust within ten minutes. In Rust, for a non-`Copy` type, that same line moves ownership: `s2` owns the data now, and `s1` is no longer a usable name. Internalize this — everything else in the scroll sits on it.

So, concretely. You have the rule. Does this compile — and if not, what exactly does the compiler say?

```rust
fn main() {
    let s1 = String::from("dojo");
    let s2 = s1;
    println!("{}", s1);
}
```

`rustc`'s answer starts like this:

```text
error[E0382]: borrow of moved value: `s1`
```
<!-- verify-at-smoke: rustc 1.68.2 -->
```

### Authoring notes

- **Pairing clause honored (§2.2 rule 2):** the read carries the cliffhanger snippet plus the E0382 **headline line only**. The full multi-line output, the line-by-line walk (move site, use site, the missing-`Copy` note), and the three responses to E0382 all live in predict 1.2's reveal — quoting them here would pre-answer the predict.
- The drop-at-scope-exit ≈ RAII mapping is one clause, no C++ excursion, per the spec outline.

### Paragraph-test audit (borrow-check test §2.1 — Valentina/Björn gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "What replaces the GC, and why should I care before syntax?" | KEEP (framing; no concept taught without its sample below) |
| "The rule" | "When is a value freed, and what happens on assignment?" | KEEP — ends in a compiling sample with the drop point marked |
| "`Copy` types vs owned heap types" | "Why do `i32` and `String` behave differently on `=`?" — the double-free why, not a memorized list | KEEP — ends in a compiling sample; figure pins Copy-vs-Clone |
| "The reflex to unlearn" | Names the JS/Java/Python reference-copy reflex explicitly (delta voice, README §7.1) | KEEP — flows into the cliffhanger |
| Cliffhanger | Hypothesis activation for 1.2 — posed question + headline line, nothing more | KEEP — the read ends in code + quoted headline, not prose |

**What got cut:** stack-vs-heap diagrams (the double-free sentence does the motivating work without a memory-layout excursion), the full E0382 anatomy (1.2's reveal owns it), `Rc`/shared ownership (deferred per spec §2.6), any mention of borrowing beyond naming it as Lesson 2.

---

## Step 1.2 — `predict` — "Does this compile?"

**Title:** `Predict: does this compile?`
**Type:** `predict`
**Mental model under test:** assignment of a non-`Copy` value moves ownership and the compiler rejects use-after-move at compile time. The traps: the JS reference-copy reflex, the C warnings-not-errors reflex, the C++ compiles-then-UB reflex. **First compiler-error reveal of the scroll.**

### `instruction` (short intro shown above the snippet)

```markdown
The read ended on this cliffhanger, expanded by one use. Commit to an answer before you reveal.
```

### `question`

```
Does this compile — and if not, what does rustc say?
```

### `snippet`

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;
    println!("{} {}", s1, s2);
}
```

### `options`

```yaml
- id: a
  text: "Compiles — prints `hello hello`"
- id: b
  text: "Compiles, with a warning about the moved value"
- id: c
  text: "Fails to compile — `E0382`, borrow of moved value"
- id: d
  text: "Compiles, but crashes at runtime with a use-after-free"
correct: c
```

### `feedback` (per option, sensei voice)

**a — Compiles, prints `hello hello`:**
> The JS/Java/Python reflex: `let s2 = s1` copies a reference, both names point at the same string, everyone's happy. In Rust there is no shared reference here to copy — `String` owns its heap buffer, and assignment of a non-`Copy` type transfers that ownership. After line 3, `s1` is not a stale pointer; it is not a usable name at all. The compiler proves that before a binary exists. The real output is below.

**b — Compiles with a warning:**
> The C reflex: the compiler warns about the sketchy thing and lets you ship it. Rust draws the line differently — ownership violations are **errors**, never warnings. There is no `-Wmove-after-use` to ignore; the program is rejected until the ownership story is coherent. The real output is below.

**c — Fails to compile, `E0382`:**
> Correct — and the message is worth more than the verdict. Walk it line by line below: this error is the scroll's recurring character.

**d — Compiles, crashes at runtime:**
> The C++ reflex: use-after-move compiles and detonates at runtime (undefined behavior, if it bothers to detonate at all). Rust took the same move semantics and made the misuse a *compile-time* rejection — there is no runtime to crash because no binary is produced. The real output is below.

### `reveal` — the E0382 walk (appended to every option's feedback at seed, so each path sees it)

```markdown
Here is the full output:

```text
error[E0382]: borrow of moved value: `s1`
 --> main.rs:4:23
  |
2 |     let s1 = String::from("hello");
  |         -- move occurs because `s1` has type `String`, which does not implement the `Copy` trait
3 |     let s2 = s1;
  |              -- value moved here
4 |     println!("{} {}", s1, s2);
  |                       ^^ value borrowed here after move
  |
error: aborting due to previous error

For more information about this error, try `rustc --explain E0382`.
```
<!-- verify-at-smoke: rustc 1.68.2 -->

Line by line:

- ``error[E0382]: borrow of moved value: `s1` `` — the headline: a stable code you can look up, the value involved, and the charge.
- ``move occurs because `s1` has type `String`, which does not implement the `Copy` trait`` — the *why*. The compiler names the exact rule from the read: `String` isn't `Copy`, so assignment moved.
- ``value moved here`` — the move site. Ownership left `s1` on `let s2 = s1;`.
- ``value borrowed here after move`` — the use site. (`println!` borrows its arguments, which is why the headline says *borrow* of moved value, not *use*.)
- The footer hands you a habit: `rustc --explain E0382` prints a long-form explanation. It works for every error code in this scroll — bookmark the command.

Three responses to `E0382` exist, and you will choose between them for the rest of your Rust life:

1. **Clone** — duplicate the data. Legitimate when two owners are genuinely needed; a reflex when they aren't.
2. **Restructure** — reorder the code, or return ownership, so one owner suffices.
3. **Borrow** — use the value without taking ownership at all. That's Lesson 2.

The next kata hands you this exact error and asks for the fix. The first two responses are on the table; the third isn't yet.
```

### Authoring notes

- The quoted output is expected-from-knowledge; smoke recaptures from Piston's 1.68.2 and the seed pastes the recaptured text verbatim (spec §2.7). In particular: whether 1.68.2 appends a macro-origin `= note:` line for the `println!` expansion, and whether it offers a `help: consider cloning` suggestion (believed post-1.68), is exactly what the recapture settles — the walk's five anchors (headline, missing-`Copy` label, move site, use site, `--explain` footer) are stable across versions.
- Per-option feedback stays reflex-specific (predict voice contract); the shared walk ships appended to each feedback entry at seed since the player's `predict` schema has no separate reveal field.

---

## Step 1.3 — `kata` — "Fix the move" *(fail-by-design)*

**Title:** `Fix the move`
**Type:** `kata`
**1-line task:** The starter fails with `E0382` on purpose; make the minimal change that compiles and keeps the expected output. Two of the three responses from 1.2 are valid; the kata is the choice.

### `instruction` (markdown body)

```markdown
**This starter does not compile — by design. The `E0382` error you get when you run it is the brief: read it before you touch the code.**

`banner` builds the string `"dojo meets dojo"`, but ownership of `s1` is gone by the time the last line needs it. Make the minimal change so the code compiles and `banner()` still returns `"dojo meets dojo"`.

From the predict's reveal, three responses to `E0382` exist. Two are available right now, and **both are accepted**:

1. **Duplicate the data** with `.clone()` — legitimate here, since the code as written wants two owners.
2. **Restructure** so one owner is enough.

The third — borrowing, using the value without owning it — is Lesson 2's whole topic. Pick one of the two, and be able to say why.
```

### `starterCode`

```rust
fn banner() -> String {
    let s1 = String::from("dojo");
    let s2 = s1;
    format!("{} meets {}", s1, s2)
}

fn main() {
    println!("{}", banner());
}
```

### `testCode`

```rust
// Harness contract — exact _t/_eq definitions, runner main, and
// __DOJO_RESULT__ footer land with the seed harness (W3).

_t("banner still produces the expected text after your fix", || {
    _eq(banner(), String::from("dojo meets dojo"))
});

_t("banner can be called more than once", || {
    let first = banner();
    let second = banner();
    _eq(first, second)
});
```

### `hint`

```markdown
What the compiler is asking: you handed ownership of the data away on the marked line — after that, `s1` is a dead name, and the `format!` line tries to use it anyway.

Two honest ways out exist in your toolbox right now:

1. **Duplicate the data.** `String` has a method that produces a second, independent copy — an honest choice when two owners are real, as they are here.
2. **Restructure.** Does this function actually need two bindings? One owner, used twice, also satisfies the compiler — `format!` borrows its arguments rather than consuming them.

Pick one and defend it. The third response — borrowing across the function boundary — arrives next lesson.
```

### `referenceSolution`

```rust
// Response 1 — clone: two owners are real here
fn banner() -> String {
    let s1 = String::from("dojo");
    let s2 = s1.clone();
    format!("{} meets {}", s1, s2)
}

// Response 2 — restructure: one owner, used twice
fn banner() -> String {
    let s = String::from("dojo");
    format!("{} meets {}", s, s)
}

fn main() {
    println!("{}", banner());
}
```

### Why these tests

| Test | Lands |
|---|---|
| Expected text after the fix | The compile fix can't cheat the output — a fix that deletes the `s1` use entirely fails here. Asserted on the returned `String`, not raw stdout, per the spec. |
| Callable more than once | Guards against a "fix" that restructures `banner` into something stateful or partially-moved; also a determinism check. |
| *(implicit)* compiling at all | The real first gate. ExecuteStep must surface the compile error as learner feedback (stderr passthrough) — the spec's open infra question, validated with Tomás (C3) at Lesson 1 smoke. |

### Hint-discipline check (§2.5)

The instruction names `.clone()` because predict 1.2's reveal already put it on the table — per the spec's own 1.3 outline ("instruction framing picks up the three responses"). The **hint** stays one rung lower: layer-2 translation of what the compiler is asking, layer-3 names the clone-vs-restructure *choice* and never the call site (`s1.clone()` does not appear in hint text).

---

## Step 1.4 — `kata` — "Take ownership, give it back"

**Title:** `Take ownership, give it back`
**Type:** `kata`
**1-line task:** Write `fn shout(s: String) -> String` and fix `main` so the caller keeps a usable value after the call — the take-and-return-ownership round trip, no `.clone()`.

### `instruction` (markdown body)

```markdown
Write `shout`: it takes **ownership** of a `String` and returns ownership of the transformed value — every character uppercased. `"dojo"` comes back as `"DOJO"`.

There are two jobs here, and the second is the lesson:

1. Fill in `shout`'s body.
2. Fix the provided `main` — as written, it repeats this lesson's error: it gives `s` away and then tries to print it. `shout`'s signature already promises the value back; `main` has to catch it.

**No `.clone()`.** The signature makes duplication unnecessary — ownership flows out and comes back. (The "what's expected" below is the contract the tests assert.)

### What's expected

```rust
shout(String::from("dojo"))            // returns String::from("DOJO")
shout(String::from("Rust by Friday"))  // returns String::from("RUST BY FRIDAY")
```
```

### `starterCode`

```rust
fn shout(s: String) -> String {
    // your code: return the uppercased value, handing ownership back
    todo!()
}

fn main() {
    let s = String::from("dojo");
    shout(s);
    println!("{}", s); // fix this flow: main should print DOJO
}
```

### `testCode`

```rust
// Harness contract — exact _t/_eq definitions, runner main, and
// __DOJO_RESULT__ footer land with the seed harness (W3).

_t("shout returns the uppercased text", || {
    _eq(shout(String::from("dojo")), String::from("DOJO"))
});

_t("works for mixed-case input with spaces", || {
    _eq(shout(String::from("Rust by Friday")), String::from("RUST BY FRIDAY"))
});

_t("the caller keeps a usable value after the call", || {
    let banner = String::from("dojo");
    let banner = shout(banner);
    _eq(banner.len(), 4)
});
```

### `hint`

```markdown
Ownership flows out of `main` into `shout`, and — because of the return type — back out again. The idiom: catch the function's result in a binding. Rust even lets you bind it to the **same name** (shadowing): the old, moved-from binding ends, and a fresh one owns the returned `String`. Nothing is duplicated anywhere in that round trip.

For the body: you need an owned, uppercased `String` out of an owned `String` in. The standard library does the case work; your job is only to make sure ownership of the result leaves the function.
```

### `referenceSolution`

```rust
fn shout(s: String) -> String {
    s.to_uppercase()
}

fn main() {
    let s = String::from("dojo");
    let s = shout(s);
    println!("{}", s);
}
```

### `alternative_approach` (shown after pass — calls the clone detour out)

```markdown
The detour the instruction banned:

```rust
let s = String::from("dojo");
let shouted = shout(s.clone());
println!("{} {}", s, shouted);
```

This compiles — and buys a second heap allocation to avoid thinking about where ownership went. The signature already promises the value back; re-binding the return is free. When a function returns ownership, take it. Clone is for when two owners are *real*, like kata 1.3's banner — not for dodging the flow.
```

### Why these tests

| Test | Lands |
|---|---|
| Uppercased text | The content contract — `"dojo"` → `"DOJO"`. |
| Mixed-case input | Catches a solution hardcoding the sample or only handling lowercase ASCII at one position. |
| Caller keeps a usable value | The round-trip semantics — the test itself performs the re-bind, asserting the returned value is owned and usable after the call. This is the lesson wearing a test's clothes. |

### Hint-discipline check (§2.5)

The hint names *shadowing* as a concept and "the standard library does the case work" as a direction — it does not show `let s = shout(s);` and does not name `to_uppercase`. The instruction states the contract via input/output pairs instead of naming the method.

---

## Step 1.5 — `playground` — "Poke ownership at function boundaries"

**Title:** `Playground: poke ownership at function boundaries`
**Type:** `kata` (with `data.kind: "playground"` — verdict UI hidden, run button reads "↻ Try it", trivially-true harness assertion, per the contract inherited from Ruby/Python)
**Mental model under exploration:** function calls move ownership exactly like assignment does; a parameter type is an ownership decision.

### `instruction` (markdown body)

```markdown
## Try it

This step is a playground — no verdict, no pass/fail. The button runs whatever the file says and shows you the output. The point: this lesson's move rule applies to **function calls** exactly as it applied to `=`. Passing `s` to `print_and_consume` moves it, the same way `let s2 = s1` did.

The starter carries **three numbered prompts as comments**. Trying each one is an uncomment or a one-token edit — work through them in order:

1. **Prompt 1** uses the value after the call. You know *that* it fails — the question is: which error code, and what does its `help:` line suggest? Predict both, then uncomment and check yourself.
2. **Prompts 2 and 3 are a Lesson 2 teaser.** Each is a one-token change to the parameter type that makes prompt 1's line legal. You can see *that* they work; *why* they work — borrowing, and why `&str` accepts a `&String` — is the next lesson's job.
```

### `starterCode`

```rust
fn print_and_consume(s: String) {
    println!("consumed: {}", s);
}

fn main() {
    let s = String::from("dojo");
    print_and_consume(s);

    // 1. Uncomment the next line. Which error code do you get, and what
    //    does its `help:` line suggest? Predict before you run.
    // println!("still here: {}", s);

    // 2. Lesson 2 teaser: change the parameter type `String` to `&String`
    //    and the call to `print_and_consume(&s)`. Re-run with prompt 1
    //    uncommented — `s` survives the call.

    // 3. Lesson 2 teaser: now change `&String` to `&str`. Same call, still
    //    compiles. You can see THAT both work; WHY is the next lesson.
}
```

### `testCode`

```rust
// Playground: trivially-true assertion keeps the backend uniform; the
// frontend hides the verdict UI. Harness header/footer land at seed (W3).

_t("explored ownership at a function boundary", || _eq(true, true));
```

### `referenceSolution`

```rust
// Playground — no solution to reach. End state after prompt 3:
fn print_and_consume(s: &str) {
    println!("consumed: {}", s);
}

fn main() {
    let s = String::from("dojo");
    print_and_consume(&s);
    println!("still here: {}", s);
}
```

### Maya-gate check (S11 — playground voice contract)

The instruction does not reduce to "play around": prompt 1 demands a prediction (error code + `help:` content) before running; prompts 2-3 are specific one-token edits with a stated observation each. The prompts ship **inside the starter as numbered comments** — trying one is an uncomment or a one-token edit, never a re-type from the instruction (the audience fix: the difference between Mariana doing 1 of 3 and 3 of 3). The Lesson 2 teaser framing is explicit and honest: the playground shows *that*, the next lesson owns *why* (where deref coercion also gets its one-line name — not here).

---

## Self-review checkpoint (before commit)

- [x] Read 1.1 under the ~400-word ceiling (code blocks excluded); paragraph audit included; what got cut is named.
- [x] **Pairing clause (§2.2 rule 2):** read 1.1 ends with the cliffhanger snippet + the `E0382` headline line only. Full output, line-by-line walk, missing-`Copy` note, and the three responses live in 1.2's reveal — nowhere in the read.
- [x] **Error-anchor rule (§2.2.2):** the lesson's ownership teaching is anchored to real `E0382` output (1.2's reveal, full + walked); every quoted `rustc` excerpt carries `<!-- verify-at-smoke: rustc 1.68.2 -->`.
- [x] Predict 1.2 feedback names the specific reflex per option (JS reference-copy / C warning / C++ runtime-UB); correct-option feedback explains why, not just "correct".
- [x] 1.2's reveal closes with the **three responses to E0382** (clone / restructure / borrow-next-lesson); kata 1.3's instruction picks up exactly those, with borrowing explicitly deferred.
- [x] **Fail-by-design (1.3):** instruction's first line states the starter does not compile by design and the error is the brief (Yui's files-a-bug failure mode pre-empted). Tests assert on a returned `String`, not raw stdout.
- [x] **Hint discipline (§2.5):** 1.3 hint = layer-2 translation + layer-3 choice, no call site; 1.4 hint names shadowing as concept, never `to_uppercase` nor `let s = shout(s);`. Hint-discipline check sections included per kata.
- [x] 1.4 bans `.clone()` in the instruction; `alternative_approach` shows the clone detour and calls it out.
- [x] Playground prompts ship as numbered comments inside `starterCode`; prompts 2-3 framed as an explicit Lesson 2 teaser; Maya-gate check included.
- [x] All code compiles under rustc 1.68.2, std only, single file — no post-1.68 APIs anywhere (`to_uppercase` is 1.2-era; `todo!` is 1.40; no `is_some_and`, no `OnceLock`, no let-else used).
- [x] One figure embedded (`disambiguation` — `copy-vs-clone`), data spec below; single divergent dimension highlighted (`Explicitness`), other rows render unhighlighted.
- [x] Every word in English — titles, instructions, hints, options, feedback, code comments, captions, meta-notes.
- [x] Harness-`main` merge question flagged at the top of this file, not improvised.

---

## Figure data spec

Read 1.1 embeds `:figure[disambiguation]{id="copy-vs-clone"}` beside the "`Copy` types vs owned heap types" paragraph.

### `copy-vs-clone` (`disambiguation`) — embedded in Step 1.1

- **Slot:** after the `Copy`-vs-owned paragraph's compiling sample, before "The reflex to unlearn". Max-2-figures-per-read rule holds (this is the only one).
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ```ts
  {
    type: 'disambiguation',
    id: 'copy-vs-clone',
    sharedSkeletonLabel: 'Two ways to end up with two independent values',
    attributes: [
      'Explicitness',
      'What gets duplicated',
      'Typical types',
      'Original binding afterwards',
    ],
    entries: [
      {
        title: 'Copy',
        values: {
          'Explicitness': 'Implicit — plain assignment duplicates; nothing extra is written',
          'What gets duplicated': 'The bits themselves — fixed-size bitwise copy, always cheap',
          'Typical types': 'i32, bool, char, f64, tuples/arrays of Copy types',
          'Original binding afterwards': 'Still valid — both names own an independent value',
        },
      },
      {
        title: 'Clone',
        values: {
          'Explicitness': 'Explicit — you write .clone() and every reader sees the cost',
          'What gets duplicated': 'The owned data — runs code, may allocate (a String duplicates its heap buffer)',
          'Typical types': 'String, Vec<T>, Box<T>, most owned types',
          'Original binding afterwards': 'Still valid — you paid for the duplicate explicitly',
        },
      },
    ],
    highlightAttribute: 'Explicitness',
    caption:
      'Both columns end with two usable values. The dividing line is explicitness: Copy duplicates silently on assignment because it is always a cheap bitwise copy; Clone makes you write the call because it may allocate. A type with neither moves on assignment — the default this lesson is about.',
  }
  ```
- **Single-dimension rule (INTERACTIVITY-PATTERNS authoring rules):** only **Explicitness** carries `highlightAttribute`; the other three rows are unhighlighted cascade rows. The divergent dimension is one (implicit bitwise copy vs explicit, possibly-allocating call), exactly as the spec's figure commitment states — a multi-highlight version would be a `two-by-two` candidate, which this is not.
- **Why this earns embedding:** the read's prose establishes *that* `Copy` duplicates and owned types move; the figure adds the third cell of the mental model — explicit duplication exists and is spelled out in the code — without spending a paragraph on it. Deleting the figure forces a prose detour right before the cliffhanger, exactly where the read needs momentum. It also pre-loads kata 1.3's clone-vs-restructure choice with the "every reader sees the cost" framing.
