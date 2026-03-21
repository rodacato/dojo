# ADR-002: Server-side sessions over stateless JWTs

**Status:** Accepted
**Date:** 2026-03-21
**Deciders:** Marta Kowalczyk (security), Tomás Ríos (infrastructure)

---

## Context

The application uses GitHub OAuth to authenticate users. After OAuth completes, a session must be maintained so the user stays logged in across requests. Two approaches were considered:

1. **Stateless JWT** — signed token stored client-side (localStorage or cookie), self-contained claims
2. **Server-side sessions** — random token stored in an `HttpOnly` cookie, session record in the database

---

## Decision

**Use server-side sessions stored in the `user_sessions` DB table, referenced by a random token in an `HttpOnly` cookie.**

---

## Rationale

**JWTs are inappropriate for this use case** because:

1. **No revocation.** A 30-day JWT with no revocation means a stolen or compromised token cannot be invalidated without rotating the signing secret (which invalidates all sessions). Server-side sessions can be deleted individually.

2. **`localStorage` is an XSS attack surface.** Any XSS vulnerability in the app could steal a localStorage-stored JWT. `HttpOnly` cookies are not accessible to JavaScript — the token exists only in the browser's cookie store.

3. **Long-lived sessions are the primary use case.** Stateless JWTs are appropriate for short-lived tokens (<15 minutes) in service-to-service contexts. A 30-day user session with a revocable token is better served by server-side sessions.

**Implementation:** `arctic@2` handles GitHub OAuth (PKCE, state validation). After callback, a cryptographically random session token is generated, stored in `user_sessions`, and set as an `HttpOnly`, `SameSite=Lax`, `Secure` cookie.

---

## Consequences

- **Positive:** Instant session invalidation (logout, password change, admin revocation)
- **Positive:** No token accessible to JavaScript — XSS cannot steal sessions
- **Positive:** No secret rotation needed to invalidate one user's session
- **Negative:** Every authenticated request requires a DB lookup (`user_sessions` → `users`)
- **Negative:** Horizontal scaling requires shared session storage — but `user_sessions` is in the same Postgres DB already used for app data
- **Trade-off accepted:** The DB lookup overhead is negligible at Phase 0–2 scale. If performance becomes an issue, add a Redis session cache in Phase 3.
