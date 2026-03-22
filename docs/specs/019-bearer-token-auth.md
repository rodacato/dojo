# Spec 019: Bearer Token Auth — Replace Cross-Domain Cookies

> **Status:** ready-to-implement
> **Depends on:** Spec 006 (GitHub OAuth), Spec 009 (HTTP routes), Spec 010 (WebSocket)
> **Implements:** PRD-015 (Bearer token auth)

---

## Overview

Replace cookie-based session auth with Bearer tokens. The session model stays the same (server-side, 30-day, DB-backed). Only the transport changes: from `Set-Cookie` / `Cookie` headers to `Authorization: Bearer` / `?token=` query params.

---

## 1. Token storage module (new file)

**File:** `apps/web/src/lib/auth-token.ts`

```typescript
const KEY = 'dojo_token'

export function getToken(): string | null {
  return localStorage.getItem(KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(KEY)
}
```

---

## 2. API client — add Bearer header

**File:** `apps/web/src/lib/api.ts`

Changes to `request()`:
- Remove `credentials: 'include'`
- Add `Authorization: Bearer <token>` header when token exists
- On 401: call `clearToken()` before redirecting

```typescript
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...init?.headers as Record<string, string>,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = `${window.location.origin}/?error=session_expired`
    throw new Error('Unauthenticated')
  }
  // ... rest unchanged
}
```

Add logout method to `api` object:
```typescript
logout: () => request<{ ok: boolean }>('/auth/session', { method: 'DELETE' }),
```

---

## 3. Auth callback page (new file)

**File:** `apps/web/src/pages/AuthCallbackPage.tsx`

```typescript
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { setToken } from '../lib/auth-token'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      setToken(token)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/?error=auth', { replace: true })
    }
  }, [params, navigate])

  return (
    <div className="flex items-center justify-center h-screen bg-base text-muted font-mono text-sm">
      loading...
    </div>
  )
}
```

---

## 4. Add route

**File:** `apps/web/src/App.tsx`

Add to public routes:
```typescript
<Route path="/auth/callback" element={<AuthCallbackPage />} />
```

---

## 5. AuthContext — token-aware

**File:** `apps/web/src/context/AuthContext.tsx`

Changes:
- Only call `api.getMe()` if `getToken()` returns non-null
- Add `logout` function to context
- `logout`: calls `api.logout()`, then `clearToken()`, then `setUser(null)`

---

## 6. API auth middleware — read Bearer header

**File:** `apps/api/src/infrastructure/http/middleware/auth.ts`

Replace:
```typescript
const sessionId = getCookie(c, 'dojo_session')
```

With:
```typescript
const authHeader = c.req.header('Authorization')
const sessionId = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
```

Remove `getCookie` import.

---

## 7. OAuth callback — redirect with token

**File:** `apps/api/src/infrastructure/http/routes/auth.ts`

In `GET /auth/github/callback`, replace:
```typescript
setCookie(c, 'dojo_session', session!.id, { ... })
return c.redirect(config.WEB_URL)
```

With:
```typescript
return c.redirect(`${config.WEB_URL}/auth/callback?token=${session!.id}`)
```

Remove `dojo_session` cookie logic entirely. Keep `oauth_state` cookie unchanged.

---

## 8. Logout route — read Bearer header

**File:** `apps/api/src/infrastructure/http/routes/auth.ts`

In `DELETE /auth/session`, replace:
```typescript
const sessionId = getCookie(c, 'dojo_session')
```

With:
```typescript
const authHeader = c.req.header('Authorization')
const sessionId = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
```

Remove `deleteCookie(c, 'dojo_session')`.

---

## 9. WebSocket auth — query param

**File (API):** `apps/api/src/infrastructure/http/routes/ws.ts`

Replace cookie read with:
```typescript
const url = new URL(c.req.url)
const token = url.searchParams.get('token')
```

**File (Web):** `apps/web/src/hooks/useEvaluationStream.ts`

Change WebSocket URL:
```typescript
const token = getToken()
const ws = new WebSocket(`${WS_URL}/ws/sessions/${sessionId}?token=${token}`)
```

---

## 10. CORS cleanup

**File:** `apps/api/src/infrastructure/http/router.ts`

Change:
```typescript
app.use('*', cors({ origin: config.WEB_URL, credentials: true }))
```

To:
```typescript
app.use('*', cors({ origin: config.WEB_URL }))
```

---

## 11. Revert sameSite change

**File:** `apps/api/src/infrastructure/http/routes/auth.ts`

The `sameSite: 'Lax'` change from the earlier fix attempt gets removed entirely along with the `dojo_session` cookie. The `oauth_state` cookie keeps `sameSite: 'Lax'` (same-domain, works fine).

---

## Security notes (from Marta Kowalczyk review)

- `replace: true` on callback navigation prevents token in browser history
- `Referrer-Policy: strict-origin-when-cross-origin` already set in nginx — token not leaked via referrer
- Server-side session revocation is the primary safety net
- WebSocket URLs should not be logged server-side
- `oauth_state` cookie unchanged — same-domain, short-lived, `sameSite: Lax`

---

## Verification

1. `pnpm typecheck` — no type errors
2. `pnpm test --filter=api` — auth middleware tests pass
3. Manual: click "Sign in" → GitHub → redirected to `/auth/callback?token=...` → dashboard loads
4. Manual: refresh page → still logged in
5. Manual: start kata → WebSocket connects with `?token=`
6. Manual: logout → token cleared → redirected to landing
