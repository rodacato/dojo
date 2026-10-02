# Security Policy

## Supported Versions

Only the latest released version receives security patches. dojo is self-hosted, so the version
that matters is the one on your instance, not the one on `master`.

## Reporting a Vulnerability

Do not open a public GitHub Issue for security vulnerabilities.

Report it privately through [GitHub Security Advisories](https://github.com/rodacato/dojo/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested remediation (optional)

**Response timeline:**
- Acknowledgment within 48 hours
- Assessment within 7 days
- Fix + advisory within 30 days for confirmed vulnerabilities

The advisory is the part that reaches you. dojo is self-hosted, so an operator running an older
copy learns they must upgrade from the published advisory and from nothing else. It is drafted
privately and published only once the fix has shipped — unlike an issue, which describes an
unpatched weakness from the moment it is written, and which is why issues are not the channel.

Security researchers who report valid vulnerabilities in good faith will be credited in release notes (with permission).

---

## Scope

### In scope

- Authentication bypass or session hijacking (GitHub OAuth flow, WebSocket session tokens)
- Cross-service token abuse (Dojo ↔ Drawhaus shared session)
- Injection vulnerabilities — SQL, prompt injection via exercise content, XSS
- Unauthorized access to user sessions, kata history, or evaluation data
- CSRF on state-changing endpoints
- Information disclosure — exposing `ownerContext` or LLM system prompts to users
- Server-side request forgery (SSRF) via LLM endpoint configuration
- Insecure secret handling in Docker/Kamal deployment
- Rate limiting bypass enabling abuse of the LLM endpoint (financial attack surface)
- Missing or bypassable authentication on WebSocket upgrade requests

### Out of scope

- Vulnerabilities in third-party dependencies (report directly to the upstream project)
- Denial of service attacks
- Social engineering
- Physical access to infrastructure
- Issues requiring attacker to already have admin access

---

## Self-Hosting Security Recommendations

### Network & Transport

- **Always use HTTPS** — Cloudflare Tunnel or a reverse proxy with TLS termination
- **Never expose the API port directly** — all traffic routes through the tunnel or proxy
- **Firewall rules** — on Hetzner (or any VPS), allow only the ports your tunnel and SSH require; block everything else

### Secrets

- `SESSION_SECRET` must be randomly generated (`openssl rand -hex 32`). The API refuses to start with `NODE_ENV=production` while it is still the value shipped in `.env.example`
- Keep `SESSION_SECRET`, `GITHUB_CLIENT_SECRET`, `LLM_API_KEY` and the database password out of tracked files. Docker Compose reads them from `.env` (gitignored); a Kamal deploy reads them from the GitHub Environment ([docs/ops/deploy.md](docs/ops/deploy.md)). Neither is a vault: restrict who can read `.env` on the host
- Rotate secrets immediately if they are exposed
- Never log secrets, session tokens, or the contents of `ownerContext`

### HTTP Security Headers

The web image already sets them, in [apps/web/nginx.conf.template](apps/web/nginx.conf.template): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`, and a `Content-Security-Policy` that allows only the app itself, the API host, Cloudflare Turnstile and Sentry ingest. Read that file for the exact policy before adding a second one in front, since two CSPs intersect.

The API serves JSON only and sets none of these; they matter for the web origin.

### Rate Limiting

Rate limiting is not optional — every API request potentially triggers an LLM call that costs money. An unprotected endpoint is a financial attack surface, not just a DoS concern.

What exists today ([apps/api/src/infrastructure/http/middleware/rateLimiter.ts](apps/api/src/infrastructure/http/middleware/rateLimiter.ts)), all per client IP:
- every route: 200 per 15 minutes
- `/auth/*`: 10 per 15 minutes
- code execution: 10 per minute
- scroll nudges (an LLM call each): 4 per minute

A session accepts at most 2 attempts (`MAX_ATTEMPTS` in the session aggregate), which bounds the sensei calls a single kata can cost. Playground ask-sensei has a per-user daily quota (`PLAYGROUND_ASK_SENSEI_DAILY_QUOTA`).

Two limits to know about:
- **The client IP is read from `cf-connecting-ip`, then `x-forwarded-for`, from whoever sent the request.** Behind Cloudflare Tunnel or a proxy that overwrites those headers that is correct. Exposed directly (for example Docker Compose on a public port), a client can set the header and get a fresh bucket every request, so run it behind a proxy you control.
- **Counters live in the memory of one API process.** A restart resets them, and a second API instance would count separately.

There are no per-user limits on starting katas. If your instance is open to people you do not know, that is the gap to close, because each kata start can trigger an LLM call.

### Session Security

How it works today:
- Signing in creates a row in `user_sessions`; its id is the bearer token. The API redirects the browser to `/auth/callback?token=<id>` and the web app keeps the token in `localStorage` ([auth-token.ts](apps/web/src/lib/auth-token.ts)), sending it as `Authorization: Bearer`. It is not a cookie, so `HttpOnly` and `SameSite` do not apply to it: any script running on the web origin can read it, which is why the CSP above matters.
- A session lasts 30 days from sign-in. There is no inactivity timeout and no renewal.
- Logout deletes the session row, so a token stops working server-side, not only in the browser.
- Only the short-lived OAuth state and invitation cookies are cookies: `HttpOnly`, `SameSite=Lax` (Strict would be dropped on the GitHub redirect), and `Secure` when `NODE_ENV=production`.

To shorten the exposure window, lower the 30-day expiry in [auth.ts](apps/api/src/infrastructure/http/routes/auth.ts) and use the revocation above. The cross-service token passed to Drawhaus, if you use it, should stay scoped and short-lived (1 hour at most).

### Input Validation

- All API route inputs validated with Zod schemas at the infrastructure adapter layer
- User-submitted content (Phase 3 exercise proposals) must be sanitized before entering the domain
- The `ownerContext` and `ownerRole` fields are LLM prompt inputs — treat any user-controlled data that influences them as a prompt injection surface

### Database

- Use parameterized queries throughout — the PostgreSQL adapters must never construct raw SQL strings from user input
- Principle of least privilege: the database user Dojo connects with should have only the permissions it needs (no `DROP TABLE`, no schema modifications)
- Regular automated backups — the kata history and user data in PostgreSQL are not recoverable from the application

### Audit Logging

Log the following security events with timestamp, userId (if known), and IP:
- Successful and failed GitHub OAuth attempts
- Session creation and completion
- Any request that fails authentication or authorization
- Rate limit triggers

Do not log `ownerContext`, `userResponse`, or `llmResponse` — these may contain sensitive information.

---

## LLM Endpoint Security

- `LLM_API_KEY` is server-side only — it is never sent to the frontend or logged
- If using SheLLM or another proxy: ensure the proxy validates requests and does not expose raw API keys to the browser
- If the LLM endpoint is self-hosted, apply the same network access restrictions as the Dojo API
- The `LLMPort` adapter must validate that the LLM response does not exceed expected size bounds before forwarding to the client — unbounded responses are a memory risk in streaming scenarios
