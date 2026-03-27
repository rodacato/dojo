# Backlog

The backlog is not a task list — it is a set of prioritized intentions. Items arrive as raw ideas, get triaged before each block, and advance or get discarded based on the value they bring to the core loop.

---

## Untriaged

_Ideas that arrived and have not been evaluated yet. Candidates for the next triage._

_(cleared 2026-03-27)_

---

## Triaged — next block

_Confirmed for the next work block. Moved here after triage._

<!-- Sprint 008 items moved to current.md -->

---

## Triaged — later

_Good ideas, not urgent. Not in the next block._

### Sprint 016 candidates (panel-approved 2026-03-27)

From `docs/wip/EXERCISE-VARIETY-ANALYSIS.md` review:

- **SQL advanced kata** — 2-3 new exercises: window functions, CTEs, recursive CTEs. Piston + SQLite already works. Fills a gap no platform covers well (Tomás)
- **"Fix the bug" kata type** — new exercises in the Practice loop where user gets broken code + failing tests. High differentiator vs LeetCode (Priya, Valentina)
- **"Surprise me" / random kata button** — zero decision fatigue entry point to the kata loop. Partially built (interest-based selection exists). Frontend-only ~2 days (Tomás)
- **"After solving: approaches" in course player** — collapsible note after step completion showing alternative approaches. Content-only addition to Step schema, no new backend (Soren)

### Phase 2 — The Scoreboard

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

- ~~Interest-based kata selection~~ — **Completed in Sprint 011** (user_preferences, weighted ordering, DayStart customization)

---

## Discarded

_Evaluated and discarded. Documented so the debate does not happen again._

- **Dojocho** (dedicated kata curation tool at scale) — out of scope for now, complexity not justified at current phases
- **Team dojos** (shared practice spaces for engineering teams) — contradicts the individual practice and curated community focus
- **Native mobile** — the web app is sufficient, mobile browser works
- **AI-generated exercises on demand** — too variable in quality, cannot guarantee the sensei's standard
- **Timed competitions** — contradicts the "practice over competition" philosophy
- **Certificates or badges for employers** — not the purpose of the product
