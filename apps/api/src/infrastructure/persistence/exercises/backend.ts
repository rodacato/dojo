import { type SeedExercise, uuidv5 } from './types'

export const backendExercises: SeedExercise[] = [
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
          "Evaluate the developer's refactoring approach. The canonical improvement is guard clauses (early returns for the negative cases): `if (!user.isActive || user.suspendedAt) return 'none'`. This immediately reduces nesting depth and makes the happy path clear. From there, the role/email logic can be expressed more declaratively — a lookup table, a small conditional chain, or a derived 'canWrite' flag. Evaluate whether the refactor is behavior-preserving: admin + editor both return 'full' when email verified (they can be collapsed); guest (unverified or verified) with no email verification gets 'readonly'. Give credit for: applying guard clauses, reducing nesting depth to \u22642 levels, and writing the explanation in terms of the business logic rather than the code structure.",
      },
      {
        ownerRole: 'Principal engineer who has established refactoring conventions across multiple teams and uses code review as the primary teaching mechanism',
        ownerContext:
          "Evaluate the quality of the explanation, not just the code. A developer who produces clean code but cannot articulate *why* the nested version is harder to read has learned a pattern without understanding it. The key insight: nested conditions force the reader to hold multiple states in their head simultaneously. Guard clauses let the reader discard cases early and focus on what remains. Ask a follow-up if they refactor without mentioning guard clauses or early returns by name — understanding the pattern name helps them teach it to others. Also evaluate whether their version correctly collapses the `admin | editor \u2192 'full'` case — this is a common behavior-breaking mistake in this exercise.",
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
          "The bug is algorithmic: `O(n \u00d7 m)` where n = 200k users and m = 1.8M purchases = 360 billion operations in the inner loop. The fix: build a `Set<string>` of userId from purchases (one pass, O(m)), then filter users by `!purchasedSet.has(user.id)` (O(n)). Total: O(n + m). Evaluate whether the developer can articulate complexity before and after — not just 'it's faster' but 'it's O(n\u00d7m) vs O(n+m).' Also evaluate their verification plan: the output should be identical, so a good test is running both versions on a sample and comparing results. Give extra credit for noting that the real fix for a 200k/1.8M dataset should be a SQL query, not an in-memory operation.",
      },
      {
        ownerRole: 'Engineering manager who has had to explain to a non-technical CTO why a job that ran fine at 10k users takes 4 hours at 200k',
        ownerContext:
          "Evaluate the developer's ability to communicate the problem clearly and the fix correctly. Can they explain why O(n\u00d7m) is catastrophic at scale without using jargon? Can they explain why a Set lookup is O(1) and why that changes everything? For the verification plan, evaluate whether they think about edge cases: what if the same userId appears multiple times in purchases? The Set-based fix handles this correctly (a user is still in the Set regardless of how many purchases they have). Give credit for: clear complexity analysis, a correct fix, and a practical verification approach (sample test, compare outputs, run on staging first). Ask a follow-up if they don't mention moving this logic to SQL — in-memory joins on millions of records are fragile regardless of the algorithm.",
      },
    ],
  },

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
          "The deadlock occurs when two concurrent transfers happen in opposite directions: Transfer A (user1 \u2192 user2) locks user1's row then waits for user2's row. Transfer B (user2 \u2192 user1) locks user2's row then waits for user1's row. Classic lock ordering problem. The fix: always acquire locks in a deterministic order — sort the user IDs and update the lower ID first, regardless of transfer direction. Evaluate whether the developer can articulate the exact interleaving that causes the deadlock, not just 'two transactions waiting for each other.' Give credit for: explaining the specific lock acquisition order, proposing deterministic ordering as the fix, and suggesting a concurrent load test (e.g., 100 threads doing random transfers) to verify. Extra credit for mentioning advisory locks as an alternative approach.",
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
          "Evaluate the state machine design for completeness and correctness. The implementation should: (1) define all valid transitions as a configuration (e.g., a map from `[currentState, event]` to `nextState`); (2) enforce transitions centrally — no ad-hoc state changes anywhere in the codebase; (3) support side effects (hooks or listeners on transitions — 'when transitioning from paid to cancelled, trigger a refund'); (4) be serializable — the current state is stored in the DB, not in memory. Key test: can the developer enumerate all valid transitions? `draft \u2192 submitted`, `submitted \u2192 payment_pending`, `payment_pending \u2192 paid`, etc. Give credit for: a clean transition map, side-effect hooks, and explaining how adding `returned` is just adding new entries to the configuration without modifying existing transition logic.",
      },
      {
        ownerRole: 'Domain-driven design practitioner who has used state machines in 5 different bounded contexts and knows when they help and when they over-constrain',
        ownerContext:
          "Evaluate whether the developer models the domain correctly. Some transitions have guards: cancellation from `paid` state requires a refund, but cancellation from `submitted` state does not. Does the state machine support transition guards (conditions beyond just the current state)? Also evaluate: does the developer consider that `cancelled` might need sub-states (cancelled-before-payment vs. cancelled-after-payment)? Give credit for: discussing guards and conditions, handling the `cancelled` vs `refunded` distinction (refunded is a transition from cancelled, not a direct state), and acknowledging that the state machine should be the single source of truth — no code should set `order.status` directly.",
      },
    ],
  },

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
          "Evaluate the tree-building algorithm for efficiency. The optimal approach builds the tree in O(n) with a single pass: create a map from id \u2192 node, then iterate and attach each node to its parent. A naive approach that searches for parents on each node is O(n\u00b2). Evaluate: (1) is the tree built in O(n)? (2) does `getDescendants` use DFS or BFS correctly? (3) does `getMaxDepth` handle empty trees and single-node trees? (4) for the depth limit question: Reddit caps at ~10 levels for UX reasons (deep nesting is unreadable on mobile). The developer should mention both UX and performance reasons — deep nesting means large trees to render and potential stack overflow in recursive rendering. Give credit for: O(n) tree construction, correct traversal implementations, handling edge cases (orphaned comments where parentId doesn't exist), and a practical answer about depth limits.",
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
          "Evaluate conceptual understanding. Can the developer explain: (1) why we need a hash function — to convert arbitrary keys to array indices? (2) why collisions are inevitable — pigeonhole principle, infinite keys mapping to finite buckets? (3) why load factor matters — higher load factor means more collisions, slower operations? (4) why resizing is amortized O(1) — each element is rehashed at most O(log n) times across all resizes? The implementation should be clean and correct, but the explanation matters more. Give credit for: a clear mental model of how hash tables work, correct complexity analysis (especially the amortized cost of resizing), mentioning that JavaScript's Map uses a hash table internally, and discussing when a hash table is NOT the right choice (ordered data \u2192 use a tree).",
      },
    ],
  },
]
