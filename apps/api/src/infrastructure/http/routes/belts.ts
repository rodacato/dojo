import { Hono } from 'hono'
import { UserId } from '../../../domain/shared/types'
import { useCases } from '../../container'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../app-env'

export const beltsRoutes = new Hono<AppEnv>()

beltsRoutes.get('/belts', requireAuth, async (c) => {
  const user = c.get('user')
  const userId = UserId(user.id)

  const [belt, milestones] = await Promise.all([
    useCases.calculateBelt.execute(userId),
    useCases.listUserMilestones.execute(userId),
  ])

  return c.json({
    belt,
    milestones: milestones.map((m) => ({
      id: m.milestoneId,
      earnedAt: m.earnedAt.toISOString(),
      contextRef: m.contextRef,
    })),
  })
})
