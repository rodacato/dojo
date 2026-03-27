# Spec 021: Sprint 015 — iframe Sandbox + JavaScript DOM Course

> **Status:** ready-to-implement
> **Depends on:** ADR 016 (iframe sandbox), Spec 020 (courses MVP), Sprint 015 plan
> **Sprint:** 015

---

## Overview

Two deliverables:
1. **IframeSandboxRunner** — frontend-only execution path for `javascript-dom` course steps
2. **JavaScript DOM Fundamentals** — second course seeded in the DB, 3 lessons, 9 steps

Plus carry-forwards: landing page CTA and rate limiter integration test.

---

## 1. Shared package — language enum update

**File:** `packages/shared/src/schemas.ts`

Add `'javascript-dom'` to the language enum used in `executeStepSchema`:

```typescript
// Before
const languageSchema = z.enum(['typescript', 'javascript', 'python', 'ruby', 'go', 'rust', 'sql'])

// After
const languageSchema = z.enum(['typescript', 'javascript', 'javascript-dom', 'python', 'ruby', 'go', 'rust', 'sql'])
```

This ensures the type is available in `packages/shared` for both API and web consumers. The backend `PistonAdapter` already handles unknown languages gracefully (returns "Unsupported language" with exitCode 1) — no change needed there.

---

## 2. IframeSandboxRunner

**File:** `apps/web/src/features/learn/IframeSandboxRunner.ts`

A pure TypeScript module (no React dependency) that executes code in an iframe sandbox and returns test results.

### Interface

```typescript
import type { TestResultDTO } from '@dojo/shared'

export interface SandboxRunResult {
  passed: boolean
  output: string
  testResults: TestResultDTO[]
}

export function runInIframe(params: {
  starterCode: string  // user's code
  testCode: string     // assertions, uses postMessage to report results
  timeoutMs?: number   // default: 5000
}): Promise<SandboxRunResult>
```

### Implementation

```typescript
export function runInIframe({ starterCode, testCode, timeoutMs = 5000 }): Promise<SandboxRunResult> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('sandbox', 'allow-scripts')
    iframe.style.display = 'none'

    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      document.body.removeChild(iframe)
      resolve({
        passed: false,
        output: 'Execution timed out',
        testResults: [{ name: 'Execution', passed: false, message: 'Timed out after ' + timeoutMs + 'ms' }],
      })
    }, timeoutMs)

    window.addEventListener('message', function handler(event) {
      if (event.source !== iframe.contentWindow) return
      if (!event.data || event.data.type !== 'test-results') return
      if (settled) return
      settled = true
      clearTimeout(timer)
      window.removeEventListener('message', handler)
      document.body.removeChild(iframe)

      const { log, failed } = event.data as { log: string[]; failed: boolean }
      const testResults: TestResultDTO[] = log.map((line: string) => {
        if (line.startsWith('✓ ')) return { name: line.slice(2), passed: true }
        if (line.startsWith('✗ ')) {
          const rest = line.slice(2)
          const colonIdx = rest.indexOf(': ')
          return colonIdx > -1
            ? { name: rest.slice(0, colonIdx), passed: false, message: rest.slice(colonIdx + 2) }
            : { name: rest, passed: false }
        }
        return { name: line, passed: true }
      })

      resolve({
        passed: !failed,
        output: log.join('\n'),
        testResults,
      })
    })

    iframe.srcdoc = buildSrcdoc(starterCode, testCode)
    document.body.appendChild(iframe)
  })
}

function buildSrcdoc(starterCode: string, testCode: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
<script>
window.onerror = function(msg, src, line, col, err) {
  window.parent.postMessage({
    type: 'test-results',
    log: ['✗ Runtime error: ' + msg],
    failed: true
  }, '*')
}
try {
${starterCode}

${testCode}
} catch(e) {
  window.parent.postMessage({
    type: 'test-results',
    log: ['✗ Uncaught error: ' + (e instanceof Error ? e.message : String(e))],
    failed: true
  }, '*')
}
</script>
</body>
</html>`
}
```

### Notes

- `event.source !== iframe.contentWindow` guard prevents spoofing from other iframes
- The `window.onerror` inside the srcdoc catches syntax errors and runtime exceptions that occur outside try/catch
- The outer try/catch catches errors in user code that aren't wrapped by the testCode's own try/catch
- Timeout default 5s (vs Piston's 3s) — DOM manipulation is fast, this is generous

---

## 3. StepEditor — execution routing

**File:** `apps/web/src/features/learn/StepEditor.tsx`

The `StepEditor` receives the course language as a prop. When the user clicks "Run":

```typescript
// Existing: calls POST /learn/execute
async function handleRun() {
  if (courseLanguage === 'javascript-dom') {
    // NEW: iframe path
    const result = await runInIframe({
      starterCode: code,
      testCode: step.testCode ?? '',
    })
    handleExecuteResult(result)  // existing handler, same shape
  } else {
    // EXISTING: Piston API path
    const result = await executeStep({ code, testCode: step.testCode ?? '', language: courseLanguage })
    handleExecuteResult(result)
  }
}
```

**Badge update:** When `courseLanguage === 'javascript-dom'`, show a badge near the "Run" button:

```tsx
{courseLanguage === 'javascript-dom' && (
  <span className="text-xs text-muted">Runs in browser</span>
)}
```

---

## 4. testCode pattern for DOM exercises

**File to create:** `docs/wip/IFRAME-TESTCODE-PATTERN.md`

Full testCode template for DOM exercises:

```javascript
// Mini test runner — same structure as Piston runner but DOM-aware
let _fail = false
const _log = []

function test(name, fn) {
  try {
    fn()
    _log.push('✓ ' + name)
  } catch (e) {
    _log.push('✗ ' + name + ': ' + (e instanceof Error ? e.message : String(e)))
    _fail = true
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected)
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
    toBeTruthy: () => {
      if (!actual) throw new Error('expected truthy, got ' + JSON.stringify(actual))
    },
    toBeFalsy: () => {
      if (actual) throw new Error('expected falsy, got ' + JSON.stringify(actual))
    },
    toContain: (str) => {
      if (!String(actual).includes(String(str)))
        throw new Error('expected "' + actual + '" to contain "' + str + '"')
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error('expected ' + JSON.stringify(expected) + ' but got ' + JSON.stringify(actual))
    },
  }
}

// ── TESTS ──────────────────────────────────────────────────────────────

// test('description', () => {
//   const el = document.querySelector('#some-id')
//   expect(el).toBeTruthy()
//   expect(el.textContent).toContain('expected text')
// })

// ── END TESTS ──────────────────────────────────────────────────────────

window.parent.postMessage({ type: 'test-results', log: _log, failed: _fail }, '*')
```

**Key differences from Piston runner:**
- No `throw new Error('Tests failed')` at the end — `_fail` flag is communicated via postMessage
- `document.*` APIs are available — the user's starterCode runs in the same document
- No TypeScript — pure JavaScript (the iframe doesn't compile)
- `window.parent.postMessage` must be the last statement

---

## 5. Seed data — JavaScript DOM Fundamentals

**File:** `apps/api/src/infrastructure/persistence/seed-courses.ts` (append to existing)

```
Course: "JavaScript DOM Fundamentals"
slug: "javascript-dom-fundamentals"
language: "javascript-dom"
accentColor: "#F7DF1E"
status: "published"

Lesson 1: Selecting Elements        (3 steps)
Lesson 2: Modifying Elements        (3 steps)
Lesson 3: Events                    (3 steps)
```

### Lesson 1: Selecting Elements

**Step 1.1 — explanation**

```markdown
# Selecting Elements

The browser gives you several ways to grab elements from the page:

```javascript
// By CSS selector — most versatile
const btn = document.querySelector('#submit-btn')
const cards = document.querySelectorAll('.card')

// By ID — fastest, but only one element
const header = document.getElementById('main-header')
```

**`querySelector`** returns the first match (or `null`).
**`querySelectorAll`** returns a `NodeList` of all matches.

The CSS selector syntax is the same one you use in stylesheets — class, ID, attribute, descendant, etc.
```

**Step 1.2 — exercise: read textContent**

```
instruction: "Select the `<h1>` element and return its `textContent`."
starterCode:
  function getTitle() {
    // Your code here
  }

testCode (DOM setup + assertions):
  // DOM setup — this is the HTML environment the function runs in
  document.body.innerHTML = '<h1 id="page-title">Hello Dojo</h1>'

  // Mini runner...
  test('returns the h1 text', () => {
    expect(getTitle()).toBe('Hello Dojo')
  })
  test('uses querySelector or getElementById', () => {
    expect(getTitle()).toBeTruthy()
  })
```

**Step 1.3 — exercise: count list items**

```
instruction: "Select all `<li>` elements inside `#todo-list` and return how many there are."
starterCode:
  function countItems() {
    // Your code here
  }

testCode:
  document.body.innerHTML = `
    <ul id="todo-list">
      <li>Buy milk</li>
      <li>Write code</li>
      <li>Ship it</li>
    </ul>
  `
  test('returns 3 for a list with 3 items', () => {
    expect(countItems()).toBe(3)
  })
  test('returns 0 for an empty list', () => {
    document.body.innerHTML = '<ul id="todo-list"></ul>'
    expect(countItems()).toBe(0)
  })
```

### Lesson 2: Modifying Elements

**Step 2.1 — explanation**

```markdown
# Modifying Elements

Once you have an element, you can change almost anything about it:

```javascript
const el = document.querySelector('#title')

// Text content (safe — no HTML injection)
el.textContent = 'New title'

// CSS classes
el.classList.add('active')
el.classList.remove('hidden')
el.classList.toggle('selected')
el.classList.contains('active') // → true/false

// Attributes
el.setAttribute('data-id', '42')
el.getAttribute('data-id') // → '42'
```

Prefer `textContent` over `innerHTML` when you're inserting plain text — `innerHTML` parses HTML and can introduce XSS bugs if the content comes from user input.
```

**Step 2.2 — exercise: update text**

```
instruction: "Change the text inside `#message` to `'Updated'`."
starterCode:
  function updateMessage() {
    // Your code here
  }

testCode:
  document.body.innerHTML = '<p id="message">Original</p>'
  updateMessage()
  test('sets textContent to "Updated"', () => {
    const el = document.querySelector('#message')
    expect(el.textContent).toBe('Updated')
  })
```

**Step 2.3 — exercise: toggle class**

```
instruction: "Add the class `active` to the element with id `#card`. If it already has it, do nothing."
starterCode:
  function activateCard() {
    // Your code here
  }

testCode:
  document.body.innerHTML = '<div id="card"></div>'
  activateCard()
  test('card has class "active" after calling activateCard()', () => {
    const el = document.querySelector('#card')
    expect(el.classList.contains('active')).toBe(true)
  })
  test('calling it twice does not add the class twice', () => {
    activateCard()
    const el = document.querySelector('#card')
    const count = Array.from(el.classList).filter(c => c === 'active').length
    expect(count).toBe(1)
  })
```

### Lesson 3: Events

**Step 3.1 — explanation**

```markdown
# Events

User interactions fire events. You listen for them with `addEventListener`:

```javascript
const btn = document.querySelector('#btn')

btn.addEventListener('click', (event) => {
  console.log('clicked!', event.target)
})
```

**Event delegation** is the pattern of attaching one listener to a parent instead of many listeners to children:

```javascript
// Instead of one listener per <li>:
document.querySelector('#list').addEventListener('click', (e) => {
  if (e.target.tagName === 'LI') {
    e.target.classList.toggle('done')
  }
})
```

This works because events bubble up — a click on `<li>` also fires on its parent `<ul>`.
```

**Step 3.2 — exercise: click counter**

```
instruction: "Add a click listener to `#btn` that increments the number inside `#counter` on each click."
starterCode:
  function setupCounter() {
    // Your code here
  }

testCode:
  document.body.innerHTML = `
    <button id="btn">Click me</button>
    <span id="counter">0</span>
  `
  setupCounter()
  const btn = document.querySelector('#btn')
  const counter = document.querySelector('#counter')
  test('counter starts at 0', () => {
    expect(counter.textContent).toBe('0')
  })
  test('counter increments on click', () => {
    btn.click()
    expect(counter.textContent).toBe('1')
  })
  test('counter increments again', () => {
    btn.click()
    expect(counter.textContent).toBe('2')
  })
```

**Step 3.3 — challenge: fix the event delegation bug**

```
instruction: |
  This event delegation implementation has a subtle bug.
  The `done` class toggles on click — but only when you click exactly on the `<li>` text,
  not on any child element inside it.

  Fix `setupTodoList()` so that clicking anywhere inside an `<li>` (including nested elements)
  correctly toggles the `done` class on the `<li>` itself.

  **Hint:** `e.target` is the exact element clicked. What you want is the `<li>` ancestor.
starterCode:
  function setupTodoList() {
    const list = document.querySelector('#todo-list')
    list.addEventListener('click', (e) => {
      // BUG: e.target might be a child element, not the <li>
      if (e.target.tagName === 'LI') {
        e.target.classList.toggle('done')
      }
    })
  }

testCode:
  document.body.innerHTML = `
    <ul id="todo-list">
      <li><strong>Buy milk</strong></li>
      <li><strong>Write code</strong></li>
    </ul>
  `
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
  test('clicking again toggles it off', () => {
    items[1].click()
    expect(items[1].classList.contains('done')).toBe(false)
  })
```

---

## 6. Carry-forwards

### Landing page CTA

**File:** `apps/web/src/pages/Landing.tsx` (or equivalent)

Add a CTA button in the hero section:

```tsx
<Link to="/learn">
  Try a free course →
</Link>
```

Placement: below the primary "Request access" CTA. Style: secondary/ghost button using existing design tokens.

### Rate limiter integration test

**File:** `apps/api/src/routes/__tests__/learn.test.ts` (or new test file)

Test that the 11th anonymous execution within the rate limit window returns 429:

```typescript
it('returns 429 on 11th anonymous execution', async () => {
  // Make 10 requests (within limit)
  for (let i = 0; i < 10; i++) {
    const res = await app.request('/learn/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'const x = 1', testCode: '', language: 'javascript' }),
    })
    expect(res.status).not.toBe(429)
  }
  // 11th should be rate limited
  const res = await app.request('/learn/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: 'const x = 1', testCode: '', language: 'javascript' }),
  })
  expect(res.status).toBe(429)
})
```

Note: the rate limiter uses an in-memory store by default in tests — verify this is configured correctly or mock the store.

---

## 7. Verification checklist

1. `pnpm typecheck` passes — no TS errors in new files
2. `pnpm lint` passes
3. `pnpm test --filter=api` — all existing tests pass + rate limiter test passes
4. `/learn` shows two course cards: TypeScript Fundamentals + JavaScript DOM Fundamentals
5. JS DOM course opens — badge "Runs in browser" visible in StepEditor
6. Step 1.2 (read textContent): correct code passes, wrong code shows ✗ with message
7. Step 3.3 (fix the bug): starter code fails the "clicking child" test, fixed code passes all 3
8. TypeScript Fundamentals course still works via Piston (no regression)
9. Landing page has "Try a free course" CTA linking to `/learn`
