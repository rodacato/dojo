import { Hono } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../app-env'
import { errorReporter } from '../../container'
import { errorReportLimiter } from '../middleware/rateLimiter'

const webReportSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(20_000).optional(),
  route: z.string().max(500).optional(),
  context: z.record(z.unknown()).optional(),
})

export const errorRoutes = new Hono<AppEnv>()

// POST /errors — ingestion endpoint used by the web ErrorReporter adapters.
// Never auth-gated: errors from anonymous pages (landing, share, public profile)
// must still land. Rate-limited; fields are capped; the server-side composite
// reporter fans out to every configured sink.
errorRoutes.post('/errors', errorReportLimiter, async (c) => {
  const raw = await c.req.json().catch(() => null)
  const parsed = webReportSchema.safeParse(raw)
  if (!parsed.success) return c.json({ error: 'Invalid report' }, 400)

  await errorReporter.report({
    message: parsed.data.message,
    stack: parsed.data.stack,
    status: 0,
    source: 'web',
    route: parsed.data.route,
    method: 'GET',
    requestId: c.get('requestId'),
    userId: c.get('user')?.id,
    context: parsed.data.context,
  })

  return c.json({ ok: true })
})
