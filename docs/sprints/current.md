# Active Block: Sprint 005 — Hardening + Phase 1 Prep

**Started:** 2026-03-22
**Phase:** Phase 0→1 bridge

**Expected outcome:** The product is secure enough and polished enough to invite the first 2-3 friends. Security headers in place, no data loss on active kata, proper error handling, invitation system functional.

---

## Committed

### Security Hardening

- [x] Spec 024 — Security headers & error boundaries:
  - CSP, HSTS, Permissions-Policy in nginx.conf
  - beforeunload prompt on active kata
  - React error boundary at app level (fallback to ErrorPage)

### UX Polish

- [x] Spec 025 — 404 page, sensei persona, reconnect UI:
  - Custom 404 page (design from `docs/screens/dojo_404_path_not_found/`)
  - Sensei role badge with initials avatar + exercise title during eval
  - WebSocket reconnect button in eval error state

### Phase 1 Prep

- [x] Spec 026 — Invitation system:
  - `invitations` table with migration 0002 (token, createdBy, usedBy, expiresAt)
  - GET /auth/invite/:token — validates and starts OAuth with invite cookie
  - OAuth callback gates new users: must be creator or have valid invite
  - Admin POST/GET /admin/invitations for creating and listing
  - /invite/:token redeem page with GitHub CTA
  - Landing shows invite_required and invite_invalid error states
- [x] Spec 027 — Admin: edit exercise:
  - GET/PUT /admin/exercises/:id endpoints
  - Edit page pre-fills form from API
  - Table rows clickable to navigate to edit

---

## Out of this block

- Profile page `/u/:username` (Sprint 006)
- Share cards (Phase 1 proper)
- Badges (Phase 2)
- Email notifications (needs infra)
- OG image PNG conversion

---

## Retro *(on close)*

- ¿Se puede invitar al primer amigo con confianza?
- ¿La seguridad está al nivel necesario para multi-usuario?
- ¿El admin es funcional para gestionar ejercicios?
