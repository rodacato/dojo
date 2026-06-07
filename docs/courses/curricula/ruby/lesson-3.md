# Ruby — Lesson 3: Object model — why blocks and literals work the way they do

> **Status:** Draft (prose, pre-seed) · **Drafted:** 2026-06-07
> **Spec:** [ruby.md §4 Lesson 3](ruby.md#lesson-3--object-model-la-raz%C3%B3n-por-la-que-blocks-y-literales-funcionan-as%C3%AD)
> **Primary audience:** A1 Mariana (JS Senior), A2 Esteban (Python Mid-Senior). Secondary: A4 Felipe.
> **Step count:** 5 (1 `read` + 1 `predict` + 2 `kata` + 1 `playground`).

**Inheritance note:** Lesson 1 in the current DB seed is this lesson's predecessor. The `read` and `predict` content gets *tightened* (cuts to generic explanation, preserves the Ruby-specific surprises). The two katas are **replaced**: `type_of` → `safe_call`, `describe` → `compare_views`. The `lessonId` stays stable (`seedUuid('ruby-l1-object-model')`); the four step UUIDs stay stable; `title` and `order` update; `instruction` / `testCode` / `hint` / `solution` get rewritten where the kata identity changes.

Production prose for each step's fields. Content in English, meta-notes in Spanish where helpful.

---

## Step 3.1 — `read` — "Everything is an object — and what that buys you"

**Title:** `Everything is an object — and what that buys you`
**Type:** `read`
**Word count target:** ~350 (down from the ~620 of the original seed). Tighten cuts the generic `.class` walk-through, keeps the Ruby-specific surprises.

### `instruction` (markdown body)

```markdown
## Why this matters

You've spent two lessons writing Ruby that takes blocks, transforms hashes, and uses symbols as identifiers. Each of those works because of a single underlying property: **everything in Ruby is an object, and what looks like syntax is usually a method call.** This lesson makes the property explicit. Once you see it, the parts of Ruby that felt weird stop feeling weird.

## Every value has a class

Integers, strings, `nil`, `true`, `false` — every value in Ruby is an object with a class. No primitive-type exception.

```ruby
5.class       # => Integer
"hi".class    # => String
nil.class     # => NilClass
true.class    # => TrueClass
```

This is **why** `[1, 2, 3].map(&:to_s)` works on each integer — the integer is an object, `to_s` is a method on `Integer`, the symbol `:to_s` knows how to be a block (Lesson 1's preview), so the whole expression composes cleanly. None of it is special syntax for collections.

## Operators are methods in disguise

```ruby
1 + 2          # => 3
1.+(2)         # => 3     (same thing — `+` is a method named `+`)
1.send(:+, 2)  # => 3     (sending the message `:+` with argument 2)
```

Ruby's parser rewrites `1 + 2` as the method call `1.+(2)`. The `+` is not an operator — it's a method on `Integer`, written with a name that happens to be a single character. Same for `-`, `*`, `==`, `<<`, `[]`, even comparison: `5 < 10` is `5.<(10)`.

This is the property that makes Ruby small. There's very little "language" — most of what looks like syntax is a method you can find in the docs, override in your own class, or invoke via `send`. The blocks of Lesson 1 are the same pattern: `5.times { ... }` is a method on `Integer` that happens to take a block.

## Introspection is first-class

Every object knows things about itself. The two most useful at this stage:

- **`obj.class`** — which class the object belongs to.
- **`obj.respond_to?(:method_name)`** — whether the object handles the named message. Use this to ask before you tell, instead of catching `NoMethodError`.

```ruby
nil.respond_to?(:to_s)   # => true   (nil has a to_s — it's the empty string)
nil.respond_to?(:upcase) # => false  (nil doesn't speak uppercase)
"hi".respond_to?(:+)     # => true   (String has a + method for concatenation)
42.respond_to?(:+)       # => true   (Integer has a + method for addition)
```

`respond_to?` is the Ruby idiom for "ask before you tell". It's used in libraries to gracefully handle duck-typed inputs ("if the object knows how to `each`, treat it like a collection"). The next kata builds the muscle.

## What this means for `nil`

The `predict` next will test the `nil.class` reflex. The thing to internalise before that: **`nil` is the single instance of `NilClass`**, fully an object, with methods (`nil.to_s`, `nil.inspect`, `nil.nil?`). It's not absence — it's a specific object with a small but real interface. Treating it like JavaScript's `null` or Java's `null` (a thing that errors on any method call) misleads.

Because `nil` is an object with methods, **`nil.to_s` returns the empty string `""`** and `nil.inspect` returns the literal text `"nil"`. The next two katas exercise both: the first one specifically tests that calling `:to_s` on `nil` succeeds and returns `""` — and that succeeds *because* `nil` is an object, not despite it.

## What this means for `Symbol#to_proc`

`Symbol#to_proc` — the mechanism behind `&:method` from Lesson 1 — is `Symbol` itself being an object with a method named `to_proc`. The `&` sigil calls `to_proc` on whatever follows it, then passes the resulting Proc as the block. Everything composes because everything is an object — including symbols, methods, and Procs themselves.
```

### Paragraph-test audit (delta from original seed)

| Paragraph | Status vs original seed | Why |
|---|---|---|
| "Why this matters" | NEW framing | Anchors the lesson as the *explanation* for Lessons 1 and 2 — polyglot-first order |
| "Every value has a class" | KEEP, tightened | Cuts the `.class` walk-through; references Lesson 1 `&:to_s` to make the property *useful* |
| "Operators are methods" | KEEP, expanded | The biggest Ruby-specific surprise — gets more space |
| "Introspection is first-class" | REPLACED | Original talked about `.ancestors`; replaced with `respond_to?` because the next kata uses it |
| ".ancestors" paragraph | CUT | Generic; relocated to playground starter code |
| "What this means for nil + Symbol#to_proc" | NEW | Bridges to the predict (`nil.class`) and back to Lesson 1's `&:method` |

Cuts: "The language isn't telling you what to do; you are sending messages to objects" (sermon-ish), "interrogate the value in front of you" (advice-y), the duplicate description of `.class` after introducing it.

---

## Step 3.2 — `predict` — "What does `nil.class` return?"

**Title:** `Predict: what does nil.class return?`
**Type:** `predict`
**Mental model under test:** `nil` is an object with a class, not a sentinel that errors on method calls.

### `instruction`

```markdown
Before the next kata, predict one thing.
```

### `question`

```
What does `nil.class` return?
```

### `snippet`

```ruby
nil.class
```

### `options`

```yaml
- id: a
  text: "`nil`"
- id: b
  text: "`NilClass`"
- id: c
  text: "Raises `NoMethodError`"
- id: d
  text: "`Object`"
correct: b
```

### `feedback` (tightened from the original seed)

**a — `nil`:**
> You treated `nil` as a value with no methods. In Ruby, `nil` is the single instance of `NilClass`, and like every object it knows which class it belongs to. `nil.class` returns the class (`NilClass`), not the value (`nil`).

**b — `NilClass`:**
> Correct. `nil` is the only instance of `NilClass`. Because it's an object, it answers the same introspection messages every object answers — `class`, `inspect`, `respond_to?`, `is_a?`. The next kata builds on this.

**c — `NoMethodError`:**
> The JavaScript / Java reflex: `null.method()` raises. In Ruby, `nil` is an object — `nil.class` is a perfectly valid method call. The returned class is `NilClass`.

**d — `Object`:**
> Close to the right intuition — `nil`'s ancestor chain does include `Object` — but `.class` returns the most specific class, not an ancestor. `Object` is two steps up: `NilClass → Object → Kernel → BasicObject`. Try `nil.class.ancestors` in the playground later to see the chain.

---

## Step 3.3 — `kata` — `safe_call(obj, method_name)`

**Title:** `safe_call(obj, method_name) — ask before you tell`
**Type:** `kata`
**Replaces:** the original `type_of` kata (which exercised only `.class.name` — too mechanical for an experienced dev).

### `instruction`

```markdown
## Your task

Implement `safe_call(obj, method_name)` that returns the result of calling `method_name` on `obj` if `obj` responds to it, or `nil` if it doesn't.

This is the Ruby idiom for "ask before you tell" — check that an object handles a message before sending it, instead of catching `NoMethodError` after the fact.

## Examples

```ruby
safe_call("hello", :upcase)  # => "HELLO"
safe_call(nil, :upcase)      # => nil       (NilClass doesn't have upcase)
safe_call(42, :to_s)         # => "42"      (Integer has to_s)
safe_call(42, :nope)         # => nil       (Integer has no method :nope)
safe_call(nil, :to_s)        # => ""        (NilClass#to_s exists, returns "")
```

You'll use exactly two methods from `Object`: `respond_to?` and `send`. Both work on any object, including `nil`.
```

### `starterCode`

```ruby
def safe_call(obj, method_name)
  # Your code here.
end
```

### `testCode`

```ruby
_t('calls the method when present (String#upcase)') do
  _eq safe_call("hello", :upcase), "HELLO"
end

_t('returns nil when nil does not respond to the method') do
  _eq safe_call(nil, :upcase), nil
end

_t('calls the method when present (Integer#to_s)') do
  _eq safe_call(42, :to_s), "42"
end

_t('returns nil when Integer does not respond to the method') do
  _eq safe_call(42, :nope), nil
end

_t('calls the method on nil when nil DOES respond to it') do
  _eq safe_call(nil, :to_s), ""
end
```

### `hint`

> Two `Object` methods get you there. One asks "does this object handle this message?" — its name is a yes/no question. The other actually sends the message — its name is what you call the action ("sending a message to an object").

### `solution`

```ruby
def safe_call(obj, method_name)
  obj.respond_to?(method_name) ? obj.send(method_name) : nil
end
```

### `alternativeApproach`

> Ruby 2.3+ has the safe navigation operator `&.` — but it solves a *different* problem. `obj&.method` is shorthand for `obj.nil? ? nil : obj.method` — it guards against `obj` being `nil`, but it does **not** check whether `obj` has the method:
>
> ```ruby
> nil&.upcase   # => nil       (safe — nil short-circuits)
> 42&.nope      # NoMethodError (42 isn't nil — `&.` doesn't help here)
> ```
>
> `safe_call` is broader: it works whether or not `obj` is `nil`, and it never raises. The `&.` operator is the right answer when the only failure mode you fear is `nil`; `respond_to?` + `send` is the right answer when you genuinely don't know whether the object speaks the message.
>
> A third path is `obj.public_send(method_name)` wrapped in a `rescue NoMethodError` — fewer characters, but exception-driven control flow is slower and more surprising to readers. `respond_to?` + `send` reads cleanest.

---

## Step 3.4 — `kata` — `compare_views(obj)`

**Title:** `compare_views(obj) — to_s vs inspect`
**Type:** `kata`
**Replaces:** the original `describe` kata (which only used `inspect`; this one *exhibits* the difference between `to_s` and `inspect`).

### `instruction`

```markdown
## Your task

Implement `compare_views(obj)` that returns a two-element Array: `[obj.to_s, obj.inspect]`.

Most objects' `to_s` and `inspect` look similar — for `42`, both return `"42"`; for `[1, 2, 3]`, both return `"[1, 2, 3]"`. But they're philosophically distinct:

- **`to_s`** produces a *display* form — what you'd want to show a user or splice into another string.
- **`inspect`** produces a *debug* form — what you'd want in a log line or a REPL session, with enough detail to reconstruct what the object is.

The places they diverge tell you the most about Ruby's object model.

## Examples

```ruby
compare_views(42)        # => ["42", "42"]
compare_views([1, 2, 3]) # => ["[1, 2, 3]", "[1, 2, 3]"]

compare_views("hi")      # => ["hi", "\"hi\""]
# String#to_s gives the string itself (no quotes).
# String#inspect adds quotes so you can tell a string apart from a number in logs.

compare_views(nil)       # => ["", "nil"]
# NilClass#to_s is the empty string — that's why "#{nil}" interpolates to "".
# NilClass#inspect is the literal text "nil" — that's what you want in a log line.
```

Pay attention to the third and fourth examples — those are the ones that catch you out in production logs.
```

### `starterCode`

```ruby
def compare_views(obj)
  # Your code here.
end
```

### `testCode`

```ruby
_t('integer: to_s and inspect match') do
  _eq compare_views(42), ["42", "42"]
end

_t('array: to_s and inspect match') do
  _eq compare_views([1, 2, 3]), ["[1, 2, 3]", "[1, 2, 3]"]
end

_t('string: inspect adds quotes, to_s does not') do
  _eq compare_views("hi"), ["hi", "\"hi\""]
end

_t('nil: to_s is empty string, inspect is "nil"') do
  _eq compare_views(nil), ["", "nil"]
end

_t('hash: to_s and inspect match') do
  _eq compare_views({ a: 1 }), ["{:a=>1}", "{:a=>1}"]
end
```

### `hint`

> Every object responds to both `to_s` and `inspect`. The kata is literally calling each one and returning the pair. The interesting part isn't writing the method — it's reading the test expectations and noticing where the two strings differ.

### `solution`

```ruby
def compare_views(obj)
  [obj.to_s, obj.inspect]
end
```

### `alternativeApproach`

> The kata is intentionally a one-liner — the pedagogy is in the test expectations, not the code. The thing to take away: when you write log lines, reach for `inspect` so `nil` shows up as `"nil"` and strings show up with their quotes. When you splice a value into user-facing text, reach for `to_s` (or just use `"#{value}"`, which calls `to_s` for you).
>
> A common idiom in Ruby debugging code:
>
> ```ruby
> puts "got: #{value.inspect}"  # always readable, even if value is nil
> ```
>
> versus
>
> ```ruby
> puts "got: #{value}"           # value is silently coerced via to_s
> ```
>
> The first line is the one that survives "wait, was that nil or an empty string?".

---

## Step 3.5 — `playground` — "Object model in action"

**Title:** `Playground: object model in action`
**Type:** `kata` with `data.kind: "playground"` flag.

### `instruction`

```markdown
## What this is

A playground. No tests, no pass/fail — run the code, watch the output, and form intuition about how far "everything is an object" goes.

## Starter code

The starter calls `.+`, `.send`, `.respond_to?`, `.class`, and `.ancestors` on different values. Run it once and read the output before changing anything.

## Things to try

1. **Inspect the ancestor chains:** `Integer.ancestors`, `String.ancestors`, `Array.ancestors`. Notice `Enumerable` appearing on `Array`. That's how `Array#each_with_index`, `Array#group_by`, `Array#sort_by` are all the same method, defined once on `Enumerable` and mixed into every collection.
2. **Try send with arguments:** `[1, 2, 3].send(:map) { |x| x * 2 }`. Block plus arguments work with `send` the same way they work with direct calls.
3. **Confirm `Symbol#to_proc`:** `:upcase.to_proc.call("hello")`. This is the underlying mechanic that makes `&:upcase` work from Lesson 1.
4. **Define your own class:** `class Foo; def greet; "hi"; end; end`. Then `Foo.new.greet` and `Foo.new.respond_to?(:greet)`. The same object-model property applies to your own code — your methods are messages, sendable and introspectable.

The harness has a single placeholder test that always passes. The point isn't to write tests — it's to wander through Ruby's reflection surface.
```

### `starterCode`

```ruby
# Operators as methods
puts 5.+(2)
puts 5.send(:+, 2)
puts (5 < 10).inspect    # => true

# Introspection on nil and on a value
puts nil.respond_to?(:to_s).inspect
puts nil.respond_to?(:upcase).inspect
puts "hi".class
puts :foo.class

# Ancestor chains — start here, then try String, Array, Hash
puts Integer.ancestors.inspect
```

### `testCode`

```ruby
_t('explored') { _eq true, true }
```

### `hint`

> Not applicable — this is a playground.

### `solution`

> Not applicable — no canonical solution.

### `alternativeApproach`

> Not applicable.

---

## Self-review checkpoint

- [x] Read 3.1 cut from ~620 words to ~350. Generic `.class` walk-through gone; operators-as-methods expanded; `respond_to?` introduced (used in next kata); `.ancestors` moved to playground starter.
- [x] Predict 3.2 feedback tightened — no "common reflex from languages where..." preamble; gets to the mechanic in 2 sentences.
- [x] Katas 3.3 and 3.4 replaced per Option B from the spec. `safe_call` teaches `respond_to?` + `send` and the difference vs `&.`. `compare_views` teaches `to_s` vs `inspect` through divergent test expectations.
- [x] Playground 3.5 has concrete things to try, not "explore freely". Includes ancestor-chain exploration (which the read deferred).
- [x] DB inheritance preserved: `lessonId` stable, step UUIDs stable. Only `order`, `title`, and content fields change.
- [x] Content in English; meta-notes in Spanish.

---

## Pending figure proposals (2026-06-07)

Embeddable visual figures (see [INTERACTIVITY-PATTERNS.md §Embeddable visual figures](../../INTERACTIVITY-PATTERNS.md#embeddable-visual-figures)) proposed for this lesson but **not yet authored**. Implementation depends on the figures runtime; until then, the prose above stands alone.

### Proposal 3.A — `two-by-two` figure inside Step 3.1 "Object model: why blocks and literals work this way"

- **Slot:** at the top of the section that introduces "operators are method calls" — *replaces* approximately 80 words of the corresponding prose, leaving the prose to expand only on what the figure cannot show.
- **Row axis label:** "How the reader thinks operators work"
- **Row values:** "as syntax (built into the parser)" / "as messages (method calls on the left operand)"
- **Column axis label:** "Language"
- **Column values:** "JS / Python (polyglot's prior reflex)" / "Ruby"
- **Cells:**

  | | JS / Python | Ruby |
  |---|---|---|
  | **As syntax** | `5 + 2` is parser-level addition; you cannot override it for `Integer`. *(correct mental model for these langs)* | `5 + 2` *looks* like syntax — that's the trap. |
  | **As messages** | Operator overloading exists but is opt-in via `__add__` / `valueOf`; not the default model. | `5.+(2)` is the *real* call shape. `+` is a method on `Integer`; `5 + 2` is sugar for it. **← the model the lesson wants** |

- **Highlighted cell:** bottom-right (Ruby × As messages). The cell carries the eyebrow `THE MENTAL MODEL` and the body is two short sentences: *"Operators in Ruby are method calls. `5.+(2)` is the real shape; the infix `5 + 2` is sugar."*
- **Caption:** *"The trap is assuming Ruby works like JS or Python. The fix is one diagonal move on this grid — from 'as syntax in JS/Python' to 'as messages in Ruby'."*
- **Why this earns embedding:** The "operators are method calls" claim is the single biggest object-model surprise for the polyglot. Prose-only, it takes 3-4 careful sentences to land without sounding like trivia. The 2×2 makes the trap geometric: the polyglot can *see* the wrong cell they reflexively occupy and the right cell the lesson points to. The diagonal move is the pedagogical event.
- **Authoring cost:** ~25 minutes once the `two-by-two` renderer exists, of which ~15 is on the cell copy (each cell needs to be one short, sharp sentence — no qualifiers).
