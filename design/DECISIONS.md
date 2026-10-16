# Design decisions — open questions & findings (D1–D51)

> **This is the registry the `.pen` files point at.** Briefs in `flows/*.pen` and warning
> notes in `ui-kit.lib.pen` cite these by number. Keep entries after resolution — record the
> outcome instead of deleting; the reasoning is the useful part.

**Status:** 51 numbered entries (D14, D24–D25, D27, D36 and D38–D39 were folded into
neighbours or fixed in-flow while drawing, so the series has gaps) · 15 resolved (D1, D2, D6, D15, D21,
D42, D43, D44, D45, D46, D47, D48, D49, D50, D51) · the rest open until Adrian decides · 🐞 real app bugs
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
| **D35** | Katas copy says "below" while Customize is above | copy |
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

## Out of scope (confirmed)

Light-theme variants of every screen: the app's default resolves per OS, and the kit carries
all three themes. Screens are drawn in sumi only.
