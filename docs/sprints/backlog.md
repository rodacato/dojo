# Backlog

The backlog is not a task list — it is a set of prioritized intentions. Items arrive as raw ideas, get triaged before each block, and advance or get discarded based on the value they bring to the core loop.

---

## Untriaged

_Ideas that arrived and have not been evaluated yet. Candidates for the next triage._

- 2026-03-21 — Kata and prompt quality refinement: research techniques (chain-of-thought rubrics, few-shot examples in ownerContext, role calibration), run A/B comparisons on real sessions, establish a bar for "what makes a kata excellent vs. just good". Includes reviewing the 44 kata drafts (PRDs 006, 008–010) with real usage data once the core loop is live.
- 2026-03-22 — Daily kata reminder emails via Resend: opt-in notification if user hasn't completed today's kata by a configurable hour. Needs domain verification on Resend before sending real emails.
- 2026-03-22 — Mobile responsive pass: test and fix all screens on mobile breakpoints. The product works on mobile browser but hasn't been audited for small screens.

---

## Triaged — next block

_Confirmed for the next work block. Moved here after triage._

### Sprint 007 — Phase 1 completion + Phase 2 start

- "No repeat within 6 months" rule enforced per user — query-level filter on exercise selection
- Full badge system: `POLYGLOT`, `ARCHITECT`, `BRUTAL TRUTH`, `CONSISTENT`, `UNDEFINED NO MORE`, `SENSEI APPROVED`, `SQL SURVIVOR`, `RUBBER DUCK` — trigger rules + badge collection page (`/badges`, design: `badges_collection/`)
- Extended dashboard (Phase 2): "Where you struggle" topic chips, "How you practice" stats, "Sensei suggests" review topics — cross-session LLM analysis (design: `dojo_extended_dashboard_phase_2/`)
- Verify `notdefined.dev` domain in Resend for production emails
- Kata quality refinement pass: review sensei evaluations from dogfooding, tune prompts

---

## Triaged — later

_Good ideas, not urgent. Not in the next block._

### Phase 1 — Open the Doors

- ~~Public profile page (username, avatar, streak, recent kata, earned badges)~~ — Sprint 006, Spec 029
- ~~Invitation system (creator sends invite links, limited seats)~~ — done (Sprint 005, Spec 026)
- ~~Share card generation (OG image with verdict, exercise name, sensei quote)~~ — Sprint 006, Spec 031
- ~~"No repeat within 6 months" rule enforced per user~~ — triaged for Sprint 007
- ~~Basic streak tracking (days with at least one kata completed)~~ — done (Sprint 002)
- ~~`FIRST KATA` and `5 STREAK` badges~~ — Sprint 006, Spec 030
- ~~OG image PNG conversion (current SVG not rendered by Twitter/Slack)~~ — Sprint 006, Spec 031

### Phase 2 — The Scoreboard

- ~~Leaderboard among invited users (based on consistency, not score)~~ — Sprint 006, Spec 032
- ~~Full badge system~~ — triaged for Sprint 007
- ~~Dashboard: weak areas identified by the LLM over time~~ — triaged for Sprint 007
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
