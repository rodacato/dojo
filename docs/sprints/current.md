# Sprint 022 — (to be named)

**Started:** 2026-04-22
**Phase:** Phase 1 Alpha
**Theme:** _To be decided with the creator._ S021 shipped a reactive run of stability fixes; S022 chooses between finishing S021's non-reactive carry-forward (smoke tests, Piston liveness, reminder verification, errors cron, first invite dispatch) and pulling a latency win from the backlog (streaming in `generateSessionBody`, per-purpose LLM model split).

**PRD:** _(write or link once scope is picked)_
**Spec:** _(write or link once scope is picked)_

**Cohort:** creator + 1 friend (same window as S021 — validation still pending).

---

## Part 0 — Reactive buffer (carried forward from S021)

Bugs surfaced during the cohort runway are triaged out-of-band:

- Non-blocker → stay here, batched into a mid-sprint patch if volume warrants
- Blocker → ship a mini-patch, document as a commit
- Unknown severity → creator decides; err on the side of patching

Explicit as Part 0 this sprint because S021 proved the structure needs room for unplanned work from day one.

---

## Candidate parts (pick before starting)

_S021 carry-forward — keep the ones that still matter, cut the rest._

- **Smoke test expansion (Hiroshi S1)** — `sign-in.smoke.spec.ts`, `complete-kata.smoke.spec.ts` (mock LLM), `complete-course-step.smoke.spec.ts`, `view-dashboard.smoke.spec.ts`, `view-profile.smoke.spec.ts`. Suite < 3 min on prod/staging from CI on `workflow_dispatch`.
- **Piston liveness + runtime reprovision (Tomás C3)** — synthetic `/health/piston` every 5 min with alert, `scripts/piston-reprovision.sh` idempotent reinstall of 6 runtimes, ADR 019, README runbook section.
- **Reminder email verification (Tomás C3)** — trigger reminder in prod, verify arrival + render in Gmail + Apple Mail + mobile. Fix anything broken in the same sprint.
- **Errors retention cron (Tomás C3)** — 30-day cleanup on the `errors` table (pg_cron / accessory cron / GHA), observable, manual escape-hatch.
- **First invite dispatch (validation)** — creator sends the single invite at end-of-sprint. Friend completes ≥1 kata without creator intervention. Feedback captured in a fresh audit doc.

_Backlog pulls — latency wins adjacent to S021's kata-prep work._

- **Streaming in `generateSessionBody`** — cut perceived prep latency from 30s to ~2s by swapping `.messages.create()` for `.messages.stream()` + SSE. See backlog for full description.
- **Per-purpose LLM model config** — split `LLM_MODEL` into `LLM_MODEL_EVAL` + `LLM_MODEL_PREP`. Small refactor, real latency lever if prep slows again.

---

## Out of scope (until chosen otherwise)

Until the parts above are selected: publicity work, Sentry alerts/dashboards, CSP multi-region, activity dashboard, Alpha gate metric, content expansion, S020 UX backlog (F-4..F-6 + P-1..P-6).

---

## Risks

- _To be filled in once scope is picked._
