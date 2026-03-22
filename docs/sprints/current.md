# Active Block: Sprint 004 — Polish, Branding & Dogfooding

**Started:** 2026-03-22
**Phase:** Phase 0 (refinement)

**Expected outcome:** The product looks and feels intentional. The creator can dogfood daily: review past kata results, see progress on the dashboard, and share the link without embarrassment. Ready to evaluate Phase 1.

---

## Committed

### Branding & Visual Identity

- [ ] Spec 020 — Logo, favicon & OG image:
  - SVG logo component (`dojo_` with animated cursor)
  - Favicon: `▌` cursor in indigo, all sizes
  - OG meta tags + static OG image (1200x630)
- [ ] Spec 021 — Landing page visual polish:
  - Typography hierarchy per BRANDING.md
  - Spacing and section transitions refinement
  - Logo component integrated in nav and footer

### Dashboard & Results

- [ ] Spec 022 — Results permalink & kata history:
  - Recent sessions link to `/kata/:id/result`
  - Today card post-completion: verdict badge + exercise title + link
  - `/history` page: paginated list of all completed katas
  - Results page loads from API (works as permalink, not just redirect)
- [ ] Spec 023 — Profile & dashboard improvements:
  - Profile section: avatar, username, total katas, member since
  - Logout button in dashboard header
  - Dashboard shows richer activity data

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
