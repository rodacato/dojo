// =============================================================================
// Python — scroll seed. The dojo's Python crash course for polyglot developers.
//
// Direction: ADR 022 (crash-course pivot). Slug `python` (was
// `python-for-the-practiced` pre-pivot — the old slug is removed from DB by
// `removeLegacyScrollBySlug` invoked at the tail of `seedAllScrolls` in
// seed-scrolls.ts).
//
// Polyglot-first lesson order (S027 W2 authoring; W3 seeding in progress):
//   order 1 — Lesson 0 (Python en contexto)               — 2 steps (read, predict)
//   order 2 — Lesson 1 (Las dos sintaxis que sorprenden)  — 3 steps (read, predict, kata)
//   order 3 — Lesson 2 (Literales y comprehensions)       — 4 steps (TODO W3 batch 2)
//   order 4 — Lesson 3 (EAFP vs LBYL)                     — 4 steps (TODO W3 batch 2)
//   order 5 — Lesson 4 (Context managers)                 — 4 steps (TODO W3 batch 3)
//   order 6 — Lesson 5 (Decorators + closures)            — 5 steps (TODO W3 batch 3)
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

const STEP_0_1_ID = seedUuid('py-s0-1-context-and-run')
const STEP_0_2_ID = seedUuid('py-s0-2-predict-install-dance')

const STEP_1_1_ID = seedUuid('py-s1-1-surprises')
const STEP_1_2_ID = seedUuid('py-s1-2-predict-mutable-default')
const STEP_1_3_ID = seedUuid('py-s1-3-kata-counter')

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
// Lesson 0 — Python en contexto
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
- **\`uv\`** (Astral, 2024) — Rust-fast drop-in \`pip\` replacement, increasingly the **modern default for new projects**. Pin \`uv\` if you're starting fresh in 2026.
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
  title: 'Python en contexto',
}

// =============================================================================
// Lesson 1 — Las dos sintaxis que sorprenden
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
  title: 'Las dos sintaxis que sorprenden',
}

// =============================================================================
// PYTHON_LESSONS + PYTHON_STEPS exports
// =============================================================================
//
// Only L0 + L1 ship in this commit. L2-L5 land in subsequent W3 batches —
// when each lesson's STEP_N_* constants land, the LESSON_N entry joins
// PYTHON_LESSONS and the STEP_N_* IDs join PYTHON_STEPS.

export const PYTHON_LESSONS = [LESSON_0, LESSON_1]

export const PYTHON_STEPS = [STEP_0_1, STEP_0_2, STEP_1_1, STEP_1_2, STEP_1_3]
