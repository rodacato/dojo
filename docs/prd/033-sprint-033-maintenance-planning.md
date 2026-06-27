# PRD-033: Sprint 033 — Maintenance: Security & Foundation

> **Status:** Closed 2026-06-27. See the [S033 retro](../sprints/archive/sprint-033-maintenance-security-foundation.md).
> **Reframe at close:** the "web testing backbone deferred to S034" assumption did not survive the sprint — the web backbone got built *and* coverage hit ~87% inside S033, retiring S034's planned premise. The real residual (the web/shared gates are defined but never run in CI) plus the architecture debt now both land in S034. See the retro's honest findings.
> **Scope discipline:** This was the *focused* cut of a 2–3 sprint maintenance block. The architecture debt was deferred (now pulled into S034); the web testing backbone was *not* deferred in the end — it landed here.

## Sprint goal in one sentence

Stop the bleeding: patch the security-relevant dependency debt, get coverage measured and gated honestly across all three workspaces, add the missing dead-code and findings tooling — so S034/S035 (testing backbone, architecture) start from a clean, measured baseline instead of a guess.

## Inputs

Measured 2026-06-20 (not estimates):

- **Coverage — api:** ~33.4% lines / ~21.4% branches (remeasured 2026-06-20 with `src/scripts/**` excluded). **The earlier "63.4%" was stale** — the integration tests mock the DB (`vi.mock` on the drizzle client / container), so there is no hidden coverage a CI postgres would credit; 33%/21% is the real number. The 80/80 config gate was decorative (neutralized in the Sonar job, and ci.yml's test job ran `pnpm test` without coverage at all). **Resolved (Track 2):** gate lowered to the honest ratcheting floor (lines 32 / branches 20) and enforced in ci.yml via `test:coverage`; raising the number is the S034 testing-backbone work.
- **Coverage — web:** 7 test files for 109 `.tsx` components/pages (~6%). No `test:coverage` script, no coverage config in [apps/web/vitest.config.ts] (does not exist). This is backlog **P-5** ("needs a dedicated testing backbone sprint").
- **Coverage — shared:** 0 tests, no vitest config. Zod schemas are the API's validation contract and are untested.
- **Dependencies:** `pnpm audit` → **78 vulnerabilities: 1 critical, 12 high, 57 moderate, 8 low.** Named: `dompurify ≤3.4.10` (ALLOWED_ATTR pollution, via `mermaid@11.13.0`), `hono@4.12.8` advisory (GHSA-wgpf-jwqj-8h8p). Outdated majors: `@hono/node-server 1→2`, `eslint 9→10`, `@types/node 22→26`, `@vitest/coverage-istanbul 2→4`, `arctic 2→3`, `@vitejs/plugin-react 4→6`.
- **Dead code:** no detection tooling installed (no knip / ts-prune / depcheck). The `apps/api/src/scripts/` block reports 0% coverage but is **not dead** — they are dev CLIs (`calibrate-sensei.ts`, `validate-scroll-solutions.ts`); they just leak into the coverage denominator because the config's `exclude` omits `src/scripts/**`.
- **CodeQL:** **does not run in this repo.** Security is the remote `rodacato/sector-7g/.github/workflows/security.yml`, called with `blocking: false` (report-only). Whether that even runs CodeQL is unknown from here — task 0 confirms it.
- **SonarQube:** runs `workflow_dispatch`-only, thresholds neutralized. Findings live on the Sonar host (`vars.SONAR_HOST_URL`) and **cannot be enumerated from the repo.** Task 0 pulls them.

## Sequencing

S033 opens **after** S032 closes. S032's mandatory blocker is deploying the five-language set; that ships first. Rationale for *not* interrupting: the 1 critical + 12 high are in `dompurify` (web, mermaid render path) and `hono` — neither is on the scroll-execution / deploy critical path, so they don't justify halting the ship. If task-0 triage finds a critical that *is* exploitable in prod today, that flips — promote the patch into a S032 hotfix and note it here.

## Scope — what ships

### 0. Pull the findings before promising to fix them (do this first)

This is the gate for the whole sprint. You cannot scope "fix Sonar/CodeQL findings" without the list.

- Run the Sonar `workflow_dispatch`; export and triage the issue list (bugs / vulns / code smells / coverage-on-new-code).
- Decide whether CodeQL enters the repo as a first-class workflow or stays inside `sector-7g`. If it runs in `sector-7g`, get its SARIF/findings out and into the same audit doc. If it does **not** run anywhere, that is the finding — record it and decide whether to add `github/codeql-action` (default-setup is one toggle).
- Triage both lists into: (a) fix this sprint, (b) S035 arch debt, (c) won't-fix-with-reason. No silent drops.
- **Tests-before-refactor (Adrian's call, 2026-06-20).** Reliability/maintainability findings that need a *refactor* (not a one-line fix) carry a `needs-test-net` tag in the triage. They do **not** get refactored — this sprint or in S035 — until a unit-test net pins the affected code's current behavior first. The test lands before the refactor, in its own commit, so the refactor's diff is provably behavior-preserving. A maintainability cleanup without a test net is how you ship a reliability regression. Trivial one-line fixes (a null guard, a `===`) are exempt — this gate is for structural changes.

### 1. Dependency security pass

- `pnpm audit --fix` for the non-breaking set; manually bump `dompurify` (via `mermaid`) and `hono` past the advisory versions. Verify `pnpm audit` critical+high → 0.
- Patch/minor bumps across the board (the `pnpm -r outdated` minor column): hono, postgres, sentry, react/react-dom, codemirror, etc. — low risk, do in one batch, run full test + smoke after.
- **Majors are NOT in this track** — `eslint 10`, `@types/node 26`, `vite-plugin-react 6`, `@hono/node-server 2`, `arctic 3` each need their own changelog read + test pass. Triage them into S034/S035 or a dedicated dep-major pass. Log which were deferred (no silent caps).
- Honor [[feedback-kamal-secrets-on-env-rename]] and the Vite `ARG`/Dockerfile rule if any bump touches env handling.

### 2. Coverage — measure everything, gate honestly

- **api:** add `src/scripts/**` to the coverage `exclude` so the dev CLIs stop dragging the number. Re-measure the real business-logic coverage (application + domain). Then decide the gate: either raise tests to clear 80%, or **lower the gate to the honest current number and turn it back ON** in CI. A gate set to 80 and disabled is worse than a gate set to 65 and enforced — the second one ratchets.
- **web:** add `vitest.config.ts` + `test:coverage` + lcov reporter, wire its `lcov.info` into [sonar-project.properties](../../sonar-project.properties) (currently api-only). Do **not** chase a coverage number here — that's S034. Goal: the number becomes *visible*.
- **shared:** add vitest config + a smoke test per Zod schema export so the validation contract has a regression net. Small surface, high leverage.

### 3. Dead-code & findings tooling

- Add `knip` at the root (monorepo-aware: unused files, exports, deps). Run it, capture the baseline, fix the unambiguous wins (orphaned files, unused deps), defer the judgment calls. Wire `knip` into `pnpm lint` or a `quality` script only after the baseline is clean enough not to be noise.
- This is what makes "dead code" measurable for S034/S035 instead of a vibe.

## Scope — what does NOT ship

- **Web testing backbone (P-5).** 7/109 → meaningful coverage is its own sprint. S033 only makes the number visible. → **S034**.
- **Architecture debt.** P-1..P-6 (header/loader inconsistency, `console.error` in prod, raw `fetch` bypassing the client), F-4..F-6, single-process in-memory rate limiters (won't scale horizontally), the pending `TelemetrySinkPort`. → **S035**, scoped from the Sonar/knip baselines this sprint produces. **Gated on tests-before-refactor** (task 0): every `needs-test-net`-tagged finding gets its characterization tests first, then the refactor — S035 inherits both the refactor list and its test debt.
- **Dependency majors.** Deferred per Track 1.
- **Aggressive Sonar smell cleanup.** Only security-relevant + trivial findings this sprint; the long tail of code smells is S035.

## Risks and mitigations

- **Risk:** dep bumps break the build/tests silently. **Mitigation:** one batch, full `pnpm test` + `pnpm --filter=e2e test` + local Piston smoke after; bisect by workspace if red.
- **Risk:** lowering the coverage gate reads as "giving up." **Mitigation:** frame it as a ratchet — gate at the honest number, enforced, only ever moves up. Document the decision in the sprint retro.
- **Risk:** Sonar/CodeQL pull (task 0) reveals more than a sprint can hold. **Mitigation:** that's the point — task 0 *triages*, it doesn't fix. Overflow goes to S035 with a reason, not into a heroic S033.
- **Risk:** `knip` floods with false positives (dynamic imports, Vite globs). **Mitigation:** baseline-and-defer; only fix unambiguous wins, tune the config before gating.

## Critical-path order

1. **Task 0** — pull Sonar + CodeQL findings, write the baseline audit doc, triage. (Unblocks scoping the rest.)
2. **Track 1** — dependency security pass (critical+high → 0). Highest urgency.
3. **Track 2** — coverage measured across 3 workspaces + gate turned back on (api).
4. **Track 3** — knip baseline + unambiguous dead-code wins.
5. Sprint admin: retro, archive S033, CHANGELOG, open S034 (web testing backbone).

## Definition of done

- [x] `pnpm audit` reports **0 critical, 0 high**; deferred moderates/majors logged.
- [x] Coverage is measured and reported for **api, web, and shared**; all three feed Sonar.
- [x] api coverage gate is **enforced in CI** (`VITEST_NO_COVERAGE_THRESHOLD` removed from the gating path) at an honest, ratcheting threshold (~83.6% lines).
- [x] `apps/api/src/scripts/**` excluded from coverage; the api number reflects business logic only.
- [x] `knip` installed, baseline committed, unambiguous wins fixed.
- [x] Sonar + CodeQL findings exported and triaged into fix-now / S034–S035 / won't-fix — **no silent drops**.
- [x] S034 opened with the baselines this sprint produced. _(Reframed: it absorbs the architecture debt and the web-gate residual; the planned "web backbone" S035 split is revised — see status note above.)_
- [x] Docs sync per CLAUDE.md table (CHANGELOG, ROADMAP). The web/shared coverage gates are defined but **not** wired into CI — carried to S034, not silently closed.

## Next step

After S032 closes and the set is live: open S033 into `docs/sprints/current.md` from this PRD, starting with task 0. Until then this stays a planning doc — `current.md` is untouched.
