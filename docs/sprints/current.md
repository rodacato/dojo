# Sprint 034 — Wire the web gate + architecture debt

> **Status:** Open 2026-06-27. S033 over-delivered: it didn't just make web coverage *visible*, it raised it to ~87%. So the planned "web testing backbone" sprint has no backbone left to build. S034 absorbs the cheap residual S033 surfaced (the web/shared coverage gates exist but never run in CI) and pulls forward the architecture debt that was planned as S035.
> **Predecessor:** [Sprint 033 — Maintenance: security & foundation](archive/sprint-033-maintenance-security-foundation.md)
> **Baselines:** S033's measured numbers — api ~83.6% / web ~87.3% lines, knip baseline, Sonar triage. No re-measuring from a guess.

## Progress — 2026-06-27 (9 PRs merged)

The gate-wiring and a chunk of the architecture debt shipped; the big spine and the sprint close remain. A 6-agent architecture audit informed the scoping — its findings live in the PR bodies (the standalone report was not kept, by decision).

**Shipped (merged to master):**

- ✅ **Web + shared coverage gates wired into CI** (#30). `shared` had no threshold — added one (100 lines/funcs, 90 branches, enforcing the smoke-per-export rule). The gates were decorative before; they gate now.
- ✅ **Three shipped correctness bugs the audit surfaced** (#31) — the kata **result page 404'd** (singular `/kata/` navigations vs the plural routes since the S023 rename), `findEligible` **queried a non-existent table** (`FROM katas` — the DB table is `exercises`), and `SessionStatus` had **drifted** (DTO missing `preparing`). The kata loop was doubly broken, invisible through the scrolls era.
- ✅ **Attempt-limit invariant into the `Session` aggregate** (#32) — was a magic `>= 2` in the WS handler; unforgeable now.
- ✅ **Partial-attempt persistence behind `SessionRepositoryPort`** (#33) — transport no longer imports Drizzle.
- ✅ **`EventBusPort` → `domain/shared`** + **`ARCHITECTURE.md` reconciled with the as-built system** (#34) — killed learning→practice / recognition→practice coupling; the doc had described a system never built (phantom Drawhaus/`WhiteboardPort`, wrong `LLMPort` signature, missing `learning` context).
- ✅ **`useAsync` hook + 5 pages migrated** (#35) — killed the stale-set-after-unmount bug class.
- ✅ **`eslint-plugin-sonarjs` adopted, baselined** (#36) + **quick-win backlog cleared, 6 rules ratcheted to error** (#37) — Sonar's per-file rules now ride `pnpm lint`, caught in-editor and by agents before a PR.

**Remaining:**

- ⏳ **The big spine** — collapse `handleSubmit`'s orchestration + `practice.ts`'s fat route into use cases. Needs the WS-progress **stream redesign** (use case emits execution-phase events the handler translates); deferred to a dedicated slice with a formal Yemi + Tomás design, since it touches the sensei flow.
- ⏳ **`TelemetrySinkPort`** — LLM telemetry is still three mechanisms across three layers.
- ⏳ **knip judgment calls**, **`validate()` convergence**, **`apps/api/tsconfig.json` extends base**, and the **sonarjs deferred rules** (below).
- ⏳ **Sprint close** — retro / archive / CHANGELOG, and the S035 decision.

**Decisions parked for Adrian:**

- **Dead rate limiters** — `sessionLimiter` is commented "the primary cost control" but is wired nowhere; `POST /sessions` (one LLM call each) has no per-IP limit. Wire it (is 5/hr too tight for dogfooding?) or delete it + fix the comment.
- **`sonarjs/void-use`** — 9 deliberate fire-and-forget `void promise` uses, left `off`. Enable the rule (and change the pattern) or keep it off — it conflicts with no-floating-promises. Other deferred sonarjs rules: `todo-tag`, `cognitive-complexity`, `no-identical-functions`, `generator-without-yield`.

## Why this sprint changed shape

The original plan (PRD-033 carry, ROADMAP) had S034 = "web testing backbone, 7/109 → meaningful coverage" and S035 = "architecture debt." But the ~30 web test commits that landed in S033 (2026-06-21) built the backbone *and* took web to ~87% lines / ~83% branches. The "7/109" baseline the plan was written against no longer exists. Opening a sprint to build something already built would be theater. So:

- **The web backbone work is done** — folded into S033, recorded there.
- **The residual is enforcement, not construction** — the web gate (`85/80/78/78`) and the shared gate are defined in their `vitest.config`s but CI only runs `--filter=@dojo/api test:coverage`. The other two never gate a PR. That's half a day.
- **The real next body of work is the architecture debt** (was S035). It moves here so S034 isn't a near-empty sprint.

**This reframe is Adrian's to confirm.** If he'd rather keep S034/S035 split as planned, the architecture-debt section drops back to S035 and S034 becomes the gate-wiring alone.

## Mandatory (sprint blockers if not done)

- **Wire the web + shared coverage gates into CI.** Add `pnpm --filter=@dojo/web test:coverage` and `pnpm --filter=@dojo/shared test:coverage` to the CI test job (or a combined gate step) so the thresholds already defined in their `vitest.config`s actually fail a regressing PR. Today they're decorative — the exact disease S033 fixed for api, left open for the other two. Confirm the web threshold (`85/80/78/78`) holds against the real ~87% before turning it on; ratchet, don't inflate.
- **Architecture debt, gated tests-before-refactor.** Work the P-1..P-6 / F-4..F-6 items from the S033 Sonar triage. **No structural refactor without behavior-pinning unit tests landing first, in their own commit** (the `needs-test-net` rule from S033). Trivial one-liners exempt. Specific known targets: the in-memory rate limiters (`sessionLimiter`, `authExecutionLimiter` — knip flags them unused; confirm reachability before touching), and the `TelemetrySinkPort` / `llm_calls` telemetry table (backlog item — persist purpose/refId/model/tokens/latency behind the port).
- **knip judgment calls.** Resolve the deferred set from S033: 4 unused files, ~8 unused exports, ~14 unused exported types, the duplicate export, and `eslint-plugin-react-hooks` flagged as both unlisted (in `eslint.config.mjs`) and an unused devDep — decide keep-with-reason or remove, per item.
- **Sprint admin discipline.** Close with retro, archive, CHANGELOG (internal + public per the doc-sync table). Decide whether S035 still exists as a distinct sprint after this absorbs its body, or whether the maintenance block closes here.

## Critical-path order

1. **Wire the web/shared gates** — cheap, high-value, unblocks "coverage is actually protected now." Do it first.
2. **Tests-before-refactor net** for each architecture-debt target, in its own commit.
3. **The refactors themselves**, each behind its net.
4. **knip judgment calls** + Sonar maintainability tail, opportunistically.

## Out of scope, parked

- **Dependency majors** (eslint 10, `@types/node` 26, vite-plugin-react 6, `@hono/node-server` 2, arctic 3) — still their own track, not this sprint.
- **The share card's language glyph mark** (Amara C7 design call, carried since S032).
- **New scroll/kata content** — this is a debt sprint, not a content sprint.

## Reading order if you're picking this up cold

1. [archive/sprint-033-maintenance-security-foundation.md](archive/sprint-033-maintenance-security-foundation.md) — what shipped, and the two honest findings (coverage over-delivery + the unwired web gate) that reshaped this sprint.
2. [PRD-033](../prd/033-sprint-033-maintenance-planning.md) — the original maintenance plan + the S034/S035 split this sprint revises.
3. [`docs/sprints/backlog.md`](backlog.md) — the architecture-debt and telemetry items this sprint draws from.
