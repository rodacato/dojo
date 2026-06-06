# Ruby Scroll Track

> Maintainer persona: S10 Rhea Kapoor (Ruby steward) + S5 Dr. Elif Yıldız (curriculum architect) + S2 Valentina Cruz (content quality) + S11 Maya Lindqvist (interactive learning UX).
> Last researched: 2026-04-14 · Re-scoped 2026-06-06 under [ADR 022](../../adr/022-crash-course-pivot.md).

## 1. Learning Philosophy for Ruby

Ruby has a cultural identity problem for teaching: most learners arrive via Rails and never learn the language itself. They write `has_many :posts` before they have ever written a method that takes a block. They debug N+1 queries before they understand `Enumerable`. They use `attr_accessor` as a magical incantation rather than a deliberate decision about object boundaries. This track is about **Ruby as a language** — the small, opinionated, block-centric object language designed by Matz — not Ruby-the-framework-host. Rails is explicitly out of scope here. A polyglot developer who finishes the Ruby scroll has learned a powerful, expressive language they can read and write idiomatically, whether or not they ever touch Rails.

The core mental model is **blocks, procs, and lambdas**. Almost every Ruby idiom that surprises a Python or Java developer reduces to "this method takes a block." `each`, `map`, `inject`, `tap`, `Array.new(5) { ... }`, `File.open(path) { |f| ... }`, `define_method`, `Module#class_eval`, and the entire Rails routing DSL are all the same idea. The crash scroll teaches blocks early and on their own terms — not as a footnote to `each`. By the end, a learner should understand what `yield` does, why `&block` exists in a parameter list, and why `Symbol#to_proc` is the same idea in disguise. The metaprogramming-grade depth (Proc vs lambda semantics, `Proc#curry`, `class_eval` vs `instance_eval`) is deferred to deep-dive scrolls — see §3.

"Everything is an object" is taught as a **property of the object model**, not as a slogan. The crash scroll demonstrates it by calling methods on integers, by showing that `nil.respond_to?(:to_s)` is `true` for a reason, by surfacing `:foo == "foo"` as a predict-step surprise. Symbols are introduced when they have a job to do (immutable identifiers, hash keys, method references via `&:method`) — not as a trivia bullet on slide 3. Footgun awareness is built in: every idiom that looks magical (`method_missing`, eigenclasses, `class_eval`) gets named in this scroll and deferred to a deep-dive — never silently elided.

Dead ends we explicitly avoid: teaching symbols as a trivia bullet ("strings are mutable, symbols are not — moving on"); teaching `each` without showing why `map` / `select` / `inject` are usually the right answer; teaching metaprogramming as spectacle ("look, we can build Rails!"); letting learners conflate Ruby idioms with Rails magic (`scope`, `belongs_to`, `before_action` are not Ruby — they are Rails-specific DSL methods built on Ruby).

A note on tone: the Dojo voice is direct and **assumes the reader already programs in another language**. We do not pad with "Welcome to your Ruby journey!" preambles. Every step exists because it teaches a concrete, testable thing or names a surprise the polyglot will hit. When an exercise is hard, we say so. When the Piston sandbox forces a compromise (no `async` gem, no Rails, no `pry` REPL during a step), we say that too — explicitly, in the lesson body, not buried in a footnote. The learner deserves to know what is the language, what is the framework, and what is the sandbox getting in the way.

## 2. Course Authoring Profile

> Course-level voice and authoring decisions for the Ruby track. Per [`docs/courses/README.md`](../README.md) §8.1. The Ruby scroll inherits these defaults; each lesson's spec deviations are declared in the spec's §2 Authoring Notes.

**Voice & angle.** Ruby-not-Rails. The unifying angle is "blocks are not a footnote to `each` — they are the language's central idea." Rails is named only to be excluded. The audience is the polyglot developer who needs confidence in Ruby by Friday, not the first-time programmer learning what a function is. Voice is direct and assumes a literate developer — no "Welcome to your Ruby journey!" preambles, no apologising for Matz's design choices, no softening when an idiom is genuinely weird.

**Step density & rhythm.** Higher prose-per-step than the framework default (which targets ~200-300 words per `read` step per [`README.md`](../README.md) §5.1). Target for Ruby: **300-400 words per `read` step**, with one additional `read` step per lesson when the idiom is surprising (e.g. `Proc.new { return 1 }` semantics, eigenclass mechanics, `define_method` vs. `method_missing`). Reason: Ruby idioms surprise. `5.times { ... }` is not obviously a method call on an integer; `&:symbol` is not obviously `Symbol#to_proc`; `nil.to_s` returning `""` is not obviously the result of `NilClass` defining `to_s`. The framework default assumes the language doesn't fight the learner; Ruby does, and the prose budget needs to reflect that.

**Interactivity menu.**

- **IN:** `read`, `exercise`, `challenge`, `predict`, `read+inline`.
- **OUT (deliberate exclusion):** `trace`. Ruby's runtime has no equivalent of "step through the DOM event flow" (JS DOM trace) or "watch the query plan walk" (SQL trace) that would justify the per-step authoring cost. The mental model is already in the code, not the runtime — tracing would be decoration, not pedagogy. Defer until v2 only if signal forces it (per [`INTERACTIVITY-PATTERNS.md`](../INTERACTIVITY-PATTERNS.md) §Anti-patterns "One-off step types").

**Pedagogical bets.**

1. **Prediction-before-explanation on Ruby surprises.** Use `predict` steps for the "guess what this returns" moments that define Ruby's surprise surface — `nil.class`, `[1,2,3].max`, `:foo == "foo"`, `Proc.new { return 1 }` evaluated outside its enclosing method, `5.class.ancestors`, `"hello".frozen?`. Each `predict` step's wrong-answer feedback addresses the **specific** wrong mental model the option encodes (per [`INTERACTIVITY-PATTERNS.md`](../INTERACTIVITY-PATTERNS.md) §predict voice contract). *First lesson to use this:* Lesson 1 of the Ruby scroll. *Failure mode without it:* learners memorise idioms as trivia instead of building a model of the object system.
2. **Retrieval interleaving within the scroll.** Identifiers introduced in Lesson 1 (`type_of`, `describe`) reappear in Lesson 2's literals work and again in Lesson 5's blocks teaser. testCode references prior identifiers by name — the learner must remember the signature. *First lesson to use this:* Lesson 2 of the Ruby scroll. *Failure mode without it:* each lesson feels like a hermetic universe; the learner never builds the layered intuition that blocks are the substrate of everything.
3. **Footgun awareness, not footgun fear.** When the crash scroll names `method_missing`, eigenclasses, `class_eval` — and it must, because the polyglot will encounter them in real codebases — every mention ends with the specific failure mode the technique introduces, plus a pointer to the future deep-dive that earns the depth. *First lesson to use this:* Lesson 5 (blocks-and-beyond teaser). *Failure mode without it:* learners write `method_missing` everywhere because the scroll taught the syntax but not the cost.
4. **Sandbox-honesty markers.** When Piston's constraints force a teaching compromise (no `async` gem, no Rails, no `pry`, no real Fiber.scheduler, Ruby 3.0.1 vs current 3.3), the `read` step's body acknowledges this explicitly — not in a footnote — and tells the learner what the next step (in their career, not in the scroll) is. *First lesson to use this:* Lesson 5's blocks teaser flags the deferred deep-dive. *Failure mode without it:* learners assume the gap is the language's, not the sandbox's, and walk away with a distorted picture of what production Ruby looks like.

**Maintainer experts.** S10 Rhea Kapoor (language), S5 Elif Yıldız (curriculum), S2 Valentina Cruz (content quality), S11 Maya Lindqvist (interactive steps — predict + read+inline reviews). S12 Felix Park only if a lesson proposes a new animation runtime; default expectation is no new runtime (the Ruby scroll ships with CSS-only motion).

## 3. Scroll Catalog

| Slug | Kind | Steps (target) | Time (target) | Status |
|---|---|---|---|---|
| `ruby` | Language scroll (crash course) | 14-18 | ~90 min | **active** — Lesson 1 spec-complete, Lessons 2-5 stubbed |

That is the whole catalog for Ruby in v1. Per [ADR 022](../../adr/022-crash-course-pivot.md), one language scroll per language is the anchored set. Deep-dive scrolls on Ruby-specific topics are deferred — see §3.1.

### 3.1 Future deep-dive candidates (not in scope for v1)

When deep-dive scrolls become a real shape (after the five language scrolls ship), Ruby has at least these candidates. Listed here so the crash scroll knows what it can defer without losing the topic:

- **`ruby-blocks-procs-lambdas`** — full treatment of blocks beyond the crash scroll's teaser: `yield` mechanics, `&block` parameter, Proc vs lambda arity and `return` semantics, closures, `Proc#curry`, the "block-as-API-shape" pattern (`File.open(path) { |f| ... }`).
- **`ruby-metaprogramming`** — `define_method` before `method_missing`, `class_eval` vs `instance_eval`, eigenclasses, `respond_to_missing?` discipline, building a small DSL. Framed as "how Rails magic works, taught without Rails."
- **`ruby-oop-idioms`** — Sandi-Metz-flavoured: `attr_*` as deliberate boundary decisions, modules as namespace vs mixin, `Comparable` and `Enumerable` by mixin, composition via `Forwardable`.
- **`ruby-enumerable-mastery`** — `map` / `select` / `inject` / `group_by` / `chunk_while` / `each_cons` / `lazy`. Pattern recognition across many small problems.
- **`ruby-pattern-matching`** — `case/in`, `deconstruct` / `deconstruct_keys`, the one-line `=>` and `in` operators.
- **`ruby-concurrency-fibers-ractors`** — `Fiber`, `Fiber.scheduler` (conceptual), `Ractor` (shape only). Carries the largest Piston-vs-reality gap; ship last if at all.
- **`ruby-testing-minitest`** — Minitest at depth: test/unit vs spec style, the assertion variety, `Minitest::Mock`. Currently the crash scroll uses a manual harness specifically to avoid teaching Minitest before the learner needs it.

None of these are committed. They are listed so the crash scroll's lesson authors know what surface they can name-and-defer without inventing it on the spot.

## 4. The Ruby Scroll

**Slug:** `ruby`
**Kind:** Language scroll (crash course)
**Audience:** Developer who already programs in at least one other language. No Ruby experience required.
**Learner time:** ~90 minutes real work (60-120 range).
**Spec file:** [`ruby/ruby.md`](ruby/ruby.md) — the executable authoring brief (see [`../authoring-spec-template.md`](../authoring-spec-template.md)).

**Learning outcomes.** After this scroll, the learner can:

- Predict the result of common Ruby expressions that surprise a polyglot (`nil.class`, `0` as truthy, `:foo == "foo"`, `[].max`) and explain why.
- Read and write idiomatic Ruby across the core literals — integers, floats, strings, arrays, hashes, symbols — including the idioms that distinguish Ruby from the polyglot's prior language (string interpolation, `Hash#fetch` with a default block, symbol keys, `Array#tally`).
- Use Ruby's control flow with confidence in the surprises that bite: only `false` and `nil` are falsy, `case/when` uses `===`, `unless`/`until` are first-class.
- Define methods with positional, default, keyword, and splat arguments, and recognise implicit return.
- Pass a block to a method, accept one with `yield`, and recognise the `&:symbol` shorthand. Read a method that uses `Symbol#to_proc`. (Depth on Proc vs lambda is deferred to the blocks deep-dive.)
- Name the Ruby-specific footguns the polyglot will eventually hit (`method_missing`, eigenclasses, monkey-patching) and know where to find the depth when they need it.

**Lessons.**

- **Lesson 1 — First contact with the object model.** Everything is an object. Operators are method calls. `nil` has a class. Introspection is first-class.
- **Lesson 2 — Literals you'll use daily.** Strings (single vs double quotes, interpolation), numbers (integer division gotcha), arrays, hashes (symbol keys, `fetch` vs `[]`), symbols (identity, `&:method`).
- **Lesson 3 — Control flow and truthiness.** Only `false` and `nil` are falsy. `case/when` with `===`. `unless`, `until`, and when they read clearer than `if`/`while`.
- **Lesson 4 — Methods.** `def`, positional + default + keyword + splat arguments, implicit return.
- **Lesson 5 — Blocks: the central idea (teaser).** `each` with a block, `yield`, `&:method`, the "block-as-API-shape" pattern via `File.open(path) { |f| ... }`. Flags `Proc` / `lambda` / closures as deep-dive territory.

The full step-by-step authoring (prose, starter code, tests, hints, solutions, predict options + feedback) lives in [`ruby/ruby.md`](ruby/ruby.md). The lesson titles here are the index summary, not the spec.

**Sandbox notes.** Piston Ruby 3.0.1. Stdlib only. Manual test harness (not Minitest — Minitest is deferred to its own deep-dive scroll). Deterministic only — no `Time.now`, no `rand` without seeding, no `sleep`. STDIN is not exercised; inputs come as method arguments.

**Reference material for this scroll specifically.**

- *The Well-Grounded Rubyist*, 3rd ed. — Chapters 2-4 (objects, methods, modules). The spine.
- *Eloquent Ruby* (Russ Olsen) — Chapter on blocks is the closest external match to Lesson 5's framing.
- *Programming Ruby 3.2* — Pickaxe. Reference for stdlib method signatures used across the lessons.
- Ruby docs — <https://docs.ruby-lang.org/en/3.3/Integer.html>, `NilClass`, `String`, `Array`, `Hash`, `Symbol`.
- Ruby Koans — borrow the assertion-as-question voice for Lesson 1 exercises. Adapt, do not copy.

## 5. Cross-lesson exercise patterns

Across the Ruby scroll's lessons, exercises lean on a small set of repeatable shapes that are well-suited to Piston's stateless, stdlib-only sandbox:

- **Pure methods.** Input → output, no side effects. Easiest to test deterministically. Default for Lessons 1-4.
- **`Enumerable` calls under the hood.** Even before the blocks teaser, Lesson 2's hash/array exercises lean on `count`, `tally`, `each_pair` — exposing the polyglot to "every collection is `Enumerable`" without naming it formally.
- **Predict-then-implement pairs.** A `predict` step's snippet often becomes the starter code of the next exercise. The learner forms a hypothesis, sees the answer, then writes code that depends on the model. Core to Lessons 1, 3, and 5.
- **Surprise-named-explicitly.** Where Ruby diverges from Python/JS/Java reflexes (truthiness, `===`, symbol vs string), the read step names the polyglot reflex and corrects it before the exercise.

**Piston constraint reminder:** stdlib only. **No Rails, no `async` gem, no Sidekiq, no `pry`, no `byebug`.** No external HTTP, no filesystem assumptions beyond `/tmp`. Every exercise must be reproducible from a single Ruby file. Test harness is the manual `_t` / `_eq` pattern documented in [`ruby/ruby.md`](ruby/ruby.md) §5; Minitest is not introduced in the crash scroll.

## 6. Known pedagogical pitfalls

Pitfalls the Ruby scroll specifically defends against:

- **Teaching `attr_accessor` as a syntax fact** without the invariant-encapsulation cost. POODR exists because of this exact pitfall. *The crash scroll deliberately defers `attr_*` to the deep-dive on OOP idioms — Lesson 4 (Methods) does not introduce it. Mentioning `attr_accessor` without the depth would be worse than skipping it.*
- **Teaching `method_missing` before `define_method`.** `method_missing` is often the wrong tool. *The crash scroll does not teach either — both are named-and-deferred in Lesson 5 with a pointer to the metaprogramming deep-dive.*
- **Teaching `each` without `map` / `inject`.** Loops with mutation are the C-and-Java hangover. *Lesson 2 introduces `map` and `select` alongside `each`, not after; Lesson 5's blocks teaser uses `each { |x| ... }` to motivate `yield`.*
- **Conflating Ruby with Rails.** `scope`, `belongs_to`, `validates`, `before_action`, `params` are Rails. Calling them "Ruby" is the single biggest disservice this track exists to undo. *Lesson 1's read step opens with "Rails is not Ruby" and the scroll's `Description` reinforces it.*
- **Symbols as trivia.** *Lesson 2 introduces symbols with motivation (immutability, hash keys, `&:method`) — never as a one-slide curiosity.*
- **Metaprogramming as spectacle.** *The crash scroll does not teach metaprogramming. Lesson 5 names it as a deferred topic. Spectacle was the dead end of the old long-curriculum format; the crash shape avoids it entirely.*
- **Blocks treated as syntax sugar over `each`.** *Lesson 5 frames blocks as the language's central idea, not as `each`'s syntax. Even in the crash scroll's short treatment, blocks get their own lesson.*

## 7. External references

### Books

- *The Well-Grounded Rubyist*, 3rd ed. — David A. Black & Joseph Leo III. The single best modern Ruby intro that respects the reader.
- *Eloquent Ruby* — Russ Olsen. Idioms, taste, and what "Ruby-ish" means.
- *Programming Ruby 3.2* / "The Pickaxe" — Dave Thomas, Andy Hunt, Chad Fowler et al. Reference, not a tutorial.
- *Practical Object-Oriented Design in Ruby* (POODR) — Sandi Metz. Required reading for the (future) OOP deep-dive.
- *99 Bottles of OOP* — Sandi Metz & Katrina Owen. Refactoring discipline.
- *Confident Ruby* — Avdi Grimm. Boundary construction, narrative-style methods.
- *Metaprogramming Ruby 2* — Paolo Perrotta. Required reading for the (future) metaprogramming deep-dive.
- *The Ruby Way*, 3rd ed. — Hal Fulton & André Arko. Recipe-style reference.
- *Polished Ruby Programming* — Jeremy Evans. Modern (Ruby 3.x) idioms and concurrency.

### Online platforms

- **Exercism Ruby track** — maintained originally by Katrina Owen. Hundreds of small exercises with mentor feedback. The exercise-design quality is the gold standard we should aim for. <https://exercism.org/tracks/ruby>
- **Ruby Koans** (EdgeCase, originally Jim Weirich) — fill-in-the-blank assertions across the language. The pedagogical pattern (assertion that fails until you make it pass) is directly applicable to the crash scroll's predict-then-implement pairs. <https://github.com/edgecase/ruby_koans>
- **RubyTapas** (Avdi Grimm). Short-form video archive (paid, some free). The episode structure (one idea, ~5 minutes, one example) is a model for how a Dojo step prompt should feel.
- **Sandi Metz workshops** — referenced for the eventual OOP deep-dive, not for the crash scroll.
- **Go Rails** (Chris Oliver). Flagged: Rails-focused. Useful for learners after this scroll, not during it.

### Official documentation

- <https://docs.ruby-lang.org/en/3.3/> — class-by-class reference.
- <https://www.ruby-lang.org/en/documentation/> — language overview.
- <https://stdgems.org/> — what is "default" vs. "bundled" in Ruby's stdlib (relevant for Piston-availability sanity checks).

### Community learning resources

- *Ruby Weekly* (Peter Cooper) — newsletter, good for tracking what working Rubyists actually use.
- The official Ruby blog and release notes — pattern matching, Ractors, Fiber.scheduler are all best understood from the release-note rationale.
- RubyConf and RubyKaigi talk archives on YouTube — Sandi Metz, Aaron Patterson, Koichi Sasada, Avdi Grimm, Yukihiro Matsumoto.

## 8. Implementation order

There is one Ruby scroll to ship. Order applies to the lessons within it:

1. **Lesson 1 — Object model.** Establishes voice, scroll-level exercise shape, the `predict` step pattern, and the Piston Ruby harness conventions. **Status: spec-complete; 3 of 4 steps seeded in DB (1.1 read, 1.3 type_of, 1.4 describe). 1.2 `predict` deferred until step type ships.**
2. **Lesson 2 — Literals.** Strings, numbers, arrays, hashes, symbols. Status: stub.
3. **Lesson 3 — Control flow and truthiness.** Status: stub.
4. **Lesson 4 — Methods.** Status: stub.
5. **Lesson 5 — Blocks teaser.** Status: stub.

After the Ruby scroll ships end-to-end, deep-dive scrolls become candidates for prioritisation. The order suggested in §3.1 is not committed — that's a separate decision per future sprint.
