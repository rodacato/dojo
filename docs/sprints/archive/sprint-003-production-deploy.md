# Active Block: Sprint 003 — First Production Deploy

**Started:** 2026-03-21
**Phase:** Phase 0

**Expected outcome:** The creator can log in and complete a real kata in production. The site has a landing page, clear error states, and 16 exercises seeded.

---

## Committed

### Code — done before deploy

- [x] Spec 018 — Landing page: ruta `/`, copy de PRD-014, form "request access" estático (Phase 0)
- [x] Spec 017 — UX improvements (HIGH severity from PRD-013):
  - OAuth error state en `/login`
  - First-day empty state ("Day 1. The dojo opens.")
  - Dashboard: resume CTA si hay sesión activa
  - Timer expired → "Time's up — submit now" en rojo + grace period handling
  - Generic error page (cross-cutting)
  - Session expiry (401 global) → redirect a `/login` con mensaje

### Auth

- [x] Spec 019 — Bearer token auth: reemplazar cookies cross-domain con Authorization Bearer header (PRD-015)

### Infrastructure

- [x] Spec 016 — Production deploy:
  - Provisionar VPS Hetzner + configurar Cloudflare Tunnel
  - Verificar Kamal config (`config/deploy.api.yml`, `config/deploy.web.yml`)
  - Correr `kamal deploy` (API + web)
  - Correr seed de 16 ejercicios en producción
  - Self-test: 3+ katas reales en prod, verificar calidad del sensei

---

## Out of this block

- Invitaciones a otros usuarios (Phase 1)
- Badges, leaderboard, share cards (Phase 2)
- Mobile tab switcher en CODE kata (identificado en PRD-013, diferido)
- Skeleton loaders (MEDIUM severity en PRD-013, diferido)
- Accessibility audit completo (diferido)

---

## Retro

**¿Qué salió bien?**
- El core loop funciona end-to-end en producción: login → dashboard → kata → sensei evaluation → results
- Landing page con el copy correcto y form de request access
- UX states completos: error states, empty states, timer expired, session resume
- 42 unit tests cubriendo toda la application layer

**¿Qué frenó?**
- Cross-domain cookies (`sameSite: Strict`) no funcionan entre subdominios — causó redirect loops en producción. Se resolvió migrando a Bearer tokens (ADR-007, Spec 019)
- Rate limiting: el polling de `getSession` cada 2s no paraba después de que la sesión estaba activa, agotando el límite de 200 req/15min

**¿Qué va al siguiente bloque?**
- Self-test continuo: más katas para validar calidad del sensei
- Considerar invitar primeros usuarios (Phase 1)
- CSP headers más estrictos (recomendación de Marta en PRD-015)
- Mobile tab switcher para CODE kata (diferido de PRD-013)
