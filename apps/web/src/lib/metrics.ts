// Minimal browser-side metrics emitter. Mirrors the backend shape in
// apps/api/src/infrastructure/observability/metrics.ts — JSON line on
// console.info + Sentry breadcrumb so the event is visible in the
// browser devtools during dev and attached to any Sentry report that
// happens around the same time in prod.
//
// No network call to the API for now; if we ever want to pipe these
// into a table, add one endpoint and keep this function as the single
// emission surface.

import * as Sentry from '@sentry/react'

type EventName =
  | 'playground_run'
  | 'playground_cta_click'

export function trackEvent(name: EventName, payload: Record<string, unknown> = {}): void {
  const line = {
    evt: 'metric',
    name,
    at: new Date().toISOString(),
    payload,
  }
  // console.info keeps the event in the browser devtools without being
  // filtered by the "warnings and errors" default of most error dashboards.
  console.info(line)

  try {
    Sentry.addBreadcrumb({
      category: 'metric',
      level: 'info',
      message: name,
      data: payload,
    })
  } catch {
    // Sentry not initialized in this environment — breadcrumb is optional.
  }
}
