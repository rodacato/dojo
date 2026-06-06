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

export const RUBY_LESSONS = [
  { id: LESSON_1_ID, scrollId: COURSE_ID, order: 1, title: 'First contact with the object model' },
]

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

export const RUBY_STEPS = [STEP_1_1, STEP_1_2, STEP_1_3, STEP_1_4]
