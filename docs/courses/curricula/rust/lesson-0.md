# Rust — Lesson 0: Rust in context

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-12
> **Spec:** [rust.md §4 Lesson 0](rust.md#lesson-0--rust-in-context) — the contract. Gates §2.1 (borrow-check test), §2.2 (format exception), §2.3 (predict placement), §2.7 (compiler-error reveal) apply.
> **Primary audience:** A1 Mariana (JS senior) + A3 Yui (Java senior) + A4 Felipe (TS modernizer). Secondary: A2 Esteban (Python mid-senior).
> **Step count:** 2 (1 `read` + 1 `predict`). No kata — this lesson orients, it doesn't drill.
> **What changes in the learner's head:** "I know whether Rust earns my Friday, what `rustup`/`cargo`/`crates.io` are, why the compiler is a tutor rather than an obstacle, and exactly what this sandbox can and can't run — before I invest in syntax."

This file holds the **production prose** for each step's fields. All content and meta-notes in English (per the S028 scope-block instruction; suite-title localization is rust.md §7's open question, not this file's).

---

## Step 0.1 — `read` — "What Rust is for, how it runs, and why the compiler is your tutor"

**Title:** `What Rust is for, how it runs, and why the compiler is your tutor`
**Type:** `read`
**Word count target:** ~400 hard ceiling (code blocks excluded). Borrow-check test §2.1 applied — the read terminates in a quoted `rustc` excerpt, not prose. Deliberately ends with **E0308**, not E0382: an E0382 teaser here would front predict 1.2 (the C2 de-spoiling decision in the spec).

### `instruction` (markdown body)

```markdown
## Why this matters

This scroll spends ~120 minutes on one mental model (ownership) and one skill (reading compiler errors). Before that: whether Rust is for you, the toolchain names every README assumes, and what this sandbox runs.

## The sweet spot — and what Rust is not for

Rust earns its compile times where memory safety and performance matter at the same time: high-performance CLI tools (`ripgrep`, `fd`, `bat`), services under real load (Discord's read-states service, Cloudflare's proxies, AWS's Bottlerocket OS), and WebAssembly targets. It is a poor fit for quick prototypes (compile times tax iteration), notebooks, CRUD apps where developer-hours dominate runtime cost, and 30-line scripts — there, the borrow checker is pure overhead. If everything you ship lives in that second list, close the tab with a clear conscience.

## The toolchain in one breath

Four names map onto things you already use. `rustup` installs and switches toolchain versions — your `nvm` or `pyenv`. `cargo` is build tool, package manager, test runner, and doc generator in one binary — THE tool, no make/webpack layer on top. `Cargo.toml` declares the project and its dependencies and `Cargo.lock` pins them — `package.json` and its lockfile. `crates.io` is the registry — npm or PyPI. One wrinkle with no analog: **editions** (2015, 2018, 2021) are opt-in language snapshots declared per project; new code is 2021 or later.

```toml
# Cargo.toml — the manifest cargo reads
[package]
name = "log-triage"
version = "0.1.0"
edition = "2021"
```

## What this sandbox runs

This scroll runs **Rust 1.68.2**, std-only, single file — no `tokio`, no `serde`, no `thiserror`, no `cargo test` (a small manual harness stands in; real `#[test]` testing is `rust-testing-deep`'s territory). Where modern Rust has something newer — `async fn` in traits (1.75), `OnceLock` (1.70) — the prose marks it *newer Rust* and never asks you to run it. On your machine `rustup` gives you current stable; nothing here breaks on it.

## The compiler is your tutor

The frame the whole scroll runs on: `rustc` is not a gate to sneak code past. Its errors carry a stable code you can look up, spans pointing at the exact expressions involved, a `help:` line that frequently contains the fix, and `note:` lines with context. When code in this scroll fails to compile, **the message is the lesson** — you will be asked to predict it before you read it, repeatedly. The anatomy, on neutral ground — a plain type mismatch, nothing exotic:

```rust
fn main() {
    let total: i64 = 5i32;
}
```

The three load-bearing lines:

```text
error[E0308]: mismatched types
  |                ---   ^^^^ expected `i64`, found `i32`
help: change the type of the numeric literal from `i32` to `i64`
```
<!-- verify-at-smoke: rustc 1.68.2 -->
```

### Authoring note on the E0308 excerpt

The quoted block is the **3-line load-bearing excerpt** (headline / expected-found span / `help:`) of the full 1.68.2 output, per spec §2.1's "load-bearing 3-line excerpt" allowance. The full output includes `--> main.rs:2:22`, the `expected due to this` secondary label, and the suggested-rewrite lines under `help:` — smoke recaptures the real output from Piston's 1.68.2 and the seed quotes the recaptured lines verbatim; this draft's lines are expected-from-knowledge, flagged by the `verify-at-smoke` comment as mandated.

### Paragraph-test audit (borrow-check test §2.1 — Valentina/Björn gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Is this read skippable?" — names the two-minute price and the payoff | KEEP (orientation, no Rust concept — code-sample rule not triggered) |
| "The sweet spot" | "Is Rust for my workload, or do I close the tab?" — with an explicit out | KEEP (orientation) |
| "The toolchain in one breath" | "What are `rustup`/`cargo`/`crates.io` and what's an edition?" — one analog each, exactly once | KEEP — ends in the `Cargo.toml` sample |
| "What this sandbox runs" | "Why can't I `use serde` here, and is 1.68.2 going to teach me a dead language?" | KEEP (load-bearing per S028 sandbox honesty) |
| "The compiler is your tutor" | "Why does this scroll keep quoting errors at me?" — the scroll's operating frame | KEEP — ends in the quoted E0308 excerpt, not prose |

**What got cut:** "most loved language" survey trivia, pre-1.0 history, what a compiled language is, memory-safety marketing, and *which* `cargo` subcommand is the daily inner loop — predict 0.2 owns that reveal (stated in the spec; the toolchain paragraph deliberately stops short of it).

---

## Step 0.2 — `predict` — "You cloned a Rust project. What do you run first?"

**Title:** `Predict: what do you run first?`
**Type:** `predict`
**Mental model under test:** `cargo run` is the whole inner loop — manifest read, dependency fetch per lockfile, compile, run. The trap: reflexes imported from C (direct compile), Ruby/Python (global install), and npm (install-a-package).

### `instruction` (short intro shown above the snippet)

```markdown
Before ownership, one check on the toolchain model.
```

### `question`

```
You cloned a Rust project and want to see it run. Which command goes first?
```

### `snippet`

```
$ git clone https://github.com/example/log-triage.git
$ cd log-triage
$ ls
Cargo.toml  Cargo.lock  README.md  src/
$ ???
```

### `options`

```yaml
- id: a
  text: "`rustc src/main.rs`"
- id: b
  text: "`cargo run`"
- id: c
  text: "`cargo install`"
- id: d
  text: "`cargo add`"
correct: b
```

### `feedback` (per option, sensei voice)

**a — `rustc src/main.rs`:**
> The direct-compile reflex — `gcc main.c` muscle memory. `rustc` compiles exactly the file you hand it: it does not read `Cargo.toml`, does not resolve dependencies, and fails on the first `use` of an external crate. This scroll's sandbox *does* run bare `rustc` on a single std-only file — which works precisely because the exercises have zero dependencies. A cloned project has them; `rustc`-by-hand is not how anyone builds one.

**b — `cargo run`:**
> Correct. `cargo run` reads `Cargo.toml`, fetches dependencies pinned by `Cargo.lock`, compiles the project, and runs the binary — one command, no separate install step. The npm-style two-step (install, then run) collapses into this. It is the daily inner loop: edit, `cargo run`, read what the compiler says. Which is the right segue — Lesson 1 is about what the compiler says.

**c — `cargo install`:**
> The `gem install` / `pipx install` reflex. `cargo install` builds a binary crate and installs it **globally** into `~/.cargo/bin` — it's how you get *tools* (`cargo install ripgrep`), not how you work on the project in front of you. Run it here and you've published the project's binary onto your own PATH, which is not what "see it run" meant.

**d — `cargo add`:**
> The `npm install <pkg>` reflex. `cargo add <crate>` edits `Cargo.toml` to declare a **new** dependency — it modifies the project and runs nothing. And the reflex behind it ("I must install dependencies before running") doesn't transfer: there is no separate install step to perform. Fetching what `Cargo.lock` already pins is part of the run command itself.

---

## Self-review checkpoint (before commit)

- [x] Read 0.1 under the ~400-word ceiling (code blocks excluded); audit table above; what got cut is named.
- [x] Read 0.1 ends with the quoted **E0308** excerpt — not E0382 (de-spoiling, spec §4 step 0.1), not prose (voice_check). `verify-at-smoke` comment present.
- [x] Toolchain paragraph names each cross-language analog exactly once; the daily inner-loop subcommand is withheld for predict 0.2.
- [x] Sandbox-honesty paragraph present, version-honest (1.68.2, std-only, manual harness, *newer Rust* markers), per spec §2.9.
- [x] Predict feedback names the specific reflex behind every option, including the correct one (`predict` voice contract, INTERACTIVITY-PATTERNS).
- [x] No "most loved language" trivia, no pre-1.0 history, no memory-safety marketing.
- [x] No figures embedded — Lesson 0 has none committed in the spec.
- [x] Every word in English, including meta-notes.

---

## Figure data spec

*None embedded in this lesson.* The spec commits no figure to Lesson 0; the `Cargo.toml` sample and the E0308 excerpt carry the visual load.
