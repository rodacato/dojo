import { Hono } from 'hono'
import type { AppEnv } from '../app-env'
import { executionLimiter } from '../middleware/rateLimiter'

export const learnRoutes = new Hono<AppEnv>()

// Public routes — no auth required

learnRoutes.get('/learn/courses', async (c) => {
  // TODO: implement in Sprint 014
  return c.json({ courses: [] })
})

// Code execution for courses — rate limited per IP (10/min anonymous)
learnRoutes.post('/learn/execute', executionLimiter, async (c) => {
  // TODO: implement in Sprint 014 — runs code via Piston for course steps
  return c.json({ error: 'Not implemented' }, 501)
})
