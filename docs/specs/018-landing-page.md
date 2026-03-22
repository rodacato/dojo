# Spec 018: Landing Page — Static Phase 0

> **Status:** done
> **Depends on:** Spec 013 (frontend core screens)
> **Implements:** PRD-014 (landing page copy)

---

## Overview

Static landing page at `/` for Phase 0. The page serves two purposes: explain the product to visitors, and provide a sign-in entry point for the creator. The "request access" form is static — it does not submit data anywhere.

The `/login` route redirects to `/` (single entry point).

---

## Routing

| Route | Behavior |
|---|---|
| `/` | LandingPage — public |
| `/login` | `<Navigate to="/" replace />` |

If the user is already authenticated, LandingPage redirects to `/dashboard`.

---

## Sections (from PRD-014)

### Nav
- Logo: `dojo_` with blinking cursor
- Sign in link → `${API_URL}/auth/github` (GitHub OAuth flow)

### Hero
- Headline: "The best developers are getting worse."
- Subheadline + body copy from PRD-014
- No CTA button in hero (access form is below)

### The Problem
- Heading: "You can still write code. Can you still think it?"
- 4 paragraphs — cognitive atrophy argument

### How It Works
- Heading: "One kata. One sensei. Every day."
- 5 numbered steps (`01`–`05`) with accent-colored numbers

### What It's Not
- 3 items: "Not a quiz.", "Not a tutor.", "Not a substitute."
- Two-column layout: label (mono, fixed width) + description

### Access — Request Access Form
- Heading: "The dojo is invite-only."
- Form fields:
  - GitHub handle (text input, `@yourhandle` placeholder)
  - "Why you're here" (optional textarea)
  - Submit button: "Request access →"
- **Phase 0:** Form is static — `onSubmit` sets `submitted = true`, no API call
- Post-submit: "Received. No newsletter. No notifications. We'll reach out directly if we have space."

### Footer
- Logo + "Built in public. Invite-only."

---

## File

**Single file:** `apps/web/src/pages/LandingPage.tsx`

- `LandingPage` — main component (exported)
- `RequestAccessForm` — internal component (static form)

---

## Design decisions

- All copy from PRD-014 implemented verbatim
- Sections separated by `<hr>` with `border-border/40`
- Max width `max-w-2xl` centered — readable single column
- Auth error banner (spec 017) is integrated at the top of this page
- No "Build in Public" section or changelog link in Phase 0 (deferred)
- No "The Rules" section in Phase 0 (deferred — content exists in PRD-014)
