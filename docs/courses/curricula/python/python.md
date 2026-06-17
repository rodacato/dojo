# Python — Authoring Spec

> Executable authoring brief for the `python` scroll — the dojo's Python crash course.
> Inherits the Python Course Authoring Profile from [`../python.md`](../python.md) §2. Template: [`../../authoring-spec-template.md`](../../authoring-spec-template.md). Framework: [`../../README.md`](../../README.md). Direction: [ADR 022](../../../adr/022-crash-course-pivot.md).
>
> **Drafted 2026-06-07** — polyglot-first scope from the outset (Python did not have a pre-pivot inner spec; the outer `python.md` flagged 2026-06-06 was pre-pivot but never had a per-scroll inner brief). **Promoted to canon 2026-06-08** under Sprint 027 W1. This spec is the first authoring contract for the Python crash scroll.

## Header

```yaml
slug: python
title: "Python"
kind: language-scroll
language: python
sandbox: piston
prereqs: []
audience: "polyglot developer who already programs in another language"
learner_time: "~100 minutes (60-120 range)"
status: spec-in-progress         # outer + inner spec drafted; all lessons stubbed, none authored
maintainers:
  - S7 Nadia Petrov              # language pedagogy
  - S5 Elif Yıldız               # curriculum architecture
  - S2 Valentina Cruz            # content quality
  - S11 Maya Lindqvist           # predict / playground / read+inline review
primary_audience:
  - A1 Mariana Vargas            # JS senior — Node + React + Postgres
  - A4 Felipe Reyes              # TS modernizer — JS-heavy, type-curious
secondary_audience:
  - A3 Yui Tanaka                # Java senior — Python as scripting
out_of_scope_audience:
  - A2 Esteban Morales           # already a Python mid-senior; not a learner here
```

---

## 1. Learning Outcomes

After finishing this scroll, the learner can…

- Locate Python on their internal language map: what it is for, what it's not (Django/Flask is not Python, pandas/numpy is not Python), why `python3` vs `python` is sometimes a question (Linux distros, macOS, Windows), what the `pip` / `venv` / `poetry` / `uv` landscape looks like (and what to reach for first as of 2026), what a `pyproject.toml`-shaped project looks like when you `git clone` it, and what command actually runs a Python project in the wild.
- Read Python's two "first 10 minutes" surprises without friction: **indentation is syntax** (not convention — `IndentationError` is a parse-time error), and **`self` is the explicit first parameter** of instance methods (not implicit, not optional, not magic). Name the `__dunder__` surface as Python's protocol surface (`__init__`, `__repr__`, `__iter__`, `__enter__` / `__exit__`, `__call__`) and recognise that `for`, `with`, `[]`, `()` all dispatch through dunders.
- Read and write idiomatic Python across the dominant data-transform shapes: **list, dict, and set comprehensions** (`[expr for x in xs if p(x)]`), **generator expressions** (the same syntax with parens — lazy by default), **f-strings** (`f"hello {name}"` with format specs), **slicing** (`xs[1:5]`, `xs[::-1]`, `xs[::2]`), **unpacking** (`a, b, *rest = xs`, `**opts`). Pick the right shape (list vs generator vs `for` loop) for the problem.
- Reach for **EAFP** (`try` the operation, `except` the specific exception) as the cultural default over **LBYL** (`if hasattr(...)`, `if k in d`). Explain when LBYL is the correct choice (cheap check, common case, no race risk) and when it's a duck-typing violation or a race condition. Predict the result of common Python expressions that surprise a polyglot — `is` vs `==` on small ints (the interned-int range), `[] == False` (`False`, not `True` — `[]` is falsy but not equal to `False`), mutable default arguments evaluated at `def` time.
- Use **context managers** as the resource-acquisition shape: read the `__enter__` / `__exit__` protocol, write a context-manager class with both methods, write a context manager from a generator with `contextlib.contextmanager`, and recognise when to reach for `with` over `try/finally`. Explain why `with open(p) as f` is idiomatic and `f = open(p); ...; f.close()` is not.
- Write decorators: understand `@d` as sugar for `f = d(f)`, write a plain decorator that wraps a function, use `functools.wraps` to preserve `__name__` / `__doc__` / `__module__`, write a parametrised decorator (the three-layer onion: decorator-factory → decorator → wrapper), and recognise that `@property`, `@classmethod`, `@dataclass`, `@functools.cache` are all the same idea applied to different inputs. Name the late-binding closure trap (`[lambda: i for i in range(3)]` returning three lambdas that all close over the same `i`).
- Name the Python-specific footguns the polyglot will eventually encounter in real codebases (mutable default arguments evaluated at `def` time, late binding in closures, `is` vs `==` confusion, decorators without `functools.wraps`, EAFP misused as LBYL-in-a-`try`, "async-everywhere disease"). Know they belong to deep-dive scrolls — not silently ignored, not taught here in passing.
- Name what's deferred and where to find depth: **asyncio at depth** (`python-asyncio-deep`), **descriptors and the `__init_subclass__` mechanism** (`python-descriptors-and-protocols`), **metaclasses** (same), **the typing surface beyond literacy** — `Protocol`, `TypedDict`, `TypeVar` — (`python-typing-deep`), **packaging beyond `pyproject.toml` literacy** (`python-packaging-and-tooling`), **`pytest` and property-based testing** (`python-testing-deep`).

Each outcome maps to at least one exercise, `predict`, or playground step in §4. Outcomes without a step are aspirational and must be cut or backed by a step.

---

## 2. Sub-course Authoring Notes

Inherits the Python Course Authoring Profile (see [`../python.md`](../python.md) §2) without deviation:

- Voice & angle — Python-not-Django/Flask, Python-not-pandas/numpy. Polyglot audience explicitly assumed in every step. Mirror of Ruby's Ruby-not-Rails ([ruby.md §2](../ruby.md)).
- Step density — 250-350 words per `read` step for Lessons 0-3; 300-400 words for Lessons 4-5 where the mechanism behind the syntax is the lesson.
- Interactivity menu — `read`, `exercise`, `challenge`, `predict`, `read+inline`, `playground` variant. No `trace`.
- Pedagogical bets — all four apply.

Explicit local choices for this scroll specifically:

### 2.1 The "Pythonic test" — gate for every `read` step

Python-specific equivalent of Ruby's paragraph test ([ruby/ruby.md §2.1](../ruby/ruby.md)). Before any `read` paragraph ships, it passes the test:

> *If I delete this paragraph, does the polyglot lose something Python-specific — an idiom, a protocol-surface fact, a cultural reflex, or a footgun? If no, the paragraph doesn't exist.*

This is the load-bearing rule against the **two failure modes Python authoring is famous for**: (1) the tour-guide failure mode shared with Ruby (re-teaching what every polyglot already knows about strings, lists, `if/else`), and (2) the **library-conflation failure mode unique to Python** — paragraphs that introduce `requests`, `numpy`, `pandas`, `Django`, `Flask`, `FastAPI` as if they were part of the language. Both fail the test. A paragraph survives only if it names something Python-the-language gives you that the polyglot's prior language doesn't, OR a cultural reflex (EAFP, comprehension-first, `with`-for-resources) the polyglot needs to internalise.

The specific failure mode this gate catches: a `read` step on EAFP that opens with *"In production Python, you often use the `requests` library to make HTTP calls and handle errors with `try/except`..."*. Cut. The polyglot does not need to be sold on `requests`. They need to know that **`try/except` is the cultural default in Python, not the escape hatch it is in Java**. Every word of every `read` step is judged against this gate at draft and at review. Tour-guide prose and library-conflation prose that survive a draft are cut at review.

### 2.2 `predict` placement

Four predict steps total — one each in Lessons 0, 1, 3, and 5. Locations and the model-building moment each one targets:

- **Lesson 0 — "Tenés un proyecto Python clonado. ¿Qué corrés primero?"** — orientation predict, validates the `pyproject.toml` + `venv` mental model the read step introduced. Mirror of Ruby Lesson 0's `bundle install` predict. The wrong answers encode three polyglot reflexes: "just `python file.py` it" (the JS reflex from `node`), "`pip install -r requirements.txt`" (the half-remembered Python reflex from 2015), and "`pip install .`" (the half-correct intuition).
- **Lesson 1 — "¿Qué imprime este código?"** with a `class Counter: def __init__(self, items=[]): ...` snippet — the mutable-default-argument trap, planted in Lesson 1 so the learner *encounters* it before Lesson 5 *explains* it. The predict's feedback names the surprise but defers the mechanism ("you'll see why in Lesson 5 when we cover closures and `def`-time evaluation"). This is a deliberate seeding — the predict is the hook; the mechanism is the payoff.
- **Lesson 3 — "¿Qué hace `try: ... except ValueError, KeyError:`?"** — the syntactic trap where the comma forms a tuple-as-name-binding rather than a multi-exception catch (Python 2 syntax, removed in Python 3; the modern syntax is `except (ValueError, KeyError):`). Tests the polyglot's careful reading of exception syntax.
- **Lesson 5 — "¿Qué retornan estos tres lambdas?"** with the canonical late-binding loop trap (`fns = [lambda: i for i in range(3)]; [f() for f in fns]`). The Lesson 5 predict closes the loop on the closures topic — it's the most common Python-closure surprise, and it lands harder when it's the predict opening the lesson rather than a footnote after.

Lessons 2 (literals/comprehensions) and 4 (context managers) are mechanical enough that `predict` would feel forced — the surprises in those lessons are best learned by writing the code, not by guessing the output. They stick to read + kata (+ playground in 2 and 4).

**Why 4 predicts, not 3 or 5:** the Python surprise surface has 4 canonical "polyglot trap" moments that earn a predict (orientation, mutable defaults, exception syntax, late binding). A 5th would force a contrived prediction; a 3rd would skip the mutable-defaults trap or the late-binding trap, both of which are load-bearing in the deep-dive deferral list. Mirror of Ruby's 4-predict choice.

### 2.3 Playgrounds as `kata` variant (inherited from Ruby)

Two playground steps in this scroll (Lessons 2 and 4). They are NOT a new step type — they are `kata` steps with a `data.kind: "playground"` flag, **identical contract to Ruby's playgrounds** (see [ruby/ruby.md §2.3](../ruby/ruby.md)). The scroll player reads the flag and renders without verdict UI: button reads "Ejecutar" instead of "Ejecutar tests", no test-result list, no pass/fail chip. The harness's `testCode` carries a single trivially-true assertion so the backend stays uniform.

This is still a **local experiment**, not a framework decision. With Ruby shipping 2 playgrounds and Python shipping 2 more (4 total across 2 scrolls), the pattern moves from "1 scroll's experiment" toward "potential canonical step type" — but is still below the ≥20-instances gate from [`../../INTERACTIVITY-PATTERNS.md`](../../INTERACTIVITY-PATTERNS.md) §"Authoring checklist for a new step type". Promotion to canonical step type still requires Rust/TS/Go to add at least 6 more playgrounds across the catalog, OR explicit engagement signal that justifies bypassing the gate (per Sprint 026 retro outcome — see [ruby/ruby.md §7](../ruby/ruby.md)).

**Playground voice contract:** identical to Ruby's. The instruction text gives the learner specific things to try, with motivation. Not "explorá libremente" — that produces an empty editor. The starter code pre-loads 3-5 expressions tied to the read/kata the playground follows; the learner runs them, observes output, then is invited to vary them. Maya (S11) will block any playground whose instruction reduces to "play around."

**Python-specific playground topics chosen:**
- **Lesson 2's playground** — comprehension variants. Pre-load list, dict, set comprehensions and a generator expression on the same data. Invite variation: "what happens if you call `next()` on the generator twice?", "what's the difference between `[x for x in xs]` and `(x for x in xs)` in terms of memory and re-iteration?". Teaches lazy-vs-eager without making it a kata.
- **Lesson 4's playground** — context-manager `__enter__` / `__exit__` ordering. Pre-load a context manager class that prints on `__enter__`, on `__exit__`, and a `with` block that may or may not raise. Invite variation: "what prints if the `with` block raises?", "what's the exit code if `__exit__` returns `True` vs `None`?". Teaches the exception-swallowing protocol without making it a kata.

### 2.4 Hint discipline

**Reused verbatim from [ruby/ruby.md §2.4](../ruby/ruby.md)** — generalizable rule, not Ruby-specific. The rule:

> *A hint must NOT name the exact method or operator that solves the kata. If removing the hint would not change which Python identifier the learner types, the hint is the solution.*

Examples of the failure mode applied to Python:
- ❌ `Usá functools.lru_cache para memoizar la función.` — names the exact decorator. Solution in disguise.
- ✅ `Cuando una función es pura y la llamás con los mismos argumentos seguido, querés evitar recalcular. ¿Qué herramienta del stdlib te da esa memoización sin escribir el dict de cache a mano?` — points at where to look, makes the learner find `functools.cache` or `lru_cache`.

Same rule for `instruction`: avoid "Pista: usá `contextlib.contextmanager`..." lines that reveal the answer under the guise of guidance. The kata's instruction states *what* to build; the hint helps a learner who is stuck after trying. A learner who got the answer just from reading the instruction never wrote any Python.

This rule applies to all kata steps across Lessons 1-5. Authoring Lessons 1-5 against this gate is a precondition for their seeding.

**Tiered hints (`hints: string[]`).** A kata may carry an ordered array of hints instead of a single `hint`. The player reveals them progressively: tier 1 on the first failed run, tier 2 on the second (see [`../../INTERACTIVITY-PATTERNS.md`](../../INTERACTIVITY-PATTERNS.md) §"Progressive hint reveal"). Tier 1 obeys the rule above verbatim — points at *where to look*, never names the solving identifier. Tier 2 is the last nudge before the (still gated) solution: it may name the method, operator, or construct, but must not write the full solving expression — leave the learner to assemble it. `hints` falls back to `[hint]` for steps that carry only the legacy single hint, so unconverted katas need no change. Tiered in this scroll: `safe_get` (3.3), `parse_int_or` (3.4), `temp_state` (4.2), `@trace` (5.3), `@retry` (5.4). The capstone `parse_prices` (5.5) keeps a single high-level hint by the challenge rule.

**Broken→fix katas.** Some katas hand the learner plausible-but-wrong `starterCode` to debug instead of a blank scaffold (the Rustlings shape; precedent: `apps/api/.../katas/debugging.ts`). Use it **only when the planted bug embodies the polyglot misconception the kata targets, and fixing it teaches the intended idiom** (the bar in [`../../INTERACTIVITY-PATTERNS.md`](../../INTERACTIVITY-PATTERNS.md) §"Broken→fix katas"). Converted in this scroll (bug = the misconception): `flatten` (2.3) — nested-comprehension `for` clauses in the wrong order, raising `NameError`; `safe_get` (3.3) — `d.get(key) or default` swallows a present-`None`/falsy value; `temp_state` (4.2) — restore after `yield` with no `try / finally`, so cleanup is skipped when the block raises (`finally` is not optional). Kept write-from-scratch because no planted bug embodies the idiom without fighting it: `Counter` (1.3), `tally` (2.2, two idioms — no single clean bug), `parse_int_or` (3.4, the EAFP shape is the lesson, not a bug to spot), `Capture` (4.3), `@trace`/`@retry`/`parse_prices` (decorator mechanics — the onion shape is the work). Don't homogenize — the format mix is a feature.

### 2.5 Footgun deferral discipline

When a topic that belongs in a future deep-dive surfaces (e.g. **descriptor protocol** behind `@property`, **metaclasses** behind `__init_subclass__`, **the asyncio event loop** behind `await`, **`functools.lru_cache` cache invalidation subtleties**, **the GIL's effect on `multiprocessing` vs `threading`**), the scroll **names it explicitly** and points to the deep-dive — does not silently elide. This is the difference between honest crash and superficial cheat sheet.

Python-specific deferral list — each item gets named once with one-line footgun + pointer:

| Topic | Surfaces where | Footgun named | Deferred to |
|---|---|---|---|
| `__init_subclass__` and metaclasses | Lesson 5 closer | "metaclasses are the class of a class — if you have to ask, you don't need them" (Tim Peters) | `python-descriptors-and-protocols` |
| Descriptor protocol behind `@property` | Lesson 5 closer | `@property` is "just" a descriptor — useful as literacy, dangerous as a writing target | `python-descriptors-and-protocols` |
| Asyncio at depth (event loop, `Future`, `Task`) | Lesson 5 closer | "you forgot to await" produces a coroutine object that does nothing | `python-asyncio-deep` |
| `Protocol` typing (structural typing) | Lesson 1 dunder mention + Lesson 5 closer | structural typing is Python's TS-style answer; mypy/pyright enforce it offline | `python-typing-deep` |
| `pytest` fixtures and parametrize | Lesson 0 mention | `pytest` is the production default but stdlib `unittest` is the runner-of-last-resort | `python-testing-deep` |
| The GIL and `multiprocessing` | Not mentioned in scroll | (not surfaced — too deep for crash) | `python-asyncio-deep` mentions; full treatment elsewhere |
| `functools.lru_cache` invalidation | Lesson 5 closer | `lru_cache`'s `cache_clear()` and the per-instance method footgun (caches references to `self`, prevents GC) | `python-descriptors-and-protocols` or a future `python-functools-deep` |

Each surface in the table is a one-line mention. Spectacle is the failure mode.

### 2.6 No `pytest`, no `unittest` — manual harness

The crash scroll uses the manual `_t` / `_eq` harness defined in §5. **Neither `pytest` nor `unittest` is introduced.** Reasoning:

- `pytest` is the production default but **belongs to its own deep-dive scroll** (fixtures, parametrize, conftest, plugins). Teaching it as the harness for the crash would steal pedagogy budget from the language and create a "did we learn Python or pytest?" ambiguity.
- `unittest` is in the stdlib and is the obvious runner-of-last-resort, but its API (`TestCase`, `assertEqual`, `setUp`/`tearDown`) is verbose enough to *also* steal pedagogy budget. A learner who finishes the crash thinking "Python testing means `class TestX(unittest.TestCase): def test_foo(self):`" has been mis-taught — modern Python testing means `pytest`.
- The manual `_t` / `_eq` pattern is what Ruby uses ([ruby/ruby.md §5](../ruby/ruby.md)) and serves the same purpose: a thin harness that doesn't *teach* itself, just runs the assertions. Cross-scroll consistency.

The `_t` / `_eq` harness for Python is defined in §5 below. It mirrors Ruby's harness shape exactly, translated to Python idioms (a global `_tests` list, `def _t(name): ... try/except`, `def _eq(actual, expected): assert ... `, footer that emits `__DOJO_RESULT__ <json>`).

---

## 3. Retrieval & Cross-references

- **From prior scrolls:** none — this is the entry scroll of the Python track.
- **Within this scroll:**
  - Lesson 1's `__dunder__` surface mention (specifically `__iter__`, `__enter__` / `__exit__`, `__call__`) reappears in Lesson 4 (context managers earn `__enter__` / `__exit__` by writing one) and Lesson 5 (decorators earn `__call__` and the class-as-decorator variant). The learner who completed Lesson 1 reads "context manager class" in Lesson 4 without re-explanation.
  - Lesson 2's comprehension idiom (`[expr for x in xs if p(x)]`) reappears throughout Lessons 3-5 as the default data-transform shape. Lesson 3's EAFP exercises return comprehension-built collections; Lesson 5's decorator examples use comprehensions to build wrapper logic. Lesson 2 does NOT re-teach the syntax in later lessons — it's the assumed shape.
  - Lesson 2's `f-string` interpolation (`f"hello {name}"`) is the assumed formatting throughout. No `.format()` or `%`-formatting taught — `f-strings` are the modern default and every later read step uses them.
  - Lesson 3's `try/except` muscle reappears in Lesson 4 (a context manager's `__exit__` handles exceptions) and Lesson 5 (a `@retry` decorator catches exceptions). The mechanism (EAFP) is the same; the shape (`with` vs `@decorator`) is what changes.
  - Lesson 4's `contextlib.contextmanager` (generator-based context manager) is the bridge to Lesson 5's decorators — both are "function-modifying-callable" shapes. The read step in Lesson 5 explicitly references Lesson 4: "remember how `@contextmanager` turned a generator into a context manager? That's the same shape as a plain decorator — a callable transforming another callable."
- **Forward hooks for future deep-dive scrolls:**
  - **Iterator protocol** (`__iter__`, `__next__`, generator-as-iterator) — named in Lesson 1's dunder mention and Lesson 2's generator-expression read, deferred to `python-iterators-and-generators`.
  - **Descriptor protocol** (`__get__`, `__set__`, `@property` mechanism) — named in Lesson 5's closer, deferred to `python-descriptors-and-protocols`.
  - **Async syntax and the event loop** (`async def`, `await`, `asyncio.run`, `TaskGroup`, async iterators, async context managers) — named in Lesson 5's closer, deferred to `python-asyncio-deep`.
  - **Type hints at depth** (`Protocol`, `TypedDict`, `TypeVar`, `Self`) — used as starter-code annotations throughout (Lesson 1's `self` discussion mentions hints once), deferred to `python-typing-deep`.
  - **Metaclasses and `__init_subclass__`** — named in Lesson 5's closer, deferred to `python-descriptors-and-protocols`.

---

## 4. Lessons

### Lesson 0 — Python en contexto

> *What changes in the learner's head:* "I now know whether Python is for me, what version family to learn, what command actually runs a Python project, and the difference between `python` / `pip` / `venv` / `poetry` / `uv` — without having to crawl through five tabs of mixed-quality Stack Overflow."

**Step distribution:** 1 `read`, 1 `predict` = 2 steps. No `kata` here — this lesson orients, it doesn't drill syntax. *(Audience review 2026-06-08 collapsed the original two reads into one tight ecosystem read: Mariana operates `venv` weekly, Felipe wants to skip the tour, Yui appreciates the fragmentation called out by name. The cut PSF-governance / Microsoft-sponsorship / Monty-Python content was confirmed as padding by Valentina's content-quality pass; what survives is what the polyglot can't derive from a single tab.)*

**Status:** stub.

#### Step 0.1 — `read` — "Python en contexto: para qué sirve, cómo se ejecuta"

- **why_care topics:** before investing 90 minutes in syntax, the polyglot needs (1) a one-paragraph "is Python for me, what version, what fits and what doesn't" so they can close the tab if not, and (2) the modern command sequence to run a cloned Python project (`pyproject.toml` era). Both fit one tight read.
- **body topic outline (~350 words combined):**
  - **Where Python fits, where it doesn't (one tight paragraph):** scripting and automation, web backends (Django/Flask/FastAPI — named only to exclude from scroll scope), data science and ML stack (pandas/numpy/PyTorch — also named only to exclude), DevOps tooling. Where it doesn't: sub-ms latency systems, CPU-bound workloads without `numpy`/Cython (the GIL bites), mobile native, anything where startup time matters. One sentence on "the answer is 3.11+; `match`/`case` is 3.10, speed jump is 3.11, generics syntax is 3.12, no-GIL experimental is 3.13."
  - **`python` vs `python3`:** on macOS Big Sur+ and most Linux distros, `python` may be absent or point to Python 2; `python3` is the safe invocation. Modern projects assume `python3` or pin via `.python-version`.
  - **The install dance you'll actually run:** `python3 -m venv .venv && source .venv/bin/activate && pip install -e .` (or `pip install -r requirements.txt` on older projects). The `-e .` reads `pyproject.toml` and installs the project in editable mode. **Distinct from Ruby's Bundler:** Python's venv *is* an activated shell-level environment (state on `PATH`); Ruby's Bundler isolates per-command via `bundle exec`. Same goal, different mechanism.
  - **`pyproject.toml` (PEP 518/621):** the modern declaration file. Replaces `setup.py` and (mostly) `setup.cfg`. `[project]` for metadata, `[build-system]` for the build backend. A clone in 2026 likely has this file.
  - **Package-manager landscape (one sentence each, no tour):** `pip` + `venv` (stdlib, the read-older-projects baseline), `poetry` (mature, opinionated, lockfile-based), `uv` (Astral, 2024 — Rust-fast drop-in `pip`, modern default for new projects), `conda` (scientific computing, handles non-Python dependencies). **For a polyglot in 2026:** `uv` for new projects, `pip` + `venv` to read older ones.
  - **Sandbox honesty:** "This crash course runs Python 3.11 in sandbox. `tomllib` is stdlib, exception groups work, structural pattern matching works. On your machine, install 3.11+ via `pyenv`, `asdf`, or your distro's package manager."
  - **NOT to include:** "Python is elegant" / "Python is the most popular" / PSF governance + Microsoft sponsorship / the Monty Python origin story / "interpreted" definition / `python -m foo` mechanics (deferred — first time it matters is `python -m venv` here, and the command itself teaches it) / Python's packaging history (eggs, wheels, the `setup.py` era).
- **closer:** "Next, a predict that lands the install dance. After that, syntax."

#### Step 0.2 — `predict` — "Tenés un proyecto Python clonado. ¿Qué corrés primero?"

- **question:** "You cloned a Python project from GitHub. It has a `pyproject.toml` and a `README.md` that says 'requires Python 3.11+'. You want to run it. What command goes first?"
- **snippet:**
  ```
  $ git clone https://github.com/example/python-app.git
  $ cd python-app
  $ ls
  pyproject.toml  README.md  src/  tests/
  $ ???
  ```
- **options (4):**
  - `a`: `python src/app.py` (the JS-reflex "just run it")
  - `b`: `pip install -r requirements.txt` (the half-remembered 2015 reflex)
  - `c`: `python3 -m venv .venv && source .venv/bin/activate && pip install -e .` (the modern correct answer)
  - `d`: `pip install .` (half-correct — installs but skips the venv)
- **correct:** `c`
- **feedback sketch (each option):**
  - **a:** "Just run it" works in JS because Node has a giant stdlib and trivial projects can run zero-dependency. In Python, almost any real project depends on external packages — running `python src/app.py` before installing dependencies gives you `ModuleNotFoundError` on the first `import`. Step 1 is always: create an environment, install dependencies. Then run.
  - **b:** `requirements.txt` is the older, pre-`pyproject.toml` declaration. Many modern projects have a `pyproject.toml` instead (or both). The clone here has only `pyproject.toml`, so `pip install -r requirements.txt` either errors (file not found) or installs the wrong things. The polyglot reflex from 2015 — when `requirements.txt` was universal — is no longer the default in 2026.
  - **c:** Correct. The modern Python install dance is: create an isolated virtual environment (`python3 -m venv .venv`), activate it (`source .venv/bin/activate`), then install the project in editable mode (`pip install -e .`) — which reads `pyproject.toml` and installs both the project and its declared dependencies. Editable mode means changes to source files are picked up immediately. After this, `python src/app.py` (or whatever the project's entry point is) works.
  - **d:** Almost — `pip install .` does read `pyproject.toml` and install dependencies, but it installs into your *global* Python (or worse, into your system Python, which on macOS triggers a security warning and on Linux pollutes `/usr/lib/python3/dist-packages`). The venv step is what keeps your machine clean across projects. Skip it once, regret it twice.

---

### Lesson 1 — Las dos sintaxis que sorprenden

> *What changes in the learner's head:* "Indentation is the syntax — `IndentationError` is a parse-time error, not a style warning. `self` is the explicit first parameter of every instance method — Python's class system is open about what other languages hide. And the `__dunder__` methods are not advanced — they're the protocol surface that makes `for`, `with`, `[]`, `()` all work."

**Step distribution:** 1 `read`, 1 `predict`, 1 `kata` = 3 steps.

**Why these two surprises first (polyglot-first defense):** the polyglot will encounter indentation-as-syntax and `self`-as-explicit-first-parameter in the first 30 seconds of opening a Python file. Pretending they don't surprise is gaslighting; deferring them to Lesson 4 (OOP territory in a traditional curriculum) lets the surprise interfere with every read step before then. Lesson 1 calibrates: 10 minutes, two facts, move on. Nadia (S7) signed off with the constraint that the dunder surface gets *named* here (as Python's protocol surface — not just `__init__`) but not earned until Lessons 4-5.

**Status:** stub.

#### Step 1.1 — `read` — "Las dos cosas que sorprenden cuando abrís un archivo Python"

- **why_care topics:** the polyglot opens a Python file Friday. Two things look weird in the first 10 lines: the indentation defines blocks (no `{}`), and every method definition starts with `self`. Naming them up front means they don't trip the learner for the rest of the scroll. **And before they trip on something worse — reaching for `class TaskRunner:` to write a three-line script — name the Java reflex and head it off.**
- **body topic outline (~350 words):**
  - **Surprise 1: indentation is syntax.** Python uses indentation (not braces, not `do/end`, not `begin/end`) to delimit blocks. `if x:` is followed by a block that begins on the next indented line and ends when the indent goes back. **An inconsistent indent is a parse error (`IndentationError`)** — not a style warning. PEP 8 says 4 spaces; tabs work but mixing tabs and spaces is fatal. Every modern editor handles this; you just need to know it's syntax, not convention. *Polyglot reflex named:* "If you came from JS/Java/C, your reflex is that whitespace doesn't matter. In Python it does. If you came from Ruby, your reflex is `do...end` — Python doesn't have that; the indent itself is the block boundary."
  - **Surprise 2: `self` is the explicit first parameter.** When you define an instance method, the method signature *always* declares the receiver explicitly:
    ```python
    class Counter:
        def __init__(self, start=0):
            self.value = start

        def increment(self):
            self.value += 1
    ```
    `self` is a *naming convention*, not a keyword — you could literally write `this` or `me`. But every Python codebase uses `self`. And it's *required* — there's no implicit `this` like in JS/Java/Ruby. When you call `counter.increment()`, Python passes `counter` as the first argument. **This is good news for a polyglot**: Python's class system is transparent about what other languages hide. The cost is two more characters per method signature; the gain is no "wait, where does `this` come from?" confusion. **In TypeScript terms**, this is the `function foo(this: Type, ...)` first-parameter trick — declared in the signature, passed by the caller. **In Java terms**, it's the receiver that Java keeps invisible (`this`) made explicit.
  - **The `__dunder__` surface (named, not earned):** Python's protocol surface lives in **dunder** methods — methods whose names start and end with double underscores. `__init__` is the constructor. `__repr__` controls the developer-facing string representation. `__iter__` makes an object iterable (so `for x in obj` works) — *the TS analogue is `Symbol.iterator`; the Java analogue is implementing `Iterable<T>`.* `__enter__` / `__exit__` make an object a context manager (so `with obj` works) — *no native TS analogue (closest is stage-3 `await using`); Java analogue is `AutoCloseable` consumed via `try-with-resources`.* `__call__` makes an instance callable (so `obj()` works) — *TS analogue is the callable-interface trick (`interface Fn { (x: number): number }`); Java has no direct analogue (the closest is `Function<T, R>.apply`).* **You don't need to memorize the list.** You need to recognise that `for`, `with`, `[]`, `()` all dispatch through dunders — so "an object IS what its dunders say it is" is the language's defining bet. Lessons 4 and 5 earn this; for now, name-and-recognise.
  - **Polyglot anti-reflex: do not reach for a class here.** Python *has* classes — `self` makes that visible. **It does not want them for everything.** A three-line script that filters a list does not need `class TaskRunner: def run(self): ...` — it needs a function. A Python module that exposes one operation is a module, not a singleton class. **The Java reflex is the failure mode this scroll defends against most actively**: classes are for state + behavior pairs and protocol-surface implementations (Lesson 4 writes one for `__enter__` / `__exit__`); functions are for everything else. If you find yourself writing `class XManager:` with one method, delete the class and keep the method. *(This is also the reason no lesson in this scroll is "OOP" — see Lesson 5 closer for the deferral pointer.)*
  - *Sandbox honesty:* "In this scroll, type hints (the `: int`, `-> str` annotations you'll see in starter code) are used as design tools, not runtime checks. Python doesn't enforce hints at runtime — that's `mypy`/`pyright`'s job, and they live outside the sandbox."
  - **NOT to include:** historical PEP-8 debate / "Python was designed to be readable" / what `__init__` does at depth (Lesson 4-5 territory) / a full tour of dunders beyond the five named.

#### Step 1.2 — `predict` — "¿Qué imprime este código?"

- **question:** "Considering Python's default-argument semantics, what does this snippet print?"
- **snippet:**
  ```python
  class Counter:
      def __init__(self, items=[]):
          self.items = items

      def add(self, x):
          self.items.append(x)

  a = Counter()
  a.add(1)
  b = Counter()
  print(b.items)
  ```
- **options (4):**
  - `a`: `[]` (each instance gets its own empty list)
  - `b`: `[1]` (the default `[]` is shared between instances)
  - `c`: `TypeError` (mutable defaults raise at definition time)
  - `d`: `None` (default is evaluated lazily and returns None)
- **correct:** `b`
- **feedback sketch (each option):**
  - **a:** That's the JS / Java / Ruby reflex — "default arguments give each call a fresh value." In Python, the default expression is evaluated **once, at `def` time**, and the resulting object is reused on every call where the caller doesn't provide the argument. So `Counter()` and `Counter()` get the *same* `items` list. `a.add(1)` mutates it; `b.items` is the same list, now containing `[1]`. **The mechanism behind this surprise is Python's evaluation model for function objects, which you'll see at depth in Lesson 5 (closures). For now: never use a mutable object as a default argument. Use `None` and check inside.**
  - **b:** Correct, and the surprise is on the right thing. `def __init__(self, items=[])` evaluates `[]` once at class-definition time and binds it as the default value of the `items` parameter. Every `Counter()` call that doesn't provide `items` receives that same list. `a.add(1)` mutates it; `b.items` is the same list. **The fix: `def __init__(self, items=None): self.items = items if items is not None else []`. Lesson 5 explains *why* Python evaluates defaults at `def` time — it's a consequence of how function objects are constructed, not a bug.**
  - **c:** Python doesn't raise on mutable defaults — it just behaves surprisingly. Many linters (`ruff`, `pylint`) flag mutable defaults as a warning, but the interpreter is silent. This is the canonical Python footgun; the silence is what makes it dangerous.
  - **d:** Default values are evaluated at `def` time, not lazily. The expression `items=[]` creates a list right then; subsequent calls reuse it. There's no laziness here — laziness would actually *prevent* this bug.

#### Step 1.3 — `kata` — class with `__init__` + `__repr__`

- **1-line task description:** Implement a `Counter` class with `__init__(self, start: int = 0)` and `__repr__(self) -> str` that returns the form `"Counter(value=N)"`.
- **function signature proposal:**
  ```python
  class Counter:
      def __init__(self, start: int = 0):
          # your code
          ...

      def __repr__(self) -> str:
          # your code
          ...
  ```
- **test shape:** assert `repr(Counter())` returns `"Counter(value=0)"` and `repr(Counter(5))` returns `"Counter(value=5)"`. Forces the learner to write a dunder for the first time, lands the polyglot-friendly fact that dunders are normal methods.
- **hint sketch:** *"`__repr__` is called when you `repr(obj)` or when the REPL prints an unassigned expression. It should return a string that ideally looks like the constructor call. Use an f-string — they're the modern way to interpolate."*
- **why this kata, not something more ambitious:** Lesson 1's job is calibration. A `Counter` with `__init__` and `__repr__` lands the syntax facts (indentation, `self`, dunder convention) without spending pedagogy budget on OOP design. Lessons 4-5 earn the real dunder depth.

---

### Lesson 2 — Literales y comprehensions que vas a leer

> *What changes in the learner's head:* "Comprehensions are not 'clever syntax' — they're the dominant data-transform shape in idiomatic Python, replacing what I'd write as `.map(...).filter(...).reduce(...)` in JS or a `for` loop in Java. And generator expressions look identical but are lazy. And f-strings are the modern way to interpolate — `%s` and `.format()` are legacy."

**Step distribution:** 1 `read`, 2 `kata`, 1 `playground` = 4 steps. No predict — the surprises here are mechanical (you internalise them by writing the comprehension), not model-building.

**Status:** stub.

#### Step 2.1 — `read` — "Cinco literales que vas a leer todo el día"

- **why_care topics:** the polyglot will read these five shapes in the first non-trivial Python file. Knowing them on sight = readable code; not knowing them = three Stack Overflow tabs per function.
- **body topic outline (~300 words):**
  - **List comprehension** — `[expr for x in xs]`, `[expr for x in xs if p(x)]`. Reads as "the list of `expr` for each `x` in `xs` where `p(x)`." Replaces `xs.map(...).filter(...)` from JS reflex. **One level of nesting is OK** (`[expr for x in xs for y in ys]` reads left-to-right as the equivalent nested `for` loops — exactly the shape Lesson 2's `flatten` kata uses, and it lands cleanly for the polyglot at one depth); **two levels is a code smell**, three is wrong. The pitfall in `§6` is about *over*-nesting, not about the one-deep case.
  - **Dict comprehension** — `{k: v for k, v in items}`. Same shape, dict output. Common with `dict.items()`: `{k.upper(): v for k, v in d.items()}`.
  - **Set comprehension** — `{expr for x in xs}`. Same shape, set output. Common idiom for "unique values" — `{x.lower() for x in names}`.
  - **Generator expression** — same syntax as list comprehension but with parens: `(expr for x in xs)`. **Lazy** — produces values on demand, doesn't materialise the whole sequence. Pass to `sum`, `max`, `any`, `all`: `sum(x**2 for x in range(100))`. The parens are optional when the generator is the sole argument: `sum(x**2 for x in range(100))` works.
  - **f-string** — `f"hello {name}, you have {count} messages"`. Modern way to interpolate. Supports expressions inside `{}`, format specs (`f"{value:.2f}"`), debugging form (`f"{x=}"` prints `x=42`). **The polyglot's reflex from JS template literals (` `${name}` `) transfers cleanly — same idea, different sigil.**
  - **Slicing recap:** `xs[1:5]`, `xs[::-1]` (reverse), `xs[::2]` (every other), `xs[:-1]` (all but last). The polyglot likely knows this from JS; named here once so the kata doesn't surprise.
  - **Unpacking:** `a, b, *rest = xs` binds first, second, and rest. `first, *_, last = xs` binds first and last, ignores middle. Dict unpacking: `{**d1, **d2}` merges. Argument unpacking: `f(*args, **kwargs)` passes a list as positional and a dict as keyword.
  - **NOT to include:** what a list is / what an index is / "everything in Python is an object" (true but not load-bearing here).

#### Step 2.2 — `kata` — `tally(words)`

- **1-line task description:** Given a list of strings, return a dict mapping each unique string to the count of occurrences. Idiomatic Python uses a dict comprehension with `count`, or — even more idiomatically — `collections.Counter`. Forces choice.
- **function signature proposal:**
  ```python
  def tally(words: list[str]) -> dict[str, int]:
      # your code
      ...
  ```
- **test shape:** assert `tally(["hi", "bye", "hi"])` returns `{"hi": 2, "bye": 1}`, `tally([])` returns `{}`.
- **hint sketch:** *"There's a stdlib module called `collections` with a class designed for this exact problem. Or you can do it with a dict comprehension over `set(words)`. Both are idiomatic — pick the one whose Pythonic-ness you can defend."*

#### Step 2.3 — `kata` — `flatten(nested)`

- **1-line task description:** Given a list of lists, return a single flat list. Forces nested-comprehension shape: `[item for sublist in nested for item in sublist]`.
- **function signature proposal:**
  ```python
  def flatten(nested: list[list[int]]) -> list[int]:
      # your code
      ...
  ```
- **test shape:** assert `flatten([[1, 2], [3], [4, 5]])` returns `[1, 2, 3, 4, 5]`, `flatten([])` returns `[]`, `flatten([[]])` returns `[]`.
- **hint sketch:** *"Nested comprehensions read left-to-right in the order you'd write the nested `for` loops. The first `for` is the outer loop. Try the shape `[? for ? in nested for ? in ?]` and figure out what to put in each blank."*

#### Step 2.4 — `playground` — "Comprehension vs generator expression"

- **starter code sketch:**
  ```python
  # Same logic, two different shapes:
  list_comp = [x**2 for x in range(5)]
  gen_exp = (x**2 for x in range(5))

  print(list_comp)
  print(gen_exp)
  ```
- **invite-variation prompts:** "What's the type of each? What happens if you call `list(gen_exp)`? What about `list(gen_exp)` a second time — what does it return? When would you pick a generator expression over a list comprehension?"
- **data.kind:** `"playground"` (no verdict UI, no test result list, button "Ejecutar")
- **harness:** trivially-true `_t('explored') { _eq True, True }` so the runner is uniform.

---

### Lesson 3 — EAFP vs LBYL — el reflejo Pythonic

> *What changes in the learner's head:* "In Python, you try the operation and catch the exception. You don't check preconditions first. This isn't a hack — it's the cultural reflex and it's *faster* in the common case. And `try/except/else/finally` has more shape than I knew."

**Step distribution:** 1 `read`, 1 `predict`, 2 `kata` = 4 steps.

**Status:** stub.

#### Step 3.1 — `read` — "El reflejo Pythonic: probá la operación"

- **why_care topics:** EAFP is one of the cultural facts that defines Python. A polyglot writing Python-with-Java-reflexes will write `if hasattr(x, 'value'): return x.value` everywhere; the Pythonic answer is `try: return x.value except AttributeError: return default`. Same outcome, very different intent.
- **body topic outline (~300 words):**
  - **EAFP definition:** "It's Easier to Ask Forgiveness than Permission." Try the operation; catch the specific exception if it fails. This is the cultural default in Python — `try` is not the escape hatch it is in Java; it's the *primary* control-flow shape for "this might not work."
  - **LBYL definition:** "Look Before You Leap." Check preconditions first; then do the operation. This is the cultural default in C, Java, Go.
  - **Why EAFP in Python specifically:**
    - **Duck typing.** Python doesn't have nominal interfaces enforced at the type system — an object behaves like a duck if it quacks. The only honest test is to try the quack and see what happens. `if hasattr(x, 'read'):` is a weak claim; `try: x.read()` is the actual test.
    - **Performance in the common case.** In CPython, exception-not-raised is cheap (~50ns). Exception-raised has cost (~10μs), but if your common case is "no exception", EAFP is faster than LBYL because LBYL does the check AND the operation.
    - **Race conditions.** `if os.path.exists(p): open(p)` has a race window — the file can be deleted between the check and the open. `try: open(p) except FileNotFoundError:` doesn't.
  - **`try/except/else/finally` — full shape:**
    ```python
    try:
        result = do_thing()
    except SpecificError as e:
        handle(e)
    else:
        # runs only if try block completed without exception
        post_process(result)
    finally:
        # runs always
        cleanup()
    ```
    The `else` clause is the part most polyglots have never seen — it runs if the `try` block did NOT raise. Useful for separating "the operation succeeded" from "do the operation."
  - **When LBYL is correct:**
    - **Cheap check, common no-op case.** `if not items: return` before iterating is cheaper than catching an empty-iterable exception (which doesn't exist anyway).
    - **No race risk.** Checking a constant or a local variable is fine.
    - **Avoiding the "exception as control flow for the dominant case" anti-pattern.** If 95% of calls raise the same exception, your "exception" is actually the normal case — restructure.
  - **The footgun: EAFP misused as LBYL-in-a-`try`.** Wrapping a `hasattr(x, 'foo')` check in `try: x.foo except AttributeError:` is not EAFP — it's LBYL with extra steps. EAFP is "try the operation that's the actual work," not "try a check disguised as an operation."
  - **NOT to include:** all the exception types in stdlib / a tutorial on how Java exceptions work / a defense of dynamic typing.

#### Step 3.2 — `predict` — "¿qué hace esta syntaxis?"

- **question:** "What does this code do?"
- **snippet:**
  ```python
  try:
      x = parse(data)
  except ValueError, KeyError:
      x = None
  ```
- **options (4):**
  - `a`: Catches both `ValueError` and `KeyError`, sets `x = None` on either
  - `b`: Catches only `ValueError`, binds the exception to a variable named `KeyError`
  - `c`: `SyntaxError` — modern Python requires `except (ValueError, KeyError):` with parens
  - `d`: Catches `ValueError`, binds the exception to `KeyError`, then catches `KeyError` separately
- **correct:** `c`
- **feedback sketch (each option):**
  - **a:** In Python 2 you could write `except (ValueError, KeyError):` (with parens) for multi-exception catch, but `except ValueError, KeyError:` (no parens, comma) actually meant "catch ValueError and bind it to a variable named KeyError." Python 3 removed the ambiguous syntax — the only legal form is `except (ValueError, KeyError):` with parens (multi-catch) or `except ValueError as e:` (single-catch with bind).
  - **b:** That was the Python 2 meaning of the syntax (ambiguous and surprising). Python 3 rejects this form at parse time.
  - **c:** Correct. Python 3 made this a `SyntaxError` to remove the Python 2 ambiguity. The two modern forms are `except (ValueError, KeyError):` (multi-exception catch) and `except ValueError as e:` (single catch with variable binding). If you see the comma form in legacy code, it's Python 2.
  - **d:** Python doesn't chain `except` clauses with commas. Each `except` is its own clause.

#### Step 3.3 — `kata` — `safe_get(d, key, default)`

- **1-line task description:** Return `d[key]` if it exists, else `default`. Force EAFP shape — but also show that `dict.get` is the better answer when the key check is the whole operation.
- **function signature proposal:**
  ```python
  def safe_get(d: dict, key, default=None):
      # your code
      ...
  ```
- **test shape:** assert `safe_get({"a": 1}, "a")` returns `1`, `safe_get({"a": 1}, "b", default="missing")` returns `"missing"`, `safe_get({"a": None}, "a", default="missing")` returns `None` (the value is `None`, not absent).
- **hint sketch:** *"Two solutions are idiomatic: a `try: d[key] except KeyError: default` shape (EAFP) and `d.get(key, default)` (one-liner). When you write the EAFP shape, the test where the value IS `None` matters — `None` is a legitimate value, not absence."*
- **why this kata:** lands the EAFP/LBYL choice in one concrete example, plus the `None`-vs-missing distinction that bites every polyglot at some point.

#### Step 3.4 — `kata` — `parse_int_or(s, default)`

- **1-line task description:** Try `int(s)`; on failure, return `default`. Forces the dominant EAFP shape with a specific exception type.
- **function signature proposal:**
  ```python
  def parse_int_or(s: str, default: int) -> int:
      # your code
      ...
  ```
- **test shape:** assert `parse_int_or("42", 0)` returns `42`, `parse_int_or("nope", 0)` returns `0`, `parse_int_or("", -1)` returns `-1`. Also: `parse_int_or("3.14", 0)` returns `0` (int() doesn't parse floats from strings).
- **hint sketch:** *"`int(s)` raises a specific exception type when `s` isn't a valid integer string. Catch that specific type — not bare `except:`, which would also catch `KeyboardInterrupt` and other system-level signals."*

---

### Lesson 4 — Context managers

> *What changes in the learner's head:* "`with open(p) as f` is not 'syntactic sugar for try/finally' — it's the language's mechanism for resource acquisition, and it has a protocol (`__enter__` / `__exit__`). I can write one. And `contextlib.contextmanager` turns a generator into a context manager, which is the same shape as a decorator (Lesson 5 preview)."

**Step distribution:** 1 `read`, 2 `kata`, 1 `playground` = 4 steps. No predict — the surprises here are about *writing* the context manager, not predicting output.

**Status:** stub.

#### Step 4.1 — `read` — "`with`: el shape para recursos"

- **why_care topics:** every Python codebase opens files, acquires locks, manages database connections, redirects stdout. `with` is the shape. Reading "`with open(p) as f`" without knowing the protocol = guessing what it does.
- **body topic outline (~350 words):**
  - **`with` block syntax:** `with expr as name: ...`. `expr` evaluates to a context manager (an object with `__enter__` and `__exit__`). `__enter__` runs, its return value is bound to `name`. The block executes. `__exit__` runs, regardless of whether the block raised.
  - **Why this exists:** acquired resources need release. `try/finally` works but is verbose and easy to skip — `f = open(p); try: ... finally: f.close()` is four lines for one operation. `with` makes it one. **More importantly:** `with` makes the resource lifetime *visually scoped* to the block. The polyglot reads `with ... as f:` and immediately knows `f` lives only inside.
  - **The protocol — `__enter__` / `__exit__`:**
    ```python
    class FileOpener:
        def __init__(self, path):
            self.path = path

        def __enter__(self):
            self.f = open(self.path)
            return self.f

        def __exit__(self, exc_type, exc_val, exc_tb):
            self.f.close()
            # return True to suppress the exception; None (or False) to propagate
            return None
    ```
    `__enter__(self)` is called when the `with` block starts. Its return value is what gets bound to `as name`.
    `__exit__(self, exc_type, exc_val, exc_tb)` is called when the block exits. If the block raised, the three args carry the exception info; if not, all three are `None`. Returning truthy from `__exit__` swallows the exception; returning `None` (the default) lets it propagate.
  - **`contextlib.contextmanager` — the shortcut.** Writing the class is verbose. The stdlib gives you a decorator:
    ```python
    from contextlib import contextmanager

    @contextmanager
    def file_opener(path):
        f = open(path)
        try:
            yield f
        finally:
            f.close()
    ```
    The function yields once. Everything before `yield` is `__enter__`; the yielded value is what gets bound to `as name`; everything after `yield` is `__exit__`. The `try/finally` around the yield ensures cleanup even on exception.
  - **The bridge to Lesson 5:** `@contextmanager` is a decorator. A decorator is a function that takes a function and returns a new object (here, a context manager). Lesson 5 unpacks the decorator shape; for now, recognise that `@contextmanager` and `@property` and `@dataclass` are all *callable transformations* applied at definition time.
  - **Sandbox honesty:** "In production Python you'll see context managers around database connections, lock acquisition, temporary directory creation, stdout/stderr redirection. In this scroll we use file-like context managers because Piston is single-process and stateless — but the protocol is identical regardless of what's being managed."
  - **NOT to include:** the deep `contextlib.ExitStack` story / async context managers (`__aenter__` / `__aexit__` — deferred to asyncio scroll) / what RAII is in C++.

#### Step 4.2 — `kata` — `@contextmanager`-based `temp_state`

> *Order rationale (audience review 2026-06-08):* Mariana and Felipe both flagged that writing `__enter__` / `__exit__` from scratch felt like Lesson 5 territory dragged early. The `@contextmanager` shape — a function with `yield` and a `try/finally` — reads as a recognisable JS/TS generator pattern with a Python wrapper, so it lands first. The class form follows in 4.3 once the protocol's behaviour is concrete.

- **1-line task description:** Write a generator-based context manager `temp_state(d, key, value)` that temporarily sets `d[key] = value` inside the `with` block and restores the original value (or removes the key) on exit.
- **function signature proposal:**
  ```python
  from contextlib import contextmanager

  @contextmanager
  def temp_state(d: dict, key, value):
      # your code (yield once)
      ...
  ```
- **test shape:** start with `d = {"a": 1}`. Inside `with temp_state(d, "a", 999): assert d["a"] == 999`. After: `assert d["a"] == 1`. Also test the "key didn't exist before" case: `d = {}; with temp_state(d, "a", 999): assert d["a"] == 999; assert "a" not in d`. And test that the cleanup runs even on exception inside the block.
- **hint sketch:** *"`@contextmanager` turns a generator function into a context manager. The function yields once. Everything before the yield is `__enter__`; everything after is `__exit__`. Use `try/finally` around the yield so the cleanup runs even when the block raises."*

#### Step 4.3 — `kata` — `class Capture` (context manager that records calls)

- **1-line task description:** Implement a `Capture` class as a context manager that records calls into a list. On `__enter__`, return `self`; on `__exit__`, do nothing special. Inside the `with` block, calls to `capture(value)` append to `self.recorded`. Forces the protocol-as-class form after 4.2 made the protocol's behaviour concrete via `@contextmanager`.
- **function signature proposal:**
  ```python
  class Capture:
      def __init__(self):
          self.recorded: list = ...

      def __enter__(self):
          # your code
          ...

      def __exit__(self, exc_type, exc_val, exc_tb):
          # your code
          ...

      def record(self, value):
          # your code
          ...
  ```
- **test shape:** assert that after `with Capture() as c: c.record(1); c.record(2)`, `c.recorded == [1, 2]`. Also assert that the same `Capture` instance can be re-entered (resetting `recorded` or appending — author's choice, default: append).
- **hint sketch:** *"`__enter__` returns what gets bound to `as name`. If you want the block to call methods on the context manager itself, return `self`. `__exit__` is called even if the block raises; for this kata you don't need to handle that, just don't crash. The two methods together are the same `__enter__` / `__exit__` shape `@contextmanager` desugared into in 4.2 — written as a class instead of a generator."*

#### Step 4.4 — `playground` — "`__enter__` / `__exit__` ordering"

- **starter code sketch:**
  ```python
  class Tracer:
      def __init__(self, name):
          self.name = name

      def __enter__(self):
          print(f"enter {self.name}")
          return self

      def __exit__(self, exc_type, exc_val, exc_tb):
          print(f"exit {self.name}, exc_type={exc_type}")
          # return None — let exceptions propagate

  with Tracer("outer") as outer:
      with Tracer("inner") as inner:
          print("inside both")
  ```
- **invite-variation prompts:** "What's the print order if no exception is raised? What changes if you raise an exception inside the inner block? What if the inner `__exit__` returns `True`? What if you put the `with` inside a `try/except`?"
- **instruction note (visible to learner):** "This step prints to the console because it's a playground — the runner shows stdout instead of test verdicts. In `kata` steps the harness captures `print` output so it doesn't drown the assertions; here it's the whole point. If you copy this pattern into a kata and your `print` 'disappears', that's why."
- **data.kind:** `"playground"` (no verdict UI, no test result list, button "Ejecutar")
- **harness:** trivially-true `_t('explored') { _eq True, True }` so the runner is uniform.

---

### Lesson 5 — Decorators + closures

> *What changes in the learner's head:* "A decorator is a function that takes a function and returns a function — and `@d` is sugar for `f = d(f)`. Once I see that, `@property`, `@dataclass`, `@cache`, `@contextmanager` are all the same shape. And closures capture *names*, not values — which is why `[lambda: i for i in range(3)]` doesn't do what I thought."

**Step distribution:** 2 `read` (5.1a + 5.1b), 1 `predict`, 2 `kata` = **5 steps**. *(Originally drafted as 4 with a single dense read; suite voice audit 2026-06-08 measured the draft at ~970 words past the §7 600-word split threshold and applied the planned mitigation: 5.1a carries the mechanics, 5.1b carries the unification + closer.)*

**Status:** stub.

#### Step 5.1 — `read` — "Closures y decorators: la misma idea, dos shapes"

- **why_care topics:** the polyglot will see `@retry`, `@cache`, `@app.route`, `@property` in the first non-trivial Python file. Knowing what's happening = readable code. Not knowing = three Stack Overflow tabs.
- **body topic outline (~400 words):**
  - **Closures recap:** a function that references a variable from its enclosing scope captures that variable's *name binding*, not its current value. In Python this matters because:
    ```python
    fns = [lambda: i for i in range(3)]
    [f() for f in fns]  # => [2, 2, 2], not [0, 1, 2]
    ```
    Each lambda captures the *name* `i`, which by the time the lambdas are called has been bound to `2` (the last iteration). The fix:
    ```python
    fns = [lambda i=i: i for i in range(3)]  # default arg captures value
    ```
    This is **the late-binding closure trap**, the canonical Python-closure surprise.
  - **Back-reference to Lesson 1's `Counter(items=[])` predict.** Same family of bug, different surface. The mechanism behind both is that **function objects are constructed once at `def` time** — defaults are evaluated and bound then (Lesson 1's trap); closure variables are name references *resolved* at call (this lesson's trap). The `def f(x, acc=[])` reuses the same list across calls; the `lambda: i` resolves `i` whenever it runs. Both are consequences of the same evaluation model. Naming the mechanism here closes the loop on the Lesson 1 hook.
  - **What a decorator IS:** a callable that takes a callable and returns a callable. `@d` is *sugar* for `f = d(f)`. Nothing more.
    ```python
    def trace(fn):
        def wrapper(*args, **kwargs):
            print(f"calling {fn.__name__}")
            return fn(*args, **kwargs)
        return wrapper

    @trace
    def add(a, b):
        return a + b
    # Equivalent to: add = trace(add)
    ```
  - **The `functools.wraps` rule:** by default, the wrapper has its own `__name__`, `__doc__`, `__module__`. That breaks introspection (`pytest`, `inspect`, IDE tooltips). The fix:
    ```python
    from functools import wraps

    def trace(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            ...
        return wrapper
    ```
    `@wraps(fn)` copies `fn`'s metadata onto the wrapper. **Every decorator you write in production needs this.** A decorator without `@wraps` is broken — sometimes silently, sometimes loudly.
  - **Single-arg decorator first, parametrised second.** Before the three-layer onion below, the first kata of this lesson (5.3 `@trace`) walks the **single-arg** shape — function in, function out, plus `@wraps`. That's the bridge: write a plain decorator that does one job, then add the parametrisation layer on top. If 5.3 feels solid, 5.4's `@retry(times=N)` is just "wrap 5.3 in another function that takes the arg." If you find yourself confused inside 5.4, the gap is at 5.3, not at three-layer semantics.
  - **Decorators with arguments — the three-layer onion:**
    ```python
    def retry(times):                  # outer: takes the arg
        def decorator(fn):              # middle: takes the function
            @wraps(fn)
            def wrapper(*args, **kw):   # inner: the actual wrapper
                for _ in range(times):
                    try:
                        return fn(*args, **kw)
                    except Exception:
                        continue
                raise
            return wrapper
        return decorator

    @retry(3)
    def flaky():
        ...
    ```
    `@retry(3)` calls `retry(3)`, which returns `decorator`. `decorator` is then applied to `flaky`. Three layers because: outer takes the decorator's arg, middle takes the function, inner is the wrapper that runs at call time. **This trips up every polyglot the first time.** Once you see the shape, every parametrised decorator (`@app.route("/")`, `@pytest.fixture(scope="session")`) is the same pattern.
  - **The unification:** `@property`, `@classmethod`, `@staticmethod`, `@dataclass`, `@cache`, `@contextmanager` are all decorators. Some take a function (`@property`, `@cache`, `@classmethod`); some take a class (`@dataclass`); some take a function and produce a context manager (`@contextmanager`). The shape "callable transforming a callable" covers all of them.
  - **Named-and-deferred:**
    - **`@property` mechanics** = descriptor protocol (`__get__`, `__set__`). Deep-dive in `python-descriptors-and-protocols`.
    - **Class decorators and `__init_subclass__`** = lightweight alternative to metaclasses. Deep-dive in `python-descriptors-and-protocols`.
    - **Async decorators** (`@asyncio.coroutine` in legacy code; modern async decorators that wrap coroutines) = deferred to `python-asyncio-deep` once the event-loop model is on the table.
    - **`functools.lru_cache` invalidation footgun on methods** = caches `self`, prevents GC. Real production issue. Deferred to a future functools-deep scroll.
  - **NOT to include:** what a higher-order function is in functional programming theory / a tour of every `functools` function / the C-level implementation of decorators.

#### Step 5.2 — `predict` — "¿Qué retornan estos tres lambdas?"

- **question:** "What does this print?"
- **snippet:**
  ```python
  fns = [lambda: i for i in range(3)]
  print([f() for f in fns])
  ```
- **options (4):**
  - `a`: `[0, 1, 2]`
  - `b`: `[2, 2, 2]`
  - `c`: `[None, None, None]` (lambdas don't capture)
  - `d`: `[0, 0, 0]` (lambdas capture initial value)
- **correct:** `b`
- **feedback sketch (each option):**
  - **a:** The JS reflex from `let` loop bindings. In JS, `for (let i = 0; i < 3; i++)` creates a new `i` per iteration; in Python, `for i in range(3)` reuses the same `i`. Each lambda captures the *name* `i`, not its value at lambda-creation time. By the time you call them, `i` is `2` (the final iteration value).
  - **b:** Correct. **Late binding.** Python closures capture the *name binding*, not the value. The lambdas all reference the same `i`, which after the loop is `2`. To capture the value at lambda-creation time, use a default argument: `[lambda i=i: i for i in range(3)]`. **This is the canonical Python-closure trap and the reason you see `lambda i=i:` patterns in production code.**
  - **c:** Lambdas DO capture; they capture the enclosing scope's name bindings. The result `[None, None, None]` would require the lambdas to return nothing, which they don't.
  - **d:** Closures capture references, not snapshots. The "capture initial value" model is what `lambda i=i:` simulates explicitly via default-argument evaluation at lambda-creation time.

#### Step 5.3 — `kata` — `@trace` decorator (no args, with `wraps`)

- **1-line task description:** Write a `trace(fn)` decorator that records each call's `(args, kwargs, return_value)` in a list `trace.calls`. Forces both the decorator shape AND `functools.wraps`.
- **function signature proposal:**
  ```python
  from functools import wraps

  def trace(fn):
      # your code — return a wrapper, preserve metadata
      ...
  trace.calls = []

  @trace
  def add(a, b):
      return a + b
  ```
- **test shape:** assert that after `add(1, 2); add(3, 4)`, `trace.calls == [((1, 2), {}, 3), ((3, 4), {}, 7)]`. **Also assert that `add.__name__ == "add"`** — this is the `functools.wraps` test. Without `@wraps`, `add.__name__` is `"wrapper"`.
- **hint sketch:** *"A decorator returns a callable. The callable needs to forward `*args` and `**kwargs` to the original function, record the call, and return the result. To preserve the original function's `__name__` and `__doc__`, the stdlib `functools` module has a decorator that does it."*

#### Step 5.4 — `kata` — `@retry(times=N)` parametrised decorator

- **1-line task description:** Write a `retry(times)` decorator factory that retries the wrapped function up to `times` times on any exception, returning the result of the first success. After `times` failures, re-raise the last exception. Forces the three-layer onion.
- **function signature proposal:**
  ```python
  from functools import wraps

  def retry(times: int):
      # your code — three layers
      ...

  @retry(times=3)
  def flaky(...):
      ...
  ```
- **test shape:** define a function that fails the first two times and succeeds the third; assert `@retry(times=3)` makes it succeed. Define one that fails all three times; assert `@retry(times=3)` re-raises after exhausting. Also assert `flaky.__name__` is preserved (`functools.wraps` test repeated).
- **hint sketch:** *"Three layers. The outer is the function that takes `times`. The middle is what gets applied to the user's function (it's the actual decorator). The inner is the wrapper that runs at call time. Each layer returns the next one. If you wrote it as two layers, you're using `times` from the wrong scope — look at where you reference it."*

**Closer (at the end of 5.4 or as a lesson note):** "What we left for the deep-dives: **the descriptor protocol** behind `@property` (a `@property` is a descriptor; understanding `__get__` / `__set__` / `__delete__` is the asymmetric next step). **Metaclasses and `__init_subclass__`** (the class-of-a-class — Tim Peters' rule: 'if you have to ask, you don't need them'). **Async decorators and the event loop** (`async def`, `await`, `asyncio.run`, `TaskGroup` — all of this needs the event-loop model before the syntax). **`Protocol` typing** (structural typing as Python's TS-style answer to interfaces; mypy/pyright enforce it). You know they exist, roughly what shape they have, and where to find depth — that's enough to read idiomatic Python. When one of them bites you in production, you'll know which deep-dive to open."

**Closer (Java-reflex addendum, added 2026-06-08 per A3 Yui audience review):** "If you're coming from Java and noticed this scroll has no dedicated OOP lesson, that's deliberate, not an omission. Python's class system contributes two things to a polyglot the language doesn't already have: **the protocol surface** (Lesson 1 named the five dunders; Lesson 4 wrote `__enter__` / `__exit__`; this lesson recognises `@property` / `@dataclass` / `@classmethod` as decorators applied to classes) and **the `@dataclass` 'I just want a record' answer** (one decorator, zero boilerplate, get `__init__` / `__repr__` / `__eq__` / typed fields for free). Everything else about classes — inheritance hierarchies, abstract base classes, descriptors, `__slots__`, `__init_subclass__` as the lightweight metaclass alternative — lives in `python-descriptors-and-protocols`. The polyglot reflex that produces `class TaskRunner: def run(self): ...` for a three-line script is the failure mode this scroll most actively defends against (see Lesson 1's anti-class beat). Reach for a class when you have state + behavior that belong together, or when you're implementing a protocol Python expects (a context manager, an iterator, a callable). Reach for a function otherwise. Reach for a `@dataclass` when the answer is 'I want a typed record.' That is the lens; the depth waits."

---

## 5. Sandbox notes

- **Runner:** Piston Python 3.11+ (required for `tomllib` literacy reference in Lesson 0; exception groups available; `Self` typing reference available for the deferred typing-deep scroll).
- **Test harness:** **manual**, defined inline in `testCode`. The harness is a global `_tests` list plus two helpers, mirror of Ruby's `_t` / `_eq` pattern ([ruby/ruby.md §5](../ruby/ruby.md)):
  ```python
  _tests = []

  def _t(name):
      def decorator(fn):
          try:
              fn()
              _tests.append({"name": name, "passed": True})
          except Exception as e:
              _tests.append({"name": name, "passed": False, "message": str(e)})
          return fn
      return decorator

  def _eq(actual, expected):
      assert actual == expected, f"expected {expected!r} but got {actual!r}"
  ```
  Test code uses the harness as:
  ```python
  @_t("tally counts occurrences")
  def _():
      _eq(tally(["a", "b", "a"]), {"a": 2, "b": 1})
  ```
  Final footer emits `__DOJO_RESULT__ <json>` for ExecuteStep to parse. `unittest` and `pytest` are **not** introduced — both belong to the testing-deep scroll. The decorator-as-test shape is itself a small pedagogical bonus: by Lesson 5, the learner has been *reading* decorators in the harness for the whole scroll, so the syntax is familiar by the time they write one.

  **Why this shape over Ruby's `_t(name) do ... end`:** Python doesn't have blocks; the closest equivalent is a function decorator. The `@_t("name")` form reads naturally and forces the test body into a function scope (which prevents accidental name collisions between test bodies). The `def _():` placeholder is intentional — the function name is unused; `@_t("name")` is the load-bearing label.

  **Open question (raised in §7):** is the decorator-as-test shape too clever for a crash scroll's harness? Alternative: bare-function form (`def test_tally_counts(): _eq(...); _record_pass("tally counts")`). The decorator form is more idiomatic Python and matches the "you'll see decorators starting in Lesson 5" trajectory. Default: decorator. Decision pending Nadia (S7) review.

- **Playground harness:** same shape, single decorator-based test `@_t("explored")\ndef _(): _eq(True, True)`. Frontend reads `step.data.kind === "playground"` and hides the verdict UI / test result list / button text changes to "Ejecutar". Backend stays uniform. Contract identical to Ruby's playground.

- **Stdlib only.** No third-party packages. Modules used across the scroll: `collections` (Lesson 2: `Counter`), `contextlib` (Lesson 4: `contextmanager`), `functools` (Lesson 5: `wraps`, optionally `cache` for hint reference). All are stdlib in Python 3.11+.

- **Determinism:** no `time.time()`, no `time.monotonic()`, no `random.random()` without seeding, no `datetime.now()`. The crash scroll avoids any test that needs timing — unlike Ruby Lesson 1's `with_timer` predict, Python's Lesson 5 decorators (`@trace`, `@retry`) don't need wall-clock. If a future kata needs deterministic timing, monkey-patch `time.monotonic` in the test setup (pattern documented in the pre-pivot draft — preserve for reference).

- **STDIN behaviour:** never exercised. All inputs come as function arguments. No `input()` calls.

- **Type hints in starter code:** every starter code block uses modern type hints (`list[int]`, `dict[str, int]`, `int | None` — the PEP 604 union syntax). The polyglot's TS reflex (A4 Felipe) reads them as design tools, not runtime checks. Hints are NOT enforced at runtime in the sandbox (no mypy/pyright running); they exist as documentation and as TS-style design scaffolding.

- **`print` output handling:** the harness suppresses `print` output by default (writes to a buffered StringIO). Lesson 4's playground intentionally prints (the whole point is observing `__enter__` / `__exit__` ordering); the playground harness lets `print` through. Open question (§7): is this routing too implicit? Possible alternative: explicit `_log()` helper instead of `print`.

- **Run timeout:** Piston's default `run_timeout: 3000` ms is comfortable for Python's expected workload — no decorator chains, no recursion-heavy katas. Same caveat as Ruby ([ruby/ruby.md §5](../ruby/ruby.md)) for cascade-of-failures edge cases; lower risk in Python because the harness's exception handling unwinds cleanly per test.

---

## 6. References

Sources cited or drawn from inside this scroll's prose:

- *Fluent Python*, 2nd ed. (Luciano Ramalho) — Chapter 2 (sequences), Chapter 3 (dicts and sets) for Lesson 2; Chapter 9 (decorators and closures) for Lesson 5; Chapter 17 (context managers and else blocks) for Lesson 4. The spine of Lessons 2, 4, 5.
- *Effective Python*, 2nd ed. (Brett Slatkin) — items 13-20 (comprehensions, generators) for Lesson 2; items 38-43 (decorators, closures) for Lesson 5; items 66-69 (`try/except`, context managers) for Lessons 3-4.
- *Python Cookbook*, 3rd ed. (Beazley & Jones) — Chapter 1 (data structures) for Lesson 2 exercise inspiration; Chapter 9 (metaprogramming) for Lesson 5.
- Python docs — <https://docs.python.org/3/reference/datamodel.html> for the dunder protocol references in Lessons 1, 4, 5; <https://docs.python.org/3/library/contextlib.html> for Lesson 4; <https://docs.python.org/3/library/functools.html> for Lesson 5.
- *Robust Python* (Patrick Viafore) — type hints as design tool, reference for Lesson 1's calibration discussion and the deferred typing-deep scroll.
- PEP 8 (style), PEP 20 ("Zen of Python"), PEP 343 (`with` statement, Lesson 4), PEP 318 (decorators, Lesson 5), PEP 484 (type hints, Lesson 1 calibration), PEP 634 (structural pattern matching — named in Lesson 0 as a 3.10+ feature, not taught at depth).
- Python packaging docs — <https://packaging.python.org/> for Lesson 0's `pip` / `venv` / `pyproject.toml` orientation.
- Real Python's "Python's Context Managers" guide — voice reference for Lesson 4's read step shape; we write our own prose but the depth target matches theirs.
- Trey Hunner's blog posts on comprehensions — voice reference for Lesson 2's prose density and hint shape.

---

## 7. Open questions / known gaps

> **Review pass 2026-06-08.** Panel (Nadia S7 + Elif S5 + Valentina S2 + Maya S11) + audience (A1 Mariana + A4 Felipe primary; A3 Yui secondary) reviewed the promoted spec. Items below are tagged **`✓ resolved`** (decision made and applied to the spec), **`◐ partially resolved`** (the spec change landed; one residual question remains for authoring), or **`◯ open`** (still requires a call during W2 authoring).

- **`✓ resolved` — Test harness decorator-vs-bare-function shape.** Decorator-as-test (`@_t("name")\ndef _():`) ratified by Nadia. Rationale: the harness rehearses Lesson 5 syntax across all lessons, so by the time the learner *writes* a decorator in 5.3, they've been *reading* one for the entire scroll. The "decorator before Lesson 5 teaches them" concern is a feature, not a bug — it's the deliberate forward-exposure that Ruby's harness lacks because Ruby has no equivalent surface to rehearse. Risk-if-wrong (rewrite the harness mid-authoring) accepted.

- **`✓ resolved` — Lesson 5 step 5.4 — `@retry(times=N)` vs `@cache_for(seconds=N)`.** `@retry` ratified by Nadia. No clock dependency, cleaner tests, closer to the polyglot's existing reflex (Java's `@Retryable`, JS promise-retry patterns). `@cache_for` carries authoring complexity (monkey-patch `time.monotonic`) for marginal pedagogy gain.

- **`✓ resolved` — Lesson 1 predict's mutable-default-argument trap.** Predict-then-explain pattern ratified by panel; audience review confirmed all three personas understood the trap as a forward reference, not a one-off. The mitigation is applied: Lesson 5 step 5.1's closures recap now carries an explicit back-reference to the Lesson 1 `Counter(items=[])` predict, naming the shared `def`-time-evaluation mechanism behind both traps. A re-stated predict in Lesson 5 was considered and rejected as overkill.

- **`✓ resolved` — Lens candidate alternatives.** Default lens (*"Python the language — protocol surface (dunders + iterables + context managers + decorators) and EAFP, not Django/Flask/pandas/PyTorch."*) confirmed by panel as the right framing. Alternatives 1 (overpromise asyncio) and 2 (underplay EAFP) remain rejected per their original reasoning.

- **`✓ resolved` — Audience: A3 Yui (Java senior) as secondary.** Audience review surfaced load-bearing value (the "class for every script" failure mode the primaries miss); panel was split on whether to retain her absent a Python row in AUDIENCE.md. **Both resolved in one move:** AUDIENCE.md was updated 2026-06-08 to add a Java-reflex / OOP-everywhere row to Yui's Python column, and Lesson 1's read step now carries an anti-class beat, with Lesson 5's closer addressing the "where is the OOP lesson" question directly.

- **`✓ resolved` — `print` output handling in harness.** Implicit routing per `step.data.kind` retained as the default (matches Ruby's contract); Lesson 4's playground instruction now carries a one-line note telling the learner that `print` works because the step is a playground and is suppressed in kata steps. Maya's review-item concern is now in the spec, not in an open question.

- **`✓ resolved` — Total step count: 22.** Lesson 0 has 2 (collapsed from 3 post-audience-review), Lesson 1 has 3, Lesson 2 has 4, Lesson 3 has 4, Lesson 4 has 4, Lesson 5 has **5** (post-suite-audit split — see "Lesson 5 step 5.1 read density risk" below) = **22 steps**. Below Ruby's 25 because Lesson 0 trims to a single read + predict (the three primaries already operate `venv`/`pip` daily) and Lesson 1 stays at 3 (calibration). **At ~100 min target**, well within the 60-120 budget. If post-authoring the time creeps past 110 min, first cuts: Lesson 4's playground (drop to 3 steps) and Lesson 5's `@retry` kata in favour of a shorter `@trace`-with-wraps-only kata. Don't pre-emptively cut.

- **`✓ resolved` — Predict step count: 4 of 22 = 18%.** Slightly above the heuristic's 10-15%. Defensible because Python's surprise surface (mutable defaults, exception syntax, late binding, orientation) genuinely has 4 distinct predict-worthy moments. Mirror of Ruby's 16% defence.

- **`◯ open` — Playground pattern survival across Python.** Both playgrounds (Lesson 2 step 2.4 and Lesson 4 step 4.4) ship in the authoring sprint. Sprint midpoint retro checks engagement signal. If signal holds, the Ruby + Python playgrounds combined (4 total) move the pattern closer to canonical promotion. If signal doesn't hold, drop the variant from Python (no scroll rewrite needed — playground katas are removable without disturbing surrounding lessons).

- **`✓ resolved` — Lesson 5 step 5.1 read density risk.** Suite voice audit 2026-06-08 measured the drafted 5.1 read at **~970 words** — past the 600-word split threshold this item committed to as the action rule. Split applied: **5.1a** (closures recap + L1 back-reference + plain decorator + `@wraps` + single-arg bridge + three-layer onion) carries the mechanics; **5.1b** (the unification with `:figure[tabbed-card]` + named-and-deferred + the Java-reflex closer) carries the reframe. The explicit L4 → L5 bridge sentence the inner spec §3 committed to (*"Remember how `@contextmanager` turned a generator into a context manager?"*) lands at the opener of 5.1b, also resolving the suite-audit gap on that promise. Total scroll step count goes from 21 to 22.

- **`◐ partially resolved` — Lesson 1 step 1.3 kata exposes `@_t(...)` syntax in `testCode` before Lesson 1's read step mentions decorators.** Acceptable per the harness rationale above (it's the deliberate forward-exposure); flag for the Lesson 1 voice audit at draft time. If the polyglot stumbles, the fix is a single line in the kata instruction: *"the `@_t("name")` you see in the test code is the harness's decorator — Lesson 5 explains what `@` does; for now, treat it as a label."*
