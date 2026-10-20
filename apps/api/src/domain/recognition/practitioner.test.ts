import { describe, expect, it } from 'vitest'
import { earnedPieceIds, pieceProgress, practiceFacts } from './practitioner'

const at = (iso: string) => ({ startedAt: new Date(iso) })

describe('practiceFacts', () => {
  it('counts distinct UTC dates, not sessions', () => {
    const facts = practiceFacts([at('2026-03-01T08:00:00Z'), at('2026-03-01T22:00:00Z'), at('2026-03-02T09:00:00Z')])
    expect(facts.practiceDays).toBe(2)
  })

  it('measures the longest stretch of days with no practice between two practice days', () => {
    const facts = practiceFacts([at('2026-03-01T08:00:00Z'), at('2026-03-09T08:00:00Z'), at('2026-03-10T08:00:00Z')])
    expect(facts.longestDaysAway).toBe(7)
  })
})

describe('earnedPieceIds', () => {
  it('earns nothing without practice', () => {
    expect(earnedPieceIds([])).toEqual([])
  })

  it('earns the hachimaki on the first practice day', () => {
    expect(earnedPieceIds([at('2026-03-01T08:00:00Z')])).toEqual(['hachimaki'])
  })

  it('earns the kasa at 3 practice days and the scarf at 7, not before', () => {
    const days = (n: number) => Array.from({ length: n }, (_, i) => at(`2026-03-${String(i + 1).padStart(2, '0')}T08:00:00Z`))
    expect(earnedPieceIds(days(2))).not.toContain('kasa')
    expect(earnedPieceIds(days(3))).toContain('kasa')
    expect(earnedPieceIds(days(6))).not.toContain('scarf')
    expect(earnedPieceIds(days(7))).toContain('scarf')
  })

  it('earns the happi only after a week or more away', () => {
    expect(earnedPieceIds([at('2026-03-01T08:00:00Z'), at('2026-03-08T08:00:00Z')])).not.toContain('happi')
    expect(earnedPieceIds([at('2026-03-01T08:00:00Z'), at('2026-03-09T08:00:00Z')])).toContain('happi')
  })

  it('earns season pieces only for kata inside the window, in any year', () => {
    expect(earnedPieceIds([at('2026-10-24T23:59:00Z')])).not.toContain('cempasuchil-crown')
    expect(earnedPieceIds([at('2027-10-25T00:00:00Z')])).toContain('cempasuchil-crown')
    const threeInSeason = [at('2026-10-31T08:00:00Z'), at('2026-11-01T08:00:00Z'), at('2026-11-02T23:00:00Z')]
    expect(earnedPieceIds(threeInSeason)).toContain('calavera')
    expect(earnedPieceIds(threeInSeason.slice(0, 2))).not.toContain('calavera')
  })
})

describe('pieceProgress', () => {
  it('reports progress capped at the target', () => {
    const progress = pieceProgress([at('2026-03-01T08:00:00Z'), at('2026-03-02T08:00:00Z')])
    expect(progress.hachimaki).toEqual({ current: 1, target: 1 })
    expect(progress.kasa).toEqual({ current: 2, target: 3 })
  })
})
