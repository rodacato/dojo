# Sprint 020 — Phase 1 expansion

**Started:** 2026-04-20
**Phase:** Phase 1 Alpha
**Theme:** Extend the catalog, close the acquisition loop, open new kata formats.

**PRDs:**
- [docs/prd/024-sprint-020-planning.md](../prd/024-sprint-020-planning.md) — sprint planning
- [docs/prd/025-python-course.md](../prd/025-python-course.md) — Python course "Python for the Practiced"
- [docs/prd/026-ask-the-sensei.md](../prd/026-ask-the-sensei.md) — "Ask the sensei" in course player
- [docs/prd/027-code-review-kata.md](../prd/027-code-review-kata.md) — "Code Review" kata format

**Spec:** _(to be written after Part 3 checkpoint)_

---

## Part 1 — UX/UI flow gap audit (Soren C6)

- [ ] Walkthrough of key flows: onboarding, kata, course player, dashboard, profile, share
- [ ] `docs/ux-gaps-2026-04.md` — findings classified (blocker / friction / polish)
- [ ] Ship 3-5 low-risk fixes in-sprint; rest promoted to backlog triaged

---

## Part 2 — Acquisition loop (Amara C7 + Priya C1)

- [ ] Share card de completación de curso — dynamic OG image + `/share/course/:slug/:userId`
- [ ] Badge por curso completado — Recognition context extension
- [ ] CTA "Share your completion" en pantalla final del curso
- [ ] Migrar TS Fundamentals + JS DOM a público — flag + copy review

---

## Part 3 — PRDs (parallel — gate Part 4)

- [ ] PRD 025 — Python course "Python for the Practiced" (Nadia S7)
- [ ] PRD 026 — "Ask the sensei" in course player (Yemi C4)
- [ ] PRD 027 — "Code Review" kata format (Priya C1 + Hiroshi S1)

**Checkpoint:** once the 3 PRDs land, re-scope Part 4. If any reveals >1 week of effort, defer to Sprint 021.

---

## Part 4 — Implementation (post-PRD)

- [ ] Python course v1 skeleton — first 2-3 steps (L1) to validate format
- [ ] "Ask the sensei" MVP — contextual button, streaming, single prompt
- [ ] "Code Review" kata — 1 proof-of-concept kata end-to-end

---

## Part 5 — Editorial backfill

- [ ] `alternativeApproach` content for 6-8 key steps across TS / JS DOM / SQL

---

## Part 6 — Deploy + verify (Tomás C3 + Marta C5)

- [ ] Push 24+ pending commits → deploy
- [ ] Piston production verification (carry-forward S019)
- [ ] Dashboard EXPLAIN ANALYZE in production (carry-forward S019)

---

## Risks

- **Scope creep** — 6 parts + 3 PRDs. Mitigation: mandatory checkpoint post-Part 3
- **Deploy blocking** — 24 commits ahead; blocks Part 6 and S019 carry-forwards
- **"Ask the sensei"** — touches sensei flow; prompt evaluation + rate limiting critical (Marta C5 must review)
- **"Code Review"** — new format, may require exercise-type changes or sensei-eval changes (Hiroshi S1)
- **Python course** — full course is too big; only the skeleton (2-3 steps) is realistic here

## Fallback

If mid-sprint we see we're not making it:
1. Parts 1, 2, 5, 6 are **non-negotiable** (acquisition + deploy)
2. From Parts 3-4 priority order: **Ask the sensei > Code Review > Python course** (Ask the sensei improves retention directly; Python is the 4th course — nice-to-have)
