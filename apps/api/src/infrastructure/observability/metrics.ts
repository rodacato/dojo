import { log } from './logger'

// Funnel events as log lines, until there is signal to justify a table.
// Stable, greppable shape: { "evt": "metric", "name": "<event>", "payload": {...} }

type EventName =
  | 'playground_run'
  | 'playground_cta_click'
  | 'playground_signup_conversion'

export function trackEvent(name: EventName, payload: Record<string, unknown>): void {
  log.info('metric', { name, payload })
}
