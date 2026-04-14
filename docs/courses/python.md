# Python Course Track

> Maintainer persona: S7 Nadia Petrov (Python educator) + S5 Dr. Elif Yıldız (curriculum architect)
> Last researched: 2026-04-14

---

## 1. Learning Philosophy for Python

Python is the rare language where the official tutorial is good enough that most learners *think* they know the language after reading it. They don't. They know the syntax. The actual job of a Python course on Dojo is to drag the learner from "I can write a `for` loop" to "I can read a `collections.abc` source file and not panic" — and to do that without burying them in jargon or pretending that `__metaclass__` is a beginner topic. The "batteries included" stdlib is the pedagogical core: every exercise that can be solved with `itertools`, `collections`, `functools`, `dataclasses`, `pathlib`, or `contextlib` *should* be, because the stdlib is the idiom dictionary. A learner who finishes our track should reach for `Counter` before `dict.get(k, 0) + 1`, and for a context manager before `try/finally`.

Idioms we reinforce explicitly: **EAFP over LBYL** (try the operation, catch the exception — it's faster and more honest about Python's duck typing), **comprehensions over `map`/`filter` chains** (with a hard exception for generator expressions in pipelines), **context managers for any acquired resource**, **dunder methods as the protocol surface** (an object *is* what its dunders say it is), and **type hints introduced gradually but never abandoned**. We treat type hints the way Brett Slatkin does in *Effective Python*: optional in the first lessons, mandatory by the OOP course, treated as documentation-with-teeth by the testing course.

Dead ends to avoid: **don't teach OOP before functions feel natural** — a learner who reaches for a class to add two numbers has been mis-taught. **Don't teach `asyncio` before sync Python is solid** — async is a concurrency model, not a syntax flourish, and learners who meet `async def` before they understand the event loop will cargo-cult `await` everywhere. **Don't teach metaclasses early, or at all unless the learner asks** — Python's most quoted aphorism on the topic ("if you have to ask, you don't need them" — Tim Peters) is correct. **Don't conflate `==` with `is`**, and don't let the learner walk away thinking mutable default arguments are a "fun gotcha"; they're a consequence of how function objects are constructed, and we teach the *why*.

Finally, Python is taught poorly when it's taught as "the easy first language." Our voice assumes the learner is already a developer (Dojo's audience). We skip the "what is a variable" explanations and we don't apologize for using terms like *callable*, *iterable*, *protocol*, or *descriptor* once they've been defined. The track's intentional friction: every sub-course ends with a challenge step that is harder than the lessons preceding it. If the learner finishes without struggling, we built the course wrong.

---

## 2. Course Tree Overview

| Course | Level | Prereqs | Steps (approx) | Status |
|---|---|---|---|---|
| python-fundamentals | Basic | — | ~18 | proposed |
| python-idioms-data-structures | Intermediate | python-fundamentals | ~16 | proposed |
| python-oop-dunders | Intermediate | python-fundamentals | ~17 | proposed |
| python-testing-packaging | Intermediate | python-oop-dunders | ~15 | proposed |
| python-async | Advanced | python-idioms-data-structures | ~14 | proposed |
| python-decorators-metaprogramming | Advanced / Specific | python-oop-dunders | ~16 | proposed |
| python-type-hints-in-practice | Specific / Intermediate | python-oop-dunders | ~12 | proposed (optional Phase 2) |
| python-concurrency-decision-guide | Specific / Advanced | python-async | ~10 | proposed (optional Phase 2) |

Total proposed: 6 core sub-courses + 2 optional deep-dives. ~118 steps across the core six.

---

## 3. Sub-courses

### 3.1 Python Fundamentals — Basic

**Slug:** `python-fundamentals`
**Prereqs:** none (assumes general programming literacy — variables, loops, functions in *some* language)
**Learner time:** ~6 hours
**Learning outcomes:**
- Read and write idiomatic Python 3.11+ for control flow, collections, and string manipulation.
- Choose the right built-in collection (`list`, `tuple`, `dict`, `set`) for a given problem.
- Use truthy/falsy semantics, slicing, and unpacking without surprise.
- Write small pure functions with type hints and docstrings.
- Handle errors with `try/except/else/finally` using the EAFP mindset.

**Lesson 1: Values, types, and the REPL mindset**
- Step 1 (explanation): Python is dynamically typed but strongly typed — `1 + "2"` raises, doesn't coerce. The interactive model.
- Step 2 (exercise): Implement `is_odd(n: int) -> bool` so the test calls it across a range. Test shape: `unittest.TestCase` with `assertEqual`.
- Step 3 (exercise): Implement `to_fahrenheit(c: float) -> float` rounded to 2 decimals.

**Lesson 2: Strings as a first-class data type**
- Step 1 (explanation): Immutability, f-strings, `.split/.join/.strip`, why string concatenation in a loop is a smell.
- Step 2 (exercise): `normalize_name(s: str) -> str` — strip, collapse internal whitespace, title-case.
- Step 3 (exercise): `count_vowels(s: str) -> int` using a generator expression and `sum`.
- Step 4 (challenge): `is_palindrome(s: str) -> bool` ignoring case and non-alphanumeric characters.

**Lesson 3: Lists, tuples, and slicing**
- Step 1 (explanation): When tuples, when lists, what slicing actually does (creates a new list), negative indices.
- Step 2 (exercise): `chunks(xs: list, n: int) -> list[list]` returning consecutive n-sized slices.
- Step 3 (exercise): `rotate(xs: list, k: int) -> list` — rotate left by k positions.

**Lesson 4: Dicts and sets**
- Step 1 (explanation): Hash semantics, why dict keys must be hashable, set algebra.
- Step 2 (exercise): `word_count(text: str) -> dict[str, int]` (no `Counter` yet — that's Lesson 2 of next course).
- Step 3 (exercise): `unique_preserving_order(xs: list) -> list` using a set as a seen-tracker.

**Lesson 5: Functions, defaults, and the mutable-default trap**
- Step 1 (explanation): Positional vs. keyword args, `*args`/`**kwargs`, default evaluation timing.
- Step 2 (exercise): Write `add_item(item, basket=None)` correctly (sentinel pattern).
- Step 3 (challenge): A failing test reveals a buggy `accumulate(x, history=[])` — the learner must fix it.

**Lesson 6: Errors, EAFP, and control flow**
- Step 1 (explanation): EAFP vs. LBYL with a concrete benchmark in prose. `try/except/else/finally`.
- Step 2 (exercise): `safe_div(a, b) -> float | None` — return `None` on `ZeroDivisionError`.
- Step 3 (exercise): `parse_int_or(s, default) -> int` using EAFP.

**Piston considerations:** Pure stdlib, all functions return values rather than printing — testCode asserts return values. Avoid any exercise that depends on `input()` (Piston can be configured to provide stdin but it's a setup tax). For lessons that need to demonstrate `print` output, capture via `io.StringIO` redirection in the test rather than asking learners to read stdout.

**Reference material:**
- Book: *Python Crash Course* (Eric Matthes) — solid sequencing for fundamentals, but skip the "build a game" finale for Dojo's format.
- Book: *Automate the Boring Stuff with Python* (Al Sweigart) — for the *tone* of "treat the learner as someone who wants to ship things, not pass quizzes."
- Docs: <https://docs.python.org/3/tutorial/> sections 3–5.
- Community: Real Python's "Python Basics" series, particularly the article on string methods and the f-string deep-dive.

---

### 3.2 Pythonic Idioms & Data Structures — Intermediate

**Slug:** `python-idioms-data-structures`
**Prereqs:** `python-fundamentals`
**Learner time:** ~6 hours
**Learning outcomes:**
- Reach for comprehensions, generator expressions, and `itertools` before writing imperative loops.
- Use `collections.Counter`, `defaultdict`, `deque`, and `namedtuple` in their natural habitats.
- Write generators with `yield` and `yield from`, and reason about lazy evaluation.
- Sort with `key=` functions and understand stable sort guarantees.
- Unpack structures (including nested) without intermediate variables.

**Lesson 1: Comprehensions vs. loops**
- Step 1 (explanation): List, set, dict comprehensions; when a generator expression is preferable; the readability ceiling (no nested triple-comprehension stunts).
- Step 2 (exercise): `squares_of_evens(xs)` using a single comprehension.
- Step 3 (exercise): `invert_dict(d)` swap keys and values, handling collisions deterministically (last-writer-wins).

**Lesson 2: The `collections` module**
- Step 1 (explanation): Tour of `Counter`, `defaultdict`, `deque`, `OrderedDict` (and why it's mostly historical post-3.7), `ChainMap`, `namedtuple`.
- Step 2 (exercise): `most_common_word(text, n)` using `Counter`.
- Step 3 (exercise): `group_by_first_letter(words)` returning a `defaultdict(list)`.
- Step 4 (challenge): Implement a fixed-size LRU using `OrderedDict.move_to_end`.

**Lesson 3: Iterators and generators**
- Step 1 (explanation): The iterator protocol (`__iter__`/`__next__`), what `for` actually does, lazy evaluation, `StopIteration`.
- Step 2 (exercise): Write a `countdown(n)` generator.
- Step 3 (exercise): Write a `take(n, iterable)` generator using `itertools.islice` indirectly — implement it without using `islice` so the learner internalizes the protocol.

**Lesson 4: `itertools` and pipelines**
- Step 1 (explanation): `chain`, `groupby`, `accumulate`, `combinations`, `pairwise` (3.10+). Why `itertools` is a pipeline language.
- Step 2 (exercise): `running_total(xs)` using `accumulate`.
- Step 3 (exercise): `consecutive_pairs(xs)` using `pairwise` (with a polyfill explanation for older Python).

**Lesson 5: Sorting and key functions**
- Step 1 (explanation): `sorted(key=...)`, `operator.itemgetter`/`attrgetter`, stable sort and how to leverage it for multi-key sorts.
- Step 2 (exercise): `sort_by_length_then_alpha(words)`.
- Step 3 (challenge): Sort a list of `(name, score, timestamp)` tuples by score desc, then timestamp asc. Single sorted call.

**Lesson 6: Unpacking and structural patterns**
- Step 1 (explanation): Iterable unpacking, `*rest` in assignment, dict unpacking with `**`, intro to `match`/`case` (PEP 634).
- Step 2 (exercise): `first_last(xs) -> tuple` using `first, *_, last = xs`.
- Step 3 (exercise): A `match`-based dispatcher for a tagged dict (`{"type": "circle", "r": 3}` etc.) returning an area.

**Piston considerations:** All exercises are pure-function. `itertools` and `collections` ship in stdlib, no concerns. `match` requires Python 3.10+ — confirm Piston image version before publishing Lesson 6.

**Reference material:**
- Book: *Fluent Python* (Luciano Ramalho), 2nd ed. — chapters 2–4 (sequences, dicts, sets) and chapter 17 (iterators/generators) are the gold standard. Borrow exercise *patterns*, not text.
- Book: *Effective Python* (Brett Slatkin), 2nd ed. — items 11–27 on comprehensions, generators, and iteration.
- Book: *Python Cookbook* (Beazley & Jones) — chapter 1 (data structures) for exercise inspiration.
- Docs: <https://docs.python.org/3/library/itertools.html> (the "recipes" section is exercise gold).
- Community: Trey Hunner's "Python Morsels" blog — particularly on comprehensions and unpacking. Exercism's Python track uses comprehension-heavy "tally" and "scrabble-score" exercises that map well to our format.

---

### 3.3 Python OOP & Dunder Methods — Intermediate

**Slug:** `python-oop-dunders`
**Prereqs:** `python-fundamentals`
**Learner time:** ~7 hours
**Learning outcomes:**
- Design small classes with `__init__`, `__repr__`, `__eq__`, `__hash__`.
- Choose between regular classes, `@dataclass`, and `NamedTuple` based on problem shape.
- Implement the iterator and context manager protocols on a custom class.
- Use `@classmethod` and `@staticmethod` correctly (and know when *not* to).
- Read inheritance hierarchies and resolve method resolution order (MRO) without panic.

**Lesson 1: Classes are namespaces with rituals**
- Step 1 (explanation): `class` syntax, `self` is a convention (and an explicit first parameter), instance vs. class attributes, the bound method dance.
- Step 2 (exercise): Build a `Counter`-like `Tally` class with `add(item)` and `total()` methods.
- Step 3 (exercise): Add a `__repr__` that produces `Tally({'a': 2, 'b': 1})`.

**Lesson 2: The dunder surface**
- Step 1 (explanation): `__eq__`, `__hash__`, `__lt__`, `__len__`, `__bool__`, `__str__` vs. `__repr__`. The contract: `__eq__` and `__hash__` move together.
- Step 2 (exercise): `Money(amount, currency)` with `__eq__` and `__hash__` so it works in sets and as dict keys.
- Step 3 (exercise): Add `__add__` that raises on currency mismatch (EAFP again).
- Step 4 (challenge): Make `Money` totally ordered using `@functools.total_ordering`.

**Lesson 3: `@dataclass` and when not to use it**
- Step 1 (explanation): `@dataclass` generates dunders for you; `frozen=True`, `slots=True` (3.10+), `field(default_factory=...)`. When a `NamedTuple` or a plain dict is enough.
- Step 2 (exercise): Convert the previous `Money` class into a `@dataclass(frozen=True)`.
- Step 3 (exercise): A `Point` dataclass with a computed `distance(other)` method.

**Lesson 4: Iteration and context manager protocols**
- Step 1 (explanation): `__iter__` and `__next__`; `__enter__` and `__exit__`; why `contextlib.contextmanager` is usually nicer.
- Step 2 (exercise): `Range(start, stop, step)` reimplementing `range` as an iterable class.
- Step 3 (exercise): A `Timer` context manager class that records elapsed seconds (deterministic test: monkey-patch `time.monotonic`).

**Lesson 5: Inheritance, MRO, and composition**
- Step 1 (explanation): Single inheritance, `super()`, multiple inheritance and the C3 linearization in plain English, "favor composition" as a default.
- Step 2 (exercise): A small `Animal` → `Dog`/`Cat` hierarchy with overridden `speak()`.
- Step 3 (challenge): Given a diamond hierarchy, predict the MRO before running and verify with `Cls.__mro__`.

**Lesson 6: `@classmethod`, `@staticmethod`, and alternative constructors**
- Step 1 (explanation): What `cls` is, the alternative-constructor pattern (`from_string`, `from_dict`), why `@staticmethod` is rare and often a hint to make it a module function.
- Step 2 (exercise): `Date.from_iso(s)` classmethod returning a `Date` instance.
- Step 3 (exercise): Refactor a misused `@staticmethod` into a module-level function.

**Piston considerations:** Pure stdlib. `dataclasses`, `functools`, `contextlib` all ship. For the `Timer` exercise we monkey-patch `time.monotonic` in testCode rather than relying on actual elapsed time (non-deterministic).

**Reference material:**
- Book: *Fluent Python* (Ramalho), part III on object-oriented idioms — chapters 11–14 are foundational, especially the dunder method tables.
- Book: *Python Cookbook* (Beazley & Jones), chapter 8 (classes and objects).
- Book: *Architecture Patterns with Python* (Percival & Gregory) — for the "composition over inheritance" framing applied at module scale; aspirational reading for learners who finish this course.
- Docs: <https://docs.python.org/3/reference/datamodel.html> — the canonical dunder reference.
- Community: Real Python's "Python Data Classes" guide and Raymond Hettinger's PyCon talks on class design (search "Beyond PEP 8" and "Super considered super").

---

### 3.4 Python Testing & Packaging Fundamentals — Intermediate

**Slug:** `python-testing-packaging`
**Prereqs:** `python-oop-dunders`
**Learner time:** ~5 hours
**Learning outcomes:**
- Write tests with `unittest` and (if available) `pytest` idioms.
- Use fixtures, parametrization, and `monkeypatch` to isolate behavior.
- Mock at the boundary (filesystem, time, subprocess) without over-mocking.
- Lay out a small package with `pyproject.toml` and understand `__init__.py` semantics.
- Know what `python -m pytest` actually does and why it differs from `pytest`.

**Lesson 1: `unittest` baseline**
- Step 1 (explanation): `TestCase`, `setUp`/`tearDown`, common assertions, why `assertEqual(a, b)` order matters for diff messages.
- Step 2 (exercise): Given a buggy `is_leap_year(year)`, the learner adds the missing test cases that catch the bug, then fixes the function.
- Step 3 (exercise): Write a `TestCase` for a `BankAccount.deposit/withdraw` class with at least one negative test (overdraft raises).

**Lesson 2: `pytest` idioms (if Piston ships pytest)**
- Step 1 (explanation): Plain functions, plain `assert`, fixtures via `@pytest.fixture`, parametrization via `@pytest.mark.parametrize`. The `conftest.py` boundary.
- Step 2 (exercise): Convert a `unittest.TestCase` from Lesson 1 into pytest style.
- Step 3 (exercise): Parametrize a `Roman.to_int` test across 8 cases.

**Lesson 3: Mocking and the boundary**
- Step 1 (explanation): `unittest.mock.patch`, `MagicMock`, "mock at the boundary, never the unit under test." Time, randomness, filesystem.
- Step 2 (exercise): Test a function `today_label()` by patching `datetime.date.today`.
- Step 3 (exercise): Test a `read_config(path)` by patching `pathlib.Path.read_text`.

**Lesson 4: Fixtures and test data hygiene**
- Step 1 (explanation): Fixture scopes (function/module/session), `tmp_path`, why shared mutable fixtures hurt.
- Step 2 (exercise): Use `tmp_path` to write a file, read it back with the function under test, assert content.

**Lesson 5: Packaging fundamentals**
- Step 1 (explanation): The `src/` layout, `pyproject.toml` with `[project]` and `[build-system]`, what `pip install -e .` does, the import-vs.-script distinction.
- Step 2 (exercise): Given a broken `pyproject.toml` (missing `[project] name`), the learner fixes it — testCode parses the TOML and asserts validity.
- Step 3 (challenge): Given a flat-layout package that breaks on `python -m`, the learner restructures it to `src/` and updates `pyproject.toml` accordingly.

**Piston considerations:** The big open question — *does our Piston image ship `pytest`?* The community Piston images include it for some language packages but not all. **Tradeoff:** if pytest is unavailable, drop Lesson 2 and rewrite Lessons 3–4 in `unittest` style (fully possible, slightly more verbose). The "packaging" lesson runs by parsing `pyproject.toml` with `tomllib` (3.11+ stdlib) — no actual install required. Mocking lessons use `unittest.mock`, which is stdlib regardless.

**Reference material:**
- Book: *Python Testing with pytest* (Brian Okken), 2nd ed. — the canonical pytest book; chapters 1–4 inform our structure.
- Book: *Effective Python* (Slatkin), items 109–112 on testing.
- Book: *Architecture Patterns with Python* (Percival & Gregory) — for "mock at the boundary" as a design discipline rather than a syntax tip.
- Docs: <https://docs.python.org/3/library/unittest.mock.html>, <https://packaging.python.org/en/latest/tutorials/packaging-projects/>.
- Community: Real Python's pytest guides; Hynek Schlawack's blog posts on packaging (especially "Python Application Management with pip-tools" and his `pyproject.toml`-only argument).

---

### 3.5 Async Python — Advanced

**Slug:** `python-async`
**Prereqs:** `python-idioms-data-structures`
**Learner time:** ~5 hours
**Learning outcomes:**
- Explain the event loop in their own words (single-threaded cooperative multitasking).
- Write coroutines with `async def` and compose them with `await`, `asyncio.gather`, `asyncio.TaskGroup`.
- Distinguish CPU-bound from I/O-bound work and pick the right concurrency tool.
- Implement async iterators and async context managers.
- Recognize and avoid the most common async pitfalls (sync calls inside coroutines, fire-and-forget tasks, blocking the loop).

**Lesson 1: The event loop, in plain English**
- Step 1 (explanation): Concurrency vs. parallelism; cooperative multitasking; what `await` *actually does* (yields control to the loop). Why `asyncio.run` is the front door, not the foundation.
- Step 2 (exercise): Given a `sleep_then_return(n)` coroutine using `asyncio.sleep`, write `gather_all(coros)` that runs them concurrently and returns results in order. Test asserts total elapsed time is closer to `max(n)` than `sum(n)` — *we monkey-patch a fake clock to keep this deterministic in Piston*.

**Lesson 2: Coroutines and `await`**
- Step 1 (explanation): A coroutine is an object until awaited. The "you forgot to await" footgun. `RuntimeWarning` as a teacher.
- Step 2 (exercise): Fix a snippet where a coroutine is called without `await` — test asserts the return value is the awaited result, not a coroutine object.

**Lesson 3: Composing concurrency**
- Step 1 (explanation): `asyncio.gather`, `asyncio.wait`, `asyncio.TaskGroup` (3.11+), exception propagation differences.
- Step 2 (exercise): Use `TaskGroup` to run three coroutines and aggregate their results.
- Step 3 (challenge): Demonstrate the difference: with `gather(return_exceptions=False)` one failure cancels nothing, with `TaskGroup` one failure cancels siblings. The test asserts both behaviors with two different functions.

**Lesson 4: Async iteration and async context managers**
- Step 1 (explanation): `async for` and `__aiter__`/`__anext__`; `async with` and `__aenter__`/`__aexit__`; `contextlib.asynccontextmanager`.
- Step 2 (exercise): Write an `AsyncCountdown` class supporting `async for`.
- Step 3 (exercise): Write an `async_timer` async context manager that records duration (again, monkey-patched clock).

**Lesson 5: Pitfalls**
- Step 1 (explanation): Blocking the loop with sync I/O, mixing threads and asyncio, fire-and-forget tasks getting GC'd, the "asyncio is contagious" problem.
- Step 2 (exercise): Refactor a coroutine that calls `time.sleep` (blocking) to use `asyncio.sleep`. Test asserts that two such tasks complete concurrently (fake clock).

**Piston considerations:** This is the course where Piston's *no network* constraint hurts the most — async is most naturally taught against HTTP. We compensate with `asyncio.sleep` (fake-clocked in tests), in-memory queue/producer-consumer exercises, and CPU-yielding patterns. This is honest pedagogy — the *mental model* is what matters, and HTTP can be added in a learner's own project. **Flag for human reviewer:** consider whether to caveat this in the course intro ("we teach the model with simulated I/O; apply to real I/O on your own"). `TaskGroup` requires 3.11+; confirm Piston image.

**Reference material:**
- Book: *Using Asyncio in Python* (Caleb Hattingh) — short, sharp, opinionated; the best single-source intro.
- Book: *Fluent Python* (Ramalho), 2nd ed., chapters 19–21 — async iteration and the loop model.
- Book: *Python Concurrency with asyncio* (Matthew Fowler) — broader, more example-heavy than Hattingh.
- Docs: <https://docs.python.org/3/library/asyncio.html> — start with "Coroutines and Tasks," skip "Low-level API" for course purposes.
- Community: Łukasz Langa's PyCon talks on async; David Beazley's "Python Concurrency from the Ground Up" talk (mandatory viewing for any course author here, even if learners never see it).

---

### 3.6 Python Deep Cuts: Decorators & Metaprogramming — Specific / Advanced

**Slug:** `python-decorators-metaprogramming`
**Prereqs:** `python-oop-dunders`
**Learner time:** ~6 hours
**Learning outcomes:**
- Write decorators (function and class), with and without arguments, preserving metadata via `functools.wraps`.
- Use closures intentionally and understand the late-binding closure trap.
- Apply `functools.lru_cache`, `functools.partial`, `functools.reduce` in their natural habitats.
- Implement a descriptor and explain when one is the right tool.
- Use `__init_subclass__` and class decorators as lighter-weight alternatives to metaclasses.
- Read (not write) a metaclass and understand why most metaclasses should not exist.

**Lesson 1: Closures, in detail**
- Step 1 (explanation): What a closure captures (names, not values), the late-binding loop trap, when closures replace small classes.
- Step 2 (exercise): Write `make_adder(n)` returning a function that adds `n`.
- Step 3 (challenge): Fix a buggy `[lambda: i for i in range(3)]` — call each, observe, then fix using a default argument or comprehension scope.

**Lesson 2: Decorators 101**
- Step 1 (explanation): A decorator is a function that takes a function and returns a function. `@d` is sugar for `f = d(f)`. Why `functools.wraps` matters.
- Step 2 (exercise): Write `@trace` that records calls into a list and returns the wrapped function's result.
- Step 3 (exercise): Add `functools.wraps` to fix `__name__`/`__doc__` preservation; test asserts `traced_fn.__name__ == "fn"`.

**Lesson 3: Decorators with arguments**
- Step 1 (explanation): Three-layer onion: decorator factory → decorator → wrapper. Why this trips everyone up the first time.
- Step 2 (exercise): `@retry(times=3)` that retries on exception up to N times.
- Step 3 (challenge): `@cache_for(seconds=N)` time-bound memoization (fake clock for determinism).

**Lesson 4: `functools` toolbox**
- Step 1 (explanation): `lru_cache`, `cache` (3.9+), `partial`, `reduce` (and why it's mostly avoided), `singledispatch`.
- Step 2 (exercise): Memoize a recursive `fib` with `lru_cache` and assert the cache info reports hits.
- Step 3 (exercise): Use `singledispatch` to write a `describe(value)` that handles `int`, `str`, `list` separately.

**Lesson 5: Descriptors**
- Step 1 (explanation): The descriptor protocol (`__get__`, `__set__`, `__delete__`); how `@property` is just a descriptor; when to write your own (validators, lazy attrs).
- Step 2 (exercise): Write a `Positive` descriptor that raises on assignment of a non-positive number.

**Lesson 6: Class decorators and `__init_subclass__`**
- Step 1 (explanation): Class decorators modify a class after creation; `__init_subclass__` hooks subclass creation. Both cover ~95% of metaclass use cases without metaclasses.
- Step 2 (exercise): A `@register` class decorator that adds the class to a registry dict.
- Step 3 (challenge): Use `__init_subclass__` to enforce that every subclass defines a `name` class attribute; test creates an offending subclass and asserts `TypeError`.

**Lesson 7: Metaclasses (read-only lesson)**
- Step 1 (explanation): What a metaclass *is* (the class of a class), why `type` is the default, the canonical use case (ABCs, ORMs). Plain prose, no exercise — the takeaway is "you now know enough to read this code if you encounter it; don't write one unless you've exhausted the alternatives in Lesson 6."

**Piston considerations:** All stdlib. `functools.cache` is 3.9+, `lru_cache` exists earlier. Time-bound decorator exercises monkey-patch `time.monotonic`/`time.time` in testCode for determinism.

**Reference material:**
- Book: *Fluent Python* (Ramalho), 2nd ed., chapters 9–10 (decorators, closures) and 23 (attribute descriptors). The single best treatment in print.
- Book: *Python Cookbook* (Beazley & Jones), chapter 9 (metaprogramming) — every example is a potential exercise.
- Book: *Effective Python* (Slatkin), items 38–48 on metaclasses, descriptors, and class customization.
- Docs: <https://docs.python.org/3/howto/descriptor.html> (Raymond Hettinger's HOWTO is the reference).
- Community: Real Python's "Primer on Python Decorators"; David Beazley's "Python 3 Metaprogramming" tutorial (PyCon 2013, dated but unmatched).

---

### 3.7 Type Hints in Practice — Specific / Intermediate (optional Phase 2)

**Slug:** `python-type-hints-in-practice`
**Prereqs:** `python-oop-dunders`
**Learner time:** ~3 hours
**Learning outcomes:** Use `typing` constructs (`Optional`, `Union`/`|`, `Literal`, `TypedDict`, `Protocol`, `TypeVar`, `Self`, `ParamSpec` overview); read mypy/pyright errors; understand structural typing via `Protocol`.

**Lesson sketch:** 4 lessons — basic annotations & built-in generics (3.9+ `list[int]` syntax); `Optional` and `Union` semantics with `None`; `Protocol` and structural typing as Python's answer to interfaces; `TypedDict` and `Literal` for JSON-shaped data.

**Piston considerations:** mypy is *not* in stdlib. We can either ship a minimal type-checking pass via `mypy` if Piston's image includes it (unlikely default — would require a custom image), or assert *behavior* (e.g., `Protocol` runtime-checkable with `@runtime_checkable`) instead of static-type-error detection. Honest tradeoff: this course is weaker without mypy, but still teaches the mental model. **Flag for reviewer.**

**Reference material:** *Robust Python* (Patrick Viafore) — the best book on the *strategy* of type hints; *Fluent Python* 2nd ed. chapter 8 and 15.

---

### 3.8 Concurrency Beyond Asyncio: threading vs. multiprocessing — Specific / Advanced (optional Phase 2)

**Slug:** `python-concurrency-decision-guide`
**Prereqs:** `python-async`
**Learner time:** ~3 hours
**Learning outcomes:** Decide between `asyncio`, `threading`, `multiprocessing`, and `concurrent.futures` based on workload (I/O-bound vs. CPU-bound, GIL implications, process-startup cost). Use `concurrent.futures.ThreadPoolExecutor` and `ProcessPoolExecutor` for embarrassingly parallel work.

**Lesson sketch:** 3 lessons — the GIL in plain English (and what 3.13's free-threaded build changes); `ThreadPoolExecutor` for I/O-bound; `ProcessPoolExecutor` for CPU-bound (with a deterministic prime-counting exercise).

**Piston considerations:** `multiprocessing` *may* be restricted by the sandbox (process spawning). **Flag for reviewer:** validate against the actual Piston image before publishing. If `multiprocessing` is blocked, demote to a "read-only" lesson with thorough prose and a thread-only exercise.

**Reference material:** *High Performance Python* (Gorelick & Ozsvald), 2nd ed. — chapters 9–11; *Python Concurrency with asyncio* (Fowler) for the comparison framing.

---

## 4. Cross-course exercise patterns

The following patterns recur across sub-courses. Course authors should reach for them before inventing new shapes.

| Pattern | Description | Where it fits |
|---|---|---|
| **Pure function under test** | `def f(args) -> result`; testCode imports and asserts. | All courses; default. |
| **Doctest-style demonstration** | Function carries a docstring with `>>>` examples; testCode also runs `doctest.testmod`. | Fundamentals, Idioms — to build a habit. |
| **Comprehension transformation** | Input collection → output collection via comprehension/generator. | Idioms, OOP. |
| **Generator pipeline** | Two or three generators composed; testCode collects results into a list. | Idioms, Async (sync analog before async). |
| **Class-with-protocol** | Implement a class so that an external protocol check (iteration, context manager, comparison) passes. | OOP, Decorators (descriptors). |
| **Fake-clock monkey-patch** | Test patches `time.monotonic` / `time.time` / `asyncio.sleep` so timing assertions are deterministic. | Async, Decorators, OOP (Timer). |
| **Buggy-then-fix** | Lesson opens with a snippet that fails the test; learner diagnoses and fixes. Higher pedagogical density. | Fundamentals (mutable defaults), Testing, Decorators (late binding). |
| **Read-and-explain (no exercise)** | Pure explanation step where the learner reads code and the test is implicit (next exercise builds on it). | Async (event loop), Metaprogramming (metaclass lesson). |

**Piston-driven constraints flagged:**

- **No network.** All HTTP-shaped exercises become in-memory simulations. Async course is most affected; we compensate with `asyncio.sleep` and queues. Document the compromise in the course intro rather than hide it.
- **No external packages.** `numpy`, `pandas`, `requests`, `httpx`, `pydantic`, `mypy`, `black`, `ruff` — none assumed. If Sprint planning ever wants a "Data with pandas" sub-course, it requires a *separate Piston image* or a different runner. Flag at PRD time.
- **Stateless per execution.** No multi-step exercises that share memory across submissions. Each step's `testCode` includes everything needed to validate.
- **Deterministic output required.** Anything involving real time, real randomness, real I/O timing must be monkey-patched in `testCode`. Course authors should template this once and reuse.
- **Async testing requires care.** Wrap async test bodies with `asyncio.run` inside the test function; or, if pytest-asyncio is available in Piston, use `@pytest.mark.asyncio`. **Open question for reviewer.**

---

## 5. Known pedagogical pitfalls

These are the failure modes we have seen in other Python curricula. Course authors should review this list before drafting any new lesson.

1. **Mutable default arguments taught as a "fun gotcha."** It's a *consequence* of how function objects are constructed at definition time. Teach the *why*, then the workaround (`None` sentinel). Lesson 5 of Fundamentals does this; do not regress.
2. **Conflating `@classmethod` with `@staticmethod`.** They are not interchangeable. `@staticmethod` is rarely the right answer; if a method doesn't need `self` or `cls`, ask whether it should be a module function. OOP Lesson 6 teaches the distinction explicitly.
3. **Teaching `asyncio.run` without explaining the event loop.** Learners then sprinkle `await` randomly. The Async course intro must teach the model first; syntax second. Don't reorder.
4. **Type hints introduced as optional then forgotten.** They appear in Fundamentals (Lesson 1), become mandatory in OOP, and are assumed everywhere after. Reviewers: if you see an exercise after Sub-course 3 without type hints, that's a defect.
5. **Teaching `list.append` in a loop instead of comprehensions.** First time, fine. Past Lesson 1 of Idioms, it should be flagged in hints.
6. **Over-mocking in tests.** "Mock the function under test" is the textbook anti-pattern. Testing Lesson 3 explicitly teaches "mock at the boundary." Do not let mocking exercises drift toward mocking the unit.
7. **Metaclasses as a showcase.** The Metaprogramming course explicitly demotes metaclasses to a read-only lesson. Do not promote them.
8. **`for i in range(len(xs))` instead of `enumerate`.** Idiomatic Python uses `enumerate`. Catch this in hints, not just review.
9. **String concatenation in a loop.** `''.join(...)` exists. Fundamentals Lesson 2 teaches the smell.
10. **`if x == None`.** It's `if x is None`. Catch in linting and in hints.
11. **Catching bare `except:`.** Catches `KeyboardInterrupt` and `SystemExit`. Always specify exception type. Fundamentals Lesson 6 teaches this.
12. **Teaching `__init__` before functions feel natural.** OOP requires Fundamentals as a prereq for a reason. Don't let course reordering break this.
13. **Async-everywhere disease.** After the Async course, learners want to make every function `async`. The Pitfalls lesson must close with "async is contagious — and that's a cost, not a feature."

---

## 6. External references

### Books

| Title | Author(s) | Use for |
|---|---|---|
| *Fluent Python*, 2nd ed. | Luciano Ramalho | The single most-cited reference across this curriculum. Sub-courses 2, 3, 5, 6 lean on it heavily. |
| *Effective Python*, 2nd ed. | Brett Slatkin | Item-by-item idioms; great as a "next read" recommendation at the end of Fundamentals. |
| *Python Cookbook*, 3rd ed. | David Beazley & Brian K. Jones | Exercise inspiration across all intermediate/advanced courses. |
| *Python Crash Course*, 3rd ed. | Eric Matthes | Sequencing reference for Fundamentals only. |
| *Automate the Boring Stuff*, 2nd ed. | Al Sweigart | Tone reference for "treat the learner as someone who wants to ship." |
| *Python Tricks* | Dan Bader | Light, pattern-by-pattern; useful for hint-text inspiration. |
| *High Performance Python*, 2nd ed. | Micha Gorelick & Ian Ozsvald | Concurrency course, GIL discussion. |
| *Architecture Patterns with Python* | Harry Percival & Bob Gregory | Mock-at-the-boundary discipline; aspirational reading. |
| *Using Asyncio in Python* | Caleb Hattingh | Async course backbone. |
| *Python Concurrency with asyncio* | Matthew Fowler | Async course companion. |
| *Python Testing with pytest*, 2nd ed. | Brian Okken | Testing course backbone. |
| *Robust Python* | Patrick Viafore | Type Hints deep-dive course. |
| *Serious Python* | Julien Danjou | Advanced reference; less for direct course use, more for course-author leveling. |
| *CPython Internals* | Anthony Shaw | Course-author reference for explaining the GIL, the bytecode, and the eval loop honestly. |

### Online platforms (Udemy / Exercism / Real Python / Coursera)

| Platform | What to borrow / observe |
|---|---|
| **Exercism — Python track** | Exercise *shapes* (single pure function, hidden tests, mentor-style hints). Closest analog to Dojo's exercise step. Specific exercises worth modeling: `tally`, `scrabble-score`, `pangram`, `allergies`, `clock`. |
| **Real Python** | Tutorials are the highest-quality free Python writing on the open web. Use as a "further reading" link from explanation steps; never copy. Standout pieces: dataclasses guide, decorators primer, asyncio walkthrough, type-checking guide. |
| **Boot.dev — Python tracks** | Closest spiritual predecessor to Dojo's Code School-inspired format. Step density and test-feedback model are worth studying for Piston UX parity. |
| **Coursera — *Python for Everybody* (Charles Severance, U-Mich)** | Classic introductory sequencing. Useful for what *not* to do at Dojo's level — too gentle for our audience, but the teaching arc is sound. |
| **Udemy — Jose Portilla's Python bootcamps** | Massive market presence; useful for understanding the gap between "popular" and "rigorous." Reference, don't emulate. |
| **CS50P (Harvard, David Malan / Brian Yu)** | High-quality intro with a strong testing emphasis. Borrow the "writing tests is part of the assignment" framing. |
| **Platzi — Python ruta** | Spanish-speaking audience reference; sequencing benchmark for our Spanish-speaking learners (founder is Spanish-speaking; our audience may be too). |
| **Talk Python Training (Michael Kennedy)** | Strong on async, packaging, and modern Python (3.11+). Useful for advanced course leveling. |

### Official documentation

- **Tutorial:** <https://docs.python.org/3/tutorial/> — surprisingly good; reference from Fundamentals lesson intros.
- **Library reference:** <https://docs.python.org/3/library/> — link directly to relevant modules from each lesson.
- **Language reference / data model:** <https://docs.python.org/3/reference/datamodel.html> — *the* dunder bible. Mandatory link from OOP and Metaprogramming.
- **HOWTOs:** <https://docs.python.org/3/howto/> — Hettinger's descriptor HOWTO and the logging HOWTO are particularly good.
- **PEP index:** <https://peps.python.org/> — link specific PEPs (8 style, 20 zen, 484 type hints, 492 coroutines, 634 match, 657 fine-grained errors) where they motivate a lesson.
- **Packaging User Guide:** <https://packaging.python.org/> — reference from Testing & Packaging course.

### Community learning resources

- **Trey Hunner's Python Morsels** (<https://www.pythonmorsels.com>) — short exercises with thoughtful hints; closest spiritual sibling to Dojo's exercise step. Worth reviewing the *hint structure* before writing our own.
- **Raymond Hettinger's PyCon talks** — "Beyond PEP 8," "Transforming Code into Beautiful, Idiomatic Python," "Super considered super." Mandatory background for any course author writing the OOP or Idioms course.
- **David Beazley's PyCon tutorials** — concurrency, generators, metaprogramming. Gold-standard explanations.
- **Łukasz Langa's talks** — async, modern Python, performance.
- **Anthony Shaw's blog and talks** — CPython internals; useful for grounding "why is this slow / why does the GIL matter" answers.
- **Hynek Schlawack's blog** — packaging, attrs/dataclasses lineage, structlog. Reference for the Testing & Packaging course.
- **Ned Batchelder's blog** — test coverage, mocking, general Python craft.
- **Brett Cannon's blog** — Python language internals and packaging history.
- **PyVideo.org** — searchable archive of PyCon talks; primary research tool for course authors.

---

## 7. Suggested implementation order

**Build first: `python-fundamentals`.** Largest target audience, lowest Piston risk (everything is `unittest` and pure functions), highest leverage as a prerequisite gate. Validates the Python runner end-to-end before any sub-course depends on async or pytest.

**Build second: `python-idioms-data-structures`.** This is where Python *becomes* Python for the learner; it's also the course most likely to generate organic shares ("look at this slick `Counter` solution"). Pure stdlib, no Piston risk.

**Build third: `python-oop-dunders`.** Required prereq for two more sub-courses (Testing, Metaprogramming). Stdlib only. Some content density risk — keep lessons short, push complexity into challenge steps.

**Build fourth: `python-testing-packaging`.** Resolves the open Piston question (does the image ship pytest?) early enough to inform later courses. If pytest is unavailable, this course still ships using `unittest` only — the Piston-facing risk is real but bounded. Packaging lessons are inherently safe (TOML parsing).

**Build fifth: `python-decorators-metaprogramming`.** High audience interest, highest "I learned something new" rate per lesson. Stdlib only. Save for later because it's the highest authoring effort per step (the explanation density is brutal — closures and decorators are easy to *use* and hard to *teach*).

**Build sixth: `python-async`.** Last of the core six because (a) it's the most exposed to Piston constraints (no network), and (b) writing deterministic async tests is non-trivial — we want our test-authoring patterns mature first. By the time this ships, the fake-clock monkey-patch pattern will be muscle memory across the team.

**Optional Phase 2:** `python-type-hints-in-practice` and `python-concurrency-decision-guide` ship after the core six if learner data shows demand. Type Hints ships only if we can resolve the mypy-in-Piston question; Concurrency ships only if `multiprocessing` works in the sandbox.

**Cross-cutting recommendation:** before authoring Course 1, run a Piston spike on `unittest`, `asyncio`, `time` monkey-patching, and `tomllib` parsing — five small validation programs, half a day of work, retire the four largest open questions before the curriculum locks.
