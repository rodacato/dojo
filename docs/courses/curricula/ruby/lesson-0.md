# Ruby — Lesson 0: Ruby en contexto

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-07
> **Spec:** [ruby.md §4 Lesson 0](ruby.md#lesson-0--ruby-en-contexto)
> **Primary audience:** A1 Mariana (JS Senior), A2 Esteban (Python Mid-Senior). Secondary: A4 Felipe.
> **Step count:** 3 (2 `read` + 1 `predict`). No `kata` — this lesson orients, it doesn't drill.

This file holds the **production prose** for each step's `instruction` / `feedback` / etc. fields, ready to be seeded into [`apps/api/src/infrastructure/persistence/seed-scrolls-ruby.ts`](../../../../apps/api/src/infrastructure/persistence/seed-scrolls-ruby.ts) after review. Content is in English (per [AGENTS.md](../../../../AGENTS.md) repo-language convention); meta-notes for the author are in Spanish where helpful.

---

## Step 0.1 — `read` — "What Ruby is for (and what it isn't)"

**Title:** `What Ruby is for (and what it isn't)`
**Type:** `read`
**Word count target:** ~400. Paragraph test §2.1 applied throughout.

### `instruction` (markdown body)

```markdown
## Why this matters

Before you spend 100 minutes on syntax, you need to know whether Ruby is worth your Friday. This step locates Ruby on your internal map: where it shines, where it doesn't, who maintains it, what version family to learn. The kind of orientation you'd normally cobble together from five browser tabs and a Hacker News thread.

## Where Ruby shines

Ruby's biggest economic footprint is still **Rails web apps** — Shopify, GitHub, Basecamp, Airbnb's earliest stack. If you're going to write Ruby for money, odds are you'll write it inside Rails.

But Ruby outside Rails is more present than the polyglot usually realises:

- **CLI tools.** Homebrew (the macOS package manager) is Ruby. So is Jekyll (the static site generator behind a chunk of GitHub Pages), Vagrant, and Fastlane.
- **DSLs and configuration.** Rakefile, Gemfile, Capistrano deploy scripts, Chef recipes. Ruby's syntax bends gracefully into domain-specific languages — that's not an accident, it's the language's biggest strength.
- **Short automation scripts.** When a Python script would need a `requirements.txt` and a venv to do anything interesting, a Ruby script reads more naturally inline and runs from any system with `ruby` on PATH.
- **Prototypes** where expressiveness beats raw performance.

## Where Ruby doesn't shine

Honest list, no apologies:

- **CPU-bound workloads.** ML training, heavy numerical simulation, video processing — use Python (with C extensions), Julia, or Rust. Ruby's interpreter and GC prioritised expressiveness over throughput.
- **Embedded systems.** No mRuby-quality story for most cases. Reach for C or Rust.
- **Sub-millisecond latency systems.** High-frequency trading, real-time bidding. Go or Rust win.
- **Mobile native.** Swift / Kotlin own that surface. Ruby is for the backend the mobile app talks to, not for the app itself.

## Who maintains it

Yukihiro Matsumoto (**Matz**) is the language's creator and still its BDFL — every release ships with his sign-off. The Ruby core team is a small group of long-tenure contributors who run on monthly meetings and a public bug tracker.

The biggest industrial sponsor is **Shopify**. They funded YJIT (the just-in-time compiler that made Ruby 3.2+ measurably faster), they push pattern matching forward, and several core committers work there. Ruby's community is less hyped than Rust's or Go's in 2026 — that's a sign of maturity, not decline. Conferences (RubyConf, RubyKaigi, EuRuKo) still sell out.

## What version to learn

**Ruby 3.x is the target.** Specifically:

- **3.0 (Dec 2020)** separated keyword arguments from hashes (a real-world breaking change you'll see commit messages mention), shipped Ractors, introduced pattern matching.
- **3.2** shipped YJIT as production-stable.
- **3.3 (Dec 2023)** improved YJIT further and refined pattern matching.

**Avoid material written for Ruby 2.7 or earlier.** Kwargs syntax was different, performance baselines were different, and a meaningful chunk of intermediate idioms changed shape.

## Sandbox honesty

This crash course runs **Ruby 3.0.1** in the sandbox — the minimum that supports everything you'll touch here (kwargs, `Array#tally`, basic pattern matching, `Hash#transform_keys`). On your own machine you want **3.3+**, installed via `rbenv` or `asdf` (most projects pin a version in a `.ruby-version` file).

Up next: how a Ruby project actually gets run. The first time you type `bundle exec` you'll know why.
```

### Paragraph-test audit (Valentina §2.1 gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Should I even bother with Ruby?" | KEEP |
| "Where Ruby shines" | "Is Ruby just Rails?" — answers the silent question every polyglot has | KEEP |
| "Where Ruby doesn't shine" | "Should I reach for Ruby for X?" — saves wasted exploration | KEEP |
| "Who maintains it" | "Is this project alive? Who's behind it?" | KEEP |
| "What version to learn" | "Which tutorials should I trust? What baseline?" | KEEP |
| "Sandbox honesty" | "Why is the sandbox version different from what I'd install?" | KEEP |

No paragraphs that explain "what is an interpreted language" or "Matz is nice (MINASWAN)" or "Ruby on Rails was created by DHH". The polyglot doesn't need them; cutting them respects the audience.

---

## Step 0.2 — `read` — "How Ruby actually runs"

**Title:** `How Ruby actually runs (in real projects)`
**Type:** `read`
**Word count target:** ~300.

### `instruction` (markdown body)

```markdown
## Why this matters

A cloned Ruby project has a `Gemfile` and a `Gemfile.lock`. You recognise the pattern (`package.json`, `requirements.txt`, `go.mod`) but the commands and the conventions differ enough to lose you two hours on Stack Overflow if you start guessing.

## The commands you need

**`ruby file.rb`** — runs a single script. Same shape as `python file.py` or `node file.js`. Useful for one-off scripts; rarely how you run real projects.

**`irb`** — the standard library REPL (Interactive RuBy). Open it from any terminal where Ruby is installed. Use it to test expressions, refresh syntax memory, poke at stdlib. Equivalent to Python's `python` REPL or Node's `node` REPL.

**`pry`** — a better REPL than `irb` (autocomplete, syntax highlighting, source navigation). It's a gem, not stdlib — you install it with `gem install pry` or add it to a project's Gemfile under the `:development` group. Many Ruby developers replace `irb` with `pry` once and forget about it.

## Bundler — the package manager you'll meet first

A Ruby project's dependencies live in two files:

- **`Gemfile`** declares what the project needs, often with version ranges (`gem "rails", "~> 7.1"`).
- **`Gemfile.lock`** pins the exact versions Bundler resolved. Commit both. The lock is the analogue of `package-lock.json` / `poetry.lock` / `Cargo.lock`.

**`bundle install`** reads the Gemfile, resolves the dependency graph, downloads the gems into the project's vendor directory (or your `~/.gem`, depending on config), and writes / respects the `Gemfile.lock`. Run this first after cloning.

**`bundle exec <command>`** runs `<command>` using *only* the gems Bundler resolved for this project. If your machine has multiple versions of `rspec` installed globally, `rspec` invokes whichever one your shell finds; `bundle exec rspec` invokes the exact version your `Gemfile.lock` pinned. **In any modern Ruby project, prefix is the default:** `bundle exec rspec`, `bundle exec rake db:migrate`, `bundle exec rubocop`.

:figure[before-after]{id="npm-vs-bundle"}

The figure above is the venv comparison in one glance: the per-command isolation via `bundle exec` replaces `venv activate`'s per-shell-session isolation. Same outcome (gems pinned to the project), different shell discipline.

## Version managers

A `.ruby-version` file (one line, just the version string like `3.3.5`) pins which Ruby version the project expects. Tools like `rbenv` and `asdf` read it and auto-switch when you `cd` into the directory. Without a manager, `ruby -v` tells you what you're actually running — often a surprise on machines with system Ruby.

## Sandbox honesty

You don't need to install anything for this scroll — every kata runs in the sandbox, no Bundler in sight. But the katas reflect the real convention: solutions are pure methods you'd run as `ruby file.rb` without external gems. When you leave this scroll, `bundle exec` is the prefix.
```

### Paragraph-test audit

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Should I keep guessing or read this?" | KEEP |
| "The commands you need" | "What's the equivalent of `python` / `ipython` / `node` / `npm`?" | KEEP |
| "Bundler" + Gemfile / Gemfile.lock | "What are these files and which one do I commit?" | KEEP |
| `bundle install` | "First command after cloning — what is it?" | KEEP — answers 0.3 predict's setup |
| `bundle exec` paragraph | "Why does every Ruby README say `bundle exec` everywhere?" — and Esteban's flagged concern | KEEP |
| `:figure[before-after]` + caption | replaces the prior venv prose paragraph; same payload at a glance | KEEP (figure carries the venv comparison) |
| Version managers + `.ruby-version` | "How does the team know what version I should run?" | KEEP |
| "Sandbox honesty" | "Will the sandbox lie to me about what Ruby is actually like?" | KEEP |

No paragraphs explaining "what a package manager is in general" or "the history of RubyGems vs Bundler" or "what an interpreter does". Cut.

---

## Step 0.3 — `predict` — "What do you run first?"

**Title:** `Predict: what do you run first?`
**Type:** `predict`
**Mental model under test:** Bundler-first reflex (the answer to "I cloned a Ruby project — now what?").

### `instruction` (short intro shown above the snippet)

```markdown
Before the next lesson, one check on the Bundler model.
```

### `question`

```
You just cloned a Ruby project from GitHub. The README says "use Ruby 3.3". You want to run the app. Which command do you run first?
```

### `snippet`

```
$ git clone https://github.com/example/ruby-app.git
$ cd ruby-app
$ ls
Gemfile  Gemfile.lock  README.md  bin/  config/  lib/
$ ???
```

### `options`

```yaml
- id: a
  text: "`ruby bin/app.rb`"
- id: b
  text: "`bundle install`"
- id: c
  text: "`irb`"
- id: d
  text: "`gem install`"
correct: b
```

### `feedback` (per option, sensei voice)

**a — `ruby bin/app.rb`:**
> The "just run it" reflex works in languages with a generous stdlib and small projects. In Ruby, almost any real project depends on gems declared in the Gemfile — running before installing dependencies throws `LoadError` on the first `require`. After `bundle install`, you can run anything — ideally with `bundle exec ruby bin/app.rb` so the version of Ruby and the gems both match what the project expects.

**b — `bundle install`:**
> Correct. Any cloned Ruby project has a Gemfile (and usually a `.ruby-version` file too). `bundle install` reads the Gemfile, resolves the dependency graph, downloads the gems into the project, and respects (or generates) the `Gemfile.lock`. Without it, the first `require` of an external dependency fails.
>
> Next up: you start writing Ruby. Blocks come first — they're in every Ruby file you'll read.

**c — `irb`:**
> `irb` opens a REPL isolated from the project. It's useful for trying language expressions (`5.times { |i| puts i }`) but doesn't load the project's Gemfile or its code. For a REPL with the project loaded, most projects ship a `bin/console` (Rails) or you'd use `pry -r ./lib/whatever.rb`.

**d — `gem install`:**
> `gem install <name>` installs a single gem globally — useful for standalone tools like `rubocop` or `pry`, but it bypasses Bundler's per-project reproducibility. In a cloned project, the idiomatic move is to let Bundler manage the gems declared in the Gemfile, not to install them globally.

---

## Self-review checkpoint (before commit)

- [x] Both `read` steps pass the paragraph test §2.1 (audit tables included above).
- [x] Predict feedback names the specific mental model behind each wrong answer (not generic "the right answer is B because...").
- [x] No "Welcome to Ruby" preamble, no MINASWAN, no historical exposition.
- [x] Content is in English; meta-notes in Spanish.
- [x] Sandbox-honesty paragraph present in both reads.
- [x] Lesson 0 has no kata — the lesson orients, doesn't drill. Voice intact.

Pending until panel + audience review: tone calibration as a suite (all 6 lessons together), possible cuts if any paragraph is found wanting.

---

## Figure data spec

The step prose above embeds `:figure[...]{id:"..."}` directives. This section is the source-of-truth for the data that populates each figure when the runtime renders them. See [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures) for the schema.

### `npm-vs-bundle` (`before-after`) — embedded in Step 0.2

- **Slot:** after the "Bundler" paragraph, before "Version managers".
- **Left pane (the polyglot reflex, JS):**
  ```sh
  npm install                  # reads package.json
  node bin/app.js              # runs anything, anywhere
  ```
  Annotations: `✓` on `npm install` (the right reflex), `✕` on `node bin/app.js` (silently uses *global* node + *global* installed packages — not what most projects expect).
- **Right pane (Ruby idiom):**
  ```sh
  bundle install               # reads Gemfile, writes Gemfile.lock
  bundle exec ruby bin/app.rb  # runs with the project's pinned gems
  ```
  Annotations: `✓` on both lines.
- **Caption:** *"Same shape (install, then run), different shell discipline. The `bundle exec` prefix is the per-command isolation that replaces `venv activate`."*
- **Why this earns embedding:** every paragraph in Step 0.2 already does pedagogical work; the figure replaces nothing — it *condenses* the venv comparison into a single glance. The polyglot's eyes go to the right pane and immediately see the difference is one extra prefix, not a new mental model.
- **Authoring cost estimate:** ~15 minutes once the `before-after` renderer exists.
