import { Hono, type Context } from 'hono'
import { ANONYMOUS_ID_HEADER, anonymousIdSchema, recordScrollProgressSchema, scrollSlugSchema } from '@dojo/shared'
import type { ScrollProgressDTO } from '@dojo/shared'
import { useCases } from '../../container'
import type { ProgressOwner, ScrollProgressView } from '../../../domain/scrolls/progress'
import { ScrollOwnerRequiredError } from '../../../domain/scrolls/progress-errors'
import { ScrollNotFoundError } from '../../../domain/shared/errors'
import { optionalAuth, requireAuth } from '../middleware/auth'
import { scrollProgressWriteLimiter } from '../middleware/scroll-progress-limiter'
import type { AppEnv } from '../app-env'

export const scrollProgressRoutes = new Hono<AppEnv>()

function toProgressDTO(view: ScrollProgressView): ScrollProgressDTO {
  // `state` only enters through the validated record schema, so it is JSON by construction.
  return { ...view, units: view.units as ScrollProgressDTO['units'], updatedAt: view.updatedAt?.toISOString() ?? null }
}

function anonymousIdOf(c: Context<AppEnv>): string | null {
  const parsed = anonymousIdSchema.safeParse(c.req.header(ANONYMOUS_ID_HEADER))
  return parsed.success ? parsed.data : null
}

function ownerOf(c: Context<AppEnv>): ProgressOwner {
  const user = c.get('user')
  if (user) return { kind: 'user', userId: user.id }
  const anonymousId = anonymousIdOf(c)
  if (!anonymousId) throw new ScrollOwnerRequiredError()
  return { kind: 'anonymous', anonymousId }
}

function slugOf(c: Context<AppEnv>): string {
  const slug = scrollSlugSchema.safeParse(c.req.param('slug'))
  if (!slug.success) throw new ScrollNotFoundError(c.req.param('slug') ?? '')
  return slug.data
}

scrollProgressRoutes.post('/scrolls/progress/merge', scrollProgressWriteLimiter, requireAuth, async (c) => {
  const anonymousId = anonymousIdOf(c)
  if (!anonymousId) throw new ScrollOwnerRequiredError()

  await useCases.mergeAnonymousScrollProgress.execute({ userId: c.get('user').id, anonymousId })
  return c.body(null, 204)
})

scrollProgressRoutes.get('/scrolls/:slug/progress', optionalAuth, async (c) => {
  const view = await useCases.getScrollProgress.execute(slugOf(c), ownerOf(c))
  return c.json(toProgressDTO(view))
})

scrollProgressRoutes.post('/scrolls/:slug/progress', scrollProgressWriteLimiter, optionalAuth, async (c) => {
  const slug = slugOf(c)
  const owner = ownerOf(c)
  const parsed = recordScrollProgressSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) {
    return c.json(
      {
        error: 'Invalid request body',
        issues: parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      },
      400,
    )
  }

  const view = await useCases.recordScrollProgress.execute(slug, owner, parsed.data)
  return c.json(toProgressDTO(view))
})
