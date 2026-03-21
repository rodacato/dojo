# ADR-011: Cloudflare Tunnel for HTTPS termination

**Status:** Accepted
**Date:** 2026-03-21
**Deciders:** Yuki Tanaka (DevOps), Marta Kowalczyk (security)

---

## Context

Production requires HTTPS for `dojo.notdefined.dev`. GitHub OAuth requires HTTPS for the callback URL. WebSocket over `wss://` requires HTTPS. Three approaches for TLS termination were considered:

1. **Traefik + Let's Encrypt** — Traefik reverse proxy on VPS, auto-issues and renews certificates via ACME
2. **Nginx + Certbot** — Nginx reverse proxy, Certbot manages Let's Encrypt certificate renewal via cron
3. **Cloudflare Tunnel** — `cloudflared` daemon on VPS creates an outbound tunnel to Cloudflare's edge; HTTPS termination happens at Cloudflare, no certificate management on the VPS

---

## Decision

**Use Cloudflare Tunnel (`cloudflared`) for HTTPS termination.**

The VPS has no ports exposed to the internet (no port 80, no port 443). Traffic flows: `Internet → Cloudflare (TLS) → Cloudflare Tunnel → VPS port 80 (Nginx/Docker)`.

---

## Rationale

**Traefik** is powerful but introduces significant operational complexity: a Traefik container must be configured and maintained alongside the application containers. Certificate storage, renewal, ACME challenge setup, and Docker label configuration add surface area. Kamal already manages containers — adding Traefik to the mix creates coordination friction.

**Nginx + Certbot** is simpler than Traefik but requires:
- Exposing port 80 and 443 on the VPS
- Certbot cron job for certificate renewal
- Nginx configuration for ACME challenge passthrough
- Certificate files on the VPS that need to be managed

**Cloudflare Tunnel** has a different operational model:
- No certificate files on the VPS — Cloudflare manages TLS at the edge
- No exposed ports — the tunnel is an outbound connection from the VPS to Cloudflare
- DNS is managed by Cloudflare automatically (`cloudflared tunnel route dns`)
- Renewal is implicit — Cloudflare handles it
- The attack surface on the VPS is reduced: no open ports means port scanning reveals nothing

For a single-VPS, single-developer setup, the zero-maintenance aspect of Cloudflare Tunnel is decisive.

**WebSocket support:** Cloudflare Tunnel supports WebSocket upgrade natively — `wss://dojo.notdefined.dev/ws/sessions/:id` works without additional configuration.

---

## Consequences

- **Positive:** No certificate management — no renewal failures, no expired certificates
- **Positive:** No exposed ports — VPS is not reachable directly from the internet
- **Positive:** DDoS protection and CDN caching (static assets) via Cloudflare's edge — no additional configuration
- **Positive:** WebSocket supported out of the box
- **Negative:** Cloudflare is a required dependency — if Cloudflare is down, the site is unreachable even if the VPS is healthy
- **Negative:** All traffic passes through Cloudflare — not suitable if end-to-end encryption (VPS holds the private key) is required. For Phase 0, Cloudflare as a trusted intermediary is acceptable
- **Negative:** `cloudflared` daemon must be running on the VPS before any traffic reaches the containers. Kamal does not manage `cloudflared` — it must be set up separately as a systemd service
- **Trade-off accepted:** Phase 0 is invite-only with one developer as operator. Operational simplicity beats infrastructure flexibility. The Cloudflare dependency is acceptable given the cost (free tier is sufficient) and reliability record.

---

## Configuration summary

```yaml
# /etc/cloudflared/config.yml (on VPS)
tunnel: <TUNNEL_UUID>
credentials-file: /root/.cloudflared/<TUNNEL_UUID>.json

ingress:
  - hostname: dojo.notdefined.dev
    service: http://localhost:80    # Nginx (or web container) listens here
  - service: http_status:404
```

The VPS firewall should block all inbound traffic on ports 80 and 443. Only the Cloudflare Tunnel egress connection is needed.

---

## Rollback

If Cloudflare Tunnel becomes unavailable or undesirable:
1. Add Certbot and get a Let's Encrypt cert: `certbot certonly --standalone -d dojo.notdefined.dev`
2. Configure Nginx on the VPS to listen on 443 with the cert
3. Open ports 80 and 443 in the VPS firewall
4. Update DNS to point directly to the VPS IP (removing the Cloudflare proxy)

This migration takes ~30 minutes and requires no application code changes.
