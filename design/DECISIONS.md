# Design decisions — open questions & findings (D1–D41)

> **This is the registry the `.pen` files point at.** Briefs in `flows/*.pen` and warning
> notes in `ui-kit.lib.pen` cite these by number. Keep entries after resolution — record the
> outcome instead of deleting; the reasoning is the useful part.

**Status:** 41 numbered entries (D14, D24–D25, D27, D36 and D38–D39 were folded into
neighbours or fixed in-flow while drawing, so the series has gaps) · 0 resolved · open until
Adrian decides · 🐞 real app bugs are tagged and belong in the board, not here.

**How entries work.** A `D<n>` is a *finding*: logged when the design and the code disagree
and the call isn't the designer's to make. The design is built to match the **code**; the
entry records what the code does, what it probably should do, and who decides. Decider is
Adrian unless noted.

---

## Branding and tokens

| # | Finding | Code does | Recommendation |
|---|---|---|---|
| **D1** | Default theme | `auto` → sumi (dark OS) / washi (light OS); slate only by explicit choice. `docs/DESIGN.md` still says slate is the default | Fix the doc. All screens are drawn in sumi |
| **D2** | New "Open Gate" brand (`docs/brand-kit`) not integrated (issue #148) | Torii logo and `dojo_` wordmark | Kit mirrors the code. Re-vendor when the brand lands in the app |
| **D3** | Tailwind opacity modifiers (`bg-danger/10`) | Computed at build time | Modeled as alpha tokens `tint-<color>-<n>` in the kit |
| **D4** | Type scale anomaly | `text-3xl` (30px) is smaller than `text-2xl` (32px) | Fix in `main.css` |
| **D7** | Hardcoded colors outside the theme | AchievementBadge glow is fixed Slate indigo; Modal overlay is `bg-black/60` | Tokenize both |
| **D34** | Code editor syntax colors | One color per token class, approximated | Kit gap, low impact |

## Accessibility

| # | Finding | Recommendation |
|---|---|---|
| **D5** | `focus-visible` styling exists only on Button | Add a focus ring to Input, Toggle, nav links, chips |
| **D6** | MermaidEditor textarea suppresses focus with no replacement | Add a visible focus state |
| **D21** | Results prints raw analysis tags; VerdictBlock has no role | Render the tags, give the block a role/live region |

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
| **D15** | Dashboard/History have no error UI; Settings stays on the loader if prefs fail | 🐞 |
| **D16** | Belts empty state is dead code; no next-belt progress | UX |
| **D17** | History total counts failed and expired sessions | 🐞 |
| **D18** | Sidebar logout has no confirm, Settings logout does | inconsistency |
| **D19** | Sidebar has no History link; mobile nav lacks kumite, engawa, theme, logout | UX |
| **D20** | "Make profile private" is permanently disabled | decision |
| **D22** | Kata flow errors are silent; no abandon, no toasts | UX |
| **D23** | Engawa navigates to a non-existent `/playground/:lang` | 🐞 |
| **D35** | Katas copy says "below" while Customize is above | copy |
| **D37** | No run-tests button in the kata editor | decision |
| **D40** | ScrollFrame is not step-based (iframe + postMessage) | note |

### Admin-only (no number yet, grouped under D41's pass)

- AdminKatas and AdminEditKata have no error state.
- AdminEditKata shows a ⌘+S hint but binds no handler.
- The type filter offers REVIEW; the authoring form does not.
- Breadcrumb says EXERCISES while the page says Katas.

## Out of scope (confirmed)

Light-theme variants of every screen: the app's default resolves per OS, and the kit carries
all three themes. Screens are drawn in sumi only.
