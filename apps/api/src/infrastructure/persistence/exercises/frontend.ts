import { type SeedExercise, uuidv5 } from './types'

export const frontendExercises: SeedExercise[] = [
  {
    id: uuidv5('exercise-004-typescript-inherited'),
    title: 'TypeScript You Inherited',
    description: `You joined a new team. This is real code from the codebase. The previous developer said "we'll fix the types later." It's been 18 months.

\`\`\`typescript
function processUserEvent(event: any) {
  if (event.type === 'purchase') {
    return {
      userId: event.user.id,
      amount: event.data.amount,
      currency: event.data.currency || 'USD'
    }
  }
  if (event.type === 'refund') {
    return {
      userId: event.user.id,
      amount: -event.data.amount,
      currency: event.data.currency || 'USD'
    }
  }
  return null
}
\`\`\`

This function is called 40 times across the codebase. Improve the types. Don't change the runtime behavior. Explain every decision you make.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['typescript', 'types', 'refactoring'],
    topics: ['typescript', 'type-safety', 'any-type', 'union-types', 'type-narrowing', 'discriminated-unions'],
    variations: [
      {
        ownerRole: 'Senior TypeScript engineer who has maintained a typed codebase of 200k lines for 4 years',
        ownerContext:
          "Evaluate the developer's TypeScript thinking. Do they define discriminated unions for the event types? Do they understand the difference between `unknown` and `any`? Do they use type guards or type narrowing correctly? A solution that uses `as EventType` casting is not type-safe — it compiles but moves the problem. Give credit for: discriminated union definition, exhaustive switch or if-else with proper narrowing, and understanding why `any` was a mistake (bypasses the compiler entirely). Ask a follow-up if they only improve the function signature without addressing the root type definition.",
      },
      {
        ownerRole: 'Staff engineer who reviews 20+ PRs per week and has to balance type safety with practical migration paths',
        ownerContext:
          "Evaluate the developer's migration strategy, not just the type design. This code is called 40 times. A perfect type rewrite that breaks 40 call sites is not a good PR. Does the developer think about incremental adoption? Can the function be typed at the boundary while the call sites migrate gradually? Give credit for: understanding the blast radius (40 call sites), proposing a migration path, and identifying that the `currency` fallback to 'USD' is itself a typing issue — it implies `currency` can be undefined, which should be explicit.",
      },
    ],
  },

  {
    id: uuidv5('exercise-007-code-review'),
    title: 'The Code Review',
    description: `This is a pull request from a junior developer on your team. They're proud of it. It works. Give them a code review — be specific, be helpful, and be honest.

\`\`\`typescript
async function getUserData(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`)
    const data = await response.json()
    if (data) {
      return data.user
    }
  } catch(e) {
    console.log(e)
  }
}
\`\`\``,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['code-review', 'junior', 'error-handling'],
    topics: ['code-review', 'readability', 'error-handling', 'async-await', 'typescript', 'defensive-programming'],
    variations: [
      {
        ownerRole: 'Senior developer who mentors juniors and has strong opinions about what makes feedback useful vs. demoralizing',
        ownerContext:
          "Evaluate whether the developer's code review is specific, constructive, and honest. Issues to find: (1) `userId` has no type annotation; (2) `response.ok` is not checked — a 404 or 500 response will not throw but will return an error body; (3) `if (data)` is truthy-checking an object, which is always true — the `data.user` check is the right guard; (4) the catch swallows the error — `console.log` is not error handling for production code; (5) the function returns `undefined` on error, not `null`, and has no return type annotation. Give credit for identifying 3+ issues AND for framing feedback in a way that helps the junior understand why, not just what.",
      },
      {
        ownerRole: 'Principal engineer who treats every code review as a teaching opportunity and will not approve code that could silently fail in production',
        ownerContext:
          "Evaluate technical depth. The `response.ok` check is the most production-critical issue — a user who gets a 404 because the userId doesn't exist will get `undefined` back with no error, and the caller has no way to distinguish 'not found' from 'fetch error.' The developer should propose a pattern for error handling: either throw a typed error (`UserNotFoundError`, `FetchError`) or return a discriminated union (`{ ok: true, user } | { ok: false, error }`). Give extra credit for suggesting that the function's return type should be explicit, not inferred, and for noting that `console.log(e)` is especially bad — it logs the error object, which may contain sensitive user data.",
      },
    ],
  },

  {
    id: uuidv5('exercise-039-state-management'),
    title: 'The State Management Debate',
    description: `Your React application has grown to 60 components across 12 pages. State is managed with a mix of: useState in individual components, useContext for auth and theme, Redux for the shopping cart, and React Query for server data. A new developer joins the team and says "this is chaos — we should pick one state management solution and use it for everything."

Evaluate the current approach. Is it really chaos, or is it appropriate? When would you consolidate, and when would you keep multiple approaches? Make your case with specific examples from a typical e-commerce app.`,
    duration: 15,
    difficulty: 'easy',
    type: 'chat',
    category: 'frontend',
    languages: [],
    tags: ['frontend', 'state-management', 'react'],
    topics: ['state-management', 'react', 'redux', 'react-query', 'context-api', 'component-architecture'],
    variations: [
      {
        ownerRole: 'Senior frontend architect who has worked on React apps ranging from 10 to 500 components and has strong opinions about state categorization',
        ownerContext:
          "Evaluate whether the developer understands that different types of state have different management needs. The four categories: (1) local UI state (form inputs, toggles) \u2192 useState; (2) global UI state (theme, auth, modals) \u2192 Context or Zustand; (3) server state (products, orders, user data) \u2192 React Query or SWR; (4) client-side complex state (shopping cart, multi-step forms) \u2192 Redux or Zustand. The current setup is actually reasonable — using useState for local, Context for auth/theme, Redux for cart, React Query for server data aligns with these categories. The new developer's suggestion to use 'one solution for everything' is a red flag — it leads to Redux for form inputs or React Query for UI toggles. Give credit for: defending the multi-tool approach with clear categorization, identifying when consolidation makes sense (too many Contexts causing re-render issues), and explaining the trade-off between consistency and fitness-for-purpose.",
      },
      {
        ownerRole: 'Frontend tech lead who has onboarded 8 developers onto an existing React codebase and knows that state management confusion is the #1 onboarding friction point',
        ownerContext:
          "Evaluate the developer's empathy for the new developer's perspective. The new developer is not wrong to feel confused — the problem is not the tools, it's the lack of documented conventions. Evaluate whether the developer proposes: (1) a state management decision tree (if X, use Y — documented in the repo); (2) clear boundaries (all server data goes through React Query, no exceptions; cart state lives in Redux, not Context); (3) code review enforcement of these conventions. The current approach may be correct but it needs to be intentional, not accidental. Give credit for: acknowledging the onboarding problem, proposing documentation rather than rewriting, and identifying the real risk of the current setup — it's one decision away from someone putting server data in Redux and duplicating what React Query does.",
      },
    ],
  },

  {
    id: uuidv5('exercise-040-rendering-optimization'),
    title: 'The Slow Render',
    description: `Your React dashboard has a data table with 500 rows and 12 columns. Every time the user types in the search box above the table, the entire page freezes for 300-400ms. The profiler shows the table re-rendering on every keystroke. Here's the simplified structure:

\`\`\`tsx
function Dashboard() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState<Row[]>(initialData)
  const [sortColumn, setSortColumn] = useState('name')

  const filteredData = data.filter(row =>
    row.name.toLowerCase().includes(search.toLowerCase())
  )

  const sortedData = [...filteredData].sort((a, b) =>
    a[sortColumn] > b[sortColumn] ? 1 : -1
  )

  return (
    <div>
      <SearchBox value={search} onChange={setSearch} />
      <DataTable rows={sortedData} onSort={setSortColumn} />
      <Sidebar stats={computeStats(data)} />
    </div>
  )
}
\`\`\`

Identify all the performance problems. Fix them. Explain each optimization and when it would NOT be appropriate.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['frontend', 'performance', 'react'],
    topics: ['react-performance', 'useMemo', 'useCallback', 'virtualization', 're-rendering', 'memoization'],
    variations: [
      {
        ownerRole: 'Senior React developer who has optimized rendering performance on dashboards with 10k+ rows and uses the React Profiler weekly',
        ownerContext:
          "Multiple performance issues to identify: (1) `filteredData` and `sortedData` are recomputed on every render — wrap in `useMemo` with `[data, search]` and `[filteredData, sortColumn]` dependencies; (2) `computeStats(data)` runs on every render even though `data` doesn't change when `search` changes — wrap in `useMemo` with `[data]`; (3) `DataTable` re-renders on every keystroke because `sortedData` is a new array reference — memoize the table component with `React.memo`; (4) `onSort={setSortColumn}` creates a new function reference each render — use `useCallback`; (5) for 500 rows, virtualization (react-window or tanstack-virtual) would eliminate rendering off-screen rows. Evaluate whether the developer correctly identifies the most impactful fix (useMemo for the filter/sort chain) vs. premature optimizations. Give credit for explaining when memoization is NOT appropriate — small lists, simple components, or when the overhead of memoization exceeds the render cost.",
      },
      {
        ownerRole: 'Frontend performance consultant who has audited 20+ React applications and seen developers add useMemo everywhere without measuring',
        ownerContext:
          "Evaluate whether the developer measures before optimizing. The correct first step is: run the React Profiler, identify which components re-render and how long each takes. Evaluate: (1) do they use useMemo for the expensive computations (filter, sort, stats)? (2) do they consider debouncing the search input (300ms delay) as a quick win that avoids the render entirely? (3) do they suggest React.memo for DataTable? (4) do they mention virtualization for the 500 rows? Give credit for: proposing debounce as the simplest fix (zero code complexity), correctly applying useMemo (with proper dependency arrays), and stating that useCallback for `onSort` only matters if DataTable is memoized — otherwise it's useless. Deduct for blindly wrapping everything in useMemo without explaining the dependency arrays.",
      },
    ],
  },

  {
    id: uuidv5('exercise-041-accessibility-audit'),
    title: 'The Accessibility Audit',
    description: `Your product just got a complaint from a major enterprise customer: their employees who use screen readers cannot use the main workflow. You inspect the code and find:

\`\`\`tsx
function TaskList({ tasks, onComplete }) {
  return (
    <div className="task-list">
      {tasks.map(task => (
        <div key={task.id} className="task-item" onClick={() => onComplete(task.id)}>
          <div className="task-icon">
            {task.completed ? '\u2713' : '\u25CB'}
          </div>
          <div className="task-title">{task.title}</div>
          <div className="task-date" style={{ color: '#999' }}>
            {task.dueDate}
          </div>
          <div className="delete-btn" onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}>
            \u00d7
          </div>
        </div>
      ))}
    </div>
  )
}
\`\`\`

Identify every accessibility problem. Fix the component. Explain WCAG guidelines relevant to each fix.`,
    duration: 20,
    difficulty: 'medium',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['frontend', 'accessibility', 'wcag'],
    topics: ['accessibility', 'wcag', 'aria', 'semantic-html', 'screen-readers', 'keyboard-navigation'],
    variations: [
      {
        ownerRole: 'Accessibility specialist who has audited 50+ web applications and conducted usability testing with screen reader users',
        ownerContext:
          "Multiple accessibility failures to identify: (1) `div` with `onClick` is not keyboard-focusable or announced as interactive — use `button` or `role='button'` with `tabIndex={0}` and `onKeyDown`; (2) the checkmark/circle icons are visual-only — screen readers need `aria-label` or a visually-hidden text label; (3) the delete button `\u00d7` has no accessible label — use `aria-label='Delete task: {task.title}'`; (4) the `#999` text color on white likely fails WCAG 2.1 AA contrast ratio (4.5:1 minimum) — `#999` on white is 2.85:1; (5) the task list has no semantic structure — use `ul`/`li` so screen readers announce 'list of N items'; (6) no `role='checkbox'` or `aria-checked` for the completion toggle. Evaluate whether the developer identifies at least 4 of these. Give credit for: citing specific WCAG criteria (1.4.3 for contrast, 2.1.1 for keyboard, 4.1.2 for name/role/value), providing corrected code, and explaining how to test with a screen reader.",
      },
      {
        ownerRole: 'Frontend tech lead who needs the team to write accessible code by default, not as an afterthought audit',
        ownerContext:
          "Evaluate whether the developer proposes systemic fixes, not just component fixes. Can they set up: (1) an ESLint plugin (eslint-plugin-jsx-a11y) that catches div-with-onClick and missing aria-labels at build time? (2) automated contrast checking in the design system? (3) a testing approach (axe-core in integration tests)? For the component fix, evaluate semantic HTML usage: the task list should be a `ul` with `li` items, each interactive element should be a `button`, and the completion toggle should be a checkbox. Give credit for: fixing all the issues in the code, proposing preventive measures (linting, automated tests), and explaining the business impact (enterprise customers require VPAT/WCAG compliance — this is not optional).",
      },
    ],
  },

  {
    id: uuidv5('exercise-042-form-validation'),
    title: 'The Form Validation Strategy',
    description: `Your multi-step registration form has 4 steps with 15 total fields. The current implementation validates everything on final submission — users fill out all 4 steps and then see 8 errors on fields they completed 3 minutes ago. The PM wants inline validation (validate as you go).

\`\`\`typescript
// Current validation — runs on submit
function validateForm(data: RegistrationData): string[] {
  const errors: string[] = []
  if (!data.email) errors.push('Email is required')
  if (!data.email.includes('@')) errors.push('Email is invalid')
  if (data.password.length < 8) errors.push('Password must be 8+ characters')
  if (data.password !== data.confirmPassword) errors.push('Passwords do not match')
  if (!data.companyName && data.accountType === 'business') errors.push('Company name required for business accounts')
  // ... 10 more validations
  return errors
}
\`\`\`

Redesign the validation strategy. Show: (1) when each field validates (on blur, on change, on step transition), (2) how you handle cross-field dependencies, (3) the schema definition approach, (4) how server-side validation errors integrate with client-side errors.`,
    duration: 15,
    difficulty: 'easy',
    type: 'code',
    category: 'frontend',
    languages: ['typescript'],
    tags: ['frontend', 'forms', 'validation'],
    topics: ['form-validation', 'zod', 'react-hook-form', 'multi-step-forms', 'user-experience', 'schema-validation'],
    variations: [
      {
        ownerRole: 'Senior frontend engineer who has built form-heavy enterprise applications and has strong opinions about validation UX',
        ownerContext:
          "Evaluate the validation strategy for UX correctness. The right approach: validate on blur (when the user leaves a field), not on change (annoying while typing). Cross-field validation (password match, company name conditional) should validate on the dependent field's blur. Step transition should validate all fields in the current step — don't let the user proceed with invalid data. Schema approach: use Zod with per-step schemas and a combined schema for final submission. Server-side errors should map to specific fields (not a generic error banner) using the same field keys as client validation. Evaluate: (1) do they handle the 'premature validation' problem — don't show 'email is required' before the user has even clicked the field? (2) do they use touched/dirty state to avoid showing errors on untouched fields? (3) do they integrate with react-hook-form or a similar library? Give credit for: a clear validation timing strategy, Zod schema per step, and proper error display UX.",
      },
      {
        ownerRole: 'UX designer who has tested registration flows with 200+ users and knows exactly where form abandonment happens',
        ownerContext:
          "Evaluate from the user's perspective. The #1 cause of form abandonment is seeing a wall of errors after completing the form. The fix: show errors incrementally as the user interacts with each field. Evaluate: (1) does the developer validate on blur, not on mount? (2) for the password match field — do they validate `confirmPassword` when either `password` or `confirmPassword` changes (the user might fix the password field first)? (3) do they show a progress indicator per step that includes validation status? (4) do they handle the 'email already exists' server error gracefully — this can only be validated server-side, so the form needs to handle async validation results. Give credit for: a user-centered validation flow, handling async server validation (email uniqueness check on blur), and acknowledging that the final submit validation is still needed as a safety net even with inline validation.",
      },
    ],
  },

  {
    id: uuidv5('exercise-043-realtime-updates'),
    title: 'The Real-Time Updates Decision',
    description: `Your project management app needs real-time updates: when one user moves a task on the board, other users viewing the same board should see it move. Currently, users must refresh to see changes.

The team proposes three approaches:
- **Option A:** Polling every 5 seconds
- **Option B:** Server-Sent Events (SSE)
- **Option C:** WebSockets

Evaluate each option for this specific use case. Make a recommendation. Then address the follow-up question: "What happens when 500 users are viewing the same board simultaneously?"`,
    duration: 20,
    difficulty: 'medium',
    type: 'chat',
    category: 'frontend',
    languages: [],
    tags: ['frontend', 'real-time', 'websockets'],
    topics: ['real-time-updates', 'websockets', 'server-sent-events', 'polling', 'scalability', 'connection-management'],
    variations: [
      {
        ownerRole: 'Staff engineer who has implemented real-time features at a company with 100k concurrent WebSocket connections and knows the infrastructure implications',
        ownerContext:
          "Evaluate the developer's analysis of each option. Polling: simplest to implement, works with existing HTTP infrastructure, but wastes bandwidth (99% of polls return no changes) and has 0-5s latency. SSE: unidirectional (server to client), works over HTTP/2, auto-reconnects, but is one-way — if the app needs client-to-server real-time (e.g., live cursors), SSE isn't enough. WebSockets: bidirectional, low latency, but requires sticky sessions or a pub/sub layer (Redis) for multi-server deployments. For a task board: SSE is likely the best fit — updates flow from server to client, and task moves are triggered by regular HTTP requests. For 500 concurrent users on one board: the developer should address connection limits (each SSE/WebSocket connection holds an open connection), memory usage per connection, and fan-out (one task move must be broadcast to 499 other connections). Give credit for: recommending SSE with clear justification, addressing the 500-user fan-out problem (pub/sub with Redis or a message broker), and noting that polling might be acceptable if the team has limited infrastructure capacity.",
      },
      {
        ownerRole: 'Frontend developer who has implemented optimistic UI updates and needs real-time sync to handle conflicts gracefully',
        ownerContext:
          "Evaluate from the client-side perspective. The developer should consider: (1) optimistic updates — when a user moves a task, the UI updates immediately before the server confirms; (2) conflict resolution — what if two users move the same task at the same time? Last-write-wins, or show a conflict? (3) reconnection handling — when the SSE/WebSocket connection drops, how does the client catch up on missed events (event IDs, timestamps)? (4) state reconciliation — after reconnection, does the client re-fetch the entire board or replay missed events? Give credit for: addressing optimistic updates + server confirmation, proposing a reconnection strategy with catch-up, handling the concurrent edit problem, and considering the mobile case (mobile browsers aggressively close background connections — how does the app handle that?).",
      },
    ],
  },
]
