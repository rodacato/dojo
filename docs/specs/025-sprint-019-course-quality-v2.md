# Spec 025: Sprint 019 — Course content quality v2 (pedagogy)

> **Status:** ready-to-implement
> **Depends on:** PRD 023, Spec 024 (Sprint 018), `docs/courses/README.md` (curriculum framework)
> **Sprint:** 019

---

## Overview

Four parts in execution order:

1. **Semantic slots renderer** — detect `## Why this matters` / `## Your task` / `## Examples` / `## Edge cases` and render each as a card. Additive, no migration.
2. **External references per course** — migration 0015 (`courses.external_references`), DTO, "Further reading" section.
3. **Alternative approach post-pass** — migration 0015 (same; `steps.alternative_approach`), endpoint extension, Solution tab collapsible.
4. **SQL L1.4 LAG/LEAD intro** — content-only step added to `seed-courses-sql-deep-cuts.ts`.

Each part is one commit. Part 1 is frontend polish, Part 2 is schema + UI wiring, Part 3 is schema + API + UI wiring, Part 4 is pure seed edit.

> **Nota de schema:** la tabla `courses` del repo corresponde al concepto de "sub-course" del framework (`docs/courses/README.md`). No hay tabla `sub_courses` separada. External references viven en `courses.external_references`.

---

## Part 1 — Semantic slots renderer

### 1.1 Shared constant

**File:** `apps/web/src/pages/CoursePlayerPage.tsx` (co-located with `MarkdownContent`)

```typescript
const SLOT_HEADINGS = ['Why this matters', 'Your task', 'Examples', 'Edge cases'] as const
type SlotHeading = (typeof SLOT_HEADINGS)[number]

interface SlotSection {
  slot: SlotHeading
  body: string
}
```

### 1.2 Parser

```typescript
export function renderSlots(md: string): SlotSection[] | null {
  const trimmed = md.trimStart()
  // Must open with one of the slot headings to activate the renderer
  const openingMatch = /^##\s+(.+?)\s*\n/.exec(trimmed)
  if (!openingMatch || !SLOT_HEADINGS.includes(openingMatch[1] as SlotHeading)) return null

  const parts: SlotSection[] = []
  const headingRegex = /^##\s+(.+?)\s*$/gm
  let current: SlotSection | null = null
  let lastIndex = 0

  for (const match of trimmed.matchAll(headingRegex)) {
    const heading = match[1].trim()
    if (!SLOT_HEADINGS.includes(heading as SlotHeading)) continue
    if (current) {
      current.body = trimmed.slice(lastIndex, match.index).trim()
      parts.push(current)
    }
    current = { slot: heading as SlotHeading, body: '' }
    lastIndex = match.index! + match[0].length
  }
  if (current) {
    current.body = trimmed.slice(lastIndex).trim()
    parts.push(current)
  }

  return parts.length > 0 ? parts : null
}
```

Rules:
- If the instruction does **not** start with one of the 4 slot headings → return `null` (caller renders plain markdown).
- Non-slot `## Heading` sections between slots are absorbed into the preceding slot body — authors who want rich content inside a slot can use `###` subheadings. Simpler than a nested parser.
- Empty slot bodies are preserved (render empty card) — surfaces authoring mistakes.

### 1.3 Card rendering

In `MarkdownContent`:

```typescript
function MarkdownContent({ source }: { source: string }) {
  const slots = renderSlots(source)
  if (!slots) return <PlainMarkdown source={source} />

  return (
    <div className="space-y-3">
      {slots.map((s) => (
        <SlotCard key={s.slot} slot={s.slot} body={s.body} />
      ))}
    </div>
  )
}
```

**SlotCard** styling (reuse existing Tailwind tokens from BRANDING.md):

| Slot | Role | Border |
|---|---|---|
| `Why this matters` | accent (purpose) | `border-accent/40 bg-accent/5` |
| `Your task` | neutral (body) | `border-border bg-surface` |
| `Examples` | muted (reference) | `border-muted/40 bg-muted/5` |
| `Edge cases` | warning (caution) | `border-warning/40 bg-warning/5` |

Header: small uppercase label (text-xs, tracking-wide) with the slot title. Body: existing `PlainMarkdown` renderer applied to `s.body`.

### 1.4 Unit test

**File:** `apps/web/src/pages/__tests__/renderSlots.test.ts` (new)

```typescript
import { describe, it, expect } from 'vitest'
import { renderSlots } from '../CoursePlayerPage'

describe('renderSlots', () => {
  it('returns null when the instruction does not open with a slot heading', () => {
    expect(renderSlots('Hello world\n\nJust some markdown')).toBeNull()
    expect(renderSlots('## Heading\n\nNot a slot')).toBeNull()
  })

  it('parses all four slots when present', () => {
    const md = [
      '## Why this matters',
      'Reason',
      '',
      '## Your task',
      'Do X',
      '',
      '## Examples',
      'foo → bar',
      '',
      '## Edge cases',
      'handle null',
    ].join('\n')
    const result = renderSlots(md)
    expect(result).toHaveLength(4)
    expect(result?.[0]).toEqual({ slot: 'Why this matters', body: 'Reason' })
    expect(result?.[3]).toEqual({ slot: 'Edge cases', body: 'handle null' })
  })

  it('leaves non-slot headings embedded in the preceding slot body', () => {
    const md = '## Your task\nDo X\n\n### Subheading\nnested\n'
    const result = renderSlots(md)
    expect(result).toHaveLength(1)
    expect(result?.[0].body).toContain('### Subheading')
  })
})
```

**No content migration in Sprint 019.** The renderer is turned on; any author can adopt slots by rewriting an instruction to start with `## Why this matters`. Existing instructions render unchanged.

---

## Part 2 — External references per course (framework §8)

### 2.1 Migration 0015 (references only — Part 3 adds `alternative_approach` to the same file)

**File:** `apps/api/src/infrastructure/persistence/drizzle/migrations/0015_external_references_alt_approach.sql`

```sql
-- Sprint 019 — Course content quality v2 (pedagogy)
--
-- courses.external_references: JSON array of {title, url, kind} per framework §8.
-- steps.alternative_approach:  post-pass reference for a second idiomatic approach.

ALTER TABLE "courses" ADD COLUMN "external_references" JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE "steps"   ADD COLUMN "alternative_approach" TEXT;
```

Rollback: drop both columns. Both are additive and nullable/defaulted.

### 2.2 Schema update

**File:** `apps/api/src/infrastructure/persistence/drizzle/schema.ts`

```typescript
export const courses = pgTable('courses', {
  // ...existing
  externalReferences: jsonb('external_references').notNull().default([]), // ExternalReference[]
})

export const steps = pgTable('steps', {
  // ...existing
  alternativeApproach: text('alternative_approach'), // post-pass only
})
```

### 2.3 Shared types

**File:** `packages/shared/src/types.ts`

```typescript
export type ExternalReferenceKind = 'book' | 'docs' | 'talk' | 'article'

export interface ExternalReference {
  title: string
  url: string
  kind: ExternalReferenceKind
}

export interface CourseDTO {
  // ...existing
  externalReferences: ExternalReference[]
}
```

**File:** `packages/shared/src/schemas.ts`

```typescript
export const externalReferenceKindSchema = z.enum(['book', 'docs', 'talk', 'article'])

export const externalReferenceSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url(),
  kind: externalReferenceKindSchema,
})

export const courseDTOSchema = baseCourseDTOSchema.extend({
  externalReferences: z.array(externalReferenceSchema).default([]),
})
```

### 2.4 Routes

**File:** `apps/api/src/infrastructure/http/routes/learn.ts`

Both `GET /learn/courses` and `GET /learn/courses/:slug` include `externalReferences` in the course-level payload. For the catalog list we return the array even when empty (keeps the DTO shape consistent; no extra query required — column is already on `courses`).

### 2.5 Backfill — seed data

**File:** `apps/api/src/infrastructure/persistence/seed-courses-sql-deep-cuts.ts`

```typescript
export const SQL_DEEP_CUTS_COURSE = {
  // ...existing
  externalReferences: [
    { title: 'Use The Index, Luke!', url: 'https://use-the-index-luke.com/', kind: 'docs' },
    { title: 'SQLite: Window Functions', url: 'https://www.sqlite.org/windowfunctions.html', kind: 'docs' },
    { title: 'Learn SQL the Hard Way (Zed Shaw)', url: 'https://learncodethehardway.org/sql/', kind: 'book' },
  ],
}
```

**File:** `apps/api/src/infrastructure/persistence/seed-courses.ts`

```typescript
// TypeScript Fundamentals
externalReferences: [
  { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', kind: 'docs' },
  { title: 'Effective TypeScript (Dan Vanderkam)', url: 'https://effectivetypescript.com/', kind: 'book' },
  { title: 'Total TypeScript Tips (Matt Pocock)', url: 'https://www.totaltypescript.com/tips', kind: 'article' },
]

// JavaScript DOM Fundamentals
externalReferences: [
  { title: 'MDN: Introduction to the DOM', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', kind: 'docs' },
  { title: 'MDN: Event delegation', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_delegation', kind: 'docs' },
  { title: "You Don't Know JS Yet: Objects & Classes", url: 'https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/objects-classes/README.md', kind: 'book' },
]
```

URLs to re-verify during implementation — some MDN anchors shift.

### 2.6 Frontend — Further reading section

**File:** `apps/web/src/pages/CoursePlayerPage.tsx`

Render a collapsed-by-default section at the **end of the lesson sidebar** (below the last lesson), titled "Further reading":

```typescript
function FurtherReading({ refs }: { refs: ExternalReference[] }) {
  if (refs.length === 0) return null
  const [open, setOpen] = useState(false)
  return (
    <section className="mt-6 border-t border-border pt-4">
      <button onClick={() => setOpen((v) => !v)} className="...">
        Further reading {open ? '▾' : '▸'}
      </button>
      {open && (
        <ul className="mt-2 space-y-1 text-sm">
          {refs.map((r) => (
            <li key={r.url}>
              <span className="mr-1">{KIND_ICON[r.kind]}</span>
              <a href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const KIND_ICON: Record<ExternalReferenceKind, string> = {
  book: '📘',
  docs: '📄',
  talk: '🎤',
  article: '📝',
}
```

---

## Part 3 — Alternative approach post-pass

### 3.1 Schema (shared with Part 2 migration)

`steps.alternative_approach` already in migration 0015 (§2.1).

### 3.2 Admin-side seed — which steps get populated

Target: **6–8 steps** across the 3 courses. Rule for inclusion: only steps where a second idiomatic approach is qualitatively different (different std-lib primitive, different algorithmic angle, different readability tradeoff). Not the remaining ~13 solvable steps — over-saturating the feature dilutes the signal.

Proposed v1 set (confirmable during implementation):

| Course | Step | Alt approach sketch |
|---|---|---|
| TS Fundamentals | L1.3 greet | Template literal arrow vs `function` + concat |
| TS Fundamentals | L3.4 memoize | `Map` vs plain object cache (reentrancy note) |
| JS DOM | L1.2 (querySelector) | `getElementById` when id is unique (perf note) |
| JS DOM | L2.2 (element creation) | `textContent` vs `innerText` vs `innerHTML` |
| SQL Deep Cuts | L1.2 rankings | `ROW_NUMBER` vs `RANK` vs `DENSE_RANK` |
| SQL Deep Cuts | L2.1 CTEs intro | CTE vs subquery readability |
| SQL Deep Cuts | L3.2 cohort | Window function vs self-join approach |

Seed data: add `alternativeApproach: string | null` next to `solution` in each step entry. Markdown format — short paragraph + code block if applicable.

### 3.3 Shared DTO

**File:** `packages/shared/src/types.ts`

`alternativeApproach` is **not** added to `StepDTO` (which is the learner's pre-pass view). Instead, extend the solution endpoint response type:

```typescript
export interface StepSolutionDTO {
  solution: string | null
  alternativeApproach: string | null
}
```

### 3.4 Route — extend solution endpoint

**File:** `apps/api/src/infrastructure/http/routes/learn.ts`

```typescript
app.get('/learn/courses/:slug/steps/:stepId/solution', async (c) => {
  // ...existing authorization (same as Sprint 018)

  const step = await db.query.steps.findFirst({ where: eq(steps.id, stepId) })
  if (!step) return c.json({ error: 'Step not found' }, 404)

  return c.json<StepSolutionDTO>({
    solution: step.solution ?? null,
    alternativeApproach: step.alternativeApproach ?? null,
  })
})
```

Unit tests (extend existing 5 tests in `GetStepSolution.test.ts` or the route integration test):
- [ ] Returns `alternativeApproach: null` when step has solution only
- [ ] Returns both fields when step has both
- [ ] 403 still blocks — no leakage pre-pass

### 3.5 API client

**File:** `apps/web/src/api/client.ts`

```typescript
learn: {
  getStepSolution: async (slug: string, stepId: string, anonId?: string): Promise<StepSolutionDTO> => {
    // ...return response typed as StepSolutionDTO
  },
}
```

### 3.6 Frontend — Solution tab extension

**File:** `apps/web/src/pages/CoursePlayerPage.tsx`

Inside the Solution tab body (Sprint 018 rendered `solution` in a single code block):

```tsx
<div className="space-y-4">
  <section>
    <p className="text-sm text-muted">One way to write this. Yours might be different and that's fine.</p>
    <CodeBlock>{solution}</CodeBlock>
  </section>

  {alternativeApproach && (
    <details className="border-t border-border pt-3">
      <summary className="cursor-pointer text-sm font-medium">Alternative approach</summary>
      <div className="mt-2">
        <PlainMarkdown source={alternativeApproach} />
      </div>
    </details>
  )}
</div>
```

Collapsed by default. No API call change — the solution endpoint now returns both fields in one round-trip.

---

## Part 4 — SQL L1.4 LAG/LEAD intro (content-only)

**File:** `apps/api/src/infrastructure/persistence/seed-courses-sql-deep-cuts.ts`

```typescript
const STEP_1_4_ID = seedUuid('sql-step-1-4-lag-lead')

// In SQL_DEEP_CUTS_STEPS, insert between step 1.3 and step 2.1:
{
  id: STEP_1_4_ID,
  lessonId: LESSON_1_ID,
  order: 4,
  type: 'exercise' as const,
  title: 'Compare each row to the previous',
  instruction: `Some data is only meaningful when compared to its neighbour. Month-over-month delta, day-over-day change, streak-or-not. \`LAG(expr, n)\` gives you the value from \`n\` rows before the current one, ordered by whatever you specify.

Here's a sales table. For each month, return the month, its sales total, and the **delta** vs the previous month (use \`0\` for the first month where there is no previous).

\`\`\`
| month      | sales |
|------------|-------|
| 2026-01-01 | 1000  |
| 2026-02-01 | 1350  |
| 2026-03-01 | 1200  |
\`\`\`

Expected output:

\`\`\`
| month      | sales | delta |
|------------|-------|-------|
| 2026-01-01 | 1000  | 0     |
| 2026-02-01 | 1350  | 350   |
| 2026-03-01 | 1200  | -150  |
\`\`\`

Columns: \`month\`, \`sales\`, \`delta\`. Column order matters for the tests.`,
  starterCode: `SELECT
  month,
  sales,
  -- your LAG expression here
FROM sales
ORDER BY month;`,
  testCode: /* harness with schema + seed + assertions comparing solution view to expected */,
  hint: 'LAG(sales, 1, 0) OVER (ORDER BY month) — the third argument is the default when no previous row exists.',
  solution: `SELECT
  month,
  sales,
  sales - LAG(sales, 1, 0) OVER (ORDER BY month) AS delta
FROM sales
ORDER BY month;`,
  alternativeApproach: null, // not one of the 6-8 alt approach steps
},
```

Reorder: bump existing step 2.1+ orders only if we treat L1.4 as "lesson 1 step 4". Since lessons are numbered independently, no cross-lesson reorder needed.

Total step count after Sprint 019:
- SQL Deep Cuts: 12 → **13** (framework allows ≤15 per sub-course)
- TS Fundamentals: 11 (unchanged)
- JS DOM: 8 (unchanged)
- **Total:** 32

Update the validate:courses run — the new step has `solution` + `testCode`, so it participates in the CI gate automatically.

---

## Verification checklist

### Tests
- [ ] Unit: `renderSlots` — null path, all-4-slots path, nested heading path (`apps/web`)
- [ ] Unit: extended `StepSolutionDTO` — both fields in response (`apps/api`)
- [ ] Integration: `GET /learn/courses/:slug/steps/:stepId/solution` returns `{ solution, alternativeApproach }`
- [ ] Integration: `GET /learn/courses/:slug` returns `externalReferences: ExternalReference[]`
- [ ] CI: `validate:courses` passes for all 32 steps with solutions (including new SQL L1.4)

### Manual
- [ ] A seeded step that starts with `## Why this matters` renders as 4 cards (sanity: craft one seed step to validate, then revert)
- [ ] Course landing shows "Further reading" with links for all 3 courses
- [ ] After passing TS L1.3, Solution tab shows both "Reference solution" and collapsible "Alternative approach"
- [ ] After passing a step without alt approach (e.g. SQL L1.4), Solution tab shows only the reference — no empty collapsible
- [ ] SQL L1.4 runs green locally: `LAG(sales, 1, 0) OVER (ORDER BY month)` solution passes the tests

### Obligatorios
- [ ] Migration 0015 corre en DB fresh y en DB existente
- [ ] `pnpm typecheck` ✓
- [ ] `pnpm lint` ✓
- [ ] `pnpm test --filter=@dojo/api` ✓ (≥106 + new test cases)
- [ ] `pnpm test --filter=@dojo/e2e` ✓
- [ ] CHANGELOG.md / ROADMAP.md actualizados
- [ ] Re-seed local de los 3 cursos sin error
- [ ] `pnpm validate:courses` en verde (13 + 13 steps with solution)

---

## Rollback

If Part 2 or 3 reveals a schema issue in prod:
- Drop `courses.external_references` and/or `steps.alternative_approach`
- Code keeps compiling — both are optional in the DTO (`ExternalReference[]` defaults `[]`; `alternativeApproach` is nullable)

If Part 1 renderer has layout bugs:
- Short-circuit `renderSlots` to return `null` (one-line change) — everything falls back to plain markdown

If Part 4 SQL step has a harness bug:
- Remove the step from `SQL_DEEP_CUTS_STEPS`, `wipe` the course in `/admin/courses`, re-seed → SQL Deep Cuts back to 12 steps

---

## Notes

- **Slots renderer does not migrate existing content.** The Sprint 019 deliverable is the capability; authors adopt slots opportunistically.
- **`alternativeApproach` is a learner-pedagogy field, not a validation target.** `validate:courses` does not execute it — it's free-form markdown.
- **Backwards compat:** every API response stays shape-compatible. `CourseDTO.externalReferences` defaults `[]`; `StepSolutionDTO.alternativeApproach` defaults `null`.
- **No admin UI changes in this sprint.** Editing external references / alt approach from the admin panel is its own sprint if needed.
