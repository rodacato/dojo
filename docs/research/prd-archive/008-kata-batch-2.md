# PRD-008: Kata Batch 2 — Security, Testing, Database, API Design

> **Status:** draft
> **Date:** 2026-03-21
> **Author:** Claude (Valentina + Yemi + Darius guiding quality)

---

## Idea in one sentence

Twelve exercises focused on security practices, testing quality, database performance, and API design — all drawn from real engineering situations with distinct evaluator personas.

---

## Coverage summary

| # | Title | Type | Difficulty | Duration | Key topics |
|---|---|---|---|---|---|
| 009 | The Race Condition | CODE | HARD | 30 min | Concurrency, transactions, locking |
| 010 | The Test That Doesn't Test | CODE | MEDIUM | 20 min | Mocking, test design, coverage illusion |
| 011 | The SQL Injection Draft | CODE | MEDIUM | 20 min | Security, parameterized queries, input validation |
| 012 | The Cursor vs. Offset | CODE | MEDIUM | 20 min | Pagination, DB performance, consistency |
| 013 | The Regex That Breaks Production | CODE | EASY | 15 min | Regex, ReDoS, edge cases |
| 014 | The Token You Stored Wrong | CODE | HARD | 30 min | Auth, JWT, session tokens, storage |
| 015 | The Coverage Report Lie | CHAT | EASY | 15 min | Test coverage, what it does and doesn't mean |
| 016 | The Dependency Audit | CHAT | MEDIUM | 20 min | Supply chain, npm audit, transitive deps |
| 017 | The DB Migration Disagreement | CHAT | MEDIUM | 20 min | Schema migrations, backward compatibility |
| 018 | The Third Party That Went Down | CHAT | HARD | 30 min | External dependency resilience, circuit breaker |
| 019 | The Cache Design | WHITEBOARD | MEDIUM | 30 min | Caching strategy, invalidation, consistency |
| 020 | The Zero-Downtime Migration | WHITEBOARD | HARD | 45 min | Schema migration, rolling deploys, backward compat |

---

## Exercises

---

### Exercise 009 — The Race Condition

**Type:** CODE
**Difficulty:** HARD
**Languages:** TypeScript, Python, Go (any)
**Duration:** 30 min
**Topics:** `["concurrency", "race conditions", "database transactions", "optimistic locking", "ACID"]`

**Description:**
You are reviewing this function that runs inside an HTTP handler. Under load testing, you see occasional duplicate orders in the database. The test environment never reproduces it.

```typescript
async function createOrder(userId: string, productId: string, quantity: number) {
  const product = await db.products.findOne({ id: productId })
  if (product.stock < quantity) {
    throw new Error('Insufficient stock')
  }
  await db.products.update({ id: productId }, { stock: product.stock - quantity })
  const order = await db.orders.create({ userId, productId, quantity })
  return order
}
```

Explain what is happening and how you would fix it.

**Variation 1: Distributed Systems Engineer**
- `ownerRole`: "Staff distributed systems engineer who has diagnosed race conditions in high-traffic e-commerce systems"
- `ownerContext`: "Evaluate whether the developer correctly identifies the TOCTOU (time-of-check to time-of-use) race condition: the stock check and the decrement are two separate DB operations with no atomicity guarantee. Under concurrent requests, two handlers can both pass the stock check with the same stock value and both decrement. Solutions: (1) atomic UPDATE with WHERE clause checking stock (`UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`, check affected rows); (2) database-level transaction with SELECT FOR UPDATE; (3) application-level distributed lock (Redis SETNX). Give credit for understanding WHY it doesn't reproduce in tests (tests are sequential by default) and WHY the `findOne` + `update` pattern is fundamentally broken without isolation."

**Variation 2: PostgreSQL Performance Engineer**
- `ownerRole`: "PostgreSQL specialist who has optimized high-contention transaction systems at a payments company"
- `ownerContext`: "Evaluate the PostgreSQL-specific solution: a CTE with UPDATE...RETURNING that atomically decrements stock and returns the updated row in one statement, avoiding the round trip entirely. A developer who proposes a separate `SELECT FOR UPDATE` is not wrong but is adding unnecessary contention. The ideal solution: `UPDATE products SET stock = stock - $2 WHERE id = $1 AND stock >= $2 RETURNING *`. If they propose an application-level lock (Redis), ask why they introduced a distributed dependency when the database already provides the isolation. Give credit for understanding that `READ COMMITTED` isolation level is insufficient here — they need either serializable isolation or an atomic CAS operation."

---

### Exercise 010 — The Test That Doesn't Test

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** TypeScript
**Duration:** 20 min
**Topics:** `["testing", "mocking", "test design", "coverage illusion", "behavior vs. implementation"]`

**Description:**
A teammate opened a PR with 100% test coverage on this module. The PR description says "fully tested." Review it.

```typescript
// user-service.ts
import { UserRepository } from './user-repository'
import { EmailService } from './email-service'

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService
  ) {}

  async createUser(email: string, name: string) {
    const existing = await this.userRepo.findByEmail(email)
    if (existing) throw new Error('Email already registered')
    const user = await this.userRepo.create({ email, name })
    await this.emailService.sendWelcome(user)
    return user
  }
}

// user-service.test.ts
describe('UserService', () => {
  it('creates a user', async () => {
    const mockRepo = { findByEmail: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: '1', email: 'a@b.com', name: 'A' }) }
    const mockEmail = { sendWelcome: vi.fn().mockResolvedValue(undefined) }
    const service = new UserService(mockRepo as any, mockEmail as any)
    const result = await service.createUser('a@b.com', 'A')
    expect(result).toBeDefined()
  })
})
```

What is this test actually testing? What is it missing?

**Variation 1: Senior Test Engineer**
- `ownerRole`: "Senior test engineer who has seen 'green tests' give false confidence before a production incident"
- `ownerContext`: "Evaluate whether the developer understands the difference between 'coverage' and 'testing behavior.' The test has 100% line coverage but tests almost nothing: (1) no assertion on what `result` IS — `toBeDefined()` passes for any truthy value; (2) no test for the duplicate email path — the `throw` branch is never executed; (3) no verification that `emailService.sendWelcome` was called with the correct argument; (4) no test for what happens if `userRepo.create` fails — does the welcome email still get sent? The mocks are all set to happy-path responses. Give credit for identifying that coverage is a floor, not a ceiling, and for proposing specific missing test cases."

**Variation 2: Code Review Lead**
- `ownerRole`: "Staff engineer who reviews PRs for a platform team and has blocked several PRs for test quality despite 100% coverage"
- `ownerContext`: "Evaluate the depth of the developer's critique. The fundamental problem: the test is testing that the mocks work, not that `UserService` works. If someone deleted the duplicate check `if (existing) throw`, the test would still pass. A good test suite makes it impossible to delete behavior without a test failing. Ask a follow-up if they only identify missing assertions without explaining *why* the current test structure is the root cause. Give extra credit for proposing a test structure that would catch the deleted-behavior problem: test the duplicate email case explicitly, assert on the thrown error message, and verify `sendWelcome` is called with the actual created user object."

---

### Exercise 011 — The SQL Injection Draft

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** TypeScript (Node.js)
**Duration:** 20 min
**Topics:** `["SQL injection", "parameterized queries", "input validation", "security", "ORM vs raw SQL"]`

**Description:**
This code was written during a hackathon and just got promoted to production. The senior developer who reviewed it said "ship it, we'll clean it up later." That was four months ago.

```typescript
app.get('/users/search', async (c) => {
  const query = c.req.query('q')
  const users = await db.execute(
    `SELECT id, username, email FROM users WHERE username LIKE '%${query}%'`
  )
  return c.json(users)
})
```

Identify all the problems and fix them.

**Variation 1: Application Security Engineer**
- `ownerRole`: "Application security engineer who performs code audits and has found SQL injection in production systems at three different companies"
- `ownerContext`: "Evaluate the developer's security thinking. The primary issue is SQL injection via the LIKE clause — `query` is directly interpolated. A payload like `%'; DROP TABLE users; --` or, more realistically, `%' UNION SELECT password, email, NULL FROM users--` could exfiltrate data. Secondary issues: (1) no input validation — `query` could be null, empty, or 10,000 characters; (2) exposing the `email` field in a search response is a privacy concern — search results should return minimal data; (3) no rate limiting on a search endpoint is a scraping risk. The fix: parameterized query with `$1` placeholder. Give extra credit for catching the `email` exposure and proposing input length limits."

**Variation 2: Backend Developer Doing a Security Review**
- `ownerRole`: "Senior backend developer who is not a security specialist but understands the OWASP top 10 and treats security as part of code quality"
- `ownerContext`: "Evaluate practical security thinking. The developer should use parameterized queries — but go further: does their fix correctly handle the LIKE pattern? The parameterized version is `WHERE username LIKE $1` with value `'%' + query + '%'` — the wildcards go in the application, not in SQL. A developer who writes `WHERE username LIKE '%$1%'` has not fixed the injection (the quotes break the parameterization in some drivers). Give credit for: correct parameterization, input validation (trim, max length, sanitize special LIKE chars `%`, `_`), and raising the question of whether `email` should be in this response."

---

### Exercise 012 — The Cursor vs. Offset

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** TypeScript, SQL
**Duration:** 20 min
**Topics:** `["pagination", "cursor-based pagination", "offset pagination", "database performance", "consistency"]`

**Description:**
Your app has an endpoint that paginates through user activity. It currently works fine. Your DBA flagged it as a "time bomb."

```typescript
app.get('/activity', async (c) => {
  const page = parseInt(c.req.query('page') ?? '1')
  const limit = 20
  const offset = (page - 1) * limit

  const items = await db.query(
    `SELECT * FROM activity_events ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  )
  return c.json({ items, page })
})
```

What's the problem? Show me a better implementation.

**Variation 1: Database Performance Specialist**
- `ownerRole`: "Database performance specialist who has migrated three large-scale systems from offset to cursor pagination"
- `ownerContext`: "Evaluate whether the developer understands why OFFSET pagination degrades: PostgreSQL (and most RDBMS) must scan and discard `offset` rows before returning results. At `OFFSET 100000`, PostgreSQL does a full index scan of 100,020 rows to return 20. At scale this becomes O(n) per page. The secondary problem: items can shift between pages as new rows are inserted — the user sees duplicates or skips rows. Cursor-based solution: use `WHERE created_at < $cursor ORDER BY created_at DESC LIMIT $1`, where cursor is the `created_at` of the last item on the previous page. Give credit for addressing both problems (performance AND consistency) and for noting that cursor pagination makes 'total count' and 'jump to page N' impossible — that's a real trade-off to acknowledge."

**Variation 2: Senior API Designer**
- `ownerRole`: "Senior API designer who has designed pagination contracts for both internal and public APIs"
- `ownerContext`: "Evaluate the API design thinking beyond just the SQL. The current `page` parameter approach forces the client to track page numbers. A better contract: the response includes a `nextCursor` value (the encoded last `created_at`), which the client passes as `?cursor=` on the next request. This is opaque to the client. The developer should also address: (1) what happens on the first request (no cursor — start from most recent); (2) how to signal 'no more pages' (`nextCursor: null`); (3) whether the cursor should be encoded (to prevent client-side timestamp manipulation). Give credit for designing the full API contract, not just fixing the SQL."

---

### Exercise 013 — The Regex That Breaks Production

**Type:** CODE
**Difficulty:** EASY
**Languages:** JavaScript/TypeScript
**Duration:** 15 min
**Topics:** `["regex", "ReDoS", "catastrophic backtracking", "input validation", "security"]`

**Description:**
This validation function was written to check email format. In production, the server occasionally hangs on certain inputs and the request times out. You have been asked to investigate.

```typescript
function isValidEmail(email: string): boolean {
  const pattern = /^([a-zA-Z0-9]+)*@([a-zA-Z0-9]+\.)*[a-zA-Z]{2,}$/
  return pattern.test(email)
}
```

What is the problem and how do you fix it?

**Variation 1: Security Engineer (ReDoS)**
- `ownerRole`: "Security engineer who has identified ReDoS vulnerabilities during pen tests and has seen this exact pattern before"
- `ownerContext`: "Evaluate whether the developer understands catastrophic backtracking. The pattern `([a-zA-Z0-9]+)*` with nested quantifiers causes the regex engine to explore exponentially many paths when the input doesn't match. An input like `aaaaaaaaaaaaaaaaaaaaaaaaa!` will cause the server to hang because the engine tries every combination. This is a Denial of Service vector: any user can submit a crafted email string and freeze the thread. Fix: use a non-backtracking regex (`^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$`) or a library like `validator.js` that handles this correctly. Give credit for understanding *why* the nesting causes the problem, not just for providing the fix. Also give credit if they suggest limiting input length before running the regex."

**Variation 2: Senior Developer (Code Quality)**
- `ownerRole`: "Senior developer who reviews regex patterns with the same care as SQL queries — both can silently destroy performance"
- `ownerContext`: "Evaluate practical awareness of the regex problem and the developer's instinct to reach for a battle-tested library. Issues: (1) the nested quantifier `([a-zA-Z0-9]+)*` is the ReDoS trap; (2) the regex is incomplete — it would pass `a@b.c` as a valid email but fail `user+tag@example.co.uk`; (3) real email validation is notoriously hard — the RFC 5322 grammar is complex enough that rolling your own regex is almost always wrong. The correct answer is to use `validator.isEmail()` or a Zod schema (`z.string().email()`). Give credit for proposing a library solution over a 'better regex,' and for noting that the real fix also involves input length limiting before the pattern runs."

---

### Exercise 014 — The Token You Stored Wrong

**Type:** CODE
**Difficulty:** HARD
**Languages:** TypeScript
**Duration:** 30 min
**Topics:** `["authentication", "JWT", "session tokens", "localStorage vs cookie", "XSS", "CSRF", "token security"]`

**Description:**
A teammate submitted this auth implementation. It uses JWTs. The code review request says "simple, no extra libraries needed."

```typescript
// login route
app.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json()
  const user = await verifyCredentials(email, password)
  if (!user) return c.json({ error: 'Invalid credentials' }, 401)
  const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' })
  return c.json({ token })
})

// frontend
const token = await login(email, password)
localStorage.setItem('auth_token', token)
// ... every request:
headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
```

Review this implementation. What are the problems?

**Variation 1: Security Architect**
- `ownerRole`: "Security architect who has reviewed auth implementations at 20+ companies and has seen this exact pattern cause breaches"
- `ownerContext`: "Evaluate the developer's auth security depth. Problems: (1) `localStorage` is accessible to any JavaScript on the page — an XSS vulnerability anywhere in the app can steal the token; (2) the JWT has a 30-day expiry with no revocation mechanism — if the token is stolen, there is no way to invalidate it; (3) `role` in the JWT payload can be decoded (JWT is base64, not encrypted) — the client can see the role, which is an information leak; (4) no CSRF protection — but this is actually fine for Authorization header tokens (CSRF only affects cookie-based auth). The correct storage: `HttpOnly`, `Secure` cookie — not accessible to JavaScript at all. Give credit for the HttpOnly cookie recommendation, for noting the revocation problem, and for correctly analyzing the CSRF risk (which is lower with Authorization headers)."

**Variation 2: Backend Developer (Practical Auth)**
- `ownerRole`: "Backend developer who has built auth systems for SaaS products and has strong opinions about not rolling your own session management"
- `ownerContext`: "Evaluate the developer's practical judgment. The core recommendation should be: use server-side sessions (cookie → session ID → DB lookup) rather than stateless JWTs when you need revocation. Stateless JWTs are appropriate for: service-to-service auth, mobile apps without server-side session storage, short-lived tokens (<15 min). For a web app with 30-day sessions, the stateless JWT pattern creates the revocation problem: a user who changes their password, gets their device stolen, or logs out cannot invalidate existing tokens. Give credit for: correctly identifying the localStorage XSS risk, proposing HttpOnly cookies, explaining when JWTs ARE appropriate vs. when server-side sessions are better, and noting that the 30-day expiry is too long for a stateless token."

---

### Exercise 015 — The Coverage Report Lie

**Type:** CHAT
**Difficulty:** EASY
**Languages:** agnostic
**Duration:** 15 min
**Topics:** `["test coverage", "testing philosophy", "code quality", "CI", "mutation testing"]`

**Description:**
Your team just hit 90% code coverage. The engineering manager sent a Slack message: "Great work team, we're now at 90% coverage. Our code is 90% bug-free!" A junior developer asks you privately: "Is that true?"

What do you tell them — and how would you explain what coverage actually means?

**Variation 1: Senior Engineer Mentoring a Junior**
- `ownerRole`: "Senior engineer with 10 years of experience who has watched teams celebrate coverage metrics while shipping bugs"
- `ownerContext`: "Evaluate the developer's ability to explain this clearly and honestly to a junior without being cynical or dismissive. Key points to hit: (1) coverage measures which lines execute during tests, not whether the tests assert anything meaningful — you can reach 100% with `expect(true).toBe(true)`; (2) 90% coverage means nothing about the quality of the 90% — the tests could all be checking `toBeDefined()` on mocked output; (3) the bugs that matter (race conditions, edge cases, integration failures) are exactly the ones that live outside the tested happy path; (4) coverage is a floor ('if this is <80%, something is wrong') not a ceiling ('this is 90% bug-free'). Give credit for explaining clearly without condescending and for proposing something more meaningful to track — behavior coverage, mutation testing, or integration test pass rates."

**Variation 2: Engineering Manager Who Cares About Quality**
- `ownerRole`: "Engineering manager who wrote that Slack message and now realizes it might have been misleading — asking for a candid conversation"
- `ownerContext`: "Evaluate whether the developer handles this with tact and directness. The manager sent a misleading message publicly. The developer needs to: (1) correct the misunderstanding without making the manager feel attacked; (2) explain what coverage actually means in plain language; (3) propose what to track instead. The developer should not just agree to avoid conflict — that's worse than saying nothing. Give credit for: honest correction delivered respectfully, a clear explanation of what coverage does and doesn't show, and a concrete alternative metric (e.g., 'instead of tracking line coverage, let's track that every feature has at least one integration test that exercises the real API')."

---

### Exercise 016 — The Dependency Audit

**Type:** CHAT
**Difficulty:** MEDIUM
**Languages:** Node.js / npm
**Duration:** 20 min
**Topics:** `["supply chain security", "npm audit", "transitive dependencies", "dependency management", "CVE"]`

**Description:**
You run `npm audit` on your project before a major release and get this output:

```
found 47 vulnerabilities (12 moderate, 23 high, 12 critical)
12 critical vulnerabilities require manual review
```

Your release is in 3 hours. Your PM says "we can fix these next sprint." What do you do?

**Variation 1: Security Engineer**
- `ownerRole`: "Security engineer who has triaged npm audit reports and knows how to separate signal from noise"
- `ownerContext`: "Evaluate the developer's ability to triage under pressure without either panicking or dismissing. Key points: (1) `npm audit` output is notoriously noisy — many 'critical' CVEs are in dev dependencies, test utilities, or code paths that are never executed in production; (2) the first step is `npm audit --production` to see only production dependencies; (3) for each critical vuln, check: is this in a dep that's actually used in the request path? Can the attacker reach this code from outside? (4) if a critical vulnerability is in a transitive dependency, check if the parent package has a patched version; (5) never delay if there's an RCE or authentication bypass in a production-reachable code path. Give credit for: distinguishing dev vs. production deps, triaging by reachability (not just CVSS score), and proposing a clear go/no-go recommendation to the PM."

**Variation 2: Tech Lead Making the Release Decision**
- `ownerRole`: "Tech lead who owns the release decision and must communicate it to the PM, CEO, and the customer"
- `ownerContext`: "Evaluate the developer's judgment and communication skills under pressure. This is as much a communication problem as a technical one. The developer should: (1) immediately triage the 12 critical vulns to understand actual risk (not just numbers); (2) make a clear recommendation: 'We have 2 critical vulns in production-reachable code — we should delay the release by 4 hours to patch these. The other 45 can wait.' (3) not say 'everything is fine' without checking, and not say 'everything is dangerous' without checking. The PM's 'fix it next sprint' response is reasonable only if the developer confirms the critical vulns are in non-reachable code. Give credit for: fast triage methodology, clear binary recommendation (delay/proceed), and honest communication to the PM without either caving or catastrophizing."

---

### Exercise 017 — The DB Migration Disagreement

**Type:** CHAT
**Difficulty:** MEDIUM
**Languages:** SQL / agnostic
**Duration:** 20 min
**Topics:** `["database migrations", "backward compatibility", "schema evolution", "deploy strategy", "team communication"]`

**Description:**
You want to rename a database column from `user_name` to `username`. Your team has two different opinions:

- Developer A: "Just rename it in one migration. It's cleaner."
- Developer B: "We need to add the new column, backfill it, deploy, then drop the old column. That's 3 migrations."

Your team is in a heated Slack debate. You are the senior developer. What do you do?

**Variation 1: Database Migration Specialist**
- `ownerRole`: "Database migration specialist who has managed schema evolution for systems with zero-downtime deployment requirements"
- `ownerContext`: "Evaluate the developer's understanding of the deployment context. Developer A is correct IF you can do a big-bang deploy (stop the app, run migration, restart). Developer B is correct IF you have a zero-downtime rolling deployment (multiple app instances, some old, some new). In a rolling deploy, the moment you rename the column, the old app instances reading `user_name` will get errors. The 3-step migration (add new column, dual-write, deploy new code, drop old column) is required for zero-downtime. Give credit for: identifying that the right answer depends on the deploy strategy, explaining both valid approaches, and asking the right question ('do we do rolling deploys?') before picking a side."

**Variation 2: Senior Developer Resolving a Team Conflict**
- `ownerRole`: "Senior developer who is more interested in resolving the team dynamic than winning the technical debate"
- `ownerContext`: "Evaluate the developer's leadership approach. Both developers are technically correct in their own contexts — the disagreement is actually about unspoken assumptions (what kind of deploys do we do?). The right move is not to pick a side but to surface the hidden assumption. The developer should: (1) ask 'are we doing rolling deploys or do we have a maintenance window?' before arguing further; (2) facilitate the conversation rather than imposing a decision; (3) if the team genuinely does rolling deploys, then Developer B is right and that should be explained clearly; (4) propose writing down the decision as a team norm ('we always do expand-contract migrations') so this debate doesn't repeat. Give credit for surfacing the hidden assumption, for calming the debate rather than escalating it, and for proposing a durable norm."

---

### Exercise 018 — The Third Party That Went Down

**Type:** CHAT
**Difficulty:** HARD
**Languages:** agnostic
**Duration:** 30 min
**Topics:** `["resilience patterns", "circuit breaker", "fallback strategies", "external dependencies", "SLA", "retry logic"]`

**Description:**
Your application sends transactional emails via SendGrid. Last night at 11 PM, SendGrid had a 2-hour outage. During those 2 hours, every user who tried to reset their password got a 500 error. 47 users could not log in for 2 hours. Your CTO is asking: "Why didn't we handle this?"

Walk me through what we should have done and what we should build now.

**Variation 1: Reliability Engineer**
- `ownerRole`: "Site reliability engineer who has designed fault-tolerant systems at a company where email delivery is a core business function"
- `ownerContext`: "Evaluate the developer's resilience thinking. The password reset scenario requires the email to eventually succeed — but it doesn't require it to succeed synchronously. The correct architecture: (1) decouple email sending from the HTTP request — queue the email job in the DB (or a queue), return 200 to the user immediately ('check your email soon'), process the queue asynchronously; (2) implement retry logic with exponential backoff; (3) implement a circuit breaker — after N consecutive failures, stop attempting for T seconds; (4) for critical paths like password reset, consider a fallback provider (e.g., try SendGrid, fall back to SES if 3 consecutive failures). Give credit for: decoupling the HTTP response from the email send, explaining that the user-facing behavior should have been 'email queued' not 'email sent,' and identifying the circuit breaker pattern."

**Variation 2: Engineering Manager Writing the Post-Incident Review**
- `ownerRole`: "Engineering manager who needs to explain this to the CTO and prevent it from happening again"
- `ownerContext`: "Evaluate the developer's ability to think through both the technical fix and the organizational learning. The CTO wants: (1) a clear explanation of why this happened (synchronous email send, no fallback, no circuit breaker); (2) a concrete fix (queueing, async, retry); (3) a plan to prevent recurrence. But also: (4) an honest answer to 'how dependent are we on other third parties in the same way?' — SendGrid is probably not the only synchronous external call. Give credit for: the technical fix proposal, identifying other potential single points of failure (Stripe, Twilio, etc.), and proposing monitoring: 'we should alert on 3+ consecutive failures from any external service, not just discover it during a midnight outage.'"

---

### Exercise 019 — The Cache Design

**Type:** WHITEBOARD
**Difficulty:** MEDIUM
**Languages:** agnostic
**Duration:** 30 min
**Topics:** `["caching", "cache invalidation", "Redis", "TTL", "cache-aside", "write-through", "consistency"]`

**Description:**
Your dashboard endpoint is generating 200ms response times because it queries three tables and computes aggregates. Users refresh the dashboard frequently. You've been asked to add caching.

Design the caching strategy. Show your approach in the diagram and explain your invalidation strategy.

**Variation 1: Backend Engineer with Cache Experience**
- `ownerRole`: "Senior backend engineer who has implemented caching layers at 3 different companies and made every classic mistake"
- `ownerContext`: "Evaluate the developer's understanding of the 'cache invalidation is hard' problem applied to this specific case. Dashboard data includes: streak (invalidated on new completed session), today's session (invalidated on session state change), recent activity (invalidated on new session). A single TTL of 60 seconds would work but means a user sees stale data after completing a kata — bad UX. Better: cache per-user, invalidate on specific events (session completed → clear that user's dashboard cache). Evaluate: (1) do they choose cache-aside or write-through? Cache-aside is simpler and correct here; (2) do they consider per-user cache keys? (3) do they address cold cache latency? Give credit for event-driven invalidation over TTL-only and for noting that the first request after invalidation is always slow — consider background refresh."

**Variation 2: Pragmatic CTO**
- `ownerRole`: "CTO at a Series B company who has to decide between Redis (new dependency) and a simpler in-process cache"
- `ownerContext`: "Evaluate the developer's judgment about operational complexity vs. performance. For a single-server application, Redis is overkill — an in-process LRU cache with per-user TTL (30–60 seconds) may be sufficient and removes an operational dependency. But if the app scales to multiple instances, in-process caches diverge (each instance has different cached state). The developer should ask: 'How many instances are we running?' Single instance: in-process cache is fine. Multiple instances: Redis is justified. Give credit for: asking the deployment context question before proposing Redis, understanding when in-process cache is appropriate, and proposing a cache key structure that includes user ID and data type."

---

### Exercise 020 — The Zero-Downtime Migration

**Type:** WHITEBOARD
**Difficulty:** HARD
**Languages:** SQL / PostgreSQL
**Duration:** 45 min
**Topics:** `["database migrations", "zero-downtime deploy", "expand-contract", "PostgreSQL", "rolling deploy", "data backfill"]`

**Description:**
You need to split the `name` column in the `users` table into `first_name` and `last_name`. The table has 2 million rows. The application is deployed via rolling restart (no maintenance window). You cannot have any downtime.

Design the migration plan. Show the steps and the application code changes required at each step.

**Variation 1: Database Migration Specialist**
- `ownerRole`: "Database migration specialist who has performed dozens of expand-contract migrations on live PostgreSQL databases with millions of rows"
- `ownerContext`: "Evaluate the developer's understanding of the expand-contract (or parallel-change) pattern. The 6-step plan: (1) Expand: add `first_name`, `last_name` columns as nullable; (2) Backfill: update existing rows (do this in batches to avoid locking); (3) Dual-write: deploy app code that writes to BOTH old and new columns; (4) Migrate reads: deploy app code that reads from new columns; (5) Contract: drop the old `name` column; (6) Cleanup: remove dual-write logic. Critical: the backfill must be batched to avoid locking the entire table. PostgreSQL `ALTER TABLE ADD COLUMN` is instant (just metadata), but `UPDATE users SET first_name = ...` on 2M rows is not. Give credit for: identifying all 6 steps, batch backfill strategy, and understanding why skipping any step breaks the rolling deploy."

**Variation 2: Lead Developer Explaining to Junior Engineers**
- `ownerRole`: "Lead developer who needs to explain this migration plan to two junior developers who will execute it"
- `ownerContext`: "Evaluate the developer's ability to explain this clearly and safely. The most common mistakes juniors make: (1) running the backfill in a single transaction (locks the table); (2) forgetting to add a NOT NULL constraint after backfill (leaving nullable columns forever); (3) deploying the new code before the backfill is complete (reading empty `first_name`). The developer should produce a safe, step-by-step runbook that includes: rollback steps for each stage, how to verify the backfill is complete (`WHERE first_name IS NULL`), and how to test each deployment stage in staging before production. Give credit for: identifying the common failure modes, providing rollback instructions, and emphasizing that each step must be a separate deploy/migration — not bundled."
