# Python — Lesson 2: Literales y comprehensions que vas a leer

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-08
> **Spec:** [python.md §4 Lesson 2](python.md#lesson-2--literales-y-comprehensions-que-vas-a-leer) · [python/python.md §Lesson 2](python.md#lesson-2--literales-y-comprehensions-que-vas-a-leer)
> **Primary audience:** A1 Mariana (JS Senior) + A4 Felipe (TS Modernizer). Secondary: A3 Yui (Java Senior).
> **Step count:** 4 (1 `read` + 2 `kata` + 1 `playground`). No predict — the surprises here are mechanical and you internalise them by writing the comprehension, not by guessing output.
> **What changes in the learner's head:** "Comprehensions are not 'clever syntax' — they're the dominant data-transform shape in idiomatic Python, replacing what I'd write as `.map(...).filter(...).reduce(...)` in JS or a `for` loop in Java. Generator expressions look identical but are lazy. f-strings are the modern way to interpolate — `%s` and `.format()` are legacy."

This file holds the **production prose** for each step's `instruction` / `feedback` / etc. fields. Content is in English; meta-notes in Spanish where helpful.

---

## Step 2.1 — `read` — "Cinco literales que vas a leer todo el día"

**Title:** `Five literals you'll read all day`
**Type:** `read`
**Word count target:** ~350. Pythonic test §2.1 applied. Embeds one `array-track` figure (situational per the figures menu — earns its place by making the eager-vs-lazy distinction visible in a single glance).

### `instruction` (markdown body)

```markdown
## Why this matters

Open any non-trivial Python file Friday and you'll see five literal shapes in the first hundred lines: comprehensions (list, dict, set), generator expressions, f-strings, slicing, unpacking. Knowing them on sight = readable code. Not knowing them = three Stack Overflow tabs per function. This lesson lands all five, then the katas force you to write the two that have the most pedagogical weight (`tally` for choosing between idioms, `flatten` for nested-comprehension shape).

## List comprehension

```python
squares = [x * x for x in range(10)]
evens   = [x for x in xs if x % 2 == 0]
```

Reads as "the list of `expr` for each `x` in `xs` (where `p(x)`)." Replaces `xs.map(...)` and `xs.map(...).filter(...)` from JS reflex. **One level of nesting is OK** — `[item for sublist in nested for item in sublist]` reads left-to-right as the equivalent nested `for` loops, and it lands cleanly for the polyglot at one depth (exactly the shape Lesson 2's `flatten` kata uses). **Two levels is a code smell, three is wrong** — at that point use named intermediate variables or a `for` loop, the polyglot you're sending the PR to will thank you.

## Dict and set comprehensions

```python
by_upper = {k.upper(): v for k, v in d.items()}    # dict comprehension
unique   = {x.lower() for x in names}              # set comprehension
```

Same shape, different output container. Dict comprehensions pair with `dict.items()` constantly — that's how you transform a dict's keys or values in one line.

## Generator expression — same shape, lazy

```python
total   = sum(x * x for x in range(1_000_000))
peek    = next(line for line in file if line.startswith("ERROR"))
```

Same syntax as the list comprehension but with **parens** instead of square brackets. **Lazy** — produces values on demand, doesn't materialise the whole sequence. Pass to `sum`, `max`, `min`, `any`, `all`, `next`, or any function that iterates once. The parens are optional when the generator is the sole argument to a function: `sum(x * x for x in xs)` works without an extra `()`.

The cost: a generator can only be consumed **once**. After `next(gen)` exhausts it, you can't iterate again. If you need to iterate twice, you wanted a list.

:figure[array-track]{id="comp-vs-filter-vs-gen"}

The figure above is the same input under three shapes: list comprehension materialises the doubled values eagerly; the filter version drops the cells the predicate rejects (marked `✕`); the generator expression produces the same logical result as the list but lazily — `list(...)` is what materialises it. **The eager-vs-lazy distinction is the one the playground at the end of this lesson explores; the figure here makes it visible in a glance.**

## f-strings

```python
msg   = f"hello {name}, you have {count} messages"
price = f"{value:.2f}"            # format spec — two decimals
debug = f"{x=}"                   # debug form — prints "x=42"
```

Modern way to interpolate. Expressions inside `{}`, format specs after `:`, the `=` debug form is gold for prints. **The polyglot's reflex from JS template literals (`` `${name}` ``) transfers cleanly** — same idea, different sigil. **No `%`-formatting, no `.format()` taught here:** they're legacy, f-strings are the modern default, every later read step in this scroll uses them.

## Slicing recap

```python
xs[1:5]      # indices 1..4
xs[::-1]     # reversed
xs[::2]      # every other
xs[:-1]      # all but last
```

You likely know this from JS. Named here once so the katas don't surprise.

## Unpacking

```python
first, *rest = [1, 2, 3, 4]      # rest = [2, 3, 4]
a, *_, last  = "hello"            # a='h', last='o', middle ignored
merged       = {**defaults, **overrides}    # dict merge
def f(*args, **kwargs): ...                  # collect into positional / keyword
```

Argument unpacking (`*args`, `**kwargs`) is how Python functions receive variable arguments. Dict unpacking (`{**d1, **d2}`) merges. The starred-target pattern (`first, *rest = xs`) is the destructuring equivalent of JS's `const [first, ...rest] = xs`.

Next: two katas. `tally` is small but forces an idiom choice (manual dict comp vs stdlib `Counter`). `flatten` is the nested-comprehension shape — the one-deep nesting the rule above excuses. Then a playground for lazy-vs-eager exploration.
```

### Paragraph-test audit (Valentina §2.1 gate)

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Are comprehensions just clever syntax I can skip?" | KEEP |
| "List comprehension" + nested-OK rule | "How do I read `[x for x in xs if …]`? Can I nest?" — and excuses the `flatten` kata's shape | KEEP |
| "Dict and set comprehensions" | "Is the curly-brace one a set or a dict?" — the syntax tells you, but the polyglot needs the rule | KEEP |
| "Generator expression — same shape, lazy" | "What's the difference between `[]` and `()` here?" — load-bearing for L4/L5 too | KEEP |
| `:figure[array-track]` + caption | The eager-vs-lazy distinction visible at a glance; replaces a paragraph that would re-describe the playground | KEEP (figure earns its place per §INTERACTIVITY-PATTERNS) |
| "f-strings" | "Why are some strings prefixed with `f`?" and "should I use `%s` or `.format`?" — answers both | KEEP |
| "Slicing recap" | Named once so the katas don't surprise; doesn't re-teach what the polyglot knows | KEEP (one paragraph, not a tour) |
| "Unpacking" | "What does `*rest` and `**kwargs` actually do? Why are there stars?" | KEEP |

**What got cut:** "Python is readable because of comprehensions" (consensus marketing), a tour of every container type (`list` / `tuple` / `set` / `dict` definitions — the polyglot knows what these are), the history of `%`-formatting (no value to the polyglot in 2026), comprehension-vs-`map()`-vs-`filter()` philosophical debate (the answer is "comprehensions" — move on), `frozenset` (deep-dive territory), `bytes` literals (out-of-scope without a `bytes`-handling kata to motivate).

---

## Step 2.2 — `kata` — `tally(words)`

**Title:** `Build a tally function — choose your idiom`
**Type:** `kata`
**1-line task:** Given a list of strings, return a dict mapping each unique string to the count of occurrences. Two idioms are correct; the kata is the choice.

### `instruction` (markdown body)

```markdown
## Your task

Given a list of strings, return a dict mapping each unique string to the number of times it appears.

**Two solutions are idiomatic:**

1. A **dict comprehension** over the unique words, using `list.count` for each — the "do it with what you just learned" answer.
2. **`collections.Counter`** from the stdlib — the "use the right tool" answer.

Both pass the tests. Pick the one whose Pythonic-ness you can defend out loud in a code review. The hint nudges if you're stuck.

### What's expected

```python
tally(["hi", "bye", "hi"])    # {"hi": 2, "bye": 1}
tally([])                     # {}
tally(["a"])                  # {"a": 1}
```
```

### `starterCode`

```python
def tally(words: list[str]) -> dict[str, int]:
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


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### `hint`

```markdown
Two paths:

1. **Stdlib path.** There's a module in Python's standard library specifically designed for counting hashable things. It lives in the `collections` module. Look at what its constructor accepts — it takes an iterable and returns the counted dict-like object directly. One line.

2. **Comprehension path.** You can build the dict yourself with a comprehension. The trick: iterate over the **unique** words (turn the list into a set first), and for each unique word, use a list method that returns how many times an element appears. The shape is `{word: <count of word in words> for word in <unique words>}`.

Both are correct. The first is what a senior Pythonista would write; the second is what someone who just learned comprehensions would write and what your reviewer will gently rewrite during PR review.
```

### `referenceSolution`

```python
# Idiom 1 — the senior answer
from collections import Counter

def tally(words: list[str]) -> dict[str, int]:
    return dict(Counter(words))

# Idiom 2 — the comprehension answer
def tally(words: list[str]) -> dict[str, int]:
    return {w: words.count(w) for w in set(words)}
```

### Why these tests

| Test | Lands |
|---|---|
| Counts duplicates correctly | The base case (`tally(["hi", "bye", "hi"])` exercises duplicate counting). |
| Empty input returns empty dict | The empty path — comprehension over `set([])` is `{}`; `Counter([])` is the empty `Counter`. |
| Single word maps to count 1 | The "edge between empty and bulk" case. |
| Preserves all unique keys | Catches a solution that misses a key when counts are uneven. |

---

## Step 2.3 — `kata` — `flatten(nested)`

**Title:** `Flatten a list of lists`
**Type:** `kata` (broken→fix shape — see [`../../INTERACTIVITY-PATTERNS.md`](../../INTERACTIVITY-PATTERNS.md) §"Broken→fix katas")
**1-line task:** Fix a nested comprehension whose `for` clauses are in the wrong order. Forces the nested-comprehension shape — the one-deep nesting Step 2.1 excused as legitimate.

### `instruction` (markdown body)

```markdown
## Fix the bug

`flatten(nested)` should take a list of lists of integers and return a single flat list containing every integer in order.

```python
flatten([[1, 2], [3], [4, 5]])    # [1, 2, 3, 4, 5]
flatten([])                       # []
flatten([[]])                     # []
```

The implementation below reaches for the right tool — a one-deep nested comprehension — but writes the two `for` clauses in the **wrong order**. It reads like the nested loops a polyglot expects, but it isn't: the comprehension's `for` clauses run **left-to-right**, like the loops you'd write top-to-bottom, so naming `row` in the output and first clause before the second clause binds it raises `NameError`. **Fix it** by ordering the clauses so the outer loop comes first.

**The idiomatic answer is a one-deep nested comprehension.** The 2.1 read step named the rule: one level of nesting reads cleanly left-to-right; two is a code smell. This is the one-level case the rule excuses. If you find yourself rewriting it as `sum(nested, [])` or `functools.reduce(...)`, stop — the lesson is the clause order, not a different tool. (`itertools.chain.from_iterable` is also acceptable and arguably more idiomatic at scale; it does not appear in the hint because the comprehension is the lesson.)
```

### `starterCode` (plausible-but-wrong: nested comprehension with the `for` clauses reversed)

```python
def flatten(nested: list[list[int]]) -> list[int]:
    return [x for x in row for row in nested]
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


import json, sys
sys.stdout.write("__DOJO_RESULT__ " + json.dumps({"tests": _tests}) + "\n")
```

### `hint`

```markdown
Nested comprehensions read **left-to-right in the order you'd write the nested `for` loops**. The first `for` clause is the outer loop; the second is the inner loop.

Try the shape `[? for ? in nested for ? in ?]` and figure out what to put in each blank:

- What are you iterating *over* in the outer loop? (The thing the parameter holds.)
- What's the inner loop iterating over? (Each element of the outer loop.)
- What do you want in the result list? (Each element of the inner loop.)

If the result is `[]`, you've put the loops in the wrong order or used the wrong variable in the output position.
```

### `referenceSolution`

```python
def flatten(nested: list[list[int]]) -> list[int]:
    return [item for sublist in nested for item in sublist]
```

### Why these tests

| Test | Lands |
|---|---|
| Typical nested list | Base case. |
| Empty outer list | The "iterate zero times" case — comprehension over `[]` is `[]`. |
| List of empties | The "outer has elements but inner is empty" case. |
| Preserves order | Catches solutions that use `set` (deduplicates and loses order). |
| Single-element single-sublist | Smallest non-empty input. |

---

## Step 2.4 — `playground` — "Comprehension vs generator expression"

**Title:** `Playground: comprehension vs generator expression`
**Type:** `kata` (with `data.kind: "playground"` — no verdict UI, button reads "Ejecutar")
**Mental model under exploration:** eager (materialised) vs lazy (on-demand) iteration; the one-shot nature of generators.

### `instruction` (markdown body)

```markdown
## Play around

This step is a **playground**, not a kata. There's no verdict to pass — there's a runner button that executes whatever you write and shows the output. The harness runs a trivially-true assertion so the backend stays uniform, but the focus is on your output, not on a green checkmark.

The starter code below sets up the same logic in three shapes: a list comprehension (eager), a generator expression (lazy), and a second iteration over the generator. Run it as-is first to see what each prints, then change the input and see what breaks.

Specific things worth trying:

- What is the **type** of each (`type(list_comp)`, `type(gen_exp)`) and what does that tell you about the API surface?
- What happens when you call `next(gen_exp)` once? Twice? After exhaustion?
- What does `list(gen_exp)` return the **first** time? The **second** time?
- When would you reach for a generator over a list comprehension in real code? (Hint: memory, or a stream you can't materialise.)

This step prints to the console because it's a playground — the runner shows stdout instead of test verdicts. In `kata` steps the harness captures `print` output so it doesn't drown the assertions; here it's the whole point. If you copy this pattern into a kata and your `print` "disappears", that's why.
```

### `starterCode`

```python
xs = range(5)

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

### Hint (Maya §2.3 voice contract — specific things to try, not "explorá libremente")

```markdown
The starter prints the second `list(gen_exp)` as `[]`. That's not a bug — generators are one-shot iterators. After you consume one, it's spent.

Things to vary:

- Swap `range(5)` for `range(10_000_000)`. The list comprehension materialises ten million squares (slow, memory-hungry). The generator expression doesn't materialise anything until you ask. **Add `import sys; print(sys.getsizeof(list_comp), sys.getsizeof(gen_exp))`** to see the size difference. The generator is a constant ~100 bytes regardless of input.
- Replace `list(gen_exp)` with `sum(x ** 2 for x in xs)` — the parens around the generator expression are optional when it's the sole argument.
- Try `next(gen_exp)` repeatedly until you get a `StopIteration` exception. That's the iterator protocol the dunder lesson named (`__iter__` / `__next__`).
```

---

## Self-review checkpoint (before commit)

- [x] Read step passes the paragraph test §2.1 (audit table above). What got cut is named at the table footer.
- [x] The one-deep nested-comprehension excuse Lesson 2.1 carries is explicit — `flatten` kata's instruction back-references it, so the two pieces read as a single contract, not as a contradiction with §6.
- [x] Hint discipline §2.4: `tally` hint does NOT name `Counter` or `collections.Counter` directly — points at "a module in the standard library specifically designed for counting hashable things." `flatten` hint walks the shape without naming `for sublist in nested` directly.
- [x] Playground voice contract §2.3: instruction lists specific things to try (`next`, `type`, `list` twice, `sys.getsizeof`), not "explorá libremente." Maya's veto avoided.
- [x] Playground instruction carries the print-routing note (the spec's §7 Maya-resolved item) so a learner who copies the pattern into a kata understands why their `print` vanishes.
- [x] One figure embedded (`array-track` — `comp-vs-filter-vs-gen`). Earns its place per the figures menu: makes the eager-vs-lazy distinction visible at a glance; the playground then lets the learner *feel* it. Figure data spec in §"Figure data spec" below.
- [x] Forward reference to L3 EAFP (`tally` and `flatten` are the identifiers Lesson 3's EAFP exercises will reuse — retrieval interleaving per the outer spec).
- [x] No "Welcome to comprehensions" preamble. No tour of every container type. No `%`-formatting history.
- [x] Content in English; meta-notes in Spanish.

Pending until suite voice audit: tone calibration as a suite, possible cuts if any paragraph in 2.1 reads dense after the per-dunder analogue table in L1.

---

## Figure data spec

The step prose above embeds `:figure[array-track]{id="comp-vs-filter-vs-gen"}`. Data:

### `comp-vs-filter-vs-gen` (`array-track`) — embedded in Step 2.1

- **Slot:** after the "Generator expression — same shape, lazy" paragraph, before "f-strings".
- **Schema** (per [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)):
  ```ts
  {
    type: 'array-track',
    id: 'comp-vs-filter-vs-gen',
    input: [1, 2, 3, 4, 5],
    tracks: [
      {
        label: '[x*2 for x in xs]',
        states: ['done', 'done', 'done', 'done', 'done'],
        output: '[2, 4, 6, 8, 10]',
      },
      {
        label: '[x for x in xs if x>2]',
        states: ['out', 'out', 'done', 'done', 'done'],
        output: '[3, 4, 5]',
      },
      {
        label: '(x*2 for x in xs) → list()',
        states: ['done', 'done', 'done', 'done', 'done'],
        output: '[2, 4, 6, 8, 10] (lazy)',
      },
    ],
    caption:
      'Same input, three shapes. The list comprehension materialises each cell eagerly. The filter version drops cells the predicate rejects (✕). The generator expression produces the same logical output as the list, but lazily — list(...) is what materialises it, and only once.',
  }
  ```
- **Why this earns embedding:** the playground at the end of this lesson lets the learner *experience* the lazy-vs-eager distinction by running code. The figure here lets them *see* it before they try it. The polyglot's eye picks out the third track immediately as "same end state, different mechanism." Removing the figure forces the read step to describe in prose what the figure conveys at a glance.
- **Authoring cost estimate:** ~10 minutes once the `ArrayTrack` renderer exists (it does — shipped in commit `2997d9b` during S027 W1).
