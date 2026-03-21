# Spec 013: Frontend — Core Screens

> **Status:** ready-to-implement
> **Depends on:** Spec 009 (HTTP routes), Spec 010 (WebSocket), Spec 011 (adapter), Spec 012 (seed data)
> **Implements:** All 8 core user-facing screens + Tailwind 4 + style guide primitives

---

## Overview

This spec covers the complete frontend implementation for Phase 0. 8 screens in order:

1. Login / Landing (`/login`)
2. Dashboard (`/`)
3. Day Start (`/start`)
4. Kata Selection (`/kata`)
5. Kata Active — CODE (`/kata/:id`)
6. Kata Active — CHAT (`/kata/:id`) — same route, different component based on `session.exercise.type`
7. Sensei Evaluation (`/kata/:id/eval`)
8. Results & Analysis (`/kata/:id/result`)

---

## 1. Setup — Tailwind 4 + Fonts + Design Tokens

### Install dependencies

```bash
pnpm add @tailwindcss/vite --filter=web
pnpm add @fontsource-variable/inter @fontsource-variable/jetbrains-mono --filter=web
pnpm add react-router-dom --filter=web
pnpm add @codemirror/view @codemirror/state @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-sql @codemirror/theme-one-dark --filter=web
```

### `apps/web/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
})
```

### `apps/web/src/styles/main.css`

Entry stylesheet. Import order matters.

```css
/* Fonts */
@import '@fontsource-variable/inter';
@import '@fontsource-variable/jetbrains-mono';

/* Tailwind 4 */
@import 'tailwindcss';

/* Design tokens → Tailwind utilities */
@theme {
  /* Surfaces */
  --color-base:     #0F172A;
  --color-surface:  #1E293B;
  --color-elevated: #253347;
  --color-border:   #334155;

  /* Accent */
  --color-accent:         #6366F1;
  --color-success:        #10B981;
  --color-danger:         #EF4444;
  --color-warning:        #F59E0B;

  /* Text */
  --color-primary:    #F8FAFC;
  --color-secondary:  #94A3B8;
  --color-muted:      #475569;

  /* Type badges */
  --color-type-code:        #64748B;
  --color-type-chat:        #7C3AED;
  --color-type-whiteboard:  #0D9488;

  /* Fonts */
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', monospace;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
}

/* Base */
html {
  background-color: #0F172A;
  color: #F8FAFC;
  font-family: 'Inter Variable', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}
```

**Token usage examples:**
- `bg-base` → background page
- `bg-surface` → cards, panels
- `bg-elevated` → hover states
- `border-border` → all borders
- `text-primary`, `text-secondary`, `text-muted`
- `bg-accent`, `bg-success`, `bg-danger`, `bg-warning`
- `font-mono`, `font-sans`

### `apps/web/src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/main.css'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## 2. App structure and routing

### `apps/web/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { RequireAuth } from './components/RequireAuth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { DayStartPage } from './pages/DayStartPage'
import { KataSelectionPage } from './pages/KataSelectionPage'
import { KataActivePage } from './pages/KataActivePage'
import { SenseiEvalPage } from './pages/SenseiEvalPage'
import { ResultsPage } from './pages/ResultsPage'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/start" element={<DayStartPage />} />
            <Route path="/kata" element={<KataSelectionPage />} />
            <Route path="/kata/:id" element={<KataActivePage />} />
            <Route path="/kata/:id/eval" element={<SenseiEvalPage />} />
            <Route path="/kata/:id/result" element={<ResultsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

### `apps/web/src/context/AuthContext.tsx`

```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserDTO } from '@dojo/shared'
import { api } from '../lib/api'

interface AuthContextValue {
  user: UserDTO | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
```

### `apps/web/src/components/RequireAuth.tsx`

```typescript
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen bg-base text-muted font-mono">loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
```

---

## 3. API client

### `apps/web/src/lib/api.ts`

Typed fetch wrapper. All calls use cookies (no Authorization header).

```typescript
import type { UserDTO, ExerciseDTO } from '@dojo/shared'

// Response types not in shared (dashboard-specific)
export interface DashboardData {
  streak: number
  todayComplete: boolean
  activeSessionId: string | null
  heatmapData: Array<{ date: string; count: number }>
  recentSessions: Array<{
    id: string
    exerciseTitle: string
    exerciseType: string
    difficulty: string
    verdict: string | null
    startedAt: string
  }>
}

export interface SessionWithExercise {
  id: string
  body: string
  status: string
  startedAt: string
  completedAt: string | null
  exercise: ExerciseDTO
  variationId: string
  ownerRole: string
}

export interface StartSessionResponse {
  sessionId: string
}

export interface SubmitAttemptResponse {
  attemptId: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Unauthenticated')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

export const api = {
  getMe: () => request<UserDTO>('/auth/me'),

  getDashboard: () => request<DashboardData>('/dashboard'),

  getExercises: (params: { mood?: string; maxDuration?: number }) => {
    const qs = new URLSearchParams()
    if (params.mood) qs.set('mood', params.mood)
    if (params.maxDuration) qs.set('maxDuration', String(params.maxDuration))
    return request<ExerciseDTO[]>(`/exercises?${qs}`)
  },

  startSession: (exerciseId: string) =>
    request<StartSessionResponse>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ exerciseId }),
    }),

  getSession: (id: string) => request<SessionWithExercise>(`/sessions/${id}`),

  submitAttempt: (sessionId: string, userResponse: string) =>
    request<SubmitAttemptResponse>(`/sessions/${sessionId}/attempts`, {
      method: 'POST',
      body: JSON.stringify({ userResponse }),
    }),
}
```

---

## 4. WebSocket evaluation hook

### `apps/web/src/hooks/useEvaluationStream.ts`

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export interface EvaluationResult {
  verdict: 'passed' | 'passed_with_notes' | 'needs_work'
  analysis: string
  topicsToReview: string[]
  followUpQuestion: string | null
  isFinalEvaluation: boolean
}

export type EvalStreamState =
  | { status: 'idle' }
  | { status: 'connecting' }
  | { status: 'ready' }                          // connected, waiting for submit
  | { status: 'streaming'; tokens: string }      // receiving prose tokens
  | { status: 'evaluation'; result: EvaluationResult; tokens: string } // got result, may need follow-up
  | { status: 'complete'; result: EvaluationResult; tokens: string }   // isFinal=true
  | { status: 'error'; code: string; message: string }

export function useEvaluationStream(sessionId: string) {
  const [state, setState] = useState<EvalStreamState>({ status: 'idle' })
  const wsRef = useRef<WebSocket | null>(null)
  const navigate = useNavigate()

  const connect = useCallback(() => {
    setState({ status: 'connecting' })

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/sessions/${sessionId}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data as string) as WsMessage

      switch (msg.type) {
        case 'ready':
          setState({ status: 'ready' })
          break

        case 'token':
          setState((prev) => ({
            status: 'streaming',
            tokens: (prev.status === 'streaming' ? prev.tokens : '') + msg.chunk,
          }))
          break

        case 'evaluation':
          setState((prev) => ({
            status: 'evaluation',
            result: msg.result,
            tokens: prev.status === 'streaming' ? prev.tokens : '',
          }))
          break

        case 'complete':
          setState((prev) => {
            if (prev.status !== 'evaluation') return prev
            const next: EvalStreamState = { status: 'complete', result: prev.result, tokens: prev.tokens }
            if (prev.result.isFinalEvaluation) {
              // Navigate to results after a short pause
              setTimeout(() => navigate(`/kata/${sessionId}/result`), 1500)
            }
            return next
          })
          break

        case 'error':
          setState({ status: 'error', code: msg.code, message: msg.message ?? msg.code })
          break
      }
    }

    ws.onerror = () => setState({ status: 'error', code: 'WS_ERROR', message: 'Connection error' })
    ws.onclose = (e) => {
      if (e.code === 4001) {
        window.location.href = '/login'
      }
    }
  }, [sessionId, navigate])

  const submit = useCallback((attemptId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'submit', attemptId }))
    setState({ status: 'streaming', tokens: '' })
  }, [])

  const reconnect = useCallback((attemptId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'reconnect', attemptId }))
    setState({ status: 'streaming', tokens: '' })
  }, [])

  useEffect(() => {
    return () => wsRef.current?.close()
  }, [])

  return { state, connect, submit, reconnect }
}

interface WsMessage {
  type: 'ready' | 'token' | 'evaluation' | 'complete' | 'error'
  chunk?: string
  result?: EvaluationResult
  code?: string
  message?: string
  isFinal?: boolean
}
```

---

## 5. Shared UI components

### `apps/web/src/components/ui/Badge.tsx`

```typescript
import type { ExerciseType, Difficulty } from '@dojo/shared'

const TYPE_STYLES: Record<ExerciseType, string> = {
  code: 'bg-type-code text-primary',
  chat: 'bg-type-chat text-primary',
  whiteboard: 'bg-type-whiteboard text-primary',
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: 'text-success border border-success',
  medium: 'text-warning border border-warning',
  hard: 'text-danger border border-danger',
}

export function TypeBadge({ type }: { type: ExerciseType }) {
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${TYPE_STYLES[type]}`}>
      {type.toUpperCase()}
    </span>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded-sm ${DIFFICULTY_STYLES[difficulty]}`}>
      {difficulty.toUpperCase()}
    </span>
  )
}

const VERDICT_STYLES = {
  passed: 'bg-success/10 text-success border border-success/30',
  passed_with_notes: 'bg-warning/10 text-warning border border-warning/30',
  needs_work: 'bg-danger/10 text-danger border border-danger/30',
}

const VERDICT_LABELS = {
  passed: 'PASSED',
  passed_with_notes: 'PASSED WITH NOTES',
  needs_work: 'NEEDS WORK',
}

export function VerdictBadge({ verdict }: { verdict: keyof typeof VERDICT_STYLES }) {
  return (
    <span className={`font-mono text-sm px-3 py-1 rounded-sm ${VERDICT_STYLES[verdict]}`}>
      {VERDICT_LABELS[verdict]}
    </span>
  )
}
```

### `apps/web/src/components/ui/Timer.tsx`

```typescript
import { useEffect, useState } from 'react'

interface TimerProps {
  durationMinutes: number
  startedAt: string  // ISO string
  onExpired?: () => void
}

export function Timer({ durationMinutes, startedAt, onExpired }: TimerProps) {
  const [remaining, setRemaining] = useState<number>(computeRemaining(durationMinutes, startedAt))

  useEffect(() => {
    const interval = setInterval(() => {
      const r = computeRemaining(durationMinutes, startedAt)
      setRemaining(r)
      if (r <= 0) {
        clearInterval(interval)
        onExpired?.()
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [durationMinutes, startedAt, onExpired])

  const pct = remaining / (durationMinutes * 60)
  const colorClass = pct > 0.2 ? 'text-primary' : pct > 0.1 ? 'text-warning' : 'text-danger'

  return (
    <span className={`font-mono text-2xl tabular-nums ${colorClass}`}>
      {formatTime(Math.max(0, remaining))}
    </span>
  )
}

function computeRemaining(durationMinutes: number, startedAt: string): number {
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
  return durationMinutes * 60 - elapsed
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
```

### `apps/web/src/components/ui/StreamingText.tsx`

Renders streaming tokens with a blinking cursor while active.

```typescript
interface StreamingTextProps {
  text: string
  done: boolean
  className?: string
}

export function StreamingText({ text, done, className }: StreamingTextProps) {
  return (
    <p className={`whitespace-pre-wrap ${className ?? ''}`}>
      {text}
      {!done && (
        <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse" aria-hidden />
      )}
    </p>
  )
}
```

### `apps/web/src/components/ui/Heatmap.tsx`

30-day activity heatmap shown on the dashboard.

```typescript
interface HeatmapDay {
  date: string
  count: number
}

interface HeatmapProps {
  data: HeatmapDay[]
}

export function Heatmap({ data }: HeatmapProps) {
  // Build a map of date → count for quick lookup
  const map = new Map(data.map((d) => [d.date, d.count]))

  // Generate the last 30 days
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })

  return (
    <div className="flex gap-1" title="30-day activity">
      {days.map((date) => {
        const count = map.get(date) ?? 0
        const intensity = count === 0 ? 'bg-surface' : count === 1 ? 'bg-accent/40' : 'bg-accent'
        return (
          <div
            key={date}
            className={`w-3 h-3 rounded-sm ${intensity}`}
            title={`${date}: ${count} kata${count !== 1 ? 's' : ''}`}
          />
        )
      })}
    </div>
  )
}
```

---

## 6. CodeMirror setup

### `apps/web/src/components/ui/CodeEditor.tsx`

```typescript
import { useEffect, useRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { sql } from '@codemirror/lang-sql'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: 'javascript' | 'typescript' | 'python' | 'sql'
  placeholder?: string
}

export function CodeEditor({ value, onChange, language = 'javascript', placeholder }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const langExtension = {
      javascript: javascript({ typescript: false }),
      typescript: javascript({ typescript: true }),
      python: python(),
      sql: sql(),
    }[language]

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          oneDark,
          lineNumbers(),
          keymap.of(defaultKeymap),
          langExtension,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChange(update.state.doc.toString())
            }
          }),
          EditorView.theme({
            '&': { height: '100%', fontSize: '14px' },
            '.cm-scroller': { fontFamily: "'JetBrains Mono Variable', monospace" },
          }),
          // No autocomplete, no spell check (per PRD-007 decision #12)
          EditorView.contentAttributes.of({
            spellcheck: 'false',
            autocorrect: 'off',
            autocomplete: 'off',
            autocapitalize: 'off',
          }),
        ],
      }),
      parent: containerRef.current,
    })

    viewRef.current = view
    return () => view.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]) // Recreate only when language changes

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-sm overflow-hidden border border-border"
      aria-label={placeholder ?? 'Code editor'}
    />
  )
}
```

---

## 7. Screen 1 — Login / Landing (`/login`)

### `apps/web/src/pages/LoginPage.tsx`

```typescript
export function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-8 px-4">
      {/* Logo */}
      <div className="text-center">
        <h1 className="font-mono text-4xl text-primary">
          dojo<span className="text-accent animate-pulse">_</span>
        </h1>
        <p className="text-secondary text-sm mt-2">dojo.notdefined.dev</p>
      </div>

      {/* Tagline */}
      <p className="text-secondary text-center max-w-xs">
        The dojo for developers who still have something to prove. To themselves.
      </p>

      {/* GitHub login */}
      <a
        href="/api/auth/github"
        className="flex items-center gap-3 px-6 py-3 bg-surface border border-border rounded-sm text-primary hover:border-accent transition-colors duration-150"
      >
        <GitHubIcon className="w-5 h-5" />
        <span className="font-mono">Continue with GitHub</span>
      </a>

      {/* Invite-only note */}
      <p className="text-muted text-xs text-center">
        Invite-only. We want practitioners, not tourists.
      </p>
    </div>
  )
}
```

---

## 8. Screen 2 — Dashboard (`/`)

### `apps/web/src/pages/DashboardPage.tsx`

```typescript
export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)

  useEffect(() => {
    api.getDashboard().then(setDashboard)
  }, [])

  if (!dashboard) return <PageLoader />

  return (
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <span className="font-mono text-xl text-primary">dojo<span className="text-accent">_</span></span>
        <div className="flex items-center gap-2">
          <img src={user?.avatarUrl} className="w-7 h-7 rounded-sm" alt={user?.username} />
          <span className="text-secondary text-sm font-mono">{user?.username}</span>
        </div>
      </header>

      {/* Streak */}
      <section className="mb-6">
        <div className="font-mono text-2xl text-primary">{dashboard.streak}</div>
        <div className="text-muted text-sm">day streak</div>
        <div className="mt-3">
          <Heatmap data={dashboard.heatmapData} />
        </div>
      </section>

      {/* Today card */}
      <TodayCard
        todayComplete={dashboard.todayComplete}
        activeSessionId={dashboard.activeSessionId}
        onStart={() => navigate('/start')}
        onResume={(id) => navigate(`/kata/${id}`)}
      />

      {/* Recent activity */}
      {dashboard.recentSessions.length > 0 && (
        <section className="mt-8">
          <h2 className="text-secondary text-xs font-mono uppercase tracking-wider mb-3">Recent</h2>
          <div className="space-y-2">
            {dashboard.recentSessions.map((s) => (
              <RecentSessionRow key={s.id} session={s} />
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-12 text-center">
        <p className="text-muted text-xs font-mono">Consistency compounds.</p>
      </footer>
    </div>
  )
}

// Today card — detects active session (PRD-007 decision #13)
function TodayCard({
  todayComplete,
  activeSessionId,
  onStart,
  onResume,
}: {
  todayComplete: boolean
  activeSessionId: string | null
  onStart: () => void
  onResume: (id: string) => void
}) {
  if (activeSessionId) {
    // Resume CTA — skip Day Start flow entirely
    return (
      <div className="bg-surface border border-accent/30 rounded-md p-4">
        <p className="text-secondary text-sm">You have an active kata.</p>
        <button
          onClick={() => onResume(activeSessionId)}
          className="mt-3 w-full py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
        >
          Resume kata →
        </button>
      </div>
    )
  }

  if (todayComplete) {
    return (
      <div className="bg-surface border border-border rounded-md p-4">
        <p className="text-secondary text-sm">Today's kata complete.</p>
        <p className="text-muted text-xs mt-1">Come back tomorrow. The dojo will be here.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-md p-4">
      <p className="text-secondary text-sm">The dojo was empty today.</p>
      <button
        onClick={onStart}
        className="mt-3 w-full py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
      >
        Enter the dojo →
      </button>
    </div>
  )
}
```

---

## 9. Screen 3 — Day Start (`/start`)

### `apps/web/src/pages/DayStartPage.tsx`

```typescript
type Mood = 'focused' | 'regular' | 'low_energy'
type Duration = 10 | 20 | 30 | 45

const MOODS: Array<{ value: Mood; label: string; emoji: string }> = [
  { value: 'focused', label: 'En racha', emoji: '🔥' },
  { value: 'regular', label: 'Regular', emoji: '😐' },
  { value: 'low_energy', label: 'A medias', emoji: '🧠' },
]

const DURATIONS: Duration[] = [10, 20, 30, 45]

export function DayStartPage() {
  const [mood, setMood] = useState<Mood>('regular')
  const [duration, setDuration] = useState<Duration>(20)
  const navigate = useNavigate()

  function handleSubmit() {
    // Store selection for the kata selection page
    sessionStorage.setItem('dojo-start', JSON.stringify({ mood, maxDuration: duration }))
    navigate('/kata')
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <h1 className="font-mono text-xl text-primary text-center">
          How are you showing up today?
        </h1>

        {/* Mood selector */}
        <section>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">Mood</p>
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => setMood(value)}
                className={`py-3 rounded-sm border font-mono text-sm transition-colors duration-150 ${
                  mood === value
                    ? 'border-accent text-primary bg-accent/10'
                    : 'border-border text-secondary hover:border-secondary'
                }`}
              >
                <div>{emoji}</div>
                <div className="text-xs mt-1">{label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Duration selector */}
        <section>
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">Time</p>
          <div className="grid grid-cols-4 gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`py-3 rounded-sm border font-mono text-sm transition-colors duration-150 ${
                  duration === d
                    ? 'border-accent text-primary bg-accent/10'
                    : 'border-border text-secondary hover:border-secondary'
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-accent text-primary font-mono rounded-sm hover:bg-accent/90 transition-colors"
        >
          Show me the kata →
        </button>
      </div>
    </div>
  )
}
```

---

## 10. Screen 4 — Kata Selection (`/kata`)

### `apps/web/src/pages/KataSelectionPage.tsx`

```typescript
export function KataSelectionPage() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<ExerciseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('dojo-start')
    const filters = stored ? JSON.parse(stored) as { mood: string; maxDuration: number } : {}
    api.getExercises(filters)
      .then(setExercises)
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(exerciseId: string) {
    setStarting(exerciseId)
    try {
      const { sessionId } = await api.startSession(exerciseId)
      navigate(`/kata/${sessionId}`)
    } catch {
      setStarting(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-mono text-xl text-primary">Choose your kata.</h1>
        <p className="text-muted text-sm mt-1">No skip. No reroll. These are your exercises.</p>
      </div>

      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onSelect={() => handleSelect(ex.id)}
            loading={starting === ex.id}
          />
        ))}
      </div>
    </div>
  )
}

function ExerciseCard({
  exercise: ex,
  onSelect,
  loading,
}: {
  exercise: ExerciseDTO
  onSelect: () => void
  loading: boolean
}) {
  return (
    <button
      onClick={onSelect}
      disabled={loading}
      className="w-full text-left bg-surface border border-border rounded-md p-4 hover:border-accent transition-colors duration-150 disabled:opacity-50"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <TypeBadge type={ex.type} />
          <DifficultyBadge difficulty={ex.difficulty} />
        </div>
        <span className="font-mono text-secondary text-sm">{ex.duration}m</span>
      </div>
      <h2 className="text-primary font-medium">{ex.title}</h2>
      {ex.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {ex.tags.map((tag) => (
            <span key={tag} className="text-muted text-xs font-mono px-1.5 py-0.5 bg-elevated rounded-sm">
              {tag}
            </span>
          ))}
        </div>
      )}
      {loading && <span className="text-accent font-mono text-xs mt-2 block">Loading kata...</span>}
    </button>
  )
}
```

---

## 11. Screen 5+6 — Kata Active (`/kata/:id`)

CODE and CHAT types share the route. The component switches based on `session.exercise.type`.

### `apps/web/src/pages/KataActivePage.tsx`

```typescript
export function KataActivePage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithExercise | null>(null)
  const [userResponse, setUserResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    api.getSession(sessionId).then((s) => {
      if (s.status !== 'active') {
        // Session already finished — go to results
        navigate(`/kata/${sessionId}/result`, { replace: true })
      } else {
        setSession(s)
      }
    })
  }, [sessionId, navigate])

  async function handleSubmit() {
    if (!session || !sessionId || !userResponse.trim() || submitting) return
    setSubmitting(true)
    try {
      const { attemptId } = await api.submitAttempt(sessionId, userResponse)
      // Store attemptId for the eval page to send via WebSocket
      sessionStorage.setItem(`dojo-attempt-${sessionId}`, attemptId)
      navigate(`/kata/${sessionId}/eval`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 408) {
        // Timer expired server-side
        navigate(`/kata/${sessionId}/result`)
      } else {
        setSubmitting(false)
      }
    }
  }

  if (!session) return <PageLoader />

  const { exercise } = session
  const isCode = exercise.type === 'code'

  return (
    <div className="h-screen bg-base flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface shrink-0">
        <div className="flex items-center gap-3">
          <TypeBadge type={exercise.type} />
          <DifficultyBadge difficulty={exercise.difficulty} />
          <span className="text-secondary text-sm">{exercise.title}</span>
        </div>
        <Timer
          durationMinutes={exercise.duration}
          startedAt={session.startedAt}
          onExpired={() => handleSubmit()}
        />
      </div>

      {/* Split view */}
      <div className={`flex flex-1 overflow-hidden ${isCode ? 'flex-row' : 'flex-col'}`}>
        {/* Left/Top: Problem context */}
        <div className={`overflow-y-auto p-4 border-border ${isCode ? 'w-1/2 border-r' : 'h-1/2 border-b'}`}>
          <div className="text-secondary text-sm prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm text-secondary leading-relaxed">
              {session.body}
            </pre>
          </div>
        </div>

        {/* Right/Bottom: Response area */}
        <div className={`flex flex-col ${isCode ? 'w-1/2' : 'h-1/2'}`}>
          {isCode ? (
            <div className="flex-1">
              <CodeEditor
                value={userResponse}
                onChange={setUserResponse}
                language={resolveLanguage(exercise.language)}
                placeholder="Write your solution..."
              />
            </div>
          ) : (
            <div className="flex flex-col flex-1 p-4 gap-2">
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Write your response..."
                spellCheck={false}
                className="flex-1 bg-surface border border-border rounded-sm p-3 text-primary text-sm font-sans resize-none focus:outline-none focus:border-accent transition-colors"
              />
              <div className="text-muted text-xs font-mono text-right">
                {userResponse.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="p-3 border-t border-border shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!userResponse.trim() || submitting}
              className="w-full py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function resolveLanguage(langs: string[]): 'javascript' | 'typescript' | 'python' | 'sql' {
  if (langs.includes('typescript')) return 'typescript'
  if (langs.includes('python')) return 'python'
  if (langs.includes('sql')) return 'sql'
  return 'javascript'
}
```

---

## 12. Screen 7 — Sensei Evaluation (`/kata/:id/eval`)

### `apps/web/src/pages/SenseiEvalPage.tsx`

```typescript
export function SenseiEvalPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const [session, setSession] = useState<SessionWithExercise | null>(null)
  const [followUpText, setFollowUpText] = useState('')
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false)
  const { state, connect, submit, reconnect } = useEvaluationStream(sessionId!)

  useEffect(() => {
    if (!sessionId) return
    api.getSession(sessionId).then(setSession)
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return
    // Connect WebSocket as soon as the eval page loads
    connect()
  }, [connect, sessionId])

  useEffect(() => {
    if (state.status !== 'ready') return

    // Send the pending attempt via WebSocket
    const attemptId = sessionStorage.getItem(`dojo-attempt-${sessionId}`)
    if (attemptId) {
      submit(attemptId)
      sessionStorage.removeItem(`dojo-attempt-${sessionId}`)
    } else {
      // Reconnect case — no stored attemptId means we reconnected without one
      // The server will handle the missing attempt gracefully
    }
  }, [state.status, sessionId, submit])

  async function handleFollowUp() {
    if (!sessionId || !followUpText.trim() || followUpSubmitting) return
    setFollowUpSubmitting(true)
    const { attemptId } = await api.submitAttempt(sessionId, followUpText)
    setFollowUpText('')
    setFollowUpSubmitting(false)
    submit(attemptId)
  }

  const isStreaming = state.status === 'streaming'
  const hasResult = state.status === 'evaluation' || state.status === 'complete'
  const tokens = (state as { tokens?: string }).tokens ?? ''
  const result = hasResult ? (state as { result: EvaluationResult }).result : null

  return (
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      {/* Sensei header */}
      {session && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-surface border border-border rounded-sm">
          <div className="w-8 h-8 bg-accent/20 rounded-sm flex items-center justify-center text-accent font-mono text-xs">
            S
          </div>
          <div>
            <div className="text-primary text-sm font-medium">{session.ownerRole}</div>
            <div className="text-muted text-xs">Evaluating your submission</div>
          </div>
        </div>
      )}

      {/* Streaming prose */}
      {(tokens || isStreaming) && (
        <div className="mb-6">
          <StreamingText text={tokens} done={!isStreaming} className="text-secondary text-sm leading-relaxed" />
        </div>
      )}

      {/* Error state */}
      {state.status === 'error' && (
        <div className="p-4 bg-danger/10 border border-danger/30 rounded-sm text-danger text-sm font-mono">
          {state.message}
        </div>
      )}

      {/* Connecting/waiting */}
      {(state.status === 'idle' || state.status === 'connecting') && (
        <div className="text-muted font-mono text-sm animate-pulse">
          Connecting to sensei<span className="animate-pulse">...</span>
        </div>
      )}

      {/* Verdict card */}
      {result && (
        <div className="mt-6 p-4 bg-surface border border-border rounded-md">
          <div className="flex items-center justify-between mb-3">
            <VerdictBadge verdict={result.verdict} />
          </div>
          {result.topicsToReview.length > 0 && (
            <div className="mt-3">
              <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">Review</p>
              <div className="flex flex-wrap gap-1">
                {result.topicsToReview.map((t) => (
                  <span key={t} className="text-secondary text-xs font-mono px-2 py-0.5 bg-elevated rounded-sm">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Follow-up question */}
      {result && !result.isFinalEvaluation && result.followUpQuestion && (
        <div className="mt-6">
          <div className="p-3 bg-surface border border-accent/30 rounded-sm mb-3">
            <p className="text-secondary text-sm">{result.followUpQuestion}</p>
          </div>
          <textarea
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            placeholder="Your answer..."
            className="w-full bg-surface border border-border rounded-sm p-3 text-primary text-sm font-sans resize-none h-28 focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={handleFollowUp}
            disabled={!followUpText.trim() || followUpSubmitting || isStreaming}
            className="mt-2 w-full py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 disabled:opacity-40"
          >
            {followUpSubmitting ? 'Sending...' : 'Send follow-up →'}
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## 13. Screen 8 — Results & Analysis (`/kata/:id/result`)

### `apps/web/src/pages/ResultsPage.tsx`

```typescript
export function ResultsPage() {
  const { id: sessionId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<SessionWithExercise | null>(null)
  const [finalAttempt, setFinalAttempt] = useState<AttemptDTO | null>(null)
  const [kataCount, setKataCount] = useState<number | null>(null)

  useEffect(() => {
    if (!sessionId) return
    Promise.all([
      api.getSession(sessionId),
      // Dashboard gives us the kata count for "Your Nth kata this month"
      api.getDashboard(),
    ]).then(([s, dash]) => {
      setSession(s)
      // Count from dashboard: recent sessions this month
      setKataCount(dash.recentSessions.length)
    })
  }, [sessionId])

  if (!session) return <PageLoader />

  // Get the final attempt from session data — the API returns it
  const attempt = finalAttempt ?? (session as unknown as { finalAttempt?: AttemptDTO }).finalAttempt ?? null

  return (
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      {/* Verdict */}
      {attempt?.verdict && (
        <div className="text-center mb-8">
          <div className="font-mono text-4xl uppercase tracking-wider mb-3">
            {VERDICT_DISPLAY[attempt.verdict]}
          </div>
          <VerdictBadge verdict={attempt.verdict} />
        </div>
      )}

      {/* Exercise info */}
      <div className="mb-4">
        <div className="flex gap-2 mb-1">
          <TypeBadge type={session.exercise.type} />
          <DifficultyBadge difficulty={session.exercise.difficulty} />
        </div>
        <h2 className="text-primary font-medium">{session.exercise.title}</h2>
        {kataCount && (
          <p className="text-muted text-sm mt-1 font-mono">
            Your {ordinal(kataCount)} kata this month.
          </p>
        )}
      </div>

      {/* Analysis */}
      {attempt?.analysis && (
        <div className="p-4 bg-surface border border-border rounded-md mb-4">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">Analysis</p>
          <p className="text-secondary text-sm leading-relaxed">{attempt.analysis}</p>
        </div>
      )}

      {/* Topics to review */}
      {attempt?.topicsToReview && attempt.topicsToReview.length > 0 && (
        <div className="p-4 bg-surface border border-border rounded-md mb-4">
          <p className="text-muted text-xs font-mono uppercase tracking-wider mb-2">Topics to review</p>
          <div className="flex flex-wrap gap-1">
            {attempt.topicsToReview.map((t) => (
              <span key={t} className="text-secondary text-xs font-mono px-2 py-0.5 bg-elevated rounded-sm">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-2 border border-border text-secondary font-mono text-sm rounded-sm hover:border-primary transition-colors"
        >
          ← Dashboard
        </button>
      </div>
    </div>
  )
}

const VERDICT_DISPLAY = {
  passed: 'Passed.',
  passed_with_notes: 'Passed.',
  needs_work: 'Needs work.',
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!)
}
```

---

## 14. Shared page components

```typescript
// apps/web/src/components/PageLoader.tsx
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-base">
      <span className="font-mono text-muted animate-pulse">loading<span className="text-accent">_</span></span>
    </div>
  )
}

// apps/web/src/components/GitHubIcon.tsx
export function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385c.6.105.825-.255.825-.57c0-.285-.015-1.23-.015-2.235c-3.015.555-3.795-.735-4.035-1.41c-.135-.345-.72-1.41-1.23-1.695c-.42-.225-1.02-.78-.015-.795c.945-.015 1.62.87 1.845 1.23c1.08 1.815 2.805 1.305 3.495.99c.105-.78.42-1.305.765-1.605c-2.67-.3-5.46-1.335-5.46-5.925c0-1.305.465-2.385 1.23-3.225c-.12-.3-.54-1.53.12-3.18c0 0 1.005-.315 3.3 1.23c.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23c.66 1.65.24 2.88.12 3.18c.765.84 1.23 1.905 1.23 3.225c0 4.605-2.805 5.625-5.475 5.925c.435.375.81 1.095.81 2.22c0 1.605-.015 2.895-.015 3.3c0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
```

---

## 15. `apps/web/package.json` additions

```json
{
  "dependencies": {
    "react-router-dom": "^6.x",
    "@fontsource-variable/inter": "^5.x",
    "@fontsource-variable/jetbrains-mono": "^5.x",
    "@codemirror/view": "^6.x",
    "@codemirror/state": "^6.x",
    "@codemirror/lang-javascript": "^6.x",
    "@codemirror/lang-python": "^6.x",
    "@codemirror/lang-sql": "^6.x",
    "@codemirror/theme-one-dark": "^6.x",
    "@codemirror/commands": "^6.x"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.x"
  }
}
```

---

## 16. Notes and constraints from PRDs

| Constraint | Implementation |
|---|---|
| No skip, no reroll, no pause | `KataSelectionPage` has no reroll button; timer has no pause control |
| Timer: server-side enforcement | Client shows countdown; `handleSubmit` handles 408 response |
| One WebSocket per user | WebSocket closes existing connection with 4008 on new connect — client does not retry |
| Reconnect window: 60s | `useEvaluationStream` supports `reconnect()` call with stored `attemptId` |
| CodeMirror: no autocomplete | `spellcheck=false`, `autocorrect=off`, `autocomplete=off` content attributes |
| Dashboard detects active session | `activeSessionId` non-null → `TodayCard` shows resume CTA |
| Results: "Your Xth kata this month" | Uses `recentSessions.length` from dashboard — not "+N positions" |

---

## 17. Test matrix

| Test | What to verify |
|---|---|
| `Timer` — counts down | Renders correctly, calls `onExpired` at zero |
| `Timer` — color change | Amber at 20%, red at 10% |
| `StreamingText` — cursor visible | Shows blinking cursor when `done=false` |
| `StreamingText` — cursor hidden | No cursor when `done=true` |
| `LoginPage` — already logged in | Redirects to `/` |
| `RequireAuth` — unauthenticated | Redirects to `/login` |
| `DashboardPage` — active session | Shows resume CTA, `onResume` navigates to session |
| `DashboardPage` — today complete | Shows completion message, no CTA |
| `KataSelectionPage` — 3 cards | Renders TypeBadge, DifficultyBadge, duration |
| `KataActivePage` — CODE type | Shows CodeMirror editor |
| `KataActivePage` — CHAT type | Shows textarea + word count |
| `KataActivePage` — 408 on submit | Navigates to result page |
| `SenseiEvalPage` — streaming | Tokens appended, cursor visible |
| `SenseiEvalPage` — follow-up | Shows question + textarea when `isFinalEvaluation=false` |
| `SenseiEvalPage` — complete | Navigates to result after 1.5s |
| `ResultsPage` — verdict | Renders VERDICT_DISPLAY and VerdictBadge |
| `ResultsPage` — topics | Renders `topicsToReview` as chips |
| `useEvaluationStream` — ready → submit | Sends `{type:"submit", attemptId}` |
| `CodeEditor` — no autocomplete | contentEditable attributes set correctly |
