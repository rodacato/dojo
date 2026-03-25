import { type SeedExercise, uuidv5 } from './types'

export const processExercises: SeedExercise[] = [
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
          "Evaluate the developer's ability to communicate in business terms. 'Replace deprecated auth library' is not compelling. 'Our authentication library has a known vulnerability with no patch available — if exploited, we face a data breach and regulatory fines' is compelling. 'Fix flaky tests' is not compelling. 'Our test suite randomly fails, causing developers to waste 2 hours per week re-running tests and occasionally merging buggy code because they assumed the failure was a flake' is compelling. Evaluate whether the developer: (1) translates each selected item into business impact (risk, developer time saved, user experience improved); (2) provides a concrete before/after ('dashboard loads in 8 seconds \u2192 1 second after fixing N+1 queries'); (3) commits to a measurable outcome ('after this sprint, flaky test rate drops from 15% to < 1%'); (4) acknowledges what they're NOT fixing and the risk of deferring it. Give credit for: business-oriented communication, measurable commitments, and intellectual honesty about what 3 weeks can and cannot accomplish.",
      },
    ],
  },
]
