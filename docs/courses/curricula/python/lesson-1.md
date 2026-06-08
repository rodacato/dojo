# Python — Lesson 1: Las dos sintaxis que sorprenden

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-08
> **Spec:** [python.md §4 Lesson 1](python.md#lesson-1--las-dos-sintaxis-que-sorprenden) · [python/python.md §Lesson 1](python.md#lesson-1--las-dos-sintaxis-que-sorprenden)
> **Primary audience:** A1 Mariana (JS Senior) + A4 Felipe (TS Modernizer). Secondary: A3 Yui (Java Senior, Python-as-scripting).
> **Step count:** 3 (1 `read` + 1 `predict` + 1 `kata`).
> **What changes in the learner's head:** "Indentation is syntax — `IndentationError` is a parse-time error, not a style warning. `self` is the explicit first parameter of every instance method — Python's class system is open about what other languages hide. The `__dunder__` methods aren't advanced — they're the protocol surface that makes `for`, `with`, `[]`, `()` all work. And: I am not supposed to write a class for a three-line script."

This file holds the **production prose** for each step's `instruction` / `feedback` / etc. fields. Content is in English; meta-notes in Spanish where helpful.

---

## Step 1.1 — `read` — "Las dos cosas que sorprenden cuando abrís un archivo Python"

**Title:** `The two things that look weird when you open a Python file`
**Type:** `read`
**Word count target:** ~400. Pythonic test §2.1 applied. Includes the TS/Java analogues per dunder (Felipe's leverage) and the anti-class beat (Yui's failure mode defense) added in the 2026-06-08 audience review.

### `instruction` (markdown body)

```markdown
## Why this matters

You open a Python file on Friday. Two things look weird in the first ten lines: there are no braces, and every method starts with `self`. Naming both up front so they don't trip you for the next 90 minutes — and naming the *worse* trap (reaching for a class to write a three-line script) so the Java reflex doesn't define how you write your first Python.

## Surprise 1: indentation is syntax

Python uses indentation to delimit blocks. No `{}`, no `do/end`, no `begin/end`. The block after `if x:` begins on the next indented line and ends when the indent goes back.

```python
if items:
    process(items)
    notify(items)
else:
    log("empty")
```

**An inconsistent indent is a parse error (`IndentationError`)** — not a style warning, not a linter suggestion, an error at compile time. PEP 8 says 4 spaces; tabs work but mixing tabs and spaces in the same file is fatal. Every modern editor handles this for you — you only need to know it's syntax, not convention.

*Polyglot reflex named:* if you came from JS / Java / C, your reflex is "whitespace doesn't matter." In Python it does. If you came from Ruby, your reflex is `do…end` — Python doesn't have block-terminator keywords; the indent itself is the boundary.

## Surprise 2: `self` is the explicit first parameter

When you define an instance method, the receiver is **declared in the signature**:

```python
class Counter:
    def __init__(self, start=0):
        self.value = start

    def increment(self):
        self.value += 1
```

`self` is a *naming convention*, not a keyword — you could literally write `this` or `me`. But every Python codebase uses `self`. And it's *required* — there is no implicit `this` like in JS / Java / Ruby. When you call `counter.increment()`, Python passes `counter` as the first argument. Two more characters per method signature; in return, no "wait, where does `this` come from?" confusion ever.

**In TypeScript terms:** this is the `function foo(this: Type, ...)` first-parameter trick made mandatory and ubiquitous. **In Java terms:** the receiver Java keeps invisible (`this`) is made explicit.

## The `__dunder__` surface (named, not earned)

Python's protocol surface lives in **dunder** methods — methods whose names start and end with double underscores. The five you should recognise on sight after this lesson:

- **`__init__`** — the constructor. Runs on `Counter(5)`.
- **`__repr__`** — controls the developer-facing string (what the REPL shows, what `repr(x)` returns).
- **`__iter__`** — makes an object iterable. `for x in obj` calls this.
  *TS analogue:* `Symbol.iterator`. *Java analogue:* implementing `Iterable<T>`.
- **`__enter__` / `__exit__`** — make an object a context manager. `with obj` calls these.
  *TS analogue:* no native one (closest is the stage-3 `await using` proposal). *Java analogue:* `AutoCloseable` consumed via `try-with-resources`.
- **`__call__`** — make an instance callable. `obj()` calls this.
  *TS analogue:* the callable-interface trick (`interface Fn { (x: number): number }`). *Java analogue:* nothing direct — the closest is `Function<T, R>.apply`.

You don't need to memorise the full list (Python has ~80). You need to recognise that `for`, `with`, `[]`, `()` all dispatch through dunders — so **"an object IS what its dunders say it is"** is the language's defining bet. Lessons 4 and 5 earn this by *writing* dunders; for now, name-and-recognise is enough.

## Polyglot anti-reflex: do not reach for a class here

Python *has* classes — `self` makes that visible. **It does not want them for everything.**

A three-line script that filters a list does not need:

```python
# anti-pattern
class TaskRunner:
    def __init__(self, items):
        self.items = items

    def run(self):
        return [x for x in self.items if x > 0]

result = TaskRunner(data).run()
```

It needs:

```python
# Pythonic
result = [x for x in data if x > 0]
```

A Python module that exposes one operation is a module, not a singleton class. **The Java reflex is the failure mode this scroll defends against most actively**: classes are for state + behaviour pairs and protocol-surface implementations (Lesson 4 writes one for `__enter__` / `__exit__`); functions are for everything else. If you find yourself writing `class XManager:` with one method, delete the class and keep the method. *(This is also the reason no lesson in this scroll is "OOP" — Lesson 5's closer addresses the "where is the class lesson?" question directly.)*

## Sandbox honesty

In this scroll, type hints (the `: int`, `-> str` annotations you'll see in starter code) are used as **design tools, not runtime checks**. Python doesn't enforce hints at runtime — that's `mypy` or `pyright`'s job, and they live outside the sandbox. If you write `def add(a: int, b: int) -> int: return a + b` and call `add("hi", "bye")`, you get string concatenation, not a type error. The hints are scaffolding for the human reader (and for Felipe's TS reflex) — not a contract the runtime enforces.

Next: a predict on the most common Python footgun the polyglot hits in their first month.
```

### Paragraph-test audit (Valentina §2.1 gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Why am I being told about whitespace?" — frames both surprises and signals the anti-class beat | KEEP |
| "Surprise 1: indentation" | "Wait, can I write `if x { … }` and have it work?" — answers up front | KEEP |
| Indentation polyglot-reflex callout | "What's my equivalent from JS / Java / Ruby?" | KEEP |
| "Surprise 2: `self`" | "Why does every method take this `self` argument? Can I omit it?" | KEEP |
| `self` TS/Java analogue callout | Felipe and Yui's specific bridge — answers "what's the closest thing I already know?" | KEEP (audience review 2026-06-08) |
| "The `__dunder__` surface" | "Why is `__init__` named like that and why do I see other `__x__` methods?" | KEEP — load-bearing for L4 + L5 |
| Per-dunder TS/Java analogues | Felipe's reading speed-up + Yui's mapping cost reduction; the polyglot stops mentally translating mid-step | KEEP (audience review 2026-06-08) |
| "Polyglot anti-reflex: do not reach for a class" | Yui's load-bearing failure mode — the over-OOP reflex from Java the rest of the scroll cannot defend against if Lesson 1 doesn't name it | KEEP (audience review 2026-06-08) |
| "Sandbox honesty" | "Will my type hints actually do anything?" — and primes Felipe's expectation | KEEP |

**What got cut:** historical PEP-8 debate (whitespace religion), "Python was designed to be readable" (consensus marketing, not pedagogy), what `__init__` does at depth (Lessons 4-5 own that), a full dunder tour (the five named earn their place; the other ~75 don't earn the prose), and "MINASWAN"-equivalent community-tone content.

---

## Step 1.2 — `predict` — "¿Qué imprime este código?"

**Title:** `Predict: what does this print?`
**Type:** `predict`
**Mental model under test:** Python's default-argument semantics. Defaults are evaluated **once at `def` time** and bound to the function object — not evaluated per call. Lesson 5 will explain *why* (`def`-time evaluation is the same mechanism behind the late-binding closure trap); this predict plants the surprise so the learner *has* the hook when Lesson 5 lands.

### `instruction` (short intro shown above the snippet)

```markdown
One predict on default-argument behaviour before the first kata. The mechanism behind this surprise is what Lesson 5's closures recap unpacks — for now, just predict the output.
```

### `question`

```
Considering Python's default-argument semantics, what does this snippet print?
```

### `snippet`

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

### `options`

```yaml
- id: a
  text: "`[]` (each instance gets its own empty list)"
- id: b
  text: "`[1]` (the default `[]` is shared between instances)"
- id: c
  text: "`TypeError` (mutable defaults raise at definition time)"
- id: d
  text: "`None` (default is evaluated lazily and returns None)"
correct: b
```

### `feedback` (per option, sensei voice)

**a — `[]` (each instance gets its own empty list):**
> That's the JS / Java / Ruby reflex — "default arguments give each call a fresh value." In Python, the default expression is evaluated **once, at `def` time**, and the resulting object is reused on every call that doesn't provide the argument. So `Counter()` and `Counter()` get the *same* `items` list. `a.add(1)` mutates that shared list; `b.items` is the same list, now containing `[1]`.
>
> The fix is the `None`-sentinel pattern: `def __init__(self, items=None): self.items = items if items is not None else []`. **The mechanism behind this surprise is Python's `def`-time evaluation of function objects, which you'll meet again in Lesson 5 (closures) — same root cause, different surface.** For now: never use a mutable object as a default argument.

**b — `[1]` (the default `[]` is shared between instances):**
> Correct, and the surprise is on the right thing. `def __init__(self, items=[])` evaluates `[]` once at class-definition time and binds it as the default value of the `items` parameter. Every `Counter()` call that doesn't provide `items` receives that same list. `a.add(1)` mutates the shared list; `b.items` is the same list.
>
> The fix: `def __init__(self, items=None): self.items = items if items is not None else []`. Lesson 5 explains *why* Python evaluates defaults at `def` time — it's a consequence of how function objects are constructed, not a bug. The late-binding closure trap (lambdas in a loop) is the same mechanism on a different surface. Hold the surprise; the payoff lands then.

**c — `TypeError` (mutable defaults raise at definition time):**
> Python does **not** raise on mutable defaults — it just behaves surprisingly. Many linters (`ruff`, `pylint`) flag mutable defaults as a warning, but the interpreter is silent. **The silence is what makes this dangerous** — your test passes once, fails the second run, and you spend an afternoon staring at the code wondering what changed. This is the canonical Python footgun; calling it out by name (and never writing `def f(x=[])` again) is the entire defence.

**d — `None` (default is evaluated lazily and returns None):**
> Default values are evaluated at `def` time, not lazily per call. The expression `items=[]` creates a list right then and binds it as the parameter's default; subsequent calls reuse it. There's no laziness here — laziness would actually *prevent* this bug, because each call would re-evaluate `[]` and get a fresh empty list. Python's eager evaluation of defaults is the root of the trap.

---

## Step 1.3 — `kata` — class with `__init__` + `__repr__`

**Title:** `Build a Counter class with __init__ and __repr__`
**Type:** `kata`
**1-line task:** Implement a `Counter` class with `__init__(self, start: int = 0)` and `__repr__(self) -> str` that returns the form `"Counter(value=N)"`.
**Why this kata, not something more ambitious:** Lesson 1's job is calibration. A `Counter` with `__init__` and `__repr__` lands the syntax facts (indentation, `self`, dunder convention) without spending pedagogy budget on OOP design. Lessons 4-5 earn the real dunder depth. Per the spec's §7 partial-resolved item: the harness exposes `@_t(...)` syntax above the test body, which is the first decorator the learner sees in the scroll — a one-line note in the instruction below tells them how to read it.

### `instruction` (markdown body)

```markdown
## Your task

Build a small `Counter` class. The job is to land three facts at once: (1) how a Python class is defined, (2) how `__init__` reads, and (3) how `__repr__` lets you control what the REPL prints.

Implement:

- `Counter(start=0)` — constructs a counter whose initial value is `start` (default `0`).
- `repr(counter)` — returns the string `"Counter(value=N)"` where `N` is the counter's current value.

Use an **f-string** for `__repr__` — they're the modern way to interpolate in Python. You'll meet them at depth in Lesson 2.

### About the test code below

The test code uses `@_t("name")` to label each assertion. That `@` is a **decorator** — Lesson 5 explains what `@` does and how to write one. For now, just treat `@_t("name")` as a label: it runs the function below it, catches any exception, and records whether the test passed. You don't need to understand the syntax to read what the test asserts.

### What's expected

```python
c = Counter()
repr(c)               # "Counter(value=0)"

c = Counter(5)
repr(c)               # "Counter(value=5)"
```
```

### `starterCode`

```python
class Counter:
    def __init__(self, start: int = 0):
        # your code
        ...

    def __repr__(self) -> str:
        # your code
        ...
```

### `testCode` (manual harness — `_t` / `_eq` pattern per [python/python.md §5](python.md#5-sandbox-notes))

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


@_t("Counter() defaults to value=0")
def _():
    _eq(repr(Counter()), "Counter(value=0)")


@_t("Counter(5) reflects the passed value")
def _():
    _eq(repr(Counter(5)), "Counter(value=5)")


@_t("Counter(0) is explicit zero")
def _():
    _eq(repr(Counter(0)), "Counter(value=0)")


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### `hint` (sensei voice — does NOT name `f""` or `self.value` directly, per §2.4 hint discipline)

```markdown
Two things to land:

1. **In `__init__`**, you need to store the `start` value somewhere on the instance so `__repr__` can read it later. The convention is to assign it to an attribute of `self` — pick a name that reads cleanly when the constructor and the repr both refer to it.

2. **In `__repr__`**, you need to return a string in the form `"Counter(value=N)"` where `N` is whatever you stored in step 1. The string includes a literal value — meaning, the actual number, not a placeholder. Python has a modern interpolation syntax that lets you embed an expression directly inside a string with a prefix character. Use that.

`__repr__` is what gets called when you `repr(obj)` or when the Python REPL prints an unassigned expression. It should return a string that ideally looks like the constructor call — so a future reader sees `Counter(value=5)` in the logs and immediately knows how to reproduce.
```

### `referenceSolution` (not shown to learner; for QA against test cases)

```python
class Counter:
    def __init__(self, start: int = 0):
        self.value = start

    def __repr__(self) -> str:
        return f"Counter(value={self.value})"
```

### Why these tests, in this order

| Test | Lands |
|---|---|
| `Counter()` defaults to `value=0` | The default-argument path. (Distinct from the predict's `items=[]` trap because `0` is immutable.) |
| `Counter(5)` reflects the passed value | The non-default path — the parameter binding works. |
| `Counter(0)` is explicit zero | Catches an `or 0` shortcut in the solution that would conflate "not provided" with "provided as zero". The polyglot writing `self.value = start or 0` passes the first two tests and fails this one. |

---

## Self-review checkpoint (before commit)

- [x] Read step passes the paragraph test §2.1 (audit table above).
- [x] Predict feedback names the **specific** mental model behind each wrong answer. No generic "the right answer is B because…".
- [x] Predict explicitly hooks Lesson 5 (`def`-time evaluation as the shared mechanism). Lesson 5's closures recap carries the back-reference — both ends of the loop are written.
- [x] Kata instruction includes a short note explaining `@_t("name")` so the learner can read the test code without understanding decorators yet. Addresses the spec's §7 "partially resolved" item about harness-decorator-exposure-before-Lesson-5.
- [x] Hint passes §2.4 discipline: does NOT name `f"…"` or `self.value` directly. Points at "modern interpolation syntax with a prefix character" and "store on `self`".
- [x] No "Welcome to Python" preamble. No "indentation makes Python readable" cliché. No exhaustive dunder tour (only the five that earn the named-and-recognise step).
- [x] TS analogues for each dunder + the `self` first-parameter trick (Felipe's audience-review ask) — applied.
- [x] Anti-class beat for the Java-OOP reflex (Yui's audience-review ask) — applied as a full subsection with concrete anti-pattern / Pythonic pair.
- [x] Content in English; meta-notes in Spanish.
- [x] No figures embedded. The figures menu (`python.md` §2) doesn't propose one for Lesson 1; defaulting to none.

Pending until suite voice audit: tone calibration as a suite, possible cuts if the per-dunder analogue list reads dense at the four-persona reaction pass.

---

## Figure data spec

*None embedded in this lesson.* Lesson 1's figure landing is intentionally empty per the figures menu — the read step's job here is calibration, and a figure would compete with the dense prose rather than break a wall. If suite voice audit flags any subsection as too dense (the per-dunder TS/Java analogue list is the candidate), a `disambiguation` figure on "`self` in Python vs `this` in JS/Java/Ruby" or a `tabbed-card` on the five named dunders could land; data spec would go here.
