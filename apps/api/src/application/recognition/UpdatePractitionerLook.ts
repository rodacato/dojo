import { PIECE_SLOTS, type PieceId, type PractitionerLook } from '@dojo/shared'
import type { PractitionerRepositoryPort } from '../../domain/recognition/practitioner'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  practitionerRepo: PractitionerRepositoryPort
}

export type UpdateLookResult = { ok: true } | { ok: false; notEarned: PieceId[] }

export class UpdatePractitionerLook {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId, look: PractitionerLook): Promise<UpdateLookResult> {
    const held = new Set((await this.deps.practitionerRepo.earnedPieces(userId)).map((piece) => piece.pieceId))
    const notEarned = PIECE_SLOTS.map((slot) => look.equip[slot]).filter((id): id is PieceId => id !== null && !held.has(id))
    if (notEarned.length > 0) return { ok: false, notEarned }

    await this.deps.practitionerRepo.saveLook(userId, look)
    return { ok: true }
  }
}
