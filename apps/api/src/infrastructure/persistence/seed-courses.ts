import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './drizzle/schema'
import { courses, lessons, steps } from './drizzle/schema'

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
    type: 'explanation' as const,
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
    type: 'exercise' as const,
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
    type: 'exercise' as const,
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
    type: 'explanation' as const,
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
    type: 'exercise' as const,
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
    type: 'exercise' as const,
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
    type: 'explanation' as const,
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
    type: 'exercise' as const,
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
// Seed runner
// ---------------------------------------------------------------------------

async function seedCourses() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL not set')

  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql, { schema })

  console.log('Seeding courses...')

  // Upsert course
  await db
    .insert(courses)
    .values(COURSE_DATA)
    .onConflictDoUpdate({
      target: courses.slug,
      set: {
        title: COURSE_DATA.title,
        description: COURSE_DATA.description,
        status: COURSE_DATA.status,
      },
    })
  console.log(`  ✓ Course: ${COURSE_DATA.title}`)

  // Upsert lessons
  for (const lesson of LESSONS_DATA) {
    await db
      .insert(lessons)
      .values(lesson)
      .onConflictDoNothing()
  }
  console.log(`  ✓ Lessons: ${LESSONS_DATA.length}`)

  // Upsert steps (update testCode/instruction in case seed changes)
  for (const step of STEPS_DATA) {
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
  console.log(`  ✓ Steps: ${STEPS_DATA.length}`)

  console.log('Done.')
  await sql.end()
}

seedCourses().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
