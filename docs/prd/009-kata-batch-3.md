# PRD-009: Kata Batch 3 — Communication, Debugging, Performance, Architecture

> **Status:** draft
> **Date:** 2026-03-21
> **Author:** Claude (Valentina + Yemi + Soren guiding quality)

---

## Idea in one sentence

Twelve exercises focused on technical communication, debugging production issues, performance optimization, and architectural thinking — covering the softer but critical engineering skills.

---

## Coverage summary

| # | Title | Type | Difficulty | Duration | Key topics |
|---|---|---|---|---|---|
| 021 | The Technical Explanation | CHAT | EASY | 15 min | Communication, non-technical stakeholders |
| 022 | The PR That Never Gets Merged | CHAT | MEDIUM | 20 min | Getting alignment, breaking down work |
| 023 | The Memory Leak | CODE | HARD | 30 min | Node.js, garbage collection, closures |
| 024 | The React Rerender Cascade | CODE | MEDIUM | 20 min | Memoization, React patterns, profiling |
| 025 | The Log You'll Regret | CODE | EASY | 15 min | Logging, PII, observability, what to log |
| 026 | The Database Deadlock | CODE | HARD | 30 min | Deadlocks, lock ordering, transactions |
| 027 | The Microservice You Regret | CHAT | HARD | 30 min | Distributed systems, network overhead, coupling |
| 028 | The API Rate Limit You Hit | CHAT | MEDIUM | 20 min | External APIs, resilience, retry strategy |
| 029 | The Git History Rewrite | CHAT | EASY | 15 min | Git, rebase vs merge, team communication |
| 030 | The Dead Letter Queue Design | WHITEBOARD | HARD | 45 min | Async systems, error handling, DLQ |
| 031 | The Observability Design | WHITEBOARD | MEDIUM | 30 min | Metrics, logs, traces, alerts |
| 032 | The Config That Ate Production | CODE | MEDIUM | 20 min | Environment config, overrides, secrets |

---

## Exercises

---

### Exercise 021 — The Technical Explanation

**Type:** CHAT
**Difficulty:** EASY
**Languages:** agnostic
**Duration:** 15 min
**Topics:** `["communication", "technical writing", "stakeholder management", "abstraction", "translation"]`

**Description:**
Your PM just scheduled an emergency meeting. The subject is: "Why did the thing break?" The "thing" was an outage caused by a database connection pool exhaustion — too many concurrent database connections during a traffic spike. The attendees are: your PM (non-technical), one stakeholder from sales, and the CTO.

Write what you would say in the first 2 minutes of that meeting.

**Variation 1: Engineering Communication Coach**
- `ownerRole`: "Director of engineering who has coached 20+ engineers on presenting technical issues to non-technical audiences"
- `ownerContext`: "Evaluate the developer's ability to translate technical concepts without condescension or excessive simplification. Key elements of a good explanation: (1) what broke (in user terms — 'the app stopped accepting requests' not 'the connection pool was exhausted'); (2) why it broke (accessible analogy — 'think of it as a checkout at a store with only 10 registers: if 100 people arrive at once, 90 people have to wait, and our system wasn't designed to make them wait — it just gave up'); (3) how it was fixed (simple — 'we increased the capacity and added a waiting mechanism'); (4) what prevents recurrence (confidence-building — 'we now have alerts that warn us before we hit the limit'). Give credit for: correct abstraction level for the audience, an analogy, covering what/why/fixed/prevent, and not being defensive about the failure."

**Variation 2: CTO Who Will Present This to the Board**
- `ownerRole`: "CTO who needs to turn this explanation into a 3-slide incident summary for the board meeting next week"
- `ownerContext`: "Evaluate the developer's ability to structure information for executive communication. The CTO needs: (1) impact summary (duration, % of users affected, business impact if any); (2) root cause in one sentence (not a paragraph); (3) immediate fix vs. systemic fix distinction. A developer who provides a 500-word technical explanation has not helped the CTO. Give credit for: a crisp summary the CTO could copy into slides, clear distinction between 'what we did to stop the bleeding' vs. 'what we're doing so it doesn't happen again,' and a quantified impact statement. Ask a follow-up if they provide details without structure."

---

### Exercise 022 — The PR That Never Gets Merged

**Type:** CHAT
**Difficulty:** MEDIUM
**Languages:** agnostic
**Duration:** 20 min
**Topics:** `["pull requests", "getting alignment", "breaking down work", "code review culture", "team communication"]`

**Description:**
You opened a PR 3 weeks ago. It has 1,800 lines of changed code. Three reviewers have commented on it but none have approved it. Every time you address one reviewer's comments, another reviewer appears with a different concern. The PR keeps growing. Your manager asks: "Why isn't this merged?"

What went wrong and what do you do now?

**Variation 1: Staff Engineer Who Has Seen This Pattern**
- `ownerRole`: "Staff engineer who has reviewed hundreds of PRs and has a strong opinion that 1,800-line PRs are a process failure, not a technical one"
- `ownerContext`: "Evaluate whether the developer can diagnose the root cause without blaming reviewers. The fundamental problem: 1,800-line PRs are almost always unmergeable not because the code is wrong but because: (1) reviewers can't hold the whole change in their head — they review defensively; (2) new reviewers on large PRs always find new issues (the blast radius of the PR means any concern feels valid); (3) the author is invested in the whole change and resists splitting it. The path forward: close the PR, split it into 4–6 smaller PRs that can each be reviewed and merged independently. Each PR should be mergeable without the others — this forces better design. Give credit for: diagnosing the PR size as the root cause, proposing a concrete split strategy, and acknowledging that 'waiting for approval' is not a strategy."

**Variation 2: Engineering Manager Facilitating the Conversation**
- `ownerRole`: "Engineering manager who has 3 developers stuck in PR review limbo at any given time and needs to change the team's PR culture"
- `ownerContext`: "Evaluate the developer's ability to both fix their immediate problem AND improve the process. Short-term: split the PR. Long-term: this is a team-level problem — the team doesn't have a shared PR size norm or a culture of small, frequent merges. What does the developer suggest for the team? An appropriate answer includes: a team agreement on max PR size (e.g., 400 lines for feature work, no limit for mechanical refactors), a practice of 'draft PR' to get early alignment before large work, and a reviewer norm that large PRs get a 'please split this' comment, not individual detailed feedback. Give credit for: fixing the immediate problem, proposing a durable team norm, and not blaming the reviewers for doing exactly what you'd expect when given an 1,800-line PR."

---

### Exercise 023 — The Memory Leak

**Type:** CODE
**Difficulty:** HARD
**Languages:** TypeScript (Node.js)
**Duration:** 30 min
**Topics:** `["memory management", "garbage collection", "closures", "event listeners", "Node.js", "profiling"]`

**Description:**
Your Node.js API server's memory climbs 50MB every hour and never comes back down. After 24 hours, the server is OOM and crashes. You have been asked to find and fix the leak.

You've narrowed it down to this module:

```typescript
class WebSocketManager {
  private handlers: Map<string, Function[]> = new Map()
  private eventLog: Array<{ sessionId: string; event: string; timestamp: number }> = []

  onEvent(sessionId: string, event: string, handler: Function) {
    if (!this.handlers.has(sessionId)) {
      this.handlers.set(sessionId, [])
    }
    this.handlers.get(sessionId)!.push(handler)
    this.eventLog.push({ sessionId, event, timestamp: Date.now() })
  }

  removeSession(sessionId: string) {
    this.handlers.delete(sessionId)
    // sessionId removed from handlers
    // eventLog not cleaned up
  }
}
```

Find the leak(s) and fix them.

**Variation 1: Node.js Performance Engineer**
- `ownerRole`: "Node.js performance engineer who has profiled memory leaks in production servers and uses heap snapshots as a diagnostic tool"
- `ownerContext`: "Evaluate the developer's ability to identify both leaks in this code: (1) Primary: `eventLog` array grows unboundedly — every event is pushed but the `removeSession` method only removes from `handlers`, not from `eventLog`. Over 24 hours of WebSocket activity, this becomes a large array of objects that are never GC'd. Fix: remove log entries for the session in `removeSession`, or implement a bounded log (ring buffer / max 10k entries). (2) Secondary: `handlers` holds closures. If the closures capture large objects (like the WebSocket connection itself or large request state), the closures keep those objects alive. Fix: ensure handler functions don't capture unnecessary scope. Give credit for identifying both issues and for noting that the fix to `eventLog` should use `splice` or `filter`, not just clear the whole log."

**Variation 2: Senior Engineer Doing a Code Review**
- `ownerRole`: "Senior engineer who reviews code with a memory management lens, especially for long-running server processes"
- `ownerContext`: "Evaluate the practical review approach. The developer should identify: (1) `removeSession` is incomplete — it removes handlers but not the event log entries, so the event log grows for every session that is ever created, never shrinking; (2) the `Function[]` array in `handlers` means the closures (and anything they close over) are kept alive as long as the session is in the Map. Review feedback should be specific: 'This class has no maximum size constraint on `eventLog`. In a server that processes 1,000 sessions/day, this will contain millions of entries within a week.' Give credit for: identifying the eventLog cleanup issue, explaining the closure retention mechanism, and proposing a bounded data structure for the log."

---

### Exercise 024 — The React Rerender Cascade

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** TypeScript (React)
**Duration:** 20 min
**Topics:** `["React", "memoization", "useCallback", "useMemo", "React.memo", "component performance", "profiling"]`

**Description:**
The dashboard page feels sluggish after a recent update. You open React DevTools Profiler and see that every keystroke in the search input causes 23 components to re-render, including expensive chart components that have nothing to do with the search.

The top-level component looks like this:

```typescript
function Dashboard({ userId }: { userId: string }) {
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  const handleThemeChange = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  const stats = computeExpensiveStats(userId)

  return (
    <div>
      <Header onThemeChange={handleThemeChange} theme={theme} />
      <SearchBar value={search} onChange={setSearch} />
      <StatsPanel stats={stats} />
      <ActivityChart userId={userId} />
    </div>
  )
}
```

What is causing the re-renders and how do you fix them?

**Variation 1: React Performance Specialist**
- `ownerRole`: "Frontend engineer who specializes in React performance and has profiled dozens of applications using React DevTools"
- `ownerContext`: "Evaluate the developer's understanding of React's render model. Problems: (1) `handleThemeChange` is a new function reference on every render — any component receiving it as a prop will re-render (even if wrapped in `React.memo`) because the prop reference changed. Fix: `useCallback`. (2) `computeExpensiveStats(userId)` runs on every render, including every keystroke. Fix: `useMemo`. (3) `ActivityChart` and `StatsPanel` are not memoized, so they re-render whenever `Dashboard` re-renders. Fix: `React.memo` on these components. The cascade: `search` state change → `Dashboard` re-renders → new `handleThemeChange` reference → `Header` re-renders (if memoized by ref) → `StatsPanel`, `ActivityChart` re-render because they're not memoized. Give credit for identifying all three issues and understanding why `React.memo` alone doesn't fix the `handleThemeChange` problem."

**Variation 2: Senior Developer with a 'Don't Over-Optimize' Philosophy**
- `ownerRole`: "Senior developer who believes premature optimization is the root of all evil and pushes back on adding `useMemo` and `useCallback` everywhere"
- `ownerContext`: "Evaluate the developer's ability to optimize selectively. The question is not 'how do I add memo everywhere' but 'which re-renders actually matter.' If `Header` is cheap to render (just a button and a theme toggle), the `handleThemeChange` optimization is not worth the cognitive overhead of `useCallback`. The priorities should be: (1) `computeExpensiveStats` is expensive by name — `useMemo` is clearly justified; (2) `ActivityChart` renders a chart — if it does canvas or D3 work, `React.memo` is justified; (3) `StatsPanel` might be cheap — profile first, optimize second. Give credit for: proposing measurement before optimization, identifying the genuinely expensive operations (`computeExpensiveStats`, chart rendering), and explaining the trade-off between optimization and code readability."

---

### Exercise 025 — The Log You'll Regret

**Type:** CODE
**Difficulty:** EASY
**Languages:** TypeScript
**Duration:** 15 min
**Topics:** `["logging", "PII", "observability", "GDPR", "structured logging", "log levels"]`

**Description:**
A new developer joined your team and added logging to several API endpoints. You're doing a pre-deploy review.

```typescript
app.post('/auth/login', async (c) => {
  const body = await c.req.json()
  logger.info('Login attempt', { body })
  const user = await authenticate(body.email, body.password)
  if (!user) {
    logger.info('Login failed', { email: body.email, password: body.password })
    return c.json({ error: 'Invalid credentials' }, 401)
  }
  logger.info('Login success', { user })
  return c.json({ token: generateToken(user) })
})
```

What's wrong? Block this PR.

**Variation 1: Security and Compliance Engineer**
- `ownerRole`: "Security engineer responsible for GDPR compliance who reviews every PR that touches user data flows"
- `ownerContext`: "Evaluate the developer's ability to identify multiple PII and security issues: (1) `body` in the first log contains the raw password — this is logged in plaintext to whatever log aggregator is used (Datadog, CloudWatch, etc.); (2) `body.password` in the failure log is even worse — it explicitly logs the user's password; (3) `user` object in the success log likely contains `email`, `id`, and possibly other sensitive fields — log the minimum (just `userId`); (4) `body.email` in the failure log is PII under GDPR — logging emails that failed auth creates a list of 'who tried to log in' which may be a data minimization violation. Fix: log only what you need for debugging (attempt IP, email HASH, not plaintext, and userId on success). Give credit for: identifying all 4 issues, explaining the compliance dimension (not just 'it's bad practice'), and proposing a correct version."

**Variation 2: Senior Developer Mentoring a Junior**
- `ownerRole`: "Senior developer who wants to turn this into a teaching moment, not just a rejection"
- `ownerContext`: "Evaluate the developer's ability to give constructive, educational feedback. The junior developer had the right instinct (logging is good!) but didn't think through what to log. The feedback should: (1) acknowledge the positive intent ('adding observability is good — we want to know about login failures'); (2) explain why logging credentials is dangerous without being alarmist ('anyone with log access can now read passwords — that includes every developer, the log aggregator vendor, and anyone who gets log access later'); (3) show them what good logging looks like: `logger.info('Login attempt', { ip: c.req.header('x-forwarded-for'), emailHash: sha256(body.email) })`; (4) mention that this is a common mistake, not a judgment on their competence. Give credit for: educational framing, showing the correct pattern, and mentioning log access as a real threat model."

---

### Exercise 026 — The Database Deadlock

**Type:** CODE
**Difficulty:** HARD
**Languages:** SQL / TypeScript
**Duration:** 30 min
**Topics:** `["deadlocks", "lock ordering", "database transactions", "PostgreSQL", "concurrent writes"]`

**Description:**
Your application occasionally throws `deadlock detected` errors in production. It happens maybe 3–4 times a day. You have found these two transactions that are likely involved:

```typescript
// Transaction A: Process a purchase
async function processPurchase(buyerId: string, sellerId: string, amount: number) {
  await db.transaction(async (tx) => {
    const buyer = await tx.execute('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [buyerId])
    const seller = await tx.execute('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [sellerId])
    await tx.execute('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, buyerId])
    await tx.execute('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, sellerId])
  })
}

// Transaction B: Process a refund (reversed direction)
async function processRefund(sellerId: string, buyerId: string, amount: number) {
  await db.transaction(async (tx) => {
    const seller = await tx.execute('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [sellerId])
    const buyer = await tx.execute('SELECT * FROM accounts WHERE id = $1 FOR UPDATE', [sellerId])
    await tx.execute('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, sellerId])
    await tx.execute('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, buyerId])
  })
}
```

Explain what's happening and fix it.

**Variation 1: Database Concurrency Expert**
- `ownerRole`: "PostgreSQL database engineer specializing in concurrency, lock management, and deadlock resolution at a fintech company"
- `ownerContext`: "Evaluate the developer's understanding of deadlock mechanics. The classic lock-ordering deadlock: Transaction A locks account(buyerId) then tries to lock account(sellerId). Transaction B (refund) locks account(sellerId) first, then tries to lock account(buyerId). If A and B run concurrently on the same accounts, A holds buyer-lock waiting for seller-lock while B holds seller-lock waiting for buyer-lock — circular wait, deadlock. Fix: always acquire locks in a consistent order (e.g., always lock the lower account ID first). Also note the bug: Transaction B has `FOR UPDATE` on `sellerId` twice and never locks `buyerId` — likely a copy-paste error. Give credit for: explaining the circular wait mechanism, identifying the lock ordering fix, spotting the copy-paste bug, and potentially noting that `SELECT FOR UPDATE` may not be the most performant solution here (atomic UPDATE is better)."

**Variation 2: Senior Backend Developer**
- `ownerRole`: "Senior backend developer who understands concurrency issues and has to explain deadlocks to two junior developers who have never encountered them before"
- `ownerContext`: "Evaluate the developer's explanation clarity alongside their technical fix. Deadlocks are counterintuitive — juniors often think 'just add a retry' (which works but doesn't fix the root cause). The developer should: (1) explain what a deadlock is in concrete terms ('both transactions are waiting for each other and neither can proceed — like two cars at a one-lane bridge going opposite directions'); (2) identify the specific lock order problem; (3) spot the copy-paste bug in Transaction B; (4) propose the consistent lock ordering fix; (5) mention that PostgreSQL will automatically detect the deadlock and roll back one transaction — so a retry IS needed, but only as a fallback after fixing the root cause. Give credit for: clear explanation, finding the bug, proposing the ordering fix, and correctly explaining the retry strategy."

---

### Exercise 027 — The Microservice You Regret

**Type:** CHAT
**Difficulty:** HARD
**Languages:** agnostic
**Duration:** 30 min
**Topics:** `["microservices", "distributed systems", "network latency", "service coupling", "monolith vs microservices"]`

**Description:**
18 months ago, your team split the user profile into its own microservice (`user-service`). Today, every page load on the dashboard makes 4 HTTP calls to `user-service` to assemble the page. The p99 latency of the dashboard is 1.8 seconds. The `user-service` is down 0.3% of the time — which means the dashboard fails 0.3% of the time for every 4 calls: a compounding failure rate.

Your CTO is asking whether to keep the microservice or merge it back.

**Variation 1: Distributed Systems Architect**
- `ownerRole`: "Staff distributed systems architect who has seen both successful and failed microservice decompositions and has strong opinions about when they are justified"
- `ownerContext`: "Evaluate the developer's ability to make a reasoned architectural recommendation based on evidence. The case for merging back (strangler fig pattern): (1) 4 synchronous HTTP calls per page load is a network overhead problem — in a monolith, these would be 4 function calls, microseconds not milliseconds; (2) 0.3% downtime compounding across 4 calls means ~1.2% effective failure rate; (3) a user profile service is highly cohesive with the main app — it doesn't benefit from independent deployment unless the team is truly independent. The case for keeping: (1) if the user-service team is independent and ships on a different cycle; (2) if user profile data is shared by multiple services. Ask the developer: 'What is the deployment independence that justified this split?' If there isn't a good answer, the split was premature. Give credit for: evidence-based reasoning, acknowledging the cases for keeping, and proposing a concrete migration path if they recommend merging."

**Variation 2: Engineering Manager Communicating to the CTO**
- `ownerRole`: "Engineering manager who has to give the CTO a clear recommendation with business impact framing"
- `ownerContext`: "Evaluate the developer's business-impact framing alongside the technical analysis. The CTO doesn't want an architecture lecture — they want: (1) 'is the 1.8s p99 latency causing user drop-off?' (this connects to a business metric, not a technical metric); (2) 'what does it cost to fix?' (merging services is a 2–4 week project); (3) 'what is the risk of keeping it?' (0.3% failure rate × page loads per day = how many user-facing errors per day?). The developer should frame the answer as a business decision: 'We're generating approximately N dashboard errors per day due to this architecture. Merging would reduce that to near-zero and reduce p99 by ~600ms, at a cost of 3 weeks of engineering time.' Give credit for: connecting technical symptoms to user impact, quantifying the problem, and framing the recommendation as a cost-benefit analysis."

---

### Exercise 028 — The API Rate Limit You Hit

**Type:** CHAT
**Difficulty:** MEDIUM
**Languages:** agnostic
**Duration:** 20 min
**Topics:** `["external APIs", "rate limiting", "resilience", "retry strategy", "exponential backoff", "queuing"]`

**Description:**
Your application sends Slack notifications to users when certain events happen. Yesterday at 3 PM, you hit Slack's API rate limit (1 request/second per channel). For 20 minutes, no notifications were delivered. Some were dropped permanently. The engineering team is asking you to fix this before it happens again.

Walk me through your solution.

**Variation 1: Platform Engineer Designing Resilient Integrations**
- `ownerRole`: "Platform engineer who builds integrations with external APIs and has implemented rate-limit-aware systems at three companies"
- `ownerContext`: "Evaluate the developer's system design for rate limit handling. The fundamental problem: notifications were sent synchronously and directly — no queue, no rate limiting, no retry. Solution: (1) decouple notification sending from the event that triggers it — push to an internal queue (Redis, BullMQ, DB table); (2) process the queue with a worker that enforces 1 req/sec via a token bucket or leaky bucket; (3) on 429 response from Slack, implement exponential backoff with jitter; (4) on permanent failure (after N retries), send to a dead letter queue — not silently dropped. Critical: notifications that were dropped permanently cannot be recovered. The fix prevents future drops, but also needs a retroactive mechanism. Give credit for: queue-based decoupling, rate-aware processing, retry with backoff, and the dead letter queue pattern."

**Variation 2: Senior Developer Explaining Options to the Team**
- `ownerRole`: "Senior developer facilitating a team discussion about the right solution — there are multiple valid options with different complexity"
- `ownerContext`: "Evaluate the developer's ability to present options at different complexity levels. Option A (simple): use Slack's Incoming Webhooks with a 1-second delay between sends — synchronous but rate-compliant; still fails if the sending server crashes. Option B (intermediate): BullMQ/Bull queue with a rate limiter job processor — decoupled, durable, handles backoff automatically. Option C (simple for low volume): batch notifications into a digest (e.g., instead of 50 individual messages, send one 'you have 50 new events' message). The developer should present these options with trade-offs, not just the most sophisticated one. Give credit for: presenting multiple options, matching complexity to the actual problem volume (is 1 req/sec actually a constraint, or is this a spike issue?), and proposing the simplest solution that reliably solves the problem."

---

### Exercise 029 — The Git History Rewrite

**Type:** CHAT
**Difficulty:** EASY
**Languages:** agnostic
**Duration:** 15 min
**Topics:** `["git", "rebase vs merge", "interactive rebase", "force push", "team communication", "shared history"]`

**Description:**
Your feature branch has 47 commits including many "WIP," "fix typo," and "please work" messages. Your tech lead asked you to "clean up the history" before merging to `main`. Another developer is also working on a branch that forked off yours 3 days ago.

How do you approach this?

**Variation 1: Git Expert**
- `ownerRole`: "Senior developer who teaches Git workshops and has strong opinions about the difference between 'clean history for main' and 'clean history for collaboration'"
- `ownerContext`: "Evaluate the developer's Git fluency and their awareness of the team complication. The rebase/squash options: (1) interactive rebase (`git rebase -i main`) to squash the 47 commits into 3–5 logical commits; (2) `git merge --squash` for a single commit on main (loses the intermediate history). The complication: another developer branched off this branch 3 days ago. Rebasing changes the commit SHAs, so after the developer force-pushes the cleaned branch, the other developer's branch will have diverged history. The correct approach: coordinate with the other developer before rebasing — they need to `git rebase <new-base>` after the rebase is done. Force pushing a shared branch without warning is a team-breaking action. Give credit for: the technical squash/rebase approach AND for proactively coordinating with the other developer before the rewrite."

**Variation 2: Team Lead Setting Norms**
- `ownerRole`: "Tech lead who wants to use this as an opportunity to establish a team norm around branch management"
- `ownerContext`: "Evaluate the developer's ability to solve the immediate problem AND propose a preventive process. Immediate: clean the history (interactive rebase, coordinate with the dependent developer). Preventive: why does this happen? Because 'WIP' commits accumulate on long-lived branches. Team norm options: (1) commit to your branch freely, squash before PR — the current approach, but formalized; (2) shorter-lived branches that merge faster; (3) 'draft PR' with explicit 'not for review yet' status, so the team knows not to branch off it. Give credit for: handling the immediate rebase safely, identifying the root cause (long-lived branch with incremental commits), and proposing a team-level norm that prevents the 47-commit pile-up."

---

### Exercise 030 — The Dead Letter Queue Design

**Type:** WHITEBOARD
**Difficulty:** HARD
**Languages:** agnostic
**Duration:** 45 min
**Topics:** `["dead letter queue", "message queues", "async systems", "error handling", "observability", "retry"]`

**Description:**
Your company processes payment events via a message queue. Occasionally, some events fail to process — a payment processor is down, a message is malformed, or there's a transient DB error. Currently, failed messages are silently dropped. Finance has complained that sometimes payments are not reconciled.

Design a Dead Letter Queue (DLQ) system to ensure no messages are permanently lost without visibility.

**Variation 1: Message Queue Systems Engineer**
- `ownerRole`: "Staff systems engineer who has designed event-driven payment pipelines at a payments company processing 5M transactions/day"
- `ownerContext`: "Evaluate the developer's understanding of the DLQ pattern and the failure modes it addresses. A complete design includes: (1) DLQ as a separate queue that receives messages after N failed processing attempts; (2) configurable retry policy (3 attempts with exponential backoff before DLQ); (3) DLQ message retention (at least 14 days — sufficient for manual investigation); (4) alerting: when a message enters the DLQ, alert the on-call team immediately — especially for payment events; (5) reprocessing: an admin interface or script to replay DLQ messages after fixing the root cause; (6) poison message detection: some messages will fail every time (malformed data) — these need a different handling path than transient failures. Give credit for: addressing all 6 elements, distinguishing transient vs. permanent failures, and including observability (count of DLQ messages should be a critical metric)."

**Variation 2: Pragmatic Lead Developer**
- `ownerRole`: "Lead developer at a Series A company who needs a DLQ that is robust enough for payments but doesn't require a dedicated ops team to maintain"
- `ownerContext`: "Evaluate the developer's judgment about operational complexity. A production-grade DLQ with Kafka, Zookeeper, and a custom admin UI may be the right architecture at scale — but for a Series A company with 5 engineers, a simpler approach may work: (1) a `failed_events` DB table with `id`, `payload`, `attempts`, `last_error`, `failed_at`, `status (pending_retry | dead)`; (2) a cron job that retries `pending_retry` events with backoff; (3) after 5 attempts, status → `dead`; (4) a simple admin query to see dead events. Give credit for: proposing the DB-based DLQ as a valid starting point, explaining what it can't do (high-throughput scenarios, multi-service routing), and defining the threshold at which they'd upgrade to a real queue."

---

### Exercise 031 — The Observability Design

**Type:** WHITEBOARD
**Difficulty:** MEDIUM
**Languages:** agnostic
**Duration:** 30 min
**Topics:** `["observability", "metrics", "logging", "distributed tracing", "alerting", "SLOs", "dashboards"]`

**Description:**
You are the first engineer at a small startup to think seriously about observability. The app currently has: `console.log` statements throughout the codebase, no metrics, no alerting, no tracing. Three incidents in the past month were discovered by users, not by the team.

Design an observability system. You have 2 weeks of engineering time to spend. What do you build first?

**Variation 1: Site Reliability Engineer**
- `ownerRole`: "SRE who has built observability from scratch at two startups and knows what matters in week 1 vs. month 3"
- `ownerContext`: "Evaluate the developer's prioritization and understanding of the three pillars of observability. Priority order for a small team: (1) Metrics first — you need to know your error rate, latency (p50/p95/p99), and saturation (CPU/memory/DB connections). Without these, you're flying blind. 1 day: instrument the API with Prometheus or DataDog APM. (2) Alerting on the metrics — error rate >1%, p99 >2s, DB connection pool >80%. 1 day. (3) Structured logging — replace console.log with structured JSON (pino, winston). Correlate with a request ID header. 2 days. (4) Tracing — save for later unless debugging distributed systems. Give credit for: prioritizing metrics+alerting over logging+tracing, explaining WHY (you need to be paged before users tell you), and noting that structured logs with request correlation are more valuable than unstructured logs."

**Variation 2: Engineering Manager Allocating 2 Weeks of Team Time**
- `ownerRole`: "Engineering manager who needs to justify 2 weeks of engineering time to the CEO with the business case for observability"
- `ownerContext`: "Evaluate the developer's ability to frame observability as a business investment. The CEO cares about: (1) 'How many incidents were discovered by users before us?' — each one is a trust damage event; (2) 'What does 1 hour of downtime cost?' — if there's a revenue-per-hour estimate, downtime has a dollar cost; (3) 'How long does it take your team to diagnose a problem?' — without observability, that's 2–4 hours; with good metrics, 15 minutes. The developer should frame the 2 weeks as: Week 1 — metrics + alerting (we stop learning about incidents from users). Week 2 — structured logging (we cut incident diagnosis time from hours to minutes). Give credit for: business impact framing, the specific investment allocation, and quantifying the current cost of flying blind."

---

### Exercise 032 — The Config That Ate Production

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** TypeScript / Node.js
**Duration:** 20 min
**Topics:** `["environment configuration", "secrets management", "config validation", "environment-specific overrides", "twelve-factor app"]`

**Description:**
Your application deploys to three environments: dev, staging, and production. A developer accidentally used the staging database URL in production for 6 hours last Friday, corrupting staging data with production writes.

Looking at the config loading code:

```typescript
// config.ts
const config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost/app_dev'
  },
  api: {
    secret: process.env.API_SECRET || 'dev-secret-not-for-production'
  },
  debug: process.env.DEBUG === 'true' || true
}

export default config
```

What is wrong and how do you fix it?

**Variation 1: DevOps-Focused Senior Engineer**
- `ownerRole`: "Senior engineer who has designed config management systems for multi-environment Node.js applications"
- `ownerContext`: "Evaluate the developer's understanding of the twelve-factor app config principle and fail-fast validation. Problems in order of severity: (1) `process.env.DATABASE_URL || 'postgresql://localhost/app_dev'` — the fallback means if `DATABASE_URL` is undefined in production, the app silently connects to a local dev DB. This is the root cause of the incident. Critical env vars must throw on startup if missing, not fall back to a default. (2) `'dev-secret-not-for-production'` as the API secret fallback — if the env var is missing in production, the app runs with a known, public secret. (3) `debug: process.env.DEBUG === 'true' || true` — `|| true` means debug is always on, regardless of the env var. Fix: validate all required env vars on startup and throw if any are missing. Zod + `z.string().min(1)` on `DATABASE_URL` and `API_SECRET`. Give credit for: identifying all three issues, proposing startup validation, and explaining why 'fail loudly on startup' is safer than silent fallback."

**Variation 2: Security Engineer**
- `ownerRole`: "Application security engineer who treats config validation as a security boundary"
- `ownerContext`: "Evaluate the developer's security-first config thinking. The three issues from a security lens: (1) `dev-secret-not-for-production` as a fallback is a hardcoded credential — this value is in source code and could be in version history, public repos, etc. Any fallback for a secret is wrong; (2) missing `DATABASE_URL` in production silently connects somewhere — the wrong place, in this incident, but in another scenario could mean the production app uses a test DB with different security controls; (3) the debug flag being always `true` means stack traces, verbose errors, and potentially sensitive request/response data is logged in production. Fix: Zod schema for the full config, fail fast on startup, separate `.env.example` with required vars documented. Give credit for: treating hardcoded fallback secrets as a vulnerability, proposing startup validation as the defense, and flagging the debug issue."
