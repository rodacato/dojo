# Active Block: Sprint 010 — Feedback Loop + Share + Admin Review

**Started:** 2026-03-26
**Phase:** Phase 2 — Pre-invite polish (closing)

**Expected outcome:** Users can give structured feedback after each kata. The share experience has a proper public landing page. Admin can review feedback signals, leave notes, and archive exercises. Secondary screens aligned with Stitch.

**Strategy:** Feedback first (unlocks admin review), share investigation + implementation second, secondary screens as polish if time allows.

---

## Part 1 — Kata Feedback System (PRD-011)

**Ref:** [`docs/prd/011-kata-feedback-system.md`](../prd/011-kata-feedback-system.md)

### Database
- [x] Migration: `kata_feedback` table (session_id, exercise_id, variation_id, user_id, clarity, timing, evaluation, note, submitted_at)
- [x] Migration: Add `version` (integer default 1), `admin_notes` (text nullable), `updated_at` columns to exercises table

### API
- [x] `POST /sessions/:id/feedback` — submit feedback (validated: session owned by user, session completed, one per session)
- [x] `GET /sessions/:id/feedback` — check if feedback already submitted
- [x] `GET /admin/exercises/:id/feedback` — aggregated feedback + individual notes, by variation

### Frontend — Feedback UI
- [x] FeedbackSection component — collapsed by default, "How was this kata? (optional)"
- [x] 3 segmented controls: clarity, timing, evaluation (using GroupButtons component)
- [x] Optional note textarea (max 280 chars)
- [x] Submit + dismiss states
- [x] Prevent double submission (checks existing feedback on load)

---

## Part 2 — Share System Redesign

### Investigation (before code)
- [x] Define share flow: public page at `/share/:sessionId` with verdict, quote, CTA
- [x] Design public results page — centered card with verdict badge, exercise info, sensei quote, user, CTA

### Implementation
- [x] API: `GET /share/:sessionId` — public JSON endpoint with verdict, pullQuote, exercise info, user
- [x] Frontend: `SharePage` — public route, no auth, verdict + sensei quote + exercise + CTA
- [x] OG meta tags on public share page (title, description, og:image from satori endpoint)
- [x] CTA for visitors: "Enter the dojo →" → landing
- [x] ShareButton URL changed from `/kata/:id/result` to `/share/:id`
- [x] Fixed ShareCardPreview verdict color mapping (was using old verdict names)

### Backlog
- Share analytics (click tracking, conversion)
- Custom share text templates

---

## Part 3 — Admin Review + Exercise Lifecycle

### Feedback Review
- [x] Admin Edit Exercise page: aggregated feedback section (clarity/timing/evaluation distributions)
- [x] Feedback breakdown by variation (which sensei persona gets "missed the point"?)
- [x] Individual notes list with dates
- [x] Admin notes field — creator can leave internal notes about edit decisions

### Exercise Lifecycle
- [x] Archive exercise action (POST /admin/exercises/:id/archive, confirm dialog)
- [x] Version increment on edit (sql`version + 1` + updated_at on every PUT)
- [x] Exercise status indicator in admin list (already had StatusBadge component)

### Backlog
- Full version history / diff view
- Bulk archive/publish operations

---

## Part 4 — Secondary Screens Stitch Alignment

### Login Page (`/login`)
- [x] Card-centered layout with `dojo_` logo + blinking cursor + watermark bg
- [x] Tagline: "The dojo for developers who still have something to prove. To themselves."
- [x] Single GitHub OAuth CTA: "Enter the dojo." accent style
- [x] Footer: "No account needed. Login with GitHub." muted

### Badges Page (`/badges`)
- [x] 2-col mobile / 3-col desktop grid: earned (glow) vs locked (muted)
- [x] Filter: "All" | "Earned" | "Locked" group buttons
- [x] Prestige badges: full-width card with accent glow
- [x] Category section labels: Practice / Consistency / Mastery
- [x] Header count: "4 of 10 earned"
- [x] Removed redundant nav header (AppShell handles navigation)

### Leaderboard (`/leaderboard`)
- [x] Top 3 ranks with accent color
- [x] Current user row highlighted
- [x] Footer: "Ranking resets on the 1st. Consistency compounds."
- [x] Removed redundant nav header (AppShell handles navigation)

### Public Profile (`/u/:username`)
- [x] Avatar (rounded-md) + username + member since
- [x] Streak in accent-bordered card
- [x] 4 stat cards
- [x] 90-day heatmap
- [x] Earned badges section

---

## Carried / Out of scope

- Landing page full redesign (own sprint — high effort)
- Phase 3 contributor submission flow (needs feedback data first)
- Share analytics
- Exercise A/B testing
