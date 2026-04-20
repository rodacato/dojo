# ADR 017: Error reporting as a port with composable adapters

**Status:** Accepted
**Date:** 2026-04-20
**Context:** Sprint 020 Part 7 — a 500 in production (`GET /u/rodacato`) surfaced that the only error management we have is `console.error` → container stdout. To diagnose a single incident we need `kamal app logs` and the event disappears on rotation. This is insufficient for Phase 1 Alpha with invited users.

---

## Decision

Introduce `ErrorReporterPort` in `infrastructure/observability/`. Three concrete adapters plus a composite wrapper:

- `ConsoleErrorReporter` — preserves `console.error` to stdout so `kamal app logs` keeps working and local dev is unchanged.
- `PostgresErrorReporter` — inserts into a new `errors` table on the same DB already in use. Our locally-owned, durable fallback.
- `SentryErrorReporter` — `@sentry/node` on the API, `@sentry/react` on the web. Primary surface for triage (grouping, source maps, breadcrumbs, alerts).
- `CompositeErrorReporter` — tees a single report to N reporters with independent failure: if Sentry is down or quota is exceeded, Postgres still catches it; if Postgres is down, Sentry still does.

Errors are cross-cutting infrastructure. The port lives in `infrastructure/observability/ports.ts`, not in `domain/*/ports.ts`. Domain and application layers do not import it — only the HTTP boundary (`router.ts` `onError`, middleware) and the web `ErrorBoundary` / global handlers reach the reporter.

---

## Why this shape

### Why a port + adapters at all

Consistent with `LLMPort`, `CodeExecutionPort`, repositories. Lets us:

- Swap providers without touching integration points.
- Run a `NoopErrorReporter` in unit tests.
- Keep the hexagonal boundary clean — nothing about Sentry leaks into domain code.

### Why Sentry + Postgres + Console, not pick one

Three sinks because each fails differently:

- **Sentry** is the best triage UX but has a quota (5k events/mo on free tier), an external dependency, and can throttle.
- **Postgres** never exceeds a quota we don't own and is the same DB we already operate — zero new infra.
- **Console** is free, is what `kamal app logs` reads, and works even when the DB is unreachable (which is exactly when we most want to know).

Cost of adding all three is a small `CompositeErrorReporter`. Cost of picking one and being wrong is losing errors in an outage.

### Why the port lives in infrastructure, not domain

The domain does not know what an "error report" is. Errors are raised as `DomainError` or unhandled exceptions; *reporting* them is something the infrastructure (HTTP layer, runtime) does. Putting the port in `domain/` would invert the dependency and pollute the domain vocabulary with observability concerns.

This is a deviation from the "all ports live in domain" pattern, and it is deliberate for this specific case.

---

## Alternatives considered

| Option | Why not |
|---|---|
| **Sentry only** | Single point of failure; quota cliff on free tier silently drops events; no local history if Sentry is down |
| **Postgres only (homemade)** | No grouping, no source maps, no alerts — re-inventing Sentry poorly |
| **GlitchTip self-hosted** | Sentry-compatible OSS clone but adds another container + its own DB + upgrade burden. The free Sentry tier covers this scale |
| **Grafana Cloud (Loki + Tempo)** | Different tool for a different job — logs/traces, not error grouping. Useful someday; does not replace Sentry |
| **Self-hosted Sentry** | ~4 GB RAM + ClickHouse + Kafka. Wildly over-scoped for Phase 1 Alpha |
| **Log aggregator (Axiom, Logtail)** | Complements but does not replace Sentry. Good idea later; adds a fourth sink without a clear win today |

---

## Shape

```ts
// infrastructure/observability/ports.ts
export interface ErrorReport {
  message: string
  stack?: string
  status: number
  source: 'api' | 'web'
  route?: string
  method?: string
  userId?: string
  requestId?: string
  context?: Record<string, unknown>
}

export interface ErrorReporterPort {
  report(report: ErrorReport): Promise<void>
}
```

Wiring in `container.ts`:

```ts
function createErrorReporter(): ErrorReporterPort {
  const reporters: ErrorReporterPort[] = [new ConsoleErrorReporter()]
  reporters.push(new PostgresErrorReporter(db))
  if (config.SENTRY_DSN) reporters.push(new SentryErrorReporter(config.SENTRY_DSN))
  return new CompositeErrorReporter(reporters)
}
```

Used in `router.ts`:

```ts
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  if (err.name === 'DomainError') { /* domain-error → status (unchanged) */ }

  errorReporter.report({
    message: err.message,
    stack: err.stack,
    status: 500,
    source: 'api',
    route: c.req.path,
    method: c.req.method,
    userId: c.get('user')?.id,
    requestId: c.get('requestId'),
  }).catch(() => {})  // never block the response on reporting

  return c.json({ error: 'Internal server error' }, 500)
})
```

`CompositeErrorReporter.report` calls each reporter with individual `.catch(...)` so one failing does not skip the others.

---

## Schema

Migration `0016_errors_table.sql`:

```sql
CREATE TABLE errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL,
  status INT,
  route TEXT,
  method TEXT,
  message TEXT NOT NULL,
  stack TEXT,
  request_id UUID,
  user_id UUID,
  context JSONB
);
CREATE INDEX errors_created_at_idx ON errors (created_at DESC);
CREATE INDEX errors_source_status_idx ON errors (source, status);
```

Retention: a nightly job (or manual for now) deletes rows older than 30 days — same as Sentry free retention so the two sinks stay aligned.

---

## Admin surface

`GET /admin/errors?source=&status=&limit=100` + page `/admin/errors` reusing `AdminLayout`. For Phase 1 Alpha the list is enough; grouping / stack collapse is what Sentry already provides.

---

## Web parallel

`apps/web/src/lib/observability/`:

- `ErrorReporter` interface (same shape, `source: 'web'`)
- `ConsoleErrorReporter` — keeps `console.error`
- `SentryBrowserReporter` — `@sentry/react`
- `ApiErrorReporter` — `POST /errors` which routes through the API's `ErrorReporterPort`
- `CompositeErrorReporter`

Wired into:

- `ErrorBoundary.componentDidCatch`
- `window.onerror`
- `window.addEventListener('unhandledrejection')`

The web boundary does not need Postgres directly — it posts to the API, which fans out to all three sinks. Simpler and keeps the network egress rules consistent (the browser already talks to the API, not to Postgres).

---

## Configuration

```env
# API
SENTRY_DSN=                    # empty = Sentry adapter disabled
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Web
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=production
```

Source maps uploaded to Sentry during the web build via `@sentry/vite-plugin`. Release tagging uses the current git SHA.

---

## Risks

- **Reporting loop:** if `PostgresErrorReporter.report` throws, `CompositeErrorReporter` catches it and continues — but we must not have that throw re-enter `app.onError`. Unit test explicitly covers "one adapter throws, others still called".
- **PII in breadcrumbs:** Sentry captures request bodies by default. We will `sanitize` user responses and code before sending to Sentry — only `userId` / `route` / `status` leave the box. Marta (C5) to review.
- **Postgres write cost on error storm:** bounded by the 30-day retention and the admin view's 100-row pagination. If we start seeing >100 errors/hour we have a worse problem than write cost.
- **Sentry quota cliff:** 5k events/mo is a ceiling. Postgres fallback ensures we do not lose events past the cliff; alerts on quota near-full are configured in Sentry.
- **Web → API POST `/errors` is unauthenticated:** a bad actor could spam it. Rate-limited at the route level; malicious payloads are not worse than normal traffic we already accept.

---

## Ref

- Sprint 020 Part 7 — `docs/sprints/current.md`
- UX audit that surfaced the gap — `docs/ux-gaps-2026-04.md`
