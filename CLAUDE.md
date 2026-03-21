# Claude Code — Project Instructions

Read [AGENTS.md](AGENTS.md) first. All agent behavior, identity, expert panel routing, and working rules are defined there.

---

## Project Conventions

- **Language:** The user communicates in Spanish. Respond in Spanish unless code or docs are in English.
- **Commits:** Do not add co-author lines unless explicitly asked.
- **Monorepo:** Turborepo — `apps/web` (React+Vite), `apps/api` (Hono+Node.js), `packages/shared` (types + Zod schemas).
- **Validation:** Use Zod schemas for all API route input validation.
- **Auth:** GitHub OAuth — review auth middleware on any new route or WebSocket handler.
- **LLM:** Streaming endpoint — any change to the sensei flow needs Yemi Okafor's lens (see `docs/EXPERTS.md`).

---

## Commands

```bash
pnpm dev                    # Start web + api in watch mode
pnpm build                  # Build all workspaces
pnpm lint                   # Lint all workspaces
pnpm typecheck              # Type-check all workspaces
pnpm test --filter=api      # Run API unit tests
pnpm test --filter=e2e      # Run E2E tests (when they exist)
```

---

## Documentation Sync

When making changes that affect behavior, update docs in the same commit:

| Change | Update |
|---|---|
| New/changed API endpoint | `README.md` |
| New/changed env var | `README.md` + `.env.example` |
| New feature shipped | `CHANGELOG.md` |
| Completed roadmap item | `docs/ROADMAP.md` |
| Architectural decision | `docs/adr/NNN-title.md` |
