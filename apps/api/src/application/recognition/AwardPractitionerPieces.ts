import type { PieceId } from '@dojo/shared'
import type { SessionRepositoryPort } from '../../domain/practice/ports'
import { earnedPieceIds, type PractitionerRepositoryPort } from '../../domain/recognition/practitioner'
import type { UserId } from '../../domain/shared/types'

interface Deps {
  sessionRepo: SessionRepositoryPort
  practitionerRepo: PractitionerRepositoryPort
}

/** Runs after an evaluation is saved; it reads practice history and never the verdict. */
export class AwardPractitionerPieces {
  constructor(private readonly deps: Deps) {}

  async execute(input: { userId: UserId; sessionId: string }): Promise<PieceId[]> {
    const history = await this.deps.sessionRepo.listPracticeHistory(input.userId)
    return this.deps.practitionerRepo.award(input.userId, earnedPieceIds(history), input.sessionId)
  }
}
