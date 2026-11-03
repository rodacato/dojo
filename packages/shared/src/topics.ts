// Slugs are stored in kata and session history: add new ones, never rename.
// A topic is a concept more than one kata can practice; its cluster feeds the belt's diversity factor.
const TOPICS_BY_CLUSTER = {
  database: [
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
    'sql-joins',
    'window-functions',
    'common-table-expressions',
    'aggregation',
    'schema-design',
    'database-migrations',
    'transactions',
  ],
  'api-design': [
    'api-versioning',
    'backward-compatibility',
    'breaking-changes',
    'consumer-communication',
    'semantic-versioning',
    'rest-api-design',
    'http-status-codes',
  ],
  typescript: [
    'typescript',
    'type-safety',
    'any-type',
    'union-types',
    'type-narrowing',
    'runtime-vs-compile-time',
    'discriminated-unions',
  ],
  'error-handling': [
    'error-handling',
    'async-await',
    'defensive-programming',
    'promise-rejection',
    'observable-errors',
    'retries',
    'custom-errors',
  ],
  'system-design': [
    'system-design',
    'event-driven-architecture',
    'message-queues',
    'trade-offs',
    'scalability',
    'reliability',
    'outbox-pattern',
    'idempotency',
    'dead-letter-queue',
    'caching',
    'microservices',
    'eventual-consistency',
    'cqrs',
    'rate-limiting',
    'background-jobs',
    'distributed-systems',
  ],
  'incident-response': [
    'incident-response',
    'debugging-under-pressure',
    'root-cause-analysis',
    'communication',
    'postmortem-thinking',
    'observability',
  ],
  'code-quality': [
    'code-review',
    'readability',
    'refactoring',
    'technical-debt',
    'feature-flags',
    'risk-management',
    'gradual-rollout',
    'design-patterns',
    'solid-principles',
    'dependency-injection',
    'domain-modeling',
    'prioritization',
    'engineering-culture',
  ],
  algorithms: [
    'algorithms',
    'time-complexity',
    'data-structures',
    'hash-tables',
    'recursion',
    'graphs',
    'trees',
    'binary-search',
    'off-by-one',
    'parsing',
    'state-machines',
  ],
  concurrency: [
    'concurrency',
    'race-conditions',
    'locking',
    'deadlocks',
    'event-loop',
    'backpressure',
  ],
  security: [
    'security',
    'authentication',
    'authorization',
    'jwt',
    'injection',
    'xss',
    'cors-csrf',
    'input-validation',
    'secrets-management',
    'supply-chain-security',
  ],
  testing: [
    'testing',
    'test-strategy',
    'test-doubles',
    'integration-testing',
  ],
  frontend: [
    'react',
    'state-management',
    'rendering-performance',
    'accessibility',
    'forms',
    'real-time-updates',
  ],
  devops: [
    'ci-cd',
    'deployment-strategies',
    'containers',
    'rollback',
    'zero-downtime',
  ],
  'language-fundamentals': [
    'closures',
    'scoping',
    'equality',
    'mutability',
    'numbers',
    'dates-and-timezones',
  ],
} as const

export type TopicCluster = keyof typeof TOPICS_BY_CLUSTER
export type Topic = (typeof TOPICS_BY_CLUSTER)[TopicCluster][number]

const CLUSTERS = Object.keys(TOPICS_BY_CLUSTER) as TopicCluster[]

export const TOPICS: readonly Topic[] = CLUSTERS.flatMap((cluster) => TOPICS_BY_CLUSTER[cluster])

const TOPIC_TO_CLUSTER = new Map<string, TopicCluster>(
  CLUSTERS.flatMap((cluster) => TOPICS_BY_CLUSTER[cluster].map((topic) => [topic, cluster] as const)),
)

export function isTopic(slug: string): slug is Topic {
  return TOPIC_TO_CLUSTER.has(slug)
}

export function topicCluster(topic: Topic): TopicCluster {
  return TOPIC_TO_CLUSTER.get(topic)!
}

export function topicsInCluster(cluster: TopicCluster): readonly Topic[] {
  return TOPICS_BY_CLUSTER[cluster]
}

// Unknown slugs are skipped: stored history may carry slugs that were never canonical.
export function topicClustersFor(topics: readonly string[]): Set<TopicCluster> {
  const result = new Set<TopicCluster>()
  for (const t of topics) {
    const cluster = TOPIC_TO_CLUSTER.get(t)
    if (cluster) result.add(cluster)
  }
  return result
}
