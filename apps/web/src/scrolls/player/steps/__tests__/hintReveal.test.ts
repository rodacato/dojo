import { describe, it, expect } from 'vitest'
import { resolveTieredHints, visibleHintTiers } from '../hintReveal'

describe('resolveTieredHints', () => {
  it('uses the tiered hints when present', () => {
    expect(resolveTieredHints(['a', 'b'], 'legacy')).toEqual(['a', 'b'])
  })

  it('falls back to the legacy single hint when no tiers are authored', () => {
    expect(resolveTieredHints(null, 'legacy')).toEqual(['legacy'])
  })

  it('returns nothing when neither tiers nor a legacy hint exist', () => {
    expect(resolveTieredHints(null, null)).toEqual([])
  })
})

describe('visibleHintTiers', () => {
  it('shows nothing when there are no hints', () => {
    expect(visibleHintTiers([], 5)).toEqual([])
  })

  it('shows only tier 1 before the second failure', () => {
    expect(visibleHintTiers(['t1', 't2'], 0)).toEqual(['t1'])
    expect(visibleHintTiers(['t1', 't2'], 1)).toEqual(['t1'])
  })

  it('unlocks tier 2 from the second failure on', () => {
    expect(visibleHintTiers(['t1', 't2'], 2)).toEqual(['t1', 't2'])
    expect(visibleHintTiers(['t1', 't2'], 9)).toEqual(['t1', 't2'])
  })

  it('never invents a tier 2 the author did not write', () => {
    expect(visibleHintTiers(['only-tier-1'], 5)).toEqual(['only-tier-1'])
  })
})
