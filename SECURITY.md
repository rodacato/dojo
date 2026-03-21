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
- Information disclosure — exposing `owner_context` or LLM system prompts to users
- Server-side request forgery (SSRF) via LLM endpoint configuration
- Insecure secret handling in Docker/Kamal deployment

### Out of scope

- Vulnerabilities in third-party dependencies (report directly to the upstream project)
- Denial of service attacks
- Social engineering
- Physical access to infrastructure
- Issues requiring attacker to already have admin access

---

## Self-Hosting Security Recommendations

If you are running Dojo on your own infrastructure:

- **Always use HTTPS** — use Cloudflare Tunnel or a reverse proxy with TLS termination
- **Restrict network access** — do not expose the API port directly; route through the tunnel or proxy
- **Use strong secrets** — `SESSION_SECRET`, `GITHUB_CLIENT_SECRET`, `LLM_API_KEY` must be randomly generated and never committed
- **Keep dependencies updated** — run `pnpm audit` regularly
- **Regular database backups** — the kata history and user data live in PostgreSQL; back it up
- **Firewall rules** — on Hetzner (or any VPS), restrict inbound traffic to only the ports your tunnel and SSH require

---

## LLM Endpoint Security

Dojo talks to a configurable LLM endpoint. If you are using a proxy (e.g., SheLLM):

- Ensure the proxy validates requests and does not expose raw API keys to the browser
- The `LLM_API_KEY` must stay server-side — it is never sent to the frontend
- If the endpoint is self-hosted, apply the same network access restrictions as the API
