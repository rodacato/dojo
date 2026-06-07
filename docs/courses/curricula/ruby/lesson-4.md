# Ruby — Lesson 4: Control flow + truthiness

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-07
> **Spec:** [ruby.md §4 Lesson 4](ruby.md#lesson-4--control-flow--truthiness)
> **Primary audience:** A1 Mariana (JS Senior), A2 Esteban (Python Mid-Senior). Secondary: A4 Felipe.
> **Step count:** 4 (1 `read` + 1 `predict` + 1 `kata` + 1 `challenge`).

Production prose for each step's fields. Content in English, meta-notes in Spanish where helpful.

---

## Step 4.1 — `read` — "Truthiness, `case/when`, and the postfix forms"

**Title:** `Truthiness, case/when, and the postfix forms`
**Type:** `read`
**Word count target:** ~340. Cuts anything that explains "what is an if statement". Keeps only the four Ruby surprises.

### `instruction` (markdown body)

```markdown
## Why this matters

You already know `if`, `else`, `while`. This step skips them and covers the four control-flow facts in Ruby that don't translate from JS / Python / Go / Java without surprising you at least once.

## 1. Only `false` and `nil` are falsy

Everything else is truthy. Including `0`. Including the empty string `""`. Including the empty array `[]`.

```ruby
if 0       then puts "0 is truthy"       end   # prints
if ""      then puts "empty string truthy" end # prints
if []      then puts "empty array truthy" end  # prints
if nil     then puts "nil truthy"        end   # does not print
if false   then puts "false truthy"      end   # does not print
```

This is the polyglot reflex that breaks most often. In Python `0` is falsy. In JavaScript `0` and `""` are both falsy. In C, `0` is falsy. In Ruby, **the only two falsy values are `false` and `nil`** — full stop. Every other value is truthy regardless of its "emptiness" or numeric value.

When you want emptiness, ask for it explicitly: `arr.empty?`, `str.empty?`, `n.zero?`. The methods exist precisely because the falsy-trick doesn't work.

## 2. `case/when` uses `===`, not `==`

`case/when` is Ruby's switch — but the comparison inside each `when` isn't `==`, it's `===` (called "case equality" or "triple equals").

The default `===` on most classes is the same as `==`. The difference matters when `===` is overridden — and three overrides do the heavy lifting:

- **`Class === instance`** is `instance.is_a?(Class)`. So `case x; when Integer then "int" end` works.
- **`Range === value`** is `range.include?(value)`. So `case x; when 1..10 then "small" end` works.
- **`Regexp === string`** is `regex.match?(string)`. So `case x; when /^foo/ then "starts with foo" end` works.

Combined, `case/when` is much more powerful than a JS `switch` (which is strict-equals only). It's how Ruby dispatches on type, on range, on pattern — all with one syntax.

## 3. `unless` and `until` are first-class

`unless x` reads as `if !x`. `until x` reads as `while !x`. They're not syntactic sugar; they're peers of `if` and `while`. Use them when the negation reads more naturally:

```ruby
unless user.admin?
  raise "not allowed"
end

# is clearer than
if !user.admin?
  raise "not allowed"
end
```

Style: `unless` and `until` should appear without an `else` clause. `unless x then ... else ... end` is technically legal but always reads worse than the equivalent `if`. If you find yourself reaching for `unless ... else`, flip it back to `if`.

## 4. Postfix `if` / `unless` for guards

```ruby
return nil if value.nil?
raise "no user" unless user
log(message) if debug?
```

Postfix is one of Ruby's signature looks. Use it for **one-line guards** at method entry and short skip-this-line conditionals. Don't chain or nest postfix; multi-line conditions should use the standard form. The line should read like English: "do X if Y" — when it doesn't, switch back to prefix.
```

### Paragraph-test audit

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Will this be a walkthrough of if/else?" — anti-tour-guide | KEEP |
| "Only false and nil are falsy" | The #1 polyglot reflex break | KEEP |
| "case/when uses ===" | "Why does Ruby's switch dispatch on class?" | KEEP |
| "unless and until" | "Why are these in the language? Are they just sugar?" | KEEP |
| "Postfix if/unless" | "Should I use `return x if y` or always prefix?" | KEEP |

Cut from draft: a paragraph about `loop do ... end` (rare, deep-dive territory); a paragraph on multi-line conditional expressions (`x = if y then a else b end`) — interesting but not a polyglot trap.

---

## Step 4.2 — `predict` — "Is `if 0` truthy or falsy?"

**Title:** `Predict: is "if 0" truthy or falsy?`
**Type:** `predict`
**Mental model under test:** Ruby's two-falsy rule.

### `instruction`

```markdown
Before the next kata, predict one thing.
```

### `question`

```
What does this print?
```

### `snippet`

```ruby
if 0
  puts "truthy"
else
  puts "falsy"
end
```

### `options`

```yaml
- id: a
  text: "`truthy`"
- id: b
  text: "`falsy`"
- id: c
  text: "Raises `TypeError` — `if` needs a boolean, not an integer"
- id: d
  text: "`falsy` — Ruby implicitly coerces `0` to `false` via `Integer#to_b` (like Python's `bool(0)`)"
correct: a
```

### `feedback`

**a — `truthy`:**
> Correct. In Ruby, the only falsy values are `false` and `nil`. Every other value — including `0`, `""`, and `[]` — is truthy. When you need to check for zero, use `n.zero?`; for emptiness, use `arr.empty?`. The boolean-falsy trick from other languages doesn't work here.

**b — `falsy`:**
> The C / Python / JS reflex. In C, `if (0)` is false. In Python, `bool(0)` is `False`. In JavaScript, `if (0)` is falsy. In Ruby, **`0` is truthy** — the language inherits this from Smalltalk, not from C. Only `false` and `nil` are falsy.

**c — `TypeError`:**
> The static-typing reflex (Go, Rust). Those languages require a `bool` in conditional position. Ruby — and Python, JS, Lua — accept any value and check truthiness at runtime. No `TypeError` here.

**d — `falsy` via implicit `Integer#to_b` coercion:**
> Ruby has no implicit boolean coercion. There's no `Integer#to_b` method — you can confirm with `5.respond_to?(:to_b)` (returns `false`). The truthiness check is direct on the object: anything other than `false` or `nil` is truthy, regardless of class or value. Python's `bool(0) == False` has no Ruby analogue. If you want to test for zero specifically, use `n.zero?` explicitly.

---

## Step 4.3 — `kata` — `classify(x)`

**Title:** `classify(x) — dispatch on class with case/when`
**Type:** `kata`

### `instruction`

```markdown
## Your task

Implement `classify(x)` that returns a String describing the class of `x` using `case/when` dispatch. The exact strings:

- `Integer` → `"number"`
- `String` → `"text"`
- `Array` → `"list"`
- `Hash` → `"map"`
- `Symbol` → `"label"`
- anything else → `"other"`

## Example

```ruby
classify(42)         # => "number"
classify("hello")    # => "text"
classify([1, 2, 3])  # => "list"
classify({ a: 1 })   # => "map"
classify(:foo)       # => "label"
classify(3.14)       # => "other"   (Float, not Integer)
classify(nil)        # => "other"
```

The point of this kata is to use `case/when Class` directly — which works because `===` on a class checks `is_a?`. You should not write `case x.class` (that's a different idiom, also valid, but it doesn't exercise the `Class === instance` rule).
```

### `starterCode`

```ruby
def classify(x)
  # Your code here.
end
```

### `testCode`

```ruby
_t('Integer is "number"') { _eq classify(42), "number" }
_t('String is "text"')    { _eq classify("hi"), "text" }
_t('Array is "list"')     { _eq classify([1, 2]), "list" }
_t('Hash is "map"')       { _eq classify({ a: 1 }), "map" }
_t('Symbol is "label"')   { _eq classify(:foo), "label" }
_t('Float is "other"')    { _eq classify(3.14), "other" }
_t('nil is "other"')      { _eq classify(nil), "other" }
_t('true is "other"')     { _eq classify(true), "other" }
```

### `hint`

> `case x` with `when ClassName` clauses works directly — no `x.class` needed in the `case` head. The `else` clause handles "everything not matched above".

### `solution`

```ruby
def classify(x)
  case x
  when Integer then "number"
  when String  then "text"
  when Array   then "list"
  when Hash    then "map"
  when Symbol  then "label"
  else              "other"
  end
end
```

### `alternativeApproach`

> `case x.class` works too, with a different mechanic:
>
> ```ruby
> def classify(x)
>   case x.class.name
>   when "Integer" then "number"
>   # ...
>   end
> end
> ```
>
> Here you're matching strings against strings (`String === String`), not classes against instances. It works but doesn't exercise the Ruby `case/when Class` idiom — the kata is intentionally choosing the more idiomatic form.
>
> A Hash-based dispatch also works:
>
> ```ruby
> CLASSIFY = { Integer => "number", String => "text", Array => "list", Hash => "map", Symbol => "label" }
> def classify(x)
>   CLASSIFY.fetch(x.class) { "other" }
> end
> ```
>
> Cleaner if you have 10+ types or you want to add types at runtime. For 5-6 fixed cases, `case/when` reads better. The Hash version also fails for subclass relationships — `case/when Class` uses `is_a?`, which respects inheritance; Hash key lookup uses `eql?`, which doesn't.

---

## Step 4.4 — `challenge` — `bucketize(values)`

**Title:** `bucketize(values) — group by class, idiomatic Ruby`
**Type:** `challenge` (no hint by default per [`../../README.md`](../../README.md) §5)

### `instruction`

```markdown
## Your task

Implement `bucketize(values)` that takes an Array of mixed types and returns a Hash where each key is a class and the value is an Array of all input values of that class, in input order.

## Example

```ruby
bucketize([1, "a", 2, :foo, "b", [1, 2], 3, { x: 1 }, :bar])
# => {
#      Integer => [1, 2, 3],
#      String  => ["a", "b"],
#      Symbol  => [:foo, :bar],
#      Array   => [[1, 2]],
#      Hash    => [{ x: 1 }],
#    }

bucketize([])
# => {}
```

## Constraints

- Use `case/when` with `Class === instance` somewhere in your solution.
- Keep the body under 10 lines (not counting `def` / `end`).

## What this exercises

This kata combines two things from this lesson: dispatch on class via `case/when Class`, and an `Enumerable` build-up (you'll likely reach for `each_with_object` or `group_by`). The postfix `if` from the read step is natural to reach for when you need a one-line guard — use it if it fits, don't force it if it doesn't.

The 15-minute budget is real — if you're still wrestling after 15, look at the alternative approach for the shape.
```

### `starterCode`

```ruby
def bucketize(values)
  # Your code here. ~5-8 lines.
end
```

### `testCode`

```ruby
_t('groups a mixed array by class') do
  result = bucketize([1, "a", 2, :foo, "b", [1, 2], 3, { x: 1 }, :bar])
  expected = {
    Integer => [1, 2, 3],
    String  => ["a", "b"],
    Symbol  => [:foo, :bar],
    Array   => [[1, 2]],
    Hash    => [{ x: 1 }],
  }
  _eq result, expected
end

_t('empty array returns empty hash') do
  _eq bucketize([]), {}
end

_t('single element produces single-bucket hash') do
  _eq bucketize([42]), { Integer => [42] }
end

_t('preserves input order within each bucket') do
  result = bucketize([3, 1, 2])
  _eq result, { Integer => [3, 1, 2] }
end
```

### `hint`

> *(Challenges ship without a hint by default — the spec at [`../../README.md`](../../README.md) §5 makes this explicit. If you genuinely need one, look at the `alternativeApproach` for shape.)*

### `solution`

```ruby
def bucketize(values)
  values.each_with_object({}) do |v, buckets|
    bucket = case v
             when Integer then Integer
             when String  then String
             when Symbol  then Symbol
             when Array   then Array
             when Hash    then Hash
             end
    next if bucket.nil?
    buckets[bucket] ||= []
    buckets[bucket] << v
  end
end
```

### `alternativeApproach`

> The compact form using `group_by`:
>
> ```ruby
> def bucketize(values)
>   values.group_by do |v|
>     case v
>     when Integer then Integer
>     when String  then String
>     when Symbol  then Symbol
>     when Array   then Array
>     when Hash    then Hash
>     end
>   end.compact
> end
> ```
>
> `group_by` already builds the Hash-of-Arrays you want; `compact` strips any `nil` key that would appear if a value didn't match. Cleaner if you're sure no other types appear; less explicit about the "skip the unmatched" decision.
>
> A more polymorphic version uses `.class` directly (no `case/when`):
>
> ```ruby
> def bucketize(values)
>   values.group_by(&:class)
> end
> ```
>
> That's three lines, no `case/when`. Why was the kata harder? Because the constraint forced you to use `case/when` and postfix — those are the idioms you needed practice with. In real code, `group_by(&:class)` is the right answer when the buckets are unbounded. The kata makes you build the muscle for the case-with-explicit-buckets shape (which is what you reach for when only specific classes should be grouped, others ignored).

---

## Self-review checkpoint

- [x] Read 4.1 covers exactly four surprises — no walkthrough of "what is an if statement".
- [x] Predict 4.2 feedback names the specific polyglot reflex behind each wrong answer (C, JS, Python, Go, Rust, version-pinning paranoia).
- [x] Kata 4.3 forces `case/when Class` (not `case x.class`); `alternativeApproach` shows the inferior forms with mechanic-level explanation.
- [x] Challenge 4.4 ships without a hint (per [README §5](../../README.md)). Solution uses `case/when` + postfix `if` per the kata constraints; `alternativeApproach` shows the much shorter `group_by(&:class)` and explains why the constraint version was the right kata.
- [x] Hints discipline §2.4 applied: 4.3's hint says "no `x.class` needed in the case head" — useful direction without naming the solution shape.
- [x] Content in English; meta-notes in Spanish.
