/**
 * Calibration fixture for the sensei prompt rename (Sprint 023 Day 6).
 *
 * Ten kata covering a representative spread of difficulty + category. Each
 * carries a `userResponse` chosen to be ambiguous enough that the verdict
 * could plausibly land in any of the three buckets — so the comparison
 * surfaces drift in the evaluator's judgment, not in the obviousness of the
 * input.
 *
 * Adding cases: keep total characters bounded — the calibration costs real
 * tokens. 5–15 sentence userResponse is the right size.
 */

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface CalibrationCase {
  id: string
  difficulty: Difficulty
  category: string
  ownerRole: string
  ownerContext: string
  kataTitle: string
  kataDescription: string
  userResponse: string
}

export const CALIBRATION_CASES: CalibrationCase[] = [
  // ── easy ────────────────────────────────────────────────────────────
  {
    id: 'easy-1-null-handling',
    difficulty: 'easy',
    category: 'backend',
    ownerRole: 'a senior backend engineer who has chased one too many null-pointer incidents in production',
    ownerContext:
      'You care about boundary discipline: what enters the function, what leaves it, and what happens when the input contradicts the type signature.',
    kataTitle: 'Defensive boundary on a user-lookup function',
    kataDescription:
      'A function `getUserName(id: string): string` is expected to return the user\'s display name. The DB returns `null` for the row when the id does not exist. Today the function calls `row.name` and crashes. Rewrite the function and explain how callers should handle the not-found case.',
    userResponse:
      'I added a check: `if (!row) return "Unknown user"`. That way it never crashes. The caller does not need to handle anything special, the string is always valid.',
  },
  {
    id: 'easy-2-sql-join',
    difficulty: 'easy',
    category: 'database',
    ownerRole: 'a database-leaning engineer who reads EXPLAIN before they read code',
    ownerContext:
      'You evaluate by what the query actually does at scale — index usage, row counts, and whether the join shape matches the data.',
    kataTitle: 'Fetch posts with their author username in one query',
    kataDescription:
      'Given `posts(id, author_id, title)` and `users(id, username)`, fetch each post\'s title and author username. The current code does N+1 by issuing one users query per post. Rewrite as a single SQL.',
    userResponse:
      'SELECT posts.title, users.username FROM posts JOIN users ON posts.author_id = users.id. One query. Indexes on posts.author_id and users.id keep it fast.',
  },
  {
    id: 'easy-3-api-status',
    difficulty: 'easy',
    category: 'api-design',
    ownerRole: 'a senior engineer who has had to apologize for breaking changes more times than they\'d like',
    ownerContext:
      'You care about HTTP semantics — the right status code for the right situation, never reusing one to "make the client work".',
    kataTitle: 'Status code for a validation failure',
    kataDescription:
      'A POST /users endpoint receives a payload with a missing email. What status code do you return, and why? Then describe the response body.',
    userResponse:
      '400 Bad Request — the client sent something the server cannot process due to a missing required field. Body should be `{ "error": "email is required" }` plus a field-level errors array for clients that want to highlight per-field.',
  },

  // ── medium ──────────────────────────────────────────────────────────
  {
    id: 'medium-1-error-handling',
    difficulty: 'medium',
    category: 'reliability',
    ownerRole: 'a senior engineer who has been on-call enough to distrust generic try/catch blocks',
    ownerContext:
      'You evaluate error handling by what observability the system retains: can the caller distinguish failure modes, can a human in an incident find the cause?',
    kataTitle: 'Refactor a generic catch in a payment-charge handler',
    kataDescription:
      'A function calls `stripe.charges.create(...)` and wraps it in `try { ... } catch (e) { return null }`. The caller treats null as "card declined". Identify what is wrong and propose a fix.',
    userResponse:
      'I would split the error into typed branches: a Stripe API error with a code (card_declined vs network failure vs invalid_request), and let the caller decide. Return a result type instead of null — the caller can\'t today distinguish "the network ate it" from "the user\'s card was declined".',
  },
  {
    id: 'medium-2-race-condition',
    difficulty: 'medium',
    category: 'reliability',
    ownerRole: 'a senior engineer who has debugged enough check-then-act bugs to spot them at a glance',
    ownerContext:
      'You evaluate concurrent code by the invariant: what could happen if two requests interleave at the worst possible moment?',
    kataTitle: 'Identify the race in a username-reservation flow',
    kataDescription:
      'Code: `const taken = await db.users.exists({ username }); if (taken) return error("taken"); await db.users.create({ username, ... })`. What can go wrong? How would you fix it?',
    userResponse:
      'Between the `exists` check and the `create`, two requests with the same username can both pass the check and both attempt to create — only one wins (assuming a unique constraint). I would either (a) drop the pre-check entirely and rely on the DB unique constraint, catching the conflict, or (b) wrap in a SERIALIZABLE transaction. The pre-check is a TOCTOU.',
  },
  {
    id: 'medium-3-refactor-decision',
    difficulty: 'medium',
    category: 'architecture',
    ownerRole: 'a senior engineer who has been burned by premature abstraction',
    ownerContext:
      'You evaluate refactor proposals against the rule: "three similar uses before extraction." You reject patterns that anticipate.',
    kataTitle: 'Should we extract a shared validation module?',
    kataDescription:
      'Two endpoints both validate phone numbers using the same 12 lines of code. A teammate proposes extracting a `PhoneValidator` class. Do you accept, defer, or reject — and why?',
    userResponse:
      'I would defer. Two call sites is not enough to drive an abstraction — the cost of the wrong abstraction is higher than the cost of two duplicates. If a third use case appears with the same shape, I extract then. I would name the duplication in the PR description so the team is aware.',
  },
  {
    id: 'medium-4-api-versioning',
    difficulty: 'medium',
    category: 'api-design',
    ownerRole: 'a senior engineer who has had to coordinate a breaking change across three client teams',
    ownerContext:
      'You evaluate API change proposals by the impact on consumers — communication burden, deprecation window, rollback path.',
    kataTitle: 'Rename a field in a public API response',
    kataDescription:
      'We have a public `/v1/users/:id` endpoint that returns `{ "name": "..." }`. Product wants to rename `name` to `displayName`. How do you ship this?',
    userResponse:
      'Ship a v2 endpoint that returns `displayName` and keep v1 returning `name` unchanged. Announce v1 deprecation with a 6-month sunset window. Add a `Deprecation` header to v1 responses so monitoring catches stragglers. Do not rename in place — that breaks every existing consumer the moment it deploys.',
  },

  // ── hard ────────────────────────────────────────────────────────────
  {
    id: 'hard-1-eventual-consistency',
    difficulty: 'hard',
    category: 'system-design',
    ownerRole: 'a senior distributed-systems engineer who has watched event-driven systems silently lose updates',
    ownerContext:
      'You evaluate distributed designs by what fails when the network partitions, what guarantees survive, and whether ordering matters.',
    kataTitle: 'Design a read-model update from a SessionCompleted event',
    kataDescription:
      'The Practice context publishes a `SessionCompleted` event. The Recognition context needs to update a `user_stats` read model when this event arrives. The systems are eventually consistent. Walk through the failure modes and the at-least-once vs at-most-once tradeoff.',
    userResponse:
      'At-least-once with idempotency: tag each event with a unique id, store the processed-event id in user_stats so a replay is a no-op. The cost is that the read model is briefly stale during the gap. At-most-once risks lost updates if the consumer crashes between receiving and committing — for a stats counter, lost data is worse than briefly-stale data, so at-least-once + idempotency wins. The hard part is making the read-model update + processed-event marker atomic.',
  },
  {
    id: 'hard-2-architecture-tradeoff',
    difficulty: 'hard',
    category: 'architecture',
    ownerRole: 'a senior architect who has had to explain monolith decisions to executives who read about microservices in Forbes',
    ownerContext:
      'You evaluate architecture decisions by team topology, deployment risk, and the actual problem being solved — not the pattern.',
    kataTitle: 'Should our 4-person team split the auth service from the monolith?',
    kataDescription:
      'Team of 4. Current monolith handles auth + users + billing + sessions. The CTO suggests pulling auth out into its own service. Justify a position.',
    userResponse:
      'I would reject. Four people cannot operationally support two services — the cross-cutting concerns (deploy pipelines, monitoring, on-call) double. The monolith is not the bottleneck for a team this size. What problem are we solving? If the answer is "auth feels coupled", solve it with a module boundary inside the monolith first. Revisit when team size or scale forces the split.',
  },
  {
    id: 'hard-3-debugging-under-pressure',
    difficulty: 'hard',
    category: 'debugging',
    ownerRole: 'a senior engineer who has led enough incidents to have a fixed mental model: stabilize, then investigate',
    ownerContext:
      'You evaluate incident response by the order of operations: did they protect customers first, then find the cause?',
    kataTitle: 'Production: every login is failing for 10% of users',
    kataDescription:
      'Symptom: 10% of users seeing a 500 on /auth/login. Started 30 minutes ago after a deploy. Walk through the first 15 minutes of your response.',
    userResponse:
      'First: roll back the deploy. Restore the prior known-good state before debugging. Notify status page. Then: pull error logs from the 30-minute window, look for the common shape of the 10% — same region? Same user attribute? Same code path? Hypothesize the cause from the diff. Do NOT debug forward in prod by deploying speculative fixes. Investigation happens against the rollback baseline.',
  },
]
