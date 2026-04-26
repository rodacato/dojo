# Sprint 023 — _(unscheduled)_

S022 closed 2026-04-26. Next sprint is open — see [backlog.md](backlog.md) for triaged candidates.

**Hard carry-forwards into S023:**

- **First friend invite dispatch.** The product surface is ready (S021 + S022). The blocker is humans-only — creator picks a friend, sends the invite, and the friend completes ≥1 kata. Audit doc waiting at [docs/audits/2026-04-friend-feedback.md](../audits/2026-04-friend-feedback.md). If unpopulated within 7 days of dispatch, the slot rotates and the doc is cut.
- **Smoke-suite staging environment.** S022 shipped `complete-kata` and `playground-anon-run` smoke specs that skip on prod runs without their gating env vars. Stand up a staging deploy with `LLM_ADAPTER_FORMAT=mock` + Turnstile dummy keys so the full smoke runs on every deploy, not just in prod where two specs skip.

Otherwise: the next sprint is shaped around what S022's friend feedback (and the playground funnel metrics) actually surface — not around a pre-baked plan.
