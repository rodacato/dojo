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
]
