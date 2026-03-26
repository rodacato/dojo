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
- [ ] Admin Edit Exercise page: aggregated feedback section (clarity/timing/evaluation distributions)
- [ ] Feedback breakdown by variation (which sensei persona gets "missed the point"?)
- [ ] Individual notes list with dates
- [ ] Admin notes field — creator can leave internal notes about edit decisions

### Exercise Lifecycle
- [ ] Archive exercise action (status → 'archived', removed from catalog, historical sessions preserved)
- [ ] Version increment on edit (display version number in admin)
- [ ] Exercise status indicator in admin list (published / draft / archived)

### Backlog
- Full version history / diff view
- Bulk archive/publish operations

---

## Part 4 — Secondary Screens Stitch Alignment

### Login Page (`/login`)
- [ ] Card-centered layout with `dojo_` logo + blinking cursor
- [ ] Tagline: "The dojo for developers who still have something to prove. To themselves."
- [ ] Single GitHub OAuth CTA: "Enter the dojo."
- [ ] Footer: "No account needed. Login with GitHub." muted

### Badges Page (`/badges`)
- [ ] 3-column grid (2 on mobile): earned (full color + glow) vs locked (muted)
- [ ] Filter: "All" | "Earned" | "Locked" group buttons
- [ ] Prestige badge: full-width card with accent glow
- [ ] Category labels: Practice / Consistency / Mastery
- [ ] Header count: "4 of 10 earned"

### Leaderboard (`/leaderboard`)
- [ ] Top 3 ranks with accent color
- [ ] Current user row highlighted
- [ ] Footer: "Ranking resets on the 1st. Consistency compounds."

### Public Profile (`/u/:username`)
- [ ] Avatar (rounded-md, not circular) + username + member since
- [ ] Streak badge top-right
- [ ] 4 stat cards
- [ ] 90-day heatmap
- [ ] Earned badges section

---

## Carried / Out of scope

- Landing page full redesign (own sprint — high effort)
- Phase 3 contributor submission flow (needs feedback data first)
- Share analytics
- Exercise A/B testing
