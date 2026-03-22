# PRD-018: Sprint 005 Addendum — Loose Ends Before Close

> **Status:** confirmed
> **Date:** 2026-03-22
> **Author:** Claude (full panel consulted)

---

## Idea in one sentence

Close the gaps between what we built and what production needs before this sprint can ship with confidence.

---

## Why now

Sprint 005 delivered the invitation system, security headers, 404 page, admin edit, and Resend integration. But three things won't work in production without additional changes: deploy config missing new secrets, the request access form is still a dead stub, and the backlog references features already delivered.

---

## Expert panel review

### Marta Kowalczyk (Security)

"The deploy config missing `RESEND_API_KEY` isn't a security issue — the code gracefully skips email if the key is empty. But the `RESEND_FROM_EMAIL` should use a verified domain. Make sure `notdefined.dev` is verified in Resend before deploying, or emails will bounce.

One more thing: the request access form should NOT store email addresses in the database unless you're ready to handle GDPR implications. For Phase 0, just send a notification to the creator. No storage."

### Tomás Ríos (Infra)

"Three deploy items:
1. Add `RESEND_API_KEY` to Kamal secrets in `deploy.api.yml`
2. Add `RESEND_API_KEY` to GitHub Actions workflow env
3. The `RESEND_FROM_EMAIL` can be a clear (non-secret) env var — it's not sensitive

Also: the Kamal config maps env var names to GitHub secrets names. The naming in the workflow uses `OAUTH_CLIENT_ID` but the Kamal config expects `GITHUB_CLIENT_ID`. Make sure the new vars are consistent."

### Priya Menon (Product Strategy)

"The request access form is the most visible broken promise on the site. It says 'Request access' but does nothing. Two options:
1. **Notification to creator** (recommended) — send an email to yourself when someone submits. You see who's interested and can manually create an invite.
2. **Store in DB** — build a queue. Overkill for Phase 0.

Go with option 1. It's one API call and you already have Resend. The form becomes real without adding infrastructure."

### Soren Bachmann (UX)

"The form should give honest feedback. Right now it says 'Received.' which is a lie — nothing was received. If you wire it to send an email, the confirmation is honest. Keep the copy: 'Received. No newsletter. No notifications. We'll reach out directly if we have space.' — that becomes true."

### Amara Diallo (Community)

"Every access request is a signal of interest. Even if you don't store them in a DB, having them arrive in the creator's inbox creates a lightweight queue. When you're ready to invite someone, you search your email. This is how the best invite-only products started — Superhuman did exactly this."

---

## Scope

### 1. Deploy config — Resend secrets

- Add `RESEND_API_KEY` to `config/deploy.api.yml` secrets
- Add `RESEND_API_KEY` to `.github/workflows/deploy.yml` env
- Add `RESEND_FROM_EMAIL` as clear env var in Kamal config

### 2. Request access form → notification email

- New API endpoint: `POST /access-requests` (public, rate-limited)
- Accepts: `{ githubHandle, reason? }`
- Sends email to creator via Resend (no DB storage — Marta's GDPR point)
- Frontend: wire the landing page form to call this endpoint
- Error handling: if Resend fails, still show "Received" (graceful degradation)

### 3. Backlog cleanup

- Remove "Invitation system" from Phase 1 backlog (done)
- Update backlog with current state

---

## Next step

- [ ] Implement and commit
