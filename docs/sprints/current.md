# Active Block: Sprint 007 — Phase 2: The Scoreboard

**Started:** 2026-03-22
**Phase:** Phase 2

**Expected outcome:** Full badge system with collection page, extended dashboard with practice patterns, no-repeat rule enforced, landing page polished to Stitch design, and kata active screens refined. Code splitting for bundle performance.

---

## Committed

### A — Performance

- [ ] Spec 034 — Code splitting (lazy routes):
  - Lazy load: admin, terms, privacy, changelog, open-source, leaderboard, public profile, badges
  - Keep critical path eager: dashboard, start, kata, eval, results
  - Target: main chunk < 300KB

### B — Catalog Quality

- [ ] Spec 035 — No repeat within 6 months:
  - Query filter in `GetExerciseOptions`: exclude exercises the user completed in last 6 months
  - Fallback: if all exercises exhausted, allow repeats (warn in response)
- [ ] Spec 036 — Kata quality refinement:
  - Review sensei evaluations from dogfooding sessions
  - Tune `owner_context` prompts where verdicts are inconsistent
  - Adjust rubric phrasing for exercises that are too harsh or too lenient

### C — Gamification

- [ ] Spec 037 — Full badge system + `/badges` collection page:
  - 8 new badge definitions seeded: `POLYGLOT`, `ARCHITECT`, `BRUTAL_TRUTH`, `CONSISTENT`, `UNDEFINED_NO_MORE`, `SENSEI_APPROVED`, `SQL_SURVIVOR`, `RUBBER_DUCK`
  - Trigger rules in BadgeEventHandler for each badge
  - `/badges` page: earned/locked grid, filter, prestige badge (UNDEFINED_NO_MORE)
  - Design reference: `badges_collection/`

### D — Extended Dashboard

- [ ] Spec 038 — Extended dashboard (data-driven, no extra LLM calls):
  - "Where you struggle": aggregate `topicsToReview` across all sessions, show frequency
  - "How you practice": avg time vs estimate, most avoided exercise type, sessions timed out
  - "Sensei suggests revisiting": top 3 topics by frequency (amber chips)
  - Design reference: `dojo_extended_dashboard_phase_2/`

### E — Landing & Visual Polish

- [ ] Spec 039 — Landing page enhancements:
  - Typewriter animation on hero headline
  - Social proof stats (animated counters): practitioners, kata completed, days of practice
  - Dot grid background with mouse proximity effect (respect prefers-reduced-motion)
  - GitHub stats bar (stars, license, last commit)
  - Design reference: `dojo_main_landing_page/`
- [ ] Spec 040 — Kata active micro-improvements:
  - CODE: honor code reminder at bottom of left panel
  - CHAT: word count in bottom-right of textarea
  - CHAT: mono/sans font toggle
  - Kata Selection: card hover border animation (border → accent, 150ms)

---

## Out of this block

- Sidebar navigation (architectural change, deferred)
- Login card-centered design (separate from landing)
- Psychological analysis view (Phase 2 later)
- Drawhaus diagram saved per session
- Interest-based kata selection (needs PRD)
- Phase 3 features (user-submitted exercises)
