# dojo

> The dojo for developers who still have something to prove. To themselves.

Vibe coding is making developers faster and their instincts weaker. Dojo is the counter-practice: a place where you think for yourself, work through discomfort, and submit something imperfect. No AI during the exercise. The timer runs. The sensei tells you the truth.

It is not a certification platform. It is not a leaderboard. It is a daily practice for developers who want to stay technically alive.

Live at [dojo.notdefined.dev](https://dojo.notdefined.dev)

---

## How it works

You enter the dojo. You get 3 kata — no skip, no reroll. You pick one: a code refactor, a system design, a technical discussion. A sensei (an LLM with a specific role and 12 years of experience in whatever domain the exercise covers) evaluates your work in real time. Not with praise, not with the answer — with honest, specific feedback on what you did and what you missed.

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

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose
- A GitHub OAuth App ([create one here](https://github.com/settings/applications/new))
- An LLM API key (Anthropic, OpenAI, or compatible)

### Setup

```bash
git clone https://github.com/rodacato/dojo
cd dojo
cp .env.example .env
# fill in your .env values
pnpm install
pnpm dev
```

Web app: `http://localhost:5173` — API: `http://localhost:3001`

### Commands

```bash
pnpm dev                              # Start web + api in watch mode
pnpm build                            # Build all workspaces
pnpm lint                             # Lint all workspaces
pnpm typecheck                        # Type-check all workspaces
pnpm test --filter=api                # Run API unit + integration tests
pnpm --filter=api db:seed:courses     # Seed course catalog (TypeScript, JS DOM, SQL Deep Cuts)
```

---

## Exercise Types

| Type | Description |
|---|---|
| `code` | Refactor, debug, review, or complete code in a split-panel editor |
| `chat` | Technical roleplay — respond to a scenario as you would in real life |
| `whiteboard` | System design and architecture using [Drawhaus](https://drawhaus.notdefined.dev) |

**60+ exercises** across 10 categories: backend, frontend, architecture, security, DevOps, SQL, design patterns, algorithms, testing, and process. Each exercise has 2 sensei variations with distinct evaluation perspectives.

---

## Features

| Feature | Description |
|---|---|
| **Courses** | Public learning paths at `/learn` — step-by-step exercises with instant feedback. TypeScript and SQL Deep Cuts run via Piston; JavaScript DOM exercises run in a browser iframe sandbox. Public courses (e.g. SQL Deep Cuts) can be followed without an account — progress persists in `localStorage` and merges into your account if you later sign in |
| **Code execution** | Code kata run in a Piston sandbox — the sensei sees real test results (pass/fail/compile error), not just your code |
| **Interest selection** | Set your level (junior/mid/senior), pick topics of interest, control randomness — the dojo adapts to you |
| **Kata feedback** | Optional micro-feedback after each kata (clarity, timing, evaluation fairness) — signals feed back into exercise quality |
| **Public share** | Share your verdict via `/share/:id` — public page with sensei quote, exercise info, and OG image for social previews |
| **Admin review** | Aggregated feedback per exercise and variation, admin notes, exercise versioning, archive lifecycle |
| **Leaderboard** | Monthly and all-time rankings by consistency |
| **Badges** | 10 achievement badges across practice, consistency, and mastery categories |
| **Responsive** | Mobile-first with sidebar (desktop) and bottom nav (mobile) |
| **Error reporting** | Every unhandled error fans out to three sinks (console, Postgres, Sentry) via the `ErrorReporterPort` — see [docs/adr/017-error-reporting-port.md](docs/adr/017-error-reporting-port.md). Sentry is opt-in; without a DSN the Postgres + console fallback still captures everything, visible at `/admin/errors` |

---

## Observability

Set the Sentry env vars below to enable the primary sink. Leave them empty and the Console + Postgres fallback captures everything regardless.

```env
# API (@sentry/node)
SENTRY_DSN=                  # https://xxx.ingest.sentry.io/yyy
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0  # 0..1 — keep at 0 until tracing is used
SENTRY_RELEASE=              # usually the deploy's git SHA

# Web (@sentry/react)
VITE_SENTRY_DSN=
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=

# Source map upload (build-time only, web)
SENTRY_AUTH_TOKEN=           # token with project:releases scope
SENTRY_ORG=
SENTRY_PROJECT=
```

All three source-map vars must be set together for upload to activate; missing any one of them is a no-op. Errors logged in Postgres are listed at `/admin/errors` with filters for source (api/web) and HTTP status.

---

## Why self-host?

Your data stays on your server. Your kata history, your verdicts, your progression — none of it goes to a third party. `docker compose up` is all it takes to run a full instance. See `docs/ARCHITECTURE.md` for the full system design and `SECURITY.md` for self-hosting recommendations.

---

## Honor Code

The dojo does not enforce rules technically. It trusts you.

- No AI during the exercise — debrief with AI after
- No skipping exercises you find uncomfortable
- The timer runs. You submit what you have.

If you cheat yourself here, you cheat yourself everywhere.

---

## Documentation

| Document | Purpose |
|---|---|
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
