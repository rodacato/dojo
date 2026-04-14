# Ruby Course Track

> Maintainer persona: S10 Rhea Kapoor (Ruby steward) + S5 Dr. Elif Yıldız (curriculum architect)
> Last researched: 2026-04-14

## 1. Learning Philosophy for Ruby

Ruby has a cultural identity problem for teaching: most learners arrive via Rails and never learn the language itself. They write `has_many :posts` before they have ever written a method that takes a block. They debug N+1 queries before they understand `Enumerable`. They use `attr_accessor` as a magical incantation rather than a deliberate decision about object boundaries. This track is about **Ruby as a language** — the small, opinionated, block-centric object language designed by Matz — not Ruby-the-framework-host. Rails is explicitly out of scope here. If a learner finishes this track and never touches Rails, they have still learned a powerful, expressive language that pays off in DSLs, scripting, infra tooling, and clear thinking about objects.

The core mental model is **blocks, procs, and lambdas**. Almost every Ruby idiom that surprises a Python or Java developer reduces to "this method takes a block." `each`, `map`, `inject`, `tap`, `Array.new(5) { ... }`, `File.open(path) { |f| ... }`, `define_method`, `Module#class_eval`, and the entire Rails routing DSL are all the same idea. We teach blocks early, deeply, and on their own terms — not as a footnote to `each`. By the end of the blocks sub-course, a learner should be able to write a method that takes a block, call it with `yield`, accept it explicitly with `&block`, decide between `Proc.new` and `lambda` semantics, and explain why `Proc.curry` exists.

"Everything is an object" is taught as a **property of the object model**, not as a slogan. We demonstrate it by calling methods on integers, by reopening `Integer`, by inspecting `5.class.ancestors`, and by showing that `nil.respond_to?(:to_s)` is `true` for a reason. Symbols are introduced when they have a job to do (immutable identifiers, hash keys, method references via `Symbol#to_proc`) — not as a trivia bullet on slide 3. Metaprogramming is taught with **footgun awareness**: `define_method` before `method_missing`; `respond_to_missing?` always paired with `method_missing`; `class_eval` only after the learner has a problem it actually solves.

Dead ends we explicitly avoid: teaching symbols as a trivia bullet ("strings are mutable, symbols are not — moving on"); teaching `each` without showing why `map` / `select` / `inject` are usually the right answer in Ruby; teaching metaprogramming as spectacle ("look, we can build Rails!") rather than as a precision tool; letting learners conflate Ruby idioms with Rails magic (`scope`, `belongs_to`, `before_action` are not Ruby — they are Rails-specific DSL methods built on Ruby).

A note on tone for this track: the Dojo voice is direct and assumes a literate developer. We do not pad with "Welcome to your Ruby journey!" preambles. Every step exists because it teaches a concrete, testable thing. When an exercise is hard, we say so. When the Piston sandbox forces a compromise (no `async` gem, no Rails, no `pry` REPL during a step), we say that too — explicitly, in the lesson body, not buried in a footnote. The learner deserves to know what is the language, what is the framework, and what is the sandbox getting in the way.

## 2. Course Tree Overview

| Course | Level | Prereqs | Steps (approx) | Status |
|---|---|---|---|---|
| ruby-fundamentals | Basic | — | ~16 | proposed |
| ruby-blocks-procs-lambdas | Intermediate | ruby-fundamentals | ~14 | proposed |
| ruby-oop-idioms | Intermediate | ruby-fundamentals, ruby-blocks-procs-lambdas | ~16 | proposed |
| ruby-testing-minitest | Intermediate | ruby-fundamentals, ruby-oop-idioms | ~12 | proposed |
| ruby-metaprogramming | Advanced | ruby-oop-idioms | ~14 | proposed |
| ruby-concurrency-fibers-ractors | Advanced / Specific | ruby-blocks-procs-lambdas | ~10 | proposed |
| ruby-pattern-matching | Specific | ruby-fundamentals | ~8 | proposed (deep-dive) |
| ruby-enumerable-mastery | Specific | ruby-blocks-procs-lambdas | ~10 | proposed (deep-dive) |

Total: 6 core sub-courses + 2 optional deep-dives. Roughly 100 steps if all are built.

## 3. Sub-courses

### 3.1 Ruby Fundamentals — Basic

**Slug:** `ruby-fundamentals`
**Prereqs:** none (assumes general programming literacy in another language)
**Learner time:** ~5 hours
**Learning outcomes:**
- Read and write idiomatic Ruby for variables, strings, numbers, arrays, hashes, and control flow.
- Understand Ruby's object model well enough to be unsurprised by `5.times { ... }` or `nil.to_s`.
- Use symbols where appropriate and explain why.
- Write small command-line scripts that read input, transform it, and print output.

**Lesson 1: First contact with the object model**
- Step 1 (explanation): Everything is an object. `5.class`, `nil.class`, `true.class`. Methods are sent to receivers; `1 + 2` is `1.+(2)`.
- Step 2 (exercise): Given a number `n`, return `n.class.name`. Test asserts equality with `"Integer"`.
- Step 3 (exercise): Implement `describe(obj)` that returns `"#{obj.class.name}: #{obj.inspect}"`. Test with several types.

**Lesson 2: Strings, numbers, and interpolation**
- Step 1 (explanation): String literals, single vs. double quotes, `#{}` interpolation, `String#chars`, `String#split`, `String#gsub`. Integer vs. Float, integer division gotcha.
- Step 2 (exercise): Write `shout(s)` returning `s.upcase + "!"`. Test asserts `shout("hi") == "HI!"`.
- Step 3 (exercise): Write `word_count(sentence)` returning a hash of word → count. Deterministic input only.

**Lesson 3: Arrays and hashes**
- Step 1 (explanation): Array literal, indexing, negative indices, `<<`, `push`, `pop`. Hash literal, symbol keys vs. string keys, `Hash#fetch` vs. `Hash#[]`.
- Step 2 (exercise): Write `most_common(arr)` returning the most common element. Use `tally` (Ruby 2.7+).
- Step 3 (challenge): Implement `group_anagrams(words)` returning an array of arrays of anagrams.

**Lesson 4: Control flow and truthiness**
- Step 1 (explanation): `if`/`unless`/`elsif`, `case`/`when` (with `===`), `while`/`until`, `loop`. Only `false` and `nil` are falsy — `0` and `""` are truthy.
- Step 2 (exercise): Implement `fizzbuzz(n)` returning an array of strings. Use `case` for discipline.
- Step 3 (exercise): Implement `classify(x)` using `case` on `x` matching `Integer`, `String`, `Array`, else `"other"`.

**Lesson 5: Symbols, with motivation**
- Step 1 (explanation): A symbol is an immutable, interned identifier. Compare `:user` vs. `"user"` for hash keys. Why `Symbol#to_proc` (`&:upcase`) works.
- Step 2 (exercise): Given an array of words, return the uppercased array using `map(&:upcase)`. Test forces this idiom.
- Step 3 (exercise): Build a config hash with symbol keys; write `config.fetch(:host) { "localhost" }`.

**Lesson 6: Methods and basic I/O**
- Step 1 (explanation): `def`, default arguments, keyword arguments, splat `*args` / double-splat `**opts`, implicit return.
- Step 2 (exercise): Write `greet(name:, greeting: "Hello")` returning `"#{greeting}, #{name}!"`.
- Step 3 (challenge): Write `parse_csv_line(line)` returning an array of trimmed strings split on commas. No `CSV` library — practice string handling.

**Lesson 7: A small CLI-shaped script (no actual CLI)**
- Step 1 (explanation): `STDIN`, `STDOUT`, `puts` vs. `print` vs. `p`. Why `p` is the debugger's friend (`inspect`-formatted, returns its argument).
- Step 2 (exercise): Given a hardcoded multi-line string acting as input, count lines that contain a digit. Practice the read-transform-print loop without depending on real STDIN, since Piston's STDIN behavior per step may vary.

**Piston considerations:** Pure stdlib. `tally`, keyword args, `&:symbol` all work in Ruby 3.x. Deterministic — no `rand`, no `Time.now`. Test code uses Minitest assertions. STDIN behavior in Piston is per-execution and may be empty by default; prefer passing input as a method argument over reading from STDIN in exercises.

**Reference material:**
- Book: *The Well-Grounded Rubyist* (David A. Black & Joseph Leo III) — chapters on objects, methods, and the basic types are the spine of this sub-course.
- Book: *Programming Ruby 3.2* / "The Pickaxe" (Thomas, Hunt et al.) — reference for stdlib method signatures.
- Docs: <https://docs.ruby-lang.org/en/3.3/> — String, Array, Hash, Integer, Symbol classes.
- Community reference: Ruby Koans (EdgeCase / Jim Weirich) — `about_objects.rb`, `about_strings.rb`, `about_arrays.rb`, `about_hashes.rb`, `about_symbols.rb`. Borrow the "fill in the blank" assertion style for some exercises.
- Community reference: Exercism Ruby track — `leap`, `hamming`, `rna-transcription`, `pangram` are direct fits for fundamentals.

---

### 3.2 Ruby Blocks, Procs, Lambdas — Intermediate

**Slug:** `ruby-blocks-procs-lambdas`
**Prereqs:** `ruby-fundamentals`
**Learner time:** ~4 hours
**Learning outcomes:**
- Write a method that takes a block via `yield` and via `&block`.
- Explain the difference between `Proc.new`, `proc`, and `lambda` (arity strictness, `return` semantics).
- Use closures deliberately to capture state.
- Use `Proc#curry` and explain when partial application is the right tool.
- Recognize "block-as-API-shape" — when to design a method to take a block instead of returning data.

**Lesson 1: Blocks and `yield`**
- Step 1 (explanation): A block is not an object. It is a syntactic chunk passed alongside a method call with `do ... end` or `{ ... }`. `yield` invokes it.
- Step 2 (exercise): Implement `repeat(n) { ... }` that yields `n` times. Test counts calls.
- Step 3 (exercise): Implement `my_map(arr)` that uses `yield` to transform each element. Test asserts `my_map([1,2,3]) { |x| x * 2 } == [2,4,6]`.

**Lesson 2: `&block`, `block_given?`, and capturing the block**
- Step 1 (explanation): `&block` in the parameter list converts the block to a `Proc`. `block_given?` checks if one was passed. `&proc` in a call converts a Proc back into a block.
- Step 2 (exercise): Implement `safe_each(arr, &block)` that calls the block on each element only if a block was given; otherwise returns an `Enumerator`.
- Step 3 (exercise): Implement `compose(f, g)` that returns a Proc applying `f` after `g`.

**Lesson 3: Proc vs. lambda**
- Step 1 (explanation): `Proc.new` / `proc` is lenient about arity and `return`s from the enclosing method. `lambda` / `->` is strict about arity and `return`s only from itself. Show both blowing up in opposite ways.
- Step 2 (exercise): Write a method that, given a `Proc`, returns whether it is a lambda. Use `Proc#lambda?`.
- Step 3 (challenge): Implement `strict(&block)` that returns a lambda with the same body, asserting that arity matches when called.

**Lesson 4: Closures and `Proc.curry`**
- Step 1 (explanation): A block/proc closes over its lexical scope. Show a counter built with `proc`. Then introduce currying.
- Step 2 (exercise): Implement `make_counter` returning a Proc that increments and returns an internal count on each call.
- Step 3 (exercise): Use `Proc#curry` to turn `add = ->(a,b,c) { a+b+c }` into `add.curry[1][2][3] == 6`.

**Lesson 5: Block-as-API-shape**
- Step 1 (explanation): The `File.open(path) { |f| ... }` pattern. Why returning a block-yielding method beats returning a resource the caller has to close.
- Step 2 (exercise): Implement `with_timer { ... }` that yields, then returns the elapsed seconds. Use `Process.clock_gettime(Process::CLOCK_MONOTONIC)` for determinism — but test asserts only that elapsed is a Float ≥ 0.
- Step 3 (challenge): Implement `transaction(state) { |s| ... }` that yields a deep-copy of `state`, and only commits the mutation back if the block does not raise.

**Piston considerations:** All stdlib. Time-based tests are flaky on Piston; assert structural properties (type, ≥ 0), not exact durations. Avoid `sleep` in tests.

**Reference material:**
- Book: *The Well-Grounded Rubyist* — "Callable and runnable objects" chapter is the canonical treatment.
- Book: *Eloquent Ruby* (Russ Olsen) — chapters 18 ("Execute Around with a Block") and 19 ("Save Blocks to Execute Later") map almost 1:1 to Lessons 2 and 5.
- Docs: <https://docs.ruby-lang.org/en/3.3/Proc.html>
- Community reference: Ruby Koans `about_blocks.rb`, `about_proc.rb`, `about_lambdas.rb` — borrow the arity-strictness koans verbatim in spirit.
- Community reference: RubyTapas (Avdi Grimm) — the early episodes on blocks and procs are the gold standard for short-form pedagogy here.

---

### 3.3 Ruby OOP & Idioms — Intermediate

**Slug:** `ruby-oop-idioms`
**Prereqs:** `ruby-fundamentals`, `ruby-blocks-procs-lambdas`
**Learner time:** ~6 hours
**Learning outcomes:**
- Design small classes with deliberate boundaries (no reflexive `attr_accessor`).
- Distinguish `module` as namespace from `module` as mixin.
- Use `Comparable` and `Enumerable` by mixin.
- Use inheritance sparingly and composition by default.
- Recognize when `method_missing` is appropriate — and when it is not.

**Lesson 1: Classes, state, and the encapsulation cost of `attr_accessor`**
- Step 1 (explanation): `class`, `initialize`, instance variables, `self`. Show `attr_reader`, `attr_writer`, `attr_accessor` — but frame `attr_accessor` as a deliberate decision to expose mutable state, not a default.
- Step 2 (exercise): Implement `class Temperature` with `initialize(celsius:)`, `to_fahrenheit`, `to_kelvin`. Use `attr_reader :celsius` only.
- Step 3 (exercise): Refactor a class that uses `attr_accessor` for an internal counter into one that exposes only `increment` and `count`. Test asserts the writer is no longer public.

**Lesson 2: Modules as namespace**
- Step 1 (explanation): `module Geometry; class Point ... end; end`. Constant lookup with `::`.
- Step 2 (exercise): Wrap two classes in a `module Inventory` and access them as `Inventory::Item`, `Inventory::Cart`.

**Lesson 3: Modules as mixin**
- Step 1 (explanation): `include` adds instance methods; `extend` adds class methods; `prepend` inserts before the class in the ancestor chain. Show `Class.ancestors`.
- Step 2 (exercise): Implement `module Greetable` with a `greet` method that uses `name` (assumed to exist on the includer). Mix into two unrelated classes.
- Step 3 (challenge): Use `prepend` to wrap an existing method `#charge` with logging. Test asserts call order via an injected logger.

**Lesson 4: `Comparable` and `Enumerable` by mixin**
- Step 1 (explanation): Implement `<=>` to get `<`, `<=`, `==`, `>`, `>=`, `between?`, `clamp` for free via `include Comparable`. Implement `each` to get `map`, `select`, `inject`, `to_a` via `include Enumerable`.
- Step 2 (exercise): Make `Version` (`major.minor.patch`) `Comparable`. Test asserts sorting works.
- Step 3 (exercise): Make `Deck` `Enumerable` over its cards. Test asserts `deck.count`, `deck.first`, `deck.map(&:suit)` all work.

**Lesson 5: Inheritance, composition, and `method_missing` with discipline**
- Step 1 (explanation): Inheritance is for "is-a" with a shared invariant; composition (delegation via `Forwardable` or explicit) is for "has-a". `method_missing` always paired with `respond_to_missing?` — otherwise duck-typing breaks.
- Step 2 (exercise): Build `class StringDecorator` that wraps a `String` and forwards unknown methods to it via `method_missing` + `respond_to_missing?`. Test asserts both forwarding and `respond_to?(:upcase)`.
- Step 3 (challenge): Refactor a deep inheritance chain (3 levels) into composition with `Forwardable`. Test asserts the public interface is preserved.

**Piston considerations:** `Forwardable` is stdlib (`require "forwardable"`). All exercises are pure-Ruby. Test code can introspect ancestors and method visibility.

**Reference material:**
- Book: *Practical Object-Oriented Design in Ruby* (Sandi Metz) — chapters on single responsibility, dependencies, duck typing, and inheritance vs. composition. Lesson 5 is essentially POODR chapters 6–8.
- Book: *99 Bottles of OOP* (Sandi Metz & Katrina Owen) — the refactoring discipline behind Lesson 1.
- Book: *Confident Ruby* (Avdi Grimm) — the "construct your input at the boundary" pattern informs `Temperature(celsius:)`.
- Book: *Eloquent Ruby* — chapters on classes, modules, and equality.
- Docs: <https://docs.ruby-lang.org/en/3.3/Module.html>, <https://docs.ruby-lang.org/en/3.3/Comparable.html>, <https://docs.ruby-lang.org/en/3.3/Enumerable.html>
- Community reference: Sandi Metz's "Nothing is Something" and "All the Little Things" talks — companion viewing.

---

### 3.4 Ruby Testing with Minitest — Intermediate

**Slug:** `ruby-testing-minitest`
**Prereqs:** `ruby-fundamentals`, `ruby-oop-idioms`
**Learner time:** ~3.5 hours
**Learning outcomes:**
- Write Minitest tests in both test/unit and spec styles.
- Use the core assertions (`assert_equal`, `assert_raises`, `assert_in_delta`, `assert_predicate`).
- Drive a small class via tests (red → green → refactor).
- Use stdlib-only mocking (`Minitest::Mock`) and stub patterns.

**Lesson 1: Why Minitest, not RSpec (in this course)**
- Step 1 (explanation): Minitest ships with Ruby. RSpec is a gem and may or may not be available in the Piston sandbox. Minitest is also smaller, faster, and what most Ruby stdlib tests use. We teach Minitest deeply; RSpec is flagged as "go learn this next, syntax differs, semantics overlap."
- Step 2 (exercise): Read a failing Minitest test for a `Calculator#add` that does not yet exist; implement the class to make it pass.

**Lesson 2: Test/unit style**
- Step 1 (explanation): `class FooTest < Minitest::Test`; `def test_xxx`; `setup`/`teardown`; `assert_equal expected, actual`.
- Step 2 (exercise): Write 3 tests for a `Stack` class (push, pop, empty?). Implement `Stack` to satisfy them.

**Lesson 3: Spec style**
- Step 1 (explanation): `describe`, `it`, `_(actual).must_equal expected`. Same engine, different surface.
- Step 2 (exercise): Rewrite the `Stack` tests in spec style.

**Lesson 4: Assertion variety**
- Step 1 (explanation): `assert_raises(ArgumentError) { ... }`, `assert_in_delta` for floats, `assert_predicate user, :admin?`, `assert_includes`, `refute_*` family.
- Step 2 (exercise): Test a `BankAccount#withdraw` that should raise on overdraft.
- Step 3 (challenge): Parametrized-style: given an array of `[input, expected]` pairs, generate one `assert_equal` per pair inside a single test. (Ruby has no native parametrized tests; show the array-loop idiom.)

**Lesson 5: Mocking at the stdlib boundary**
- Step 1 (explanation): `Minitest::Mock` — `expect(:method, return_value, [args])`, `mock.verify`. When to mock (true side effects: I/O, network) and when not to (pure logic).
- Step 2 (exercise): Test a `Notifier` class that takes a mailer dependency. Use `Minitest::Mock` to assert `deliver` was called with the right subject.

**Lesson 6: TDD on a tiny problem**
- Step 1 (explanation): Red → green → refactor as a discipline, not a slogan. The refactor step is non-optional.
- Step 2 (challenge): Build `RomanNumeral.from_int(n)` for `1..3999` driven entirely by tests provided in testCode. Implementation file is empty at start; learner adds one method at a time.

**Piston considerations:** Minitest is stdlib (`require "minitest/autorun"`). **RSpec is a gem and likely unavailable in Piston** — confirm by probing. If RSpec is unavailable, the spec-style lesson uses `Minitest::Spec`, which is also stdlib and shares the `_(...).must_equal` syntax. No file I/O in tests; mocks only. Tests must produce deterministic output (Minitest's default reporter is fine; pin random seed if `--seed` is used by the runner).

**Reference material:**
- Book: *The Minitest Cookbook* (Chris Kottom) — assertion patterns and the `Minitest::Mock` chapter.
- Book: *Effective Testing with RSpec 3* (Myron Marston & Ian Dees) — referenced only as the "if you go to RSpec next" pointer.
- Docs: <https://docs.seattlerb.org/minitest/>
- Community reference: Exercism Ruby track — every exercise ships with a Minitest file; these are the gold standard for "small, focused, deterministic" test design.
- Community reference: The Pragmatic Studio Ruby course — testing module.

---

### 3.5 Ruby Metaprogramming — Advanced

**Slug:** `ruby-metaprogramming`
**Prereqs:** `ruby-oop-idioms`
**Learner time:** ~5 hours
**Learning outcomes:**
- Use `define_method` to generate methods at class-definition time.
- Use `class_eval` and `instance_eval` and explain the receiver / `self` shift in each.
- Understand singleton classes (`class << self`, eigenclass) well enough to read Rails source.
- Pair `method_missing` with `respond_to_missing?` always.
- Build a small DSL (e.g., a tiny route declarer or a config block) without a framework.

Framing: this sub-course is **how Rails magic works, taught without Rails**. The learner finishes able to read Rails internals, not to write Rails apps.

**Lesson 1: `define_method` before `method_missing`**
- Step 1 (explanation): `define_method(:name) { |args| ... }` adds a method at definition time. It is greppable, introspectable, and almost always the right tool over `method_missing`.
- Step 2 (exercise): Given an array of attribute names, generate readers for each on a class using `define_method` inside a class macro.
- Step 3 (exercise): Implement `attr_reader_with_default(:foo, default: 0)` as a class method that defines a reader returning the default if `@foo` is `nil`.

**Lesson 2: `class_eval` vs. `instance_eval`**
- Step 1 (explanation): `class_eval` (a.k.a. `module_eval`) opens the class body — `def` defines instance methods, `self` is the class. `instance_eval` opens an object — `def` defines a singleton method, `self` is the object.
- Step 2 (exercise): Use `String.class_eval { def shout; upcase + "!"; end }` to add `shout` to all strings (locally, in test scope). Test asserts `"hi".shout == "HI!"`.
- Step 3 (exercise): Use `instance_eval` to add a one-off method to a single object. Test asserts other instances do not have it.

**Lesson 3: Singleton classes (the eigenclass)**
- Step 1 (explanation): Every object has a singleton class. `class << obj; ... end` opens it. Class methods are instance methods of the class's singleton class — that is what `def self.foo` desugars to.
- Step 2 (exercise): Define a class method on `Point` two ways: `def self.origin` and `class << self; def origin; ...; end; end`. Test both equivalently.
- Step 3 (challenge): Inspect `obj.singleton_class.ancestors` and write an exercise that asserts a specific ancestor chain.

**Lesson 4: `method_missing` + `respond_to_missing?` together**
- Step 1 (explanation): `method_missing` without `respond_to_missing?` lies to `respond_to?`, breaking duck typing, `Method` objects, and serialization. Always implement both.
- Step 2 (exercise): Implement `OpenAttributes` — a class that accepts arbitrary `obj.foo = 1` / `obj.foo` via `method_missing` and reports `respond_to?(:foo)` correctly via `respond_to_missing?`.
- Step 3 (challenge): Refactor an `OpenAttributes` that uses only `method_missing` to also use `define_method` to memoize defined accessors after first use, so the hot path stops going through `method_missing`.

**Lesson 5: Building a tiny DSL**
- Step 1 (explanation): Anatomy of a Ruby DSL: a top-level method that takes a block, `instance_eval` on a builder object, declarative class macros via `define_method`.
- Step 2 (exercise): Build `Schema.define { field :name, :string; field :age, :integer }` returning a frozen schema object. Test asserts the schema's structure.
- Step 3 (challenge): Build a tiny route declarer: `Router.new.draw { get "/users", to: :index; post "/users", to: :create }`. Returns a hash of routes. **Flag:** this is intentionally a toy — Rails routing is far more complex; the exercise is about the DSL shape, not the framework.

**Piston considerations:** All metaprogramming runs in-process, single-file. No `require` of external gems. Tests can assert on `instance_methods`, `singleton_class.ancestors`, `respond_to?`. Avoid global monkey-patches that would leak across tests in the same Piston run.

**Reference material:**
- Book: *Metaprogramming Ruby 2* (Paolo Perrotta) — the canonical text. Lessons 1–4 follow the book's "Object Model" and "Methods" chapters closely. Lesson 5 borrows from the "Writing Code That Writes Code" chapter.
- Book: *The Well-Grounded Rubyist* — "Object individuation" and "Callable and runnable objects" chapters.
- Book: *Eloquent Ruby* — chapters 24–27 on `method_missing`, monkey-patching, `self`, and DSLs.
- Docs: <https://docs.ruby-lang.org/en/3.3/Module.html#method-i-define_method>
- Community reference: Pat Shaughnessy's *Ruby Under a Microscope* — for learners who want to go deeper into the VM.

---

### 3.6 Ruby Concurrency: Fibers & Ractors — Advanced / Specific

**Slug:** `ruby-concurrency-fibers-ractors`
**Prereqs:** `ruby-blocks-procs-lambdas`
**Learner time:** ~3 hours
**Learning outcomes:**
- Explain the GIL/GVL: Ruby threads are concurrent but not parallel for pure Ruby code.
- Use `Fiber` as a cooperative scheduling primitive (`Fiber.new`, `Fiber#resume`, `Fiber.yield`).
- Read and explain a `Fiber.scheduler` interface at the conceptual level.
- Explain Ractors: parallel actors with copy/move semantics; what they cost in terms of API.

**Framing flag:** No `async` gem in Piston. This sub-course teaches the **shape** of cooperative scheduling and parallel actors. Production patterns (Falcon, async-http, Sidekiq) are explicitly out of scope and called out as "next step, not in this sandbox."

**Lesson 1: Threads and the GVL**
- Step 1 (explanation): `Thread.new { ... }`, `#join`, `#value`. Why two CPU-bound threads do not give 2× throughput in MRI Ruby. When threads still help (I/O-bound work releases the GVL).
- Step 2 (exercise): Spawn 4 threads that each compute a sum over a chunk of an array; join them and combine. Test asserts correctness, not speedup.

**Lesson 2: Fibers**
- Step 1 (explanation): A Fiber is a stack of code that you can pause and resume cooperatively. `Fiber.new { ... }`, `Fiber#resume`, `Fiber.yield`. Generators are the textbook example.
- Step 2 (exercise): Build an infinite Fibonacci Fiber and pull the first 10 values via `resume`.
- Step 3 (exercise): Build a `pipeline` where Fiber A produces numbers and Fiber B consumes and squares them — both cooperative, no threads.

**Lesson 3: `Fiber.scheduler` (conceptual)**
- Step 1 (explanation): Ruby 3 added a hook (`Fiber.set_scheduler`) so that blocking I/O can suspend the current Fiber and resume another. Show the interface (`io_wait`, `block`, `unblock`, `kernel_sleep`). Explain that production schedulers (`async`) implement this — but that we cannot install them here.
- Step 2 (exercise): Write a no-op scheduler skeleton (a class that responds to the required methods, returning sensible defaults). Test asserts `respond_to?` for each hook. **Flag:** this is shape-only; it does not actually drive non-blocking I/O without a real implementation.

**Lesson 4: Ractors (overview)**
- Step 1 (explanation): Ractor is Ruby 3's parallel-actor primitive. Ractors have isolated heaps; only shareable objects (frozen, immutable) cross boundaries. `Ractor.new { ... }`, `Ractor#send`, `Ractor.receive`. Still flagged "experimental" through Ruby 3.x.
- Step 2 (exercise): Spawn two Ractors, send each an integer, have each return its square, collect both. Test asserts the pair of results. **Flag:** Ractor warnings on stderr are expected; tests should tolerate them.

**Piston considerations:** `Fiber` and `Thread` are stdlib and work. `Ractor` works but emits an experimental warning to stderr — testCode should assert against stdout only. **No `async` gem.** **No Sidekiq.** Sleep-based tests are flaky; assert structural outcomes (counts, ordering), not timing. Single-process Piston means cross-process IPC is out of scope.

**Reference material:**
- Book: *Working with Ruby Threads* (Jesse Storimer) — older but still the clearest treatment of the GVL, thread-safety, and condition variables in Ruby. Self-published, may be hard to find.
- Book: *Polished Ruby Programming* (Jeremy Evans) — chapters on concurrency primitives in modern Ruby.
- Talks: Koichi Sasada's RubyKaigi talks on Ractor (2020–2023) — the design rationale.
- Docs: <https://docs.ruby-lang.org/en/3.3/Fiber.html>, <https://docs.ruby-lang.org/en/3.3/Ractor.html>
- Community reference: Samuel Williams's `async` gem documentation — read-only reference for the scheduler interface, since we cannot install the gem.

---

### 3.7 Ruby Pattern Matching — Specific (deep-dive, optional)

**Slug:** `ruby-pattern-matching`
**Prereqs:** `ruby-fundamentals`
**Learner time:** ~2 hours
**Learning outcomes:**
- Use `case/in` for structural matching on arrays, hashes, and custom classes via `deconstruct` / `deconstruct_keys`.
- Use the one-line `=>` and `in` operators (Ruby 3.0+).
- Recognize when pattern matching beats `case/when` and when it is overkill.

**Lesson 1: `case/in` basics**
- Step 1 (explanation): `case value; in [a, b, *rest]; ...; in {name: String => name}; ...; end`. Pin operator `^`. Guard clauses `if`.
- Step 2 (exercise): Parse a parsed-JSON-like hash and extract `name` and `age` via pattern matching, returning a tuple.

**Lesson 2: `deconstruct` / `deconstruct_keys`**
- Step 1 (explanation): Implement these on a class to make it pattern-matchable.
- Step 2 (challenge): Make a `Point` class pattern-match as `[x, y]` and as `{x:, y:}`.

**Piston considerations:** Ruby 3.x required. Stdlib only.

**Reference material:**
- Docs: <https://docs.ruby-lang.org/en/3.3/syntax/pattern_matching_rdoc.html>
- Community reference: Kevin Newton's blog posts on Ruby's pattern matching syntax evolution.

---

### 3.8 Ruby Enumerable Mastery — Specific (deep-dive, optional)

**Slug:** `ruby-enumerable-mastery`
**Prereqs:** `ruby-blocks-procs-lambdas`
**Learner time:** ~3 hours
**Learning outcomes:**
- Reach for `map`, `select`, `reject`, `inject`, `group_by`, `partition`, `chunk_while`, `each_cons`, `lazy` as the right tool for the job.
- Build custom `Enumerable` classes by implementing `each`.
- Use `Enumerator::Lazy` for infinite sequences.

**Lesson 1: Beyond `each`**
- Step 1 (explanation): `each` is a sink. `map`, `select`, `reject`, `inject` are the workhorses. Show the `each`-with-accumulator anti-pattern next to its `inject` counterpart.
- Step 2 (exercise): Sum the squares of the even numbers in an array using a single chained pipeline.

**Lesson 2: The lesser-known stars**
- Step 1 (explanation): `group_by`, `partition`, `chunk_while`, `each_cons`, `each_slice`, `tally`.
- Step 2 (exercise): Given a sorted array, return runs of consecutive integers using `chunk_while`.
- Step 3 (challenge): Compute a moving average of size 3 over an array using `each_cons(3)`.

**Lesson 3: Lazy enumerators**
- Step 1 (explanation): `(1..).lazy.map { ... }.select { ... }.first(10)`. Why this does not blow the stack on infinite ranges.
- Step 2 (exercise): Generate the first 10 primes lazily.

**Piston considerations:** All stdlib. Lazy enumerators must terminate — tests should always call `.first(n)` or `.take(n)` to bound them.

**Reference material:**
- Book: *Eloquent Ruby* — `Enumerable` chapter.
- Book: *The Ruby Way* (Hal Fulton, André Arko) — `Enumerable` recipes.
- Docs: <https://docs.ruby-lang.org/en/3.3/Enumerable.html>, <https://docs.ruby-lang.org/en/3.3/Enumerator/Lazy.html>

---

## 4. Cross-course exercise patterns

Across all sub-courses, exercises lean on a small set of repeatable shapes that are well-suited to Piston's stateless, stdlib-only sandbox:

- **Pure methods.** Input → output, no side effects. Easiest to test deterministically. Default for fundamentals and Enumerable work.
- **`Enumerable` pipelines.** Transform-filter-reduce chains. Forces idiomatic Ruby and keeps testCode tiny (one `assert_equal`).
- **Block-passing APIs.** Method takes a block; test passes one in and asserts the yielded values or the post-call state. Core to the blocks sub-course.
- **Small DSL construction.** A top-level method takes a block, builds a data structure, returns it. Test asserts the data structure shape. Used in metaprogramming.
- **Doctest-equivalent via comments-with-expected-results.** Where appropriate, exercise prompts include `# => expected` comments; the actual assertion lives in testCode but the prompt teaches the REPL-conversation style. Avoid relying on `# =>` as the assertion mechanism — Piston does not have a doctest runner.
- **Class-with-tests.** Build a small class; testCode instantiates and exercises it. Used heavily in OOP and Minitest sub-courses.

**Piston constraint reminder:** stdlib only. **No Rails, no `async` gem, no Sidekiq, no `pry`, no `byebug`.** No external HTTP, no filesystem assumptions beyond `/tmp`. Every exercise must be reproducible from a single Ruby file with `require "minitest/autorun"` (and other stdlib `require`s) at the top.

## 5. Known pedagogical pitfalls

- **Teaching `attr_accessor` as a syntax fact** without the invariant-encapsulation cost. Learners come away thinking every instance variable should have a getter and setter. POODR exists because of this exact pitfall. Section 3.3 Lesson 1 confronts it head-on.
- **Conflating `module` as namespace vs. mixin.** These are two different jobs that share a keyword. Always teach them in separate lessons (3.3 Lessons 2 and 3) and make the learner write one of each.
- **Teaching `method_missing` before `define_method`.** `method_missing` is often the wrong tool. Generations of learners reached for it because it was taught first as the "magical" thing. Reverse the order (3.5 Lessons 1 then 4) and always pair with `respond_to_missing?`.
- **Teaching Fibers without a reactor story.** Fibers in isolation feel like generators with extra steps. The point is cooperative scheduling for I/O. We teach the concept (3.6 Lesson 3) even though we cannot install `async` — better the learner knows the gap exists than thinks Fibers are just generators.
- **Teaching `each` without `map` / `inject`.** Loops with mutation are the C-and-Java hangover. Section 3.8 Lesson 1 explicitly shows the anti-pattern next to the pipeline.
- **Conflating Ruby with Rails.** `scope`, `belongs_to`, `validates`, `before_action`, `params` are Rails. Calling them "Ruby" is the single biggest disservice this track exists to undo. Every sub-course's intro should be ruthless about this.
- **Symbols as trivia.** Introduced with motivation (immutability, hash keys, `&:method`) in 3.1 Lesson 5, never as a one-slide curiosity.
- **RSpec assumed.** RSpec is a gem and may not be installed in Piston. Default to Minitest; flag RSpec as a separate next step (3.4 Lesson 1).
- **Metaprogramming as spectacle.** "Look, we built Rails!" demos teach nothing. Each metaprogramming lesson must solve a concrete problem the learner just felt the friction of (3.5 framing).

## 6. External references

### Books

- *The Well-Grounded Rubyist*, 3rd ed. — David A. Black & Joseph Leo III. The single best modern Ruby intro that respects the reader.
- *Eloquent Ruby* — Russ Olsen. Idioms, taste, and what "Ruby-ish" means.
- *Programming Ruby 3.2* / "The Pickaxe" — Dave Thomas, Andy Hunt, Chad Fowler et al. Reference, not a tutorial.
- *Practical Object-Oriented Design in Ruby* (POODR) — Sandi Metz. Required reading for the OOP sub-course.
- *99 Bottles of OOP* — Sandi Metz & Katrina Owen. Refactoring discipline.
- *Confident Ruby* — Avdi Grimm. Boundary construction, narrative-style methods.
- *Metaprogramming Ruby 2* — Paolo Perrotta. The metaprogramming canon.
- *The Ruby Way*, 3rd ed. — Hal Fulton & André Arko. Recipe-style reference.
- *Polished Ruby Programming* — Jeremy Evans. Modern (Ruby 3.x) idioms and concurrency.
- *The Minitest Cookbook* — Chris Kottom. Self-published; the Minitest reference.
- *Ruby Under a Microscope* — Pat Shaughnessy. VM internals, optional companion to metaprogramming.
- *Working with Ruby Threads* — Jesse Storimer. Older, still the clearest GVL treatment.

### Online platforms

- **Exercism Ruby track** — maintained originally by Katrina Owen. Hundreds of small exercises with mentor feedback. The exercise-design quality is the gold standard we should aim for. <https://exercism.org/tracks/ruby>
- **Ruby Koans** (EdgeCase, originally Jim Weirich) — fill-in-the-blank assertions across the language. The pedagogical pattern (assertion that fails until you make it pass) is directly applicable. <https://github.com/edgecase/ruby_koans>
- **The Pragmatic Studio — Ruby Programming course** (Mike & Nicole Clark). Paid. Good, traditional curriculum.
- **Upcase archive** (thoughtbot, archived as free content). Workshops on testing, OOP, and refactoring.
- **Sandi Metz workshops** — "Practical Object-Oriented Design" and "99 Bottles" — paid, periodic. Reference material for our OOP sub-course's design exercises.
- **RubyTapas** (Avdi Grimm). Short-form video archive (paid, some free). The episode structure (one idea, ~5 minutes, one example) is a model for how a Dojo step prompt should feel.
- **Go Rails** (Chris Oliver). Flagged: Rails-focused. Useful for learners after this track, not during it.
- **Udemy Ruby courses** — quality varies wildly; the top courses by Mashrur Hossain ("Complete Ruby on Rails Developer Course") are Rails-heavy. For language-focused, Jordan Hudgens's older Ruby content is decent. We should not pattern after Udemy structure — too long, too padded.

### Official documentation

- <https://docs.ruby-lang.org/en/3.3/> — class-by-class reference.
- <https://www.ruby-lang.org/en/documentation/> — language overview.
- <https://docs.ruby-lang.org/en/3.3/syntax/> — syntax pages, especially `pattern_matching_rdoc.html`, `methods_rdoc.html`, `modules_and_classes_rdoc.html`.
- <https://stdgems.org/> — what is "default" vs. "bundled" in Ruby's stdlib (relevant for Piston-availability sanity checks).

### Community learning resources

- *Ruby Weekly* (Peter Cooper) — newsletter, good for tracking what working Rubyists actually use.
- The official Ruby blog and release notes — pattern matching, Ractors, Fiber.scheduler are all best understood from the release-note rationale.
- RubyConf and RubyKaigi talk archives on YouTube — Sandi Metz, Aaron Patterson, Koichi Sasada, Avdi Grimm, Yukihiro Matsumoto.
- Drifting Ruby (Dave Kimura) — flagged: Rails-leaning.

## 7. Suggested implementation order

Build in this order. Resist the urge to start with anything Rails-adjacent.

1. **`ruby-fundamentals`** (3.1). Everything else assumes it. Establishes voice, exercise shape, and Piston conventions for the track.
2. **`ruby-blocks-procs-lambdas`** (3.2). Unlocks idiomatic Ruby. Without this, every later sub-course is fighting upstream.
3. **`ruby-oop-idioms`** (3.3). Sandi-Metz-flavored. Pays off forever.
4. **`ruby-testing-minitest`** (3.4). Needs to come before metaprogramming so that metaprogramming exercises can be tested with confidence.
5. **`ruby-metaprogramming`** (3.5). The "how Rails magic works" payoff lesson.
6. **`ruby-concurrency-fibers-ractors`** (3.6). Last of the core six because it has the largest Piston-vs-reality gap and benefits from a learner who already trusts the platform.
7. **Deep-dives** (3.7 pattern matching, 3.8 Enumerable mastery) — ship as standalone whenever there is bandwidth. Pattern matching is a fast win; Enumerable mastery is a great "I want more" follow-up to the blocks sub-course.

A future, **non-Piston** sandbox track could cover Rails (with a real DB, gems, and a longer-running runtime). That belongs in a separate ADR — it is not a Piston course and should not be shoehorned into one.
