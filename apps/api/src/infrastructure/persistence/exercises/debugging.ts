import { type SeedExercise, uuidv5 } from './types'

export const debuggingExercises: SeedExercise[] = [
  // ---------------------------------------------------------------------------
  // 077 — Fix: Off-by-one in pagination (TypeScript, easy)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-077-fix-pagination-offset'),
    title: 'Fix: Off-by-one in pagination',
    description: `The \`paginate\` function below has a bug. Page 1 should return the first N items, but it's returning the wrong items.

\`\`\`typescript
function paginate<T>(items: T[], page: number, limit: number): T[]
\`\`\`

Fix the bug and export the corrected function from \`solution.ts\`.

**Rules:** page is 1-indexed (page 1 = first page). Don't change the function signature.`,
    duration: 10,
    difficulty: 'easy',
    type: 'code',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['pagination', 'off-by-one', 'arrays'],
    topics: ['index-arithmetic', 'pagination', 'off-by-one-errors'],
    starterCode: `function paginate<T>(items: T[], page: number, limit: number): T[] {
  const start = page * limit // BUG: should be (page - 1) * limit
  return items.slice(start, start + limit)
}

module.exports = { paginate }`,
    testCode: `const assert = require('assert')
const { paginate } = require('./solution')

const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

assert.deepStrictEqual(paginate(items, 1, 3), [1, 2, 3], 'page 1 should return first 3 items')
assert.deepStrictEqual(paginate(items, 2, 3), [4, 5, 6], 'page 2 should return items 4-6')
assert.deepStrictEqual(paginate(items, 3, 3), [7, 8, 9], 'page 3 should return items 7-9')
assert.deepStrictEqual(paginate(items, 4, 3), [10], 'page 4 should return remaining item')
assert.deepStrictEqual(paginate(items, 1, 5), [1, 2, 3, 4, 5], 'different limit — page 1 should return first 5')

console.log('All tests passed')`,
    variations: [
      {
        ownerRole: 'Senior backend engineer who has debugged countless off-by-one errors in APIs',
        ownerContext:
          'Evaluate whether the developer correctly identified the root cause (1-indexed vs 0-indexed confusion) and not just found a fix that makes the tests pass by coincidence. Also check: do they understand why page * limit skips the first page entirely? Would they have caught this in a code review?',
      },
      {
        ownerRole: 'Engineering manager who values clear thinking under pressure',
        ownerContext:
          "This is a simple bug but reveals a lot about how someone thinks. Did they reason about the formula, or did they trial-and-error? Did they explain WHAT was wrong and WHY the fix is correct? Evaluate the quality of their reasoning, not just the correctness of the patch.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 078 — Fix: Sort mutates original array (TypeScript, easy)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-078-fix-sort-mutation'),
    title: 'Fix: Sort mutates original array',
    description: `The \`topN\` function returns the N largest numbers — but it has a side effect: it mutates the original array.

\`\`\`typescript
function topN(arr: number[], n: number): number[]
\`\`\`

Fix the bug so the original array is not modified. Export the corrected function from \`solution.ts\`.`,
    duration: 10,
    difficulty: 'easy',
    type: 'code',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['mutation', 'arrays', 'sort', 'side-effects'],
    topics: ['immutability', 'array-mutation', 'defensive-copying'],
    starterCode: `function topN(arr: number[], n: number): number[] {
  return arr.sort((a, b) => b - a).slice(0, n) // BUG: .sort() mutates arr in place
}

module.exports = { topN }`,
    testCode: `const assert = require('assert')
const { topN } = require('./solution')

const nums = [3, 1, 4, 1, 5, 9, 2, 6]
const original = [...nums]

const result = topN(nums, 3)

assert.deepStrictEqual(result, [9, 6, 5], 'should return top 3 in descending order')
assert.deepStrictEqual(nums, original, 'original array must not be mutated')
assert.deepStrictEqual(topN([1], 1), [1], 'single element')
assert.deepStrictEqual(topN([2, 1], 5), [2, 1], 'n larger than array length returns all elements sorted')

console.log('All tests passed')`,
    variations: [
      {
        ownerRole: 'TypeScript engineer who has spent years debugging mutation-related bugs in production',
        ownerContext:
          'Evaluate whether the developer understands WHY Array.sort() is mutating — it modifies in place and returns the same reference. Check that their fix creates a copy before sorting, and that they understand the idiomatic ways to do so ([...arr], arr.slice(), Array.from). A toSorted() solution is valid but note it as a newer API that may not be available everywhere.',
      },
      {
        ownerRole: 'Code reviewer focused on functional programming principles',
        ownerContext:
          'This bug illustrates one of the most common sources of subtle bugs: unexpected mutation of input parameters. Evaluate whether the developer articulates this as a general principle (pure functions, no side effects on inputs) or just mechanically fixes the specific case. A developer who understands the broader principle is more valuable.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 079 — Fix: var in closure loop (TypeScript, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-079-fix-closure-var'),
    title: 'Fix: var capture in closure loop',
    description: `The \`makeMultipliers\` function should return an array of functions where the i-th function multiplies its argument by \`i+1\`. But all functions return the same value.

\`\`\`typescript
function makeMultipliers(count: number): Array<(x: number) => number>
\`\`\`

Fix the bug and export the corrected function from \`solution.ts\`.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['closures', 'var', 'let', 'scope'],
    topics: ['closure-capture', 'var-vs-let', 'loop-scope', 'javascript-gotchas'],
    starterCode: `function makeMultipliers(count: number): Array<(x: number) => number> {
  const multipliers = []
  for (var i = 0; i < count; i++) { // BUG: var leaks out of loop scope
    multipliers.push((x: number) => x * (i + 1))
  }
  return multipliers
}

module.exports = { makeMultipliers }`,
    testCode: `const assert = require('assert')
const { makeMultipliers } = require('./solution')

const fns = makeMultipliers(4)

assert.strictEqual(fns[0](10), 10, 'first function should multiply by 1')
assert.strictEqual(fns[1](10), 20, 'second function should multiply by 2')
assert.strictEqual(fns[2](10), 30, 'third function should multiply by 3')
assert.strictEqual(fns[3](10), 40, 'fourth function should multiply by 4')
assert.strictEqual(makeMultipliers(1)[0](7), 7, 'single multiplier')

console.log('All tests passed')`,
    variations: [
      {
        ownerRole: 'JavaScript engine internals engineer who knows exactly how var hoisting works',
        ownerContext:
          'Evaluate whether the developer understands the root cause: var is function-scoped, so all closures share the same i variable which ends up as count after the loop. The fix is let (block-scoped) or an IIFE to capture the value. Prefer the let solution as the most readable. A developer who explains the var hoisting mechanism, not just "use let", demonstrates deeper understanding.',
      },
      {
        ownerRole: 'Engineering interviewer at a senior-level position who uses this exact problem to screen candidates',
        ownerContext:
          'This is a classic JavaScript interview question. At a senior level, I expect more than just the fix — I expect the developer to recognize the var/let distinction, explain closure semantics, and potentially mention that this is a footgun that TypeScript in strict mode can catch with noImplicitAny but not with this specific pattern. Evaluate depth of explanation, not just correctness.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 080 — Fix: Wrong modulo for negative numbers (TypeScript, easy)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-080-fix-negative-modulo'),
    title: 'Fix: Wrong modulo for negative numbers',
    description: `The \`isOdd\` function should return \`true\` for any odd number, positive or negative. But it's wrong for negative odd numbers.

\`\`\`typescript
function isOdd(n: number): boolean
\`\`\`

Fix the bug and export the corrected function from \`solution.ts\`.`,
    duration: 10,
    difficulty: 'easy',
    type: 'code',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['modulo', 'negative-numbers', 'arithmetic'],
    topics: ['remainder-vs-modulo', 'numeric-edge-cases', 'javascript-arithmetic'],
    starterCode: `function isOdd(n: number): boolean {
  return n % 2 === 1 // BUG: in JS, -3 % 2 === -1, not 1
}

module.exports = { isOdd }`,
    testCode: `const assert = require('assert')
const { isOdd } = require('./solution')

assert.strictEqual(isOdd(1), true, '1 is odd')
assert.strictEqual(isOdd(2), false, '2 is even')
assert.strictEqual(isOdd(3), true, '3 is odd')
assert.strictEqual(isOdd(-1), true, '-1 is odd')
assert.strictEqual(isOdd(-2), false, '-2 is even')
assert.strictEqual(isOdd(-3), true, '-3 is odd')
assert.strictEqual(isOdd(0), false, '0 is even')

console.log('All tests passed')`,
    variations: [
      {
        ownerRole: 'JavaScript developer who has been bitten by this exact bug in production payment code',
        ownerContext:
          "Evaluate whether they understand the distinction between JS's % operator (remainder, keeps sign of dividend) and mathematical modulo (always non-negative). The fix can be n % 2 !== 0 or Math.abs(n % 2) === 1 or n % 2 === 1 || n % 2 === -1. The cleanest fix is n % 2 !== 0. Penalize solutions that only check specific cases without understanding the general pattern.",
      },
      {
        ownerRole: 'Code quality reviewer who values correctness over cleverness',
        ownerContext:
          'The bug here is subtle: it works for all positive inputs but silently fails for negative ones. This is a class of bugs called "happy path works, edge case fails". Evaluate whether the developer identifies this as a missing edge case, explains why JS modulo behaves this way, and writes a fix that handles all integers — including 0.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 081 — Fix: Object reference equality (TypeScript, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-081-fix-object-equality'),
    title: 'Fix: Object reference vs value equality',
    description: `The \`hasDuplicate\` function checks if any two objects in the array have identical content. But it never returns \`true\` even when duplicates exist.

\`\`\`typescript
function hasDuplicate(arr: object[]): boolean
\`\`\`

Fix the bug and export the corrected function from \`solution.ts\`.

**Constraint:** Objects are plain JSON-serializable objects. You may use \`JSON.stringify\`.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['equality', 'objects', 'reference-vs-value'],
    topics: ['reference-equality', 'value-equality', 'object-comparison', 'json-serialization'],
    starterCode: `function hasDuplicate(arr: object[]): boolean {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true // BUG: === compares references, not content
    }
  }
  return false
}

module.exports = { hasDuplicate }`,
    testCode: `const assert = require('assert')
const { hasDuplicate } = require('./solution')

assert.strictEqual(hasDuplicate([{ a: 1 }, { a: 1 }]), true, 'two identical objects should be duplicates')
assert.strictEqual(hasDuplicate([{ a: 1 }, { a: 2 }]), false, 'different objects are not duplicates')
assert.strictEqual(hasDuplicate([{ x: 1, y: 2 }, { y: 2, x: 1 }]), true, 'same keys different order — still duplicate')
assert.strictEqual(hasDuplicate([]), false, 'empty array has no duplicates')
assert.strictEqual(hasDuplicate([{ a: 1 }]), false, 'single element has no duplicates')
assert.strictEqual(hasDuplicate([{ a: 1 }, { a: 2 }, { a: 1 }]), true, 'duplicate in position 0 and 2')

console.log('All tests passed')`,
    variations: [
      {
        ownerRole: 'JavaScript runtime engineer who understands exactly how === works for objects',
        ownerContext:
          'Evaluate whether the developer clearly articulates the reference vs value equality distinction in JavaScript. The fix (JSON.stringify comparison) is acceptable but has known limitations: key order matters in JSON.stringify for nested objects, and non-serializable values would fail. A developer who mentions these limitations shows depth. A developer who also suggests alternatives (deep-equal library, recursive comparison) shows even more.',
      },
      {
        ownerRole: 'Senior developer interviewing mid-level candidates',
        ownerContext:
          "This bug is introduced in almost every JavaScript developer's first month. At mid-level, I expect the developer to (1) immediately identify it as a reference equality problem, (2) fix it correctly, and (3) note the edge case where JSON.stringify key ordering can produce false negatives for { a:1, b:2 } vs { b:2, a:1 }. Evaluate how quickly they identify the root cause and whether they discuss trade-offs.",
      },
    ],
  },
]
