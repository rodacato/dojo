# Sprint 021 — Stability for the friends cohort

**Started:** 2026-04-21
**Phase:** Phase 1 Alpha
**Theme:** Make the product stable and usable enough for the creator + 1 invited friend to practice for 2-3 months without the creator having to unblock.

**PRD:** [docs/prd/028-sprint-021-planning.md](../prd/028-sprint-021-planning.md)
**Spec:** [docs/specs/026-sprint-021-stability.md](../specs/026-sprint-021-stability.md)

**Cohort:** creator + 1 friend (invite dispatched end-of-sprint as validation).

---

## Part 1 — Invited-friend audit (Soren C6)

- [ ] Walkthrough the full invite-redeem → first-kata → second-session loop
- [ ] Output: `docs/audits/2026-04-friends-audit.md` with findings classified (Blocker / Friction / Polish)
- [ ] Re-exercise invite flow specifically (unused / used / expired / email-mismatch cases + welcome email)
- [ ] Select top 3-5 findings for Part 4

## Part 2 — Sensei calibration (Yemi C4)

- [ ] Run 10 representative sessions across type + difficulty
- [ ] Log verdicts in `docs/audits/2026-04-sensei-calibration.md`
- [ ] Verify PASS distribution: easy 50-80%, medium 30-60%, hard 20-50%
- [ ] If any bucket out of range, schedule prompt adjustment in Part 4

## Part 3 — Smoke test expansion (Hiroshi S1)

- [ ] `sign-in.smoke.spec.ts`
- [ ] `complete-kata.smoke.spec.ts` (mock LLM)
- [ ] `complete-course-step.smoke.spec.ts`
- [ ] `view-dashboard.smoke.spec.ts`
- [ ] `view-profile.smoke.spec.ts`
- [ ] Suite runs < 3min on prod or staging from CI on `workflow_dispatch`

## Part 4 — Audit-driven fixes

- [ ] Ship top 3-5 findings from Parts 1-3
- [ ] One commit per finding, referencing the audit doc
- [ ] Remaining findings marked `deferred` with rationale

## Part 5 — Piston liveness + runtime reprovision (Tomás C3)

- [ ] Synthetic `/health/piston` check every 5min with alert (Option A/B/C in spec — pick during execution)
- [ ] `scripts/piston-reprovision.sh` idempotent reinstall of 6 runtimes
- [ ] ADR 019 committed with liveness design rationale
- [ ] README runbook section added

## Part 6 — Reminder email verification (Tomás C3)

- [ ] Trigger reminder in prod, verify arrival in real inbox
- [ ] Verify subject + body render in 3 clients (Gmail / Apple Mail / mobile)
- [ ] Fix anything broken in the same sprint

## Part 7 — Errors retention cron (Tomás C3)

- [ ] 30-day cleanup mechanism on the `errors` table (pg_cron / accessory cron / GHA — pick one)
- [ ] Observable (log line or metadata row)
- [ ] Manual escape-hatch runs cleanly

## Part 8 — First invite dispatch (validation)

- [ ] Creator sends the single invite at end-of-sprint
- [ ] Friend completes ≥1 kata without creator intervention
- [ ] Feedback captured in `docs/audits/2026-04-friend-feedback.md`
- [ ] Blocker-severity findings → S021.5 reactive patch or reactive buffer

---

## Reactive buffer (during 2-3 month runway)

Bugs surfaced by the friend during the cohort window are triaged out-of-band:
- Non-blocker → reactive buffer, batched into S021.5 if volume warrants
- Blocker → ship a mini-patch, document as a commit
- Unknown severity → creator decides; err on the side of patching

---

## Out of scope (explicit — per spec 026)

Publicity work, Sentry alerts/dashboards, CSP multi-region, activity dashboard, Alpha gate metric, content expansion (Python L2+, more kata/courses), S020 UX backlog F-4..F-6 + P-1..P-6 unless audit-surfaced.

---

## Risks

- Audit surfaces >5 high-impact issues → ship top 3, defer rest to reactive buffer
- Sensei calibration reveals systemic prompt problems → timebox ≤1 day, deeper prompt work is its own PRD
- Smoke suite flaky on prod → fall back to staging compose
- Piston liveness alerts noisy → 2-consecutive-failure threshold at 5min cadence
- Friend's first session hits a Blocker → Part 8's point is to catch it; reactive buffer exists
