# Sonar + CodeQL baseline — 2026-06-21 (Sprint 033, Task 0)

> Mandatory Task 0 deliverable per [PRD-033](../prd/033-sprint-033-maintenance-planning.md): pull the findings before promising to fix them, triage into **fix-now / S035 / won't-fix-with-reason** — no silent drops. Refactor-shaped reliability/maintainability findings get a `needs-test-net` tag (no structural refactor without a behavior-pinning test landing first, in its own commit). Trivial one-line fixes are exempt.

## CodeQL (GitHub code scanning)

Pulled via `gh api repos/rodacato/dojo/code-scanning/alerts` (2026-06-21). CodeQL **runs on push** in this repo (the `quality.yml` security job calls `rodacato/sector-7g`); it stays in-repo, not parked in `sector-7g`. 11 open alerts across 2 rules.

| Rule | Severity | Count | Disposition | Rationale |
|---|---|---|---|---|
| `js/weak-cryptographic-algorithm` | high | 1 | **won't-fix** (false positive) | `apps/api/src/infrastructure/persistence/katas/types.ts:12` — SHA-1 inside a hand-rolled RFC 4122 **v5 UUID** generator (`uuidv5`). SHA-1 is *mandated* by the v5 spec; the digest produces deterministic kata IDs from a namespace + name, **not** a security control (no secrets, tokens, signatures, or passwords flow through it). "Fixing" it by swapping the algorithm would break v5 compliance and mutate every seeded ID. Dismiss as `won't fix` on the dashboard. |
| `actions/missing-workflow-permissions` | medium | 10 | **fix-now** | 5 workflows ran with an unscoped `GITHUB_TOKEN`. All 5 jobs only checkout / curl / test — none push to GHCR, comment on PRs, or upload SARIF — so a top-level `permissions: { contents: read }` is the correct least-privilege grant. **Done this sprint** (commit below). |

### `actions/missing-workflow-permissions` — what changed

Added top-level `permissions: { contents: read }` to: `ci.yml`, `quality.yml`, `smoke.yml`, `piston-execute-smoke.yml`, `piston-liveness.yml`.

- `deploy.yml` and `accessory-reboot.yml` were **not** flagged — they already declare `permissions` (they need `packages: write` for GHCR). Left untouched.
- `quality.yml`'s `security` job calls the reusable `rodacato/sector-7g/.github/workflows/security.yml`, which **declares its own `permissions: contents: read`** — so the caller granting `contents: read` is sufficient and won't starve the scan.

## SonarQube

**PENDING — needs Adrian's export.** The Sonar scan is `workflow_dispatch`-only (`quality.yml` `sonar` job) and reports to a self-hosted instance reachable via the tailnet, not pullable from this sandbox. To complete this section:

1. Run the **Sector 7g - Quality** workflow (`workflow_dispatch`) on `master` *after* the S033 coverage commits are pushed — the last dashboard snapshot (api 26.9% / web 3.8% / packages 100%, gates **Failed**) predates the campaign and is now stale.
2. Export the issue list (api + web + shared projects) into the table below.
3. Triage each: **fix-now** (security-relevant + trivial), **S035** (the reliability/maintainability long tail — `needs-test-net` if refactor-shaped), **won't-fix** (with reason).

| Project | Issue | Type | Severity | Disposition | Notes |
|---|---|---|---|---|---|
| _api / web / shared_ | _pending export_ | | | | |

### What we already know feeds the next scan

- Coverage is no longer decorative: api gate enforced at 60/52 (`vitest.config.ts`), web + shared now emit `lcov` for Sonar. The fresh scan should show api ~63% / web ~68% / shared covered — a real "new code" baseline, not the pre-campaign number.
- Per PRD-033 §Out-of-scope: **aggressive Sonar smell cleanup is S035**, not this sprint. Task 0 only triages; only security-relevant + trivial findings get fixed now.

## Open follow-ups

- [ ] Dismiss the `js/weak-cryptographic-algorithm` alert on the dashboard as `won't fix` (false positive — reason above). Reversible; left to Adrian since it mutates the security dashboard.
- [ ] Run the Sonar `workflow_dispatch` post-push and fill the SonarQube table.
