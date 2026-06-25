import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client'

// Prometheus instrumentation, kept separate from the stdout `trackEvent`
// emitter in metrics.ts — that one feeds log aggregation, this one is
// scraped at /metrics. The whole thing is opt-in: nothing here runs until
// initMetrics() is called by registerMetrics() when METRICS_ENABLED is on.

export interface Metrics {
  registry: Registry
  httpRequestDuration: Histogram<'method' | 'route' | 'status_code'>
  senseiEvaluations: Counter<'verdict'>
}

let active: Metrics | null = null

export function initMetrics(): Metrics {
  // Fresh registry per init so the instruments register cleanly even when
  // called more than once (each createRouter() in the test suite). We never
  // touch prom-client's global default registry.
  const registry = new Registry()
  collectDefaultMetrics({ register: registry })

  const httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds by method, matched route pattern, and status code.',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
  })

  const senseiEvaluations = new Counter({
    name: 'dojo_sensei_evaluations_total',
    help: 'Sensei evaluations completed, by verdict. One increment per finished kata-loop evaluation (each is an LLM streaming call). Per-process — sum across instances in PromQL.',
    labelNames: ['verdict'],
    registers: [registry],
  })

  active = { registry, httpRequestDuration, senseiEvaluations }
  return active
}

export function getMetrics(): Metrics | null {
  return active
}

// Test-only teardown so a following initMetrics() starts from a clean slate.
export function resetMetrics(): void {
  active?.registry.clear()
  active = null
}

// Business-event hook called from the sensei stream. A no-op when metrics are
// disabled, so callers never have to know whether instrumentation is mounted.
export function recordSenseiEvaluation(verdict: string): void {
  active?.senseiEvaluations.inc({ verdict })
}
