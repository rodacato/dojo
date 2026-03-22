# Active Block: Sprint 008 — Production Ready + Design System Alignment

**Started:** 2026-03-22
**Phase:** Phase 2 completion

**Expected outcome:** The product is production-ready for real users. OG sharing works, mobile is audited, email reminders exist, the component library is extracted, and all screens align with Stitch designs. Whiteboard kata finally has Mermaid support.

---

## Committed

### A — Sharing & Retention

- [ ] Spec 041 — OG meta tags (Cloudflare Worker or pre-render):
  - Intercept crawler requests (User-Agent contains 'bot')
  - Return HTML with og:image, og:title, og:description for `/kata/:id/result` and `/u/:username`
  - Share cards finally visible on Twitter/Slack/LinkedIn
- [ ] Spec 042 — Daily kata reminder emails (Resend):
  - User preference: opt-in, configurable hour (default 9am)
  - Cron job or scheduled check: if user hasn't completed today's kata, send reminder
  - Email template: minimal, dojo voice, one CTA
  - Unsubscribe link in email
  - Settings page or dashboard toggle for preferences

### B — Mobile & Accessibility

- [ ] Spec 043 — Mobile responsive audit + fixes:
  - Audit all screens on 375px, 390px, 428px breakpoints
  - Fix: kata selection cards stack properly, dashboard stats wrap, leaderboard table scrolls
  - Landing page hero: single column on mobile, terminal demo hidden
  - Admin pages: horizontal scroll on tables
  - Test `prefers-reduced-motion` across all animations (typewriter, counters, pulse)

### C — Component Library Extraction

- [ ] Spec 044 — Extract reusable UI components:
  - `Modal.tsx` — dojo flow (no close on outside click) vs informational
  - `Toast.tsx` — error, warning, info notifications with auto-dismiss
  - `Input.tsx`, `Textarea.tsx`, `Select.tsx` — consistent form inputs
  - `StatCard.tsx` — numbered stat with label (used in dashboard + profile)
  - `AccentCard.tsx` — left-border card (used in results, eval, terms)
  - `GroupButtons.tsx` — segmented control (used in day start, leaderboard, badges)
  - `AchievementBadge.tsx` — earned (glow) vs locked states
  - `SkeletonLoader.tsx` — content placeholder for perceived performance

### D — Whiteboard Kata

- [ ] Spec 045 — Mermaid diagram editor for WHITEBOARD type:
  - Nested split panel: diagram preview (top 60%) + Mermaid syntax editor (bottom 40%)
  - Tab switcher: "Code" | "Preview"
  - Mermaid rendering with dojo dark palette
  - Constraint chips in amber from exercise data
  - Fallback: textarea if Mermaid fails to render

### E — Screen Alignment to Stitch

- [ ] Spec 046 — Visual gap fixes across all screens:
  - Dashboard: heatmap strip on Day Start page (streak context before selection)
  - Kata Active: timer centered in top bar (not right-aligned)
  - CHAT kata: mono/sans font toggle for textarea
  - Eval page: top bar with kata title + time + streaming status
  - Eval page: accent left border only on first sensei message
  - Results: button labels → "Share" + "Keep Practicing" (not "Return to dashboard")
  - Results: side-by-side layout on desktop (share card right column)
  - Landing: dot grid background with mouse proximity effect (respect prefers-reduced-motion)
  - Landing: terminal demo animation loop (cycle through 3-4 example evaluations)

### F — Kata Quality

- [ ] Spec 036 — Kata quality refinement (carried from Sprint 007):
  - Review sensei evaluations from dogfooding sessions
  - Tune owner_context prompts where verdicts are inconsistent
  - Adjust rubric phrasing for exercises that are too harsh or too lenient

---

## Out of this block

- Sidebar navigation (architectural — needs design review for mobile nav pattern first)
- Psychological analysis view (Phase 2 later)
- Drawhaus diagram saved per session
- Interest-based kata selection (needs PRD)
- Phase 3 features (user-submitted exercises)
- Login card-centered design (low priority)
