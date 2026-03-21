/**
 * Canonical topic slugs.
 *
 * Used in:
 * - Exercise.topics[] (seed data and admin form)
 * - LLM evaluation output (topicsToReview[])
 *
 * Do not change existing slugs — they are stored in the DB and in session history.
 * Add new slugs at the end when introducing exercises that cover new concepts.
 */
export const TOPICS = [
  // Database
  'database',
  'orm',
  'n-plus-one-queries',
  'query-optimization',
  'lazy-loading',
  'eager-loading',
  'postgresql',
  'query-performance',
  'indexes',
  'explain-analyze',
  'join-vs-subquery',
  'null-handling',
  'transaction-isolation',

  // API design
  'api-versioning',
  'backward-compatibility',
  'breaking-changes',
  'consumer-communication',
  'semantic-versioning',
  'rest-api-design',
  'http-status-codes',

  // TypeScript
  'typescript',
  'type-safety',
  'any-type',
  'union-types',
  'type-narrowing',
  'runtime-vs-compile-time',
  'discriminated-unions',

  // Error handling and reliability
  'error-handling',
  'async-await',
  'defensive-programming',
  'promise-rejection',
  'observable-errors',

  // System design
  'system-design',
  'event-driven-architecture',
  'message-queues',
  'trade-offs',
  'scalability',
  'reliability',
  'outbox-pattern',
  'idempotency',
  'dead-letter-queue',

  // Incident response
  'incident-response',
  'debugging-under-pressure',
  'root-cause-analysis',
  'communication',
  'postmortem-thinking',
  'observability',

  // Code quality
  'code-review',
  'readability',
  'refactoring',
  'technical-debt',
  'feature-flags',
  'risk-management',
  'gradual-rollout',
] as const

export type Topic = (typeof TOPICS)[number]
