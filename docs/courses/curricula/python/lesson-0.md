# Python — Lesson 0: Python en contexto

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-08
> **Spec:** [python.md §4 Lesson 0](python.md#lesson-0--python-en-contexto)
> **Primary audience:** A1 Mariana (JS Senior) + A4 Felipe (TS Modernizer). Secondary: A3 Yui (Java Senior, Python-as-scripting). Out-of-scope: A2 Esteban (already Python mid-senior — not a learner here).
> **Step count:** 2 (1 `read` + 1 `predict`). No `kata` — this lesson orients, it doesn't drill. *(Audience review 2026-06-08 collapsed two reads into one tight ecosystem read; all three primary personas already operate `venv`/`pip` in their day-to-day, so the original two-read tour was tax, not pedagogy.)*

This file holds the **production prose** for each step's `instruction` / `feedback` / etc. fields, ready to be seeded into [`apps/api/src/infrastructure/persistence/seed-scrolls-python.ts`](../../../../apps/api/src/infrastructure/persistence/seed-scrolls-python.ts) (the seed file does not yet exist — it lands in W3 of S027). Content is in English (per [AGENTS.md](../../../../AGENTS.md) repo-language convention); meta-notes for the author are in Spanish where helpful.

---

## Step 0.1 — `read` — "Python en contexto: para qué sirve, cómo se ejecuta"

**Title:** `Python in context: what it's for, how it actually runs`
**Type:** `read`
**Word count target:** ~350. Pythonic test §2.1 applied throughout.

### `instruction` (markdown body)

```markdown
## What this is

A **crash course, not a tutorial.** It assumes you already program in another language and have met Python's basic syntax somewhere — a video, the docs, a coworker's PR. You're here to *practice under pressure*, not to be walked through "what a variable is". Six lessons, ~100 minutes, no hand-holding. It teaches the **language** — the protocol surface (dunders, iterables, context managers, decorators) and EAFP as the cultural reflex — not the framework stack (Django, Flask, FastAPI, pandas are named only to exclude them). Some katas hand you plausible-but-wrong code to fix; others ask you to write from scratch. Either way, the tests are the judge — and when you fail twice, the hints sharpen, but the answer stays yours to earn.

## Why this matters

Before you spend ~100 minutes on Python's idioms, you need (1) a one-paragraph "is Python for me, what version, where does it fit and where doesn't it" so you can close the tab if it isn't, and (2) the modern command sequence to run a cloned Python project. Both fit one tight read. If you already operate `venv` and `pip` daily, the second half is fast — go to the predict and on to Lesson 1.

## Where Python fits, where it doesn't

Python's load-bearing surfaces in 2026: **scripting and automation** (the universal "small task runner" language — DevOps glue, CI scripts, one-off data transforms), **web backends** (Django, Flask, FastAPI — *named only to exclude from scroll scope*), and **the data science / ML stack** (pandas, numpy, PyTorch — *also named only to exclude*). When teams say "we use Python," they usually mean one of those three plus a long tail of tooling.

Where it doesn't shine: sub-millisecond latency systems, CPU-bound workloads without `numpy` / Cython (the GIL bites — Go or Rust win), mobile native, anything where startup time matters (CLI tools with a 200ms cold start feel slow next to Go).

## What version to learn

**Python 3.11+ is the target.** Specifically:

- **3.10 (Oct 2021)** brought structural pattern matching (`match` / `case`).
- **3.11 (Oct 2022)** brought a measurable 10-60% baseline speedup. Exception groups landed. `tomllib` joined the stdlib.
- **3.12 (Oct 2023)** brought cleaner generic syntax (PEP 695).
- **3.13 (Oct 2024)** brought an experimental free-threaded build (no-GIL — feature-flagged, not production default yet).

**Avoid material targeting 3.7 or older.** Significantly different syntax, no `match`/`case`, no modern typing, slower baseline.

## `python` vs `python3`

On macOS Big Sur+ and most current Linux distros, plain `python` may be absent or point at a system Python you should not touch. **`python3` is the safe invocation.** Modern projects assume `python3` or pin a version in a `.python-version` file (read by `pyenv` or `asdf`).

## The install dance you'll actually run

When you clone a Python project that has a `pyproject.toml`, the modern incantation is:

```sh
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e .
```

`python3 -m venv .venv` creates an isolated environment in `./.venv/`. `source .venv/bin/activate` puts that environment's `python` and `pip` on your shell's `PATH` (until you `deactivate` or open a new shell). `pip install -e .` reads `pyproject.toml` and installs the project in **editable mode** — changes to source files are picked up without reinstall.

**Distinct from Ruby's Bundler:** Python's venv *is* an activated shell-level environment — there's state on your `PATH` after `source ... activate`. Ruby's Bundler isolates per command via `bundle exec` instead. Same goal (gems / packages pinned to the project), different shell discipline.

On older projects you'll see `pip install -r requirements.txt` — a pre-`pyproject.toml` declaration that still works. Many projects have both.

## `pyproject.toml`

The modern declaration file (PEP 518 + PEP 621). Replaces `setup.py` and (mostly) `setup.cfg`. `[project]` holds metadata (name, version, dependencies); `[build-system]` declares which build backend turns the source into an installable artifact. A clone in 2026 almost certainly has this file.

## The package-manager landscape (one sentence each)

- **`pip` + `venv`** — stdlib. The baseline you use to read older projects.
- **`poetry`** — mature, opinionated, lockfile-based (`poetry.lock`). Popular through the late 2010s.
- **`uv`** (Astral, 2024) — Rust-fast drop-in `pip` replacement, increasingly the **modern default for new projects**. Pin `uv` if you're starting fresh in 2026.
- **`conda`** — scientific-computing default; manages non-Python dependencies (C libraries, CUDA) too.

For a polyglot today: **`uv` for new projects, `pip` + `venv` to read older ones.** That's the whole map.

## Sandbox honesty

This crash course runs **Python 3.11** in the sandbox. That's the modern baseline — `tomllib` is stdlib, exception groups work, structural pattern matching works, `Self` in type hints works. On your own machine, install 3.11+ via `pyenv`, `asdf`, or your distro's package manager.

Next: one predict that lands the install dance. After that, syntax.
```

### Paragraph-test audit (Valentina §2.1 gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Should I bother reading this or skip to Lesson 1?" — and gives the senior an out | KEEP |
| "Where Python fits, where it doesn't" | "Is Python for the thing I'm thinking of?" — saves wasted exploration | KEEP |
| "What version to learn" | "Which tutorials should I trust? What's the baseline?" | KEEP |
| "`python` vs `python3`" | "Why does the docs page say `python` but my Mac doesn't have it?" | KEEP |
| "The install dance" | "I cloned a Python project — what do I type?" | KEEP — load-bearing for 0.2 predict |
| Venv-vs-Bundler aside | answers the Ruby-veteran-comes-to-Python question (and informs Mariana's mental model from her data colleagues) | KEEP |
| "`pyproject.toml`" | "What is this file and do I have to learn TOML?" | KEEP |
| "The package-manager landscape" | "I keep seeing `poetry` / `uv` / `pip` mentioned — which one do I learn?" | KEEP |
| "Sandbox honesty" | "Will the sandbox lie to me about what Python is actually like?" | KEEP |

**What got cut** (versus the original two-read draft, deliberately): PSF governance, Microsoft sponsorship of CPython, "Python is the lingua franca of …", the Monty Python origin story, what "interpreted" means, the `setup.py` → `pyproject.toml` history, `python -m foo` mechanics in the abstract (the command sequence above teaches `python -m venv` by using it; the meta-discussion was padding). All failed the §2.1 gate for at least one of the three primary personas.

---

## Step 0.2 — `predict` — "Tenés un proyecto Python clonado. ¿Qué corrés primero?"

**Title:** `Predict: what do you run first?`
**Type:** `predict`
**Mental model under test:** Venv-first, then `pip install -e .` against `pyproject.toml`. The trap: half-remembered reflexes from earlier Python eras and adjacent ecosystems.

### `instruction` (short intro shown above the snippet)

```markdown
Before the syntax lesson, one check on the install model.
```

### `question`

```
You cloned a Python project from GitHub. It has a `pyproject.toml` and a README that says "requires Python 3.11+". You want to run it. Which command goes first?
```

### `snippet`

```
$ git clone https://github.com/example/python-app.git
$ cd python-app
$ ls
pyproject.toml  README.md  src/  tests/
$ ???
```

### `options`

```yaml
- id: a
  text: "`python src/app.py`"
- id: b
  text: "`pip install -r requirements.txt`"
- id: c
  text: "`python3 -m venv .venv && source .venv/bin/activate && pip install -e .`"
- id: d
  text: "`pip install .`"
correct: c
```

### `feedback` (per option, sensei voice)

**a — `python src/app.py`:**
> The "just run it" reflex works in JavaScript because Node has a generous stdlib and trivial projects can run zero-dependency. Almost any real Python project depends on packages declared in `pyproject.toml` — running before installing them throws `ModuleNotFoundError` on the first `import`. The Python install dance is *always*: create an environment, install dependencies, *then* run. `python src/app.py` is the last command, not the first.

**b — `pip install -r requirements.txt`:**
> `requirements.txt` is the older, pre-`pyproject.toml` declaration. Many modern projects have a `pyproject.toml` instead (or both). The clone here has only `pyproject.toml`, so `pip install -r requirements.txt` either errors (file not found) or installs the wrong things. **And even when `requirements.txt` exists, running `pip install` before creating a venv pollutes your global Python.** The 2015 reflex — when `requirements.txt` was universal and people skipped `venv` — is exactly what the modern dance fixes.

**c — `python3 -m venv .venv && source .venv/bin/activate && pip install -e .`:**
> Correct. The modern Python install dance, in one line: create an isolated virtual environment (`python3 -m venv .venv`), activate it (`source .venv/bin/activate`), then install the project in editable mode (`pip install -e .`) — which reads `pyproject.toml` and installs both the project and its declared dependencies. Editable mode means changes to source files are picked up without reinstall. After this, `python src/app.py` (or whatever the project's entry point is) works.
>
> Next: syntax. Indentation and `self` are the two things that will look weird in the first Python file you open Friday — Lesson 1 lands both in 10 minutes.

**d — `pip install .`:**
> Almost. `pip install .` *does* read `pyproject.toml` and install dependencies — but it installs into your **global** Python (or worse, into the system Python, which on macOS triggers a security warning and on Linux pollutes `/usr/lib/python3/dist-packages`). The `venv` step is what keeps your machine clean across projects. **Skip it once, regret it twice.** Also: `pip install .` (without `-e`) installs a *copy* — edits to source files don't show up until you reinstall. `pip install -e .` is what every "I'm working on this project" workflow wants.

---

## Self-review checkpoint (before commit)

- [x] The single `read` step passes the paragraph test §2.1 (audit table included above). What got cut is named in the table footer.
- [x] Predict feedback names the **specific** wrong mental model behind each wrong answer (JS reflex, 2015 Python reflex, "skip the venv" half-correct). No generic "the right answer is C because…" phrasing.
- [x] No "Welcome to Python" preamble. No PSF / Microsoft / lingua-franca / Monty-Python content. No historical exposition on packaging.
- [x] Content is in English; meta-notes in Spanish.
- [x] Sandbox-honesty paragraph present in the `read`.
- [x] Lesson 0 has no kata — the lesson orients, doesn't drill syntax. Voice intact.
- [x] Audience review compliance: senior who already operates `venv` daily has an explicit out in the `Why this matters` opener; the install-dance section is dense enough they can skim it without losing anything.
- [x] No figures embedded. The figures menu (`python.md` §2) lists Lesson 0's `before-after` (the `node`-reflex vs `python3 -m venv` shape) as a *secondary* candidate; defaulting to no figure here because the venv-vs-Bundler aside in the read does the cross-language framing in two sentences. Revisit at suite voice audit if the prose feels thin without it.

Pending until suite voice audit (after Lesson 5 ships): tone calibration as a suite, possible cuts if any paragraph is found wanting against the four primary-persona reactions captured in the [audience review](../../sprints/current.md).

---

## Figure data spec

*None embedded in this lesson.* See the self-review checkpoint above for the rationale (Lesson 0's `before-after` candidate is listed as secondary in `python.md` §2 and defaulted out). If suite voice audit decides to add one, the data spec lands here and the embedding goes after the "venv-vs-Bundler" aside.
