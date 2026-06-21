import type { BeltRank } from '@dojo/shared'
import { describe, expect, it } from 'vitest'
import { BELT_COLOR } from './belt-colors'

const ALL_RANKS: BeltRank[] = ['white', 'yellow', 'green', 'brown', 'black']

describe('BELT_COLOR', () => {
  it('maps every belt rank to its theme CSS variable reference', () => {
    expect(BELT_COLOR).toEqual({
      white: 'var(--color-belt-white)',
      yellow: 'var(--color-belt-yellow)',
      green: 'var(--color-belt-green)',
      brown: 'var(--color-belt-brown)',
      black: 'var(--color-belt-black)',
    })
  })

  it('exposes exactly the five canonical belt ranks as keys, no extras', () => {
    expect(Object.keys(BELT_COLOR).sort()).toEqual([...ALL_RANKS].sort())
    expect(Object.keys(BELT_COLOR)).toHaveLength(5)
  })

  it.each(ALL_RANKS)(
    'derives the %s entry as var(--color-belt-%s) so the token name tracks the rank',
    (rank) => {
      // Guards against a copy-paste bug where one rank points at the wrong token.
      expect(BELT_COLOR[rank]).toBe(`var(--color-belt-${rank})`)
    },
  )

  it('references CSS custom properties rather than baking in hex values', () => {
    // The theme is the single source of truth (DESIGN.md §Belt rank colors);
    // a literal hex here would mean the map drifted from the @theme block.
    for (const rank of ALL_RANKS) {
      const value = BELT_COLOR[rank]
      expect(value).toMatch(/^var\(--color-belt-[a-z]+\)$/)
      expect(value).not.toMatch(/#[0-9a-fA-F]/)
      expect(value).not.toMatch(/rgb|hsl/)
    }
  })

  it('gives each rank a distinct token reference', () => {
    const values = ALL_RANKS.map((rank) => BELT_COLOR[rank])
    expect(new Set(values).size).toBe(values.length)
  })

  it('returns undefined for a key that is not a belt rank', () => {
    const lookup = BELT_COLOR as Record<string, string | undefined>
    expect(lookup.purple).toBeUndefined()
    expect(lookup['']).toBeUndefined()
  })
})
