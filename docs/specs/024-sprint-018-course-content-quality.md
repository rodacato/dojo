# Spec 024: Sprint 018 — Course content quality v1

> **Status:** ready-to-implement
> **Depends on:** PRD 022, Spec 023 (Sprint 017), `docs/courses/README.md` (curriculum framework)
> **Sprint:** 018

---

## Overview

Four parts in execution order:

1. **Schema, taxonomy, layout** — migration 0014, DTO, sidebar/H1 wiring
2. **Reclassify + content audit** — 27 step rows updated, per-curso fixes
3. **Solution reveal + CI quality gate** — UI panel + harness validation script
4. **Semantic slot renderer** *(only if budget allows)*

Each part is one or two commits. Part 1 is mechanical; Part 2 is editorial; Part 3 is wiring + tooling; Part 4 is render polish.

---

## Part 1 — Schema, taxonomy, layout

### 1.1 Migration 0014

**File:** `apps/api/src/infrastructure/persistence/drizzle/migrations/0014_step_title_solution_exercise.sql`

```sql
ALTER TABLE "steps" ADD COLUMN "title" TEXT;
ALTER TABLE "steps" ADD COLUMN "solution" TEXT;

-- type already exists as varchar(20). The check enforcing the enum lives
-- only at the application layer (Zod + TS union); no DB-level constraint
-- needs updating. We just start using the new value.
```

Rollback path: drop the two new columns. The `'exercise'` value is forward-compatible (varchar accepts it without a CHECK).

### 1.2 Schema update

**File:** `apps/api/src/infrastructure/persistence/drizzle/schema.ts`

```typescript
export const steps = pgTable('steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id),
  order: integer('order').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('exercise'),
  title: text('title'),               // NEW
  instruction: text('instruction').notNull(),
  starterCode: text('starter_code'),
  testCode: text('test_code'),
  hint: text('hint'),
  solution: text('solution'),         // NEW
})
```

Change the default from `'challenge'` (set in Sprint 017 migration 0013) to `'exercise'` — the new sane default.

### 1.3 StepType + DTO

**File:** `apps/api/src/domain/learning/values.ts`

```typescript
export type StepType = 'read' | 'code' | 'exercise' | 'challenge'
```

**File:** `packages/shared/src/types.ts`

```typescript
export type StepType = 'read' | 'code' | 'exercise' | 'challenge'

export interface StepDTO {
  id: string
  order: number
  type: StepType
  title: string | null      // NEW
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
  // solution is intentionally NOT in StepDTO returned to learners.
  // It is only included in the admin DTO and revealed post-pass via a
  // dedicated endpoint (see Part 3).
}
```

**File:** `packages/shared/src/schemas.ts`

```typescript
export const stepTypeSchema = z.enum(['read', 'code', 'exercise', 'challenge'])

export const stepDTOSchema = z.object({
  id: z.string().uuid(),
  order: z.number().int(),
  type: stepTypeSchema,
  title: z.string().nullable(),    // NEW
  instruction: z.string(),
  starterCode: z.string().nullable(),
  testCode: z.string().nullable(),
  hint: z.string().nullable(),
})
```

### 1.4 Course routes — surface title, hide solution

**File:** `apps/api/src/infrastructure/http/routes/learn.ts`

In the `GET /learn/courses/:slug` handler that maps each step, include `title`:

```typescript
steps: l.steps.map((s) => ({
  id: s.id,
  order: s.order,
  type: s.type,
  title: s.title ?? null,
  instruction: s.instruction,
  starterCode: s.starterCode,
  testCode: s.testCode,
  hint: s.hint,
})),
```

Solution is **never** returned by `/learn/courses/:slug`. It comes through a dedicated endpoint (Part 3.2).

### 1.5 Admin route — surface both

`GET /admin/courses` already returns aggregated counts. Extend `GET /admin/courses/:id` (new) or extend the existing list response to include per-step `title`/`solution` for editing flows. Out of scope for Sprint 018; admin keeps using the seed-managed flow.

### 1.6 Frontend — drop the regex, use `step.title`

**File:** `apps/web/src/pages/CoursePlayerPage.tsx`

`extractStepTitle` becomes:

```typescript
function extractStepTitle(step: StepDTO): string {
  if (step.title) return step.title
  // Legacy fallback while seed migration is in flight
  const match = step.instruction.match(/^#\s+(.+)$/m)
  if (match?.[1]) {
    return match[1].replace(/^(exercise|challenge|read):\s*/i, '').trim()
  }
  return step.type === 'read' ? 'Read' : `Step ${step.order}`
}
```

After backfill ships and we confirm no nulls in production, the legacy branch can be removed (Sprint 019).

`stripLeadingH1` keeps working — once `step.title` is everywhere, the H1 in the markdown body is redundant and authors can drop it. Fallback unchanged.

### 1.7 Sidebar icon distinction

In the `LessonNav` `step.type` check:

```typescript
const ICON: Record<StepType, string> = {
  read: '📖',
  code: '💻',
  exercise: '📝',
  challenge: '⚡',
}
// ...
{isComplete ? '✓' : ICON[step.type] ?? '💻'}
```

---

## Part 2 — Reclassify + content audit

### 2.1 Backfill `step.title` from existing instruction

For every step in `seed-courses.ts` and `seed-courses-sql-deep-cuts.ts`, add a `title:` field next to `instruction:` and:

- For `read` steps: take the H1 verbatim
- For exercise/challenge steps: take the H1 stripped of the `Exercise:` / `Challenge:` prefix

Then, in the same edit, drop the leading `# Heading\n\n` from the `instruction` body — `step.title` and the StepEditor H1 cover it.

Example diff (TS L1.2):

```diff
+    title: 'Write a greet function',
     instruction: `# Exercise: Write a greet function
-
-Write a function ...
+Write a function ...
```

→

```diff
+    title: 'Write a greet function',
     instruction: `Write a function ...`,
```

### 2.2 Reclassify `type`

Default rule: every `'challenge'` becomes `'exercise'`. Explicit kept as `challenge`:

| Curso | Step | Razón |
|---|---|---|
| TS Fundamentals | L3.3 Palindrome checker | Multiple concepts (regex, normalization, two-pointer) |
| JS DOM Fundamentals | L3.3 Fix the event delegation bug | Bug-find + fix, no scaffold |
| SQL Deep Cuts | L3.3 Slow churn report rewrite | Multi-CTE refactor over a 8-line query |

Plus a **new challenge** added in 2.3 below for TS.

### 2.3 Per-course fixes

#### SQL Deep Cuts (least broken — first)

**L2.2 "Refactor nested subqueries"** — split the input. Current input has 12 lines. Reduce to 6 by removing the outer `WHERE rnk = 1` wrap and asking the learner to add the rank subquery themselves. The existing testCode already supports this — the assertion is shape-based, not literal.

**L1.4 (NEW, optional, only if Part 4 doesn't ship):** Add a small `LAG`/`LEAD` exercise between L1.3 (running totals) and L2.1 (CTEs explanation). Title: "Compare each row to the previous". Window function intro to `LAG(amount, 1) OVER (ORDER BY month)`. Only ship if total step count stays under 15 per the framework's §4.2 sizing.

#### JS DOM Fundamentals

**L1.1 explanation:** Insert one paragraph after the `querySelector` intro:

```markdown
You'll also see `getElementById('foo')` in the wild. It's slightly faster
and was the canonical way before `querySelector` existed. Today,
`querySelector('#foo')` is preferred for consistency — one mental model
covers ID, class, attribute, and complex selectors.
```

**L3.3 challenge hint:** Replace the current hint that hands `e.target.closest("li")`. New hint:

```markdown
The click can land on a child element of the `<li>` (a `<strong>`, an
icon, anything). What does that make `e.target`? Look at the DOM tree
above the click and find the right ancestor.
```

#### TS Fundamentals (most broken — last)

**L1 — split template literals:** Insert a new explanation step `1.2` between current 1.1 (Variables) and current 1.2 (greet). Title: "Template literals". Body explains backtick syntax + interpolation with one runnable example. Renumber subsequent steps. Existing `greet` exercise becomes 1.3.

**L3.3 — bump Palindrome to challenge** *(already in 2.2)*.

**L3.4 (NEW challenge):** Add a final challenge to L3 to satisfy the "every sub-course needs ≥1 challenge" rule of §4.3. Proposed: **"Implement debounce"** — given a function and a wait time, return a debounced version. Tests assert leading-call behavior, trailing-call behavior, and reset on intermediate calls.

```typescript
title: 'Implement debounce',
type: 'challenge',
instruction: `Write \`debounce<T>(fn: (...args: any[]) => T, waitMs: number)\`
that returns a function which delays invoking \`fn\` until \`waitMs\` ms
have passed since the last call.

Use \`setTimeout\` and \`clearTimeout\`. Don't import any libraries.`,
starterCode: `function debounce<T>(fn: (...args: unknown[]) => T, waitMs: number) {
  // Your code here
}`,
testCode: TS_HARNESS_HEADER + tests + TS_HARNESS_FOOTER,
hint: 'Each call should clear the previous pending timer and start a new one.',
solution: `function debounce<T>(fn: (...args: unknown[]) => T, waitMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: unknown[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { fn(...args) }, waitMs)
  }
}`,
```

Test approach: use a counter + `setTimeout`/`Promise` to verify call collapsing. The harness can `await` because the runner already supports async tests in TS.

### 2.4 Fill `solution` for the 18 non-read steps

Each exercise/challenge step gets `solution:` populated. Solution must be:
- Runnable (passes its own `testCode` — see Part 3.3 CI)
- Idiomatic (no clever one-liners; the kind of code we'd accept in review)
- Same signature as `starterCode`

Reviewer checklist before commit:
- [ ] `solution` compiles
- [ ] `solution` passes `testCode`
- [ ] `solution` follows naming conventions established in `instruction`

---

## Part 3 — Solution reveal + quality CI

### 3.1 Backend — endpoint to fetch solution after pass

**File:** `apps/api/src/infrastructure/http/routes/learn.ts`

```typescript
// GET /learn/courses/:slug/steps/:stepId/solution
// Requires the caller to have completed this step (user or anon).
learnRoutes.get('/learn/courses/:slug/steps/:stepId/solution', optionalAuth, async (c) => {
  const slug = c.req.param('slug')
  const stepId = c.req.param('stepId')
  const anonId = c.req.query('anonymousSessionId')

  const course = await useCases.getCourseBySlug.execute(slug)
  if (!course) return c.json({ error: 'Course not found' }, 404)

  const user = c.get('user')
  if (!course.isPublic && !user) {
    return c.json({ error: 'Course not found' }, 404)
  }

  // Authorization: caller must have this step in their completedSteps
  const owner = await resolveProgressOwner(user?.id ?? null, anonId, course.id)
  if ('error' in owner) return c.json({ error: owner.error }, owner.status)

  const completed = await useCases.getCourseProgress.execute(owner, course.id)
  if (!completed.includes(stepId)) {
    return c.json({ error: 'Solution available after passing this step' }, 403)
  }

  // Direct DB read (avoid a new use case for a one-line fetch)
  const step = await db.query.steps.findFirst({ where: eq(steps.id, stepId) })
  if (!step) return c.json({ error: 'Step not found' }, 404)

  return c.json({ solution: step.solution ?? null })
})
```

Returns `403` if the learner hasn't passed yet; **never** the solution itself.

### 3.2 Frontend — revealable panel

In `CoursePlayerPage` `StepEditor`:

- After a successful `result.passed`, fetch the solution lazily (don't pre-load on every step)
- Render a third `<TabButton>` next to **Output**: "Solution"
- The tab is disabled until `isCompleted`, with tooltip: "Pass the step to see the reference solution"
- Body of the Solution tab: code block with the `step.solution` content + a one-liner above: "One way to write this. Yours might be different and that's fine."

```typescript
type OutputTab = 'tests' | 'output' | 'solution'

const [solutionCode, setSolutionCode] = useState<string | null>(null)

useEffect(() => {
  if (!isCompleted || tab !== 'solution' || solutionCode !== null) return
  api.getStepSolution(courseSlug, step.id, anonId).then((r) => {
    setSolutionCode(r.solution ?? '')
  }).catch(() => setSolutionCode(''))
}, [isCompleted, tab, solutionCode, step.id])
```

### 3.3 CI quality gate

**File:** `apps/api/src/scripts/validate-course-solutions.ts` (new)

```typescript
// Iterate over every seeded step that has both testCode and solution.
// Run the ExecuteStep use case with `code = solution`. Assert passed===true.
// Exits non-zero on any failure with a per-step report.
//
// Driver: MockExecutionAdapter is not enough — it doesn't actually run code.
// Use PistonAdapter when reachable; skip with a warning when not.

import { allCourseSeeds } from './load-course-seeds'
import { ExecuteStep } from '../application/learning/ExecuteStep'
import { PistonAdapter } from '../infrastructure/execution/PistonAdapter'
import { config } from '../config'

async function main() {
  const adapter = new PistonAdapter()
  const useCase = new ExecuteStep({ executionPort: adapter })

  let failures = 0
  for (const step of allCourseSeeds()) {
    if (!step.solution || !step.testCode) continue
    const result = await useCase.execute({
      code: step.solution,
      testCode: step.testCode,
      language: step.courseLanguage,
    })
    if (!result.passed) {
      failures++
      console.error(`FAIL: ${step.courseSlug} / ${step.title}`)
      console.error(result.errorMessage ?? result.output.slice(0, 400))
    } else {
      console.log(`OK:   ${step.courseSlug} / ${step.title}`)
    }
  }
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
```

`pnpm --filter=@dojo/api run validate:courses` invokes this. Not part of `pnpm test` (requires Piston up), but added to a docs section as a pre-deploy checklist item.

`allCourseSeeds()` is a small helper that imports the seed modules and walks them — already structured friendly thanks to Sprint 017's `seedAllCourses` refactor.

---

## Part 4 — Semantic slots renderer (only if budget allows)

**File:** `apps/web/src/pages/CoursePlayerPage.tsx` `MarkdownContent`

Detect the literal headings `## Why this matters`, `## Your task`, `## Examples`, `## Edge cases` and render the body of each as a distinct card:

```typescript
const SLOT_HEADINGS = ['Why this matters', 'Your task', 'Examples', 'Edge cases']

function renderSlots(md: string): { slot: string; body: string }[] | null {
  // Returns array of {slot, body} when the markdown opens with a slot heading,
  // null otherwise (caller falls back to the existing renderer).
}
```

Cards use the same color palette as the rest of the StepEditor (accent for "Why this matters", neutral for "Your task", muted for "Examples"). When `renderSlots` returns null, fall back to the current `MarkdownContent`.

This is purely additive. **Authors do NOT have to migrate** — existing instructions render unchanged.

---

## Verification checklist

### Tests
- [ ] Unit: `extractStepTitle` returns `step.title` when present, regex when not, ordinal when neither
- [ ] Integration: `GET /learn/courses/:slug/steps/:stepId/solution` returns 403 before pass, 200 after
- [ ] CI: `validate:courses` passes for every step with a `solution`

### Manual
- [ ] All 27 steps have `step.title` populated after re-seed
- [ ] Sidebar shows `📝` for exercise, `⚡` for challenge, `📖` for read
- [ ] After passing TS L1.3 (greet), the "Solution" tab unlocks and shows the reference
- [ ] TS Fundamentals L3 has a real challenge at the end (debounce or equivalent)
- [ ] JS DOM L1.1 mentions `getElementById`
- [ ] SQL Deep Cuts L2.2 starter input is shorter

### Obligatorios
- [ ] Migration 0014 corre en DB fresh y existing
- [ ] `pnpm typecheck` ✓
- [ ] `pnpm lint` ✓
- [ ] `pnpm test --filter=@dojo/api` ✓ (101+ tests)
- [ ] `pnpm test --filter=@dojo/e2e` ✓ (10 tests)
- [ ] CHANGELOG.md / ROADMAP.md actualizados
- [ ] Re-seed local de los 3 cursos sin error

---

## Rollback

If Part 2 reveals a content bug after seed (e.g. the new debounce challenge has a flaky test):
- Revert just the affected step's seed entry
- `wipe` el course en `/admin/courses`
- Re-seed → curso vuelve a estado conocido

If migration 0014 falla en prod:
- DROP COLUMN title, DROP COLUMN solution
- Code keeps working — `step.title` and `step.solution` are nullable in the DTO

---

## Notes

- **Part 4 is genuinely optional.** Cut without ceremony if Part 1+2+3 take longer than estimated. Slots renderer is polish; the schema fix is the value.
- **No changes to admin layout this sprint** — admin courses page stays as Sprint 017 shipped it. Editing course content from admin (vs seed-rerun) is its own sprint.
- **No new tests for the harness output** — Sprint 017 already ships 4 ExecuteStep tests covering the structured-result path. Just confirm they still pass after the StepDTO change.
