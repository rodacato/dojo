# Dojo — Design System

> **Status:** Canonical · **Last reviewed:** 2026-06-06
>
> Single source of truth for tokens, themes, motifs, components, and motion. Companion to:
>
> - [`BRANDING.md`](BRANDING.md) — brand strategy, glosario (kata / scroll / belt / milestone / engawa / kumite), voice & microcopy.
>
> When this file and any other diverge, **this file is the source of truth.**

---

## What this document is for

The brand voice is in `BRANDING.md`. The product strategy is in `VISION.md`. **This file is the rest** — what the product looks and moves like.

It exists because two surfaces were drifting:

- `apps/web/src/styles/main.css` was the de-facto truth (the values that actually render)
- The sumi-e visual direction Adrian articulated in 2026-06 lived only in chat

This file consolidates them, declares the migration honestly, and keeps the token contract stable while the values evolve.

---

## Two themes, one system

Dojo carries two complete palettes. Both run on the same token names — only the values differ.

### Theme A — **Slate Indigo** (shipped today)

What renders in production. "Terminal meets product" — Linear / Raycast / Warp as references. Cold blue-grays with an indigo accent. Implemented in `apps/web/src/styles/main.css`.

This theme stays the source of truth for `--color-*` values **until the Sumi-e migration sprint lands**. No piecemeal swap.

### Theme B — **Sumi-e Ink** (target direction)

Where the brand is heading. Two complementary surfaces under one identity:

- **Washi** (washi paper) for the light variant — warm rice paper, calm enough for the catalog and long reading
- **Sumi** (sumi ink) for the dark variant — deep ink black, made for the kata flow and long sessions
- A single accent: **hanko vermillion** (the red of a Japanese name seal)

The motifs are explicit: **brushstroke**, **enso** (the zen circle, used as loader + section mark), **hanko** (square seal, used as milestone earned + verdict stamp), **belt colors** for rank progression. The motion language is **ink-stroke reveal**, animated with GSAP (DrawSVG plugin, free since Webflow acquired GSAP in 2024).

**Why migrate:**
- Distinctive (not the purple-gradient AI-slop default of 2026)
- Ownable (cultural anchor consistent with dojo / kata / sensei vocabulary)
- Pedagogically calmer for long reading (washi paper invites reading; slate cold-blue argues with prose)
- GSAP DrawSVG stops being a one-off experiment and becomes the site's motion signature

**Why not yet:**
- Token values for Sumi-e need a designer pass (current values in this doc are v1 draft — expect calibration)
- A two-theme system requires the components to be re-audited against both palettes; that's a sprint, not an afternoon
- The user-facing toggle (`Auto / Sumi / Washi / Slate`) is always available; `Slate` stays in the toggle as the legacy escape hatch during calibration

---

## Design principles

**Calm over cool.** The kata flow is intense; the surrounding UI is not. We don't add visual noise to "support" the experience — the experience is the developer thinking.

**Brutal honesty extends to visuals.** No celebratory bursts, no encouraging gradients, no "your progress 🚀". If a graphic element doesn't carry signal, it's removed.

**Distinct, not novel.** Sumi-e is borrowed; it's been used in graphic design for 1,500 years. Borrowing well-worn cultural patterns is the opposite of inventing fake originality.

**Self-host friendly.** No third-party fonts beyond the two declared. No CDN-locked assets. The whole brand renders from a single CSS file + a small SVG sprite.

**One acento, two themes.** The vermillion of the hanko reads in both washi and sumi. Single accent simplifies decisions: if it's interactive, it's vermillion. If it's not, it isn't.

**Three rules of thumb:**

1. If a developer would be embarrassed to show this on a Friday demo, it's wrong.
2. If it could appear in a B2B SaaS landing page from 2019, it's wrong.
3. If it tries to pat the user on the back, it's wrong.

---

## Color tokens

Tokens are referenced by name everywhere in code. Never raw hex. Both themes use the same names; only the values change.

### Surface tokens

| Token | Slate Indigo (shipped) | Sumi (dark target) | Washi (light target) | Usage |
|---|---|---|---|---|
| `--color-page` | `#0F172A` | `#0A0908` | `#F5F1E8` | Page background |
| `--color-surface` | `#1E293B` | `#13110F` | `#EDE7D9` | Cards, panels, editors, modals |
| `--color-elevated` | `#253347` | `#1B1815` | `#E3DCC9` | Hover, popovers, dropdowns |
| `--color-border` | `#334155` | `#2A2520` | `#C9BFA8` | Borders, dividers (always 1px) |

### Text tokens

| Token | Slate Indigo (shipped) | Sumi (dark target) | Washi (light target) | Usage |
|---|---|---|---|---|
| `--color-primary` | `#F8FAFC` | `#F2EDE3` | `#1F1B16` | Headlines, body, primary content |
| `--color-secondary` | `#94A3B8` | `#A39A8C` | `#5C5448` | Descriptions, labels, metadata |
| `--color-muted` | `#475569` | `#5C544A` | `#8A8071` | Placeholders, disabled, microcopy |

### Accent tokens

| Token | Slate Indigo (shipped) | Sumi-e (both variants) | Usage |
|---|---|---|---|
| `--color-accent` | `#6366F1` (Indigo 500) | `#B73A2F` (hanko vermillion) | CTAs, focus rings, links, active state |
| `--color-on-accent` | `#FFFFFF` | `#FAF7F0` washi · `#F2EDE3` sumi (ink-white) | Foreground on a filled `bg-accent` (button label, user bubble, active segment, hanko caps) — keeps AA contrast where `--color-primary` inverts to near-black under washi |
| `--color-success` | `#10B981` (Emerald) | `#5C7A4E` washi · `#7D9B6A` sumi (matcha) | Passed verdict, completion, streak active |
| `--color-danger` | `#EF4444` (Red 500) | `#9C2D24` (deeper than accent) | Failed sessions, errors, expired timer |
| `--color-warning` | `#F59E0B` (Amber 500) | `#BC8E37` washi · `#D4A547` sumi (gold ink) | Timer near limit, warnings, "passed with notes" |

> **Vermillion vs danger:** the hanko accent and the danger color are close cousins on purpose. The accent is the brand's positive interactive color — the seal. Danger is a deeper variant for actual failure states. They are visually distinct in practice; the brand bleeds into "failure looks like an unfortunate seal", which is on-brand.

### Type badge tokens (kata types)

The kata type carries a stable color across themes — the user learns the visual code.

| Type | Slate Indigo | Sumi-e | Used by |
|---|---|---|---|
| `CODE` | `#64748B` | `#6B5E51` (warm gray) | Refactor, debug, complete, review |
| `CHAT` | `#7C3AED` | `#5A4275` (muted purple, less neon) | Technical roleplay, discussion |
| `WHITEBOARD` | `#0D9488` | `#3F6B68` (teal-ink) | System design, architecture (Mermaid) |
| `REVIEW` | `#6366F1` (uses accent) | `#B73A2F` (uses accent) | Code review katas |

### Belt rank colors (progression)

Used for the belt rank avatar ring and the share-card belt variant. Same across themes — belt colors are universal.

| Belt | Hex | Notes |
|---|---|---|
| White | `#F2EDE3` | Matches the washi primary text — looks like paper on either bg |
| Yellow | `#D4A547` | Gold ink; matches sumi `warning` |
| Green | `#7D9B6A` | Matcha; matches sumi `success` |
| Brown | `#7A5A3F` | Tobacco / brown ink |
| Black | `#0A0908` | Sumi black |

See `BRANDING.md` §Belts & Milestones for the rubric and visibility rules. The colors above are the visual realization.

### Ink motion (Sumi-e direction)

When Sumi-e ships, GSAP becomes the motion language of the product itself. **DrawSVG** is the load-bearing plugin — free since 2024 when Webflow acquired GSAP. The library is lazy-loaded on the kata flow routes only.

**Signature interactions:**

| Surface | Motion | Tech |
|---|---|---|
| Initial page load (`/`) | Enso draws clockwise (~600ms, one stroke) | GSAP DrawSVG |
| Section title appears on scroll-into-view | Brushstroke underline draws below the H1 | GSAP DrawSVG + ScrollTrigger |
| Verdict reveal (kata complete) | Hanko stamps down, no bounce — `scale(1.1, 1.1) → scale(1, 1)` in 200ms | GSAP timeline |
| Belt promotion (`/belts` rank change) | New belt color fades into avatar ring, 300ms. No flash, no sparkle. | GSAP timeline |
| Sensei message streaming | Cursor stays; replaces skeleton shimmer | unchanged (CSS) |

**Felix's (S12) constraint, updated:** GSAP core (~50KB) + ScrollTrigger / DrawSVG plugins load only on the routes that use them. The route split is non-negotiable.

- **Landing (`/`)** — GSAP is in use today. See §Landing motion.
- **Kata flow + results + share** — will import GSAP when Sumi-e ships (DrawSVG for motifs).
- **Dashboard + admin** — never. These surfaces stay CSS-only by brand contract (no orchestrated motion on post-login orientation or creator tooling).

**Predicted reduced-motion behavior:** with `prefers-reduced-motion: reduce` set by the OS, all GSAP animations resolve to their final state instantly. The enso appears fully drawn. The brushstroke appears fully drawn. The hanko appears already stamped. The cursor blink can stay (1Hz blink is below the seizure-risk threshold). Tested via Playwright with reduced-motion mode active.

---

## Voice & microcopy

Lives in [`BRANDING.md`](BRANDING.md) — vocabulary, tone, examples, microcopy library. Not duplicated here.

Quick reference for what this document enforces visually:

- **Eyebrows** are 11px JetBrains Mono uppercase tracked +0.5 to +1px. Used above page H1 to set context (`PRACTICE · TODAY` etc.).
- **Verdicts** are JetBrains Mono 32px caps. Never softened, never followed by encouraging copy.
- **Error states** show the actual error message verbatim, not a paraphrase. The voice for that lives in `BRANDING.md` §Microcopy library.

---

## Component vocabulary

The shipped components carry the contract defined elsewhere in this doc (Color tokens, Typography, Shape & spacing, Motion). This section names the **additions and changes** the Sumi-e migration introduces. Everything not listed here keeps its existing shape.

### New in Sumi-e

- **Enso Loader** — replaces the spinner on any operation that may exceed 1s. SVG circle with `<path d="M ...">` and GSAP DrawSVG animating `drawSVG: 0% → 100%`. Loops only if loading >2s.
- **Hanko Badge** — replaces chip-style milestone badges. Square 32×32, 2px corner radius, vermillion bg, ink-white milestone slug in vertical-stack monospace.
- **Belt Ring Avatar** — `<div>` with `border-radius: 50%` and a 2px ring in the belt color. Black-belt variant uses a square (hanko-shape) instead of circle.
- **Brushstroke Underline** — `<svg>` positioned absolutely below H1 with a path drawn in vermillion. Triggers on `IntersectionObserver` (or ScrollTrigger).
- **Verdict Stamp** — replaces the indigo left-border verdict block on results pages. A hanko stamps into the top-right of the verdict card.

### Changes to existing components

- **Sensei avatar** — sumi theme has a faint enso behind the initials (40% opacity).
- **Streak heatmap** — sumi theme uses ink-wash colors instead of indigo cells: `empty #13110F`, `low #2A2520`, `mid #5C544A`, `high #B73A2F`. Same intensity ramp, just the ink dialect.
- **Verdict block** — the 4px left border becomes a vermillion brushstroke (drawn) instead of a solid bar.

### Unchanged

Cards, buttons, inputs, tag chips, code editor, mermaid editor, timer, public share page layout — all preserve their existing shape. Only color values update during migration.

---

## What we don't do

Reinforced rules — these apply across themes and never lapse during the Sumi-e migration:

- **No glassmorphism.** No frosted blurs.
- **No neumorphism.** No inner shadows.
- **No big rounded corners.** Max 6px on cards.
- **No emoji in the UI.** Microcopy can reference emojis as text (the hero already mentions 💀); UI controls do not use them as iconography.
- **No stock photography or illustration.** Empty states use type, color, and the cursor — that's it.
- **No "Premium" anything.** No upsell. No paywall.
- **No achievement-style badges** (Discord, Steam, Duolingo). Badges are typographic or hanko-stamped.

**Sumi-e specific additions:**

- **No watercolor fills.** The brand is ink, not paint. Solid strokes, solid surfaces.
- **No cherry-blossom anything.** Don't reach for the most-obvious Japanese motif. Enso, hanko, brushstroke — that's the palette.
- **No mascot.** Brilliant has a learning companion; Dojo does not. The sensei is voice, never an avatar.
- **No "ceremony" framing in microcopy.** The dojo is a workspace, not a temple. Don't write "bow before entering" type prose — that's cosplay.

**Stance change from previous (note explicitly):**

- **Light mode is no longer banned.** The pre-migration stance was "No light mode." The Sumi-e migration opens the washi (light) variant for the catalog and long-reading surfaces specifically — those benefit from a calmer reading background. Kata flow stays dark by default in both themes.

---

## Token implementation locations

Where each token lives in code, for the next person who touches them:

| Surface | Path |
|---|---|
| Source of truth for values | This file — `docs/DESIGN.md` |
| Shipped CSS (Slate Indigo) | `apps/web/src/styles/main.css` (`@theme` block) |
| Sumi-e theme overrides | `apps/web/src/styles/main.css` (`[data-theme='sumi'\|'washi']` blocks) |
| Tailwind utilities | Generated by Tailwind 4 from the `@theme` block in `main.css` |
| Brand glosario, voice, microcopy | `docs/BRANDING.md` |
| Belt rubric | `docs/prd/031-belt-progression-rubric.md` |

---

## Migration path

The Sumi-e direction is a sprint of its own. Not a piecemeal sed-and-pray.

### Prerequisites (none of this ships before)

1. **Designer pass on the values.** The hex codes in §Color tokens are v1 first-draft. Real calibration needs a designer with sumi-e eyes (or Adrian iterating against printed paper samples — yes, paper samples).
2. **Audit of every component against both themes.** Cards, buttons, inputs, badges all need contrast pass in both washi and sumi.
3. **GSAP runtime decision finalized** — currently planned: lazy-loaded on kata-flow routes only. If the perf budget shifts, the motion plan shifts.
4. **Theme switcher decision.** OS-preference auto-detect (`prefers-color-scheme`)? User toggle in settings? Both? The decision matters for the migration shape — auto-detect alone is simpler, both is more work.

### Migration order (when it ships)

1. **Sprint kickoff:** the theme switcher ships as a regular feature, not behind a flag. Sole-user constraint — the only person who sees a broken Sumi-e draft is the creator, who can flip to Slate from the sidebar or settings in one click.
2. **Token values:** add CSS classes `[data-theme="sumi"]` and `[data-theme="washi"]` that override the `@theme` defaults. `<html>` carries the attribute based on user preference (localStorage) or OS prefers-color-scheme when set to `auto`.
3. **Motifs first, gradually:** ship Enso Loader on one route only behind the flag. Verify rendering, perf, reduced-motion fallback. Then enable on `/katas`. Then everywhere.
4. **Verdict + share card** — high-visibility surfaces; ship these once Enso + Hanko + brushstroke are stable.
5. **Belt + avatar + heatmap colors** — last because they're cross-cutting and benign-looking-but-everywhere.
6. **Cleanup:** remove the slate-indigo values from this doc and from `main.css`. This is the last commit of the migration sprint.

**Rollback:** the creator picks `Slate` from the theme toggle and the document re-renders without `data-theme` set, falling back to the @theme defaults. The slate-indigo values stay in this doc until the cleanup commit, exactly so rollback is a single click, not a revert.

### What does NOT migrate

- **The kata flow's focus mode.** Sidebar-hidden, full-bleed kata-active screen stays exactly as today. The visual stakes of "you are doing the work now" trump theme-system consistency.
- **The wordmark `dojo_`.** The cursor `_` is the brand and its blink is unchanged. The dojo doesn't get a new logo for changing its skin.
- **Admin surfaces.** They render in slate-indigo permanently. There is one creator; the admin doesn't need theme-switching infrastructure. Keep it simple.

---

## Accessibility floor

- All text meets WCAG AA contrast on its actual background. Both themes audited before ship.
- All interactive elements have visible focus rings — 2px solid `--color-accent`, or brushstroke variant on kata-active inputs.
- All icons have text labels or `aria-label`. No icon-only buttons without a tooltip.
- Color is never the only signal — verdict states pair color with explicit text.
- Animations respect `prefers-reduced-motion` — GSAP timelines resolve to final state instantly when the OS setting is on. Cursor blink (1Hz) stays — far below seizure-risk threshold.

---

## Decided (was: open questions)

These five were live during the doc's first draft. Each is now resolved. Reasoning kept short — the call goes here, the constraint goes back into the relevant section.

### 1. Hanko text is English slug, in monospace caps

The milestone hanko shows `FIRST KATA` / `POLYGLOT` / `BLACK BELT` in JetBrains Mono uppercase, not a stylized Japanese character. The "product UI is English only" stance from `BRANDING.md` outranks cultural-motif integrity. The hanko stays Japanese in *form* (the square red seal), not in *text*. Legibility for the audience (English-reading developers) wins.

### 2. Theme persistence: localStorage only, defaults to OS preference

No `userPreferences.theme` column. Why:

- Anonymous learners (engawa) need to pick a theme before they have an account — DB sync requires auth
- For v1, the only user is the creator, on the same machine. Multi-device sync is solving a problem nobody has
- Pattern: read `prefers-color-scheme` as the default; on user toggle, persist to `localStorage.dojo-theme`; on subsequent loads, localStorage wins over OS default
- Adding DB sync later is **not breaking** — just promote the localStorage value to the user record when login happens

The toggle lives in `/settings` and as a sidebar icon. The toggle's existence is justified — the same developer might want washi for reading and sumi for the kata flow on the same day.

### 3. Pre-drawn brushstroke library (~6 strokes, picked by seed)

Procedural sumi-e generation looks fake. Real brushstrokes carry weight that a math function doesn't. The brand promise — "intentional, ownable, not AI slop" — is precisely the opposite of generative randomness.

**Plan:**

- Library of 6 hand-picked strokes stored as SVG paths in a single sprite (`apps/web/public/brushstrokes.svg` when the migration sprint creates it)
- Each stroke is a single `<path>` ~200×20 viewBox, no fill, vermillion stroke 1.5–2px
- Use a deterministic seed (e.g., string hash of the card's title or slug) to pick a stroke per usage — so the same card always renders with the same stroke, but different cards visually vary
- Total sprite size budget: ~3KB

**Sources for the strokes themselves** (acceptable for v1):

- CC0 brush libraries from Wikimedia Commons or Unsplash brush collections
- Existing Procreate / Adobe brush exports under permissive license
- Eventually: commissioned strokes from a designer (a half-day's work for a real sumi-e calligrapher)

Avoid AI-generated strokes — they fail the brand test.

### 4. GSAP bundle is approved with route lazy-load

Felix's quantitative test: ~60KB added (GSAP core ~50KB + DrawSVG plugin ~10KB), lazy-loaded per route. The comparison frame:

- CodeMirror already loaded on `/katas/*`: ~200KB

60KB on routes already at ~600KB is signal under the noise floor. Approved.

**Where GSAP lives today + planned:**

| Route | Status | Reason |
|---|---|---|
| `/` (landing) | shipped | Marketing surface — orchestrated hero + scroll reveals + rotating terminal demo. The exception that earns its keep by consolidating three ad-hoc animations into one declarative timeline. |
| `/katas/*` | planned (post-Sumi-e) | Brushstroke focus indicator, hanko verdict stamp, ink-wash transitions. |
| `/results/*`, `/share/*` | planned (post-Sumi-e) | Hanko verdict stamp animation. |
| `/dashboard`, `/admin/*` | never | Brand restraint — these surfaces stay CSS-only forever. |

**Qualitative rule (Felix's, kept):** use GSAP when:
- Multiple choreographed steps in sequence (predict reveal — highlight → diff slide → sensei text)
- DrawSVG paths (enso, brushstroke, hanko) — CSS cannot draw these
- Procedural transforms with timing that CSS keyframes can't express (verdict stamp anti-bounce)

For everything else (binary state change, opacity transitions, simple translates) — CSS, not GSAP.

### 5. Server-rendered hanko on share cards via Satori

Share cards are PNG, generated server-side. The hanko is composed as inline SVG within the share card's JSX/HTML template, rendered through Satori (the lib behind `@vercel/og`). No pre-rendered asset library.

Why:
- Verdict color + milestone slug + belt color all vary per user/per-share — a pre-rendered template is rigid
- Satori renders JSX/HTML to PNG. The hanko component is just `<svg>...<rect>...<text>...</svg>` with dynamic props
- Server bundle gains ~500KB but only on `/share/*` routes; cache headers are aggressive (share cards rarely change), so cold-start cost amortizes fast
- The existing `apps/api/src/infrastructure/http/routes/share.ts` already renders PNGs — Satori (if not already used) slots into the same handler

The migration sprint validates whether the current renderer is Satori-compatible. If it's currently using a different lib (Sharp + composite, for example), we either swap to Satori or render the hanko SVG to an inline `<image>` in the existing pipeline.

---

## Motion library scope

GSAP (with DrawSVG + ScrollTrigger) is the only motion library: landing today, and post-Sumi-e the enso loader, brushstroke reveals on H1, hanko stamp on verdicts. Bundle ~60KB, lazy-loaded per route, never on dashboard/admin. Everything else is CSS.

Scrolls are external apps embedded by iframe (ADR 025), so their interior motion is the scroll author's concern, not Dojo's design system.

---

## Related documents

- [`BRANDING.md`](BRANDING.md) — voice, glosario, microcopy, identity strategy
- [`VISION.md`](VISION.md) — product strategy
- [`prd/031-belt-progression-rubric.md`](prd/031-belt-progression-rubric.md) — belt rank rubric (the colors in §Belt rank colors realize this)
- [`adr/020-ubiquitous-language-pass.md`](adr/020-ubiquitous-language-pass.md) — Sprint 023's rename that introduced `scroll / kata / belt / milestone` as the visible vocabulary
