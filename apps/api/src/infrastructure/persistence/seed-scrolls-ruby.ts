// =============================================================================
// Ruby — scroll seed. The dojo's Ruby crash course for polyglot developers.
//
// Direction: ADR 022 (crash-course pivot). Slug `ruby` (was `ruby-fundamentals`
// pre-pivot — the old slug is removed from DB by the cleanup script that runs
// alongside this seed).
//
// Lesson 1: First contact with the object model. Seeded scope — 4 steps:
// 1.1 `read` "Everything is an object"
// 1.2 `predict` "What does nil.class return?" (CSS state machine renderer)
// 1.3 `kata`    `type_of(value)`
// 1.4 `kata`    `describe(obj)`
//
// The predict step shipped in Sprint 025 alongside the ADR 022 pivot:
// schema migration 0022_typical_slipstream.sql added the `data` jsonb column,
// and ScrollPlayerPage now dispatches `predict` to the PredictStep CSS state
// machine. Rive will swap in here when an authored .riv state machine lands
// (deferred to Capa D of the ADR 022 work).
//
// Lessons 2-5 are stubbed in the spec, not in this seed yet. They land per the
// implementation order in docs/courses/curricula/ruby.md §8.
//
// Status: draft. isPublic: false. Ruby execution requires auth — the
// /scrolls/execute endpoint (apps/api/src/infrastructure/http/routes/scrolls.ts)
// only allows anonymous calls for sql/typescript/python/javascript-dom.
// The POC eval pass briefly flipped both to anonymous for ease of review;
// restored to authed-only at Sprint 025 close per Marta's security stance.
//
// Test harness: manual (mirrors the Python pattern — _t + _eq helpers, JSON
// emitted on a __DOJO_RESULT__ line that ExecuteStep parses). Minitest is
// deferred to its own future deep-dive scroll — the crash scroll shouldn't
// introduce a test harness as content.
// =============================================================================

import { createHash } from 'node:crypto'

function seedUuid(name: string): string {
  const hash = createHash('sha256').update(`dojo-scroll-${name}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-')
}

const COURSE_ID = seedUuid('ruby')
const LESSON_1_ID = seedUuid('ruby-l1-object-model')

const STEP_1_1_ID = seedUuid('ruby-s1-1-everything-is-object')
const STEP_1_2_ID = seedUuid('ruby-s1-2-predict-nil-class')
const STEP_1_3_ID = seedUuid('ruby-s1-3-type-of')
const STEP_1_4_ID = seedUuid('ruby-s1-4-describe')

const RB_HARNESS_HEADER = `# ── dojo harness ──────────────────────────────────
$tests = []

def _t(name)
  begin
    yield
    $tests << { 'name' => name, 'passed' => true }
  rescue => e
    $tests << { 'name' => name, 'passed' => false, 'message' => e.message }
  end
end

def _eq(actual, expected)
  raise "expected #{expected.inspect} but got #{actual.inspect}" unless actual == expected
end
# ──────────────────────────────────────────────────
`

const RB_HARNESS_FOOTER = `
# ── dojo harness footer ───────────────────────────
require 'json'
$tests.each do |t|
  if t['passed']
    puts "\\u2713 #{t['name']}"
  else
    puts "\\u2717 #{t['name']}: #{t['message']}"
  end
end
ok = $tests.all? { |t| t['passed'] }
puts "__DOJO_RESULT__ " + JSON.generate({ 'ok' => ok, 'tests' => $tests })
`

export const RUBY_COURSE_DATA = {
  id: COURSE_ID,
  slug: 'ruby',
  title: 'Ruby',
  description:
    'The dojo\'s Ruby crash course. For developers who already program in another language and need confidence in Ruby by Friday. Object model + the idioms a polyglot needs + the surprises that bite, in ~90 minutes. Rails is not Ruby; this scroll teaches the language, not the framework.',
  language: 'ruby',
  accentColor: '#CC342D',
  status: 'draft' as const,
  isPublic: false,
  externalReferences: [
    {
      title: 'The Well-Grounded Rubyist, 3rd ed. (Black & Leo)',
      url: 'https://www.manning.com/books/the-well-grounded-rubyist-third-edition',
      kind: 'book' as const,
    },
    {
      title: 'Ruby 3.3 documentation',
      url: 'https://docs.ruby-lang.org/en/3.3/',
      kind: 'docs' as const,
    },
    {
      title: 'Eloquent Ruby (Russ Olsen)',
      url: 'https://www.informit.com/store/eloquent-ruby-9780321584106',
      kind: 'book' as const,
    },
  ],
}


const STEP_1_1 = {
  id: STEP_1_1_ID,
  lessonId: LESSON_1_ID,
  order: 1,
  type: 'read' as const,
  title: 'Everything is an object',
  instruction: `## Why this matters

Ruby's surprises start here. \`5.times { puts "hi" }\`, \`nil.to_s\`, \`1 + 2\` — all three are method calls on objects, not language keywords. Once you see this, half the language stops being weird.

## Everything has a class

In Ruby, every value is an object — including the values that other languages treat as primitives. Integers are objects. Strings are objects. \`nil\` is an object. \`true\` and \`false\` are objects. There is no "primitive type" exception.

You can ask any value what class it belongs to with \`.class\`:

\`\`\`ruby
5.class       # => Integer
"hi".class    # => String
nil.class     # => NilClass
true.class    # => TrueClass
\`\`\`

And because they're objects, they respond to messages:

\`\`\`ruby
nil.to_s            # => ""
nil.inspect         # => "nil"
5.respond_to?(:+)   # => true
\`\`\`

## Operators are methods in disguise

Ruby parses \`1 + 2\` and rewrites it as \`1.+(2)\` — a method call on the integer \`1\` with \`2\` as the argument. The \`+\` is just syntactic sugar. You can confirm this directly:

\`\`\`ruby
1.+(2)          # => 3
1.send(:+, 2)   # => 3
\`\`\`

This is the property that makes Ruby small. There are very few "special" things in the language — most of what looks like syntax is actually a method somewhere you can find and read. \`5.times { ... }\` is a method on \`Integer\`. \`[1, 2, 3].each\` is a method on \`Array\`. \`"hi".upcase\` is a method on \`String\`. The language isn't telling you what to do; you are sending messages to objects.

## Introspection is first-class

One immediate consequence: every object can tell you about itself. Every object knows its class (\`.class\`), every class knows its ancestors (\`.ancestors\`), every object can be asked which messages it responds to (\`.respond_to?\`). When you're stuck — and at the start, you will be — interrogate the value in front of you to learn what it can do. This is faster than guessing.

\`\`\`ruby
nil.class.ancestors
# => [NilClass, Object, Kernel, BasicObject]
\`\`\`

In the next two steps you'll write code that leans on this — getting back the class name of a value, and combining the class with the value's \`inspect\` form to describe any object.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_1_2 = {
  id: STEP_1_2_ID,
  lessonId: LESSON_1_ID,
  order: 2,
  type: 'predict' as const,
  title: 'What does nil.class return?',
  instruction: `Before you write any code, predict one thing. The answer is more interesting than it looks — and once you see it, half of Ruby's "weird" surface stops being weird.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    snippet: 'nil.class',
    options: [
      { id: 'a', text: '`nil`' },
      { id: 'b', text: '`NilClass`' },
      { id: 'c', text: 'Raises `NoMethodError`' },
      { id: 'd', text: '`Object`' },
    ],
    correct: 'b',
    feedback: {
      a: "You treated `nil` as a sentinel with no methods — common reflex from languages where `null` isn't an object. In Ruby, `nil` is the single instance of `NilClass`, and like every object it knows which class it belongs to. `nil.class` returns the class itself (`NilClass`), not the value (`nil`).",
      b: "Correct. `nil` is the single instance of `NilClass`. Because it's an object, it responds to the same introspection messages every other object responds to — `class`, `inspect`, `respond_to?`, `is_a?`. You'll lean on this in the next two exercises.",
      c: "You expected `nil` to be a non-receiver — common reflex from JavaScript or Java, where `null.method()` raises. In Ruby, `nil` is an actual object, so `nil.class` is a perfectly valid message send. The class it returns is `NilClass`.",
      d: "Close to the right intuition — `nil`'s ancestor chain does include `Object` — but `.class` returns the most specific class, not an ancestor. `Object` is two steps up the chain (`NilClass → Object → Kernel → BasicObject`). Try `nil.class.ancestors` to see the chain.",
    },
  },
}

const STEP_1_3 = {
  id: STEP_1_3_ID,
  lessonId: LESSON_1_ID,
  order: 3,
  type: 'kata' as const,
  title: "Return the name of an object's class",
  instruction: `## Why this matters

The simplest possible use of "everything is an object": ask any value what class it belongs to. Useful for debugging, type-aware logging, and the first introspection muscle to build.

## Your task

Write a method \`type_of(value)\` that returns the **name** of \`value\`'s class as a string.

Examples:

\`\`\`ruby
type_of(5)         # => "Integer"
type_of("hello")   # => "String"
type_of(nil)       # => "NilClass"
type_of([1, 2])    # => "Array"
type_of({ a: 1 })  # => "Hash"
type_of(true)      # => "TrueClass"
\`\`\`

You should not handle any exceptions — there is nothing to handle. Every value in Ruby has a class.`,
  starterCode: `def type_of(value)
  # Your code here
end
`,
  testCode: `${RB_HARNESS_HEADER}
_t('returns Integer for a number') { _eq type_of(5), 'Integer' }
_t('returns String for a string') { _eq type_of('hello'), 'String' }
_t('returns NilClass for nil') { _eq type_of(nil), 'NilClass' }
_t('returns Array for an array') { _eq type_of([1, 2, 3]), 'Array' }
_t('returns Hash for a hash') { _eq type_of({ a: 1 }), 'Hash' }
_t('returns TrueClass for true') { _eq type_of(true), 'TrueClass' }
${RB_HARNESS_FOOTER}`,
  hint: 'Every object responds to `.class`. Every class object responds to `.name`. Compose them: `.class` first to get the class object, then `.name` on that to get the string.',
  solution: `def type_of(value)
  value.class.name
end`,
  alternativeApproach: `If you only need the string for logging or display, \`value.class.to_s\` produces the same result as \`.name\` for ordinary classes — \`Integer.to_s\` is \`"Integer"\`. The difference shows up for anonymous classes (\`Class.new.name\` is \`nil\`; \`Class.new.to_s\` is something like \`"#<Class:0x000...>"\`). \`.name\` is the right call when you want the canonical name and are willing to get \`nil\` for unnamed classes; \`.to_s\` is the right call when you want a string no matter what.`,
}

const STEP_1_4 = {
  id: STEP_1_4_ID,
  lessonId: LESSON_1_ID,
  order: 4,
  type: 'kata' as const,
  title: 'Implement describe(obj)',
  instruction: `## Why this matters

Combining the class with the value into a single debug-readable string is the shape of a thousand log lines you'll write. Doing it idiomatically the first time means \`inspect\` (debug-readable) instead of \`to_s\` (display).

## Your task

Write a method \`describe(obj)\` that returns a string of the form \`"<ClassName>: <inspect-of-obj>"\`. Use \`obj.class.name\` for the class portion and \`obj.inspect\` for the value portion — \`inspect\`, not \`to_s\`. \`inspect\` returns a debug-readable form: strings get quotes, arrays get brackets, \`nil\` becomes the literal text \`"nil"\`.

## Examples

\`\`\`ruby
describe("hi")        # => 'String: "hi"'
describe(42)          # => "Integer: 42"
describe([1, 2, 3])   # => "Array: [1, 2, 3]"
describe({ a: 1 })    # => "Hash: {:a=>1}"
describe(nil)         # => "NilClass: nil"
\`\`\`

Notice the first example carefully: the expected string contains literal quotes around \`hi\` because \`"hi".inspect\` is the four-character string \`"hi"\` (with embedded quotes), not the two-character \`hi\`.`,
  starterCode: `def describe(obj)
  # Your code here
end
`,
  testCode: `${RB_HARNESS_HEADER}
_t('describes a string') { _eq describe('hi'), 'String: "hi"' }
_t('describes an integer') { _eq describe(42), 'Integer: 42' }
_t('describes an array') { _eq describe([1, 2, 3]), 'Array: [1, 2, 3]' }
_t('describes a hash') { _eq describe({ a: 1 }), 'Hash: {:a=>1}' }
_t('describes nil') { _eq describe(nil), 'NilClass: nil' }
${RB_HARNESS_FOOTER}`,
  hint: 'String interpolation with `#{...}` is the cleanest way to join the two pieces. The embedded quotes in `\'String: "hi"\'` come from `inspect`, not from your code — you don\'t need to add them yourself.',
  solution: `def describe(obj)
  "#{obj.class.name}: #{obj.inspect}"
end`,
  alternativeApproach: `If you find yourself reaching for string concatenation (\`obj.class.name + ": " + obj.inspect\`), interpolation is almost always cleaner in Ruby — fewer quotes, fewer plus signs, and it works uniformly when the value is anything but a string. For format-heavy strings you'll also see \`format("%s: %s", obj.class.name, obj.inspect)\` (or its alias \`sprintf\`), which is what you'd reach for if the format string came from outside the code — e.g. user-supplied or i18n-loaded. For two interpolations into a string literal, interpolation wins.`,
}

// =============================================================================
// Lesson 0 — Ruby in context (orientation)
// =============================================================================

const LESSON_0_ID = seedUuid('ruby-l0-context')

const STEP_0_1_ID = seedUuid('ruby-s0-1-what-ruby-is-for')
const STEP_0_2_ID = seedUuid('ruby-s0-2-how-ruby-runs')
const STEP_0_3_ID = seedUuid('ruby-s0-3-predict-first-command')

const LESSON_0 = {
  id: LESSON_0_ID,
  scrollId: COURSE_ID,
  order: 1,
  title: 'Ruby in context',
}

const STEP_0_1 = {
  id: STEP_0_1_ID,
  lessonId: LESSON_0_ID,
  order: 1,
  type: 'read' as const,
  title: "What Ruby is for (and what it isn't)",
  instruction: `## Why this matters

Before you spend 100 minutes on syntax, you need to know whether Ruby is worth your Friday. This step locates Ruby on your internal map: where it shines, where it doesn't, who maintains it, what version family to learn. The kind of orientation you'd normally cobble together from five browser tabs and a Hacker News thread.

## Where Ruby shines

Ruby's biggest economic footprint is still **Rails web apps** — Shopify, GitHub, Basecamp, Airbnb's earliest stack. If you're going to write Ruby for money, odds are you'll write it inside Rails.

But Ruby outside Rails is more present than the polyglot usually realises:

- **CLI tools.** Homebrew (the macOS package manager) is Ruby. So is Jekyll (the static site generator behind a chunk of GitHub Pages), Vagrant, and Fastlane.
- **DSLs and configuration.** Rakefile, Gemfile, Capistrano deploy scripts, Chef recipes. Ruby's syntax bends gracefully into domain-specific languages — that's not an accident, it's the language's biggest strength.
- **Short automation scripts.** When a Python script would need a \`requirements.txt\` and a venv to do anything interesting, a Ruby script reads more naturally inline and runs from any system with \`ruby\` on PATH.
- **Prototypes** where expressiveness beats raw performance.

## Where Ruby doesn't shine

Honest list, no apologies:

- **CPU-bound workloads.** ML training, heavy numerical simulation, video processing — use Python (with C extensions), Julia, or Rust. Ruby's interpreter and GC prioritised expressiveness over throughput.
- **Embedded systems.** No mRuby-quality story for most cases. Reach for C or Rust.
- **Sub-millisecond latency systems.** High-frequency trading, real-time bidding. Go or Rust win.
- **Mobile native.** Swift / Kotlin own that surface. Ruby is for the backend the mobile app talks to, not for the app itself.

## Who maintains it

Yukihiro Matsumoto (**Matz**) is the language's creator and still its BDFL — every release ships with his sign-off. The Ruby core team is a small group of long-tenure contributors who run on monthly meetings and a public bug tracker.

The biggest industrial sponsor is **Shopify**. They funded YJIT (the just-in-time compiler that made Ruby 3.2+ measurably faster), they push pattern matching forward, and several core committers work there. Ruby's community is less hyped than Rust's or Go's in 2026 — that's a sign of maturity, not decline. Conferences (RubyConf, RubyKaigi, EuRuKo) still sell out.

## What version to learn

**Ruby 3.x is the target.** Specifically:

- **3.0 (Dec 2020)** separated keyword arguments from hashes (a real-world breaking change you'll see commit messages mention), shipped Ractors, introduced pattern matching.
- **3.2** shipped YJIT as production-stable.
- **3.3 (Dec 2023)** improved YJIT further and refined pattern matching.

**Avoid material written for Ruby 2.7 or earlier.** Kwargs syntax was different, performance baselines were different, and a meaningful chunk of intermediate idioms changed shape.

## Sandbox honesty

This crash course runs **Ruby 3.0.1** in the sandbox — the minimum that supports everything you'll touch here (kwargs, \`Array#tally\`, basic pattern matching, \`Hash#transform_keys\`). On your own machine you want **3.3+**, installed via \`rbenv\` or \`asdf\` (most projects pin a version in a \`.ruby-version\` file).

Up next: how a Ruby project actually gets run. The first time you type \`bundle exec\` you'll know why.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_0_2 = {
  id: STEP_0_2_ID,
  lessonId: LESSON_0_ID,
  order: 2,
  type: 'read' as const,
  title: 'How Ruby actually runs (in real projects)',
  instruction: `## Why this matters

A cloned Ruby project has a \`Gemfile\` and a \`Gemfile.lock\`. You recognise the pattern (\`package.json\`, \`requirements.txt\`, \`go.mod\`) but the commands and the conventions differ enough to lose you two hours on Stack Overflow if you start guessing.

## The commands you need

**\`ruby file.rb\`** — runs a single script. Same shape as \`python file.py\` or \`node file.js\`. Useful for one-off scripts; rarely how you run real projects.

**\`irb\`** — the standard library REPL (Interactive RuBy). Open it from any terminal where Ruby is installed. Use it to test expressions, refresh syntax memory, poke at stdlib. Equivalent to Python's \`python\` REPL or Node's \`node\` REPL.

**\`pry\`** — a better REPL than \`irb\` (autocomplete, syntax highlighting, source navigation). It's a gem, not stdlib — you install it with \`gem install pry\` or add it to a project's Gemfile under the \`:development\` group. Many Ruby developers replace \`irb\` with \`pry\` once and forget about it.

## Bundler — the package manager you'll meet first

A Ruby project's dependencies live in two files:

- **\`Gemfile\`** declares what the project needs, often with version ranges (\`gem "rails", "~> 7.1"\`).
- **\`Gemfile.lock\`** pins the exact versions Bundler resolved. Commit both. The lock is the analogue of \`package-lock.json\` / \`poetry.lock\` / \`Cargo.lock\`.

**\`bundle install\`** reads the Gemfile, resolves the dependency graph, downloads the gems into the project's vendor directory (or your \`~/.gem\`, depending on config), and writes / respects the \`Gemfile.lock\`. Run this first after cloning.

**\`bundle exec <command>\`** runs \`<command>\` using *only* the gems Bundler resolved for this project. If your machine has multiple versions of \`rspec\` installed globally, \`rspec\` invokes whichever one your shell finds; \`bundle exec rspec\` invokes the exact version your \`Gemfile.lock\` pinned. **In any modern Ruby project, prefix is the default:** \`bundle exec rspec\`, \`bundle exec rake db:migrate\`, \`bundle exec rubocop\`.

**Different from Python's venv:** Bundler doesn't "activate" a shell environment the way \`venv\` does. Each command stays isolated through the \`bundle exec\` prefix. Same per-project isolation as venv, but the mental model is per-command instead of per-shell-session.

## Version managers

A \`.ruby-version\` file (one line, just the version string like \`3.3.5\`) pins which Ruby version the project expects. Tools like \`rbenv\` and \`asdf\` read it and auto-switch when you \`cd\` into the directory. Without a manager, \`ruby -v\` tells you what you're actually running — often a surprise on machines with system Ruby.

## Sandbox honesty

You don't need to install anything for this scroll — every kata runs in the sandbox, no Bundler in sight. But the katas reflect the real convention: solutions are pure methods you'd run as \`ruby file.rb\` without external gems. When you leave this scroll, \`bundle exec\` is the prefix.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_0_3 = {
  id: STEP_0_3_ID,
  lessonId: LESSON_0_ID,
  order: 3,
  type: 'predict' as const,
  title: 'Predict: what do you run first?',
  instruction: `Before the next lesson, one check on the Bundler model.

You just cloned a Ruby project from GitHub. The README says "use Ruby 3.3". You want to run the app. Which command do you run first?`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    snippet: `$ git clone https://github.com/example/ruby-app.git
$ cd ruby-app
$ ls
Gemfile  Gemfile.lock  README.md  bin/  config/  lib/
$ ???`,
    options: [
      { id: 'a', text: '`ruby bin/app.rb`' },
      { id: 'b', text: '`bundle install`' },
      { id: 'c', text: '`irb`' },
      { id: 'd', text: '`gem install`' },
    ],
    correct: 'b',
    feedback: {
      a: "The \"just run it\" reflex works in languages with a generous stdlib and small projects. In Ruby, almost any real project depends on gems declared in the Gemfile — running before installing dependencies throws `LoadError` on the first `require`. After `bundle install`, you can run anything — ideally with `bundle exec ruby bin/app.rb` so the version of Ruby and the gems both match what the project expects.",
      b: "Correct. Any cloned Ruby project has a Gemfile (and usually a `.ruby-version` file too). `bundle install` reads the Gemfile, resolves the dependency graph, downloads the gems into the project, and respects (or generates) the `Gemfile.lock`. Without it, the first `require` of an external dependency fails.\n\nNext up: you start writing Ruby. Blocks come first — they're in every Ruby file you'll read.",
      c: "`irb` opens a REPL isolated from the project. It's useful for trying language expressions (`5.times { |i| puts i }`) but doesn't load the project's Gemfile or its code. For a REPL with the project loaded, most projects ship a `bin/console` (Rails) or you'd use `pry -r ./lib/whatever.rb`.",
      d: "`gem install <name>` installs a single gem globally — useful for standalone tools like `rubocop` or `pry`, but it bypasses Bundler's per-project reproducibility. In a cloned project, the idiomatic move is to let Bundler manage the gems declared in the Gemfile, not to install them globally.",
    },
  },
}
// =============================================================================
// Lesson 2 — Literals that surprise
// =============================================================================

const LESSON_2_ID = seedUuid('ruby-l2-literals')

const STEP_2_1_ID = seedUuid('ruby-s2-1-literal-surprises')
const STEP_2_2_ID = seedUuid('ruby-s2-2-lookup')
const STEP_2_3_ID = seedUuid('ruby-s2-3-summarize')
const STEP_2_4_ID = seedUuid('ruby-s2-4-tally-words')

const LESSON_2 = {
  id: LESSON_2_ID,
  scrollId: COURSE_ID,
  order: 3,
  title: 'Literals that surprise',
}

const STEP_2_1 = {
  id: STEP_2_1_ID,
  lessonId: LESSON_2_ID,
  order: 1,
  type: 'read' as const,
  title: 'Four literal surprises in Ruby',
  instruction: `## Why this matters

You already know what a string is. You already know what a hash (dict, map, object) is. This step skips the obvious and goes straight to the four literal-level idioms in Ruby that don't translate from JS / Python / Go / Java without losing something.

## 1. Single vs double quotes are different — pick deliberately

\`'hello'\` and \`"hello"\` produce the same string, but they're not the same syntax.

- **Single-quoted** strings are nearly literal. The only escapes processed are \`\\\\\` and \`\\'\`. No interpolation, no \`\\n\`, no \`\\t\`.
- **Double-quoted** strings process the full escape table (\`\\n\`, \`\\t\`, \`\\0\`, etc.) and support **\`#{expression}\` interpolation**: the expression is evaluated and its \`to_s\` value is spliced in.

\`\`\`ruby
name = "Ada"
"hello, #{name}"           # => "hello, Ada"
'hello, #{name}'           # => "hello, \\#{name}"   (no interpolation)
"line\\nbreak"              # => two-line string
'line\\nbreak'              # => literal backslash-n, no break
\`\`\`

Idiomatic convention: reach for \`'...'\` when the string is purely literal data; \`"..."\` whenever you interpolate or want escape processing. Most Ruby code uses \`"..."\` by default.

## 2. Integer division silently truncates

\`\`\`ruby
5 / 2     # => 2     (not 2.5)
-5 / 2    # => -3    (floors toward negative infinity)
5.0 / 2   # => 2.5
5.fdiv(2) # => 2.5
\`\`\`

If either operand is a Float, the result is a Float. If both are Integers, the result is an Integer — Ruby never silently promotes. The Python 3 \`/\` operator does the opposite (always Float, with \`//\` for floor division); Go matches Ruby. When you need fractional division, convert one operand or use \`Integer#fdiv\`.

## 3. Symbols are interned, immutable identifiers

\`\`\`ruby
:foo                    # a symbol
"foo".object_id         # => 60        (or some number)
"foo".object_id         # => 80        (different — strings are mutable, each "foo" literal is a new object)
:foo.object_id          # => 1086108   (some number)
:foo.object_id          # => 1086108   (same — symbols are unique)
:foo == "foo"           # => false     (different types, not just different objects)
\`\`\`

Symbols are the identifier-like values Ruby uses for hash keys, method names, and configuration keys. They're cheap to compare (just compare the underlying integer ID) and they're never garbage collected once created in modern Ruby. Use them for *names of things*; use strings for *content the user sees*.

The hash literal shorthand \`{ name: "Ada" }\` uses symbol keys: it's equivalent to \`{ :name => "Ada" }\`. You'll see the shorthand everywhere; the rocket form (\`=>\`) appears when keys aren't symbols (e.g. \`{ "Foo" => 1 }\`).

## 4. \`Hash#fetch\` with a block is the right way to handle missing keys

The default access \`h[:missing]\` returns \`nil\`. That's convenient and dangerous — if a key is legitimately bound to \`nil\` or \`false\`, you can't tell "missing" from "present with falsy value":

\`\`\`ruby
flags = { verbose: false }
flags[:verbose] || true       # => true   (wrong — verbose was explicitly false)
flags.fetch(:verbose) { true } # => false (correct)
flags.fetch(:other)            # => KeyError: key not found
flags.fetch(:other) { "default" } # => "default"
\`\`\`

\`Hash#fetch(key)\` raises \`KeyError\` if the key is missing; with a block (or a second argument), it falls back to the block's value. The block form is preferred when the default is computed (lazy) or when you want a separate code path on the miss.

## What this lesson is NOT teaching

\`Array\` indexing, basic string methods, what a hash is, what \`[1, 2, 3].length\` returns. The polyglot already knows. The katas next exercise the four surprises above; you'll write Ruby that wouldn't have read the same way in your previous language.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_2_2 = {
  id: STEP_2_2_ID,
  lessonId: LESSON_2_ID,
  order: 2,
  type: 'kata' as const,
  title: 'lookup(records, name) — Hash#fetch with a sensible default',
  instruction: `## Your task

Implement \`lookup(records, name)\` that takes a Hash of records (symbol keys, hash values) and returns the record for \`name\` or the string \`"unknown person"\` if the name isn't a key.

The point of this kata isn't "use a default value" — it's to force you to use \`Hash#fetch\` with a block instead of \`records[name] || "unknown person"\`. The tests include a record explicitly set to \`nil\` to make the \`|| "unknown"\` shortcut give the wrong answer.

## Examples

\`\`\`ruby
people = {
  ada: { age: 30, role: "scientist" },
  linus: { age: 25, role: "engineer" },
}

lookup(people, :ada)      # => { age: 30, role: "scientist" }
lookup(people, :missing)  # => "unknown person"
\`\`\`

## The trap (which the tests catch)

\`\`\`ruby
records = { ghost: nil }
lookup(records, :ghost)   # MUST return nil, NOT "unknown person"
\`\`\`

\`records[:ghost]\` is \`nil\`. \`records[:ghost] || "unknown person"\` would wrongly return \`"unknown person"\`. \`Hash#fetch\` distinguishes "key absent" from "key present with \`nil\` value".`,
  starterCode: `def lookup(records, name)
  # Your code here.
end
`,
  testCode: `${RB_HARNESS_HEADER}
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
${RB_HARNESS_FOOTER}`,
  hint: '`Hash#fetch` takes two distinct shapes: `h.fetch(key)` raises `KeyError` if absent, and `h.fetch(key) { ... }` falls back to the block on absent. The block is only evaluated on the miss path — so it\'s safe to put expensive defaults there.',
  solution: `def lookup(records, name)
  records.fetch(name) { "unknown person" }
end`,
  alternativeApproach: `\`records.fetch(name, "unknown person")\` (second positional argument as default) also works for this case. The block form is preferred when:

1. The default is expensive to compute — the block is only run on the miss path.
2. The default depends on the missing key — the block receives the key: \`h.fetch(name) { |k| "no record for #{k}" }\`.
3. You want clarity that the default is a fallback, not a primary value.

The \`||\` shortcut (\`records[name] || "unknown person"\`) silently corrupts when the legitimate value is \`nil\` or \`false\` — the third test exists to make that failure mode unavoidable.`,
}

const STEP_2_3 = {
  id: STEP_2_3_ID,
  lessonId: LESSON_2_ID,
  order: 3,
  type: 'kata' as const,
  title: 'summarize(records) — combine four idioms in one method',
  instruction: `## Your task

Implement \`summarize(records)\` that takes an Array of Hashes with symbol keys and returns a single String of \`"name (age), name (age), ..."\` joined by commas.

Each record has \`:name\` (String) and \`:age\` (Integer). Order in the output matches order in the input.

## Examples

\`\`\`ruby
summarize([{ name: "Ada", age: 30 }, { name: "Linus", age: 25 }])
# => "Ada (30), Linus (25)"

summarize([])
# => ""

summarize([{ name: "Solo", age: 42 }])
# => "Solo (42)"
\`\`\`

This kata combines four idioms in one line of Ruby: array iteration with \`map\`, symbol-key hash access, string interpolation, and joining with \`Array#join\`. None of them are individually surprising; combined and compressed, they're the shape of a thousand Ruby methods you'll write.`,
  starterCode: `def summarize(records)
  # Your code here.
end
`,
  testCode: `${RB_HARNESS_HEADER}
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
${RB_HARNESS_FOOTER}`,
  hint: 'Two `Enumerable` calls and a `String#join` get you there. The shape: transform each Hash to a String, then concatenate with separator.',
  solution: `def summarize(records)
  records.map { |r| "#{r[:name]} (#{r[:age]})" }.join(", ")
end`,
  alternativeApproach: `A reduce-style equivalent (verbose, less idiomatic in Ruby):

\`\`\`ruby
def summarize(records)
  records.reduce("") do |acc, r|
    acc.empty? ? "#{r[:name]} (#{r[:age]})" : "#{acc}, #{r[:name]} (#{r[:age]})"
  end
end
\`\`\`

Works, but the separator-bookkeeping is exactly what \`Array#join\` handles cleanly. In Ruby, the rule of thumb: "if I'm manually handling the gaps between elements, there's a stdlib method I'm missing."`,
}

const STEP_2_4 = {
  id: STEP_2_4_ID,
  lessonId: LESSON_2_ID,
  order: 4,
  type: 'kata' as const,
  title: 'tally_words(words) — counts via Array#tally',
  instruction: `## Your task

Implement \`tally_words(words)\` that takes an Array of Strings and returns a Hash mapping each unique String to its count.

## Examples

\`\`\`ruby
tally_words(["hi", "hi", "bye"])
# => { "hi" => 2, "bye" => 1 }

tally_words([])
# => {}

tally_words(["solo"])
# => { "solo" => 1 }
\`\`\`

The idiomatic solution in modern Ruby (3.0+, what this sandbox runs) is a single method call — \`Array#tally\`. Before \`tally\` shipped in Ruby 2.7, you'd write it manually with \`each_with_object\` or \`group_by(...).transform_values(&:size)\`. Both work and you'll see them in older codebases.`,
  starterCode: `def tally_words(words)
  # Your code here.
end
`,
  testCode: `${RB_HARNESS_HEADER}
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
${RB_HARNESS_FOOTER}`,
  hint: 'Ruby 3.0+ has a method on `Array` that does exactly this in a single call. Its name is the same word you\'d use in English: counting up occurrences of each value is what this method is called.',
  solution: `def tally_words(words)
  words.tally
end`,
  alternativeApproach: `Before \`Array#tally\` (Ruby 2.7), the idiomatic build-up was:

\`\`\`ruby
def tally_words(words)
  words.each_with_object(Hash.new(0)) { |w, counts| counts[w] += 1 }
end
\`\`\`

\`Hash.new(0)\` constructs a Hash whose default value for absent keys is \`0\` — so \`counts[w] += 1\` works on first-encounter too. Or with \`group_by\`:

\`\`\`ruby
def tally_words(words)
  words.group_by(&:itself).transform_values(&:size)
end
\`\`\`

Both work; \`tally\` is the right answer in modern Ruby. You'll see the older forms in legacy codebases — they're the shape Ruby used before the stdlib absorbed the pattern.`,
}
// =============================================================================
// Lesson 4 — Control flow and truthiness
// =============================================================================

const LESSON_4_ID = seedUuid('ruby-l4-control-flow')

const STEP_4_1_ID = seedUuid('ruby-s4-1-truthiness-and-case')
const STEP_4_2_ID = seedUuid('ruby-s4-2-predict-if-0')
const STEP_4_3_ID = seedUuid('ruby-s4-3-classify')
const STEP_4_4_ID = seedUuid('ruby-s4-4-bucketize')

const LESSON_4 = {
  id: LESSON_4_ID,
  scrollId: COURSE_ID,
  order: 5,
  title: 'Control flow and truthiness',
}

const STEP_4_1 = {
  id: STEP_4_1_ID,
  lessonId: LESSON_4_ID,
  order: 1,
  type: 'read' as const,
  title: 'Truthiness, case/when, and the postfix forms',
  instruction: `## Why this matters

You already know \`if\`, \`else\`, \`while\`. This step skips them and covers the four control-flow facts in Ruby that don't translate from JS / Python / Go / Java without surprising you at least once.

## 1. Only \`false\` and \`nil\` are falsy

Everything else is truthy. Including \`0\`. Including the empty string \`""\`. Including the empty array \`[]\`.

\`\`\`ruby
if 0       then puts "0 is truthy"       end   # prints
if ""      then puts "empty string truthy" end # prints
if []      then puts "empty array truthy" end  # prints
if nil     then puts "nil truthy"        end   # does not print
if false   then puts "false truthy"      end   # does not print
\`\`\`

This is the polyglot reflex that breaks most often. In Python \`0\` is falsy. In JavaScript \`0\` and \`""\` are both falsy. In C, \`0\` is falsy. In Ruby, **the only two falsy values are \`false\` and \`nil\`** — full stop. Every other value is truthy regardless of its "emptiness" or numeric value.

When you want emptiness, ask for it explicitly: \`arr.empty?\`, \`str.empty?\`, \`n.zero?\`. The methods exist precisely because the falsy-trick doesn't work.

## 2. \`case/when\` uses \`===\`, not \`==\`

\`case/when\` is Ruby's switch — but the comparison inside each \`when\` isn't \`==\`, it's \`===\` (called "case equality" or "triple equals").

The default \`===\` on most classes is the same as \`==\`. The difference matters when \`===\` is overridden — and three overrides do the heavy lifting:

- **\`Class === instance\`** is \`instance.is_a?(Class)\`. So \`case x; when Integer then "int" end\` works.
- **\`Range === value\`** is \`range.include?(value)\`. So \`case x; when 1..10 then "small" end\` works.
- **\`Regexp === string\`** is \`regex.match?(string)\`. So \`case x; when /^foo/ then "starts with foo" end\` works.

Combined, \`case/when\` is much more powerful than a JS \`switch\` (which is strict-equals only). It's how Ruby dispatches on type, on range, on pattern — all with one syntax.

## 3. \`unless\` and \`until\` are first-class

\`unless x\` reads as \`if !x\`. \`until x\` reads as \`while !x\`. They're not syntactic sugar; they're peers of \`if\` and \`while\`. Use them when the negation reads more naturally:

\`\`\`ruby
unless user.admin?
  raise "not allowed"
end

# is clearer than
if !user.admin?
  raise "not allowed"
end
\`\`\`

Style: \`unless\` and \`until\` should appear without an \`else\` clause. \`unless x then ... else ... end\` is technically legal but always reads worse than the equivalent \`if\`. If you find yourself reaching for \`unless ... else\`, flip it back to \`if\`.

## 4. Postfix \`if\` / \`unless\` for guards

\`\`\`ruby
return nil if value.nil?
raise "no user" unless user
log(message) if debug?
\`\`\`

Postfix is one of Ruby's signature looks. Use it for **one-line guards** at method entry and short skip-this-line conditionals. Don't chain or nest postfix; multi-line conditions should use the standard form. The line should read like English: "do X if Y" — when it doesn't, switch back to prefix.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_4_2 = {
  id: STEP_4_2_ID,
  lessonId: LESSON_4_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: is "if 0" truthy or falsy?',
  instruction: `Before the next kata, predict one thing.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    snippet: `if 0
  puts "truthy"
else
  puts "falsy"
end`,
    options: [
      { id: 'a', text: '`truthy`' },
      { id: 'b', text: '`falsy`' },
      { id: 'c', text: 'Raises `TypeError` — `if` needs a boolean, not an integer' },
      { id: 'd', text: '`falsy` — Ruby implicitly coerces `0` to `false` via `Integer#to_b` (like Python\'s `bool(0)`)' },
    ],
    correct: 'a',
    feedback: {
      a: 'Correct. In Ruby, the only falsy values are `false` and `nil`. Every other value — including `0`, `""`, and `[]` — is truthy. When you need to check for zero, use `n.zero?`; for emptiness, use `arr.empty?`. The boolean-falsy trick from other languages doesn\'t work here.',
      b: 'The C / Python / JS reflex. In C, `if (0)` is false. In Python, `bool(0)` is `False`. In JavaScript, `if (0)` is falsy. In Ruby, **`0` is truthy** — the language inherits this from Smalltalk, not from C. Only `false` and `nil` are falsy.',
      c: 'The static-typing reflex (Go, Rust). Those languages require a `bool` in conditional position. Ruby — and Python, JS, Lua — accept any value and check truthiness at runtime. No `TypeError` here.',
      d: 'Ruby has no implicit boolean coercion. There\'s no `Integer#to_b` method — you can confirm with `5.respond_to?(:to_b)` (returns `false`). The truthiness check is direct on the object: anything other than `false` or `nil` is truthy, regardless of class or value. Python\'s `bool(0) == False` has no Ruby analogue. If you want to test for zero specifically, use `n.zero?` explicitly.',
    },
  },
}

const STEP_4_3 = {
  id: STEP_4_3_ID,
  lessonId: LESSON_4_ID,
  order: 3,
  type: 'kata' as const,
  title: 'classify(x) — dispatch on class with case/when',
  instruction: `## Your task

Implement \`classify(x)\` that returns a String describing the class of \`x\` using \`case/when\` dispatch. The exact strings:

- \`Integer\` → \`"number"\`
- \`String\` → \`"text"\`
- \`Array\` → \`"list"\`
- \`Hash\` → \`"map"\`
- \`Symbol\` → \`"label"\`
- anything else → \`"other"\`

## Example

\`\`\`ruby
classify(42)         # => "number"
classify("hello")    # => "text"
classify([1, 2, 3])  # => "list"
classify({ a: 1 })   # => "map"
classify(:foo)       # => "label"
classify(3.14)       # => "other"   (Float, not Integer)
classify(nil)        # => "other"
\`\`\`

The point of this kata is to use \`case/when Class\` directly — which works because \`===\` on a class checks \`is_a?\`. You should not write \`case x.class\` (that's a different idiom, also valid, but it doesn't exercise the \`Class === instance\` rule).`,
  starterCode: `def classify(x)
  # Your code here.
end
`,
  testCode: `${RB_HARNESS_HEADER}
_t('Integer is "number"') { _eq classify(42), "number" }
_t('String is "text"')    { _eq classify("hi"), "text" }
_t('Array is "list"')     { _eq classify([1, 2]), "list" }
_t('Hash is "map"')       { _eq classify({ a: 1 }), "map" }
_t('Symbol is "label"')   { _eq classify(:foo), "label" }
_t('Float is "other"')    { _eq classify(3.14), "other" }
_t('nil is "other"')      { _eq classify(nil), "other" }
_t('true is "other"')     { _eq classify(true), "other" }
${RB_HARNESS_FOOTER}`,
  hint: '`case x` with `when ClassName` clauses works directly — no `x.class` needed in the `case` head. The `else` clause handles "everything not matched above".',
  solution: `def classify(x)
  case x
  when Integer then "number"
  when String  then "text"
  when Array   then "list"
  when Hash    then "map"
  when Symbol  then "label"
  else              "other"
  end
end`,
  alternativeApproach: `\`case x.class\` works too, with a different mechanic:

\`\`\`ruby
def classify(x)
  case x.class.name
  when "Integer" then "number"
  # ...
  end
end
\`\`\`

Here you're matching strings against strings (\`String === String\`), not classes against instances. It works but doesn't exercise the Ruby \`case/when Class\` idiom — the kata is intentionally choosing the more idiomatic form.

A Hash-based dispatch also works:

\`\`\`ruby
CLASSIFY = { Integer => "number", String => "text", Array => "list", Hash => "map", Symbol => "label" }
def classify(x)
  CLASSIFY.fetch(x.class) { "other" }
end
\`\`\`

Cleaner if you have 10+ types or you want to add types at runtime. For 5-6 fixed cases, \`case/when\` reads better. The Hash version also fails for subclass relationships — \`case/when Class\` uses \`is_a?\`, which respects inheritance; Hash key lookup uses \`eql?\`, which doesn't.`,
}

const STEP_4_4 = {
  id: STEP_4_4_ID,
  lessonId: LESSON_4_ID,
  order: 4,
  type: 'challenge' as const,
  title: 'bucketize(values) — group by class, idiomatic Ruby',
  instruction: `## Your task

Implement \`bucketize(values)\` that takes an Array of mixed types and returns a Hash where each key is a class and the value is an Array of all input values of that class, in input order.

## Example

\`\`\`ruby
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
\`\`\`

## Constraints

- Use \`case/when\` with \`Class === instance\` somewhere in your solution.
- Keep the body under 10 lines (not counting \`def\` / \`end\`).

## What this exercises

This kata combines two things from this lesson: dispatch on class via \`case/when Class\`, and an \`Enumerable\` build-up (you'll likely reach for \`each_with_object\` or \`group_by\`). The postfix \`if\` from the read step is natural to reach for when you need a one-line guard — use it if it fits, don't force it if it doesn't.

The 15-minute budget is real — if you're still wrestling after 15, look at the alternative approach for the shape.`,
  starterCode: `def bucketize(values)
  # Your code here. ~5-8 lines.
end
`,
  testCode: `${RB_HARNESS_HEADER}
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
${RB_HARNESS_FOOTER}`,
  hint: null,
  solution: `def bucketize(values)
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
end`,
  alternativeApproach: `The compact form using \`group_by\`:

\`\`\`ruby
def bucketize(values)
  values.group_by do |v|
    case v
    when Integer then Integer
    when String  then String
    when Symbol  then Symbol
    when Array   then Array
    when Hash    then Hash
    end
  end.compact
end
\`\`\`

\`group_by\` already builds the Hash-of-Arrays you want; \`compact\` strips any \`nil\` key that would appear if a value didn't match. Cleaner if you're sure no other types appear; less explicit about the "skip the unmatched" decision.

A more polymorphic version uses \`.class\` directly (no \`case/when\`):

\`\`\`ruby
def bucketize(values)
  values.group_by(&:class)
end
\`\`\`

That's three lines, no \`case/when\`. Why was the kata harder? Because the constraint forced you to use \`case/when\` and postfix — those are the idioms you needed practice with. In real code, \`group_by(&:class)\` is the right answer when the buckets are unbounded. The kata makes you build the muscle for the case-with-explicit-buckets shape (which is what you reach for when only specific classes should be grouped, others ignored).`,
}
// =============================================================================
// Lesson 5 — Methods (closes the scroll)
// =============================================================================

const LESSON_5_ID = seedUuid('ruby-l5-methods')

const STEP_5_1_ID = seedUuid('ruby-s5-1-methods-read')
const STEP_5_2_ID = seedUuid('ruby-s5-2-greet')
const STEP_5_3_ID = seedUuid('ruby-s5-3-tally-args')
const STEP_5_4_ID = seedUuid('ruby-s5-4-parameters-of')

const LESSON_5 = {
  id: LESSON_5_ID,
  scrollId: COURSE_ID,
  order: 6,
  title: 'Methods',
}

const STEP_5_1 = {
  id: STEP_5_1_ID,
  lessonId: LESSON_5_ID,
  order: 1,
  type: 'read' as const,
  title: 'Keyword args, splats, implicit return, and method introspection',
  instruction: `## Why this matters

You've defined methods in every previous lesson — \`repeat\`, \`summarize\`, \`safe_call\`, \`classify\`. This step makes the parameter list and the return mechanism explicit. The Ruby-specific parts: how keyword arguments differ from Python's \`**kwargs\`, how splats compose, and the fact that methods are themselves introspectable objects (closing the loop from Lesson 3).

## Keyword arguments — separate from positional

\`\`\`ruby
def greet(name:, greeting: "Hello")
  "#{greeting}, #{name}!"
end

greet(name: "Ada")                   # => "Hello, Ada!"
greet(name: "Linus", greeting: "Hej") # => "Hej, Linus!"
greet()                              # ArgumentError: missing keyword: :name
\`\`\`

The trailing colon (\`name:\`) makes the parameter **keyword-only**. The caller must use the keyword form; positional won't work. Defaults work the same as for positional args (\`greeting: "Hello"\`).

This is the part that surprises Python developers: in Python, \`def f(name)\` is equivalent to \`def f(*, name)\` only when you make it so with the bare \`*\`. In Ruby, the trailing colon on the parameter is the syntactic switch — positional and keyword are entirely separate slots, not flavours of the same thing.

## Splats — \`*args\` and \`**opts\`

\`\`\`ruby
def tally_args(*nums, **opts)
  { positional: nums, keyword: opts }
end

tally_args(1, 2, 3, label: "x", verbose: true)
# => { positional: [1, 2, 3], keyword: { label: "x", verbose: true } }
\`\`\`

\`*args\` collects extra positional arguments into an Array. \`**opts\` collects extra keyword arguments into a Hash. They compose with named parameters:

\`\`\`ruby
def request(url, *headers, method: "GET", **extras)
  # ...
end
\`\`\`

**Python developers:** \`**opts\` is essentially Ruby's \`**kwargs\` — same mechanism, same shape. \`*nums\` is Ruby's \`*args\`. For the splats, the analogy holds. Where Ruby diverges from Python is in how it handles a *block* — captured as a separate single-slot argument with \`&block\` (Lesson 1), with no Python equivalent. The splats: same model. The block: Ruby-only.

This pattern is how every Ruby DSL turns method calls into data — Rails' \`has_many :posts, dependent: :destroy\` is \`has_many(:posts, dependent: :destroy)\`, with \`:posts\` as positional and \`dependent: :destroy\` as a keyword. The framework receives the data as method parameters and decides what to do with it.

## Implicit return — the last expression is the value

\`\`\`ruby
def double(n)
  n * 2          # this is what the method returns
end

double(5)        # => 10
\`\`\`

Every method returns its last expression's value. No \`return\` keyword needed for the common case. Use explicit \`return\` for early exits (\`return nil if x.nil?\`) — never for the last line.

This is the same rule blocks follow (Lesson 1's \`yield\` discussion). Method, block, lambda — every chunk of code in Ruby returns its last expression by default.

## Methods are objects too — \`Method#parameters\`

The object-model rule from Lesson 3 applies to methods: a method is an object you can fetch with \`method(:name)\`, and that object has a \`.parameters\` method that tells you what shape it accepts.

\`\`\`ruby
def greet(name:, greeting: "Hello", *titles, **extras)
  # ...
end

method(:greet).parameters
# => [[:keyreq, :name], [:key, :greeting], [:rest, :titles], [:keyrest, :extras]]
\`\`\`

Each entry is \`[kind, name]\`. The kinds: \`:req\` (required positional), \`:opt\` (optional positional), \`:rest\` (\`*args\`), \`:keyreq\` (required keyword), \`:key\` (optional keyword), \`:keyrest\` (\`**opts\`), \`:block\` (\`&block\`).

This is how introspection libraries — and metaprogramming-heavy frameworks — work. They ask the method what it expects, then build something appropriate. The challenge at the end of this lesson exercises it directly.

## What we didn't cover

Four things you'll encounter in real Ruby that aren't in this scroll: \`attr_accessor\` (encapsulation cost vs syntax), \`method_missing\` (dynamic dispatch via missing-message hook), eigenclasses (singleton class on every object), and monkey-patching (reopening core classes). All real, all powerful, all foot-gun-shaped. They live in the OOP and metaprogramming deep-dive scrolls — not in a 90-minute polyglot crash.

**You don't need to memorise the names now.** When one of these shows up in production Ruby — and one will — you'll recognise that you're looking at a named, deferred topic and you'll know there's a deep-dive scroll for it. That's the goal: *recognise, don't memorise*. Reach for the deep-dive when the footgun fires.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_5_2 = {
  id: STEP_5_2_ID,
  lessonId: LESSON_5_ID,
  order: 2,
  type: 'kata' as const,
  title: 'greet(name:, greeting: "Hello") — required and default keyword args',
  instruction: `## Your task

Write a method \`greet\` whose **signature** matches all of the following:

- \`name\` is a **keyword-only required** parameter.
- \`greeting\` is a **keyword-only optional** parameter, defaulting to \`"Hello"\`.
- Positional calls must raise \`ArgumentError\`.
- Calls missing \`name\` must raise \`ArgumentError\`.

The body is one line of string interpolation returning \`"<greeting>, <name>!"\`.

## Examples

\`\`\`ruby
greet(name: "Ada")                    # => "Hello, Ada!"
greet(name: "Linus", greeting: "Hej") # => "Hej, Linus!"
greet()                               # raises ArgumentError
greet("Ada")                          # raises ArgumentError (positional)
\`\`\`

## Why this kata exists

**The body is trivial — one line. The kata is the signature.** Writing \`def greet(name, greeting = "Hello")\` (positional with default) makes the first two tests pass but breaks the fourth — Ruby happily accepts \`greet("Ada")\`. The keyword-only signature (trailing colons on the parameter names) is what the tests are checking. Get the signature right, and the body is one line of \`"#{greeting}, #{name}!"\`.`,
  starterCode: `# Write the signature so \`greet\` is keyword-only:
#   - name: required (no default)
#   - greeting: defaults to "Hello"
# Then write the one-line body.

def greet
  # Your code here.
end
`,
  testCode: `${RB_HARNESS_HEADER}
_t('greets with default greeting') do
  _eq greet(name: "Ada"), "Hello, Ada!"
end

_t('greets with custom greeting') do
  _eq greet(name: "Linus", greeting: "Hej"), "Hej, Linus!"
end

_t('raises ArgumentError when name is missing') do
  begin
    greet(greeting: "Hey")
    raise "expected ArgumentError"
  rescue ArgumentError
    _eq true, true
  end
end

_t('raises ArgumentError when called positionally') do
  begin
    greet("Ada")
    raise "expected ArgumentError"
  rescue ArgumentError
    _eq true, true
  end
end
${RB_HARNESS_FOOTER}`,
  hint: 'Two parts. **Signature:** in Ruby, a trailing colon on a parameter name (`name:`) makes that parameter keyword-only — positional calls won\'t reach it. Defaults work the same as for positionals (`greeting: "Hello"`). **Body:** one line, string interpolation. The signature is what the tests are really checking.',
  solution: `def greet(name:, greeting: "Hello")
  "#{greeting}, #{name}!"
end`,
  alternativeApproach: `If you wrote \`def greet(name, greeting = "Hello")\` (positional with a default), the method works for the first two tests but fails the fourth one — Ruby happily accepts \`greet("Ada")\` because \`name\` is the first positional. The keyword-only signature (trailing colons) is the part the kata is exercising.

A method that wants to accept both positional and keyword would split the signature: \`def f(name, greeting: "Hello")\` — positional \`name\`, keyword \`greeting\`. That's a valid pattern when one argument is so essential it deserves a positional slot and others are options. For two equally important parameters, keyword-only reads better at the call site (\`greet(name: ..., greeting: ...)\` is self-documenting; \`greet("Ada", "Hej")\` six months later requires looking up the signature).`,
}

const STEP_5_3 = {
  id: STEP_5_3_ID,
  lessonId: LESSON_5_ID,
  order: 3,
  type: 'kata' as const,
  title: 'tally_args(*nums, **opts) — splat both ways',
  instruction: `## Your task

Implement \`tally_args(*nums, **opts)\` that returns a Hash:

\`\`\`
{
  positional_count: <number of positional args>,
  keyword_count: <number of keyword args>,
  positional: <the positional args as an Array>,
  keyword: <the keyword args as a Hash>,
}
\`\`\`

## Examples

\`\`\`ruby
tally_args(1, 2, 3, label: "x")
# => {
#      positional_count: 3,
#      keyword_count: 1,
#      positional: [1, 2, 3],
#      keyword: { label: "x" },
#    }

tally_args()
# => {
#      positional_count: 0,
#      keyword_count: 0,
#      positional: [],
#      keyword: {},
#    }

tally_args("a", verbose: true, mode: :strict)
# => {
#      positional_count: 1,
#      keyword_count: 2,
#      positional: ["a"],
#      keyword: { verbose: true, mode: :strict },
#    }
\`\`\`

The signature uses both splats. \`*nums\` collects all positional args into an Array. \`**opts\` collects all keyword args into a Hash. The Hash you return uses symbol keys (\`positional_count:\`, \`keyword_count:\`, \`positional:\`, \`keyword:\`).`,
  starterCode: `def tally_args(*nums, **opts)
  # Your code here.
end
`,
  testCode: `${RB_HARNESS_HEADER}
_t('three positionals and one keyword') do
  result = tally_args(1, 2, 3, label: "x")
  expected = { positional_count: 3, keyword_count: 1, positional: [1, 2, 3], keyword: { label: "x" } }
  _eq result, expected
end

_t('no arguments at all') do
  result = tally_args()
  expected = { positional_count: 0, keyword_count: 0, positional: [], keyword: {} }
  _eq result, expected
end

_t('one positional and two keywords') do
  result = tally_args("a", verbose: true, mode: :strict)
  expected = { positional_count: 1, keyword_count: 2, positional: ["a"], keyword: { verbose: true, mode: :strict } }
  _eq result, expected
end
${RB_HARNESS_FOOTER}`,
  hint: 'Both splats give you exactly what you need — `nums` is already an Array, `opts` is already a Hash. Their lengths are the counts. The return is one Hash literal with four entries.',
  solution: `def tally_args(*nums, **opts)
  {
    positional_count: nums.length,
    keyword_count: opts.length,
    positional: nums,
    keyword: opts,
  }
end`,
  alternativeApproach: `A Ruby idiom worth knowing: if you wanted to also accept and pass on a block, the full splat list is \`(*nums, **opts, &block)\`. Combined with \`Method#parameters\` from the read, you can write methods that adapt to any call shape — which is exactly how Rails routing, RSpec matchers, and most DSL libraries work under the hood.

If you found yourself reaching for \`*nums.size\` (no method \`size\`), remember \`nums\` is *already* an Array — it's not a splatted shape inside the method body. The same goes for \`opts\` — it's a Hash from the moment you enter the method.`,
}

const STEP_5_4 = {
  id: STEP_5_4_ID,
  lessonId: LESSON_5_ID,
  order: 4,
  type: 'challenge' as const,
  title: "parameters_of(method_name) — introspect a method's signature",
  instruction: `## Your task

Implement \`parameters_of(method_name)\` that takes a Symbol naming a method defined in the current scope, and returns a Hash counting how many parameters of each kind the method has:

\`\`\`
{
  required: <count of :req — required positional>,
  optional: <count of :opt — optional positional with default>,
  keyword_required: <count of :keyreq — required keyword (name:)>,
  keyword_optional: <count of :key — optional keyword (name: default)>,
  rest: <true if the method has *args, false otherwise>,
  keyrest: <true if the method has **opts, false otherwise>,
}
\`\`\`

This closes the loop on the object model from Lesson 3: methods are objects, and \`Method#parameters\` lets you ask any method "what shape do you accept?" without calling it.

## Test method definitions — already provided

The test code defines five methods for you to introspect. You don't need to write any of them; you only need to write \`parameters_of\`.

\`\`\`ruby
def fixture_simple(a, b)
  # two required positional
end

def fixture_defaults(a, b = 1)
  # one required, one optional positional
end

def fixture_keywords(a:, b: "default")
  # one keyreq, one key
end

def fixture_splats(*args, **opts)
  # rest and keyrest only
end

def fixture_mixed(a, b: 1, *rest, c:, **opts)
  # all the shapes at once
end
\`\`\`

## Example

\`\`\`ruby
parameters_of(:fixture_simple)
# => { required: 2, optional: 0, keyword_required: 0, keyword_optional: 0, rest: false, keyrest: false }

parameters_of(:fixture_mixed)
# => { required: 1, optional: 0, keyword_required: 1, keyword_optional: 1, rest: true, keyrest: true }
\`\`\`

## What this exercises

- \`method(:name)\` to obtain the Method object.
- \`Method#parameters\` returns an Array of \`[kind, name]\` pairs.
- \`Enumerable#count\` (with a block or with an argument) to count by kind.
- The mental model that "methods are objects too" — same property the object-model lesson built.

The 15-minute budget is real.`,
  starterCode: `def fixture_simple(a, b); end
def fixture_defaults(a, b = 1); end
def fixture_keywords(a:, b: "default"); end
def fixture_splats(*args, **opts); end
def fixture_mixed(a, b: 1, *rest, c:, **opts); end

def parameters_of(method_name)
  # Your code here.
end
`,
  testCode: `${RB_HARNESS_HEADER}
_t('simple — two required positional') do
  result = parameters_of(:fixture_simple)
  expected = { required: 2, optional: 0, keyword_required: 0, keyword_optional: 0, rest: false, keyrest: false }
  _eq result, expected
end

_t('defaults — one required, one optional') do
  result = parameters_of(:fixture_defaults)
  expected = { required: 1, optional: 1, keyword_required: 0, keyword_optional: 0, rest: false, keyrest: false }
  _eq result, expected
end

_t('keywords — one keyreq, one key') do
  result = parameters_of(:fixture_keywords)
  expected = { required: 0, optional: 0, keyword_required: 1, keyword_optional: 1, rest: false, keyrest: false }
  _eq result, expected
end

_t('splats — rest and keyrest, no named') do
  result = parameters_of(:fixture_splats)
  expected = { required: 0, optional: 0, keyword_required: 0, keyword_optional: 0, rest: true, keyrest: true }
  _eq result, expected
end

_t('mixed — all shapes') do
  result = parameters_of(:fixture_mixed)
  expected = { required: 1, optional: 0, keyword_required: 1, keyword_optional: 1, rest: true, keyrest: true }
  _eq result, expected
end
${RB_HARNESS_FOOTER}`,
  hint: null,
  solution: `def parameters_of(method_name)
  params = method(method_name).parameters
  kinds = params.map(&:first)
  {
    required:         kinds.count(:req),
    optional:         kinds.count(:opt),
    keyword_required: kinds.count(:keyreq),
    keyword_optional: kinds.count(:key),
    rest:             kinds.include?(:rest),
    keyrest:          kinds.include?(:keyrest),
  }
end`,
  alternativeApproach: `The shape is straightforward once you see \`Method#parameters\`. The clever bit is realising you only need the first element of each pair (the kind symbol) — once you map to that, every count is \`Array#count(symbol)\` and every boolean is \`Array#include?(symbol)\`.

An equivalent build-up using \`each_with_object\` and case-matching:

\`\`\`ruby
def parameters_of(method_name)
  result = { required: 0, optional: 0, keyword_required: 0, keyword_optional: 0, rest: false, keyrest: false }
  method(method_name).parameters.each do |(kind, _name)|
    case kind
    when :req     then result[:required] += 1
    when :opt     then result[:optional] += 1
    when :keyreq  then result[:keyword_required] += 1
    when :key     then result[:keyword_optional] += 1
    when :rest    then result[:rest] = true
    when :keyrest then result[:keyrest] = true
    end
  end
  result
end
\`\`\`

Longer, but uses the \`case/when\` mechanic from Lesson 4 in a new context. Either form is idiomatic; the \`map(&:first)\` + \`count\` form is more compact, the explicit \`each\` form is easier to extend (e.g. adding handling for \`:block\` parameters).`,
}

// =============================================================================
// Exports
// =============================================================================


// =============================================================================
// Lesson 1 (polyglot-first reorder) — Blocks: the syntax you see everywhere
// =============================================================================
//
// Naming note: the legacy `LESSON_1_ID` / `STEP_1_*_ID` constants in this file
// refer to the original Object-model lesson (now at order 4, conceptual
// Lesson 3). The new Blocks lesson uses the `LESSON_BLOCKS_*` / `STEP_BLOCKS_*`
// prefix to avoid collision. The seedUuid args (`ruby-l1-blocks`, etc.)
// reflect the new polyglot-first numbering.

const LESSON_BLOCKS_ID = seedUuid('ruby-l1-blocks')

const STEP_BLOCKS_1_ID = seedUuid('ruby-s1-1-blocks-read')
const STEP_BLOCKS_2_ID = seedUuid('ruby-s1-2-blocks-predict')
const STEP_BLOCKS_3_ID = seedUuid('ruby-s1-3-repeat')
const STEP_BLOCKS_4_ID = seedUuid('ruby-s1-4-map-keys')
const STEP_BLOCKS_5_ID = seedUuid('ruby-s1-5-playground')

const LESSON_BLOCKS = {
  id: LESSON_BLOCKS_ID,
  scrollId: COURSE_ID,
  order: 2,
  title: 'Blocks: the syntax you see everywhere',
}

const STEP_BLOCKS_1 = {
  id: STEP_BLOCKS_1_ID,
  lessonId: LESSON_BLOCKS_ID,
  order: 1,
  type: 'read' as const,
  title: 'Blocks — the syntax you see everywhere',
  instruction: `## Why this matters

Open any Ruby file with any substance and you'll see \`do |x| ... end\` and \`{ |x| ... }\` everywhere. They're not the syntax of \`each\` — \`each\` is one of the many methods that take a block. Blocks are the language's central abstraction for "pass behaviour into a method". A polyglot who can read blocks can read Ruby.

## What blocks look like in the wild

\`\`\`ruby
[1, 2, 3].each do |x|
  puts x
end

[1, 2, 3].map { |x| x * 2 }
5.times { puts "hi" }
File.open("path.txt") { |f| f.read }
[1, 2, 3].tap { |arr| puts arr.size }
\`\`\`

\`each\`, \`map\`, \`times\`, \`File.open\`, \`tap\` — none of them are language keywords. They are stdlib methods that happen to accept a block as an extra argument.

## What a block is, technically

A block is **syntax** — a chunk of code passed to a method call as a special extra argument. Two equivalent forms:

- \`do |args| ... end\` — multi-line.
- \`{ |args| ... }\` — single-line.

The args between \`|...|\` match what the method yields; blocks can take several: \`[[1, 2], [3, 4]].map { |a, b| a + b }\` produces \`[3, 7]\`; hashes iterate with \`|k, v|\`. **By itself a block is not an object you can store in a variable** — it only exists as an object when a method captures it with \`&block\` (see below).

## Convention: \`do...end\` vs \`{...}\`

\`do...end\` for multi-line or side-effecting blocks; \`{...}\` for single-line expressions that return a value. There's also a precedence difference — \`foo bar { ... }\` binds the block to \`bar\`; \`foo bar do ... end\` binds it to \`foo\`. So the convention isn't purely aesthetic; when it matters, the bug is silent. Depth in the blocks deep-dive.

## \`yield\` invokes the block from inside the method

\`\`\`ruby
def shout
  yield.upcase + "!"
end

shout { "hello" }  # => "HELLO!"
\`\`\`

The block \`{ "hello" }\` returns \`"hello"\` (last expression, implicit return). \`yield\` hands that back to the method. The method processes it, returns the result.

**If you come from Python:** Ruby's \`yield\` is **not** Python's \`yield\`. Python's emits values from a generator; Ruby's invokes the block the caller passed. Same word, different semantics — it's the #1 trap for Python developers learning Ruby.

## \`&:method\` shorthand

\`\`\`ruby
[1, 2, 3].map(&:to_s)  # ≡ [1, 2, 3].map { |x| x.to_s }
\`\`\`

Syntactic sugar that turns a symbol into a block. *Why* it works is explained in Lesson 3 once the object model is on the table. For now, use it as a pattern.

## Quick notation you'll see in the next step

\`#{expression}\` inside double-quoted strings evaluates the expression and inserts the result — Lesson 2 covers it in depth. \`puts\` prints to STDOUT with a trailing newline; the method \`puts\` itself returns \`nil\`, not the text it printed.

## \`&block\` — capturing the block as an object

A method can name the block as a parameter using \`&block\`:

\`\`\`ruby
def with_logger(&block)
  puts "start"
  result = block.call
  puts "done"
  result
end
\`\`\`

Same effect as \`yield\` but now the block is a \`Proc\` object — you can store it, pass it on, or call it multiple times.

## \`block_given?\`

A method can check whether the caller passed a block and behave differently. The canonical case: \`[1, 2, 3].each\` with no block returns an \`Enumerator\` (lazy, chainable); with a block, it iterates and returns the array. You'll see \`block_given?\` in any decent gem.

## Named-and-deferred: \`Proc\` vs \`lambda\`

Procs and lambdas behave differently around \`return\` and around arity strictness. That's the blocks deep-dive scroll's territory. We name it here so you don't get blindsided in production code; the depth lives elsewhere.`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
}

const STEP_BLOCKS_2 = {
  id: STEP_BLOCKS_2_ID,
  lessonId: LESSON_BLOCKS_ID,
  order: 2,
  type: 'predict' as const,
  title: 'Predict: what does this code return?',
  instruction: `Before you write code, predict one thing.

Given that \`Process.clock_gettime(Process::CLOCK_MONOTONIC)\` returns a Float in seconds, what does this call **return**?`,
  starterCode: null,
  testCode: null,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: {
    snippet: `def with_timer
  start = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  result = yield
  elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - start
  [result, elapsed.round(2)]
end

with_timer { 1 + 1 }`,
    options: [
      { id: 'a', text: '`[2, 0.0]`' },
      { id: 'b', text: '`[nil, 0.0]`  (the block doesn\'t return anything useful)' },
      { id: 'c', text: '`LocalJumpError` — `yield` fails because no arguments were passed' },
      { id: 'd', text: '`2` alone (the method returns whatever the block returns)' },
    ],
    correct: 'a',
    feedback: {
      a: "Correct. The block `{ 1 + 1 }` returns `2` by implicit return (the last expression is the block's value, same rule as any Ruby method). `yield` hands that `2` back to the calling method, which binds it to `result`. The method's last expression is `[result, elapsed.round(2)]` — that's the value `with_timer` returns to its caller. The time between the two `clock_gettime` calls is ~0s for a trivial addition; `round(2)` makes it `0.0`.",
      b: "The C/Java reflex: \"small blocks don't return implicitly.\" In Ruby, every chunk of code — method or block — returns its last expression by default. If you wanted the block to explicitly return `nil`, you'd write `{ 1 + 1; nil }`.",
      c: "`LocalJumpError` happens when a method calls `yield` and *no block was passed*. Here `with_timer { 1 + 1 }` does pass a block, so `yield` invokes it cleanly. `yield` with or without arguments always invokes the block — the arguments would be for the block, not for `yield` itself.",
      d: "Close — `yield` does return `2` to the method. But `with_timer` continues afterwards: it computes `elapsed`, and its last expression is `[result, elapsed.round(2)]`. The block's value flows into the method; the method's value (its last expression) flows back to the caller. Two separate hops: block → method, method → caller.",
    },
  },
}

const STEP_BLOCKS_3 = {
  id: STEP_BLOCKS_3_ID,
  lessonId: LESSON_BLOCKS_ID,
  order: 3,
  type: 'kata' as const,
  title: 'repeat(n) — invoke the block n times',
  instruction: `## Your task

Implement \`repeat(n)\` that invokes the block passed to it \`n\` times. The block's return value doesn't matter; what matters is that it's called the right number of times.

## Examples

\`\`\`ruby
counter = 0
repeat(3) { counter += 1 }
counter  # => 3

repeat(0) { raise "shouldn't be called" }
# does not raise — the block was never invoked
\`\`\`

The idiomatic solution is a single line. Think Ruby, not C.`,
  starterCode: `def repeat(n)
  # Your code here.
end
`,
  testCode: `${RB_HARNESS_HEADER}
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
${RB_HARNESS_FOOTER}`,
  hint: 'Think about which object already knows how to iterate N times. In Ruby, integers aren\'t a primitive type — they\'re objects with methods. Which of those methods invokes a block?',
  solution: `def repeat(n)
  n.times { yield }
end`,
  alternativeApproach: `A solution without \`Integer#times\` would be a manual loop:

\`\`\`ruby
def repeat(n)
  i = 0
  while i < n
    yield
    i += 1
  end
end
\`\`\`

It works — but it's C-idiomatic, not Ruby-idiomatic. When a collection or an integer already knows how to iterate, stay on the method side; manual loops in Ruby usually signal a method you didn't know about. Reach for \`while\` only when you genuinely need its semantics (loop with a condition that isn't a count).`,
}

const STEP_BLOCKS_4 = {
  id: STEP_BLOCKS_4_ID,
  lessonId: LESSON_BLOCKS_ID,
  order: 4,
  type: 'kata' as const,
  title: 'map_keys(hash) — transform the keys with a block',
  instruction: `## Your task

Implement \`map_keys(hash)\` that takes a hash and a block, and returns a new hash where each key has been transformed by the block. The values stay unchanged.

## How \`&block\` works in the signature

When you declare a parameter as \`&block\`, you capture the block passed by the caller as a \`Proc\` object named \`block\`. You invoke it with \`block.call(arg)\`, or pass it on to another method using \`&block\` (same sigil). The \`&\` is the operator that **converts between block syntax and \`Proc\` objects in both directions** — that's the whole rule. At the call site, \`&proc\` turns a \`Proc\` into a block; in a signature, \`&block\` turns the incoming block into a \`Proc\`.

## Force the signature to accept both forms

Your method must accept **both** the \`do...end\` form and the \`&:method\` shorthand:

\`\`\`ruby
map_keys({ a: 1, b: 2 }) { |k| k.to_s }
# => { "a" => 1, "b" => 2 }

map_keys({ "Foo" => 1, "BAR" => 2 }, &:downcase)
# => { "foo" => 1, "bar" => 2 }
\`\`\`

The second example is the proof your signature captured the block correctly — if the method uses only \`yield\` (no \`&block\` parameter), the \`&:downcase\` at the call site has nothing to receive it and won't apply.

## Collision note

If two original keys collapse after the transform (e.g. \`"Foo"\` and \`"FOO"\` both become \`"foo"\` under \`&:downcase\`), \`Hash#transform_keys\` keeps the **last** one. The tests don't exercise this case — it's named here so the behaviour isn't surprising.`,
  starterCode: `def map_keys(hash, &block)
  # Your code here.
end
`,
  testCode: `${RB_HARNESS_HEADER}
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
${RB_HARNESS_FOOTER}`,
  hint: '`Hash` ships a method that does exactly this — its name starts with `transform_`. And once you capture the block as `&block` in the signature, you can pass it on to another block-taking method by using `&block` again in that method\'s call.',
  solution: `def map_keys(hash, &block)
  hash.transform_keys(&block)
end`,
  alternativeApproach: `Without \`Hash#transform_keys\`, an \`each_with_object\` build-up works:

\`\`\`ruby
def map_keys(hash, &block)
  hash.each_with_object({}) { |(k, v), acc| acc[block.call(k)] = v }
end
\`\`\`

Or using \`yield\` instead of \`&block\`:

\`\`\`ruby
def map_keys(hash)
  hash.transform_keys { |k| yield(k) }
end
\`\`\`

The \`yield\` version does **not** accept \`&:downcase\` as a second argument — without a \`&block\` parameter, there's nothing to receive the block-shorthand. That's the distinction the tests force: "this method accepts a block" (yield) is weaker than "this method captures the block as an object" (\`&block\`). The second lets you pass the block on to other methods cleanly.`,
}

const STEP_BLOCKS_5 = {
  id: STEP_BLOCKS_5_ID,
  lessonId: LESSON_BLOCKS_ID,
  order: 5,
  type: 'kata' as const,
  title: 'Playground: explore &:method',
  instruction: `## What this is

A playground — no test results, no pass/fail. You run code, watch the output, and form intuition. The previous kata used \`&:downcase\` to pass \`Symbol#downcase\` as a block. The shorthand works with any unary method (no arguments beyond the receiver) on each element of the collection.

## Run the starter code first

It calls \`&:upcase\`, \`&:to_s\`, \`&:next\`, \`&:zero?\`, \`&:abs\` on five different inputs. Read the output — \`String#next\` is the one that'll surprise you.

## Then experiment

Three questions to explore by changing the code:

1. **What happens if you pass a symbol that isn't a method on the receiver?** Try \`[1, 2, 3].map(&:nope)\`. Read the error carefully — Ruby's error message tells you exactly which method was missing on which class.
2. **What happens if the method requires an argument?** Try \`[1, 2].map(&:+)\`. \`Integer#+\` needs another integer; \`&:+\` only supplies the receiver. The error explains the mismatch.
3. **\`[1, 2, 3].inject(&:+)\` — what does this do and why does it work?** (Hint for JS folks: it's the same shape as \`[1,2,3].reduce((a, b) => a + b, 0)\` in JS, or \`functools.reduce(operator.add, [1,2,3])\` in Python.) \`Enumerable#inject\` passes pairs of values to the block; \`&:+\` is \`Integer#+\`, which sums them. Idiom: \`[1, 2, 3].inject(&:+) # => 6\`.

The harness has a single placeholder test that always passes. The point isn't to write tests — it's to build the muscle of "what can \`&:method\` do?".`,
  starterCode: `# Run these first:
puts ["hello", "world"].map(&:upcase).inspect
puts [1, 2, 3].map(&:to_s).inspect
puts ["a", "b", "c"].map(&:next).inspect    # String#next: "a" -> "b", "z" -> "aa"
puts [1, 4, 9].map(&:zero?).inspect
puts [1, -2, 3].map(&:abs).inspect

# Your turn — try the three questions in the instructions above.
# Read the errors carefully when you get them; Ruby's error messages
# tell you which method was missing on which class.
`,
  testCode: `${RB_HARNESS_HEADER}
_t('explored') { _eq true, true }
${RB_HARNESS_FOOTER}`,
  hint: null,
  solution: null,
  alternativeApproach: null,
  data: { kind: 'playground' as const },
}

// =============================================================================
// Exports
// =============================================================================

export const RUBY_LESSONS = [
  LESSON_0,
  LESSON_BLOCKS,
  LESSON_2,
  // Lesson 1 (the existing Object model seed) is re-positioned to order 4 as
  // part of the polyglot-first reorder. Full migration to Lesson 3 (re-tightened
  // read, safe_call + compare_views katas, playground) lands when the rename
  // pass arrives — title and katas are unchanged in this commit.
  { id: LESSON_1_ID, scrollId: COURSE_ID, order: 4, title: 'First contact with the object model' },
  LESSON_4,
  LESSON_5,
]

export const RUBY_STEPS = [
  STEP_0_1, STEP_0_2, STEP_0_3,
  STEP_BLOCKS_1, STEP_BLOCKS_2, STEP_BLOCKS_3, STEP_BLOCKS_4, STEP_BLOCKS_5,
  STEP_2_1, STEP_2_2, STEP_2_3, STEP_2_4,
  STEP_1_1, STEP_1_2, STEP_1_3, STEP_1_4,
  STEP_4_1, STEP_4_2, STEP_4_3, STEP_4_4,
  STEP_5_1, STEP_5_2, STEP_5_3, STEP_5_4,
]
