import { Hono } from 'hono'
import { z } from 'zod'
import { registerScrollSchema, updateScrollSchema } from '@dojo/shared'
import { useCases } from '../../container'
import { requireAuth, requireCreator } from '../middleware/auth'
import type { AppEnv } from '../app-env'
import { toScrollEntryDTO } from './scroll-dto'

export const adminScrollsRoutes = new Hono<AppEnv>()

adminScrollsRoutes.use('*', requireAuth, requireCreator)

const idSchema = z.uuid()

function invalidBody(issues: z.core.$ZodIssue[]) {
  return {
    error: 'Invalid request body',
    issues: issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  }
}

adminScrollsRoutes.get('/', async (c) => {
  const entries = await useCases.listScrolls.all()
  return c.json(entries.map(toScrollEntryDTO))
})

adminScrollsRoutes.post('/', async (c) => {
  const parsed = registerScrollSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json(invalidBody(parsed.error.issues), 400)

  const entry = await useCases.registerScroll.execute(parsed.data)
  return c.json(toScrollEntryDTO(entry), 201)
})

adminScrollsRoutes.patch('/:id', async (c) => {
  const id = idSchema.safeParse(c.req.param('id'))
  if (!id.success) return c.json({ error: 'Scroll not found', code: 'SCROLL_NOT_FOUND' }, 404)

  const parsed = updateScrollSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json(invalidBody(parsed.error.issues), 400)

  const entry = await useCases.updateScroll.execute(id.data, parsed.data)
  return c.json(toScrollEntryDTO(entry))
})

adminScrollsRoutes.delete('/:id', async (c) => {
  const id = idSchema.safeParse(c.req.param('id'))
  if (!id.success) return c.json({ error: 'Scroll not found', code: 'SCROLL_NOT_FOUND' }, 404)

  await useCases.deleteScroll.execute(id.data)
  return c.body(null, 204)
})
