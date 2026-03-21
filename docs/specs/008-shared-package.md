# Spec 008 — Shared Package Boundary

**Experts:** Darius Osei (boundary definition), Priya Menon (scope discipline)
**Depends on:** Phase 2 (domain layer must exist — confirms what is domain-only vs. shared)
**Can run in parallel with:** Phase 4, 5, 6, 7

## What and Why

`packages/shared` currently has `types.ts` with domain-looking types (`Session`, `Exercise`, `Attempt`, etc.) and `schemas.ts` with their Zod schemas. The risk: these get treated as domain objects by the API while also being used as wire types by the frontend — a confusion that causes logic leaks over time.

This phase draws a hard line: **`packages/shared` contains only DTO types and Zod schemas for things that cross the API/frontend boundary over the network.** Domain aggregates live in `apps/api/src/domain/`.

Priya's constraint: don't over-engineer this for Phase 0. The types are close enough to wire types that a structural change is not needed — just a clear annotation and a clear rule.

## Scope

**In:** annotating existing files, adding DTO comment headers, establishing the rule, creating the naming convention
**Out:** renaming all types, creating a separate `dto.ts` file, changing any imports (defer until a concrete confusion actually occurs)

---

## What belongs in `packages/shared`

| Belongs | Does not belong |
|---|---|
| API response shapes (what the server sends over the wire) | Domain aggregate classes (`Session`, `Exercise`) |
| API request shapes (what the frontend sends) | Business rules and invariants |
| Zod schemas for validating API responses in the frontend | Domain error classes |
| Zod schemas for validating API request bodies in the API | Port interfaces (`LLMPort`, etc.) |
| TypeScript types derived from those schemas | Domain events |
| Shared enums used in both UI and API responses | Infrastructure types (Drizzle schema, DB rows) |

---

## File: `packages/shared/src/types.ts` (annotated)

Add a header block at the top:

```ts
/**
 * API Data Transfer Objects (DTOs)
 *
 * These are the shapes of data that cross the API/frontend boundary over HTTP.
 * They are NOT domain aggregates — domain logic lives in apps/api/src/domain/.
 *
 * Rules:
 * - Types here must match what the API serializes to JSON
 * - No methods, no invariants, no business logic
 * - All dates are ISO strings (not Date objects — JSON doesn't have Date)
 * - All IDs are plain strings (not branded types — branding is a compile-time API concern)
 *
 * Naming convention: suffix DTOs with nothing (keep it clean for consumer use),
 * but if a type conflicts with a domain type of the same name, suffix it with `DTO`.
 */
```

Then audit each existing type and confirm it matches the DTO contract:

```ts
// ✅ These are DTOs — they match what the API will serialize
export interface UserDTO {
  id: string
  username: string
  avatarUrl: string
  createdAt: string   // ISO string, not Date
}

export interface ExerciseDTO {
  id: string
  title: string
  description: string
  duration: number
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'code' | 'chat' | 'whiteboard'
  language: string[]
  tags: string[]
}

export interface SessionDTO {
  id: string
  exerciseId: string
  variationId: string
  body: string
  status: 'active' | 'completed' | 'failed'
  startedAt: string    // ISO string
  completedAt: string | null
}

export interface AttemptDTO {
  id: string
  sessionId: string
  userResponse: string
  verdict: 'passed' | 'passed_with_notes' | 'needs_work' | null
  analysis: string | null
  topicsToReview: string[]
  isFinalEvaluation: boolean
  submittedAt: string  // ISO string
}
```

> Note: `AttemptDTO` exposes a flat `verdict` and `analysis` — not the nested `EvaluationResult` value object. The API serializes the domain type into this flat shape. The frontend never needs to know about `EvaluationResult`.

---

## File: `packages/shared/src/schemas.ts` (annotated)

Add a matching header:

```ts
/**
 * Zod schemas for API DTOs.
 *
 * Two uses:
 * 1. Frontend: validate API responses at runtime (optional but recommended)
 * 2. API: shared request/response schema validation where the same shape
 *    is used on both sides (e.g., a filter object passed as query params)
 *
 * API-only request schemas (e.g., StartSessionRequest) live in the route
 * file in apps/api, not here — they are not consumed by the frontend.
 */
```

---

## The Rule (document in `packages/shared/src/index.ts`)

Add at the top:

```ts
/**
 * @dojo/shared — API boundary types only.
 *
 * Import from this package in:
 * - apps/web: for typing API responses and constructing requests
 * - apps/api: for shared validation schemas and DTO type references
 *
 * Do NOT import from this package:
 * - domain aggregates (apps/api/src/domain/)
 * - infrastructure types (Drizzle schema, etc.)
 * - anything that only one side of the API boundary needs
 */
export * from './types'
export * from './schemas'
```

---

## Enforcement

`import/no-cycle` in ESLint already prevents circular imports. To prevent domain aggregates from leaking into `packages/shared`:

- Domain files live in `apps/api/src/domain/` — they cannot be imported by `packages/shared` without creating a circular dependency (shared ← api ← api, invalid)
- The workspace protocol (`"@dojo/shared": "workspace:*"`) flows one direction: `apps` depend on `packages`, not the reverse
- ESLint's `import/no-cycle` catches it if someone tries

No additional tooling needed.

---

## Acceptance Criteria

- [ ] `packages/shared/src/types.ts` has the DTO header comment explaining its purpose
- [ ] `packages/shared/src/schemas.ts` has the corresponding header
- [ ] `packages/shared/src/index.ts` has the boundary documentation comment
- [ ] All types in `types.ts` use `string` for dates (not `Date`) and `string` for IDs (not branded types)
- [ ] `pnpm lint` passes — no imports of `packages/shared` inside `apps/api/src/domain/`
- [ ] `pnpm typecheck` passes across all workspaces

## Out of Scope

- Renaming existing types (defer until a naming conflict actually occurs)
- Generating DTO types from domain aggregates automatically (not worth the complexity at Phase 0)
- GraphQL schema or OpenAPI spec generation (Phase 3+ when the API surface stabilizes)
- Versioning the shared package (not needed while the repo is a monorepo)
