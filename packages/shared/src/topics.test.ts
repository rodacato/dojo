import { describe, expect, it } from 'vitest'
import { TOPICS, topicCluster, topicClustersFor } from './topics'

describe('TOPICS', () => {
  it('is non-empty and has unique slugs', () => {
    expect(TOPICS.length).toBeGreaterThan(0)
    expect(new Set(TOPICS).size).toBe(TOPICS.length)
  })
})

describe('topicCluster', () => {
  it('maps a known topic to its cluster', () => {
    expect(topicCluster('n-plus-one-queries')).toBe('database')
    expect(topicCluster('any-type')).toBe('typescript')
  })
})

describe('topicClustersFor', () => {
  it('collects clusters and silently skips unknown slugs', () => {
    expect(topicClustersFor(['orm', 'rest-api-design'])).toEqual(
      new Set(['database', 'api-design']),
    )
    expect(topicClustersFor(['__legacy_removed__'])).toEqual(new Set())
  })
})
