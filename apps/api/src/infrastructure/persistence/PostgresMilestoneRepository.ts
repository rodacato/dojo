import { eq } from 'drizzle-orm'
import type { Milestone, MilestoneRepositoryPort } from '../../domain/recognition/milestone'
import type { UserId } from '../../domain/shared/types'
import { UserId as toUserId } from '../../domain/shared/types'
import { userMilestones } from './drizzle/schema'
import type { DB } from './drizzle/client'

export class PostgresMilestoneRepository implements MilestoneRepositoryPort {
  constructor(private readonly db: DB) {}

  async findByUser(userId: UserId): Promise<Milestone[]> {
    const rows = await this.db
      .select({
        slug: userMilestones.milestoneSlug,
        earnedAt: userMilestones.earnedAt,
        sessionId: userMilestones.sessionId,
      })
      .from(userMilestones)
      .where(eq(userMilestones.userId, userId))
      .orderBy(userMilestones.earnedAt)

    return rows.map((row) => ({
      userId: toUserId(userId),
      milestoneId: row.slug,
      earnedAt: row.earnedAt,
      contextRef: row.sessionId,
    }))
  }

  async earnedIds(userId: UserId): Promise<Set<string>> {
    const rows = await this.db
      .select({ slug: userMilestones.milestoneSlug })
      .from(userMilestones)
      .where(eq(userMilestones.userId, userId))
    return new Set(rows.map((r) => r.slug))
  }

  async award(milestone: Milestone): Promise<void> {
    await this.db.insert(userMilestones).values({
      userId: milestone.userId,
      milestoneSlug: milestone.milestoneId,
      sessionId: milestone.contextRef,
    })
  }
}
