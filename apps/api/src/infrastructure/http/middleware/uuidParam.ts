import type { MiddlewareHandler } from 'hono'
import { z } from 'zod'
import type { AppEnv } from '../app-env'

// z.guid, not z.uuid: it accepts exactly the shape Postgres' uuid type does,
// while z.uuid also demands an RFC version and variant.
const uuidSchema = z.guid()

export function isUuid(value: string | undefined): value is string {
  return uuidSchema.safeParse(value).success
}

// Postgres rejects a malformed id in a uuid column with an error, which
// would surface as a 500. An id that cannot exist is a 404.
export function uuidParam(name: string, notFound: { error: string }): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!isUuid(c.req.param(name))) return c.json(notFound, 404)
    await next()
  }
}
