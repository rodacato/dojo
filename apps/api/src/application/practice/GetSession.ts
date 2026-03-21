import type { SessionRepositoryPort } from '../../domain/practice/ports'
import type { Session } from '../../domain/practice/session'
import type { SessionId } from '../../domain/shared/types'

interface Deps {
  sessionRepo: SessionRepositoryPort
}

export class GetSession {
  constructor(private readonly deps: Deps) {}

  async execute(sessionId: SessionId): Promise<Session | null> {
    return this.deps.sessionRepo.findById(sessionId)
  }
}
