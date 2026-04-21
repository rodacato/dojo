# ADR 018: Piston accessory requires privileged + host cgroup namespace

**Status:** Accepted
**Date:** 2026-04-21
**Context:** Sprint 020 Part 6 — the `/health/piston` endpoint shipped this sprint surfaced that Piston had been in a crashloop in prod for ~3 weeks, blocking code execution for every `type: 'code'` kata and every course step. The root cause was a silent drift between the VPS's cgroup configuration and Kamal's default docker flags — not a change on our side.

## Decision

Run the `piston` accessory with `privileged: true` **and** `cgroupns: host`, plus a named volume for `/piston/packages` and a pinned image digest.

```yaml
accessories:
  piston:
    image: ghcr.io/engineer-man/piston@sha256:2f66b74...
    host: <%= ENV["HOST_IP"] %>
    volumes:
      - dojo-piston-packages:/piston/packages
    options:
      privileged: true
      cgroupns: host
      tmpfs: /piston/jobs:exec,size=256m
```

## Why each flag

### `privileged: true`

Piston's `isolate` sandbox creates cgroup v2 subtrees under `/sys/fs/cgroup` at boot (`mkdir isolate/` in its entrypoint). Without elevated capabilities the write fails with `EROFS`. `isolate` uses cgroup v2 for per-job CPU/memory/pid limits — this is the feature that makes Piston safe to expose to untrusted user code, so there is no "run it without privileged" mode.

### `cgroupns: host`

Docker's default since cgroup v2 rollout is `cgroupns=private`, which gives the container its own view rooted inside a delegated cgroup. Even with `--privileged`, the container cannot create siblings of its own cgroup — only children of it — and the entrypoint wants to create `/sys/fs/cgroup/isolate` at the top. `cgroupns=host` maps the host cgroup hierarchy into the container, so `mkdir` lands where the script expects.

The combination is required: `privileged` alone is not enough on a modern cgroup v2 host, and `cgroupns=host` alone does not grant the capabilities needed to mutate cgroups.

### Named volume for `/piston/packages`

Runtimes (Python, TS, SQLite, etc.) are installed at runtime via Piston's package API and stored in `/piston/packages`. Without a named volume this lives on the container's writable layer and is **lost on every container recreate** — which is every deploy if the accessory is rebooted. Moving it to a named volume (`dojo-piston-packages`) makes the install a one-time operation.

### Pinned digest instead of `:latest`

`engineer-man/piston` only publishes `:latest`. Pinning the digest prevents the exact failure mode we just hit: an upstream change to the entrypoint or base image silently breaks prod on the next `kamal accessory reboot piston`.

## What actually broke

The `dojo-api-piston` container was created ~3 weeks ago and never restarted successfully since. The symptom was a tight restart loop with `mkdir: cannot create directory 'isolate/': Read-only file system`. The app container was healthy, so neither `kamal app logs` nor external health checks surfaced it — the only visible effect was that code execution returned sandbox errors, which the sensei evaluator ate silently.

Most likely trigger: a host kernel or Docker upgrade that flipped cgroup v2 strictness. The Piston image has not changed in 14 months, and our Kamal config has not changed since sprint-013. The flags worked; the environment around them moved.

## Observability that surfaced it

`GET /health/piston` shipped in the same sprint (commit `c22db37`, extended in `855edf8`) and was what made this visible from a browser without shell access to the host. Without that endpoint the next signal would have been a user report that code execution was broken — or silent degradation if the sensei happened to evaluate without needing the execution output.

## Alternatives considered

| Option | Why not |
|---|---|
| **Drop sandboxing (remove `privileged`)** | Piston becomes unsafe for any language with I/O — we would have to trust user code |
| **Self-host sandboxing differently (Firecracker, gVisor)** | Real work (ADR 014 deferred this). Piston's `isolate` is the reason we chose it |
| **Move to a hosted execution service (Judge0, Sphere Engine)** | Adds cost + latency. We would hit this exact class of issue on any self-hosted sandbox |
| **Pin Piston to an older tag** | `ghcr.io/engineer-man/piston` has no tags other than `latest`. Digest pinning is the only shape available |

## Operational notes

- After the fix, the named volume starts empty. Runtimes must be installed once via `POST /api/v2/packages` (one call per language + version). Versions matching our previous snapshot: python=3.12.0, typescript=5.0.3, sqlite3=3.36.0, go=1.16.2, ruby=3.0.1, rust=1.68.2.
- `/health/piston` returns `{ runtimes: [{language, version}] }` so the list is verifiable from a browser.
- Kamal does not recreate accessories on a normal `kamal deploy` — only the app container. Changes to the accessory options require `kamal accessory reboot piston -c config/deploy.api.yml`.

## Ref

- `config/deploy.api.yml` — accessory config
- `apps/api/src/infrastructure/http/routes/health.ts` — health endpoint that surfaced the incident
- ADR 014 — original decision to use Piston
