import { createHash } from 'crypto'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './drizzle/schema'
import { exercises as exercisesTable, variations as variationsTable, users as usersTable } from './drizzle/schema'

// ---------------------------------------------------------------------------
// UUIDv5 — deterministic UUIDs, no external dependency
// ---------------------------------------------------------------------------

const DOJO_NAMESPACE = 'a4c5d7e2-9b3f-4e1a-8c6d-2f0b7e5a1d9c'

function uuidv5(name: string): string {
  const nsBytes = Buffer.from(DOJO_NAMESPACE.replace(/-/g, ''), 'hex')
  const nameBytes = Buffer.from(name, 'utf8')
  const hash = createHash('sha1').update(Buffer.concat([nsBytes, nameBytes])).digest()

  hash[6] = (hash[6]! & 0x0f) | 0x50
  hash[8] = (hash[8]! & 0x3f) | 0x80

  const hex = hash.subarray(0, 16).toString('hex')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join('-')
}

// ---------------------------------------------------------------------------
// System user — required by exercises.created_by FK
// ---------------------------------------------------------------------------

const SYSTEM_USER_ID = uuidv5('dojo-system-user')

const SYSTEM_USER = {
  id: SYSTEM_USER_ID,
  githubId: 'dojo-system',
  username: 'dojo-system',
  avatarUrl: '',
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

// ---------------------------------------------------------------------------
// Exercise data
// ---------------------------------------------------------------------------

interface SeedExercise {
  id: string
  title: string
  description: string
  duration: number
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'code' | 'chat' | 'whiteboard'
  category: string
  languages: string[]
  tags: string[]
  topics: string[]
  variations: Array<{ ownerRole: string; ownerContext: string }>
}

const EXERCISES: SeedExercise[] = [
  {
    id: uuidv5('exercise-001-n-plus-one'),
    title: "The N+1 You Didn't Write",
    description: `You have been handed this code from a teammate. It works. Users are complaining it's slow. The team lead wants it fixed before the next sprint ends.

\`\`\`ruby
def load_dashboard(user_id)
  user = User.find(user_id)
  posts = user.posts.where(published: true)
  posts.map do |post|
    {
      title: post.title,
      comment_count: post.comments.count,
      author_name: post.author.name
    }
  end
end
\`\`\`

Identify the problem(s), fix the code, and explain your reasoning. If you would also add something to the database layer, describe what and why.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['ruby', 'python', 'typescript'],
    tags: ['performance', 'database', 'orm'],
    topics: ['database', 'orm', 'n-plus-one-queries', 'query-optimization', 'lazy-loading'],
    variations: [
      {
        ownerRole: 'Senior Rails engineer with 8 years building high-traffic e-commerce platforms, DBA background',
        ownerContext:
          "Evaluate the developer's ability to identify N+1 queries in ActiveRecord, understand eager loading vs. lazy loading, and reason about the tradeoffs between `includes`, `preload`, and `joins`. Look for whether they consider the DB query count, not just the Ruby logic. A developer who fixes the Ruby but ignores the underlying SQL is missing the point. Give credit for identifying the `comments.count` vs `comments.size` distinction if they catch it.",
      },
      {
        ownerRole: 'Backend performance consultant who has audited 50+ codebases and has seen every variation of this mistake',
        ownerContext:
          "Focus on whether the developer understands the root cause (ORM lazy loading generating one query per record) before jumping to the fix. A developer who immediately writes the fix without explaining why it's an N+1 problem has pattern-matched, not understood. Ask a follow-up if they don't explain the query count. Evaluate their fix for correctness — `includes` is fine, `joins` + `select` is better for this case because we don't need the full comment objects.",
      },
    ],
  },

  {
    id: uuidv5('exercise-002-breaking-api-change'),
    title: 'The Breaking API Change',
    description: `Your team needs to rename a field in a public REST API response. The current field is \`user_name\` and it needs to become \`username\` to match a new internal standard. You have 3 external consumers — two are internal teams, one is a paying customer with their own mobile app.

The mobile app developer told you (in Slack, informally) "just let me know a week before." Your team lead is pushing to ship this in the next release. Your PM says "it's just a rename."

How do you handle this? Walk me through your decision and your plan.`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'backend',
    languages: [],
    tags: ['api', 'communication', 'versioning'],
    topics: ['api-versioning', 'backward-compatibility', 'breaking-changes', 'consumer-communication', 'semantic-versioning'],
    variations: [
      {
        ownerRole: 'Tech lead who has personally been burned by a breaking API change that took down a partner integration for 6 hours',
        ownerContext:
          "Evaluate whether the developer understands the difference between a 'breaking change' and a 'non-breaking change.' The rename IS breaking — any consumer doing `response.user_name` will get `undefined`. Evaluate their mitigation plan: versioning (v1/v2), dual-field period (both `user_name` and `username` for N weeks), or negotiated cutover. The developer's comfort with pushback matters — do they cave to the PM's 'it's just a rename,' or do they hold the line on consumer impact? Give credit for proposing a concrete communication plan, not just 'we'll tell them.'",
      },
      {
        ownerRole: "Partner engineering manager at a company whose mobile app was broken by an undocumented API change from a vendor",
        ownerContext:
          "Evaluate from the consumer's perspective. Does the developer consider the mobile app's release cycle? A mobile app cannot hotfix in 24 hours — the developer needs to account for Apple/Google review timelines if the consumer needs to ship an update. Ask a follow-up if they don't address the mobile app specifically. A plan that works for internal teams but ignores mobile is incomplete.",
      },
    ],
  },

  {
    id: uuidv5('exercise-003-midnight-incident'),
    title: 'The Midnight Incident',
    description: `It's 2:17 AM. You are on call. PagerDuty wakes you up. The alert says: "Payment service — error rate 47%, p99 latency 12 seconds."

You have access to: application logs, a metrics dashboard (Datadog), and a Slack channel where your CTO has just posted "what's going on?"

Walk me through your next 20 minutes. What do you do, in what order, and what do you say to the CTO?`,
    duration: 30,
    difficulty: 'hard',
    type: 'chat',
    category: 'reliability',
    languages: [],
    tags: ['incident', 'oncall', 'communication'],
    topics: ['incident-response', 'debugging-under-pressure', 'root-cause-analysis', 'communication', 'postmortem-thinking'],
    variations: [
      {
        ownerRole: 'Staff SRE with 10 years of on-call experience at a fintech company, has managed 200+ incidents',
        ownerContext:
          "Evaluate the developer's incident response process. Are they mitigating first (reducing blast radius) or diagnosing first? The correct order for a payment service is: (1) check if there's a recent deploy to roll back, (2) check if there's an external dependency (payment processor, database) showing issues, (3) start triage. Evaluate their communication — what do they tell the CTO? 'We're looking into it' is not enough; 'Error rate is 47% on the payment service, we believe it may be related to the deploy at 1:45 AM, we are investigating rollback' is better. Give credit for not jumping to conclusions before having data.",
      },
      {
        ownerRole: 'Engineering manager who has seen developers freeze under incident pressure and developers who stay calm and systematic',
        ownerContext:
          "Evaluate the developer's ability to stay systematic under pressure. Do they panic and start changing things? Do they communicate clearly? Do they know when to escalate (wake up a senior engineer)? The payment service context is important — 47% error rate means real money is being lost. Evaluate whether they acknowledge the business impact or treat it as purely a technical problem. A developer who says 'I'd fix the bug' without acknowledging the customer impact is missing the real dimension of incident response.",
      },
    ],
  },

  {
    id: uuidv5('exercise-004-typescript-inherited'),
    title: 'TypeScript You Inherited',
    description: `You joined a new team. This is real code from the codebase. The previous developer said "we'll fix the types later." It's been 18 months.

\`\`\`typescript
function processUserEvent(event: any) {
  if (event.type === 'purchase') {
    return {
      userId: event.user.id,
      amount: event.data.amount,
      currency: event.data.currency || 'USD'
    }
  }
  if (event.type === 'refund') {
    return {
      userId: event.user.id,
      amount: -event.data.amount,
      currency: event.data.currency || 'USD'
    }
  }
  return null
}
\`\`\`

This function is called 40 times across the codebase. Improve the types. Don't change the runtime behavior. Explain every decision you make.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['typescript', 'types', 'refactoring'],
    topics: ['typescript', 'type-safety', 'any-type', 'union-types', 'type-narrowing', 'discriminated-unions'],
    variations: [
      {
        ownerRole: 'Senior TypeScript engineer who has maintained a typed codebase of 200k lines for 4 years',
        ownerContext:
          "Evaluate the developer's TypeScript thinking. Do they define discriminated unions for the event types? Do they understand the difference between `unknown` and `any`? Do they use type guards or type narrowing correctly? A solution that uses `as EventType` casting is not type-safe — it compiles but moves the problem. Give credit for: discriminated union definition, exhaustive switch or if-else with proper narrowing, and understanding why `any` was a mistake (bypasses the compiler entirely). Ask a follow-up if they only improve the function signature without addressing the root type definition.",
      },
      {
        ownerRole: 'Staff engineer who reviews 20+ PRs per week and has to balance type safety with practical migration paths',
        ownerContext:
          "Evaluate the developer's migration strategy, not just the type design. This code is called 40 times. A perfect type rewrite that breaks 40 call sites is not a good PR. Does the developer think about incremental adoption? Can the function be typed at the boundary while the call sites migrate gradually? Give credit for: understanding the blast radius (40 call sites), proposing a migration path, and identifying that the `currency` fallback to 'USD' is itself a typing issue — it implies `currency` can be undefined, which should be explicit.",
      },
    ],
  },

  {
    id: uuidv5('exercise-005-sql-works-until-it-doesnt'),
    title: "The SQL That Works (Until It Doesn't)",
    description: `This query runs fine in staging (50k rows). It runs for 45 seconds in production (8M rows). Your task is to analyze it and fix it.

\`\`\`sql
SELECT
  u.id,
  u.username,
  COUNT(s.id) as session_count,
  AVG(CASE WHEN a.verdict = 'passed' THEN 1.0 ELSE 0.0 END) as pass_rate
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
LEFT JOIN attempts a ON a.session_id = s.id
WHERE s.completed_at > NOW() - INTERVAL '30 days'
  OR s.completed_at IS NULL
GROUP BY u.id, u.username
ORDER BY session_count DESC;
\`\`\`

Explain what is wrong and provide a corrected version. Assume you have access to \`EXPLAIN ANALYZE\` output.`,
    duration: 30,
    difficulty: 'hard',
    type: 'code',
    category: 'backend',
    languages: ['sql'],
    tags: ['sql', 'performance', 'postgresql'],
    topics: ['postgresql', 'query-performance', 'indexes', 'explain-analyze', 'join-vs-subquery', 'null-handling'],
    variations: [
      {
        ownerRole: 'PostgreSQL DBA with 12 years of experience, has diagnosed hundreds of slow queries in production',
        ownerContext:
          "Evaluate the developer's ability to read a query and identify multiple problems without running it. Problems in this query: (1) `OR s.completed_at IS NULL` prevents index use on `completed_at` — the optimizer cannot use a range index with OR NULL conditions; (2) the `LEFT JOIN` on attempts means every attempt row is included, inflating `COUNT(s.id)` — should be counting distinct sessions; (3) `AVG(CASE ...)` over a JOIN produces wrong pass_rate if a session has multiple attempts; (4) no index hint that `users.id`, `sessions.user_id`, `attempts.session_id`, `sessions.completed_at` are indexed. Give credit for identifying at least 2 of these. The NULL handling and the inflated COUNT are the most common misses.",
      },
      {
        ownerRole: 'Senior backend engineer who writes SQL daily but is not a dedicated DBA — approaches this from a product and correctness perspective',
        ownerContext:
          "Evaluate correctness first, performance second. The query produces wrong results before it produces slow results: `COUNT(s.id)` counts attempt rows, not sessions; `AVG(CASE ...)` computes pass rate per attempt, not per session. A developer who produces a 'fast' version of a wrong query has not solved the problem. Ask a follow-up if they fix performance without noticing the correctness issue. Give extra credit for catching the `OR ... IS NULL` index problem — it requires understanding how PostgreSQL evaluates OR conditions with NULL.",
      },
    ],
  },

  {
    id: uuidv5('exercise-006-architecture-decision'),
    title: 'The Architecture Decision',
    description: `A startup's checkout service sends a confirmation email after every purchase. Currently: the checkout service calls the email service directly (synchronous HTTP). When the email service goes down, checkouts fail. When the email service is slow, checkouts are slow.

The CTO wants you to propose an architecture that decouples the two services. You have 45 minutes. Show your design.

Use the diagram area to show the proposed architecture. Write your reasoning in the text area below the diagram.`,
    duration: 45,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'distributed-systems', 'reliability'],
    topics: ['system-design', 'event-driven-architecture', 'message-queues', 'trade-offs', 'scalability', 'reliability', 'outbox-pattern', 'idempotency'],
    variations: [
      {
        ownerRole: 'Staff distributed systems engineer who has designed event-driven systems at a company processing 10M orders/day',
        ownerContext:
          "Evaluate whether the developer understands the fundamental trade-off they are making: moving from synchronous (consistent but coupled) to asynchronous (decoupled but eventually consistent). Does their design handle the 'at-least-once delivery' problem? What happens if the queue consumer crashes after pulling a message but before sending the email — will the email be sent again? Does the design include a dead-letter queue for failed email sends? Give credit for: identifying the consistency trade-off, proposing message queue (Kafka, RabbitMQ, SQS — any is fine), handling idempotency, and acknowledging what observability looks like in the new system.",
      },
      {
        ownerRole: 'CTO of a Series A startup who has 5 engineers and needs to choose between the right architecture and the shippable architecture',
        ownerContext:
          "Evaluate the developer's judgment about complexity. A developer who proposes Kafka + Zookeeper + multiple consumer groups for a startup with 5 engineers is overengineering. The pragmatic solution might be: a simple outbox pattern (write email_jobs to DB in the same transaction as the purchase, have a worker poll the table). Does the developer consider the team's capacity and operational complexity, not just the technical correctness? Give credit for proposing the simplest thing that works, noting what it doesn't do (not fault-tolerant to extended email service outages), and defining when they would upgrade to a real queue.",
      },
    ],
  },

  {
    id: uuidv5('exercise-007-code-review'),
    title: 'The Code Review',
    description: `This is a pull request from a junior developer on your team. They're proud of it. It works. Give them a code review — be specific, be helpful, and be honest.

\`\`\`typescript
async function getUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`)
    const data = await response.json()
    if (data) {
      return data.user
    }
  } catch(e) {
    console.log(e)
  }
}
\`\`\``,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['code-review', 'junior', 'error-handling'],
    topics: ['code-review', 'readability', 'error-handling', 'async-await', 'typescript', 'defensive-programming'],
    variations: [
      {
        ownerRole: 'Senior developer who mentors juniors and has strong opinions about what makes feedback useful vs. demoralizing',
        ownerContext:
          "Evaluate whether the developer's code review is specific, constructive, and honest. Issues to find: (1) `userId` has no type annotation; (2) `response.ok` is not checked — a 404 or 500 response will not throw but will return an error body; (3) `if (data)` is truthy-checking an object, which is always true — the `data.user` check is the right guard; (4) the catch swallows the error — `console.log` is not error handling for production code; (5) the function returns `undefined` on error, not `null`, and has no return type annotation. Give credit for identifying 3+ issues AND for framing feedback in a way that helps the junior understand why, not just what.",
      },
      {
        ownerRole: 'Principal engineer who treats every code review as a teaching opportunity and will not approve code that could silently fail in production',
        ownerContext:
          "Evaluate technical depth. The `response.ok` check is the most production-critical issue — a user who gets a 404 because the userId doesn't exist will get `undefined` back with no error, and the caller has no way to distinguish 'not found' from 'fetch error.' The developer should propose a pattern for error handling: either throw a typed error (`UserNotFoundError`, `FetchError`) or return a discriminated union (`{ ok: true, user } | { ok: false, error }`). Give extra credit for suggesting that the function's return type should be explicit, not inferred, and for noting that `console.log(e)` is especially bad — it logs the error object, which may contain sensitive user data.",
      },
    ],
  },

  {
    id: uuidv5('exercise-008-feature-flag-refactor'),
    title: 'The Feature Flag Refactor',
    description: `Your team shipped a feature 6 months ago behind a feature flag. The flag is \`ENABLE_NEW_CHECKOUT\`. It's been at 100% for 5 months. The old code path still exists. The flag is checked in 14 places across 6 files.

Your PM says "we should clean this up." You have a sprint with 2 other features already planned. What do you do?`,
    duration: 15,
    difficulty: 'easy',
    type: 'chat',
    category: 'backend',
    languages: [],
    tags: ['technical-debt', 'feature-flags', 'cleanup'],
    topics: ['feature-flags', 'technical-debt', 'refactoring', 'risk-management', 'gradual-rollout'],
    variations: [
      {
        ownerRole: 'Engineering lead who manages technical debt alongside feature work and has cleaned up 20+ dead code paths',
        ownerContext:
          "Evaluate the developer's judgment about timing and risk. This is not an emergency but it is legitimate debt. Does the developer propose a concrete cleanup plan? The steps are: (1) verify the flag is actually at 100% in all environments (including staging — it's often different); (2) remove the flag check and the old code path in a single PR; (3) test that removing the old code doesn't break anything (the old path was disabled, but it may have shared utilities); (4) update the feature flag service to retire the flag name. Give credit for: proposing the cleanup as a separate PR (not bundled with a feature), estimating the risk correctly (low — the old code hasn't run in 5 months), and pushing back appropriately if the sprint is truly full.",
      },
      {
        ownerRole: "Senior developer who has worked in a codebase with 200+ feature flags and knows what happens when they're not cleaned up",
        ownerContext:
          "Evaluate whether the developer understands the cost of leaving it. Every flag check is dead branch logic that the next developer has to read and understand. The 14 occurrences in 6 files means 14 places where a future developer will have to ask 'is this still relevant?' Give credit for: quantifying the cleanup cost (probably 2-4 hours for a careful developer), comparing it to the accumulating cost of leaving it, and proposing a graduation process — not just 'delete it' but 'verify → delete → monitor → retire flag name.'",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Bug Detection
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-009-timezone-bug'),
    title: 'The Timezone Bug',
    description: `Your 30-day free trial system has a support ticket backlog. Some users are getting cut off after 29 days, others are still active after 31. The relevant code:

\`\`\`typescript
function hasTrialExpired(signedUpAt: Date): boolean {
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  return Date.now() - signedUpAt.getTime() > thirtyDays
}

// signedUpAt is parsed from the user's submitted form field:
function parseSignupDate(rawDate: string): Date {
  // rawDate is the date string stored in the DB, e.g. "2026-03-01"
  return new Date(rawDate + 'T00:00:00')
}
\`\`\`

The server runs on UTC. Users sign up from all timezones. One server engineer said "the math looks right to me." Find the bug, explain why it produces inconsistent results, and fix it.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python', 'javascript'],
    tags: ['bug', 'timezone', 'date-handling'],
    topics: ['timezones', 'date-parsing', 'utc', 'javascript-dates', 'ecmascript-spec'],
    variations: [
      {
        ownerRole: 'Senior backend engineer who has fixed timezone-related billing bugs at a SaaS company with users in 80 countries',
        ownerContext:
          "The bug is in `parseSignupDate`: `new Date('2026-03-01T00:00:00')` — a datetime string WITHOUT a timezone suffix — is parsed as **local time** per the ECMAScript spec. On a server in UTC+5:30, this parses to 18:30 UTC on Feb 28, which is 5.5 hours earlier than intended. Combined with a 30-day window in milliseconds, some users get cut off hours early (effectively 29 days) and some get extra hours (effectively 31 days in edge cases around DST). The fix: append 'Z' to force UTC parsing — `new Date(rawDate + 'T00:00:00Z')`. Evaluate whether the developer knows the difference between date-only strings (ECMAScript parses as UTC) and date-time strings without 'Z' (parsed as local). Give extra credit if they identify that comparing `Date.now()` to a stored UTC date is fine — the bug is only in the parsing.",
      },
      {
        ownerRole: 'Engineering manager who has triaged 3 separate timezone-related production incidents at previous companies and considers this a fundamental skill gap',
        ownerContext:
          "Evaluate whether the developer can reason about the bug without running code. Can they articulate what 'local time parsing' means in a server context? Do they know that Node.js inherits the server's TZ environment variable? The deeper question is whether they understand that date-only strings and date-time strings behave differently in JavaScript — a distinction almost nobody knows until they get burned by it. Give credit for: correctly identifying `parseSignupDate` as the bug location, explaining the parsing ambiguity, and proposing a defensive fix (always use ISO 8601 with explicit 'Z' or use a library like `date-fns` that enforces UTC). Deduct if they rewrite `hasTrialExpired` — that function is correct.",
      },
    ],
  },

  {
    id: uuidv5('exercise-010-race-condition'),
    title: 'The Race Condition',
    description: `Your e-commerce site has a flash sale. The product has 1 unit left. Somehow, 3 customers successfully checked out and all received order confirmations. Your support team is furious. Here is the inventory reservation code:

\`\`\`typescript
class InventoryService {
  async reserveItem(itemId: string, userId: string): Promise<boolean> {
    const item = await db.items.findById(itemId)

    if (item.stock <= 0) {
      return false
    }

    await db.items.update(itemId, { stock: item.stock - 1 })
    await db.reservations.create({ itemId, userId })
    return true
  }
}
\`\`\`

Explain exactly how 3 users could all succeed. Fix the code. Then explain what you would add to make the fix observable in production.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['bug', 'concurrency', 'database'],
    topics: ['race-conditions', 'database-transactions', 'optimistic-locking', 'pessimistic-locking', 'concurrency', 'atomicity'],
    variations: [
      {
        ownerRole: 'Staff backend engineer who has designed inventory systems for flash sales with 50k concurrent users',
        ownerContext:
          "The bug is a classic TOCTOU (time-of-check to time-of-use) race: three requests all read `stock = 1`, all pass the `<= 0` check, all decrement from 1 to 0. Since `findById` and `update` are separate operations, any number of concurrent requests can slip between them. The fix: use an atomic conditional update with a row lock — e.g., `UPDATE items SET stock = stock - 1 WHERE id = $1 AND stock > 0 RETURNING *` and check whether a row was returned. Or use a database transaction with `SELECT FOR UPDATE`. Give credit for: explaining TOCTOU clearly, proposing an atomic solution (not just wrapping in a JS mutex, which only works on a single server instance), and noting that the fix must be database-level to survive horizontal scaling. Observability: log when the update returns 0 rows (oversell attempt detected), add a metric for reservation failures.",
      },
      {
        ownerRole: 'Principal engineer who has reviewed and rejected multiple "fixed" versions of this bug that still had the race condition',
        ownerContext:
          "Evaluate whether the developer's fix actually works under concurrency. Common wrong answers: (1) wrapping in a JS try/catch — doesn't help; (2) using a JavaScript mutex/lock — only works on a single process, breaks with horizontal scaling; (3) adding a transaction without `SELECT FOR UPDATE` — still has the race inside the transaction. The only correct answer for multi-server environments is an atomic database operation. Ask a follow-up if they propose a solution that only works on a single server. Give credit for raising the horizontal scaling concern proactively, and for mentioning that the `reservations.create` should also be inside the same transaction — a reservation should not exist if the stock decrement failed.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Refactoring
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-011-function-that-grew'),
    title: 'The Function That Grew',
    description: `This function started as 10 lines. It's now 50. Every new requirement added another \`if\`. Nobody has complained — it works. You have been asked to add one more case (handling \`'enterprise'\` plan users with a custom discount rate stored in the DB). Before you add it, refactor the function.

\`\`\`typescript
async function calculateInvoiceTotal(
  userId: string,
  lineItems: Array<{ unitPrice: number; quantity: number }>,
  couponCode: string | null
): Promise<number> {
  const subtotal = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  let discount = 0

  const user = await db.users.findById(userId)
  if (user.plan === 'free') {
    discount = 0
  } else if (user.plan === 'starter') {
    discount = subtotal * 0.05
  } else if (user.plan === 'pro') {
    discount = subtotal * 0.15
  } else if (user.plan === 'team') {
    if (user.teamSize >= 10) {
      discount = subtotal * 0.25
    } else {
      discount = subtotal * 0.20
    }
  }

  if (couponCode) {
    const coupon = await db.coupons.findByCode(couponCode)
    if (coupon && coupon.active) {
      if (coupon.type === 'percent') {
        discount += subtotal * (coupon.value / 100)
      } else if (coupon.type === 'fixed') {
        discount += coupon.value
      }
    }
  }

  const taxRate = user.country === 'US' ? 0.08 : user.country === 'EU' ? 0.20 : 0
  const afterDiscount = subtotal - discount
  const tax = afterDiscount * taxRate
  return Math.max(0, afterDiscount + tax)
}
\`\`\`

Refactor first. Then add the \`enterprise\` case.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['refactoring', 'readability', 'clean-code'],
    topics: ['refactoring', 'single-responsibility', 'extract-function', 'readability', 'maintainability'],
    variations: [
      {
        ownerRole: 'Senior engineer who reviews PRs for a 6-person team and has a firm rule: every function should do one thing and fit on a screen',
        ownerContext:
          "Evaluate the developer's ability to identify the responsibilities and extract them cleanly. The function does three distinct things: (1) calculate subtotal, (2) calculate discount (plan-based + coupon), (3) calculate tax. Each should be a separate function. The plan discount is also a candidate for a lookup table or a strategy pattern. Evaluate whether the refactoring preserves behavior exactly — the existing logic has a specific execution order (plan discount first, then coupon on top of subtotal, not on the discounted amount). Give credit for noticing that `discount` accumulates (plan + coupon), and for extracting `getPlanDiscount`, `getCouponDiscount`, and `getTaxRate` as separate pure functions where possible. Penalize refactors that accidentally change the discount stacking order.",
      },
      {
        ownerRole: 'Staff engineer who treats refactoring as a prerequisite for new features, not an optional cleanup task',
        ownerContext:
          "Evaluate whether the developer refactors BEFORE adding the new case — not after. The enterprise case is the forcing function that reveals whether the current structure can absorb change cleanly. A developer who adds enterprise support to the existing `if-else` chain has made the problem worse. The correct move: extract the plan discount logic into something extensible (a map, a small strategy, or a helper) so the enterprise case is just one more entry point. Evaluate also whether they handle the new enterprise requirement correctly — 'custom discount rate stored in the DB' means an async lookup, which changes the function's async surface. Give credit for catching that the enterprise path requires a DB call not present in the existing logic.",
      },
    ],
  },

  {
    id: uuidv5('exercise-012-nested-conditions'),
    title: 'The Nested Conditions',
    description: `This function has been correct since 2023. It has never been wrong. But it has also never been readable. A new developer on the team spent 25 minutes trying to understand it before asking for help. Refactor it for readability without changing any behavior.

\`\`\`typescript
function getAccessLevel(user: {
  isActive: boolean
  role: 'admin' | 'editor' | 'viewer' | 'guest'
  emailVerified: boolean
  suspendedAt: Date | null
}): 'full' | 'limited' | 'readonly' | 'none' {
  if (user.isActive) {
    if (!user.suspendedAt) {
      if (user.emailVerified) {
        if (user.role === 'admin') {
          return 'full'
        } else if (user.role === 'editor') {
          return 'full'
        } else if (user.role === 'viewer') {
          return 'limited'
        } else {
          return 'readonly'
        }
      } else {
        if (user.role === 'admin') {
          return 'limited'
        } else {
          return 'readonly'
        }
      }
    } else {
      return 'none'
    }
  } else {
    return 'none'
  }
}
\`\`\`

Produce a refactored version. Write a short explanation of the main change you made and why.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['refactoring', 'readability', 'clean-code'],
    topics: ['refactoring', 'guard-clauses', 'early-return', 'readability', 'cyclomatic-complexity'],
    variations: [
      {
        ownerRole: 'Senior engineer with a strong opinion that deeply nested code is a code smell, not a style preference',
        ownerContext:
          "Evaluate the developer's refactoring approach. The canonical improvement is guard clauses (early returns for the negative cases): `if (!user.isActive || user.suspendedAt) return 'none'`. This immediately reduces nesting depth and makes the happy path clear. From there, the role/email logic can be expressed more declaratively — a lookup table, a small conditional chain, or a derived 'canWrite' flag. Evaluate whether the refactor is behavior-preserving: admin + editor both return 'full' when email verified (they can be collapsed); guest (unverified or verified) with no email verification gets 'readonly'. Give credit for: applying guard clauses, reducing nesting depth to ≤2 levels, and writing the explanation in terms of the business logic rather than the code structure.",
      },
      {
        ownerRole: 'Principal engineer who has established refactoring conventions across multiple teams and uses code review as the primary teaching mechanism',
        ownerContext:
          "Evaluate the quality of the explanation, not just the code. A developer who produces clean code but cannot articulate *why* the nested version is harder to read has learned a pattern without understanding it. The key insight: nested conditions force the reader to hold multiple states in their head simultaneously. Guard clauses let the reader discard cases early and focus on what remains. Ask a follow-up if they refactor without mentioning guard clauses or early returns by name — understanding the pattern name helps them teach it to others. Also evaluate whether their version correctly collapses the `admin | editor → 'full'` case — this is a common behavior-breaking mistake in this exercise.",
      },
    ],
  },

  {
    id: uuidv5('exercise-013-slow-loop'),
    title: 'The Slow Loop',
    description: `A nightly report job is timing out in production. It processes 200k users and takes 4+ hours. The data team is blocked. You've been asked to fix it before the next run tonight.

\`\`\`typescript
function findUsersWhoNeverPurchased(
  users: Array<{ id: string; email: string }>,
  purchases: Array<{ userId: string; amount: number }>
): Array<{ id: string; email: string }> {
  return users.filter((user) => {
    const userPurchases = purchases.filter((p) => p.userId === user.id)
    return userPurchases.length === 0
  })
}

// Called with: findUsersWhoNeverPurchased(allUsers, allPurchases)
// allUsers: 200,000 records
// allPurchases: 1,800,000 records
\`\`\`

Fix the function. State the time complexity before and after. Explain how you would verify the fix is correct before deploying tonight.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['performance', 'algorithms', 'bug'],
    topics: ['time-complexity', 'big-o', 'set', 'hashmap', 'data-structures', 'performance-optimization'],
    variations: [
      {
        ownerRole: 'Staff engineer who has optimized data pipelines at scale and can estimate runtime complexity without running the code',
        ownerContext:
          "The bug is algorithmic: `O(n × m)` where n = 200k users and m = 1.8M purchases = 360 billion operations in the inner loop. The fix: build a `Set<string>` of userId from purchases (one pass, O(m)), then filter users by `!purchasedSet.has(user.id)` (O(n)). Total: O(n + m). Evaluate whether the developer can articulate complexity before and after — not just 'it's faster' but 'it's O(n×m) vs O(n+m).' Also evaluate their verification plan: the output should be identical, so a good test is running both versions on a sample and comparing results. Give extra credit for noting that the real fix for a 200k/1.8M dataset should be a SQL query, not an in-memory operation.",
      },
      {
        ownerRole: 'Engineering manager who has had to explain to a non-technical CTO why a job that ran fine at 10k users takes 4 hours at 200k',
        ownerContext:
          "Evaluate the developer's ability to communicate the problem clearly and the fix correctly. Can they explain why O(n×m) is catastrophic at scale without using jargon? Can they explain why a Set lookup is O(1) and why that changes everything? For the verification plan, evaluate whether they think about edge cases: what if the same userId appears multiple times in purchases? The Set-based fix handles this correctly (a user is still in the Set regardless of how many purchases they have). Give credit for: clear complexity analysis, a correct fix, and a practical verification approach (sample test, compare outputs, run on staging first). Ask a follow-up if they don't mention moving this logic to SQL — in-memory joins on millions of records are fragile regardless of the algorithm.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Security
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-014-jwt-misconception'),
    title: 'The JWT Misconception',
    description: `Your team ships a new feature: the mobile app reads the JWT on login to personalize the experience without an extra API call. The token now contains:

\`\`\`json
{
  "sub": "user-abc123",
  "email": "alex@example.com",
  "plan": "pro",
  "stripeCustomerId": "cus_9xyzABC",
  "paymentMethodLast4": "4242",
  "internalAdminNotes": "VIP — waived 2 chargebacks",
  "exp": 1748736000
}
\`\`\`

The mobile team lead says "it's signed so it's secure." A security-conscious engineer on your team flags it but isn't sure how to explain the issue clearly. Explain what is wrong. Define exactly what should and should not be in a JWT. Propose a revised approach for the mobile personalization use case.`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'security',
    languages: [],
    tags: ['security', 'jwt', 'authentication'],
    topics: ['jwt', 'authentication', 'authorization', 'encryption-vs-signing', 'sensitive-data', 'token-design'],
    variations: [
      {
        ownerRole: 'Security engineer who has reviewed hundreds of JWT implementations and written the company JWT standards document',
        ownerContext:
          "The core misconception: JWTs are **signed**, not **encrypted**. Anyone can base64-decode the payload and read its contents — no secret needed. The `stripeCustomerId`, `paymentMethodLast4`, and especially `internalAdminNotes` should never be in a JWT. The correct mental model: treat JWT claims as public data that you trust was issued by you (because of the signature), not data that is hidden. What belongs in a JWT: user identifier, roles/permissions, expiry. What does NOT belong: PII, financial data, internal notes, secrets. The fix for mobile personalization: keep the JWT minimal, make one extra API call on login to fetch profile data (it can be cached). Give credit for: explaining the base64-decodable nature of JWTs, distinguishing signing from encryption, and proposing a correct minimal token.",
      },
      {
        ownerRole: "Mobile team lead who genuinely believed JWTs were encrypted because 'they have a signature'",
        ownerContext:
          "Evaluate how well the developer explains the misconception to a non-security audience. Can they show concretely how to decode the JWT in 30 seconds (paste into jwt.io — no tools needed)? The `internalAdminNotes` field is the most egregious issue: any user can see their own admin notes by decoding their token. But the Stripe customer ID is also a real risk — combined with other data, it could facilitate fraud. Evaluate whether the developer addresses the mobile team lead's specific claim ('it's signed so it's secure') with a concrete counterexample, not just an abstract explanation. Give credit for explaining that signing guarantees *authenticity* (you issued it) but not *confidentiality* (nobody can read it). If encryption is needed, the standard is JWE — note whether the developer mentions it.",
      },
    ],
  },

  {
    id: uuidv5('exercise-015-dependency-audit'),
    title: 'The Dependency Audit',
    description: `You are reviewing this PR before it gets merged to main. The developer says "just a small cleanup plus one new feature." Identify every problem you find.

\`\`\`diff
// package.json
-  "dependencies": {
-    "express": "^4.18.2",
-    "pg": "^8.11.0"
-  },
-  "devDependencies": {
-    "jest": "^29.0.0",
-    "dotenv": "^16.0.0"
-  }
+  "dependencies": {
+    "express": "^4.18.2",
+    "pg": "^8.11.0",
+    "dotenv": "^16.0.0",
+    "jest": "^29.0.0",
+    "colors": "1.4.0"
+  }
\`\`\`

\`\`\`diff
// src/config.ts
+ const API_KEY = 'sk-prod-a8f3c2e1d7b4f9a2c8e1d7b4f9a2c8e1'
+ const DB_PASSWORD = 'hunter2'
+
  export const config = {
+   apiKey: API_KEY,
+   dbPassword: DB_PASSWORD,
    port: process.env['PORT'] ?? 3000,
  }
\`\`\`

\`\`\`diff
// .gitignore
  node_modules/
  dist/
- .env
\`\`\`

List every issue. Explain the severity and impact of each one.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'security',
    languages: ['typescript', 'javascript'],
    tags: ['security', 'code-review', 'dependencies'],
    topics: ['dependency-management', 'secrets-management', 'supply-chain-security', 'gitignore', 'devdependencies'],
    variations: [
      {
        ownerRole: 'Security engineer who does weekly dependency audits and has responded to two supply chain incidents in the past year',
        ownerContext:
          "There are four distinct issues. (1) `jest` and `dotenv` moved from devDependencies to dependencies — these will be installed in production, bloating the bundle and increasing attack surface. (2) `colors@1.4.0` is a known supply chain incident: the maintainer intentionally shipped a version with malicious code that entered infinite loops. Pinning to an exact version of a compromised package is actively harmful. (3) `API_KEY` and `DB_PASSWORD` are hardcoded in source — they are now in git history permanently, even if removed in a future commit. The secrets must be rotated immediately after being committed. (4) `.env` was removed from `.gitignore` — any developer who now runs with a local `.env` file will accidentally commit it on the next `git add .`. Evaluate whether the developer identifies all four, rates the severity correctly (hardcoded secrets + .gitignore removal are critical; dependency misclassification is medium; colors is high), and knows that rotating secrets is the only fix once they've been committed.",
      },
      {
        ownerRole: 'Senior developer who reviews 15+ PRs per week and has a checklist for security-sensitive changes',
        ownerContext:
          "Evaluate the developer's code review completeness and their ability to explain business impact. Finding the issues is the baseline — explaining severity is the real skill. The hardcoded API_KEY should trigger an immediate conversation: 'This key may already be compromised if this PR was pushed to a shared branch. We need to rotate it now, not after merge.' The `.gitignore` issue is subtle but critical: the developer may not realize that removing `.env` from `.gitignore` affects every team member's local environment on next pull. Give credit for: identifying all four issues, explaining the `colors` supply chain risk specifically (not just 'pinned version is bad'), and recommending concrete next steps for the hardcoded secrets.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Architecture
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-016-caching-decision'),
    title: 'The Caching Decision',
    description: `Your product analytics dashboard endpoint is getting slow. It aggregates 90 days of event data for the current user and is now taking 3–8 seconds for active users. You have been asked to fix it.

Three engineers on the team each proposed a solution in Slack:

- **Engineer A:** "Add a Redis cache. Cache the result for 5 minutes. Problem solved."
- **Engineer B:** "The query is the problem. Let's add a materialized view and refresh it hourly."
- **Engineer C:** "This is a read-heavy, user-specific endpoint. Move it behind a CDN with a short TTL and user-scoped cache keys."

Your tech lead is asking you to decide. Which approach do you recommend, and why? What would make you change your recommendation?`,
    duration: 30,
    difficulty: 'hard',
    type: 'chat',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'caching', 'performance'],
    topics: ['caching', 'redis', 'materialized-views', 'cdn', 'cache-invalidation', 'trade-offs', 'performance'],
    variations: [
      {
        ownerRole: 'Staff engineer who has implemented all three caching strategies in production and has strong opinions about when each is appropriate',
        ownerContext:
          "Evaluate the developer's ability to reason about trade-offs, not just pick an answer. Each approach has merits and failure modes. Redis: correct, but adds operational complexity, doesn't fix the slow query (it still runs once per cache miss for each user), and 5-minute stale data may be unacceptable for a dashboard. Materialized view: fixes the underlying query, but hourly refresh may produce stale data in a product analytics context where users expect near-real-time numbers. CDN: wrong tool for user-specific authenticated data — CDN caching of user-scoped endpoints is complex and error-prone (cache poisoning risk). The pragmatic answer for most teams: fix the query first (add indexes, move to pre-aggregation), then add Redis caching if needed. Give credit for: identifying stale data risk for each approach, asking about freshness requirements before deciding, and noting that 'caching a slow query' is not the same as 'fixing a slow query.'",
      },
      {
        ownerRole: 'CTO of a 12-person startup who has been burned by adding premature infrastructure complexity and is asking the dev to justify every new moving part',
        ownerContext:
          "Evaluate the developer's judgment about organizational complexity. Redis means a new infrastructure dependency, new failure modes (Redis down → dashboard down), and operational knowledge requirements. Materialized view is database-native and operationally simple, but requires understanding PostgreSQL internals. CDN for auth endpoints is a trap — most junior engineers haven't dealt with the cache poisoning risk of user-specific CDN entries. The right question to ask before any of these: 'Have we looked at EXPLAIN ANALYZE on the actual query?' The answer may be that a single index eliminates the problem entirely at zero operational cost. Give credit for: questioning the problem framing (why is it slow?), proposing the simplest intervention first (query optimization), and only recommending infrastructure additions if the query is already optimal.",
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateExercises(exercises: SeedExercise[]): void {
  const errors: string[] = []

  for (const ex of exercises) {
    if (!ex.title.trim()) errors.push(`${ex.id}: empty title`)
    if (!ex.description.trim()) errors.push(`${ex.id}: empty description`)
    if (ex.duration <= 0) errors.push(`${ex.id}: invalid duration ${ex.duration}`)
    if (ex.variations.length < 1) errors.push(`${ex.id}: no variations`)
    for (const v of ex.variations) {
      if (!v.ownerRole.trim()) errors.push(`${ex.id}: empty ownerRole`)
      if (!v.ownerContext.trim()) errors.push(`${ex.id}: empty ownerContext`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Seed validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export async function seed(): Promise<void> {
  const DATABASE_URL = process.env['DATABASE_URL']
  if (!DATABASE_URL) throw new Error('DATABASE_URL is required')

  const sql = postgres(DATABASE_URL)
  const db = drizzle(sql, { schema })

  try {
    console.log('Validating seed data...')
    validateExercises(EXERCISES)

    console.log('Inserting system user...')
    await db.insert(usersTable).values(SYSTEM_USER).onConflictDoNothing()

    console.log(`Inserting ${EXERCISES.length} exercises...`)
    for (const exercise of EXERCISES) {
      await db
        .insert(exercisesTable)
        .values({
          id: exercise.id,
          title: exercise.title,
          description: exercise.description,
          duration: exercise.duration,
          difficulty: exercise.difficulty,
          category: exercise.category,
          type: exercise.type,
          status: 'published',
          language: exercise.languages,
          tags: exercise.tags,
          topics: exercise.topics,
          ownerRole: exercise.variations[0]!.ownerRole,
          ownerContext: exercise.variations[0]!.ownerContext,
          createdBy: SYSTEM_USER_ID,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        })
        .onConflictDoUpdate({
          target: exercisesTable.id,
          set: {
            title: exercise.title,
            description: exercise.description,
            status: 'published',
          },
        })

      for (let i = 0; i < exercise.variations.length; i++) {
        const variation = exercise.variations[i]!
        const variationId = uuidv5(`variation-${exercise.id}-${i}`)

        await db
          .insert(variationsTable)
          .values({
            id: variationId,
            exerciseId: exercise.id,
            ownerRole: variation.ownerRole,
            ownerContext: variation.ownerContext,
            createdAt: new Date('2026-01-01T00:00:00Z'),
          })
          .onConflictDoNothing()
      }

      console.log(`  ✓ ${exercise.title}`)
    }

    console.log(`\nSeed complete. ${EXERCISES.length} exercises, ${EXERCISES.reduce((n, e) => n + e.variations.length, 0)} variations.`)
  } finally {
    await sql.end()
  }
}

// Run when invoked directly
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
