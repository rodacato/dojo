import { eq } from 'drizzle-orm'
import type { DB } from './drizzle/client'
import { stepNudges } from './drizzle/schema'
import type { NudgeFeedback, NudgeRepositoryPort } from '../../domain/learning/ports'

export class PostgresNudgeRepository implements NudgeRepositoryPort {
  constructor(private readonly db: DB) {}

  async create(params: {
    userId: string | null
    stepId: string
    prompt: string
    response: string
  }): Promise<string> {
    const [row] = await this.db
      .insert(stepNudges)
      .values({
        userId: params.userId,
        stepId: params.stepId,
        prompt: params.prompt,
        response: params.response,
      })
      .returning({ id: stepNudges.id })
    if (!row) throw new Error('Failed to insert step nudge')
    return row.id
  }

  async setFeedback(id: string, feedback: NudgeFeedback): Promise<void> {
    await this.db.update(stepNudges).set({ feedback }).where(eq(stepNudges.id, id))
  }
}
