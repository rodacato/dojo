import { eq, sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import { db } from '../../persistence/drizzle/client'
import { userPreferences, users } from '../../persistence/drizzle/schema'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../app-env'

export const preferencesRoutes = new Hono<AppEnv>()

// ---------------------------------------------------------------------------
// GET /preferences — User reminder preferences
// ---------------------------------------------------------------------------

preferencesRoutes.get('/preferences', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const row = await db.query.users.findFirst({ where: eq(users.id, user.id) })
  if (!row) return c.json({ error: 'User not found' }, 404)

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, user.id),
  })

  return c.json({
    reminderEnabled: row.reminderEnabled,
    reminderHour: row.reminderHour,
    email: row.email,
    level: prefs?.level ?? 'mid',
    interests: prefs?.interests ?? [],
    randomness: prefs?.randomness ?? 0.3,
  })
})

// ---------------------------------------------------------------------------
// PUT /preferences — Update reminder preferences
// ---------------------------------------------------------------------------

const preferencesSchema = z.object({
  reminderEnabled: z.boolean(),
  reminderHour: z.number().int().min(0).max(23),
  email: z.string().email().optional().nullable(),
  level: z.enum(['junior', 'mid', 'senior']).optional(),
  interests: z.array(z.string()).optional(),
  randomness: z.number().min(0).max(1).optional(),
})

preferencesRoutes.put('/preferences', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const body = await c.req.json()
  const parsed = preferencesSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid preferences' }, 400)

  await db
    .update(users)
    .set({
      reminderEnabled: parsed.data.reminderEnabled,
      reminderHour: parsed.data.reminderHour,
      email: parsed.data.email ?? null,
    })
    .where(eq(users.id, user.id))

  // Upsert user preferences (level, interests, randomness)
  if (parsed.data.level !== undefined || parsed.data.interests !== undefined || parsed.data.randomness !== undefined) {
    const prefValues: Record<string, unknown> = { userId: user.id }
    if (parsed.data.level !== undefined) prefValues.level = parsed.data.level
    if (parsed.data.interests !== undefined) prefValues.interests = parsed.data.interests
    if (parsed.data.randomness !== undefined) prefValues.randomness = parsed.data.randomness

    await db
      .insert(userPreferences)
      .values({ userId: user.id, ...prefValues })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...(parsed.data.level !== undefined && { level: parsed.data.level }),
          ...(parsed.data.interests !== undefined && { interests: parsed.data.interests }),
          ...(parsed.data.randomness !== undefined && { randomness: parsed.data.randomness }),
          updatedAt: sql`NOW()`,
        },
      })
  }

  return c.json({ ok: true })
})
