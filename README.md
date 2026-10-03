# dojo

> The dojo for developers who still have something to prove. To themselves.

[![CI](https://github.com/rodacato/dojo/actions/workflows/ci.yml/badge.svg)](https://github.com/rodacato/dojo/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-4-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A524-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md)

A self-hosted, open-source practice space for developers. Vibe coding is making developers faster and their instincts weaker. Dojo is the counter-practice: a place where you think for yourself, work through discomfort, and submit something imperfect. No AI during the kata. The timer runs. The sensei tells you the truth.

It is not a certification platform, and it is not a leaderboard. It is a daily practice for developers who want to stay technically alive — and, once scrolls return as external apps, a place to learn as much as a place to be tested.

**There is no hosted service to sign up for — you run your own**, for yourself, your friends, or your team.

> **Status:** dojo started as a private, invite-only practice space and is being reshaped into a self-hosted open-source project. The kata loop works today; scrolls are being rebuilt as external apps (see below), and the self-host story still has rough edges. Reference instance: [dojo.notdefined.dev](https://dojo.notdefined.dev) · Project site: [rodacato.github.io/dojo](https://rodacato.github.io/dojo/)

---

## Run your own

- **Your data, your server.** Kata history, verdicts and progression never leave your box.
- **Your keys.** Bring any streaming LLM endpoint — Anthropic, OpenAI, or a compatible proxy. Evaluation cost is yours: API credits, or your own subscription through a proxy.
- **Your network.** Public, VPN-gated, or on a laptop — deploy it wherever you want.

```bash
# needs Docker and a GitHub OAuth app
git clone https://github.com/rodacato/dojo
cd dojo
cp .env.example .env    # set the GitHub OAuth values
docker compose up --build
```

The sensei defaults to `mock`, so no LLM key is needed to try it. The full guide — all run paths, GitHub sign-in setup, first-run check, troubleshooting — is [GETTING_STARTED.md](GETTING_STARTED.md).

| Next | Where |
|---|---|
| Deploy to a server with Kamal | [docs/ops/deploy.md](docs/ops/deploy.md) |
| Upgrade, roll back, back up, rotate secrets | [docs/ops/runbook.md](docs/ops/runbook.md) |
| Monitoring, metrics, recovery | [docs/ops/observability.md](docs/ops/observability.md) |
| Securing your instance | [SECURITY.md](SECURITY.md) |

### Connect a real sensei

```env
LLM_ADAPTER_FORMAT=anthropic      # mock | anthropic | openai
LLM_BASE_URL=https://api.anthropic.com
LLM_API_KEY=your_key_here
LLM_MODEL=claude-opus-4-6
```

To run the sensei on your own Claude or ChatGPT subscription instead of API credits, see [docs/ops/shellm.md](docs/ops/shellm.md).

### Who can sign in

Sign-up is by invitation, and the invitations belong to whoever runs the instance — not to the dojo project. That operator sets `CREATOR_GITHUB_ID` to their own numeric GitHub id: that account signs in without an invitation, is the only one with `/admin`, and issues invitation links from `/admin/invitations`. Everyone else needs one of those links; once in, returning users are always allowed.

Leave `CREATOR_GITHUB_ID` empty and nobody new can sign up. Anonymous visitors can still use the Engawa playground.

### Scrolls

A scroll is an independent web app, hosted anywhere, embedded in Dojo by iframe. Dojo is the host: it registers scrolls, frames them and talks to them over a versioned `postMessage` protocol ([`docs/scrolls/PROTOCOL.md`](docs/scrolls/PROTOCOL.md), [authoring guide](docs/scrolls/AUTHORING.md)). The protocol is v0 and experimental. Progress is not stored on the server yet, and code execution is not offered to scrolls yet — follow [epic #116](https://github.com/rodacato/dojo/issues/116).

The creator registers a scroll at `/admin/scrolls` by pasting its `scroll.json`. The scroll's `entry` must be an absolute `https` URL whose origin you have allowed:

`SCROLL_FRAME_ORIGINS` is a list of exact origins (no wildcards, no paths), separated by spaces or commas, for example `SCROLL_FRAME_ORIGINS="https://scrolls.example.com"`. Empty allows none. Both containers read it: the API refuses to register a scroll outside the list, and the web container writes it into the CSP `frame-src` at start, so changing it needs a redeploy. `http://localhost` is accepted outside production for development.

| Endpoint | Access |
|---|---|
| `GET /scrolls` | Published public scrolls; also private ones when signed in |
| `GET /scrolls/:slug` | One scroll. 404 for a draft or unknown slug, 401 for a private one when anonymous |
| `GET /admin/scrolls`, `POST /admin/scrolls` | Creator only: list all, register |
| `PATCH /admin/scrolls/:id`, `DELETE /admin/scrolls/:id` | Creator only: update, delete |

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

### Kata types

| Type | Description |
|---|---|
| `code` | Refactor, debug, review, or complete code in a split-panel editor |
| `chat` | Technical roleplay — respond to a scenario as you would in real life |
| `whiteboard` _(planned)_ | System design and architecture via [Drawhaus](https://drawhaus.notdefined.dev) — designed, not yet built (exists as a kata type; no execution path yet) |

**60+ katas** across 10 categories: backend, frontend, architecture, security, DevOps, SQL, design patterns, algorithms, testing, and process. Each kata has 2 sensei variations with distinct evaluation perspectives.

### Honor code

The dojo does not enforce rules technically. It trusts you.

- No AI during the kata — debrief with AI after
- No skipping katas you find uncomfortable
- The timer runs. You submit what you have.

If you cheat yourself here, you cheat yourself everywhere.

---

## Features

| Feature | Description |
|---|---|
| **Scrolls** | Being rebuilt as external apps embedded in Dojo — not available yet ([#116](https://github.com/rodacato/dojo/issues/116)) |
| **Code execution** | Code kata run in a Piston sandbox — the sensei sees real test results (pass/fail/compile error), not just your code |
| **Interest selection** | Set your level (junior/mid/senior), pick topics of interest, control randomness — the dojo adapts to you |
| **Kata feedback** | Optional micro-feedback after each kata (clarity, timing, evaluation fairness) — signals feed back into kata quality |
| **Public share** | Share your verdict via `/share/:id` — public page with sensei quote, kata info, and OG image for social previews |
| **Admin** | Aggregated feedback per kata and variation, admin notes, kata versioning, archive lifecycle, invitations |
| **Belts** | Computed rank (white / yellow / green / brown / black) at `/belts` — derived from completed kata count, distinct topic clusters touched, active days, and cooldown at previous rank. The sensei never influences advancement (see [ADR 020](docs/adr/020-ubiquitous-language-pass.md)) |
| **Milestones** | One-time recognitions earned at specific moments — first kata, polyglot, consistency streaks. Surfaced alongside the belt on `/belts` |
| **Engawa** | Anonymous code playground at `/engawa` — the porch between inside and outside. Try a snippet without signing in |
| **Kumite** _(soon)_ | Reserved route for the planned 1v1 sparring feature. Today it renders an honest "coming soon" panel |
| **Error view** | Every unhandled error lands in Postgres and is visible at `/admin/errors` — no external tracker required. Sentry is opt-in ([ADR 017](docs/adr/017-error-reporting-port.md)) |

### Operational endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Liveness |
| `GET /health/piston` | API ↔ Piston reachability |
| `GET /metrics` | Prometheus metrics — off unless `METRICS_ENABLED`, bearer-token guarded |
| `POST /cron/cleanup-errors` | Purge errors older than 30 days — `Authorization: Bearer ${CRON_SECRET}` |

Details in [docs/ops/observability.md](docs/ops/observability.md).

---

## Development

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Hono + Node.js |
| Database | PostgreSQL |
| Realtime | WebSockets (sensei streams token by token) |
| Auth | GitHub OAuth |
| Architecture | DDD + Hexagonal (Ports & Adapters) + Event-Driven |
| LLM | Any compatible streaming endpoint |
| Code execution | Piston (sandboxed, nsjail) |
| Deploy | Docker Compose, or Kamal to any VPS |
| E2E tests | Playwright |

```
dojo/
  apps/
    web/          # React + Vite frontend
    api/          # Hono + Node.js (domain / application / infrastructure)
  packages/
    shared/       # TypeScript types, Zod schemas
  site/           # Static project site (GitHub Pages)
  docker-compose.yml
  turbo.json
```

The fastest path to hacking on it is the Dev Container (`Reopen in Container` → `pnpm dev`).

```bash
pnpm dev                              # Start web + api in watch mode
pnpm build                            # Build all workspaces
pnpm lint                             # Lint all workspaces
pnpm typecheck                        # Type-check all workspaces
pnpm test --filter=api                # Run API unit + integration tests
```

Contributions are welcome — read [CONTRIBUTING.md](CONTRIBUTING.md) first; it says what fits the dojo and what does not.

---

## Documentation

| Document | Purpose |
|---|---|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Run dojo locally — all paths, sign-in setup, troubleshooting |
| [docs/ops/deploy.md](docs/ops/deploy.md) | Deploy runbook — Environment, first setup, promotion, hotfix |
| [docs/ops/observability.md](docs/ops/observability.md) | Error reporting, Prometheus metrics, Piston recovery |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting and self-hosting security |
| [RELEASING.md](RELEASING.md) | How a release is cut |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [docs/VISION.md](docs/VISION.md) | Why Dojo exists, philosophy, who it's for |
| [docs/ROADMAP.md](docs/ROADMAP.md) | What's shipped, what's next, what's out of scope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | DDD model, bounded contexts, ports, events |
| [docs/adr/](docs/adr/) | Architecture decision records |
| [docs/BRANDING.md](docs/BRANDING.md) | Colors, typography, voice, UI components |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Build cycle, testing strategy, definition of done |
| [AGENTS.md](AGENTS.md) | AI agent behavior and working rules |

---

## Related projects

- [Drawhaus](https://drawhaus.notdefined.dev) — Excalidraw-based whiteboard with MCP integration, used for whiteboard kata
- [SheLLM](https://github.com/rodacato/SheLLM) — Turn your LLM CLI subscriptions into a compatible REST API

---

## License

[MIT](LICENSE.md)
