# PRD-019: Sprint 014 — Courses MVP

> **Status:** advancing to spec
> **Date:** 2026-03-27
> **Author:** Lucía Navarro (S4), with input from Priya Menon (C1), Darius Osei (C2), Tomás Ríos (C3), Marta Kowalczyk (C5)

---

## Idea in one sentence

Ship the first playable course: a public, step-by-step learning path where anyone can write and run code — no login required.

---

## Why now

Sprint 013 landed the entire foundation: ADR 015 (Learning bounded context), 4 DB tables with indexes, domain skeleton (Course/Lesson/Step/ports), public `/learn/*` routes, and anonymous rate limiting. The schema is migrated, the domain types exist, and the route stubs return empty responses. Everything is wired — Sprint 014 just needs to fill in the implementation and seed one course to prove the loop works.

Additionally:
- Courses are the **growth lever** for Phase 1 Alpha — they give non-invited visitors a reason to engage with the product before requesting access.
- Piston code execution is already integrated from Sprint 011 — courses reuse `CodeExecutionPort` as-is.
- The anonymous experience is the weakest part of the product today — visitors see a landing page and nothing else.

---

## Perspectives

### As a developer visiting the dojo

I land on the site, not yet invited. Today I see a landing page and a "request access" form. With courses, I can click "Learn" and immediately start a guided coding path. I write code, run it, see test results, and progress through steps. If I create an account later, my progress follows me. This is my first taste of the dojo — it should feel sharp and rewarding.

### As the dojo administrator

I need a way to author courses — but for the MVP, seed data is enough. I don't need an admin UI for courses yet. What I need is:
- A clear content format (JSON/seed script) that I can hand-edit
- The ability to publish/unpublish a course
- Visibility into anonymous usage (basic: how many people start/complete steps)

### As the product

Courses are **not katas**. ADR 015 is explicit: no timer, no sensei, no verdict. Steps are pass/fail via Piston only. This is a separate experience with a separate UX. It advances the product by giving the public funnel something valuable, without diluting the kata practice for invited users.

---

## Tensions

| Tension | Resolution |
|---|---|
| Anonymous progress tracking vs. no-auth simplicity | localStorage on frontend for anonymous users. No DB writes until authenticated. If user signs up, sync localStorage → DB. |
| Course authoring UX vs. MVP speed | Seed script only for MVP. Admin UI for courses is Sprint 015+ material. |
| Piston abuse from anonymous users | Already handled — executionLimiter (10/min per IP) from Sprint 013. |
| Courses vs. kata quality bar | ADR 015 separates these contexts. Courses don't touch sensei, evaluation, or verdicts. |

---

## Scope — What's in Sprint 014

### Backend (API)

1. **Repository adapters** — `PostgresCourseRepository` (findBySlug, findAllPublished) and `PostgresCourseProgressRepository` (findByUserAndCourse, save)
2. **Application use cases** — `GetCourseList`, `GetCourseBySlug`, `ExecuteStep`, `TrackProgress`
3. **Route handlers** — Replace learn.ts stubs with real implementations:
   - `GET /learn/courses` — list published courses
   - `GET /learn/courses/:slug` — full course with lessons and steps
   - `POST /learn/execute` — run code against step's testCode via Piston
   - `POST /learn/progress` — save step completion (auth optional)
   - `GET /learn/progress/:courseId` — get user's progress (auth optional, returns empty for anon)
4. **Seed data** — One complete course: "TypeScript Fundamentals" (3 lessons, ~9 steps), hand-crafted with testCode for each exercise step
5. **Validation** — Zod schemas for all route inputs

### Frontend (Web)

6. **Course catalog page** (`/learn`) — Grid of published courses with title, description, language badge, lesson count
7. **Course player page** (`/learn/:slug`) — Sidebar with lesson/step nav, main area with instruction + CodeMirror editor + run button + test results panel
8. **Progress tracking** — localStorage for anonymous, API sync when authenticated
9. **Navigation** — "Learn" link in navbar/sidebar, accessible without auth

### Carry-forward from Sprint 013

10. **Piston production verification** (Part 0) — verify on next deploy
11. **Performance verification** (Part 5) — EXPLAIN ANALYZE on dashboard queries

---

## What's NOT in Sprint 014

- Admin UI for creating/editing courses (seed script only)
- Course progress analytics/dashboard
- Hints system (Step.hint field exists but UI deferred)
- Course completion certificates or badges
- Multiple languages per course (one language per course for now)

---

## Options

### Option A: Full vertical slice — one course end-to-end

Ship one complete course with all infrastructure (repo, use cases, routes, frontend pages, seed data). Proves the entire loop works. Defers admin UI and multi-course concerns.

**Pros:** Fast, focused, immediately testable. Validates the architecture.
**Cons:** Only one course available at launch.
**Complexity:** Medium — ~5-7 parts across backend + frontend.

### Option B: Backend only — routes + seed, frontend in Sprint 015

Ship the API layer and seed data but defer the frontend course player.

**Pros:** Faster backend delivery.
**Cons:** No user value until frontend lands. Can't validate the UX loop.
**Complexity:** Low, but defers the payoff.

### Option C: Full courses system with admin UI

Ship courses + admin CRUD + course authoring.

**Pros:** Complete system.
**Cons:** Too large for one sprint. Admin UI is premature — there's only one admin.
**Complexity:** High — would likely take 2 sprints.

---

## Provisional conclusion

**Option A.** One course, full vertical slice. The admin UI is unnecessary when the admin can edit a seed file. The value is in the public-facing experience, not the authoring tools.

---

## Expert panel notes

**Priya Menon (C1):** Option A is correct scope. One course is enough to validate whether anonymous visitors engage. Don't build the course factory before proving courses matter.

**Darius Osei (C2):** Repository implementations should follow the existing pattern (DrizzleCourseRepository). Use cases should be thin — GetCourseBySlug is essentially a repository call with a not-found check. ExecuteStep reuses CodeExecutionPort.

**Tomás Ríos (C3):** The execute endpoint should return structured results (pass/fail per test case) matching Piston's output format. Consider a 30-second timeout per execution to prevent abuse.

**Marta Kowalczyk (C5):** Anonymous progress via localStorage is fine for MVP. The sync-on-auth path needs careful handling — merge, don't overwrite. Rate limiting is already in place.

**Recommended option:** A — full vertical slice, one seeded course.
**Key risks:** Piston availability in production (still pending verification from Sprint 013).
**Fallback:** If Piston is not ready, ship the course content as read-only (explanation steps only, no exercises) and add execution when Piston is verified.

---

## Next step

- [x] Convert to spec: `docs/specs/020-courses-mvp.md`
