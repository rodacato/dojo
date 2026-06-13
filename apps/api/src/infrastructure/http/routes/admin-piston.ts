import { Hono } from 'hono'
import { pistonRuntimeProvisioner } from '../../container'
import { requireAuth, requireCreator } from '../middleware/auth'
import type { AppEnv } from '../app-env'

export const adminPistonRoutes = new Hono<AppEnv>()

adminPistonRoutes.use('*', requireAuth, requireCreator)

// POST /admin/piston/reprovision — idempotent install of every runtime in
// piston-runtimes.ts against the live Piston accessory. Same logic as
// scripts/piston-reprovision.sh, callable from the admin UI when the
// dojo-piston-packages volume is reset or a new runtime is added.
adminPistonRoutes.post('/reprovision', async (c) => {
  try {
    const report = await pistonRuntimeProvisioner.provision()
    const status = report.failed.length === 0 ? 200 : 500
    return c.json(report, status)
  } catch (err) {
    console.error('Admin piston reprovision failed:', err)
    const message = err instanceof Error ? err.message : 'Reprovision failed'
    return c.json({ error: message }, 500)
  }
})
