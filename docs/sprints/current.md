# Active Block: Sprint 005 — Hardening + Phase 1 Prep

**Started:** 2026-03-22
**Phase:** Phase 0→1 bridge

**Expected outcome:** The product is secure enough and polished enough to invite the first 2-3 friends. Security headers in place, no data loss on active kata, proper error handling, invitation system functional.

---

## Committed

### Security Hardening

- [ ] Spec 024 — Security headers & error boundaries:
  - CSP, HSTS, Permissions-Policy in nginx.conf
  - beforeunload prompt on active kata
  - React error boundary at app level (fallback to ErrorPage)

### UX Polish

- [ ] Spec 025 — 404 page, sensei persona, reconnect UI:
  - Custom 404 page (design in `docs/screens/dojo_404_path_not_found/`)
  - Sensei role badge visible during evaluation streaming
  - WebSocket reconnect banner in eval page

### Phase 1 Prep

- [ ] Spec 026 — Invitation system:
  - `invitations` table (token, createdBy, usedBy, expiresAt)
  - Creator can generate invite links from admin
  - Invite redeem flow: `/invite?token=xxx` → GitHub OAuth → account created
  - Non-invited users blocked at OAuth callback
- [ ] Spec 027 — Admin: edit exercise:
  - Edit existing exercise (pre-fill form, update in DB)
  - Exercise detail view from admin table

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
