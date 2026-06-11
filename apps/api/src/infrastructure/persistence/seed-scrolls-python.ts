// =============================================================================
// Python — scroll seed. The dojo's Python crash course for polyglot developers.
//
// Direction: ADR 022 (crash-course pivot). Slug `python` (was
// `python-for-the-practiced` pre-pivot — the old slug is removed from DB by
// `removeLegacyScrollBySlug` invoked at the tail of `seedAllScrolls` in
// seed-scrolls.ts).
//
// Polyglot-first lesson order (S027 W2 authoring; W3 seeding complete):
//   order 1 — Lesson 0 (Python in context)               — 2 steps (read, predict)
//   order 2 — Lesson 1 (The two syntax surprises)  — 3 steps (read, predict, kata)
//   order 3 — Lesson 2 (Literals + comprehensions)       — 4 steps (read, 2 kata, playground)
//   order 4 — Lesson 3 (EAFP vs LBYL)                     — 4 steps (read, predict, 2 kata)
//   order 5 — Lesson 4 (Context managers)                 — 4 steps (read, 2 kata, playground)
//   order 6 — Lesson 5 (Decorators + closures)            — 5 steps (read+inline, read, predict, 2 kata)
// Total: 22 steps. ~100 min target. Audience: polyglot dev (see AUDIENCE.md).
// Authoring drafts live in docs/courses/curricula/python/lesson-{0..5}.md;
// figures registered in apps/web/src/scrolls/figures/data/python-figures.ts.
//
// Status: draft. isPublic: false. Python execution allows anonymous calls
// (allowlisted at /scrolls/execute alongside sql/typescript/javascript-dom).
//
// Test harness: manual decorator-based `_t("name") def _(): ...` shape per
// the spec's §5 decision (mirror of Ruby's `_t do ... end` pattern adapted
// for Python's lack of blocks). `_eq` helper for equality, `__DOJO_RESULT__`
// JSON footer for ExecuteStep parsing. pytest/unittest deferred to
// python-testing-deep.
// =============================================================================

import { createHash } from 'node:crypto'

function seedUuid(name: string): string {
  const hash = createHash('sha256').update(`dojo-scroll-${name}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-')
}

const COURSE_ID = seedUuid('python')

const LESSON_0_ID = seedUuid('py-l0-context')
const LESSON_1_ID = seedUuid('py-l1-surprises')
const LESSON_2_ID = seedUuid('py-l2-literals')
const LESSON_3_ID = seedUuid('py-l3-eafp')
const LESSON_4_ID = seedUuid('py-l4-context-managers')
const LESSON_5_ID = seedUuid('py-l5-decorators')

const STEP_0_1_ID = seedUuid('py-s0-1-context-and-run')
const STEP_0_2_ID = seedUuid('py-s0-2-predict-install-dance')

const STEP_1_1_ID = seedUuid('py-s1-1-surprises')
const STEP_1_2_ID = seedUuid('py-s1-2-predict-mutable-default')
const STEP_1_3_ID = seedUuid('py-s1-3-kata-counter')

const STEP_2_1_ID = seedUuid('py-s2-1-literals')
const STEP_2_2_ID = seedUuid('py-s2-2-kata-tally')
const STEP_2_3_ID = seedUuid('py-s2-3-kata-flatten')
const STEP_2_4_ID = seedUuid('py-s2-4-playground-comp-vs-gen')

const STEP_3_1_ID = seedUuid('py-s3-1-eafp')
const STEP_3_2_ID = seedUuid('py-s3-2-predict-except-comma')
const STEP_3_3_ID = seedUuid('py-s3-3-kata-safe-get')
const STEP_3_4_ID = seedUuid('py-s3-4-kata-parse-int-or')

const STEP_4_1_ID = seedUuid('py-s4-1-with-protocol')
const STEP_4_2_ID = seedUuid('py-s4-2-kata-temp-state')
const STEP_4_3_ID = seedUuid('py-s4-3-kata-capture')
const STEP_4_4_ID = seedUuid('py-s4-4-playground-tracer')

const STEP_5_1A_ID = seedUuid('py-s5-1a-mechanism')
const STEP_5_1B_ID = seedUuid('py-s5-1b-family')
const STEP_5_2_ID = seedUuid('py-s5-2-predict-late-binding')
const STEP_5_3_ID = seedUuid('py-s5-3-kata-trace')
const STEP_5_4_ID = seedUuid('py-s5-4-kata-retry')

const PY_HARNESS_HEADER = `# ── dojo harness ──────────────────────────────────
_tests = []

def _t(name):
    def decorator(fn):
        try:
            fn()
            _tests.append({'name': name, 'passed': True})
        except Exception as e:
            _tests.append({'name': name, 'passed': False, 'message': str(e)})
        return fn
    return decorator

def _eq(actual, expected):
    assert actual == expected, f"expected {expected!r} but got {actual!r}"
# ──────────────────────────────────────────────────
`

const PY_HARNESS_FOOTER = `
# ── dojo harness footer ───────────────────────────
import json
for r in _tests:
    if r['passed']:
        print('\\u2713 ' + r['name'])
    else:
        print('\\u2717 ' + r['name'] + ': ' + r.get('message', ''))
_ok = all(r['passed'] for r in _tests)
print('__DOJO_RESULT__ ' + json.dumps({'ok': _ok, 'tests': _tests}))
`

export const PYTHON_COURSE_DATA = {
  id: COURSE_ID,
  slug: 'python',
  title: 'Python',
  description:
    'The dojo\'s Python crash course. For developers who already program in another language and need confidence in Python by Friday. The protocol surface (dunders + iterables + context managers + decorators) and EAFP as the cultural reflex, in ~100 minutes. Django, Flask, FastAPI, pandas, numpy, PyTorch are not Python; this scroll teaches the language, not the framework stack.',
  language: 'python',
  accentColor: '#3776AB',
  status: 'draft' as const,
  isPublic: false,
  externalReferences: [
    {
      title: 'Fluent Python, 2nd ed. (Luciano Ramalho)',
      url: 'https://www.fluentpython.com/',
      kind: 'book' as const,
    },
    {
      title: 'Python 3 data model (the dunder bible)',
      url: 'https://docs.python.org/3/reference/datamodel.html',
      kind: 'docs' as const,
    },
    {
      title: 'Effective Python, 2nd ed. (Brett Slatkin)',
      url: 'https://effectivepython.com/',
      kind: 'book' as const,
    },
  ],
}

// =============================================================================
// Lesson 0 — Python in context
// =============================================================================
//
// 2 steps after the 2026-06-08 audience-review collapse (original draft had
// 3 reads; all three primary personas already operate venv/pip in their
// day-to-day, so the second read was tax not pedagogy).

const STEP_0_1 = {
  id: STEP_0_1_ID,
  lessonId: LESSON_0_ID,
  order: 1,
  type: 'read' as const,
  title: 'Python in context: what it’s for, how it actually runs',
  instruction: `## Why this matters

Before you spend ~100 minutes on Python's idioms, you need (1) a one-paragraph "is Python for me, what version, where does it fit and where doesn't it" so you can close the tab if it isn't, and (2) the modern command sequence to run a cloned Python project. Both fit one tight read. If you already operate \`venv\` and \`pip\` daily, the second half is fast — go to the predict and on to Lesson 1.

## Where Python fits, where it doesn’t

Python's load-bearing surfaces in 2026: **scripting and automation** (the universal "small task runner" language — DevOps glue, CI scripts, one-off data transforms), **web backends** (Django, Flask, FastAPI — *named only to exclude from scroll scope*), and **the data science / ML stack** (pandas, numpy, PyTorch — *also named only to exclude*). When teams say "we use Python," they usually mean one of those three plus a long tail of tooling.

Where it doesn't shine: sub-millisecond latency systems, CPU-bound workloads without \`numpy\` / Cython (the GIL bites — Go or Rust win), mobile native, anything where startup time matters (CLI tools with a 200ms cold start feel slow next to Go).

## What version to learn

**Python 3.11+ is the target.** Specifically:

- **3.10 (Oct 2021)** brought structural pattern matching (\`match\` / \`case\`).
- **3.11 (Oct 2022)** brought a measurable 10-60% baseline speedup. Exception groups landed. \`tomllib\` joined the stdlib.
- **3.12 (Oct 2023)** brought cleaner generic syntax (PEP 695).
- **3.13 (Oct 2024)** brought an experimental free-threaded build (no-GIL — feature-flagged, not production default yet).

**Avoid material targeting 3.7 or older.** Significantly different syntax, no \`match\`/\`case\`, no modern typing, slower baseline.

## \`python\` vs \`python3\`

On macOS Big Sur+ and most current Linux distros, plain \`python\` may be absent or point at a system Python you should not touch. **\`python3\` is the safe invocation.** Modern projects assume \`python3\` or pin a version in a \`.python-version\` file (read by \`pyenv\` or \`asdf\`).

## The install dance you’ll actually run

When you clone a Python project that has a \`pyproject.toml\`, the modern incantation is:

\`\`\`sh
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\\Scripts\\activate
pip install -e .
\`\`\`

\`python3 -m venv .venv\` creates an isolated environment in \`./.venv/\`. \`source .venv/bin/activate\` puts that environment's \`python\` and \`pip\` on your shell's \`PATH\` (until you \`deactivate\` or open a new shell). \`pip install -e .\` reads \`pyproject.toml\` and installs the project in **editable mode** — changes to source files are picked up without reinstall.

**Distinct from Ruby's Bundler:** Python's venv *is* an activated shell-level environment — there's state on your \`PATH\` after \`source ... activate\`. Ruby's Bundler isolates per command via \`bundle exec\` instead. Same goal (gems / packages pinned to the project), different shell discipline.

On older projects you'll see \`pip install -r requirements.txt\` — a pre-\`pyproject.toml\` declaration that still works. Many projects have both.

## \`pyproject.toml\`

The modern declaration file (PEP 518 + PEP 621). Replaces \`setup.py\` and (mostly) \`setup.cfg\`. \`[project]\` holds metadata (name, version, dependencies); \`[build-system]\` declares which build backend turns the source into an installable artifact. A clone in 2026 almost certainly has this file.

## The package-manager landscape (one sentence each)

- **\`pip\` + \`venv\`** — stdlib. The baseline you use to read older projects.
- **\`poetry\`** — mature, opinionated, lockfile-based (\`poetry.lock\`). Popular through the late 2010s.
- **\`uv\`** (Astral, 2024) — Rust-fast drop-in \`pip\` replacement, **increasingly preferred for new projects**. Pin \`uv\` if you're starting fresh in 2026 — but expect \`pip\` and \`poetry\` in most codebases you'll inherit.
- **\`conda\`** — scientific-computing default; manages non-Python dependencies (C libraries, CUDA) too.

For a polyglot today: **\`uv\` for new projects, \`pip\` + \`venv\` to read older ones.** That's the whole map.

## Sandbox honesty

This crash course runs **Python 3.11** in the sandbox. That's the modern baseline — \`tomllib\` is stdlib, exception groups work, structural pattern matching works, \`Self\` in type hints works. On your own machine, install 3.11+ via \`pyenv\`, \`asdf\`, or your distro's package manager.

Next: one predict that lands the install dance. After that, syntax.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_0_2 = {
  id: STEP_0_2_ID,
  lessonId: LESSON_0_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: what do you run first?',
  instruction: `Before the syntax lesson, one check on the install model.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question:
      'You cloned a Python project from GitHub. It has a `pyproject.toml` and a README that says "requires Python 3.11+". You want to run it. Which command goes first?',
    snippet: `$ git clone https://github.com/example/python-app.git
$ cd python-app
$ ls
pyproject.toml  README.md  src/  tests/
$ ???`,
    options: [
      { id: 'a', text: '`python src/app.py`' },
      { id: 'b', text: '`pip install -r requirements.txt`' },
      {
        id: 'c',
        text: '`python3 -m venv .venv && source .venv/bin/activate && pip install -e .`',
      },
      { id: 'd', text: '`pip install .`' },
    ],
    correct: 'c',
    feedback: {
      a: 'The "just run it" reflex works in JavaScript because Node has a generous stdlib and trivial projects can run zero-dependency. Almost any real Python project depends on packages declared in `pyproject.toml` — running before installing them throws `ModuleNotFoundError` on the first `import`. The Python install dance is *always*: create an environment, install dependencies, *then* run. `python src/app.py` is the last command, not the first.',
      b: '`requirements.txt` is the older, pre-`pyproject.toml` declaration. Many modern projects have a `pyproject.toml` instead (or both). The clone here has only `pyproject.toml`, so `pip install -r requirements.txt` either errors (file not found) or installs the wrong things. **And even when `requirements.txt` exists, running `pip install` before creating a venv pollutes your global Python.** The 2015 reflex — when `requirements.txt` was universal and people skipped `venv` — is exactly what the modern dance fixes.',
      c: "Correct. The modern Python install dance, in one line: create an isolated virtual environment (`python3 -m venv .venv`), activate it (`source .venv/bin/activate`), then install the project in editable mode (`pip install -e .`) — which reads `pyproject.toml` and installs both the project and its declared dependencies. Editable mode means changes to source files are picked up without reinstall. After this, `python src/app.py` (or whatever the project's entry point is) works.\n\nNext: syntax. Indentation and `self` are the two things that will look weird in the first Python file you open Friday — Lesson 1 lands both in 10 minutes.",
      d: 'Almost. `pip install .` *does* read `pyproject.toml` and install dependencies — but it installs into your **global** Python (or worse, into the system Python, which on macOS triggers a security warning and on Linux pollutes `/usr/lib/python3/dist-packages`). The `venv` step is what keeps your machine clean across projects. **Skip it once, regret it twice.** Also: `pip install .` (without `-e`) installs a *copy* — edits to source files don\'t show up until you reinstall. `pip install -e .` is what every "I\'m working on this project" workflow wants.',
    },
  },
}

const LESSON_0 = {
  id: LESSON_0_ID,
  scrollId: COURSE_ID,
  order: 1,
  title: 'Python in context',
}

// =============================================================================
// Lesson 1 — The two syntax surprises
// =============================================================================
//
// 3 steps (read + predict + kata). The read carries the TS/Java analogue
// table per dunder (added 2026-06-08 audience review for Felipe's TS-bridge
// leverage) and the anti-class beat against the Java OOP-everywhere reflex
// (added same review for Yui's failure mode defense). The predict plants
// the mutable-default trap; Lesson 5.1a closes the loop with the def-time
// evaluation back-reference. The kata's testCode exposes @_t syntax — the
// instruction below carries a one-line note explaining it (the spec §7
// "harness decorator before Lesson 5" partial-resolved item).

const STEP_1_1 = {
  id: STEP_1_1_ID,
  lessonId: LESSON_1_ID,
  order: 1,
  type: 'read' as const,
  title: 'The two things that look weird when you open a Python file',
  instruction: `## Why this matters

You open a Python file on Friday. Two things look weird in the first ten lines: there are no braces, and every method starts with \`self\`. Naming both up front so they don't trip you for the next 90 minutes — and naming the *worse* trap (reaching for a class to write a three-line script) so the Java reflex doesn't define how you write your first Python.

## Surprise 1: indentation is syntax

Python uses indentation to delimit blocks. No \`{}\`, no \`do/end\`, no \`begin/end\`. The block after \`if x:\` begins on the next indented line and ends when the indent goes back.

\`\`\`python
if items:
    process(items)
    notify(items)
else:
    log("empty")
\`\`\`

**An inconsistent indent is a parse error (\`IndentationError\`)** — not a style warning, not a linter suggestion, an error at compile time. PEP 8 says 4 spaces; tabs work but mixing tabs and spaces in the same file is fatal. Every modern editor handles this for you — you only need to know it's syntax, not convention.

*Polyglot reflex named:* if you came from JS / Java / C, your reflex is "whitespace doesn't matter." In Python it does. If you came from Ruby, your reflex is \`do…end\` — Python doesn't have block-terminator keywords; the indent itself is the boundary.

## Surprise 2: \`self\` is the explicit first parameter

When you define an instance method, the receiver is **declared in the signature**:

\`\`\`python
class Counter:
    def __init__(self, start=0):
        self.value = start

    def increment(self):
        self.value += 1
\`\`\`

\`self\` is a *naming convention*, not a keyword — you could literally write \`this\` or \`me\`. But every Python codebase uses \`self\`. And it's *required* — there is no implicit \`this\` like in JS / Java / Ruby. When you call \`counter.increment()\`, Python passes \`counter\` as the first argument. Two more characters per method signature; in return, no "wait, where does \`this\` come from?" confusion ever.

**In TypeScript terms:** this is the \`function foo(this: Type, ...)\` first-parameter trick made mandatory and ubiquitous. **In Java terms:** the receiver Java keeps invisible (\`this\`) is made explicit.

## The \`__dunder__\` surface (named, not earned)

Python's protocol surface lives in **dunder** methods — methods whose names start and end with double underscores. The five you should recognise on sight after this lesson:

- **\`__init__\`** — the constructor. Runs on \`Counter(5)\`.
- **\`__repr__\`** — controls the developer-facing string (what the REPL shows, what \`repr(x)\` returns).
- **\`__iter__\`** — makes an object iterable. \`for x in obj\` calls this.
  *TS analogue:* \`Symbol.iterator\`. *Java analogue:* implementing \`Iterable<T>\`.
- **\`__enter__\` / \`__exit__\`** — make an object a context manager. \`with obj\` calls these.
  *TS analogue:* no native one (closest is the stage-3 \`await using\` proposal). *Java analogue:* \`AutoCloseable\` consumed via \`try-with-resources\`.
- **\`__call__\`** — make an instance callable. \`obj()\` calls this.
  *TS analogue:* the callable-interface trick (\`interface Fn { (x: number): number }\`). *Java analogue:* nothing direct — the closest is \`Function<T, R>.apply\`.

You don't need to memorise the full list (Python has ~80). You need to recognise that \`for\`, \`with\`, \`[]\`, \`()\` all dispatch through dunders — so **"an object IS what its dunders say it is"** is the language's defining bet. Lessons 4 and 5 earn this by *writing* dunders; for now, name-and-recognise is enough.

## Polyglot anti-reflex: do not reach for a class here

Python *has* classes — \`self\` makes that visible. **It does not want them for everything.**

A three-line script that filters a list does not need:

\`\`\`python
# anti-pattern
class TaskRunner:
    def __init__(self, items):
        self.items = items

    def run(self):
        return [x for x in self.items if x > 0]

result = TaskRunner(data).run()
\`\`\`

It needs:

\`\`\`python
# Pythonic
result = [x for x in data if x > 0]
\`\`\`

A Python module that exposes one operation is a module, not a singleton class. **The Java reflex is the failure mode this scroll defends against most actively**: classes are for state + behaviour pairs and protocol-surface implementations (Lesson 4 writes one for \`__enter__\` / \`__exit__\`); functions are for everything else. If you find yourself writing \`class XManager:\` with one method, delete the class and keep the method. *(This is also the reason no lesson in this scroll is "OOP" — Lesson 5's closer addresses the "where is the class lesson?" question directly.)*

## Sandbox honesty

In this scroll, type hints (the \`: int\`, \`-> str\` annotations you'll see in starter code) are used as **design tools, not runtime checks**. Python doesn't enforce hints at runtime — that's \`mypy\` or \`pyright\`'s job, and they live outside the sandbox. If you write \`def add(a: int, b: int) -> int: return a + b\` and call \`add("hi", "bye")\`, you get string concatenation, not a type error. The hints are scaffolding for the human reader (and for Felipe's TS reflex) — not a contract the runtime enforces.

Next: a predict on the most common Python footgun the polyglot hits in their first month.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_1_2 = {
  id: STEP_1_2_ID,
  lessonId: LESSON_1_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: what does this print?',
  instruction: `One predict on default-argument behaviour before the first kata. The mechanism behind this surprise is what Lesson 5's closures recap unpacks — for now, just predict the output.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question:
      "Considering Python's default-argument semantics, what does this snippet print?",
    snippet: `class Counter:
    def __init__(self, items=[]):
        self.items = items

    def add(self, x):
        self.items.append(x)

a = Counter()
a.add(1)
b = Counter()
print(b.items)`,
    options: [
      { id: 'a', text: '`[]` (each instance gets its own empty list)' },
      { id: 'b', text: '`[1]` (the default `[]` is shared between instances)' },
      { id: 'c', text: '`TypeError` (mutable defaults raise at definition time)' },
      { id: 'd', text: '`None` (default is evaluated lazily and returns None)' },
    ],
    correct: 'b',
    feedback: {
      a: 'That\'s the JS / Java / Ruby reflex — "default arguments give each call a fresh value." In Python, the default expression is evaluated **once, at `def` time**, and the resulting object is reused on every call that doesn\'t provide the argument. So `Counter()` and `Counter()` get the *same* `items` list. `a.add(1)` mutates that shared list; `b.items` is the same list, now containing `[1]`.\n\nThe fix is the `None`-sentinel pattern: `def __init__(self, items=None): self.items = items if items is not None else []`. **The mechanism behind this surprise is Python\'s `def`-time evaluation of function objects, which you\'ll meet again in Lesson 5 (closures) — same root cause, different surface.** For now: never use a mutable object as a default argument.',
      b: "Correct, and the surprise is on the right thing. `def __init__(self, items=[])` evaluates `[]` once at class-definition time and binds it as the default value of the `items` parameter. Every `Counter()` call that doesn't provide `items` receives that same list. `a.add(1)` mutates the shared list; `b.items` is the same list.\n\nThe fix: `def __init__(self, items=None): self.items = items if items is not None else []`. Lesson 5 explains *why* Python evaluates defaults at `def` time — it's a consequence of how function objects are constructed, not a bug. The late-binding closure trap (lambdas in a loop) is the same mechanism on a different surface. Hold the surprise; the payoff lands then.",
      c: 'Python does **not** raise on mutable defaults — it just behaves surprisingly. Many linters (`ruff`, `pylint`) flag mutable defaults as a warning, but the interpreter is silent. **The silence is what makes this dangerous** — your test passes once, fails the second run, and you spend an afternoon staring at the code wondering what changed. This is the canonical Python footgun; calling it out by name (and never writing `def f(x=[])` again) is the entire defence.',
      d: "Default values are evaluated at `def` time, not lazily per call. The expression `items=[]` creates a list right then and binds it as the parameter's default; subsequent calls reuse it. There's no laziness here — laziness would actually *prevent* this bug, because each call would re-evaluate `[]` and get a fresh empty list. Python's eager evaluation of defaults is the root of the trap.",
    },
  },
}

const STEP_1_3 = {
  id: STEP_1_3_ID,
  lessonId: LESSON_1_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Build a Counter class with __init__ and __repr__',
  instruction: `## Your task

Build a small \`Counter\` class. The job is to land three facts at once: (1) how a Python class is defined, (2) how \`__init__\` reads, and (3) how \`__repr__\` lets you control what the REPL prints.

Implement:

- \`Counter(start=0)\` — constructs a counter whose initial value is \`start\` (default \`0\`).
- \`repr(counter)\` — returns the string \`"Counter(value=N)"\` where \`N\` is the counter's current value.

Use an **f-string** for \`__repr__\` — they're the modern way to interpolate in Python. You'll meet them at depth in Lesson 2.

### About the test code below

The test code uses \`@_t("name")\` to label each assertion. That \`@\` is a **decorator** — Lesson 5 explains what \`@\` does and how to write one. For now, just treat \`@_t("name")\` as a label: it runs the function below it, catches any exception, and records whether the test passed. You don't need to understand the syntax to read what the test asserts.

### What's expected

\`\`\`python
c = Counter()
repr(c)               # "Counter(value=0)"

c = Counter(5)
repr(c)               # "Counter(value=5)"
\`\`\``,
  starterCode: `class Counter:
    def __init__(self, start: int = 0):
        # your code
        ...

    def __repr__(self) -> str:
        # your code
        ...
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

@_t("Counter() defaults to value=0")
def _():
    _eq(repr(Counter()), "Counter(value=0)")


@_t("Counter(5) reflects the passed value")
def _():
    _eq(repr(Counter(5)), "Counter(value=5)")


@_t("Counter(0) is explicit zero")
def _():
    _eq(repr(Counter(0)), "Counter(value=0)")
${PY_HARNESS_FOOTER}`,
  hint: 'Two things to land:\n\n1. **In `__init__`**, store the `start` value somewhere on the instance so `__repr__` can read it later. The convention is to assign it to an attribute of `self` — pick a name that reads cleanly when the constructor and the repr both refer to it.\n\n2. **In `__repr__`**, return a string in the form `"Counter(value=N)"` where `N` is whatever you stored in step 1. The string includes a literal value — the actual number, not a placeholder. Python has a modern interpolation syntax that lets you embed an expression directly inside a string with a prefix character. Use that.\n\n`__repr__` is what gets called when you `repr(obj)` or when the Python REPL prints an unassigned expression. It should return a string that ideally looks like the constructor call — so a future reader sees `Counter(value=5)` in the logs and immediately knows how to reproduce.',
  solution: `class Counter:
    def __init__(self, start: int = 0):
        self.value = start

    def __repr__(self) -> str:
        return f"Counter(value={self.value})"`,
  alternativeApproach: `Once you've built \`__init__\` + \`__repr__\` by hand, you've seen the dunder shape — and you've also seen the boilerplate Python's \`@dataclass\` decorator removes for you. The same \`Counter\` written with \`@dataclass\`:

\`\`\`python
from dataclasses import dataclass

@dataclass
class Counter:
    value: int = 0
\`\`\`

That single decorator generates \`__init__(self, value: int = 0)\`, \`__repr__\` returning \`"Counter(value=N)"\`, and \`__eq__\` comparing field-by-field. For "I just want a typed record" classes, \`@dataclass\` is the right reach — Lesson 5's tabbed-card figure on the decorator family lands this point in context, alongside \`@property\`, \`@cache\`, and \`@contextmanager\`. The hand-rolled form earns its place here because seeing the dunders explicitly is what makes \`@dataclass\` legible as "the same thing, automated" later.`,
}

const LESSON_1 = {
  id: LESSON_1_ID,
  scrollId: COURSE_ID,
  order: 2,
  title: 'The two syntax surprises',
}

// =============================================================================
// Lesson 2 — Literals and comprehensions you'll actually read
// =============================================================================
//
// 4 steps (read + 2 kata + playground). The read embeds the array-track
// figure (situational per the figures menu — earns embedding because the
// playground at 2.4 makes the eager-vs-lazy distinction concrete after the
// figure makes it visible at a glance). The flatten kata uses the one-deep
// nested comprehension shape the 2.1 read step excused explicitly.

const STEP_2_1 = {
  id: STEP_2_1_ID,
  lessonId: LESSON_2_ID,
  order: 1,
  type: 'read' as const,
  title: 'Five literals you’ll read all day',
  instruction: `## Why this matters

Open any non-trivial Python file Friday and you'll see five literal shapes in the first hundred lines: comprehensions (list, dict, set), generator expressions, f-strings, slicing, unpacking. Knowing them on sight = readable code. Not knowing them = three Stack Overflow tabs per function. This lesson lands all five, then the katas force you to write the two that have the most pedagogical weight (\`tally\` for choosing between idioms, \`flatten\` for nested-comprehension shape).

## List comprehension

\`\`\`python
squares = [x * x for x in range(10)]
evens   = [x for x in xs if x % 2 == 0]
\`\`\`

Reads as "the list of \`expr\` for each \`x\` in \`xs\` (where \`p(x)\`)." Replaces \`xs.map(...)\` and \`xs.map(...).filter(...)\` from JS reflex. **One level of nesting is OK** — \`[item for sublist in nested for item in sublist]\` reads left-to-right as the equivalent nested \`for\` loops, and it lands cleanly for the polyglot at one depth (exactly the shape Lesson 2's \`flatten\` kata uses). **Two levels is a code smell, three is wrong** — at that point use named intermediate variables or a \`for\` loop, the polyglot you're sending the PR to will thank you.

## Dict and set comprehensions

\`\`\`python
by_upper = {k.upper(): v for k, v in d.items()}    # dict comprehension
unique   = {x.lower() for x in names}              # set comprehension
\`\`\`

Same shape, different output container. Dict comprehensions pair with \`dict.items()\` constantly — that's how you transform a dict's keys or values in one line.

## Generator expression — same shape, lazy

\`\`\`python
total   = sum(x * x for x in range(1_000_000))
peek    = next(line for line in file if line.startswith("ERROR"))
\`\`\`

Same syntax as the list comprehension but with **parens** instead of square brackets. **Lazy** — produces values on demand, doesn't materialise the whole sequence. Pass to \`sum\`, \`max\`, \`min\`, \`any\`, \`all\`, \`next\`, or any function that iterates once. The parens are optional when the generator is the sole argument to a function: \`sum(x * x for x in xs)\` works without an extra \`()\`.

The cost: a generator can only be consumed **once**. After \`next(gen)\` exhausts it, you can't iterate again. If you need to iterate twice, you wanted a list.

:figure[array-track]{id="comp-vs-filter-vs-gen"}

The figure above is the same input under three shapes: list comprehension materialises the doubled values eagerly; the filter version drops the cells the predicate rejects (marked \`✕\`); the generator expression produces the same logical result as the list but lazily — \`list(...)\` is what materialises it. **The eager-vs-lazy distinction is the one the playground at the end of this lesson explores; the figure here makes it visible in a glance.**

Lazy is not a style preference — it's a memory budget. The same million results, measured:

:figure[metric-pair]{id="list-vs-gen-memory"}

## f-strings

\`\`\`python
msg   = f"hello {name}, you have {count} messages"
price = f"{value:.2f}"            # format spec — two decimals
debug = f"{x=}"                   # debug form — prints "x=42"
\`\`\`

Modern way to interpolate. Expressions inside \`{}\`, format specs after \`:\`, the \`=\` debug form is gold for prints. **The polyglot's reflex from JS template literals (\`\` \`\${name}\` \`\`) transfers cleanly** — same idea, different sigil. **No \`%\`-formatting, no \`.format()\` taught here:** they're legacy, f-strings are the modern default, every later read step in this scroll uses them.

## Slicing recap

\`\`\`python
xs[1:5]      # indices 1..4
xs[::-1]     # reversed
xs[::2]      # every other
xs[:-1]      # all but last
\`\`\`

You likely know this from JS. Named here once so the katas don't surprise.

## Unpacking

\`\`\`python
first, *rest = [1, 2, 3, 4]      # rest = [2, 3, 4]
a, *_, last  = "hello"            # a='h', last='o', middle ignored
merged       = {**defaults, **overrides}    # dict merge
def f(*args, **kwargs): ...                  # collect into positional / keyword
\`\`\`

Argument unpacking (\`*args\`, \`**kwargs\`) is how Python functions receive variable arguments. Dict unpacking (\`{**d1, **d2}\`) merges. The starred-target pattern (\`first, *rest = xs\`) is the destructuring equivalent of JS's \`const [first, ...rest] = xs\`.

Next: two katas. \`tally\` is small but forces an idiom choice (manual dict comp vs stdlib \`Counter\`). \`flatten\` is the nested-comprehension shape — the one-deep nesting the rule above excuses. Then a playground for lazy-vs-eager exploration.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_2_2 = {
  id: STEP_2_2_ID,
  lessonId: LESSON_2_ID,
  order: 2,
  type: 'kata' as const,
  title: 'Build a tally function — choose your idiom',
  instruction: `## Your task

Given a list of strings, return a dict mapping each unique string to the number of times it appears.

**Two solutions are idiomatic:**

1. A **dict comprehension** over the unique words, using \`list.count\` for each — the "do it with what you just learned" answer.
2. **\`collections.Counter\`** from the stdlib — the "use the right tool" answer.

Both pass the tests. Pick the one whose Pythonic-ness you can defend out loud in a code review. The hint nudges if you're stuck.

### What's expected

\`\`\`python
tally(["hi", "bye", "hi"])    # {"hi": 2, "bye": 1}
tally([])                     # {}
tally(["a"])                  # {"a": 1}
\`\`\``,
  starterCode: `def tally(words: list[str]) -> dict[str, int]:
    # your code
    ...
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

@_t("counts duplicates correctly")
def _():
    _eq(tally(["hi", "bye", "hi"]), {"hi": 2, "bye": 1})


@_t("empty input returns empty dict")
def _():
    _eq(tally([]), {})


@_t("single word maps to count 1")
def _():
    _eq(tally(["a"]), {"a": 1})


@_t("preserves all unique keys")
def _():
    result = tally(["a", "b", "c", "a", "b", "a"])
    _eq(result, {"a": 3, "b": 2, "c": 1})
${PY_HARNESS_FOOTER}`,
  hint: "Two paths:\n\n1. **Stdlib path.** There's a module in Python's standard library specifically designed for counting hashable things. It lives in the `collections` module. Look at what its constructor accepts — it takes an iterable and returns the counted dict-like object directly. One line.\n\n2. **Comprehension path.** You can build the dict yourself with a comprehension. The trick: iterate over the **unique** words (turn the list into a set first), and for each unique word, use a list method that returns how many times an element appears. The shape is `{word: <count of word in words> for word in <unique words>}`.\n\nBoth are correct. The first is what a senior Pythonista would write; the second is what someone who just learned comprehensions would write and what your reviewer will gently rewrite during PR review.",
  solution: `from collections import Counter

def tally(words: list[str]) -> dict[str, int]:
    return dict(Counter(words))`,
  alternativeApproach: `The comprehension shape works and is worth seeing once:

\`\`\`python
def tally(words: list[str]) -> dict[str, int]:
    return {w: words.count(w) for w in set(words)}
\`\`\`

It's O(n²) — \`words.count(w)\` scans the whole list for each unique word — so a real reviewer prefers \`Counter\` (single pass, hash-based). The lesson here is that comprehension-as-default is right *until* a stdlib type is purpose-built for the job. \`Counter\` is one of those types; reach for it whenever the question is "how many of each."`,
}

const STEP_2_3 = {
  id: STEP_2_3_ID,
  lessonId: LESSON_2_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Flatten a list of lists',
  instruction: `## Your task

Given a list of lists of integers, return a single flat list containing every integer in order.

\`\`\`python
flatten([[1, 2], [3], [4, 5]])    # [1, 2, 3, 4, 5]
flatten([])                       # []
flatten([[]])                     # []
\`\`\`

**The idiomatic answer is a one-deep nested comprehension.** The 2.1 read step named the rule: one level of nesting reads cleanly left-to-right; two is a code smell. This is the one-level case the rule excuses.

If you find yourself reaching for \`sum(nested, [])\` or \`functools.reduce(...)\`, stop. The comprehension shape is what a Python reviewer expects and what the next reader will understand fastest. (\`itertools.chain.from_iterable\` is also acceptable and arguably more idiomatic at scale; it does not appear in the hint because the comprehension is the lesson.)`,
  starterCode: `def flatten(nested: list[list[int]]) -> list[int]:
    # your code
    ...
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

@_t("flattens a typical nested list")
def _():
    _eq(flatten([[1, 2], [3], [4, 5]]), [1, 2, 3, 4, 5])


@_t("empty outer list returns empty list")
def _():
    _eq(flatten([]), [])


@_t("list of empties returns empty list")
def _():
    _eq(flatten([[]]), [])


@_t("preserves order across sublists")
def _():
    _eq(flatten([[3, 1], [2], [4]]), [3, 1, 2, 4])


@_t("handles a single-element list of one sublist")
def _():
    _eq(flatten([[42]]), [42])
${PY_HARNESS_FOOTER}`,
  hint: "Nested comprehensions read **left-to-right in the order you'd write the nested `for` loops**. The first `for` clause is the outer loop; the second is the inner loop.\n\nTry the shape `[? for ? in nested for ? in ?]` and figure out what to put in each blank:\n\n- What are you iterating *over* in the outer loop? (The thing the parameter holds.)\n- What's the inner loop iterating over? (Each element of the outer loop.)\n- What do you want in the result list? (Each element of the inner loop.)\n\nIf the result is `[]`, you've put the loops in the wrong order or used the wrong variable in the output position.",
  solution: `def flatten(nested: list[list[int]]) -> list[int]:
    return [item for sublist in nested for item in sublist]`,
  alternativeApproach: `For \`flatten\` at scale or when you want a generator (lazy, no intermediate list), \`itertools.chain.from_iterable\` is the senior Python answer:

\`\`\`python
from itertools import chain

def flatten(nested: list[list[int]]) -> list[int]:
    return list(chain.from_iterable(nested))
\`\`\`

\`chain.from_iterable\` returns an iterator that yields elements from each sublist in turn — no comprehension, no materialising intermediate lists. For large \`nested\` inputs it has a measurable memory win over the comprehension form. The reason this scroll teaches the comprehension first: \`itertools\` literacy is its own surface area (\`chain\`, \`groupby\`, \`accumulate\`, \`pairwise\`, \`takewhile\`) and earning it deserves a dedicated lesson — the deferred \`python-iterators-and-generators\` deep-dive.`,
}

const STEP_2_4 = {
  id: STEP_2_4_ID,
  lessonId: LESSON_2_ID,
  order: 4,
  type: 'kata' as const,
  title: 'Playground: comprehension vs generator expression',
  instruction: `## Play around

This step is a **playground**, not a kata. There's no verdict to pass — there's a runner button that executes whatever you write and shows the output. The harness runs a trivially-true assertion so the backend stays uniform, but the focus is on your output, not on a green checkmark.

The starter code below sets up the same logic in three shapes: a list comprehension (eager), a generator expression (lazy), and a second iteration over the generator. Run it as-is first to see what each prints, then change the input and see what breaks.

Specific things worth trying:

- What is the **type** of each (\`type(list_comp)\`, \`type(gen_exp)\`) and what does that tell you about the API surface?
- What happens when you call \`next(gen_exp)\` once? Twice? After exhaustion?
- What does \`list(gen_exp)\` return the **first** time? The **second** time?
- Reproduce the lesson's numbers: \`import sys\`, then compare \`sys.getsizeof([x * 2 for x in range(1_000_000)])\` against \`sys.getsizeof(x * 2 for x in range(1_000_000))\`. Don't take the figure's word for it.
- When would you reach for a generator over a list comprehension in real code? (Hint: memory, or a stream you can't materialise.)

This step prints to the console because it's a playground — the runner shows stdout instead of test verdicts. In \`kata\` steps the harness captures \`print\` output so it doesn't drown the assertions; here it's the whole point. If you copy this pattern into a kata and your \`print\` "disappears", that's why.`,
  starterCode: `xs = range(5)

# Same logic, two different shapes:
list_comp = [x ** 2 for x in xs]
gen_exp   = (x ** 2 for x in xs)

print("list_comp:", list_comp)
print("type(list_comp):", type(list_comp).__name__)

print("gen_exp:", gen_exp)
print("type(gen_exp):", type(gen_exp).__name__)

# Try this:
print("first materialisation:", list(gen_exp))
print("second materialisation:", list(gen_exp))
`,
  testCode: `${PY_HARNESS_HEADER}
@_t("explored")
def _():
    _eq(True, True)
${PY_HARNESS_FOOTER}`,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: { kind: 'playground' as const },
}

const LESSON_2 = {
  id: LESSON_2_ID,
  scrollId: COURSE_ID,
  order: 3,
  title: "Literals and comprehensions you'll actually read",
}

// =============================================================================
// Lesson 3 — EAFP vs LBYL — the Pythonic reflex
// =============================================================================
//
// 4 steps (read + predict + 2 kata). The read embeds the MANDATORY
// disambiguation figure per S027 sprint contract — EAFP vs LBYL with
// "Intent" as the divergent attribute. The safe_get kata includes a
// tally-shaped retrieval-interleaving test (suite voice audit 2026-06-08
// fix; the same dict shape Lesson 2's tally produces).

const STEP_3_1 = {
  id: STEP_3_1_ID,
  lessonId: LESSON_3_ID,
  order: 1,
  type: 'read' as const,
  title: 'The Pythonic reflex: try the operation',
  instruction: `## Why this matters

EAFP — *"Easier to Ask Forgiveness than Permission"* — is the cultural reflex that determines whether you write Python that reads Pythonic or Python that reads Java-with-different-syntax. A polyglot writing Python with Java reflexes writes \`if hasattr(x, "value"): return x.value\` everywhere; the Pythonic answer is \`try: return x.value except AttributeError: return default\`. Same outcome, opposite intent. **Get this lesson wrong and the rest of your Python reads Java-with-different-syntax**; get it right and the patterns the next two lessons teach (\`with\`, decorators) compose cleanly on top of the same try-and-catch reflex.

## The two reflexes

**EAFP — Easier to Ask Forgiveness than Permission.** Try the operation. Catch the specific exception if it fails. This is the cultural default in Python — \`try\` is **not** the escape hatch it is in Java; it's the *primary* control-flow shape for "this might not work."

**LBYL — Look Before You Leap.** Check preconditions first; then do the operation. This is the cultural default in C, Java, Go.

:figure[disambiguation]{id="eafp-vs-lbyl"}

The figure above shows the two reflexes on the same skeleton — same shape on the page, opposite intent. **Intent** is the single divergent attribute the polyglot has to internalise: every other difference (race-safety, common-case cost, what the reader infers about your familiarity with the language) cascades from that one decision.

## Why EAFP in Python specifically

Three reasons, in order of importance:

1. **Duck typing.** Python doesn't enforce nominal interfaces at the type system — an object behaves like a duck if it quacks. The only honest test is to try the quack and see what happens. \`if hasattr(x, "read"):\` is a weak claim about the object (the attribute might not be callable, might raise, might lie); \`try: x.read()\` is the actual test.
2. **Performance in the common case.** In CPython, an exception **not raised** is cheap (≈50 ns). An exception **raised** has cost (≈10 μs), but if your common case is "no exception," EAFP is faster than LBYL because LBYL does the check AND the operation, while EAFP does only the operation.
3. **Race conditions.** \`if os.path.exists(p): open(p)\` has a race window — the file can be deleted between the check and the open. \`try: open(p) except FileNotFoundError:\` doesn't. The check-then-act pattern is **structurally** unsafe in any concurrent context; EAFP eliminates the window.

## \`try / except / else / finally\` — the full shape

\`\`\`python
try:
    result = do_thing()
except SpecificError as e:
    handle(e)
else:
    # runs only if the try block did NOT raise
    post_process(result)
finally:
    # runs always — exception or not, return or not
    cleanup()
\`\`\`

The \`else\` clause is the part most polyglots have never seen. It runs if the \`try\` block did not raise. Useful for **separating "the operation succeeded" from "do the operation"** — keeping the \`try\` block as small as possible (only the line that might raise) and putting the success path in \`else\`. This is a real discipline difference; \`try: x = parse(); use(x) except ValueError: ...\` accidentally catches a \`ValueError\` from \`use(x)\` too. \`try: x = parse() except ValueError: ... else: use(x)\` doesn't.

## When LBYL is correct

Not always wrong. Three cases:

- **Cheap check, common no-op case.** \`if not items: return\` before iterating is cheaper than catching nothing (which doesn't exist anyway). Trivial guards are LBYL by nature.
- **No race risk.** Checking a constant, a local variable, or your own data structure is fine.
- **Avoiding "exception as control flow for the dominant case."** If 95% of calls raise the same exception, your "exception" is actually the normal case — restructure. EAFP assumes the common case is *not* the exception path.

## The footgun: EAFP misused as LBYL-in-a-try

\`\`\`python
# anti-pattern
try:
    if hasattr(x, "foo"):
        y = x.foo
except AttributeError:
    y = None
\`\`\`

That's not EAFP — that's LBYL with extra steps. EAFP is "try **the operation that's the actual work**," not "try a check disguised as an operation." The Pythonic shape is:

\`\`\`python
try:
    y = x.foo
except AttributeError:
    y = None
\`\`\`

If you find a \`try\` block that contains a \`hasattr\` / \`in\` / \`is not None\` check, you wrote LBYL in a \`try\`. Strip the check; the \`try\` does the work.

Next: a predict on a syntactic trap that bites every polyglot who learned Python before 3.0. Then two katas — \`safe_get\` (which forces the LBYL-vs-EAFP-vs-\`dict.get\` choice) and \`parse_int_or\` (the dominant EAFP shape with a specific exception type).`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_3_2 = {
  id: STEP_3_2_ID,
  lessonId: LESSON_3_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: what does this syntax do?',
  instruction: `One predict on \`except\`-clause syntax before the katas. The trap here is real legacy code you'll see in old tutorials and pre-2010 codebases.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'What does this code do in Python 3?',
    snippet: `try:
    x = parse(data)
except ValueError, KeyError:
    x = None`,
    options: [
      {
        id: 'a',
        text: 'Catches both `ValueError` and `KeyError`, sets `x = None` on either',
      },
      {
        id: 'b',
        text: 'Catches only `ValueError`, binds the exception to a variable named `KeyError`',
      },
      {
        id: 'c',
        text: '`SyntaxError` — modern Python requires `except (ValueError, KeyError):` with parens',
      },
      {
        id: 'd',
        text: 'Catches `ValueError`, binds the exception to `KeyError`, then catches `KeyError` separately',
      },
    ],
    correct: 'c',
    feedback: {
      a: "The intent reads that way, and it's what you'd want in production code. But the syntax is wrong in Python 3 — you'd need parens: `except (ValueError, KeyError):`. Without parens, in Python 2 this meant \"catch `ValueError`, bind it to a variable named `KeyError`\" — wildly different from the comma-as-tuple reading. Python 3 made the parenless form a hard `SyntaxError` exactly so this ambiguity stops biting.",
      b: 'That was the Python 2 meaning of the syntax — ambiguous and surprising enough that Python 3 rejected it at parse time. **You won\'t see this run** in Python 3; you\'ll see `SyntaxError`. The correct binding form in Python 3 is `except ValueError as e:` (`as` instead of `,`).',
      c: "Correct. Python 3 made this a `SyntaxError` to remove the Python 2 ambiguity once and for all. The two modern forms are:\n\n- `except (ValueError, KeyError):` — multi-exception catch (tuple of exception types).\n- `except ValueError as e:` — single catch with the exception bound to a variable.\n\nIf you see the bare-comma form in a tutorial or a codebase, you're reading Python 2. Update or distrust the source.",
      d: "Python doesn't chain `except` clauses with commas. Each `except` is its own clause, on its own line. Multi-exception catch requires the tuple-with-parens form (`except (ValueError, KeyError):`).",
    },
  },
}

const STEP_3_3 = {
  id: STEP_3_3_ID,
  lessonId: LESSON_3_ID,
  order: 3,
  type: 'kata' as const,
  title: 'safe_get — handle a missing key without LBYL',
  instruction: `## Your task

Build \`safe_get(d, key, default=None)\` that returns \`d[key]\` if the key exists, else returns \`default\`.

**Three solutions are correct.** The lesson is in noticing why one is best:

1. **EAFP shape.** \`try: return d[key] except KeyError: return default\`. Lands the cultural reflex.
2. **\`dict.get(key, default)\`.** One-liner. The right answer when the operation IS the missing-key check.
3. **LBYL shape.** \`if key in d: return d[key] else: return default\`. **Works.** **Has a race window in concurrent contexts** (another thread can delete the key between the check and the read). For a single-threaded function it's fine; the discipline reason to avoid it is that the polyglot who writes LBYL here writes LBYL everywhere, including where it bites.

### The \`None\`-vs-missing trap

What about \`safe_get({"a": None}, "a", default="missing")\`? The key \`"a"\` **exists**; its value is \`None\`. The function should return \`None\` (the actual value), not \`"missing"\` (the default for a missing key).

A solution that does \`return d.get(key) or default\` fails this test — \`None or default\` evaluates to \`default\`. **\`None\` is a legitimate value, not absence.** The fix: use \`d.get(key, default)\` (which only falls back on missing key) or the EAFP shape (which only catches \`KeyError\`).

### What's expected

\`\`\`python
safe_get({"a": 1}, "a")                         # 1
safe_get({"a": 1}, "b")                         # None  (default default)
safe_get({"a": 1}, "b", default="missing")      # "missing"
safe_get({"a": None}, "a", default="missing")   # None  (value IS None, not missing)
\`\`\`

### Realistic input — the \`tally\`-shaped dict

One of the tests below uses a dict shaped like \`{"a": 2, "b": 1}\` — **exactly the output shape your \`tally\` function from Lesson 2 produced.** That's not coincidence: \`safe_get\` over a count dictionary is a common production shape (look up a word's count; return \`0\` if the word never appeared). The retrieval interleaving is deliberate — the lesson-2 muscle compounds here, and you'll see this dict shape again in Lesson 5's decorator wrappers.`,
  starterCode: `def safe_get(d: dict, key, default=None):
    # your code
    ...
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

@_t("returns the value when key exists")
def _():
    _eq(safe_get({"a": 1}, "a"), 1)


@_t("returns default None when key is missing")
def _():
    _eq(safe_get({"a": 1}, "b"), None)


@_t("returns explicit default when key is missing")
def _():
    _eq(safe_get({"a": 1}, "b", default="missing"), "missing")


@_t("None value is returned as None — NOT replaced by default")
def _():
    _eq(safe_get({"a": None}, "a", default="missing"), None)


@_t("empty dict + any key returns default")
def _():
    _eq(safe_get({}, "anything", default=42), 42)


@_t("works over a tally-shaped count dict (Lesson 2 callback)")
def _():
    # Same shape \`tally(["a", "b", "a"])\` produced in Lesson 2.
    counts = {"a": 2, "b": 1}
    _eq(safe_get(counts, "a", default=0), 2)
    _eq(safe_get(counts, "missing", default=0), 0)
${PY_HARNESS_FOOTER}`,
  hint: "Two paths land all six tests cleanly:\n\n1. **EAFP shape.** `try` the dictionary access; `except` the **specific** exception type Python raises when a dict key is missing. Return the default in the `except` branch. The `None`-vs-missing test passes for free because `KeyError` is only raised when the key isn't there — not when the value is `None`.\n\n2. **`dict.get(key, default)` shape.** Dicts have a built-in method that does exactly this: returns the value if the key exists, else the second argument. **Not the same as `dict[key] or default`** — `or` falls back on any falsy value (including `None` and `0`), which breaks the `None`-vs-missing test.\n\nWhat to avoid: `if key in d: return d[key] else: return default` (LBYL — works but trains the wrong reflex). `return d.get(key) or default` (fails the `None` test).",
  solution: `def safe_get(d: dict, key, default=None):
    return d.get(key, default)`,
  alternativeApproach: `The explicit EAFP form is also correct, and worth seeing once because it's what \`dict.get\` desugars to under the hood:

\`\`\`python
def safe_get(d: dict, key, default=None):
    try:
        return d[key]
    except KeyError:
        return default
\`\`\`

For a single dict lookup, \`dict.get\` is the senior answer — same behaviour, one line, no \`try\` block. For an operation that's *not* a built-in convenience method (parsing a string, opening a file, hitting an attribute that may not exist), the explicit \`try / except\` shape is what you reach for. The discipline transfers; the syntax is per-case.`,
}

const STEP_3_4 = {
  id: STEP_3_4_ID,
  lessonId: LESSON_3_ID,
  order: 4,
  type: 'kata' as const,
  title: 'parse_int_or — dominant EAFP shape with a specific exception',
  instruction: `## Your task

Build \`parse_int_or(s, default)\` that returns \`int(s)\` if \`s\` parses as an integer, else returns \`default\`.

This is the **EAFP shape in its purest form**: the \`try\` block does the work; the \`except\` clause catches the specific exception type Python raises on failure; nothing else. No \`hasattr\`, no \`isdigit\` check, no regex pre-validation. Try, catch, return.

### What's expected

\`\`\`python
parse_int_or("42", 0)        # 42
parse_int_or("nope", 0)      # 0
parse_int_or("", -1)         # -1
parse_int_or("3.14", 0)      # 0   ← int() doesn't parse floats from strings
parse_int_or("  7  ", 0)     # 7   ← int() strips whitespace
parse_int_or("-5", 0)        # -5  ← negative ints parse fine
\`\`\`

### Why a specific exception

The temptation is \`except:\` (bare except). **Don't.** A bare \`except\` catches \`KeyboardInterrupt\` (user hits Ctrl-C), \`SystemExit\` (the interpreter shutting down), and \`GeneratorExit\` (a generator being closed) — none of which you want to swallow. Catch the **specific** exception type \`int()\` raises when a string isn't a valid integer.

If you're not sure which exception type that is, try \`int("nope")\` in a REPL and read the error class name. (The hint nudges if needed.)`,
  starterCode: `def parse_int_or(s: str, default: int) -> int:
    # your code
    ...
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

@_t("parses a valid integer string")
def _():
    _eq(parse_int_or("42", 0), 42)


@_t("returns default on non-numeric string")
def _():
    _eq(parse_int_or("nope", 0), 0)


@_t("returns default on empty string")
def _():
    _eq(parse_int_or("", -1), -1)


@_t("returns default on float-shaped string")
def _():
    # int() doesn't parse "3.14" — it raises ValueError, not 3
    _eq(parse_int_or("3.14", 0), 0)


@_t("handles leading/trailing whitespace")
def _():
    _eq(parse_int_or("  7  ", 0), 7)


@_t("handles negative integers")
def _():
    _eq(parse_int_or("-5", 0), -5)
${PY_HARNESS_FOOTER}`,
  hint: "The shape is three lines:\n\n```\ntry:\n    return <int conversion of s>\nexcept <specific exception>:\n    return default\n```\n\nTo find the specific exception type:\n\n- `int()` raises a specific exception when the string isn't a valid integer.\n- The exception name describes the problem: it's not about *type* (the input IS a string), it's about *value* — the string's value isn't a parseable integer.\n- The class name follows that pattern.\n\nWhat to avoid: `except:` (catches too much, including Ctrl-C); `except Exception:` (still too broad — masks bugs in the calling code); `isdigit()`-based LBYL (fails on negative numbers, fails on whitespace-padded input, and is exactly the LBYL anti-pattern Lesson 3.1 named).",
  solution: `def parse_int_or(s: str, default: int) -> int:
    try:
        return int(s)
    except ValueError:
        return default`,
  alternativeApproach: `For a parser that needs to *also* accept floats and round / truncate, the shape generalises:

\`\`\`python
def parse_int_or(s: str, default: int) -> int:
    try:
        return int(float(s))    # "3.14" → 3.14 → 3
    except (ValueError, TypeError):
        return default
\`\`\`

That's a different contract — silently accepting non-integer-shaped input. Don't add it unless the call site actually wants it. The narrow \`except ValueError:\` is the right default; widen only when the use case justifies it. The discipline is "match the exception clause to the contract you want," not "catch broadly to be safe."`,
}

const LESSON_3 = {
  id: LESSON_3_ID,
  scrollId: COURSE_ID,
  order: 4,
  title: 'EAFP vs LBYL — the Pythonic reflex',
}

// =============================================================================
// Lesson 4 — Context managers
// =============================================================================
//
// 4 steps (read + 2 kata + playground). The read embeds the primary
// before-after figure (try-finally-vs-with) per the figures menu. Kata
// order is the post-audience-review swap (2026-06-08): 4.2 is the
// @contextmanager generator form (lands first for the polyglot), 4.3 is
// the class Capture form (state-bearing form second).

const STEP_4_1 = {
  id: STEP_4_1_ID,
  lessonId: LESSON_4_ID,
  order: 1,
  type: 'read' as const,
  title: 'with: the shape for resources',
  instruction: `## Why this matters

Every non-trivial Python codebase opens files, acquires locks, manages database connections, redirects stdout. **\`with\` is the shape Python provides for all of these.** Reading \`with engine.connect() as conn:\` without knowing the protocol means guessing what it does. And not being able to *write* one means you eventually invent worse shapes (a wrapper function, a context dict, a \`__del__\` finaliser you shouldn't trust) for problems \`with\` solves cleanly.

## The \`with\` block syntax

\`\`\`python
with expr as name:
    # block runs here; \`name\` is what \`expr.__enter__()\` returned
    ...
# block exited (with or without exception); expr.__exit__(...) ran
\`\`\`

\`expr\` evaluates to a **context manager** — an object with \`__enter__\` and \`__exit__\` dunders. \`__enter__\` runs first; its return value is bound to \`name\`. The block executes. \`__exit__\` runs, **regardless of whether the block raised**.

## Why this exists

Acquired resources need release. \`try / finally\` works but is verbose and easy to skip — and acquired-outside-the-block resources leak when humans forget the cleanup.

:figure[before-after]{id="try-finally-vs-with"}

The figure above is the contrast in one glance: the four-line \`try/finally\` pattern on the left (acquired-outside-the-block, manual cleanup, easy to forget the \`close\`) vs the three-line \`with\` on the right (acquired *inside* the \`as\` clause, cleanup implicit, lifetime visually scoped to the block). **Same outcome, opposite discipline.** The polyglot's reflex from C, Java pre-\`try-with-resources\`, or hand-rolled JS is the left column; the Pythonic answer is the right.

## The protocol — \`__enter__\` / \`__exit__\`

\`\`\`python
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
\`\`\`

- **\`__enter__(self)\`** runs when the \`with\` block starts. Its return value is what \`as name\` binds.
- **\`__exit__(self, exc_type, exc_val, exc_tb)\`** runs when the block exits. If the block raised, the three args carry the exception info; if not, all three are \`None\`. **Returning truthy from \`__exit__\` swallows the exception**; returning \`None\` (the default) lets it propagate. **Default to returning \`None\`** unless you have a specific reason to swallow — silent exception-swallowing is a maintenance nightmare.

## \`contextlib.contextmanager\` — the shortcut

Writing the class is verbose. The stdlib gives you a decorator that turns a generator into a context manager:

\`\`\`python
from contextlib import contextmanager

@contextmanager
def file_opener(path):
    f = open(path)
    try:
        yield f                # everything before yield = __enter__
    finally:
        f.close()              # everything after yield = __exit__
\`\`\`

The function **yields exactly once**. Before the \`yield\` is \`__enter__\`; the yielded value is bound to \`as name\`; after the \`yield\` is \`__exit__\`. The \`try / finally\` around the yield ensures cleanup runs even when the \`with\` block raises. **This is the shape Pythonic code reaches for first** — only drop to the class form when you need state across multiple \`with\` blocks, or you're implementing a context manager that's part of a larger class's surface (Lesson 4.3's \`Capture\` kata is the latter).

## The bridge to Lesson 5

\`@contextmanager\` is a decorator. A decorator is a function that takes a function and returns a new object — here, a context manager. Lesson 5 unpacks the decorator shape itself; for now, **recognise that \`@contextmanager\` and \`@property\` and \`@dataclass\` are all callable transformations applied at definition time.** The next lesson makes that family visible.

## Sandbox honesty

In production Python you'll see context managers around database connections (\`with engine.connect() as conn:\`), lock acquisition (\`with self.lock:\`), temporary-directory creation (\`with tempfile.TemporaryDirectory() as d:\`), stdout/stderr redirection (\`with contextlib.redirect_stdout(buf):\`). In this scroll, the katas use in-memory state and dicts because Piston is single-process and stateless — but **the protocol is identical regardless of what's being managed.** Once you write one, you can read them all.

Next: two katas. 4.2 writes a \`@contextmanager\` generator (the friendly shape). 4.3 writes the class form. Then a playground for \`__enter__\` / \`__exit__\` ordering under nested \`with\` and exceptions.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_4_2 = {
  id: STEP_4_2_ID,
  lessonId: LESSON_4_ID,
  order: 2,
  type: 'kata' as const,
  title: 'temp_state — a generator-based context manager',
  instruction: `## Your task

Write \`temp_state(d, key, value)\` — a context manager that:

1. Sets \`d[key] = value\` when the \`with\` block starts.
2. Restores the **original** value when the block exits — *or removes the key entirely if it wasn't there before*.
3. Restores correctly **even if the block raises an exception**.

Use the \`@contextmanager\` decorator from \`contextlib\`. The function yields exactly once.

### What's expected

\`\`\`python
from contextlib import contextmanager

# Key existed before
d = {"a": 1}
with temp_state(d, "a", 999):
    assert d["a"] == 999
assert d["a"] == 1               # original restored

# Key did NOT exist before
d = {}
with temp_state(d, "a", 999):
    assert d["a"] == 999
assert "a" not in d              # key removed because it wasn't there

# Block raises — cleanup still runs
d = {"a": 1}
try:
    with temp_state(d, "a", 999):
        assert d["a"] == 999
        raise RuntimeError("boom")
except RuntimeError:
    pass
assert d["a"] == 1               # restored despite the raise
\`\`\`

### The yield-once contract

\`@contextmanager\` requires **exactly one** \`yield\` in the function body. The code before it runs on \`__enter__\`; the yielded value is what gets bound to \`as name\`; the code after runs on \`__exit__\`. Wrap the body in \`try / finally\` so the cleanup runs even when the \`with\` block raises.`,
  starterCode: `from contextlib import contextmanager


@contextmanager
def temp_state(d: dict, key, value):
    # your code (yield once)
    ...
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

@_t("sets value inside the block")
def _():
    d = {"a": 1}
    with temp_state(d, "a", 999):
        _eq(d["a"], 999)


@_t("restores original value after the block")
def _():
    d = {"a": 1}
    with temp_state(d, "a", 999):
        pass
    _eq(d["a"], 1)


@_t("removes the key on exit when it did not exist before")
def _():
    d = {}
    with temp_state(d, "a", 999):
        _eq(d["a"], 999)
    _eq("a" in d, False)


@_t("restores correctly even when the block raises")
def _():
    d = {"a": 1}
    try:
        with temp_state(d, "a", 999):
            raise RuntimeError("boom")
    except RuntimeError:
        pass
    _eq(d["a"], 1)


@_t("removes key on exit when block raises and key did not pre-exist")
def _():
    d = {}
    try:
        with temp_state(d, "a", 999):
            raise RuntimeError("boom")
    except RuntimeError:
        pass
    _eq("a" in d, False)
${PY_HARNESS_FOOTER}`,
  hint: "The shape is:\n\n```\n@contextmanager\ndef temp_state(d, key, value):\n    # 1. Remember whether the key existed (and if so, its old value).\n    # 2. Set d[key] = value.\n    # 3. yield\n    # 4. Restore: if the key existed before, put the old value back; else delete it.\n```\n\nTo pass the \"restores even when the block raises\" test, wrap the `yield` in `try / finally` so the restore step (4) runs regardless of whether the block exits cleanly.\n\nTwo specific traps:\n\n- **Don't use `try / except`** — you don't want to catch the exception, you want the cleanup to run *and* the exception to propagate. `try / finally` does that.\n- **Don't `del d[key]` unconditionally on exit.** The key may have legitimately existed before you set it; in that case you restore the original value, not delete it. Track the pre-existence with a sentinel (`MISSING = object()` is the standard pattern) or with `key in d` checked once at the start.",
  solution: `from contextlib import contextmanager

_MISSING = object()


@contextmanager
def temp_state(d: dict, key, value):
    sentinel = d.get(key, _MISSING)
    d[key] = value
    try:
        yield
    finally:
        if sentinel is _MISSING:
            del d[key]
        else:
            d[key] = sentinel`,
  alternativeApproach: `The class form of the same context manager is verbose but instructive:

\`\`\`python
class TempState:
    def __init__(self, d, key, value):
        self.d, self.key, self.value = d, key, value

    def __enter__(self):
        self.had_key = self.key in self.d
        self.old = self.d.get(self.key)
        self.d[self.key] = self.value
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.had_key:
            self.d[self.key] = self.old
        else:
            del self.d[self.key]
        return None  # propagate exceptions
\`\`\`

Four times the lines for the same behaviour. The class form earns its place when you need methods on the bound object (Lesson 4.3's \`Capture\` kata) or persistent state across multiple \`with\` blocks. For a transient set-and-restore like \`temp_state\`, \`@contextmanager\` is what a reviewer expects.`,
}

const STEP_4_3 = {
  id: STEP_4_3_ID,
  lessonId: LESSON_4_ID,
  order: 3,
  type: 'kata' as const,
  title: 'Capture — context manager as a class',
  instruction: `## Your task

Implement \`Capture\` as a class with \`__enter__\` and \`__exit__\`. The class also has a \`record(value)\` method that appends to an instance list.

The shape is the same \`__enter__\` / \`__exit__\` protocol Step 4.2's \`@contextmanager\` desugared into — written as a class instead of a generator. Two reasons to reach for the class form (vs \`@contextmanager\`):

1. **You need methods on the object** the \`with\` block binds. \`c.record(value)\` is a method call on \`c\`; a generator-based context manager can yield values, not callable surfaces.
2. **You need state across multiple entries** of the same context manager. A class instance preserves its \`recorded\` list between \`with\` blocks; a generator function rebuilds state every call.

### What's expected

\`\`\`python
with Capture() as c:
    c.record(1)
    c.record(2)
assert c.recorded == [1, 2]

# Same instance can be re-entered — appends across blocks
c = Capture()
with c:
    c.record(1)
with c:
    c.record(2)
assert c.recorded == [1, 2]
\`\`\`

### \`__enter__\` returns what \`as name\` binds

If you want the block to call methods on the context manager itself, **return \`self\` from \`__enter__\`**. (If you returned, say, \`self.recorded\`, then \`c\` in \`with Capture() as c:\` would be the list, not the instance, and \`c.record(1)\` would fail.)

### \`__exit__\` does nothing special for this kata

\`__exit__\` is called even if the block raises; for this kata you don't need to handle the exception — just return \`None\` (or omit the return, same thing). Returning truthy from \`__exit__\` would *suppress* the exception, which is almost never what you want and definitely not what this kata wants.`,
  starterCode: `class Capture:
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
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

@_t("records calls inside the with block")
def _():
    with Capture() as c:
        c.record(1)
        c.record(2)
    _eq(c.recorded, [1, 2])


@_t("__enter__ returns the instance (as name binds to self)")
def _():
    c = Capture()
    with c as bound:
        _eq(bound is c, True)


@_t("recorded list starts empty")
def _():
    c = Capture()
    _eq(c.recorded, [])


@_t("same instance appends across multiple with blocks")
def _():
    c = Capture()
    with c:
        c.record(1)
    with c:
        c.record(2)
    _eq(c.recorded, [1, 2])


@_t("does not suppress exceptions raised inside the block")
def _():
    c = Capture()
    raised = False
    try:
        with c:
            c.record(1)
            raise RuntimeError("boom")
    except RuntimeError:
        raised = True
    _eq(raised, True)
    _eq(c.recorded, [1])
${PY_HARNESS_FOOTER}`,
  hint: "Four pieces:\n\n1. **`__init__`** initialises `self.recorded` to an empty list.\n2. **`__enter__`** returns the value the `with ... as name:` clause should bind. Read the second test if you're stuck on what to return.\n3. **`__exit__`** has nothing meaningful to do for this kata. The signature has three exception parameters; you don't need to inspect them. Return value of `None` (or no explicit return) lets exceptions propagate, which is what the last test expects.\n4. **`record(self, value)`** appends to `self.recorded`.\n\nThe two methods together are the same `__enter__` / `__exit__` shape `@contextmanager` desugared into in 4.2 — written as a class because we need a method (`record`) on the object the block binds, which a generator can't provide.",
  solution: `class Capture:
    def __init__(self):
        self.recorded: list = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return None  # let exceptions propagate

    def record(self, value):
        self.recorded.append(value)`,
  alternativeApproach: `The generator equivalent of \`Capture\` is awkward — generators yield values, not callable surfaces:

\`\`\`python
@contextmanager
def capture():
    recorded = []
    def record(v): recorded.append(v)
    yield record         # yield the record function (not the list)
    # caller can't access \`recorded\` after the block
\`\`\`

That doesn't compose — the caller has the \`record\` function but no way to read \`recorded\` after the \`with\` block exits. You could yield a tuple \`(record, lambda: recorded)\` and have the caller unpack, but you've already invented worse ergonomics than the class form. **This is the case the spec named** in Step 4.2's intro: when the bound object needs to be a callable surface, \`@contextmanager\` doesn't compose; reach for the class.`,
}

const STEP_4_4 = {
  id: STEP_4_4_ID,
  lessonId: LESSON_4_ID,
  order: 4,
  type: 'kata' as const,
  title: 'Playground: __enter__ / __exit__ ordering under nesting and exceptions',
  instruction: `## Play around

This step is a **playground**, not a kata. The runner button executes whatever you write and shows the output; the harness runs a trivially-true assertion so the backend stays uniform.

The starter code below defines a \`Tracer\` context manager that prints on \`__enter__\` and \`__exit__\`, then nests two of them inside a \`with\`. Run it as-is to see the order; then vary it.

Specific things worth trying:

- **What's the print order if no exception is raised?** The \`__enter__\` lines go top-down (outer, then inner); the \`__exit__\` lines go bottom-up (inner first, then outer). Confirm by reading the output.
- **What changes if you \`raise RuntimeError("boom")\` inside the inner \`with\`?** Both \`__exit__\` methods still run. The \`exc_type\` arg they receive is no longer \`None\`.
- **What happens if the inner \`__exit__\` returns \`True\`?** Truthy from \`__exit__\` **swallows** the exception. The outer \`__exit__\` then runs with \`exc_type=None\` because the exception is considered handled.
- **What if you wrap the outer \`with\` in a \`try / except\`?** If neither \`__exit__\` returns \`True\`, the exception propagates out to the \`try\` and you catch it. If the inner does return \`True\`, the \`try\` never sees the exception.

This step prints to the console because it's a playground — the runner shows stdout instead of test verdicts. In \`kata\` steps the harness captures \`print\` output so it doesn't drown the assertions; here it's the whole point.`,
  starterCode: `class Tracer:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        print(f"enter {self.name}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"exit  {self.name}  exc_type={exc_type.__name__ if exc_type else None}")
        # return None — let exceptions propagate
        return None


with Tracer("outer"):
    with Tracer("inner"):
        print("inside both")
`,
  testCode: `${PY_HARNESS_HEADER}
@_t("explored")
def _():
    _eq(True, True)
${PY_HARNESS_FOOTER}`,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: { kind: 'playground' as const },
}

const LESSON_4 = {
  id: LESSON_4_ID,
  scrollId: COURSE_ID,
  order: 5,
  title: 'Context managers',
}

// =============================================================================
// Lesson 5 — Decorators + closures
// =============================================================================
//
// 5 steps after the 2026-06-08 suite voice audit applied the spec §7
// split — the original 5.1 measured ~970 words past the 600-word
// threshold. 5.1a carries the mechanics (closures, L1 back-reference,
// plain decorator, @wraps, single-arg bridge, three-layer onion).
// 5.1b carries the reframe (unification figure, named-and-deferred,
// Java-reflex closer) and opens with the explicit L4 → L5 bridge
// sentence the inner spec §3 committed to.

const STEP_5_1A = {
  id: STEP_5_1A_ID,
  lessonId: LESSON_5_ID,
  order: 1,
  type: 'read+inline' as const,
  title: 'Closures and decorators: the mechanism',
  instruction: `## Why this matters

The polyglot will see \`@retry\`, \`@cache\`, \`@app.route\`, \`@property\`, \`@dataclass\`, \`@contextmanager\` in the first non-trivial Python file. Knowing what \`@\` actually does = readable code. **Not knowing = decorators feel like magic, you write code that decorates wrong (\`functools.wraps\` missing, three-layer onion confused), and the wrong code is slow to debug.** This lesson lands the mechanism, then lets the kata at 5.3 and 5.4 force you to write one.

## Closures recap — capture is by *name*, not by value

A function that references a variable from its enclosing scope captures that variable's **name binding**, not its current value. In Python this matters:

\`\`\`python
fns = [lambda: i for i in range(3)]
[f() for f in fns]                    # [2, 2, 2], NOT [0, 1, 2]
\`\`\`

Each lambda captures the *name* \`i\`, which by the time the lambdas are called has been bound to \`2\` (the last iteration). The standard fix is a default argument that captures the value at lambda-creation time:

\`\`\`python
fns = [lambda i=i: i for i in range(3)]    # default arg = value snapshot
[f() for f in fns]                          # [0, 1, 2]
\`\`\`

This is **the late-binding closure trap**, the canonical Python-closure surprise. The predict at 5.2 is exactly this snippet.

## Back-reference to Lesson 1's \`Counter(items=[])\` predict

The Lesson 1 predict planted a hook: \`Counter(items=[])\` shares the same list across instances. **Same family of bug, different surface.** The mechanism behind both is that **function objects are constructed once at \`def\` time** — defaults are evaluated and bound then (Lesson 1's trap); closure variables are name references *resolved* at call (this lesson's trap). The \`def __init__(self, items=[])\` reuses the same list across calls; the \`lambda: i\` resolves \`i\` whenever it runs. Two surfaces, one evaluation model. Naming the mechanism here closes the loop.

## What a decorator IS

A **callable that takes a callable and returns a callable.** \`@d\` is *sugar* for \`f = d(f)\`. Nothing more.

\`\`\`python
def trace(fn):
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper

@trace
def add(a, b):
    return a + b
# Exactly equivalent to: add = trace(add)
\`\`\`

Calling \`add(1, 2)\` now goes through \`wrapper(1, 2)\`, which prints \`"calling add"\` then calls the original \`add\`. The \`@trace\` line is *syntax sugar*; what's executing is plain function-takes-function-returns-function.

<!-- interact:wraps-reveal -->

## The \`functools.wraps\` rule

By default, the wrapper has its own \`__name__\` (\`"wrapper"\`), its own \`__doc__\` (\`None\`), its own \`__module__\`. That breaks introspection — \`pytest\` looks at \`__name__\`, \`inspect.signature\` looks at the function metadata, IDE tooltips read the docstring. The fix:

\`\`\`python
from functools import wraps

def trace(fn):
    @wraps(fn)                          # copies fn's metadata onto wrapper
    def wrapper(*args, **kwargs):
        ...
    return wrapper
\`\`\`

**Every decorator you write in production needs \`@wraps(fn)\`.** A decorator without it is broken — sometimes silently, sometimes loudly. The 5.3 kata's tests assert on \`__name__\`, so a missing \`@wraps\` is a visible failure.

## Single-arg decorator first, parametrised second

Before the three-layer onion below: the kata at 5.3 (\`@trace\`) walks the **single-arg** shape — function in, function out, plus \`@wraps\`. **That's the bridge.** Write the plain decorator first; add the parametrisation layer on top in 5.4. If 5.3 feels solid, 5.4's \`@retry(times=N)\` is just "wrap 5.3 in another function that takes the arg." If you find yourself confused inside 5.4, the gap is at 5.3, not at three-layer semantics.

## Decorators with arguments — the three-layer onion

\`\`\`python
def retry(times):                      # outer: takes the decorator's argument
    def decorator(fn):                  # middle: takes the function (this IS the decorator)
        @wraps(fn)
        def wrapper(*args, **kw):       # inner: the actual call-time wrapper
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
\`\`\`

Three layers because: outer takes the decorator's arg (\`3\`); middle takes the function (\`flaky\`); inner is the wrapper that runs at call time. \`@retry(3)\` calls \`retry(3)\`, which returns \`decorator\`. \`decorator\` is then applied to \`flaky\` — \`flaky = decorator(flaky)\`. **This trips up every polyglot the first time they read it.** Once you see the shape, every parametrised decorator (\`@app.route("/")\`, \`@pytest.fixture(scope="session")\`, \`@cache(maxsize=128)\`) is the same pattern.

Next: the *reframe* — once you see the shape, four of Python's most-common decorators stop looking like four separate things. 5.1b makes that family visible.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    interactions: [
      {
        kind: 'reveal' as const,
        after: 'wraps-reveal',
        prompt: 'Before reading on — after the @trace above, what does add.__name__ return?',
        answer:
          '`"wrapper"`. The name `add` is now bound to the inner function `trace` returned; the original metadata is gone. That silently breaks `pytest` (which reads `__name__`), `inspect.signature`, and IDE tooltips. The next section is the one-line fix — and the 5.3 kata fails its tests without it.',
      },
    ],
  },
}

const STEP_5_1B = {
  id: STEP_5_1B_ID,
  lessonId: LESSON_5_ID,
  order: 2,
  type: 'read' as const,
  title: 'The family: why @property, @dataclass, @cache, @contextmanager are the same idea',
  instruction: `## Why this matters

5.1a landed the mechanics: \`@d\` is sugar for \`f = d(f)\`; \`@wraps\` rescues introspection; the three-layer onion gives parametrised decorators. **This step lands the reframe.** Once you see decorators as "callable transforming callable," four of Python's most-common decorators stop feeling like four separate things and start feeling like one shape applied four ways.

**Remember how \`@contextmanager\` turned a generator into a context manager in Lesson 4?** That's the same shape as a plain decorator — a callable transforming another callable. The decorator family is wider than \`@contextmanager\` and \`@trace\`, and the next subsection makes that visible across the four decorators you'll see most often in production Python.

## The unification — \`@property\`, \`@dataclass\`, \`@cache\`, \`@contextmanager\`

All four of these are *callables transforming callables (or classes)*. They differ only in what they take and what they return.

:figure[tabbed-card]{id="decorators-and-friends"}

The figure above is the same shape applied to four different decorators. Tab through them — every one is "callable in, callable (or transformed class) out," differing only in the *kind* of input and output. **Once you see this, Python's decorator surface stops feeling magical and starts feeling consistent.** The decorator shape is the language's primary "modify what a callable does at definition time" mechanism, and it earns the syntax sugar because it's used everywhere — production code, web framework routing, ORM column declarations, type-checking, caching.

## Named-and-deferred

Four topics this lesson **does not** teach, but that the polyglot will encounter:

- **The descriptor protocol** behind \`@property\` — \`__get__\`, \`__set__\`, \`__delete__\`. \`@property\` is "just" a descriptor; understanding the protocol is the depth \`python-descriptors-and-protocols\` (deep-dive) earns.
- **Metaclasses and \`__init_subclass__\`** — Tim Peters' rule: "if you have to ask, you don't need them." Named here so the polyglot recognises the words; depth in \`python-descriptors-and-protocols\`.
- **Async decorators and the event loop** — \`async def\`, \`await\`, \`asyncio.run\`, \`TaskGroup\`. All of this needs the event-loop model *before* the syntax; depth in \`python-asyncio-deep\`.
- **\`functools.lru_cache\` invalidation on methods** — \`lru_cache\`'s \`cache_clear()\` exists, but applied to a method it caches \`self\` and prevents garbage collection. Real production issue; depth in a future \`python-functools-deep\`.

You know they exist, roughly what shape they have, and where to find depth — that's enough to read idiomatic Python. When one of them bites you in production, you'll know which deep-dive to open.

## Closer (the Java-class question)

If you're coming from Java and noticed this scroll has no dedicated OOP lesson, **that's deliberate, not an omission.** Python's class system contributes two things to a polyglot the language doesn't already have:

1. **The protocol surface.** Lesson 1 named the five dunders; Lesson 4 wrote \`__enter__\` / \`__exit__\`; this lesson recognises \`@property\` / \`@dataclass\` / \`@classmethod\` as decorators applied to classes. That's how Python's classes earn their pages.
2. **The \`@dataclass\` "I just want a record" answer.** One decorator, zero boilerplate, get \`__init__\` / \`__repr__\` / \`__eq__\` / typed fields for free.

Everything else about classes — inheritance hierarchies, abstract base classes, descriptors at depth, \`__slots__\`, \`__init_subclass__\` as the lightweight metaclass alternative — lives in \`python-descriptors-and-protocols\`. **The polyglot reflex that produces \`class TaskRunner: def run(self): ...\` for a three-line script is the failure mode this scroll most actively defends against** (see Lesson 1's anti-class beat). Reach for a class when you have **state + behaviour that belong together**, or when you're implementing a protocol Python expects (a context manager, an iterator, a callable). Reach for a function otherwise. Reach for a \`@dataclass\` when the answer is "I want a typed record." That is the lens; the depth waits.

Next: a predict on the late-binding closure trap (the snippet from 5.1a's closures recap), then two katas — \`@trace\` (single-arg with \`@wraps\`), then \`@retry(times=N)\` (three-layer onion).`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_5_2 = {
  id: STEP_5_2_ID,
  lessonId: LESSON_5_ID,
  order: 3,
  type: 'predict' as const,
  title: 'Predict: what does this loop-of-lambdas return?',
  instruction: `One predict on closure capture before the katas. This is the snippet the read step's closures recap warned about.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    question: 'What does this print?',
    snippet: `fns = [lambda: i for i in range(3)]
print([f() for f in fns])`,
    options: [
      { id: 'a', text: '`[0, 1, 2]`' },
      { id: 'b', text: '`[2, 2, 2]`' },
      { id: 'c', text: "`[None, None, None]` (lambdas don't capture)" },
      { id: 'd', text: '`[0, 0, 0]` (lambdas capture initial value)' },
    ],
    correct: 'b',
    feedback: {
      a: "The JS reflex from `let`-loop bindings. In modern JavaScript, `for (let i = 0; i < 3; i++)` creates a **new** `i` per iteration, so a closure inside the loop captures a distinct binding each time. In Python, `for i in range(3)` reuses the *same* `i` — there's one binding, rebound on each iteration. Each lambda captures the **name** `i`; by the time you call them, `i` is `2` (the last value the loop assigned). To get `[0, 1, 2]`, snapshot the value at lambda-creation time with a default arg: `[lambda i=i: i for i in range(3)]`.",
      b: "Correct. **Late binding.** Python closures capture the *name binding*, not the value. All three lambdas reference the same `i`, which after the loop is `2`. The fix is `[lambda i=i: i for i in range(3)]` — the default argument is evaluated at lambda-creation time and binds the current value to the parameter `i`, which then shadows the loop variable inside the lambda body.\n\n**This is the canonical Python-closure trap** and the reason you'll see `lambda i=i:` patterns scattered through production code. It's the same `def`-time vs call-time evaluation model behind Lesson 1's `Counter(items=[])` mutable-default trap — different surface, same mechanism.",
      c: "Lambdas **do** capture — they capture the enclosing scope's name bindings, exactly like nested `def` functions. `[None, None, None]` would require the lambdas to return nothing, which they don't (they return `i`). The lambda mechanism isn't the trap; the trap is *what gets captured* (name, not value).",
      d: "Closures capture **references**, not snapshots. The \"capture initial value\" model is what `lambda i=i:` simulates explicitly via default-argument evaluation at lambda-creation time — but without that pattern, the lambda holds a reference to the same `i` that the loop is rebinding. After the loop, `i` is `2`, and all three lambdas read `2`.",
    },
  },
}

const STEP_5_3 = {
  id: STEP_5_3_ID,
  lessonId: LESSON_5_ID,
  order: 4,
  type: 'kata' as const,
  title: '@trace — a single-arg decorator with @wraps',
  instruction: `## Your task

Write a decorator \`trace\` that wraps any function and records each call into a list \`trace.calls\`. The tuple shape is \`(args, kwargs, return_value)\`.

**Two requirements:**

1. The wrapped function must work normally — calling \`add(1, 2)\` returns \`3\`, plus a record gets appended to \`trace.calls\`.
2. The wrapped function's \`__name__\` must be preserved — \`add.__name__\` is \`"add"\`, not \`"wrapper"\`. The stdlib has a decorator for this — see the hint.

### What's expected

\`\`\`python
trace.calls = []

@trace
def add(a, b):
    return a + b

add(1, 2)               # returns 3, appends ((1, 2), {}, 3) to trace.calls
add(3, 4)               # returns 7, appends ((3, 4), {}, 7)
assert trace.calls == [((1, 2), {}, 3), ((3, 4), {}, 7)]
assert add.__name__ == "add"      # @wraps preserved the name
\`\`\`

### About \`trace.calls\`

\`trace.calls\` is a list attached to the \`trace\` function itself — \`trace.calls = []\` *outside* the function. Functions are objects in Python (a fact this lesson is built around); they can carry attributes. The decorator's wrapper appends to \`trace.calls\` on every call.`,
  starterCode: `from functools import wraps


def trace(fn):
    # your code — return a wrapper that records each call into trace.calls,
    # and preserve fn's metadata onto the wrapper.
    ...


trace.calls = []
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

@_t("wrapped function returns the same value as the original")
def _():
    trace.calls = []

    @trace
    def add(a, b):
        return a + b

    _eq(add(1, 2), 3)


@_t("each call appends (args, kwargs, result) to trace.calls")
def _():
    trace.calls = []

    @trace
    def add(a, b):
        return a + b

    add(1, 2)
    add(3, 4)
    _eq(trace.calls, [((1, 2), {}, 3), ((3, 4), {}, 7)])


@_t("@wraps preserves __name__")
def _():
    trace.calls = []

    @trace
    def add(a, b):
        return a + b

    _eq(add.__name__, "add")


@_t("kwargs are recorded correctly")
def _():
    trace.calls = []

    @trace
    def greet(name, *, greeting="hi"):
        return f"{greeting}, {name}"

    greet("Adrian", greeting="hola")
    _eq(trace.calls, [(("Adrian",), {"greeting": "hola"}, "hola, Adrian")])
${PY_HARNESS_FOOTER}`,
  hint: "The decorator's shape:\n\n```\ndef trace(fn):\n    @<the stdlib decorator that copies metadata>(fn)\n    def wrapper(*args, **kwargs):\n        result = <call the original function with the args>\n        <append the tuple (args, kwargs, result) to the list>\n        return result\n    return wrapper\n```\n\nThree specific things to land:\n\n1. **Forward `*args` and `**kwargs`** so the wrapper accepts any call shape — single positional, kwargs only, mix.\n2. **Record before returning.** Compute `result` first, then append `(args, kwargs, result)` to `trace.calls`, then return. If you append before the call, you don't have the result yet; if you `return` before appending, the record never lands.\n3. **Use the stdlib decorator that copies metadata.** It lives in `functools`. The third test (`__name__`) is what catches you if you skipped it — the wrapper's name without it is `\"wrapper\"`.",
  solution: `from functools import wraps


def trace(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        result = fn(*args, **kwargs)
        trace.calls.append((args, kwargs, result))
        return result
    return wrapper


trace.calls = []`,
  alternativeApproach: `For decorators that need to share state *between* instances (a global trace log across multiple decorated functions, for instance), \`trace.calls\` as a function attribute is the right pattern. For decorators that own per-decoration state (one log per decorated function), the closure form holds it:

\`\`\`python
def trace_per_fn(fn):
    calls = []
    @wraps(fn)
    def wrapper(*args, **kwargs):
        result = fn(*args, **kwargs)
        calls.append((args, kwargs, result))
        return result
    wrapper.calls = calls    # expose for inspection
    return wrapper
\`\`\`

Now each \`@trace_per_fn\` decoration has its own \`calls\` list, accessible as \`decorated_fn.calls\`. Pick the shape that matches the contract — *one log* for the whole program (function attribute on the decorator) vs *one log per decorated function* (closure attribute on the wrapper).`,
}

const STEP_5_4 = {
  id: STEP_5_4_ID,
  lessonId: LESSON_5_ID,
  order: 5,
  type: 'kata' as const,
  title: '@retry(times=N) — the three-layer onion',
  instruction: `## Your task

Write \`retry(times=N)\` — a parametrised decorator that wraps a function and retries it up to \`N\` times if it raises. On the first success, return the result. After \`N\` failures, re-raise the last exception.

This is the **three-layer onion** the 5.1 read step described:

- **Outer:** takes the decorator's argument (\`times\`).
- **Middle:** takes the function. This is the actual decorator.
- **Inner:** the wrapper that runs at call time, retrying the function.

If 5.3 felt solid, this is **5.3 wrapped in one more layer** that takes \`times\`. If 5.4 feels confusing, the gap is at 5.3 — go back, make sure the single-arg shape is locked in, then return.

### What's expected

\`\`\`python
attempts = {"n": 0}

@retry(times=3)
def flaky():
    attempts["n"] += 1
    if attempts["n"] < 3:
        raise RuntimeError("not yet")
    return "ok"

flaky()                                         # attempts 1 (raise), 2 (raise), 3 (return) → "ok"
assert flaky.__name__ == "flaky"                # @wraps preserved the name


@retry(times=3)
def always_fails():
    raise ValueError("never works")

try:
    always_fails()                              # tries 3x, all raise, re-raises ValueError
except ValueError as e:
    assert str(e) == "never works"
\`\`\`

### Re-raise discipline

After exhausting \`times\` attempts, **re-raise the last exception** — don't silently return \`None\`, don't return a sentinel, don't swallow. The caller asked for the result; if there isn't one, they need to know why. Use bare \`raise\` (no argument) inside the \`except\` to re-raise the exception just caught — Python preserves the original traceback.

### Preserve \`__name__\` with \`@wraps\`

Same rule as 5.3 — wrap the innermost wrapper with \`@wraps(fn)\`. The tests assert on \`__name__\`.`,
  starterCode: `from functools import wraps


def retry(times: int):
    # your code — three layers:
    #   outer: takes times
    #   middle: takes fn (this is the decorator)
    #   inner: the wrapper that runs at call time
    ...
`,
  testCode: `${PY_HARNESS_HEADER}
# === learner code runs above this line ===

@_t("retries up to N times and returns on first success")
def _():
    attempts = {"n": 0}

    @retry(times=3)
    def flaky():
        attempts["n"] += 1
        if attempts["n"] < 3:
            raise RuntimeError("not yet")
        return "ok"

    _eq(flaky(), "ok")
    _eq(attempts["n"], 3)


@_t("succeeds on first attempt does not retry")
def _():
    attempts = {"n": 0}

    @retry(times=3)
    def always_ok():
        attempts["n"] += 1
        return "ok"

    _eq(always_ok(), "ok")
    _eq(attempts["n"], 1)


@_t("re-raises the last exception after exhausting attempts")
def _():
    @retry(times=3)
    def always_fails():
        raise ValueError("never works")

    raised = None
    try:
        always_fails()
    except ValueError as e:
        raised = str(e)
    _eq(raised, "never works")


@_t("times=1 means one attempt total")
def _():
    attempts = {"n": 0}

    @retry(times=1)
    def fails_once():
        attempts["n"] += 1
        raise RuntimeError("nope")

    try:
        fails_once()
    except RuntimeError:
        pass
    _eq(attempts["n"], 1)


@_t("@wraps preserves __name__")
def _():
    @retry(times=2)
    def flaky():
        return 1

    _eq(flaky.__name__, "flaky")
${PY_HARNESS_FOOTER}`,
  hint: "The shape, with the three layers labelled:\n\n```\ndef retry(times):              # OUTER — receives the decorator's arg\n    def decorator(fn):          # MIDDLE — receives the function (THIS is the decorator)\n        @<stdlib-metadata-copier>(fn)\n        def wrapper(*args, **kw):    # INNER — runs at call time\n            <try the function up to `times` times>\n            <on success: return the result>\n            <on failure: re-raise the last exception>\n        return wrapper\n    return decorator\n```\n\nTwo specific traps:\n\n1. **Where does `times` live?** It's a parameter of the OUTER function. The INNER wrapper references it via closure. If you wrote it as two layers (just `decorator` + `wrapper`), `times` has no scope. The third layer (outer) exists *because* the decorator needs to take an argument.\n\n2. **The retry loop.** A `for _ in range(times)` loop with `try: return fn(*args, **kw) except Exception: continue` covers the retry-and-return-on-success path. After the loop exits without a return, you've exhausted attempts — `raise` (bare, no argument) re-raises the last caught exception. Python remembers it.",
  solution: `from functools import wraps


def retry(times: int):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kw):
            last_exc = None
            for _ in range(times):
                try:
                    return fn(*args, **kw)
                except Exception as e:
                    last_exc = e
                    continue
            raise last_exc
        return wrapper
    return decorator`,
  alternativeApproach: `For production retries, the three-layer onion gets one more layer: a **backoff strategy** (constant delay, exponential, jittered) and a **predicate** for which exceptions to retry on (don't retry on \`KeyboardInterrupt\`, don't retry on \`ValueError\` if the input is invalid). Libraries like \`tenacity\` give you both:

\`\`\`python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type(TransientError),
)
def fetch(url): ...
\`\`\`

The shape generalises: parametrised decorators with multiple kwargs, each contributing one composable concern. **For the scroll's purpose, the three-layer onion is the load-bearing pattern** — once you can write \`@retry(times=N)\` from first principles, reading \`@tenacity.retry(...)\` is just naming the additional parameters. \`tenacity\` and friends are deferred to a future \`python-resilience-patterns\` deep-dive.`,
}

const LESSON_5 = {
  id: LESSON_5_ID,
  scrollId: COURSE_ID,
  order: 6,
  title: 'Decorators + closures',
}

// =============================================================================
// PYTHON_LESSONS + PYTHON_STEPS exports
// =============================================================================
//
// W3 batch 3 closes out authoring with L4 + L5. All 22 steps now seeded.

export const PYTHON_LESSONS = [LESSON_0, LESSON_1, LESSON_2, LESSON_3, LESSON_4, LESSON_5]

export const PYTHON_STEPS = [
  STEP_0_1, STEP_0_2,
  STEP_1_1, STEP_1_2, STEP_1_3,
  STEP_2_1, STEP_2_2, STEP_2_3, STEP_2_4,
  STEP_3_1, STEP_3_2, STEP_3_3, STEP_3_4,
  STEP_4_1, STEP_4_2, STEP_4_3, STEP_4_4,
  STEP_5_1A, STEP_5_1B, STEP_5_2, STEP_5_3, STEP_5_4,
]
