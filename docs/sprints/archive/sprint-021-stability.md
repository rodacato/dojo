# Sprint 021 — Stability for the friends cohort

**Started:** 2026-04-21
**Closed:** 2026-04-22
**Phase:** Phase 1 Alpha
**Theme:** Make the product stable and usable enough for the creator + 1 invited friend to practice for 2-3 months without the creator having to unblock.

**PRD:** [docs/prd/028-sprint-021-planning.md](../../prd/028-sprint-021-planning.md)
**Spec:** [docs/specs/026-sprint-021-stability.md](../../specs/026-sprint-021-stability.md)

---

## What actually shipped

The planned eight-part structure gave way to a reactive week: a chain of deploy-adjacent bugs surfaced in the hours after the friend-cohort window opened, and the sprint's real work was clearing them before they ever reached the friend. The theme (stability for a 2-3 month runway) held; the shape did not.

Commits in the window (2026-04-21 → 2026-04-22):

- `381d1a5` fix(auth): request user:email scope + welcome-on-redeem + require invite email
- `24b809c` fix(web): allow data: URIs in CSP font-src
- `8a30937` refactor(config): prefix feature flags with FF_
- `6f812a2` ci(deploy): pass FF_CODE_EXECUTION_ENABLED to prod API
- `0d26f47` fix(deploy): align .kamal/secrets with FF_ prefix rename
- `dfd2214` fix(practice): report and recover from kata-prep failures
- `469dd89` fix(dashboard,results): count only real practice in streak
- `64c565f` fix(web): recover lazy routes from stale chunks after deploy
- `66340d6` docs: backlog follow-ups from 2026-04-22 kata-prep bugfix session
- `d03b197` docs: retire unused audit scaffold, UX gaps doc, and mockup tracking

Impact — friends-cohort surface is demonstrably more robust: prep failures are now visible in Sentry + stdout and do not leave orphan sessions, the streak counts real practice only, the lazy-route flow survives a deploy, OAuth captures the invite email, CSP no longer blocks fonts or Sentry.

## What didn't happen (carry-forward candidates for S022)

- **Part 1 — Invited-friend audit (Soren C6).** Walkthrough never executed; the scaffold doc was deleted in `d03b197`. If needed again, re-scaffold from the template instead of reviving the file.
- **Part 2 — Sensei calibration (Yemi C4).** Not executed. The Sonnet 4.6 rollout mid-sprint changed the reference model, so calibration numbers from before would no longer apply even if we had them.
- **Part 3 — Smoke test expansion (Hiroshi S1).** Not started. Still valuable; S022 candidate.
- **Part 4 — Audit-driven fixes.** Shipped as reactive fixes instead of audit-driven ones; substance present, attribution different.
- **Part 5 — Piston liveness + runtime reprovision (Tomás C3).** Not executed. S022 candidate.
- **Part 6 — Reminder email verification (Tomás C3).** Not executed. S022 candidate, low effort.
- **Part 7 — Errors retention cron (Tomás C3).** Not executed. S022 candidate.
- **Part 8 — First invite dispatch (validation).** Not executed. Blocked on friend availability, not on product readiness after the fixes above.

## Retro

**What went right**

- Reactive posture paid off. The kata-prep bug was invisible before the session opened (silent failure, no Sentry hit, infinite polling) and now has three layers of recovery: timeout on the LLM client, session-delete on failure with errorReporter, and a realistic frontend polling ceiling.
- Cross-layer fix in one sitting (adapter → use case → repo → route → frontend) with tests and lint green each step. The existing hexagonal boundaries made the change cheap.
- The "delete session rather than mark failed" call from the panel converted a noisy state into a non-state — dashboard, streak, and results page all cleaned up with a single data decision instead of three UI conditionals.

**What went wrong**

- The eight-part structure was written for a quiet sprint and didn't bend around the reactive work. Next time, when the week opens with production noise, start with a reactive buffer as Part 1 and promote planned parts to "conditional on quiet."
- The friends-audit doc was scaffolded without a dated checkpoint — it sat empty for a week before being retired. A Part that produces an output should have a date by which the output exists or the Part is cut.
- `docs/ux-gaps-2026-04.md` and `docs/screens/` had been carrying inertia for weeks. Retiring them took 20 minutes once we looked at them directly; the lesson is that "referenced by PRDs" is not the same as "still useful".

**What to try next**

- Reactive buffer as an explicit Part 0 of the next stability-leaning sprint, not a footnote.
- One backlog item absorbed per reactive fix: if we stop to fix something unplanned, we add one planned item to the backlog so the compound rate matches.
- Cut sprint Parts that haven't moved in 5 days, regardless of stated priority.

**Risks carried forward**

- Smoke tests still absent — any regression in the sign-in → first-kata loop is invisible until a human notices.
- Piston liveness still unmonitored — if it falls over, kata execution silently fails until the creator checks `/health/piston` by hand.
- The first friend invite has not been sent; the sprint's headline validation is pending.
