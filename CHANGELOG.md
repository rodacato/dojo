# Changelog

All notable changes to this project are documented here. First-person decision voice — not feature announcements.

---

## Sprint 023 — Dojo ubiquitous language pass (2026-06-05)
**Phase 1 — Alpha**

The sprint where the codebase finally speaks one vocabulary. The product was already half-committed to the dojo metaphor (dojo, sensei, kata) but the URLs and the code still spoke generic SaaS (`/learn`, `/badges`, `/leaderboard`, `Exercise`, `Course`, `Badge`). The seam read as indecision. Doing this before Phase 1 invites scale meant zero external links to break and no share cards in circulation to regenerate.

- **Routes renamed end-to-end** (PRD-030) — `/kata` → `/katas`, `/learn` → `/scrolls`, `/playground` → `/engawa`, `/badges` → `/belts`, `/share/course/*` → `/share/scroll/*`, `/admin/exercises` → `/admin/katas`, `/admin/courses` → `/admin/scrolls`. Old paths deleted (zero users, no 301s). `/dashboard` and `/start` stay — generic terms that earn their place.
- **`/leaderboard` deleted, not renamed** — kumite is sparring, not ranking. Surfacing rank lives on `/belts` (identity), not on a competitive leaderboard surface. The leaderboard endpoint, page, types, and client method are all gone. PRD-031 documents the leaderboard-as-identity-corruption rationale.
- **`/kumite` placeholder shipped** — reserved URL with an honest "coming soon" panel that explains kumite will be 1v1 sparring with paired evaluation. Not built; not a relabel of leaderboard. Future PRD covers the feature design.
- **Belts system shipped** (PRD-031, Spec 028) — `BeltRank` value object (white / yellow / green / brown / black), `BELT_THRESHOLDS` table in `domain/recognition/belt.ts`, `CalculateBelt` use case (stubbed to white at sprint close; full factor projection deferred). Hard constraint: the sensei does **not** influence belt advancement. Rubric is volume + topic-cluster diversity + active days + cooldown — derivable from existing session/attempt data, no migrations required to revise.
- **Badge → Milestone** — the existing `Badge` records (FIRST_KATA, POLYGLOT, COURSE_*) are single-moment achievements, not rank. PRD-030 originally proposed renaming them to `Belt`; the rename inventory caught the conflation. They are renamed to `Milestone` instead. `/belts` page surfaces both: belt rank as headline + milestones as a section below.
- **Domain code ubiquitous language** — `Exercise` aggregate → `Kata`, `Course` aggregate → `Scroll`, `Badge` aggregate → `Milestone`. Touched: shared schemas, domain layer, application use cases, infrastructure adapters, HTTP routes, container wiring, event handlers, frontend pages, App.tsx, Sidebar/BottomNav, API client. ~157 files renamed across the monorepo.
- **Schema export rename, DB names preserved** (ADR 020) — Spec 028's "alias on import" approach was insufficient: Drizzle's relational query API binds to the exported table variable name. Adjusted: `schema.ts` exports `katas`, `scrolls`, `userMilestones`, `scrollProgress` directly, while DB table names stay legacy via `pgTable('exercises', ...)`. Column property names also follow ubiquitous language (`sessions.kataId` maps to column `exercise_id`). The schema file becomes the single canonical mapping point between legacy DB shape and dojo vocabulary.
- **Topic clusters helper** — `topicCluster(topic: Topic): TopicCluster` added to `@dojo/shared`. The mapping is `Record<Topic, TopicCluster>` so TypeScript fails the build if a new topic is added without a cluster — invariant enforced at compile time, no runtime test needed.
- **Sensei prompts updated + calibration harness shipped** — literal `EXERCISE:` → `KATA:` and "bug-fix exercise" → "bug-fix kata" applied in `prompts/sensei.ts`. The calibration gate ships as a standalone script ([scripts/calibrate-sensei.ts](apps/api/src/scripts/calibrate-sensei.ts) + [.fixture.ts](apps/api/src/scripts/calibrate-sensei.fixture.ts)) that embeds the pre-rename "legacy" prompt as a string baseline, runs the new prompt against a 10-kata fixture (3 easy + 4 medium + 3 hard), parses verdicts, and reports per-difficulty drift. Exits 1 if any bucket exceeds ±10pt. Smoke verified with `pnpm calibrate:sensei --smoke`; the real-LLM run (`LLM_API_KEY=... pnpm --filter=api calibrate:sensei`) is the gate the creator runs locally before declaring the rename validated.
- **Step type `'exercise'` stays** — orthogonal to the aggregate rename. It's the step kind inside a Scroll, not the renamed aggregate. Left intact in `StepType`.
- **Docs aligned in the same sprint** — `ARCHITECTURE.md`, `README.md`, `AGENTS.md`, `BRANDING.md` updated. BRANDING gained a glossary section (kata / sensei / scroll / belt / milestone / engawa / kumite — each with on-brand and off-brand examples) plus a rewritten Belts & Milestones section. Old ADRs / archived sprints / archived specs were **not** edited — they are history.
- **Belt computation is real, not stubbed** — `computeBeltFromHistory(history, now)` walks completed sessions chronologically as a state machine, maintaining running count, topic-cluster set, and 30-day activity window. Promotes at most one rank per session, only when both next-rank thresholds and cooldown at current rank are satisfied. `SessionRepository.listCompletedKataHistoryForBelt(userId)` ships the projection — single JOIN between `sessions` and `katas`, ordered by `startedAt asc`. Pure-domain unit tests cover the cooldown gate, the activity-window math, and tolerance for legacy topic slugs.
- **Verification** — `pnpm typecheck` green across the monorepo (shared + api + web); `pnpm test --filter=api` — 141 passing (8 new in `domain/recognition/belt.test.ts` + 4 in `application/recognition/CalculateBelt.test.ts`). Visual polish (belt rings, share card variant) and the real-LLM calibration run are explicit follow-ups, not blockers.

---

## Documentation cleanup (2026-06-05)

The `docs/` folder had drifted: `docs/wip/` had become a permanent limbo for research that had already materialized into specs, root-level `CODE_SCHOOL_PLAN.md` and `MARKET_STUDY.md` were ungrouped with the rest, and early-phase PRDs (001-005, 008-010, 013) sat next to active ones, signaling "still relevant" when they were not. The fix was structural, not cosmetic.

- **`docs/research/` introduced** — Background plans/analyses that informed past decisions and are still cited from canonical docs (ADRs, courses/README) live here. Moved in: `CODE_SCHOOL_PLAN.md`, `EXECUTION_PLAN.md`, `EXERCISE-VARIETY-ANALYSIS.md`, `MARKET_RESEARCH.md`, `SPRINT-014-alt-iframe-sandbox.md`. Stale references in ADR 014, ADR 016, spec 021, sprint-015 archive, and `courses/README.md` updated to the new paths.
- **`docs/courses/testcode-pattern.md`** — `IFRAME-TESTCODE-PATTERN.md` was an active reference for course authors, not WIP. Promoted out of `wip/` into `courses/` next to `courses/README.md` where it gets discovered.
- **`docs/research/prd-archive/`** — Early-phase exploratory PRDs (001-005, 008-010, 013) that served their purpose during Phase 0 planning moved out of `docs/prd/`. `ROADMAP.md` PRD index updated to point to the archive and marks them `Archived`.
- **`docs/wip/` deleted** — The concept was the bug. In-progress work belongs in `sprints/current.md` or in a branch, not in a doc folder that never empties. `.gitignore` cleaned up accordingly.
- **`docs/MARKET_STUDY.md` deleted** — Survey methodology written for Phase 0 problem validation, never executed (alpha cohort feedback served that role instead). Zero references.
- **`docs/README.md` introduced** — Entry point that organizes everything by lifecycle: canonical (source of truth) / live (active work) / history (immutable) / exploratory & archived research (disposable). Reading order by role (new contributor / AI agent / picking up active work / course author / decision archaeology).
- **Status headers on the seven canonical docs** — `VISION`, `IDENTITY`, `EXPERTS`, `ROADMAP`, `WORKFLOW`, `ARCHITECTURE`, `BRANDING` now carry a one-liner declaring their lifecycle. A reader knows at a glance whether they are reading current truth or a frozen artifact.
- **`docs/WORKFLOW.md` doc map rewritten** — Now includes a Lifecycle column so each doc declares its expected mutation rate. `AGENTS.md` build context now points at `docs/README.md` as the entry point.
- **What was *not* touched** — `docs/specs/`, `docs/adr/`, `docs/sprints/archive/`, and `docs/courses/{language}.md` are project history or active references; left untouched. (`stitch/` was later deleted — see the doc-system sweep that consolidated everything into `docs/DESIGN.md` + `docs/BRANDING.md`.)

---

## Sprint 022 — Open the door: friend cohort + public playground (2026-04-26)
**Phase 1 — Alpha → hook experiment**

The sprint where the platform got its first top-of-funnel surface, the prep loop got real streaming, and authenticated learners got a free-form Q&A surface — all behind feature flags so the rollout is reversible.

- **Playground v0** (PRD 029, migration 0020) — Anonymous code execution at `/playground` with the full four-layer abuse stack: per-IP rate limit + per-browser-session rate limit + Cloudflare Turnstile + global daily quota. `playground_runs` log retains only `(ip_hash, session_hash, language, version, exit_code, runtime_ms)` — no source code, no stdout/stderr. Funnel events emitted from day one (`playground_run`, `playground_cta_click`, `playground_signup_conversion`). Behind `FF_PLAYGROUND_CONSOLE_ENABLED`. Six languages whitelisted (Python, TypeScript, Go, Ruby, Rust, SQL).
- **Playground v1 — ask-sensei** (migration 0021) — Authenticated free-form Q&A streamed via SSE. `LLMPort.askSensei` returns `{stream, usage}` so the route can stream answer deltas and log token counts simultaneously. Hard daily quota per user (default 30/day) enforced server-side against the new `llm_requests_log` table. Question and answer text deliberately NOT persisted — the surface is exploration, not graded practice. UI is a modal with the panel-mandated disclaimer baked in. Behind `FF_PLAYGROUND_ASK_SENSEI_ENABLED`. Anonymous LLM access stayed explicitly out of scope.
- **Streaming kata prep** — `GET /sessions/:id/body-stream` SSE endpoint replaces the 2s polling loop when `FF_LLM_PREP_STREAMING_ENABLED` is on. Idempotent on already-persisted bodies (replays as one `token` + `done` frame). Concurrent connections get 409 to avoid duplicate LLM calls. Frontend prefers SSE and falls back to polling on 404 — old deploys and new deploys both work, the flag rollout is genuinely safe. Brings perceived prep latency from ~30s to ~2s on Sonnet 4.6.
- **Smoke suite** — six specs (`sign-in`, `view-profile`, `view-dashboard`, `complete-course-step`, `complete-kata`, `playground-anon-run`). `complete-kata` and `playground-anon-run` skip cleanly on prod runs that don't carry `SMOKE_USE_MOCK_LLM=1` / `SMOKE_PLAYGROUND_ENABLED=1` so a single workflow definition works against staging and prod.
- **Operational floor** — Errors retention cron (`/cron/cleanup-errors`, 30-day window). Piston liveness: GHA `piston-liveness.yml` workflow probes `/health/piston` every 30 minutes, two consecutive failures alert via GitHub's email path (ADR 019). `scripts/piston-reprovision.sh` is idempotent and documented in the README runbook.
- **Runtime bumps blocked upstream** — Go / Ruby / Rust bumps deferred to backlog. `engineer-man/piston` ships only Go 1.16.2, Ruby up to 3.0.1, Rust up to 1.68.2; bumping to current stable requires either a maintained fork or a custom package layer.
- **First friend invite carried to S023** — code surface ready (S021 + S022); dispatch is humans-only and was not blocked by anything in this sprint. Audit doc scaffolded at `docs/audits/2026-04-friend-feedback.md` with a 7-day populate-or-cut rule.
- **Verification** — typecheck ✓, lint ✓, API test suite green (123 tests). Three new feature flags all default-off. Frontend's SSE-first / polling-fallback path makes flag flips reversible without redeploy.

---

## Sprint 020 — Phase 1 expansion (2026-04-21)
**Phase 1 — Alpha**

The sprint where the platform stopped being a prototype and started behaving like a product — error states, acquisition loop, a new kata format, and the observability to know when any of it breaks.

- **UX/UI audit + 5 shipped fixes** — Soren C6 walked every user-facing flow and filed 13 findings in [docs/ux-gaps-2026-04.md](docs/ux-gaps-2026-04.md). Shipped: **B-1** kata prepare timeout cut 60s → 20s with a "taking longer than usual" notice at 8s; **B-2** `ResultsPage` survives reload via API hydration instead of sessionStorage; **F-1** reusable `ErrorState` component retrofitted into `CoursePlayerPage`, `SharePage`, `PublicProfilePage` (distinguishes 404 vs network); **F-2** `SenseiEvalPage` announces "Evaluation complete — opening full analysis…" during the 1.5s auto-redirect; **F-3** `useEvaluationStream` surfaces a reconnect affordance on unexpected WS close codes instead of freezing. Remaining findings (F-4..F-6, P-1..P-6) moved to backlog.
- **Acquisition loop closed** (migration 0017) — Course completion now ships: a dynamic satori-based share card at `/share/course/:slug/:userId`, three per-course badges (TS / JS DOM / SQL) emitted by a new `CourseCompleted` domain event, and a "Share your completion" banner on the course final screen with native share + clipboard + Twitter fallback. TS Fundamentals and JS DOM flipped to `isPublic: true` so visitors can try them without auth. The catalog now has 3 public courses.
- **Ask the sensei MVP** (single-shot nudge, PRD 026) — `LLMPort.generateNudge` + `GenerateNudge` use case + `POST /learn/nudge` + rate limiter + `FF_COURSE_NUDGE_ENABLED` flag + inline UI. Persistence in the same sprint: `step_nudges` table + 👍👎 feedback. No memory, no threaded chat — full version deferred to S021+ if usage signals it.
- **"Code Review" kata format POC** (migration 0019, PRD 027) — New `'review'` exercise type + nullable `rubric JSONB` column. `buildReviewPrompt` short-circuits `GenerateSessionBody` so the sensei evaluates against the rubric, not against code. First kata seeded: "Inventory drift bug" with 5-issue rubric. `TypeBadge` gained a `REVIEW` variant. Editor wiring treats review input as plain text + rubric preview. Real format, 1 live kata.
- **Python course skeleton** (PRD 025) — `python-for-the-practiced` in `status: draft`, L1 with 2 steps (intro read + `@dataclass` exercise). Python test harness in-file. L1.3 / L1.4 / L2 / L3 slide to S021 — the skeleton ships so the schema and test harness are exercised in-sprint.
- **Editorial backfill — alternative approach on 6 key steps** — TS L1.3 (template literal vs concatenation), TS L1.4 (arrow vs function), TS L2.2 (for-of vs reduce), TS L3.2 (concatenation form of FizzBuzz), JS DOM L1.2 (innerText vs textContent), SQL L1.2 (DENSE_RANK vs RANK). The field shipped empty in S019; it now has content where it most helps.
- **Observability — error reporting pipeline** (ADR 017, migration 0016) — `ErrorReporterPort` + 4 composable adapters on both API (`Console`, `Postgres`, `Sentry`, `Composite`) and web (`Console`, `Api`, `SentryBrowser`, `Composite`). API wired into `router.ts` `onError` + `POST /errors` (rate-limited 30/min/IP) so the web boundary fans out to all three sinks via a single server round-trip. Web wired into `ErrorBoundary.componentDidCatch`, `window.onerror`, `unhandledrejection`. Admin surface at `/admin/errors` with filtering by source + status. Sentry SDKs (`@sentry/node`, `@sentry/react`) gated on DSN + environment so a prod `.env` on a laptop can't burn Sentry quota. Source maps uploaded via `@sentry/vite-plugin` keyed on `VITE_SENTRY_RELEASE` (git SHA). README + `.env.example` updated with the full matrix of env vars.
- **Piston production recovery** (ADR 018) — The `/health/piston` endpoint that shipped this sprint surfaced that Piston had been in a crashloop for ~3 weeks, invisible because neither the app nor the proxy health checks touched it. Root cause: a host kernel upgrade tightened cgroup v2 delegation; `privileged: true` alone was no longer enough. Fix: `privileged` + `cgroupns: host` + named volume for `/piston/packages` + pinned image digest. 6 runtimes reinstalled. The accessory is now explicitly configured for the hardening it was accidentally relying on.
- **CSP fix — Sentry ingest** — Part 7.10 verification caught that the web nginx CSP's `connect-src` was blocking the Sentry browser SDK from reaching `*.ingest.us.sentry.io`. Events still reached Sentry via the server-side fan-out, but the web SDK's richer browser breadcrumbs were silently dropped. Whitelisted the ingest pattern; the direct path is restored.
- **Verification** — typecheck ✓, lint ✓, API + web test suites green pre-deploy. `/health/piston` returns `{ status: 'ok', runtimes: [python, typescript, sqlite3, go, ruby, rust] }` in prod. Dashboard EXPLAIN ANALYZE on the 3 hottest queries (weak areas, recent sessions + verdict subquery, heatmap 30d) ran cleanly in 0.07–0.27 ms — plans are healthy given the current data volume, but too sparse to validate the sprint-012 N+1 fix. Re-run flagged for after the alpha cohort has been active 2-3 weeks.

---

## Sprint 019 — Course content quality v2: pedagogy (2026-04-17)
**Phase 1 — Alpha**

The sprint where the courses became pedagogically complete — not just structurally correct.

- **Semantic slots renderer** — `MarkdownContent` now detects `## Why this matters` / `## Your task` / `## Examples` / `## Edge cases` at the start of a step instruction and renders each as a styled card (accent, neutral, muted, warning). Falls back to plain markdown when no slots are found. Pure function `renderSlots()` with 6 unit tests. vitest added to `apps/web` for the first time.
- **External references per course** (migration 0015, `courses.external_references` JSONB) — Framework §8 required every sub-course to cite books, docs, or talks it draws from; all 3 courses now do. SQL Deep Cuts: *Use The Index, Luke!*, SQLite Window Functions docs, *Learn SQL the Hard Way*. TS Fundamentals: TypeScript Handbook, *Effective TypeScript*, Total TypeScript Tips. JS DOM: MDN DOM intro, MDN Event delegation, *YDKJS Objects & Classes*. Rendered as a "Further reading" collapsible section at the bottom of the course sidebar.
- **Alternative approach post-pass** (migration 0015, `steps.alternative_approach` TEXT) — The solution endpoint now returns `{ solution, alternativeApproach }`. When present, an "Alternative approach" `<details>` section appears below the reference solution in the Solution tab. Schema and UI wiring complete; editorial content for individual steps will be backfilled incrementally.
- **SQL L1.4 — "Compare each row to the previous"** — New exercise introducing `LAG(expr, offset, default)` with a month-over-month sales delta. SQL Deep Cuts goes from 9 → 10 steps. `validate:courses` 14/14 green.
- **Verification** — typecheck ✓, lint ✓, 106/106 API tests, 6/6 web tests, `validate:courses` 14/14 OK + 6 iframe skipped + 10 no-solution skipped.

---

## Sprint 018 — Course content quality v1 (2026-04-16)
**Phase 1 — Alpha**

The sprint where the curriculum framework written in `docs/courses/README.md` finally became executable in the schema and in the catalog.

- **Step type `exercise` reintroduced** (migration 0014) — Sprint 017 collapsed everything that wasn't `read` into `challenge`. The framework distinguishes warmup (`exercise`, ~80% pass on first try) from stretch (`challenge`, ~40%) for a reason. `StepType` is now `'read' | 'code' | 'exercise' | 'challenge'`, the column default flipped to `exercise`, and the sidebar gives each type a distinct icon (📖 read, 📝 exercise, ⚡ challenge).
- **`step.title` and `step.solution` columns** — Title was being extracted from the H1 of the instruction markdown by regex; now it's a real top-level field. Solution is the reference implementation, intentionally absent from `/learn/courses/:slug` so it can never leak before pass.
- **27 step rows backfilled and reclassified** — Every step now has an explicit `title` (the H1 was stripped from the body so it isn't rendered twice). 19 non-read steps got a hand-written reference `solution`. Most former `challenge` rows were downgraded to `exercise`; only the genuine stretch ones kept the marker.
- **Per-course audits:** TS Fundamentals gained a new "Template literals" read step in L1 (the existing greet exercise used `${}` syntax that hadn't been taught yet) and a new "Implement memoize" challenge in L3 (so the sub-course finally satisfies the framework's "every sub-course needs ≥1 challenge" rule). JS DOM L1.1 now mentions `getElementById` alongside `querySelector` with the trade-off, and the L3.3 delegation challenge hint was reworded to point at the DOM-tree concept instead of giving away `closest('li')`. SQL Deep Cuts L2.2 had its starter input shortened from 12 → 8 lines to reduce cognitive load.
- **Solution reveal panel** — `GET /learn/courses/:slug/steps/:stepId/solution` returns 403 until the caller has the step in their `completedSteps`, then 200 with the reference. New "Solution" tab in the StepEditor next to Tests/Output, locked with 🔒 until pass, lazy-fetched on first open. Body opens with "One way to write this. Yours might be different — both can be right." so it reads as comparison, not as the answer.
- **`pnpm validate:courses` CI gate** — A standalone script walks every seeded step that has a `solution`, runs it through the same `ExecuteStep` use case the learner triggers, and asserts `passed === true`. On first run it caught two real bugs in our own seeds: the TS Sum-an-array test used `Array.from` (Piston's TS 5.0.3 default lib is ES5, no `Array.from`) and the original debounce challenge needed `Promise` + top-level `await` (also unsupported by the runtime). Sum was rewritten to a for-loop; debounce was replaced with synchronous `memoize`.
- **Verification** — typecheck ✓, lint ✓, 106/106 API tests (+5 for the solution endpoint), 10/10 E2E. `validate:courses` reports 13/13 OK with 6 iframe steps skipped.

---

## Sprint 017 — SQL Deep Cuts + Public Courses + Debugging Sensei (2026-04-15)
**Phase 1 — Alpha**

The sprint where the dojo got its first truly public course and the sensei learned to evaluate bug-fix exercises differently.

- **SQL Deep Cuts course (public)** — The draft from Sprint 016 is now a live course at `/learn/sql-deep-cuts`. 3 lessons, 9 steps (3 read + 6 challenge): window functions (RANK, running totals), CTEs (refactor + chained budget ratio), real-world analysis (cohort sizes + a final "rewrite this slow churn report" challenge). Marked `isPublic: true` — no login required to try it.
- **SQL testCode harness (SQLite, finally real)** — Sprint 016's SQL katas shipped with PostgreSQL syntax (`DO $$ BEGIN ... RAISE EXCEPTION`, `to_char`) that never executed — Piston runs SQLite (ADR 014). Fixed with a new convention: `PistonAdapter.buildSqlScript()` substitutes `-- @SOLUTION_FILE` with `CREATE VIEW solution AS <user code>;`, and assertions use `SELECT CASE WHEN cond THEN '✓ name' ELSE '✗ name: reason' END` + a final `CREATE TABLE _ok (ok INT CHECK(ok=1))` gate that forces exit 1 on any miss. All 3 `sql-advanced.ts` katas rewritten and verified. All 6 SQL Deep Cuts challenges verified (correct answer → exit 0, known-wrong → exit 1).
- **Public courses + anonymous progress** (migration 0013) — `courses.is_public` flag + `course_progress.anonymous_session_id` (nullable, partial unique index). `CourseProgress` port rebuilt around a `ProgressOwner` union: `{ kind: 'user', userId } | { kind: 'anonymous', sessionId }`. New `MergeAnonymousProgress` use case: when a user logs in, anonymous progress unioned into their account (max `lastAccessedAt`), then the anonymous row is deleted. `POST /learn/progress/merge` endpoint. Frontend `dojo-anon-id` in localStorage + `optionalAuth` middleware + language whitelist on the anonymous `/learn/execute` path (Marta: shrink attack surface).
- **Step type `read | code | challenge`** — Normalized from legacy `explanation | exercise` via the same migration. `CoursePlayerPage` already renders `read` as markdown-only (no editor) since Sprint 014 — the rename closed the loop.
- **"Public" badge** on course cards in the catalog, accent-colored border, visible to all visitors.
- **Sensei prompt — debugging context** — When `exercise.category === 'debugging'`, all three prompt variants inject a 5-line block focused on root-cause identification vs. symptom patching, fix minimality, and understanding WHY the code was wrong. Relevant for the 5 fix-the-bug katas from Sprint 016. `category` threaded through `LLMPort.evaluate` + adapters (Anthropic, OpenAI).
- **Journal recovery** — `_journal.json` was missing entries for migrations 0012 and 0013, so neither was applying. Fixed; migrations run clean from scratch.
- **Verification** — typecheck ✓, lint ✓, 97/97 API tests (+12 from Sprint 016: merge use case, debugging prompt variants, SQL adapter).

---

## Sprint 016 — Surprise me + Fix-the-bug + SQL Advanced (2026-03-28)
**Phase 1 — Alpha**

The sprint where picking a kata got one click shorter and the exercise library grew a debugging track.

- **Surprise me →** — Second CTA on `DayStartPage`. Calls `getExercises` with current mood/duration, picks one at random, starts the session, navigates straight to `/kata/:id`. Independent `surpriseLoading` state so the primary "Show my kata" button keeps working. Uses the same sessionStorage hand-off as the manual flow.
- **Fix-the-bug kata (5 exercises)** — New `category: 'debugging'` seed file. Each exercise ships with `starterCode` containing a pre-filled buggy implementation the learner has to fix: off-by-one pagination (TS), Python mutable default argument, Go race condition without mutex, `parseInt` without radix (TS), Go nil-check on the wrong receiver. Tests assert corrected behavior via Piston.
- **SQL advanced kata (5 exercises)** — New seed file targeting window functions and recursive CTEs: department rankings (`RANK() OVER PARTITION BY`), running monthly totals (cumulative `SUM`), org-chart recursive CTE, flatten nested subquery into readable CTEs, churn analysis. Piston-verified against seeded fixtures.
- **`starterCode` on Exercise** — New nullable column (`migration 0012_starter_code.sql`) + domain field + DTO. `KataActivePage` pre-fills the editor with `exercise.starterCode` when present, so debugging katas open ready to edit instead of blank.
- **SQL Deep Cuts course (draft)** — `seed-courses-draft-sql.ts` scaffolded and kept out of the runner. 3 lessons, 9 steps, testCode pattern in place for Sprint 017 wiring.
- **Verification** — typecheck ✓, lint ✓, 79/79 API tests pass.

---

## Sprint 015 — iframe Sandbox + JavaScript DOM Course (2026-03-27)
**Phase 1 — Alpha**

The sprint where the course catalog got a second language and the browser became the execution engine.

- **iframe sandbox runner** — `IframeSandboxRunner` executes `javascript-dom` course steps in `<iframe sandbox="allow-scripts">`. No server call, no Piston — the browser is the runtime. Results communicated via `postMessage`. Same `ExecuteStepResponse` contract as the Piston path. (ADR 016)
- **StepEditor routing** — `CoursePlayerPage` now routes by `course.language`: `javascript-dom` → iframe runner, everything else → `POST /learn/execute`. Badge "Runs in browser" shown when iframe is active.
- **JavaScript DOM Fundamentals course** — 3 lessons, 9 steps: Selecting Elements (`querySelector`, `querySelectorAll`), Modifying Elements (`textContent`, `classList`, `setAttribute`), Events (`addEventListener`, event delegation). Step 3.3 is a pre-filled bug challenge — `e.target` vs `e.target.closest("li")` in event delegation.
- **Seed runner refactored** — `seedOneCourse()` helper supports N courses. `db:seed:courses` now seeds both TypeScript Fundamentals and JavaScript DOM Fundamentals.
- **Landing page CTA** — "Try a free course →" button added to hero alongside "Request access".
- **Rate limiter integration test** — Verifies 10th request succeeds and 11th returns 429 for anonymous Piston execution. Also tests per-IP isolation.
- **Coverage** — `application/learning` layer: 100% across all metrics. `GetCourseProgress` (was 0%), `ExecuteStep` fallback branches added. 79 tests / 21 files.
- **Docs + env** — README updated with Courses feature and `db:seed:courses` command. `.env.example` PISTON_RUN_TIMEOUT corrected 15000→3000.

---

## Sprint 014 — Courses MVP (2026-03-27)
**Phase 1 — Alpha**

The sprint where the dojo opened to the public. Anyone can now learn TypeScript without an account.

- **Learning bounded context** — New `PostgresCourseRepository` and `PostgresCourseProgressRepository` with full Drizzle ORM queries (joins across courses → lessons → steps).
- **5 use cases** — GetCourseList, GetCourseBySlug, ExecuteStep (reuses CodeExecutionPort/Piston), TrackProgress (idempotent), GetCourseProgress.
- **5 API endpoints** — `GET /learn/courses`, `GET /learn/courses/:slug`, `POST /learn/execute`, `POST /learn/progress`, `GET /learn/progress/:courseId`. All with Zod validation.
- **Seed course** — "TypeScript Fundamentals": 3 lessons (Variables & Types, Arrays & Objects, Control Flow), 9 steps with testCode for each exercise.
- **Course catalog** (`/learn`) — Public page, grid layout with course cards showing language badge, lesson count, accent color.
- **Course player** (`/learn/:slug`) — Collapsible sidebar with lesson/step nav, markdown instruction renderer, CodeMirror editor with "Run" button, test results panel. Auto-advances on success.
- **Progress tracking** — localStorage for anonymous users, API sync for authenticated. Merge on auth (union).
- **Navigation** — "Learn" added to sidebar and bottom nav with graduation cap icon.
- **10 new tests** — 72 total across 19 files.

---

## Sprint 013 — Hardening + Courses Pre-work (2026-03-27)
**Phase 1 — Alpha hardening**

The cleanup sprint before courses. Everything deferred from Sprint 012, resolved.

- **Domain cleanup** — `Session.isExpired()` encapsulates timer enforcement with 10% grace.
- **Route split** — feedback.ts and preferences.ts extracted. practice.ts: 1,312 → 374 lines. 7 route files.
- **API client modules** — Split into 7 files. Old api.ts is a thin re-export shim.
- **WebSocket handler tests** — 6 new tests (62 total). handleSubmit/handleReconnect extracted to ws-handlers.ts.
- **UX polish** — Share card approach_note, weekly goal target (1-7) in preferences, WCAG color audit.
- **Courses pre-work (ADR 015)** — 4 tables + indexes + domain skeleton + public routes.
- **Rate limiting** — Anonymous Piston: 10/min per IP. Authenticated: 60/min.
- **Piston Kamal accessory** — Boots automatically on deploy.

---

## Sprint 012 — Alpha-Ready (2026-03-26)
**Phase 1 — Alpha prep → Alpha launch**

The sprint where code execution became real and the post-kata experience got personal.

- **15 testCode exercises** — Function-oriented katas designed for Piston: TypeScript (4), Ruby (2), Python (2), Go (3), SQL (4). Each with 5-8 test cases covering edge cases. Total catalog: 76 exercises.
- **Post-kata insight screen** — Sensei prompt now produces `<strengths>`, `<improvements>`, `<approach_note>` XML tags. ResultsPage shows structured cards with green/amber/accent styling. Graceful fallback if tags absent.
- **Dashboard N+1 fix** — Active session and today session queries collapsed from cascaded lookups to single JOINed queries. 10 → 6 queries per dashboard load.
- **Weekly goals** — "2 of 3 this week" progress bar on dashboard. Computed from sessions (no new table). goal_weekly_target in user_preferences.

---

## Sprint 011 — Refactoring + Landing + Execution + Interests + E2E (2026-03-26)
**Phase 2 closing → Phase 1 Alpha prep**

The sprint where the codebase got cleaned up, the landing page got rewritten for real visitors, code execution became real, and kata selection got personal.

- **Code health refactoring** — practice.ts split from 1,312 to 492 lines across 4 route files (ADR 013). Verdict/streak query helpers extracted. Frontend components (TodayCard, RecentSessionRow, useRotatingMessage) extracted. Error handling and type safety fixes across the codebase.
- **Contrast fix** — `--color-muted` brightened from #475569 to #64748B to pass WCAG AA (4.5:1 minimum) on all surface backgrounds.
- **Landing page redesign** — Full Stitch rewrite: sticky navbar, dot grid background with mouse proximity effect, typewriter hero, 4-step "How It Works" flow, social proof with practitioner quotes, new "Open Source" section with live GitHub stats, scroll fade-in animations. "What It's Not" section removed per Soren.
- **Sandboxed code execution (Piston)** — ADR 014. CodeExecutionPort with PistonAdapter + MockExecutionAdapter. ExecutionQueue with concurrency limit. WS messages `executing` and `execution_result`. Sensei receives test results as factual evidence (4 prompt variants). Frontend shows results before sensei streaming.
- **Interest-based kata selection** — user_preferences table (level, interests, randomness). Weighted exercise ordering: interests affect category preference, level affects difficulty, randomness controls the mix. DayStart "Customize your practice" panel.
- **E2E smoke tests** — Playwright setup with 4 tests (landing, auth redirect, dashboard, kata flow). API mocked with page.route(). CI job runs in parallel.
- **Pre-launch hardening** — GetExerciseOptions domain violation fixed (UserPreferencesPort), 5 DB performance indexes, connection pool (max 20), 14 new tests (ExecutionQueue, PistonAdapter, GetExerciseOptions), WS error logging + partial stream persistence.

---

## Sprint 010 — Feedback Loop + Share + Admin Review (2026-03-26)
**Phase 2 — Pre-invite polish (closing)**

The sprint where the product learned to listen. Users can now tell me what's broken in an exercise, I can see the signal aggregated by variation, and the share experience finally has a proper landing page instead of a dead link.

- **Kata feedback system** — 3 micro-questions (clarity, timing, evaluation fairness) + optional note, collapsed on Results page. One per session, stored per variation so I can tell which sensei persona is underperforming.
- **Share redesign** — Public page at `/share/:id` with verdict badge, sensei pull quote, exercise info, and "Enter the dojo" CTA. OG image for social previews. ShareButton now copies the public URL.
- **Admin review** — Aggregated feedback on the edit page, breakdown by variation, notes list, admin notes field. Archive action for exercises with consistently bad feedback. Version auto-increments on every edit.
- **Secondary screens** — Login card-centered with watermark, Badges grouped by category (2-col mobile), Leaderboard and Profile cleaned up for AppShell navigation.

---

## Sprint 009 — Design Alignment + Quality of Life (2026-03-24)
**Phase 2 — Pre-invite polish**

The sprint where every screen got a second pass against the Stitch design reference. Six core screens, a sidebar, and a 4x expansion of the exercise catalog.

- **Dashboard** — 12-column grid layout (streak 4col + today 8col, activity 8col + right panel 4col), card-style rows, Material Symbols icons in sidebar/bottom nav.
- **Core screens** — Results, Sensei Eval, Day Start, Kata Selection, Kata Active all aligned with Stitch design direction.
- **Component library** — Modal, Toast, SkeletonLoader, AccentCard, StatCard, GroupButtons, Input/Textarea — all implemented.
- **60+ exercises** — Expanded from 15 to 61 across 10 categories (SQL, design patterns, architecture, common services, frontend, DevOps, algorithms, security, testing, process). Split into per-category files under `exercises/`.
- **Streaming improvements** — Code blocks parsed in eval messages, typing reveal for non-streaming mode.
- **Mobile responsive** — Full audit with critical/high/medium fixes across all pages. `prefers-reduced-motion` global CSS rule.

---

## Sprint 008 — Production Ready (2026-03-22)
**Phase 2 — The Scoreboard**

OG tags, email reminders, Mermaid whiteboard editor, OpenAI-compatible LLM adapter, `LLM_STREAM` toggle, error recovery, expired session handling.

---

## Sprint 007 — Phase 2 Scoreboard (2026-03-20)

Leaderboard (monthly/all-time), badge system (10 badges, 2 prestige), weak areas dashboard, practice patterns.

---

## Sprint 006 — Phase 1 Social (2026-03-18)

Public profiles, invitation system, share cards (satori PNG generation), badge definitions.

---

## Sprint 005 — Hardening + Phase 1 (2026-03-16)

CSP headers, 404 page, invitation flow, admin edit exercise, Resend email integration, request access form.

---

## Sprint 004 — Polish & Branding (2026-03-14)

Logo (torii gate mark), favicon, OG image, landing page visual polish, results permalink, dashboard stats.

---

## Sprint 003 — Production Deploy (2026-03-12)

First production deploy (Hetzner + Cloudflare Tunnel), landing page, UX error states, bearer token auth.

---

## Sprint 002 — Core Loop (2026-03-10)

HTTP routes, WebSocket evaluation streaming, Anthropic adapter, 16 seed kata, 8 frontend screens, admin UI.

---

## Sprint 001 — Technical Foundation (2026-03-08)

Monorepo (Turborepo), DDD scaffold (bounded contexts, ports, adapters), PostgreSQL + Drizzle, GitHub OAuth, CI pipeline, shared package.
