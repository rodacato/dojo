# Spec 017: UX Improvements — Error States, Empty States, Session Handling

> **Status:** done
> **Depends on:** Spec 013 (frontend core screens), Spec 005 (rate limiting)
> **Implements:** HIGH severity items from PRD-013 (UX/UI gap analysis)

---

## Overview

This spec addresses the 6 highest-severity UX gaps identified in PRD-013 that were missing from the Phase 0 screens. These are states that would leave the user confused or stuck without proper handling.

---

## 1. OAuth Error State

**File:** `apps/web/src/pages/LandingPage.tsx`

When GitHub OAuth fails or session expires, the landing page displays an error banner based on the `?error=` query parameter:

- `?error=session_expired` → "Your session expired. Sign in again to continue."
- Any other error → "GitHub login failed. Try again or check your GitHub status."

The banner uses `bg-danger/10` with `border-danger/30` — visible but not alarming.

---

## 2. First-Day Empty State

**File:** `apps/web/src/pages/DashboardPage.tsx` — `TodayCard` component

Detection: `isFirstVisit = streak === 0 && recentSessions.length === 0`

| State | Copy | CTA |
|---|---|---|
| First visit (no history) | "Day 1. The dojo opens." | "Enter the dojo →" |
| Return visit, no kata today | "The dojo was empty today." | "Enter the dojo →" |
| Today complete | "Today's kata complete." | None (muted: "Come back tomorrow.") |

---

## 3. Resume CTA — Active Session

**File:** `apps/web/src/pages/DashboardPage.tsx` — `TodayCard` component

If `dashboard.activeSessionId` is not null, TodayCard shows:

- Copy: "You have an active kata."
- CTA: "Resume kata →" — navigates to `/kata/:id`
- Border: `border-accent/30` (visually distinct from other states)

This takes priority over all other TodayCard states.

---

## 4. Timer Expired

**File:** `apps/web/src/pages/KataActivePage.tsx`
**File:** `apps/web/src/components/ui/Timer.tsx`

Timer behavior:
- Color transitions: green (>20%) → amber (>10%) → red (<10%)
- On expiry: calls `onExpired()` → sets `timedOut = true` and auto-triggers submit
- Submit button changes to: red (`bg-danger`) with text "⏱ Time's up — submit now"
- Server enforces 10% grace period; 408 response handled in catch block

---

## 5. Generic Error Page

**File:** `apps/web/src/pages/ErrorPage.tsx`
**Route:** `/error`

Accepts optional `message` prop. Displays:

```
something went wrong
[optional detail message]
[Retry]  [Return to dashboard]
```

- Retry: `window.location.reload()`
- Return: navigates to `/dashboard`

---

## 6. Session Expiry — 401 Global Redirect

**File:** `apps/web/src/lib/api.ts` — `request()` function

All API calls go through the shared `request()` function. On 401:

```typescript
if (res.status === 401) {
  window.location.href = `${window.location.origin}/?error=session_expired`
  throw new Error('Unauthenticated')
}
```

This integrates with the OAuth error banner (item 1) — the landing page handles both OAuth failures and session expiry with the same UI.

---

## Routes affected

| Route | Change |
|---|---|
| `/` (LandingPage) | Error banner from `?error=` param |
| `/dashboard` (DashboardPage) | TodayCard: first-visit, resume, complete states |
| `/kata/:id` (KataActivePage) | Timer expired state + auto-submit |
| `/error` (ErrorPage) | New route — generic error fallback |
| All API calls (api.ts) | 401 → redirect to `/?error=session_expired` |
