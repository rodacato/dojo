# Observability and operations

What an instance exposes for monitoring, and how to recover its moving parts. Deploying is
[deploy.md](deploy.md).

## Error reporting

Three sinks run in parallel (Console + Postgres + Sentry) via a `CompositeErrorReporter` — see [ADR 017](../adr/017-error-reporting-port.md). Sentry is opt-in; empty DSN leaves it off.

**Environment gating.** Sentry is skipped when the environment is `development` or `test`, even if a DSN is present. This stops a prod `.env` copied to a laptop from spraying dev errors into your prod Sentry project. Override by setting `SENTRY_ENVIRONMENT` / `VITE_SENTRY_ENVIRONMENT` to `staging` or `production`.

```env
# API (@sentry/node) — empty env defaults to NODE_ENV
SENTRY_DSN=                     # https://xxx.ingest.sentry.io/yyy
SENTRY_ENVIRONMENT=             # staging | production (empty → NODE_ENV)
SENTRY_TRACES_SAMPLE_RATE=0     # 0..1 — keep at 0 until tracing is used
SENTRY_RELEASE=                 # usually the deploy's git SHA

# Web (@sentry/react) — empty env defaults to Vite MODE
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=        # staging | production (empty → Vite MODE)
VITE_SENTRY_RELEASE=

# Source map upload (build-time only, web). All three required together.
SENTRY_AUTH_TOKEN=              # org token with org:ci scope
SENTRY_ORG=
SENTRY_PROJECT=dojo-web
```

Errors logged in Postgres are listed at `/admin/errors` with filters for source (api/web) and HTTP status — useful even when Sentry is down or over quota.

**Errors retention.** The `errors` table can be purged manually via `POST /cron/cleanup-errors` (deletes rows older than 30 days). Auth: `Authorization: Bearer ${CRON_SECRET}`. The scheduled GitHub Action that called this daily was disabled — pending a replacement scheduling solution.

## Metrics (Prometheus)

The API can expose Prometheus metrics at `GET /metrics` on the main app port — same hostname as everything else. There is no separate metrics port. Prometheus scrapes it like any external service.

| Env var | Type | Default | Notes |
|---|---|---|---|
| `METRICS_ENABLED` | variable | `false` | The gate. OFF mounts nothing — no endpoint, no default metrics, no middleware (zero overhead). |
| `METRICS_TOKEN` | secret | — | Bearer token guarding `/metrics`. Generate with `openssl rand -hex 32`. |

**Opt-in and token-gated.** Metrics are off by default. The token alone enables nothing — `METRICS_ENABLED` turns it on. With metrics enabled in production and **no** token set, `/metrics` returns `404` rather than serve data unauthenticated. In development with no token, the endpoint is open for convenience. The token is compared in constant time (SHA-256 + `timingSafeEqual`).

`/metrics` is mounted **before** the rate limiters — like `/health`, scraping is never throttled.

**What's exposed:**

- Default process metrics (memory, GC, event-loop lag) via `collectDefaultMetrics`.
- `http_request_duration_seconds` — request latency histogram labelled by `method`, `route` (the matched route *pattern*, e.g. `/sessions/:id`, never the raw URL; unmatched requests collapse to `"unmatched"`), and `status_code`.
- `dojo_sensei_evaluations_total` — counter of completed sensei evaluations, labelled by `verdict` (`passed` / `passed_with_notes` / `needs_work`). One increment per finished kata-loop evaluation; each is an LLM streaming call, so this is both the core-value throughput and the main cost driver. Per-process — sum across instances in PromQL.

**Scrape config** (`prometheus.yml`):

```yaml
scrape_configs:
  - job_name: dojo-api
    metrics_path: /metrics
    scheme: https
    authorization:
      credentials: ${METRICS_TOKEN}   # same value as the API's METRICS_TOKEN
    static_configs:
      - targets: ['dojo-api.example.com']   # your API_HOST
```

Validate from the shell:

```bash
# 200 with a valid token
curl -fsS -H "Authorization: Bearer $METRICS_TOKEN" https://$API_HOST/metrics | head
# 401 without a token (when a token is configured)
curl -s -o /dev/null -w '%{http_code}\n' https://$API_HOST/metrics
```

## Piston recovery

Piston runs as a Kamal accessory with a persisted `/piston/packages` volume (ADR 018). If the volume is ever reset or the six runtimes drift out of sync, rerun:

```bash
PISTON_URL=http://<host_ip>:2000 ./scripts/piston-reprovision.sh
```

The script is idempotent — present runtimes are skipped, missing ones are installed via Piston's `POST /api/v2/packages`. The source-of-truth list of runtimes lives in the script.

**Liveness.** A GitHub Actions workflow (`.github/workflows/piston-liveness.yml`) probes `/health/piston` every 30 minutes. Two consecutive failures 30s apart fail the workflow run — an email goes out via GitHub's default notifications. See ADR 019. Requires the `PISTON_HEALTH_URL` repo variable (set to the app's `/health/piston`, not Piston directly — the app endpoint also catches API↔Piston network breaks). The URL is public, so it lives under Variables, not Secrets.
