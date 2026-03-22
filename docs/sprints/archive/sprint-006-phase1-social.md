# Sprint 006 — Phase 1: Open the Doors

**Started:** 2026-03-22
**Completed:** 2026-03-22
**Phase:** Phase 1

**Outcome:** The product has a public face worth sharing. Legal pages, public profiles, first badges, share cards, leaderboard, and UI polish all shipped.

---

## Completed

- [x] Spec 028 — Public pages (`/terms`, `/privacy`, `/changelog`, `/open-source`)
  - Terms with Honor Code accent card, sticky sidebar
  - Privacy with "What we don't collect" section, OAuth scopes
  - Changelog in decision-voice with phase badges
  - Open source with repo cards, sensei logic, contributing rules
  - Shared PublicPageLayout component, landing page footer links
- [x] Spec 029 — Public profile (`/u/:username`)
  - Public API `GET /u/:username` — no auth required
  - 4 stat cards, 90-day heatmap, recent kata, badges
- [x] Spec 030 — Badge system (`FIRST_KATA`, `5_STREAK`)
  - Migration 0003: `badge_definitions` + `user_badges` tables
  - BadgeEventHandler subscribes to `SessionCompleted`
  - Badges displayed on public profile
- [x] Spec 031 — Share card OG image
  - `GET /share/:sessionId.png` — satori + resvg-js PNG
  - 1200×630px with verdict, kata info, sensei pull quote
  - Share button on ResultsPage (Web Share API + clipboard + Twitter)
- [x] Spec 032 — Leaderboard (`/leaderboard`)
  - `GET /leaderboard?period=month|all-time`
  - Ranked table, period filter, current user highlight
  - Dashboard links to leaderboard and profile
- [x] Spec 033 — UI polish → Stitch designs
  - DayStart: date, larger buttons, disabled CTA, footer microcopy
  - KataSelection: 3-column grid, card descriptions, status pills
  - Dashboard: larger streak, accent border, profile/leaderboard links
  - ResultsPage: larger verdict, completion time

---

## Retro

### What went well
- All 6 specs shipped in one block — the design references from Stitch made implementation fast
- Badge system with event-driven architecture is clean and extensible
- Share card generation works server-side without heavy dependencies

### What to improve
- OG meta tags still need server-side rendering (SPA can't set them for crawlers)
- The sidebar navigation from Stitch designs was deferred — screens still use minimal headers
- Chunk size warning on web build (>500KB) — code splitting needed

### What goes to the next block
- Full badge system (8 remaining badges + `/badges` collection page)
- Extended dashboard (Phase 2 — weak areas, practice patterns)
- "No repeat within 6 months" rule
- Kata quality refinement with real dogfooding data
- Resend domain verification for production emails
- Code splitting for web bundle
