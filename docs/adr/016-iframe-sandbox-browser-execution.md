# ADR 016: iframe sandbox for browser-side course execution

**Status:** Accepted
**Date:** 2026-03-27
**Context:** Sprint 015 — second course requires DOM manipulation, which Piston cannot provide

## Decision

Add a **browser-side execution path** for course steps whose language is `javascript-dom`. These steps execute inside an `<iframe sandbox="allow-scripts">` element, never hitting the server. The execution contract (input/output) mirrors what `POST /learn/execute` returns, but the implementation lives entirely in the frontend.

## Why not extend Piston

Piston runs in a sandboxed Linux process — no browser, no DOM, no `window`, no `document`. HTML/CSS/JS exercises with DOM interaction require a real browser context. The alternatives:

| Option | Why not |
|---|---|
| Piston for DOM | No DOM API — structurally impossible |
| Sandpack (CodeSandbox) | CDN dependency, React/bundler required, overkill for vanilla DOM |
| StackBlitz WebContainers | WASM Node.js runtime — ~5MB load, complex setup, no benefit for DOM basics |
| Judge0 | Server-side only, same problem as Piston |
| iframe sandbox | Zero dependencies, native browser sandbox, instant execution, $0 server cost |

## Architecture

```
course.language === 'javascript-dom'
  → StepEditor uses IframeSandboxRunner (no API call)
  → Runner builds srcdoc: starterCode + testCode injected into bare HTML document
  → testCode communicates results via window.parent.postMessage
  → Runner receives TestResultDTO[] — same contract as POST /learn/execute

course.language !== 'javascript-dom'
  → StepEditor calls POST /learn/execute (existing Piston path, unchanged)
```

The routing decision lives in the frontend (`StepEditor`), not the backend. `CodeExecutionPort` is a server-side port and is not involved — the iframe runner is a pure frontend utility, not a port/adapter.

## Security model

`<iframe sandbox="allow-scripts">` without `allow-same-origin`:
- ✅ Cannot access parent DOM
- ✅ Cannot read parent cookies/localStorage
- ✅ Cannot navigate parent frame
- ✅ Cannot submit forms
- ⚠️ Can make `fetch()` / XHR to external URLs — acceptable for curated course content; must be revisited before Phase 3 (user-submitted exercises)

The `srcdoc` attribute is used instead of `src` — prevents navigation to external URLs, no origin policy issues.

## testCode contract for `javascript-dom`

The `testCode` field in the DB contains the test assertions. The iframe runner injects it after the user's `starterCode`. The testCode must:
1. Use a mini test runner (no dependencies) identical in structure to the Piston runner
2. Call `window.parent.postMessage({ type: 'test-results', log: string[], failed: boolean }, '*')` at the end

Full pattern documented in `docs/wip/IFRAME-TESTCODE-PATTERN.md`.

## Backend changes

Minimal. The backend is not involved in execution for `javascript-dom` steps. Only change:
- `packages/shared/src/schemas.ts` — add `'javascript-dom'` to the language enum so the type is available in the shared package
- `PistonAdapter` already returns "Unsupported language" for unknown languages — no change needed for that fallback

## Consequences

- Piston + iframe coexist. Course player routes by `course.language`. No domain changes.
- `javascript-dom` steps cannot be submitted to `POST /learn/execute` — the backend would return "Unsupported language". This is correct behavior.
- Before Phase 3 (user-submitted exercises), the `fetch()` surface of the iframe sandbox must be reviewed. Document in a future ADR or this one's update.
- Future languages that run natively in the browser (WASM-compiled Python, etc.) can follow the same pattern.

## Ref

Panel discussion: `docs/wip/SPRINT-014-alt-iframe-sandbox.md`
Sprint plan: `docs/sprints/current.md` (Sprint 015)
