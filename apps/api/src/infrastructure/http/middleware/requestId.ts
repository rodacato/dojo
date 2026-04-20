import { randomUUID } from 'node:crypto'
import type { MiddlewareHandler } from 'hono'
import type { AppEnv } from '../app-env'

// Tags every request with a stable id so error reports can be correlated with
// stdout logs. Honours an incoming `X-Request-Id` header when present.
export const requestIdMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const incoming = c.req.header('x-request-id')
  const id = isUuid(incoming) ? incoming : randomUUID()
  c.set('requestId', id)
  c.res.headers.set('X-Request-Id', id)
  await next()
}

function isUuid(v: string | undefined): v is string {
  return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}
