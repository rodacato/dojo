# Contributing to Dojo

Dojo is a personal practice platform built in the open. Contributions are welcome — but the bar is intentional. Every addition should make the kata loop better, not just bigger.

If you are reading this, you probably understand the problem Dojo is trying to solve. That shared context is the best starting point.

---

## Good First Issues

Look for issues labeled `good first issue` on GitHub. These are scoped, self-contained, and come with clear acceptance criteria. They are a good way to get familiar with the codebase before proposing something larger.

If you have found a bug or have an idea that is not captured in an issue yet, open one before writing code. A brief description of what you want to do and why is enough. This avoids wasted effort on changes that do not align with the project's current phase.

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
# fill in your values — see README.md for descriptions
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
test/short-description
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
pnpm lint               # must pass
pnpm typecheck          # must pass
pnpm test --filter=api  # must pass
```

One feature or fix per PR. Keep changes small and reviewable.

---

## Code Style

The project follows a layered architecture — Domain → Application → Infrastructure. Keep each layer's concerns separate.

- **TypeScript throughout** — no `any` without a comment explaining why
- **Zod schemas** for all API route input validation
- **Hono routes are thin adapters** — parse request, call use case, return response; no business logic in routes
- **Domain logic in aggregates** — business rules live in `Session`, `Exercise`, and their value objects
- **No new dependencies without a clear reason** — check if something in `packages/shared` already covers it

For architectural changes, open an Issue first and follow the ADR format described in `docs/WORKFLOW.md`. New ports or adapters are architectural decisions.

---

## Testing

### The key rule for LLM-dependent code

Never call a real LLM in tests. Mock at the port boundary using `MockLLMAdapter`, which returns deterministic `EvaluationResult` objects. This keeps tests fast, free, and reproducible.

You cannot assert the sensei says exactly X. You can assert the structural contract:
- `verdict` is one of the three valid values
- `analysis` is a non-empty string
- `topicsToReview` is non-empty when verdict is not `"passed"`

### By layer

| Layer | Test type |
|---|---|
| Domain (aggregates, value objects) | Unit — pure functions, no dependencies |
| Application (use cases) | Unit — mock all ports |
| Infrastructure (routes, repos) | Integration — real DB, mock LLM |

---

## Reporting Bugs

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs. actual behavior
- Node.js version, OS, browser (if frontend)
- Relevant logs or error messages

---

## Exercise Contributions

This is the highest-leverage contribution you can make — and the hardest bar to clear. A bad exercise wastes someone's limited practice time. That is the one failure mode Dojo cannot afford.

To propose a new kata:

1. Open a GitHub Issue with the exercise draft:
   - `title` — what the exercise is called
   - `description` — what the user sees before starting
   - `type` — `code`, `chat`, or `whiteboard`
   - `difficulty` — `easy`, `medium`, or `hard`
   - `language` — `["typescript"]`, `["ruby", "python"]`, or `["agnostic"]`
   - `ownerRole` — how the sensei should present itself (e.g., "Senior DBA with 12 years in PostgreSQL")
   - `ownerContext` — the technical briefing for the sensei LLM (not shown to the user)
   - A sample user response and what the sensei should catch

2. The review asks one question: **does this leave the developer better than it found them, even if they fail?** If the answer is yes, it moves forward. If not, feedback will be specific.

3. After review, accepted exercises are published by the maintainer. Contributors are credited in the exercise metadata (Phase 3+).

**Review timeline:** expect feedback within 1–2 weeks. This is a personal project maintained alongside other work.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE.md).
