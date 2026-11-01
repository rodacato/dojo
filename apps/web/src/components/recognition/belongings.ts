import { findPiece, type PieceId, type PractitionerPieceDTO } from '@dojo/shared'

export type BelongingId = 'cushion' | 'lantern' | 'tea' | 'bonsai'

export interface Belonging {
  id: BelongingId
  name: string
  moment: string
  story: string
  art: string
  earnedAt: string
}

const BELONGING_FOR_PIECE: Array<{ pieceId: PieceId; id: BelongingId; name: string; story: string; art: string }> = [
  { pieceId: 'hachimaki', id: 'cushion', name: 'Cushion', story: 'Your first kata left a place to return to.', art: 'cushion' },
  { pieceId: 'kasa', id: 'lantern', name: 'Lantern', story: 'A light for the days you made time for.', art: 'lantern' },
  { pieceId: 'scarf', id: 'tea', name: 'Tea set', story: 'A small pause between the days you showed up.', art: 'teapot' },
  { pieceId: 'happi', id: 'bonsai', name: 'Bonsai', story: 'A record of returning after time away.', art: 'bonsai' },
]

export function belongingsFrom(pieces: PractitionerPieceDTO[]): Belonging[] {
  const earned = new Map(pieces.map((piece) => [piece.id, piece.earnedAt]))
  return BELONGING_FOR_PIECE.flatMap(({ pieceId, ...belonging }) => {
    const earnedAt = earned.get(pieceId)
    if (!earnedAt) return []
    return [{ ...belonging, moment: findPiece(pieceId)?.source ?? '', earnedAt }]
  }).sort((a, b) => a.earnedAt.localeCompare(b.earnedAt))
}

export const artUrl = (name: string) => `/art/belts/${name}.webp`
