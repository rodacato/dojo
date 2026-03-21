# Sprint 001: Technical Foundation — Phase 0 Base

> **Backward fill** — this block retroactively documents work completed before the sprint system existed.

**Started:** 2026-02-01 *(estimated)*
**Closed:** 2026-03-21
**Phase:** Phase 0

**Expected outcome:** Backend structured with DDD + hexagonal architecture, working auth, connected database, running CI. The foundation to build the kata loop on top of.

---

## Completed

- [x] **Spec 000 — Foundation overview**: Monorepo with Turborepo, React+Vite (web), Hono+Node.js (api), packages/shared. Docker Compose for local dev. Unified pnpm scripts. `/health` endpoint, logging, env validation on startup.
- [x] **Spec 001 — Tooling**: Turborepo task graph, ESLint shared config, Vitest setup, TypeScript project references across workspaces.
- [x] **Spec 002 — DDD scaffold**: Bounded contexts (Practice, Content, Identity, Recognition). domain / application / infrastructure layers. Port interfaces (`LLMPort`, `SessionRepositoryPort`, `ExerciseRepositoryPort`, `EventBusPort`). Domain aggregates (`Session`, `Exercise`), value objects (`EvaluationResult`, `Verdict`), domain events. `MockLLMAdapter` and `InMemoryEventBus` for development and tests.
- [x] **Spec 003 — Database**: 5 tables (users, exercises, variations, sessions, attempts), relations, migrations. 3 repository adapters (`PostgresUserRepository`, `PostgresSessionRepository`, `PostgresExerciseRepository`). `findEligible` with 6-month exclusion window via raw SQL and `RANDOM() LIMIT 3`.
- [x] **Spec 004 — Docker production**: Multi-stage Dockerfiles for API (4 stages: base, deps, builder, runner) and web (2 stages: Vite builder, Nginx runner). Production `docker-compose.yml` with 3 services (api, web, db). Nginx with SPA routing, `/api/` and `/ws/` proxies, security headers, gzip.
- [x] **Spec 005 — Security middleware**: `hono-rate-limiter` with 3 limiters (global 200/15min, auth 10/15min, session 5/hr). `keyGenerator` with IP detection via `cf-connecting-ip`. `validate()` helper wrapping Zod `safeParse` with field errors. Centralized error handler mapping `DomainError` codes to HTTP statuses.
- [x] **Spec 006 — GitHub OAuth**: `arctic@2` for OAuth PKCE. `user_sessions` table in DB. Routes `/auth/github`, `/auth/github/callback`, `DELETE /auth/session`. `requireAuth` middleware validating session against DB with 30-day expiry. No JWTs, no stored access tokens.
- [x] **Spec 007 — CI**: Workflow at `.github/workflows/ci.yml`. Triggered on PR and push to main. Concurrency with cancel-in-progress. 10min timeout. Steps: checkout → pnpm setup → node setup → frozen install → typecheck → lint → test with all required env vars.
- [x] **Spec 008 — Shared package audit**: Full audit of `packages/shared`. DTOs annotated with boundary rules header. Zod schemas updated to match DTOs (including `exerciseFiltersSchema`). `index.ts` documented with what to import and from where.

---

## Retro

**What went well?**
- DDD + hexagonal architecture from day 0 prevented mixing business logic with infrastructure.
- `MockLLMAdapter` at the port level makes tests fast and deterministic from the start.
- `hono-rate-limiter` (not `@hono/rate-limiter`) is the correct package name — important to avoid future errors.
- Using an explicit `GITHUB_CALLBACK_URL` in config.ts instead of constructing it from `WEB_URL` was the right call for the Nginx `/api/` prefix.

**What slowed us down?**
- The correct rate limiting package name required a search — it is not `@hono/rate-limiter`.
- `ContentfulStatusCode` from Hono as the required type for `c.json()` is not obvious.
- The devcontainer database is named `dojo_dev`, not `dojo` — need to source `.env` before running migrations.

**What goes to the next block?**
- Anthropic streaming adapter (the real LLM)
- WebSocket evaluation flow
- HTTP routes for sessions and exercises
- Seed data (initial kata)
- Frontend with Tailwind 4
- Kamal deploy config
