import { describe, expect, it } from 'vitest'
import { AVATAR_COLS, AVATAR_ROWS, drawAvatar, shade, type Paint } from './practitioner-art'
import { DEFAULT_PRACTITIONER_LOOK, HAIR_STYLES, PIECE_IDS, findPiece, type PieceId, type PractitionerLook } from './practitioner'
import type { BeltRank } from './types'

interface Rect { x: number; y: number; w: number; h: number; color: string }

function render(look: PractitionerLook, belt: BeltRank = 'white', only?: PieceId): Rect[] {
  const rects: Rect[] = []
  const paint: Paint = (x, y, w, h, color) => rects.push({ x, y, w, h, color })
  drawAvatar(paint, look, belt, { only })
  return rects
}

const wearing = (id: PieceId, look = DEFAULT_PRACTITIONER_LOOK): PractitionerLook => ({
  ...look,
  equip: { ...look.equip, [findPiece(id)!.slot]: id },
})

describe('shade', () => {
  it('darkens and lightens each channel, clamped to a valid hex', () => {
    expect(shade('#808080', -16)).toBe('#707070')
    expect(shade('#808080', 16)).toBe('#909090')
    expect(shade('#050505', -40)).toBe('#000000')
    expect(shade('#fafafa', 40)).toBe('#ffffff')
  })
})

describe('drawAvatar', () => {
  it('keeps every hair style and every piece inside the avatar grid', () => {
    for (const hairStyle of HAIR_STYLES) {
      for (const id of PIECE_IDS) {
        for (const rect of render(wearing(id, { ...DEFAULT_PRACTITIONER_LOOK, hairStyle }))) {
          expect(rect.x).toBeGreaterThanOrEqual(0)
          expect(rect.y).toBeGreaterThanOrEqual(0)
          expect(rect.x + rect.w).toBeLessThanOrEqual(AVATAR_COLS)
          expect(rect.y + rect.h).toBeLessThanOrEqual(AVATAR_ROWS)
        }
      }
    }
  })

  it('gives each hair style its own drawing', () => {
    const drawings = HAIR_STYLES.map((hairStyle) => JSON.stringify(render({ ...DEFAULT_PRACTITIONER_LOOK, hairStyle })))
    expect(new Set(drawings).size).toBe(HAIR_STYLES.length)
  })

  it('draws an equipped piece on top of the body', () => {
    const bare = render(DEFAULT_PRACTITIONER_LOOK)
    const dressed = render(wearing('kasa'))
    expect(dressed.slice(0, bare.length)).toEqual(bare)
    expect(dressed.length).toBeGreaterThan(bare.length)
  })

  it('draws only the piece, without the body, for a silhouette layer', () => {
    for (const id of PIECE_IDS) {
      const layer = render(wearing(id), 'white', id)
      expect(layer.length).toBeGreaterThan(0)
      expect(layer.some((rect) => rect.color === DEFAULT_PRACTITIONER_LOOK.skin)).toBe(false)
    }
  })

  it('colors the belt by rank and knots a black belt in vermilion', () => {
    const colors = (belt: BeltRank) => new Set(render(DEFAULT_PRACTITIONER_LOOK, belt).map((rect) => rect.color))
    expect(colors('yellow').has('#D4A547')).toBe(true)
    expect(colors('white').has('#D4A547')).toBe(false)
    expect(colors('black').has('#b73a2f')).toBe(true)
    expect(colors('brown').has('#b73a2f')).toBe(false)
  })
})
