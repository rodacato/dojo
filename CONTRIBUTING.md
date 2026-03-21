# Contributing to Dojo

Dojo is a personal practice platform. Contributions are welcome, but the bar is intentional — every addition should make the kata loop better, not just bigger.

---

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker + Docker Compose
- A GitHub OAuth App ([create one here](https://github.com/settings/applications/new))
- An LLM API key (Anthropic, OpenAI, or any compatible endpoint)

### Setup

```bash
git clone https://github.com/rodacato/dojo
cd dojo
cp .env.example .env
# fill in your values
pnpm install
pnpm dev
```

The web app runs at `http://localhost:5173`, the API at `http://localhost:3001`.

---

## Workflow

### Branching

Branch from `main`. Use the convention:

```
feat/short-description
fix/short-description
docs/short-description
```

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When |
|---|---|
| `feat:` | New user-facing feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Tooling, dependencies, config |
| `refactor:` | No behavior change |
| `test:` | Adding or fixing tests |

### Before Opening a PR

```bash
pnpm lint        # must pass
pnpm typecheck   # must pass
pnpm test --filter=api  # must pass
```

One feature or fix per PR. Keep changes small and reviewable.

---

## Reporting Bugs

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs. actual behavior
- OS, Node.js version, browser (if frontend)
- Relevant logs or screenshots

---

## Proposing Changes

For non-trivial changes, open an Issue before writing code. Describe what you want to build and why. This avoids wasted effort on changes that do not align with the project's direction.

For architectural changes, follow the ADR format described in `docs/WORKFLOW.md`.

---

## Code Style

- TypeScript throughout — no `any` without a comment explaining why
- Zod schemas for all API input validation
- Hono for API routes — follow the existing route structure in `apps/api`
- React + Vite for frontend — no class components
- No new dependencies without a clear reason — check if something in `packages/shared` already covers it

---

## Exercise Contributions

Kata quality is the hardest constraint. To propose a new exercise:

1. Open an Issue with the exercise draft (title, description, type, difficulty, `owner_role`, `owner_context`)
2. Include a sample response and what the sensei should catch
3. It will be reviewed against the quality bar: does it leave the user feeling they practiced or learned something, even if they failed?

Wasted time is the one failure mode Dojo cannot afford.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE.md).
