import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './drizzle/schema'
import { courses, lessons, steps } from './drizzle/schema'
import {
  SQL_DEEP_CUTS_COURSE,
  SQL_DEEP_CUTS_LESSONS,
  SQL_DEEP_CUTS_STEPS,
} from './seed-courses-sql-deep-cuts'

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
const STEP_1_2_ID = seedUuid('ts-step-1-2-greet')
const STEP_1_3_ID = seedUuid('ts-step-1-3-add')

const STEP_2_1_ID = seedUuid('ts-step-2-1-arrays-intro')
const STEP_2_2_ID = seedUuid('ts-step-2-2-sum')
const STEP_2_3_ID = seedUuid('ts-step-2-3-fullname')

const STEP_3_1_ID = seedUuid('ts-step-3-1-control-intro')
const STEP_3_2_ID = seedUuid('ts-step-3-2-fizzbuzz')
const STEP_3_3_ID = seedUuid('ts-step-3-3-palindrome')

const COURSE_DATA = {
  id: COURSE_ID,
  slug: 'typescript-fundamentals',
  title: 'TypeScript Fundamentals',
  description: 'Learn TypeScript basics: types, functions, arrays, objects, and control flow. Write real code and run tests in the browser.',
  language: 'typescript',
  accentColor: '#3178C6',
  status: 'published' as const,
}

const LESSONS_DATA = [
  { id: LESSON_1_ID, courseId: COURSE_ID, order: 1, title: 'Variables & Types' },
  { id: LESSON_2_ID, courseId: COURSE_ID, order: 2, title: 'Arrays & Objects' },
  { id: LESSON_3_ID, courseId: COURSE_ID, order: 3, title: 'Control Flow' },
]

const STEPS_DATA = [
  // ── Lesson 1: Variables & Types ─────────────────────────────────
  {
    id: STEP_1_1_ID,
    lessonId: LESSON_1_ID,
    order: 1,
    type: 'read' as const,
    instruction: `# Variables & Types in TypeScript

TypeScript adds **type annotations** to JavaScript, catching bugs before your code runs.

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
  return \`Hello, \${name}!\`
}
\`\`\`

The \`: string\` after the parameter is the **parameter type**. The \`: string\` after the parentheses is the **return type**.

Ready to try it? Move to the next step.`,
    starterCode: null,
    testCode: null,
    hint: null,
  },
  {
    id: STEP_1_2_ID,
    lessonId: LESSON_1_ID,
    order: 2,
    type: 'challenge' as const,
    instruction: `# Exercise: Write a greet function

Write a function \`greet\` that takes a \`name\` (string) and returns \`"Hello, <name>!"\`.

**Example:**
\`\`\`typescript
greet("World") // "Hello, World!"
greet("TypeScript") // "Hello, TypeScript!"
\`\`\``,
    starterCode: `function greet(name: string): string {
  // Your code here
}`,
    testCode: `// mini test runner
let _fail = false
const _log: string[] = []
function test(name: string, fn: () => void) {
  try { fn(); _log.push('✓ ' + name) }
  catch (e) { _log.push('✗ ' + name + ': ' + (e instanceof Error ? e.message : String(e))); _fail = true }
}
function expect(actual: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
  }
}

test('greets by name', () => { expect(greet('World')).toBe('Hello, World!') })
test('handles empty string', () => { expect(greet('')).toBe('Hello, !') })
test("handles special characters", () => { expect(greet("O'Brien")).toBe("Hello, O'Brien!") })
test('handles spaces in name', () => { expect(greet('Jane Doe')).toBe('Hello, Jane Doe!') })
test('returns a string', () => { expect(typeof greet('test')).toBe('string') })

for (const r of _log) console.log(r)
if (_fail) throw new Error('Tests failed')`,
    hint: 'Use a template literal: `Hello, ${name}!`',
  },
  {
    id: STEP_1_3_ID,
    lessonId: LESSON_1_ID,
    order: 3,
    type: 'challenge' as const,
    instruction: `# Exercise: Write an add function

Write a function \`add\` that takes two numbers and returns their sum.

**Example:**
\`\`\`typescript
add(2, 3) // 5
add(-1, 1) // 0
\`\`\``,
    starterCode: `function add(a: number, b: number): number {
  // Your code here
}`,
    testCode: `// mini test runner
let _fail = false
const _log: string[] = []
function test(name: string, fn: () => void) {
  try { fn(); _log.push('✓ ' + name) }
  catch (e) { _log.push('✗ ' + name + ': ' + (e instanceof Error ? e.message : String(e))); _fail = true }
}
function expect(actual: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
    toBeCloseTo: (expected: number, d = 2) => {
      if (Math.abs((actual as number) - expected) >= 5 * Math.pow(10, -(d + 1)))
        throw new Error('expected ~' + expected + ' but got ' + actual)
    },
  }
}

test('adds positive numbers', () => { expect(add(2, 3)).toBe(5) })
test('adds negative numbers', () => { expect(add(-1, -2)).toBe(-3) })
test('adds zero', () => { expect(add(0, 5)).toBe(5) })
test('handles large numbers', () => { expect(add(1000000, 2000000)).toBe(3000000) })
test('handles decimals', () => { expect(add(0.1, 0.2)).toBeCloseTo(0.3) })

for (const r of _log) console.log(r)
if (_fail) throw new Error('Tests failed')`,
    hint: 'Simply return `a + b`.',
  },

  // ── Lesson 2: Arrays & Objects ──────────────────────────────────
  {
    id: STEP_2_1_ID,
    lessonId: LESSON_2_ID,
    order: 1,
    type: 'read' as const,
    instruction: `# Arrays & Objects

## Typed arrays

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
  },
  {
    id: STEP_2_2_ID,
    lessonId: LESSON_2_ID,
    order: 2,
    type: 'challenge' as const,
    instruction: `# Exercise: Sum an array

Write a function \`sum\` that takes an array of numbers and returns their total.

**Example:**
\`\`\`typescript
sum([1, 2, 3]) // 6
sum([])        // 0
\`\`\``,
    starterCode: `function sum(numbers: number[]): number {
  // Your code here
}`,
    testCode: `// mini test runner
let _fail = false
const _log: string[] = []
function test(name: string, fn: () => void) {
  try { fn(); _log.push('✓ ' + name) }
  catch (e) { _log.push('✗ ' + name + ': ' + (e instanceof Error ? e.message : String(e))); _fail = true }
}
function expect(actual: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
  }
}

test('sums positive numbers', () => { expect(sum([1, 2, 3])).toBe(6) })
test('returns 0 for empty array', () => { expect(sum([])).toBe(0) })
test('handles single element', () => { expect(sum([42])).toBe(42) })
test('handles negative numbers', () => { expect(sum([-1, 1, -2, 2])).toBe(0) })
test('handles large arrays', () => { expect(sum(Array.from({ length: 100 }, (_, i) => i + 1))).toBe(5050) })

for (const r of _log) console.log(r)
if (_fail) throw new Error('Tests failed')`,
    hint: 'Use `.reduce((sum, n) => sum + n, 0)` or a simple for loop.',
  },
  {
    id: STEP_2_3_ID,
    lessonId: LESSON_2_ID,
    order: 3,
    type: 'challenge' as const,
    instruction: `# Exercise: Get full name

Write a function \`getFullName\` that takes a person object with \`first\` and \`last\` properties and returns their full name.

**Example:**
\`\`\`typescript
getFullName({ first: "Jane", last: "Doe" }) // "Jane Doe"
\`\`\``,
    starterCode: `function getFullName(person: { first: string; last: string }): string {
  // Your code here
}`,
    testCode: `// mini test runner
let _fail = false
const _log: string[] = []
function test(name: string, fn: () => void) {
  try { fn(); _log.push('✓ ' + name) }
  catch (e) { _log.push('✗ ' + name + ': ' + (e instanceof Error ? e.message : String(e))); _fail = true }
}
function expect(actual: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
  }
}

test('combines first and last', () => { expect(getFullName({ first: 'Jane', last: 'Doe' })).toBe('Jane Doe') })
test('handles single character names', () => { expect(getFullName({ first: 'J', last: 'D' })).toBe('J D') })
test('handles hyphenated names', () => { expect(getFullName({ first: 'Mary-Jane', last: 'Watson-Parker' })).toBe('Mary-Jane Watson-Parker') })
test('preserves casing', () => { expect(getFullName({ first: 'mcdonald', last: 'DUCK' })).toBe('mcdonald DUCK') })
test('returns a string', () => { expect(typeof getFullName({ first: 'a', last: 'b' })).toBe('string') })

for (const r of _log) console.log(r)
if (_fail) throw new Error('Tests failed')`,
    hint: 'Return `${person.first} ${person.last}` using a template literal.',
  },

  // ── Lesson 3: Control Flow ──────────────────────────────────────
  {
    id: STEP_3_1_ID,
    lessonId: LESSON_3_ID,
    order: 1,
    type: 'read' as const,
    instruction: `# Control Flow

## if/else

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
  },
  {
    id: STEP_3_2_ID,
    lessonId: LESSON_3_ID,
    order: 2,
    type: 'challenge' as const,
    instruction: `# Exercise: FizzBuzz

Write a function \`fizzBuzz\` that takes a number and returns:
- \`"FizzBuzz"\` if divisible by both 3 and 5
- \`"Fizz"\` if divisible by 3
- \`"Buzz"\` if divisible by 5
- The number as a string otherwise

**Example:**
\`\`\`typescript
fizzBuzz(15) // "FizzBuzz"
fizzBuzz(3)  // "Fizz"
fizzBuzz(5)  // "Buzz"
fizzBuzz(7)  // "7"
\`\`\``,
    starterCode: `function fizzBuzz(n: number): string {
  // Your code here
}`,
    testCode: `// mini test runner
let _fail = false
const _log: string[] = []
function test(name: string, fn: () => void) {
  try { fn(); _log.push('✓ ' + name) }
  catch (e) { _log.push('✗ ' + name + ': ' + (e instanceof Error ? e.message : String(e))); _fail = true }
}
function expect(actual: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
  }
}

test('returns FizzBuzz for 15', () => { expect(fizzBuzz(15)).toBe('FizzBuzz') })
test('returns Fizz for 3', () => { expect(fizzBuzz(3)).toBe('Fizz') })
test('returns Buzz for 5', () => { expect(fizzBuzz(5)).toBe('Buzz') })
test('returns number as string for 7', () => { expect(fizzBuzz(7)).toBe('7') })
test('returns Fizz for 9', () => { expect(fizzBuzz(9)).toBe('Fizz') })
test('returns FizzBuzz for 30', () => { expect(fizzBuzz(30)).toBe('FizzBuzz') })
test('returns 1 for 1', () => { expect(fizzBuzz(1)).toBe('1') })

for (const r of _log) console.log(r)
if (_fail) throw new Error('Tests failed')`,
    hint: 'Check divisibility by 15 first (both 3 and 5), then by 3, then by 5. Use `n % 3 === 0`.',
  },
  {
    id: STEP_3_3_ID,
    lessonId: LESSON_3_ID,
    order: 3,
    type: 'challenge' as const,
    instruction: `# Challenge: Palindrome checker

Write a function \`isPalindrome\` that checks if a string reads the same forwards and backwards. Ignore case and non-alphanumeric characters.

**Example:**
\`\`\`typescript
isPalindrome("racecar")           // true
isPalindrome("A man, a plan, a canal: Panama") // true
isPalindrome("hello")             // false
\`\`\``,
    starterCode: `function isPalindrome(s: string): boolean {
  // Your code here
}`,
    testCode: `// mini test runner
let _fail = false
const _log: string[] = []
function test(name: string, fn: () => void) {
  try { fn(); _log.push('✓ ' + name) }
  catch (e) { _log.push('✗ ' + name + ': ' + (e instanceof Error ? e.message : String(e))); _fail = true }
}
function expect(actual: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
  }
}

test('detects simple palindrome', () => { expect(isPalindrome('racecar')).toBe(true) })
test('ignores case', () => { expect(isPalindrome('RaceCar')).toBe(true) })
test('ignores non-alphanumeric', () => { expect(isPalindrome('A man, a plan, a canal: Panama')).toBe(true) })
test('rejects non-palindromes', () => { expect(isPalindrome('hello')).toBe(false) })
test('handles empty string', () => { expect(isPalindrome('')).toBe(true) })
test('handles single character', () => { expect(isPalindrome('a')).toBe(true) })
test('handles numbers in string', () => { expect(isPalindrome('12321')).toBe(true) })

for (const r of _log) console.log(r)
if (_fail) throw new Error('Tests failed')`,
    hint: 'Strip non-alphanumeric chars with `.replace(/[^a-zA-Z0-9]/g, "")`, lowercase, then compare with its reverse.',
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

// DOM testCode mini runner (plain JS, no TypeScript — runs in iframe)
// Results sent via window.parent.postMessage, not console.log
const DOM_RUNNER = `let _fail = false
const _log = []
function test(name, fn) {
  try { fn(); _log.push('✓ ' + name) }
  catch (e) { _log.push('✗ ' + name + ': ' + (e instanceof Error ? e.message : String(e))); _fail = true }
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

const DOM_RUNNER_END = `window.parent.postMessage({ type: 'test-results', log: _log, failed: _fail }, '*')`

const DOM_COURSE_DATA = {
  id: DOM_COURSE_ID,
  slug: 'javascript-dom-fundamentals',
  title: 'JavaScript DOM Fundamentals',
  description: 'Learn to select, modify, and react to the DOM with vanilla JavaScript. No frameworks — just the browser APIs every developer needs to know.',
  language: 'javascript-dom',
  accentColor: '#F7DF1E',
  status: 'published' as const,
}

const DOM_LESSONS_DATA = [
  { id: DOM_LESSON_1_ID, courseId: DOM_COURSE_ID, order: 1, title: 'Selecting Elements' },
  { id: DOM_LESSON_2_ID, courseId: DOM_COURSE_ID, order: 2, title: 'Modifying Elements' },
  { id: DOM_LESSON_3_ID, courseId: DOM_COURSE_ID, order: 3, title: 'Events' },
]

const DOM_STEPS_DATA = [
  // ── Lesson 1: Selecting Elements ────────────────────────────────
  {
    id: DOM_STEP_1_1_ID,
    lessonId: DOM_LESSON_1_ID,
    order: 1,
    type: 'read' as const,
    instruction: `# Selecting Elements

The browser gives you several ways to find elements on the page:

\`\`\`javascript
// By CSS selector — most versatile
const btn = document.querySelector('#submit-btn')
const cards = document.querySelectorAll('.card')

// By ID — fastest, but only one element
const header = document.getElementById('main-header')
\`\`\`

**\`querySelector\`** returns the first match (or \`null\` if not found).

**\`querySelectorAll\`** returns a \`NodeList\` of all matches — like an array, but you need \`Array.from()\` to use methods like \`.map()\`.

The CSS selector syntax is the same you use in stylesheets: class (\`.card\`), ID (\`#title\`), attribute (\`[data-id]\`), descendant (\`.card h2\`), and more.`,
    starterCode: null,
    testCode: null,
    hint: null,
  },
  {
    id: DOM_STEP_1_2_ID,
    lessonId: DOM_LESSON_1_ID,
    order: 2,
    type: 'challenge' as const,
    instruction: `# Exercise: Read an element's text

Write a function \`getTitle\` that finds the \`<h1>\` element on the page and returns its text content.

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
  },
  {
    id: DOM_STEP_1_3_ID,
    lessonId: DOM_LESSON_1_ID,
    order: 3,
    type: 'challenge' as const,
    instruction: `# Exercise: Count list items

Write a function \`countItems\` that counts how many \`<li>\` elements are inside \`#todo-list\`.

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
  },

  // ── Lesson 2: Modifying Elements ────────────────────────────────
  {
    id: DOM_STEP_2_1_ID,
    lessonId: DOM_LESSON_2_ID,
    order: 1,
    type: 'read' as const,
    instruction: `# Modifying Elements

Once you have an element, you can change almost anything about it:

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
  },
  {
    id: DOM_STEP_2_2_ID,
    lessonId: DOM_LESSON_2_ID,
    order: 2,
    type: 'challenge' as const,
    instruction: `# Exercise: Update a message

Write a function \`updateMessage\` that changes the text inside \`#message\` to \`"Updated"\`.

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
  },
  {
    id: DOM_STEP_2_3_ID,
    lessonId: DOM_LESSON_2_ID,
    order: 3,
    type: 'challenge' as const,
    instruction: `# Exercise: Activate a card

Write a function \`activateCard\` that adds the class \`active\` to \`#card\`.

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
  },

  // ── Lesson 3: Events ────────────────────────────────────────────
  {
    id: DOM_STEP_3_1_ID,
    lessonId: DOM_LESSON_3_ID,
    order: 1,
    type: 'read' as const,
    instruction: `# Events

User interactions fire events. You listen for them with \`addEventListener\`:

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
  },
  {
    id: DOM_STEP_3_2_ID,
    lessonId: DOM_LESSON_3_ID,
    order: 2,
    type: 'challenge' as const,
    instruction: `# Exercise: Click counter

Write a function \`setupCounter\` that attaches a click listener to \`#btn\`. Each click should increment the number shown in \`#counter\`.

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
  },
  {
    id: DOM_STEP_3_3_ID,
    lessonId: DOM_LESSON_3_ID,
    order: 3,
    type: 'challenge' as const,
    instruction: `# Challenge: Fix the event delegation bug

The \`setupTodoList\` function below uses event delegation — one listener on \`<ul>\` handles clicks on all \`<li>\` items and toggles a \`done\` class.

**It has a subtle bug:** clicking on a child element inside an \`<li>\` (like the \`<strong>\` text) doesn't toggle the class, because \`e.target\` is the \`<strong>\`, not the \`<li>\`.

Fix \`setupTodoList\` so that clicking anywhere inside an \`<li>\` correctly toggles \`done\` on the \`<li>\` itself.

**Hint:** \`e.target.closest("li")\` walks up the DOM tree and finds the nearest \`<li>\` ancestor.`,
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
    hint: 'Replace `e.target` with `e.target.closest("li")` and check it\'s not null before toggling.',
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
}

type LessonSeed = { id: string; courseId: string; order: number; title: string }
type StepSeed = {
  id: string
  lessonId: string
  order: number
  type: 'read' | 'code' | 'challenge'
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
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
        status: courseData.status,
        isPublic: courseData.isPublic ?? false,
      },
    })
  console.log(`  ✓ Course: ${courseData.title}`)

  for (const lesson of lessonsData) {
    await db.insert(lessons).values(lesson).onConflictDoNothing()
  }
  console.log(`  ✓ Lessons: ${lessonsData.length}`)

  for (const step of stepsData) {
    await db
      .insert(steps)
      .values(step)
      .onConflictDoUpdate({
        target: steps.id,
        set: {
          instruction: step.instruction,
          starterCode: step.starterCode,
          testCode: step.testCode,
          hint: step.hint,
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
