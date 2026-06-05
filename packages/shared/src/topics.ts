/**
 * Canonical topic slugs.
 *
 * Used in:
 * - Kata.topics[] (seed data and admin form)
 * - LLM evaluation output (topicsToReview[])
 *
 * Do not change existing slugs — they are stored in the DB and in session history.
 * Add new slugs at the end when introducing kata that cover new concepts.
 *
 * Each topic also belongs to a higher-level cluster used by the belt rubric's
 * diversity factor (see TOPIC_TO_CLUSTER below).
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

/**
 * Higher-level groupings used by the belt rubric's diversity factor.
 * One slug per comment-section header above. Stable identifiers — adding a
 * new cluster requires extending this union and TOPIC_TO_CLUSTER together.
 */
export type TopicCluster =
  | 'database'
  | 'api-design'
  | 'typescript'
  | 'error-handling'
  | 'system-design'
  | 'incident-response'
  | 'code-quality'

const TOPIC_TO_CLUSTER: Record<Topic, TopicCluster> = {
  // Database
  'database': 'database',
  'orm': 'database',
  'n-plus-one-queries': 'database',
  'query-optimization': 'database',
  'lazy-loading': 'database',
  'eager-loading': 'database',
  'postgresql': 'database',
  'query-performance': 'database',
  'indexes': 'database',
  'explain-analyze': 'database',
  'join-vs-subquery': 'database',
  'null-handling': 'database',
  'transaction-isolation': 'database',

  // API design
  'api-versioning': 'api-design',
  'backward-compatibility': 'api-design',
  'breaking-changes': 'api-design',
  'consumer-communication': 'api-design',
  'semantic-versioning': 'api-design',
  'rest-api-design': 'api-design',
  'http-status-codes': 'api-design',

  // TypeScript
  'typescript': 'typescript',
  'type-safety': 'typescript',
  'any-type': 'typescript',
  'union-types': 'typescript',
  'type-narrowing': 'typescript',
  'runtime-vs-compile-time': 'typescript',
  'discriminated-unions': 'typescript',

  // Error handling and reliability
  'error-handling': 'error-handling',
  'async-await': 'error-handling',
  'defensive-programming': 'error-handling',
  'promise-rejection': 'error-handling',
  'observable-errors': 'error-handling',

  // System design
  'system-design': 'system-design',
  'event-driven-architecture': 'system-design',
  'message-queues': 'system-design',
  'trade-offs': 'system-design',
  'scalability': 'system-design',
  'reliability': 'system-design',
  'outbox-pattern': 'system-design',
  'idempotency': 'system-design',
  'dead-letter-queue': 'system-design',

  // Incident response
  'incident-response': 'incident-response',
  'debugging-under-pressure': 'incident-response',
  'root-cause-analysis': 'incident-response',
  'communication': 'incident-response',
  'postmortem-thinking': 'incident-response',
  'observability': 'incident-response',

  // Code quality
  'code-review': 'code-quality',
  'readability': 'code-quality',
  'refactoring': 'code-quality',
  'technical-debt': 'code-quality',
  'feature-flags': 'code-quality',
  'risk-management': 'code-quality',
  'gradual-rollout': 'code-quality',
}

export function topicCluster(topic: Topic): TopicCluster {
  return TOPIC_TO_CLUSTER[topic]
}

export function topicClustersFor(topics: readonly Topic[]): Set<TopicCluster> {
  return new Set(topics.map(topicCluster))
}
