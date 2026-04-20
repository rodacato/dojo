# PRD-025: Python course — "Python for the Practiced"

> **Status:** draft
> **Date:** 2026-04-20
> **Author:** Nadia Petrov (S7) — pending: Dr. Elif Yıldız (S5) curriculum lens, Priya Menon (C1) fit lens

PRDs are exploratory documents, not commitments. If something advances, it generates one or more specs. If it does not fit, it gets archived without shame. They are disposable by design.

---

## Idea in one sentence

A fourth course targeting practiced developers who know Python basics but want to solidify idiomatic modern Python (dataclasses, typing, generators, context managers, asyncio basics).

---

## Why now

- Python is Tier 2 in the market research done for S016 — consistent demand.
- SQL Deep Cuts validated the *deep cuts for practiced developers* format. Python has the same audience: devs who wrote Python five years ago and want a "sharpen what you already know" update.
- Our course infrastructure is mature (schema, validate:courses, solution tab, slots renderer, external references, alternative approaches) — adding a 4th course now costs only content, not platform work.
- Sprint 019's 14/14 validate:courses green means we can add content without touching code.

---

## Perspectives

### As a Python developer revisiting the language

_Fill in: what's a sub-course / lesson structure that respects framework §3 (≤15 steps per sub-course)? Which 3-5 topics matter most?_

### As the dojo administrator

_Fill in: content load is large (likely 2-3 sub-courses × 8-12 steps). Authoring budget?_

### As the product

_Fill in: 4th course — does it dilute or strengthen the catalog? Precedent: SQL Deep Cuts worked because it targeted a specific niche (devs who know SQL basics). Python needs the same sharpness._

---

## Tensions

_To fill during PRD authoring. Likely candidates:_
- Python 3 minimum version (3.11? 3.12?) — affects typing features available
- Execution environment — Piston supports Python, but async tests need planning (Tomás C3)
- Scope: solo "Python for the Practiced" o también "Python basics" para principiantes?

---

## Options

_To fill during PRD authoring. Placeholders:_

### Option A: "Python for the Practiced" only (1 course, ~12 steps)
### Option B: "Python for the Practiced" + "Python async" (2 sub-courses)
### Option C: Start with a mini-course (5-6 steps) to validate format

---

## Provisional conclusion

_TBD — Nadia to draft. Kira's instinct: Option C (mini-course) for Sprint 020 if implementation ships this sprint. Full curriculum is S021+._

---

## Next step

- [ ] Nadia fills in "Perspectives", "Tensions", "Options"
- [ ] Dr. Elif adds curriculum architecture review
- [ ] Priya validates fit with the catalog
- [ ] Decide: ship skeleton in S020 or defer the full curriculum to S021+
