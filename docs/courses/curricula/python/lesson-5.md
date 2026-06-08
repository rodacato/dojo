# Python — Lesson 5: Decorators + closures

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-08
> **Spec:** [python.md §4 Lesson 5](python.md#lesson-5--decorators--closures) · [python/python.md §Lesson 5](python.md#lesson-5--decorators--closures)
> **Primary audience:** A1 Mariana (JS Senior) + A4 Felipe (TS Modernizer). Secondary: A3 Yui (Java Senior).
> **Step count:** 5 (2 `read` + 1 `predict` + 2 `kata`). *(Original draft had 4 with a single ~970-word 5.1 read; the suite voice audit 2026-06-08 measured the draft at ~970 words against the spec §7 600-word split threshold and applied the planned mitigation — split into 5.1a + 5.1b. Scroll total: 21 → 22.)*
> **What changes in the learner's head:** "A decorator is a function that takes a function and returns a function — `@d` is sugar for `f = d(f)`. Once I see that, `@property`, `@dataclass`, `@cache`, `@contextmanager` are all the same shape applied to different inputs. Closures capture *names*, not values — which is why `[lambda: i for i in range(3)]` doesn't do what I thought. And Python's class system has no dedicated lesson here on purpose — the closer explains why."

This file holds the **production prose** for each step's `instruction` / `feedback` / etc. fields. Content is in English; meta-notes in Spanish where helpful.

---

## Step 5.1a — `read` — "Closures y decorators: el mecanismo"

**Title:** `Closures and decorators: the mechanism`
**Type:** `read`
**Word count target:** ~500. Pythonic test §2.1 applied. **First half of the split** (the original 5.1 was ~970 words, past the spec §7 600-word threshold). 5.1a carries the load-bearing mechanics — closures recap with the late-binding example, the L1 mutable-default back-reference, the decorator definition, and the `functools.wraps` rule. The unification framing + figure + closers live in 5.1b.

### `instruction` (markdown body)

```markdown
## Why this matters

The polyglot will see `@retry`, `@cache`, `@app.route`, `@property`, `@dataclass`, `@contextmanager` in the first non-trivial Python file. Knowing what `@` actually does = readable code. **Not knowing = decorators feel like magic, you write code that decorates wrong (`functools.wraps` missing, three-layer onion confused), and the wrong code is slow to debug.** This lesson lands the mechanism, then lets the kata at 5.3 and 5.4 force you to write one.

## Closures recap — capture is by *name*, not by value

A function that references a variable from its enclosing scope captures that variable's **name binding**, not its current value. In Python this matters:

```python
fns = [lambda: i for i in range(3)]
[f() for f in fns]                    # [2, 2, 2], NOT [0, 1, 2]
```

Each lambda captures the *name* `i`, which by the time the lambdas are called has been bound to `2` (the last iteration). The standard fix is a default argument that captures the value at lambda-creation time:

```python
fns = [lambda i=i: i for i in range(3)]    # default arg = value snapshot
[f() for f in fns]                          # [0, 1, 2]
```

This is **the late-binding closure trap**, the canonical Python-closure surprise. The predict at 5.2 is exactly this snippet.

## Back-reference to Lesson 1's `Counter(items=[])` predict

The Lesson 1 predict planted a hook: `Counter(items=[])` shares the same list across instances. **Same family of bug, different surface.** The mechanism behind both is that **function objects are constructed once at `def` time** — defaults are evaluated and bound then (Lesson 1's trap); closure variables are name references *resolved* at call (this lesson's trap). The `def __init__(self, items=[])` reuses the same list across calls; the `lambda: i` resolves `i` whenever it runs. Two surfaces, one evaluation model. Naming the mechanism here closes the loop.

## What a decorator IS

A **callable that takes a callable and returns a callable.** `@d` is *sugar* for `f = d(f)`. Nothing more.

```python
def trace(fn):
    def wrapper(*args, **kwargs):
        print(f"calling {fn.__name__}")
        return fn(*args, **kwargs)
    return wrapper

@trace
def add(a, b):
    return a + b
# Exactly equivalent to: add = trace(add)
```

Calling `add(1, 2)` now goes through `wrapper(1, 2)`, which prints `"calling add"` then calls the original `add`. The `@trace` line is *syntax sugar*; what's executing is plain function-takes-function-returns-function.

## The `functools.wraps` rule

By default, the wrapper has its own `__name__` (`"wrapper"`), its own `__doc__` (`None`), its own `__module__`. That breaks introspection — `pytest` looks at `__name__`, `inspect.signature` looks at the function metadata, IDE tooltips read the docstring. The fix:

```python
from functools import wraps

def trace(fn):
    @wraps(fn)                          # copies fn's metadata onto wrapper
    def wrapper(*args, **kwargs):
        ...
    return wrapper
```

**Every decorator you write in production needs `@wraps(fn)`.** A decorator without it is broken — sometimes silently, sometimes loudly. The 5.3 kata's tests assert on `__name__`, so a missing `@wraps` is a visible failure.

## Single-arg decorator first, parametrised second

Before the three-layer onion below: the kata at 5.3 (`@trace`) walks the **single-arg** shape — function in, function out, plus `@wraps`. **That's the bridge.** Write the plain decorator first; add the parametrisation layer on top in 5.4. If 5.3 feels solid, 5.4's `@retry(times=N)` is just "wrap 5.3 in another function that takes the arg." If you find yourself confused inside 5.4, the gap is at 5.3, not at three-layer semantics.

## Decorators with arguments — the three-layer onion

```python
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
```

Three layers because: outer takes the decorator's arg (`3`); middle takes the function (`flaky`); inner is the wrapper that runs at call time. `@retry(3)` calls `retry(3)`, which returns `decorator`. `decorator` is then applied to `flaky` — `flaky = decorator(flaky)`. **This trips up every polyglot the first time they read it.** Once you see the shape, every parametrised decorator (`@app.route("/")`, `@pytest.fixture(scope="session")`, `@cache(maxsize=128)`) is the same pattern.

Next: the *reframe* — once you see the shape, four of Python's most-common decorators stop looking like four separate things. 5.1b makes that family visible.
```

### Paragraph-test audit (5.1a — Valentina §2.1 gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Is `@` worth learning if I'm just reading Python?" — answers yes, *and* names the failure mode if you don't | KEEP |
| "Closures recap" + late-binding example | "What does this loop-of-lambdas actually return?" — and primes the 5.2 predict | KEEP |
| Back-reference to L1 Counter trap | Closes the loop on the L1 predict's promise; names the shared mechanism (`def`-time evaluation) | KEEP (audience review 2026-06-08 confirmed one back-ref is enough) |
| "What a decorator IS" | "Why is there an `@` symbol? What does it do?" — the load-bearing definition | KEEP |
| "`functools.wraps`" | "Why does my decorated function show up as `wrapper` in tracebacks?" — and prevents the polyglot from writing every decorator without it | KEEP |
| "Single-arg first, parametrised second" | Bridge framing — promotes 5.3 as the friendly entry; defends against learners feeling lost at 5.4 | KEEP (audience review 2026-06-08) |
| "Three-layer onion" | "Why does `@retry(3)` have an extra layer of `def` inside `def`?" — load-bearing for 5.4 | KEEP |

**What got cut from 5.1a:** a tour of `functools` (out of scope; named-and-deferred lives in 5.1b's deferral list), the C-level implementation of decorators (deep-dive material), an extra worked example between `@trace`-shape and three-layer onion (covered by 5.3 kata, no need to pre-walk).

---

## Step 5.1b — `read` — "La familia: por qué `@property`, `@dataclass`, `@cache`, `@contextmanager` son la misma idea"

**Title:** `The family: why @property, @dataclass, @cache, @contextmanager are the same idea`
**Type:** `read`
**Word count target:** ~470. Pythonic test §2.1 applied. **Second half of the split** — the unification figure (Felipe's "visual money shot" per the 2026-06-08 audience review), the named-and-deferred list, and the Java-reflex closer (Yui's audience-review concern). Opens with the explicit L4 → L5 bridge sentence the inner spec §3 committed to (surfaced by the suite voice audit as a gap in the unsplit 5.1).

### `instruction` (markdown body)

```markdown
## Why this matters

5.1a landed the mechanics: `@d` is sugar for `f = d(f)`; `@wraps` rescues introspection; the three-layer onion gives parametrised decorators. **This step lands the reframe.** Once you see decorators as "callable transforming callable," four of Python's most-common decorators stop feeling like four separate things and start feeling like one shape applied four ways.

**Remember how `@contextmanager` turned a generator into a context manager in Lesson 4?** That's the same shape as a plain decorator — a callable transforming another callable. The decorator family is wider than `@contextmanager` and `@trace`, and the next subsection makes that visible across the four decorators you'll see most often in production Python.

## The unification — `@property`, `@dataclass`, `@cache`, `@contextmanager`

All four of these are *callables transforming callables (or classes)*. They differ only in what they take and what they return.

:figure[tabbed-card]{id="decorators-and-friends"}

The figure above is the same shape applied to four different decorators. Tab through them — every one is "callable in, callable (or transformed class) out," differing only in the *kind* of input and output. **Once you see this, Python's decorator surface stops feeling magical and starts feeling consistent.** The decorator shape is the language's primary "modify what a callable does at definition time" mechanism, and it earns the syntax sugar because it's used everywhere — production code, web framework routing, ORM column declarations, type-checking, caching.

## Named-and-deferred

Four topics this lesson **does not** teach, but that the polyglot will encounter:

- **The descriptor protocol** behind `@property` — `__get__`, `__set__`, `__delete__`. `@property` is "just" a descriptor; understanding the protocol is the depth `python-descriptors-and-protocols` (deep-dive) earns.
- **Metaclasses and `__init_subclass__`** — Tim Peters' rule: "if you have to ask, you don't need them." Named here so the polyglot recognises the words; depth in `python-descriptors-and-protocols`.
- **Async decorators and the event loop** — `async def`, `await`, `asyncio.run`, `TaskGroup`. All of this needs the event-loop model *before* the syntax; depth in `python-asyncio-deep`.
- **`functools.lru_cache` invalidation on methods** — `lru_cache`'s `cache_clear()` exists, but applied to a method it caches `self` and prevents garbage collection. Real production issue; depth in a future `python-functools-deep`.

You know they exist, roughly what shape they have, and where to find depth — that's enough to read idiomatic Python. When one of them bites you in production, you'll know which deep-dive to open.

## Closer (the Java-class question)

If you're coming from Java and noticed this scroll has no dedicated OOP lesson, **that's deliberate, not an omission.** Python's class system contributes two things to a polyglot the language doesn't already have:

1. **The protocol surface.** Lesson 1 named the five dunders; Lesson 4 wrote `__enter__` / `__exit__`; this lesson recognises `@property` / `@dataclass` / `@classmethod` as decorators applied to classes. That's how Python's classes earn their pages.
2. **The `@dataclass` "I just want a record" answer.** One decorator, zero boilerplate, get `__init__` / `__repr__` / `__eq__` / typed fields for free.

Everything else about classes — inheritance hierarchies, abstract base classes, descriptors at depth, `__slots__`, `__init_subclass__` as the lightweight metaclass alternative — lives in `python-descriptors-and-protocols`. **The polyglot reflex that produces `class TaskRunner: def run(self): ...` for a three-line script is the failure mode this scroll most actively defends against** (see Lesson 1's anti-class beat). Reach for a class when you have **state + behaviour that belong together**, or when you're implementing a protocol Python expects (a context manager, an iterator, a callable). Reach for a function otherwise. Reach for a `@dataclass` when the answer is "I want a typed record." That is the lens; the depth waits.

Next: a predict on the late-binding closure trap (the snippet from 5.1a's closures recap), then two katas — `@trace` (single-arg with `@wraps`), then `@retry(times=N)` (three-layer onion).
```

### Paragraph-test audit (5.1b — Valentina §2.1 gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" + L4 bridge sentence | "Why a second step? What changes between 5.1a and 5.1b?" — and lands the L4 → L5 explicit cross-reference inner spec §3 committed to | KEEP (audit-resolved gap from 2026-06-08) |
| "The unification" + `:figure[tabbed-card]` | The "they're all the same idea" reframe; figure makes it visible across four decorators | KEEP (Felipe's "visual money shot" per audience review) |
| "Named-and-deferred" | Four trapdoors the polyglot would otherwise discover by stumbling | KEEP |
| "Closer (the Java-class question)" | Yui's load-bearing question — "where is the OOP lesson?" — answered directly | KEEP (audience review 2026-06-08) |

**What got cut from 5.1b:** what a higher-order function is in functional programming theory (assumed), the C-level implementation of decorators (deep-dive material at most), `__call__` as the class-decorator variant (mentioned in passing in the unification figure tabs; not a paragraph), `@staticmethod` (rarely the right tool — usually a module-level function is correct, and Lesson 1's anti-class beat already framed why).

---

## Step 5.2 — `predict` — "¿Qué retornan estos tres lambdas?"

**Title:** `Predict: what does this loop-of-lambdas return?`
**Type:** `predict`
**Mental model under test:** Python closures capture *names*, not values. The lambda `lambda: i` doesn't snapshot `i` at lambda-creation time — it resolves `i` whenever the lambda runs, by which point the loop has bound `i` to its final value.

### `instruction` (short intro shown above the snippet)

```markdown
One predict on closure capture before the katas. This is the snippet the read step's closures recap warned about.
```

### `question`

```
What does this print?
```

### `snippet`

```python
fns = [lambda: i for i in range(3)]
print([f() for f in fns])
```

### `options`

```yaml
- id: a
  text: "`[0, 1, 2]`"
- id: b
  text: "`[2, 2, 2]`"
- id: c
  text: "`[None, None, None]` (lambdas don't capture)"
- id: d
  text: "`[0, 0, 0]` (lambdas capture initial value)"
correct: b
```

### `feedback` (per option, sensei voice)

**a — `[0, 1, 2]`:**
> The JS reflex from `let`-loop bindings. In modern JavaScript, `for (let i = 0; i < 3; i++)` creates a **new** `i` per iteration, so a closure inside the loop captures a distinct binding each time. In Python, `for i in range(3)` reuses the *same* `i` — there's one binding, rebound on each iteration. Each lambda captures the **name** `i`; by the time you call them, `i` is `2` (the last value the loop assigned). To get `[0, 1, 2]`, snapshot the value at lambda-creation time with a default arg: `[lambda i=i: i for i in range(3)]`.

**b — `[2, 2, 2]`:**
> Correct. **Late binding.** Python closures capture the *name binding*, not the value. All three lambdas reference the same `i`, which after the loop is `2`. The fix is `[lambda i=i: i for i in range(3)]` — the default argument is evaluated at lambda-creation time and binds the current value to the parameter `i`, which then shadows the loop variable inside the lambda body.
>
> **This is the canonical Python-closure trap** and the reason you'll see `lambda i=i:` patterns scattered through production code. It's the same `def`-time vs call-time evaluation model behind Lesson 1's `Counter(items=[])` mutable-default trap — different surface, same mechanism.

**c — `[None, None, None]` (lambdas don't capture):**
> Lambdas **do** capture — they capture the enclosing scope's name bindings, exactly like nested `def` functions. `[None, None, None]` would require the lambdas to return nothing, which they don't (they return `i`). The lambda mechanism isn't the trap; the trap is *what gets captured* (name, not value).

**d — `[0, 0, 0]` (lambdas capture initial value):**
> Closures capture **references**, not snapshots. The "capture initial value" model is what `lambda i=i:` simulates explicitly via default-argument evaluation at lambda-creation time — but without that pattern, the lambda holds a reference to the same `i` that the loop is rebinding. After the loop, `i` is `2`, and all three lambdas read `2`.

---

## Step 5.3 — `kata` — `@trace` (single-arg decorator with `@wraps`)

**Title:** `@trace — a single-arg decorator with @wraps`
**Type:** `kata`
**1-line task:** Write a `trace(fn)` decorator that records each call's `(args, kwargs, return_value)` in a list `trace.calls`. Forces both the decorator shape AND `functools.wraps`.

### `instruction` (markdown body)

```markdown
## Your task

Write a decorator `trace` that wraps any function and records each call into a list `trace.calls`. The tuple shape is `(args, kwargs, return_value)`.

**Two requirements:**

1. The wrapped function must work normally — calling `add(1, 2)` returns `3`, plus a record gets appended to `trace.calls`.
2. The wrapped function's `__name__` must be preserved — `add.__name__` is `"add"`, not `"wrapper"`. The stdlib has a decorator for this — see the hint.

### What's expected

```python
trace.calls = []

@trace
def add(a, b):
    return a + b

add(1, 2)               # returns 3, appends ((1, 2), {}, 3) to trace.calls
add(3, 4)               # returns 7, appends ((3, 4), {}, 7)
assert trace.calls == [((1, 2), {}, 3), ((3, 4), {}, 7)]
assert add.__name__ == "add"      # @wraps preserved the name
```

### About `trace.calls`

`trace.calls` is a list attached to the `trace` function itself — `trace.calls = []` *outside* the function. Functions are objects in Python (a fact this lesson is built around); they can carry attributes. The decorator's wrapper appends to `trace.calls` on every call.
```

### `starterCode`

```python
from functools import wraps


def trace(fn):
    # your code — return a wrapper that records each call into trace.calls,
    # and preserve fn's metadata onto the wrapper.
    ...


trace.calls = []
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


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### `hint`

```markdown
The decorator's shape:

```
def trace(fn):
    @<the stdlib decorator that copies metadata>(fn)
    def wrapper(*args, **kwargs):
        result = <call the original function with the args>
        <append the tuple (args, kwargs, result) to the list>
        return result
    return wrapper
```

Three specific things to land:

1. **Forward `*args` and `**kwargs`** so the wrapper accepts any call shape — single positional, kwargs only, mix.
2. **Record before returning.** Compute `result` first, then append `(args, kwargs, result)` to `trace.calls`, then return. If you append before the call, you don't have the result yet; if you `return` before appending, the record never lands.
3. **Use the stdlib decorator that copies metadata.** It lives in `functools`. The third test (`__name__`) is what catches you if you skipped it — the wrapper's name without it is `"wrapper"`.
```

### `referenceSolution`

```python
from functools import wraps


def trace(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        result = fn(*args, **kwargs)
        trace.calls.append((args, kwargs, result))
        return result
    return wrapper


trace.calls = []
```

### Why these tests

| Test | Lands |
|---|---|
| Wrapped function returns same value | Base case — the wrapper forwards args and returns the result. |
| Each call appends to `trace.calls` | The side effect — the wrapper records. |
| `@wraps` preserves `__name__` | The `@wraps` discipline — without it, this test fails with `"wrapper"`. |
| Kwargs are recorded correctly | Catches a wrapper that forgot `**kwargs` in its signature. |

---

## Step 5.4 — `kata` — `@retry(times=N)` parametrised decorator

**Title:** `@retry(times=N) — the three-layer onion`
**Type:** `kata`
**1-line task:** Write a `retry(times)` decorator factory that retries the wrapped function up to `times` times on any exception, returning the result of the first success. After `times` failures, re-raise the last exception. Forces the three-layer onion.

### `instruction` (markdown body)

```markdown
## Your task

Write `retry(times=N)` — a parametrised decorator that wraps a function and retries it up to `N` times if it raises. On the first success, return the result. After `N` failures, re-raise the last exception.

This is the **three-layer onion** the 5.1 read step described:

- **Outer:** takes the decorator's argument (`times`).
- **Middle:** takes the function. This is the actual decorator.
- **Inner:** the wrapper that runs at call time, retrying the function.

If 5.3 felt solid, this is **5.3 wrapped in one more layer** that takes `times`. If 5.4 feels confusing, the gap is at 5.3 — go back, make sure the single-arg shape is locked in, then return.

### What's expected

```python
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
```

### Re-raise discipline

After exhausting `times` attempts, **re-raise the last exception** — don't silently return `None`, don't return a sentinel, don't swallow. The caller asked for the result; if there isn't one, they need to know why. Use bare `raise` (no argument) inside the `except` to re-raise the exception just caught — Python preserves the original traceback.

### Preserve `__name__` with `@wraps`

Same rule as 5.3 — wrap the innermost wrapper with `@wraps(fn)`. The tests assert on `__name__`.
```

### `starterCode`

```python
from functools import wraps


def retry(times: int):
    # your code — three layers:
    #   outer: takes times
    #   middle: takes fn (this is the decorator)
    #   inner: the wrapper that runs at call time
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


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### `hint`

```markdown
The shape, with the three layers labelled:

```
def retry(times):              # OUTER — receives the decorator's arg
    def decorator(fn):          # MIDDLE — receives the function (THIS is the decorator)
        @<stdlib-metadata-copier>(fn)
        def wrapper(*args, **kw):    # INNER — runs at call time
            <try the function up to `times` times>
            <on success: return the result>
            <on failure: re-raise the last exception>
        return wrapper
    return decorator
```

Two specific traps:

1. **Where does `times` live?** It's a parameter of the OUTER function. The INNER wrapper references it via closure. If you wrote it as two layers (just `decorator` + `wrapper`), `times` has no scope. The third layer (outer) exists *because* the decorator needs to take an argument.

2. **The retry loop.** A `for _ in range(times)` loop with `try: return fn(*args, **kw) except Exception: continue` covers the retry-and-return-on-success path. After the loop exits without a return, you've exhausted attempts — `raise` (bare, no argument) re-raises the last caught exception. Python remembers it.
```

### `referenceSolution`

```python
from functools import wraps


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
    return decorator
```

### Why these tests

| Test | Lands |
|---|---|
| Retries up to N times and returns on first success | Base case — the retry loop and the early-return-on-success. |
| Succeeds on first attempt does not retry | Catches a solution that always loops `times` times regardless of success. |
| Re-raises after exhausting | The `raise` discipline — silent failure is the anti-pattern. |
| `times=1` means one attempt total | Catches an off-by-one (e.g. `range(times + 1)` or `while attempts <= times`). |
| `@wraps` preserves `__name__` | Same rule as 5.3 — the discipline carries across both katas. |

---

## Self-review checkpoint (before commit)

- [x] Read step passes the paragraph test §2.1 (audit table above). At ~450 words it is **the densest read in the scroll** — flagged as `◐ partially resolved` in the spec's §7 with the "split into 5.1a/5.1b if it bloats past 600 words at draft" mitigation. The current draft lands at the upper end of the target band; suite voice audit will confirm whether the split is needed.
- [x] Back-reference to Lesson 1's `Counter(items=[])` predict is explicit and names the shared `def`-time-evaluation mechanism. Closes the L1 hook — both ends of the loop are now written across `lesson-1.md` (the predict feedback hints "you'll see why in Lesson 5") and this lesson (the back-reference subsection).
- [x] Single-arg-decorator-first / parametrised-second bridge framing is present, explicitly naming 5.3 as the bridge before 5.4. Maya §7 "Lesson 5 step 5.1 density risk" mitigation — the bridge framing reduces 5.4's perceived difficulty for the reader who's already done 5.3.
- [x] The unification subsection embeds the `tabbed-card` figure that Felipe explicitly asked for in the audience review ("the visual money shot"). Figure data spec in §"Figure data spec" below.
- [x] **Java-reflex closer (audience review addition for Yui)** present at the end of the read, addressing the "where is the OOP lesson?" question directly. References Lesson 1's anti-class beat and the `python-descriptors-and-protocols` deep-dive.
- [x] Predict feedback names the specific JS / closure-mechanism misconception each wrong option encodes — not generic "the right answer is B."
- [x] Hint discipline §2.4: `@trace` hint does NOT name `functools.wraps` directly — points at "the stdlib decorator that copies metadata." `@retry` hint walks the three layers via comments without giving the closure-on-`times` away.
- [x] Both katas test `__name__` preservation explicitly — the `@wraps` discipline lands in tests, not in advice.
- [x] No "Welcome to decorators" preamble. No tour of `functools`. No C-level implementation. No `__call__`-as-decorator side quest (mentioned implicitly via `@dataclass` in the unification figure, not as its own paragraph).
- [x] Content in English; meta-notes in Spanish.

Pending until suite voice audit: confirm whether 5.1 needs the 5.1a/5.1b split. If the audit signals YES, the natural split point is between "Three-layer onion" and "The unification" — the first half is the mechanics, the second half is the recognition + closer.

---

## Figure data spec

The step prose above embeds `:figure[tabbed-card]{id="decorators-and-friends"}`. Data:

### `decorators-and-friends` (`tabbed-card`) — embedded in Step 5.1

- **Slot:** inside the "The unification" subsection, immediately after the claim "all five of the decorators listed above are *callables transforming callables (or classes)*."
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ```ts
  {
    type: 'tabbed-card',
    id: 'decorators-and-friends',
    tabs: [
      {
        label: '@property',
        body:
          'Takes a **method**, returns a **descriptor** that makes the method ' +
          'accessible as an attribute.\n\n' +
          '```python\nclass Box:\n    @property\n    def area(self):\n        ' +
          'return self.w * self.h\n\nBox(2, 3).area    # 6 — no parens\n```\n\n' +
          'Input: method. Output: attribute-like accessor.',
      },
      {
        label: '@dataclass',
        body:
          'Takes a **class**, returns a **transformed class** with ' +
          '`__init__` / `__repr__` / `__eq__` synthesised from the typed attributes.\n\n' +
          '```python\n@dataclass\nclass Point:\n    x: int\n    y: int\n\n' +
          'Point(1, 2) == Point(1, 2)    # True — __eq__ for free\n```\n\n' +
          'Input: class. Output: class with synthesised dunders.',
      },
      {
        label: '@cache',
        body:
          'Takes a **function**, returns a **wrapped function** that caches ' +
          'results keyed by the call args.\n\n' +
          '```python\nfrom functools import cache\n\n@cache\ndef fib(n):\n    ' +
          'return n if n < 2 else fib(n-1) + fib(n-2)\n\nfib(100)    # fast — ' +
          'cached subcalls\n```\n\n' +
          'Input: function. Output: memoised function.',
      },
      {
        label: '@contextmanager',
        body:
          'Takes a **generator function** (one that `yield`s exactly once), ' +
          'returns a **context manager** usable with `with`.\n\n' +
          '```python\n@contextmanager\ndef temp_state(d, k, v):\n    old = ' +
          'd.get(k)\n    d[k] = v\n    try:\n        yield\n    finally:\n        ' +
          'd[k] = old\n```\n\n' +
          'Input: generator function. Output: context manager.',
      },
    ],
    defaultTab: 0,
    caption:
      'Four decorators, same shape: a callable transforming another callable (or class) at definition time. The input and output kinds differ; the syntax sugar — @name — is identical. Once you see this, every @decorator in Python is one of these patterns or a small composition of them.',
  }
  ```
- **Why this earns embedding:** the prose makes the unification claim in two sentences ("all five … are *callables transforming callables*"). The figure *demonstrates* it across four cases. **Felipe's audience-review reaction:** "the `@property` / `@dataclass` / `@cache` unification figure would be the visual money shot." That's not faint praise — it's the persona saying "this is what makes the lesson click for me." Embedding earns its place specifically because it converts an abstract claim into a comparison the reader can tab through.
- **Authoring cost estimate:** ~15 minutes once the `TabbedCard` renderer exists (it does — shipped in commit `2997d9b` during S027 W1).
- **Tab body markdown:** the renderer uses the shared `markdownToInnerHtml` util from `apps/web/src/scrolls/figures/markdown.ts`. Each tab's body supports `**bold**`, `` `code` ``, and fenced code blocks — the schema above takes advantage of all three.
