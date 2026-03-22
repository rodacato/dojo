# Backlog

The backlog is not a task list — it is a set of prioritized intentions. Items arrive as raw ideas, get triaged before each block, and advance or get discarded based on the value they bring to the core loop.

---

## Untriaged

_Ideas that arrived and have not been evaluated yet. Candidates for the next triage._

- 2026-03-22 — Daily kata reminder emails via Resend: opt-in notification if user hasn't completed today's kata by a configurable hour. Resend domain verified.
- 2026-03-22 — Mobile responsive pass: test and fix all screens on mobile breakpoints. The product works on mobile browser but hasn't been audited for small screens.
- 2026-03-22 — OG meta tags for share cards need server-side rendering (SPA can't set og:image for crawlers). Options: pre-render route, Cloudflare Worker, or small SSR middleware.
- 2026-03-22 — Sidebar navigation (Stitch design has persistent sidebar on desktop + bottom nav on mobile). Architectural change — deferred until the screen count justifies it.
- 2026-03-22 — Login card-centered design (Stitch `dojo_login_landing/` shows a separate login card, not the full landing page). Could be useful when users land directly on `/login`.

---

## Triaged — next block

_Confirmed for the next work block. Moved here after triage._

<!-- Sprint 007 items moved to current.md -->

---

## Triaged — later

_Good ideas, not urgent. Not in the next block._

### Phase 1 — Open the Doors

- ~~Public profile page~~ — done (Sprint 006, Spec 029)
- ~~Invitation system~~ — done (Sprint 005, Spec 026)
- ~~Share card generation~~ — done (Sprint 006, Spec 031)
- ~~"No repeat within 6 months" rule~~ — Sprint 007, Spec 035
- ~~Basic streak tracking~~ — done (Sprint 002)
- ~~`FIRST KATA` and `5 STREAK` badges~~ — done (Sprint 006, Spec 030)
- ~~OG image PNG conversion~~ — done (Sprint 006, Spec 031)

### Phase 2 — The Scoreboard

- ~~Leaderboard~~ — done (Sprint 006, Spec 032)
- ~~Full badge system~~ — Sprint 007, Spec 037
- ~~Dashboard: weak areas~~ — Sprint 007, Spec 038
- Psychological analysis view: patterns in how you respond (do you rush? do you avoid certain types?)
- Drawhaus diagram saved per session (whiteboard kata history)

### Phase 3 — Feed the Dojo

- Invited users can propose exercises
- LLM QA gate: proposed exercises evaluated before human review
- Creator review queue: approve, reject, request changes
- Exercise versioning: update a kata without breaking active sessions
- `created_by` attribution: contributors get credit on the exercise card

---

## Explore (PRD needed)

_Ideas that need a PRD before deciding whether they advance._

- 2026-03-22 — **Interest-based kata selection (user profile):** Allow users to define their level (junior, mid, senior) and topics of interest (microservices, DDD, architectures, specific languages, specific frameworks). Use this profile to weight kata selection rather than replace randomness — interests act as categories with higher selection probability, not hard filters. Potential UX: a "randomness slider" that controls how much selection favors the user's declared interests vs. full random from the catalog (e.g., 100% focused → only your topics, 50/50 → half relevant half surprise, full random → classic dojo behavior). Needs PRD to explore: onboarding UX for declaring interests, how the weighting algorithm interacts with the existing catalog taxonomy and the "no repeat within 6 months" rule, whether the sensei's evaluation should adapt to declared level, slider UX that feels intentional not gimmicky, and default behavior for users who skip profile setup. *Expert routing: Priya (scope/value), Valentina (taxonomy/progression), Yemi (sensei adaptation), Soren (slider + selection UX).*

---

## Discarded

_Evaluated and discarded. Documented so the debate does not happen again._

- **Dojocho** (dedicated kata curation tool at scale) — out of scope for now, complexity not justified at current phases
- **Team dojos** (shared practice spaces for engineering teams) — contradicts the individual practice and curated community focus
- **Native mobile** — the web app is sufficient, mobile browser works
- **AI-generated exercises on demand** — too variable in quality, cannot guarantee the sensei's standard
- **Timed competitions** — contradicts the "practice over competition" philosophy
- **Certificates or badges for employers** — not the purpose of the product
