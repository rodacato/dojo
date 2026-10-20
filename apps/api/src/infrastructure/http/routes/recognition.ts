import { Hono } from 'hono'
import { practitionerLookSchema } from '@dojo/shared'
import { UserId } from '../../../domain/shared/types'
import { useCases } from '../../container'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../app-env'

export const recognitionRoutes = new Hono<AppEnv>()

recognitionRoutes.get('/recognition/practitioner', requireAuth, async (c) => {
  const user = c.get('user')
  return c.json(await useCases.getPractitioner.execute(UserId(user.id)))
})

recognitionRoutes.put('/recognition/practitioner/look', requireAuth, async (c) => {
  const user = c.get('user')
  const parsed = practitionerLookSchema.safeParse(await c.req.json().catch(() => null))
  if (!parsed.success) return c.json({ error: 'Invalid look' }, 400)

  const result = await useCases.updatePractitionerLook.execute(UserId(user.id), parsed.data)
  if (!result.ok) return c.json({ error: 'Piece not earned', pieces: result.notEarned }, 400)
  return c.json({ look: parsed.data })
})
