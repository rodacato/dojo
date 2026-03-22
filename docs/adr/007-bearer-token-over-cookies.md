# ADR-007: Bearer token over cookies for API auth

**Status:** Accepted
**Date:** 2026-03-22
**Deciders:** Marta Kowalczyk (security), Tomás Ríos (infrastructure), Darius Osei (architecture)
**Supersedes:** ADR-002 (partially — server-side sessions remain, only the transport changes)

---

## Context

ADR-002 chose server-side sessions with HttpOnly cookies. That decision was correct for a single-origin architecture. In production, however, the web frontend (`dojo.notdefined.dev`) and the API (`dojo-api.notdefined.dev`) live on separate subdomains. This creates two problems:

1. **`sameSite: Strict` cookies are not sent** on requests initiated after a cross-site navigation (the GitHub OAuth redirect chain). This caused a 401 redirect loop in production — the user logs in successfully but the frontend cannot read the session.

2. **Cookies bind the API to browsers.** The API should be consumable by any client — CLI tools, scripts, mobile apps, external integrations. Cookies are a browser-only mechanism.

Alternatives considered:
- `sameSite: Lax` — fixes the immediate bug but remains fragile and browser-dependent
- Reverse proxy (same domain) — couples web and API deployments, introduces route collision risk
- Single container — eliminates the API as an independent service

---

## Decision

**Replace the `dojo_session` HttpOnly cookie with a Bearer token in the `Authorization` header.** The server-side session model from ADR-002 is unchanged — the token is still an opaque session ID pointing to a `user_sessions` row with a 30-day expiry. Only the transport changes.

| Before | After |
|---|---|
| API sets `Set-Cookie: dojo_session=<id>` | API redirects to `/auth/callback?token=<id>` |
| Browser sends `Cookie: dojo_session=<id>` | Client sends `Authorization: Bearer <id>` |
| WebSocket reads cookie on upgrade | WebSocket reads `?token=<id>` query param |

The `oauth_state` cookie remains unchanged — it is same-domain on the API and short-lived (5 minutes).

---

## Rationale

**Why this does not contradict ADR-002:**

ADR-002 rejected JWTs and chose server-side sessions. That decision stands. The session is still server-side, still revocable, still a DB row. What changes is how the session ID reaches the API: via `Authorization` header instead of `Cookie` header.

ADR-002 cited HttpOnly cookies as protection against XSS. This is true — but the trade-off shifts when cross-subdomain architecture makes cookies unreliable:

| Risk | HttpOnly cookie | Bearer in localStorage |
|---|---|---|
| XSS token theft | Protected (JS can't read) | Vulnerable (JS can read) |
| CSRF | Vulnerable (cookie sent automatically) | Protected (header not sent automatically) |
| Cross-subdomain | Fragile (sameSite, domain, CORS) | Works everywhere |
| Server-side revocation | Yes | Yes |
| Non-browser clients | Not supported | Supported |

For Phase 0 (single user, no user-generated content, CSP headers in place), the XSS risk is minimal. Server-side session revocation provides the safety net. If the threat model changes (Phase 3: user-submitted exercises), a short-lived token + refresh flow can be layered on.

---

## Consequences

- **Positive:** Login works in production — eliminates cross-subdomain cookie issues permanently
- **Positive:** API is client-agnostic — same auth for web, CLI, mobile, scripts
- **Positive:** CSRF protection is inherent — Bearer tokens are not sent automatically by the browser
- **Positive:** No CORS `credentials: true` needed — simpler preflight
- **Negative:** Token in localStorage is readable by JavaScript (XSS surface)
- **Negative:** Token briefly visible in callback URL (`?token=...`) — mitigated by `replace: true` navigation and `Referrer-Policy`
- **Unchanged:** Server-side sessions, DB lookup per request, instant revocation — all from ADR-002 remain
- **Future:** API keys for external consumers (Phase 1+) will be a separate entity, not overloading sessions
