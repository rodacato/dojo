# PRD-013: UX/UI Gap Analysis — Missing States, Mobile, Edge Cases

> **Status:** confirmed — HIGH severity items committed to Sprint 003 (Spec 017)
> **Date:** 2026-03-21
> **Author:** Claude (Soren Bachmann guiding — UX & design)

---

## Idea in one sentence

A screen-by-screen audit of missing states, mobile behavior, edge cases, and copy gaps that the design spec doesn't explicitly address but the frontend implementation will need.

---

## Source material

- `docs/screens/README.md` — 24 screens with annotations
- `docs/prd/001-frontend-features-data-model.md` — feature inventory
- `docs/prd/005-expert-panel-review.md` — Soren's feedback

---

## Phase 0 screens — gap analysis

---

### Screen 1: Login / Landing (`/login`)

**Documented states:** Logged out (landing), redirect if auth.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| OAuth error state — what if GitHub OAuth fails? | High | Show specific error: "GitHub login failed. Try again or check your GitHub status." CTA: retry button |
| First-time vs. returning user — same screen? | Medium | For Phase 0 (creator only), same screen is fine. In Phase 1, returning user should land on `/dashboard`, first-time on an onboarding screen |
| Network offline state | Low | Browser handles this gracefully — no custom state needed for Phase 0 |
| Redirect loop — what if auth succeeds but `/dashboard` fails? | Medium | Log the error, show "Something went wrong" with a logout link |

**Mobile:** Login screen is minimal — a logo, a headline, a GitHub button. Mobile layout is the same as desktop. No gaps.

---

### Screen 2: Day Start — Daily Ritual (`/start`)

**Documented states:** Normal (ready to select mood + time), heatmap strip.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| Loading state — fetching streak/heatmap data | Medium | Skeleton loader for streak number and heatmap while API responds |
| Empty state — first day (no history, streak = 0) | High | "Day 1. The dojo opens." — different copy from return visit empty state |
| Already completed today — what happens if the user comes back? | High | Redirect to `/dashboard` immediately (today's card shows the completed session). Don't show Day Start again. |
| API error — exercises can't be fetched | High | "The dojo is having trouble. Try again." — retry button, not a dead end |
| Mood/time not selected — CTA disabled state | Documented | ✅ Already specified — button disabled until both selected |
| Heatmap with partial data (< 30 days) | Low | Fill missing days with empty state — no gap in display, just empty dots |

**Mobile:** The mood selector (5 states) and time selector (4 states) are segmented controls. On mobile (<400px), these need to either scroll horizontally or stack. The current design doesn't specify. **Recommendation:** Stack vertically on mobile — one row per segment option. This is simpler than horizontal scroll.

---

### Screen 3: Kata Selection (`/kata`)

**Documented states:** 3 exercise cards, type/difficulty/language badges.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| Loading state — 3 exercises being fetched | Medium | 3 skeleton cards (same layout as real cards) while loading |
| Fewer than 3 eligible exercises | Medium | If <3 exercises meet the filters (duration + exclusion window), relax the filter: first drop duration match, then keep returning exercises beyond the 6-month window. Log when this happens. |
| No exercises at all — empty catalog | Low | Phase 0: impossible (seed data always exists). Phase 1+: "The dojo is resting. Check back soon." |
| Selection state — is there a hover/selected visual? | Medium | Card should show a selected state (border highlight or checkmark) before navigating — confirms the tap on mobile |
| Error fetching exercises | High | Same as Day Start error: retry button, not a dead end |

**Mobile:** Exercise cards are shown as a vertical list, not a 3-column grid, on mobile. The type/difficulty badges need to remain readable at small sizes. Tag line and description should truncate at 2 lines with ellipsis.

---

### Screen 4: Kata Active — CODE (`/kata/:id`)

**Documented states:** Split panel, timer (3 states), submit button.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| Loading state — session body being generated | High | The `POST /sessions` call takes 1–2 seconds (LLM body generation). Show a loading state in the code panel: "The sensei is preparing your kata..." with a subtle animation. Do not show an empty code editor. |
| Timer expired — what happens? | High | Timer reaches 0, submit button shows "Time's up — submit now" in red, user can still submit (server enforces 10% grace). After grace period, submission is rejected with 408. |
| Attempt rejected after grace period (408) | Medium | "Time expired. The session is closed." — show the exercise description and a "Return to dashboard" CTA. Do not penalize streak (partial attempt). |
| Code editor empty on submit | Medium | If the code editor is empty, show inline error: "Write something first." Disable the submit button until content exists. |
| Unsaved progress — user navigates away | Medium | Browser `beforeunload` event: "Are you sure? Your kata in progress will be lost." In the dojo, sessions stay active — user can return via dashboard. |
| Mobile: split panel impossible | High | On mobile (<768px): single panel, tab switcher between "Exercise" and "Your code." This is not in the current design spec. **Significant gap.** |
| CodeMirror theme | Low | Use the app's dark theme background (`#0F172A`) for the editor. Ensure the text color is the standard monospace color (`#E2E8F0`). |

**Mobile:** The split panel (exercise description left, code editor right) cannot work on a mobile screen. The tab switcher approach is the only viable mobile layout. This requires a UI design decision that is not currently made. **This is the highest-severity gap in the Phase 0 screens.**

---

### Screen 5: Kata Active — CHAT (`/kata/:id`)

**Documented states:** Textarea, word count, mono/sans toggle, countdown timer.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| Loading state — same as CODE kata | High | Same as above — session body generation takes 1–2 seconds |
| Textarea empty on submit | Medium | Same as CODE: "Write something first." |
| Word count display | Low | Show count below the textarea: "217 words" — no minimum or maximum enforced, just informational |
| Mobile layout | Low | CHAT kata is simpler — single column, textarea fills the screen, exercise description above in a collapsible panel |

---

### Screen 6: Sensei Evaluation (`/kata/:id/eval`)

**Documented states:** Streaming chat, follow-up input, verdict card, blinking cursor.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| Initial connecting state — before WebSocket is ready | High | "Connecting to the sensei..." with blinking cursor `▌`. WebSocket `{type:"ready"}` resolves this. |
| LLM_STREAM_ERROR mid-stream | High | "The sensei encountered an issue. Your session is still active — you can resubmit." Preserve the partial stream text as context. Show a "Try again" button. |
| Connection dropped mid-stream (mobile) | High | On reconnect: `{type:"reconnect", attemptId}` — server resumes. Client shows "Reconnecting..." banner while the WebSocket reconnects. |
| Follow-up input state — when does it appear? | Medium | Input appears ONLY when `isFinalEvaluation === false`. It should animate in (slide up from below) — don't show it before the verdict is clear. |
| Max follow-ups reached — what copy? | Low | After 2nd follow-up, the sensei delivers final verdict. The input field disappears. No special message needed — the verdict card appearing is sufficient signal. |
| Verdict card animation | Low | Verdict card slides in from below after streaming completes. NOT a pop. |
| Long streaming response — scroll behavior | Medium | Auto-scroll to bottom as tokens arrive. If the user manually scrolls up, pause auto-scroll. Resume when they scroll to bottom again. |
| Mobile | Low | Single column, streaming text fills the screen, verdict card below. No significant gap. |

---

### Screen 7: Results & Analysis (`/kata/:id/result`)

**Documented states:** Verdict display, analysis prose, topics chips, share preview.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| "+N positions" stat — removed in Phase 0 | Confirmed | Replace with "Your Xth kata" — first kata is "Your 1st kata in the dojo." Uses ordinal format. |
| Empty `topicsToReview` — can this happen? | Medium | If `verdict === 'passed'` and LLM returns empty array, show no chips. If `verdict === 'needs_work'` and `topicsToReview` is empty — this is a prompt failure, log it, show "Review your approach to this problem type." |
| Share card — Phase 0 version | Confirmed | CSS/HTML inline preview only. No OG image generation. Share button copies a text snippet to clipboard: "Just completed 'The N+1 You Didn't Write' in the dojo. The sensei said: [pull quote]" |
| Return path | Low | "Return to dashboard" CTA at the bottom. No "do another kata" CTA — the dojo is one kata per day. |
| Mobile | Low | Stacked layout — verdict, analysis, topics, share. No significant gap. |

---

### Screen 8: Dashboard (`/dashboard`)

**Documented states:** Streak number, today card (2 states), recent activity list.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| Active session detection | High | If user has an in-progress (not completed) session today, the today card shows a "Resume" CTA that navigates to `/kata/:id`. This was flagged by Soren in PRD-005 and is not in the original design. |
| Loading state | Medium | Skeleton for streak number, today card, and recent list while API responds |
| Empty state — first visit, no history | High | Streak: 0, today card: "The dojo opens today.", recent list: "Your first kata is waiting." |
| Recent list with <4 sessions | Low | Show however many exist — no padding with empty rows |
| Mobile | Low | Stacked single column. Streak and today card at top, recent list below. The heatmap strip shows 7 days instead of 30 on mobile. |

---

### Screen 9: Admin — Exercise List (`/admin`)

**Documented states:** Dense table, filters, pagination, action buttons.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| Empty state — no exercises | Low | "No exercises yet. Add the first one." CTA to New Exercise. |
| Filter state — no results match | Low | "No exercises match these filters." Reset filters button. |
| Loading state | Low | Table skeleton (5 rows, greyed out). |
| Pagination with <10 items | Low | Hide pagination if total items fit on one page. |
| Delete confirmation | High | Deleting an exercise is irreversible (or should it be archive, not delete?). Recommendation: exercises are never deleted — they are archived. Archive sets `status = 'archived'`, removes from `findEligible()`. |
| `sessionCount` and `avgScore` — derived queries | Confirmed | These run as CTEs, not stored. For Phase 0 (small data), performance is fine. |
| Mobile | Low | Phase 0 admin is creator-only on a desktop. Mobile admin is out of scope for Phase 0. |

---

### Screen 10: Admin — New Exercise (`/admin/exercises/new`)

**Documented states:** Multi-field form, chip inputs, draft/publish toggle.

**Gaps:**

| Gap | Severity | Recommendation |
|---|---|---|
| Form validation — required fields | High | `title`, `description`, `duration`, `difficulty`, `type` are required. Show inline errors on submit attempt. |
| Chip input for `topics`, `tags`, `language` | Medium | Press Enter or comma to add a chip. Delete with backspace or the chip's × button. No max enforced — the creator is trusted. |
| Minimum 1 variation | High | The form must include at least one variation section. Add button for a second variation. |
| Variation section UX | Medium | Each variation is a sub-form: `ownerRole` (text, 1–2 sentences) + `ownerContext` (textarea, rich rubric). Collapsible after entry. |
| Draft vs. publish | Low | Draft exercises are in `status = 'draft'`, not returned by `findEligible()`. Publish sets `status = 'published'`. The toggle should be explicit: "Save as draft" vs. "Publish." |
| Save confirmation | Low | On successful save: toast "Exercise saved." + navigate to Exercise List. On error: inline error near the submit button. |

---

## Cross-cutting gaps

### 1. Error page states

Every screen needs a generic error fallback that is not the browser's default. Recommendation:

```
Something went wrong.
[Retry] [Return to dashboard]
```

Log the error client-side with context (route, user ID, timestamp). Do not expose stack traces.

### 2. Network offline detection

The app should detect when the network goes offline and show a persistent banner: "You're offline. Reconnecting..." — especially critical during the WebSocket evaluation flow.

### 3. Session expiry

If the user's auth cookie expires mid-session (unlikely with 30-day expiry, but possible if the DB session is invalidated), any API call returns 401. The frontend should catch this globally and redirect to `/login` with a "Your session expired" message.

### 4. First-time creator bootstrap

The first time the creator logs in, the DB is empty (if seed script hasn't run). Dashboard shows: streak 0, no recent sessions. This is correct — but the creator needs a clear path to "add the first exercise" via the admin. The dashboard empty state should include a faint admin link: "Add exercises in the admin." Creator-only UI, not shown to other users.

### 5. Accessibility gaps

- All interactive elements need `aria-label` when the visual label is insufficient (icon-only buttons)
- Timer countdown needs `aria-live="polite"` to be announced to screen readers
- Blinking cursor `▌` should be `aria-hidden="true"` (decorative)
- Color alone is not sufficient to indicate timer states — also change the label text ("Amber" state: "⚠ 3 minutes left", "Red" state: "⚠ 1 minute left")
- Modal dialogs need `role="dialog"` and focus trapping

---

## Summary: severity triage

| Severity | Count | Items |
|---|---|---|
| High | 14 | OAuth error, first-day empty state, session-in-progress detection, CODE mobile split panel, LLM error mid-stream, reconnect, session grace period, form validation, exercise archive (not delete), loading states with content |
| Medium | 12 | Skeleton loaders, chip input UX, variation UX, auto-scroll in eval, filter no-results, etc. |
| Low | 11 | Cosmetic, non-critical, can be deferred |

**The highest-priority gap not currently in any spec: mobile layout for CODE kata.** The split panel cannot work on mobile. A tab-switcher between "Exercise" and "Code" is the minimum viable mobile layout — this needs a design decision before implementation begins.

---

## Next step

- [ ] Design decision: mobile layout for CODE kata (tab switcher vs. overlay)
- [ ] Add mobile layout specs to Screen 4 annotations
- [ ] Add error states and loading states to all screen specs (009, 013)
- [ ] Add accessibility checklist to the frontend spec (013)
- [ ] Confirm: exercises are archived, not deleted
