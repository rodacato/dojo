import { DEFAULT_PRACTITIONER_LOOK, PRACTITIONER_PIECES, type PractitionerDTO } from '@dojo/shared'
import type { SessionRepositoryPort } from '../../domain/practice/ports'
import { computeBeltFromHistory } from '../../domain/recognition/belt'
import { pieceProgress, type PractitionerRepositoryPort } from '../../domain/recognition/practitioner'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  sessionRepo: SessionRepositoryPort
  practitionerRepo: PractitionerRepositoryPort
  now?: () => Date
}

export class GetPractitioner {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId): Promise<PractitionerDTO> {
    const [history, earned, look] = await Promise.all([
      this.deps.sessionRepo.listPracticeHistory(userId),
      this.deps.practitionerRepo.earnedPieces(userId),
      this.deps.practitionerRepo.findLook(userId),
    ])
    const progress = pieceProgress(history)
    const earnedAt = new Map(earned.map((piece) => [piece.pieceId, piece.earnedAt.toISOString()]))

    return {
      look: look ?? DEFAULT_PRACTITIONER_LOOK,
      belt: computeBeltFromHistory(history, this.deps.now?.() ?? new Date()).rank,
      pieces: PRACTITIONER_PIECES.map(({ id }) => ({ id, earnedAt: earnedAt.get(id) ?? null, progress: progress[id] })),
    }
  }
}
