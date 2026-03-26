import { type SeedExercise, uuidv5 } from './types'

export const testCodeExercises: SeedExercise[] = [
  // ---------------------------------------------------------------------------
  // 062 — Flatten Nested Arrays (TypeScript, easy)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-062-flatten-nested-arrays'),
    title: 'Flatten Nested Arrays',
    description: `Implement a function \`flatten\` that takes a deeply nested array and returns a single flat array with all values, preserving order.

**You may NOT use \`Array.prototype.flat()\` or \`Array.prototype.flatMap()\`.**

\`\`\`typescript
function flatten<T>(arr: unknown[]): T[]
\`\`\`

Example:
\`\`\`typescript
flatten([1, [2, [3, [4]]], 5]) // => [1, 2, 3, 4, 5]
flatten([])                     // => []
\`\`\`

Export your function from \`solution.ts\`.`,
    duration: 10,
    difficulty: 'easy',
    type: 'code',
    category: 'algorithms',
    languages: ['typescript'],
    tags: ['recursion', 'arrays', 'generics'],
    topics: ['recursion', 'type-narrowing', 'array-manipulation'],
    testCode: `const assert = require('assert');
const { flatten } = require('./solution');

// 1. Flat array passes through unchanged
assert.deepStrictEqual(flatten([1, 2, 3]), [1, 2, 3], 'flat array should stay flat');

// 2. Deeply nested array
assert.deepStrictEqual(flatten([1, [2, [3, [4, [5]]]]]), [1, 2, 3, 4, 5], 'should flatten deeply nested arrays');

// 3. Empty array
assert.deepStrictEqual(flatten([]), [], 'empty array should return empty array');

// 4. Array with empty nested arrays
assert.deepStrictEqual(flatten([[], [[]], [[], [[]]]]), [], 'nested empty arrays should return empty array');

// 5. Mixed types
assert.deepStrictEqual(flatten(['a', ['b', ['c']], 'd']), ['a', 'b', 'c', 'd'], 'should work with strings');

// 6. Single element nested deep
assert.deepStrictEqual(flatten([[[[42]]]]), [42], 'single deeply nested element');

// 7. Large flat input (performance)
const big = Array.from({ length: 10000 }, (_, i) => [i]);
const flatBig = flatten(big);
assert.strictEqual(flatBig.length, 10000, 'should handle 10k nested elements');
assert.strictEqual(flatBig[9999], 9999);

// 8. Null and undefined values should be preserved (not stripped)
assert.deepStrictEqual(flatten([null, [undefined, [0, [false]]]]), [null, undefined, 0, false], 'falsy values must be preserved');

console.log('All tests passed');
`,
    variations: [
      {
        ownerRole: 'TypeScript compiler team engineer who cares deeply about type safety and generics',
        ownerContext:
          'Evaluate whether the implementation correctly handles the generic type parameter. A naive `any[]` return is a red flag. Check that the recursion termination is correct and that Array.isArray is used for type narrowing rather than typeof or instanceof.',
      },
      {
        ownerRole: 'Performance-focused engineer who has optimized hot paths in data processing pipelines',
        ownerContext:
          'Evaluate whether the solution avoids excessive array allocations. A solution that creates a new array on every recursive call via spread/concat is O(n²) in the worst case. Look for iterative or tail-call-style approaches, or at minimum spreading into a single accumulator.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 063 — Retry with Backoff (TypeScript, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-063-retry-with-backoff'),
    title: 'Retry with Backoff',
    description: `Implement a function \`retry\` that calls an async function and retries on failure with exponential backoff.

\`\`\`typescript
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  baseDelay: number
): Promise<T>
\`\`\`

Rules:
- Call \`fn()\` up to \`maxAttempts\` times.
- If \`fn\` succeeds, return the result immediately.
- If \`fn\` fails and there are remaining attempts, wait \`baseDelay * 2^(attempt-1)\` ms before retrying (first retry waits \`baseDelay\`, second waits \`baseDelay*2\`, third waits \`baseDelay*4\`, etc.).
- If all attempts fail, throw the **last** error.
- Use a real delay (e.g. \`setTimeout\` wrapped in a Promise), not a busy loop.

Export your function from \`solution.ts\`.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'async',
    languages: ['typescript'],
    tags: ['async', 'error-handling', 'resilience'],
    topics: ['promises', 'exponential-backoff', 'retry-patterns', 'error-propagation'],
    testCode: `const assert = require('assert');
const { retry } = require('./solution');

async function runTests() {
  // 1. Succeeds on first try
  {
    let calls = 0;
    const result = await retry(() => { calls++; return Promise.resolve('ok'); }, 3, 10);
    assert.strictEqual(result, 'ok');
    assert.strictEqual(calls, 1, 'should not retry on success');
  }

  // 2. Fails then succeeds
  {
    let calls = 0;
    const fn = () => {
      calls++;
      if (calls < 3) return Promise.reject(new Error('fail'));
      return Promise.resolve('recovered');
    };
    const result = await retry(fn, 5, 10);
    assert.strictEqual(result, 'recovered');
    assert.strictEqual(calls, 3);
  }

  // 3. All attempts fail — throws last error
  {
    let calls = 0;
    const fn = () => { calls++; return Promise.reject(new Error('fail-' + calls)); };
    try {
      await retry(fn, 3, 10);
      assert.fail('should have thrown');
    } catch (e) {
      assert.strictEqual(e.message, 'fail-3', 'should throw the LAST error');
      assert.strictEqual(calls, 3);
    }
  }

  // 4. Backoff timing is approximately correct
  {
    const times = [];
    let calls = 0;
    const fn = () => {
      times.push(Date.now());
      calls++;
      if (calls < 4) return Promise.reject(new Error('fail'));
      return Promise.resolve('done');
    };
    await retry(fn, 4, 50);
    // Gaps should be ~50, ~100, ~200
    const gaps = [];
    for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]);
    assert.ok(gaps[0] >= 30 && gaps[0] < 150, 'first delay ~50ms, got ' + gaps[0]);
    assert.ok(gaps[1] >= 60 && gaps[1] < 250, 'second delay ~100ms, got ' + gaps[1]);
    assert.ok(gaps[2] >= 120 && gaps[2] < 500, 'third delay ~200ms, got ' + gaps[2]);
  }

  // 5. maxAttempts = 1 means no retries
  {
    let calls = 0;
    try {
      await retry(() => { calls++; return Promise.reject(new Error('once')); }, 1, 10);
      assert.fail('should have thrown');
    } catch (e) {
      assert.strictEqual(calls, 1, 'maxAttempts=1 means exactly one call');
    }
  }

  // 6. Return value type is preserved
  {
    const result = await retry(() => Promise.resolve({ x: 42 }), 2, 10);
    assert.deepStrictEqual(result, { x: 42 });
  }

  console.log('All tests passed');
}

runTests();
`,
    variations: [
      {
        ownerRole: 'Distributed systems engineer who has debugged cascading retry storms in production microservices',
        ownerContext:
          'Check that the delay computation is truly exponential and not linear. Look for whether the developer considers jitter (bonus) and whether max attempts is respected exactly. A common bug is off-by-one: retrying maxAttempts times PLUS the initial call. The initial call counts as attempt 1.',
      },
      {
        ownerRole: 'Senior JavaScript developer focused on API client libraries and SDK design',
        ownerContext:
          'Evaluate the promise chain correctness. The function must properly await the delay and not fire multiple retries concurrently. Check that the last error is thrown, not the first — this matters for debugging in production. Bonus: does the developer type the return properly with generics?',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 064 — Group By with Reduce (TypeScript, easy)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-064-group-by-with-reduce'),
    title: 'Group By with Reduce',
    description: `Implement a function \`groupBy\` that groups array elements using a key function. You must use \`Array.prototype.reduce\` — no other looping constructs allowed (no \`for\`, \`while\`, \`forEach\`, \`map\`, \`filter\`, or \`for...of\`).

\`\`\`typescript
function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]>
\`\`\`

Example:
\`\`\`typescript
groupBy([6.1, 4.2, 6.3], Math.floor) // => { '4': [4.2], '6': [6.1, 6.3] }
\`\`\`

Export your function from \`solution.ts\`.`,
    duration: 10,
    difficulty: 'easy',
    type: 'code',
    category: 'functional',
    languages: ['typescript'],
    tags: ['reduce', 'functional', 'higher-order-functions'],
    topics: ['reduce', 'grouping', 'higher-order-functions', 'record-types'],
    testCode: `const assert = require('assert');
const { groupBy } = require('./solution');

// 1. Basic grouping
assert.deepStrictEqual(
  groupBy(['one', 'two', 'three'], s => String(s.length)),
  { '3': ['one', 'two'], '5': ['three'] }
);

// 2. Empty array
assert.deepStrictEqual(groupBy([], x => x), {}, 'empty array returns empty object');

// 3. All same key
assert.deepStrictEqual(
  groupBy([1, 2, 3], () => 'all'),
  { all: [1, 2, 3] }
);

// 4. Objects as items
const people = [
  { name: 'Alice', dept: 'eng' },
  { name: 'Bob', dept: 'sales' },
  { name: 'Charlie', dept: 'eng' },
];
const grouped = groupBy(people, p => p.dept);
assert.deepStrictEqual(grouped['eng'].map(p => p.name), ['Alice', 'Charlie']);
assert.deepStrictEqual(grouped['sales'].map(p => p.name), ['Bob']);

// 5. Order within groups is preserved
assert.deepStrictEqual(
  groupBy([3, 1, 4, 1, 5, 9, 2, 6], n => (n % 2 === 0 ? 'even' : 'odd')),
  { odd: [3, 1, 1, 5, 9], even: [4, 2, 6] }
);

// 6. Single element
assert.deepStrictEqual(groupBy([42], () => 'x'), { x: [42] });

// 7. Key function uses index-like behavior (every item unique key)
const letters = ['a', 'b', 'c'];
const result = groupBy(letters, l => l);
assert.deepStrictEqual(result, { a: ['a'], b: ['b'], c: ['c'] });

// 8. Must use reduce (source code check)
const src = groupBy.toString();
assert.ok(src.includes('reduce'), 'implementation must use reduce');

console.log('All tests passed');
`,
    variations: [
      {
        ownerRole: 'Functional programming advocate who teaches FP patterns to JavaScript teams',
        ownerContext:
          'Evaluate whether the developer truly uses reduce as the primary mechanism — not as a wrapper around a for loop inside the callback. The reducer should build the accumulator immutably or by mutation of the accumulator object. Check that the initial value is provided to reduce (a common bug is omitting it, which crashes on empty arrays).',
      },
      {
        ownerRole: 'Code reviewer at a team that prizes readability and minimal complexity',
        ownerContext:
          'The implementation should be concise — ideally 5-8 lines. A 20-line solution with temporary variables and conditionals everywhere suggests the developer does not understand reduce. Evaluate naming: is the accumulator clearly named? Is the key function called exactly once per element?',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 065 — Debounce Function (TypeScript, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-065-debounce-function'),
    title: 'Debounce Function',
    description: `Implement a \`debounce\` function that delays invoking \`fn\` until \`wait\` milliseconds have elapsed since the last call. The returned debounced function should also expose \`cancel()\` and \`flush()\` methods.

\`\`\`typescript
interface DebouncedFn<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
}

function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): DebouncedFn<T>
\`\`\`

- \`cancel()\` — cancels any pending invocation.
- \`flush()\` — immediately invokes the pending call (if any) with the most recent arguments. If there is no pending call, \`flush()\` does nothing.

Export your function from \`solution.ts\`.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'async',
    languages: ['typescript'],
    tags: ['closures', 'timers', 'utility'],
    topics: ['debounce', 'closures', 'timer-management', 'function-composition'],
    testCode: `const assert = require('assert');
const { debounce } = require('./solution');

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTests() {
  // 1. Basic debounce — only last call fires
  {
    const calls = [];
    const fn = debounce((x) => calls.push(x), 50);
    fn(1); fn(2); fn(3);
    await delay(100);
    assert.deepStrictEqual(calls, [3], 'only last call should fire');
  }

  // 2. cancel() prevents execution
  {
    const calls = [];
    const fn = debounce((x) => calls.push(x), 50);
    fn('a');
    fn.cancel();
    await delay(100);
    assert.deepStrictEqual(calls, [], 'cancel should prevent execution');
  }

  // 3. flush() triggers immediately
  {
    const calls = [];
    const fn = debounce((x) => calls.push(x), 500);
    fn('now');
    fn.flush();
    assert.deepStrictEqual(calls, ['now'], 'flush should trigger immediately');
    await delay(600);
    assert.deepStrictEqual(calls, ['now'], 'should not fire again after flush');
  }

  // 4. flush() with no pending call does nothing
  {
    const calls = [];
    const fn = debounce((x) => calls.push(x), 50);
    fn.flush();
    assert.deepStrictEqual(calls, [], 'flush with no pending call should be a no-op');
  }

  // 5. Repeated calls reset the timer
  {
    const calls = [];
    const fn = debounce((x) => calls.push(x), 80);
    fn(1);
    await delay(40);
    fn(2);
    await delay(40);
    fn(3);
    await delay(120);
    assert.deepStrictEqual(calls, [3], 'timer should reset on each call');
  }

  // 6. Multiple arguments are forwarded
  {
    const calls = [];
    const fn = debounce((...args) => calls.push(args), 50);
    fn('a', 'b', 'c');
    await delay(100);
    assert.deepStrictEqual(calls, [['a', 'b', 'c']], 'all arguments should be forwarded');
  }

  // 7. cancel then new call works
  {
    const calls = [];
    const fn = debounce((x) => calls.push(x), 50);
    fn('cancelled');
    fn.cancel();
    fn('kept');
    await delay(100);
    assert.deepStrictEqual(calls, ['kept'], 'new call after cancel should work');
  }

  console.log('All tests passed');
}

runTests();
`,
    variations: [
      {
        ownerRole: 'Frontend architect who maintains a shared utility library used across 30+ microservices',
        ownerContext:
          'Evaluate the closure hygiene: does the debounced function properly clean up its timer reference? A memory leak (never clearing the timeout) is a serious issue. Check that cancel and flush properly reset internal state. The flush method must clear the pending timer after invoking — calling flush then waiting should NOT trigger a second call.',
      },
      {
        ownerRole: 'JavaScript engine performance engineer who understands the event loop intimately',
        ownerContext:
          'Check that the developer uses clearTimeout correctly and does not accumulate stale timers. Evaluate whether flush is implemented by reusing the scheduled callback (good) or duplicating the invocation logic (fragile). A common bug: flush fires the function but leaves the timer running, causing a double invocation.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 066 — FizzBuzz Without Conditionals (Ruby, easy)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-066-fizzbuzz-without-conditionals'),
    title: 'FizzBuzz Without Conditionals',
    description: `Implement a method \`fizzbuzz(n)\` that returns an array of strings for numbers 1 to n following the classic FizzBuzz rules:
- Multiples of 3 → \`"Fizz"\`
- Multiples of 5 → \`"Buzz"\`
- Multiples of both 3 and 5 → \`"FizzBuzz"\`
- Otherwise → the number as a string

**Constraint: You may NOT use \`if\`, \`unless\`, \`case\`, \`when\`, or the ternary operator \`? :\`.** Use hash lookups, array indexing, math tricks, or any other approach — just no conditional branching keywords or ternary.

Define your method in \`solution.rb\`.`,
    duration: 10,
    difficulty: 'easy',
    type: 'code',
    category: 'creative-constraints',
    languages: ['ruby'],
    tags: ['creative', 'math', 'constraints'],
    topics: ['hash-lookup', 'modular-arithmetic', 'creative-problem-solving'],
    testCode: `require_relative 'solution'

# 1. First 15 elements
expected = %w[1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz]
result = fizzbuzz(15)
raise "First 15 wrong: #{result.inspect}" unless result == expected

# 2. Empty range
raise "fizzbuzz(0) should return []" unless fizzbuzz(0) == []

# 3. Single element
raise "fizzbuzz(1) should return ['1']" unless fizzbuzz(1) == ['1']

# 4. Larger input — spot check
result100 = fizzbuzz(100)
raise "Length should be 100" unless result100.length == 100
raise "Position 30 should be FizzBuzz" unless result100[29] == 'FizzBuzz'
raise "Position 97 should be 97" unless result100[96] == '97'

# 5. No conditionals check — source code inspection
src = File.read('solution.rb')
banned = /\\b(if|unless|case|when)\\b|[^=!<>]=.*\\?.*:/
raise "Source contains conditionals! Constraint violated." if src.match?(banned)

# 6. FizzBuzz at 15, 30, 45
[15, 30, 45].each do |n|
  raise "Position #{n} should be FizzBuzz" unless fizzbuzz(45)[n - 1] == 'FizzBuzz'
end

puts 'All tests passed'
`,
    variations: [
      {
        ownerRole: 'Ruby purist who values idiomatic, elegant code and has given conference talks on creative Ruby patterns',
        ownerContext:
          'Evaluate the creativity of the approach. Hash-based lookup is the standard trick, but there are cleverer approaches (string concatenation with empty-string fallback, array indexing with boolean-to-integer conversion). A solution that just wraps if/else in a lambda or method call to technically avoid the keyword is cheating — call it out.',
      },
      {
        ownerRole: 'Interviewer who uses constraint-based problems to assess lateral thinking and language fluency',
        ownerContext:
          'This exercise tests whether the developer can think outside procedural patterns. The quality of the solution reveals how well they know Ruby idioms. A developer who struggles here likely relies on conditionals for everything. Evaluate conciseness: a 3-line solution is excellent, a 15-line solution suggests overthinking.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 067 — Parse Key-Value Config (Ruby, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-067-parse-key-value-config'),
    title: 'Parse Key-Value Config',
    description: `Implement a method \`parse_config(input)\` that parses a configuration file string and returns a nested hash.

Format rules:
- Lines of the form \`key = value\` define entries (whitespace around \`=\` is optional)
- Lines starting with \`#\` or \`;\` are comments (ignore them)
- Blank lines are ignored
- Section headers like \`[section]\` start a new section — subsequent keys go under that section
- Keys before any section header go under the key \`"global"\`
- Values should be stripped of leading/trailing whitespace
- Duplicate keys in the same section: last one wins

Example input:
\`\`\`
name = MyApp
version = 1.0

[database]
host = localhost
port = 5432

# This is a comment
[cache]
ttl = 3600
\`\`\`

Returns:
\`\`\`ruby
{
  "global" => { "name" => "MyApp", "version" => "1.0" },
  "database" => { "host" => "localhost", "port" => "5432" },
  "cache" => { "ttl" => "3600" }
}
\`\`\`

Define your method in \`solution.rb\`.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'parsing',
    languages: ['ruby'],
    tags: ['parsing', 'strings', 'hash'],
    topics: ['string-parsing', 'configuration', 'ini-format', 'state-machine'],
    testCode: `require_relative 'solution'

# 1. Basic parsing
input1 = <<~CFG
  name = MyApp
  version = 1.0

  [database]
  host = localhost
  port = 5432
CFG
result1 = parse_config(input1)
raise "global name" unless result1["global"]["name"] == "MyApp"
raise "db host" unless result1["database"]["host"] == "localhost"
raise "db port" unless result1["database"]["port"] == "5432"

# 2. Comments and blank lines
input2 = <<~CFG
  # comment
  ; another comment

  key = value
CFG
result2 = parse_config(input2)
raise "should have only global with one key" unless result2 == { "global" => { "key" => "value" } }

# 3. Empty input
raise "empty input" unless parse_config("") == {}

# 4. Duplicate keys — last wins
input4 = <<~CFG
  [s]
  a = 1
  a = 2
CFG
raise "last wins" unless parse_config(input4)["s"]["a"] == "2"

# 5. Whitespace handling
input5 = <<~CFG
  [section]
  key   =    lots of space
CFG
raise "value trim" unless parse_config(input5)["section"]["key"] == "lots of space"

# 6. Value with = sign in it
input6 = <<~CFG
  [math]
  equation = x = y + 1
CFG
raise "value with equals" unless parse_config(input6)["math"]["equation"] == "x = y + 1"

# 7. Multiple sections, no global
input7 = <<~CFG
  [a]
  x = 1
  [b]
  y = 2
CFG
result7 = parse_config(input7)
raise "no global expected" if result7.key?("global")
raise "section a" unless result7["a"]["x"] == "1"
raise "section b" unless result7["b"]["y"] == "2"

# 8. Section with no keys
input8 = <<~CFG
  [empty]
  [filled]
  key = val
CFG
result8 = parse_config(input8)
raise "empty section should exist" unless result8.key?("empty")
raise "empty section should be empty hash" unless result8["empty"] == {}

puts 'All tests passed'
`,
    variations: [
      {
        ownerRole: 'DevOps engineer who maintains internal configuration tooling and has seen every edge case in INI-like formats',
        ownerContext:
          'The tricky cases are: values containing `=` signs, empty sections, and the global/no-global distinction. Evaluate whether the parser correctly splits on the FIRST `=` only. A naive `split("=")` will break on values like `equation = x = 1`. Check that empty input returns an empty hash, not a hash with an empty global section.',
      },
      {
        ownerRole: 'Ruby developer who values clean, readable parsing code over regex cleverness',
        ownerContext:
          'Evaluate the structure of the parser. A well-written solution uses a clear state variable for the current section and iterates lines once. Over-engineered regex solutions or multiple-pass approaches are a smell. The code should be readable enough that a junior developer could modify it.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 068 — Parse CSV Without Libraries (Python, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-068-parse-csv-without-libraries'),
    title: 'Parse CSV Without Libraries',
    description: `Implement a function \`parse_csv(text: str) -> list[list[str]]\` that parses CSV text into a list of rows, where each row is a list of field strings.

Rules:
- Fields are separated by commas
- Fields may be enclosed in double quotes: \`"field"\`
- Inside a quoted field, a literal double quote is escaped as \`""\`
- Inside a quoted field, commas and newlines are literal (part of the value)
- Unquoted fields are trimmed of leading/trailing whitespace
- Quoted fields are NOT trimmed beyond removing the enclosing quotes
- Rows are separated by \`\\n\` (but \`\\n\` inside quotes is part of the field)

**Do NOT use the \`csv\` module or any external library.**

Define your function in \`solution.py\`.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'parsing',
    languages: ['python'],
    tags: ['parsing', 'strings', 'state-machine'],
    topics: ['csv-parsing', 'state-machine', 'string-processing', 'edge-cases'],
    testCode: `from solution import parse_csv

# 1. Simple CSV
assert parse_csv("a,b,c\\n1,2,3") == [["a", "b", "c"], ["1", "2", "3"]]

# 2. Quoted fields with commas
assert parse_csv('"hello, world",b,c') == [["hello, world", "b", "c"]]

# 3. Escaped quotes inside quoted field
assert parse_csv('"say ""hello""",b') == [['say "hello"', "b"]]

# 4. Newline inside quoted field
result = parse_csv('"line1\\nline2",b\\nc,d')
assert result == [["line1\\nline2", "b"], ["c", "d"]], f"Got: {result}"

# 5. Empty input
assert parse_csv("") == []

# 6. Empty fields
assert parse_csv(",,,") == [["", "", "", ""]]

# 7. Whitespace trimming on unquoted fields
assert parse_csv("  a  , b ,c") == [["a", "b", "c"]]

# 8. Quoted field with only whitespace (NOT trimmed)
assert parse_csv('"  spaces  ",b') == [["  spaces  ", "b"]]

# 9. Single field, single row
assert parse_csv("hello") == [["hello"]]

# 10. Mixed quoted and unquoted
result = parse_csv('name,desc,value\\nAlice,"likes, commas",42\\nBob,"says ""hi""",7')
assert result == [
    ["name", "desc", "value"],
    ["Alice", "likes, commas", "42"],
    ["Bob", 'says "hi"', "7"],
], f"Got: {result}"

print("All tests passed")
`,
    variations: [
      {
        ownerRole: 'Data engineer who has debugged CSV parsing issues in ETL pipelines handling millions of rows with messy data',
        ownerContext:
          'The make-or-break test cases are: newlines inside quoted fields, escaped quotes (`""`), and empty fields. A regex-only approach will almost certainly fail on embedded newlines. Evaluate whether the solution uses a proper state machine (character-by-character) or a fragile split-then-fixup approach. The state machine is the only robust solution.',
      },
      {
        ownerRole: 'Python educator who teaches parsing fundamentals and has graded hundreds of CSV parser implementations',
        ownerContext:
          'Common mistakes: (1) splitting on newlines first, then commas — breaks on newlines in quotes, (2) using regex to handle quotes — breaks on edge cases, (3) forgetting that `""` is an escaped quote, not an empty field. A correct solution processes character by character with an `in_quotes` flag. Bonus: does the developer handle trailing newlines gracefully?',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 069 — Matrix Rotation In-Place (Python, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-069-matrix-rotation-in-place'),
    title: 'Matrix Rotation In-Place',
    description: `Implement a function \`rotate_matrix(matrix: list[list[int]]) -> None\` that rotates an NxN matrix 90 degrees clockwise **in-place**.

The function should modify the matrix directly and return \`None\`.

Example:
\`\`\`python
m = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]
rotate_matrix(m)
# m is now:
# [
#   [7, 4, 1],
#   [8, 5, 2],
#   [9, 6, 3]
# ]
\`\`\`

**Constraint: Do NOT allocate a new matrix.** You must rotate in-place using O(1) extra space.

Define your function in \`solution.py\`.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'algorithms',
    languages: ['python'],
    tags: ['matrix', 'in-place', 'geometry'],
    topics: ['matrix-rotation', 'in-place-algorithms', 'space-complexity', 'transposition'],
    testCode: `from solution import rotate_matrix
import copy

# 1. 3x3 matrix
m1 = [[1,2,3],[4,5,6],[7,8,9]]
rotate_matrix(m1)
assert m1 == [[7,4,1],[8,5,2],[9,6,3]], f"3x3 failed: {m1}"

# 2. 1x1 matrix
m2 = [[42]]
rotate_matrix(m2)
assert m2 == [[42]], "1x1 should be unchanged"

# 3. 2x2 matrix
m3 = [[1,2],[3,4]]
rotate_matrix(m3)
assert m3 == [[3,1],[4,2]], f"2x2 failed: {m3}"

# 4. 4x4 matrix
m4 = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]
rotate_matrix(m4)
assert m4 == [[13,9,5,1],[14,10,6,2],[15,11,7,3],[16,12,8,4]], f"4x4 failed: {m4}"

# 5. Returns None (in-place)
m5 = [[1,2],[3,4]]
ret = rotate_matrix(m5)
assert ret is None, "function must return None (in-place modification)"

# 6. Four rotations return to original
m6 = [[1,2,3],[4,5,6],[7,8,9]]
original = copy.deepcopy(m6)
for _ in range(4):
    rotate_matrix(m6)
assert m6 == original, "four 90° rotations should return to original"

# 7. Larger matrix (10x10) — correctness via double rotation = 180°
import random
random.seed(42)
m7 = [[random.randint(0,100) for _ in range(10)] for _ in range(10)]
original7 = copy.deepcopy(m7)
rotate_matrix(m7)
rotate_matrix(m7)
# 180° rotation: element [i][j] -> [n-1-i][n-1-j]
n = 10
for i in range(n):
    for j in range(n):
        assert m7[i][j] == original7[n-1-i][n-1-j], f"180° check failed at [{i}][{j}]"

# 8. In-place check — must use same list objects
m8 = [[1,2],[3,4]]
row_ids = [id(row) for row in m8]
rotate_matrix(m8)
new_row_ids = [id(row) for row in m8]
assert row_ids == new_row_ids, "must reuse same row lists (truly in-place)"

print("All tests passed")
`,
    variations: [
      {
        ownerRole: 'Algorithm instructor at a competitive programming training camp',
        ownerContext:
          'The classic approach is transpose + reverse rows, or the four-way swap layer by layer. Evaluate which approach the developer uses. Transpose + reverse is more elegant and less error-prone. The layer-by-layer swap has more room for off-by-one errors. Check that no new matrix is allocated — a solution that creates a copy and assigns back is not in-place.',
      },
      {
        ownerRole: 'Systems programmer who cares about memory layout and cache performance',
        ownerContext:
          'Evaluate whether the solution truly uses O(1) extra space. Creating a list comprehension for a new matrix and then copying back is O(n²) space even if you overwrite the original. The in-place constraint is the entire point of this exercise. Bonus: does the developer handle the 1x1 edge case without special-casing it?',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 070 — Bounded Worker Pool (Go, hard)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-070-bounded-worker-pool'),
    title: 'Bounded Worker Pool',
    description: `Implement a bounded worker pool in Go that processes tasks with limited concurrency and supports graceful shutdown.

\`\`\`go
package main

// Pool manages a fixed number of workers that process tasks concurrently.
type Pool struct {
    // your fields
}

// NewPool creates a worker pool with the given max concurrency.
func NewPool(maxWorkers int) *Pool

// Submit adds a task to the pool. It may block if all workers are busy
// and the internal queue is full. Returns an error if the pool is shut down.
func (p *Pool) Submit(task func()) error

// Shutdown signals workers to stop after finishing current tasks.
// It blocks until all submitted tasks have completed.
func (p *Pool) Shutdown()
\`\`\`

Requirements:
- At most \`maxWorkers\` tasks run concurrently
- \`Submit\` blocks if workers are all busy (bounded queue is acceptable)
- After \`Shutdown()\`, \`Submit\` returns an error
- \`Shutdown()\` waits for all in-progress tasks to finish
- No goroutine leaks

Write your implementation in \`solution.go\` (package main).`,
    duration: 30,
    difficulty: 'hard',
    type: 'code',
    category: 'concurrency',
    languages: ['go'],
    tags: ['goroutines', 'channels', 'concurrency'],
    topics: ['worker-pool', 'goroutine-management', 'graceful-shutdown', 'channels', 'sync-primitives'],
    testCode: `package main

import (
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestBasicExecution(t *testing.T) {
	pool := NewPool(2)
	var count int64
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		err := pool.Submit(func() {
			atomic.AddInt64(&count, 1)
			wg.Done()
		})
		if err != nil {
			t.Fatalf("Submit should not fail before shutdown: %v", err)
		}
	}
	wg.Wait()
	pool.Shutdown()
	if atomic.LoadInt64(&count) != 10 {
		t.Fatalf("expected 10 tasks executed, got %d", count)
	}
}

func TestMaxConcurrency(t *testing.T) {
	pool := NewPool(3)
	var active int64
	var maxActive int64
	var mu sync.Mutex
	var wg sync.WaitGroup

	for i := 0; i < 20; i++ {
		wg.Add(1)
		pool.Submit(func() {
			defer wg.Done()
			cur := atomic.AddInt64(&active, 1)
			mu.Lock()
			if cur > maxActive {
				maxActive = cur
			}
			mu.Unlock()
			time.Sleep(10 * time.Millisecond)
			atomic.AddInt64(&active, -1)
		})
	}
	wg.Wait()
	pool.Shutdown()
	if maxActive > 3 {
		t.Fatalf("max concurrency exceeded: got %d active, want <= 3", maxActive)
	}
	if maxActive < 2 {
		t.Fatalf("concurrency too low: got %d active, want >= 2 (workers not running in parallel?)", maxActive)
	}
}

func TestShutdownWaits(t *testing.T) {
	pool := NewPool(2)
	var done int64

	pool.Submit(func() {
		time.Sleep(100 * time.Millisecond)
		atomic.StoreInt64(&done, 1)
	})
	time.Sleep(10 * time.Millisecond) // let task start
	pool.Shutdown()
	if atomic.LoadInt64(&done) != 1 {
		t.Fatal("Shutdown returned before task completed")
	}
}

func TestSubmitAfterShutdown(t *testing.T) {
	pool := NewPool(2)
	pool.Shutdown()
	err := pool.Submit(func() {})
	if err == nil {
		t.Fatal("Submit after Shutdown should return an error")
	}
}

func TestShutdownIdempotent(t *testing.T) {
	pool := NewPool(2)
	pool.Shutdown()
	// second call should not panic or deadlock
	done := make(chan struct{})
	go func() {
		pool.Shutdown()
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("second Shutdown call deadlocked")
	}
}

func TestSingleWorker(t *testing.T) {
	pool := NewPool(1)
	results := make([]int, 0, 5)
	var mu sync.Mutex
	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		i := i
		wg.Add(1)
		pool.Submit(func() {
			defer wg.Done()
			mu.Lock()
			results = append(results, i)
			mu.Unlock()
		})
	}
	wg.Wait()
	pool.Shutdown()
	if len(results) != 5 {
		t.Fatalf("expected 5 results, got %d", len(results))
	}
}

func TestNoGoroutineLeaks(t *testing.T) {
	// We can't easily count goroutines in Piston, but we can ensure
	// Shutdown returns in a reasonable time (no stuck goroutines).
	pool := NewPool(4)
	for i := 0; i < 100; i++ {
		pool.Submit(func() {
			time.Sleep(time.Millisecond)
		})
	}
	done := make(chan struct{})
	go func() {
		pool.Shutdown()
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("Shutdown did not return in time — likely goroutine leak")
	}
}

var _ = errors.New // ensure import is used
`,
    variations: [
      {
        ownerRole: 'Go concurrency expert who has authored open-source worker pool libraries and debugged goroutine leaks in production systems',
        ownerContext:
          'The critical evaluation points: (1) Does the pool properly use channels for task dispatch — not spawning a new goroutine per task? (2) Is Shutdown correctly implemented using sync.WaitGroup or channel closing? (3) Are there race conditions around the shutdown flag and Submit? A solution using a mutex around a boolean flag plus a channel is the standard approach. Watch for subtle bugs: closing a channel that Submit might still write to causes a panic.',
      },
      {
        ownerRole: 'Senior backend engineer who reviews Go code for production services handling 100k+ requests/second',
        ownerContext:
          'Evaluate production-readiness: Does Submit return a meaningful error or just a generic one? Is the pool safe to use from multiple goroutines simultaneously? A common mistake is checking the shutdown flag without synchronization. The solution should be race-free under `go test -race`. Bonus: does the developer handle the edge case of NewPool(0) or negative workers?',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 071 — LRU Cache (Go, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-071-lru-cache'),
    title: 'LRU Cache',
    description: `Implement an LRU (Least Recently Used) cache with O(1) time complexity for both \`Get\` and \`Put\` operations.

\`\`\`go
package main

type LRUCache struct {
    // your fields
}

// NewLRUCache creates a cache with the given capacity.
func NewLRUCache(capacity int) *LRUCache

// Get returns the value for the key and true, or (0, false) if not found.
// Accessing a key makes it the most recently used.
func (c *LRUCache) Get(key int) (int, bool)

// Put inserts or updates the key-value pair.
// If the cache is at capacity, evict the least recently used entry first.
func (c *LRUCache) Put(key int, value int)
\`\`\`

You must implement this using a doubly linked list + hash map (or equivalent structure that achieves O(1) for both operations). Do not use \`container/list\` from the standard library — implement the linked list yourself.

Write your implementation in \`solution.go\` (package main).`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'data-structures',
    languages: ['go'],
    tags: ['cache', 'linked-list', 'hashmap'],
    topics: ['lru-cache', 'doubly-linked-list', 'hash-map', 'eviction-policy'],
    testCode: `package main

import (
	"testing"
)

func TestBasicGetPut(t *testing.T) {
	c := NewLRUCache(2)
	c.Put(1, 10)
	c.Put(2, 20)
	if v, ok := c.Get(1); !ok || v != 10 {
		t.Fatalf("Get(1) = (%d, %v), want (10, true)", v, ok)
	}
	if v, ok := c.Get(2); !ok || v != 20 {
		t.Fatalf("Get(2) = (%d, %v), want (20, true)", v, ok)
	}
}

func TestEviction(t *testing.T) {
	c := NewLRUCache(2)
	c.Put(1, 1)
	c.Put(2, 2)
	c.Put(3, 3) // evicts key 1
	if _, ok := c.Get(1); ok {
		t.Fatal("key 1 should have been evicted")
	}
	if v, ok := c.Get(2); !ok || v != 2 {
		t.Fatal("key 2 should still exist")
	}
	if v, ok := c.Get(3); !ok || v != 3 {
		t.Fatal("key 3 should exist")
	}
}

func TestGetUpdatesRecency(t *testing.T) {
	c := NewLRUCache(2)
	c.Put(1, 1)
	c.Put(2, 2)
	c.Get(1)    // makes key 1 most recent
	c.Put(3, 3) // should evict key 2, not key 1
	if _, ok := c.Get(2); ok {
		t.Fatal("key 2 should have been evicted (1 was accessed more recently)")
	}
	if v, ok := c.Get(1); !ok || v != 1 {
		t.Fatal("key 1 should still exist")
	}
}

func TestUpdateExistingKey(t *testing.T) {
	c := NewLRUCache(2)
	c.Put(1, 10)
	c.Put(1, 20) // update, not insert
	if v, ok := c.Get(1); !ok || v != 20 {
		t.Fatalf("Get(1) = (%d, %v), want (20, true)", v, ok)
	}
	// capacity should still be 2, not reduced
	c.Put(2, 2)
	c.Put(3, 3) // evicts key 1 (oldest), not key 2
	if _, ok := c.Get(1); ok {
		t.Fatal("key 1 should have been evicted after update + 2 new inserts")
	}
}

func TestMissReturnsZeroFalse(t *testing.T) {
	c := NewLRUCache(1)
	v, ok := c.Get(999)
	if ok || v != 0 {
		t.Fatalf("Get miss = (%d, %v), want (0, false)", v, ok)
	}
}

func TestCapacityOne(t *testing.T) {
	c := NewLRUCache(1)
	c.Put(1, 1)
	c.Put(2, 2) // evicts 1
	if _, ok := c.Get(1); ok {
		t.Fatal("key 1 should be evicted in capacity-1 cache")
	}
	if v, ok := c.Get(2); !ok || v != 2 {
		t.Fatal("key 2 should exist")
	}
}

func TestLargerWorkload(t *testing.T) {
	c := NewLRUCache(100)
	for i := 0; i < 200; i++ {
		c.Put(i, i*10)
	}
	// keys 0-99 should be evicted
	for i := 0; i < 100; i++ {
		if _, ok := c.Get(i); ok {
			t.Fatalf("key %d should have been evicted", i)
		}
	}
	// keys 100-199 should exist
	for i := 100; i < 200; i++ {
		if v, ok := c.Get(i); !ok || v != i*10 {
			t.Fatalf("key %d: got (%d, %v), want (%d, true)", i, v, ok, i*10)
		}
	}
}

func TestPutUpdatesRecency(t *testing.T) {
	c := NewLRUCache(2)
	c.Put(1, 1)
	c.Put(2, 2)
	c.Put(1, 100) // update key 1, making it most recent
	c.Put(3, 3)   // should evict key 2
	if _, ok := c.Get(2); ok {
		t.Fatal("key 2 should be evicted (key 1 was updated more recently)")
	}
	if v, ok := c.Get(1); !ok || v != 100 {
		t.Fatalf("key 1 should be 100, got %d", v)
	}
}
`,
    variations: [
      {
        ownerRole: 'Systems engineer who has implemented caches in production serving billions of requests and has benchmarked every approach',
        ownerContext:
          'The key evaluation: are both Get and Put truly O(1)? Check for the doubly linked list + map combination. A solution using a slice and scanning for the LRU element is O(n) and misses the point. Also check: does the developer handle the update case (Put on existing key) by moving the node to the head, or do they insert a duplicate?',
      },
      {
        ownerRole: 'Go developer who reviews data structure implementations for correctness and idiomatic Go style',
        ownerContext:
          'Evaluate the linked list implementation. Sentinel nodes (dummy head/tail) make the code much cleaner — give credit for using them. Check for pointer correctness: a common bug is not updating both `prev` and `next` pointers when removing or inserting, leading to memory leaks or corrupted traversal. The map should store pointers to nodes, not copies.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 072 — Custom Error Types (Go, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-072-custom-error-types'),
    title: 'Custom Error Types',
    description: `Implement a set of custom error types in Go that properly support the \`errors.Is()\`, \`errors.As()\`, and \`errors.Unwrap()\` interfaces.

\`\`\`go
package main

import "fmt"

// NotFoundError represents a missing resource.
type NotFoundError struct {
    Resource string
    ID       string
}
// Must implement: error, Unwrap (wraps nothing for base case)

// ValidationError represents invalid input with a field name and reason.
type ValidationError struct {
    Field   string
    Reason  string
}
// Must implement: error

// AppError wraps another error with an operation name and optional error code.
type AppError struct {
    Op   string
    Code int
    Err  error
}
// Must implement: error, Unwrap, Is (matches if Op fields are equal)

// Wrap creates an AppError wrapping the given error.
func Wrap(op string, code int, err error) *AppError
\`\`\`

Requirements:
- \`NotFoundError.Error()\` returns: \`"<Resource> not found: <ID>"\`
- \`ValidationError.Error()\` returns: \`"validation failed on <Field>: <Reason>"\`
- \`AppError.Error()\` returns: \`"<Op>: <wrapped error message>"\`
- \`AppError.Unwrap()\` returns the wrapped error
- \`errors.Is(appErr1, appErr2)\` returns true if both are AppErrors with the same \`Op\`
- \`errors.As\` must work to extract specific error types from wrapped chains

Write your implementation in \`solution.go\` (package main).`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'error-handling',
    languages: ['go'],
    tags: ['errors', 'interfaces', 'go-idioms'],
    topics: ['custom-errors', 'error-wrapping', 'error-inspection', 'go-error-interface'],
    testCode: `package main

import (
	"errors"
	"fmt"
	"strings"
	"testing"
)

func TestNotFoundErrorMessage(t *testing.T) {
	err := &NotFoundError{Resource: "User", ID: "abc-123"}
	expected := "User not found: abc-123"
	if err.Error() != expected {
		t.Fatalf("got %q, want %q", err.Error(), expected)
	}
}

func TestValidationErrorMessage(t *testing.T) {
	err := &ValidationError{Field: "email", Reason: "invalid format"}
	expected := "validation failed on email: invalid format"
	if err.Error() != expected {
		t.Fatalf("got %q, want %q", err.Error(), expected)
	}
}

func TestAppErrorMessage(t *testing.T) {
	inner := &NotFoundError{Resource: "Order", ID: "42"}
	err := Wrap("GetOrder", 404, inner)
	if !strings.Contains(err.Error(), "GetOrder") {
		t.Fatalf("AppError message should contain Op, got: %s", err.Error())
	}
	if !strings.Contains(err.Error(), "Order not found: 42") {
		t.Fatalf("AppError message should contain wrapped error, got: %s", err.Error())
	}
}

func TestAppErrorUnwrap(t *testing.T) {
	inner := &ValidationError{Field: "age", Reason: "must be positive"}
	err := Wrap("CreateUser", 400, inner)
	if errors.Unwrap(err) != inner {
		t.Fatal("Unwrap should return the inner error")
	}
}

func TestErrorsAs(t *testing.T) {
	inner := &NotFoundError{Resource: "Product", ID: "99"}
	wrapped := Wrap("GetProduct", 404, inner)
	// Should be able to extract NotFoundError from wrapped chain
	var nfe *NotFoundError
	if !errors.As(wrapped, &nfe) {
		t.Fatal("errors.As should find NotFoundError in chain")
	}
	if nfe.ID != "99" {
		t.Fatalf("extracted ID = %q, want %q", nfe.ID, "99")
	}
}

func TestErrorsIsWithAppError(t *testing.T) {
	err1 := Wrap("FetchData", 500, fmt.Errorf("timeout"))
	sentinel := &AppError{Op: "FetchData"}
	if !errors.Is(err1, sentinel) {
		t.Fatal("errors.Is should match AppErrors with same Op")
	}
	other := &AppError{Op: "SaveData"}
	if errors.Is(err1, other) {
		t.Fatal("errors.Is should not match AppErrors with different Op")
	}
}

func TestErrorsIsDoesNotMatchDifferentTypes(t *testing.T) {
	err := Wrap("DoThing", 500, fmt.Errorf("fail"))
	if errors.Is(err, &NotFoundError{}) {
		t.Fatal("AppError should not match NotFoundError via Is")
	}
}

func TestDeepWrapping(t *testing.T) {
	base := &ValidationError{Field: "name", Reason: "too short"}
	mid := Wrap("Validate", 400, base)
	top := Wrap("CreateUser", 400, mid)

	// Should be able to reach ValidationError through two layers
	var ve *ValidationError
	if !errors.As(top, &ve) {
		t.Fatal("errors.As should find ValidationError through two AppError layers")
	}
	if ve.Field != "name" {
		t.Fatalf("Field = %q, want %q", ve.Field, "name")
	}

	// Should match both Op values via Is
	if !errors.Is(top, &AppError{Op: "CreateUser"}) {
		t.Fatal("should match outer Op")
	}
	if !errors.Is(top, &AppError{Op: "Validate"}) {
		t.Fatal("should match inner Op via chain traversal")
	}
}

func TestWrapNilError(t *testing.T) {
	err := Wrap("NoOp", 0, nil)
	if err.Err != nil {
		t.Fatal("wrapping nil should keep Err as nil")
	}
}

var _ = fmt.Sprintf // ensure import used
`,
    variations: [
      {
        ownerRole: 'Go standard library contributor who helped design the errors.Is/As/Unwrap interfaces in Go 1.13',
        ownerContext:
          'The key evaluation: does the developer correctly implement the `Is(target error) bool` method on AppError? The method must type-assert the target to *AppError and compare the Op field. A common mistake is comparing the full error message instead of the semantic field. Also check: does Unwrap return the wrapped error directly (not a copy)? The chain must be traversable by the errors package.',
      },
      {
        ownerRole: 'Backend engineer who maintains a Go service with 200+ custom error types and has strong opinions on error design',
        ownerContext:
          'Evaluate whether the error messages are useful for debugging. Error messages should include context (the Op) and be chainable. Check that the developer does not accidentally implement `Is` on a value receiver when the errors are pointer types — this is a subtle bug that makes errors.Is fail. Also evaluate: is the Wrap function a clean factory, or does it have unnecessary complexity?',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 073 — Rank Employees by Department (SQL, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-073-rank-employees-by-department'),
    title: 'Rank Employees by Department',
    description: `Write a SQL query that ranks employees by salary within their department and compares each employee's salary to their department's average.

Your query must return the following columns:
- \`department\` — the department name
- \`employee_name\` — the employee's name
- \`salary\` — the employee's salary
- \`dept_rank\` — rank within department by salary (highest = 1, use RANK)
- \`dept_avg_salary\` — the average salary of the department, rounded to 2 decimal places
- \`diff_from_avg\` — how much this employee's salary differs from the dept average (salary - avg), rounded to 2 decimal places

Order the results by \`department\` ASC, \`dept_rank\` ASC.

Write your query in the solution file.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['window-functions', 'rank', 'aggregation'],
    topics: ['window-functions', 'RANK', 'PARTITION-BY', 'aggregate-comparison'],
    testCode: `-- @SCHEMA
CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  employee_name TEXT NOT NULL,
  department TEXT NOT NULL,
  salary NUMERIC NOT NULL
);

-- @SEED
INSERT INTO employees (id, employee_name, department, salary) VALUES
(1, 'Alice', 'Engineering', 120000),
(2, 'Bob', 'Engineering', 110000),
(3, 'Charlie', 'Engineering', 110000),
(4, 'Diana', 'Sales', 90000),
(5, 'Eve', 'Sales', 80000),
(6, 'Frank', 'Sales', 85000),
(7, 'Grace', 'Marketing', 95000),
(8, 'Heidi', 'Marketing', 95000);

-- @EXPECTED
department|employee_name|salary|dept_rank|dept_avg_salary|diff_from_avg
Engineering|Alice|120000|1|113333.33|6666.67
Engineering|Bob|110000|2|113333.33|-3333.33
Engineering|Charlie|110000|2|113333.33|-3333.33
Marketing|Grace|95000|1|95000.00|0.00
Marketing|Heidi|95000|1|95000.00|0.00
Sales|Diana|90000|1|85000.00|5000.00
Sales|Frank|85000|2|85000.00|0.00
Sales|Eve|80000|3|85000.00|-5000.00
`,
    variations: [
      {
        ownerRole: 'Data analyst lead who trains junior analysts on window functions and has seen every common mistake',
        ownerContext:
          'Check that the developer uses RANK (not ROW_NUMBER or DENSE_RANK) as specified. RANK produces ties correctly — two employees with the same salary get the same rank. Evaluate whether they use a window function for the average (AVG OVER PARTITION BY) rather than a subquery or self-join. The window function approach is both cleaner and more performant.',
      },
      {
        ownerRole: 'Database performance consultant who has optimized analytical queries on tables with 100M+ rows',
        ownerContext:
          'Evaluate the query plan implications. Using window functions (RANK and AVG with PARTITION BY) in a single pass is optimal. A solution that uses correlated subqueries for the average will scan the table N times. Also check: does the developer handle the rounding correctly? ROUND() behavior varies by database — the solution should be explicit about precision.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 074 — Find Churned Users (SQL, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-074-find-churned-users'),
    title: 'Find Churned Users',
    description: `Write a SQL query to find "churned" users: users who were active 3 months ago but have had NO activity in the last month.

The reference date is \`2024-04-15\` (use this as "today").

- "Active 3 months ago" means the user has at least one activity record where \`activity_date\` falls within the range from 3 months before today to 2 months before today (i.e., between \`2024-01-15\` and \`2024-02-14\` inclusive).
- "No activity last month" means no activity records where \`activity_date >= 2024-03-15\`.

Return columns:
- \`user_id\`
- \`user_name\`
- \`last_activity_date\` — the most recent activity date for that user

Order by \`last_activity_date\` DESC, then \`user_id\` ASC.

Write your query in the solution file.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['date-ranges', 'subqueries', 'churn-analysis'],
    topics: ['date-filtering', 'NOT-EXISTS', 'churn-detection', 'user-analytics'],
    testCode: `-- @SCHEMA
CREATE TABLE users (
  user_id INTEGER PRIMARY KEY,
  user_name TEXT NOT NULL
);

CREATE TABLE activity (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(user_id),
  activity_date DATE NOT NULL
);

-- @SEED
INSERT INTO users (user_id, user_name) VALUES
(1, 'Alice'),
(2, 'Bob'),
(3, 'Charlie'),
(4, 'Diana'),
(5, 'Eve');

INSERT INTO activity (id, user_id, activity_date) VALUES
-- Alice: active 3mo ago AND last month → not churned
(1, 1, '2024-01-20'),
(2, 1, '2024-03-20'),
-- Bob: active 3mo ago, nothing since → churned
(3, 2, '2024-01-25'),
(4, 2, '2024-02-10'),
-- Charlie: active 3mo ago, nothing last month → churned
(5, 3, '2024-01-18'),
-- Diana: only active last month → not churned (wasn't active 3mo ago)
(6, 4, '2024-04-01'),
-- Eve: active 3mo ago, last activity just before cutoff → churned
(7, 5, '2024-02-01'),
(8, 5, '2024-03-10');

-- @EXPECTED
user_id|user_name|last_activity_date
5|Eve|2024-03-10
2|Bob|2024-02-10
3|Charlie|2024-01-18
`,
    variations: [
      {
        ownerRole: 'Product analyst at a SaaS company who defines and tracks churn metrics across 50M users',
        ownerContext:
          'The critical evaluation points: (1) Does the developer correctly define the time windows? Off-by-one on date boundaries is the #1 source of churn metric errors. (2) Do they use NOT EXISTS or LEFT JOIN/IS NULL pattern for the "no recent activity" check? Both are correct, but NOT EXISTS is clearer. (3) Is the "active 3 months ago" check an existence check (not an aggregate)?',
      },
      {
        ownerRole: 'SQL performance engineer who optimizes analytical queries on event tables with billions of rows',
        ownerContext:
          'Evaluate the query structure. A correlated subquery for each user is O(n*m) and catastrophic on large tables. The preferred approach uses EXISTS/NOT EXISTS with date-indexed lookups, or a GROUP BY with HAVING and conditional aggregation. Check that the developer does not use BETWEEN for dates without understanding inclusive boundaries.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 075 — Recursive CTE: Org Chart (SQL, hard)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-075-recursive-cte-org-chart'),
    title: 'Recursive CTE: Org Chart',
    description: `Write a SQL query using a recursive CTE to find all direct and indirect reports of a given manager.

Given a manager with \`employee_id = 1\`, find all employees who report to them (directly or through a chain of managers).

Return columns:
- \`employee_id\`
- \`employee_name\`
- \`manager_id\`
- \`depth\` — how many levels below the given manager (direct reports = 1, their reports = 2, etc.)

Order by \`depth\` ASC, then \`employee_name\` ASC.

**Do NOT include the manager themselves in the output.**

Write your query in the solution file.`,
    duration: 25,
    difficulty: 'hard',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['recursive-cte', 'hierarchy', 'tree-traversal'],
    topics: ['recursive-CTE', 'hierarchical-queries', 'org-chart', 'tree-traversal'],
    testCode: `-- @SCHEMA
CREATE TABLE org (
  employee_id INTEGER PRIMARY KEY,
  employee_name TEXT NOT NULL,
  manager_id INTEGER REFERENCES org(employee_id)
);

-- @SEED
INSERT INTO org (employee_id, employee_name, manager_id) VALUES
(1, 'CEO Alice', NULL),
(2, 'VP Bob', 1),
(3, 'VP Charlie', 1),
(4, 'Dir Diana', 2),
(5, 'Dir Eve', 2),
(6, 'Mgr Frank', 4),
(7, 'Eng Grace', 6),
(8, 'Eng Heidi', 3),
(9, 'Eng Ivan', 5),
(10, 'Intern Judy', 7);

-- @EXPECTED
employee_id|employee_name|manager_id|depth
2|VP Bob|1|1
3|VP Charlie|1|1
4|Dir Diana|2|2
5|Dir Eve|2|2
8|Eng Heidi|3|2
6|Mgr Frank|4|3
9|Eng Ivan|5|3
7|Eng Grace|6|4
10|Intern Judy|7|5
`,
    variations: [
      {
        ownerRole: 'Database architect who has implemented hierarchical queries in systems with org charts of 500k+ employees',
        ownerContext:
          'The evaluation focuses on the recursive CTE structure. The anchor member should select direct reports of manager_id=1 (depth=1). The recursive member joins the CTE back to org on manager_id. Common mistakes: (1) including the manager in the output, (2) starting depth at 0 instead of 1, (3) missing the termination condition (which is implicit in SQL recursive CTEs but can cause infinite loops if the data has cycles). Check if the developer adds a MAXRECURSION or depth limit as a safety measure.',
      },
      {
        ownerRole: 'Senior SQL developer who teaches advanced SQL techniques and has seen hundreds of recursive CTE attempts',
        ownerContext:
          'Evaluate clarity of the CTE structure. The anchor and recursive members should be clearly separated. A developer who tries to solve this with self-joins (without CTE) is showing they do not understand recursive CTEs. Also check: does the depth calculation correctly increment by 1 in the recursive member? A common bug is hardcoding depth values instead of computing them.',
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // 076 — CTE Refactor (SQL, medium)
  // ---------------------------------------------------------------------------
  {
    id: uuidv5('exercise-076-cte-refactor'),
    title: 'CTE Refactor',
    description: `The following nested subquery works but is nearly impossible to read. Rewrite it using CTEs (Common Table Expressions) to produce the **exact same result**.

Original query:
\`\`\`sql
SELECT d.department_name, stats.avg_salary, stats.top_earner, stats.headcount
FROM departments d
JOIN (
  SELECT department_id, avg_salary, top_earner, headcount
  FROM (
    SELECT
      e.department_id,
      ROUND(AVG(e.salary), 2) as avg_salary,
      MAX(e.salary) as max_sal,
      COUNT(*) as headcount
    FROM employees e
    WHERE e.salary > (
      SELECT AVG(salary) FROM employees
    )
    GROUP BY e.department_id
    HAVING COUNT(*) >= 2
  ) dept_stats
  JOIN (
    SELECT department_id, employee_name as top_earner, salary,
           ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) as rn
    FROM employees
  ) ranked ON ranked.department_id = dept_stats.department_id AND ranked.rn = 1
) stats ON stats.department_id = d.department_id
ORDER BY stats.avg_salary DESC;
\`\`\`

Rewrite this using WITH (CTE) syntax. The output columns and values must be identical.

Write your query in the solution file.`,
    duration: 15,
    difficulty: 'medium',
    type: 'code',
    category: 'sql',
    languages: ['sql'],
    tags: ['cte', 'refactoring', 'readability'],
    topics: ['CTE', 'query-refactoring', 'SQL-readability', 'subquery-elimination'],
    testCode: `-- @SCHEMA
CREATE TABLE departments (
  department_id INTEGER PRIMARY KEY,
  department_name TEXT NOT NULL
);

CREATE TABLE employees (
  id INTEGER PRIMARY KEY,
  employee_name TEXT NOT NULL,
  department_id INTEGER NOT NULL REFERENCES departments(department_id),
  salary NUMERIC NOT NULL
);

-- @SEED
INSERT INTO departments (department_id, department_name) VALUES
(1, 'Engineering'),
(2, 'Sales'),
(3, 'Marketing'),
(4, 'Support');

INSERT INTO employees (id, employee_name, department_id, salary) VALUES
(1, 'Alice', 1, 150000),
(2, 'Bob', 1, 130000),
(3, 'Charlie', 1, 120000),
(4, 'Diana', 2, 110000),
(5, 'Eve', 2, 100000),
(6, 'Frank', 2, 95000),
(7, 'Grace', 3, 90000),
(8, 'Heidi', 3, 85000),
(9, 'Ivan', 4, 60000),
(10, 'Judy', 4, 55000);

-- @EXPECTED
department_name|avg_salary|top_earner|headcount
Engineering|133333.33|Alice|3
Sales|105000.00|Diana|2
`,
    variations: [
      {
        ownerRole: 'Tech lead who reviews SQL in pull requests and has a strong opinion about query readability',
        ownerContext:
          'The evaluation is about readability, not just correctness. The CTEs should have meaningful names (not `cte1`, `cte2`). Each CTE should represent a logical step: (1) company-wide average, (2) department stats for above-average earners, (3) ranked employees for top earner, (4) final join. A solution that produces correct output but is still hard to read misses the point.',
      },
      {
        ownerRole: 'SQL developer who maintains a 500-query analytics codebase and has refactored dozens of legacy nested queries',
        ownerContext:
          'Check that the CTE version produces exactly the same results as the original. Common mistakes during refactoring: (1) changing the filter condition (WHERE salary > overall average), (2) losing the HAVING COUNT(*) >= 2 filter, (3) using DENSE_RANK instead of ROW_NUMBER for the top earner. The developer should verify their understanding of the original query before rewriting.',
      },
    ],
  },
]
