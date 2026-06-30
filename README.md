# dojo

> The dojo for developers who still have something to prove. To themselves.

[![CI](https://github.com/rodacato/dojo/actions/workflows/ci.yml/badge.svg)](https://github.com/rodacato/dojo/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A524-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)

**Code quality** (SonarQube, per workspace):

| Package | Quality Gate | Coverage | Maintainability | Reliability | Security |
|---|---|---|---|---|---|
| **api** (`apps/api`) | [![Quality Gate](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-api&metric=alert_status&token=sqb_e9fa10a8116539691c7f720767e9ea659e9caefd)](https://sonarqube.notdefined.dev/dashboard?id=dojo-api) | [![Coverage](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-api&metric=coverage&token=sqb_e9fa10a8116539691c7f720767e9ea659e9caefd)](https://sonarqube.notdefined.dev/dashboard?id=dojo-api) | [![Maintainability](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-api&metric=sqale_rating&token=sqb_e9fa10a8116539691c7f720767e9ea659e9caefd)](https://sonarqube.notdefined.dev/dashboard?id=dojo-api) | [![Reliability](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-api&metric=reliability_rating&token=sqb_e9fa10a8116539691c7f720767e9ea659e9caefd)](https://sonarqube.notdefined.dev/dashboard?id=dojo-api) | [![Security](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-api&metric=security_rating&token=sqb_e9fa10a8116539691c7f720767e9ea659e9caefd)](https://sonarqube.notdefined.dev/dashboard?id=dojo-api) |
| **web** (`apps/web`) | [![Quality Gate](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-web&metric=alert_status&token=sqb_b23eaaeb35fdae885c7e5e2e36f5ce956686eb87)](https://sonarqube.notdefined.dev/dashboard?id=dojo-web) | [![Coverage](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-web&metric=coverage&token=sqb_b23eaaeb35fdae885c7e5e2e36f5ce956686eb87)](https://sonarqube.notdefined.dev/dashboard?id=dojo-web) | [![Maintainability](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-web&metric=sqale_rating&token=sqb_b23eaaeb35fdae885c7e5e2e36f5ce956686eb87)](https://sonarqube.notdefined.dev/dashboard?id=dojo-web) | [![Reliability](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-web&metric=reliability_rating&token=sqb_b23eaaeb35fdae885c7e5e2e36f5ce956686eb87)](https://sonarqube.notdefined.dev/dashboard?id=dojo-web) | [![Security](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-web&metric=security_rating&token=sqb_b23eaaeb35fdae885c7e5e2e36f5ce956686eb87)](https://sonarqube.notdefined.dev/dashboard?id=dojo-web) |
| **shared** (`packages/shared`) | [![Quality Gate](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-packages&metric=alert_status&token=sqb_1234845201f9d4e3760ee39c71b06cf7fd6ea5b7)](https://sonarqube.notdefined.dev/dashboard?id=dojo-packages) | [![Coverage](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-packages&metric=coverage&token=sqb_1234845201f9d4e3760ee39c71b06cf7fd6ea5b7)](https://sonarqube.notdefined.dev/dashboard?id=dojo-packages) | [![Maintainability](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-packages&metric=sqale_rating&token=sqb_1234845201f9d4e3760ee39c71b06cf7fd6ea5b7)](https://sonarqube.notdefined.dev/dashboard?id=dojo-packages) | [![Reliability](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-packages&metric=reliability_rating&token=sqb_1234845201f9d4e3760ee39c71b06cf7fd6ea5b7)](https://sonarqube.notdefined.dev/dashboard?id=dojo-packages) | [![Security](https://sonarqube.notdefined.dev/api/project_badges/measure?project=dojo-packages&metric=security_rating&token=sqb_1234845201f9d4e3760ee39c71b06cf7fd6ea5b7)](https://sonarqube.notdefined.dev/dashboard?id=dojo-packages) |

Vibe coding is making developers faster and their instincts weaker. Dojo is the counter-practice: a place where you think for yourself, work through discomfort, and submit something imperfect. No AI during the kata. The timer runs. The sensei tells you the truth.

It is not a certification platform. It is not a leaderboard. It is a daily practice for developers who want to stay technically alive.

Live at [dojo.notdefined.dev](https://dojo.notdefined.dev)

---

## How it works

You enter the dojo. You get 3 kata — no skip, no reroll. You pick one: a code refactor, a system design, a technical discussion. A sensei (an LLM with a specific role and 12 years of experience in whatever domain the kata covers) evaluates your work in real time. Not with praise, not with the answer — with honest, specific feedback on what you did and what you missed.

```
Enter the dojo
     ↓
Pick mood + available time
     ↓
3 kata options — choose one
     ↓
Work through it (timer running, no AI, no autocomplete)
     ↓
Submit → sensei evaluates in real time via WebSocket
     ↓
Verdict: Passed / Passed with notes / Needs work
     ↓
Full analysis + topics to review
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Hono + Node.js |
| Database | PostgreSQL |
| Realtime | WebSockets (sensei streams token by token) |
| Auth | GitHub OAuth |
| Architecture | DDD + Hexagonal (Ports & Adapters) + Event-Driven |
| LLM | Any compatible streaming endpoint |
| Code Execution | Piston (sandboxed, nsjail) |
| Infra | Docker + Kamal on Hetzner VPS |
| E2E Tests | Playwright |

### LLM Provider

Works with any streaming-compatible endpoint — Anthropic, OpenAI, or your own proxy:

```env
LLM_BASE_URL=https://api.anthropic.com
LLM_API_KEY=your_key_here
LLM_MODEL=claude-sonnet-4-20250514
```

---

## Monorepo Structure

```
dojo/
  apps/
    web/          # React + Vite frontend
    api/          # Hono + Node.js (domain / application / infrastructure)
  packages/
    shared/       # TypeScript types, Zod schemas
  docker-compose.yml
  turbo.json
```

---

## Getting Started

The fastest path is the Dev Container (`Reopen in Container` → `pnpm dev`). To run a full
instance without VS Code, `docker compose up --build`. Both run with a `mock` sensei, so no
LLM key is needed — you only need a GitHub OAuth app to sign in.

**See [GETTING_STARTED.md](GETTING_STARTED.md) for the full guide** (all three run paths,
GitHub sign-in setup, first-run check, and troubleshooting).

### Commands

```bash
pnpm dev                              # Start web + api in watch mode
pnpm build                            # Build all workspaces
pnpm lint                             # Lint all workspaces
pnpm typecheck                        # Type-check all workspaces
pnpm test --filter=api                # Run API unit + integration tests
pnpm --filter=api db:seed:scrolls     # Seed scroll catalog (TypeScript, JS DOM, SQL Deep Cuts)
```

---

## Kata Types

| Type | Description |
|---|---|
| `code` | Refactor, debug, review, or complete code in a split-panel editor |
| `chat` | Technical roleplay — respond to a scenario as you would in real life |
| `whiteboard` | System design and architecture using [Drawhaus](https://drawhaus.notdefined.dev) |

**60+ katas** across 10 categories: backend, frontend, architecture, security, DevOps, SQL, design patterns, algorithms, testing, and process. Each kata has 2 sensei variations with distinct evaluation perspectives.

---

## Features

| Feature | Description |
|---|---|
| **Scrolls** | Public learning paths at `/scrolls` — step-by-step katas with instant feedback. TypeScript and SQL Deep Cuts run via Piston; JavaScript DOM katas run in a browser iframe sandbox. Public scrolls (e.g. SQL Deep Cuts) can be followed without an account — progress persists in `localStorage` and merges into your account if you later sign in |
| **Code execution** | Code kata run in a Piston sandbox — the sensei sees real test results (pass/fail/compile error), not just your code |
| **Interest selection** | Set your level (junior/mid/senior), pick topics of interest, control randomness — the dojo adapts to you |
| **Kata feedback** | Optional micro-feedback after each kata (clarity, timing, evaluation fairness) — signals feed back into kata quality |
| **Public share** | Share your verdict via `/share/:id` — public page with sensei quote, kata info, and OG image for social previews |
| **Admin review** | Aggregated feedback per kata and variation, admin notes, kata versioning, archive lifecycle |
| **Belts** | Computed rank (white / yellow / green / brown / black) at `/belts` — derived from completed kata count, distinct topic clusters touched, active days, and cooldown at previous rank. The sensei never influences advancement (see [ADR 020](docs/adr/020-ubiquitous-language-pass.md)) |
| **Milestones** | One-time recognitions earned at specific moments — first kata, polyglot, scroll completions, consistency streaks. Surfaced alongside the belt on `/belts` |
| **Engawa** | Anonymous code playground at `/engawa` — the porch between inside and outside. Try a snippet without signing in |
| **Kumite** _(soon)_ | Reserved route for the planned 1v1 sparring feature. Today it renders an honest "coming soon" panel that explains what kumite will be — not a relabel of the old leaderboard |
| **Responsive** | Mobile-first with sidebar (desktop) and bottom nav (mobile) |
| **Error reporting** | Every unhandled error fans out to three sinks (console, Postgres, Sentry) via the `ErrorReporterPort` — see [docs/adr/017-error-reporting-port.md](docs/adr/017-error-reporting-port.md). Sentry is opt-in; without a DSN the Postgres + console fallback still captures everything, visible at `/admin/errors` |

---

## Observability

Three sinks run in parallel (Console + Postgres + Sentry) via a `CompositeErrorReporter` — see [ADR 017](docs/adr/017-error-reporting-port.md). Sentry is opt-in; empty DSN leaves it off.

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

### Metrics (Prometheus)

The API can expose Prometheus metrics at `GET /metrics` on the main app port — same hostname as everything else, behind kamal-proxy and Cloudflare. There is no separate metrics port. Prometheus scrapes it like any external service.

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
      - targets: ['dojo-api.notdefined.dev']
```

Validate from the shell:

```bash
# 200 with a valid token
curl -fsS -H "Authorization: Bearer $METRICS_TOKEN" https://dojo-api.notdefined.dev/metrics | head
# 401 without a token (when a token is configured)
curl -s -o /dev/null -w '%{http_code}\n' https://dojo-api.notdefined.dev/metrics
```

---

## Operations

### Piston recovery

Piston runs as a Kamal accessory with a persisted `/piston/packages` volume (ADR 018). If the volume is ever reset or the six runtimes drift out of sync, rerun:

```bash
PISTON_URL=http://<host_ip>:2000 ./scripts/piston-reprovision.sh
```

The script is idempotent — present runtimes are skipped, missing ones are installed via Piston's `POST /api/v2/packages`. The source-of-truth list of runtimes lives in the script.

**Liveness.** A GitHub Actions workflow (`.github/workflows/piston-liveness.yml`) probes `/health/piston` every 30 minutes. Two consecutive failures 30s apart fail the workflow run — an email goes out via GitHub's default notifications. See ADR 019. Requires the `PISTON_HEALTH_URL` repo variable (set to the app's `/health/piston`, not Piston directly — the app endpoint also catches API↔Piston network breaks). The URL is public, so it lives under Variables, not Secrets.

---

## Why self-host?

Your data stays on your server. Your kata history, your verdicts, your progression — none of it goes to a third party. `docker compose up --build` runs a full instance — see [GETTING_STARTED.md](GETTING_STARTED.md). See `docs/ARCHITECTURE.md` for the full system design and `SECURITY.md` for self-hosting recommendations.

---

## Honor Code

The dojo does not enforce rules technically. It trusts you.

- No AI during the kata — debrief with AI after
- No skipping katas you find uncomfortable
- The timer runs. You submit what you have.

If you cheat yourself here, you cheat yourself everywhere.

---

## Documentation

| Document | Purpose |
|---|---|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Run dojo locally — all paths, sign-in setup, troubleshooting |
| [docs/VISION.md](docs/VISION.md) | Why Dojo exists, philosophy, who it's for |
| [docs/ROADMAP.md](docs/ROADMAP.md) | What's shipped, what's next, what's out of scope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | DDD model, bounded contexts, ports, events |
| [docs/BRANDING.md](docs/BRANDING.md) | Colors, typography, voice, UI components |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Build cycle, testing strategy, definition of done |
| [docs/EXPERTS.md](docs/EXPERTS.md) | Virtual advisory panel |
| [docs/IDENTITY.md](docs/IDENTITY.md) | Primary build persona |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting and self-hosting security |
| [AGENTS.md](AGENTS.md) | AI agent behavior and working rules |

---

## Related Projects

- [Drawhaus](https://drawhaus.notdefined.dev) — Excalidraw-based whiteboard with MCP integration, used for whiteboard kata
- [SheLLM](https://github.com/rodacato/SheLLM) — Turn your LLM CLI subscriptions into a compatible REST API

---

## License

[MIT](LICENSE.md)
