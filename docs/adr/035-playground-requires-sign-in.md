# ADR-035: Playground code runs require sign-in
**Status:** accepted
**Date:** 2026-11-05

## Context
The playground (`POST /engawa/run`) ran code from visitors who were not signed in. That code reaches Piston, whose `isolate` sandbox is the only boundary between it and the host: [ADR 018](018-piston-cgroupns-host.md) runs the Piston accessory with `privileged: true` and `cgroupns: host`, on the same host as the API and the `db` accessory. ADR 018 weighed those flags against keeping Piston up, never against an attacker. An escape from `isolate` is root on the host, the database included.

The anonymous path had a bot gate (Turnstile, enforced in production as of 2026-11-05) and rate limits per IP, per browser and globally. Those slow an attacker down; they do not stop one who needs a single run.

## Decision
- **`/engawa/run` requires a session.** Sign-in is by invitation, so the code that reaches the privileged sandbox comes from people the operator let in, and every run carries a user id. The anonymous IP and browser rate limits are gone with the traffic they bounded; the per-user limits, Turnstile and the global quota stay.
- **Anonymous visitors still see the page**, with the editor and no Run button.
- **Opening it again needs Piston on its own host first:** no secrets, no database, and reachable over the tailnet only. An escape there lands on a box with nothing to steal, which no in-container hardening can promise while `privileged` is required. A public demo that runs code is blocked on the same move.

## Alternatives Considered
- **Keep anonymous runs and accept the risk:** the only zero-install trial, but the cost of being wrong is the host. Rejected while the sandbox shares it.
- **Screen code before running it** (denylist of imports or syscalls, or an LLM classifier): not a boundary. Obfuscation bypasses either one, and the classifier adds cost and latency to every run.
- **Drop `privileged` for a delegated cgroup subtree or `CAP_SYS_ADMIN`:** no tested recipe for `isolate` exists, and `CAP_SYS_ADMIN` is close to root anyway.
- **gVisor (`runsc`) as the runtime:** a stronger boundary, but `isolate`'s cgroup v2 setup under gVisor is unproven. Worth a spike on a dedicated host, not on the shared one.

## Consequences
- The landing no longer offers the playground as a way to try dojo. Trying it means an invitation or a self-hosted instance.
- The nightly smoke asserts that an anonymous run gets a 401.
- `PLAYGROUND_RATE_LIMIT_ANON_PER_MIN` and `PLAYGROUND_RATE_LIMIT_ANON_PER_DAY` are no longer read.
