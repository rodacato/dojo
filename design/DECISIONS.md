# Design decisions — open questions & findings (D1–D70)

> **This is the registry the `.pen` files point at.** Briefs in `flows/*.pen` and warning
> notes in `ui-kit.lib.pen` cite these by number. Keep entries after resolution — record the
> outcome instead of deleting; the reasoning is the useful part.

**Status:** 59 numbered entries (D14, D24–D25, D27, D36 and D38–D39 were folded into
neighbours or fixed in-flow while drawing, so the series has gaps) · 23 resolved (D1, D2, D6, D15, D21,
D42, D43, D44, D45, D46, D47, D48, D49, D50, D51, D52, D53, D54, D55, D56, D57, D58, D59, D60, D61, D62) · the rest open until Adrian decides · 🐞 real app bugs
are tagged and belong in the board, not here.

**How entries work.** A `D<n>` is a *finding*: logged when the design and the code disagree
and the call isn't the designer's to make. The design is built to match the **code**; the
entry records what the code does, what it probably should do, and who decides. Decider is
Adrian unless noted.

---

## Branding and tokens

| # | Finding | Code does | Recommendation |
|---|---|---|---|
| **D1** | Default theme | `auto` → sumi (dark OS) / washi (light OS); slate only by explicit choice (`apps/web/src/lib/theme.ts`) | ✅ Resolved: `docs/DESIGN.md` now says slate is an explicit choice and `auto` is the default. All screens are drawn in sumi |
| **D2** | New "Open Gate" brand not integrated (issue #148) | ✅ Resolved: PR #151 integrated the Open Gate mark (`apps/web/src/brand/logo.json`) and the wordmark keeps `dojo_`. Kit 0.2.0 mirrors it; the palette did not change | Done |
| **D3** | Tailwind opacity modifiers (`bg-danger/10`) | Computed at build time | Modeled as alpha tokens `tint-<color>-<n>` in the kit |
| **D4** | Type scale anomaly | `text-3xl` (30px) is smaller than `text-2xl` (32px) | Fix in `main.css` |
| **D7** | Hardcoded colors outside the theme | Modal overlay is `bg-black/60`. (The AchievementBadge glow noted earlier is gone: the component now uses only theme tokens) | Tokenize the overlay |
| **D34** | Code editor syntax colors | One color per token class, approximated | Kit gap, low impact |

## Accessibility

| # | Finding | Recommendation |
|---|---|---|
| **D5** | `focus-visible` styling exists only on Button | Add a focus ring to Input, Toggle, nav links, chips |
| **D6** | MermaidEditor textarea suppresses focus with no replacement | ✅ Resolved in PR #154: visible focus ring on the answer textareas |
| **D21** | Results prints raw analysis tags; VerdictBlock has no role | ✅ Tags resolved in PR #154 (the hero strips them, the insight cards carry the content). The block still has no role |

## Icons and kit gaps (kit-side notes, no code change)

| # | Finding |
|---|---|
| **D8** | Code uses inline Material-style SVGs; the kit uses Material Symbols Outlined approximations |
| **D26** | `tint-surface-30/40` was missing; added to the kit before the first commit |
| **D29** | `EmptyState/Card` has no actions slot (local frame in flows) |
| **D30** | Hanko drawn inline, brushstroke underline approximated |
| **D31** | Settings pills, chips and goal buttons are local (kit candidates) |
| **D32** | `VerdictBlock` lacks topics/CTA slots (local frame) |
| **D33** | Timer/SM has no danger state (local) |
| **D28** | Pencil has no text-transform: CSS-uppercase strings are written uppercase in the design |
| **D41** | `AdminSidebar` is not in the kit (drawn locally in `admin.pen`) |

## Code findings (design shows what the code does)

| # | Finding | Kind |
|---|---|---|
| **D9** | `.legal-prose` class is used but undefined | 🐞 |
| **D10** | `LoginPage.tsx` is an orphan; `/login` redirects to `/` | dead code |
| **D11** | Nothing links to `/error` | dead route |
| **D12** | InviteRedeem has no invalid/expired UI; "expires in 7 days" is static | 🐞 |
| **D13** | Hero CTA scrolls to `#access`; the only login control is the nav "Log in" | UX |
| **D15** | Dashboard/History have no error UI; Settings stays on the loader if prefs fail | ✅ Resolved: Dashboard, admin lists and kata picks in PR #154; History and Settings show an error with a retry |
| **D16** | Belts empty state is dead code; no next-belt progress | UX |
| **D17** | History total counts failed and expired sessions | 🐞 |
| **D18** | Sidebar logout has no confirm, Settings logout does | inconsistency |
| **D19** | Sidebar has no History link; mobile nav lacks kumite, engawa, theme, logout | UX |
| **D20** | "Make profile private" is permanently disabled | decision |
| **D22** | Kata flow errors are silent; no abandon, no toasts | UX. Part resolved: the active kata has a *Leave* action with a confirmation. It does not abandon: the session and its timer keep running and can be resumed from the dashboard. Errors are still silent and there are still no toasts |
| **D23** | Engawa navigates to a non-existent `/playground/:lang` | 🐞 |
| **D35** | Katas copy says "below" while Customize is above | ✅ Obsolete: Advanced (PR #205) removed Customize; preferences live in Settings (D57) |
| **D37** | No run-tests button in the kata editor | decision |
| **D40** | ScrollFrame is not step-based (iframe + postMessage) | note |

### Admin-only (no number yet, grouped under D41's pass)

- ✅ AdminKatas and AdminEditKata have no error state. Resolved: both render an `ErrorState` when the load fails.
- ✅ AdminEditKata shows a ⌘+S hint but binds no handler. Resolved: Edit and New kata bind ⌘/Ctrl+S to save.
- ✅ The type filter offers REVIEW; the authoring form does not. Settled as D43.
- Breadcrumb says EXERCISES while the page says Katas.

## Found by the independent UI review (2026-10-14)

Three fresh reviewers read the exports against the code. Bugs went to code (PRs #154, #155);
what stays here is a decision or a design-side note. Lifts they proposed and nobody took are
not listed: they are taste, not findings.

| # | Finding | Recommendation |
|---|---|---|
| **D42** | Accent and danger are almost the same red in sumi (`#B73A2F` vs `#9C2D24`): CTA, selection, streak, error and hanko read alike | ✅ **Decided: A · Strict** (2026-10-14), mirrored in kit 0.3.0 (rails of scroll cards, the legal callout and AccentCard also went neutral). The palette stays: the approved Open Gate brand keeps both tokens. Accent only on the filled primary action, links, focus and the mark. Selection, stat numbers and eyebrows go neutral, and every selected state carries a non-colour cue. Lands with the Open Gate integration (D2). **Rejected B · With selection** — tested keeping the accent on selected states for navigation identity; lost because selection and error stay almost the same red, the confusion the review found; would come back if drawing both shows the neutral active tab is hard to see, or if the red in navigation is judged part of the identity |
| **D43** | Admin: the catalog filter offers REVIEW (seeded review katas exist) but the form cannot create or edit that type | ✅ Decided: no, for now. The filter stays, and review katas are seeded by code (their diff is authored in the description). Revisit if review katas start being written by hand |
| **D44** | `/error` Retry reloads `/error` itself | ✅ Resolved: on `/error` the primary button goes back (or to the dashboard when there is no history); inside the error boundary it still reloads |
| **D45** | Public profile shows the same value as the title and as `@handle` | ✅ Resolved: the title is the username and the separate `@handle` line is gone. A display name waits until one exists |
| **D46** | Contrast in sumi, measured 2026-10-14 (WCAG, on `#0A0908` / `#13110F`): `muted` 2.67 / 2.53, `danger` as text 2.67 / 2.52, `accent` as text 3.47 / 3.28, `muted/40` 1.34. Washi: `muted` 3.45, `warning` as text 2.64, `success` 4.28. `secondary` (7.16), `primary` and `on-accent` on accent (4.92) pass | ✅ **Decided: hybrid by token** (2026-10-14), mirrored in kit 0.3.0. `muted`: fix by usage, as the brand guide says; text people must read uses `secondary`, `muted` stays decorative or placeholder, and stacked opacities below 70% on text go away. `danger` and `accent` as text: two derived tokens, `danger-text` (sumi about `#B6675D`, 4.56 on surface) and `accent-text` (sumi about `#C35E53`, 4.53). The approved values do not change. Washi `warning` and `success` as text need their own derived values. Lands with D42 and the Open Gate integration; the kit bumps when the tokens exist. **Rejected: change the values only** — tested the smallest code change; lost because it moves approved brand values and also lightens borders and fills that pass today; would come back if the derived tokens prove too many to maintain |
| **D47** | On-accent text on the slate accent measures 4.47:1 (`#FFFFFF` on `#6366F1`), 0.03 under AA for body text; sumi and washi pass (4.92 and above). The contrast test excludes slate from that assertion | ✅ Accepted: slate is the explicit-choice theme, the labels are 14px or larger, and the fix would move a brand value. The contrast test says so where it skips slate |
| **D48** | Leaving the kata form with edits (Back, Cancel, closing the tab) loses them silently. The app uses `BrowserRouter`, so `useBlocker` is not available | ✅ Resolved: the browser warns on close or reload while the form is dirty, and the three exit buttons ask "Leave without saving?" first. Sidebar links and the browser Back button are not guarded. **Rejected: migrate to a data router for `useBlocker`** — would also catch those two; lost on cost, since it rewrites the routing and every test that mounts a `MemoryRouter`; would come back if edits get lost through the sidebar in practice. **Rejected: autosave a draft to `localStorage`** — more code and edge cases than the loss justifies |
| **D49** | Health reported `down` for Piston whenever any runtime was missing, so "2 of 7 missing" looked the same as "nothing works" | ✅ Resolved: a reachable Piston with at least one runtime installed and one missing is `degraded` (amber dot and label, Reprovision still offered); unreachable, or reachable with nothing installed, stays `down`. **Rejected: only improve the card text** — kept the red state, so the severity stayed wrong; would come back if a fourth status is judged noise for one subsystem |
| **D50** | Four leftovers of D42 and D46. Washi `success` and `warning` measure 4.28:1 and 2.64:1 as text on the page (3.92 and 2.41 on surface). `REVIEW` reused the accent in sumi and washi. The `VerdictBlock` stroke stayed vermillion next to a PASSED. Results showed two filled primary buttons | ✅ Resolved, kit 0.4.0: text uses `success-text` and `warning-text` (washi `#4A6640` and `#7A5A12`, 5.22 and 5.16 on surface; slate and sumi keep the base values), fills and borders keep the base tokens. `REVIEW` has its own hue (`#3F6AA8` in sumi and washi, `#0EA5E9` in slate). The stroke takes the verdict colour. Copy share link is ghost, so Keep practicing is the only filled button. **Rejected: darken `success` and `warning` themselves** — it also changes dots and fills that pass today. **Rejected: neutral REVIEW badge** — it drops the type signal the other kata types keep. The brushstroke under a page title stays accent: it is the mark |
| **D51** | Type floor on the in-app screens. 12px was the dominant size (323 `text-xs` against 136 `text-sm`), option labels and group labels shared one uppercase style, and nothing was medium weight | ✅ Resolved as **A · raise the floor**: options, chips, messages and helper text are 14px medium in the case they are written in; `text-xs` uppercase stays for group labels and metadata; section titles are one step above the options. Applied to the kata picker, kata, evaluation, belts and scrolls screens. **B · keep it dense** (fix with weight and contrast only) tested whether density is part of the identity; it lost because the complaint was legibility, not density. It comes back if the terminal look is declared part of the brand. Admin and the playground stay dense on purpose |

**Wording and links settled in PR #155:** sign in / sign out, one way in on anonymous Engawa,
Kumite placeholder trimmed, whiteboard kata copy, Ask the sensei on the shared modal.

**Fixed in the flows after the review:** error states are centered (kit 0.1.1), sidebar says
"sign out", the profile heatmap wraps, admin sample data matches the code, Dashboard load error
added.

## Daily micro kata, mobile-first (2026-10-19)

Direction change: one surprise kata a day of about 5 minutes, the picker moved to Advanced. Designed mobile-first, before code.

| # | Finding | Recommendation |
|---|---|---|
| **D52** | How a 5-minute micro kata is answered on a phone. Today the `review` kata is a free-text box, which on a phone spends the 5 minutes typing where the bug is | ✅ **Decided: A · Point + why, refined to an answer shape per kata** (2026-10-19). Each micro kata declares its shape: **point** (tap the line with the bug; on a diff, approve or reject and tap the line) for spot-the-bug and diff review, **choice** (pick one option) for tradeoffs and "what happens if", **text** for what has neither code to point at nor clear options. Every shape requires a why (two or three sentences; for text, the text is the why), and that is what the sensei grades. Point ships the correct line, and choice the correct option, as seed data. Point needs a tappable-lines component the kit does not have yet. The pilot builds point only; text and choice land with the first kata that needs each. **Rejected B · Text only** — tested reusing the existing `review` answer box for every kata; lost on thumb typing eating the time budget and the sensei guessing which line was meant; kept as the text shape. **Rejected: choice without a why** — it is trivia, one in four by guessing and nothing for the sensei to grade |
| **D53** | The entry: what the learner sees of today's kata on the dashboard before committing to it | ✅ **Decided: A · Blind** (2026-10-19). The hero shows that today's kata is waiting and its length (about 5 minutes) with one primary action; the topic is revealed when the kata opens. Today's pick is fixed server-side before the tap (no reroll), which also lets it be prepared ahead. Reaches the first line of code in two taps or fewer. **Rejected B · Revealed** — tested showing title, type and language of today's fixed kata before starting, so the learner can pick the moment; lost because reading the topic is a reason to skip the day, a reroll in all but name; would come back if the pilot shows katas abandoned after a blind start because the topic did not fit |
| **D54** | After today's kata is done, what the dashboard offers: only "done today" and the result, or one more kata | ✅ **Decided: B · One more** (2026-10-19). The done state keeps "Done today" and the result as the main content, plus a secondary action that starts another surprise micro kata. Accepted cost: it can turn into an endless feed of 5-minute katas, and each one spends the operator's LLM tokens. **Rejected A · Closed for today** — tested making one a day the whole product, with Advanced reachable only from navigation; lost because it slows down the days when the learner wants more; would come back if the pilot shows the second kata becoming a habit that replaces depth, or if token cost per instance becomes a complaint |
| **D55** | `kata.pen` › `KataActive / Mobile` has no Leave button; the code has had one in the header since the leave-kata change (`KataActivePage.tsx:263`, confirm via `ConfirmModal`). Found when the playground copied that screen | ✅ Resolved (2026-10-19): `KataActive / Mobile` draws Leave, and both header actions are 44 tall on mobile, matching PR #196 |
| **D56** | What Advanced (`/katas`) gives when the learner wants something other than today's surprise | ✅ **Decided: A · Filters → one kata** (2026-10-19). The learner picks duration, type and language, taps Start, and gets one kata within those filters, with no list. The mood picker goes (the API ignores it today). **Rejected B · Filters → three picks** — tested keeping today's choose-one-of-three, trimmed; lost because choosing among three is a reroll in disguise and three cards are heavy on a phone; would come back if the learner keeps wanting a specific kata (to repeat one, or a known topic), which may instead call for a catalog |
| **D57** | Where the practice preferences live once `/katas` is Advanced (level, interests, randomness, weekly goal), today an open Customize panel on the picker | ✅ **Decided: A · Settings** (2026-10-19). A "Practice" section in Settings; set once, they feed both today's surprise and Advanced. **Rejected B · Collapsed in Advanced** — tested keeping them one tap away on the picker; lost because it mixes this kata's filters with standing preferences on one screen; would come back if the preferences turn out to change almost every session |
| **D58** | Admin on a phone: the `w-48` sidebar has no mobile fallback and every list is a horizontal-scroll table (all `/admin/*` broken at 390px) | ✅ **Decided: A · Bottom bar** (2026-10-19). Below md, the five sections sit in a bottom bar like the app's `BottomNav`, with "back to app" visible in the top bar. Form screens (new and edit kata) hide it and show a fixed Save / Cancel bar instead, the rule the app already uses for the active kata. Tables become stacked cards below md (title, status, the main action at 44px), the only real answer at 390px. **Rejected B · Top tabs** — tested a scrollable tab strip under the header to keep admin distinct; lost on thumb reach and on the fifth tab falling off screen; would come back if switching between app and admin causes context confusion in use |
| **D59** | Engawa on a phone: the `h-12` toolbar with `flex-wrap` holds Language, Version, "+ older", the run status, Ask the sensei and Run, wraps into two or three rows that overflow, and every control is 28px | ✅ **Decided: B · Run at the bottom** (2026-10-19). Below md, the top keeps one row of selectors (Language, Version, "+ older") at 44px; Run, Ask the sensei and the run status move to a fixed bar at the bottom, the pattern D58 uses for admin forms. **Rejected A · Two-row toolbar** — tested keeping every control at the top in two 44px rows; lost on about 100px of editor height and Run out of thumb reach; would come back if Ask is used more than Run on mobile, or if a bottom bar over the output feels cramped |
| **D60** | After a kata: the eval screen streams the sensei, shows the verdict and redirects to Results after 1.5s (`useEvaluationStream.ts:42-43`), which shows the verdict again in its hero and a third time in a share preview, with the title and persona repeated; the exit goes to Advanced, against D54 | ✅ **Decided: A · One screen** (2026-10-19). The eval screen becomes the result in place, with no redirect: verdict, then the solution with its why (a point kata's correct line and `expectedIssues[].why`, revealed only after evaluation), then insights, then One more / Done (D54). `/katas/:id/result` renders the same view from stored data, for history and links. The insight tags never reach the stream (the half D21 left). **Rejected B · Two screens, you advance** — tested ending eval at the verdict with a "See the solution" button and keeping Results as a de-duplicated record; lost on the verdict still showing on two screens and the solution one screen away, on a 5-minute kata with no follow-up (#193); would come back if follow-up conversations turn out to be common in daily practice |
| **D61** | Where share lives on the post-kata screen (D60). Today a 1200×630 preview card with Copy / Twitter, which overflows on a phone and repeats the verdict | ✅ **Decided: A · A button and the native sheet** (2026-10-19). A ghost "Share" action opens `navigator.share` on a phone and copies the link elsewhere; no preview on the screen, since `/share/:id` already is the card. **Rejected B · Card at the end** — tested keeping the preview, fitted, below the result; lost on screen cost for an occasional action and on repeating the verdict D60 shows once; would come back if shared links prove to be a real acquisition channel |
| **D62** | Kata feedback after D60: the form sat behind a small "how was this kata? (optional)" link below the exits, saved only on send (Done above it dropped the votes), and two labels did not say what is stored ("Somewhat clear" stores `somewhat_unclear`, "Somewhat relevant" stores `too_generic`; "feel fair?" was answered on a relevance scale). These votes measure the #193 trial | ✅ **Decided: A · Inline, before Done** (2026-10-19). The two trial questions (time limit, the sensei's review) sit open above the exits; every tap saves (the API upserts per session). Clarity and the note sit behind "More feedback"; the note has its own ghost "Send note", so Done stays the only filled action. Labels follow the stored values: Confusing / Somewhat unclear / Clear; "How was the sensei's review?" → Missed the point / Too generic / Spot on. Options at 52px in Inter 14 medium (D51), questions labelled for assistive tech. **Rejected B · Behind an entry, save on tap** — tested keeping the form one tap away after Done; lost because most learners leave through Done first and the trial would run without votes; would come back once the trial is over and the votes stop driving a decision |

## Recognition exploration (2026-10-19)

| # | Question | Decision and rejected direction |
|---|---|---|
| **D63** | Recognition art direction and proposal boundary | **Preserve · Practice leaves a mark**, accepted with the requested PRD adjustments. Reuse Sumi/Washi, Open Gate, the shipped ring, stripe notches and English typographic hanko. Draw only in `_playground.pen`; the authored proposal copy lives in `brand/recognition.md`. **Rejected: illustrated trophy overhaul** — tested a collectible visual world; lost because recognition should read as Dojo's practice history; reconsider only with a separate brand redesign. Folded Belt masters remain #189's scope. |
| **D64** | What rank and Paths mean | **Rank records sustained practice; Paths record topic exposure.** No verdict or topic breadth gate for rank; no competence or contribution-permission claim. Requirements use credited practice days, with at most one credit per calendar date. **Rejected: rank as editorial trust** — practice count does not establish review quality; contribution roles belong to the operator. Numeric progression and rest allowance remain implementation decisions. |
| **D65** | Where recognition appears after a kata | **One compact receipt after the reasoning and solution**, including after NEEDS WORK; optional promotion sharing, Done stays primary. Preserve D62's instrument during #193. **Rejected: promotion modal or permanent share preview** — interrupts the evaluation and repeats the result; reconsider only with observed demand. D16 remains a shipped-code finding until implementation; this proposal does not close it. |
| **D66** | Recognition visual mode after reviewing D63: the Preserve ledger was correct and did not motivate | **Direction: pixel practitioner + personal dojo** (2026-10-20), pending review of the prototype in `brand/proposals/practitioner/`. Supersedes D63's visual mode; its voice rules (factual, no "unlocked!", no competence claims) stay. Two tracks with opposite difficulty: the **practitioner** is dressed with pieces earned by showing up (practice days, a return, a share, seasons, invites), easy and allowed to carry promotion; the **dojo** is furnished with pieces earned by verdicts on hard kata, each naming its kata, verdict and date, never promotional. The belt mirrors rank and is never a piece. **Rejected: one track** — a single avatar mixes "I showed up" with "I passed this" and either cheapens the hard pieces or gates the easy ones. Conflicts with DESIGN.md "What we don't do" (illustration, achievement-style badges); that list is amended when the direction ships, not before. Dojo pieces read the verdict, so the sensei's evaluation must stay blind to recognition (D64). |

## Public flow, Paper edition (2026-10-29)

| # | Finding | Code does | Recommendation |
|---|---|---|---|
| **D68** | Open source page lists "Gamification features" as not welcome | `OpenSourcePage.tsx` says so while belts and the practitioner pieces ship | **Decided by Adrian (2026-10-29):** dojo supports gamification at some level, so the line goes. Removed from `public.pen`; the code follows when the page is implemented |
| **D69** | 🐞 Recent kata rows had no room for the title on a phone | `DenseSessionRow` kept type, difficulty and verdict fixed below md; at 375 the truncated title got about 7px | ✅ Resolved: below `sm` the title takes its own line above the badges; `sm` and up are unchanged |
| **D70** | Profile and Share 404 look different from the other error pages | `PublicProfilePage.tsx` and `SharePage.tsx` render a bare `ErrorState` with no nav or footer; `ErrorPage` and `NotFoundPage` use `PublicPageLayout` with the watermark | **Decided by Adrian (2026-10-29):** one pattern for every public error — layout with hideCta, the Paper Gate watermark, pill, title, body, actions. The drawn copy stays the `ErrorState` copy |

## Out of scope (confirmed)

Light-theme variants of every screen: the app's default resolves per OS, and the kit carries
all three themes. Screens are drawn in sumi only.
