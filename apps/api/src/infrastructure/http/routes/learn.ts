import { Hono } from 'hono'
import type { AppEnv } from '../app-env'

export const learnRoutes = new Hono<AppEnv>()

// Public routes — no auth required
learnRoutes.get('/learn/courses', async (c) => {
  // TODO: implement in Sprint 014
  return c.json({ courses: [] })
})
