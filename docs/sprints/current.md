# Active Block: Sprint 010 — Feedback Loop + Share + Admin Review

**Started:** 2026-03-26
**Phase:** Phase 2 — Pre-invite polish (closing)

**Expected outcome:** Users can give structured feedback after each kata. The share experience has a proper public landing page. Admin can review feedback signals, leave notes, and archive exercises. Secondary screens aligned with Stitch.

**Strategy:** Feedback first (unlocks admin review), share investigation + implementation second, secondary screens as polish if time allows.

---

## Part 1 — Kata Feedback System (PRD-011)

**Ref:** [`docs/prd/011-kata-feedback-system.md`](../prd/011-kata-feedback-system.md)

### Database
- [ ] Migration: `kata_feedback` table (session_id, exercise_id, variation_id, user_id, clarity, timing, evaluation, note, submitted_at)
- [ ] Migration: Add `version` (integer default 1) and `admin_notes` (text nullable) columns to exercises table

### API
- [ ] `POST /sessions/:id/feedback` — submit feedback (validated: session owned by user, session completed, one per session)
- [ ] `GET /admin/exercises/:id/feedback` — aggregated feedback + individual notes, filterable by variation

### Frontend — Feedback UI
- [ ] Feedback section on Results page — collapsed by default, "How was this kata? (optional)"
- [ ] 3 segmented controls: clarity, timing, evaluation (using GroupButtons component)
- [ ] Optional note textarea (max 280 chars)
- [ ] Submit + dismiss states
- [ ] Prevent double submission (one per session)

---

## Part 2 — Share System Redesign

### Investigation (before code)
- [ ] Define share flow: what happens when someone clicks a share link?
- [ ] Design public results page (`/share/:sessionId`) — verdict, sensei quote, exercise title, CTA

### Implementation
- [ ] Public route `/share/:sessionId` — no auth required, shows verdict + sensei pull quote + exercise info
- [ ] OG meta tags on public share page (title, description, image from existing satori endpoint)
- [ ] CTA for visitors: "Enter the dojo" → login/landing
- [ ] Update ShareButton to copy public share URL instead of internal results URL
- [ ] Redesign share card preview on Results page to match new share experience

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
