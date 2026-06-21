import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../../persistence/drizzle/client'
import { scrolls, lessons, steps } from '../../persistence/drizzle/schema'
import { seedAllScrolls } from '../../persistence/seed-scrolls'
import { requireAuth, requireCreator } from '../middleware/auth'
import type { AppEnv } from '../app-env'

export const adminScrollsRoutes = new Hono<AppEnv>()

adminScrollsRoutes.use('*', requireAuth, requireCreator)

// ---------------------------------------------------------------------------
// GET /admin/scrolls — list all scrolls with stats and flags
// ---------------------------------------------------------------------------
adminScrollsRoutes.get('/', async (c) => {
  const rows = await db.query.scrolls.findMany({
    with: { lessons: { with: { steps: true } } },
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  })

  return c.json(
    rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      language: r.language,
      accentColor: r.accentColor,
      status: r.status,
      isPublic: r.isPublic,
      lessonCount: r.lessons.length,
      stepCount: r.lessons.reduce((sum, l) => sum + l.steps.length, 0),
      createdAt: r.createdAt,
    })),
  )
})

// ---------------------------------------------------------------------------
// PATCH /admin/scrolls/:id — toggle isPublic or change status
// ---------------------------------------------------------------------------
const patchSchema = z.object({
  isPublic: z.boolean().optional(),
  status: z.enum(['draft', 'published']).optional(),
})

adminScrollsRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 422)
  }

  const patch = parsed.data
  if (patch.isPublic === undefined && patch.status === undefined) {
    return c.json({ error: 'Nothing to update' }, 422)
  }

  const [updated] = await db
    .update(scrolls)
    .set({
      ...(patch.isPublic === undefined ? {} : { isPublic: patch.isPublic }),
      ...(patch.status === undefined ? {} : { status: patch.status }),
    })
    .where(eq(scrolls.id, id))
    .returning()

  if (!updated) {
    return c.json({ error: 'Scroll not found' }, 404)
  }

  return c.json({ id: updated.id, isPublic: updated.isPublic, status: updated.status })
})

// ---------------------------------------------------------------------------
// POST /admin/scrolls/seed — re-run the scroll seed scripts in-process
//
// Idempotent: upserts by slug + step id. Safe to run from the UI without SSH
// or redeploy. Executed in-process using the same seedAllScrolls() helper that
// the `db:seed:scrolls` CLI uses.
// ---------------------------------------------------------------------------
adminScrollsRoutes.post('/seed', async (c) => {
  try {
    const report = await seedAllScrolls(db)
    return c.json(report)
  } catch (err) {
    console.error('Admin scroll seed failed:', err)
    const message = err instanceof Error ? err.message : 'Seed failed'
    return c.json({ error: message }, 500)
  }
})

// Delete all lessons+steps for a scroll and re-insert from seed data.
// Needed when the seed drops/renames steps — onConflictDoUpdate alone
// never removes orphans.
adminScrollsRoutes.post('/:id/wipe', async (c) => {
  const id = c.req.param('id')
  const scroll = await db.query.scrolls.findFirst({ where: eq(scrolls.id, id) })
  if (!scroll) return c.json({ error: 'Scroll not found' }, 404)

  const courseLessons = await db.query.lessons.findMany({ where: eq(lessons.scrollId, id) })
  for (const l of courseLessons) {
    await db.delete(steps).where(eq(steps.lessonId, l.id))
  }
  await db.delete(lessons).where(eq(lessons.scrollId, id))
  return c.json({ ok: true })
})
