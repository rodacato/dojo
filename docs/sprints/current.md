# Sprint 023 — Dojo language pass

> **Status:** scoped, awaiting kickoff
> **Planned:** 2026-06-05
> **Plan:** [PRD-032](../prd/032-sprint-023-planning.md)
> **Dependent PRDs:** [PRD-030](../prd/030-dojo-terminology-routes.md) (language pass), [PRD-031](../prd/031-belt-progression-rubric.md) (belt rubric)

S022 closed 2026-04-26. S023 scoped 2026-06-05 around the ubiquitous-language pass — routes, domain code (`Exercise → Kata`, `Course → Scroll`, `Badge → Belt`), brand voice, visual, plus `/belts` shipped with a real progression rubric.

**Hard carry-forwards into S023 (folded into PRD-032 scope):**

- **First friend invite dispatch.** Humans-only — not a code task. Adrian dispatches when the language pass is live. Audit doc at [docs/audits/2026-04-friend-feedback.md](../audits/2026-04-friend-feedback.md).
- **Smoke-suite staging environment.** Staging deploy with `LLM_ADAPTER_FORMAT=mock` + Turnstile dummy keys so the full smoke suite runs on every deploy. In sprint scope (PRD-032 §7).

**Out of scope, parked:**

- Kumite feature itself (only the route reservation ships)
- Per-track belt marks, rust indicator (v1.1)
- DB table renames (mapping at adapter layer)
- `/dashboard` and `/start` renames (stay)
