import { describe, expect, it } from 'vitest'
import {
  ALL_TICKS,
  ALL_UNDERLINES,
  pickTick,
  pickUnderline,
  type BrushstrokePath,
} from './brushstrokes'

// hashString is internal; these seeds were derived from the same algorithm
// (h = h*31 + charCode, |0, Math.abs) so each maps to a known modulo index.
// 'c' -> hash 99  -> %3 === 0
// 'a' -> hash 97  -> %3 === 1
// 'b' -> hash 98  -> %3 === 2
const SEED_INDEX_0 = 'c'
const SEED_INDEX_1 = 'a'
const SEED_INDEX_2 = 'b'

function isValidPath(p: BrushstrokePath): boolean {
  return (
    typeof p.d === 'string' &&
    p.d.length > 0 &&
    typeof p.viewBox === 'string' &&
    p.viewBox.length > 0 &&
    typeof p.strokeWidth === 'number' &&
    p.strokeWidth > 0
  )
}

describe('exported palettes', () => {
  it('ALL_UNDERLINES exposes exactly 3 well-formed paths', () => {
    expect(ALL_UNDERLINES).toHaveLength(3)
    for (const p of ALL_UNDERLINES) {
      expect(isValidPath(p)).toBe(true)
    }
  })

  it('ALL_TICKS exposes exactly 3 well-formed paths', () => {
    expect(ALL_TICKS).toHaveLength(3)
    for (const p of ALL_TICKS) {
      expect(isValidPath(p)).toBe(true)
    }
  })

  it('underline and tick palettes are distinct sets of paths', () => {
    const underlineDs = ALL_UNDERLINES.map((p) => p.d)
    const tickDs = ALL_TICKS.map((p) => p.d)
    for (const d of underlineDs) {
      expect(tickDs).not.toContain(d)
    }
  })

  it('underline viewBox matches the 200x20 underline canvas', () => {
    for (const p of ALL_UNDERLINES) {
      expect(p.viewBox).toBe('0 0 200 20')
    }
  })

  it('tick viewBox matches the 80x40 tick canvas', () => {
    for (const p of ALL_TICKS) {
      expect(p.viewBox).toBe('0 0 80 40')
    }
  })
})

describe('pickUnderline', () => {
  it('maps a seed to the correct palette index via hash % length', () => {
    expect(pickUnderline(SEED_INDEX_0)).toBe(ALL_UNDERLINES[0])
    expect(pickUnderline(SEED_INDEX_1)).toBe(ALL_UNDERLINES[1])
    expect(pickUnderline(SEED_INDEX_2)).toBe(ALL_UNDERLINES[2])
  })

  it('is deterministic: same seed always yields the same path reference', () => {
    const first = pickUnderline('lesson-42')
    const second = pickUnderline('lesson-42')
    expect(second).toBe(first)
  })

  it('selects all three branches across different seeds (no constant return)', () => {
    const picked = new Set([
      pickUnderline(SEED_INDEX_0),
      pickUnderline(SEED_INDEX_1),
      pickUnderline(SEED_INDEX_2),
    ])
    expect(picked.size).toBe(3)
  })

  it('returns a member of the underline palette, never a tick', () => {
    const result = pickUnderline('anything')
    expect(ALL_UNDERLINES).toContain(result)
    expect(ALL_TICKS).not.toContain(result)
  })

  it('treats the empty seed as hash 0 -> index 0', () => {
    expect(pickUnderline('')).toBe(ALL_UNDERLINES[0])
  })

  it('handles multi-byte unicode seeds deterministically', () => {
    // 'é' (charCode 233) -> hash 233 -> %3 === 2
    expect(pickUnderline('é')).toBe(ALL_UNDERLINES[2])
  })

  it('distinguishes seeds that share an index but differ in hash by mapping consistently', () => {
    // 'a' (97) and 'd' (100) both land on index 1; both must resolve there.
    expect(pickUnderline('a')).toBe(ALL_UNDERLINES[1])
    expect(pickUnderline('d')).toBe(ALL_UNDERLINES[1])
  })

  it('stays in-range for a long seed whose hash exceeds the palette length', () => {
    // long seed hashes to 425284843 -> %3 === 1
    const result = pickUnderline('kata-belt-white-lesson-42-card-id-99887766')
    expect(result).toBe(ALL_UNDERLINES[1])
    expect(ALL_UNDERLINES).toContain(result)
  })
})

describe('pickTick', () => {
  it('maps a seed to the correct palette index via hash % length', () => {
    expect(pickTick(SEED_INDEX_0)).toBe(ALL_TICKS[0])
    expect(pickTick(SEED_INDEX_1)).toBe(ALL_TICKS[1])
    expect(pickTick(SEED_INDEX_2)).toBe(ALL_TICKS[2])
  })

  it('is deterministic: same seed always yields the same path reference', () => {
    const first = pickTick('belt-green')
    const second = pickTick('belt-green')
    expect(second).toBe(first)
  })

  it('selects all three branches across different seeds (no constant return)', () => {
    const picked = new Set([
      pickTick(SEED_INDEX_0),
      pickTick(SEED_INDEX_1),
      pickTick(SEED_INDEX_2),
    ])
    expect(picked.size).toBe(3)
  })

  it('returns a member of the tick palette, never an underline', () => {
    const result = pickTick('anything')
    expect(ALL_TICKS).toContain(result)
    expect(ALL_UNDERLINES).not.toContain(result)
  })

  it('treats the empty seed as hash 0 -> index 0', () => {
    expect(pickTick('')).toBe(ALL_TICKS[0])
  })

  it('handles multi-byte unicode seeds deterministically', () => {
    expect(pickTick('é')).toBe(ALL_TICKS[2])
  })
})

describe('pickUnderline vs pickTick independence', () => {
  it('picks from independent palettes for the same seed', () => {
    const seed = 'shared-seed'
    const underline = pickUnderline(seed)
    const tick = pickTick(seed)
    expect(ALL_UNDERLINES).toContain(underline)
    expect(ALL_TICKS).toContain(tick)
    // same hash index, but different palette objects
    expect(underline).not.toBe(tick)
  })

  it('the same hashed index selects the positionally-matching path in each palette', () => {
    // SEED_INDEX_2 -> index 2 in both palettes
    expect(pickUnderline(SEED_INDEX_2)).toBe(ALL_UNDERLINES[2])
    expect(pickTick(SEED_INDEX_2)).toBe(ALL_TICKS[2])
  })
})
