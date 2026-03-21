# Spec 014: Admin UI

> **Status:** ready-to-implement
> **Depends on:** Spec 009 (HTTP routes — `requireCreator`, admin endpoints)
> **Priority:** Off critical path — implement after core loop works end-to-end

---

## What this spec covers

Phase 0 Admin UI — Exercises section only. All other sections (Users, Sessions, Analytics) rendered as disabled skeleton with "coming in Phase 1" labels.

Access: `requireCreator` middleware — only the user whose `githubId` matches `CREATOR_GITHUB_ID` env var can access `/admin/*`.

---

## 1. Route structure

Admin UI is a section within the same React app, protected by a `RequireCreator` guard.

```
/admin                    → redirect to /admin/exercises
/admin/exercises          → Exercise List
/admin/exercises/new      → New Exercise form
/admin/exercises/:id      → Edit Exercise (Phase 1)
```

Add to `App.tsx`:

```typescript
import { RequireCreator } from './components/RequireCreator'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminExercisesPage } from './pages/admin/AdminExercisesPage'
import { AdminNewExercisePage } from './pages/admin/AdminNewExercisePage'

// Inside <Route element={<RequireAuth />}>:
<Route path="/admin" element={<RequireCreator><AdminLayout /></RequireCreator>}>
  <Route index element={<Navigate to="/admin/exercises" replace />} />
  <Route path="exercises" element={<AdminExercisesPage />} />
  <Route path="exercises/new" element={<AdminNewExercisePage />} />
</Route>
```

---

## 2. `RequireCreator` component

The API returns a 403 if the user is not the creator. The client needs to detect this.

Add `isCreator` to the `UserDTO` response from `GET /auth/me`:

```typescript
// packages/shared/src/types.ts — add field
export interface UserDTO {
  id: string
  username: string
  avatarUrl: string
  createdAt: string
  isCreator: boolean   // ← ADD: true if githubId === CREATOR_GITHUB_ID
}
```

```typescript
// apps/web/src/components/RequireCreator.tsx
import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireCreator({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) return null
  if (!user.isCreator) return <Navigate to="/" replace />
  return <>{children}</>
}
```

Add `isCreator` to `GET /auth/me` response in the API:

```typescript
// apps/api/src/infrastructure/http/routes/practice.ts — update /auth/me handler
practiceRoutes.get('/auth/me', requireAuth, (c) => {
  const user = c.var.user
  const creatorId = process.env['CREATOR_GITHUB_ID'] ?? ''
  return c.json({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    isCreator: user.githubId === creatorId,
  })
})
```

---

## 3. Admin layout

### `apps/web/src/pages/admin/AdminLayout.tsx`

```typescript
import { NavLink, Outlet } from 'react-router-dom'

const NAV_ITEMS = [
  { path: '/admin/exercises', label: 'Exercises', active: true },
  { path: '/admin/users', label: 'Users', active: false },
  { path: '/admin/sessions', label: 'Sessions', active: false },
  { path: '/admin/analytics', label: 'Analytics', active: false },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-base flex">
      {/* Sidebar */}
      <nav className="w-48 border-r border-border bg-surface p-4 shrink-0">
        <div className="font-mono text-primary mb-6">
          dojo<span className="text-accent">_</span>
          <span className="text-muted text-xs ml-1">admin</span>
        </div>
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ path, label, active }) =>
            active ? (
              <li key={path}>
                <NavLink
                  to={path}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-sm text-sm font-mono transition-colors ${
                      isActive ? 'bg-accent/10 text-accent' : 'text-secondary hover:text-primary'
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ) : (
              <li key={path}>
                <span className="block px-3 py-2 rounded-sm text-sm font-mono text-muted cursor-not-allowed">
                  {label}
                  <span className="block text-xs text-muted/60 mt-0.5">Phase 1</span>
                </span>
              </li>
            )
          )}
        </ul>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
```

---

## 4. Exercise List — `AdminExercisesPage`

### API types needed

The admin exercise list needs `sessionCount` and `avgScore` per exercise. These require a new admin-specific endpoint (Spec 009 defines the `/admin/exercises` GET route).

```typescript
// Additional type in apps/web/src/lib/api.ts
export interface AdminExerciseDTO {
  id: string
  title: string
  type: string
  difficulty: string
  duration: number
  status: string
  sessionCount: number
  avgScore: number | null   // null when no sessions exist
  variationCount: number
  createdAt: string
}

// Add to api object:
getAdminExercises: () => request<AdminExerciseDTO[]>('/admin/exercises'),
```

### `apps/web/src/pages/admin/AdminExercisesPage.tsx`

```typescript
export function AdminExercisesPage() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<AdminExerciseDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAdminExercises()
      .then(setExercises)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xl text-primary">Exercises</h1>
        <button
          onClick={() => navigate('/admin/exercises/new')}
          className="px-4 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
        >
          + New exercise
        </button>
      </div>

      {loading ? (
        <div className="text-muted font-mono text-sm">Loading...</div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">Title</th>
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">Type</th>
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">Difficulty</th>
                <th className="text-right px-4 py-2 text-muted font-mono text-xs uppercase">Sessions</th>
                <th className="text-right px-4 py-2 text-muted font-mono text-xs uppercase">Avg score</th>
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {exercises.map((ex) => (
                <tr key={ex.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 text-primary">{ex.title}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={ex.type as ExerciseType} />
                  </td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={ex.difficulty as Difficulty} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-secondary">{ex.sessionCount}</td>
                  <td className="px-4 py-3 text-right font-mono text-secondary">
                    {ex.avgScore !== null ? `${Math.round(ex.avgScore * 100)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ex.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'text-success border border-success/30',
    draft: 'text-muted border border-muted/30',
    archived: 'text-danger border border-danger/30',
  }
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${styles[status] ?? styles.draft}`}>
      {status.toUpperCase()}
    </span>
  )
}
```

---

## 5. New Exercise form — `AdminNewExercisePage`

### `apps/web/src/pages/admin/AdminNewExercisePage.tsx`

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Difficulty, ExerciseType } from '@dojo/shared'
import { TOPICS } from '@dojo/shared'

interface VariationDraft {
  ownerRole: string
  ownerContext: string
}

interface FormState {
  title: string
  description: string
  duration: number
  difficulty: Difficulty
  type: ExerciseType
  languages: string[]
  tags: string[]
  topics: string[]
  variations: VariationDraft[]
}

const INITIAL: FormState = {
  title: '',
  description: '',
  duration: 20,
  difficulty: 'medium',
  type: 'code',
  languages: [],
  tags: [],
  topics: [],
  variations: [{ ownerRole: '', ownerContext: '' }],
}

export function AdminNewExercisePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateVariation(index: number, field: keyof VariationDraft, value: string) {
    const next = form.variations.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    update('variations', next)
  }

  function addVariation() {
    update('variations', [...form.variations, { ownerRole: '', ownerContext: '' }])
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await api.createExercise(form)
      navigate('/admin/exercises')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xl text-primary">New Exercise</h1>
        <button
          onClick={() => navigate('/admin/exercises')}
          className="text-muted font-mono text-sm hover:text-secondary"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-sm text-danger text-sm font-mono">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="admin-input"
            placeholder="The N+1 You Didn't Write"
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className="admin-input h-48"
            placeholder="Markdown supported. Include code blocks with triple backticks."
          />
        </Field>

        {/* Type + Difficulty + Duration */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Type">
            <select
              value={form.type}
              onChange={(e) => update('type', e.target.value as ExerciseType)}
              className="admin-input"
            >
              <option value="code">CODE</option>
              <option value="chat">CHAT</option>
              <option value="whiteboard">WHITEBOARD</option>
            </select>
          </Field>
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(e) => update('difficulty', e.target.value as Difficulty)}
              className="admin-input"
            >
              <option value="easy">EASY</option>
              <option value="medium">MEDIUM</option>
              <option value="hard">HARD</option>
            </select>
          </Field>
          <Field label="Duration (min)">
            <select
              value={form.duration}
              onChange={(e) => update('duration', Number(e.target.value))}
              className="admin-input"
            >
              {[10, 15, 20, 30, 45].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Topics — chip input from canonical vocabulary */}
        <Field label="Topics">
          <ChipSelect
            options={TOPICS as unknown as string[]}
            selected={form.topics}
            onChange={(topics) => update('topics', topics)}
            placeholder="Select topics..."
          />
        </Field>

        {/* Languages + Tags — free-form chip input */}
        <Field label="Languages">
          <ChipInput
            value={form.languages}
            onChange={(v) => update('languages', v)}
            placeholder="Add language (Enter)..."
          />
        </Field>

        <Field label="Tags">
          <ChipInput
            value={form.tags}
            onChange={(v) => update('tags', v)}
            placeholder="Add tag (Enter)..."
          />
        </Field>

        {/* Variations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-muted text-xs font-mono uppercase tracking-wider">Variations</label>
            {form.variations.length < 3 && (
              <button
                onClick={addVariation}
                className="text-accent font-mono text-xs hover:text-accent/80"
              >
                + Add variation
              </button>
            )}
          </div>
          <div className="space-y-4">
            {form.variations.map((v, i) => (
              <div key={i} className="p-4 bg-surface border border-border rounded-sm space-y-3">
                <div className="text-muted text-xs font-mono">Variation {i + 1}</div>
                <Field label="Owner Role">
                  <input
                    value={v.ownerRole}
                    onChange={(e) => updateVariation(i, 'ownerRole', e.target.value)}
                    className="admin-input"
                    placeholder="Senior Rails engineer with 8 years..."
                  />
                </Field>
                <Field label="Owner Context">
                  <textarea
                    value={v.ownerContext}
                    onChange={(e) => updateVariation(i, 'ownerContext', e.target.value)}
                    className="admin-input h-32"
                    placeholder="Evaluate the developer's ability to..."
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !form.title || !form.description || form.variations.length === 0}
          className="w-full py-3 bg-accent text-primary font-mono rounded-sm hover:bg-accent/90 disabled:opacity-40"
        >
          {saving ? 'Saving...' : 'Save exercise'}
        </button>
      </div>
    </div>
  )
}

// Simple field wrapper
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-muted text-xs font-mono uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
```

### Shared admin CSS (add to `main.css`)

```css
/* Admin form inputs — shared style via @layer */
@layer components {
  .admin-input {
    @apply w-full bg-surface border border-border rounded-sm px-3 py-2 text-primary text-sm font-sans resize-none focus:outline-none focus:border-accent transition-colors;
  }
}
```

---

## 6. Chip components

### `apps/web/src/components/ui/ChipSelect.tsx`

Canonical vocabulary picker — only allows predefined values.

```typescript
interface ChipSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export function ChipSelect({ options, selected, onChange, placeholder }: ChipSelectProps) {
  const [query, setQuery] = useState('')

  const filtered = query
    ? options.filter((o) => o.includes(query) && !selected.includes(o))
    : []

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((s) => s !== value)
        : [...selected, value]
    )
  }

  return (
    <div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selected.map((s) => (
            <button
              key={s}
              onClick={() => toggle(s)}
              className="font-mono text-xs px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 rounded-sm hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors"
            >
              {s} ×
            </button>
          ))}
        </div>
      )}
      {/* Search input */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="admin-input"
        placeholder={placeholder}
      />
      {/* Dropdown */}
      {filtered.length > 0 && (
        <div className="mt-1 border border-border rounded-sm bg-surface max-h-40 overflow-y-auto">
          {filtered.map((o) => (
            <button
              key={o}
              onClick={() => { toggle(o); setQuery('') }}
              className="w-full text-left px-3 py-1.5 text-secondary text-xs font-mono hover:bg-elevated transition-colors"
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

### `apps/web/src/components/ui/ChipInput.tsx`

Free-form chip input for languages and tags.

```typescript
interface ChipInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}

export function ChipInput({ value, onChange, placeholder }: ChipInputProps) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim().toLowerCase()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-surface border border-border rounded-sm focus-within:border-accent transition-colors min-h-10">
      {value.map((v) => (
        <span key={v} className="font-mono text-xs px-2 py-0.5 bg-elevated text-secondary rounded-sm flex items-center gap-1">
          {v}
          <button onClick={() => onChange(value.filter((x) => x !== v))} className="text-muted hover:text-danger">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={add}
        className="bg-transparent border-none outline-none text-primary text-sm flex-1 min-w-24"
        placeholder={value.length === 0 ? placeholder : ''}
      />
    </div>
  )
}
```

---

## 7. API additions for admin

Add to `apps/web/src/lib/api.ts`:

```typescript
createExercise: (data: FormState) =>
  request<{ id: string }>('/admin/exercises', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

getAdminExercises: () => request<AdminExerciseDTO[]>('/admin/exercises'),
```

---

## 8. Backend — `/admin/exercises` GET endpoint

This requires a new use case: `GetAdminExercises`. Add to spec 009 implementation:

```typescript
// GET /admin/exercises
adminRoutes.get('/exercises', async (c) => {
  const rows = await c.get('db').execute(sql`
    SELECT
      e.id, e.title, e.type, e.difficulty, e.duration, e.status, e.created_at,
      COUNT(DISTINCT v.id) as variation_count,
      COUNT(DISTINCT s.id) as session_count,
      AVG(
        CASE
          WHEN a.verdict IN ('passed', 'passed_with_notes') THEN 1.0
          ELSE 0.0
        END
      ) FILTER (WHERE a.is_final_evaluation = true) as avg_score
    FROM exercises e
    LEFT JOIN variations v ON v.exercise_id = e.id
    LEFT JOIN sessions s ON s.exercise_id = e.id
    LEFT JOIN attempts a ON a.session_id = s.id
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `)
  return c.json(rows)
})
```

---

## 9. Test matrix

| Test | What to verify |
|---|---|
| `RequireCreator` — non-creator | Redirects to `/` |
| `RequireCreator` — creator | Renders children |
| `AdminLayout` — nav items | Active items navigable, Phase 1 items disabled |
| `AdminExercisesPage` — table renders | Shows title, type badge, session count, avg score |
| `AdminExercisesPage` — avg score null | Displays `—` |
| `AdminNewExercisePage` — save disabled | When title or description empty |
| `AdminNewExercisePage` — add variation | Renders second variation form |
| `AdminNewExercisePage` — topics picker | Shows canonical TOPICS, adds/removes as chips |
| `ChipInput` — Enter adds chip | Input cleared, chip appears |
| `ChipInput` — Backspace removes last | Last chip removed when input empty |
| `ChipSelect` — filters options | Dropdown shows only matching options |
