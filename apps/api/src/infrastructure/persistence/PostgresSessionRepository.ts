import { and, asc, eq } from 'drizzle-orm'
import { Attempt } from '../../domain/practice/attempt'
import type { CompletedKataHistoryEntry, SessionRepositoryPort } from '../../domain/practice/ports'
import { Session } from '../../domain/practice/session'
import type { EvaluationResult } from '../../domain/practice/values'
import { AttemptId, KataId, SessionId, UserId, VariationId } from '../../domain/shared/types'
import type { DB } from './drizzle/client'
import { attempts, katas, sessions } from './drizzle/schema'

// saveIncompleteAttempt stores raw streamed prose or an {error} object in the same
// column, so only a payload carrying a verdict counts as an evaluation.
function parseEvaluation(raw: string | null): EvaluationResult | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    const isEvaluation = typeof parsed === 'object' && parsed !== null && 'verdict' in parsed
    return isEvaluation ? (parsed as EvaluationResult) : null
  } catch {
    return null
  }
}

export class PostgresSessionRepository implements SessionRepositoryPort {
  constructor(private readonly db: DB) {}

  async save(session: Session): Promise<void> {
    const sessionRow = {
      id: session.id,
      userId: session.userId,
      kataId: session.kataId,
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

  async activate(id: SessionId, body: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ body, status: 'active', startedAt: new Date() })
      .where(eq(sessions.id, id))
  }

  async delete(id: SessionId): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.id, id))
  }

  async saveIncompleteAttempt(params: {
    attemptId: AttemptId
    sessionId: SessionId
    userResponse: string
    llmResponse: string
  }): Promise<void> {
    await this.db
      .insert(attempts)
      .values({
        id: params.attemptId,
        sessionId: params.sessionId,
        userResponse: params.userResponse,
        llmResponse: params.llmResponse,
        isFinalEvaluation: false,
        submittedAt: new Date(),
      })
      .onConflictDoNothing()
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

  async listCompletedKataHistoryForBelt(userId: UserId): Promise<CompletedKataHistoryEntry[]> {
    const rows = await this.db
      .select({
        startedAt: sessions.startedAt,
        topics: katas.topics,
      })
      .from(sessions)
      .innerJoin(katas, eq(sessions.kataId, katas.id))
      .where(and(eq(sessions.userId, userId), eq(sessions.status, 'completed')))
      .orderBy(asc(sessions.startedAt))

    return rows.map((row) => ({
      startedAt: row.startedAt,
      topics: Array.isArray(row.topics) ? (row.topics as string[]) : [],
    }))
  }

  private toSession(
    row: typeof sessions.$inferSelect & { attempts: (typeof attempts.$inferSelect)[] },
  ): Session {
    const domainAttempts = row.attempts.map((a) => {
      const evaluationResult = parseEvaluation(a.llmResponse)
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
      kataId: KataId(row.kataId),
      variationId: VariationId(row.variationId),
      body: row.body,
      status: row.status as Session['status'],
      attempts: domainAttempts,
      startedAt: row.startedAt,
      completedAt: row.completedAt ?? null,
    })
  }
}
