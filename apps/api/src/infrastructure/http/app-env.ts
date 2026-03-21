import type { users } from '../persistence/drizzle/schema'

/**
 * Shared Hono environment type.
 * Pass as generic to `new Hono<AppEnv>()` and middleware `Context<AppEnv>`.
 */
export type AppEnv = {
  Variables: {
    user: typeof users.$inferSelect
  }
}
