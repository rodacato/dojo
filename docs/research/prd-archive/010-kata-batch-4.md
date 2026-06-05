# PRD-010: Kata Batch 4 — Operations, Frontend, Team Dynamics, Refactoring

> **Status:** draft
> **Date:** 2026-03-21
> **Author:** Claude (Valentina + Soren + Priya guiding quality)

---

## Idea in one sentence

Twelve exercises covering operational concerns, frontend engineering, team dynamics, and refactoring judgment — the day-to-day craft beyond writing new features.

---

## Coverage summary

| # | Title | Type | Difficulty | Duration | Key topics |
|---|---|---|---|---|---|
| 033 | The Timezone Bug | CODE | MEDIUM | 20 min | UTC, timezone handling, date edge cases |
| 034 | The Search That Doesn't Scale | CODE | HARD | 30 min | Full-text search, PostgreSQL, indexes |
| 035 | The Safe Refactor | CODE | EASY | 15 min | Refactoring with tests, boy scout rule |
| 036 | The Async Without Feedback | CODE | MEDIUM | 20 min | UX for async operations, loading states |
| 037 | The CORS Error | CODE | MEDIUM | 20 min | CORS, preflight, origins, security |
| 038 | The Third-Party Script | CODE | HARD | 30 min | Performance, lazy loading, third-party JS |
| 039 | The Feedback You Avoided | CHAT | EASY | 15 min | Giving difficult feedback, peer communication |
| 040 | The Feature You're Pushing Back On | CHAT | MEDIUM | 20 min | Technical pushback on product decisions |
| 041 | The Blameless Postmortem | CHAT | HARD | 30 min | Incident culture, systemic thinking, postmortem |
| 042 | The Legacy Code You Can't Delete | CHAT | MEDIUM | 20 min | Legacy code, strangler fig, incremental migration |
| 043 | The Event Sourcing Decision | WHITEBOARD | HARD | 45 min | Event sourcing vs CRUD, trade-offs, use cases |
| 044 | The Load Balancer Design | WHITEBOARD | MEDIUM | 30 min | Horizontal scaling, health checks, session affinity |

---

## Exercises

---

### Exercise 033 — The Timezone Bug

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** TypeScript
**Duration:** 20 min
**Topics:** `["timezones", "UTC", "date handling", "DST", "JavaScript Date", "Temporal API"]`

**Description:**
Users in Australia are reporting that their activity streak resets one day early. Users in the US see no problem. You have been asked to investigate.

The streak calculation looks like this:

```typescript
function calculateStreak(sessions: Array<{ completedAt: Date }>): number {
  if (sessions.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)  // midnight local time

  const sessionDates = sessions
    .map(s => {
      const d = new Date(s.completedAt)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
    .filter((v, i, a) => a.indexOf(v) === i)  // unique days
    .sort((a, b) => b - a)  // newest first

  for (let i = 0; i < sessionDates.length; i++) {
    const expected = today.getTime() - i * 86400000
    if (sessionDates[i] === expected) streak++
    else break
  }

  return streak
}
```

**Variation 1: Backend Engineer with International User Experience**
- `ownerRole`: "Senior backend engineer who has maintained applications for users across 30+ timezones and has debugged this exact type of issue"
- `ownerContext`: "Evaluate the developer's timezone thinking. The bug: `new Date()` returns server time (likely UTC). `d.setHours(0, 0, 0, 0)` truncates to midnight in the SERVER's timezone, not the user's. For an Australian user (UTC+10), a session at 11 PM their time is stored as 1 PM UTC. When the server truncates to midnight UTC, that session appears to be from the previous day from the user's perspective. Fix: store timezone per user, or compute streaks based on dates in the user's timezone. Best practice: store all timestamps as UTC (correct), but compute 'days' relative to the user's local timezone. `session.completedAt` in UTC + user's `timezone` string → local date string. Give credit for identifying the server timezone assumption as the root cause, proposing per-user timezone storage, and noting that `86400000` (24 hours in ms) is also wrong for DST days (23 or 25 hours)."

**Variation 2: Frontend/Full-Stack Developer**
- `ownerRole`: "Full-stack developer who has learned timezone handling the hard way and advocates for the 'store UTC, display local' pattern"
- `ownerContext`: "Evaluate the developer's understanding of the UTC + display-layer-localization pattern. The server should never assume a timezone — it receives `completedAt` as a UTC timestamp and should compute 'was this on day X?' relative to the user's timezone. The simplest fix without a per-user timezone: compute streaks client-side (the browser knows the local timezone), or accept a timezone header from the client (`X-Timezone: Australia/Sydney`) and use it in the streak calculation. Secondary issue: using `86400000` ms to mean 'one day' is wrong for DST transitions — use a proper date library (`date-fns`, `Temporal`) that understands calendar days. Give credit for: the UTC+local-display pattern, proposing either client-side computation or timezone-header approach, and calling out the DST 86400000 problem."

---

### Exercise 034 — The Search That Doesn't Scale

**Type:** CODE
**Difficulty:** HARD
**Languages:** SQL (PostgreSQL)
**Duration:** 30 min
**Topics:** `["full-text search", "PostgreSQL", "GIN indexes", "tsvector", "LIKE vs full-text", "search relevance"]`

**Description:**
Your product has a search feature that searches exercise titles and descriptions. It works fine for 1,000 exercises. You've been told to make it production-ready for 100,000 exercises.

Current implementation:

```sql
SELECT id, title, description, type, difficulty
FROM exercises
WHERE
  title ILIKE '%' || $1 || '%'
  OR description ILIKE '%' || $1 || '%'
ORDER BY
  CASE WHEN title ILIKE '%' || $1 || '%' THEN 0 ELSE 1 END,
  created_at DESC
LIMIT 20;
```

What's wrong and how would you rewrite it for scale?

**Variation 1: PostgreSQL Full-Text Search Expert**
- `ownerRole`: "PostgreSQL DBA specializing in search implementations who has migrated three products from LIKE-based search to full-text search"
- `ownerContext`: "Evaluate the developer's understanding of PostgreSQL full-text search capabilities. Problems with LIKE: (1) `ILIKE '%term%'` cannot use B-tree indexes — it's a sequential scan on every row; (2) at 100k rows, this is unacceptable; (3) no relevance ranking — title match and description match are treated identically. Solution: `tsvector` + GIN index. Approach: add a `search_vector` computed column of type `tsvector` combining title (weight A) and description (weight B); create a GIN index on it; use `@@ to_tsquery()` for the WHERE clause; use `ts_rank()` for relevance ordering. The computed column can be maintained via trigger or application logic. Give credit for: identifying the sequential scan problem, proposing tsvector+GIN, explaining weighted search (title matches should rank higher), and noting that `to_tsquery()` requires careful input sanitization (special chars break it) — use `plainto_tsquery()` for user input."

**Variation 2: Senior Developer Evaluating Build vs. Buy**
- `ownerRole`: "Senior developer who has to choose between implementing PostgreSQL full-text search vs. adopting a dedicated search service like Elasticsearch or Typesense"
- `ownerContext`: "Evaluate the developer's build vs. buy judgment for search. For 100,000 exercises, PostgreSQL full-text search is entirely sufficient and keeps the stack simple. Elasticsearch/Typesense are appropriate when: (1) you need faceted search, (2) you need typo tolerance, (3) you need to search across multiple data types and indices, (4) you're at millions of documents with complex ranking. For a simple exercises search: (1) PostgreSQL full-text is sufficient; (2) tsvector+GIN is fast and maintainable; (3) no new operational dependency. The developer should propose the PostgreSQL-native solution with a clear threshold for when to revisit ('if we add user-generated content and need typo tolerance, then Typesense'). Give credit for: choosing the simpler solution for the stated scale, explaining the tsvector implementation, and providing a clear criterion for when to upgrade."

---

### Exercise 035 — The Safe Refactor

**Type:** CODE
**Difficulty:** EASY
**Languages:** TypeScript
**Duration:** 15 min
**Topics:** `["refactoring", "test coverage", "boy scout rule", "small steps", "risk management"]`

**Description:**
You are adding a new feature to this module and notice the code around it is messy. You want to clean it up. Your team has a rule: "leave the campsite cleaner than you found it."

```typescript
function calc(d: any[], t: string) {
  var r = []
  for(var i=0;i<d.length;i++) {
    if(d[i].status == t) {
      r.push({id: d[i].id, val: d[i].value * 1.2})
    }
  }
  return r
}
```

How do you approach this refactor? What are the risks?

**Variation 1: Senior Engineer with Refactoring Philosophy**
- `ownerRole`: "Senior engineer who has written extensively about the difference between safe refactoring and 'brave refactoring' that breaks things"
- `ownerContext`: "Evaluate the developer's refactoring discipline. The rule: refactoring must not change behavior. The risks here: (1) the function has `any[]` types — you don't know what `d` and `t` really are without checking all call sites; (2) `val: d[i].value * 1.2` — the 1.2 multiplier is a magic number; is that intentional? What is it? Don't refactor what you don't understand; (3) if there are no tests, write a test BEFORE refactoring so you can verify the refactor doesn't change behavior. Safe refactor sequence: (1) check call sites to understand the types; (2) write a test that documents current behavior; (3) add types; (4) rename to be readable; (5) replace `var` with `const/let`; (6) run tests. Give credit for: proposing tests before refactoring, explaining the 'understand first, refactor second' principle, and asking about the 1.2 magic number before removing it."

**Variation 2: Code Review Approver**
- `ownerRole`: "Staff engineer reviewing a PR that includes both the new feature and a refactor of surrounding code"
- `ownerContext`: "Evaluate whether the developer separates concerns in the PR. The scout rule is right — but the safest refactor is one that is in a separate commit or PR from the feature. Mixing a refactor and a feature in one commit makes it harder to bisect if something breaks: 'did the feature cause this bug, or the refactor?' The developer should: (1) open the PR with the refactor as a separate commit (or separate PR if the team has capacity for two reviews); (2) ensure tests exist before the refactor commit; (3) ensure the refactor commit passes CI on its own. Give credit for: proposing the separation of refactor vs. feature, understanding why mixing them creates debugging risk, and confirming the tests exist as a precondition for the refactor."

---

### Exercise 036 — The Async Without Feedback

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** TypeScript (React)
**Duration:** 20 min
**Topics:** `["UX for async operations", "loading states", "optimistic updates", "error handling", "React"]`

**Description:**
Users are double-clicking the "Submit" button and creating duplicate submissions. Some users think the app is broken when it takes 2 seconds to respond. You are asked to fix the submit button behavior.

```typescript
function SubmitButton({ onSubmit }: { onSubmit: () => Promise<void> }) {
  return (
    <button onClick={onSubmit}>
      Submit
    </button>
  )
}
```

Fix this component. What else should you consider beyond the button?

**Variation 1: Frontend UX Engineer**
- `ownerRole`: "Frontend engineer specializing in UX for async operations who has designed form submission patterns for enterprise applications"
- `ownerContext`: "Evaluate the developer's async UX thinking. The button fix is the minimum: (1) disabled state during submission to prevent double-clicks; (2) loading indicator (spinner or text change) so the user knows something is happening; (3) re-enable on error so the user can retry. But the developer should also think beyond the button: (4) network timeout — if the submission takes >10 seconds, should the button stay disabled? Show a 'taking longer than expected...' message; (5) accidental navigation — if the user navigates away during submission, warn them; (6) error display — where do errors surface? A toast? An error message near the button? Inline? Give credit for: correct button state management, loading indicator, error handling, and raising at least one 'beyond the button' concern."

**Variation 2: Pragmatic Senior Developer**
- `ownerRole`: "Senior developer who has seen over-engineered loading states and under-engineered ones and has opinions about when optimistic updates are worth it"
- `ownerContext`: "Evaluate the developer's judgment about complexity vs. value. The simplest correct fix: `useState(false)` for `isLoading`, disable + show 'Submitting...' during the promise, re-enable on resolution. That's it — no optimistic updates, no complex state machine. An over-engineered version uses `useReducer` with a loading/success/error state machine for a 2-second submission. Give credit for: the simple and correct implementation, knowing when NOT to use optimistic updates (mutation operations like form submission are bad candidates — partial success is worse than no feedback), and testing the fix for the actual bug (double-click prevention: can you double-click within the same event loop tick despite the `disabled` attribute? Hint: yes, if the state update is async — debounce or use `useRef` to prevent concurrent submissions)."

---

### Exercise 037 — The CORS Error

**Type:** CODE
**Difficulty:** MEDIUM
**Languages:** TypeScript (Node.js / Hono)
**Duration:** 20 min
**Topics:** `["CORS", "preflight requests", "origins", "credentials", "security headers", "browser security model"]`

**Description:**
Your React frontend (`http://localhost:5173`) is calling your API (`http://localhost:3001`). You are seeing this error in the browser console:

```
Access to fetch at 'http://localhost:3001/api/sessions' from origin 'http://localhost:5173'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the targeted resource.
```

You add this to your Hono app:

```typescript
app.use('*', cors())
```

The GET requests work. But your POST requests with credentials still fail with:

```
The value of the 'Access-Control-Allow-Credentials' header in the response is ''
which must be 'true' when the request's credentials mode is 'include'.
```

Fix it correctly.

**Variation 1: Web Security Engineer**
- `ownerRole`: "Web security engineer who has reviewed CORS configurations at 15+ companies and has found both under-configured and dangerously over-configured CORS headers"
- `ownerContext`: "Evaluate the developer's CORS understanding — both technical correctness and security implications. The problem: `cors()` without options sets `Access-Control-Allow-Origin: *`, which doesn't work with `credentials: 'include'` (cookies). The browser requires a specific origin when credentials are involved, not wildcard. Correct fix: `cors({ origin: 'http://localhost:5173', credentials: true })`. Security concern: in production, the allowed origin must be the exact production URL, not `*`. A wildcard CORS + credentials configuration would be a critical security issue (any website could make authenticated requests to your API). Give credit for: the correct fix, explaining WHY wildcard doesn't work with credentials, and specifying the production concern (env-var the allowed origin)."

**Variation 2: Full-Stack Developer Who Hits CORS Regularly**
- `ownerRole`: "Full-stack developer who treats CORS as a configuration checklist, not a security concern, and has been burned by that approach"
- `ownerContext`: "Evaluate the developer's practical understanding of CORS and their willingness to understand it, not just cargo-cult a fix. The developer should explain: (1) why CORS exists (same-origin policy protects users from malicious scripts making requests to APIs on their behalf); (2) the two-step preflight (OPTIONS request first, then the actual request); (3) why credentials + wildcard don't mix; (4) the correct Hono CORS config. Give credit for understanding the security model, not just copying the correct option. Ask a follow-up if they fix it without explaining the credentials + wildcard incompatibility. Bonus credit if they raise: 'In production, this origin string must come from an environment variable — hardcoding `localhost` would break production.'"

---

### Exercise 038 — The Third-Party Script

**Type:** CODE
**Difficulty:** HARD
**Languages:** TypeScript (React / browser)
**Duration:** 30 min
**Topics:** `["web performance", "third-party JavaScript", "lazy loading", "Core Web Vitals", "LCP", "CLS", "bundle size"]`

**Description:**
Your marketing team added a customer chat widget (Intercom), a cookie consent banner (OneTrust), and an analytics script (Mixpanel) to the app. Lighthouse now reports:

```
Performance score: 34 (was 91)
Largest Contentful Paint: 8.2s (was 1.1s)
Total Blocking Time: 2,400ms
First Input Delay: 890ms
```

You need to get performance back to acceptable levels without removing the marketing scripts.

**Variation 1: Web Performance Engineer**
- `ownerRole`: "Web performance engineer who has audited Core Web Vitals for 50+ production applications and has specific techniques for third-party script impact"
- `ownerContext`: "Evaluate the developer's knowledge of third-party script mitigation strategies. The LCP regression from 1.1s to 8.2s is catastrophic — almost certainly caused by render-blocking scripts or scripts that trigger layout shifts. Strategies in order of impact: (1) `defer` or `async` attributes on script tags — this alone often eliminates Total Blocking Time; (2) lazy load non-critical scripts — load Intercom only after user interaction, not on page load; (3) use Partytown (Cloudflare Workers-based) to run third-party scripts off the main thread; (4) `<link rel='preconnect'>` to the third-party origins to reduce connection setup latency; (5) move to a tag manager to control when scripts fire. Give credit for: identifying async/defer as the first fix, proposing lazy-loading the chat widget, and understanding which scripts are render-blocking vs. just large."

**Variation 2: Full-Stack Developer Negotiating with Marketing**
- `ownerRole`: "Senior developer who has to deliver the technical fix while managing the relationship with a marketing team that considers these tools non-negotiable"
- `ownerContext`: "Evaluate the developer's ability to solve the technical problem AND navigate the organizational constraint. The developer cannot remove the scripts — but they can negotiate when they load. Frame the conversation as: 'I can get performance back to 85+ without removing any of the tools, but some of them need to load after the main content.' Intercom: defer until after first user interaction (click or scroll). OneTrust: this is the hard one — cookie consent must load early for compliance; discuss with legal whether it can be deferred by 2 seconds. Mixpanel: async, no blocking. Give credit for: the technical fix proposals, the stakeholder framing ('I can keep everything, but let me change when things load'), and identifying OneTrust as the compliance complexity that requires a non-engineering conversation."

---

### Exercise 039 — The Feedback You Avoided

**Type:** CHAT
**Difficulty:** EASY
**Languages:** agnostic
**Duration:** 15 min
**Topics:** `["feedback", "peer communication", "difficult conversations", "psychological safety", "team health"]`

**Description:**
A teammate has been shipping code that consistently lacks error handling. You have silently fixed three of their bugs in the last two weeks. You've mentioned it in passing ("hey you might want to add some error handling here") but nothing has changed. Your tech lead just asked you to review another PR from this person — and it has the same problem again.

What do you say, and to whom?

**Variation 1: Engineering Lead Who Values Direct Communication**
- `ownerRole`: "Engineering lead who has navigated dozens of peer feedback conversations and has strong opinions about the cost of avoiding difficult feedback"
- `ownerContext`: "Evaluate the developer's ability to give direct, constructive peer feedback. The 'passed in passing' approach hasn't worked — the teammate hasn't received the feedback as actionable. What's needed: a private, direct conversation. Elements of good feedback here: (1) specific and behavioral ('in your last four PRs, the error handling has been missing — here are examples'); (2) impact-framed ('this has caused three production bug fixes this month'); (3) not judgmental about the person, only the pattern; (4) collaborative on the solution ('can we talk about what you look for when you're reviewing your own error handling before submitting?'). Give credit for: choosing to have the direct conversation rather than silently fixing, specificity (not 'you often have bugs'), impact framing, and a collaborative close rather than a directive."

**Variation 2: Developer Who Prefers to Escalate to the Tech Lead**
- `ownerRole`: "Tech lead who receives the feedback escalation and needs to coach the developer who escalated"
- `ownerContext`: "Evaluate whether the developer can distinguish between 'appropriate escalation' and 'avoiding a difficult peer conversation.' Appropriate to escalate: safety issues, harassment, repeated behavior after direct feedback, pattern that a peer genuinely can't influence. Not appropriate to escalate first: one-on-one feedback that hasn't been given directly. In this case, the developer has never had a direct conversation with their peer — escalating to the tech lead is avoiding the feedback, not giving it. The tech lead should: (1) affirm the concern as valid; (2) ask 'have you told them directly, specifically?'; (3) coach the developer on how to have the conversation. Give credit for: understanding that escalation without direct feedback is often premature, proposing the direct conversation path, and asking 'what have you said to them directly?'"

---

### Exercise 040 — The Feature You're Pushing Back On

**Type:** CHAT
**Difficulty:** MEDIUM
**Languages:** agnostic
**Duration:** 20 min
**Topics:** `["technical pushback", "product negotiation", "scope management", "alternatives", "communication"]`

**Description:**
Your PM has requested a feature: "I want to show every user a personalized news feed of what other users in the dojo are practicing, updated in real-time." You estimate this is 6 weeks of engineering work. The current sprint has 2 weeks left. The PM says: "It's important. Can we ship it this sprint?"

How do you respond?

**Variation 1: Senior Engineer Who Owns the Technical Roadmap**
- `ownerRole`: "Senior engineer with strong opinions about how to say no without saying no — proposing alternatives, not blocking"
- `ownerContext`: "Evaluate the developer's ability to push back with alternatives, not just resistance. A technically honest pushback: 'The real-time feed as you described it is 6 weeks — it needs a WebSocket infrastructure for the live updates, a feed personalization algorithm, and significant DB changes. But let me ask: what job does this feature do? If it's about community feeling and showing active users — I can ship a static version of the last 10 completed kata in 3 days. It's not personalized and not real-time, but it shows the dojo is alive. Is that valuable enough to ship this sprint?' Give credit for: estimating honestly without inflating to avoid work, proposing a concrete smaller alternative, asking about the underlying need ('what job does this do?') rather than the specific feature, and offering a path to the full feature in a later sprint."

**Variation 2: Tech Lead Coaching a Junior Developer**
- `ownerRole`: "Tech lead who sees a junior developer about to commit to the full feature without pushing back"
- `ownerContext`: "Evaluate whether the developer understands that saying 'yes' to everything is not professional — it's a failure mode. The PM is asking a question that has a technical answer ('can we ship it this sprint?'). The honest answer is 'no, not the feature as described.' A developer who says yes and delivers something broken or incomplete in 2 weeks has done more damage than one who said 'here's what I can deliver in 2 weeks, and here's what the full version needs.' The coaching moment: it's not your job to make the PM happy by saying yes — it's your job to give the PM accurate information so they can make a good product decision. Give credit for: distinguishing 'the PM wants a yes' from 'the PM needs accurate information,' proposing the smaller alternative as a valid sprint deliverable, and offering a timeline for the full feature."

---

### Exercise 041 — The Blameless Postmortem

**Type:** CHAT
**Difficulty:** HARD
**Languages:** agnostic
**Duration:** 30 min
**Topics:** `["incident postmortem", "blameless culture", "systemic thinking", "root cause analysis", "5 whys", "action items"]`

**Description:**
Last week, a production deploy deleted 2,400 user records due to a migration script bug. The data was recovered from backup (3 hours of data loss for some users). The developer who wrote the script has apologized three times and is visibly anxious.

You are leading the postmortem. How do you run it?

**Variation 1: Site Reliability Engineer Who Runs Postmortems**
- `ownerRole`: "Staff SRE who has run 200+ postmortems and has strong opinions about the difference between a useful postmortem and a blame session"
- `ownerContext`: "Evaluate the developer's understanding of blameless postmortem principles. Key practices: (1) start by explicitly naming the rule: 'This postmortem is about the system, not the person. The goal is to prevent this from happening again.'; (2) focus on the timeline — what happened, in what order, at what times; (3) use the 5 Whys to find systemic causes, not individual mistakes ('Why was the migration script not caught? → No code review required for migration scripts. Why? → No policy. Why? → Never had a serious incident from a migration before.'); (4) action items must be concrete and assigned, not 'be more careful'; (5) end with what worked — backup recovery worked in 3 hours, that's worth acknowledging. Give credit for: the explicit blameless framing, timeline focus, systemic 5 Whys, and concrete action items (e.g., 'migration scripts require peer review before deploy')."

**Variation 2: Engineering Manager Handling the Human Dimension**
- `ownerRole`: "Engineering manager who has seen developers leave companies after being publicly blamed in postmortems"
- `ownerContext`: "Evaluate the developer's awareness of the human dimension alongside the technical. The developer who wrote the script is already distressed. A blameless postmortem is not just a technical process — it's a trust signal to the whole team: 'If you make a mistake here, you will not be publicly destroyed.' Elements: (1) check in privately with the developer before the meeting: 'This postmortem is not about you. I want you in the room so you can share the timeline, but I will steer any blame'; (2) in the room, redirect blame language ('developer X made a mistake' → 'the migration script had a bug that our process didn't catch'); (3) end by acknowledging the developer explicitly: 'The recovery worked because [name] moved fast and got the backup restore running.' Give credit for: private check-in before the meeting, active redirection during, and a closing acknowledgment that rebuilds confidence."

---

### Exercise 042 — The Legacy Code You Can't Delete

**Type:** CHAT
**Difficulty:** MEDIUM
**Languages:** agnostic
**Duration:** 20 min
**Topics:** `["legacy code", "strangler fig pattern", "incremental migration", "technical debt", "risk management"]`

**Description:**
Your team maintains a 10-year-old payments module written in a framework nobody on the team knows anymore (legacy PHP). It processes $1M/day. Nobody is willing to touch it. When it breaks, only one contractor (who charges $300/hour) can fix it. The CTO says: "We need to modernize this, but we can't break payments."

How do you approach this?

**Variation 1: Senior Engineer Who Has Done Legacy Migrations**
- `ownerRole`: "Staff engineer who has led three legacy system migrations and has a strong bias toward the strangler fig pattern over big-bang rewrites"
- `ownerContext`: "Evaluate the developer's migration strategy. The strangler fig pattern: (1) build the new system alongside the old, not instead of it; (2) route traffic to the new system incrementally — start with 1% of payment types, not all of them; (3) the old system continues to process payments until the new system has proven reliability at each increment; (4) never break the old system to force adoption of the new one. Key concerns: (1) characterization tests — before touching anything, write tests that document the current behavior of the legacy system (even if they're ugly); (2) parity — the new system must produce identical results for identical inputs, verifiable in parallel before cutover; (3) the contractor is a risk concentration — document everything they know before starting the migration. Give credit for: strangler fig recommendation, characterization tests as first step, parallel verification before cutover, and addressing the contractor knowledge risk."

**Variation 2: CTO Making the Investment Decision**
- `ownerRole`: "CTO who has heard 'we need to rewrite this' from three different teams over 5 years and has watched two failed rewrites cost more than the original system"
- `ownerContext`: "Evaluate the developer's ability to make the business case for migration while being honest about risk. The CTO's concern: 'rewrites fail.' The developer needs to address: (1) what's the current operational cost? ($300/hr contractor × how many incidents per month = what annual cost?); (2) what's the migration risk? (big-bang rewrite vs. strangler fig have very different risk profiles); (3) what's the non-migration risk? (the contractor may retire, the framework may have security vulnerabilities, the expertise concentration is a bus factor); (4) propose a proof-of-concept: migrate one low-risk payment type as a test run. Give credit for: the business case framing (current cost + risk), recommending strangler fig explicitly, proposing a bounded PoC, and being honest about the timeline ('this is a 12-month project, not a sprint')."

---

### Exercise 043 — The Event Sourcing Decision

**Type:** WHITEBOARD
**Difficulty:** HARD
**Languages:** agnostic
**Duration:** 45 min
**Topics:** `["event sourcing", "CQRS", "CRUD", "event-driven architecture", "trade-offs", "audit log", "projections"]`

**Description:**
Your team is designing a financial ledger system for a fintech company. A new engineer on the team has proposed using Event Sourcing instead of a traditional CRUD database. Two other engineers are skeptical. You are facilitating the architectural discussion.

Design both approaches and make a recommendation.

**Variation 1: Distributed Systems Architect**
- `ownerRole`: "Staff distributed systems architect who has implemented both CRUD and Event Sourcing in production financial systems and has clear opinions about when each is justified"
- `ownerContext`: "Evaluate the developer's understanding of the trade-offs, not just Event Sourcing mechanics. Event Sourcing is appropriate for financial ledgers because: (1) a ledger is inherently append-only — you don't update a balance, you add a debit or credit event; (2) audit requirements demand a full history of every change; (3) the current balance is a projection of all events. But the costs are real: (1) queries against the current state require reading all events and applying them (or maintaining a snapshot); (2) the mental model for developers is significantly more complex; (3) schema evolution for events is hard ('how do you migrate events that were written under the old schema?'). Recommendation: Event Sourcing is justified for THIS use case (financial ledger) but not as a default architecture. Give credit for: presenting both approaches accurately, identifying the financial ledger as a genuine use case, and calling out the projection complexity and schema evolution problem."

**Variation 2: CTO Evaluating the Proposal**
- `ownerRole`: "CTO at a fintech Series B who has seen Event Sourcing proposed as the solution to every problem by a few vocal advocates"
- `ownerContext`: "Evaluate the developer's ability to make a context-specific recommendation rather than advocating a pattern. The CTO's concern: 'is this the right tool or the new shiny thing?' The developer should address: (1) does the team understand Event Sourcing deeply enough to maintain it? (event replay, projections, snapshot strategies, schema evolution); (2) are there simpler alternatives that meet the requirements? (a CRUD ledger with an `account_transactions` table and a trigger that prevents UPDATE/DELETE is 80% of the benefit with 10% of the complexity); (3) if recommending Event Sourcing, what is the team's plan for the learning curve? Give credit for: making a recommendation that accounts for team capability, presenting the simpler CRUD alternative, and being honest about the complexity cost vs. the benefit in this specific context."

---

### Exercise 044 — The Load Balancer Design

**Type:** WHITEBOARD
**Difficulty:** MEDIUM
**Languages:** agnostic
**Duration:** 30 min
**Topics:** `["load balancing", "horizontal scaling", "health checks", "session affinity", "WebSockets", "deployment"]`

**Description:**
Your API currently runs on a single server. You need to scale it to 3 servers behind a load balancer. You have two concerns: (1) your app uses server-side sessions stored in memory; (2) your app has WebSocket connections that must persist to the same server.

Design the load balanced architecture.

**Variation 1: Infrastructure Engineer**
- `ownerRole`: "Senior infrastructure engineer who has designed load balanced deployments for stateful web applications at multiple companies"
- `ownerContext`: "Evaluate the developer's understanding of the statefulness problems in load balancing. Two classic problems: (1) In-memory sessions — in a round-robin load balancer, a user's requests hit different servers; if sessions are in memory, server 2 doesn't have the session created on server 1. Solutions: session affinity (sticky sessions — always route a user to the same server, fragile) or externalize sessions (Redis — the correct solution); (2) WebSocket connections — a WebSocket upgrade creates a persistent connection to one server. If the load balancer routes HTTP requests for the same user to a different server, the WebSocket and HTTP handlers will be on different servers, breaking state. Solutions: IP hash routing for WebSocket upgrades, or a dedicated WebSocket tier. Give credit for: identifying both problems, recommending Redis for session storage, and proposing a routing strategy for WebSocket connections."

**Variation 2: Developer Planning Their First Horizontal Scale**
- `ownerRole`: "Senior developer who has never deployed a load balanced application before and is making every classic mistake in the planning phase"
- `ownerContext`: "Evaluate the developer's ability to anticipate the stateful application problems before they hit production. The most common mistake: 'just put a load balancer in front of it.' A developer who does this without addressing sessions and WebSockets will discover the problems under user traffic, not in testing. Key issues to identify in design: (1) sessions: 'our sessions are in memory — each server has its own memory, so a request on server 2 doesn't see the session from server 1'; (2) WebSockets: 'a WebSocket connection is long-lived to one server — if we need cross-server state, we need a shared pub/sub (Redis)'; (3) the database is already external, so that's not an issue. Give credit for: identifying both stateful problems in advance, proposing the Redis session store, and understanding that WebSocket routing requires either sticky sessions or a shared message bus."
