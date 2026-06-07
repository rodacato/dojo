# Ruby — Lesson 2: Literals that surprise

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-07
> **Spec:** [ruby.md §4 Lesson 2](ruby.md#lesson-2--literales-que-sorprenden)
> **Primary audience:** A1 Mariana (JS Senior), A2 Esteban (Python Mid-Senior). Secondary: A4 Felipe.
> **Step count:** 4 (1 `read` + 3 `kata`). No `predict` — literals are mechanical, not model-building.

Production prose for each step's fields. Content in English, meta-notes in Spanish where helpful.

---

## Step 2.1 — `read` — "Four literal surprises in Ruby"

**Title:** `Four literal surprises in Ruby`
**Type:** `read`
**Word count target:** ~340. Tour-guide cuts applied: nothing about "arrays are zero-indexed" or "strings have methods".

### `instruction` (markdown body)

```markdown
## Why this matters

You already know what a string is. You already know what a hash (dict, map, object) is. This step skips the obvious and goes straight to the four literal-level idioms in Ruby that don't translate from JS / Python / Go / Java without losing something.

## 1. Single vs double quotes are different — pick deliberately

`'hello'` and `"hello"` produce the same string, but they're not the same syntax.

- **Single-quoted** strings are nearly literal. The only escapes processed are `\\` and `\'`. No interpolation, no `\n`, no `\t`.
- **Double-quoted** strings process the full escape table (`\n`, `\t`, `\0`, etc.) and support **`#{expression}` interpolation**: the expression is evaluated and its `to_s` value is spliced in.

```ruby
name = "Ada"
"hello, #{name}"           # => "hello, Ada"
'hello, #{name}'           # => "hello, \#{name}"   (no interpolation)
"line\nbreak"              # => two-line string
'line\nbreak'              # => literal backslash-n, no break
```

Idiomatic convention: reach for `'...'` when the string is purely literal data; `"..."` whenever you interpolate or want escape processing. Most Ruby code uses `"..."` by default.

## 2. Integer division silently truncates

```ruby
5 / 2     # => 2     (not 2.5)
-5 / 2    # => -3    (floors toward negative infinity)
5.0 / 2   # => 2.5
5.fdiv(2) # => 2.5
```

If either operand is a Float, the result is a Float. If both are Integers, the result is an Integer — Ruby never silently promotes. The Python 3 `/` operator does the opposite (always Float, with `//` for floor division); Go matches Ruby. When you need fractional division, convert one operand or use `Integer#fdiv`.

## 3. Symbols are interned, immutable identifiers

```ruby
:foo                    # a symbol
"foo".object_id         # => 60        (or some number)
"foo".object_id         # => 80        (different — strings are mutable, each "foo" literal is a new object)
:foo.object_id          # => 1086108   (some number)
:foo.object_id          # => 1086108   (same — symbols are unique)
:foo == "foo"           # => false     (different types, not just different objects)
```

:figure[disambiguation]{id="string-vs-symbol"}

The figure highlights the single dimension that matters — *identity*. Every other difference (mutability, hash-key cost, garbage collection) cascades from it. Use symbols for *names of things* (hash keys, method names, config keys); use strings for *content the user sees*.

The hash literal shorthand `{ name: "Ada" }` uses symbol keys: it's equivalent to `{ :name => "Ada" }`. You'll see the shorthand everywhere; the rocket form (`=>`) appears when keys aren't symbols (e.g. `{ "Foo" => 1 }`).

## 4. `Hash#fetch` with a block is the right way to handle missing keys

The default access `h[:missing]` returns `nil`. That's convenient and dangerous — if a key is legitimately bound to `nil` or `false`, you can't tell "missing" from "present with falsy value":

```ruby
flags = { verbose: false }
flags[:verbose] || true       # => true   (wrong — verbose was explicitly false)
flags.fetch(:verbose) { true } # => false (correct)
flags.fetch(:other)            # => KeyError: key not found
flags.fetch(:other) { "default" } # => "default"
```

`Hash#fetch(key)` raises `KeyError` if the key is missing; with a block (or a second argument), it falls back to the block's value. The block form is preferred when the default is computed (lazy) or when you want a separate code path on the miss.

## What this lesson is NOT teaching

`Array` indexing, basic string methods, what a hash is, what `[1, 2, 3].length` returns. The polyglot already knows. The katas next exercise the four surprises above; you'll write Ruby that wouldn't have read the same way in your previous language.
```

### Paragraph-test audit

| Paragraph | Removes what polyglot decision? | Verdict |
|---|---|---|
| "Why this matters" | "Are you going to walk me through what an array is?" — anti-tour-guide signal | KEEP |
| "Single vs double quotes" | "Which quote do I use? Are they really the same?" | KEEP |
| "Integer division" | "Will `5 / 2` give me `2.5` like Python?" | KEEP |
| "Symbols" | "What's `:foo`? Why use it over strings?" | KEEP |
| `:figure[disambiguation]` + caption (inside Symbols) | "Is Symbol just an interned String?" — the single dimension that matters is identity | KEEP (figure kills the "two string types" reflex) |
| "`Hash#fetch` with block" | "What's the idiomatic way to handle missing keys?" | KEEP |
| "What this lesson is NOT teaching" | Forecloses the tour-guide expectation | KEEP |

Cut from earlier drafts: a paragraph on `Array.new(n) { ... }` (deep enough that it belongs to the blocks deep-dive); a paragraph on string concatenation vs interpolation (interpolation already in #1, concat is generic).

---

## Step 2.2 — `kata` — `lookup(records, name)`

**Title:** `lookup(records, name) — Hash#fetch with a sensible default`
**Type:** `kata`

### `instruction`

```markdown
## Your task

Implement `lookup(records, name)` that takes a Hash of records (symbol keys, hash values) and returns the record for `name` or the string `"unknown person"` if the name isn't a key.

The point of this kata isn't "use a default value" — it's to force you to use `Hash#fetch` with a block instead of `records[name] || "unknown person"`. The tests include a record explicitly set to `nil` to make the `|| "unknown"` shortcut give the wrong answer.

## Examples

```ruby
people = {
  ada: { age: 30, role: "scientist" },
  linus: { age: 25, role: "engineer" },
}

lookup(people, :ada)      # => { age: 30, role: "scientist" }
lookup(people, :missing)  # => "unknown person"
```

## The trap (which the tests catch)

```ruby
records = { ghost: nil }
lookup(records, :ghost)   # MUST return nil, NOT "unknown person"
```

`records[:ghost]` is `nil`. `records[:ghost] || "unknown person"` would wrongly return `"unknown person"`. `Hash#fetch` distinguishes "key absent" from "key present with `nil` value".
```

### `starterCode`

```ruby
def lookup(records, name)
  # Your code here.
end
```

### `testCode`

```ruby
PEOPLE = {
  ada: { age: 30, role: "scientist" },
  linus: { age: 25, role: "engineer" },
}.freeze

_t('returns the record for a present key') do
  _eq lookup(PEOPLE, :ada), { age: 30, role: "scientist" }
end

_t('returns "unknown person" for a missing key') do
  _eq lookup(PEOPLE, :missing), "unknown person"
end

_t('returns nil (not the default) when the key is present and value is nil') do
  records = { ghost: nil }
  _eq lookup(records, :ghost), nil
end
```

### `hint`

> `Hash#fetch` takes two distinct shapes: `h.fetch(key)` raises `KeyError` if absent, and `h.fetch(key) { ... }` falls back to the block on absent. The block is only evaluated on the miss path — so it's safe to put expensive defaults there.

### `solution`

```ruby
def lookup(records, name)
  records.fetch(name) { "unknown person" }
end
```

### `alternativeApproach`

> `records.fetch(name, "unknown person")` (second positional argument as default) also works for this case. The block form is preferred when:
>
> 1. The default is expensive to compute — the block is only run on the miss path.
> 2. The default depends on the missing key — the block receives the key: `h.fetch(name) { |k| "no record for #{k}" }`.
> 3. You want clarity that the default is a fallback, not a primary value.
>
> The `||` shortcut (`records[name] || "unknown person"`) silently corrupts when the legitimate value is `nil` or `false` — the third test exists to make that failure mode unavoidable.

---

## Step 2.3 — `kata` — `summarize(records)`

**Title:** `summarize(records) — combine four idioms in one method`
**Type:** `kata`

### `instruction`

```markdown
## Your task

Implement `summarize(records)` that takes an Array of Hashes with symbol keys and returns a single String of `"name (age), name (age), ..."` joined by commas.

Each record has `:name` (String) and `:age` (Integer). Order in the output matches order in the input.

## Examples

```ruby
summarize([{ name: "Ada", age: 30 }, { name: "Linus", age: 25 }])
# => "Ada (30), Linus (25)"

summarize([])
# => ""

summarize([{ name: "Solo", age: 42 }])
# => "Solo (42)"
```

This kata combines four idioms in one line of Ruby: array iteration with `map`, symbol-key hash access, string interpolation, and joining with `Array#join`. None of them are individually surprising; combined and compressed, they're the shape of a thousand Ruby methods you'll write.
```

### `starterCode`

```ruby
def summarize(records)
  # Your code here.
end
```

### `testCode`

```ruby
_t('summarizes two records') do
  result = summarize([{ name: "Ada", age: 30 }, { name: "Linus", age: 25 }])
  _eq result, "Ada (30), Linus (25)"
end

_t('returns an empty string for an empty array') do
  _eq summarize([]), ""
end

_t('summarizes a single record') do
  _eq summarize([{ name: "Solo", age: 42 }]), "Solo (42)"
end

_t('preserves input order') do
  result = summarize([
    { name: "Zed", age: 50 },
    { name: "Aria", age: 20 },
    { name: "Mid", age: 35 },
  ])
  _eq result, "Zed (50), Aria (20), Mid (35)"
end
```

### `hint`

> Two `Enumerable` calls and a `String#join` get you there. The shape: transform each Hash to a String, then concatenate with separator.

### `solution`

```ruby
def summarize(records)
  records.map { |r| "#{r[:name]} (#{r[:age]})" }.join(", ")
end
```

### `alternativeApproach`

> A reduce-style equivalent (verbose, less idiomatic in Ruby):
>
> ```ruby
> def summarize(records)
>   records.reduce("") do |acc, r|
>     acc.empty? ? "#{r[:name]} (#{r[:age]})" : "#{acc}, #{r[:name]} (#{r[:age]})"
>   end
> end
> ```
>
> Works, but the separator-bookkeeping is exactly what `Array#join` handles cleanly. In Ruby, the rule of thumb: "if I'm manually handling the gaps between elements, there's a stdlib method I'm missing."

---

## Step 2.4 — `kata` — `tally_words(words)`

**Title:** `tally_words(words) — counts via Array#tally`
**Type:** `kata`

### `instruction`

```markdown
## Your task

Implement `tally_words(words)` that takes an Array of Strings and returns a Hash mapping each unique String to its count.

## Examples

```ruby
tally_words(["hi", "hi", "bye"])
# => { "hi" => 2, "bye" => 1 }

tally_words([])
# => {}

tally_words(["solo"])
# => { "solo" => 1 }
```

The idiomatic solution in modern Ruby (3.0+, what this sandbox runs) is a single method call — `Array#tally`. Before `tally` shipped in Ruby 2.7, you'd write it manually with `each_with_object` or `group_by(...).transform_values(&:size)`. Both work and you'll see them in older codebases.
```

### `starterCode`

```ruby
def tally_words(words)
  # Your code here.
end
```

### `testCode`

```ruby
_t('counts duplicates correctly') do
  _eq tally_words(["hi", "hi", "bye"]), { "hi" => 2, "bye" => 1 }
end

_t('empty array returns empty hash') do
  _eq tally_words([]), {}
end

_t('single element returns count of 1') do
  _eq tally_words(["solo"]), { "solo" => 1 }
end

_t('handles all-unique array') do
  _eq tally_words(["a", "b", "c"]), { "a" => 1, "b" => 1, "c" => 1 }
end
```

### `hint`

> Ruby 3.0+ has a method on `Array` that does exactly this in a single call. Its name is the same word you'd use in English: counting up occurrences of each value is what this method is called.

### `solution`

```ruby
def tally_words(words)
  words.tally
end
```

### `alternativeApproach`

> Before `Array#tally` (Ruby 2.7), the idiomatic build-up was:
>
> ```ruby
> def tally_words(words)
>   words.each_with_object(Hash.new(0)) { |w, counts| counts[w] += 1 }
> end
> ```
>
> `Hash.new(0)` constructs a Hash whose default value for absent keys is `0` — so `counts[w] += 1` works on first-encounter too. Or with `group_by`:
>
> ```ruby
> def tally_words(words)
>   words.group_by(&:itself).transform_values(&:size)
> end
> ```
>
> Both work; `tally` is the right answer in modern Ruby. You'll see the older forms in legacy codebases — they're the shape Ruby used before the stdlib absorbed the pattern.

---

## Self-review checkpoint

- [x] Read 2.1 covers exactly four surprises — no tour of "what an array is".
- [x] Each surprise has a polyglot-reflex callout (Python `/` returning Float, JS `||` corrupting on `false`/`nil`, etc.).
- [x] Lookup kata 2.2 has a third test specifically to defeat the `|| "default"` shortcut — forcing the idiom.
- [x] Summarize kata 2.3 combines four idioms (map, symbol-key access, interpolation, join) without re-explaining them.
- [x] `tally_words` exercises the modern Ruby `Array#tally` while showing the older `each_with_object` and `group_by` forms in `alternativeApproach`.
- [x] Hints discipline §2.4: 2.2's hint points at the *block form* of fetch without writing it; 2.3 names the shape without writing the chain; 2.4 names the English word ("tally") without writing the method.
- [x] Content in English; meta-notes in Spanish.

---

## Figure data spec

The step prose above embeds `:figure[...]{id:"..."}` directives. This section is the source-of-truth for the data that populates each figure when the runtime renders them. See [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures) for the schema.

### `string-vs-symbol` (`disambiguation`) — embedded in Step 2.1

- **Slot:** inside the surprise paragraph about symbols (`:foo == "foo"` is `false`), replacing the inline contrast.
- **Entries (both presented in identical skeletons):**

  | Attribute | `String` | `Symbol` |
  |---|---|---|
  | Syntax | `"hello"` | `:hello` |
  | Mutable | `true` | `false` |
  | Identity | new object per literal | one object per symbol, forever |
  | Typical use | data the program manipulates | identifier the program references |
  | Hash key implication | allocated each lookup | reused, faster lookup |

- **Highlighted divergent attribute:** *Identity* (`new object per literal` vs `one object per symbol, forever`). This is the single dimension the figure makes visible — all other differences cascade from it.
- **Caption:** *"Same look at a glance, opposite roles. Symbol identity is why `:foo` is a hash key and `"foo"` is data."*
- **Why this earns embedding:** the polyglot's first reflex is "Ruby has two string types, weird." The figure replaces that wrong reflex with the right model — they are not two string types, they are *data* and *identifier*. Three sentences of prose can land the same point; the figure lets the eye do the work in one beat.

### `enumerable-each-map-select` (`array-track`) — deferred to the future `ruby-enumerable-mastery` deep-dive

- **Slot:** as a teaser for Enumerable, embedded after the `Hash#fetch` paragraph (before the lookup kata).
- **Input:** `[1, 2, 3, 4, 5]`.
- **Three parallel tracks:**

  | Track | Method | States after evaluation | Output |
  |---|---|---|---|
  | 1 | `arr.each { \|n\| n * 2 }` | all `neutral` (each visits but returns the input) | `[1, 2, 3, 4, 5]` |
  | 2 | `arr.map { \|n\| n * 2 }` | all `done` with values `2, 4, 6, 8, 10` | `[2, 4, 6, 8, 10]` |
  | 3 | `arr.select { \|n\| n.even? }` | `2` and `4` as `done`, `1`, `3`, `5` as `out` (dashed) | `[2, 4]` |

- **Caption:** *"Same input, three blocks, three return shapes. `each` is for side effects; `map` transforms 1→1; `select` filters."*
- **Why this earns embedding:** teaches three methods in one figure, leans on the polyglot's "I already know what a loop does" reflex without re-explaining it. Maximum lesson-density for minimum prose.

### Decision pending (Rhea + Valentina)

The lesson's prose budget (~380 words for read 2.1) likely accommodates **one** figure, not both. Recommendation when both runners exist: **Proposal 2.A (`disambiguation`) for v1**, because it attacks the *most-common polyglot misconception* (String vs Symbol). Proposal 2.B (`array-track`) lands stronger in the future `ruby-enumerable-mastery` deep-dive scroll where Enumerable has a whole scroll's worth of prose backing it. Crash-scroll context makes 2.A the higher-leverage call.
