import { z } from 'zod'
import type { BeltRank } from './types'

export const PIECE_SLOTS = ['head', 'neck', 'outfit', 'face'] as const
export type PieceSlot = (typeof PIECE_SLOTS)[number]

export interface SeasonWindow {
  /** Month-day in UTC, inclusive, recurring every year. */
  from: `${number}-${number}`
  to: `${number}-${number}`
  name: string
}

export interface PractitionerPiece {
  id: string
  slot: PieceSlot
  name: string
  source: string
  condition: string
  season?: SeasonWindow
}

const DIA_DE_MUERTOS: SeasonWindow = { from: '10-25', to: '11-02', name: 'Día de Muertos' }

export const PRACTITIONER_PIECES = [
  { id: 'hachimaki', slot: 'head', name: 'Hachimaki', source: 'First practice', condition: 'Finish your first kata. Any verdict counts.' },
  { id: 'kasa', slot: 'head', name: 'Straw kasa', source: '3 practice days', condition: 'Practice on 3 different days. Any verdict counts.' },
  { id: 'scarf', slot: 'neck', name: 'Red scarf', source: '7 practice days', condition: 'Practice on 7 different days. Any verdict counts.' },
  { id: 'happi', slot: 'outfit', name: 'Happi jacket', source: 'You came back', condition: 'Come back after a week or more away.' },
  { id: 'cempasuchil-crown', slot: 'head', name: 'Cempasúchil crown', source: 'Season · Día de Muertos', condition: 'Finish one kata between 25 Oct and 2 Nov.', season: DIA_DE_MUERTOS },
  { id: 'calavera', slot: 'face', name: 'Calavera paint', source: 'Season · Día de Muertos', condition: 'Finish three kata between 25 Oct and 2 Nov.', season: DIA_DE_MUERTOS },
] as const satisfies readonly PractitionerPiece[]

export type PieceId = (typeof PRACTITIONER_PIECES)[number]['id']

export const PIECE_IDS = PRACTITIONER_PIECES.map((piece) => piece.id) as [PieceId, ...PieceId[]]

export function findPiece(id: string): PractitionerPiece | undefined {
  return PRACTITIONER_PIECES.find((piece) => piece.id === id)
}

export const SKIN_TONES = ['#f1c9a5', '#d9a47c', '#c18b65', '#9a6646', '#6e4530'] as const
export const HAIR_COLORS = ['#1f1b16', '#4a3a30', '#7a5532', '#b07d45', '#c9c2b4', '#b73a2f'] as const
export const HAIR_STYLES = ['short', 'bun', 'long', 'bob', 'buzz'] as const
export const GI_COLORS = ['oat', 'indigo', 'ink', 'moss'] as const

const equippedPiece = z.enum(PIECE_IDS).nullable()

export const practitionerLookSchema = z
  .object({
    skin: z.enum(SKIN_TONES),
    hair: z.enum(HAIR_COLORS),
    hairStyle: z.enum(HAIR_STYLES),
    gi: z.enum(GI_COLORS),
    equip: z.object({ head: equippedPiece, neck: equippedPiece, outfit: equippedPiece, face: equippedPiece }),
  })
  .refine(
    (look) => PIECE_SLOTS.every((slot) => look.equip[slot] === null || findPiece(look.equip[slot])?.slot === slot),
    { message: 'A piece is equipped in a slot it does not fit' },
  )

export type PractitionerLook = z.infer<typeof practitionerLookSchema>

export const DEFAULT_PRACTITIONER_LOOK: PractitionerLook = {
  skin: '#c18b65',
  hair: '#4a3a30',
  hairStyle: 'bun',
  gi: 'oat',
  equip: { head: null, neck: null, outfit: null, face: null },
}

export interface PieceProgress {
  current: number
  target: number
}

export interface PractitionerPieceDTO {
  id: PieceId
  earnedAt: string | null
  progress: PieceProgress
}

export interface PractitionerDTO {
  look: PractitionerLook
  belt: BeltRank
  pieces: PractitionerPieceDTO[]
}

/** What a public profile shows: earned pieces only, never progress toward the rest. */
export interface PublicPractitionerDTO {
  look: PractitionerLook
  belt: BeltRank
  earnedPieces: Array<{ id: PieceId; earnedAt: string }>
}

export function toPublicPractitioner({ look, belt, pieces }: PractitionerDTO): PublicPractitionerDTO {
  return {
    look,
    belt,
    earnedPieces: pieces.flatMap(({ id, earnedAt }) => (earnedAt ? [{ id, earnedAt }] : [])),
  }
}
