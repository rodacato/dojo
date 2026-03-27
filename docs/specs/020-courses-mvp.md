# Spec 020: Courses MVP — Full Vertical Slice

> **Status:** ready-to-implement
> **Depends on:** ADR 015 (courses bounded context), Spec 009 (HTTP routes), migration 0011
> **Implements:** PRD-019 (Sprint 014 planning)

---

## Overview

Implement the first playable course end-to-end: repository adapters, application use cases, route handlers, seed data, and frontend course player. Anonymous users can browse, code, and run tests. Authenticated users get persistent progress.

---

## 1. Repository adapters

### PostgresCourseRepository

**File:** `apps/api/src/infrastructure/persistence/PostgresCourseRepository.ts`

Implements `CourseRepositoryPort` from `domain/learning/ports.ts`.

```typescript
class PostgresCourseRepository implements CourseRepositoryPort {
  constructor(private readonly db: DrizzleDB) {}

  async findAllPublished(): Promise<Course[]>
  // Query: courses WHERE status = 'published' JOIN lessons JOIN steps, ordered by lesson.order, step.order

  async findBySlug(slug: string): Promise<Course | null>
  // Query: courses WHERE slug = ? JOIN lessons JOIN steps, ordered
}
```

Mapping: Drizzle rows → domain `Course` aggregate with nested `Lesson[]` → `Step[]`. Use a single query with joins, group in application code.

### PostgresCourseProgressRepository

**File:** `apps/api/src/infrastructure/persistence/PostgresCourseProgressRepository.ts`

Implements `CourseProgressPort`.

```typescript
class PostgresCourseProgressRepository implements CourseProgressPort {
  constructor(private readonly db: DrizzleDB) {}

  async findByUserAndCourse(userId: string, courseId: string): Promise<CourseProgress | null>
  // Query: course_progress WHERE user_id = ? AND course_id = ?

  async save(progress: CourseProgress): Promise<void>
  // Upsert: INSERT ... ON CONFLICT (user_id, course_id) DO UPDATE
}
```

---

## 2. Application use cases

**Directory:** `apps/api/src/application/learning/`

### GetCourseList

```typescript
class GetCourseList {
  constructor(private deps: { courseRepo: CourseRepositoryPort }) {}
  async execute(): Promise<CourseSummary[]>
  // Returns courses without full step content — id, slug, title, description, language, accentColor, lessonCount, stepCount
}
```

### GetCourseBySlug

```typescript
class GetCourseBySlug {
  constructor(private deps: { courseRepo: CourseRepositoryPort }) {}
  async execute(slug: string): Promise<Course | null>
  // Full course with lessons and steps
}
```

### ExecuteStep

```typescript
class ExecuteStep {
  constructor(private deps: { executionPort: CodeExecutionPort }) {}
  async execute(params: { code: string; testCode: string; language: string }): Promise<ExecutionResult>
  // Delegates to CodeExecutionPort (Piston). Returns { passed: boolean, output: string, testResults: TestResult[] }
}
```

Reuse `CodeExecutionPort` from the Practice context — same adapter, same Piston instance.

### TrackProgress

```typescript
class TrackProgress {
  constructor(private deps: { progressRepo: CourseProgressPort }) {}
  async execute(params: { userId: string; courseId: string; stepId: string }): Promise<void>
  // Load existing progress, append stepId to completedSteps if not present, save
}
```

---

## 3. Route handlers

**File:** `apps/api/src/infrastructure/http/routes/learn.ts` (replace stubs)

All routes are public — no auth middleware. Auth is optional for progress endpoints.

### GET /learn/courses

```
Response 200: { courses: CourseSummary[] }
```

No query params for MVP. Returns all published courses.

### GET /learn/courses/:slug

```
Response 200: { course: Course }
Response 404: { error: 'Course not found' }
```

Returns full course with lessons and steps. Zod validation on slug param (string, min 1).

### POST /learn/execute

```
Body: { code: string, testCode: string, language: string }
Response 200: { passed: boolean, output: string, testResults: { name: string, passed: boolean, message?: string }[] }
Response 429: rate limited
```

Rate limited by `executionLimiter` (already applied). Zod validation on body. Timeout: 30 seconds per execution.

### POST /learn/progress

```
Body: { courseId: string, stepId: string }
Response 200: { ok: true }
Response 401: (anonymous — client should use localStorage instead)
```

Requires auth. Anonymous progress is localStorage-only on frontend.

### GET /learn/progress/:courseId

```
Response 200: { completedSteps: string[] }
Response 401: (anonymous — client should use localStorage instead)
```

Requires auth.

---

## 4. Zod schemas

**File:** `packages/shared/src/schemas/learn.ts`

```typescript
export const executeStepSchema = z.object({
  code: z.string().min(1).max(50_000),
  testCode: z.string().min(1).max(50_000),
  language: z.string().min(1).max(30),
})

export const trackProgressSchema = z.object({
  courseId: z.string().uuid(),
  stepId: z.string().uuid(),
})

export const courseSlugSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
})
```

---

## 5. Seed data — "TypeScript Fundamentals" course

**File:** `apps/api/src/infrastructure/persistence/seeds/courses.ts`

One course with 3 lessons, ~9 steps total:

### Lesson 1: Variables & Types (3 steps)
1. **Explanation** — TypeScript type annotations, `let` vs `const`, basic types
2. **Exercise** — Write a function `greet(name: string): string` that returns a greeting
3. **Exercise** — Write a function `add(a: number, b: number): number`

### Lesson 2: Arrays & Objects (3 steps)
1. **Explanation** — Array methods, object types, interfaces
2. **Exercise** — Write `sum(numbers: number[]): number`
3. **Exercise** — Write `getFullName(person: { first: string; last: string }): string`

### Lesson 3: Control Flow (3 steps)
1. **Explanation** — `if/else`, ternary, `switch`, early returns
2. **Exercise** — Write `fizzBuzz(n: number): string`
3. **Challenge** — Write `isPalindrome(s: string): boolean`

Each exercise step includes `testCode` with 5+ test cases in the same format used by Piston in the kata context.

Seed script: `pnpm db:seed:courses` or included in existing seed pipeline.

---

## 6. Frontend — Course catalog page

**File:** `apps/web/src/pages/LearnPage.tsx`
**Route:** `/learn`

- Grid layout: cards with course title, description, language badge, lesson count, accent color border
- No auth required — accessible from navbar
- Links to `/learn/:slug`
- Empty state if no courses published

---

## 7. Frontend — Course player page

**File:** `apps/web/src/pages/CoursePlayerPage.tsx`
**Route:** `/learn/:slug`

### Layout
- **Left sidebar (collapsible):** Lesson list → Step list. Current step highlighted. Completed steps show checkmark.
- **Main area:**
  - Step instruction (markdown rendered)
  - For exercise/challenge steps: CodeMirror editor with starter code + "Run" button
  - Test results panel below editor: pass/fail per test case with output

### Behavior
- "Run" button calls `POST /learn/execute` with user code + step's testCode
- On all tests passing: step marked as complete, auto-advance to next step
- Progress stored in localStorage: `dojo_course_progress_{courseId}` → `string[]` of completed step IDs
- If authenticated: also POST to `/learn/progress` to persist server-side
- On page load (authenticated): merge localStorage progress with server progress (union)

### Components
- `CoursePlayer` — main layout orchestrator
- `LessonNav` — sidebar navigation
- `StepContent` — instruction renderer
- `StepEditor` — CodeMirror + run button + results
- `TestResults` — pass/fail display per test case

---

## 8. Navigation

- Add "Learn" link to navbar (visible to all, including unauthenticated)
- Add "Learn" link to sidebar nav (for authenticated users in AppShell)
- Landing page: add "Try a free course" CTA linking to `/learn`

---

## 9. Tests

### Backend unit tests
- `GetCourseList` — returns published courses only
- `GetCourseBySlug` — returns course or null
- `ExecuteStep` — delegates to CodeExecutionPort, returns structured result
- `TrackProgress` — appends step, idempotent on duplicate
- `PostgresCourseRepository` — maps Drizzle rows to domain aggregate (if integration tests available)

### Route tests
- `GET /learn/courses` — 200 with courses array
- `GET /learn/courses/:slug` — 200 with course, 404 for unknown
- `POST /learn/execute` — 200 with results, 422 on invalid body
- `POST /learn/progress` — 401 when unauthenticated, 200 when authenticated

---

## 10. Carry-forward items

- Piston production verification (Sprint 013 Part 0)
- Dashboard performance verification (Sprint 013 Part 5)
- Rate limiter integration test (Sprint 013 Part 7)

---

## Implementation order

| Part | Description | Depends on |
|---|---|---|
| 1 | Zod schemas in shared package | — |
| 2 | Repository adapters | — |
| 3 | Application use cases | Part 2 |
| 4 | Route handlers (replace stubs) | Parts 1-3 |
| 5 | Seed data | Part 2 |
| 6 | Backend tests | Parts 2-4 |
| 7 | Frontend catalog page | Part 4 |
| 8 | Frontend course player | Part 4 |
| 9 | Progress sync (localStorage + API) | Part 8 |
| 10 | Navigation updates | Parts 7-8 |
