# Python — Lesson 4: Context managers

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-08
> **Spec:** [python.md §4 Lesson 4](python.md#lesson-4--context-managers) · [python/python.md §Lesson 4](python.md#lesson-4--context-managers)
> **Primary audience:** A1 Mariana (JS Senior) + A4 Felipe (TS Modernizer). Secondary: A3 Yui (Java Senior).
> **Step count:** 4 (1 `read` + 2 `kata` + 1 `playground`). No predict — the surprises here are about *writing* the protocol, not predicting output.
> **What changes in the learner's head:** "`with open(p) as f` is not 'syntactic sugar for try/finally' — it's the language's mechanism for resource acquisition, and it has a protocol (`__enter__` / `__exit__`) I can implement. `contextlib.contextmanager` turns a generator into one — same shape Lesson 5 unpacks as 'callable transforming callable'."
> **Kata order rationale (audience review 2026-06-08):** Mariana + Felipe both flagged that writing `__enter__` / `__exit__` from scratch felt like Lesson 5 territory dragged early. So 4.2 is the `@contextmanager` generator form (recognisable shape — JS/TS generators with a Python wrapper) and 4.3 is the class form (after the protocol's behaviour is concrete).

This file holds the **production prose** for each step's `instruction` / `feedback` / etc. fields. Content is in English; meta-notes in Spanish where helpful.

---

## Step 4.1 — `read` — "`with`: el shape para recursos"

**Title:** `with: the shape for resources`
**Type:** `read`
**Word count target:** ~400 (one of the two longer reads in the scroll — the mechanism behind the syntax IS the lesson here). Pythonic test §2.1 applied. Embeds the **primary `before-after` figure per the figures menu** (`try/finally + close()` vs `with open(p) as f:`).

### `instruction` (markdown body)

```markdown
## Why this matters

Every non-trivial Python codebase opens files, acquires locks, manages database connections, redirects stdout. **`with` is the shape Python provides for all of these.** Reading `with engine.connect() as conn:` without knowing the protocol means guessing what it does. And not being able to *write* one means you eventually invent worse shapes (a wrapper function, a context dict, a `__del__` finaliser you shouldn't trust) for problems `with` solves cleanly.

## The `with` block syntax

```python
with expr as name:
    # block runs here; `name` is what `expr.__enter__()` returned
    ...
# block exited (with or without exception); expr.__exit__(...) ran
```

`expr` evaluates to a **context manager** — an object with `__enter__` and `__exit__` dunders. `__enter__` runs first; its return value is bound to `name`. The block executes. `__exit__` runs, **regardless of whether the block raised**.

## Why this exists

Acquired resources need release. `try / finally` works but is verbose and easy to skip — and acquired-outside-the-block resources leak when humans forget the cleanup.

:figure[before-after]{id="try-finally-vs-with"}

The figure above is the contrast in one glance: the four-line `try/finally` pattern on the left (acquired-outside-the-block, manual cleanup, easy to forget the `close`) vs the three-line `with` on the right (acquired *inside* the `as` clause, cleanup implicit, lifetime visually scoped to the block). **Same outcome, opposite discipline.** The polyglot's reflex from C, Java pre-`try-with-resources`, or hand-rolled JS is the left column; the Pythonic answer is the right.

## The protocol — `__enter__` / `__exit__`

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

- **`__enter__(self)`** runs when the `with` block starts. Its return value is what `as name` binds.
- **`__exit__(self, exc_type, exc_val, exc_tb)`** runs when the block exits. If the block raised, the three args carry the exception info; if not, all three are `None`. **Returning truthy from `__exit__` swallows the exception**; returning `None` (the default) lets it propagate. **Default to returning `None`** unless you have a specific reason to swallow — silent exception-swallowing is a maintenance nightmare.

## `contextlib.contextmanager` — the shortcut

Writing the class is verbose. The stdlib gives you a decorator that turns a generator into a context manager:

```python
from contextlib import contextmanager

@contextmanager
def file_opener(path):
    f = open(path)
    try:
        yield f                # everything before yield = __enter__
    finally:
        f.close()              # everything after yield = __exit__
```

The function **yields exactly once**. Before the `yield` is `__enter__`; the yielded value is bound to `as name`; after the `yield` is `__exit__`. The `try / finally` around the yield ensures cleanup runs even when the `with` block raises. **This is the shape Pythonic code reaches for first** — only drop to the class form when you need state across multiple `with` blocks, or you're implementing a context manager that's part of a larger class's surface (Lesson 4.3's `Capture` kata is the latter).

## The bridge to Lesson 5

`@contextmanager` is a decorator. A decorator is a function that takes a function and returns a new object — here, a context manager. Lesson 5 unpacks the decorator shape itself; for now, **recognise that `@contextmanager` and `@property` and `@dataclass` are all callable transformations applied at definition time.** The next lesson makes that family visible.

## Sandbox honesty

In production Python you'll see context managers around database connections (`with engine.connect() as conn:`), lock acquisition (`with self.lock:`), temporary-directory creation (`with tempfile.TemporaryDirectory() as d:`), stdout/stderr redirection (`with contextlib.redirect_stdout(buf):`). In this scroll, the katas use in-memory state and dicts because Piston is single-process and stateless — but **the protocol is identical regardless of what's being managed.** Once you write one, you can read them all.

Next: two katas. 4.2 writes a `@contextmanager` generator (the friendly shape). 4.3 writes the class form. Then a playground for `__enter__` / `__exit__` ordering under nested `with` and exceptions.
```

### Paragraph-test audit (Valentina §2.1 gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Do I need to learn this if I already know `try/finally`?" | KEEP |
| "The `with` block syntax" | "What does `with X as Y:` actually do step by step?" | KEEP |
| "Why this exists" | "Why not just write `try/finally` and call it a day?" | KEEP |
| `:figure[before-after]` + caption | The verbose-vs-Pythonic contrast at a glance; figure earns its place per §INTERACTIVITY-PATTERNS | KEEP (primary figure of this lesson per figures menu) |
| "The protocol — `__enter__` / `__exit__`" | "How would I write one if I needed to?" — and the swallowing rule the polyglot will otherwise discover by accident | KEEP |
| "`contextlib.contextmanager` — the shortcut" | "Do I always have to write a class for this?" — and "what's the generator-based form?" | KEEP |
| "The bridge to Lesson 5" | Forward reference that motivates the unification of L5 ("they're all the same shape") | KEEP |
| "Sandbox honesty" | "Will the kata be unrealistic because there's no real database?" — and "where will I see this pattern in real code?" | KEEP |

**What got cut:** `contextlib.ExitStack` (deep-dive material; useful but the polyglot won't hit it in their first year), async context managers (`__aenter__` / `__aexit__` — deferred to the asyncio scroll), the C++ RAII comparison (true but adds a paragraph for a one-language audience overlap), the history of PEP 343, every stdlib context manager (`suppress`, `redirect_stdout`, `nullcontext` — named in passing in "Sandbox honesty" without a tour).

---

## Step 4.2 — `kata` — `@contextmanager`-based `temp_state`

**Title:** `temp_state — a generator-based context manager`
**Type:** `kata`
**1-line task:** Write a generator-based context manager `temp_state(d, key, value)` that temporarily sets `d[key] = value` inside the `with` block and restores the original value (or removes the key) on exit.
**Order rationale:** comes before the class-form kata per the 2026-06-08 audience review — the `yield` + `try/finally` shape lands faster for the polyglot (JS/TS generator pattern wrapped in a Python decorator) than `__enter__` / `__exit__` from scratch.

### `instruction` (markdown body)

```markdown
## Your task

Write `temp_state(d, key, value)` — a context manager that:

1. Sets `d[key] = value` when the `with` block starts.
2. Restores the **original** value when the block exits — *or removes the key entirely if it wasn't there before*.
3. Restores correctly **even if the block raises an exception**.

Use the `@contextmanager` decorator from `contextlib`. The function yields exactly once.

### What's expected

```python
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
```

### The yield-once contract

`@contextmanager` requires **exactly one** `yield` in the function body. The code before it runs on `__enter__`; the yielded value is what gets bound to `as name`; the code after runs on `__exit__`. Wrap the body in `try / finally` so the cleanup runs even when the `with` block raises.
```

### `starterCode`

```python
from contextlib import contextmanager


@contextmanager
def temp_state(d: dict, key, value):
    # your code (yield once)
    ...
```

### `testCode`

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


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### `hint`

```markdown
The shape is:

```
@contextmanager
def temp_state(d, key, value):
    # 1. Remember whether the key existed (and if so, its old value).
    # 2. Set d[key] = value.
    # 3. yield
    # 4. Restore: if the key existed before, put the old value back; else delete it.
```

To pass the "restores even when the block raises" test, wrap the `yield` in `try / finally` so the restore step (4) runs regardless of whether the block exits cleanly.

Two specific traps:

- **Don't use `try / except`** — you don't want to catch the exception, you want the cleanup to run *and* the exception to propagate. `try / finally` does that.
- **Don't `del d[key]` unconditionally on exit.** The key may have legitimately existed before you set it; in that case you restore the original value, not delete it. Track the pre-existence with a sentinel (`MISSING = object()` is the standard pattern) or with `key in d` checked once at the start.
```

### `referenceSolution`

```python
from contextlib import contextmanager

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
            d[key] = sentinel
```

### Why these tests

| Test | Lands |
|---|---|
| Sets value inside the block | Base case — `__enter__` ran. |
| Restores original after the block | Base case — `__exit__` ran on normal exit. |
| Removes key when it did not pre-exist | The "track pre-existence" trap — `del` is correct here, `d[key] = None` is wrong. |
| Restores even when the block raises | The `try / finally` discipline — `try / except` would swallow the raise. |
| Removes key on raise when not pre-existing | Combines the previous two; catches solutions that only `try / finally` over the *restore-to-old-value* path. |

---

## Step 4.3 — `kata` — `class Capture` (context manager that records calls)

**Title:** `Capture — context manager as a class`
**Type:** `kata`
**1-line task:** Implement a `Capture` class as a context manager that records calls into a list. On `__enter__`, return `self`; on `__exit__`, do nothing special. Inside the `with` block, calls to `c.record(value)` append to `c.recorded`.

### `instruction` (markdown body)

```markdown
## Your task

Implement `Capture` as a class with `__enter__` and `__exit__`. The class also has a `record(value)` method that appends to an instance list.

The shape is the same `__enter__` / `__exit__` protocol Step 4.2's `@contextmanager` desugared into — written as a class instead of a generator. Two reasons to reach for the class form (vs `@contextmanager`):

1. **You need methods on the object** the `with` block binds. `c.record(value)` is a method call on `c`; a generator-based context manager can yield values, not callable surfaces.
2. **You need state across multiple entries** of the same context manager. A class instance preserves its `recorded` list between `with` blocks; a generator function rebuilds state every call.

### What's expected

```python
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
```

### `__enter__` returns what `as name` binds

If you want the block to call methods on the context manager itself, **return `self` from `__enter__`**. (If you returned, say, `self.recorded`, then `c` in `with Capture() as c:` would be the list, not the instance, and `c.record(1)` would fail.)

### `__exit__` does nothing special for this kata

`__exit__` is called even if the block raises; for this kata you don't need to handle the exception — just return `None` (or omit the return, same thing). Returning truthy from `__exit__` would *suppress* the exception, which is almost never what you want and definitely not what this kata wants.
```

### `starterCode`

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

### `testCode`

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


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### `hint`

```markdown
Four pieces:

1. **`__init__`** initialises `self.recorded` to an empty list.
2. **`__enter__`** returns the value the `with ... as name:` clause should bind. Read the third test if you're stuck on what to return.
3. **`__exit__`** has nothing meaningful to do for this kata. The signature has three exception parameters; you don't need to inspect them. Return value of `None` (or no explicit return) lets exceptions propagate, which is what the last test expects.
4. **`record(self, value)`** appends to `self.recorded`.

The two methods together are the same `__enter__` / `__exit__` shape `@contextmanager` desugared into in 4.2 — written as a class because we need a method (`record`) on the object the block binds, which a generator can't provide.
```

### `referenceSolution`

```python
class Capture:
    def __init__(self):
        self.recorded: list = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        return None  # let exceptions propagate

    def record(self, value):
        self.recorded.append(value)
```

### Why these tests

| Test | Lands |
|---|---|
| Records calls inside the block | Base case — `record` appends, `recorded` survives. |
| `__enter__` returns the instance | Catches solutions that return `self.recorded` or `None` from `__enter__`. |
| `recorded` starts empty | Catches an `__init__` that forgets the list (or initialises with `...` placeholder). |
| Same instance appends across blocks | Validates the "state survives across `with`s" rationale named in the instruction. |
| Does not suppress exceptions | Catches `return True` in `__exit__` (which would silently swallow the `RuntimeError`). |

---

## Step 4.4 — `playground` — "`__enter__` / `__exit__` ordering"

**Title:** `Playground: __enter__ / __exit__ ordering under nesting and exceptions`
**Type:** `kata` (with `data.kind: "playground"` — no verdict UI, button reads "Ejecutar")
**Mental model under exploration:** nesting order, exception propagation through the protocol, the swallow-by-returning-True behaviour.

### `instruction` (markdown body)

```markdown
## Play around

This step is a **playground**, not a kata. The runner button executes whatever you write and shows the output; the harness runs a trivially-true assertion so the backend stays uniform.

The starter code below defines a `Tracer` context manager that prints on `__enter__` and `__exit__`, then nests two of them inside a `with`. Run it as-is to see the order; then vary it.

Specific things worth trying:

- **What's the print order if no exception is raised?** The `__enter__` lines go top-down (outer, then inner); the `__exit__` lines go bottom-up (inner first, then outer). Confirm by reading the output.
- **What changes if you `raise RuntimeError("boom")` inside the inner `with`?** Both `__exit__` methods still run. The `exc_type` arg they receive is no longer `None`.
- **What happens if the inner `__exit__` returns `True`?** Truthy from `__exit__` **swallows** the exception. The outer `__exit__` then runs with `exc_type=None` because the exception is considered handled.
- **What if you wrap the outer `with` in a `try / except`?** If neither `__exit__` returns `True`, the exception propagates out to the `try` and you catch it. If the inner does return `True`, the `try` never sees the exception.

This step prints to the console because it's a playground — the runner shows stdout instead of test verdicts. In `kata` steps the harness captures `print` output so it doesn't drown the assertions; here it's the whole point.
```

### `starterCode`

```python
class Tracer:
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
```

### `testCode`

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


@_t("explored")
def _():
    _eq(True, True)


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### Hint (Maya §2.3 voice contract — specific variations, not "explorá libremente")

```markdown
Three deliberate experiments:

1. **Raise inside the inner block.** Add `raise RuntimeError("boom")` after `print("inside both")`. Wrap the outer `with` in `try / except RuntimeError: pass` so the program doesn't crash. Run. Both `__exit__` lines print, with `exc_type=RuntimeError`. The exception then propagates to the `try`, where you catch it.

2. **Swallow at the inner level.** Change inner `Tracer`'s `__exit__` to `return True` instead of `return None`. Re-run the previous experiment. The inner `__exit__` still prints with `exc_type=RuntimeError`; the outer `__exit__` then prints with `exc_type=None` (exception already handled); the `try / except` *does not* catch anything. **This is why `return True` from `__exit__` is dangerous** — exceptions disappear silently from layers above.

3. **Three-deep nesting.** Add a third `with Tracer("inmost"):` inside. Print order is: enter outer, enter inner, enter inmost, [block], exit inmost, exit inner, exit outer. The protocol scales — `with` is LIFO.
```

---

## Self-review checkpoint (before commit)

- [x] Read step passes the paragraph test §2.1 (audit table above).
- [x] Primary `before-after` figure per the figures menu is embedded (`try-finally-vs-with`) — the verbose pre-Python pattern on the left, the Pythonic `with` on the right. Data spec in §"Figure data spec" below.
- [x] Kata order swap (4.2 = `@contextmanager`, 4.3 = `class Capture`) per the 2026-06-08 audience review — generator shape first, class shape second. Each kata's instruction explicitly references the other to make the unification (`with` ⇔ class form ⇔ generator-with-yield) clear.
- [x] Hint discipline §2.4: `temp_state` hint does NOT name `dict.get` or `del d[key]` directly — points at "track pre-existence with a sentinel" and walks the trap shape. `Capture` hint does NOT name `self` or `append` — points at "return the value the `with ... as name:` clause should bind."
- [x] Playground voice contract §2.3: instruction and hint list specific things to try (raise inside, swallow with `True`, three-deep nesting), not "explorá libremente." Maya's veto avoided.
- [x] Playground instruction carries the print-routing note (Maya §7 resolved item) so the learner who copies the pattern into a kata understands why their `print` vanishes.
- [x] `__exit__`-returns-`True` warning surfaces explicitly in both the read step ("default to returning `None`") and the playground experiments ("**this is why `return True` from `__exit__` is dangerous**"). The polyglot doesn't have to discover this by accident.
- [x] Forward bridge to Lesson 5 named explicitly: `@contextmanager` is a decorator → L5 unpacks the family.
- [x] No "Welcome to context managers" preamble. No `ExitStack` tour. No `__aenter__` / `__aexit__`. No RAII comparison.
- [x] Content in English; meta-notes in Spanish.

Pending until suite voice audit: tone calibration as a suite. The read step at ~400 words is on the high end (matches the spec's target — L4 and L5 push to 350-400 per the outer's "Step density" notes). If suite review flags density, the `__enter__` / `__exit__` returning-truthy paragraph is the candidate for trimming (it's the most "rule, not idiom" content).

---

## Figure data spec

The step prose above embeds `:figure[before-after]{id="try-finally-vs-with"}`. Data:

### `try-finally-vs-with` (`before-after`) — embedded in Step 4.1

- **Slot:** after the "Why this exists" paragraph, before "The protocol — `__enter__` / `__exit__`".
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ```ts
  {
    type: 'before-after',
    id: 'try-finally-vs-with',
    language: 'python',
    left: {
      title: 'pre-with reflex',
      code: 'f = open(path)\ntry:\n    data = f.read()\n    process(data)\nfinally:\n    f.close()',
      annotations: [
        { line: 1, mark: '✕', text: 'acquired outside the block it lives in' },
        { line: 6, mark: '✕', text: 'easy to forget; no enforced cleanup' },
      ],
    },
    right: {
      title: 'Python idiom',
      code: 'with open(path) as f:\n    data = f.read()\n    process(data)',
      annotations: [
        { line: 1, mark: '✓', text: 'lifetime visually scoped to the block' },
        { line: 3, mark: '✓', text: '__exit__ runs even on exception' },
      ],
    },
    caption:
      'Same outcome (file read, then closed), opposite discipline. The Pythonic with-block scopes the resource lifetime to the block visually and structurally — there is no "did I remember to call close()?" question to forget.',
  }
  ```
- **Why this earns embedding:** the prose has to describe in three sentences ("acquired resources need release / `try/finally` works but is verbose / `with` makes lifetime visually scoped") what the figure conveys in two stacked code panes with annotations. The polyglot's eye lands on the left first (the reflex they came from), the right (the answer), and the diff is immediately legible. Removing the figure forces three more sentences of comparative prose where two code panes do the work.
- **Authoring cost estimate:** ~10 minutes once the `BeforeAfter` renderer exists (it does — pre-existed in `apps/web/src/scrolls/figures/BeforeAfter.tsx` from S026).
