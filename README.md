# dojo

> The dojo for developers who still have something to prove. To themselves.

**dojo** is a practice platform for developers who want to maintain technical agency in a world where the pressure is to delegate everything to AI. It's not another LeetCode — it's a gym for the skills that atrophy when you stop using them: reading code, reasoning under pressure, designing systems, making decisions.

Live at [dojo.notdefined.dev](https://dojo.notdefined.dev)

---

## What it is

You enter the dojo. You get 3 kata. No skip, no reroll. You pick one and work through it — a code refactor, a system design, a technical discussion. A sensei (an LLM with a specific role and expertise) evaluates your work in real time. Not with praise, not with the answer — with honest feedback on what you did and what you missed.

That's it. Daily practice. No shortcuts.

## What it isn't

- Not a certification platform
- Not a competitive leaderboard
- Not a tool that holds your hand
- Not something that replaces AI — it's something that keeps you sharp enough to use AI well

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Hono + Node.js |
| Database | PostgreSQL |
| Realtime | WebSockets (sensei streams responses) |
| Auth | GitHub OAuth |
| LLM | Any OpenAI-compatible endpoint |
| Infra | Docker + Kamal on Hetzner VPS |

### LLM Provider

Dojo works with any OpenAI-compatible API endpoint:

```env
LLM_BASE_URL=https://api.anthropic.com   # or your own endpoint
LLM_API_KEY=your_key_here
LLM_MODEL=claude-sonnet-4-20250514
```

---

## Monorepo Structure

```
dojo/
  apps/
    web/          # React + Vite frontend
    api/          # Hono + Node.js backend
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

The web app runs at `http://localhost:5173`, the API at `http://localhost:3001`.

### Commands

```bash
pnpm dev                    # Start web + api in watch mode
pnpm build                  # Build all workspaces
pnpm lint                   # Lint all workspaces
pnpm typecheck              # Type-check all workspaces
pnpm test --filter=api      # Run API unit tests
```

---

## Exercise Types

| Type | Description |
|---|---|
| `code` | Refactor, debug, review, or complete code in any language |
| `chat` | Technical roleplay — respond to a scenario as you would in real life |
| `whiteboard` | System design and architecture using [Drawhaus](https://drawhaus.notdefined.dev) |

---

## Honor Code

The dojo doesn't enforce rules technically. It trusts you.

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
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Ecosystem, data model, key design decisions |
| [docs/BRANDING.md](docs/BRANDING.md) | Colors, typography, voice, UI components |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Build cycle, conventions, definition of done |
| [docs/EXPERTS.md](docs/EXPERTS.md) | Virtual advisory panel |
| [docs/IDENTITY.md](docs/IDENTITY.md) | Primary build persona |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |
| [AGENTS.md](AGENTS.md) | AI agent behavior and working rules |

---

## Related Projects

- [Drawhaus](https://drawhaus.notdefined.dev) — Excalidraw-based whiteboard with MCP integration, used for whiteboard kata
- [SheLLM](https://github.com/rodacato/SheLLM) — Turn your LLM CLI subscriptions into a REST API (optional LLM proxy)

---

## License

[MIT](LICENSE.md)
