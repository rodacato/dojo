import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './drizzle/schema'
import { courses, lessons, steps } from './drizzle/schema'
import {
  SQL_DEEP_CUTS_COURSE,
  SQL_DEEP_CUTS_LESSONS,
  SQL_DEEP_CUTS_STEPS,
} from './seed-courses-sql-deep-cuts'
import {
  PYTHON_COURSE_DATA,
  PYTHON_LESSONS,
  PYTHON_STEPS,
} from './seed-courses-python'

// ---------------------------------------------------------------------------
// Deterministic UUIDs for seed data
// ---------------------------------------------------------------------------
import { createHash } from 'node:crypto'

function seedUuid(name: string): string {
  const hash = createHash('sha256').update(`dojo-course-${name}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-')
}

// ---------------------------------------------------------------------------
// Course: TypeScript Fundamentals
// ---------------------------------------------------------------------------

const COURSE_ID = seedUuid('typescript-fundamentals')

const LESSON_1_ID = seedUuid('ts-lesson-1-variables')
const LESSON_2_ID = seedUuid('ts-lesson-2-arrays')
const LESSON_3_ID = seedUuid('ts-lesson-3-control')

const STEP_1_1_ID = seedUuid('ts-step-1-1-types-intro')
// Sprint 018: new read step inserted as 1.2 to teach template literals
// before the greet exercise that uses them. UUID is brand new — no
// historical progress to preserve.
const STEP_1_2_ID = seedUuid('ts-step-1-2-template-literals')
// Existing UUIDs preserved so anonymous/user progress on these exercises
// survives the renumber. Only `order` changes.
const STEP_1_3_ID = seedUuid('ts-step-1-2-greet')
const STEP_1_4_ID = seedUuid('ts-step-1-3-add')

const STEP_2_1_ID = seedUuid('ts-step-2-1-arrays-intro')
const STEP_2_2_ID = seedUuid('ts-step-2-2-sum')
const STEP_2_3_ID = seedUuid('ts-step-2-3-fullname')

const STEP_3_1_ID = seedUuid('ts-step-3-1-control-intro')
const STEP_3_2_ID = seedUuid('ts-step-3-2-fizzbuzz')
const STEP_3_3_ID = seedUuid('ts-step-3-3-palindrome')
// Sprint 018: every sub-course needs at least one challenge per §4.3 of
// docs/courses/README.md. Palindrome is bumped to challenge and a second
// synchronous stretch (memoize) is added as L3.4. Originally drafted as
// debounce but the Piston TS runtime defaults to ES5 without Promise so
// async challenges hit the runtime, not the learner.
const STEP_3_4_ID = seedUuid('ts-step-3-4-memoize')

export const COURSE_DATA = {
  id: COURSE_ID,
  slug: 'typescript-fundamentals',
  title: 'TypeScript Fundamentals',
  description: 'Learn TypeScript basics: types, functions, arrays, objects, and control flow. Write real code and run tests in the browser.',
  language: 'typescript',
  accentColor: '#3178C6',
  status: 'published' as const,
  isPublic: true,
  externalReferences: [
    { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', kind: 'docs' as const },
    { title: 'Effective TypeScript (Dan Vanderkam)', url: 'https://effectivetypescript.com/', kind: 'book' as const },
    { title: 'Total TypeScript Tips (Matt Pocock)', url: 'https://www.totaltypescript.com/tips', kind: 'article' as const },
  ],
}

const LESSONS_DATA = [
  { id: LESSON_1_ID, courseId: COURSE_ID, order: 1, title: 'Variables & Types' },
  { id: LESSON_2_ID, courseId: COURSE_ID, order: 2, title: 'Arrays & Objects' },
  { id: LESSON_3_ID, courseId: COURSE_ID, order: 3, title: 'Control Flow' },
]

// ---------------------------------------------------------------------------
// Shared mini test harness for Piston-executed TypeScript/JavaScript steps.
//
// Accumulates results into _tests and emits two channels at the end:
//   - legacy: ✓/✗ lines on stdout (kept so older UI still parses something)
//   - new:    `__DOJO_RESULT__ <json>` line the CoursePlayerPage parser trusts
// The harness never throws — the final line is the single source of truth.
// expect() helpers are intentionally tiny; each step concatenates its own
// `test(...)` calls between TS_HARNESS_HEADER and TS_HARNESS_FOOTER.
// ---------------------------------------------------------------------------
const TS_HARNESS_HEADER = `// mini test runner
const _tests: Array<{ name: string; passed: boolean; message?: string }> = []
function test(name: string, fn: () => void) {
  try { fn(); _tests.push({ name, passed: true }) }
  catch (e) { _tests.push({ name, passed: false, message: e instanceof Error ? e.message : String(e) }) }
}
function expect(actual: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
    toBeCloseTo: (expected: number, digits: number = 2) => {
      const a = Number(actual)
      if (Math.abs(a - expected) > Math.pow(10, -digits) / 2)
        throw new Error('expected ' + expected + ' (±' + digits + ' digits) but got ' + a)
    },
    toEqual: (expected: unknown) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
  }
}
`

const TS_HARNESS_FOOTER = `
for (const r of _tests) console.log(r.passed ? '✓ ' + r.name : '✗ ' + r.name + (r.message ? ': ' + r.message : ''))
const _ok = _tests.every(r => r.passed)
console.log('__DOJO_RESULT__ ' + JSON.stringify({ ok: _ok, tests: _tests }))
`

export const STEPS_DATA = [
  // ── Lesson 1: Variables & Types ─────────────────────────────────
  {
    id: STEP_1_1_ID,
    lessonId: LESSON_1_ID,
    order: 1,
    type: 'read' as const,
    title: 'Variables & Types in TypeScript',
    instruction: `TypeScript adds **type annotations** to JavaScript, catching bugs before your code runs.

## Basic types

\`\`\`typescript
const name: string = "Alice"
const age: number = 30
const active: boolean = true
\`\`\`

## \`let\` vs \`const\`

- Use \`const\` for values that never change
- Use \`let\` for values that will be reassigned

## Function types

\`\`\`typescript
function greet(name: string): string {
  return "Hello, " + name + "!"
}
\`\`\`

The \`: string\` after the parameter is the **parameter type**. The \`: string\` after the parentheses is the **return type**.

The next step covers template literals — a cleaner way to build strings — before you write your first function.`,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: STEP_1_2_ID,
    lessonId: LESSON_1_ID,
    order: 2,
    type: 'read' as const,
    title: 'Template literals',
    instruction: `Concatenating strings with \`+\` works but gets hard to read. Backtick-delimited **template literals** let you embed expressions inline:

\`\`\`typescript
const name = "World"
const greeting = \`Hello, \${name}!\`
// "Hello, World!"
\`\`\`

The \`\${...}\` syntax accepts any expression — a variable, a function call, an arithmetic expression — and converts the result to a string.

\`\`\`typescript
const a = 7, b = 3
\`\${a} + \${b} = \${a + b}\` // "7 + 3 = 10"
\`\`\`

Template literals also preserve newlines, so multi-line strings stop needing \`\\n\` escapes.

You'll use \`\${...}\` in the next step to assemble the greeting.`,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: STEP_1_3_ID,
    lessonId: LESSON_1_ID,
    order: 3,
    type: 'exercise' as const,
    title: 'Write a greet function',
    instruction: `Write a function \`greet\` that takes a \`name\` (string) and returns \`"Hello, <name>!"\`.

**Examples:**
\`\`\`typescript
greet("World")      // "Hello, World!"
greet("TypeScript") // "Hello, TypeScript!"
\`\`\``,
    starterCode: `function greet(name: string): string {
  // Your code here
}`,
    testCode: `${TS_HARNESS_HEADER}
test('greets by name', () => { expect(greet('World')).toBe('Hello, World!') })
test('handles empty string', () => { expect(greet('')).toBe('Hello, !') })
test("handles special characters", () => { expect(greet("O'Brien")).toBe("Hello, O'Brien!") })
test('handles spaces in name', () => { expect(greet('Jane Doe')).toBe('Hello, Jane Doe!') })
test('returns a string', () => { expect(typeof greet('test')).toBe('string') })
${TS_HARNESS_FOOTER}`,
    hint: 'Use a template literal: `Hello, ${name}!`',
    solution: `function greet(name: string): string {
  return \`Hello, \${name}!\`
}`,
  },
  {
    id: STEP_1_4_ID,
    lessonId: LESSON_1_ID,
    order: 4,
    type: 'exercise' as const,
    title: 'Write an add function',
    instruction: `Write a function \`add\` that takes two numbers and returns their sum.

**Examples:**
\`\`\`typescript
add(2, 3)  // 5
add(-1, 1) // 0
\`\`\``,
    starterCode: `function add(a: number, b: number): number {
  // Your code here
}`,
    testCode: `${TS_HARNESS_HEADER}
test('adds positive numbers', () => { expect(add(2, 3)).toBe(5) })
test('adds negative numbers', () => { expect(add(-1, -2)).toBe(-3) })
test('adds zero', () => { expect(add(0, 5)).toBe(5) })
test('handles large numbers', () => { expect(add(1000000, 2000000)).toBe(3000000) })
test('handles decimals', () => { expect(add(0.1, 0.2)).toBeCloseTo(0.3) })
${TS_HARNESS_FOOTER}`,
    hint: 'Return `a + b`.',
    solution: `function add(a: number, b: number): number {
  return a + b
}`,
  },

  // ── Lesson 2: Arrays & Objects ──────────────────────────────────
  {
    id: STEP_2_1_ID,
    lessonId: LESSON_2_ID,
    order: 1,
    type: 'read' as const,
    title: 'Arrays & Objects',
    instruction: `## Typed arrays

\`\`\`typescript
const numbers: number[] = [1, 2, 3]
const names: string[] = ["Alice", "Bob"]
\`\`\`

## Common array methods

\`\`\`typescript
numbers.map(n => n * 2)        // [2, 4, 6]
numbers.filter(n => n > 1)     // [2, 3]
numbers.reduce((sum, n) => sum + n, 0) // 6
\`\`\`

## Object types with interfaces

\`\`\`typescript
interface Person {
  first: string
  last: string
  age?: number  // optional property
}

const user: Person = { first: "Alice", last: "Smith" }
\`\`\`

The \`?\` makes a property **optional** — it can be present or absent.`,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: STEP_2_2_ID,
    lessonId: LESSON_2_ID,
    order: 2,
    type: 'exercise' as const,
    title: 'Sum an array',
    instruction: `Write a function \`sum\` that takes an array of numbers and returns their total.

**Examples:**
\`\`\`typescript
sum([1, 2, 3]) // 6
sum([])        // 0
\`\`\``,
    starterCode: `function sum(numbers: number[]): number {
  // Your code here
}`,
    testCode: `${TS_HARNESS_HEADER}
test('sums positive numbers', () => { expect(sum([1, 2, 3])).toBe(6) })
test('returns 0 for empty array', () => { expect(sum([])).toBe(0) })
test('handles single element', () => { expect(sum([42])).toBe(42) })
test('handles negative numbers', () => { expect(sum([-1, 1, -2, 2])).toBe(0) })
test('handles large arrays', () => {
  const arr: number[] = []
  for (let i = 1; i <= 100; i++) arr.push(i)
  expect(sum(arr)).toBe(5050)
})
${TS_HARNESS_FOOTER}`,
    hint: 'Use `.reduce((acc, n) => acc + n, 0)` or a simple for loop.',
    solution: `function sum(numbers: number[]): number {
  return numbers.reduce((acc, n) => acc + n, 0)
}`,
  },
  {
    id: STEP_2_3_ID,
    lessonId: LESSON_2_ID,
    order: 3,
    type: 'exercise' as const,
    title: 'Get full name',
    instruction: `Write a function \`getFullName\` that takes a person object with \`first\` and \`last\` properties and returns their full name.

**Example:**
\`\`\`typescript
getFullName({ first: "Jane", last: "Doe" }) // "Jane Doe"
\`\`\``,
    starterCode: `function getFullName(person: { first: string; last: string }): string {
  // Your code here
}`,
    testCode: `${TS_HARNESS_HEADER}
test('combines first and last', () => { expect(getFullName({ first: 'Jane', last: 'Doe' })).toBe('Jane Doe') })
test('handles single character names', () => { expect(getFullName({ first: 'J', last: 'D' })).toBe('J D') })
test('handles hyphenated names', () => { expect(getFullName({ first: 'Mary-Jane', last: 'Watson-Parker' })).toBe('Mary-Jane Watson-Parker') })
test('preserves casing', () => { expect(getFullName({ first: 'mcdonald', last: 'DUCK' })).toBe('mcdonald DUCK') })
test('returns a string', () => { expect(typeof getFullName({ first: 'a', last: 'b' })).toBe('string') })
${TS_HARNESS_FOOTER}`,
    hint: 'Use a template literal: `${person.first} ${person.last}`.',
    solution: `function getFullName(person: { first: string; last: string }): string {
  return \`\${person.first} \${person.last}\`
}`,
  },

  // ── Lesson 3: Control Flow ──────────────────────────────────────
  {
    id: STEP_3_1_ID,
    lessonId: LESSON_3_ID,
    order: 1,
    type: 'read' as const,
    title: 'Control Flow',
    instruction: `## if/else

\`\`\`typescript
function describe(n: number): string {
  if (n > 0) return "positive"
  if (n < 0) return "negative"
  return "zero"
}
\`\`\`

## Ternary operator

\`\`\`typescript
const label = age >= 18 ? "adult" : "minor"
\`\`\`

## Early returns

Early returns reduce nesting and make code clearer:

\`\`\`typescript
function process(input: string | null): string {
  if (!input) return "No input"
  if (input.length > 100) return "Too long"
  return input.toUpperCase()
}
\`\`\`

## Modulo operator

The \`%\` operator returns the remainder of division:

\`\`\`typescript
10 % 3  // 1
15 % 5  // 0 (divisible)
\`\`\``,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: STEP_3_2_ID,
    lessonId: LESSON_3_ID,
    order: 2,
    type: 'exercise' as const,
    title: 'FizzBuzz',
    instruction: `Write a function \`fizzBuzz\` that takes a number and returns:
- \`"FizzBuzz"\` if divisible by both 3 and 5
- \`"Fizz"\` if divisible by 3
- \`"Buzz"\` if divisible by 5
- The number as a string otherwise

**Examples:**
\`\`\`typescript
fizzBuzz(15) // "FizzBuzz"
fizzBuzz(3)  // "Fizz"
fizzBuzz(5)  // "Buzz"
fizzBuzz(7)  // "7"
\`\`\``,
    starterCode: `function fizzBuzz(n: number): string {
  // Your code here
}`,
    testCode: `${TS_HARNESS_HEADER}
test('returns FizzBuzz for 15', () => { expect(fizzBuzz(15)).toBe('FizzBuzz') })
test('returns Fizz for 3', () => { expect(fizzBuzz(3)).toBe('Fizz') })
test('returns Buzz for 5', () => { expect(fizzBuzz(5)).toBe('Buzz') })
test('returns number as string for 7', () => { expect(fizzBuzz(7)).toBe('7') })
test('returns Fizz for 9', () => { expect(fizzBuzz(9)).toBe('Fizz') })
test('returns FizzBuzz for 30', () => { expect(fizzBuzz(30)).toBe('FizzBuzz') })
test('returns 1 for 1', () => { expect(fizzBuzz(1)).toBe('1') })
${TS_HARNESS_FOOTER}`,
    hint: 'Check divisibility by 15 first (both 3 and 5), then by 3, then by 5. Use `n % 3 === 0`.',
    solution: `function fizzBuzz(n: number): string {
  if (n % 15 === 0) return 'FizzBuzz'
  if (n % 3 === 0) return 'Fizz'
  if (n % 5 === 0) return 'Buzz'
  return String(n)
}`,
  },
  {
    id: STEP_3_3_ID,
    lessonId: LESSON_3_ID,
    order: 3,
    type: 'challenge' as const,
    title: 'Palindrome checker',
    instruction: `Write a function \`isPalindrome\` that checks if a string reads the same forwards and backwards. **Ignore case and non-alphanumeric characters.**

**Examples:**
\`\`\`typescript
isPalindrome("racecar")                            // true
isPalindrome("A man, a plan, a canal: Panama")    // true
isPalindrome("hello")                              // false
\`\`\``,
    starterCode: `function isPalindrome(s: string): boolean {
  // Your code here
}`,
    testCode: `${TS_HARNESS_HEADER}
test('detects simple palindrome', () => { expect(isPalindrome('racecar')).toBe(true) })
test('ignores case', () => { expect(isPalindrome('RaceCar')).toBe(true) })
test('ignores non-alphanumeric', () => { expect(isPalindrome('A man, a plan, a canal: Panama')).toBe(true) })
test('rejects non-palindromes', () => { expect(isPalindrome('hello')).toBe(false) })
test('handles empty string', () => { expect(isPalindrome('')).toBe(true) })
test('handles single character', () => { expect(isPalindrome('a')).toBe(true) })
test('handles numbers in string', () => { expect(isPalindrome('12321')).toBe(true) })
${TS_HARNESS_FOOTER}`,
    hint: 'Three steps in order: normalize (lowercase + strip non-alphanumeric), reverse, compare to the normalized original.',
    solution: `function isPalindrome(s: string): boolean {
  const normalized = s.toLowerCase().replace(/[^a-z0-9]/g, '')
  return normalized === normalized.split('').reverse().join('')
}`,
  },
  {
    id: STEP_3_4_ID,
    lessonId: LESSON_3_ID,
    order: 4,
    type: 'challenge' as const,
    title: 'Implement memoize',
    instruction: `Write \`memoize(fn)\` that returns a function with the **same shape** as \`fn\`, but caches results. Calling the returned function with the same argument again should return the cached value instead of invoking \`fn\` a second time.

**Behavior to verify:**
- Same input ⇒ same output, exactly as the underlying \`fn\` would return
- The underlying \`fn\` is only called once per distinct input
- Different inputs are cached independently

For this exercise, treat \`fn\` as a unary function whose argument is JSON-serialisable (use \`JSON.stringify\` to build the cache key).`,
    starterCode: `function memoize<A, R>(fn: (arg: A) => R): (arg: A) => R {
  // Your code here
}`,
    testCode: `${TS_HARNESS_HEADER}
let calls = 0
function slowSquare(n: number): number {
  calls++
  return n * n
}

const fast = memoize(slowSquare)

test('same input returns the same value', () => {
  expect(fast(4)).toBe(16)
  expect(fast(4)).toBe(16)
})
test('underlying fn is called only once per distinct input', () => {
  calls = 0
  const m = memoize(slowSquare)
  m(7); m(7); m(7)
  expect(calls).toBe(1)
})
test('different inputs are cached independently', () => {
  calls = 0
  const m = memoize(slowSquare)
  m(2); m(3); m(2); m(3)
  expect(calls).toBe(2)
})
test('works with object arguments via JSON key', () => {
  const m = memoize((p: { a: number; b: number }) => p.a + p.b)
  expect(m({ a: 1, b: 2 })).toBe(3)
  expect(m({ a: 1, b: 2 })).toBe(3)
})
${TS_HARNESS_FOOTER}`,
    hint: 'Hold a plain object keyed by the stringified argument. On call: if the key is missing, run `fn` and store the result. Always return the stored value.',
    solution: `function memoize<A, R>(fn: (arg: A) => R): (arg: A) => R {
  const cache: Record<string, R> = {}
  return (arg: A): R => {
    const key = JSON.stringify(arg)
    if (!(key in cache)) {
      cache[key] = fn(arg)
    }
    return cache[key]
  }
}`,
  },
]

// ---------------------------------------------------------------------------
// Course: JavaScript DOM Fundamentals
// ---------------------------------------------------------------------------

const DOM_COURSE_ID = seedUuid('javascript-dom-fundamentals')

const DOM_LESSON_1_ID = seedUuid('dom-lesson-1-selecting')
const DOM_LESSON_2_ID = seedUuid('dom-lesson-2-modifying')
const DOM_LESSON_3_ID = seedUuid('dom-lesson-3-events')

const DOM_STEP_1_1_ID = seedUuid('dom-step-1-1-intro')
const DOM_STEP_1_2_ID = seedUuid('dom-step-1-2-gettitle')
const DOM_STEP_1_3_ID = seedUuid('dom-step-1-3-countitems')

const DOM_STEP_2_1_ID = seedUuid('dom-step-2-1-intro')
const DOM_STEP_2_2_ID = seedUuid('dom-step-2-2-updatetext')
const DOM_STEP_2_3_ID = seedUuid('dom-step-2-3-toggleclass')

const DOM_STEP_3_1_ID = seedUuid('dom-step-3-1-intro')
const DOM_STEP_3_2_ID = seedUuid('dom-step-3-2-counter')
const DOM_STEP_3_3_ID = seedUuid('dom-step-3-3-delegation')

// DOM testCode mini runner (plain JS, no TypeScript — runs in iframe).
// Accumulates structured per-test results in _tests and relays them through
// postMessage so the iframeSandboxRunner can surface stdout/stderr +
// ExecuteStepResponse with per-test messages (same contract as Piston runs).
const DOM_RUNNER = `const _tests = []
function test(name, fn) {
  try { fn(); _tests.push({ name: name, passed: true }) }
  catch (e) {
    _tests.push({
      name: name,
      passed: false,
      message: e instanceof Error ? e.message : String(e),
    })
  }
}
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
    toBeTruthy: () => { if (!actual) throw new Error('expected truthy, got ' + JSON.stringify(actual)) },
    toBeFalsy: () => { if (actual) throw new Error('expected falsy, got ' + JSON.stringify(actual)) },
    toContain: (str) => {
      if (!String(actual).includes(String(str)))
        throw new Error('"' + actual + '" does not contain "' + str + '"')
    },
  }
}`

const DOM_RUNNER_END = `const _log = _tests.map(t => t.passed ? '\u2713 ' + t.name : '\u2717 ' + t.name + (t.message ? ': ' + t.message : ''))
const _failed = _tests.some(t => !t.passed)
window.parent.postMessage({ type: 'test-results', log: _log, failed: _failed, tests: _tests }, '*')`

export const DOM_COURSE_DATA = {
  id: DOM_COURSE_ID,
  slug: 'javascript-dom-fundamentals',
  title: 'JavaScript DOM Fundamentals',
  description: 'Learn to select, modify, and react to the DOM with vanilla JavaScript. No frameworks — just the browser APIs every developer needs to know.',
  language: 'javascript-dom',
  accentColor: '#F7DF1E',
  status: 'published' as const,
  isPublic: true,
  externalReferences: [
    { title: 'MDN: Introduction to the DOM', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', kind: 'docs' as const },
    { title: 'MDN: Event delegation', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_delegation', kind: 'docs' as const },
    { title: "You Don't Know JS Yet: Objects & Classes", url: 'https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/objects-classes/README.md', kind: 'book' as const },
  ],
}

const DOM_LESSONS_DATA = [
  { id: DOM_LESSON_1_ID, courseId: DOM_COURSE_ID, order: 1, title: 'Selecting Elements' },
  { id: DOM_LESSON_2_ID, courseId: DOM_COURSE_ID, order: 2, title: 'Modifying Elements' },
  { id: DOM_LESSON_3_ID, courseId: DOM_COURSE_ID, order: 3, title: 'Events' },
]

export const DOM_STEPS_DATA = [
  // ── Lesson 1: Selecting Elements ────────────────────────────────
  {
    id: DOM_STEP_1_1_ID,
    lessonId: DOM_LESSON_1_ID,
    order: 1,
    type: 'read' as const,
    title: 'Selecting Elements',
    instruction: `The browser gives you a few ways to find elements on the page:

\`\`\`javascript
// By CSS selector — most versatile
const btn = document.querySelector('#submit-btn')
const cards = document.querySelectorAll('.card')

// By ID — slightly faster, returns one element
const header = document.getElementById('main-header')
\`\`\`

**\`querySelector\`** returns the first match (or \`null\` if not found).

**\`querySelectorAll\`** returns a \`NodeList\` of all matches — like an array, but you need \`Array.from()\` to use methods like \`.map()\`.

**\`getElementById\`** is the older API, slightly faster, but limited to a single ID lookup. You'll see it everywhere in production code, so it's worth recognising. For new code, prefer \`querySelector('#x')\` so one mental model covers ID, class, attribute, and complex selectors uniformly.

The CSS selector syntax is the same you use in stylesheets: class (\`.card\`), ID (\`#title\`), attribute (\`[data-id]\`), descendant (\`.card h2\`), and more.`,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: DOM_STEP_1_2_ID,
    lessonId: DOM_LESSON_1_ID,
    order: 2,
    type: 'exercise' as const,
    title: "Read an element's text",
    instruction: `Write a function \`getTitle\` that finds the \`<h1>\` element on the page and returns its text content.

**Example:**
\`\`\`javascript
// Given this HTML:
// <h1 id="page-title">Hello Dojo</h1>

getTitle() // "Hello Dojo"
\`\`\``,
    starterCode: `function getTitle() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = '<h1 id="page-title">Hello Dojo</h1>'

test('returns the h1 text', () => {
  expect(getTitle()).toBe('Hello Dojo')
})
test('returns a string', () => {
  expect(typeof getTitle()).toBe('string')
})
test('works with different text content', () => {
  document.querySelector('#page-title').textContent = 'Welcome'
  expect(getTitle()).toBe('Welcome')
})

${DOM_RUNNER_END}`,
    hint: 'Use `document.querySelector("h1")` or `document.getElementById("page-title")`, then read `.textContent`.',
    solution: `function getTitle() {
  return document.querySelector('h1').textContent
}`,
  },
  {
    id: DOM_STEP_1_3_ID,
    lessonId: DOM_LESSON_1_ID,
    order: 3,
    type: 'exercise' as const,
    title: 'Count list items',
    instruction: `Write a function \`countItems\` that counts how many \`<li>\` elements are inside \`#todo-list\`.

**Example:**
\`\`\`javascript
// Given this HTML:
// <ul id="todo-list">
//   <li>Buy milk</li>
//   <li>Write code</li>
//   <li>Ship it</li>
// </ul>

countItems() // 3
\`\`\``,
    starterCode: `function countItems() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = \`
  <ul id="todo-list">
    <li>Buy milk</li>
    <li>Write code</li>
    <li>Ship it</li>
  </ul>
\`

test('returns 3 for a list with 3 items', () => {
  expect(countItems()).toBe(3)
})
test('returns 0 for an empty list', () => {
  document.body.innerHTML = '<ul id="todo-list"></ul>'
  expect(countItems()).toBe(0)
})
test('returns 1 for a single item', () => {
  document.body.innerHTML = '<ul id="todo-list"><li>One</li></ul>'
  expect(countItems()).toBe(1)
})

${DOM_RUNNER_END}`,
    hint: 'Use `document.querySelectorAll("#todo-list li").length`.',
    solution: `function countItems() {
  return document.querySelectorAll('#todo-list li').length
}`,
  },

  // ── Lesson 2: Modifying Elements ────────────────────────────────
  {
    id: DOM_STEP_2_1_ID,
    lessonId: DOM_LESSON_2_ID,
    order: 1,
    type: 'read' as const,
    title: 'Modifying Elements',
    instruction: `Once you have an element, you can change almost anything about it:

\`\`\`javascript
const el = document.querySelector('#title')

// Text content (safe — no HTML injection risk)
el.textContent = 'New title'

// CSS classes
el.classList.add('active')
el.classList.remove('hidden')
el.classList.toggle('selected')
el.classList.contains('active') // → true/false

// Attributes
el.setAttribute('data-id', '42')
el.getAttribute('data-id') // → '42'
\`\`\`

**Prefer \`textContent\` over \`innerHTML\`** when inserting plain text. \`innerHTML\` parses HTML and can introduce XSS vulnerabilities if the content comes from user input.`,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: DOM_STEP_2_2_ID,
    lessonId: DOM_LESSON_2_ID,
    order: 2,
    type: 'exercise' as const,
    title: 'Update a message',
    instruction: `Write a function \`updateMessage\` that changes the text inside \`#message\` to \`"Updated"\`.

**Example:**
\`\`\`javascript
// Before: <p id="message">Original</p>
updateMessage()
// After:  <p id="message">Updated</p>
\`\`\``,
    starterCode: `function updateMessage() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = '<p id="message">Original</p>'
updateMessage()

test('sets textContent to "Updated"', () => {
  expect(document.querySelector('#message').textContent).toBe('Updated')
})
test('element still exists', () => {
  expect(document.querySelector('#message')).toBeTruthy()
})

${DOM_RUNNER_END}`,
    hint: 'Get the element with `querySelector("#message")`, then set its `.textContent`.',
    solution: `function updateMessage() {
  document.querySelector('#message').textContent = 'Updated'
}`,
  },
  {
    id: DOM_STEP_2_3_ID,
    lessonId: DOM_LESSON_2_ID,
    order: 3,
    type: 'exercise' as const,
    title: 'Activate a card',
    instruction: `Write a function \`activateCard\` that adds the class \`active\` to \`#card\`.

If the element already has the class, do nothing (idempotent).

**Example:**
\`\`\`javascript
// Before: <div id="card"></div>
activateCard()
// After:  <div id="card" class="active"></div>
\`\`\``,
    starterCode: `function activateCard() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = '<div id="card"></div>'
activateCard()

test('card has class "active" after calling activateCard()', () => {
  expect(document.querySelector('#card').classList.contains('active')).toBe(true)
})
test('calling it twice does not duplicate the class', () => {
  activateCard()
  const count = Array.from(document.querySelector('#card').classList).filter(c => c === 'active').length
  expect(count).toBe(1)
})

${DOM_RUNNER_END}`,
    hint: 'Use `el.classList.add("active")` — it is already idempotent (adding an existing class does nothing).',
    solution: `function activateCard() {
  document.querySelector('#card').classList.add('active')
}`,
  },

  // ── Lesson 3: Events ────────────────────────────────────────────
  {
    id: DOM_STEP_3_1_ID,
    lessonId: DOM_LESSON_3_ID,
    order: 1,
    type: 'read' as const,
    title: 'Events',
    instruction: `User interactions fire events. You listen for them with \`addEventListener\`:

\`\`\`javascript
const btn = document.querySelector('#btn')

btn.addEventListener('click', (event) => {
  console.log('clicked!', event.target)
})
\`\`\`

## Event delegation

Instead of attaching a listener to every child, attach one to the parent:

\`\`\`javascript
document.querySelector('#list').addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    e.target.classList.toggle('done')
  }
})
\`\`\`

This works because events **bubble up** — a click on an \`<li>\` also fires on its parent \`<ul>\` and all the way up to \`document\`.

## \`e.target\` vs \`e.currentTarget\`

- **\`e.target\`** — the exact element that was clicked
- **\`e.currentTarget\`** — the element the listener is attached to

If your \`<li>\` contains a \`<strong>\`, clicking on the text fires \`e.target = strong\`, not \`li\`. Use \`e.target.closest("li")\` to always get the \`<li>\` ancestor.`,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: DOM_STEP_3_2_ID,
    lessonId: DOM_LESSON_3_ID,
    order: 2,
    type: 'exercise' as const,
    title: 'Click counter',
    instruction: `Write a function \`setupCounter\` that attaches a click listener to \`#btn\`. Each click should increment the number shown in \`#counter\`.

**Example:**
\`\`\`javascript
// Given: <button id="btn">Click</button> <span id="counter">0</span>
setupCounter()
// user clicks btn → counter shows "1"
// user clicks btn → counter shows "2"
\`\`\``,
    starterCode: `function setupCounter() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = \`
  <button id="btn">Click me</button>
  <span id="counter">0</span>
\`
setupCounter()

const btn = document.querySelector('#btn')
const counter = document.querySelector('#counter')

test('counter starts at 0', () => {
  expect(counter.textContent).toBe('0')
})
test('counter shows 1 after one click', () => {
  btn.click()
  expect(counter.textContent).toBe('1')
})
test('counter shows 2 after two clicks', () => {
  btn.click()
  expect(counter.textContent).toBe('2')
})

${DOM_RUNNER_END}`,
    hint: 'In the listener, read `+counter.textContent` to get the current number, add 1, and write it back.',
    solution: `function setupCounter() {
  const btn = document.querySelector('#btn')
  const counter = document.querySelector('#counter')
  btn.addEventListener('click', () => {
    counter.textContent = String(+counter.textContent + 1)
  })
}`,
  },
  {
    id: DOM_STEP_3_3_ID,
    lessonId: DOM_LESSON_3_ID,
    order: 3,
    type: 'challenge' as const,
    title: 'Fix the event delegation bug',
    instruction: `The \`setupTodoList\` function below uses event delegation — one listener on \`<ul>\` handles clicks on all \`<li>\` items and toggles a \`done\` class.

**It has a subtle bug.** Click on the bold text inside an \`<li>\` and nothing happens. Click on the empty space around the text and it works.

Fix \`setupTodoList\` so that clicking anywhere inside an \`<li>\` correctly toggles \`done\` on the \`<li>\` itself.`,
    starterCode: `function setupTodoList() {
  const list = document.querySelector('#todo-list')
  list.addEventListener('click', (e) => {
    // BUG: e.target may be a child element, not the <li>
    if (e.target.tagName === 'LI') {
      e.target.classList.toggle('done')
    }
  })
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = \`
  <ul id="todo-list">
    <li><strong>Buy milk</strong></li>
    <li><strong>Write code</strong></li>
  </ul>
\`
setupTodoList()

const items = document.querySelectorAll('li')
const strong0 = items[0].querySelector('strong')

test('clicking the li itself toggles done', () => {
  items[1].click()
  expect(items[1].classList.contains('done')).toBe(true)
})
test('clicking a child element inside li also toggles done on the li', () => {
  strong0.click()
  expect(items[0].classList.contains('done')).toBe(true)
})
test('clicking again toggles done off', () => {
  items[1].click()
  expect(items[1].classList.contains('done')).toBe(false)
})

${DOM_RUNNER_END}`,
    hint: 'When the click lands on a descendant of the `<li>`, what does that make `e.target`? Look at the DOM tree above the click — find the right ancestor before toggling.',
    solution: `function setupTodoList() {
  const list = document.querySelector('#todo-list')
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li')
    if (li && list.contains(li)) {
      li.classList.toggle('done')
    }
  })
}`,
  },
]

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

type CourseSeed = {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  status: 'draft' | 'published'
  isPublic?: boolean
  externalReferences?: Array<{ title: string; url: string; kind: 'book' | 'docs' | 'talk' | 'article' }>
}

type LessonSeed = { id: string; courseId: string; order: number; title: string }
type StepSeed = {
  id: string
  lessonId: string
  order: number
  type: 'read' | 'code' | 'exercise' | 'challenge'
  // Optional in the type because Sprint 018 backfills incrementally —
  // every new step authored from now on must set it.
  title?: string | null
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
  solution?: string | null
  alternativeApproach?: string | null
}

type CourseConfig = {
  courseData: CourseSeed
  lessonsData: LessonSeed[]
  stepsData: StepSeed[]
}

async function seedOneCourse(
  db: ReturnType<typeof drizzle>,
  { courseData, lessonsData, stepsData }: CourseConfig,
) {
  await db
    .insert(courses)
    .values({ ...courseData, isPublic: courseData.isPublic ?? false })
    .onConflictDoUpdate({
      target: courses.slug,
      set: {
        title: courseData.title,
        description: courseData.description,
        language: courseData.language,
        accentColor: courseData.accentColor,
        status: courseData.status,
        isPublic: courseData.isPublic ?? false,
        externalReferences: courseData.externalReferences ?? [],
      },
    })
  console.log(`  ✓ Course: ${courseData.title}`)

  // Lessons: upsert by id so title/order edits propagate. Deletions still
  // require a wipe (see POST /admin/courses/:id/wipe) because re-seeding
  // never removes orphan lessons.
  for (const lesson of lessonsData) {
    await db
      .insert(lessons)
      .values(lesson)
      .onConflictDoUpdate({
        target: lessons.id,
        set: { title: lesson.title, order: lesson.order },
      })
  }
  console.log(`  ✓ Lessons: ${lessonsData.length}`)

  // Steps: upsert by id. type, order, title and solution propagate too so
  // edits to those fields land without a wipe.
  for (const step of stepsData) {
    await db
      .insert(steps)
      .values({
        ...step,
        title: step.title ?? null,
        solution: step.solution ?? null,
        alternativeApproach: step.alternativeApproach ?? null,
      })
      .onConflictDoUpdate({
        target: steps.id,
        set: {
          type: step.type,
          order: step.order,
          title: step.title ?? null,
          instruction: step.instruction,
          starterCode: step.starterCode,
          testCode: step.testCode,
          hint: step.hint,
          solution: step.solution ?? null,
          alternativeApproach: step.alternativeApproach ?? null,
        },
      })
  }
  console.log(`  ✓ Steps: ${stepsData.length}`)
}

export interface SeedReport {
  seeded: Array<{ slug: string; title: string; lessonCount: number; stepCount: number }>
}

/**
 * Seed every known course into the provided drizzle instance.
 * Idempotent — reuses onConflictDoUpdate on (slug) and (step.id).
 */
export async function seedAllCourses(db: ReturnType<typeof drizzle>): Promise<SeedReport> {
  const configs: CourseConfig[] = [
    { courseData: COURSE_DATA, lessonsData: LESSONS_DATA, stepsData: STEPS_DATA },
    { courseData: DOM_COURSE_DATA, lessonsData: DOM_LESSONS_DATA, stepsData: DOM_STEPS_DATA },
    {
      courseData: SQL_DEEP_CUTS_COURSE,
      lessonsData: SQL_DEEP_CUTS_LESSONS,
      stepsData: SQL_DEEP_CUTS_STEPS,
    },
    {
      courseData: PYTHON_COURSE_DATA,
      lessonsData: PYTHON_LESSONS,
      stepsData: PYTHON_STEPS,
    },
  ]

  const report: SeedReport = { seeded: [] }
  for (const c of configs) {
    await seedOneCourse(db, c)
    report.seeded.push({
      slug: c.courseData.slug,
      title: c.courseData.title,
      lessonCount: c.lessonsData.length,
      stepCount: c.stepsData.length,
    })
  }
  return report
}

async function seedCoursesCli() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL not set')

  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql, { schema })

  console.log('Seeding courses...')
  await seedAllCourses(db)
  console.log('Done.')
  await sql.end()
}

// Only run when invoked directly (tsx src/.../seed-courses.ts), not when imported.
if (require.main === module) {
  seedCoursesCli().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
}
