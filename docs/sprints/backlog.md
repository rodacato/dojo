# Backlog

The backlog is not a task list — it is a set of prioritized intentions. Items arrive as raw ideas, get triaged before each block, and advance or get discarded based on the value they bring to the core loop.

---

## Untriaged

_Ideas that arrived and have not been evaluated yet. Candidates for the next triage._

_(cleared 2026-03-27)_

---

## Triaged — next block

_Confirmed for the next work block. Moved here after triage._

<!-- Sprint 020 items moved to current.md — 2026-04-20 -->

---

## Triaged — later

_Good ideas, not urgent. Not in the next block._

### Sprint 021+ candidates

Deferred desde Sprint 019:

- **Retrieval interleaving** — Lesson N tests usan identifiers introducidos en Lesson N-1. §3 del framework. Necesita PRD propio antes de sprint (Dr. Elif Yıldız)
- **Diff visual** entre la solución del learner y la `step.solution` reference. Polish posterior al "Alternative approach" ya shippeado en Sprint 019 (Soren)

Conditional on Sprint 020 checkpoint:

- **Python course full curriculum** — PRD 025 shippea en S020; el curso completo (2-3 sub-cursos × 8-12 steps) es S021+ (Nadia S7)
- **"Ask the sensei" full chat/quota** — si S020 solo shippea MVP (Opción A), threaded chat y quota-based son S021+ (Yemi)
- **"Code Review" full format** — schema change + UI + rubric + 3 katas. S020 solo shippea POC de 1 kata (Priya + Hiroshi)

UX gaps promoted from Sprint 020 Part 1 audit (see [docs/ux-gaps-2026-04.md](ux-gaps-2026-04.md)):

- **F-4** — Settings fire-and-forget: add success toast or per-section Save button. Needs design decision (Soren)
- **F-5** — DayStart "Surprise me" redundant API call when mood + duration already selected
- **F-6** — Anonymous→auth course progress merge not idempotent-safe (rare race on focus loss)
- **P-1** — Inconsistent page headers (HistoryPage has LogoWordmark, ResultsPage doesn't)
- **P-2** — Loading states split between `<PageLoader />` and ad-hoc per page
- **P-3** — `console.error` in production code (AuthContext, ResultsPage, AdminEditExercisePage)
- **P-4** — `AdminCoursesPage` refresh() without await on mount
- **P-5** — Web test coverage: 1 test file for 66 pages/components — needs a dedicated sprint (Hiroshi S1)
- **P-6** — SharePage uses raw `fetch` instead of the API client

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
