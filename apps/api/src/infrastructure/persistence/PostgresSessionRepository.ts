import { and, eq } from 'drizzle-orm'
import { Attempt } from '../../domain/practice/attempt'
import type { SessionRepositoryPort } from '../../domain/practice/ports'
import { Session } from '../../domain/practice/session'
import type { EvaluationResult } from '../../domain/practice/values'
import { AttemptId, ExerciseId, SessionId, UserId, VariationId } from '../../domain/shared/types'
import type { DB } from './drizzle/client'
import { attempts, sessions } from './drizzle/schema'

export class PostgresSessionRepository implements SessionRepositoryPort {
  constructor(private readonly db: DB) {}

  async save(session: Session): Promise<void> {
    const sessionRow = {
      id: session.id,
      userId: session.userId,
      exerciseId: session.exerciseId,
      variationId: session.variationId,
      body: session.body,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
    }

    await this.db
      .insert(sessions)
      .values(sessionRow)
      .onConflictDoUpdate({
        target: sessions.id,
        set: {
          status: sessionRow.status,
          completedAt: sessionRow.completedAt,
        },
      })

    for (const attempt of session.attempts) {
      const attemptRow = {
        id: attempt.id,
        sessionId: attempt.sessionId,
        userResponse: attempt.userResponse,
        llmResponse: JSON.stringify(attempt.evaluationResult),
        isFinalEvaluation: attempt.isFinalEvaluation,
        submittedAt: attempt.submittedAt,
      }
      await this.db.insert(attempts).values(attemptRow).onConflictDoNothing()
    }
  }

  async findById(id: SessionId): Promise<Session | null> {
    const row = await this.db.query.sessions.findFirst({
      where: eq(sessions.id, id),
      with: { attempts: true },
    })
    if (!row) return null
    return this.toSession(row)
  }

  async findActiveByUserId(userId: UserId): Promise<Session | null> {
    const row = await this.db.query.sessions.findFirst({
      where: and(eq(sessions.userId, userId), eq(sessions.status, 'active')),
      with: { attempts: true },
    })
    if (!row) return null
    return this.toSession(row)
  }

  private toSession(
    row: typeof sessions.$inferSelect & { attempts: (typeof attempts.$inferSelect)[] },
  ): Session {
    const domainAttempts = row.attempts.map((a) => {
      const evaluationResult = a.llmResponse ? (JSON.parse(a.llmResponse) as EvaluationResult) : null
      return new Attempt({
        id: AttemptId(a.id),
        sessionId: SessionId(a.sessionId),
        userResponse: a.userResponse,
        evaluationResult,
        isFinalEvaluation: a.isFinalEvaluation,
        submittedAt: a.submittedAt,
      })
    })

    return new Session({
      id: SessionId(row.id),
      userId: UserId(row.userId),
      exerciseId: ExerciseId(row.exerciseId),
      variationId: VariationId(row.variationId),
      body: row.body,
      status: row.status as Session['status'],
      attempts: domainAttempts,
      startedAt: row.startedAt,
      completedAt: row.completedAt ?? null,
    })
  }
}
