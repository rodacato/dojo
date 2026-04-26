# ADR 019: Piston liveness via GHA + idempotent reprovision script

**Status:** Accepted
**Date:** 2026-04-22
**Context:** Sprint 022 Part 1. ADR 018 hardened the Piston accessory against silent crashes by pinning the image digest, wiring `privileged + cgroupns:host`, and adding `/health/piston`. What it did not add: (1) something that actually watches `/health/piston`, and (2) a way to reinstall runtimes if the `dojo-piston-packages` volume is ever reset. This ADR closes both gaps before Part 4 opens anonymous code execution on top of Piston.

## Decision

1. Add a scheduled GitHub Actions workflow that probes `/health/piston` every 30 minutes and fails the workflow run on two consecutive probe failures 30 seconds apart.
2. Add `scripts/piston-reprovision.sh` as the idempotent source of truth for which runtimes Piston must have installed, callable by hand against any reachable Piston instance.

Alerts come from GitHub's default workflow-failure email. No separate observability service is introduced.

## Why this shape

### Why GitHub Actions instead of external monitoring

| Option | Pros | Why not |
|---|---|---|
| **GHA schedule (chosen)** | Zero new infra, zero new secrets, red runs already notify via email | Cadence is soft in GHA (best-effort, can delay during GitHub incidents); 1-min cadence not supported |
| **UptimeRobot / Better Uptime** | Purpose-built, sub-minute cadence, built-in status pages | New vendor relationship, new account to manage, overkill for a 1-friend cohort |
| **Sentry cron monitor** | Already have Sentry wired | Sentry cron requires check-in pings, not outbound probes — would need to push from the API itself, losing the independent-probe property |
| **pg_cron on the app DB** | Fully self-contained | Cannot reach a Piston that is itself on the Hetzner host, and would be blind to network-layer issues between GHA and the host |

The key property is that the probe comes from *outside* the host — a DB cron or an in-app check would go silent if the host is unreachable, which is exactly the failure mode ADR 018 was written about.

### Why 2 probes 30 seconds apart

Piston occasionally flakes on a single request (container warm-up after a Docker restart, brief cgroup rebind after host reboot). Alerting on single failures produced S020-era noise during verification; the spec 026 §5 design called out a 2-consecutive-failure threshold specifically. 30 seconds is long enough for transient recovery, short enough to keep the total run under the workflow timeout.

### Why a bash reprovision script instead of a Node/TS script

- One hard dependency in production: `curl + jq`. Both ship with every Linux host we deploy to.
- Runs without a node_modules install, so it is usable from a shell attached to any host that can reach `PISTON_URL`.
- The operator decides where `PISTON_URL` points (typically `http://<host_ip>:2000` from the operator's shell, or `http://piston:2000` from inside the app container via `kamal app exec`).
- Keeping the runtime list as an array in the script makes adding a version a single-line diff that shows up cleanly in review.

## What it covers

- **Detection:** every 30 minutes GHA calls `/health/piston`. Red run = an email to the maintainer. No dashboard needed.
- **Recovery:** the recovery email references `scripts/piston-reprovision.sh`. Operator runs it from a shell with access to `PISTON_URL`.
- **Multi-version ground truth:** S022 §1.4 wants Python 3.10 alongside 3.12. That edit lives in the script's `RUNTIMES` array — one line, review-visible, re-runnable.

## What it does not cover (deliberate)

- **Runtime bumps** (Go 1.16 → current, Ruby 3.0 → 3.3, Rust 1.68 → current) are operational changes, not architectural ones. They travel as separate commits that edit the `RUNTIMES` array plus any course adjustments.
- **Concurrency decision** (PISTON_MAX_CONCURRENT bump vs. separate pool, S022 §1.5) is measured under Part 4 load before being decided.
- **Sub-minute cadence** is not in scope. If 30-min probes turn out to be too coarse once the playground is live, we revisit — most likely by keeping GHA for cheap failure mode and adding UptimeRobot for a 1-minute signal.

## Configuration required

- `PISTON_HEALTH_URL` — repo-level **Variable** (Settings → Secrets and variables → Actions → Variables tab), the full URL (e.g. `https://dojo-api.notdefined.dev/health/piston`). Stored as a Variable rather than a Secret because the endpoint URL is public — anyone can curl it. Setting it to the app's health endpoint rather than Piston directly means we also catch the case where the app can no longer reach Piston, which is the whole category of bug ADR 018 was about.

## Rollback

- Disable the workflow (GitHub UI) if it generates false positives. Piston runs unchanged.
- The reprovision script has no persistent state of its own — deleting it removes the source-of-truth file but not any installed runtime.
