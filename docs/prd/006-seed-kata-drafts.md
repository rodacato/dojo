# PRD-006: Seed Kata Drafts

> **Status:** draft
> **Date:** 2026-03-21
> **Author:** Claude (Valentina S2 + Yemi C4 guiding content quality)

---

## Idea in one sentence

Eight hand-crafted kata covering all three types — CODE, CHAT, WHITEBOARD — drawn from real engineering situations, ready to seed the DB.

---

## Quality bar (from Valentina)

Every exercise must:
- Leave the developer feeling they practiced or learned something, even if they failed
- Be drawn from a real scenario, not a toy example
- Have at least 2 variations with different evaluator personas
- Have specific `topics[]` that align with what the LLM will produce in `topicsToReview`

---

## Exercises

---

### Exercise 001 — The N+1 You Didn't Write

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** Ruby, Python, TypeScript (agnostic — pick your language)
**Duration:** 20 min
**Topics:** `["database", "ORM", "N+1 queries", "query optimization", "lazy loading"]`

**Description:**
You have been handed this code from a teammate. It works. Users are complaining it's slow. The team lead wants it fixed before the next sprint ends.

```ruby
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
```

Identify the problem(s), fix the code, and explain your reasoning. If you would also add something to the database layer, describe what and why.

**Variation 1: Senior Rails DBA**
- `ownerRole`: "Senior Rails engineer with 8 years building high-traffic e-commerce platforms, DBA background"
- `ownerContext`: "Evaluate the developer's ability to identify N+1 queries in ActiveRecord, understand eager loading vs. lazy loading, and reason about the tradeoffs between `includes`, `preload`, and `joins`. Look for whether they consider the DB query count, not just the Ruby logic. A developer who fixes the Ruby but ignores the underlying SQL is missing the point. Give credit for identifying the `comments.count` vs `comments.size` distinction if they catch it."

**Variation 2: Backend Performance Consultant**
- `ownerRole`: "Backend performance consultant who has audited 50+ codebases and has seen every variation of this mistake"
- `ownerContext`: "Focus on whether the developer understands the root cause (ORM lazy loading generating one query per record) before jumping to the fix. A developer who immediately writes the fix without explaining why it's an N+1 problem has pattern-matched, not understood. Ask a follow-up if they don't explain the query count. Evaluate their fix for correctness — `includes` is fine, `joins` + `select` is better for this case because we don't need the full comment objects."

---

### Exercise 002 — The Breaking API Change

**Type:** CHAT
**Difficulty:** MEDIUM
**Languages:** agnostic
**Duration:** 20 min
**Topics:** `["API versioning", "backward compatibility", "breaking changes", "consumer communication", "semantic versioning"]`

**Description:**
Your team needs to rename a field in a public REST API response. The current field is `user_name` and it needs to become `username` to match a new internal standard. You have 3 external consumers — two are internal teams, one is a paying customer with their own mobile app.

The mobile app developer told you (in Slack, informally) "just let me know a week before." Your team lead is pushing to ship this in the next release. Your PM says "it's just a rename."

How do you handle this? Walk me through your decision and your plan.

**Variation 1: Skeptical Tech Lead**
- `ownerRole`: "Tech lead who has personally been burned by a breaking API change that took down a partner integration for 6 hours"
- `ownerContext`: "Evaluate whether the developer understands the difference between a 'breaking change' and a 'non-breaking change.' The rename IS breaking — any consumer doing `response.user_name` will get `undefined`. Evaluate their mitigation plan: versioning (v1/v2), dual-field period (both `user_name` and `username` for N weeks), or negotiated cutover. The developer's comfort with pushback matters — do they cave to the PM's 'it's just a rename,' or do they hold the line on consumer impact? Give credit for proposing a concrete communication plan, not just 'we'll tell them.'"

**Variation 2: Partner Engineering Manager**
- `ownerRole`: "Partner engineering manager at a company whose mobile app was broken by an undocumented API change from a vendor"
- `ownerContext`: "Evaluate from the consumer's perspective. Does the developer consider the mobile app's release cycle? A mobile app cannot hotfix in 24 hours — the developer needs to account for Apple/Google review timelines if the consumer needs to ship an update. Ask a follow-up if they don't address the mobile app specifically. A plan that works for internal teams but ignores mobile is incomplete."

---

### Exercise 003 — The Midnight Incident

**Type:** CHAT
**Difficulty:** HARD
**Languages:** agnostic
**Duration:** 30 min
**Topics:** `["incident response", "debugging under pressure", "root cause analysis", "communication", "postmortem thinking"]`

**Description:**
It's 2:17 AM. You are on call. PagerDuty wakes you up. The alert says: "Payment service — error rate 47%, p99 latency 12 seconds."

You have access to: application logs, a metrics dashboard (Datadog), and a Slack channel where your CTO has just posted "what's going on?"

Walk me through your next 20 minutes. What do you do, in what order, and what do you say to the CTO?

**Variation 1: Battle-Hardened SRE**
- `ownerRole`: "Staff SRE with 10 years of on-call experience at a fintech company, has managed 200+ incidents"
- `ownerContext`: "Evaluate the developer's incident response process. Are they mitigating first (reducing blast radius) or diagnosing first? The correct order for a payment service is: (1) check if there's a recent deploy to roll back, (2) check if there's an external dependency (payment processor, database) showing issues, (3) start triage. Evaluate their communication — what do they tell the CTO? 'We're looking into it' is not enough; 'Error rate is 47% on the payment service, we believe it may be related to the deploy at 1:45 AM, we are investigating rollback' is better. Give credit for not jumping to conclusions before having data."

**Variation 2: Pragmatic Engineering Manager**
- `ownerRole`: "Engineering manager who has seen developers freeze under incident pressure and developers who stay calm and systematic"
- `ownerContext`: "Evaluate the developer's ability to stay systematic under pressure. Do they panic and start changing things? Do they communicate clearly? Do they know when to escalate (wake up a senior engineer)? The payment service context is important — 47% error rate means real money is being lost. Evaluate whether they acknowledge the business impact or treat it as purely a technical problem. A developer who says 'I'd fix the bug' without acknowledging the customer impact is missing the real dimension of incident response."

---

### Exercise 004 — TypeScript You Inherited

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** TypeScript
**Duration:** 20 min
**Topics:** `["TypeScript", "type safety", "any type", "union types", "type narrowing", "runtime vs compile-time"]`

**Description:**
You joined a new team. This is real code from the codebase. The previous developer said "we'll fix the types later." It's been 18 months.

```typescript
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
```

This function is called 40 times across the codebase. Improve the types. Don't change the runtime behavior. Explain every decision you make.

**Variation 1: TypeScript Purist**
- `ownerRole`: "Senior TypeScript engineer who has maintained a typed codebase of 200k lines for 4 years"
- `ownerContext`: "Evaluate the developer's TypeScript thinking. Do they define discriminated unions for the event types? Do they understand the difference between `unknown` and `any`? Do they use type guards or type narrowing correctly? A solution that uses `as EventType` casting is not type-safe — it compiles but moves the problem. Give credit for: discriminated union definition, exhaustive switch or if-else with proper narrowing, and understanding why `any` was a mistake (bypasses the compiler entirely). Ask a follow-up if they only improve the function signature without addressing the root type definition."

**Variation 2: Code Review Pragmatist**
- `ownerRole`: "Staff engineer who reviews 20+ PRs per week and has to balance type safety with practical migration paths"
- `ownerContext`: "Evaluate the developer's migration strategy, not just the type design. This code is called 40 times. A perfect type rewrite that breaks 40 call sites is not a good PR. Does the developer think about incremental adoption? Can the function be typed at the boundary while the call sites migrate gradually? Give credit for: understanding the blast radius (40 call sites), proposing a migration path, and identifying that the `currency` fallback to 'USD' is itself a typing issue — it implies `currency` can be undefined, which should be explicit."

---

### Exercise 005 — The SQL That Works (Until It Doesn't)

**Type:** CODE
**Difficulty:** HARD
**Languages:** SQL (PostgreSQL)
**Duration:** 30 min
**Topics:** `["PostgreSQL", "query performance", "indexes", "EXPLAIN ANALYZE", "JOIN vs subquery", "NULL handling"]`

**Description:**
This query runs fine in staging (50k rows). It runs for 45 seconds in production (8M rows). Your task is to analyze it and fix it.

```sql
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
```

Explain what is wrong and provide a corrected version. Assume you have access to `EXPLAIN ANALYZE` output.

**Variation 1: PostgreSQL DBA**
- `ownerRole`: "PostgreSQL DBA with 12 years of experience, has diagnosed hundreds of slow queries in production"
- `ownerContext`: "Evaluate the developer's ability to read a query and identify multiple problems without running it. Problems in this query: (1) `OR s.completed_at IS NULL` prevents index use on `completed_at` — the optimizer cannot use a range index with OR NULL conditions; (2) the `LEFT JOIN` on attempts means every attempt row is included, inflating `COUNT(s.id)` — should be counting distinct sessions; (3) `AVG(CASE ...)` over a JOIN produces wrong pass_rate if a session has multiple attempts; (4) no index hint that `users.id`, `sessions.user_id`, `attempts.session_id`, `sessions.completed_at` are indexed. Give credit for identifying at least 2 of these. The NULL handling and the inflated COUNT are the most common misses."

**Variation 2: Senior Backend Engineer (PostgreSQL experience)**
- `ownerRole`: "Senior backend engineer who writes SQL daily but is not a dedicated DBA — approaches this from a product and correctness perspective"
- `ownerContext`: "Evaluate correctness first, performance second. The query produces wrong results before it produces slow results: `COUNT(s.id)` counts attempt rows, not sessions; `AVG(CASE ...)` computes pass rate per attempt, not per session. A developer who produces a 'fast' version of a wrong query has not solved the problem. Ask a follow-up if they fix performance without noticing the correctness issue. Give extra credit for catching the `OR ... IS NULL` index problem — it requires understanding how PostgreSQL evaluates OR conditions with NULL."

---

### Exercise 006 — The Architecture Decision

**Type:** WHITEBOARD
**Difficulty:** HARD
**Languages:** agnostic
**Duration:** 45 min
**Topics:** `["system design", "event-driven architecture", "message queues", "trade-offs", "scalability", "reliability"]`

**Description:**
A startup's checkout service sends a confirmation email after every purchase. Currently: the checkout service calls the email service directly (synchronous HTTP). When the email service goes down, checkouts fail. When the email service is slow, checkouts are slow.

The CTO wants you to propose an architecture that decouples the two services. You have 45 minutes. Show your design.

Use the diagram area to show the proposed architecture. Write your reasoning in the text area below the diagram.

**Variation 1: Distributed Systems Engineer**
- `ownerRole`: "Staff distributed systems engineer who has designed event-driven systems at a company processing 10M orders/day"
- `ownerContext`: "Evaluate whether the developer understands the fundamental trade-off they are making: moving from synchronous (consistent but coupled) to asynchronous (decoupled but eventually consistent). Does their design handle the 'at-least-once delivery' problem? What happens if the queue consumer crashes after pulling a message but before sending the email — will the email be sent again? Does the design include a dead-letter queue for failed email sends? Give credit for: identifying the consistency trade-off, proposing message queue (Kafka, RabbitMQ, SQS — any is fine), handling idempotency, and acknowledging what observability looks like in the new system."

**Variation 2: Pragmatic CTO**
- `ownerRole`: "CTO of a Series A startup who has 5 engineers and needs to choose between the right architecture and the shippable architecture"
- `ownerContext`: "Evaluate the developer's judgment about complexity. A developer who proposes Kafka + Zookeeper + multiple consumer groups for a startup with 5 engineers is overengineering. The pragmatic solution might be: a simple outbox pattern (write email_jobs to DB in the same transaction as the purchase, have a worker poll the table). Does the developer consider the team's capacity and operational complexity, not just the technical correctness? Give credit for proposing the simplest thing that works, noting what it doesn't do (not fault-tolerant to extended email service outages), and defining when they would upgrade to a real queue."

---

### Exercise 007 — The Code Review

**Type:** CODE
**Difficulty:** EASY
**Languages:** TypeScript
**Duration:** 15 min
**Topics:** `["code review", "readability", "error handling", "async/await", "TypeScript", "defensive programming"]`

**Description:**
This is a pull request from a junior developer on your team. They're proud of it. It works. Give them a code review — be specific, be helpful, and be honest.

```typescript
async function getUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`)
    const data = await response.json()
    if (data) {
      return data.user
    }
  } catch(e) {
    console.log(e)
  }
}
```

**Variation 1: Kind-but-Honest Senior Dev**
- `ownerRole`: "Senior developer who mentors juniors and has strong opinions about what makes feedback useful vs. demoralizing"
- `ownerContext`: "Evaluate whether the developer's code review is specific, constructive, and honest. Issues to find: (1) `userId` has no type annotation; (2) `response.ok` is not checked — a 404 or 500 response will not throw but will return an error body; (3) `if (data)` is truthy-checking an object, which is always true — the `data.user` check is the right guard; (4) the catch swallows the error — `console.log` is not error handling for production code; (5) the function returns `undefined` on error, not `null`, and has no return type annotation. Give credit for identifying 3+ issues AND for framing feedback in a way that helps the junior understand why, not just what."

**Variation 2: Principal Engineer Doing a Thorough Review**
- `ownerRole`: "Principal engineer who treats every code review as a teaching opportunity and will not approve code that could silently fail in production"
- `ownerContext`: "Evaluate technical depth. The `response.ok` check is the most production-critical issue — a user who gets a 404 because the userId doesn't exist will get `undefined` back with no error, and the caller has no way to distinguish 'not found' from 'fetch error.' The developer should propose a pattern for error handling: either throw a typed error (`UserNotFoundError`, `FetchError`) or return a discriminated union (`{ ok: true, user } | { ok: false, error }`). Give extra credit for suggesting that the function's return type should be explicit, not inferred, and for noting that `console.log(e)` is especially bad — it logs the error object, which may contain sensitive user data."

---

### Exercise 008 — The Feature Flag Refactor

**Type:** CHAT
**Difficulty:** EASY
**Languages:** agnostic
**Duration:** 15 min
**Topics:** `["feature flags", "technical debt", "refactoring", "risk management", "gradual rollout"]`

**Description:**
Your team shipped a feature 6 months ago behind a feature flag. The flag is `ENABLE_NEW_CHECKOUT`. It's been at 100% for 5 months. The old code path still exists. The flag is checked in 14 places across 6 files.

Your PM says "we should clean this up." You have a sprint with 2 other features already planned. What do you do?

**Variation 1: Pragmatic Engineering Lead**
- `ownerRole`: "Engineering lead who manages technical debt alongside feature work and has cleaned up 20+ dead code paths"
- `ownerContext`: "Evaluate the developer's judgment about timing and risk. This is not an emergency but it is legitimate debt. Does the developer propose a concrete cleanup plan? The steps are: (1) verify the flag is actually at 100% in all environments (including staging — it's often different); (2) remove the flag check and the old code path in a single PR; (3) test that removing the old code doesn't break anything (the old path was disabled, but it may have shared utilities); (4) update the feature flag service to retire the flag name. Give credit for: proposing the cleanup as a separate PR (not bundled with a feature), estimating the risk correctly (low — the old code hasn't run in 5 months), and pushing back appropriately if the sprint is truly full."

**Variation 2: Senior Dev Who Has Seen Feature Flags Accumulate**
- `ownerRole`: "Senior developer who has worked in a codebase with 200+ feature flags and knows what happens when they're not cleaned up"
- `ownerContext`: "Evaluate whether the developer understands the cost of leaving it. Every flag check is dead branch logic that the next developer has to read and understand. The 14 occurrences in 6 files means 14 places where a future developer will have to ask 'is this still relevant?' Give credit for: quantifying the cleanup cost (probably 2-4 hours for a careful developer), comparing it to the accumulating cost of leaving it, and proposing a graduation process — not just 'delete it' but 'verify → delete → monitor → retire flag name.'"

---

## Seed script structure

```typescript
// apps/api/src/infrastructure/persistence/seed.ts

const exercises = [
  {
    id: '...', // deterministic UUID v5 from title
    title: 'The N+1 You Didn\'t Write',
    description: '...', // exact text from above
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    status: 'published',
    language: ['ruby', 'python', 'typescript'],
    tags: ['performance', 'database', 'orm'],
    topics: ['database', 'ORM', 'N+1 queries', 'query optimization'],
    variations: [
      {
        ownerRole: 'Senior Rails engineer...',
        ownerContext: '...',
      },
      {
        ownerRole: 'Backend performance consultant...',
        ownerContext: '...',
      }
    ]
  },
  // ... 7 more
]
```

> ⚠ Open question: Should seed exercises use deterministic UUIDs (reproducible across environments) or random UUIDs (generated at seed time)? Deterministic is better — it allows safe re-seeding without creating duplicate records. Use UUIDv5 with a fixed namespace + exercise title as input.

---

## Coverage summary

| # | Title | Type | Difficulty | Duration | Key topics |
|---|---|---|---|---|---|
| 001 | The N+1 You Didn't Write | CODE | MEDIUM | 20 min | ORM, query optimization |
| 002 | The Breaking API Change | CHAT | MEDIUM | 20 min | API versioning, communication |
| 003 | The Midnight Incident | CHAT | HARD | 30 min | Incident response |
| 004 | TypeScript You Inherited | CODE | MEDIUM | 20 min | TypeScript, type safety |
| 005 | The SQL That Works (Until It Doesn't) | CODE | HARD | 30 min | PostgreSQL, performance |
| 006 | The Architecture Decision | WHITEBOARD | HARD | 45 min | System design, event-driven |
| 007 | The Code Review | CODE | EASY | 15 min | Code review, error handling |
| 008 | The Feature Flag Refactor | CHAT | EASY | 15 min | Technical debt, risk |

---

## Provisional conclusion

Eight exercises covering: 4 CODE, 3 CHAT, 1 WHITEBOARD. 2 EASY, 4 MEDIUM, 2 HARD. Duration range: 15–45 min. Each has 2 variations with distinct evaluator perspectives.

This is enough to test all three kata views, all difficulty levels, and the full time range. The 6-month exclusion window means the creator can use these exercises for weeks without repetition.

---

## Next step

- [ ] Convert to SQL seed data in `apps/api/src/infrastructure/persistence/seed.ts`
- [ ] Add idempotency (upsert, not insert — safe to re-run)
- [ ] Add seed validation function (non-empty fields, at least 1 variation per exercise)
- [ ] Add `pnpm --filter=api db:seed` script to `package.json`
