# Backlog

The backlog is not a task list — it is a set of prioritized intentions. Items arrive as raw ideas, get triaged before each block, and advance or get discarded based on the value they bring to the core loop.

---

## Untriaged

_Ideas that arrived and have not been evaluated yet. Candidates for the next triage._

- 2026-03-21 — Kata and prompt quality refinement: research techniques (chain-of-thought rubrics, few-shot examples in ownerContext, role calibration), run A/B comparisons on real sessions, establish a bar for "what makes a kata excellent vs. just good". Includes reviewing the 44 kata drafts (PRDs 006, 008–010) with real usage data once the core loop is live.

---

## Triaged — next block

_Confirmed for the next work block. Moved here after triage._

<!-- When starting a block: move to current.md -->

---

## Triaged — later

_Good ideas, not urgent. Not in the next block._

### Phase 1 — Open the Doors

- Public profile page (username, avatar, streak, recent kata, earned badges)
- ~~Invitation system (creator sends invite links, limited seats)~~ — done (Sprint 005, Spec 026)
- Share card generation (OG image with verdict, exercise name, sensei quote)
- "No repeat within 6 months" rule enforced per user
- ~~Basic streak tracking (days with at least one kata completed)~~ — done (Sprint 002)
- `FIRST KATA` and `5 STREAK` badges
- OG image PNG conversion (current SVG not rendered by Twitter/Slack)

### Phase 2 — The Scoreboard

- Leaderboard among invited users (based on consistency, not score)
- Full badge system: `POLYGLOT`, `ARCHITECT`, `BRUTAL TRUTH`, `CONSISTENT`, `UNDEFINED NO MORE`, `SENSEI APPROVED`, `SQL SURVIVOR`, `RUBBER DUCK`
- Dashboard: weak areas identified by the LLM over time
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
