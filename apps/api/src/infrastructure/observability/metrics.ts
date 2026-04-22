// Minimal metrics emitter — structured JSON lines on stdout, one per
// event. Kept tiny on purpose: the full TelemetrySinkPort design lives
// in the backlog. We'll grep/forward from logs until there is signal to
// justify a table + dashboard.
//
// Shape contract (stable, greppable):
//   { "evt": "metric", "name": "<event>", "at": "<iso>", "payload": {...} }
//
// Do not add fields to the top level that aren't marked stable — any
// log aggregator reading this stream has to stay reliable as we grow.

type EventName =
  | 'playground_run'
  | 'playground_cta_click'
  | 'playground_signup_conversion'

export function trackEvent(name: EventName, payload: Record<string, unknown>): void {
  const line = JSON.stringify({
    evt: 'metric',
    name,
    at: new Date().toISOString(),
    payload,
  })
  // stdout (console.log) keeps this on the same stream as the rest of
  // the structured logs — `kamal app logs` surfaces it by default.
  console.log(line)
}
