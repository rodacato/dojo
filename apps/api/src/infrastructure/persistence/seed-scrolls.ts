import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, inArray } from 'drizzle-orm'
import postgres from 'postgres'
import * as schema from './drizzle/schema'
import { scrolls, lessons, steps, scrollProgress, stepNudges } from './drizzle/schema'
import {
  SQL_DEEP_CUTS_COURSE,
  SQL_DEEP_CUTS_LESSONS,
  SQL_DEEP_CUTS_STEPS,
} from './seed-scrolls-sql-deep-cuts'
import {
  PYTHON_COURSE_DATA,
  PYTHON_LESSONS,
  PYTHON_STEPS,
} from './seed-scrolls-python'
import {
  RUBY_COURSE_DATA,
  RUBY_LESSONS,
  RUBY_STEPS,
} from './seed-scrolls-ruby'
import {
  RUST_COURSE_DATA,
  RUST_LESSONS,
  RUST_STEPS,
} from './seed-scrolls-rust'
import {
  TYPESCRIPT_COURSE_DATA,
  TYPESCRIPT_LESSONS,
  TYPESCRIPT_STEPS,
} from './seed-scrolls-typescript'

// ---------------------------------------------------------------------------
// Deterministic UUIDs for seed data
// ---------------------------------------------------------------------------
import { createHash } from 'node:crypto'

function seedUuid(name: string): string {
  const hash = createHash('sha256').update(`dojo-scroll-${name}`).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '4' + hash.slice(13, 16),
    '8' + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-')
}

// ---------------------------------------------------------------------------
// Scroll: JavaScript DOM Fundamentals
// ---------------------------------------------------------------------------

const DOM_COURSE_ID = seedUuid('javascript-dom-fundamentals')

const DOM_LESSON_1_ID = seedUuid('dom-lesson-1-selecting')
const DOM_LESSON_2_ID = seedUuid('dom-lesson-2-modifying')
const DOM_LESSON_3_ID = seedUuid('dom-lesson-3-events')

const DOM_STEP_1_1_ID = seedUuid('dom-step-1-1-intro')
const DOM_STEP_1_2_ID = seedUuid('dom-step-1-2-gettitle')
const DOM_STEP_1_3_ID = seedUuid('dom-step-1-3-countitems')

const DOM_STEP_2_1_ID = seedUuid('dom-step-2-1-intro')
const DOM_STEP_2_2_ID = seedUuid('dom-step-2-2-updatetext')
const DOM_STEP_2_3_ID = seedUuid('dom-step-2-3-toggleclass')

const DOM_STEP_3_1_ID = seedUuid('dom-step-3-1-intro')
const DOM_STEP_3_2_ID = seedUuid('dom-step-3-2-counter')
const DOM_STEP_3_3_ID = seedUuid('dom-step-3-3-delegation')

// DOM testCode mini runner (plain JS, no TypeScript — runs in iframe).
// Accumulates structured per-test results in _tests and relays them through
// postMessage so the iframeSandboxRunner can surface stdout/stderr +
// ExecuteStepResponse with per-test messages (same contract as Piston runs).
const DOM_RUNNER = `const _tests = []
function test(name, fn) {
  try { fn(); _tests.push({ name: name, passed: true }) }
  catch (e) {
    _tests.push({
      name: name,
      passed: false,
      message: e instanceof Error ? e.message : String(e),
    })
  }
}
function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
    toBeTruthy: () => { if (!actual) throw new Error('expected truthy, got ' + JSON.stringify(actual)) },
    toBeFalsy: () => { if (actual) throw new Error('expected falsy, got ' + JSON.stringify(actual)) },
    toContain: (str) => {
      if (!String(actual).includes(String(str)))
        throw new Error('"' + actual + '" does not contain "' + str + '"')
    },
  }
}`

const DOM_RUNNER_END = `const _log = _tests.map(t => t.passed ? '\u2713 ' + t.name : '\u2717 ' + t.name + (t.message ? ': ' + t.message : ''))
const _failed = _tests.some(t => !t.passed)
window.parent.postMessage({ type: 'test-results', log: _log, failed: _failed, tests: _tests }, '*')`

export const DOM_COURSE_DATA = {
  id: DOM_COURSE_ID,
  slug: 'javascript-dom-fundamentals',
  title: 'JavaScript DOM Fundamentals',
  description: 'Learn to select, modify, and react to the DOM with vanilla JavaScript. No frameworks — just the browser APIs every developer needs to know.',
  language: 'javascript-dom',
  accentColor: '#F7DF1E',
  status: 'published' as const,
  isPublic: true,
  estimatedMinutes: 75,
  externalReferences: [
    { title: 'MDN: Introduction to the DOM', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', kind: 'docs' as const },
    { title: 'MDN: Event delegation', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_delegation', kind: 'docs' as const },
    { title: "You Don't Know JS Yet: Objects & Classes", url: 'https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/objects-classes/README.md', kind: 'book' as const },
  ],
}

const DOM_LESSONS_DATA = [
  { id: DOM_LESSON_1_ID, scrollId: DOM_COURSE_ID, order: 1, title: 'Selecting Elements' },
  { id: DOM_LESSON_2_ID, scrollId: DOM_COURSE_ID, order: 2, title: 'Modifying Elements' },
  { id: DOM_LESSON_3_ID, scrollId: DOM_COURSE_ID, order: 3, title: 'Events' },
]

export const DOM_STEPS_DATA = [
  // ── Lesson 1: Selecting Elements ────────────────────────────────
  {
    id: DOM_STEP_1_1_ID,
    lessonId: DOM_LESSON_1_ID,
    order: 1,
    type: 'read' as const,
    title: 'Selecting Elements',
    instruction: `The browser gives you a few ways to find elements on the page:

\`\`\`javascript
// By CSS selector — most versatile
const btn = document.querySelector('#submit-btn')
const cards = document.querySelectorAll('.card')

// By ID — slightly faster, returns one element
const header = document.getElementById('main-header')
\`\`\`

**\`querySelector\`** returns the first match (or \`null\` if not found).

**\`querySelectorAll\`** returns a \`NodeList\` of all matches — like an array, but you need \`Array.from()\` to use methods like \`.map()\`.

**\`getElementById\`** is the older API, slightly faster, but limited to a single ID lookup. You'll see it everywhere in production code, so it's worth recognising. For new code, prefer \`querySelector('#x')\` so one mental model covers ID, class, attribute, and complex selectors uniformly.

The CSS selector syntax is the same you use in stylesheets: class (\`.card\`), ID (\`#title\`), attribute (\`[data-id]\`), descendant (\`.card h2\`), and more.`,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: DOM_STEP_1_2_ID,
    lessonId: DOM_LESSON_1_ID,
    order: 2,
    type: 'kata' as const,
    title: "Read an element's text",
    instruction: `Write a function \`getTitle\` that finds the \`<h1>\` element on the page and returns its text content.

**Example:**
\`\`\`javascript
// Given this HTML:
// <h1 id="page-title">Hello Dojo</h1>

getTitle() // "Hello Dojo"
\`\`\``,
    starterCode: `function getTitle() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = '<h1 id="page-title">Hello Dojo</h1>'

test('returns the h1 text', () => {
  expect(getTitle()).toBe('Hello Dojo')
})
test('returns a string', () => {
  expect(typeof getTitle()).toBe('string')
})
test('works with different text content', () => {
  document.querySelector('#page-title').textContent = 'Welcome'
  expect(getTitle()).toBe('Welcome')
})

${DOM_RUNNER_END}`,
    hint: 'Use `document.querySelector("h1")` or `document.getElementById("page-title")`, then read `.textContent`.',
    solution: `function getTitle() {
  return document.querySelector('h1').textContent
}`,
    alternativeApproach: `\`innerText\` and \`textContent\` are both valid here, but they behave differently in production code:

\`\`\`javascript
function getTitle() {
  return document.querySelector('h1').innerText
}
\`\`\`

- **\`textContent\`** returns the raw text of every child node — including hidden elements and collapsed whitespace. Cheap: doesn't trigger layout.
- **\`innerText\`** returns the text as a human would see it rendered — hidden elements skipped, whitespace collapsed. Triggers layout. Slower, but closer to "what the user sees".

For reading an \`<h1>\` with no hidden content, they return the same string. In a function that reads visible text across complex DOM (e.g. scraping a rendered table), \`innerText\` is what you usually want; in a hot loop, \`textContent\` is the safer default.`,
  },
  {
    id: DOM_STEP_1_3_ID,
    lessonId: DOM_LESSON_1_ID,
    order: 3,
    type: 'kata' as const,
    title: 'Count list items',
    instruction: `Write a function \`countItems\` that counts how many \`<li>\` elements are inside \`#todo-list\`.

**Example:**
\`\`\`javascript
// Given this HTML:
// <ul id="todo-list">
//   <li>Buy milk</li>
//   <li>Write code</li>
//   <li>Ship it</li>
// </ul>

countItems() // 3
\`\`\``,
    starterCode: `function countItems() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = \`
  <ul id="todo-list">
    <li>Buy milk</li>
    <li>Write code</li>
    <li>Ship it</li>
  </ul>
\`

test('returns 3 for a list with 3 items', () => {
  expect(countItems()).toBe(3)
})
test('returns 0 for an empty list', () => {
  document.body.innerHTML = '<ul id="todo-list"></ul>'
  expect(countItems()).toBe(0)
})
test('returns 1 for a single item', () => {
  document.body.innerHTML = '<ul id="todo-list"><li>One</li></ul>'
  expect(countItems()).toBe(1)
})

${DOM_RUNNER_END}`,
    hint: 'Use `document.querySelectorAll("#todo-list li").length`.',
    solution: `function countItems() {
  return document.querySelectorAll('#todo-list li').length
}`,
  },

  // ── Lesson 2: Modifying Elements ────────────────────────────────
  {
    id: DOM_STEP_2_1_ID,
    lessonId: DOM_LESSON_2_ID,
    order: 1,
    type: 'read' as const,
    title: 'Modifying Elements',
    instruction: `Once you have an element, you can change almost anything about it:

\`\`\`javascript
const el = document.querySelector('#title')

// Text content (safe — no HTML injection risk)
el.textContent = 'New title'

// CSS classes
el.classList.add('active')
el.classList.remove('hidden')
el.classList.toggle('selected')
el.classList.contains('active') // → true/false

// Attributes
el.setAttribute('data-id', '42')
el.getAttribute('data-id') // → '42'
\`\`\`

**Prefer \`textContent\` over \`innerHTML\`** when inserting plain text. \`innerHTML\` parses HTML and can introduce XSS vulnerabilities if the content comes from user input.`,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: DOM_STEP_2_2_ID,
    lessonId: DOM_LESSON_2_ID,
    order: 2,
    type: 'kata' as const,
    title: 'Update a message',
    instruction: `Write a function \`updateMessage\` that changes the text inside \`#message\` to \`"Updated"\`.

**Example:**
\`\`\`javascript
// Before: <p id="message">Original</p>
updateMessage()
// After:  <p id="message">Updated</p>
\`\`\``,
    starterCode: `function updateMessage() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = '<p id="message">Original</p>'
updateMessage()

test('sets textContent to "Updated"', () => {
  expect(document.querySelector('#message').textContent).toBe('Updated')
})
test('element still exists', () => {
  expect(document.querySelector('#message')).toBeTruthy()
})

${DOM_RUNNER_END}`,
    hint: 'Get the element with `querySelector("#message")`, then set its `.textContent`.',
    solution: `function updateMessage() {
  document.querySelector('#message').textContent = 'Updated'
}`,
  },
  {
    id: DOM_STEP_2_3_ID,
    lessonId: DOM_LESSON_2_ID,
    order: 3,
    type: 'kata' as const,
    title: 'Activate a card',
    instruction: `Write a function \`activateCard\` that adds the class \`active\` to \`#card\`.

If the element already has the class, do nothing (idempotent).

**Example:**
\`\`\`javascript
// Before: <div id="card"></div>
activateCard()
// After:  <div id="card" class="active"></div>
\`\`\``,
    starterCode: `function activateCard() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = '<div id="card"></div>'
activateCard()

test('card has class "active" after calling activateCard()', () => {
  expect(document.querySelector('#card').classList.contains('active')).toBe(true)
})
test('calling it twice does not duplicate the class', () => {
  activateCard()
  const count = Array.from(document.querySelector('#card').classList).filter(c => c === 'active').length
  expect(count).toBe(1)
})

${DOM_RUNNER_END}`,
    hint: 'Use `el.classList.add("active")` — it is already idempotent (adding an existing class does nothing).',
    solution: `function activateCard() {
  document.querySelector('#card').classList.add('active')
}`,
  },

  // ── Lesson 3: Events ────────────────────────────────────────────
  {
    id: DOM_STEP_3_1_ID,
    lessonId: DOM_LESSON_3_ID,
    order: 1,
    type: 'read' as const,
    title: 'Events',
    instruction: `User interactions fire events. You listen for them with \`addEventListener\`:

\`\`\`javascript
const btn = document.querySelector('#btn')

btn.addEventListener('click', (event) => {
  console.log('clicked!', event.target)
})
\`\`\`

## Event delegation

Instead of attaching a listener to every child, attach one to the parent:

\`\`\`javascript
document.querySelector('#list').addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    e.target.classList.toggle('done')
  }
})
\`\`\`

This works because events **bubble up** — a click on an \`<li>\` also fires on its parent \`<ul>\` and all the way up to \`document\`.

## \`e.target\` vs \`e.currentTarget\`

- **\`e.target\`** — the exact element that was clicked
- **\`e.currentTarget\`** — the element the listener is attached to

If your \`<li>\` contains a \`<strong>\`, clicking on the text fires \`e.target = strong\`, not \`li\`. Use \`e.target.closest("li")\` to always get the \`<li>\` ancestor.`,
    starterCode: null,
    testCode: null,
    hint: null,
    solution: null,
  },
  {
    id: DOM_STEP_3_2_ID,
    lessonId: DOM_LESSON_3_ID,
    order: 2,
    type: 'kata' as const,
    title: 'Click counter',
    instruction: `Write a function \`setupCounter\` that attaches a click listener to \`#btn\`. Each click should increment the number shown in \`#counter\`.

**Example:**
\`\`\`javascript
// Given: <button id="btn">Click</button> <span id="counter">0</span>
setupCounter()
// user clicks btn → counter shows "1"
// user clicks btn → counter shows "2"
\`\`\``,
    starterCode: `function setupCounter() {
  // Your code here
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = \`
  <button id="btn">Click me</button>
  <span id="counter">0</span>
\`
setupCounter()

const btn = document.querySelector('#btn')
const counter = document.querySelector('#counter')

test('counter starts at 0', () => {
  expect(counter.textContent).toBe('0')
})
test('counter shows 1 after one click', () => {
  btn.click()
  expect(counter.textContent).toBe('1')
})
test('counter shows 2 after two clicks', () => {
  btn.click()
  expect(counter.textContent).toBe('2')
})

${DOM_RUNNER_END}`,
    hint: 'In the listener, read `+counter.textContent` to get the current number, add 1, and write it back.',
    solution: `function setupCounter() {
  const btn = document.querySelector('#btn')
  const counter = document.querySelector('#counter')
  btn.addEventListener('click', () => {
    counter.textContent = String(+counter.textContent + 1)
  })
}`,
  },
  {
    id: DOM_STEP_3_3_ID,
    lessonId: DOM_LESSON_3_ID,
    order: 3,
    type: 'challenge' as const,
    title: 'Fix the event delegation bug',
    instruction: `The \`setupTodoList\` function below uses event delegation — one listener on \`<ul>\` handles clicks on all \`<li>\` items and toggles a \`done\` class.

**It has a subtle bug.** Click on the bold text inside an \`<li>\` and nothing happens. Click on the empty space around the text and it works.

Fix \`setupTodoList\` so that clicking anywhere inside an \`<li>\` correctly toggles \`done\` on the \`<li>\` itself.`,
    starterCode: `function setupTodoList() {
  const list = document.querySelector('#todo-list')
  list.addEventListener('click', (e) => {
    // BUG: e.target may be a child element, not the <li>
    if (e.target.tagName === 'LI') {
      e.target.classList.toggle('done')
    }
  })
}`,
    testCode: `${DOM_RUNNER}

document.body.innerHTML = \`
  <ul id="todo-list">
    <li><strong>Buy milk</strong></li>
    <li><strong>Write code</strong></li>
  </ul>
\`
setupTodoList()

const items = document.querySelectorAll('li')
const strong0 = items[0].querySelector('strong')

test('clicking the li itself toggles done', () => {
  items[1].click()
  expect(items[1].classList.contains('done')).toBe(true)
})
test('clicking a child element inside li also toggles done on the li', () => {
  strong0.click()
  expect(items[0].classList.contains('done')).toBe(true)
})
test('clicking again toggles done off', () => {
  items[1].click()
  expect(items[1].classList.contains('done')).toBe(false)
})

${DOM_RUNNER_END}`,
    hint: 'When the click lands on a descendant of the `<li>`, what does that make `e.target`? Look at the DOM tree above the click — find the right ancestor before toggling.',
    solution: `function setupTodoList() {
  const list = document.querySelector('#todo-list')
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li')
    if (li && list.contains(li)) {
      li.classList.toggle('done')
    }
  })
}`,
  },
]

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

type ScrollSeed = {
  id: string
  slug: string
  title: string
  description: string
  language: string
  accentColor: string
  status: 'draft' | 'published'
  isPublic?: boolean
  estimatedMinutes?: number | null
  externalReferences?: Array<{ title: string; url: string; kind: 'book' | 'docs' | 'talk' | 'article' }>
}

type LessonSeed = { id: string; scrollId: string; order: number; title: string }
type StepSeed = {
  id: string
  lessonId: string
  order: number
  type: 'read' | 'read+inline' | 'code' | 'kata' | 'challenge' | 'predict'
  // Optional in the type because Sprint 018 backfills incrementally —
  // every new step authored from now on must set it.
  title?: string | null
  instruction: string
  starterCode: string | null
  testCode: string | null
  hint: string | null
  // Tier-ordered hints revealed progressively on repeated failure (StepDTO.hints).
  hints?: string[] | null
  solution?: string | null
  alternativeApproach?: string | null
  // Variant-shaped JSONB payload — only set for `predict` steps today
  // (per docs/courses/INTERACTIVITY-PATTERNS.md §predict).
  data?: unknown
}

type ScrollConfig = {
  courseData: ScrollSeed
  lessonsData: LessonSeed[]
  stepsData: StepSeed[]
}

async function seedOneScroll(
  db: ReturnType<typeof drizzle>,
  { courseData, lessonsData, stepsData }: ScrollConfig,
) {
  // Insert/update by slug. RETURNING the actual id is load-bearing — pre-existing
  // rows can have an id that differs from the seed-computed UUID (slug is the
  // identity contract, id is whatever happened to get inserted first). Re-mapping
  // lessons to use the actual id below prevents the FK violation that bit
  // pre-ADR-022 (TS scroll's id drifted, lessons insert crashed).
  const inserted = await db
    .insert(scrolls)
    .values({ ...courseData, isPublic: courseData.isPublic ?? false })
    .onConflictDoUpdate({
      target: scrolls.slug,
      set: {
        title: courseData.title,
        description: courseData.description,
        language: courseData.language,
        accentColor: courseData.accentColor,
        status: courseData.status,
        isPublic: courseData.isPublic ?? false,
        estimatedMinutes: courseData.estimatedMinutes ?? null,
        externalReferences: courseData.externalReferences ?? [],
      },
    })
    .returning({ id: scrolls.id })

  const actualScrollId = inserted[0]?.id ?? courseData.id
  console.log(`  ✓ Scroll: ${courseData.title}`)

  // Lessons: upsert by id so title/order edits propagate. Re-map scrollId
  // to the actual scroll id from the DB (see comment above) and propagate it
  // on update so a previously-orphaned lesson reattaches to the right scroll.
  // Deletions still require a wipe (see POST /admin/scrolls/:id/wipe) because
  // re-seeding never removes orphan lessons.
  for (const lesson of lessonsData) {
    await db
      .insert(lessons)
      .values({ ...lesson, scrollId: actualScrollId })
      .onConflictDoUpdate({
        target: lessons.id,
        set: {
          title: lesson.title,
          order: lesson.order,
          scrollId: actualScrollId,
        },
      })
  }
  console.log(`  ✓ Lessons: ${lessonsData.length}`)

  // Steps: upsert by id. type, order, title, solution, and data propagate
  // too so edits to those fields land without a wipe.
  for (const step of stepsData) {
    await db
      .insert(steps)
      .values({
        ...step,
        title: step.title ?? null,
        hints: step.hints ?? null,
        solution: step.solution ?? null,
        alternativeApproach: step.alternativeApproach ?? null,
        data: step.data ?? null,
      })
      .onConflictDoUpdate({
        target: steps.id,
        set: {
          type: step.type,
          order: step.order,
          title: step.title ?? null,
          instruction: step.instruction,
          starterCode: step.starterCode,
          testCode: step.testCode,
          hint: step.hint,
          hints: step.hints ?? null,
          solution: step.solution ?? null,
          alternativeApproach: step.alternativeApproach ?? null,
          data: step.data ?? null,
        },
      })
  }
  console.log(`  ✓ Steps: ${stepsData.length}`)
}

/**
 * Remove a scroll (and everything that hangs off it) whose slug is no longer
 * authoritative. Used to retire pre-pivot slugs that lived in DB after a
 * rename — e.g. the S025 pivot renamed `ruby-fundamentals` → `ruby`, and the
 * old row was never cleaned up, so the catalog and any cached links kept
 * pointing at it.
 *
 * The schema has no ON DELETE CASCADE, so this walks the FK chain manually:
 * stepNudges (step_id → steps.id) → steps → scrollProgress (course_id) →
 * lessons → scrolls. Idempotent: if the slug is already gone, this is a no-op.
 */
async function removeLegacyScrollBySlug(
  db: ReturnType<typeof drizzle>,
  legacySlug: string,
): Promise<void> {
  const [legacyScroll] = await db
    .select({ id: scrolls.id })
    .from(scrolls)
    .where(eq(scrolls.slug, legacySlug))
  if (!legacyScroll) return

  const legacyLessons = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.scrollId, legacyScroll.id))
  const legacyLessonIds = legacyLessons.map((l) => l.id)

  if (legacyLessonIds.length > 0) {
    const legacySteps = await db
      .select({ id: steps.id })
      .from(steps)
      .where(inArray(steps.lessonId, legacyLessonIds))
    const legacyStepIds = legacySteps.map((s) => s.id)
    if (legacyStepIds.length > 0) {
      await db.delete(stepNudges).where(inArray(stepNudges.stepId, legacyStepIds))
      await db.delete(steps).where(inArray(steps.id, legacyStepIds))
    }
    await db.delete(lessons).where(inArray(lessons.id, legacyLessonIds))
  }

  await db.delete(scrollProgress).where(eq(scrollProgress.scrollId, legacyScroll.id))
  await db.delete(scrolls).where(eq(scrolls.id, legacyScroll.id))
  console.log(`  ✓ Removed legacy scroll: ${legacySlug}`)
}

export interface SeedReport {
  seeded: Array<{ slug: string; title: string; lessonCount: number; stepCount: number }>
}

/**
 * Seed every known scroll into the provided drizzle instance.
 * Idempotent — reuses onConflictDoUpdate on (slug) and (step.id).
 */
export async function seedAllScrolls(db: ReturnType<typeof drizzle>): Promise<SeedReport> {
  const configs: ScrollConfig[] = [
    { courseData: DOM_COURSE_DATA, lessonsData: DOM_LESSONS_DATA, stepsData: DOM_STEPS_DATA },
    {
      courseData: SQL_DEEP_CUTS_COURSE,
      lessonsData: SQL_DEEP_CUTS_LESSONS,
      stepsData: SQL_DEEP_CUTS_STEPS,
    },
    {
      courseData: PYTHON_COURSE_DATA,
      lessonsData: PYTHON_LESSONS,
      stepsData: PYTHON_STEPS,
    },
    {
      courseData: RUBY_COURSE_DATA,
      lessonsData: RUBY_LESSONS,
      stepsData: RUBY_STEPS,
    },
    {
      courseData: RUST_COURSE_DATA,
      lessonsData: RUST_LESSONS,
      stepsData: RUST_STEPS,
    },
    {
      courseData: TYPESCRIPT_COURSE_DATA,
      lessonsData: TYPESCRIPT_LESSONS,
      stepsData: TYPESCRIPT_STEPS,
    },
  ]

  const report: SeedReport = { seeded: [] }
  for (const c of configs) {
    await seedOneScroll(db, c)
    report.seeded.push({
      slug: c.courseData.slug,
      title: c.courseData.title,
      lessonCount: c.lessonsData.length,
      stepCount: c.stepsData.length,
    })
  }

  // Retired pre-pivot slugs. The S025 crash-course pivot renamed
  // `ruby-fundamentals` → `ruby`, but never cleaned the old row, so a stale
  // catalog entry kept appearing at /scrolls/ruby-fundamentals. Wipe it once;
  // subsequent runs are no-ops via removeLegacyScrollBySlug's existence check.
  // S027 W3 added the same cleanup for the pre-pivot `python-for-the-practiced`
  // slug, replaced by `python` (polyglot-first scroll, see seed-scrolls-python.ts).
  await removeLegacyScrollBySlug(db, 'ruby-fundamentals')
  await removeLegacyScrollBySlug(db, 'python-for-the-practiced')
  await removeLegacyScrollBySlug(db, 'typescript-fundamentals')

  return report
}

async function seedScrollsCli() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL not set')

  const sql = postgres(connectionString, { max: 1 })
  const db = drizzle(sql, { schema })

  console.log('Seeding scrolls...')
  await seedAllScrolls(db)
  console.log('Done.')
  await sql.end()
}

// Only run when invoked directly (tsx src/.../seed-scrolls.ts), not when imported.
if (require.main === module) {
  seedScrollsCli().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
}
