# PRD-017: Sprint 005 Planning — Hardening + Phase 1 Prep

> **Status:** confirmed
> **Date:** 2026-03-22
> **Author:** Claude (full panel consulted)

---

## Idea in one sentence

Harden the product for real users (security, reliability, UX gaps) while preparing the Phase 1 foundation (invitations, profiles) — all while dogfooding continues.

---

## Why now

Phase 0 is functionally complete. The creator is dogfooding. But the product has gaps that would embarrass in front of invited users: no CSP headers, no 404 page, no beforeunload warning during kata, no way to edit exercises, no sensei persona visible in evaluation. Phase 1 features (invitations, profiles) can be built in parallel with hardening.

---

## Expert panel review

### Marta Kowalczyk (Security)

"CSP headers are the #1 priority. You're storing tokens in localStorage — without CSP, any XSS vector can steal them. Add a strict policy now, before inviting anyone. Also add HSTS since you're on HTTPS via Cloudflare.

Specific recommendations:
1. **Content-Security-Policy**: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://avatars.githubusercontent.com; connect-src 'self' https://dojo-api.notdefined.dev wss://dojo-api.notdefined.dev; font-src 'self'`
2. **Strict-Transport-Security**: `max-age=31536000; includeSubDomains`
3. **Permissions-Policy**: `camera=(), microphone=(), geolocation=()`
4. **beforeunload on active kata**: Not a security issue but a data-loss prevention issue — add it."

### Soren Bachmann (UX/Design)

"Three things that will make the biggest difference before inviting friends:
1. **404 page** — you have a design for it in screens already. The current redirect-to-home is confusing.
2. **Sensei persona visible during evaluation** — the user should see WHO is evaluating them. The role badge is key to credibility.
3. **beforeunload on active kata** — losing 15 minutes of work without warning is the kind of thing that makes someone never come back.

The invitation flow can be simple for Sprint 005 — just a link with a token. The profile page can wait for Sprint 006."

### Priya Menon (Product Strategy)

"You're dogfooding. The question is: what would make YOU stop using it? Fix those things first. Then ask: what would make your FIRST friend stop using it after one session? Fix those too.

My read:
- You'd stop if you lost work (beforeunload)
- Your friend would stop if the site feels broken (404 redirect, no sensei identity)
- Both would stop if someone steals the session token (CSP)

For Phase 1 prep: invitation system is the minimum. Profile page is nice-to-have. Share cards are Phase 1 proper. Keep this sprint tight."

### Tomás Ríos (Infra)

"Two things:
1. **Error boundaries in React** — right now, any unhandled error white-screens the app. Add a fallback that shows the ErrorPage component.
2. **WebSocket reconnect UI** — the hook has reconnect logic but the page doesn't expose it. If the connection drops mid-eval, the user should see 'Reconnecting...' not just nothing."

### Darius Osei (Architecture)

"The invitation system needs a clean domain model:
- `Invitation` entity in the Identity context: `id`, `createdBy`, `token`, `usedBy`, `expiresAt`, `createdAt`
- Port: `InvitationRepositoryPort` with `save`, `findByToken`, `markUsed`
- This keeps invitations separate from sessions and users — proper bounded context."

---

## Sprint 005 scope

### Security Hardening

| Item | Priority | Source |
|---|---|---|
| CSP + HSTS + Permissions-Policy headers | Critical | Marta |
| beforeunload prompt on active kata | High | Marta, Soren |
| React error boundary (app-level) | High | Tomás |

### UX Polish

| Item | Priority | Source |
|---|---|---|
| 404 page (design exists in screens) | High | Soren |
| Sensei persona visible in eval page | High | Soren |
| WebSocket reconnect UI in eval | Medium | Tomás |

### Phase 1 Prep

| Item | Priority | Source |
|---|---|---|
| Invitation system (create + redeem) | High | Darius, Priya |
| Admin: edit exercise | Medium | Audit |

### Out of this sprint

- Profile page (`/u/:username`) — Sprint 006
- Share cards — Phase 1 proper
- Badges — Phase 2
- Email notifications — needs infra
- Admin: archive/publish from table — low priority
- Dark mode toggle — product is dark-only by design (BRANDING.md)

---

## Next step

- [x] Expert panel consultation
- [ ] Create sprint current.md
