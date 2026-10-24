import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import type { ErrorReporterPort } from '../observability/ports'
import type { AppEnv } from './app-env'
import { domainErrorToStatus } from './domain-error-status'

export function createErrorHandler(errorReporter: ErrorReporterPort): ErrorHandler<AppEnv> {
  return (err, c) => {
    if (err instanceof HTTPException) return err.getResponse()

    if (err.name === 'DomainError') {
      const code = (err as { code?: string }).code
      return c.json({ error: err.message, code }, domainErrorToStatus(code))
    }

    // Fire-and-forget: never block the error response on a reporter issue.
    // CompositeErrorReporter already swallows per-adapter failures.
    void errorReporter.report({
      message: err.message,
      stack: err.stack,
      status: 500,
      source: 'api',
      // The pattern, so reports group by endpoint; the raw path is in the
      // request's http.request log line, found by requestId.
      route: c.req.routePath,
      method: c.req.method,
      userId: c.get('user')?.id,
      requestId: c.get('requestId'),
    })

    return c.json({ error: 'Internal server error' }, 500)
  }
}
