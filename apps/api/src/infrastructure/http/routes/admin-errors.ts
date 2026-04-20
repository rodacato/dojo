import { and, desc, eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../../persistence/drizzle/client'
import { errors } from '../../persistence/drizzle/schema'
import { requireAuth, requireCreator } from '../middleware/auth'
import type { AppEnv } from '../app-env'

export const adminErrorsRoutes = new Hono<AppEnv>()

adminErrorsRoutes.use('*', requireAuth, requireCreator)

const listSchema = z.object({
  source: z.enum(['api', 'web']).optional(),
  status: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

// GET /admin/errors — newest first; filter by source/status; bounded pagination.
adminErrorsRoutes.get('/', async (c) => {
  const params = listSchema.parse(c.req.query())

  const conds = []
  if (params.source) conds.push(eq(errors.source, params.source))
  if (params.status !== undefined) conds.push(eq(errors.status, params.status))
  const where = conds.length ? and(...conds) : undefined

  const [rows, totalRow] = await Promise.all([
    db
      .select()
      .from(errors)
      .where(where)
      .orderBy(desc(errors.createdAt))
      .limit(params.limit)
      .offset(params.offset),
    db.select({ count: sql<number>`count(*)::int` }).from(errors).where(where),
  ])

  return c.json({
    total: totalRow[0]?.count ?? 0,
    limit: params.limit,
    offset: params.offset,
    rows: rows.map((r) => ({
      id: r.id,
      createdAt: r.createdAt.toISOString(),
      source: r.source,
      status: r.status,
      route: r.route,
      method: r.method,
      message: r.message,
      stack: r.stack,
      requestId: r.requestId,
      userId: r.userId,
      context: r.context,
    })),
  })
})
