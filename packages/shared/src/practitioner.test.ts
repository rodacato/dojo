import { describe, expect, it } from 'vitest'
import { DEFAULT_PRACTITIONER_LOOK, PRACTITIONER_PIECES, practitionerLookSchema, toPublicPractitioner } from './practitioner'

const withEquip = (equip: Partial<typeof DEFAULT_PRACTITIONER_LOOK.equip>) => ({
  ...DEFAULT_PRACTITIONER_LOOK,
  equip: { ...DEFAULT_PRACTITIONER_LOOK.equip, ...equip },
})

describe('practitionerLookSchema', () => {
  it('accepts the default look and a piece in its own slot', () => {
    expect(practitionerLookSchema.safeParse(DEFAULT_PRACTITIONER_LOOK).success).toBe(true)
    expect(practitionerLookSchema.safeParse(withEquip({ head: 'kasa', neck: 'scarf' })).success).toBe(true)
  })

  it('rejects a piece equipped in a slot it does not fit', () => {
    expect(practitionerLookSchema.safeParse(withEquip({ neck: 'kasa' })).success).toBe(false)
  })

  it('rejects colors outside the palette and unknown pieces', () => {
    expect(practitionerLookSchema.safeParse({ ...DEFAULT_PRACTITIONER_LOOK, skin: '#000000' }).success).toBe(false)
    expect(practitionerLookSchema.safeParse(withEquip({ head: 'black-belt' as never })).success).toBe(false)
  })

  it('has no way to set the belt: rank is not part of the look', () => {
    const parsed = practitionerLookSchema.parse({ ...DEFAULT_PRACTITIONER_LOOK, belt: 'black' })
    expect(parsed).not.toHaveProperty('belt')
  })
})

describe('PRACTITIONER_PIECES', () => {
  it('has unique ids', () => {
    const ids = PRACTITIONER_PIECES.map((piece) => piece.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('toPublicPractitioner', () => {
  it('keeps earned pieces with their date and drops locked ones and all progress', () => {
    const view = toPublicPractitioner({
      look: DEFAULT_PRACTITIONER_LOOK,
      belt: 'green',
      pieces: [
        { id: 'kasa', earnedAt: '2026-10-18T10:00:00.000Z', progress: { current: 3, target: 3 } },
        { id: 'scarf', earnedAt: null, progress: { current: 5, target: 7 } },
      ],
    })

    expect(view).toEqual({
      look: DEFAULT_PRACTITIONER_LOOK,
      belt: 'green',
      earnedPieces: [{ id: 'kasa', earnedAt: '2026-10-18T10:00:00.000Z' }],
    })
  })
})
