import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { z } from 'zod'
import { isPayloadTooLarge, scrollExecuteRequestSchema, scrollSlugSchema } from '@dojo/shared'
import { config } from '../../../config'
import { useCases } from '../../container'
import { requireAuth } from '../middleware/auth'
import { scrollExecutionLimiter } from '../middleware/scroll-execution-limiter'
import type { AppEnv } from '../app-env'

const MAX_BODY_BYTES = 256 * 1024

export const scrollExecuteRoutes = new Hono<AppEnv>()

scrollExecuteRoutes.get('/scrolls/execution/status', (c) => c.json({ enabled: config.FF_CODE_EXECUTION_ENABLED }))

scrollExecuteRoutes.use('/scrolls/:slug/execute', requireAuth)
scrollExecuteRoutes.use('/scrolls/:slug/execute', scrollExecutionLimiter)
scrollExecuteRoutes.use(
  '/scrolls/:slug/execute',
  bodyLimit({ maxSize: MAX_BODY_BYTES, onError: (c) => c.json({ error: 'payload_too_large' }, 413) }),
)

scrollExecuteRoutes.post('/scrolls/:slug/execute', async (c) => {
  if (!config.FF_CODE_EXECUTION_ENABLED) return c.json({ error: 'Not found' }, 404)

  const slug = scrollSlugSchema.safeParse(c.req.param('slug'))
  if (!slug.success) return c.json({ error: 'Scroll not found', code: 'SCROLL_NOT_FOUND' }, 404)

  const body = await c.req.json().catch(() => null)
  const request = scrollExecuteRequestSchema.safeParse(body)
  if (!request.success) {
    if (isPayloadTooLarge(request.error.issues)) return c.json({ error: 'payload_too_large' }, 413)
    return c.json({ error: 'invalid_request', details: z.flattenError(request.error) }, 422)
  }

  return c.json(await useCases.executeScrollCode.execute(slug.data, request.data))
})
