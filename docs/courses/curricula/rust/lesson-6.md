# Rust — Lesson 6: Integration: the capstone

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [rust.md §4 Lesson 6](rust.md#lesson-6--integration-the-capstone) — the contract. Gates §2.1 (borrow-check test), §2.5 (hint ladder — challenge form: ≤1 hint, high-level only, per README §5.3), §2.6 (footgun deferral discipline), §2.9 (std-only, 1.68.2) apply. Capstone rules per [README §5.3 "The scroll capstone"](../../README.md).
> **Primary audience:** A1 Mariana (JS senior) + A3 Yui (Java senior) + A4 Felipe (TS modernizer). Secondary: A2 Esteban (Python mid-senior).
> **Step count:** 2 (1 `read` + 1 `challenge` — the scroll capstone).
> **What changes in the learner's head:** "I can read most idiomatic Rust and write a small real function end-to-end. I know exactly what this scroll didn't teach, why, and where each depth lives."

This file holds the **production prose** for each step's fields. All content and meta-notes in English. The capstone was designed first (outline stage, per README §5.3) and authored last; the persona attack sketches in rust.md §4 were validated against the outlined lessons and re-checked below against the W2 prose.

**Harness note (applies to the `testCode` block below):** tests are written against the planned manual harness contract — `_t("user-facing sentence", || _eq(actual, expected))`, where `_eq` returns `Result<(), String>`. The exact harness header/footer (the `_t`/`_eq` definitions, runner `main`, `__DOJO_RESULT__` emission, `catch_unwind` wrapping) lands at seed (W3) per rust.md §5. The harness-`main` merge question flagged in lesson-1.md applies here too — the starter ships a learner-facing `main`, resolution with Tomás (C3) carried over from the Lesson 1 smoke.

---

## Step 6.1 — `read` — "What you can now read — and what we deliberately didn't teach"

**Title:** `What you can now read — and what we deliberately didn't teach`
**Type:** `read`
**Word count target:** ~350 (spec §4 Lesson 6; hard ceiling ~400, code blocks excluded). Borrow-check test §2.1 applied: the recap paragraph ends in a compiling sample — the capstone's shape in miniature, using `&str` + `.lines()` + `?` + `match`. The deferral list is the one sanctioned exemption from the code-sample rule (pointers, not teaching — spec 6.1 voice_check). No new concepts: `str::lines` and `Option::ok_or` are named as std APIs, not taught.

### `instruction` (markdown body)

```markdown
## What you can now read

Two hours ago, `let s2 = s1` ended your program. Here is what you now read without slowing down: ownership and borrowing decide every signature you meet — you know why this scroll's functions took `&str`, and what `E0382` is asking when a move goes wrong. Errors are values: `Result<T, E>`, `?` propagation, a hand-written error enum with `Display` and `From`. Behavior lives in traits, statically dispatched until heterogeneity forces `Box<dyn Trait>`. Every `match` on an enum is exhaustive, because the compiler refuses anything less. That is most of the first real Rust file you will open. Here it is as one compiling function — `str::lines` is std's iterator over a string's lines, and `Option::ok_or` is the std bridge from `Option` to `Result`, the same method family as Lesson 5's `unwrap_or`:

```rust
fn head_level(log: &str) -> Result<&str, String> {
    let line = log.lines().next().ok_or(String::from("empty log"))?;
    match line.split_whitespace().next() {
        Some(token) => Ok(token),
        None => Err(String::from("blank first line")),
    }
}

fn main() {
    println!("{:?}", head_level("WARN disk usage at 91%\nINFO all clear"));
}
```

## What we deliberately didn't teach

Eight omissions, all deliberate. One sentence each: how it bites, and which deep-dive owns it.

- **`unsafe`** — for soundness you can prove and the compiler can't, never for borrows you'd rather not think about; the proof discipline is `rust-unsafe-and-ffi`.
- **Lifetime annotations at depth** — you can recognize `'a` since Lesson 2; learned under deadline pressure, it gets sprayed everywhere because one signature needed it — `rust-lifetimes-and-borrowing-deep`.
- **Async, `tokio`, `Pin`** — async without a runtime is confusingly-written sync code, and this sandbox cannot host a runtime; `rust-async-with-tokio`.
- **`Rc<RefCell<T>>`** — the poor-man's-GC reflex, and usually a data-model smell the arena pattern dissolves; covered alongside lifetimes in `rust-lifetimes-and-borrowing-deep`.
- **Trait objects beyond `Box<dyn Trait>` literacy** — reaching for `dyn` because "interface" maps to it linguistically buys a vtable and an allocation you didn't price; `rust-traits-deep`.
- **Macros** — `macro_rules!` where a plain function would do, and proc macros cannot even build in this sandbox; `rust-macros-declarative-and-procedural`.
- **Implementing `Iterator`** — this scroll *used* `.iter()`, `.find()`, `.collect()`; writing index loops because the trait felt advanced is the failure mode `rust-iterators-deep` exists to remove.
- **Real testing** — the `_t` harness here is a sandbox workaround; actual Rust tests are `#[test]` functions run by `cargo test`, and `rust-testing-deep` owns that story.

## The last step

What remains is one function a working developer would actually write. It needs Lesson 2's borrowed parsing, Lesson 3's error model, Lesson 4's trait gesture, and Lesson 5's exhaustive match — at the same time, in the same file. That's the point.
```

### Authoring notes

- **The miniature sample is the capstone's prerequisite gesture:** `&str` in, `.lines()` driving iteration, `?` on a fallible step, a `match` classifying a token, borrowed `&str` out. It also pre-loads the capstone's two error shapes (empty input, token classification) without solving either. `str::lines` is **named here** per the spec's voice_check, so the capstone doesn't lean on an untaught API.
- `Option::ok_or` gets a one-clause name (std API, same family as 5.1's `unwrap_or`/`map`/`and_then` one-liners) — naming, not teaching; no new concept enters the read.
- All eight deferral rows from spec §2.6 are present (the seven footguns + the `#[test]` sandbox-honesty row), each with failure mode + owning slug, one sentence each. Slugs match the outer spec §3.1 catalog exactly.
- Compiling sample is 1.68.2-safe: `lines` (1.0-era), `split_whitespace` (1.1), `ok_or` (1.0), `?` on `Result` in a `Result`-returning fn. No post-1.68 API. Single file, runnable as-is (prints `Ok("WARN")`). <!-- verify-at-smoke: rustc 1.68.2 -->
- No figure: the spec commits figures for Lessons 1-4 only; Lesson 6 carries none.

### Paragraph-test audit (borrow-check test §2.1 — Valentina/Björn gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "What you can now read" | "Did the 120 minutes buy me a real capability or a tour?" — the recap is checkable against the sample below it | KEEP — ends in a compiling sample, the capstone's shape in miniature |
| Deferral list | "What do I *not* know yet, and where do I go when it bites?" — honest scope boundary, one sentence per item | KEEP — sanctioned exemption from the code-sample rule (pointers, not teaching) |
| "The last step" | Sets up the capstone explicitly and names the four lessons it integrates | KEEP — forward prompt per README §5.1, three sentences |

**What got cut:** any "congratulations" register (README §7.1 — no performed enthusiasm), the next-steps reading list (Crust of Rust, Zero to Production — they belong to catalog/deep-dive surfaces, not a step that must stay under 400 words), re-explanations of any Lesson 1-5 concept (the recap names capabilities, it does not re-teach), and a second sample (one is the contract; two would pad).

---

## Step 6.2 — `challenge` — **Capstone: "Log triage — parse, classify, summarize"**

**Title:** `Capstone: log triage — parse, classify, summarize`
**Type:** `challenge` (the scroll capstone — last step of the last lesson, per README §5.3)
**1-line task:** Write `summarize(log: &str) -> Result<Summary, LogError>` — count log lines per level, fail honestly on unknown tokens and empty input, and give `Summary` a `Display`. Lessons 2, 3, 4, 5 in one file.

### `instruction` (markdown body)

```markdown
**Budget: ~25 minutes — twice a kata. Not a gate:** skipping it costs you nothing downstream. But this is the scroll's promise made checkable, and failing it is useful data — it names the lesson to go re-run. The routing is at the end of this brief.

You run a service. It logs lines like this — a level token first, the message after:

```text
INFO server started
WARN disk usage at 91%
ERROR disk full
```

Write `fn summarize(log: &str) -> Result<Summary, LogError>`:

- Count the `INFO`, `WARN`, and `ERROR` lines into a `Summary`.
- A line's level is its **first token**. Blank lines — no tokens at all — are skipped, not counted.
- The first unrecognized level token aborts the triage: `Err(LogError::UnknownLevel(token.to_string()))`.
- An input with no non-blank lines is `Err(LogError::Empty)` — an all-zero summary would be a lie.
- `Summary` displays as `2 info, 1 warn, 1 error`: counts in that order, labels singular no matter the count.

`Summary` and `LogError` are pinned in the starter — the tests construct and match them, so their shape isn't yours to choose. Everything else is yours. Define `Level` yourself: three variants, no payload.

This is Lessons 2 through 5 in one file, by name:

- **Lesson 2 — borrowed parsing.** `summarize` takes `&str`; lines and tokens stay borrowed all the way down. Turning a line into its first token is the `first_word` gesture you already wrote in kata 2.3. `str::lines` exists in std — 6.1's sample used it — and looking up its exact shape, and its neighbors', is allowed at challenge level.
- **Lesson 3 — errors as values.** A custom error enum and `?` doing the propagation: kata 3.3's shape. A small fallible function that turns one token into a `Level` keeps `summarize` honest — `?` is built for exactly that seam.
- **Lesson 4 — the trait gesture.** `impl Display for Summary`, like kata 4.3's `Describe` — against std's trait this time.
- **Lesson 5 — your enum, matched exhaustively.** Every `match` on `Level` covers all three variants. No `_` arm on `Level`.

One precision before your Lesson 5 reflex files a complaint: exhaustiveness is the **enum** match's contract. The match that classifies a token is a match on `&str`, and strings aren't enumerable — that match needs its catch-all arm. That arm also holds the solution's one allocation: the token is borrowed from `log`, and an error that borrows from the input would drag a lifetime parameter into `LogError` — owning the offending token with `.to_string()` is the honest copy. It is the only allocation you need.

If you stall, the stall is information. Can't get from a line to its borrowed token: Lesson 2. Tangled in the error plumbing: Lesson 3. `Display` won't compile: Lesson 4. The compiler complains about your `match`: Lesson 5. Go close the gap, then come back.
```

### `starterCode`

```rust
#[derive(Debug, PartialEq)]
struct Summary {
    infos: usize,
    warns: usize,
    errors: usize,
}

#[derive(Debug, PartialEq)]
enum LogError {
    Empty,
    UnknownLevel(String),
}

// Your Level enum goes here: three variants, no payload.

impl std::fmt::Display for Summary {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        todo!()
    }
}

fn summarize(log: &str) -> Result<Summary, LogError> {
    todo!()
}

fn main() {
    let log = "INFO server started\nWARN disk usage at 91%\nERROR disk full";
    match summarize(log) {
        Ok(summary) => println!("{}", summary),
        Err(problem) => println!("triage failed: {:?}", problem),
    }
}
```

### `testCode`

```rust
// Harness contract — exact _t/_eq definitions, runner main, and
// __DOJO_RESULT__ footer land with the seed harness (W3).

_t("counts every level across a mixed log, skipping blank lines", || {
    let log = "INFO server started\n\nWARN disk usage at 91%\nINFO request served\n\nERROR disk full";
    _eq(summarize(log), Ok(Summary { infos: 2, warns: 1, errors: 1 }))
});

_t("an unknown level token is an error carrying that token", || {
    let log = "INFO ok\nTRACE deep in the weeds";
    _eq(summarize(log), Err(LogError::UnknownLevel(String::from("TRACE"))))
});

_t("empty input is an error, not a zero summary", || {
    _eq(summarize(""), Err(LogError::Empty))
});

_t("input with only blank lines is just as empty", || {
    _eq(summarize("\n\n"), Err(LogError::Empty))
});

_t("a summary displays as '2 info, 1 warn, 1 error'", || {
    let summary = Summary { infos: 2, warns: 1, errors: 1 };
    _eq(format!("{}", summary), String::from("2 info, 1 warn, 1 error"))
});
```

### `hint` (the only one — challenge rules, README §5.3)

```markdown
Three sub-problems: split the input into candidate lines, turn a line's first token into a `Level` (one fallible function — `?` is your friend), and accumulate counts. Solve them in that order.
```

### `referenceSolution`

```rust
#[derive(Debug, PartialEq)]
struct Summary {
    infos: usize,
    warns: usize,
    errors: usize,
}

#[derive(Debug, PartialEq)]
enum LogError {
    Empty,
    UnknownLevel(String),
}

enum Level {
    Info,
    Warn,
    Error,
}

fn parse_level(token: &str) -> Result<Level, LogError> {
    match token {
        "INFO" => Ok(Level::Info),
        "WARN" => Ok(Level::Warn),
        "ERROR" => Ok(Level::Error),
        unknown => Err(LogError::UnknownLevel(unknown.to_string())),
    }
}

fn summarize(log: &str) -> Result<Summary, LogError> {
    let mut summary = Summary { infos: 0, warns: 0, errors: 0 };
    let mut saw_line = false;
    for line in log.lines() {
        let token = match line.split_whitespace().next() {
            Some(token) => token,
            None => continue,
        };
        saw_line = true;
        match parse_level(token)? {
            Level::Info => summary.infos += 1,
            Level::Warn => summary.warns += 1,
            Level::Error => summary.errors += 1,
        }
    }
    if saw_line {
        Ok(summary)
    } else {
        Err(LogError::Empty)
    }
}

impl std::fmt::Display for Summary {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{} info, {} warn, {} error", self.infos, self.warns, self.errors)
    }
}

fn main() {
    let log = "INFO server started\n\nWARN disk usage at 91%\nINFO request served\n\nERROR disk full";
    match summarize(log) {
        Ok(summary) => println!("{}", summary),
        Err(problem) => println!("triage failed: {:?}", problem),
    }
}
```

### Why these tests

| Test | Lands |
|---|---|
| Mixed log → `Ok(Summary { infos: 2, warns: 1, errors: 1 })` | The happy path and the blank-line rule in one fixture — the two embedded blank lines must be skipped or the counts drift. Asserted structurally on `Summary` (hence its `PartialEq` derive), not on printed output. |
| `TRACE` → `Err(UnknownLevel("TRACE"))` | The catch-all arm of the token match, and that the error **carries the offending token** — a solution that returns a unit-style error fails here. Valid lines before the bad one don't rescue the triage. |
| `""` → `Err(Empty)` | `lines()` on an empty string yields nothing; the no-lines-seen branch must exist. Felipe's throw-shaped reflex meets a tested `Err` arm instead. |
| `"\n\n"` → `Err(Empty)` | Blank-only input is *semantically* empty — guards a solution that equates "saw lines" with "saw countable lines". |
| `Display` equals `"2 info, 1 warn, 1 error"` exactly | The Lesson 4 gesture, asserted byte-for-byte. Constructs `Summary` directly so `Display` feedback stays independent of `summarize` correctness — a learner with broken parsing still learns whether their `impl` is right. |

All five are deterministic: literal fixtures, struct-field counts (no map iteration order — the spec's §5 determinism note is why `Summary` has three named fields instead of a `HashMap`), no clock, no stdin.

### Hint-discipline check (§2.5 + README §5.3 challenge rules)

Exactly one hint, concept-level: it decomposes the problem into three sub-problems and names an order. It names no solving identifier — not `lines`, not `split_whitespace`, not `parse_level`, no match arm, no body code. (`str::lines` is named in the *instruction* per the spec's own 6.2 outline — API existence at challenge level is brief material, not hint material; the hint adds only decomposition.) The "one fallible function" nudge is the outline's own phrasing for the helper the learner is steered toward without being handed its signature.

### Persona attack-sketch validation (outline → W2 re-check)

The outline's §4 sketches were made against outlined lessons; W2 prose for Lessons 2-5 shipped to outline scope, so the sketches stand. Re-checked against this brief:

- **Mariana (A1):** lines → tokens → reduce is her JS reflex verbatim; her predicted snag — `UnknownLevel(String)` forcing `.to_string()` on a borrowed token — is met by the instruction's allocation paragraph, which is aimed at her.
- **Yui (A3):** `Level` ≈ Java enum + switch, `Display` ≈ `toString()`; her predicted snag — wanting a `default:` arm — is met by the `_`-arm pre-empt sentence (exhaustiveness is the enum match's contract; the `&str` match keeps its catch-all).
- **Felipe (A4):** discriminated-union reflex covers `Level`; his predicted snag — throw-shaped control flow — is met by two tested `Err` arms.

### Authoring notes

- **Starter pins `Summary` + `LogError`, leaves `Level` to the learner.** The outline marks only `Level` as learner-defined (Lesson 5 integration: "learner-defined `Level` enum"); the tests construct `Summary` and match `LogError` variants, so those two shapes are contract, not choice — they ship in the starter with their `#[derive(Debug, PartialEq)]` (which the harness's `_eq` needs). `Level` appears in no test, so the scaffold compiles without it and the 5.3 define-the-enum gesture stays the learner's. The deliverable block's shapes in rust.md §4 6.2 are reproduced bit-for-bit.
- The scaffold compiles as-is under 1.68.2 (`todo!()` bodies; running it unmodified panics with `not yet implemented`, which is correct behavior for an unattempted challenge). Unused-variable/dead-code warnings on the stubs are warnings, not errors. <!-- verify-at-smoke: rustc 1.68.2 -->
- Reference solution honors the &str discipline: `line` and `token` are borrows of `log` end to end; the single allocation is `unknown.to_string()` inside `LogError::UnknownLevel` — the outline's one legitimate allocation. No `.clone()` anywhere. The catch-all arm binds `unknown` rather than `_` because the token must be owned into the error — same catch-all semantics, per the instruction's pre-empt.
- Error precedence is encoded by the tests, not prose-only: a bad token aborts even after valid lines (`?` returns early); `Empty` is only reachable when no countable line was seen.
- 1.68.2 audit: `str::lines`, `str::split_whitespace`, `str::to_string`, `write!`, `Formatter<'_>` (anonymous lifetime, stable since 1.31), `#[derive(Debug, PartialEq)]`, `todo!` (1.40). Nothing post-1.68; no edition-sensitive idiom (no by-value array iteration, no `dyn`-keyword dependence). Single file, std-only.

---

## Self-review checkpoint (before commit)

- [x] Read 6.1 in the 300-400 word band (code blocks excluded); recap is one tight paragraph ending in a compiling sample that uses `&str` + `.lines()` + `?` + `match` — the capstone's shape in miniature; `str::lines` named in std there.
- [x] All eight §2.6 deferral rows present, one sentence each, failure mode + deep-dive slug matching the outer spec §3.1 catalog; no new concepts taught in the read.
- [x] 6.1 closes by setting up the capstone and naming Lessons 2, 3, 4, 5 — the spec's closer, in the dojo register (no congratulations, no consolation).
- [x] Capstone instruction states the ~25 min / 2× kata budget **up front**, states not-a-gate, and routes failure back to a named lesson — direct, no softening.
- [x] Instruction names every lesson it leans on (2, 3, 4, 5) and back-references kata 2.3 (`first_word`), kata 3.3 (error enum + `?`), kata 4.3 (`Describe` → `Display`), and the 5.3 enum gesture.
- [x] The `_`-arm pre-empt sentence is in the instruction: exhaustiveness is the enum match's contract; the `&str` token match needs its catch-all — strings aren't enumerable.
- [x] The allocation note is in the instruction: `UnknownLevel(String)`'s `.to_string()` is the one honest allocation, with the lifetime-on-the-error-type reason stated.
- [x] **Exactly one hint**, high-level decomposition only, no solving identifiers (challenge rules, README §5.3).
- [x] `starterCode` compiles (type skeletons + `todo!()` bodies); `Level` deliberately absent so the learner defines it; tests never reference `Level`.
- [x] `testCode` covers: happy path with multi-line fixture and per-level counts (blank-line skipping inside it), `Err(UnknownLevel("TRACE"))`, `Err(Empty)` for both `""` and `"\n\n"`, and the exact `Display` string. All deterministic; test names are user-facing sentences.
- [x] `referenceSolution` complete, idiomatic, 1.68.2 std-only, single file; borrowed parsing end to end; the one allocation is the error variant's `.to_string()`; exhaustive `match` on `Level` with no `_` arm.
- [x] Every word in English — titles, instructions, hints, code comments, meta-notes.
- [x] All compiling-sample and scaffold claims carry `<!-- verify-at-smoke: rustc 1.68.2 -->`; quoted compiler output: none in this lesson (no error reveal — by design, the capstone is integration, not a new error).
- [x] No figure (none committed for Lesson 6); no new step types; no GSAP/motion implications (prose only).
