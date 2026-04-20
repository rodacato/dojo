import { ConsoleErrorReporter } from './ConsoleErrorReporter'
import { ApiErrorReporter } from './ApiErrorReporter'
import { CompositeErrorReporter } from './CompositeErrorReporter'
import { SentryBrowserReporter } from './SentryBrowserReporter'
import { SENTRY_DSN, SENTRY_ENVIRONMENT, SENTRY_RELEASE } from '../config'
import type { ErrorReporter, WebErrorReport } from './ports'

// Module-level singleton. Sentry adapter only wires up when DSN is present —
// no DSN, no Sentry call. Console + Api remain active regardless so we never
// silently lose an event.
const reporters: ErrorReporter[] = [new ConsoleErrorReporter(), new ApiErrorReporter()]
if (SENTRY_DSN) {
  reporters.push(
    new SentryBrowserReporter({
      dsn: SENTRY_DSN,
      environment: SENTRY_ENVIRONMENT,
      release: SENTRY_RELEASE || undefined,
    }),
  )
}
export const errorReporter: ErrorReporter = new CompositeErrorReporter(reporters)

// Wires `window.onerror` and `unhandledrejection` so native runtime errors
// that never bubble to React's boundary still get reported. Call once at
// app bootstrap.
export function installGlobalHandlers(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('error', (event) => {
    void errorReporter.report(toReport(event.error, event.message))
  })

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason
    const error =
      reason instanceof Error
        ? reason
        : new Error(typeof reason === 'string' ? reason : 'Unhandled rejection')
    void errorReporter.report(toReport(error))
  })
}

function toReport(err: unknown, fallback?: string): WebErrorReport {
  if (err instanceof Error) {
    return {
      message: err.message || fallback || 'Unknown error',
      stack: err.stack,
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    }
  }
  return {
    message: fallback ?? 'Unknown error',
    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
  }
}

export type { ErrorReporter, WebErrorReport } from './ports'
