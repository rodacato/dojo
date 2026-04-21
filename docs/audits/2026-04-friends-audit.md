# Invited-friend audit — 2026-04

**Sprint:** 021 Part 1
**Auditor:** creator walking the product as an invited friend
**Scope:** the surface an invited friend touches in their first two sessions

Classification (same as `docs/ux-gaps-2026-04.md`):
- **Blocker** — breaks or stalls a flow the user is actively trying to complete
- **Friction** — flow works but with noticeable UX cost (silent failure, ambiguity, dead-end)
- **Polish** — cosmetic inconsistency or dev-facing smell, no immediate user cost

---

## Walkthrough path

1. Invite redeem (email or copy-paste → OAuth → first authenticated page)
2. Dashboard first impression (empty state: `totalCompleted=0`, no streak, no history)
3. Picking a kata (DayStart, including "Surprise me")
4. Completing a kata (CODE + CHAT minimum; WHITEBOARD if time)
5. Results page (verdict, stack, next)
6. Second session (return later, find something new)
7. Course path (public course, 1-2 steps)
8. Share (kata + course completion cards)

---

## Findings

_(populated as we walk)_

### Blockers

#### B-1 · No emails have been sent from prod, ever — RESOLVED

Resend dashboard showed "No activity" on the `Dojo Site` API key a month after provisioning — confirmed in prod: `RESEND_API_KEY` is set correctly and matches the dashboard key, but nothing had ever been sent.

**Root causes (three overlapping issues, all fixed together):**

1. **Admin form allowed creating invites without an email** → the send branch (`if (email && config.RESEND_API_KEY)` at [admin-exercises.ts:290](../../apps/api/src/infrastructure/http/routes/admin-exercises.ts#L290)) silently skipped. The creator generated an invite without noticing the email field was treated as optional.
2. **OAuth was not requesting the `user:email` scope** ([auth.ts:32](../../apps/api/src/infrastructure/http/routes/auth.ts#L32)). Without it, `users.email` remained null for any invitee whose GitHub email is private — so even if we *had* wanted to email them later (reminders, welcome), we couldn't.
3. **No welcome-on-redeem email existed** in the code at all. The only Resend call was on invite *creation*; nothing fired when the invitee completed OAuth.

**Fix shipped (commit: see below):**

- OAuth now requests `['user:email']` scope on both `/auth/github` and `/auth/invite/:token` flows.
- Callback resolves the primary verified email via `GET /user/emails` (falls back silently if call fails).
- `users.email` is now persisted from that resolution on every sign-in.
- Welcome email fires after a new invitee completes redeem. Fire-and-forget; failures go through `errorReporter` instead of `console.error` so they land in Sentry + Postgres.
- Admin invite form now requires the email field (`required` + disabled button until filled). Dual-delivery: invitee gets the invite email at creation *and* the welcome email after redeem.

**Severity before fix:** Blocker for the friends cohort — the very first touchpoint (invite email) didn't exist, and even a recovery channel (welcome-on-redeem) wasn't implemented.
**Severity after fix:** resolved pending a verification pass (dispatch the first real invite in Part 8 and confirm both emails arrive).

### Friction

_(none yet)_

### Polish

_(none yet)_

---

## Invite flow re-exercise (spec 026 §1.4)

Test cases:

- [ ] Unused invite → redeem works, account created
- [ ] Used invite → rejected cleanly (no 500)
- [ ] Expired invite → rejected cleanly
- [ ] Invite email mismatch vs GitHub account email — flow behavior
- [ ] Welcome email fires via Resend on redeem

---

## Summary

_(top 3-5 findings selected for Part 4 execution — filled at end of audit)_
