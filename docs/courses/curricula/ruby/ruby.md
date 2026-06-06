# Ruby — Authoring Spec

> Executable authoring brief for the `ruby` scroll — the dojo's Ruby crash course.
> Inherits the Ruby Course Authoring Profile from [`../ruby.md`](../ruby.md) §2. Template: [`../../authoring-spec-template.md`](../../authoring-spec-template.md). Framework: [`../../README.md`](../../README.md). Direction: [ADR 022](../../../adr/022-crash-course-pivot.md).

## Header

```yaml
slug: ruby
title: "Ruby"
kind: language-scroll
language: ruby
sandbox: piston
prereqs: []
audience: "polyglot developer who already programs in another language"
learner_time: "~90 minutes (60-120 range)"
status: spec-in-progress         # Lesson 1 spec-complete + 3 of 4 steps seeded; Lessons 2-5 stubbed
maintainers:
  - S10 Rhea Kapoor              # language pedagogy
  - S5 Elif Yıldız               # curriculum architecture
  - S2 Valentina Cruz            # content quality
  - S11 Maya Lindqvist           # predict / read+inline review
```

---

## 1. Learning Outcomes

After finishing this scroll, the learner can…

- Predict the result of common Ruby expressions that surprise a polyglot (`nil.class`, `0` as truthy, `:foo == "foo"`, `[].max`) and explain *why* each result holds.
- Read and write idiomatic Ruby across the core literals — integers, floats, strings, arrays, hashes, symbols — including the idioms that distinguish Ruby from the polyglot's prior language (`#{}` interpolation, `Hash#fetch` with a default block, symbol keys, `Array#tally`, `&:method`).
- Use Ruby's control flow with confidence in the surprises: only `false` and `nil` are falsy; `case/when` uses `===`; `unless`/`until` and the postfix forms (`x if y`) are first-class.
- Define methods with positional, default, keyword, and splat (`*args` / `**opts`) arguments, and recognise implicit return.
- Pass a block to a method, accept one with `yield`, recognise the `&:method` shorthand, and explain the "block-as-API-shape" pattern (`File.open(path) { |f| ... }`). The `Proc` / `lambda` / closure mechanics are explicitly deferred to the blocks deep-dive — the polyglot exits the scroll knowing they exist but not the corner cases.
- Name the Ruby-specific footguns the polyglot will eventually encounter in real codebases (`method_missing`, eigenclasses, monkey-patching, `attr_accessor` as encapsulation cost) and know they belong to deep-dive scrolls — not to be silently ignored, not to be taught here in passing.

Each outcome maps to at least one exercise or `predict` step in §4. Outcomes without a step are aspirational and must be cut or backed by a step.

---

## 2. Sub-course Authoring Notes

No deviations from the Ruby Course Authoring Profile (see [`../ruby.md`](../ruby.md) §2). Inherits the full profile as-is:

- Voice & angle — Ruby-not-Rails. Polyglot audience explicitly assumed in every step.
- Step density — 300-400 words per `read` step; this scroll leans into Ruby's "everything is an object" + "blocks are central" surprises.
- Interactivity menu — `read`, `exercise`, `challenge`, `predict`, `read+inline`. No `trace`.
- Pedagogical bets — all four apply.

Explicit local choices for this scroll specifically:

- **`predict` placement.** Three predict steps total — one each in Lessons 1, 3, and 5 — where the surprise is a model-building moment (object model, truthiness/`===`, blocks-vs-other-callables). Lesson 2 (literals) and Lesson 4 (methods) are mechanical enough that `predict` would feel forced; they stick to read + exercise.
- **Footgun deferral discipline.** When a topic that belongs in a future deep-dive surfaces (e.g. `Proc.new { return 1 }` semantics, eigenclasses, `method_missing`), the scroll **names it explicitly** and points to the deep-dive — does not silently elide. This is the difference between honest crash and superficial cheat sheet.
- **No Minitest.** The crash scroll uses the manual `_t` / `_eq` harness defined in §5. Minitest belongs to its own deep-dive scroll; teaching it here would steal pedagogy budget from the language.

---

## 3. Retrieval & Cross-references

- **From prior scrolls:** none — this is the entry scroll of the Ruby track.
- **Within this scroll:**
  - Lesson 1's `type_of` and `describe` methods reappear in Lesson 2's array/hash exercises (the learner calls `type_of` on hash values, calls `describe` on array elements). testCode references them by name.
  - Lesson 2's hash literal idioms (`{ name: "Ada", age: 30 }`) reappear as the input fixtures for Lesson 3's `case/when` pattern exercise and Lesson 4's keyword-argument method examples.
  - Lesson 4's keyword-argument method shape (`def greet(name:, greeting: "Hello")`) is the starting point for Lesson 5's block-passing API exercises (`with_timer { ... }` shape).
- **Forward hooks for future deep-dive scrolls:**
  - `5.times { puts _1 }` appears in Lesson 1 with the block syntax NOT yet explained — flagged as "we'll look at this in Lesson 5".
  - `Symbol#to_proc` is taught syntactically in Lesson 2 (`&:upcase`) but its mechanism (Proc coercion via `&`) is deferred to the future blocks deep-dive.
  - `attr_*`, `method_missing`, eigenclasses are named-and-deferred in Lesson 5's "what we didn't cover" closing.

---

## 4. Lessons

### Lesson 1 — First contact with the object model

> *What changed in the learner's head:* "I thought integers had operators. They have methods. So does `nil`. The language is smaller than I thought, and I can introspect anything."

**Step distribution:** 1 `read`, 1 `predict`, 2 `exercise` = 4 steps. The predict step is essential — `nil.class` is the canonical Ruby surprise and the right place to activate the polyglot's hypothesis.

**POC status note:** Steps 1.1, 1.3, 1.4 are seeded in DB today. Step 1.2 (`predict`) is in spec but deferred from seed until the `predict` step type ships per [INTERACTIVITY-PATTERNS.md](../../INTERACTIVITY-PATTERNS.md) §Tier 2.

#### Step 1.1 — `read` — Everything is an object

```yaml
title: "Everything is an object"
type: read
why_care: |
  Ruby's surprises start here. `5.times { puts "hi" }`, `nil.to_s`, `1 + 2` —
  all three are method calls on objects, not language keywords. Once you see
  this, half the language stops being weird.
body: |
  ~350 words. Covers:
  - Everything in Ruby is an object: integers, strings, nil, true/false.
    No primitive-type exception.
  - `.class` returns the class object of any value: `5.class` → Integer,
    `nil.class` → NilClass, etc.
  - Operators are syntactic sugar for method calls: `1 + 2` ≡ `1.+(2)` ≡
    `1.send(:+, 2)`.
  - Introspection is first-class: `.class`, `.ancestors`, `.respond_to?`.
  - One forward reference: `5.times { puts "hi" }` — flagged as "we'll
    explain the block in Lesson 5", not unpacked here.
  Code blocks (Ruby-tagged): `5.class`, `nil.respond_to?(:to_s)`, `1.+(2)`,
  `nil.class.ancestors`.
forward_prompt: |
  Before you write any code, predict one thing: when you call `.class` on
  `nil`, what do you get back? The answer is more interesting than it looks.
```

#### Step 1.2 — `predict` — What does `nil.class` return?

```yaml
title: "Predict: what does nil.class return?"
type: predict
question: "What does `nil.class` return?"
snippet: |
  nil.class
options:
  - id: a
    text: "`nil`"
  - id: b
    text: "`NilClass`"
  - id: c
    text: "Raises `NoMethodError`"
  - id: d
    text: "`Object`"
correct: b
feedback:
  a: "You treated `nil` as a sentinel with no methods — common reflex from languages where `null` is not an object. In Ruby, `nil` is the single instance of `NilClass`, and like every object it knows which class it belongs to. `nil.class` returns the class itself, not the value."
  b: "Correct. `nil` is the single instance of `NilClass`. Because it's an object, it responds to the same introspection messages every object responds to — `class`, `inspect`, `respond_to?`, `is_a?`."
  c: "You expected `nil` to be a non-receiver — common reflex from JavaScript or Java, where `null.method()` raises. In Ruby, `nil` is an actual object, so `nil.class` is a perfectly valid message send. The class it returns is `NilClass`."
  d: "Close to the right intuition — `nil`'s ancestor chain does include `Object` — but `.class` returns the most specific class, not an ancestor. `Object` is two steps up the chain (`NilClass → Object → Kernel → BasicObject`)."
```

#### Step 1.3 — `exercise` — Return the name of an object's class

```yaml
title: "Return the name of an object's class"
type: exercise
# Full spec as in the seed file. type_of(value) returns value.class.name as a String.
# 6 tests: Integer, String, NilClass, Array, Hash, TrueClass.
# Reference solution: value.class.name
# alternativeApproach: .to_s vs .name distinction for anonymous classes.
```

#### Step 1.4 — `exercise` — Implement `describe(obj)`

```yaml
title: "Implement describe(obj)"
type: exercise
# Full spec as in the seed file. describe(obj) returns "#{obj.class.name}: #{obj.inspect}".
# 5 tests: String (with embedded quotes from inspect), Integer, Array, Hash, NilClass.
# Reference solution: "#{obj.class.name}: #{obj.inspect}"
# alternativeApproach: interpolation vs format/sprintf, with rationale.
```

---

### Lesson 2 — Literals you'll use daily

> *What changed in the learner's head:* "Hash literals look like JS objects but the key story is different — symbols are a thing, and they matter. Also `Hash#fetch` with a block is the right idiom for missing keys."

**Step distribution:** 1 `read`, 3 `exercise` = 4 steps. No predict — the surprises in this lesson are mechanical (integer division, single vs double quotes), not model-building.

- **Step 2.1 — `read` — "The five literals + symbols"**
  - **Status:** drafting
  - **Body topics:** Single vs double quotes (interpolation only in double); `#{}` interpolation; common `String` methods (`#chars`, `#split`, `#gsub`); `Integer` vs `Float`; the `5 / 2 == 2` integer-division gotcha and `5.fdiv(2)`; array literals + indexing (incl. negative); hash literals + symbol-key shorthand `{ name: "Ada" }`; `Hash#fetch` vs `Hash#[]`; symbols as immutable identifiers; the `&:method` shorthand (mechanism deferred).
- **Step 2.2 — `exercise` — `shout(s)` returns the uppercased string with `!`**
  - **Status:** drafting
  - **Tests:** `shout("hi") == "HI!"`, `shout("") == "!"`, `shout("Already Loud") == "ALREADY LOUD!"`.
- **Step 2.3 — `exercise` — `summarize(records)` over an array of hashes**
  - **Status:** drafting
  - **Why this exists:** combines array iteration + symbol-key hash access + `Hash#fetch` with a default. Hits four idioms in one exercise.
  - **Tests:** `summarize([{ name: "Ada", age: 30 }, { name: "Linus", age: 25 }])` returns `"Ada (30), Linus (25)"`.
- **Step 2.4 — `exercise` — `uppercase_all(words)` using `map(&:upcase)`**
  - **Status:** drafting
  - **Why:** introduces `Symbol#to_proc` syntactically. The tests force a method-call shape so `&:upcase` is the natural answer; the mechanism is named-and-deferred ("we'll see why `&:symbol` works in Lesson 5").

---

### Lesson 3 — Control flow and truthiness

> *What changed in the learner's head:* "Only `false` and `nil` are falsy in Ruby. `0` is truthy. `\"\"` is truthy. `[]` is truthy. That fact rewrites how I check things."

**Step distribution:** 1 `read`, 1 `predict`, 1 `exercise`, 1 `challenge` = 4 steps.

- **Step 3.1 — `read` — "if / unless / case, truthiness, and the triple-equals"**
  - **Status:** drafting
  - **Body topics:** `if`/`unless`/`elsif`, postfix forms (`return x if y`), `case/when` and the `===` operator, `while`/`until`/`loop`. The truthiness rule, with the "polyglot reflex" callout (Python/JS treat `0`, `""`, `[]` as falsy; Ruby doesn't).
- **Step 3.2 — `predict` — "is `if 0` truthy or falsy?"**
  - **Status:** drafting
  - **Options:** truthy / falsy / `TypeError` / depends on Ruby version. Correct: truthy. Wrong-answer feedback names the C/Java/Python/JS reflex for each distractor.
- **Step 3.3 — `exercise` — `classify(x)` using `case` on class**
  - **Status:** drafting
  - **Tests:** cover `Integer`, `String`, `Array`, `Hash`, `Symbol`, and an unrecognised type that falls through to `"other"`. Exposes the `Class === instance` semantics.
- **Step 3.4 — `challenge` — `fizzbuzz_compact(n)` returning an array**
  - **Status:** drafting
  - **Prompt:** real-problem framing — "given `n`, produce the standard FizzBuzz sequence as an array of strings, but use `case/when` and the postfix `if` to keep the function under 10 lines." 15-minute budget.

---

### Lesson 4 — Methods

> *What changed in the learner's head:* "Keyword arguments are not optional flavour — they're how I read a call site six months later. And `*args` / `**opts` are how every Ruby DSL turns calls into data."

**Step distribution:** 1 `read`, 2 `exercise`, 1 `challenge` = 4 steps.

- **Step 4.1 — `read` — "def, defaults, keywords, splat, implicit return"**
  - **Status:** drafting
  - **Body topics:** `def`/`end`; positional + default arguments; keyword arguments (`def greet(name:, greeting: "Hello")`); splat `*args` + double-splat `**opts`; implicit return (the value of the last expression); explicit `return`.
- **Step 4.2 — `exercise` — `greet(name:, greeting: "Hello")` with keyword args**
  - **Status:** drafting
  - **Tests:** `greet(name: "Ada")` returns `"Hello, Ada!"`; `greet(name: "Linus", greeting: "Hej")` returns `"Hej, Linus!"`; calling without `name:` raises `ArgumentError`.
- **Step 4.3 — `exercise` — `tally_args(*nums, **opts)` returns shape info**
  - **Status:** drafting
  - **Tests:** `tally_args(1, 2, 3, label: "x")` returns `{ positional_count: 3, keyword_count: 1, label: "x" }`. Forces engagement with both splat forms.
- **Step 4.4 — `challenge` — Refactor a positional-argument method to keyword**
  - **Status:** drafting
  - **Prompt:** "Here is a method `transfer(account_id, amount, currency, memo)`. Refactor to keyword arguments. Test that callers using the new shape pass; you don't need to keep backward compatibility — but explain in a comment what would break."

---

### Lesson 5 — Blocks: the central idea (teaser)

> *What changed in the learner's head:* "Blocks aren't `each`'s syntax — `each` is just one of the methods that takes a block. The pattern is everywhere, and the language was designed around it."

**Step distribution:** 1 `read`, 1 `predict`, 2 `exercise` = 4 steps. Closing the scroll with the central idea, gestured at, not exhausted.

- **Step 5.1 — `read` — "Blocks: a syntactic chunk you pass to a method"**
  - **Status:** drafting
  - **Body topics:** A block is not an object — it's a syntactic chunk attached to a method call with `do ... end` or `{ ... }`. `yield` invokes it. `each` is a method that takes a block; so are `map`, `select`, `times`, `File.open`. The "execute-around" pattern via `File.open(path) { |f| ... }` — why it beats returning the resource. The `&:method` shorthand from Lesson 2 is the same idea: convert a symbol to a Proc, pass it as a block. Closes with: *"We've barely scratched this. `Proc.new` vs `lambda` and what they do with `return` is its own deep-dive — the [Blocks deep-dive scroll](../ruby.md#31-future-deep-dive-candidates-not-in-scope-for-v1) will land that. For now, you can read code and pass a block."*
- **Step 5.2 — `predict` — "what does this method's caller see?"**
  - **Status:** drafting
  - **Snippet:** A method `with_timer` that yields, then returns the elapsed seconds. The predict asks what the caller of `with_timer { sleep(0.1) }` gets back — testing whether the learner understands that `yield` invokes the block while the method's own return value is independent.
- **Step 5.3 — `exercise` — `repeat(n) { ... }` that yields `n` times**
  - **Status:** drafting
  - **Tests:** Count yields. `repeat(3) { counter += 1 }` ends with `counter == 3`. Forces `yield` use.
- **Step 5.4 — `exercise` — `with_timer { ... }` execute-around**
  - **Status:** drafting
  - **Tests:** Returns a `Float ≥ 0` representing elapsed seconds. Use `Process.clock_gettime(Process::CLOCK_MONOTONIC)` for determinism. Asserts on type and bound, not exact duration.

---

## 5. Sandbox notes

- **Runner:** Piston Ruby 3.0.1.
- **Test harness:** **manual**, defined inline in `testCode`. The harness is global `$tests` plus two helpers:
  ```ruby
  def _t(name)
    yield
    $tests << { 'name' => name, 'passed' => true }
  rescue => e
    $tests << { 'name' => name, 'passed' => false, 'message' => e.message }
  end

  def _eq(actual, expected)
    raise "expected #{expected.inspect} but got #{actual.inspect}" unless actual == expected
  end
  ```
  Final footer emits `__DOJO_RESULT__ <json>` for ExecuteStep to parse. Minitest is **not** introduced — that's a deep-dive scroll's job.
- **Stdlib only.** No gems. `Array#tally`, keyword args, `&:method`, `Hash#fetch` with a block — all stdlib in Ruby 3.0+.
- **Determinism:** no `Time.now`, no `rand`. `Process.clock_gettime(Process::CLOCK_MONOTONIC)` is allowed in Lesson 5.4 because tests assert on type/bound, not value.
- **STDIN behaviour:** never exercised. All inputs come as method arguments.
- **`inspect` output stability:** Lesson 1.4's `describe(obj)` test asserts exact `inspect` strings. Ruby 3.0's `inspect` format for Hash is `{:a=>1}` (no spaces around `=>`); confirmed via Piston smoke test.
- **Run timeout:** Piston's default `run_timeout: 3000` ms (set in `config.PISTON_RUN_TIMEOUT`) is tight when six assertions all raise — in that pathological case the rescue cascade can push past 3s and Piston SIGKILLs. Single- or partial-failure cases run cleanly. Worth raising the timeout for the Ruby scroll specifically; tracked as an open item, see §7.

---

## 6. References

Sources cited or drawn from inside this scroll's prose:

- *The Well-Grounded Rubyist*, 3rd ed. — Chapter 2 (Objects, methods, local variables), Chapter 3 (Organizing objects with classes). The spine of Lesson 1.
- *Eloquent Ruby* (Russ Olsen) — "Execute Around with a Block" is the closest external match to Lesson 5.4.
- *Programming Ruby 3.2* (Pickaxe) — reference for `Array#tally`, `Hash#fetch`, `Symbol#to_proc`, `Method.parameters`.
- Ruby docs — <https://docs.ruby-lang.org/en/3.3/Integer.html>, <https://docs.ruby-lang.org/en/3.3/NilClass.html>, <https://docs.ruby-lang.org/en/3.3/String.html>, <https://docs.ruby-lang.org/en/3.3/Array.html>, <https://docs.ruby-lang.org/en/3.3/Hash.html>, <https://docs.ruby-lang.org/en/3.3/Symbol.html>.
- Ruby Koans — borrow the assertion-as-question voice for predict steps (the koan that asks "what is the class of nil?" and waits for you to fix the assertion).

---

## 7. Open questions / known gaps

- **Piston run_timeout for Ruby.** The default 3-second per-execution timeout is tight when many assertions fail in cascade (the harness's `rescue` cycle for 6 raises pushes past 3s on a cold container). Single-fail and partial-fail cases pass cleanly. Options: (a) raise `config.PISTON_RUN_TIMEOUT` globally to 5s (affects all languages), (b) raise it for Ruby specifically via Piston's `PISTON_LIMIT_OVERRIDES` (already configured to 15s on the Piston accessory — the bottleneck is the API's own request payload), (c) leave as-is and accept that "all-fail" learner attempts show a timeout instead of a per-test breakdown. Decision deferred until a learner actually trips it.
- **Lesson 5 challenge slot.** Currently no `challenge` step in Lesson 5 — the lesson closes with two exercises and a forward-pointer to the deep-dive. The framework heuristic in [`../../README.md`](../../README.md) §4.3 says a scroll without challenges is suspect. Defensible here because Lesson 3.4's challenge serves the whole scroll's challenge budget. If reviewers push back, add a 4th challenge step in Lesson 5 — candidate: implement `each_with_index` from scratch using `yield`.
- **Predict step count.** Three predicts (1.2, 3.2, 5.2) for ~16 steps total = ~19% predict share. Slightly above the heuristic's ~10-15%. Defensible because Ruby's surprise surface is large; if signal after launch shows predict feels intrusive, drop 5.2 first.
- **No `attr_accessor`.** Deliberate. Encapsulation cost vs. expediency is a real conversation that belongs in the OOP deep-dive, not in 90 minutes. A reviewer might object that the polyglot will see `attr_accessor` in any real Ruby codebase by Friday. Counter: they'll see it as "Ruby's getter/setter syntax sugar" and that reading is fine for week 1. The depth (invariant boundary decisions) needs the deep-dive's room.
- **Total step count: 20.** Lesson 1 has 4, Lessons 2-5 have 4 each = 20. Slightly above the framework's typical 12-20 range — at the top end, defensible because Ruby has more surprises to surface than (say) TypeScript does. If after the spec is fully authored the time creeps past 100 minutes, the first cuts: Lesson 4.4 (the keyword-refactor challenge) and Lesson 5.3 (the `repeat(n)` exercise).
