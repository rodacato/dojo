# ADR-010: No API versioning in Phase 0

**Status:** Accepted (Phase 0)
**Date:** 2026-03-21
**Deciders:** Tomás Ríos (API design)

---

## Context

When designing the HTTP API for Phase 0, a decision was needed on whether to version the API from the start (e.g., `GET /api/v1/exercises`) or to use unversioned routes (e.g., `GET /exercises`).

Arguments for versioning from day 1:
- Conventional in REST API design
- Easier to add v2 later without breaking v1 consumers
- Signals that the API is stable and has a contract

Arguments against:
- Phase 0 has exactly one consumer: the `apps/web` frontend
- Both the frontend and the API are in the same monorepo, controlled by the same developer
- There are no external consumers, partner integrations, or public API contracts
- Adding `v1` prefix to every route adds friction without benefit

---

## Decision

**No API versioning in Phase 0. Routes are mounted at `/` (via Hono's router).**

---

## Rationale

API versioning is a tool for managing **consumer diversity**: when multiple consumers depend on the same API at different points in time, versioning lets the server support multiple contracts simultaneously.

Phase 0 has no consumer diversity. The frontend and API are deployed together, from the same CI pipeline, to the same environment. A breaking API change means updating two files in the same repo and deploying once.

Adding `v1` to every route in Phase 0 would mean:
- Every route: `GET /api/v1/exercises`, `POST /api/v1/sessions`, etc.
- Every fetch call in the frontend: `fetch('/api/v1/exercises')`
- Zero practical benefit, as no v2 exists or is planned

This is premature abstraction — adding a layer of indirection for a problem that doesn't exist.

---

## Migration path when versioning is needed

If Phase 1 introduces external consumers or a public API:

```typescript
// Before (Phase 0)
app.route('/', practiceRoutes)

// After (Phase 1)
const v1 = new Hono()
v1.route('/', practiceRoutes)
app.route('/api/v1', v1)

// Keep unversioned routes for the frontend (or update the frontend)
app.route('/', practiceRoutes)
```

The change is localized to `router.ts`. No individual route handlers need to change. The frontend proxy can be updated to use `/api/v1` in one line (`vite.config.ts`).

---

## Consequences

- **Positive:** Routes are clean and short — no `v1` prefix noise
- **Positive:** No false promise of stability to non-existent external consumers
- **Negative:** If an external consumer is added in Phase 1, the unversioned routes become the "v0" contract and we need to decide whether to version them or leave them as-is
- **Trade-off accepted:** The migration path is trivial (one file, one `app.route` call). The cost of adding versioning now for no current benefit is higher than the cost of adding it later when actually needed.
