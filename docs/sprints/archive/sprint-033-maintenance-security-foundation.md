# Sprint 033 — Maintenance: security & foundation

> **Status:** Closed 2026-06-27 (work 2026-06-20 – 06-26).
> **Phase:** 1 — Alpha
> **Predecessor:** [Sprint 032 — Ship the set, then close the reshape loop](sprint-032-ship-and-reshape-loop.md)
> **Plan:** [PRD-033](../../prd/033-sprint-033-maintenance-planning.md) — measured inputs, sequencing, definition of done.

## What triggered it

The scrolls product shipped fast (S025–S032) and accrued the usual debt: 78 `pnpm audit` vulns (1 critical, 12 high), coverage that was *measured but not gated* (an 80% threshold CI neutralized, so it gated nothing), and no dead-code tooling. None of it sat on the scroll-execution critical path — so it didn't block the ship — but it's the kind of debt that bites the next thing. This was the focused cut of a 2–3 sprint maintenance block: measure honestly, patch the security-relevant set, leave the web testing backbone (planned S034) and architecture debt (planned S035) explicitly deferred.

## What shipped

- **Security/deps: critical + high → 0.** Patched the non-breaking set in one batch; manually bumped `dompurify` (via `mermaid`) and `hono` past their advisories. Prod `pnpm audit` is now 0 critical / 0 high. Two transitive moderates remain (`brace-expansion` DoS reachable only through `@sentry/node` → `@fastify/otel` → `minimatch`) — logged, deferred. Majors held out of the track by design.
- **api coverage gate made real.** Brought every HTTP route under test (63 test files, 707 tests) and enforced the gate in CI for real — `80/80/70/72`, ratcheting, measured at **~83.6% lines / ~77.7% branches** over business logic. `src/scripts/**` excluded so dev CLIs stop inflating/dragging the number. The Sonar job still neutralizes the threshold (report-only) via `VITEST_NO_COVERAGE_THRESHOLD`; the CI test job does not, so the floor is enforced where it matters.
- **web + shared coverage backbones landed.** jsdom + Testing Library backbone for web (144 test files, 1415 tests); vitest backbone + a Zod smoke test per export for shared. Both feed `lcov` into Sonar. Sonar now scans all three workspaces, not just api.
- **knip dead-code tooling.** Added at the root, baseline captured, unambiguous wins removed (2 unused web deps + others). Judgment calls logged.
- **Findings triaged, no silent drops.** Sonar + Dependabot findings exported and split fix-now / S034–S035 / won't-fix-with-reason. The maintainability long tail is S035; refactor-shaped findings carry the `needs-test-net` gate (no structural refactor without behavior-pinning tests landing first).

## Key decisions (and the honest ones)

- **A gate disabled at 80 is worse than a gate enforced at the honest number.** The whole Track 2 thesis. Rather than chase a vanity 80 and leave it neutralized, the api floor was set just under the real measured number and turned *on*. It ratchets up as coverage rises; it never silently regresses.
- **Excursions happened mid-sprint, and they're recorded as excursions.** Prometheus `/metrics`, the `--color-on-accent` contrast fix, the kamal-deploy action adoption, and devcontainer/env housekeeping shipped during the maintenance window but outside the three tracks. They're real and kept — flagged in the CHANGELOG under "shipped during the maintenance window, outside the sprint's three tracks" rather than folded in as if they were the sprint.

## The honest findings

- **Coverage over-delivered, and it retired the next sprint's premise.** S034 was scoped as "web testing backbone: 7/109 → meaningful coverage." That premise is dead — web reached **~87% lines / ~83% branches** *inside this sprint*. The backbone was built and the number raised in one move. S034 no longer needs to *build* anything; what remains is small.
- **The web gate is the api gate's old disease, undiagnosed.** Web has a coverage threshold defined (`85/80/78/78` in `vitest.config`), but CI only runs `pnpm --filter=@dojo/api test:coverage`. The 1415 web tests never run as a CI gate — they're report-only via Sonar (which neutralizes the threshold) or local. So web coverage is high *and* unprotected: it can silently regress to zero and no PR would fail. This is exactly what Track 2 fixed for api, left open for web. It's the real residual, and it's cheap — wire the web (and shared) `test:coverage` into the CI gate job.
- **knip is not at zero, by design.** 4 unused files, ~8 unused exports, ~14 unused exported types, 1 duplicate export, and `eslint-plugin-react-hooks` flagged as both unlisted (in `eslint.config.mjs`) and an unused devDep. The unambiguous wins were taken; the rest are judgment calls (public-ish surfaces, the react-hooks plugin wiring) deferred to S035 rather than ripped out blind.

## Verification

- `pnpm audit --prod` → 0 critical, 0 high, 2 moderate (transitive, logged).
- api: 707 tests pass, coverage ~83.6% lines / ~77.7% branches with the gate enforced.
- web: 1415 tests pass, coverage ~87.3% lines / ~83% branches (gate defined, **not** CI-enforced — carried to S034).
- shared: vitest backbone + Zod smoke tests green.
- knip baseline committed; `knip.json` at root.

## Carry-forward to S034

- **Wire the web + shared coverage gates into CI** — the real residual. The threshold exists; the CI job never runs it. ~½-day, not a sprint.
- **Architecture debt** (was planned S035, pulled forward as the body of S034): P-1..P-6, F-4..F-6, in-memory rate limiters (`sessionLimiter`/`authExecutionLimiter` knip-flagged as unused — confirm before removing), `TelemetrySinkPort` (the full `llm_calls` telemetry table, still a backlog item). All gated tests-before-refactor.
- **Sonar maintainability long tail** + the knip judgment calls (unused exports/types, `eslint-plugin-react-hooks` listing).
- **Dependency majors** — eslint 10, `@types/node` 26, vite-plugin-react 6, `@hono/node-server` 2, arctic 3.
- **Open design question, unchanged:** the share card's language glyph mark (Amara C7).
