import { type SeedExercise, uuidv5 } from './types'

export const testingExercises: SeedExercise[] = [
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
POST /api/orders \u2192 OrderController \u2192 OrderService \u2192 [InventoryService, PaymentService, EmailService] \u2192 OrderRepository \u2192 PostgreSQL
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
          "Evaluate the developer's understanding of why unit tests failed here. The unit test for OrderService mocked PaymentService — the mock accepted whatever format OrderService passed. The real PaymentService expects `{ amount_cents: 1000 }` but OrderService sends `{ amount: 10.00 }`. The mock doesn't validate the contract. Integration tests fix this by using real service instances (or at least realistic fakes). Evaluate the proposed integration tests: (1) a test that creates a real order through the API (POST to /api/orders), with a real database, real OrderService \u2192 InventoryService \u2192 PaymentService chain, and only mocking external services (email, payment gateway); (2) contract tests between services (OrderService and PaymentService agree on the interface). For the pyramid ratio: roughly 70% unit / 20% integration / 10% e2e. Evaluate whether the developer understands that the ratio is about speed and cost (unit tests are fast and cheap, e2e tests are slow and expensive), not about value (integration tests often catch more real bugs per test). Give credit for: correctly diagnosing the mock's failure mode, proposing targeted integration tests, and discussing contract testing.",
      },
      {
        ownerRole: 'QA lead who has been arguing for integration tests for 6 months and finally has a production bug to prove the point',
        ownerContext:
          "Evaluate whether the developer can make the case for integration tests convincingly. The argument: unit tests verify that each component works in isolation. Integration tests verify that components work together. The parameter format bug is a BOUNDARY bug — it exists at the interface between two components, exactly where unit tests have a blind spot. Evaluate: (1) does the developer acknowledge that unit tests are still valuable (they catch logic errors within a component)? (2) do they propose a realistic integration test that would have caught this specific bug? (3) do they address the cost concern ('integration tests are slow') with pragmatic solutions (test database with transactions that roll back, parallel test execution, selective integration tests for critical paths)? Give credit for: a balanced view (both unit and integration tests have roles), a concrete integration test example, and proposing that the test suite should have caught this bug without being prohibitively slow.",
      },
    ],
  },
]
