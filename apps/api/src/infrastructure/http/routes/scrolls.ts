import { Hono } from 'hono'
import { scrollSlugSchema } from '@dojo/shared'
import { useCases } from '../../container'
import { optionalAuth } from '../middleware/auth'
import type { AppEnv } from '../app-env'
import { toScrollEntryDTO } from './scroll-dto'

export const scrollsRoutes = new Hono<AppEnv>()

scrollsRoutes.use('/scrolls', optionalAuth)
scrollsRoutes.use('/scrolls/:slug', optionalAuth)

scrollsRoutes.get('/scrolls', async (c) => {
  const entries = await useCases.listScrolls.forVisitor({ authenticated: Boolean(c.get('user')) })
  return c.json(entries.map(toScrollEntryDTO))
})

scrollsRoutes.get('/scrolls/:slug', async (c) => {
  const slug = scrollSlugSchema.safeParse(c.req.param('slug'))
  if (!slug.success) return c.json({ error: 'Scroll not found', code: 'SCROLL_NOT_FOUND' }, 404)

  const entry = await useCases.getScrollBySlug.execute(slug.data, {
    authenticated: Boolean(c.get('user')),
  })
  return c.json(toScrollEntryDTO(entry))
})
