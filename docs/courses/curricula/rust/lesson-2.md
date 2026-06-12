# Rust — Lesson 2: Borrowing and references

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [rust.md §4 Lesson 2](rust.md#lesson-2--borrowing-and-references) · gates: [rust.md §2.1–§2.7](rust.md#2-sub-course-authoring-notes)
> **Primary audience:** A1 Mariana (JS senior) + A3 Yui (Java senior) + A4 Felipe (TS modernizer). Secondary: A2 Esteban (Python mid-senior).
> **Step count:** 5 (1 `read` + 1 `predict` + 1 `kata` + 1 `read+inline` + 1 `kata`).
> **What changes in the learner's head:** "Borrowing is how functions use a value without taking it: `&T` = read access, many allowed; `&mut T` = write access, exactly one, no readers alongside. `&str` is the default string argument type. I read `E0499` and the lifetime `'a` made a cameo — I can recognize it; I don't have to write it."

This file holds the **production prose** for each step's `instruction` / `feedback` / etc. fields. All content in English. Every quoted `rustc` excerpt is a smoke-capture placeholder: shape is correct for the 1.68.2 family, exact text is re-captured from Piston at the Lesson 1 smoke batch (rust.md §5).

**Harness note (applies to every `testCode` block below):** tests are written against the planned manual harness contract — `_t("user-facing sentence", || _eq(actual, expected))`, where `_eq` returns `Result<(), String>`. The exact harness header/footer (the `_t`/`_eq` definitions, runner `main`, `__DOJO_RESULT__` emission, `catch_unwind` wrapping) lands at seed (W3) per rust.md §5. The learner-`main`-vs-harness-`main` merge question stays flagged where lesson-1.md raised it.

---

## Step 2.1 — `read` — "`&T`, `&mut T`, and the aliasing-XOR-mutation rule"

**Title:** `Borrowing: read access for many, write access for one`
**Type:** `read`
**Word count target:** ~400 hard ceiling (landed ~330 — audit below). Borrow-check test §2.1 applied; error-anchor §2.2.2 satisfied via the pairing clause (`E0499` headline line only — predict 2.2 owns the full output). Embeds one `disambiguation` figure (the scroll's ≥1-disambiguation mandate). **No lifetimes content in this read** — the `'a` cameo lives at the close of 2.4.

### `instruction` (markdown body)

```markdown
## Why this matters

Lesson 1 ended with you returning ownership just to keep using a value — `let s = shout(s);` works, but threading ownership through every call is bureaucracy. Borrowing dissolves that problem: a reference lets a function use a value without taking it. The borrow checker's whole job is two guarantees — no reference outlives its value, and nobody mutates data someone else is reading.

## `&T` — shared borrows, as many as you like

```rust
fn measure(s: &String) -> usize {
    s.len()
}

fn main() {
    let name = String::from("dojo");
    let a = &name;
    let b = &name;
    println!("{} {} {}", a, b, measure(&name));
}
```

A `&T` is read access. Any number can coexist, because readers can't invalidate each other. Nothing moves: `name` is still owned by `main` after every borrow. If you come from JS, Java, or Python, this is the by-reference passing you already do everywhere — except the compiler tracks who's looking.

## `&String` vs `&str` — take the slice

:figure[disambiguation]{id="string-vs-str"}

`String` owns and grows a heap buffer; `&str` is a borrowed view into string data — anyone's string data, including a literal's. The idiomatic argument type is `&str`. A `&String` coerces to `&str` at the call site (that's the deref coercion the Lesson 1 playground let you feel), so a `&str` parameter accepts both. Take `&str` unless taking ownership is the point.

```rust
fn greet(name: &str) -> String {
    format!("hello, {}", name)
}

fn main() {
    let owned = String::from("Mariana");
    println!("{}", greet(&owned));  // &String coerces to &str
    println!("{}", greet("Yui"));   // a literal already is a &str
}
```

## `&mut T` — exactly one, no readers alongside

Write access is exclusive: one `&mut T`, and while it lives, no other borrow of any kind — not even a `&T`. This is the aliasing-XOR-mutation rule: many readers or one writer, never both at once. It isn't pedantry. If aliased data can never be mutated, a data race cannot be expressed — and the check runs at compile time, not in production at 3 a.m. Methods get the same three modes in Lesson 4: `&self`, `&mut self`, and `self` are these access levels as receivers.

So what happens when you hold two write handles at once? Predict the compiler's full answer before the next step reveals it — here is the code and only the headline:

```rust
fn main() {
    let mut report = String::from("draft");
    let editor = &mut report;
    let reviewer = &mut report;
    editor.push_str(" v2");
    println!("{}", reviewer);
}
```

```text
error[E0499]: cannot borrow `report` as mutable more than once at a time
```
<!-- verify-at-smoke: rustc 1.68.2 -->
```

### Paragraph-test audit (borrow-check test §2.1 — Valentina/Björn gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Why not just keep returning ownership like kata 1.4?" | KEEP (opener — licensed lead-in, next paragraph carries the sample) |
| "`&T` — shared borrows" | "Is a Rust reference the by-reference passing I already know?" — yes, plus static tracking | KEEP — ends in a compiling sample |
| "`&String` vs `&str`" | "Which string type goes in my function signature?" — the G3 default every later kata holds | KEEP — ends in a compiling sample (coercion shown both ways) |
| "`&mut T` — exactly one" + cliffhanger | "Can I hold two mutable references like two object handles?" | KEEP — ends in the non-compiling sample + `E0499` headline line ONLY (pairing clause: 2.2 owns the full output) |

**What got cut:** raw pointers (`*const`/`*mut` — `unsafe` territory, deferred per §2.6), the borrow checker's implementation (NLL internals — the *behavior* is taught in 2.4's "last use ends the borrow" walk), `Cell`/`RefCell` interior mutability (the `Rc<RefCell<T>>` deferral owns it), and the lifetimes-lite cameo (moved to 2.4's close per the audience review — this read was the scroll's most overloaded at six topics).

**Spec-conflict note (flagged, not improvised):** rust.md §4 step 2.1's `voice_check` says the read "ends with the `&str`-default paragraph's compiling sample"; the W2 authoring instruction says it ends with the `E0499` headline line (pairing clause, feeding predict 2.2 directly). This draft follows the W2 instruction and reorders the topics (`&T` → `&str` → `&mut T` + cliffhanger) so both the `&str` paragraph and the cliffhanger keep their code-terminated shape. If the spec's ordering is the intended canon, swap the last two sections back at review.

---

## Step 2.2 — `predict` — "Does this compile?"

**Title:** `Predict: does this compile?`
**Type:** `predict`
**Mental model under test:** `&mut` is an exclusive capability, not a pointer you can copy freely. The reveal is the scroll's second full compiler-error walk (§2.7), and the `E0499`/`E0502` near-miss distinction is planted here on purpose.

### `instruction` (short intro shown above the snippet)

```markdown
The read step showed you the headline. Now commit to the full answer: does this compile, and if not, what exactly does rustc say?
```

### `question`

```
Does this compile — and if not, what does rustc say?
```

### `snippet`

```rust
fn main() {
    let mut v = vec![1, 2, 3];
    let r1 = &mut v;
    let r2 = &mut v;
    println!("{:?} {:?}", r1, r2);
}
```

### `options`

```yaml
- id: a
  text: "Compiles — prints `[1, 2, 3] [1, 2, 3]`"
- id: b
  text: "Compiles with an aliasing warning"
- id: c
  text: "Fails to compile — `E0499`, cannot borrow `v` as mutable more than once at a time"
- id: d
  text: "Fails to compile — `E0502`, cannot borrow `v` as mutable because it is also borrowed as immutable"
correct: c
```

### `feedback` (per option, sensei voice)

**a — Compiles, prints both:**
> The JS/Java/Python reflex: references are free, take as many as you like, the runtime keeps them all valid. In Rust a `&mut` is an exclusive capability — the compiler hands out at most one at a time, precisely so that nobody else (reader *or* writer) can observe the data mid-mutation. Two live `&mut v` bindings is the textbook violation, and it's a compile error, not a runtime surprise. The real output is below.

**b — Compiles with an aliasing warning:**
> The C reflex — aliasing rules as something the compiler warns about (or silently miscompiles around) while the program ships anyway. Rust's aliasing-XOR-mutation rule is a hard gate, not a lint: code that breaks it does not produce a binary. That hardness is the trade the whole language makes — you negotiate with the compiler now instead of with a debugger later. The real output is below.

**c — Fails with `E0499`:**
> Correct. The full output the read step withheld is below — walk it line by line.

**d — Fails with `E0502`:**
> Close — right family, wrong code, and the distinction matters because you'll meet both in your first real week. `E0499` is two **writers**: two `&mut` borrows alive at once (this snippet). `E0502` is a writer **plus a reader**: a `&mut` alive while a plain `&` borrow of the same value is also alive. Both spell the same rule — many readers or one writer — from its two failure sides. The next-but-one step shows you an `E0502` excerpt next to a fresh `E0499` so the pair sticks. The real output is below.

### `reveal` — the E0499 walk (appended to every option's feedback at seed, so each path sees it)

```markdown
Here is the full output the read step withheld:

```text
error[E0499]: cannot borrow `v` as mutable more than once at a time
 --> main.rs:4:14
  |
3 |     let r1 = &mut v;
  |              ------ first mutable borrow occurs here
4 |     let r2 = &mut v;
  |              ^^^^^^ second mutable borrow occurs here
5 |     println!("{:?} {:?}", r1, r2);
  |                           -- first borrow later used here
  |
error: aborting due to previous error

For more information about this error, try `rustc --explain E0499`.
```
<!-- verify-at-smoke: rustc 1.68.2 -->

Read it like the compiler wrote it for you, because it did. The headline names the owner (`v`) and the broken rule. The first span marks where the first exclusive borrow began (`r1`). The caret span marks the borrow that broke the rule (`r2`). The third label is the proof of overlap — `r1` is *used later*, on the `println!` line, so its borrow is still alive when `r2` is created. That label is also the fix in disguise: if `r1`'s last use came **before** `let r2`, the first borrow would already be over and this would compile. Borrows end at their last use, and rustc points the guidance at exactly that. The next-but-one step walks a fresh `E0499` line by line; first, a kata.
```

### Smoke note (authoring, not learner-facing)

The 1.68-family `E0499` output for this snippet carries three labeled spans and the `--explain` trailer; it may emit **no literal `help:` line**. The spec (§2.3, §4 step 2.2) says the reveal "walks its `help:`" — option c's walk is drafted against the span labels plus the trailer instead, which carry the same guidance. If smoke shows a `help:` line, fold it into the walk verbatim.

---

## Step 2.3 — `kata` — `first_word` *(production gesture G3)*

**Title:** `Return the first word as a borrowed slice`
**Type:** `kata`
**1-line task:** `fn first_word(s: &str) -> &str` — the slice up to the first space, or the whole input. The G3 gesture: take `&str`, return borrowed data, allocate nothing.

### `instruction` (markdown body)

```markdown
## Your task

Write `first_word(s: &str) -> &str`: return the slice of `s` up to (not including) the first space. If there is no space, return the whole input.

The signature is the lesson. The function **takes `&str`** — so it accepts a `String`, a literal, or another slice — and **returns `&str`**: a borrowed view into the caller's data. No `String` allocation, no clone. This take-a-slice-return-a-slice shape is the default for every string function you'll write in real Rust, and every later kata in this scroll holds it.

### What's expected

```rust
first_word("hello world")   // "hello"
first_word("single")        // "single"
first_word("")              // ""
```
```

### `starterCode`

```rust
fn first_word(s: &str) -> &str {
    // your code
    todo!()
}
```

### `testCode`

> Harness preamble (`_t`/`_eq` definitions, panic capture, the `__DOJO_RESULT__` footer) is finalized at seed (W3) per rust.md §5 — the `_t("sentence", || _eq(...))` calls below are the contract.

```rust
_t("returns the slice before the first space", || _eq(first_word("hello world"), "hello"));

_t("returns the whole input when there is no space", || _eq(first_word("single"), "single"));

_t("returns an empty slice for empty input", || _eq(first_word(""), ""));

_t("stops at the first space, not the last", || _eq(first_word("ship it friday"), "ship"));
```

### `hint`

```markdown
Two sub-problems: find where the first word ends, then hand back that piece of the input.

- For the search, `str` has a whole family of position-finding methods — `str::find` is the direct one, `char_indices` the manual one. Either tells you the byte index of the first space, if any.
- For the hand-back, slice syntax `&s[..i]` is the shape: a borrowed view of `s` from the start up to index `i`. No new `String` anywhere — the return value points into the caller's data, which is exactly why the signature says `&str`.

What should happen when the search finds nothing? That case is the second test.
```

### `referenceSolution`

```rust
fn first_word(s: &str) -> &str {
    match s.find(' ') {
        Some(i) => &s[..i],
        None => s,
    }
}
```

### `alternative_approach` (shown after pass)

```markdown
An iterator-flavored version: `s.split(' ').next().unwrap_or("")` — `split` always yields at least one piece (the empty string for empty input), so `next()` is never `None` in practice. Both versions borrow; neither allocates. If you wrote `.to_string()` anywhere, you paid for an allocation the signature promised the caller you wouldn't.
```

### Why these tests

| Test | Lands |
|---|---|
| Slice before the first space | Base case — the find-then-slice shape. |
| Whole input when no space | The `None` arm; catches solutions that panic or return `""` when the search fails. |
| Empty input | Smallest input; `find` on `""` is `None`, the whole-input arm must hold. |
| First space, not the last | Catches `rfind` / split-on-last-space solutions (added beyond the outline's tests: without it, a split-on-last-space implementation passes — §5.2's one-behavior rule needs the behavior actually asserted). Flagged in the W2 report. |

---

## Step 2.4 — `read+inline` — "Reading the compiler: `E0499`, line by line"

**Title:** `Read a borrow error like the compiler wrote it for you`
**Type:** `read+inline`
**Interactions:** 3 of max 4 (2 `reveal` + 1 `micro-quiz`), anchored to `<!-- interact:<id> -->` markers per [INTERACTIVITY-PATTERNS.md §read+inline](../../INTERACTIVITY-PATTERNS.md). The walked snippet is a **fresh `E0499` instance, not 2.2's** (architect fix: re-walking 2.2's output is recall, not prediction) — a `Vec::push` while holding a `&mut` to an element. Both reveal prompts are anatomy-**general**. Closes with the lifetimes-lite cameo (moved here from 2.1) + the `rustc --explain` habit.

### `instruction` (markdown body, with interaction markers)

```markdown
## Why this matters

You predicted one `E0499`. The durable skill is reading the *next* one cold — a borrow error you've never seen, in code you wrote at 6 p.m. Same anatomy every time: headline, first borrow span, conflicting span, overlap proof. Walk it once on a fresh case and you own the shape.

Here's the fresh case — no two bindings to the whole vector this time:

```rust
fn main() {
    let mut scores = vec![80, 91, 73];
    let top = &mut scores[0];
    scores.push(88);
    *top += 5;
    println!("{:?}", scores);
}
```

It refuses to compile. The output starts:

```text
error[E0499]: cannot borrow `scores` as mutable more than once at a time
 --> main.rs:4:5
  |
3 |     let top = &mut scores[0];
  |                    ------ first mutable borrow occurs here
```
<!-- verify-at-smoke: rustc 1.68.2 -->

The headline names the owner and the rule. The first span marks where the first exclusive borrow began — and notice what it says: `top` borrows *one element*, but the label charges the borrow against `scores`. Borrowing an element borrows the whole vector. The compiler can't prove a future `push` won't reallocate the buffer out from under your element pointer — so it doesn't try; it forbids the overlap.

<!-- interact:second-span -->

Here is the rest of the output:

```text
4 |     scores.push(88);
  |     ^^^^^^^^^^^^^^^ second mutable borrow occurs here
5 |     *top += 5;
  |     ------------ first borrow later used here
  |
error: aborting due to previous error
```
<!-- verify-at-smoke: rustc 1.68.2 -->

The caret span is the line that broke the rule: `push` needs `&mut` access to the whole vector, and `top` already holds it. The last label is the overlap proof — `top` is **used later**, at `*top += 5`, so its borrow is still alive at the `push`. Borrows end at their last use; that label tells you exactly where this one refuses to die.

<!-- interact:fix-shape -->

One more turn of the same anatomy. `push` needs *write* access — that's why this is two-writers, `E0499`. What if the second access only needed to *read*?

<!-- interact:e0499-vs-e0502 -->

## The cameo: `'a`

Sometimes the compiler's question isn't "which borrows overlap" but "how long must this borrow live". When a function returns a reference and the compiler can't infer which input it borrows from, the signature carries an explicit lifetime:

```rust
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}
```

Read `'a` as: "the returned reference is only valid while both inputs are." That's your entire job with lifetimes in this scroll — **recognize `'a` in errors and signatures**, the same span-reading you just did. Writing annotations, elision rules, `'static`: scattering `'a` everywhere because one signature needed it is the classic footgun, and the depth belongs to `rust-lifetimes-and-borrowing-deep`.

## The habit: `rustc --explain`

Every Rust error code has a long-form explanation built into the toolchain: `rustc --explain E0499` prints the full story with examples, offline. The error message is the diagnosis; `--explain` is the textbook page. Bookmark the habit — it works for every code this scroll shows you and every one it doesn't.

Next: a starter that fails with exactly the error you just learned to read. Fix it.
```

### `data.interactions` (per `readInlineDataSchema` — markers above anchor each one)

```ts
{
  interactions: [
    {
      kind: 'reveal',
      after: 'second-span',
      prompt: 'Before you scroll: in any borrow error, what does the second span — the ^^^ one — point at?',
      answer: 'The conflicting borrow: the place that tried to take access while the first borrow was still alive. Here that will be `scores.push(88)` — push needs `&mut` to the whole vector, and `top` already holds one. First span = where the existing borrow began; caret span = who collided with it. That pairing holds in every E0499 and E0502 you will ever read.',
    },
    {
      kind: 'reveal',
      after: 'fix-shape',
      prompt: 'You can see the overlap. What shape of fix will the help here point you toward?',
      answer: 'End one borrow before the other starts. Move `*top += 5` above the push — a borrow dies at its last use — or wrap the element work in its own `{ }` scope. The fix re-orders WHEN each access happens; it does not change WHAT the code does. That re-sequencing move is the standard answer to E0499, and it is exactly what the next kata asks of you.',
    },
    {
      kind: 'micro-quiz',
      after: 'e0499-vs-e0502',
      question: 'Replace the push with a read — `let count = scores.len();` — while `top` is still alive. Which code does rustc raise?',
      options: ['E0499 — still two overlapping borrows', 'E0502 — a writer and a reader collide'],
      correct: 1,
      feedback: [
        'Overlapping, yes — but not two writers. E0499 is reserved for two `&mut` borrows. A `&mut` overlapping a plain `&` (and `len` takes `&self`) is its sibling: E0502 — "cannot borrow `scores` as immutable because it is also borrowed as mutable". Two codes, one rule: many readers or one writer.',
        'Correct. One writer plus one reader is the other half of the aliasing-XOR-mutation rule, and it gets its own code:\n\n```text\nerror[E0502]: cannot borrow `scores` as immutable because it is also borrowed as mutable\n4 |     let count = scores.len();\n  |                 ^^^^^^^^^^^^ immutable borrow occurs here\n```\n<!-- verify-at-smoke: rustc 1.68.2 -->\n\nSame anatomy you just walked — headline, spans, overlap. E0499: two writers. E0502: writer plus reader. You now hold both codes the lesson outcomes promised.',
      ],
    },
  ]
}
```

### Authoring notes

- **Prose budget:** every prose block between interactions is under 200 words (longest ≈ 110); total prose ≈ 400 words — at the §5.1 ceiling, justified by the close carrying two committed beats (cameo + habit).
- **Smoke note:** reveal 2's prompt references the compiler's `help:` guidance per the outline. If 1.68.2 emits only span labels (no literal `help:` line) for this snippet, reword the prompt to "what fix do the spans point you toward?" — the answer stands either way. The `E0502` excerpt in the micro-quiz feedback is the one place the scroll *shows* `E0502` (outcomes contract, §2.7); re-capture both excerpts at smoke.
- The `'a` cameo shows the `longest` signature exactly once, recognize-don't-write framing, with the deferral sentence (failure mode + slug) per §2.6. The sample compiles as written — borrow-check test §2.1 holds.

---

## Step 2.5 — `kata` — "Fix the overlapping borrows" *(fail-by-design)*

**Title:** `Make the overlapping borrows compile`
**Type:** `kata`
**1-line task:** A function holds two `&mut` borrows in overlapping scopes and fails with `E0499`. Re-sequence the borrows so it compiles; tests assert the final vector contents.

### `instruction` (markdown body)

```markdown
**This starter does not compile — by design.** Run it, read the `E0499`, and treat the compiler's output as the brief: the error is telling you which two borrows overlap and where the first one refuses to end.

## Your task

`restock` builds a stock list: one handle pushes incoming units, another audits the first entry. The *work* is fine — the expected final vector is `[10, 7, 2, 5, 8]` — but the two `&mut` borrows overlap, so the borrow checker rejects it.

Make the minimal change that compiles **and** keeps the same final contents. Two honest shapes exist (step 2.4's walk named the move): let one writer finish before the next begins, or scope a borrow so it ends early. Both pass; pick one and be able to say why.
```

### `starterCode`

```rust
fn restock() -> Vec<i32> {
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
```

### `testCode`

> Harness preamble (`_t`/`_eq` definitions, panic capture, the `__DOJO_RESULT__` footer) is finalized at seed (W3) per rust.md §5 — the `_t("sentence", || _eq(...))` calls below are the contract. For this fail-by-design kata, ExecuteStep must surface the compile error as learner feedback (rust.md §5, open item with Tomás C3).

```rust
_t("the audit lands on the first element", || _eq(restock()[0], 10));

_t("every push survives the fix", || _eq(restock(), vec![10, 7, 2, 5, 8]));
```

### `hint`

```markdown
The compiler marked three places:

```text
  |              ------ first mutable borrow occurs here
  |              ^^^^^^ second mutable borrow occurs here
  |     ---------------- first borrow later used here
```
<!-- verify-at-smoke: rustc 1.68.2 -->

Translation: `receiver` is still alive when `auditor` is created — because Rust keeps a borrow alive until its **last use**, and `receiver`'s last use (`receiver.push(8)`) sits *after* `auditor`'s first. So ask the question the spans are asking: when does a binding's borrow end? Re-order the work so one writer is finished before the next begins — the final contents don't depend on the order, which is why both fix shapes pass the same tests.
```

### `referenceSolution`

```rust
fn restock() -> Vec<i32> {
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
```

### `alternative_approach` (shown after pass)

```markdown
The other honest fix: drop the intermediate handles entirely and let each statement borrow and release on its own — `stock.push(5); stock[0] = 10; stock.push(8);`. Each method call takes `&mut stock` for exactly one statement, so nothing overlaps. In real code this is usually the answer: named long-lived `&mut` bindings are rarer than the starter made them look, and most E0499s dissolve when you stop hoarding a write handle you only needed for one line.
```

### Why these tests

| Test | Lands |
|---|---|
| Audit lands on the first element | The `auditor[0] = 10` write survived whatever re-sequencing the learner chose. |
| Every push survives the fix | Full-contents assertion — catches a "fix" that deletes a borrow's work instead of re-sequencing it. The expected contents are deliberately order-independent across both valid fix shapes (the audit touches an index the pushes never move). |

---

## Self-review checkpoint (before commit)

- [x] Read 2.1 under the ~400-word ceiling (≈390); every section terminates in a compiling sample or the `E0499` headline (audit table above). The spec-vs-W2-instruction ordering conflict is **flagged in 2.1's notes**, not silently resolved.
- [x] Pairing clause (§2.2 rule 2): 2.1 carries snippet + headline line only; the verbatim multi-line `E0499` lives in 2.2's reveal. 2.1 contains **zero lifetimes content**.
- [x] 2.4 walks a **fresh** `E0499` (element borrow + `push` — distinct mechanism from 2.2's two named bindings); both reveal prompts are anatomy-general; the micro-quiz reveal carries the 3-line `E0502` excerpt; ≤4 interactions; markers in prose match `after` ids.
- [x] 2.4 closes with the lifetimes-lite cameo (`longest<'a>` shown once, recognize-don't-write, deferral slug named) then the `rustc --explain` habit.
- [x] Fail-by-design 2.5: instruction's **first line** states the starter does not compile by design; hint quotes the compiler's span-label lines and asks when a binding's borrow ends — concept-level, no call site, no `{}`-placement spelled out.
- [x] Hint discipline §2.5: 2.3's hint names the search *family* (`find` / `char_indices`) and the slice *shape* per the outline's explicit sanction, never the assembled body.
- [x] Every `rustc` excerpt fence is followed by `<!-- verify-at-smoke: rustc 1.68.2 -->`. All compiling samples are std-only, single-file, 1.68-safe (no post-1.68 APIs; `todo!` is 1.40).
- [x] One figure (`disambiguation` — `string-vs-str`), `highlightAttribute: "Ownership"` only, cascade rows unhighlighted per the spec's authoring note. Max 2 figures per read holds.
- [x] testCode uses the `_t("user-facing sentence", || _eq(actual, expected))` contract shape — bare `_t` calls, no learner-side `main`, closures ending in the assertion expression — with the harness-lands-at-seed note. All tests deterministic.
- [x] All content in English, including code comments and figure caption. No emoji, no celebration.

---

## Figure data spec

The step prose above embeds `:figure[disambiguation]{id="string-vs-str"}`. Data:

### `string-vs-str` (`disambiguation`) — embedded in Step 2.1

- **Slot:** opens the "`&String` vs `&str` — take the slice" section, before that section's compiling sample.
- **Authoring note (from rust.md §4 step 2.1, architect review):** the cascade rows — Mutability, Function-signature default, Getting one from the other — render as plain unhighlighted attribute rows. ONLY **Ownership** carries `highlightAttribute` (single-dimension rule; multi-highlight would make this a `two-by-two` candidate, which it is not).
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ```ts
  {
    type: 'disambiguation',
    id: 'string-vs-str',
    sharedSkeletonLabel: 'UTF-8 text, read through the same methods',
    attributes: [
      'Ownership',
      'Mutability',
      'Function-signature default',
      'Getting one from the other',
    ],
    entries: [
      {
        title: 'String',
        values: {
          'Ownership': 'Owns its heap buffer — allocates it, grows it, drops it',
          'Mutability': 'Growable: push_str, push, clear',
          'Function-signature default': 'Take it only when the function keeps the data',
          'Getting one from the other': '.to_string() allocates a new owned buffer',
        },
      },
      {
        title: '&str',
        values: {
          'Ownership': 'Borrowed view into string data someone else owns',
          'Mutability': 'Read-only window; cannot grow what it does not own',
          'Function-signature default': 'The default argument type — &String coerces into it',
          'Getting one from the other': '&owned (or owned.as_str()) borrows; zero allocation',
        },
      },
    ],
    highlightAttribute: 'Ownership',
    caption:
      'One attribute decides everything below it: String owns the bytes, &str borrows them. When you can say which one a signature should use and why, the cascade rows are corollaries, not new rules.',
  }
  ```
- **Why this earns embedding:** the `String`-vs-`&str` choice is the single most frequent decision in early Rust signatures (production gesture G3 drills it in 2.3), and the two types are genuine near-look-alikes — identical read APIs, one divergent attribute. The figure forces the eye to the one dimension (Ownership) the prose then builds on; deleting it would push the read to re-describe the contrast in a paragraph it doesn't have the word budget for.
