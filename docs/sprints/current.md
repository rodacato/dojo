# Active Block: Sprint 006 — Phase 1: Open the Doors

**Started:** 2026-03-22
**Phase:** Phase 1

**Expected outcome:** The product has a public face worth sharing. Legal pages exist, practitioners have public profiles, the first badges are earnable, share cards generate OG images for social media, and a leaderboard ranks by consistency. Existing screens move closer to the Stitch designs.

---

## Committed

### A — Legal & Public Pages

- [ ] Spec 028 — Public pages (`/terms`, `/privacy`, `/changelog`, `/open-source`):
  - Terms of service with Honor Code accent card (design: `dojo_terms_of_service/`)
  - Privacy policy with "What we don't collect" section (design: `dojo_privacy_policy/`)
  - Changelog in decision-voice, driven by CHANGELOG.md (design: `dojo_changelog/`)
  - Open source transparency page with repo cards + contributing rules (design: `open_source_transparency/`)
  - Sticky sidebar navigation on desktop, top anchors on mobile
  - Footer links from landing page → these pages

### B — Public Profile

- [ ] Spec 029 — Public profile (`/u/:username`):
  - API: `GET /users/:username/profile` — public, no auth required
  - 4 stat cards: total kata, pass rate, avg time, languages
  - 90-day activity heatmap (dots: empty/practiced/passed)
  - Recent kata list (read-only, last 10)
  - Earned badges section (unearned badges hidden, not shown as locked)
  - GitHub avatar (48px, 6px radius), username, member since
  - Design reference: `dojo_public_profile/`

### C — Badge System

- [ ] Spec 030 — Badges (`FIRST_KATA`, `5_STREAK`):
  - Migration: `badge_definitions` + `user_badges` tables
  - Domain: `Recognition` bounded context reacting to `SessionCompleted` events
  - `FIRST_KATA` — earned on first completed session (any verdict)
  - `5_STREAK` — earned when streak reaches 5 consecutive days
  - API: `GET /users/:username/badges` (public)
  - Badge display on profile page and dashboard
  - Design reference: `badges_collection/` (earned/locked states)

### D — Share Cards

- [ ] Spec 031 — Share card OG image (PNG, server-side):
  - API: `GET /share/:sessionId.png` — generates 1200×630px PNG
  - Server-side rendering with `satori` + `resvg-js` (no canvas dependency)
  - Content: dojo_ logo, verdict badge, kata name + type/difficulty, completion time, sensei pull quote, GitHub handle
  - Cache headers: `Cache-Control: public, max-age=31536000, immutable`
  - OG meta tags on results page: `og:image`, `twitter:card=summary_large_image`
  - "Share" button on ResultsPage → copy URL or open Twitter/LinkedIn intent
  - Design reference: `dojo_share_card_presentation/`

### E — Leaderboard

- [ ] Spec 032 — Leaderboard (`/leaderboard`):
  - API: `GET /leaderboard?period=month|all-time` — requires auth
  - Ranked by consistency (streak + kata count), not score
  - Table: rank, avatar, username, streak, kata count, pass rate, last active
  - Current user row highlighted
  - Period filter: "This month" | "All time" group buttons
  - Footer: "Ranking resets on the 1st. Consistency compounds."
  - Link from dashboard (subtle text link, not primary nav)
  - Design reference: `the_dojo_leaderboard/`

### F — UI Polish

- [ ] Spec 033 — Align existing screens to Stitch designs:
  - Dashboard: refine layout, stat cards, today card states → `dojo_dashboard/`
  - Results page: add share preview, trending stat → `dojo_kata_results/`
  - Day Start: heatmap strip, mood/time group buttons → `dojo_daily_ritual_selection/`
  - Kata Selection: card hover states, microcopy → `dojo_kata_selection/`
  - Review each screen against BRANDING.md tokens

---

## Out of this block

- Extended dashboard (Phase 2 — weak areas, practice patterns)
- Full badge system (8 remaining badges)
- "No repeat within 6 months" rule
- Interest-based kata selection (needs PRD)
- Daily kata reminder emails
- Kata quality refinement (A/B prompt comparisons)
