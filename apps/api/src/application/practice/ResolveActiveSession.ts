import type { KataRepositoryPort } from '../../domain/content/ports'
import type { SessionRepositoryPort } from '../../domain/practice/ports'
import type { SessionId, UserId } from '../../domain/shared/types'

interface Deps {
  kataRepo: KataRepositoryPort
  sessionRepo: SessionRepositoryPort
}

export class ResolveActiveSession {
  constructor(private readonly deps: Deps) {}

  async execute(userId: UserId): Promise<SessionId | null> {
    const session = await this.deps.sessionRepo.findActiveByUserId(userId)
    if (!session) return null

    const kata = await this.deps.kataRepo.findById(session.kataId)
    if (!kata || !session.isExpired(kata.durationMinutes)) return session.id

    session.expire()
    await this.deps.sessionRepo.save(session)
    return null
  }
}
