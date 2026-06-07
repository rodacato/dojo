# Ruby — Lesson 1: Blocks — the syntax you see everywhere

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-07
> **Spec:** [ruby.md §4 Lesson 1](ruby.md#lesson-1--blocks-lo-que-ves-en-todos-lados)
> **Primary audience:** A1 Mariana (JS Senior), A2 Esteban (Python Mid-Senior). Secondary: A4 Felipe.
> **Step count:** 5 (1 `read` + 1 `predict` + 2 `kata` + 1 `playground`).

Production prose for each step's `instruction` / `feedback` / etc. fields. Content in English. Meta-notes in Spanish where helpful.

---

## Step 1.1 — `read` — "Blocks: the syntax you see everywhere"

**Title:** `Blocks — the syntax you see everywhere`
**Type:** `read`
**Word count target:** ~380. Carries 4 name-and-defer mentions (Proc/lambda, `block_given?`, `{}`/`do` precedence, `&:method` mechanism) — under Rhea's ceiling of 5.

### `instruction` (markdown body)

```markdown
## Why this matters

Open any Ruby file with any substance and you'll see `do |x| ... end` and `{ |x| ... }` everywhere. They're not the syntax of `each` — `each` is one of the many methods that take a block. Blocks are the language's central abstraction for "pass behaviour into a method". A polyglot who can read blocks can read Ruby.

## What blocks look like in the wild

```ruby
[1, 2, 3].each do |x|
  puts x
end

[1, 2, 3].map { |x| x * 2 }
5.times { puts "hi" }
File.open("path.txt") { |f| f.read }
[1, 2, 3].tap { |arr| puts arr.size }
```

`each`, `map`, `times`, `File.open`, `tap` — none of them are language keywords. They are stdlib methods that happen to accept a block as an extra argument.

## What a block is, technically

A block is **syntax** — a chunk of code passed to a method call as a special extra argument. Two equivalent forms:

- `do |args| ... end` — multi-line.
- `{ |args| ... }` — single-line.

The args between `|...|` match what the method yields; blocks can take several: `[[1, 2], [3, 4]].map { |a, b| a + b }` produces `[3, 7]`; hashes iterate with `|k, v|`. **By itself a block is not an object you can store in a variable** — it only exists as an object when a method captures it with `&block` (see below).

## Convention: `do...end` vs `{...}`

`do...end` for multi-line or side-effecting blocks; `{...}` for single-line expressions that return a value. There's also a precedence difference — `foo bar { ... }` binds the block to `bar`; `foo bar do ... end` binds it to `foo`. So the convention isn't purely aesthetic; when it matters, the bug is silent. Depth in the blocks deep-dive.

## `yield` invokes the block from inside the method

```ruby
def shout
  yield.upcase + "!"
end

shout { "hello" }  # => "HELLO!"
```

The block `{ "hello" }` returns `"hello"` (last expression, implicit return). `yield` hands that back to the method. The method processes it, returns the result.

**If you come from Python:** Ruby's `yield` is **not** Python's `yield`. Python's emits values from a generator; Ruby's invokes the block the caller passed. Same word, different semantics — it's the #1 trap for Python developers learning Ruby.

## `&:method` shorthand

```ruby
[1, 2, 3].map(&:to_s)  # ≡ [1, 2, 3].map { |x| x.to_s }
```

Syntactic sugar that turns a symbol into a block. *Why* it works is explained in Lesson 3 once the object model is on the table. For now, use it as a pattern.

## Quick notation you'll see in the next step

`#{expression}` inside double-quoted strings evaluates the expression and inserts the result — Lesson 2 covers it in depth. `puts` prints to STDOUT with a trailing newline; the method `puts` itself returns `nil`, not the text it printed.

## `&block` — capturing the block as an object

A method can name the block as a parameter using `&block`:

```ruby
def with_logger(&block)
  puts "start"
  result = block.call
  puts "done"
  result
end
```

Same effect as `yield` but now the block is a `Proc` object — you can store it, pass it on, or call it multiple times.

## `block_given?`

A method can check whether the caller passed a block and behave differently. The canonical case: `[1, 2, 3].each` with no block returns an `Enumerator` (lazy, chainable); with a block, it iterates and returns the array. You'll see `block_given?` in any decent gem.

## Named-and-deferred: `Proc` vs `lambda`

Procs and lambdas behave differently around `return` and around arity strictness. That's the blocks deep-dive scroll's territory. We name it here so you don't get blindsided in production code; the depth lives elsewhere.
```

### Paragraph-test audit

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Should I treat blocks as special or as a callback?" | KEEP |
| "What blocks look like in the wild" | "What does Ruby code *look* like when blocks are present?" | KEEP |
| "What a block is" | "Are blocks objects, callbacks, lambdas, or what?" | KEEP — answers the contradiction Mariana caught |
| "Convention" | "Should I always use `do/end`? Why two syntaxes?" — and the precedence bug | KEEP |
| "`yield`" + Python disclaimer | The #1 Python-dev trap. Without this, Esteban derails | KEEP |
| "`&:method` shorthand" | "What's that `&:foo` I keep seeing?" — preview, mechanism deferred | KEEP |
| "Quick notation" | Forward reference for predict 1.2 — Esteban flagged this | KEEP |
| "`&block`" | "How do I store a block as a thing I can pass on?" | KEEP |
| "`block_given?`" | "How does `each` know whether to iterate or return Enumerator?" | KEEP |
| "Proc vs lambda deferred" | "What are the gotchas I should know exist?" | KEEP (named-and-deferred per §2.5) |

---

## Step 1.2 — `predict` — "What does `with_timer { 1 + 1 }` return?"

**Title:** `Predict: what does this code return?`
**Type:** `predict`
**Mental model under test:** yield returns the block's value; method returns its last expression. Two hops.

### `instruction`

```markdown
Before you write code, predict one thing.
```

### `question`

```
Given that `Process.clock_gettime(Process::CLOCK_MONOTONIC)` returns a Float in seconds, what does this call **return**?
```

### `snippet`

```ruby
def with_timer
  start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  result = yield
  elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - start
  [result, elapsed.round(2)]
end

with_timer { 1 + 1 }
```

### `options`

```yaml
- id: a
  text: "`[2, 0.0]`"
- id: b
  text: "`[nil, 0.0]`  (the block doesn't return anything useful)"
- id: c
  text: "`LocalJumpError` — `yield` fails because no arguments were passed"
- id: d
  text: "`2` alone (the method returns whatever the block returns)"
correct: a
```

### `feedback`

**a — `[2, 0.0]`:**
> Correct. The block `{ 1 + 1 }` returns `2` by implicit return (the last expression is the block's value, same rule as any Ruby method). `yield` hands that `2` back to the calling method, which binds it to `result`. The method's last expression is `[result, elapsed.round(2)]` — that's the value `with_timer` returns to its caller. The time between the two `clock_gettime` calls is ~0s for a trivial addition; `round(2)` makes it `0.0`.

**b — `[nil, 0.0]`:**
> The C/Java reflex: "small blocks don't return implicitly." In Ruby, every chunk of code — method or block — returns its last expression by default. If you wanted the block to explicitly return `nil`, you'd write `{ 1 + 1; nil }`.

**c — `LocalJumpError`:**
> `LocalJumpError` happens when a method calls `yield` and *no block was passed*. Here `with_timer { 1 + 1 }` does pass a block, so `yield` invokes it cleanly. `yield` with or without arguments always invokes the block — the arguments would be for the block, not for `yield` itself.

**d — `2` alone:**
> Close — `yield` does return `2` to the method. But `with_timer` continues afterwards: it computes `elapsed`, and its last expression is `[result, elapsed.round(2)]`. The block's value flows into the method; the method's value (its last expression) flows back to the caller. Two separate hops: block → method, method → caller.

---

## Step 1.3 — `kata` — `repeat(n) { ... }`

**Title:** `repeat(n) — invoke the block n times`
**Type:** `kata`

### `instruction`

```markdown
## Your task

Implement `repeat(n)` that invokes the block passed to it `n` times. The block's return value doesn't matter; what matters is that it's called the right number of times.

## Examples

```ruby
counter = 0
repeat(3) { counter += 1 }
counter  # => 3

repeat(0) { raise "shouldn't be called" }
# does not raise — the block was never invoked
```

The idiomatic solution is a single line. Think Ruby, not C.
```

### `starterCode`

```ruby
def repeat(n)
  # Your code here.
end
```

### `testCode` (uses RB_HARNESS_HEADER + FOOTER from seed)

```ruby
_t('calls the block 3 times') do
  counter = 0
  repeat(3) { counter += 1 }
  _eq counter, 3
end

_t('does not call the block when n is 0') do
  counter = 0
  repeat(0) { counter += 1 }
  _eq counter, 0
end

_t('calls the block 5 times') do
  counter = 0
  repeat(5) { counter += 1 }
  _eq counter, 5
end
```

### `hint`

> Think about which object already knows how to iterate N times. In Ruby, integers aren't a primitive type — they're objects with methods. Which of those methods invokes a block?

### `solution`

```ruby
def repeat(n)
  n.times { yield }
end
```

### `alternativeApproach`

> A solution without `Integer#times` would be a manual loop:
>
> ```ruby
> def repeat(n)
>   i = 0
>   while i < n
>     yield
>     i += 1
>   end
> end
> ```
>
> It works — but it's C-idiomatic, not Ruby-idiomatic. When a collection or an integer already knows how to iterate, stay on the method side; manual loops in Ruby usually signal a method you didn't know about. Reach for `while` only when you genuinely need its semantics (loop with a condition that isn't a count).

---

## Step 1.4 — `kata` — `map_keys(hash, &block)`

**Title:** `map_keys(hash) — transform the keys with a block`
**Type:** `kata`

### `instruction`

```markdown
## Your task

Implement `map_keys(hash)` that takes a hash and a block, and returns a new hash where each key has been transformed by the block. The values stay unchanged.

## How `&block` works in the signature

When you declare a parameter as `&block`, you capture the block passed by the caller as a `Proc` object named `block`. You invoke it with `block.call(arg)` or pass it on to another method using `&block` (same sigil — `&` unwraps a Proc into a block on the way out and rewraps a block as a Proc on the way in).

## Force the signature to accept both forms

Your method must accept **both** the `do...end` form and the `&:method` shorthand:

```ruby
map_keys({ a: 1, b: 2 }) { |k| k.to_s }
# => { "a" => 1, "b" => 2 }

map_keys({ "Foo" => 1, "BAR" => 2 }, &:downcase)
# => { "foo" => 1, "bar" => 2 }
```

The second example is the proof your signature captured the block correctly — if the method uses only `yield` (no `&block` parameter), the `&:downcase` at the call site has nothing to receive it and won't apply.

## Collision note

If two original keys collapse after the transform (e.g. `"Foo"` and `"FOO"` both become `"foo"` under `&:downcase`), `Hash#transform_keys` keeps the **last** one. The tests don't exercise this case — it's named here so the behaviour isn't surprising.
```

### `starterCode`

```ruby
def map_keys(hash, &block)
  # Your code here.
end
```

### `testCode`

```ruby
_t('transforms symbol keys to strings using an explicit block') do
  result = map_keys({ a: 1, b: 2 }) { |k| k.to_s }
  _eq result, { "a" => 1, "b" => 2 }
end

_t('accepts &:downcase as a block shorthand') do
  result = map_keys({ "Foo" => 1, "BAR" => 2 }, &:downcase)
  _eq result, { "foo" => 1, "bar" => 2 }
end

_t('empty hash returns empty hash') do
  _eq(map_keys({}) { |k| k }, {})
end
```

### `hint`

> `Hash` ships a method that does exactly this — its name starts with `transform_`. And once you capture the block as `&block` in the signature, you can pass it on to another block-taking method by using `&block` again in that method's call.

### `solution`

```ruby
def map_keys(hash, &block)
  hash.transform_keys(&block)
end
```

### `alternativeApproach`

> Without `Hash#transform_keys`, an `each_with_object` build-up works:
>
> ```ruby
> def map_keys(hash, &block)
>   hash.each_with_object({}) { |(k, v), acc| acc[block.call(k)] = v }
> end
> ```
>
> Or using `yield` instead of `&block`:
>
> ```ruby
> def map_keys(hash)
>   hash.transform_keys { |k| yield(k) }
> end
> ```
>
> The `yield` version does **not** accept `&:downcase` as a second argument — without a `&block` parameter, there's nothing to receive the block-shorthand. That's the distinction the tests force: "this method accepts a block" (yield) is weaker than "this method captures the block as an object" (`&block`). The second lets you pass the block on to other methods cleanly.

---

## Step 1.5 — `playground` — "Explore `&:method` and `Symbol#to_proc`"

**Title:** `Playground: explore &:method`
**Type:** `kata` with `data.kind: "playground"` flag
**No tests in the pedagogical sense:** the harness carries a single trivially-true assertion to keep the backend uniform; the frontend (B2) reads the flag and hides verdict UI.

### `instruction`

```markdown
## What this is

A playground — no test results, no pass/fail. You run code, watch the output, and form intuition. The previous kata used `&:downcase` to pass `Symbol#downcase` as a block. The shorthand works with any unary method (no arguments beyond the receiver) on each element of the collection.

## Run the starter code first

It calls `&:upcase`, `&:to_s`, `&:next`, `&:zero?`, `&:abs` on five different inputs. Read the output — `String#next` is the one that'll surprise you.

## Then experiment

Three questions to explore by changing the code:

1. **What happens if you pass a symbol that isn't a method on the receiver?** Try `[1, 2, 3].map(&:nope)`. Read the error carefully — Ruby's error message tells you exactly which method was missing on which class.
2. **What happens if the method requires an argument?** Try `[1, 2].map(&:+)`. `Integer#+` needs another integer; `&:+` only supplies the receiver. The error explains the mismatch.
3. **`[1, 2, 3].inject(&:+)` — what does this do and why does it work?** (Hint for JS folks: it's the same shape as `[1,2,3].reduce((a, b) => a + b, 0)` in JS, or `functools.reduce(operator.add, [1,2,3])` in Python.) `Enumerable#inject` passes pairs of values to the block; `&:+` is `Integer#+`, which sums them. Idiom: `[1, 2, 3].inject(&:+) # => 6`.

The harness has a single placeholder test that always passes. The point isn't to write tests — it's to build the muscle of "what can `&:method` do?".
```

### `starterCode`

```ruby
# Run these first:
puts ["hello", "world"].map(&:upcase).inspect
puts [1, 2, 3].map(&:to_s).inspect
puts ["a", "b", "c"].map(&:next).inspect    # String#next: "a" -> "b", "z" -> "aa"
puts [1, 4, 9].map(&:zero?).inspect
puts [1, -2, 3].map(&:abs).inspect

# Your turn — try the three questions in the instructions above.
# Read the errors carefully when you get them; Ruby's error messages
# tell you which method was missing on which class.
```

### `testCode` (placeholder so the harness exits cleanly)

```ruby
_t('explored') { _eq true, true }
```

### `hint`

> Not applicable — this is a playground, not a kata.

### `solution`

> Not applicable — no canonical solution.

### `alternativeApproach`

> Not applicable.

---

## Self-review checkpoint

- [x] Read 1.1 carries 4 name-and-defer mentions (Proc/lambda, `block_given?`, `{}`/`do` precedence, `&:method` mechanism) — under Rhea's ceiling of 5.
- [x] Paragraph test §2.1 audited per paragraph (table above).
- [x] Hint discipline §2.4 applied: 1.3's hint points at where to look (`Integer`'s methods) without naming `times`. 1.4's hint points at `transform_` prefix without spelling it out.
- [x] Predict 1.2 reformulated to "what returns" — no leak via puts template.
- [x] Python `yield` disclaimer present and explicit.
- [x] Block-as-syntax / `&block`-as-object contradiction resolved by ordering — syntax first, capture-as-object explicit when `&block` is introduced.
- [x] Playground 1.5 has a concrete instruction with three explorable questions, not "play around".
- [x] Content in English; meta-notes in Spanish.
