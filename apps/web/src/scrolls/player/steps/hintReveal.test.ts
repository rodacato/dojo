import { describe, expect, it } from 'vitest'
import { resolveTieredHints, visibleHintTiers } from './hintReveal'

describe('resolveTieredHints', () => {
  it('prefers tiered hints when present', () => {
    expect(resolveTieredHints(['a', 'b'], 'legacy')).toEqual(['a', 'b'])
  })

  it('falls back to the legacy single hint when no tiers given', () => {
    expect(resolveTieredHints(null, 'legacy')).toEqual(['legacy'])
  })

  it('returns empty when neither tiered nor legacy hint exists', () => {
    expect(resolveTieredHints(null, null)).toEqual([])
  })

  it('treats an empty tiered array as authoritative, ignoring the legacy hint', () => {
    expect(resolveTieredHints([], 'legacy')).toEqual([])
  })
})

describe('visibleHintTiers', () => {
  it('returns nothing when there are no hints', () => {
    expect(visibleHintTiers([], 0)).toEqual([])
  })

  it('shows only tier 1 below the second failure', () => {
    expect(visibleHintTiers(['t1', 't2'], 0)).toEqual(['t1'])
    expect(visibleHintTiers(['t1', 't2'], 1)).toEqual(['t1'])
  })

  it('unlocks tier 2 at the second failure', () => {
    expect(visibleHintTiers(['t1', 't2'], 2)).toEqual(['t1', 't2'])
  })

  it('never exposes a tier 2 that does not exist even past the threshold', () => {
    expect(visibleHintTiers(['t1'], 5)).toEqual(['t1'])
  })
})
