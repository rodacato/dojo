# PRD-002: API Design — Endpoints, Auth, Roles & Contracts

> **Status:** exploring
> **Date:** 2026-03-21
> **Author:** Claude (Kira + panel: Tomás, Marta, Darius)

---

## Idea in one sentence

Define the complete HTTP + WebSocket API surface that the frontend needs, including auth flow, roles, and request/response contracts.

---

## What already exists (from specs 005–007)

- `GET /auth/github` — initiates OAuth flow
- `GET /auth/github/callback` — token exchange, upsert user, create session, set cookie
- `DELETE /auth/session` — logout
- `GET /health` — liveness check
- `globalLimiter`, `authLimiter`, `sessionLimiter` — rate limiting middleware
- `requireAuth` middleware — validates cookie → DB session → sets `c.var.user`

---

## Roles

Three roles, determined by user record:

| Role | Who | Access |
|---|---|---|
| `anonymous` | No session cookie | Public pages only |
| `practitioner` | Invited user with valid session | All authenticated routes |
| `creator` | User where `users.is_creator = true` | Everything + `/admin/*` |

> ⚠ Open question: `is_creator` flag does not exist in the current schema. Two options:
> - **Option A:** Add `is_creator BOOLEAN DEFAULT false` to `users` table — simple, explicit.
> - **Option B:** Derive from a hardcoded `CREATOR_GITHUB_ID` env var — no schema change, safe for solo operation.
>
> **Tomás recommends Option B for Phase 0** — one creator, no need for a role column. Add the column in Phase 1 when admin delegation becomes relevant.

---

## Route map

### Public routes (no auth required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Redirect → `/login` if unauth, `/dashboard` if auth |
| `GET` | `/health` | Liveness check ✅ exists |
| `POST` | `/access-requests` | Submit a "request access" form (Phase 1) |
| `GET` | `/invite` | Validate invite token (returns token metadata) |
| `POST` | `/invite/redeem` | Redeem invite token → create user → set session |

### Auth routes (rate-limited)

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/github` | Initiate OAuth ✅ exists |
| `GET` | `/auth/github/callback` | Complete OAuth ✅ exists |
| `DELETE` | `/auth/session` | Logout ✅ exists |
| `GET` | `/auth/me` | Return current user (for frontend bootstrap) |

### Practice routes (requires `practitioner` or `creator`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/exercises` | Get 3 eligible exercises (filtered by mood + duration) |
| `POST` | `/sessions` | Start a new session (creates session + generates body) |
| `GET` | `/sessions/:id` | Get session with attempts (for reconnection after page refresh) |
| `POST` | `/sessions/:id/attempts` | Submit a response — triggers evaluation stream via WebSocket |
| `WS` | `/ws/sessions/:id` | WebSocket for streaming evaluation (see contract below) |

### User / social routes (requires auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/dashboard` | Streak, today's session, recent activity |
| `GET` | `/users/:username` | Public profile data |
| `GET` | `/leaderboard` | Consistency-ranked list (query: `?period=month\|all`) |
| `GET` | `/badges` | Current user's earned badges |

### Admin routes (requires `creator`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/exercises` | All exercises with stats (paginated) |
| `POST` | `/admin/exercises` | Create new exercise + variation |
| `GET` | `/admin/exercises/:id` | Get single exercise for editing |
| `PUT` | `/admin/exercises/:id` | Update exercise |
| `PATCH` | `/admin/exercises/:id/status` | Publish / archive / draft |
| `POST` | `/admin/exercises/:id/variations` | Add variation to exercise |
| `GET` | `/admin/sessions` | All sessions (for monitoring) |
| `GET` | `/admin/users` | All users |
| `GET` | `/admin/queue` | Pending exercises (Phase 3: user submissions) |
| `POST` | `/admin/invites` | Generate invite token |

---

## Request/response contracts

### `GET /exercises`

Query params: `mood=focused|regular|low_energy`, `maxDuration=10|20|30|45`

```typescript
// Response 200
ExerciseDTO[]  // exactly 3, from packages/shared
```

Rate-limited by `sessionLimiter` (5/hr) — each call commits the user to the returned exercises.

---

### `POST /sessions`

```typescript
// Request body
{
  exerciseId: string  // UUID — the chosen exercise from the 3 returned
}

// Response 201
SessionDTO  // from packages/shared
// body is populated (generated at session creation)
```

> ⚠ Design decision: Who generates the session body?
> Per `docs/ARCHITECTURE.md`, the `StartSession` use case calls `LLMPort` to generate the body. This means `POST /sessions` is an async-feeling call that makes an LLM request. For Phase 0 this is acceptable (body generation is fast). In production, consider a loading state on the frontend.

---

### `POST /sessions/:id/attempts`

Submits the user's response. The evaluation streams back via WebSocket, not via the HTTP response.

```typescript
// Request body
{
  userResponse: string
}

// Response 202 (Accepted — evaluation streams via WebSocket)
{
  attemptId: string
}
```

The frontend should open the WebSocket before submitting, or immediately after receiving the `202`.

---

### WebSocket: `WS /ws/sessions/:id`

**Auth:** Session cookie passed in the upgrade request headers. `requireAuth` middleware validates it on upgrade — if invalid, the connection is rejected with `4001 Unauthorized` before any data is exchanged.

**Connection lifecycle:**

```
Client → connect (with session cookie)
Server → validates auth + session ownership
Server → sends {type: "ready"}

Client → sends {type: "submit", attemptId: string}
Server → sends {type: "token", content: string}  // N times (streaming)
Server → sends {type: "evaluation", result: EvaluationResult}  // final
Server → sends {type: "complete", isFinal: boolean}

// If isFinal = false (follow-up available):
Client → sends {type: "submit", attemptId: string}  // up to 2 more times
// If isFinal = true:
Server → closes connection with 1000 Normal Closure
```

**Error states:**

```
{type: "error", code: "LLM_STREAM_ERROR" | "SESSION_NOT_FOUND" | "ATTEMPT_LIMIT_REACHED"}
```

On `LLM_STREAM_ERROR`: session stays active, user can resubmit. Not a session failure.
On `ATTEMPT_LIMIT_REACHED`: the sensei delivers a final verdict regardless (enforced at application layer).

---

### `GET /dashboard`

```typescript
// Response 200
{
  streak: number
  lastPracticed: string | null  // ISO date
  heatmap: Array<{ date: string; practiced: boolean; passed: boolean }>  // 30 days
  today: {
    completed: boolean
    session: SessionDTO | null
  }
  recent: Array<SessionDTO & { exerciseTitle: string; verdict: Verdict | null }>  // 4 items
}
```

---

### `GET /users/:username`

```typescript
// Response 200
{
  user: UserDTO
  stats: {
    totalKata: number
    passRate: number        // 0–1
    avgTime: number         // minutes
    languages: string[]     // top 3
  }
  heatmap: Array<{ date: string; practiced: boolean; passed: boolean }>  // 90 days
  recentKata: Array<{ exerciseTitle: string; type: ExerciseType; verdict: Verdict; duration: number }>
  badges: BadgeDTO[]        // earned only
}

// Response 404 if username not found
```

---

### `GET /leaderboard`

Query: `?period=month|all` (default: `month`)

```typescript
// Response 200
{
  period: "month" | "all"
  entries: Array<{
    rank: number
    user: Pick<UserDTO, "username" | "avatarUrl">
    streak: number
    kataCount: number
    passRate: number   // 0–1
    lastActive: string // ISO date
    isCurrentUser: boolean
  }>
}
```

---

## Auth flow — full sequence

```
[Browser]                    [Dojo API]                  [GitHub]
   │                              │                           │
   │  GET /auth/github            │                           │
   │ ────────────────────────────>│                           │
   │                              │  generate state + PKCE    │
   │  302 → github.com/login/oauth/authorize                  │
   │ <────────────────────────────│                           │
   │                              │                           │
   │  user authorizes             │                           │
   │ ─────────────────────────────────────────────────────── >│
   │  302 → /auth/github/callback?code=X&state=Y              │
   │ <─────────────────────────────────────────────────────── │
   │                              │                           │
   │  GET /auth/github/callback   │                           │
   │ ────────────────────────────>│                           │
   │                              │  validate state (CSRF)    │
   │                              │  exchange code for token  │
   │                              │ ─────────────────────────>│
   │                              │  access_token             │
   │                              │ <─────────────────────────│
   │                              │  GET /user (github API)   │
   │                              │ ─────────────────────────>│
   │                              │  {login, id, avatar_url}  │
   │                              │ <─────────────────────────│
   │                              │  upsert user              │
   │                              │  create user_session      │
   │  Set-Cookie: session=X       │                           │
   │  302 → /dashboard            │                           │
   │ <────────────────────────────│                           │
```

**Cookie:** `HttpOnly`, `SameSite=Lax`, `Secure` in production. 30-day expiry. No access token stored.

---

## Permissions matrix

| Route | anonymous | practitioner | creator |
|---|---|---|---|
| `GET /health` | ✅ | ✅ | ✅ |
| `GET /auth/github` | ✅ | ✅ | ✅ |
| `POST /access-requests` | ✅ | — | — |
| `GET /exercises` | ❌ 401 | ✅ | ✅ |
| `POST /sessions` | ❌ 401 | ✅ | ✅ |
| `WS /ws/sessions/:id` | ❌ 4001 | ✅ (own sessions only) | ✅ |
| `GET /dashboard` | ❌ 401 | ✅ | ✅ |
| `GET /users/:username` | ✅ (public) | ✅ | ✅ |
| `GET /leaderboard` | ❌ 401 | ✅ | ✅ |
| `GET /admin/*` | ❌ 401 | ❌ 403 | ✅ |

---

## Rate limiting strategy (existing + proposed)

| Limiter | Routes | Limit | Window |
|---|---|---|---|
| `globalLimiter` ✅ | All | 200 req | 15 min |
| `authLimiter` ✅ | `/auth/*` | 10 req | 15 min |
| `sessionLimiter` ✅ | `/sessions`, `/exercises` | 5 req | 1 hr |
| `wsSensei` (proposed) | `WS /ws/sessions/:id` | 1 active connection per user | — |

> Marta's note: **WebSocket connections need a concurrent connection limit**, not a rate limit. A user should not be able to open multiple evaluation streams simultaneously. Enforce at the application layer: when a WebSocket upgrade arrives, check if there is already an active WebSocket for that user's session, and reject with `4008 Policy Violation` if so.

---

## Provisional conclusion

The API surface is well-defined by the screens. The main design decisions that need resolution before implementation:

1. **`is_creator` check** — env var (Phase 0) vs. DB column (Phase 1+). Lean toward env var for now.
2. **Session body generation** — synchronous in `POST /sessions` (acceptable latency for Phase 0) vs. async with a separate status endpoint.
3. **WebSocket concurrent connection enforcement** — required, not optional. One active stream per user.
4. **`/exercises` rate limiting** — `sessionLimiter` (5/hr) feels right. But what happens if all 3 exercises are not suitable? The "No skip. No reroll." rule means this is a non-issue by design — the user picks one of the three.

---

## Next step

- [ ] Advance HTTP routes to spec (spec 009)
- [ ] Advance WebSocket evaluation flow to spec (spec 010)
- [ ] Resolve `is_creator` decision before implementing admin routes
