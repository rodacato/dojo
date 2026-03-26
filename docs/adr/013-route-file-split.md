# ADR 013: Split practice.ts into domain-specific route files

**Status:** Accepted
**Date:** 2026-03-26
**Context:** Sprint 011 refactoring

## Decision

Split `apps/api/src/infrastructure/http/routes/practice.ts` (1,312 lines, 20+ endpoints) into 4 focused route files:

| File | Endpoints | Responsibility |
|---|---|---|
| `practice.ts` | auth, sessions, attempts, feedback, exercises, preferences, cron | Core practice loop |
| `dashboard.ts` | GET /dashboard, GET /history | Aggregated read views |
| `profile.ts` | GET /leaderboard, GET /u/:username | Public/social read views |
| `admin-exercises.ts` | All /admin/* endpoints | Creator-only management |

Each file exports its own Hono instance. `router.ts` mounts all of them.

## Why

- Single-responsibility: dashboard queries are distinct from session commands
- Testability: smaller files are easier to test in isolation
- Maintainability: 1,312 lines means any change risks merge conflicts and cognitive overload
- Piston integration (Part 5) will add more WS logic — the codebase needs breathing room first

## Consequences

- `router.ts` imports grow from 2 to 5 route files
- Shared helpers (verdict subquery, streak calculation) move to `query-helpers.ts`
- `adminRoutes` const moves from practice.ts to admin-exercises.ts
- No behavioral change — pure refactoring, all endpoints stay the same
