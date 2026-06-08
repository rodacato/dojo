# Python Scroll Track

> Maintainer persona: S7 Nadia Petrov (Python educator) + S5 Dr. Elif Yıldız (curriculum architect) + S2 Valentina Cruz (content quality) + S11 Maya Lindqvist (interactive learning UX).
> Last researched: 2026-04-14 · Re-scoped 2026-06-06 under [ADR 022](../../adr/022-crash-course-pivot.md) · **Re-scoped polyglot-first 2026-06-07** under Sprint 026, mirroring the Ruby re-scope · **Promoted to canon 2026-06-08** under Sprint 027.

## 1. Learning Philosophy for Python

Python has a different teaching pathology than Ruby. Ruby's pathology is Rails — most learners arrive via the framework and never meet the language. Python's pathology is the *opposite*: every learner arrives via the language (the official tutorial is good enough that they think they know it after a weekend), but most never internalise the idioms that separate a Python *user* from a Python *thinker*. They write `try/except` only when forced. They reach for `if x in d: ... else: ...` instead of `d.get(x, default)`. They write `for i in range(len(xs))` six months into the job. They learn `async def` syntax before they can explain what the event loop does. This track is about **Python the language, not Django/Flask, not pandas/numpy/PyTorch, not the bootcamp arc that ends with a Streamlit dashboard.** A polyglot developer who finishes the Python scroll has learned a small, opinionated, expressive language whose protocol surface (dunders, iterables, context managers, decorators) *is* the language — whether or not they ever touch a web framework or a notebook.

The core mental model is **the protocol surface plus EAFP**. Almost every Python idiom that surprises a JS or Java developer reduces to one of: "this object behaves like X because it implements the X dunder" or "we tried the operation rather than checking preconditions first." `for x in xs` works because of `__iter__`; `with open(p) as f` works because of `__enter__` / `__exit__`; `@decorator` works because functions are objects and `@x` is sugar for `f = x(f)`; `[x for x in xs if p(x)]` is the Pythonic answer to `xs.filter(p).map(...)`; `try: d[k] except KeyError:` is the cultural default over `if k in d`. The crash scroll teaches **context managers and EAFP first** — not as a footnote to "exception handling" and not buried at the end of an OOP tour. The polyglot will read `with engine.connect() as conn:` and `try: ... except StopIteration:` in the first Python file they open on Friday; the scroll respects that. By the end, a learner should recognise that `@property`, `@dataclass`, `@contextmanager`, and `@cache` are all the same idea (a callable transforming another callable / class), and that `with` and `try` are the two control-flow shapes a real Python codebase reaches for first.

**Indentation as syntax** and **`self` as explicit first parameter** are taught as Lesson 1 surprises — not because they are deep, but because they are the *first thing* a JS/Java/Ruby developer notices, and refusing to name them up front is gaslighting. They land in 10 minutes. The polyglot then forgets they ever surprised them and moves on to the actually interesting Python: comprehensions as the dominant data-transform shape, EAFP as the cultural reflex, context managers as the resource-acquisition shape, decorators as the callable-modifier shape, type hints as a *design tool* (Mariana's TS reflex transfers cleanly here — Python's `Protocol` is structural, like TS, not nominal, like Java). Async, descriptors, metaclasses, the asyncio mental model at depth, and the C-extension surface are explicitly **named-and-deferred** to deep-dive scrolls.

Dead ends we explicitly avoid: **teaching OOP before functions feel natural** (a learner who reaches for a class to add two numbers has been mis-taught — Lesson 1's `self` mention is calibration, not full OOP); **teaching `asyncio` syntax before the event loop mental model** (Nadia S7's veto — `async def` before "what does `await` actually do" produces cargo-culted `await` sprinkled at random; full async lives in the deep-dive scroll); **teaching pandas / numpy / Django / Flask as "Python"** (they are libraries and frameworks, not the language — confusing them is the single biggest disservice this track exists to undo, mirror of Ruby-not-Rails); **teaching metaclasses at all in the crash** (Tim Peters' "if you have to ask, you don't need them" — named in Lesson 5's closer, full treatment in a deep-dive); **teaching the mutable-default-argument trap as a "fun gotcha"** (it's a *consequence* of how function objects are constructed at `def` time — we teach the *why*, not the meme); **using `read` steps as tour-guide prose that explains what the polyglot already knows about strings, lists, and `if/else`**.

Before any lesson on the language proper, **Lesson 0 orients the polyglot in Python's ecosystem** — what Python is for and what it isn't, `python` vs `python3` and why the answer depends on your OS, the CPython / PyPy distinction (named and deferred), `pip` vs `venv` vs `poetry` vs `uv` vs `conda` (the package-manager landscape is famously fragmented; the polyglot needs a map), `pyproject.toml` as the modern entry point, and what a Python project actually looks like when you `git clone` it. This is not padding. It is the information the polyglot would have to assemble from five browser tabs on a Friday morning, surfaced once so they can decide whether Python earns their attention before they invest in syntax.

A note on tone: the Dojo voice is direct and **assumes the reader already programs in another language**. We do not pad with "Welcome to your Python journey!" preambles. Every `read` step passes the test: *if I delete this paragraph, does the polyglot lose something Python-specific? If no, the paragraph doesn't exist.* When an exercise is hard, we say so. When the Piston sandbox forces a compromise (no `pytest` by default, no `requests`, no `numpy`, no `mypy` runtime, no real async I/O), we say that too — explicitly, in the lesson body, not buried in a footnote. The learner deserves to know what is the language, what is the library ecosystem, and what is the sandbox getting in the way.

## 2. Course Authoring Profile

> Course-level voice and authoring decisions for the Python track. Per [`docs/courses/README.md`](../README.md) §8.1. The Python scroll inherits these defaults; each lesson's spec deviations are declared in the spec's §2 Authoring Notes.

**Voice & angle.** Python-the-language, not Django/Flask/pandas/PyTorch. The unifying angle is "the protocol surface (dunders + iterables + context managers + decorators) and EAFP are the language; everything else is library." Web frameworks are named only to be excluded. The data-science stack is named only to be excluded. The audience is the polyglot developer who needs confidence reading and writing Python by Friday, not the first-time programmer learning what a function is. Voice is direct and assumes a literate developer — no "Welcome to Python!" preambles, no apologising for indentation, no softening when an idiom is genuinely Pythonic-and-only-Pythonic.

**Step density & rhythm.** Slightly lower prose-per-step than Ruby. Target for Python: **250-350 words per `read` step**, with one additional `read` step in Lessons 4 (context managers) and 5 (decorators) where the mechanism behind the syntax is the lesson. Reason: Python's surface is more familiar to the polyglot than Ruby's (no blocks-as-syntax oddity, no `do...end` precedence, no symbols), so individual reads need less re-framing. But the *mechanisms* under decorators (closures, late binding, three-layer onion for parametrised decorators) and context managers (`__enter__` / `__exit__` choreography, `contextlib.contextmanager` as generator-as-protocol) deserve longer reads when they land. The framework default (~200-300 words) is fine for Lessons 0-3; Lessons 4-5 push to ~350-400.

**Interactivity menu.**

- **IN:** `read`, `exercise`, `challenge`, `predict`, `read+inline`, and the `playground` local-experiment variant (inherited as `kata` with `data.kind: "playground"` from Ruby — see [ruby/ruby.md §2.3](../ruby/ruby.md)).
- **OUT (deliberate exclusion):** `trace`. Although [`INTERACTIVITY-PATTERNS.md`](../INTERACTIVITY-PATTERNS.md) Tier 2 lists Python as a `trace` target (third after JS DOM and SQL), the crash scroll defers it. The reason: `trace`'s pedagogical value in Python is concentrated in two places — generator/iterator stepping and the event-loop yield points — and **both are deep-dive territory** in the polyglot-first scope. Lifting `trace` into the crash would either decorate a lesson where it's unnecessary (basic control flow, comprehensions) or force a topic into the crash that doesn't belong there (asyncio internals). Defer to `python-asyncio-deep` and `python-iterators-and-generators` where the per-step authoring cost actually amortises.

**Figures menu** *(added 2026-06-08 alongside promotion).* Embeddable visual figures (see [`INTERACTIVITY-PATTERNS.md`](../INTERACTIVITY-PATTERNS.md) §Embeddable visual figures) authors of this scroll reach for, with each one's Python-specific landing zone:

- **IN, recommended:**
  - **`disambiguation`** — for near-look-alikes the polyglot will conflate. *First landing: Lesson 3 (the EAFP-vs-LBYL pair with **Intent** as the divergent attribute — same shape on the page, opposite cultural reflexes).* Strong secondary candidate: Lesson 2's *list vs tuple vs set* with **Mutability** as the divergent dimension cascading to ordering, hashability, and use-case. Per Sprint 027's mandate, at least one `disambiguation` ships in this scroll; Lesson 3 is the primary commitment, Lesson 2 the optional second if the read step needs the visual relief.
  - **`before-after`** — for any idiom whose pedagogical point is the contrast with a verbose equivalent the polyglot would default to. *First landing: Lesson 4 (`try / finally + close()` vs `with open(p) as f:` — the manual-resource-management shape the polyglot writes from C/Java reflex, replaced by Python's `with`-block protocol).* Reach for it anywhere the polyglot reflex produces noisy code that Python's idiom collapses; another fit is Lesson 0 (the `node`-and-`npm` reflex vs `python3 -m venv .venv && pip install -e .`).
- **IN, situational (use when a lesson genuinely benefits):**
  - **`array-track`** — for comprehension-shape comparisons. Strongest fit: **Lesson 2**, a single figure with input `[1, 2, 3, 4, 5]` and three tracks (`[x*2 for x in xs]` / `[x for x in xs if x > 2]` / `(x*2 for x in xs)` then `list(...)`) showing how cell states differ across list-comp, filter, and generator-then-materialise. Teaches three comprehension shapes in one figure. A secondary candidate sits in Lesson 3 (EAFP-vs-LBYL walk on a mixed input list), but the Lesson 2 use is stronger.
  - **`tabbed-card`** — only if Lesson 5's "decorators-and-friends" read step needs the multi-lens framing. Strong fit: **Lesson 5** with 2-4 tabs (`@property` / `@dataclass` / `@cache` / `@contextmanager`) — same shape, different inputs — making Lesson 5's central insight ("they're all the same idea") visible without three paragraphs of prose. Default: do not embed unless the read step pulls toward it.
- **OUT (deliberate exclusion):**
  - **`two-by-two`** — Python lacks the crisp orthogonal-axes confusion Ruby has with "operators as syntax × operators as messages." No obvious fit pre-authoring; do not force one. If authoring surfaces a real candidate (e.g. Lesson 5: "decorator parametrisation × wrapped-target kind"), revisit — but parametrisation is not orthogonal to target, so expect this to stay out.
  - **`sequence-play`**, **`grid-canvas`**, **`recursion-stack`** — none of Python's polyglot-first content earns these. They belong in algorithms or async-iterator scrolls, not the Python crash. If the future `python-asyncio-deep` or `python-iterators-and-generators` deep-dive ships, `sequence-play` becomes a candidate for visualising generator stepping or event-loop yield points — *not before*.

**Pedagogical bets.**

1. **Prediction-before-explanation on Python's quiet surprises.** Use `predict` steps for the moments where Python *quietly* diverges from polyglot reflexes — `is` vs `==` on small ints (the interned-int trap), mutable default arguments evaluated at `def` time (the `def f(x, acc=[]):` trap), late binding in closures inside loops (the `[lambda: i for i in range(3)]` trap), truthiness of empty collections (`if []` is falsy, distinct from Ruby). Each `predict`'s wrong-answer feedback addresses the **specific** wrong mental model the option encodes (per [`INTERACTIVITY-PATTERNS.md`](../INTERACTIVITY-PATTERNS.md) §predict voice contract). *First lesson to use this:* Lesson 1 (the two surprising syntaxes). *Failure mode without it:* learners memorise idioms as trivia, never building the protocol-surface model that decoders + context managers + dunders all share.
2. **Retrieval interleaving from comprehensions to EAFP to context managers.** Identifiers introduced in Lesson 2 (`tally`, `flatten`) reappear in Lesson 3's EAFP exercises and Lesson 5's decorator wrappers. testCode references prior identifiers by name — the learner must remember the signature. *First lesson to use this:* Lesson 2. *Failure mode without it:* each lesson feels like a hermetic universe; the learner never builds the layered intuition that "Python's killer features stack."
3. **Footgun awareness, not footgun fear.** When the crash scroll names `__init_subclass__`, descriptors, metaclasses, the GIL, or the asyncio event loop at depth — and it must, because the polyglot will encounter them in real codebases — every mention ends with the specific failure mode the technique introduces, plus a pointer to the future deep-dive scroll that earns the depth. *First lesson to use this:* Lesson 5 (decorators) — closes with the deferred list (`functools.wraps` subtleties, descriptors as the mechanism behind `@property`, metaclasses, async decorators). *Failure mode without it:* learners write `@decorator` everywhere because the scroll taught the syntax but never named the boundary.
4. **Sandbox-honesty markers.** When Piston's constraints force a teaching compromise (no `pytest` available by default, no `requests`, no `numpy`/`pandas`, no real async I/O, no real network, `unittest` as test harness or manual `_t`/`_eq`), the `read` step's body acknowledges this explicitly — not in a footnote — and tells the learner what the next step (in their career, not in the scroll) is. *First lesson to use this:* Lesson 4 (context managers — when the temptation to teach `requests.get(...) as r` is real and we deflect to file/lock context managers). *Failure mode without it:* learners assume the gap is the language's, not the sandbox's, and walk away thinking Python is somehow incomplete.

**Maintainer experts.** S7 Nadia Petrov (language), S5 Elif Yıldız (curriculum), S2 Valentina Cruz (content quality), S11 Maya Lindqvist (interactive steps — predict + playground + read+inline reviews). S12 Felix Park only if a lesson proposes a new animation runtime; default expectation is no new runtime (the Python scroll ships with CSS-only motion, shared GSAP runtime available if a future lesson needs an idiom-comparison reveal).

## 3. Scroll Catalog

| Slug | Kind | Steps (target) | Time (target) | Status |
|---|---|---|---|---|
| `python` | Language scroll (crash course) | 21-24 | ~100 min | **spec-in-progress, polyglot-first re-scope 2026-06-07; panel + audience review applied 2026-06-08** — outer + inner spec drafted; lesson prose stubs only |

That is the whole catalog for Python in v1. Per [ADR 022](../../adr/022-crash-course-pivot.md), one language scroll per language is the anchored set. Deep-dive scrolls on Python-specific topics are deferred — see §3.1.

The step count target is slightly under Ruby's (22-24) — Lesson 0 adds 2 steps (the audience review collapsed the orientation reads, since all three primary personas already operate `venv`/`pip` in their day-to-day), and the decorator + context-manager lessons each benefit from a predict-then-implement pair. The time budget is **~100 minutes** rather than Ruby's 110 because Python's surface lands faster for the polyglot once the protocol-surface lens is set: less re-framing per idiom, since the polyglot already has the function/method/object model.

### 3.1 Future deep-dive candidates (not in scope for v1)

When deep-dive scrolls become a real shape (after the five language scrolls ship), Python has at least these candidates. Listed here so the crash scroll knows what it can defer without losing the topic:

- **`python-asyncio-deep`** — event loop mental model from first principles (selectors, cooperative yielding, `Future` vs `Task`), `asyncio.gather` vs `TaskGroup`, async iterators and async context managers, the "you forgot to await" footgun catalog, the contagion problem, `asyncio.run` as front door not foundation. Framed as "the language inside the language."
- **`python-typing-deep`** — `Protocol` (structural typing as Python's answer to interfaces, the TS analogue), `TypedDict`, `Literal`, `TypeVar` with constraints, `ParamSpec`, `Self` (3.11+), `assert_type`, the mypy / pyright mental model, when to reach for `cast` vs `assert isinstance`. The "types as design tool" scroll.
- **`python-iterators-and-generators`** — the iterator protocol at depth, `yield` mechanics, `yield from`, generator pipelines, lazy evaluation, `itertools` (`chain`, `groupby`, `accumulate`, `pairwise`), generator-based coroutines (the pre-asyncio shape — historical but explains why `await` is what it is).
- **`python-descriptors-and-protocols`** — descriptor protocol (`__get__` / `__set__` / `__delete__`), `@property` demystified as a descriptor, `__init_subclass__` as the lightweight alternative to metaclasses, class decorators, dunder methods at depth (`__call__`, `__getattr__` vs `__getattribute__`, `__slots__`). The "objects as protocols" scroll.
- **`python-c-extensions`** — `ctypes`, `cffi`, the CPython C API at a literacy level, the GIL in detail and what 3.13's free-threaded build changes, when a C extension is justified vs when it's premature optimisation. Carries the largest Piston-vs-reality gap (no compiler in sandbox); ship last if at all, possibly as a no-exercise "read-and-explain" scroll.
- **`python-testing-deep`** — `pytest` at depth (fixtures, parametrize, conftest, plugins), `unittest.mock` and the "mock at the boundary" discipline, property-based testing with `hypothesis`, doctest as documentation-with-teeth. Currently the crash scroll uses a manual `_t`/`_eq` harness specifically to avoid teaching `pytest` before the learner needs it.
- **`python-packaging-and-tooling`** — `pyproject.toml` at depth, `src/` layout, `pip` vs `pipx` vs `pip install -e`, build backends (`hatchling`, `setuptools`, `poetry-core`), the modern `uv` story, what `python -m foo` actually does. Currently the crash scroll teaches just enough in Lesson 0 to read a `pyproject.toml`.

None of these are committed. They are listed so the crash scroll's lesson authors know what surface they can name-and-defer without inventing it on the spot.

## 4. The Python Scroll

**Slug:** `python`
**Kind:** Language scroll (crash course)
**Audience:** Developer who already programs in at least one other language. No Python experience required. **Primary:** A1 Mariana (JS senior) + A4 Felipe (TS modernizer). **Secondary:** A3 Yui (Java senior, Python as scripting). **Out-of-scope:** A2 Esteban (already a Python mid-senior; not a learner here per [`AUDIENCE.md`](../AUDIENCE.md)).
**Learner time:** ~100 minutes real work (60-120 range).
**Spec file:** [`python/python.md`](python/python.md) — the executable authoring brief (see [`../authoring-spec-template.md`](../authoring-spec-template.md)).

**Learning outcomes.** After this scroll, the learner can:

- Locate Python on their internal language map: what it is for, where it does and doesn't fit, why `python` vs `python3` is sometimes a question, what `pip`/`venv`/`poetry`/`uv` do (and which one to reach for first), what a `pyproject.toml`-shaped project looks like, and how to run a Python project they just cloned.
- Read Python's two surprising syntactic facts without friction: indentation as syntax (not convention), and `self` as explicit first parameter of instance methods. Recognise `__dunder__` methods as the protocol surface.
- Read and write idiomatic Python across the dominant data-transform shapes — list / dict / set comprehensions, generator expressions, f-strings, slicing, unpacking. Choose the right shape (comprehension vs generator vs `for` loop) for the problem.
- Reach for EAFP (`try/except`) as the cultural default over LBYL (`if hasattr(...)`) and explain when each is appropriate. Predict the result of common Python expressions that surprise a polyglot (`is` vs `==` on small ints, `[] == False`, mutable default arguments).
- Use context managers (`with` blocks) as the resource-acquisition shape: read the protocol (`__enter__` / `__exit__`), use `contextlib.contextmanager` to write one from a generator, recognise when to reach for `with` over `try/finally`.
- Write decorators: understand `@d` as sugar for `f = d(f)`, write a plain decorator, use `functools.wraps`, write a parametrised decorator (the three-layer onion), and recognise that `@property`, `@classmethod`, `@dataclass`, and `@cache` are all the same idea applied to different inputs.
- Name the Python-specific footguns the polyglot will eventually hit (mutable default arguments, late binding in closures, `is` vs `==`, EAFP misused as LBYL-disguise, decorators that lose metadata without `wraps`) and know where to find the depth when they need it.
- Name what's deferred (asyncio at depth, descriptors, metaclasses, the GIL, `Protocol` typing, packaging beyond `pyproject.toml` literacy) and know which deep-dive scroll covers each.

**Lessons (polyglot-first order).**

- **Lesson 0 — Python en contexto.** What Python is for, where it doesn't fit, `python3` vs `python`, the `pip`/`venv`/`poetry`/`uv` landscape, what a `pyproject.toml` project looks like, how to run one. 2 steps: 1 `read` + 1 `predict`. No `kata` here — this lesson orients, it doesn't drill syntax. *(Audience review 2026-06-08 collapsed two reads into one tight ecosystem read; all three primary personas already operate `venv`/`pip` in their day-to-day.)*
- **Lesson 1 — Las dos sintaxis que sorprenden.** Indentation as syntax (not convention), `self` as explicit first parameter of instance methods, the `__dunder__` surface at a glance (named: `__init__`, `__repr__`, `__iter__`, `__enter__`/`__exit__`, `__call__` — explained at depth in Lessons 4-5). Lands the polyglot's "first surprises" in 10 minutes so they don't trip on syntax for the next 90.
- **Lesson 2 — Literales y comprehensions que vas a leer.** List / dict / set comprehensions, generator expressions, f-strings, slicing, unpacking (`a, b, *rest = xs`). The "five literal forms" the polyglot will read on the first Python file they open Friday. Includes the first playground step (after the comprehension kata) for exploring nested comprehensions vs generator expressions.
- **Lesson 3 — EAFP vs LBYL — el reflejo Pythonic.** Try the operation, catch the exception. `try/except/else/finally`. When LBYL (`if k in d`) is correct (cheap check, common case) and when it's a race condition or a duck-typing violation (most other times). The cultural rule and its limits.
- **Lesson 4 — Context managers.** `with open(p) as f:` as the protocol, `__enter__` / `__exit__`, writing a context manager class, `contextlib.contextmanager` as generator-as-protocol shortcut, when to reach for `with` over `try/finally`. Includes the second playground step (after the contextmanager kata) for poking `__enter__` / `__exit__` ordering and exception propagation.
- **Lesson 5 — Decorators + closures.** Closure mechanics (what's captured, the late-binding trap), `@d` desugaring, `functools.wraps`, parametrised decorators (the three-layer onion), and the recognition that `@property`, `@classmethod`, `@dataclass`, `@cache` are all the same idea. Closes with the named-and-deferred list (descriptors, metaclasses, async decorators) pointing at deep-dive scrolls.

The full step-by-step authoring (prose, starter code, tests, hints, solutions, predict options + feedback, playground starter code + suggestions) lives in [`python/python.md`](python/python.md). The lesson titles here are the index summary, not the spec.

**Polyglot-first reordering rationale.** The canonical textbook order would teach Python as: variables → control flow → data structures → functions → OOP → modules → (advanced). That order is right for an absolute beginner. For a polyglot — who already has the concept of an integer, a list, a dict, an `if/else`, a function — the right order is *surprise-priority* and *idiom-density*: lead with what they will encounter first when they read Python code on Friday. That is indentation, `self`, dunders (Lesson 1), comprehensions (Lesson 2), `try/except` as control flow (Lesson 3), `with` (Lesson 4), and `@decorator` (Lesson 5). OOP is implicit — `self` is named in Lesson 1, `__init__` and other dunders surface in Lessons 4-5 — but is *not given its own lesson*. A polyglot doesn't need to be taught what a class is; they need to be shown what Python's class system contributes (protocols via dunders, decorators that transform classes, `@dataclass` as the "I just want a record" answer). Nadia (S7) signed off on this with the constraint that the dunder surface gets named explicitly in Lesson 1 (the calibration moment), then earned through Lessons 4 and 5; Elif (S5) signed off with the constraint that the lesson count stays ≤6 and the protocol-surface thread is visible across Lessons 1, 4, 5.

The most aggressive cut vs the pre-pivot draft (overwritten by this file; see commit `57f6cee` for the prior multi-sub-course shape): **OOP is no longer its own course.** The pre-pivot draft had `python-oop-dunders` as 17 steps across 6 lessons. The polyglot-first lens reduces this to: dunders are introduced as Lesson 1 calibration, used in Lesson 4 (`__enter__` / `__exit__`), and named at depth in the descriptors-and-protocols deep-dive. The polyglot does not need a class-design course — they need to know what *Python's* class system contributes that theirs doesn't (the protocol surface).

**Sandbox notes.** Piston Python 3.11+ (required for `tomllib`, `TaskGroup` reference in deep-dive, modern `Self` typing reference). Stdlib only. Manual test harness (`_t` / `_eq` pattern adapted from Ruby — see [§5 below](#5-cross-lesson-exercise-patterns) and the inner spec) rather than `pytest` or `unittest` introduction. Deterministic only — no `time.time()`, no `random.random()` without seeding, no `asyncio.sleep` (asyncio is deferred entirely). STDIN is not exercised; inputs come as function arguments.

**Reference material for this scroll specifically.**

- *Fluent Python*, 2nd ed. (Luciano Ramalho) — Chapters 2-4 (sequences, dicts, sets), 9 (decorators and closures), 17 (context managers and else blocks). The spine.
- *Effective Python*, 2nd ed. (Brett Slatkin) — Items 11-27 on comprehensions and iteration, 38-43 on decorators and closures, 66-69 on context managers and `try/except`.
- *Python Cookbook*, 3rd ed. (Beazley & Jones) — Chapter 1 (data structures) and Chapter 9 (metaprogramming) for exercise inspiration.
- Python docs — <https://docs.python.org/3/reference/datamodel.html> (the dunder bible), <https://docs.python.org/3/library/contextlib.html>, <https://docs.python.org/3/library/functools.html>.
- *Robust Python* (Patrick Viafore) — type hints framing for Lesson 1's calibration on `self` and the named-and-deferred typing depth.
- PEP 8, PEP 20 ("Zen of Python"), PEP 343 (`with` statement), PEP 318 (decorators) — named in the relevant lesson reads, not summarised.

## 5. Cross-lesson exercise patterns

Across the Python scroll's lessons, exercises lean on a small set of repeatable shapes that are well-suited to Piston's stateless, stdlib-only sandbox:

- **Pure functions.** Input → output, no side effects. Easiest to test deterministically. Default for Lessons 1-3.
- **Comprehension-as-solution.** Where Ruby's idiom is `[1,2,3].map(&:to_s)`, Python's is `[str(x) for x in [1,2,3]]`. Lessons 2 and 3 default to comprehension shapes; the test asserts on the returned collection, not on intermediate state.
- **EAFP-as-solution.** A function that tries the operation and catches the specific exception, returning a sentinel or default. Lesson 3's dominant shape. Tests assert that the function returns the default on the expected exception type and that it does NOT swallow the wrong exception.
- **Context-manager-as-class.** A class with `__enter__` and `__exit__` methods, plus the `contextlib.contextmanager` generator variant. Lesson 4. Tests assert on side-effect order (e.g. resource acquired before yield, released after, even on exception).
- **Decorator-as-callable.** A function that takes a function and returns a function. Lesson 5. Tests assert on the wrapped function's `__name__` (with and without `functools.wraps`) and on the wrapper's behavior (call count, retry, cache hit/miss).
- **Predict-then-implement pairs.** A `predict` step's snippet often becomes the starter code of the next exercise. The learner forms a hypothesis, sees the answer, then writes code that depends on the model. Core to Lessons 1, 3, and 5.
- **Surprise-named-explicitly.** Where Python diverges from JS/Java/Ruby reflexes (truthiness of empty collections, `is` vs `==`, mutable default arguments, EAFP cultural preference), the read step names the polyglot reflex and corrects it before the exercise.

**Piston constraint reminder:** stdlib only. **No pytest, no requests, no httpx, no pydantic, no numpy/pandas, no mypy at runtime, no Django/Flask/FastAPI, no async I/O.** No external HTTP, no filesystem assumptions beyond `/tmp`. Every exercise must be reproducible from a single Python file. Test harness is the manual `_t` / `_eq` pattern documented in [`python/python.md`](python/python.md) §5; `unittest` and `pytest` are not introduced in the crash scroll (`unittest` is the runner-of-last-resort; `pytest` is deferred to the testing deep-dive).

## 6. Known pedagogical pitfalls

Pitfalls the Python scroll specifically defends against:

- **Teaching mutable default arguments as a "fun gotcha."** It's a *consequence* of how function objects are constructed at `def` evaluation time. *Lesson 5's closure read step names the mechanism (default values evaluated once at definition time, bound to the function object) and the workaround (the `None` sentinel pattern). Treating it as trivia would be miseducation.*
- **Teaching `asyncio.run` before the event loop mental model.** Nadia (S7) has a hard veto. *The crash scroll does not teach asyncio. Lesson 5's closer names `async def` as deferred to the asyncio-deep scroll where the event-loop model gets a full lesson before any syntax. Mentioning `await` in passing without the model is the failure mode.*
- **Conflating Python with Django / Flask / FastAPI.** Web framework idioms (`@app.route`, dependency injection, ORMs) are framework-specific, not Python. *Lesson 5's read step on decorators uses `functools.wraps` and `functools.cache` as the canonical decorator examples — never `@app.route`. Calling framework idioms "Python" is the single biggest disservice this track exists to undo. Mirror of Ruby-not-Rails.*
- **Conflating Python with pandas / numpy / PyTorch.** The data-science stack is not Python; it's an ecosystem on top of Python. *No exercise in the crash scroll touches `DataFrame`, `ndarray`, or tensor operations. If a learner wants the data-science arc, that's a different scroll family — not a stretch of this one. Cut explicitly per [`AUDIENCE.md`](../AUDIENCE.md)'s out-of-scope list.*
- **Treating dunder methods as advanced.** They are the language's protocol surface — `for` and `with` and `[]` and `()` all dispatch through dunders. *Lesson 1 names them as Python's protocol surface in the calibration moment (10 lines, no depth). Lesson 4 earns `__enter__` / `__exit__` by writing one. The "advanced" framing is wrong for a polyglot — dunders are how the language works.*
- **`for i in range(len(xs)):` instead of `enumerate`.** The Java/C reflex. *Lesson 2's comprehension read step names `enumerate` and `zip` alongside the comprehension forms. A polyglot writing `range(len(...))` is signal that Lesson 2 didn't land.*
- **EAFP misused as LBYL-in-a-`try`.** Wrapping a `hasattr` check in a `try: ... except AttributeError:` is not EAFP — it's LBYL with extra steps. *Lesson 3's read step names both the rule and the limit: EAFP is "try the operation that's the actual work"; if the `try` block is just a check, that's LBYL.*
- **Decorators taught without `functools.wraps`.** A decorator that drops `__name__` / `__doc__` / `__module__` is broken in production (anything that introspects the function — `pytest`, `inspect`, IDE tooltips — sees the wrapper, not the original). *Lesson 5's kata #1 writes a decorator without `wraps`, the test asserts on `__name__`, the test fails, the hint points at `functools.wraps`, the second kata uses it.*
- **Metaclasses as spectacle.** *The crash scroll does not teach metaclasses. Lesson 5's closer names them as deferred. The pre-pivot draft had a "metaclasses (read-only lesson)" step; cut entirely from the polyglot-first scope. Spectacle was the dead end of the old long-curriculum format.*
- **Type hints introduced and abandoned.** *Lesson 1 names type hints in the `self` discussion (as design tool, not runtime check). Lessons 2-5 use hints in starter code consistently. Not introduced as homework — used as scaffolding the polyglot's TS reflex (A4 Felipe) will reward.*
- **Comprehensions nested past readability.** *Lesson 2's read step names the rule: one level of nesting OK, two levels is a code smell, three is wrong. The playground in Lesson 2 lets the learner see why.*

## 7. External references

### Books

- *Fluent Python*, 2nd ed. — Luciano Ramalho. The single best modern Python reference that respects the reader. Chapters 9 (closures + decorators), 17 (context managers), 21 (async). The spine for this scroll's depth references.
- *Effective Python*, 2nd ed. — Brett Slatkin. Item-by-item idioms. Items 11-27 (comprehensions, iteration), 38-43 (decorators, closures), 66-69 (`try/except`, context managers).
- *Python Cookbook*, 3rd ed. — David Beazley & Brian K. Jones. Recipe-style; exercise inspiration across all lessons.
- *Python Crash Course*, 3rd ed. — Eric Matthes. Sequencing reference for absolute beginners — useful as a "what NOT to do for a polyglot" baseline.
- *Robust Python* — Patrick Viafore. The best book on the *strategy* of type hints; reference for the named-and-deferred typing depth.
- *Using Asyncio in Python* — Caleb Hattingh. Short and sharp; reference for the deferred async scroll.
- *Architecture Patterns with Python* — Harry Percival & Bob Gregory. The "ports and adapters" lens applied to Python; aspirational reading.
- *CPython Internals* — Anthony Shaw. Course-author reference for GIL and bytecode honesty.

### Online platforms

- **Exercism Python track** — maintained by a strong volunteer team. Exercise *shapes* (single pure function, hidden tests, mentor hints) are the closest analogue to Dojo's exercise step. Standout exercises to study: `tally`, `pangram`, `allergies`, `clock`, `scrabble-score`. <https://exercism.org/tracks/python>
- **Real Python** — the highest-quality free Python writing on the open web. Use as "further reading" link from explanation steps; never copy. Standout pieces: decorators primer, context managers walk-through, dataclasses guide. <https://realpython.com>
- **Trey Hunner's Python Morsels** — short exercises with thoughtful hints; the *hint structure* is worth studying before writing our own. <https://www.pythonmorsels.com>
- **Talk Python Training** (Michael Kennedy) — strong on modern Python (3.11+), async, packaging. Reference for advanced leveling.
- **Raymond Hettinger's PyCon talks** — "Beyond PEP 8," "Transforming Code into Beautiful, Idiomatic Python," "Super considered super." Mandatory background for course authors on this track.
- **David Beazley's PyCon tutorials** — generators, concurrency, metaprogramming. Gold-standard explanations; not for direct copy but for calibrating the depth bar.
- **CS50P (Harvard)** — high-quality intro with strong testing emphasis. Flagged: too gentle for our audience, useful for the "writing tests is part of the work" framing.

### Official documentation

- <https://docs.python.org/3/reference/datamodel.html> — the dunder bible. Mandatory link from Lessons 1, 4, 5.
- <https://docs.python.org/3/library/contextlib.html> — Lesson 4's reference.
- <https://docs.python.org/3/library/functools.html> — Lesson 5's reference.
- <https://docs.python.org/3/howto/descriptor.html> — Raymond Hettinger's HOWTO. Reference for the deferred descriptors scroll.
- <https://peps.python.org/> — link specific PEPs (8, 20, 343, 318, 484, 492, 634) where they motivate a lesson.
- <https://packaging.python.org/> — reference for Lesson 0's `pip` / `venv` / `pyproject.toml` orientation.

### Community learning resources

- *Python Weekly* (Rahul Chaudhary) — newsletter, good for tracking what working Pythonistas actually use.
- The official Python release notes (3.10+) — pattern matching, `TaskGroup`, `Self`, generic syntax (PEP 695) all best understood from the release-note rationale.
- PyCon and PyData talk archives on YouTube — Raymond Hettinger, David Beazley, Łukasz Langa, Brett Cannon, Ned Batchelder, Hynek Schlawack.
- Hynek Schlawack's blog — packaging, attrs/dataclasses lineage, structlog. Reference for the deferred packaging scroll.

## 8. Implementation order

There is one Python scroll to ship. Order applies to the lessons within it, in the post-2026-06-07 polyglot-first scope:

1. **Lesson 0 — Python en contexto.** Orients the polyglot. Establishes the voice gate (every paragraph removes a decision the polyglot would make in another browser tab). Status: stub, target W1 of the Python authoring sprint.
2. **Lesson 1 — Las dos sintaxis que sorprenden.** Establishes the scroll-level kata shape (Piston Python harness, predict pattern). Lands the "first surprises" so syntax doesn't trip the learner for the rest of the scroll. Status: stub, target W1.
3. **Lesson 2 — Literales y comprehensions.** Comprehensions as the dominant data-transform shape. Ships the first playground step. Status: stub, target W1.
4. **Lesson 3 — EAFP vs LBYL.** The cultural reflex. Status: stub, target W2.
5. **Lesson 4 — Context managers.** The protocol surface earns its first depth. Ships the second playground step. Status: stub, target W2.
6. **Lesson 5 — Decorators + closures.** Closes the scroll with the named-and-deferred list pointing at deep-dives (asyncio, descriptors, metaclasses, typing). Status: stub, target W2.

After the Python scroll ships end-to-end, deep-dive scrolls become candidates for prioritisation. The order suggested in §3.1 is not committed — that's a separate decision per future sprint. The strong candidates (per audience reach + author leverage) are `python-asyncio-deep` (highest audience-pull) and `python-typing-deep` (highest "TS modernizer transfer" for Felipe).

**Playground frontend reuse:** the `data.kind === "playground"` branch ships with Ruby per [ruby/ruby.md §2.3](../ruby/ruby.md). Python's two playground steps reuse the same frontend contract — no additional frontend work needed for this scroll if Ruby ships first. If Python ships first (unlikely given Sprint 026's Ruby focus), the ~4-6 hour frontend work lands before Lesson 2's playground seeds.
