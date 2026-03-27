# Sprint 014 — Courses MVP

**Started:** 2026-03-27
**Phase:** Phase 1 Alpha

**Expected outcome:** One playable course ("TypeScript Fundamentals") live at `/learn`. Anonymous users can browse, code, and run tests. Authenticated users get persistent progress. The anonymous experience has something valuable beyond the landing page.

**Strategy:** Backend first (repos → use cases → routes → seed), then frontend (catalog → player → progress).

---

## Part 1 — Shared Schemas

- [x] `packages/shared/src/schemas.ts` — executeStepSchema, trackProgressSchema, courseSlugSchema, courseDTOSchema, stepDTOSchema, lessonDTOSchema
- [x] `packages/shared/src/types.ts` — CourseDTO, CourseDetailDTO, LessonDTO, StepDTO, ExecuteStepRequest/Response, CourseProgressDTO
- [x] Export from shared package barrel

---

## Part 2 — Repository Adapters

- [x] `PostgresCourseRepository` — findAllPublished(), findBySlug() with lesson/step joins
- [x] `PostgresCourseProgressRepository` — findByUserAndCourse(), save() with upsert
- [x] Registered in container.ts

---

## Part 3 — Application Use Cases

- [x] `GetCourseList` — returns CourseSummary[] (no step content)
- [x] `GetCourseBySlug` — returns full Course or null
- [x] `ExecuteStep` — delegates to CodeExecutionPort, structured result with test parsing
- [x] `TrackProgress` — append step to completedSteps, idempotent
- [x] `GetCourseProgress` — returns completedSteps for user+course

---

## Part 4 — Route Handlers

- [x] `GET /learn/courses` — list published courses
- [x] `GET /learn/courses/:slug` — full course with lessons/steps
- [x] `POST /learn/execute` — run code via Piston (rate limited)
- [x] `POST /learn/progress` — save step completion (auth required)
- [x] `GET /learn/progress/:courseId` — get progress (auth required)
- [x] Zod validation on all inputs

---

## Part 5 — Seed Data

- [x] "TypeScript Fundamentals" course — 3 lessons, 9 steps
- [x] Lesson 1: Variables & Types (explanation + 2 exercises: greet, add)
- [x] Lesson 2: Arrays & Objects (explanation + 2 exercises: sum, getFullName)
- [x] Lesson 3: Control Flow (explanation + exercise + challenge: fizzBuzz, isPalindrome)
- [x] Seed script: `pnpm --filter=api db:seed:courses`

---

## Part 6 — Backend Tests

- [x] GetCourseList — published only, summary counts
- [x] GetCourseBySlug — found and not-found
- [x] ExecuteStep — pass, fail, timeout scenarios
- [x] TrackProgress — create, append, idempotent
- [x] 10 new tests, 72 total across 19 files

---

## Part 7 — Frontend: Course Catalog

- [x] `/learn` page — grid of course cards
- [x] Course card: title, description, language badge, lesson count, accent color
- [x] Empty state
- [x] Route registered as public (no auth), lazy loaded

---

## Part 8 — Frontend: Course Player

- [x] `/learn/:slug` page — sidebar + main content area
- [x] LessonNav — collapsible sidebar with lesson/step navigation
- [x] StepContent — markdown instruction renderer
- [x] StepEditor — CodeMirror + "Run" button + test results panel
- [x] Auto-advance on all tests passing
- [x] Completed steps show checkmark in sidebar

---

## Part 9 — Progress Tracking

- [x] localStorage: `dojo_course_progress_{courseId}` → string[] of step IDs
- [x] Authenticated: POST /learn/progress on step completion
- [x] On page load (auth): merge localStorage ∪ server progress

---

## Part 10 — Navigation

- [x] "Learn" link in Sidebar (authenticated AppShell) with graduation cap icon
- [x] "Learn" link in BottomNav (mobile)
- [ ] Landing page "Try a free course" CTA → `/learn` — deferred (needs design review)

---

## Post-ship fixes (2026-03-27)

Caught during devcontainer verification after merge:

- [x] testCode replaced vitest imports with self-contained TS runner (vitest not available in Piston sandbox)
- [x] PistonAdapter: combine solution + testCode into single file (two-file mode loses stdout in Piston's TS runtime)
- [x] PistonAdapter: use `config.PISTON_RUN_TIMEOUT` (3s) instead of hardcoded 30s — Piston rejects anything above its per-runtime limit
- [x] ExecuteStep: case-insensitive error fallback in parseTestOutput; split `✗ name: message` for better UI display
- [x] devcontainer: `cgroup: host` + `mkdir -p` entrypoint so Piston survives container restarts
- [x] seed upsert changed to `onConflictDoUpdate` so re-seeds update testCode

---

## Verification

1. [x] Typecheck passes (`pnpm typecheck`)
2. [x] Lint passes (`pnpm lint`)
3. [x] All tests pass: 72/72 across 19 files
4. [x] Anonymous user can browse `/learn` and see course catalog
5. [x] Anonymous user can open a course and complete a step
6. [x] Code execution works via Piston (end-to-end verified in devcontainer)
7. [x] Progress persists in localStorage (anonymous)
8. [x] Authenticated user progress persists server-side

---

## Carry-forward to Sprint 015

- Piston production verification (Kamal deploy) — from Sprint 013
- Dashboard EXPLAIN ANALYZE on production — from Sprint 013
- Rate limiter integration test (11th anon execution → 429) — from Sprint 013
- Landing page "Try a free course" CTA → `/learn`
