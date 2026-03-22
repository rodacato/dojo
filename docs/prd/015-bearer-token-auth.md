# PRD-015: Bearer Token Auth — Replace Cross-Domain Cookies

> **Status:** advancing to spec
> **Date:** 2026-03-22
> **Author:** Claude (Marta Kowalczyk guiding — auth & security)

---

## Idea in one sentence

Replace cookie-based session auth with Bearer tokens so the API works identically for the web frontend, future mobile clients, and external consumers — eliminating cross-subdomain cookie fragility.

---

## Why now

The web frontend (`dojo.notdefined.dev`) and the API (`dojo-api.notdefined.dev`) live on separate subdomains. The session cookie set with `sameSite: Strict` is not sent on cross-origin fetch requests from the SPA, causing a 401 redirect loop that makes login impossible in production.

Alternatives considered and rejected:
- **`sameSite: Lax`** — fixes the immediate bug but remains fragile (browser-dependent, cross-subdomain cookie semantics are complex)
- **Same-domain via nginx proxy** — moves the problem to nginx configuration, route collisions between frontend and API, couples the deployments
- **Single container (Hono serves both)** — eliminates the API as an independent service, which conflicts with the goal of a consumable API

The root issue is architectural: **cookies are a browser mechanism being forced into an API auth role**. Bearer tokens are the standard for APIs that serve multiple consumers.

---

## Perspectives

### As a developer using the dojo

I click "Sign in with GitHub", GitHub redirects me back, and the app works. I don't know or care whether it uses cookies or tokens — the experience is identical. If I refresh the page, I'm still logged in. If I close the browser and come back, I'm still logged in (within the 30-day session window).

### As the dojo administrator

I can revoke sessions server-side by deleting them from the DB — same as before. The token is an opaque session ID, not a JWT with embedded claims. If a token is compromised, I delete the session row and it's immediately invalid.

The API is now consumable from any client that can send an `Authorization: Bearer` header — CLI tools, scripts, mobile apps, integrations.

### As the product

This change is infrastructure — invisible to the user. It unblocks the production deploy (Sprint 003) without introducing new UX or features. It makes the API independent of browser cookie behavior, which aligns with the long-term vision of a consumable API.

---

## Tensions

| Tension | Resolution |
|---|---|
| HttpOnly cookies are safer against XSS than localStorage tokens | True, but the risk is equivalent to any SPA with token auth (Vercel, Linear, GitHub). Server-side session revocation is the safety net. CSP headers are the primary XSS defense. |
| Token in URL during OAuth callback (`?token=...`) | Brief exposure — `replace: true` navigation removes it from history. The token is a session ID, not a password. Same pattern used by many OAuth implementations. |
| WebSocket can't send custom headers | Standard practice: pass token as query parameter. Same approach used by Slack, Discord, and every WebSocket-based SPA. |

---

## Options

### Option A: Bearer token with localStorage

**Flow:**
1. User clicks "Sign in" → `dojo-api.notdefined.dev/auth/github` → GitHub
2. GitHub callback → API creates session → redirects to `dojo.notdefined.dev/auth/callback?token=<sessionId>`
3. Frontend stores token in `localStorage`
4. All API calls: `Authorization: Bearer <sessionId>`
5. WebSocket: `wss://dojo-api.notdefined.dev/ws/sessions/:id?token=<sessionId>`

**Pros:**
- Survives page refresh and new tabs
- Same auth mechanism for web, CLI, mobile, scripts
- No cookies for API auth = no CORS credential issues
- Standard SPA pattern (Vercel, Linear, Supabase all do this)

**Cons:**
- XSS can read localStorage (mitigated by CSP + server-side revocation)
- Token briefly visible in callback URL

**Complexity:** Low — ~10 files changed, no new dependencies.

### Option B: Bearer token with in-memory + refresh cookie

**Flow:**
- Token stored only in React state (memory)
- A separate `dojo_refresh` HttpOnly cookie on the API domain enables re-issuing the token on page load via `POST /auth/refresh`

**Pros:**
- Token never persisted client-side — maximum XSS resistance
- Refresh cookie is HttpOnly (not readable by JS)

**Cons:**
- Reintroduces cookies (the thing we're trying to eliminate)
- Extra endpoint (`/auth/refresh`), extra round-trip on every page load
- More complex flow, more failure modes
- Refresh cookie has the same cross-subdomain issues we're solving

**Complexity:** Medium — new endpoint, token rotation logic, dual auth mechanism.

### Option C: Short-lived JWT + refresh token

**Flow:**
- OAuth callback returns a short-lived JWT (15 min) + refresh token
- Frontend stores JWT in memory, refresh token in localStorage
- JWT used for API calls, refresh token used to get new JWTs

**Pros:**
- JWTs can be verified without DB lookup (stateless)
- Short expiry limits exposure window

**Cons:**
- Over-engineered for Phase 0 with a single server and <10 users
- JWT verification complexity (signing keys, rotation, clock skew)
- Refresh token in localStorage has the same XSS risk as Option A
- Adds token rotation logic, expiry handling, silent refresh
- Premature: the DB session lookup is not a bottleneck

**Complexity:** High — new token issuance, rotation, key management.

---

## Expert panel review

### Marta Kowalczyk (Security, Auth)

**Recommendation: Option A** — Bearer token with localStorage.

The XSS concern is real but proportional. The threat model for Phase 0:
- Single user (creator)
- No user-generated content that could inject scripts (Phase 3 concern, not Phase 0)
- CSP headers already in place (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`)
- Server-side sessions are revocable — if a token leaks, delete the row

Specific security requirements:
1. **Token in callback URL**: use `replace: true` navigation to prevent back-button exposure. The token should not appear in `document.referrer` — set `Referrer-Policy: strict-origin-when-cross-origin` (already configured in nginx).
2. **WebSocket token**: query parameter is acceptable. Do NOT log WebSocket URLs server-side. Consider a short-lived WebSocket ticket in Phase 1 if the threat model changes.
3. **CORS**: keep origin restriction even without credentials. Remove `credentials: true` from CORS config.
4. **oauth_state cookie**: keep as-is — it's same-domain on the API, `sameSite: Lax`, short-lived (5 min). No change needed.
5. **Add CSP header**: `Content-Security-Policy: default-src 'self'` should be added as a follow-up (not blocking for this change).

Option B reintroduces the exact problem we're solving. Option C is premature optimization — stateless JWT verification is a scaling solution for a system that has one user.

**Risk assessment:** Low. The security posture is equivalent to any modern SPA. The attack surface does not increase — it shifts from "steal HttpOnly cookie via CSRF" to "steal token via XSS," and XSS is already the more likely vector in any SPA.

### Tomás Ríos (Infra, WebSockets, Deploy)

**Agrees with Option A.** Specific notes:

1. **WebSocket auth via query param**: standard pattern. The `ws.ts` route currently reads from cookies — change to read `?token=` query param. Ensure the token is validated BEFORE upgrading the connection (already the case in the current implementation, just change the source).
2. **Kamal deploy**: no infrastructure changes needed. Both containers stay as-is. The `dojo-api.notdefined.dev` subdomain stays. The only change is what the API reads (header vs. cookie).
3. **CORS simplification**: with `credentials: true` removed, CORS preflight is simpler. Keep `origin: config.WEB_URL` to prevent other origins from calling the API.
4. **No nginx changes**: the web container's nginx serves static files only — no auth involvement.

**Deployment concern:** The API and web must deploy together (or web first, then API). If the API starts reading Bearer tokens before the frontend sends them, existing sessions break. Recommended: deploy both in the same CI run (already the case — `deploy-web` depends on `deploy-api`). Actually, reverse: **deploy web first** (frontend starts sending Bearer), then API (starts reading Bearer). During the transition window, the API should accept BOTH cookies and Bearer tokens, then remove cookie support in a follow-up.

**Counter-proposal on deployment order:** Actually, simpler — since there's only one user (creator), just deploy both at once and re-login. No need for backward compatibility.

### Darius Osei (Architecture, DDD)

**No domain model impact.** The session is already a server-side entity in the Identity context. Changing the transport mechanism (cookie → header) does not affect the domain. The `requireAuth` middleware is an infrastructure concern — it reads a token, looks up a session, attaches a user to the context. The source of the token is irrelevant to the domain.

One note: if we later add API keys for external consumers (Phase 1+), those should be a separate concept in the Identity context — an `ApiKey` entity with its own lifecycle (create, revoke, list), not overloading the `Session` entity. Bearer tokens from OAuth and API keys from a settings page are different bounded context behaviors.

---

## Provisional conclusion

**Option A: Bearer token with localStorage.** All three consulted experts agree. The change is minimal (10 files), eliminates the cross-subdomain cookie problem permanently, and makes the API consumable from any client. No new dependencies, no infrastructure changes, no domain model impact.

---

## Implementation scope

| Area | Files | Change |
|---|---|---|
| Token storage | `apps/web/src/lib/auth-token.ts` (new) | `getToken()`, `setToken()`, `clearToken()` over localStorage |
| API client | `apps/web/src/lib/api.ts` | Add `Authorization: Bearer` header, remove `credentials: 'include'` |
| Auth callback page | `apps/web/src/pages/AuthCallbackPage.tsx` (new) | Extract token from URL, save, redirect to `/dashboard` |
| App routes | `apps/web/src/App.tsx` | Add `/auth/callback` route |
| Auth context | `apps/web/src/context/AuthContext.tsx` | Check token before calling `getMe()`, add `logout()` |
| API auth middleware | `apps/api/src/infrastructure/http/middleware/auth.ts` | Read Bearer header instead of cookie |
| OAuth callback | `apps/api/src/infrastructure/http/routes/auth.ts` | Redirect with `?token=` instead of setting cookie |
| Logout route | `apps/api/src/infrastructure/http/routes/auth.ts` | Read Bearer header instead of cookie |
| WebSocket (API) | `apps/api/src/infrastructure/http/routes/ws.ts` | Read token from query param |
| WebSocket (Web) | `apps/web/src/hooks/useEvaluationStream.ts` | Pass token as query param |
| CORS | `apps/api/src/infrastructure/http/router.ts` | Remove `credentials: true` |

---

## Next step

- [x] Expert panel consultation (Marta, Tomás, Darius)
- [ ] Convert to spec: `docs/specs/019-bearer-token-auth.md`
- [ ] Add to Sprint 003 as Spec 019
