# Active Block: Sprint 003 — First Production Deploy

**Started:** 2026-03-21
**Phase:** Phase 0

**Expected outcome:** The creator can log in and complete a real kata in production. The site has a landing page, clear error states, and 16 exercises seeded.

---

## Committed

### Code — done before deploy

- [ ] Spec 018 — Landing page: ruta `/`, copy de PRD-014, form "request access" estático (Phase 0)
- [ ] Spec 017 — UX improvements (HIGH severity from PRD-013):
  - OAuth error state en `/login`
  - First-day empty state ("Day 1. The dojo opens.")
  - Dashboard: resume CTA si hay sesión activa
  - Timer expired → "Time's up — submit now" en rojo + grace period handling
  - Generic error page (cross-cutting)
  - Session expiry (401 global) → redirect a `/login` con mensaje

### Infrastructure

- [ ] Spec 016 — Production deploy:
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

## Retro *(on close)*

- ¿Qué salió bien?
- ¿Qué frenó?
- ¿Qué va al siguiente bloque?
