# Roadmap

This document is the project map: where it came from, where it is, and where it is going. No dates — this is a personal project. Each milestone is defined by what becomes possible, not by when.

Active work: [`docs/sprints/current.md`](sprints/current.md)
Ideas and next block: [`docs/sprints/backlog.md`](sprints/backlog.md)

---

## Milestones

| Milestone | Goal | Phase |
|---|---|---|
| **MVP** | The creator can complete a kata end-to-end in production without technical friction | Phase 0 — in progress |
| **Alpha** | 3–5 invited users complete kata consistently and come back | Phase 1 |
| **Beta** | Content scales beyond the creator — contributors propose exercises | Phase 3 |
| **Opening decision** | Evaluate whether to open to the public, waitlist, or stay invite-only | Phase 4 |

---

## Phases

### Phase 0 — The Empty Dojo *(in progress)*
**Goal:** One user (the creator) completes the full kata loop without technical friction, in production.

The core loop, nothing else. No social features, no leaderboard, no invitations. Pure dogfooding to validate that the practice itself is valuable before building anything around it.

### Phase 1 — Open the Doors
**Goal:** Invite friends. The dojo becomes social — profiles, invitations, share cards, first badges.

Does not start until Phase 0 is in real daily use.

### Phase 2 — The Scoreboard
**Goal:** Light gamification that motivates without corrupting the practice — leaderboard, full badge system, weak areas dashboard.

### Phase 3 — Feed the Dojo
**Goal:** Content creation scales beyond the creator — users propose exercises with an LLM QA gate and human review.

### Phase 4 — Evaluate Opening
**Goal:** Decision — open to the public, waitlist, or stay invite-only? This phase is a decision, not a build.

---

## History — Sprints

| Sprint | Outcome | Status |
|---|---|---|
| [sprint-001 — Technical foundation](sprints/archive/sprint-001-fundacion-tecnica.md) | Backend DDD + hexagonal, auth, DB, CI | ✅ Closed |
| [sprint-002 — Core loop](sprints/archive/sprint-002-core-loop.md) | HTTP routes, WebSocket, frontend screens, seed data | ✅ Closed |
| [sprint-003 — Production deploy](sprints/archive/sprint-003-production-deploy.md) | First deploy, landing page, UX states, bearer auth | ✅ Closed |

---

## History — Specs

| # | Spec | Description | Sprint |
|---|---|---|---|
| 000 | [Foundation overview](specs/000-foundation-overview.md) | Monorepo, Docker Compose dev, `/health`, logging, env validation | sprint-001 |
| 001 | [Tooling](specs/001-tooling.md) | Turborepo, ESLint, Vitest, TypeScript config | sprint-001 |
| 002 | [DDD scaffold](specs/002-ddd-scaffold.md) | Bounded contexts, aggregates, ports, domain events, MockLLMAdapter | sprint-001 |
| 003 | [Database](specs/003-database.md) | Drizzle ORM, 5 tables, migrations, 3 repository adapters | sprint-001 |
| 004 | [Docker production](specs/004-docker-production.md) | Multi-stage Dockerfiles, Nginx, production docker-compose.yml | sprint-001 |
| 005 | [Security middleware](specs/005-security-middleware.md) | Rate limiting (hono-rate-limiter), Zod validation helper, error handler | sprint-001 |
| 006 | [GitHub OAuth](specs/006-github-oauth.md) | arctic@2, server-side sessions, user_sessions in DB, requireAuth middleware | sprint-001 |
| 007 | [CI](specs/007-ci.md) | GitHub Actions — lint → typecheck → test on every PR to main | sprint-001 |
| 008 | [Shared package](specs/008-shared-package.md) | Annotated DTOs, Zod schemas, boundary rules documented | sprint-001 |
| 009 | [HTTP routes](specs/009-http-routes.md) | REST endpoints — sessions, exercises, dashboard, admin CRUD | sprint-002 |
| 010 | [WebSocket evaluation](specs/010-websocket-evaluation.md) | WS protocol for sensei streaming evaluation | sprint-002 |
| 011 | [Anthropic streaming adapter](specs/011-anthropic-streaming-adapter.md) | Claude integration — streaming, prompt templates, token limits | sprint-002 |
| 012 | [Seed data](specs/012-seed-data.md) | 16 hand-crafted kata with variations, seed script | sprint-002 |
| 013 | [Frontend core screens](specs/013-frontend-core-screens.md) | 8 user-facing screens + Tailwind 4 + CodeMirror | sprint-002 |
| 014 | [Admin UI](specs/014-admin-ui.md) | Exercise list, new exercise form, creator-only guard | sprint-002 |
| 015 | [Kamal deploy](specs/015-kamal-deploy.md) | Kamal 2 config for API + web containers | sprint-003 |
| 016 | [Production deploy](specs/016-production-deploy.md) | VPS + Cloudflare Tunnel + GitHub Actions CI/CD | sprint-003 |
| 017 | [UX improvements](specs/017-ux-improvements.md) | Error states, empty states, timer expired, 401 redirect | sprint-003 |
| 018 | [Landing page](specs/018-landing-page.md) | Static landing page with request access form (Phase 0) | sprint-003 |
| 019 | [Bearer token auth](specs/019-bearer-token-auth.md) | Replace cross-domain cookies with Authorization Bearer header | sprint-003 |

---

## History — PRDs

| # | PRD | Description | Status |
|---|---|---|---|
| 000 | [Template](prd/000-template.md) | Template for exploratory PRDs | 📋 Template |
| 001 | [Frontend features & data model](prd/001-frontend-features-data-model.md) | Feature inventory from all screens, data model gaps by phase | 🔍 Exploring |
| 002 | [API design](prd/002-api-design.md) | Endpoints, auth flow, roles, request/response contracts, WS protocol | 🔍 Exploring |
| 003 | [Implementation phasing](prd/003-implementation-phasing.md) | Build order by value — critical path for first usable state | 🔍 Exploring |
| 004 | [Local dev strategy](prd/004-local-dev-strategy.md) | What to mock vs real, enhanced MockLLMAdapter, dev workflow | 🔍 Exploring |
| 005 | [Expert panel review](prd/005-expert-panel-review.md) | Full panel validation — gaps, adjustments, what was missed | 🔍 Exploring |
| 006 | [Seed kata drafts](prd/006-seed-kata-drafts.md) | 8 hand-crafted kata (4 CODE, 3 CHAT, 1 WHITEBOARD), 2 variations each | 📝 Draft |
| 007 | [Sprint-002 readiness](prd/007-sprint-002-readiness.md) | Consolidated decisions, resolved questions, spec outline for sprint-002 | ✅ Confirmed |
| 008 | [Kata batch 2](prd/008-kata-batch-2.md) | 12 kata — security, testing, database performance, API design | 📝 Draft |
| 009 | [Kata batch 3](prd/009-kata-batch-3.md) | 12 kata — communication, debugging, performance, architecture | 📝 Draft |
| 010 | [Kata batch 4](prd/010-kata-batch-4.md) | 12 kata — operations, frontend, team dynamics, refactoring | 📝 Draft |
| 011 | [Kata feedback system](prd/011-kata-feedback-system.md) | Structured exercise quality signal — clarity, timing, evaluation fairness | 🔍 Exploring |
| 012 | [Sensei system prompts](prd/012-sensei-system-prompts.md) | 3 prompt variations for testing before wiring WebSocket | 📝 Draft |
| 013 | [UX/UI gap analysis](prd/013-ux-gap-analysis.md) | Missing states, mobile layouts, edge cases — screen by screen | 🔍 Exploring |
| 014 | [Landing page copy](prd/014-landing-page-copy.md) | Hero, problem statement, how it works, access section | 📝 Draft |
| 015 | [Bearer token auth](prd/015-bearer-token-auth.md) | Replace cross-domain cookies with Bearer tokens | ✅ Advancing to spec |

---

## History — ADRs

| # | ADR | Decision | Status |
|---|---|---|---|
| 001 | [WebSocket vs SSE](adr/001-websocket-vs-sse.md) | WebSocket for bidirectional evaluation streaming | ✅ Accepted |
| 002 | [Server-side sessions](adr/002-server-side-sessions.md) | DB-backed sessions over stateless JWTs | ✅ Accepted |
| 003 | [InMemoryEventBus](adr/003-inmemory-event-bus.md) | In-process event bus; upgrade to Redis when cross-process needed | ✅ Accepted |
| 004 | [CodeMirror 6](adr/004-codemirror-6.md) | CodeMirror 6 over Monaco (too heavy) or plain textarea (too primitive) | ✅ Accepted |
| 005 | [Creator auth env var](adr/005-creator-auth-env-var.md) | `CREATOR_GITHUB_ID` env var in Phase 0; DB column in Phase 1 | ✅ Accepted |
| 006 | [Mood/duration not persisted](adr/006-mood-duration-not-persisted.md) | Transient query params only — no mood history tracking | ✅ Accepted |
| 007 | [Bearer token over cookies](adr/007-bearer-token-over-cookies.md) | Bearer header replaces cross-domain cookies; server-side sessions unchanged | ✅ Accepted |

---

## Principles That Guide Prioritization

1. **Use it before building around it.** No feature is built until the previous phase is in real daily use.
2. **The loop comes first.** The kata → evaluation → analysis is the product. Everything else is context.
3. **Complexity is the enemy.** If a feature requires the user to think about the product instead of the practice, it is probably wrong.
4. **The sensei's honesty is sacred.** No feature that softens, gamifies, or incentivizes the evaluator to be kinder than it should be.
