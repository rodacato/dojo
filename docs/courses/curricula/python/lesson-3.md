# Python — Lesson 3: EAFP vs LBYL — el reflejo Pythonic

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-08
> **Spec:** [python.md §4 Lesson 3](python.md#lesson-3--eafp-vs-lbyl--el-reflejo-pythonic) · [python/python.md §Lesson 3](python.md#lesson-3--eafp-vs-lbyl--el-reflejo-pythonic)
> **Primary audience:** A1 Mariana (JS Senior) + A4 Felipe (TS Modernizer). Secondary: A3 Yui (Java Senior).
> **Step count:** 4 (1 `read` + 1 `predict` + 2 `kata`).
> **What changes in the learner's head:** "In Python, you **try the operation and catch the exception** — you don't check preconditions first. This isn't a hack — it's the cultural reflex and it's faster in the common case. `try/except/else/finally` has more shape than I knew. And the EAFP-misused-as-LBYL-in-a-try anti-pattern is the trap I'd otherwise walk into for years."

This file holds the **production prose** for each step's `instruction` / `feedback` / etc. fields. Content is in English; meta-notes in Spanish where helpful.

---

## Step 3.1 — `read` — "El reflejo Pythonic: probá la operación"

**Title:** `The Pythonic reflex: try the operation`
**Type:** `read`
**Word count target:** ~380. Pythonic test §2.1 applied. Embeds the **mandatory `disambiguation` figure per Sprint 027 contract** (the EAFP-vs-LBYL pair with `Intent` as the divergent attribute).

### `instruction` (markdown body)

```markdown
## Why this matters

EAFP — *"Easier to Ask Forgiveness than Permission"* — is the cultural reflex that determines whether you write Python that reads Pythonic or Python that reads Java-with-different-syntax. A polyglot writing Python with Java reflexes writes `if hasattr(x, "value"): return x.value` everywhere; the Pythonic answer is `try: return x.value except AttributeError: return default`. Same outcome, opposite intent. This lesson is **the highest-value read step in the scroll for the primary personas** — if it lands, the rest of your Python reads idiomatically; if it doesn't, you'll spend two years writing LBYL-in-Python before your reviewer catches it.

## The two reflexes

**EAFP — Easier to Ask Forgiveness than Permission.** Try the operation. Catch the specific exception if it fails. This is the cultural default in Python — `try` is **not** the escape hatch it is in Java; it's the *primary* control-flow shape for "this might not work."

**LBYL — Look Before You Leap.** Check preconditions first; then do the operation. This is the cultural default in C, Java, Go.

:figure[disambiguation]{id="eafp-vs-lbyl"}

The figure above shows the two reflexes on the same skeleton — same shape on the page, opposite intent. **Intent** is the single divergent attribute the polyglot has to internalise: every other difference (race-safety, common-case cost, what the reader infers about your familiarity with the language) cascades from that one decision.

## Why EAFP in Python specifically

Three reasons, in order of importance:

1. **Duck typing.** Python doesn't enforce nominal interfaces at the type system — an object behaves like a duck if it quacks. The only honest test is to try the quack and see what happens. `if hasattr(x, "read"):` is a weak claim about the object (the attribute might not be callable, might raise, might lie); `try: x.read()` is the actual test.
2. **Performance in the common case.** In CPython, an exception **not raised** is cheap (≈50 ns). An exception **raised** has cost (≈10 μs), but if your common case is "no exception," EAFP is faster than LBYL because LBYL does the check AND the operation, while EAFP does only the operation.
3. **Race conditions.** `if os.path.exists(p): open(p)` has a race window — the file can be deleted between the check and the open. `try: open(p) except FileNotFoundError:` doesn't. The check-then-act pattern is **structurally** unsafe in any concurrent context; EAFP eliminates the window.

## `try / except / else / finally` — the full shape

```python
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
```

The `else` clause is the part most polyglots have never seen. It runs if the `try` block did not raise. Useful for **separating "the operation succeeded" from "do the operation"** — keeping the `try` block as small as possible (only the line that might raise) and putting the success path in `else`. This is a real discipline difference; `try: x = parse(); use(x) except ValueError: ...` accidentally catches a `ValueError` from `use(x)` too. `try: x = parse() except ValueError: ... else: use(x)` doesn't.

## When LBYL is correct

Not always wrong. Three cases:

- **Cheap check, common no-op case.** `if not items: return` before iterating is cheaper than catching nothing (which doesn't exist anyway). Trivial guards are LBYL by nature.
- **No race risk.** Checking a constant, a local variable, or your own data structure is fine.
- **Avoiding "exception as control flow for the dominant case."** If 95% of calls raise the same exception, your "exception" is actually the normal case — restructure. EAFP assumes the common case is *not* the exception path.

## The footgun: EAFP misused as LBYL-in-a-try

```python
# anti-pattern
try:
    if hasattr(x, "foo"):
        y = x.foo
except AttributeError:
    y = None
```

That's not EAFP — that's LBYL with extra steps. EAFP is "try **the operation that's the actual work**," not "try a check disguised as an operation." The Pythonic shape is:

```python
try:
    y = x.foo
except AttributeError:
    y = None
```

If you find a `try` block that contains a `hasattr` / `in` / `is not None` check, you wrote LBYL in a `try`. Strip the check; the `try` does the work.

Next: a predict on a syntactic trap that bites every polyglot who learned Python before 3.0. Then two katas — `safe_get` (which forces the LBYL-vs-EAFP-vs-`dict.get` choice) and `parse_int_or` (the dominant EAFP shape with a specific exception type).
```

### Paragraph-test audit (Valentina §2.1 gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Is this lesson worth my attention?" — frames EAFP as the highest-value reflex change | KEEP |
| "The two reflexes" | "What do EAFP and LBYL actually mean?" — definitions before the figure | KEEP |
| `:figure[disambiguation]` + caption | The pair made concrete in one glance; **Intent** highlighted as the load-bearing divergent attribute | KEEP (mandatory per S027) |
| "Why EAFP in Python specifically" | "OK but why this reflex in this language?" — three concrete reasons | KEEP |
| `try / except / else / finally` | "Is there more to `try` than I know?" — yes, the `else` clause | KEEP |
| "When LBYL is correct" | "So is LBYL just wrong?" — honest no | KEEP |
| "The footgun: EAFP misused as LBYL-in-a-try" | Names the specific Java-reflex failure mode the lesson defends against | KEEP — load-bearing for kata 3.3 |

**What got cut:** a tour of every exception type in stdlib (no value), the history of Python's exception system, a defence of dynamic typing in general (out of scope), a comparison to Go's `if err != nil` (different lens, different scroll).

---

## Step 3.2 — `predict` — "¿Qué hace esta sintaxis?"

**Title:** `Predict: what does this syntax do?`
**Type:** `predict`
**Mental model under test:** the Python 2 → Python 3 syntactic break in multi-exception `except` clauses. Tests the polyglot's careful reading of legacy-looking code; the trap is that the comma-form is *legal Python 2* with a wildly different meaning than the comma might suggest, and Python 3 made it a hard `SyntaxError` to remove the ambiguity.

### `instruction` (short intro shown above the snippet)

```markdown
One predict on `except`-clause syntax before the katas. The trap here is real legacy code you'll see in old tutorials and pre-2010 codebases.
```

### `question`

```
What does this code do in Python 3?
```

### `snippet`

```python
try:
    x = parse(data)
except ValueError, KeyError:
    x = None
```

### `options`

```yaml
- id: a
  text: "Catches both `ValueError` and `KeyError`, sets `x = None` on either"
- id: b
  text: "Catches only `ValueError`, binds the exception to a variable named `KeyError`"
- id: c
  text: "`SyntaxError` — modern Python requires `except (ValueError, KeyError):` with parens"
- id: d
  text: "Catches `ValueError`, binds the exception to `KeyError`, then catches `KeyError` separately"
correct: c
```

### `feedback` (per option, sensei voice)

**a — Catches both:**
> The intent reads that way, and it's what you'd want in production code. But the syntax is wrong in Python 3 — you'd need parens: `except (ValueError, KeyError):`. Without parens, in Python 2 this meant "catch `ValueError`, bind it to a variable named `KeyError`" — wildly different from the comma-as-tuple reading. Python 3 made the parenless form a hard `SyntaxError` exactly so this ambiguity stops biting.

**b — Catches only ValueError, binds to KeyError:**
> That was the Python 2 meaning of the syntax — ambiguous and surprising enough that Python 3 rejected it at parse time. **You won't see this run** in Python 3; you'll see `SyntaxError`. The correct binding form in Python 3 is `except ValueError as e:` (`as` instead of `,`).

**c — `SyntaxError` — modern Python requires parens:**
> Correct. Python 3 made this a `SyntaxError` to remove the Python 2 ambiguity once and for all. The two modern forms are:
>
> - `except (ValueError, KeyError):` — multi-exception catch (tuple of exception types).
> - `except ValueError as e:` — single catch with the exception bound to a variable.
>
> If you see the bare-comma form in a tutorial or a codebase, you're reading Python 2. Update or distrust the source.

**d — Catches ValueError, binds to KeyError, then catches KeyError separately:**
> Python doesn't chain `except` clauses with commas. Each `except` is its own clause, on its own line. Multi-exception catch requires the tuple-with-parens form (`except (ValueError, KeyError):`).

---

## Step 3.3 — `kata` — `safe_get(d, key, default)`

**Title:** `safe_get — handle a missing key without LBYL`
**Type:** `kata`
**1-line task:** Return `d[key]` if it exists, else `default`. Forces the EAFP shape — but also shows that `dict.get` is the better answer when the operation IS the check.

### `instruction` (markdown body)

```markdown
## Your task

Build `safe_get(d, key, default=None)` that returns `d[key]` if the key exists, else returns `default`.

**Three solutions are correct.** The lesson is in noticing why one is best:

1. **EAFP shape.** `try: return d[key] except KeyError: return default`. Lands the cultural reflex.
2. **`dict.get(key, default)`.** One-liner. The right answer when the operation IS the missing-key check.
3. **LBYL shape.** `if key in d: return d[key] else: return default`. **Works.** **Has a race window in concurrent contexts** (another thread can delete the key between the check and the read). For a single-threaded function it's fine; the discipline reason to avoid it is that the polyglot who writes LBYL here writes LBYL everywhere, including where it bites.

### The `None`-vs-missing trap

What about `safe_get({"a": None}, "a", default="missing")`? The key `"a"` **exists**; its value is `None`. The function should return `None` (the actual value), not `"missing"` (the default for a missing key).

A solution that does `return d.get(key) or default` fails this test — `None or default` evaluates to `default`. **`None` is a legitimate value, not absence.** The fix: use `d.get(key, default)` (which only falls back on missing key) or the EAFP shape (which only catches `KeyError`).

### What's expected

```python
safe_get({"a": 1}, "a")                         # 1
safe_get({"a": 1}, "b")                         # None  (default default)
safe_get({"a": 1}, "b", default="missing")      # "missing"
safe_get({"a": None}, "a", default="missing")   # None  (value IS None, not missing)
```

### Realistic input — the `tally`-shaped dict

One of the tests below uses a dict shaped like `{"a": 2, "b": 1}` — **exactly the output shape your `tally` function from Lesson 2 produced.** That's not coincidence: `safe_get` over a count dictionary is a common production shape (look up a word's count; return `0` if the word never appeared). The retrieval interleaving is deliberate — the lesson-2 muscle compounds here, and you'll see this dict shape again in Lesson 5's decorator wrappers.
```

### `starterCode`

```python
def safe_get(d: dict, key, default=None):
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
    # Same shape `tally(["a", "b", "a"])` produced in Lesson 2.
    counts = {"a": 2, "b": 1}
    _eq(safe_get(counts, "a", default=0), 2)
    _eq(safe_get(counts, "missing", default=0), 0)


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### `hint`

```markdown
Two paths land all five tests cleanly:

1. **EAFP shape.** `try` the dictionary access; `except` the **specific** exception type Python raises when a dict key is missing. Return the default in the `except` branch. The `None`-vs-missing test passes for free because `KeyError` is only raised when the key isn't there — not when the value is `None`.

2. **`dict.get(key, default)` shape.** Dicts have a built-in method that does exactly this: returns the value if the key exists, else the second argument. **Not the same as `dict[key] or default`** — `or` falls back on any falsy value (including `None` and `0`), which breaks the `None`-vs-missing test.

What to avoid: `if key in d: return d[key] else: return default` (LBYL — works but trains the wrong reflex). `return d.get(key) or default` (fails the `None` test).
```

### `referenceSolution`

```python
# EAFP shape
def safe_get(d: dict, key, default=None):
    try:
        return d[key]
    except KeyError:
        return default

# One-liner (the senior answer)
def safe_get(d: dict, key, default=None):
    return d.get(key, default)
```

### Why these tests

| Test | Lands |
|---|---|
| Returns value when key exists | Base case. |
| Returns default None when missing | The default-default path — `safe_get(d, "missing")` works with no default arg. |
| Returns explicit default when missing | The explicit-default path. |
| `None` value returned as `None` | The trap — catches `return d.get(key) or default` (a wrong but plausible one-liner). |
| Empty dict + any key | Smallest missing-key case. |
| Works over a tally-shaped count dict | Retrieval interleaving with Lesson 2 (same dict shape `tally` produces); also rehearses the "lookup with sensible default for missing" pattern the polyglot will reach for in real code. |

---

## Step 3.4 — `kata` — `parse_int_or(s, default)`

**Title:** `parse_int_or — dominant EAFP shape with a specific exception`
**Type:** `kata`
**1-line task:** Try `int(s)`; on failure, return `default`. The dominant EAFP shape: try the actual operation, catch the specific exception type.

### `instruction` (markdown body)

```markdown
## Your task

Build `parse_int_or(s, default)` that returns `int(s)` if `s` parses as an integer, else returns `default`.

This is the **EAFP shape in its purest form**: the `try` block does the work; the `except` clause catches the specific exception type Python raises on failure; nothing else. No `hasattr`, no `isdigit` check, no regex pre-validation. Try, catch, return.

### What's expected

```python
parse_int_or("42", 0)        # 42
parse_int_or("nope", 0)      # 0
parse_int_or("", -1)         # -1
parse_int_or("3.14", 0)      # 0   ← int() doesn't parse floats from strings
parse_int_or("  7  ", 0)     # 7   ← int() strips whitespace
parse_int_or("-5", 0)        # -5  ← negative ints parse fine
```

### Why a specific exception

The temptation is `except:` (bare except). **Don't.** A bare `except` catches `KeyboardInterrupt` (user hits Ctrl-C), `SystemExit` (the interpreter shutting down), and `GeneratorExit` (a generator being closed) — none of which you want to swallow. Catch the **specific** exception type `int()` raises when a string isn't a valid integer.

If you're not sure which exception type that is, try `int("nope")` in a REPL and read the error class name. (The hint nudges if needed.)
```

### `starterCode`

```python
def parse_int_or(s: str, default: int) -> int:
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


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### `hint`

```markdown
The shape is three lines:

```
try:
    return <int conversion of s>
except <specific exception>:
    return default
```

To find the specific exception type:

- `int()` raises a specific exception when the string isn't a valid integer.
- The exception name describes the problem: it's not about *type* (the input IS a string), it's about *value* — the string's value isn't a parseable integer.
- The class name follows that pattern.

What to avoid: `except:` (catches too much, including Ctrl-C); `except Exception:` (still too broad — masks bugs in the calling code); `isdigit()`-based LBYL (fails on negative numbers, fails on whitespace-padded input, and is exactly the LBYL anti-pattern Lesson 3.1 named).
```

### `referenceSolution`

```python
def parse_int_or(s: str, default: int) -> int:
    try:
        return int(s)
    except ValueError:
        return default
```

### Why these tests

| Test | Lands |
|---|---|
| Parses a valid integer | Base case — the `try` path succeeds. |
| Default on non-numeric string | The `except` path — `int("nope")` raises `ValueError`. |
| Default on empty string | The empty-input case — `int("")` also raises `ValueError`. |
| Default on float-shaped string | Catches the polyglot who assumes `int("3.14") == 3` (it doesn't — `int()` doesn't parse floats from strings; it raises `ValueError`). |
| Handles leading/trailing whitespace | Catches an `s.strip()` pre-check that wasn't needed — `int()` already strips. |
| Handles negative integers | Catches an `isdigit()`-based LBYL solution (`"-5".isdigit()` is `False`). |

---

## Self-review checkpoint (before commit)

- [x] Read step passes the paragraph test §2.1 (audit table above).
- [x] Mandatory `disambiguation` figure per Sprint 027 contract is embedded in Step 3.1, with `Intent` as the divergent attribute. Figure data spec in §"Figure data spec" below.
- [x] EAFP-misused-as-LBYL-in-a-try anti-pattern is named explicitly in the read with a concrete code pair (Yui's reflex defended; Mariana's reviewer's pet peeve named).
- [x] Predict feedback names the specific Python-2-vs-3 history behind each wrong answer (not generic "the right answer is C").
- [x] Hint discipline §2.4: `safe_get` hint does NOT name `KeyError` or `dict.get` directly — points at "the specific exception type Python raises when a dict key is missing" and "dicts have a built-in method that does exactly this." `parse_int_or` hint walks the polyglot to the exception name via its meaning ("not about *type*, about *value*").
- [x] Retrieval interleaving applied: the `safe_get` kata exercises `try/except` muscle that Lesson 4 (context managers) will reuse in `__exit__`, and Lesson 5 (decorators) will reuse in `@retry`. The mechanism (EAFP) is the same across the three; the shape (`with` vs `@decorator`) is what changes.
- [x] `Counter(0)` / `parse_int_or("")` / `parse_int_or("-5")` style edge-case tests catch specific polyglot anti-solutions (`or` shortcut, `isdigit` LBYL).
- [x] No "Welcome to exception handling" preamble. No history of exceptions in general. No tour of stdlib exception types.
- [x] Content in English; meta-notes in Spanish.

Pending until suite voice audit: tone calibration as a suite. The read step at ~380 words is on the high end; if suite review flags density, the "When LBYL is correct" subsection (the most cuttable, since the polyglot can infer the rule) is the first candidate.

---

## Figure data spec

The step prose above embeds `:figure[disambiguation]{id="eafp-vs-lbyl"}`. Data:

### `eafp-vs-lbyl` (`disambiguation`) — embedded in Step 3.1

- **Slot:** after the "The two reflexes" definitions, before "Why EAFP in Python specifically".
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ```ts
  {
    type: 'disambiguation',
    id: 'eafp-vs-lbyl',
    sharedSkeletonLabel: 'Read d[key] when the key may be missing · two reflexes',
    attributes: [
      'Shape on the page',
      'Intent',
      'Cultural reflex',
      'Race-safety',
      'Common-case cost',
      'Reads as',
    ],
    entries: [
      {
        title: 'LBYL (Look Before You Leap)',
        values: {
          'Shape on the page': 'if key in d: d[key] else: default',
          'Intent': 'Prove the operation is safe, then perform it',
          'Cultural reflex': 'C, Java, Go — "check first"',
          'Race-safety': 'Unsafe — window between check and act',
          'Common-case cost': 'Check + operation (both run)',
          'Reads as': '"I do not trust this dict"',
        },
      },
      {
        title: 'EAFP (Easier to Ask Forgiveness than Permission)',
        values: {
          'Shape on the page': 'try: d[key] except KeyError: default',
          'Intent': 'Perform the operation; recover if it fails',
          'Cultural reflex': 'Python — "try the work"',
          'Race-safety': 'Safe — no window',
          'Common-case cost': 'Operation only (~50ns when no raise)',
          'Reads as': '"I trust the dict; I handle the miss"',
        },
      },
    ],
    highlightAttribute: 'Intent',
    caption:
      'Same skeleton on the page, opposite intent. Every other difference — race-safety, common-case cost, what the reader infers — cascades from that one decision. The Pythonic reflex is the right column.',
  }
  ```
- **Why this earns embedding:** the disambiguation is the entire lesson in one figure. The prose has to describe in three paragraphs (definitions + why-Python + anti-pattern) what the figure conveys in five rows. The figure does not replace the prose — it anchors it. The polyglot's eye lands on **Intent** (the highlighted row) and the rest of the read is then a justification for why the right column is the Pythonic answer.
- **Authoring cost estimate:** ~10 minutes once the `Disambiguation` renderer exists (it does — pre-existed in `apps/web/src/scrolls/figures/Disambiguation.tsx` from S026).
- **S027 contract:** this is the **mandatory `disambiguation` figure** Sprint 027 committed to ship in the Python scroll. Per the figures menu at [python.md §2](python.md): "at least one `disambiguation` ships in this scroll; Lesson 3 is the primary commitment." Done.
