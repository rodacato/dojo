# Active Block: Sprint 009 — Design Alignment + Quality of Life

**Started:** 2026-03-24
**Phase:** Phase 2 — Pre-invite polish

**Expected outcome:** The 6 core screens align with Stitch design direction. Navigation shell exists. Inter font for body text. QoL fixes across the board. Clear backlog of what's left for secondary screens.

**Strategy:** Pantalla por pantalla, in order of user impact. Per screen: implementar / backlog / descartar. Sidebar last (needs content first).

---

## Pre-work (Global)

### Fonts & Tokens
- [x] Add Inter font for body text *(already configured — fontsource + Tailwind theme)*
- [x] Audit and align Tailwind theme tokens with BRANDING.md *(already aligned)*

### Layout Shell
- [x] Establish `AppShell` layout component with Sidebar + BottomNav

### Component Library (Spec 044 — carried from Sprint 008)
Extract reusable components that multiple screens will need:
- [x] `Modal.tsx` — dojo flow (no close on outside click) vs informational
- [x] `Toast.tsx` — error, warning, info notifications with auto-dismiss
- [x] `SkeletonLoader.tsx` — content placeholder for perceived performance
- [x] `AccentCard.tsx` — left-border card (used in results, eval, terms)
- [x] `StatCard.tsx` — numbered stat with label (used in dashboard + profile)
- [x] `GroupButtons.tsx` — segmented control (used in day start, leaderboard, badges)
- [x] `Input.tsx`, `Textarea.tsx` — consistent form inputs

### Accessibility (from Spec 043/046)
- [x] Audit `prefers-reduced-motion` across all animations (global CSS media query)

---

## Screen 1 — Results Page (`/kata/:id/result`)

**Stitch ref:** [`dojo_kata_results/`](../screens/dojo_kata_results/) — [screen.png](../screens/dojo_kata_results/screen.png) · [code.html](../screens/dojo_kata_results/code.html)
**Current:** `apps/web/src/pages/ResultsPage.tsx`

### Implementar
- [x] Two-column layout: analysis left (7-col), share card right (5-col) — stacks on mobile
- [x] Verdict in JetBrains Mono large uppercase with blinking cursor
- [x] Sensei role label above analysis (`[Senior DBA — PostgreSQL, 12 yrs]`)
- [x] Analysis in Inter prose (not mono) with accent left border
- [x] Share card preview inline (not broken image)
- [x] Bottom CTAs: "Keep Practicing" filled + "Share Results" ghost
- [x] "+N positions in the dojo this week" muted stat between buttons
- [x] Fix "Completed" vs "Failed" label based on session status

### Backlog
- Side-by-side desktop layout (requires testing responsive breakpoints)
- Animated verdict reveal on page load

### Descartar
- Sidebar nav on results (not needed — this is a focused review screen)

---

## Screen 2 — Sensei Evaluation (`/kata/:id/eval`)

**Stitch ref:** [`dojo_evaluation_sensei_s_verdict/`](../screens/dojo_evaluation_sensei_s_verdict/) — [screen.png](../screens/dojo_evaluation_sensei_s_verdict/screen.png) · [code.html](../screens/dojo_evaluation_sensei_s_verdict/code.html)
**Current:** `apps/web/src/pages/SenseiEvalPage.tsx`

### Implementar
- [x] Chat bubble layout: sensei left (surface bg + accent left border on first msg), user right (accent bg)
- [x] Sensei avatar with initials + role label
- [x] Code blocks inside evaluation messages (parsed code fences in StreamingText)
- [x] Verdict card at end: badge + prose + "View full analysis →"
- [x] Bottom input: disabled while streaming → active for follow-up → disabled after verdict ("The sensei has spoken.")
- [x] Streaming indicator: blinking cursor `▌` next to "Evaluating..."
- [x] Gradual text reveal when `LLM_STREAM=false` (useTypingReveal hook)

### Backlog
- Sidebar with sections (analysis, follow-up, verdict) — needs more content to justify
- Reconnect with cached stream replay

### Descartar
- Full chat history sidebar (over-engineered for max 2 follow-ups)

---

## Screen 3 — Dashboard (`/dashboard`)

**Stitch ref:** [`dojo_dashboard/`](../screens/dojo_dashboard/) — [screen.png](../screens/dojo_dashboard/screen.png) · [code.html](../screens/dojo_dashboard/code.html)
**Current:** `apps/web/src/pages/DashboardPage.tsx`

### Implementar
- [x] Streak card: large mono number + "Last practiced: X" muted (Stitch grid layout)
- [x] Today card: two states — empty ("the dojo was empty today" + CTA) vs complete (verdict badge)
- [x] Recent activity: card-style rows with type badge + difficulty + verdict
- [x] Right column: weak areas + practice patterns + sensei suggests (2-col grid on desktop)
- [x] System status footer: subtle muted text at bottom
- [x] Header: handled by AppShell sidebar

### Backlog
- "Where you struggle" section (Phase 2 extended dashboard, Spec from `dojo_extended_dashboard_phase_2/`)
- "The sensei suggests revisiting" topic pills
- Pattern analysis stats (avg time, avoided types, timeouts)

### Descartar
- Full sidebar nav in dashboard (implement in sidebar sprint)
- Charts/graphs (raw numbers only per Stitch)

---

## Screen 4 — Day Start (`/start`)

**Stitch ref:** [`dojo_daily_ritual_selection/`](../screens/dojo_daily_ritual_selection/) — [screen.png](../screens/dojo_daily_ritual_selection/screen.png) · [code.html](../screens/dojo_daily_ritual_selection/code.html)
**Current:** `apps/web/src/pages/DayStartPage.tsx`

### Implementar
- [x] Date display in JetBrains Mono lowercase (e.g. "monday, march 24")
- [x] Inline streak + heatmap strip (compact 30-day dots below date)
- [x] Mood cards: larger with emoji + label, selected state with accent border
- [x] Time selector: pill group buttons, selected state filled
- [x] "SHOW MY KATA →" full-width CTA (disabled until both selected)
- [x] Footer microcopy in muted: "your kata are generated from your selections. no skip. no reroll."

### Backlog
- Heatmap strip interactive (hover shows date + count)

### Descartar
- Nothing — this screen is well defined

---

## Screen 5 — Kata Selection (`/kata`)

**Stitch ref:** [`dojo_kata_selection/`](../screens/dojo_kata_selection/) — [screen.png](../screens/dojo_kata_selection/screen.png) · [code.html](../screens/dojo_kata_selection/code.html)
**Current:** `apps/web/src/pages/KataSelectionPage.tsx`

### Implementar
- [x] Header: "select_your_kata" in mono with blinking cursor + subtitle
- [x] Mood/time filters as read-only pills (already selected, muted)
- [x] Card hover: border transition `#334155` → `#6366F1` at 150ms
- [x] Card layout: type badge top-left, difficulty top-right, duration bottom in mono
- [x] Footer microcopy: "these are your kata. no skip. no reroll."
- [x] Empty state (already implemented — polish styling)

### Backlog
- Card animations on load (staggered fade-in)

### Descartar
- Sidebar nav on selection (focused screen, no nav needed)

---

## Screen 6 — Kata Active: CODE (`/kata/:id`)

**Stitch ref:** [`dojo_coding_interface/`](../screens/dojo_coding_interface/) — [screen.png](../screens/dojo_coding_interface/screen.png) · [code.html](../screens/dojo_coding_interface/code.html)
**Current:** `apps/web/src/pages/KataActivePage.tsx`

### Implementar
- [x] Top bar: title left, timer center (color-coded), submit right
- [x] Timer colors: normal → amber ≤20% → red ≤10%
- [x] Left panel: problem description with proper markdown rendering (KataBody)
- [x] Status bar bottom: subtle system indicators (connected, mode)
- [x] Honor code reminder at panel bottom styled consistently

### Backlog
- Bottom status bar with connection indicator + keystroke count
- Editor theme alignment with dojo palette

### Descartar
- Nothing major — this screen is closest to Stitch already

---

## Screen 6b — Kata Active: CHAT (`/kata/:id`)

**Stitch ref:** [`dojo_chat_kata_view/`](../screens/dojo_chat_kata_view/) — [screen.png](../screens/dojo_chat_kata_view/screen.png) · [code.html](../screens/dojo_chat_kata_view/code.html)
**Current:** ChatEditor component in `KataActivePage.tsx`

### Implementar
- [x] Textarea with proper placeholder: "Start writing. Think out loud. The sensei reads everything."
- [x] Word count bottom-right
- [x] Mono/sans toggle

### Backlog
- Auto-save indicator
- Character/paragraph count

### Descartar
- Nothing — mostly done

---

## Screen 6c — Kata Active: WHITEBOARD (`/kata/:id`)

**Stitch ref:** [`dojo_whiteboard_kata/`](../screens/dojo_whiteboard_kata/) — [screen.png](../screens/dojo_whiteboard_kata/screen.png) · [code.html](../screens/dojo_whiteboard_kata/code.html)
**Current:** MermaidEditor component

### Implementar
- [x] Constraint chips in amber from exercise tags (whiteboard mode)
- [x] Tab switcher "Code" | "Preview" styling alignment
- [x] Diagram rendering with dojo dark palette

### Backlog
- Floating tools (zoom, reset)
- Diagram grid background

### Descartar
- Freehand drawing tools (not in scope)

---

## Screen 7 — Sidebar Navigation (All authenticated pages)

**Stitch ref:** Multiple screens show sidebar
**Current:** No sidebar exists

### Implementar
- [x] `AppShell` component wrapping all auth routes
- [x] Sidebar: logo + nav items (Material Symbols SVG icons) + collapsible
- [x] Collapsible on desktop (icon-only mode, persisted to localStorage)
- [x] Mobile: bottom nav with SVG icons
- [x] Active route indicator: accent left border on sidebar item

### Backlog
- Additional nav items: drills, stats, settings, profile (when those pages exist)
- Sidebar collapse state persisted in localStorage
- Mobile bottom nav with 4 items

### Descartar
- Sidebar on kata active page (focused screen, no nav)
- Sidebar on eval page (focused screen)

---

## Secondary Screens (Backlog — full analysis, not in this sprint)

---

### Extended Dashboard (`/dashboard` Phase 2)

**Stitch ref:** [`dojo_extended_dashboard_phase_2/`](../screens/dojo_extended_dashboard_phase_2/) — [screen.png](../screens/dojo_extended_dashboard_phase_2/screen.png) · [code.html](../screens/dojo_extended_dashboard_phase_2/code.html)
**Current:** `DashboardPage.tsx` (base version)

#### Implementar (future sprint)
- "Where you struggle": topic chips with frequency count, red border
- "How you practice": 3 stat rows — avg time vs estimate, most avoided type, sessions timed out
- "The sensei suggests revisiting": amber topic chips from cross-session LLM analysis
- Raw numbers only — no charts, no sparklines

#### Backlog
- LLM-driven cross-session pattern analysis endpoint
- Topic aggregation from all evaluations

#### Descartar
- Trend arrows, graphs, progress bars (contradicts raw-numbers principle)

---

### Leaderboard (`/leaderboard`)

**Stitch ref:** [`the_dojo_leaderboard/`](../screens/the_dojo_leaderboard/) — [screen.png](../screens/the_dojo_leaderboard/screen.png) · [code.html](../screens/the_dojo_leaderboard/code.html)
**Current:** `LeaderboardPage.tsx`

#### Implementar (future sprint)
- Top 3 rank numbers colored (gold/silver/bronze tones, subtle)
- Period filter: "This month" | "All time" group buttons
- Current user row highlighted with `bg-elevated`
- Pass rate color coding: >70% emerald, 40-70% amber, <40% red
- Footer: "Ranking resets on the 1st. Consistency compounds."

#### Backlog
- Hover row expansion with mini stats

#### Descartar
- Podiums, medals, trophies (not the vibe)

---

### Badges Collection (`/badges`)

**Stitch ref:** [`badges_collection/`](../screens/badges_collection/) — [screen.png](../screens/badges_collection/screen.png) · [code.html](../screens/badges_collection/code.html)
**Current:** `BadgesPage.tsx`

#### Implementar (future sprint)
- 3-column grid: earned (full color + border glow) vs locked (muted, barely readable)
- Filter: "All" | "Earned" | "Locked" group buttons
- UNDEFINED NO MORE prestige badge: full-width card, strongest glow
- Category section labels: Practice / Consistency / Mastery
- "4 of 10 earned" header count
- Footer: "Badges are earned in the dojo. There are no shortcuts."

#### Backlog
- Badge detail modal on click (description + how to earn + date earned)
- Aurora/glow animation on prestige badge

#### Descartar
- Lock icons on unearned badges (muting is enough)
- Progress bars toward badges

---

### Public Profile (`/u/:username`)

**Stitch ref:** [`dojo_public_profile/`](../screens/dojo_public_profile/) — [screen.png](../screens/dojo_public_profile/screen.png) · [code.html](../screens/dojo_public_profile/code.html)
**Current:** `PublicProfilePage.tsx`

#### Implementar (future sprint)
- GitHub avatar (48px, 6px radius — not circular) + username + member since
- Streak badge top-right (large mono number)
- 4 stat cards: Total kata / Pass rate / Avg time / Languages
- 90-day activity heatmap: dots colored by practiced/passed/empty
- Recent kata list (read-only): title, badges, verdict, time
- Earned badges section — unearned not shown

#### Backlog
- Heatmap tooltip on hover (date + count)
- Language breakdown chip list

#### Descartar
- Follow button, message button (not a social network)

---

### Landing Page (`/`)

**Stitch ref:** [`dojo_main_landing_page/`](../screens/dojo_main_landing_page/) — [screen.png](../screens/dojo_main_landing_page/screen.png) · [code.html](../screens/dojo_main_landing_page/code.html)
**Current:** `LandingPage.tsx`

#### Implementar (own sprint — high effort)
- Navbar: `dojo_` logo + "GitHub ↗" + "Request access" ghost — transparent → solid on scroll
- Hero: typewriter headline + subhead + dual CTAs + terminal demo window (right side)
- Dot grid background with mouse proximity effect (respect `prefers-reduced-motion`)
- "The Problem" section: two-column prose
- "How It Works" section: 4-step horizontal flow
- Social proof: 3 stat counters with animation + practitioner quotes
- Open source: GitHub stats (stars, forks, last commit)
- Access: request form (GitHub handle + optional textarea)
- Footer: minimal + "Not for everyone. Exactly as intended."

#### Backlog
- Terminal demo animation loop (cycle through example evaluations)
- Live GitHub stats via API
- Request form submission to DB

#### Descartar
- Video demo (too heavy for Phase 1)
- Pricing section (free product)

---

### Login (`/login`)

**Stitch ref:** [`dojo_login_landing/`](../screens/dojo_login_landing/) — [screen.png](../screens/dojo_login_landing/screen.png) · [code.html](../screens/dojo_login_landing/code.html)
**Current:** `LoginPage.tsx`

#### Implementar (future sprint)
- Centered card layout with `dojo_` logo + blinking cursor
- Tagline: "The dojo for developers who still have something to prove. To themselves."
- Single GitHub OAuth CTA: "Enter the dojo."
- Footer: "No account needed. Login with GitHub." muted
- No nav, no back, no alternatives

#### Backlog
- Nothing — this is a one-screen flow

#### Descartar
- Alternative auth providers (GitHub only)

---

### Open Source Page (`/open-source`)

**Stitch ref:** [`open_source_transparency/`](../screens/open_source_transparency/) — [screen.png](../screens/open_source_transparency/screen.png) · [code.html](../screens/open_source_transparency/code.html)
**Current:** `OpenSourcePage.tsx` (exists)

#### Implementar (future sprint)
- Header: "Read the code. Trust the product."
- GitHub stats bar: stars / forks / license / last commit
- 2×2 card grid: apps/web, apps/api, packages/shared, docs/
- "The sensei's logic" section: prose + static prompt snippet in code block
- Contributing: two columns — welcome vs not welcome (red dots on not-welcome)
- Architecture section: brief intro + link to ADRs

#### Backlog
- Live GitHub API stats
- Link to specific ADRs

#### Descartar
- Full architecture diagram on this page (link to docs instead)

---

### Changelog (`/changelog`)

**Stitch ref:** [`dojo_changelog/`](../screens/dojo_changelog/) — [screen.png](../screens/dojo_changelog/screen.png) · [code.html](../screens/dojo_changelog/code.html)
**Current:** `ChangelogPage.tsx` (exists)

#### Implementar (future sprint)
- RSS icon top-right
- "In progress" section: items without dates, muted
- Entries: date (mono) + phase badge + title + prose lines + optional commit link
- Separators: `#334155` rule + 32px vertical space
- First-person decision voice — not feature announcements

#### Backlog
- RSS feed endpoint
- Auto-generate from git tags

#### Descartar
- Markdown-based changelog (hand-written entries are better for the voice)

---

### Share Card (OG image)

**Stitch ref:** [`dojo_share_card_presentation/`](../screens/dojo_share_card_presentation/) — [screen.png](../screens/dojo_share_card_presentation/screen.png) · [code.html](../screens/dojo_share_card_presentation/code.html)
**Current:** Server-side satori generation (`share.ts`)

#### Implementar (polish)
- Align colors with case-insensitive verdicts (already fixed)
- Pull quote: harshest/most specific line from analysis
- Two variants: PASSED (emerald) and NEEDS WORK (red)

#### Backlog
- Share card modal preview in Results page (instead of inline broken image)

#### Descartar
- Client-side canvas rendering (server-side satori is fine)

---

### Invite — Request Access (`/invite`)

**Stitch ref:** [`access_request_mode/`](../screens/access_request_mode/) — [screen.png](../screens/access_request_mode/screen.png) · [code.html](../screens/access_request_mode/code.html)
**Current:** `InviteRedeemPage.tsx` (handles both modes)

#### Implementar (future sprint)
- Title: "The dojo is invite-only."
- Dot grid background (static)
- Form card: GitHub handle + optional "why" textarea + "Request access" button
- Placeholder: "Optional. But the honest answers are more interesting."
- Footer: "No marketing emails. No confirmation email — if you're in, you'll know."

#### Backlog
- Nothing

#### Descartar
- Email confirmation flow (keep it simple)

---

### Invite — Redeem Token (`/invite?token=`)

**Stitch ref:** [`access_redeem_mode/`](../screens/access_redeem_mode/) — [screen.png](../screens/access_redeem_mode/screen.png) · [code.html](../screens/access_redeem_mode/code.html)
**Current:** `InviteRedeemPage.tsx`

#### Implementar (future sprint)
- Title: "Someone opened the doors for you."
- Invited-by attribution: "@handle" or "An invitation was extended."
- Single GitHub OAuth CTA: "Enter the dojo →"
- Disclaimer: "The timer doesn't pause. The sensei is honest. The dojo is real."

#### Backlog
- Nothing

#### Descartar
- Nothing

---

### 404 (`*`)

**Stitch ref:** [`dojo_404_path_not_found/`](../screens/dojo_404_path_not_found/) — [screen.png](../screens/dojo_404_path_not_found/screen.png) · [code.html](../screens/dojo_404_path_not_found/code.html)
**Current:** `NotFoundPage.tsx`

#### Implementar (polish)
- Already close to Stitch — polish styling
- Large "404" muted background
- "This path doesn't exist." + blinking cursor
- "Which, honestly, is a perfectly valid state for a developer to be in."
- Terminal fake text at bottom

#### Backlog
- Nothing

#### Descartar
- Nothing — already well implemented

---

### Terms of Service (`/terms`)

**Stitch ref:** [`dojo_terms_of_service/`](../screens/dojo_terms_of_service/) — [screen.png](../screens/dojo_terms_of_service/screen.png) · [code.html](../screens/dojo_terms_of_service/code.html)
**Current:** `TermsPage.tsx`

#### Implementar (polish)
- Header: "Plain language. No surprises."
- Sticky sidebar with section anchors (desktop) / top anchor links (mobile)
- Active section indicator: accent left border
- Honor code section: accent card treatment

#### Backlog
- Nothing

#### Descartar
- Nothing

---

### Privacy Policy (`/privacy`)

**Stitch ref:** [`dojo_privacy_policy/`](../screens/dojo_privacy_policy/) — [screen.png](../screens/dojo_privacy_policy/screen.png) · [code.html](../screens/dojo_privacy_policy/code.html)
**Current:** `PrivacyPage.tsx`

#### Implementar (polish)
- Same layout as Terms
- "What we don't collect" section with equal visual weight
- OAuth scopes as inline code: `read:user`, `user:email`
- Data retention accent card

#### Backlog
- Nothing

#### Descartar
- Nothing

---

### Admin — Exercise List (`/admin`)

**Stitch ref:** [`admin_exercises_list/`](../screens/admin_exercises_list/) — [screen.png](../screens/admin_exercises_list/screen.png) · [code.html](../screens/admin_exercises_list/code.html)
**Current:** `AdminExercisesPage.tsx`

#### Implementar (low priority)
- Admin sidebar with red "admin" label
- Filter row: type, difficulty, status
- Dense table: 40px rows, text-link actions
- Sessions count + avg score columns

#### Backlog
- Bulk actions, search, pagination

#### Descartar
- Nothing

---

### Admin — New Exercise (`/admin/exercises/new`)

**Stitch ref:** [`admin_new_exercise/`](../screens/admin_new_exercise/) — [screen.png](../screens/admin_new_exercise/screen.png) · [code.html](../screens/admin_new_exercise/code.html)
**Current:** `AdminNewExercisePage.tsx`

#### Implementar (low priority)
- Evaluation rubric textarea: "Used by the sensei — not shown to the user"
- Sensei persona selector
- Draft/Publish toggle
- Live preview panel

#### Backlog
- Preview with mock evaluation

#### Descartar
- Nothing

---

## Carried from previous sprints

- [ ] Spec 043 — Mobile responsive audit + fixes
- [ ] Spec 036 — Kata quality refinement

---

## Out of this sprint

- Landing page full redesign (own sprint — high effort)
- Extended dashboard analytics (needs backend aggregation)
- Admin UI redesign (creator-only, low priority)
- Phase 3 features
