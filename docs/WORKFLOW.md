# Dojo — Workflow & Documentation Guide

## Philosophy

Documentation is the foundation, not an afterthought. Before writing a line of code, the intention lives in a document. Before merging, the docs reflect the reality. This is not bureaucracy — it is the difference between a project that grows coherently and one that accumulates confusion.

The build cycle is:

```
Idea → Roadmap → Spec (optional) → Implement → Test → Release
                    ↓
              ADR (when an architectural decision is involved)
```

---

## Documentation Map

| Document | Location | Purpose |
|---|---|---|
| `CLAUDE.md` | `/CLAUDE.md` | Agent instructions, commands, project conventions |
| `AGENTS.md` | `/AGENTS.md` | AI agent behavior, identity, expert panel routing |
| `docs/VISION.md` | `docs/VISION.md` | Why Dojo exists, philosophy, who it's for |
| `docs/IDENTITY.md` | `docs/IDENTITY.md` | Primary build persona — decision style and defaults |
| `docs/EXPERTS.md` | `docs/EXPERTS.md` | Virtual advisory panel — 6 specialist personas |
| `docs/ROADMAP.md` | `docs/ROADMAP.md` | What's shipped, what's next, what's out of scope |
| `docs/BRANDING.md` | `docs/BRANDING.md` | Colors, typography, voice, microcopy, UI components |
| `docs/ARCHITECTURE.md` | `docs/ARCHITECTURE.md` | Ecosystem, data model, key design decisions |
| `CONTRIBUTING.md` | `/CONTRIBUTING.md` | How to set up, branch, commit, and open a PR |
| `SECURITY.md` | `/SECURITY.md` | Vulnerability reporting, scope, response timeline |
| `LICENSE.md` | `/LICENSE.md` | MIT License |

---

## Build Cycle in Detail

### 1. Idea
Something new or something broken. Capture it. If it can be described in one sentence and takes less than 2 hours, create a GitHub Issue directly. If it is bigger, start with the Roadmap.

### 2. Roadmap
Every new feature or phase change is reflected in `docs/ROADMAP.md` before it is built. The Roadmap has the final word on scope. If a feature is not there, it is not being built yet.

### 3. Spec (for non-trivial features)
A short spec lives in `docs/specs/` as a Markdown file. It answers:
- What is being built and why?
- What does "done" look like?
- What is explicitly out of scope for this version?

No spec template required — keep it as short as it needs to be and no shorter.

### 4. ADR (for architectural decisions)
Any decision that changes how the system is structured — database schema, a new package, switching a library, choosing a deployment strategy — gets an ADR. ADRs are never deleted. Superseded ones are marked as such.

**ADR format:**

```markdown
# ADR-NNN: Title
**Status:** accepted | superseded | deprecated
**Date:** YYYY-MM-DD

## Context
What situation forced this decision?

## Decision
What was decided and why?

## Alternatives Considered
What else was evaluated and why it was not chosen?

## Consequences
What does this decision make easier? Harder? What is the repayment path if this turns out to be wrong?
```

ADRs live in `docs/adr/`. Filename: `NNN-short-title.md` (e.g., `001-websocket-for-sensei-streaming.md`).

### 5. Implement
Small, reviewable, reversible changes. One feature or fix per PR. If a change requires touching more than 3 unrelated areas of the codebase, consider splitting it.

### 6. Test
- Backend unit tests run with `pnpm test --filter=api`
- E2E tests (when they exist) run with `pnpm test --filter=e2e`
- Type-check all workspaces: `pnpm typecheck`
- Lint: `pnpm lint`

### 7. Release
On merge to `main`, update `CHANGELOG.md`. Mark completed Roadmap items as done.

---

## Commit Convention

Follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When to use |
|---|---|
| `feat:` | New user-facing feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `chore:` | Tooling, dependencies, config |
| `refactor:` | Code change with no behavior change |
| `test:` | Adding or fixing tests |
| `release:` | Version bump and changelog entry |

Examples:
```
feat: stream sensei evaluation via websocket
fix: session body not persisted on exercise start
docs: add ADR for authentication strategy
chore: upgrade hono to 4.x
```

---

## Documentation Sync Rules

When making changes that affect behavior, update the corresponding docs in the same commit or PR:

| If you change... | Update... |
|---|---|
| New or changed API endpoint | `README.md` stack/commands section |
| New or changed env var | `README.md` + `.env.example` |
| New feature shipped | `CHANGELOG.md` under current version |
| Completed roadmap item | Mark done in `docs/ROADMAP.md` |
| Architectural decision | Add ADR in `docs/adr/` |
| New exercise type | `README.md` exercise types table |
| Auth or security change | `SECURITY.md` if scope changes |

---

## Branching

- `main` — production. Protected. Nothing goes here without a PR.
- `dev` — integration branch for Phase 0 while the creator is the only user. Merge to `main` on each stable increment.
- Feature branches: `feat/short-description`, `fix/short-description`, `docs/short-description`

---

## Definition of Done

A task is done when:
- [ ] The feature works end-to-end in dev
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Relevant tests pass
- [ ] Docs updated if behavior changed
- [ ] No known auth or security regression
- [ ] Roadmap item marked as complete if applicable
- [ ] Next task captured in a GitHub Issue if applicable
