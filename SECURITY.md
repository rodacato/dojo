# Security Policy

## Reporting a Vulnerability

Do not open a public GitHub Issue for security vulnerabilities.

Report to: **security@notdefined.dev**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested remediation (optional)

**Response timeline:**
- Acknowledgment within 48 hours
- Assessment within 7 days
- Fix + advisory within 30 days for confirmed vulnerabilities

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

- `SESSION_SECRET`, `GITHUB_CLIENT_SECRET`, `LLM_API_KEY` must be randomly generated (minimum 32 bytes) and never committed to the repository
- Rotate secrets immediately if they are exposed
- Use Kamal's encrypted secrets management — do not pass secrets as plain environment variables in `docker-compose.yml`
- Never log secrets, session tokens, or the contents of `ownerContext`

### HTTP Security Headers

Configure the following headers on your proxy or Cloudflare:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; connect-src 'self' wss:
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

For self-hosted deployments with Cloudflare Tunnel, enable HSTS via Cloudflare's SSL/TLS settings.

### Rate Limiting

Rate limiting is not optional — every API request potentially triggers an LLM call that costs money. An unprotected endpoint is a financial attack surface, not just a DoS concern.

Recommended limits:
- `POST /sessions` (start a kata): 5 per user per hour
- `POST /sessions/:id/attempts` (submit to sensei): 10 per session
- `GET /exercises` (kata selection): 20 per user per hour
- GitHub OAuth callback: 10 per IP per 5 minutes

### Session Security

- Session tokens must be `HttpOnly`, `Secure`, and `SameSite=Strict`
- Session expiration: 24 hours of inactivity, 7 days absolute maximum
- On logout, invalidate the server-side session — do not rely solely on client-side cookie deletion
- The cross-service session token passed to Drawhaus must be scoped and short-lived (1 hour maximum)

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
