# iframe testCode Pattern — javascript-dom Courses

> Reference for authoring `testCode` in course steps with `language: 'javascript-dom'`.
> This pattern is different from Piston testCode (TypeScript) — no compilation, no `process`, no `throw` to signal failure.

---

## How it works

The `IframeSandboxRunner` builds an HTML document with this structure:

```
<script>
  [starterCode — user's solution]

  [testCode — assertions]
</script>
```

Both blocks run in the same `<script>` tag, in the same browser document. The `testCode` has access to everything the `starterCode` defined, plus the full DOM API (`document`, `window`, etc.).

Results are communicated to the parent page via:
```javascript
window.parent.postMessage({ type: 'test-results', log: string[], failed: boolean }, '*')
```

This **must be the last statement** in every `testCode`.

---

## Full testCode template

```javascript
// ── Mini test runner ───────────────────────────────────────────────────
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
// ── End mini test runner ───────────────────────────────────────────────

// (Optional) Set up the DOM before tests run
document.body.innerHTML = `
  <h1 id="title">Hello</h1>
`

// Call the user's function (defined in starterCode)
// e.g., if starterCode defines `function getTitle() { ... }`
// you can call it here

// ── Tests ──────────────────────────────────────────────────────────────

test('description of what should pass', () => {
  const el = document.querySelector('#title')
  expect(el).toBeTruthy()
  expect(el.textContent).toBe('Hello')
})

// ── MUST be last ───────────────────────────────────────────────────────
window.parent.postMessage({ type: 'test-results', log: _log, failed: _fail }, '*')
```

---

## Patterns by exercise type

### Type 1: Function that queries the DOM

The `starterCode` defines a function. The `testCode` sets up a DOM, calls the function, and asserts on the result.

```javascript
// starterCode
function getTitle() {
  // student fills this in
}

// testCode
// ... mini runner ...
document.body.innerHTML = '<h1 id="page-title">Hello Dojo</h1>'
test('returns the h1 text', () => {
  expect(getTitle()).toBe('Hello Dojo')
})
window.parent.postMessage({ type: 'test-results', log: _log, failed: _fail }, '*')
```

### Type 2: Function that mutates the DOM

The `testCode` sets up a DOM, calls the function, then reads back the state.

```javascript
// starterCode
function updateMessage() {
  // student fills this in
}

// testCode
// ... mini runner ...
document.body.innerHTML = '<p id="message">Original</p>'
updateMessage()
test('sets textContent to "Updated"', () => {
  expect(document.querySelector('#message').textContent).toBe('Updated')
})
window.parent.postMessage({ type: 'test-results', log: _log, failed: _fail }, '*')
```

### Type 3: Function that attaches events

Use `.click()` or `dispatchEvent` to trigger events programmatically.

```javascript
// starterCode
function setupCounter() {
  // student fills this in
}

// testCode
// ... mini runner ...
document.body.innerHTML = '<button id="btn">Click</button><span id="count">0</span>'
setupCounter()
test('count increments on click', () => {
  document.querySelector('#btn').click()
  expect(document.querySelector('#count').textContent).toBe('1')
})
window.parent.postMessage({ type: 'test-results', log: _log, failed: _fail }, '*')
```

### Type 4: "Fix the bug" challenge

The `starterCode` is pre-filled with buggy code. The `testCode` includes a test that the bug causes to fail.

```javascript
// starterCode (pre-filled, contains the bug)
function setupTodoList() {
  const list = document.querySelector('#todo-list')
  list.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {   // BUG: misses clicks on children
      e.target.classList.toggle('done')
    }
  })
}

// testCode
// ... mini runner ...
document.body.innerHTML = `
  <ul id="todo-list">
    <li><strong>Buy milk</strong></li>
  </ul>
`
setupTodoList()
test('clicking a child element toggles done on the li', () => {
  document.querySelector('li strong').click()
  expect(document.querySelector('li').classList.contains('done')).toBe(true)
})
window.parent.postMessage({ type: 'test-results', log: _log, failed: _fail }, '*')
```

---

## Rules

1. **Always end with `window.parent.postMessage(...)`** — if this line is missing, the runner times out after 5s.
2. **Set up `document.body.innerHTML` before calling user functions** — the iframe starts with an empty `<body>`.
3. **Each test resets state independently** if it needs a clean DOM — re-assign `document.body.innerHTML` inside the test or between tests.
4. **No `import`/`require`** — the iframe has no module system, no bundler, no CDN access.
5. **No `console.log` for test results** — use `_log.push(...)` via the `test()` helper.
6. **`</script>` inside string literals** — if the student's code or testCode contains `</script>`, the runner escapes it automatically. Safe to author naturally.
