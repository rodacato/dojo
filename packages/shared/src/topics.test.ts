import { describe, expect, it } from 'vitest'
import { TOPICS, isTopic, topicCluster, topicClustersFor, topicsInCluster } from './topics'

describe('TOPICS', () => {
  it('is non-empty and has unique slugs, so no topic sits in two clusters', () => {
    expect(TOPICS.length).toBeGreaterThan(0)
    expect(new Set(TOPICS).size).toBe(TOPICS.length)
  })
})

describe('isTopic', () => {
  it('accepts a canonical slug and rejects a free-text one', () => {
    expect(isTopic('window-functions')).toBe(true)
    expect(isTopic('partition-by')).toBe(false)
  })
})

describe('topicCluster', () => {
  it('maps a known topic to its cluster', () => {
    expect(topicCluster('n-plus-one-queries')).toBe('database')
    expect(topicCluster('any-type')).toBe('typescript')
    expect(topicCluster('xss')).toBe('security')
  })
})

describe('topicsInCluster', () => {
  it('lists the slugs of one cluster', () => {
    expect(topicsInCluster('database')).toContain('window-functions')
    expect(topicsInCluster('database')).not.toContain('xss')
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
