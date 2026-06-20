# Sprint 033 — Maintenance: security & foundation

> **Status:** Open 2026-06-20. The five-language set is live (S032). This sprint stops the bleeding: security-relevant dep debt, honest coverage measurement + gating, dead-code tooling — so S034/S035 start from a measured baseline instead of a guess.
> **Predecessor:** [Sprint 032 — Ship the set, then close the reshape loop](archive/sprint-032-ship-and-reshape-loop.md)
> **Full plan:** [PRD-033](../prd/033-sprint-033-maintenance-planning.md) — this is the condensed working doc; the PRD is the source of truth (measured inputs, sequencing rationale, definition of done).

## Sprint thesis

The scrolls product shipped fast and accrued the usual debt: 78 `pnpm audit` vulns (1 critical, 12 high), coverage measured at ~63% api / ~6% web / 0% shared with a gate that's *decorative* (neutralized in CI), and no dead-code tooling. None of it is on the scroll-execution critical path — so it didn't block the ship — but it's the kind of debt that bites at the next thing. Measure it, gate it honestly, patch the security-relevant set. This is the *focused* cut of a 2–3 sprint block; the web testing backbone (S034) and architecture debt (S035) are explicitly deferred.

## Mandatory (sprint blockers if not done)

- **Task 0 — pull the findings before promising to fix them.** Run the Sonar `workflow_dispatch`, export issues to `docs/audits/2026-06-sonar-baseline.md`. Decide whether CodeQL enters the repo or stays in `sector-7g`; get its findings into the same doc. Triage both into fix-now / S035 / won't-fix-with-reason — **no silent drops.** Refactor-shaped reliability/maintainability findings get a **`needs-test-net`** tag (Adrian's call): no structural refactor — this sprint or in S035 — without unit tests pinning the current behavior landing first, in their own commit. Trivial one-line fixes are exempt. This gates scoping the rest.
- **Dependency security pass.** `pnpm audit --fix` for the non-breaking set; manually bump `dompurify` (via `mermaid`) and `hono` past their advisories. `pnpm audit` critical + high → **0**. Patch/minor bumps in one batch with full test + smoke after. **Majors are NOT in this track** (eslint 10, `@types/node` 26, vite-plugin-react 6, `@hono/node-server` 2, arctic 3) — log which were deferred.
- **Coverage — measure everything, gate honestly.** api: exclude `src/scripts/**` (dev CLIs dragging the number), re-measure business logic, then either raise tests to 80% or **lower the gate to the honest number and turn it back ON** (a gate at 80-and-disabled is worse than 65-and-enforced). web: add vitest coverage config + wire `lcov` into Sonar (don't chase the number — that's S034). shared: vitest config + a smoke test per Zod export.
- **Dead-code tooling.** Add `knip` at the root, commit the baseline to `docs/audits/2026-06-knip-baseline.md`, fix the unambiguous wins, defer the judgment calls.
- **Sprint admin discipline.** Close with retro, archive, CHANGELOG (internal + public per the doc-sync table), open S034 (web testing backbone) + S035 (architecture debt) from the baselines this sprint produces.

## Critical-path order

1. **Task 0** — pull Sonar + CodeQL findings, write the baseline audit, triage. (Unblocks the rest.)
2. **Track 1** — dependency security pass (critical + high → 0). Highest urgency.
3. **Track 2** — coverage measured across 3 workspaces + api gate enforced.
4. **Track 3** — knip baseline + unambiguous dead-code wins.

## Out of scope, parked

- **Web testing backbone (P-5).** 7/109 → meaningful coverage is its own sprint. S033 only makes the number visible. → **S034**.
- **Architecture debt** (P-1..P-6, F-4..F-6, in-memory rate limiters, `TelemetrySinkPort`). → **S035**, scoped from this sprint's baselines, gated on tests-before-refactor.
- **Dependency majors** — deferred per Track 1.
- **Aggressive Sonar smell cleanup** — only security-relevant + trivial findings this sprint; the long tail is S035.
- **The share card's language glyph mark** (Amara C7 design call, carried from S032).

## Reading order if you're picking this up cold

1. [PRD-033](../prd/033-sprint-033-maintenance-planning.md) — measured inputs, sequencing, definition of done.
2. [archive/sprint-032-ship-and-reshape-loop.md](archive/sprint-032-ship-and-reshape-loop.md) — what just shipped + the reseed-is-not-in-the-pipeline finding.
3. [`docs/sprints/backlog.md`](backlog.md) — the P-* / F-* items this sprint triages.
