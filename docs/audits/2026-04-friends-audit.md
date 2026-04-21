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

#### F-1 · Dashboard zero-state feels empty

~60% of the viewport is blank on first load. Only two cards render (streak + today's kata); heatmap / recent sessions / weak areas sections don't render at all when `totalCompleted === 0`. For a first-time user this reads as "small / unfinished product."

**Fix sketch:** render those sections with zero-state content — greyed-out heatmap grid with explanatory copy, "your recent sessions will appear here", "weak areas surface after ~5 sessions". Anchor the page so it doesn't feel empty.

#### F-2 · No secondary path from dashboard zero-state

Only CTA is "Enter the dojo". A user who prefers to browse a course first has to discover `learn` in the sidebar with no affordance. Public courses exist; dashboard doesn't hint.

**Fix sketch:** secondary link under the primary CTA: "or try a free course →" → `/learn`.

#### F-4 · CSP blocks data-URI fonts — FIXED

Console shows `Loading the font 'data:font/woff2;base64,…' violates the following Content Security Policy directive: "font-src 'self'". The action has been blocked.` Vite inlines small fonts as data URIs in the built CSS; our nginx CSP only allowed `'self'` so every inlined font got blocked and the UI quietly fell back to system-default monospace. That is exactly the kind of silent UX degradation that accumulates across invitees.

**Fix:** added `data:` to `font-src` in `apps/web/nginx.conf` (same pattern we already use for `img-src`). Takes effect next web deploy.

#### F-3 · Weekly goal "0/3" is visually invisible

The weekly progress indicator (small bars + "0/3") sits at the bottom of the streak card in very small type. A new user will not register that this is a target they're meant to pursue.

**Fix sketch:** dedicate a small card to it, or at least treat the label and number with enough weight that it reads as a commitment rather than a footnote.

### Polish

#### P-1 · `system_status: online` on dashboard

Dev/ops-style text visible to all users. Zero end-user value. Either hide for logged-in users or move into a footer that doesn't compete for attention.

#### P-2 · "Day 1. The dojo opens." — semantics unclear

Great copy voice. Verify the day counter is correct — does it say "Day 2" tomorrow with zero sessions completed, or is it literal "days since you joined", or something else? If it stays "Day 1" forever until the first session, the phrasing is fine; if it increments without action, the narrative breaks.

#### P-3 · Sidebar username lacks avatar

"0xChained" shows as plain text at the bottom of the sidebar. A small GitHub avatar to the left would make the section feel personal and match the rest of the product's developer-identity framing.

#### P-4 · Large empty gap in sidebar

Between the nav items (ends at `badges`) and the username/logout section at the bottom, there is a large empty vertical space on tall screens. Pack or center the nav to reduce the deadspace.

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
