# Active Block: Sprint 004 — Polish, Branding & Dogfooding

**Started:** 2026-03-22
**Phase:** Phase 0 (refinement)

**Expected outcome:** The product looks and feels intentional. The creator can dogfood daily: review past kata results, see progress on the dashboard, and share the link without embarrassment. Ready to evaluate Phase 1.

---

## Committed

### Branding & Visual Identity

- [x] Spec 020 — Logo, favicon & OG image:
  - SVG logo component (`dojo_` with animated cursor + torii gate mark)
  - Favicon: torii gate in indigo on dark bg
  - OG meta tags + static OG image (1200x630)
- [x] Spec 021 — Landing page visual polish:
  - Two-column hero with terminal demo
  - Alternating section backgrounds, 3-column grid, card layouts
  - Logo component integrated in nav and footer
- [x] Spec 022 — Results permalink & kata history:
  - GET /sessions/:id returns finalAttempt with verdict/analysis
  - Dashboard recentSessions includes verdict from attempts table
  - Recent sessions clickable — link to /kata/:id/result
  - Today card shows verdict + exercise title + "View results" CTA
  - Results page loads from API (works as permalink)
  - Logout button in dashboard header
- [x] Spec 023 — Profile & dashboard improvements:
  - 3 stat cards: day streak, kata completed, days in dojo
  - totalCompleted added to dashboard API endpoint

---

## Out of this block

- Share cards (Phase 1)
- Badges system (Phase 2)
- Email/push notifications (needs infra)
- Mobile tab switcher en CODE kata (diferido)
- Skeleton loaders (diferido)

---

## Retro *(on close)*

- ¿El creator está haciendo katas diarias?
- ¿El dashboard motiva a volver?
- ¿El sitio se ve listo para invitar amigos?
