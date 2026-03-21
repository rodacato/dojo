# ADR-005: Creator identification via environment variable (Phase 0)

**Status:** Accepted (Phase 0 only)
**Date:** 2026-03-21
**Deciders:** Tomás Ríos (infrastructure), Marta Kowalczyk (security)

---

## Context

Admin routes (`/admin/*`) and certain creator-only features require identifying whether the authenticated user is the dojo creator. Two options were considered:

1. **DB column:** `users.is_creator BOOLEAN DEFAULT false` — set via migration or admin script
2. **Environment variable:** `CREATOR_GITHUB_ID=12345678` — the creator's GitHub numeric ID

---

## Decision

**Use `CREATOR_GITHUB_ID` environment variable for Phase 0. Migrate to a DB column in Phase 1.**

---

## Rationale

**Phase 0 has exactly one creator.** The overhead of a DB column — migration, admin UI to set it, risk of exposing a "make user creator" API — is not justified for a system with one admin.

The env var approach:
- Requires no schema change
- Is set once at deploy time (never changes in Phase 0)
- Cannot be exploited via an API endpoint — there is no endpoint that sets it
- Is explicit and auditable — visible in the deployment configuration

**Phase 1 requires the DB column** because:
- The creator may delegate admin access to another user
- Multiple creators may exist as the dojo grows
- The env var approach doesn't scale to multiple admins

---

## Implementation

```typescript
// requireCreator middleware
export const requireCreator = async (c: Context, next: Next) => {
  await requireAuth(c, async () => {})  // ensure auth first
  const user = c.var.user
  const creatorGithubId = process.env.CREATOR_GITHUB_ID
  if (!creatorGithubId || user.githubId !== creatorGithubId) {
    return c.json({ error: 'Forbidden' }, 403)
  }
  return next()
}
```

---

## Consequences

- **Positive:** No schema migration required for Phase 0
- **Positive:** No privilege escalation surface — no API endpoint can elevate a user to creator
- **Positive:** Creator identification is static and auditable in the deploy config
- **Negative:** Changing the creator requires a redeploy (not a DB update)
- **Negative:** Cannot support multiple creators without a new env var per creator — which doesn't scale
- **Trade-off accepted:** Phase 0 has one creator who is also the infrastructure owner. The limitation (redeploy to change creator) is not a real constraint.

---

## Migration path to Phase 1

When Phase 1 begins:
1. Add `is_creator BOOLEAN DEFAULT false NOT NULL` to `users` table
2. Set `is_creator = true` for the creator via a one-time migration SQL (not an API)
3. Update `requireCreator` to check `user.isCreator` from the DB
4. Remove `CREATOR_GITHUB_ID` from the environment configuration
5. **Never expose a route to set `is_creator`** — it must remain a DB-level operation
