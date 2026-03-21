# Foundation Setup — Overview

Everything needed to go from the current scaffold to a working, tested, deployable base. No feature code — only the foundation the kata loop will be built on.

**Goal:** After all 8 phases, a single developer can clone the repo, run `docker compose up`, and have a running API with correct architecture, tests passing, and CI green.

---

## Phase Map

| # | Spec | Expert(s) | Status |
|---|---|---|---|
| 1 | [Tooling](./001-tooling.md) — ESLint, Vitest, env validation | Tomás, Hiroshi, Marta | pending |
| 2 | [DDD Scaffold](./002-ddd-scaffold.md) — Domain, Application, Infrastructure layers | Darius, Tomás | pending |
| 3 | [Database](./003-database.md) — Drizzle ORM, schema, migrations, repositories | Tomás | pending |
| 4 | [Production Docker](./004-docker-production.md) — Dockerfiles, docker-compose.yml | Tomás | pending |
| 5 | [Security Middleware](./005-security-middleware.md) — Rate limiting, Zod validation | Marta | pending |
| 6 | [GitHub OAuth](./006-github-oauth.md) — OAuth routes, session cookies, auth middleware | Marta, Tomás | pending |
| 7 | [CI](./007-ci.md) — GitHub Actions pipeline | Hiroshi | pending |
| 8 | [Shared Package](./008-shared-package.md) — DTO boundary, package audit | Darius, Priya | pending |

---

## Dependency Order

```
[1] Tooling (ESLint + Vitest + env validation)
      │
      ▼
[2] DDD Scaffold (domain → application → infrastructure layers)
      │
      ├──────────────────────┐
      ▼                      ▼
[3] Database           [8] Shared Package audit
(Drizzle, migrations,       (can run after phase 2)
 repositories)
      │
      ├──────────────────────┐
      ▼                      ▼
[4] Production Docker  [5] Security Middleware
      │                      │
      └──────────┬───────────┘
                 ▼
          [6] GitHub OAuth
                 │
      ┌──────────┴──────────┐
      ▼                     ▼
  (done)             [7] CI pipeline
```

Phases 4 and 5 can run in parallel after Phase 3.
Phase 7 (CI) can be written at any point — it validates whatever tests exist at the time.

---

## Technology Decisions (locked)

These are not open for debate per-spec. If a decision needs to change, open an ADR.

| Concern | Decision | Reason |
|---|---|---|
| Test runner | Vitest `^2` | Native ESM, same config as Vite, no transform setup |
| Coverage | `@vitest/coverage-istanbul` | Per-file branch coverage for domain layer enforcement |
| Linting | ESLint 9 flat config | Current standard, `import/no-cycle` enforces layer boundaries |
| ORM | Drizzle ORM `^0.38` | TypeScript-first, SQL migrations, no runtime overhead |
| DB driver | `postgres` npm package | ESM-native, better than `pg` for this stack |
| OAuth client | `arctic ^2` | Hono-native, handles state + PKCE, no Passport dependency |
| Rate limiting | `@hono/rate-limiter ^0.4` | Official Hono middleware, pluggable store |
| Event bus | `InMemoryEventBus` (custom) | In-process, synchronous, zero dependencies for Phase 0 |
| Sessions | DB-stored tokens (`user_sessions` table) | JWTs can't be revoked |
| Container | Manual wiring in `container.ts` | No DI framework, composition root pattern |

---

## Folder Structure (end state after all phases)

```
apps/api/src/
  config.ts                     ← env validation (Phase 1)
  index.ts                      ← entrypoint (Phase 2)
  domain/
    shared/
      types.ts                  ← branded ID types, DomainEvent base
      errors.ts                 ← DomainError base + domain-specific errors
      events.ts                 ← DomainEvent interface
    practice/
      session.ts                ← Session aggregate root
      attempt.ts                ← Attempt entity
      values.ts                 ← SessionStatus, Verdict, EvaluationResult VOs
      ports.ts                  ← SessionRepositoryPort, LLMPort, EventBusPort
      events.ts                 ← SessionCreated, AttemptSubmitted, SessionCompleted, SessionFailed
    content/
      exercise.ts               ← Exercise aggregate root
      values.ts                 ← Difficulty, ExerciseType, ExerciseStatus
      ports.ts                  ← ExerciseRepositoryPort
      events.ts                 ← ExercisePublished
    identity/
      user.ts                   ← User entity
      ports.ts                  ← UserRepositoryPort
    recognition/
      ports.ts                  ← (empty Phase 0)
      events.ts                 ← BadgeEarned
  application/
    practice/
      StartSession.ts
      SubmitAttempt.ts
      GetExerciseOptions.ts
    identity/
      UpsertUser.ts
  infrastructure/
    container.ts                ← composition root
    events/
      InMemoryEventBus.ts
    http/
      router.ts
      middleware/
        rateLimiter.ts          ← Phase 5
        auth.ts                 ← Phase 6
      routes/
        health.ts
        sessions.ts
        exercises.ts
        auth.ts                 ← Phase 6
      websocket/
        evaluation.ts           ← Phase 0 (later)
      validation.ts             ← Phase 5
    llm/
      AnthropicStreamAdapter.ts
      MockLLMAdapter.ts
    persistence/
      drizzle/
        schema.ts               ← Phase 3
        client.ts               ← Phase 3
        migrations/             ← Phase 3
      PostgresSessionRepository.ts    ← Phase 3
      PostgresExerciseRepository.ts   ← Phase 3
      PostgresUserRepository.ts       ← Phase 3
  test/
    setup.ts

apps/web/src/
  (unchanged in these phases)

packages/shared/src/
  types.ts                      ← DTOs only (annotated in Phase 8)
  schemas.ts                    ← Zod schemas for wire format
  index.ts

.github/workflows/
  ci.yml                        ← Phase 7

docs/
  adr/                          ← (to be populated as decisions are made)
  specs/
    000-foundation-overview.md  ← this file
    001-tooling.md
    002-ddd-scaffold.md
    003-database.md
    004-docker-production.md
    005-security-middleware.md
    006-github-oauth.md
    007-ci.md
    008-shared-package.md

docker-compose.yml              ← Phase 4 (production)
apps/api/Dockerfile             ← Phase 4
apps/web/Dockerfile             ← Phase 4
apps/web/nginx.conf             ← Phase 4
apps/api/drizzle.config.ts      ← Phase 3
```

---

## Definition of Done (foundation complete)

- [ ] `pnpm lint` passes across all workspaces
- [ ] `pnpm typecheck` passes across all workspaces
- [ ] `pnpm test --filter=api` passes with coverage ≥ 80% on `domain/`
- [ ] `docker compose up` starts API + web + db locally
- [ ] `POST /auth/github` redirects to GitHub
- [ ] `GET /health` returns 200
- [ ] GitHub Actions CI is green on a PR against `main`
- [ ] No domain file imports from `infrastructure/`
- [ ] All env vars validated at startup with clear error messages
