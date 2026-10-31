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
    goalWeeklyTarget: prefs?.goalWeeklyTarget ?? 3,
  })
})

// ---------------------------------------------------------------------------
// PUT /preferences — Update only the fields present in the body
// ---------------------------------------------------------------------------

const preferencesSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  reminderHour: z.number().int().min(0).max(23).optional(),
  email: z.email().optional().nullable(),
  level: z.enum(['junior', 'mid', 'senior']).optional(),
  interests: z.array(z.string()).optional(),
  randomness: z.number().min(0).max(1).optional(),
  goalWeeklyTarget: z.number().int().min(1).max(7).optional(),
})

function presentFields<T extends object>(fields: T) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  ) as { [K in keyof T]?: Exclude<T[K], undefined> }
}

preferencesRoutes.put('/preferences', requireAuth, async (c) => {
  const user = c.get('user') as { id: string }
  const body = await c.req.json()
  const parsed = preferencesSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid preferences' }, 400)

  const { reminderEnabled, reminderHour, email, level, interests, randomness, goalWeeklyTarget } = parsed.data
  const userFields = presentFields({ reminderEnabled, reminderHour, email })
  const practiceFields = presentFields({ level, interests, randomness, goalWeeklyTarget })

  if (Object.keys(userFields).length > 0) {
    await db.update(users).set(userFields).where(eq(users.id, user.id))
  }

  if (Object.keys(practiceFields).length > 0) {
    await db
      .insert(userPreferences)
      .values({ userId: user.id, ...practiceFields })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: { ...practiceFields, updatedAt: sql`NOW()` },
      })
  }

  return c.json({ ok: true })
})
