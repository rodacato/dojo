import { type SeedKata, uuidv5 } from './types'

// Five-minute kata on fixed code in starterCode. Point (D52): tap the line with
// the bug, explain why; rubric.answer.line is 1-based within the code. Predict:
// type what the code prints, explain why; rubric.answer.output is checked
// against a real run in Piston (PistonAdapter.integration.test.ts). Order
// (Parsons): starterCode holds the lines shuffled; rubric.answer.accepted lists
// every correct order of them, and a line in none of them is a distractor.
// Artifact (point): starterCode is a stack trace, log or query plan, named by
// its language; rubric.answer.also lists other lines that are equally right.

export const microKatas: SeedKata[] = [
  {
    id: uuidv5('kata-micro-001-pagination-off-by-one'),
    title: 'Off-by-one in pagination',
    description:
      'Pages are 1-based: page 1 should return the first `limit` items. Users report that the first page of results never shows up.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['micro', 'off-by-one'],
    topics: ['debugging', 'edge-cases'],
    starterCode: `function paginate<T>(items: T[], page: number, limit: number): T[] {
  if (page < 1 || limit < 1) return []
  const start = page * limit
  const end = start + limit
  return items.slice(start, end)
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'start treats a 1-based page as 0-based',
          severity: 'high',
          why: 'With page = 1, start is limit, so the slice begins at the second page and the first page is unreachable. start should be (page - 1) * limit.',
        },
      ],
      answer: { shape: 'point', line: 3 },
    },
    variations: [
      {
        ownerRole: 'Senior backend engineer who has shipped a dozen paginated APIs',
        ownerContext:
          'Credit a why that connects the 1-based contract to the slice offset. "Off by one" alone is a restatement, not a why.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-002-mutable-default-argument'),
    title: 'Tags that remember',
    description:
      'Each call should start with an empty list of tags. The second call prints both tags instead of only "billing".',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'debugging',
    languages: ['python'],
    tags: ['micro', 'python'],
    topics: ['debugging', 'python'],
    starterCode: `def add_tag(tag, tags=[]):
    if tag in tags:
        return tags
    tags.append(tag)
    return tags

first = add_tag("urgent")
second = add_tag("billing")
print(second)
`,
    rubric: {
      expectedIssues: [
        {
          title: 'Mutable default argument is shared across calls',
          severity: 'high',
          why: 'Python evaluates the default [] once, when the function is defined, so every call without tags appends to the same list. The fix is tags=None and creating a new list inside the function.',
        },
      ],
      answer: { shape: 'point', line: 1 },
    },
    variations: [
      {
        ownerRole: 'Python engineer who reviews a lot of code written by people coming from other languages',
        ownerContext:
          'The key insight is when the default is evaluated. A why that only says "the list is shared" without saying why it is shared is partial.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-003-async-foreach'),
    title: 'Zero emails sent',
    description:
      'Every user gets their email, yet notifyAll always reports that 0 emails were sent.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['micro', 'async'],
    topics: ['debugging', 'concurrency'],
    starterCode: `async function notifyAll(userIds: string[]): Promise<number> {
  let sent = 0
  userIds.forEach(async (id) => {
    await sendEmail(id)
    sent++
  })
  return sent
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'forEach does not wait for async callbacks',
          severity: 'high',
          why: 'forEach ignores the promises its callbacks return, so notifyAll returns before any sendEmail resolves and sent is still 0. Use for...of with await, or Promise.all over map.',
        },
      ],
      answer: { shape: 'point', line: 3 },
    },
    variations: [
      {
        ownerRole: 'Senior Node.js engineer who has debugged this exact report in production',
        ownerContext:
          'Credit a why that explains that the returned promises are dropped. Pointing at line 7 with a correct explanation is close but the cause is the forEach on line 3.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-004-not-in-null'),
    title: 'Nobody without orders',
    description:
      'The query should list customers who never placed an order. Most customers never did, and guest checkouts also create orders. It returns zero rows.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'sql',
    languages: ['sql'],
    tags: ['micro', 'null'],
    topics: ['sql', 'null-semantics'],
    starterCode: `SELECT c.id, c.email
FROM customers c
WHERE c.id NOT IN (
  SELECT o.customer_id
  FROM orders o
)
`,
    rubric: {
      expectedIssues: [
        {
          title: 'NOT IN against a subquery that can return NULL',
          severity: 'high',
          why: 'Guest orders put a NULL in the subquery. x NOT IN (..., NULL) is never true, only false or unknown, so every row is filtered out. Use NOT EXISTS, or exclude NULLs in the subquery.',
        },
      ],
      answer: { shape: 'point', line: 3 },
    },
    variations: [
      {
        ownerRole: 'Data engineer who has chased this empty result more than once',
        ownerContext:
          'The why must connect the NULL from guest orders to three-valued logic. Pointing at line 4 with that explanation is close; "NOT IN is slow" is not the bug.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-005-go-shadowed-config'),
    title: 'Loaded, but not used',
    description:
      'When a path is given, the log says the file was loaded, yet the service keeps running with the default settings.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'backend',
    languages: ['go'],
    tags: ['micro', 'go'],
    topics: ['debugging', 'scoping'],
    starterCode: `func loadConfig(path string) (*Config, error) {
	cfg := defaultConfig()
	if path != "" {
		cfg, err := parseFile(path)
		if err != nil {
			return nil, err
		}
		log.Printf("loaded %s", cfg.Name)
	}
	return cfg, nil
}
`,
    rubric: {
      expectedIssues: [
        {
          title: ':= inside the if block shadows the outer cfg',
          severity: 'high',
          why: 'cfg, err := declares a new cfg scoped to the if block. The parsed config is logged and then discarded, and the function returns the outer default. Declare err first and assign with =.',
        },
      ],
      answer: { shape: 'point', line: 4 },
    },
    variations: [
      {
        ownerRole: 'Go engineer who reviews services written by people new to the language',
        ownerContext:
          'Credit a why that names the new variable in the inner scope. "Wrong operator" without saying what := creates there is partial. Line 10 is where the bug shows, not where it starts.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-006-open-redirect'),
    title: 'Only local redirects',
    description:
      'After sign-in the app sends the user to the ?next= path. It is meant to allow only paths on this site, yet a security report shows a link that lands users on another domain.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'security',
    languages: ['typescript'],
    tags: ['micro', 'redirect'],
    topics: ['security', 'url-parsing'],
    starterCode: `function safeRedirect(next: string | null): string {
  if (!next) return '/dashboard'
  if (next.startsWith('/')) return next
  return '/dashboard'
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'A leading slash does not make a URL local',
          severity: 'high',
          why: '//evil.example starts with a slash and is a protocol-relative URL, so the browser leaves the site, and WHATWG URL parsing reads /\\evil.example the same way. Parse it with new URL(next, origin) and accept it only when the resulting origin is the app origin.',
        },
      ],
      answer: { shape: 'point', line: 3 },
    },
    variations: [
      {
        ownerRole: 'Application security engineer who triages open-redirect reports',
        ownerContext:
          'The why has to name a concrete input that passes the check, such as //host or /\\host. "Validation is weak" without the bypass is not enough. A fix that only rejects a second slash is incomplete.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-007-stale-interval'),
    title: 'Stuck at nine',
    description: 'The countdown starts at 10, shows 9 after a second, and stays at 9.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['micro', 'react'],
    topics: ['frontend', 'closures'],
    starterCode: `function Countdown({ from }: { from: number }) {
  const [left, setLeft] = useState(from)
  useEffect(() => {
    const id = setInterval(() => setLeft(left - 1), 1000)
    return () => clearInterval(id)
  }, [])
  return <span>{left}</span>
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'The interval closes over the first value of left',
          severity: 'high',
          why: 'The effect runs once, so its callback keeps the left from the first render and sets from - 1 on every tick. Use the updater form, setLeft((l) => l - 1).',
        },
      ],
      answer: { shape: 'point', line: 4 },
    },
    variations: [
      {
        ownerRole: 'Frontend engineer who teaches React hooks to backend developers',
        ownerContext:
          'Credit a why about the captured value. Pointing at line 6 and saying to add left to the dependencies is a working fix that restarts the interval every second; partial credit.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-008-ruby-memoized-false'),
    title: 'The flag that keeps asking',
    description:
      'Flags that are on are fetched once per process, as intended. Flags that are off hit the flag service on every call.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'backend',
    languages: ['ruby'],
    tags: ['micro', 'ruby'],
    topics: ['debugging', 'memoization'],
    starterCode: `class FeatureFlags
  def enabled?(name)
    @cache ||= {}
    @cache[name] ||= fetch_flag(name)
  end
end
`,
    rubric: {
      expectedIssues: [
        {
          title: '||= does not memoize false',
          severity: 'medium',
          why: 'a ||= b assigns whenever a is nil or false, so a cached false looks like a miss and fetch_flag runs again. Check presence instead: return @cache[name] if @cache.key?(name).',
        },
      ],
      answer: { shape: 'point', line: 4 },
    },
    variations: [
      {
        ownerRole: 'Ruby engineer who has profiled a service hammering its flag provider',
        ownerContext: 'Credit a why that says false is treated as missing. Pointing at line 3 is wrong: that cache is created once.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-009-n-plus-one'),
    title: 'Fast queries, slow page',
    description:
      'The open orders page takes four seconds with 2,000 open orders. The database reports every query under a millisecond.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'backend',
    languages: ['typescript'],
    tags: ['micro', 'performance'],
    topics: ['performance', 'databases'],
    starterCode: `async function openOrders(db: Db): Promise<Order[]> {
  const orders = await db.query('SELECT * FROM orders WHERE status = $1', ['open'])
  for (const order of orders) {
    ;[order.customer] = await db.query('SELECT * FROM customers WHERE id = $1', [order.customerId])
  }
  return orders
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'One query per order (N+1)',
          severity: 'high',
          why: 'Each order waits for its own customer query, so 2,000 orders cost 2,001 sequential round trips; the time is in the round trips, not in the queries. Load the customers in one query (WHERE id = ANY($1)) or join them.',
        },
      ],
      answer: { shape: 'point', line: 4 },
    },
    variations: [
      {
        ownerRole: 'Backend engineer who profiles slow endpoints',
        ownerContext:
          'Credit a why that puts the cost in the number of round trips. Line 3 with the same why is equally correct. Adding an index is not the fix: the queries are already fast.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-010-seat-race'),
    title: 'Two people, one seat',
    description: 'Under load, two people sometimes both get a confirmation for the same seat. Each request looks correct on its own.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'reliability',
    languages: ['python'],
    tags: ['micro', 'race-condition'],
    topics: ['reliability', 'concurrency'],
    starterCode: `def reserve_seat(db, seat_id, user_id):
    seat = db.query_one("SELECT taken FROM seats WHERE id = %s", seat_id)
    if seat["taken"]:
        raise SeatTaken(seat_id)
    db.execute("UPDATE seats SET taken = true, user_id = %s WHERE id = %s", user_id, seat_id)
`,
    rubric: {
      expectedIssues: [
        {
          title: 'Check-then-act without a lock or a conditional write',
          severity: 'high',
          why: 'Two requests can both read taken = false before either writes, and the unconditional UPDATE lets the second overwrite the first. Make the write conditional (AND taken = false) and check the affected row count, or lock the row with SELECT ... FOR UPDATE in a transaction.',
        },
      ],
      answer: { shape: 'point', line: 5 },
    },
    variations: [
      {
        ownerRole: 'Backend engineer who has run a ticketing system through a sale',
        ownerContext:
          'Line 2 with a why about locking the read (FOR UPDATE) is equally correct. Lines 3 and 4 only raise; do not credit them.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-011-lexicographic-sort'),
    title: 'The top three',
    description: 'topScores([100, 25, 9, 1000]) returns [9, 25, 1000].',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['micro', 'sorting'],
    topics: ['debugging', 'javascript'],
    starterCode: `function topScores(scores: number[], n = 3): number[] {
  const sorted = [...scores].sort()
  return sorted.reverse().slice(0, n)
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'sort() without a comparator compares strings',
          severity: 'high',
          why: 'Array.prototype.sort converts numbers to strings by default, so 100 < 1000 < 25 < 9. Pass a comparator: sort((a, b) => b - a), which also removes the reverse.',
        },
      ],
      answer: { shape: 'point', line: 2 },
    },
    variations: [
      {
        ownerRole: 'JavaScript engineer who has fixed this in three codebases',
        ownerContext: 'Credit only a why that says the default sort is by string. Line 3 is where the order is read, not where it goes wrong.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-012-left-join-where'),
    title: 'Missing zeros',
    description:
      'The report should list every user with their order count this year, 0 for users who did not order. Users without orders this year are not listed at all.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'sql',
    languages: ['sql'],
    tags: ['micro', 'joins'],
    topics: ['sql', 'joins'],
    starterCode: `SELECT u.id, u.name, COUNT(o.id) AS orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.created_at >= '2026-01-01'
GROUP BY u.id, u.name
`,
    rubric: {
      expectedIssues: [
        {
          title: 'A WHERE on the joined table turns the LEFT JOIN into an inner join',
          severity: 'high',
          why: 'For users without matching orders, o.created_at is NULL, and NULL >= a date is not true, so WHERE drops exactly the rows the LEFT JOIN kept. Move the condition into the ON clause.',
        },
      ],
      answer: { shape: 'point', line: 4 },
    },
    variations: [
      {
        ownerRole: 'Analytics engineer who reviews reporting queries',
        ownerContext: 'Credit a why that explains the NULL rows being filtered after the join. Changing to an INNER JOIN is the opposite of the fix.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-013-waitgroup-add'),
    title: 'Some results are empty',
    description: 'fetchAll sometimes returns before every fetch has finished, leaving empty results.',
    duration: 5,
    difficulty: 'hard',
    type: 'review',
    category: 'reliability',
    languages: ['go'],
    tags: ['micro', 'go', 'concurrency'],
    topics: ['reliability', 'concurrency'],
    starterCode: `func fetchAll(urls []string) []Result {
	var wg sync.WaitGroup
	results := make([]Result, len(urls))
	for i, u := range urls {
		go func() {
			wg.Add(1)
			defer wg.Done()
			results[i] = fetch(u)
		}()
	}
	wg.Wait()
	return results
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'wg.Add runs inside the goroutine',
          severity: 'high',
          why: 'Nothing guarantees a goroutine has called Add before the loop ends, so Wait can see a zero counter and return early. Call wg.Add(1) before the go statement.',
        },
      ],
      answer: { shape: 'point', line: 6 },
    },
    variations: [
      {
        ownerRole: 'Go engineer who reviews concurrent code',
        ownerContext:
          'Since Go 1.22 each iteration has its own i and u, so a why about loop variable capture is wrong. Credit only the Add/Wait ordering; line 5 with "Add must happen before the goroutine starts" is the same fix.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-014-predict-event-loop'),
    title: 'Who speaks first',
    description:
      'This script logs six words. Write the order they appear in, one per line, then say in two or three sentences what decides that order.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'async',
    languages: ['typescript'],
    tags: ['micro', 'predict'],
    topics: ['event-loop', 'microtasks', 'async-await'],
    starterCode: `console.log('start')
setTimeout(() => console.log('timeout'), 0)
Promise.resolve().then(() => console.log('then'))
async function load() {
  console.log('load')
  await null
  console.log('loaded')
}
load()
console.log('end')
`,
    rubric: {
      expectedIssues: [
        {
          title: 'Synchronous code first, then microtasks in order, then timers',
          severity: 'high',
          why: 'start, load and end run synchronously; an async function runs until its first await. The .then callback and the code after await are microtasks, queued in that order, and run before any timer. setTimeout with 0 is a macrotask and runs last.',
        },
      ],
      answer: { shape: 'predict', output: 'start\nload\nend\nthen\nloaded\ntimeout' },
    },
    variations: [
      {
        ownerRole: 'Senior Node.js engineer who has debugged ordering bugs between promises and timers in production',
        ownerContext:
          'Credit a why that separates synchronous code, the microtask queue and timers, and says that an async function runs synchronously until its first await. "Promises are async" alone does not explain why then comes before timeout.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-015-order-binary-search'),
    title: 'Halve it right',
    description:
      'Put together `indexOf`: it returns the position of `target` in a sorted array, or -1. Two of the lines are near misses and do not belong. Tap the lines you need in order, then say in two or three sentences how you chose between each line and its near miss.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'algorithms',
    languages: ['typescript'],
    tags: ['micro', 'parsons'],
    topics: ['binary-search', 'loop-invariants', 'off-by-one'],
    starterCode: `  let hi = sorted.length - 1
    else hi = mid
function indexOf(sorted: number[], target: number): number {
  return -1
  while (lo < hi) {
    if (sorted[mid] < target) lo = mid + 1
  }
    const mid = Math.floor((lo + hi) / 2)
  let lo = 0
    else hi = mid - 1
  while (lo <= hi) {
}
    if (sorted[mid] === target) return mid
`,
    rubric: {
      expectedIssues: [
        {
          title: 'hi is inclusive, so the loop runs while lo <= hi and mid is excluded once checked',
          severity: 'high',
          why: 'hi starts at the last index, so the range is inclusive and a one-element range (lo === hi) still has a candidate: lo < hi skips it and misses the last element. Once sorted[mid] is checked, mid is out of the range: hi = mid keeps it in and, with lo <= hi, loops forever.',
        },
      ],
      answer: {
        shape: 'order',
        accepted: [
          [3, 9, 1, 11, 8, 13, 6, 10, 7, 4, 12],
          [3, 1, 9, 11, 8, 13, 6, 10, 7, 4, 12],
        ],
      },
    },
    orderCheck: `const cases: [number[], number, number][] = [[[1, 3, 5, 7, 9], 7, 3], [[1, 3, 5, 7, 9], 1, 0], [[1, 3, 5, 7, 9], 9, 4], [[4], 4, 0], [[1, 3], 2, -1], [[], 1, -1]]
for (const [sorted, target, expected] of cases) {
  const got = indexOf(sorted, target)
  if (got !== expected) throw new Error(\`indexOf(\${JSON.stringify(sorted)}, \${target}) is \${got}, expected \${expected}\`)
}
console.log('order works')`,
    variations: [
      {
        ownerRole: 'Senior engineer who reviews search and pagination code for off-by-one bugs',
        ownerContext:
          'Credit a why that ties the loop condition and the update of hi to one invariant: whether hi is inclusive. "Binary search halves the array" alone does not explain either choice.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-016-artifact-stack-trace'),
    title: 'Not the library',
    description:
      'Checkout fails for some customers with the trace below. Tap the line where you would start reading code, then say in two or three sentences why there and what you expect to find.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'debugging',
    languages: ['stacktrace'],
    tags: ['micro', 'artifact'],
    topics: ['root-cause-analysis', 'incident-response', 'null-handling'],
    starterCode: `TypeError: Cannot read properties of undefined (reading 'toLowerCase')
    at normalizeEmail (/app/node_modules/validator/lib/normalizeEmail.js:122:28)
    at buildRecipient (/app/src/mail/recipient.ts:14:19)
    at sendReceipt (/app/src/billing/receipts.ts:41:21)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async chargeAndNotify (/app/src/billing/checkout.ts:88:5)
    at async /app/src/http/routes/checkout.ts:27:20
`,
    rubric: {
      expectedIssues: [
        {
          title: 'The first frame in your own code, not the top frame',
          severity: 'high',
          why: 'The top frame is a library that received undefined; a widely used library is rarely the bug. buildRecipient is the first frame under /app/src: it is where undefined was passed in, so that is where to start, then follow where the email comes from (a customer without one).',
        },
      ],
      answer: { shape: 'point', line: 3 },
    },
    variations: [
      {
        ownerRole: 'Senior backend engineer who is on call for a payments service',
        ownerContext:
          'Credit a why that separates library frames from application frames and reads the error as "a value arrived undefined", not "validator is broken". Starting at sendReceipt is close but skips the frame that made the call.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-017-artifact-query-plan'),
    title: 'Where the 400 ms go',
    description:
      "A customer's order history takes 400 ms to load. It shows five orders. Here is the query plan. Tap the line that shows where the time goes, then say in two or three sentences what you would change.",
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'performance',
    languages: ['query-plan'],
    tags: ['micro', 'artifact', 'postgres'],
    topics: ['explain-analyze', 'indexes', 'query-performance'],
    starterCode: `Sort  (cost=21571.42..21571.43 rows=5 width=48) (actual time=412.880..412.882 rows=5 loops=1)
  Sort Key: o.created_at DESC
  Sort Method: quicksort  Memory: 25kB
  ->  Nested Loop  (cost=0.29..21571.36 rows=5 width=48) (actual time=0.041..412.851 rows=5 loops=1)
        ->  Index Scan using customers_pkey on customers c  (cost=0.29..8.31 rows=1 width=16) (actual time=0.012..0.014 rows=1 loops=1)
              Index Cond: (id = 4821)
        ->  Seq Scan on orders o  (cost=0.00..21563.00 rows=5 width=40) (actual time=0.025..412.829 rows=5 loops=1)
              Filter: (customer_id = 4821)
              Rows Removed by Filter: 1199995
Planning Time: 0.214 ms
Execution Time: 412.910 ms
`,
    rubric: {
      expectedIssues: [
        {
          title: 'A sequential scan of orders to keep five rows: customer_id has no index',
          severity: 'high',
          why: 'Nearly all 412 ms is the Seq Scan on orders, which reads 1.2 million rows and throws away all but five. An index on orders (customer_id), or (customer_id, created_at) so the sort comes free, turns it into an index scan. The Sort and the Nested Loop only look slow because their time includes the scan.',
        },
      ],
      answer: { shape: 'point', line: 7, also: [8, 9] },
    },
    variations: [
      {
        ownerRole: 'Senior engineer who reads Postgres plans for a living',
        ownerContext:
          'Credit a why that reads actual time per node and Rows Removed by Filter, and proposes an index on the filtered column. "Add caching" or "the sort is slow" misreads the plan: the outer nodes include the scan\'s time.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-018-predict-finally'),
    title: 'The last word',
    description:
      'This script logs three lines. Write them in order, one per line, then say in two or three sentences why that order.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'error-handling',
    languages: ['typescript'],
    tags: ['micro', 'predict'],
    topics: ['error-handling', 'defensive-programming'],
    starterCode: `function save(): string {
  try {
    console.log('saving')
    return 'saved'
  } finally {
    console.log('cleanup')
  }
}
console.log(save())
`,
    rubric: {
      expectedIssues: [
        {
          title: 'finally runs before the function hands back its return value',
          severity: 'high',
          why: "return 'saved' decides the value, but the function only returns after finally has run, so cleanup prints before the caller logs saved. A return inside finally would replace the value.",
        },
      ],
      answer: { shape: 'predict', output: 'saving\ncleanup\nsaved' },
    },
    variations: [
      {
        ownerRole: 'Senior engineer who has chased cleanup code that ran at the wrong time',
        ownerContext:
          'Credit a why that separates deciding the return value from leaving the function, and places finally between the two. "finally always runs" alone does not explain why cleanup comes before saved.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-019-predict-foreach-async'),
    title: 'Done before it starts',
    description:
      'This script saves three ids, then reports. Write what it prints, one line per line, then say in two or three sentences what decides that order.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'async',
    languages: ['typescript'],
    tags: ['micro', 'predict'],
    topics: ['async-await', 'promise-rejection'],
    starterCode: `const ids = [3, 1, 2]
const seen: number[] = []
ids.forEach(async (id) => {
  await Promise.resolve()
  seen.push(id)
  console.log('saved', id)
})
console.log('done', seen.length)
`,
    rubric: {
      expectedIssues: [
        {
          title: 'forEach does not wait for an async callback',
          severity: 'high',
          why: 'forEach calls each callback and ignores the promise it returns. Each callback runs until its await and yields, so done 0 prints first; the saves resume afterwards as microtasks, in call order. A for...of with await, or Promise.all over map, would wait.',
        },
      ],
      answer: { shape: 'predict', output: 'done 0\nsaved 3\nsaved 1\nsaved 2' },
    },
    variations: [
      {
        ownerRole: 'Senior Node.js engineer who reviews batch jobs that report success too early',
        ownerContext:
          'Credit a why that says forEach discards the promises its callback returns, so nothing waits for them. Knowing the fix (for...of or Promise.all) without the reason is passed_with_notes at most.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-020-predict-typeof'),
    title: 'What type is nothing',
    description:
      'This script logs four values. Write them in order, one per line, then say in two or three sentences which ones surprise people and why.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'typescript',
    languages: ['typescript'],
    tags: ['micro', 'predict'],
    topics: ['runtime-vs-compile-time', 'type-narrowing'],
    starterCode: `console.log(typeof null)
console.log(typeof [])
console.log(Array.isArray([]))
console.log(typeof NaN)
`,
    rubric: {
      expectedIssues: [
        {
          title: 'typeof reports runtime tags, not the types TypeScript checks',
          severity: 'high',
          why: "typeof null is 'object', a historical bug in JavaScript that was never fixed; arrays are objects too, so only Array.isArray tells them apart; NaN is a number. A narrowing check like typeof x === 'object' therefore lets null through.",
        },
      ],
      answer: { shape: 'predict', output: 'object\nobject\ntrue\nnumber' },
    },
    variations: [
      {
        ownerRole: 'Senior TypeScript engineer who reviews type guards',
        ownerContext:
          "Credit a why that ties at least one surprise to a narrowing bug: typeof x === 'object' does not exclude null, and does not tell an array from an object.",
      },
    ],
  },
  {
    id: uuidv5('kata-micro-021-predict-sql-null'),
    title: 'Counting the unknown',
    description:
      'This SQLite script prints four counts. Write them in order, one per line, then say in two or three sentences why each NULL comparison counts what it counts.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'sql',
    languages: ['sql'],
    tags: ['micro', 'predict'],
    topics: ['null-handling', 'database'],
    starterCode: `CREATE TABLE users (id INTEGER, manager_id INTEGER);
INSERT INTO users VALUES (1, NULL), (2, 1), (3, NULL);
SELECT COUNT(*) FROM users WHERE manager_id = NULL;
SELECT COUNT(*) FROM users WHERE manager_id IS NULL;
SELECT COUNT(manager_id) FROM users;
SELECT COUNT(*) FROM users WHERE manager_id <> 1;
`,
    rubric: {
      expectedIssues: [
        {
          title: 'A comparison with NULL is unknown, and WHERE keeps only true',
          severity: 'high',
          why: 'manager_id = NULL is never true, so it counts 0; IS NULL counts the 2 NULL rows; COUNT(column) skips NULLs, so 1; and NULL <> 1 is unknown too, so the two NULL rows drop out and the last count is 0, not 2.',
        },
      ],
      answer: { shape: 'predict', output: '0\n2\n1\n0' },
    },
    variations: [
      {
        ownerRole: 'Senior engineer who has fixed reports that silently dropped rows with NULLs',
        ownerContext:
          'Credit a why that names three-valued logic: a comparison with NULL is unknown, and WHERE keeps only true. The last count is the trap; getting it right with the reason is what separates a pass.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-022-order-retry'),
    title: 'Try again, properly',
    description:
      'Put together `retry`: it calls `fn` up to `attempts` times and returns the first success, or throws the last error. Two of the lines are near misses and do not belong. Tap the lines you need in order, then say how you chose between each line and its near miss.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'error-handling',
    languages: ['typescript'],
    tags: ['micro', 'parsons'],
    topics: ['promise-rejection', 'async-await', 'error-handling'],
    starterCode: `    } catch (err) {
      return fn()
async function retry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
  throw lastError
      throw err
  for (let i = 0; i < attempts; i++) {
    }
  let lastError: unknown
      return await fn()
    try {
  }
      lastError = err
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'Await inside try, and keep the error instead of rethrowing it',
          severity: 'high',
          why: 'return fn() hands back the promise without awaiting it, so its rejection settles after the try has exited and the catch never sees it: the first failure escapes. Rethrowing in the catch stops the loop on the first failure. Storing the error and throwing it after the loop is what makes every attempt count.',
        },
      ],
      answer: { shape: 'order', accepted: [[3, 8, 6, 10, 9, 1, 12, 7, 11, 4, 13]] },
    },
    orderCheck: `let calls = 0
const flaky = async () => { calls++; if (calls < 3) throw new Error('down ' + calls); return 'ok' }
retry(flaky, 3).then(async (value) => {
  if (value !== 'ok' || calls !== 3) throw new Error('expected ok after 3 calls, got ' + value + ' after ' + calls)
  let failed = ''
  await retry(async () => { throw new Error('always') }, 2).catch((e) => { failed = e.message })
  if (failed !== 'always') throw new Error('expected the last error, got ' + failed)
  console.log('order works')
}).catch((e) => { console.log(String(e)); process.exit(1) })`,
    variations: [
      {
        ownerRole: 'Senior engineer who reviews retry and backoff code in payment services',
        ownerContext:
          'Credit a why that explains why return await matters inside try: without await, the rejection is not caught there. "Retries need a loop" alone does not choose between the lines.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-023-order-group-by'),
    title: 'Sort them into piles',
    description:
      'Put together `groupBy`: it returns the items grouped under the key `key(item)` gives them, in their original order. Two of the lines are near misses and do not belong. Tap the lines you need in order, then say how you chose between each line and its near miss.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'typescript',
    languages: ['typescript'],
    tags: ['micro', 'parsons'],
    topics: ['typescript', 'readability'],
    starterCode: `    groups[k] = [item]
  return groups
function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  for (const item in items) {
    const k = key(item)
  const groups: Record<string, T[]> = {}
  }
    groups[k] = groups[k] ?? []
}
  for (const item of items) {
    groups[k].push(item)
`,
    rubric: {
      expectedIssues: [
        {
          title: 'for...of walks the values; a group is created once and then appended to',
          severity: 'high',
          why: 'for...in walks the keys of the array, the indexes as strings, so key() receives "0", "1", "2" instead of the items. groups[k] = [item] replaces the group on every item and keeps only the last one; ?? [] creates it once, and push appends.',
        },
      ],
      answer: { shape: 'order', accepted: [[3, 6, 10, 5, 8, 11, 7, 2, 9]] },
    },
    orderCheck: `const byTeam = groupBy([{ n: 'a', t: 'x' }, { n: 'b', t: 'y' }, { n: 'c', t: 'x' }], (p: any) => p.t)
const got = JSON.stringify(byTeam)
if (got !== JSON.stringify({ x: [{ n: 'a', t: 'x' }, { n: 'c', t: 'x' }], y: [{ n: 'b', t: 'y' }] })) {
  console.log('got ' + got)
  process.exit(1)
}
console.log('order works')`,
    variations: [
      {
        ownerRole: 'Senior TypeScript engineer who reviews data-shaping helpers',
        ownerContext:
          'Credit a why that says what for...in iterates over an array (its indexes) and why assigning [item] loses earlier items. Picking the right lines without saying why is passed_with_notes.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-024-artifact-python-traceback'),
    title: 'Read it from the bottom',
    description:
      'A worker crashes on start with the traceback below. Tap the line of your own code that caused it, then say in two or three sentences how you found it and what is missing.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'debugging',
    languages: ['stacktrace'],
    tags: ['micro', 'artifact', 'python'],
    topics: ['root-cause-analysis', 'debugging-under-pressure'],
    starterCode: `Traceback (most recent call last):
  File "/app/worker.py", line 88, in <module>
    main()
  File "/app/worker.py", line 81, in main
    process(load_settings())
  File "/app/settings.py", line 22, in load_settings
    "region": os.environ["AWS_REGION"],
  File "/usr/lib/python3.12/os.py", line 714, in __getitem__
    raise KeyError(key) from None
KeyError: 'AWS_REGION'
`,
    rubric: {
      expectedIssues: [
        {
          title: 'Python prints the most recent call last: the cause is the last frame in your code',
          severity: 'high',
          why: 'The error is at the bottom, and the frame above it is os.py, the standard library raising for a missing key. The last frame in the application is settings.py reading os.environ["AWS_REGION"]: the variable is not set where the worker starts. worker.py at the top is only the entry point.',
        },
      ],
      answer: { shape: 'point', line: 7, also: [6] },
    },
    variations: [
      {
        ownerRole: 'Senior Python engineer who deploys workers to several environments',
        ownerContext:
          'Credit a why that reads the traceback bottom-up, skips the standard library frame and names the missing environment variable. Tapping worker.py, the first line, reads it the way a Node trace is read and is the common miss.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-025-artifact-pool-log'),
    title: 'Who has the connections',
    description:
      'One request failed with a 500. Here is the log around it. Tap the line that shows the cause, not the symptom, then say in two or three sentences what you would do.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'reliability',
    languages: ['log'],
    tags: ['micro', 'artifact'],
    topics: ['root-cause-analysis', 'incident-response', 'observability'],
    starterCode: `12:00:01.120 INFO  http  GET /orders/4821 started
12:00:01.121 DEBUG db    acquire connection (pool 10/10 in use, 14 waiting)
12:00:06.122 WARN  db    acquire timed out after 5000ms
12:00:06.123 ERROR http  GET /orders/4821 500 Internal Server Error (5003ms)
12:00:06.140 INFO  jobs  report-export running since 11:52:10, holding 8 connections
12:00:06.141 INFO  http  GET /health 200 (1ms)
`,
    rubric: {
      expectedIssues: [
        {
          title: 'A long-running job holds most of the pool; the timeout is only the symptom',
          severity: 'high',
          why: 'The 500 and the acquire timeout are what the request saw. The pool was full because report-export has held 8 of its 10 connections for eight minutes. Raising the timeout or the pool size treats the symptom; the export needs its own pool, a connection limit, or to release connections between batches.',
        },
      ],
      answer: { shape: 'point', line: 5 },
    },
    variations: [
      {
        ownerRole: 'Senior SRE who runs the incident review for a shared database',
        ownerContext:
          'Credit a why that separates symptom (timeout, 500, full pool) from cause (who holds the connections). Tapping the full-pool line with a why that names the export is close and gets passed_with_notes at most.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-026-artifact-n-plus-one'),
    title: 'Twenty-one queries',
    description:
      'The posts page got slow after a refactor. Here is the query log for one request. Tap a line that shows the problem, then say in two or three sentences what the code is doing and how you would change it.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'performance',
    languages: ['log'],
    tags: ['micro', 'artifact'],
    topics: ['n-plus-one-queries', 'eager-loading', 'orm'],
    starterCode: `12:00:01.000 http GET /posts started
12:00:01.004 sql  SELECT * FROM posts ORDER BY created_at DESC LIMIT 20  (3ms)
12:00:01.008 sql  SELECT * FROM users WHERE id = 17  (1ms)
12:00:01.010 sql  SELECT * FROM users WHERE id = 4  (1ms)
12:00:01.012 sql  SELECT * FROM users WHERE id = 17  (1ms)
12:00:01.014 sql  SELECT * FROM users WHERE id = 9  (1ms)
12:00:01.016 sql  ... 16 more SELECT * FROM users WHERE id = ?
12:00:01.061 http GET /posts 200 (61ms, 21 queries)
`,
    rubric: {
      expectedIssues: [
        {
          title: 'One query for the posts, then one per post for its author',
          severity: 'high',
          why: 'The list loads 20 posts, then the code reads each post.author and the ORM fetches the users one at a time: 1 + 20 queries, some for the same user. Load the authors with the posts (an include or a join), or batch them with WHERE id IN (...).',
        },
      ],
      answer: { shape: 'point', line: 3, also: [4, 5, 6, 7] },
    },
    variations: [
      {
        ownerRole: 'Senior Rails engineer who reviews ORM-heavy pages',
        ownerContext:
          'Credit a why that names the N+1 pattern from the repeated per-id queries and proposes eager loading or batching. Tapping the posts query or the summary line and calling it slow misreads the log.',
      },
    ],
  },
]
