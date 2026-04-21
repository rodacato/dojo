# Spec 026: Sprint 021 — Stability for the friends cohort

> **Status:** ready-to-implement
> **Depends on:** PRD 028, S020 archive (ADR 017, ADR 018)
> **Sprint:** 021
> **Cohort size for validation:** creator + 1 invited friend (single invite dispatched at end-of-sprint)

---

## Overview

Stability sprint, eight parts in execution order. Parts 1-3 are parallel *discovery* (audit, calibration, smoke) that produce findings. Part 4 is audit-driven execution, inherently unsized until Parts 1-3 land. Parts 5-7 are fixed-scope ops cleanup. Part 8 is the validation handoff.

```
Day 1-2: Part 1 + Part 2 + Part 3   (discovery, parallel)
Day 3-6: Part 4                     (audit-driven fixes)
                 + Parts 5,6,7       (fixed-scope ops, parallel)
Day 7:    Part 8                     (validation: first invite)
Day 8:    Retro + close-out
```

No schema changes. No domain-model changes. One operational file added (`scripts/piston-reprovision.sh`).

---

## Part 1 — Invited-friend audit (Soren C6)

### 1.1 Goal

Walk the full invited-friend loop and record every friction point. Not every screen — only the surface an invited friend would touch in their first two sessions.

### 1.2 Protocol

Output: `docs/audits/2026-04-friends-audit.md` — one section per finding, same severity classification as `docs/ux-gaps-2026-04.md` (Blocker / Friction / Polish).

Walkthrough path:

1. **Invite redeem** — receive invite URL (email or copy-paste), click, OAuth, land on first authenticated page
2. **Dashboard first impression** — what's there when `totalCompleted=0`, no streak, no history
3. **Picking a kata** — DayStart flow, including "Surprise me"
4. **Completing a kata** — CODE and CHAT paths minimum; WHITEBOARD if time
5. **Results page** — verdict, stack, what to do next
6. **Second session** — return to dashboard the next day (or simulated), find something new to do
7. **Course path** — pick a public course, complete 1-2 steps, see progress
8. **Share** — attempt to share the result (kata share card + course completion card if available)

For each finding: what happened, expected behavior, severity, specific file/route if known.

### 1.3 Acceptance

- File committed to `docs/audits/2026-04-friends-audit.md`
- Minimum 8 findings recorded (bar for "did we actually look")
- Top 3-5 by impact selected for Part 4 execution

### 1.4 Re-exercise invite flow specifically

Invite redeem (Sprint 005) hasn't been end-to-end tested since it shipped. Verify:

- Unused invite → redeem works, account created
- Used invite → rejected cleanly (message, no 500)
- Expired invite → rejected cleanly
- Invite sent to a GitHub account whose email doesn't match — does the flow handle it
- Welcome email fires via Resend when the invite is redeemed

---

## Part 2 — Sensei calibration (Yemi C4)

### 2.1 Goal

Measure verdict distribution across a representative sample. If the sensei is too harsh or too soft at any difficulty, the friend cohort will churn on session 1-2.

### 2.2 Protocol

Run 10 representative sessions end-to-end on production:

| # | Type | Difficulty | Topic |
|---|---|---|---|
| 1 | CODE | easy | any seed kata |
| 2 | CODE | medium | any seed kata |
| 3 | CODE | hard | any seed kata |
| 4 | CODE debugging | medium | fix-the-bug kata |
| 5 | CHAT | easy | |
| 6 | CHAT | medium | |
| 7 | CHAT | hard | |
| 8 | Course step | N/A | TS Fundamentals L1 |
| 9 | Course step | N/A | SQL Deep Cuts L2 |
| 10 | Review kata | medium | Inventory drift bug |

For each run: submit a *reasonable but imperfect* answer (not optimal, not trash). Log the verdict and the evaluation text.

### 2.3 Acceptance

Append results to `docs/audits/2026-04-sensei-calibration.md`. Pass criteria:

- PASS rate at easy: 50%-80%
- PASS rate at medium: 30%-60%
- PASS rate at hard: 20%-50%
- No single verdict text feels gratuitously harsh or dismissively soft (subjective but flaggable)

If any bucket falls outside the range, the prompt template in [apps/api/src/prompts/sensei.ts](apps/api/src/prompts/sensei.ts) gets a follow-up patch as part of Part 4. Prompt changes are scoped: adjust ranges of phrasing, not the underlying rubric structure.

---

## Part 3 — Smoke test expansion (Hiroshi S1)

### 3.1 Goal

5 E2E smoke tests that run on prod and become the ongoing liveness guarantee for the 2-3 month runway. Playwright, one file per flow in `apps/e2e/tests/smoke/`.

### 3.2 Flows

1. `sign-in.smoke.spec.ts` — GitHub OAuth round-trip, landing on dashboard
2. `complete-kata.smoke.spec.ts` — DayStart → pick kata → submit → see verdict (CODE type, mocked LLM in smoke mode via `LLM_ADAPTER_FORMAT=mock`)
3. `complete-course-step.smoke.spec.ts` — open course → step → submit → pass
4. `view-dashboard.smoke.spec.ts` — load dashboard, assert key elements render (streak, heatmap, recent)
5. `view-profile.smoke.spec.ts` — navigate to `/u/:username`, render basic profile

### 3.3 Configuration

- Smoke suite runs against `https://dojo.notdefined.dev` (prod) in read-only / ephemeral-user mode
- Ephemeral test users: OAuth via a dedicated test GitHub account (Marta C5 to review the threat model — scoped auth, rate-limit bypass list, teardown)
- Alternative if OAuth mocking is expensive: run the smoke suite against a staging compose with seed data, triggered on `workflow_dispatch` before deploys

### 3.4 Acceptance

- 5 specs pass locally against a running instance
- 5 specs pass against prod (or staging) from CI on `workflow_dispatch`
- Runtime < 3 minutes total
- Playwright HTML report archived on CI for 30 days

---

## Part 4 — Audit-driven fixes

### 4.1 Scope

Determined by Parts 1-3 findings. Prioritized by: (a) would a friend ping the creator, (b) blast radius, (c) effort.

Ship top 3-5 findings. Anything beyond top 5 goes to the reactive buffer.

### 4.2 Commit discipline

One commit per finding. Commit message references the audit file section:

```
fix(web): <finding-id> — <short description>

Audit: docs/audits/2026-04-friends-audit.md#finding-<id>
...
```

### 4.3 Acceptance

- Each shipped fix is verified by re-walking that segment of the audit path
- Findings not shipped are marked `deferred` in the audit doc with rationale

---

## Part 5 — Piston liveness + runtime reprovision (Tomás C3)

### 5.1 Liveness monitor

Synthetic cron check: hit `https://dojo-api.notdefined.dev/health/piston` every 5 minutes; if `status != "ok"` for two consecutive runs, alert.

**Implementation options (pick one during execution):**

- **A.** Cron on the VPS host, posting to a webhook (Discord / email via Resend)
- **B.** External service (UptimeRobot, Better Stack free tier) pointing at the endpoint
- **C.** GitHub Actions scheduled workflow on `*/5 * * * *` with a Slack/Discord webhook

Option B or C preferred (no new VPS process to maintain). Decision goes in `docs/adr/019-piston-liveness.md`.

### 5.2 Runtime reprovision script

`scripts/piston-reprovision.sh` — idempotent, installs the 6 runtimes from [ADR 018](../adr/018-piston-cgroupns-host.md):

```bash
#!/usr/bin/env bash
set -euo pipefail

RUNTIMES=(
  'python:3.12.0'
  'typescript:5.0.3'
  'sqlite3:3.36.0'
  'go:1.16.2'
  'ruby:3.0.1'
  'rust:1.68.2'
)

for rt in "${RUNTIMES[@]}"; do
  lang="${rt%%:*}"
  version="${rt##*:}"
  echo "Installing $lang $version..."
  docker run --rm --network kamal curlimages/curl:latest \
    -s -X POST http://dojo-api-piston:2000/api/v2/packages \
    -H 'Content-Type: application/json' \
    -d "{\"language\":\"$lang\",\"version\":\"$version\"}" || true
done

echo "Verification:"
curl -s https://dojo-api.notdefined.dev/health/piston
```

### 5.3 Documentation

Add an "Operational runbook" section to `README.md` pointing at the reprovision script and the health endpoint. Short — no more than 10 lines.

### 5.4 Acceptance

- Synthetic check alerts the creator on a simulated Piston outage (test by manually stopping the accessory container)
- Reprovision script runs cleanly when the Piston container is fresh (wipes and reruns)
- Script is idempotent (running twice on a fully-installed Piston returns per-runtime "already installed" from the API, script exits 0)
- ADR 019 committed

---

## Part 6 — Reminder email verification (Tomás C3)

### 6.1 Goal

Confirm the Resend-wired reminder email (from Sprint 005) actually sends in production. If broken, fix it.

### 6.2 Protocol

1. Enable reminder in creator's profile settings (if not already)
2. Set reminder hour to "now + 5 minutes" (temporarily)
3. Wait for the trigger
4. Verify: email received, renders correctly in Gmail + Apple Mail + one mobile client
5. Revert reminder hour

### 6.3 Acceptance

- Email arrives
- Subject line is correct (not a template literal leak like `{{firstName}}`)
- Body renders in 3 clients (HTML + plain text fallback)
- Unsubscribe / disable path works
- If any of the above fails, ship the fix in the same sprint

### 6.4 Deferred

Per-user daily delivery at user-set hour across timezones — the existing implementation may or may not handle DST correctly. Out of scope unless Part 6.3 surfaces it.

---

## Part 7 — Errors retention cron (Tomás C3)

### 7.1 Goal

Active cleanup of the `errors` table (migration 0016) so it doesn't grow unbounded across the 2-3 month runway.

### 7.2 Implementation

Option A (recommended): Postgres `pg_cron` extension if enabled on the image — single `DELETE FROM errors WHERE created_at < NOW() - INTERVAL '30 days'` scheduled nightly.

Option B: Kamal accessory cron container (alpine + `psql` + a crontab) running the same query.

Option C: GitHub Actions scheduled workflow hitting a `DELETE /admin/errors/expired` endpoint (requires a new endpoint, admin-auth gated).

Decision during execution; document in commit message.

### 7.3 Acceptance

- Rows older than 30 days are deleted nightly
- The mechanism is observable (log line, or a `last_cleanup_at` row in a small metadata table)
- Manual run succeeds with `docker exec ... psql -c "<query>"` as an escape hatch

---

## Part 8 — First invite dispatch (validation)

### 8.1 Goal

The sprint's real acceptance test: one invited friend walks the loop end-to-end, the creator does not intervene, and the experience is documented.

### 8.2 Protocol

1. Creator sends one invite (the chosen friend)
2. Friend completes first kata — creator observes from `/admin/errors` and metrics, **does not intervene**
3. Creator collects the friend's feedback (what was confusing, what worked, what's missing) — informal but logged in `docs/audits/2026-04-friend-feedback.md`

### 8.3 Acceptance

- Friend completes at least one kata
- Creator did not have to unblock
- Feedback recorded
- Any Blocker-severity issues surfaced by the friend go into a S021.5 reactive patch (or the reactive buffer for triage)

---

## Out of scope (explicit)

Deferred to S022+ per PRD 028:

- Publicity-adjacent work: OG preview QA, Privacy / Terms, landing-for-strangers polish, market study
- Sentry alert rules and dashboards
- CSP multi-region
- Activity dashboard for cohort tracking
- Alpha gate metric definition
- Content depth expansion (Python L2+L3, more kata, more courses)
- S020 backlog UX items F-4..F-6 + P-1..P-6 unless surfaced by Part 1

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Audit surfaces >5 high-impact issues; Part 4 bleeds over | Medium | Ship top 3; rest to reactive buffer; log explicitly |
| Sensei calibration reveals systemic prompt problems requiring redesign | Low-Medium | Timebox prompt patches to ≤1 day; deeper prompt work is its own PRD (Yemi) |
| Smoke suite is flaky against prod | Medium | Run against staging compose instead; accept as trade-off |
| Piston liveness alerts are noisy (false positives) | Medium | Two-consecutive-failure threshold + 5min cadence balances noise/signal |
| Friend's first session has a Blocker severity issue | Low | Part 8's point is to catch it; reactive buffer exists for this |

---

## Verification

Sprint closes when:

- [ ] All DoD items from PRD 028 met
- [ ] `docs/audits/2026-04-friends-audit.md` + `docs/audits/2026-04-sensei-calibration.md` + `docs/audits/2026-04-friend-feedback.md` all committed
- [ ] ADR 019 (Piston liveness) committed
- [ ] 5 smoke specs green on prod/staging CI run
- [ ] First invite dispatched and friend completed ≥1 kata
- [ ] CHANGELOG + ROADMAP entries for S021
- [ ] Typical green check: `pnpm typecheck`, `pnpm lint`, `pnpm test --filter=api`, `pnpm test --filter=web`, `pnpm validate:courses`
