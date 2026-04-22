import type { users } from '../persistence/drizzle/schema'

/**
 * Shared Hono environment type.
 * Pass as generic to `new Hono<AppEnv>()` and middleware `Context<AppEnv>`.
 */
export type AppEnv = {
  Variables: {
    user: typeof users.$inferSelect
    requestId: string
    // Anonymous browser-session identifier for the playground surface.
    // Populated by the playground route's ensurePlaygroundSession
    // middleware before the rate limiters read it.
    playgroundSessionId: string
  }
}
