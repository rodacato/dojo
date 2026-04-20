import { ConsoleErrorReporter } from './ConsoleErrorReporter'
import { ApiErrorReporter } from './ApiErrorReporter'
import { CompositeErrorReporter } from './CompositeErrorReporter'
import type { ErrorReporter, WebErrorReport } from './ports'

// Module-level singleton. Sentry browser adapter is added in Part 7.7; adding
// it here keeps the wiring in one place for all consumers.
export const errorReporter: ErrorReporter = new CompositeErrorReporter([
  new ConsoleErrorReporter(),
  new ApiErrorReporter(),
])

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
