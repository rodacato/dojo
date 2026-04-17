# Changelog

All notable changes to this project are documented here. First-person decision voice — not feature announcements.

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
