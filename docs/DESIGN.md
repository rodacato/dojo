# Dojo — Design System

> **Status:** Canonical · **Last reviewed:** 2026-06-06
>
> Single source of truth for tokens, themes, motifs, components, and motion. Companion to:
>
> - [`BRANDING.md`](BRANDING.md) — brand strategy, glosario (kata / scroll / belt / milestone / engawa / kumite), voice & microcopy.
> - [`courses/INTERACTIVITY-PATTERNS.md`](courses/INTERACTIVITY-PATTERNS.md) — step type animations, per-step motion contracts.
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

- **Washi** (washi paper) for the light variant — warm rice paper, calm enough for the catalog and scroll reading
- **Sumi** (sumi ink) for the dark variant — deep ink black, made for the kata flow and long sessions
- A single accent: **hanko vermillion** (the red of a Japanese name seal)

The motifs are explicit: **brushstroke**, **enso** (the zen circle, used as loader + section mark), **hanko** (square seal, used as milestone earned + verdict stamp), **belt colors** for rank progression. The motion language is **ink-stroke reveal**, animated with GSAP (DrawSVG plugin, free since Webflow acquired GSAP in 2024).

**Why migrate:**
- Distinctive (not the purple-gradient AI-slop default of 2026)
- Ownable (cultural anchor consistent with dojo / kata / sensei vocabulary)
- Pedagogically calmer for scrolls (washi paper invites reading; slate cold-blue argues with prose)
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

### Semantic state tokens (figures inside scrolls)

A separate palette for the **inside** of embeddable figures inside scroll content (see [`courses/INTERACTIVITY-PATTERNS.md`](courses/INTERACTIVITY-PATTERNS.md) §Embeddable visual figures). These are *not* verdict colors (`PASSED` / `FAILED`) and *not* surface or accent colors. They label a cell, a track segment, or an annotated line according to its role in an instructional figure.

The contract is **color + shape + label** — accessibility for daltonism by construction. A figure renderer that uses color alone fails review.

| Token | Slate Indigo (shipped) | Sumi-e (both variants) | Shape / label | Used for |
|---|---|---|---|---|
| `--color-state-neutral` | `#94A3B8` | `#B9B2A6` (papel) / `#7D7568` (sumi) | no mark | Inactive / not yet visited |
| `--color-state-cand` | `#3E7CB1` | `#5C7FA8` | `◆ comparando` | Candidate, being compared |
| `--color-state-active` | `#F59E0B` | `#E0A93B` | `▸ actual` | Currently examined / focus of the step |
| `--color-state-out` | `#EF4444` | `#B05B4D` | `✕ descartado`, dashed border | Discarded, ruled out, the *culprit* in `before-after` |
| `--color-state-done` | `#10B981` | `#4C9A6A` | `✓ resuelto`, solid border | Confirmed, correct, the *fix* in `before-after` |
| `--color-state-path` | `#0D9488` | `#2E8B8B` | solid double border | Visited / part of the chosen path (graph-shaped figures only) |
| `--color-state-goal` | `#7C3AED` | `#7B5EA7` | `◎ objetivo` | The target the figure aims at |

These tokens render identically across the slate-indigo theme (today) and both sumi-e variants (target). They live in the same `@theme` block as the rest of the color tokens.

**Usage rules:**

- A figure may use **at most four** of these tokens simultaneously. More than four states in one visual is cognitive overload; refactor the figure or split into two.
- `--color-state-active` is for *what the reader is examining right now*. There is only one active cell per figure-frame. Two simultaneous active cells means the figure is conflating two concepts.
- `--color-state-out` doubles as the "wrong / culprit" mark on `before-after` annotations and as "discarded element" on `array-track`. Both meanings are *"this is the side the lesson rejects"* — same semantic, two surfaces.
- Never use these tokens for live product state (e.g. a real-time `cand` indicator on the kata-active screen). They are figure-internal vocabulary; surface state has its own tokens above.

### Verdict mapping

Verdict colors reuse the accent palette so visual code stays compact.

| Verdict | Color token |
|---|---|
| `PASSED` | `--color-success` |
| `PASSED WITH NOTES` | `--color-warning` |
| `NEEDS WORK` | `--color-danger` |
| `INCOMPLETE / EXPIRED` | `--color-muted` |

---

## Typography

Unchanged in the migration. The Sumi-e direction does NOT introduce a new face — monospace + Inter has been carrying the brand since v0 and it works in both themes.

| Family | Use |
|---|---|
| `JetBrains Mono` | Logo, dashboard numbers, code, timer, verdicts, all-caps labels, badges |
| `Inter` | Body, UI text, headings (except dashboard numbers and verdicts), descriptions |

**Type scale:**

| Token | Size / Line | Use |
|---|---|---|
| `--text-xs` | 11 / 16 | Labels, badges, timestamps, microcopy |
| `--text-sm` | 13 / 20 | Secondary content, descriptions |
| `--text-base` | 15 / 24 | Body, UI text |
| `--text-lg` | 18 / 28 | Section headers |
| `--text-xl` | 24 / 32 | Page titles (Inter) |
| `--text-2xl` | 32 / 40 | Dashboard stats (JetBrains Mono) |
| `--text-3xl` | 30 / 38 | Belt rank header on `/belts` (JetBrains Mono, all caps) |
| `--text-4xl` | 48 / 56 | Verdicts, hero numbers (JetBrains Mono, all caps) |
| `--text-5xl` | 56 / 64 | Verdict-size hero (kata results, share card, 404 hero, dashboard streak) |

These tokens live in `apps/web/src/styles/main.css` inside the `@theme` block — Tailwind 4 picks them up automatically and the resulting utilities (`text-xs`, `text-sm`, etc.) are bound to these values, overriding Tailwind defaults. Arbitrary values like `text-[13px]` are an anti-pattern from before this scale was formalized; new code uses the named utilities.

**Weight rules:**
- Inter: 400 (body), 500 (UI emphasis), 600 (titles, labels). No 700+, no light weights.
- JetBrains Mono: 400 (default), 500 (numbers), 700 (verdicts and logo only).

**All-caps usage:** reserved for badges, type labels, verdicts, section eyebrows, kbd shortcuts. Always JetBrains Mono. Tracked +0.5 to +1px. **Never** on headlines or body prose.

---

## Brand motifs

These are the Sumi-e direction's distinctive visual language. Used sparingly, deliberately. None of them ships in the Slate Indigo theme — they're the migration's new identity surface.

### Enso (円相, "circle of zen")

A single open brush circle. Imperfect by design — the gap is the point.

**Used as:**
- **Loader** — the enso draws itself clockwise with GSAP DrawSVG. ~600ms. Loops only if loading takes >2s; otherwise one stroke and done.
- **Section mark** — small (24px) enso glyph as a section eyebrow ornament. Optional, sparingly.
- **Profile avatar wash** — a faint enso behind the username on `/u/:username`. ~40% opacity.

**Forbidden:** never as a celebration burst. The enso is contemplative, not jubilant. If you find yourself filling it or animating it on a pass verdict, you've gone wrong.

### Hanko (判子, the name seal)

A square red stamp with the rank or milestone name in vertical text. The square is the stamp; the white character is the name.

**Used as:**
- **Earned milestone badge** — instead of a chip, a hanko stamp with the milestone slug in monospace caps. ~32×32. Sits in the milestone grid on `/belts`.
- **Verdict stamp on share cards** — the verdict (`PASSED`, `NEEDS_WORK`) appears as a hanko in the corner of the share card image. Adds gravitas; reads as "this is a real evaluation".
- **Black belt ring** — the avatar ring around a black-belt user is a hanko-style square instead of a circle. Differentiates the top rank visually.

**Forbidden:** never animate the hanko's stamping motion as a "celebration". The stamp lands once, no bounce, no sparkle.

### Brushstroke

A single ink stroke, hand-drawn feeling. Always uses `--color-accent` (vermillion) or `--color-primary` (ink/paper).

**Used as:**
- **Section underline** — under H1 / H2 page titles. Draws in with DrawSVG on first reveal. ~150ms.
- **Focus indicator** — focus rings can be a 2px solid (default) OR a brushstroke underline on text inputs. Pick the brushstroke for the kata-active flow (highest concentration surface).
- **Hover reveal on cards** — the bottom border of a kata card brushes in when hovered.

**Forbidden:** never use brushstrokes decoratively (random wiggles, multiple parallel strokes). One stroke, one purpose.

### Belt colors

Rank progression — already documented in `BRANDING.md` §Belts & Milestones. The visual realization is the avatar ring color (sidebar + `/u/:username` + share card variant).

**Used as:**
- **Avatar ring** — 2px solid ring around the user avatar. Color = current belt rank.
- **Profile header band** — a thin (4px) full-width band at the top of `/u/:username` in the user's belt color.
- **Share card variant** — the share card background carries a subtle belt-color wash (5% opacity).

**Forbidden:** belt colors never appear as a "level up" animation. The belt simply is — it doesn't celebrate itself.

---

## Shape & spacing

Mostly unchanged across the migration. The Sumi-e direction adds shape constraints around motifs.

### Border radius

| Element | Radius |
|---|---|
| Buttons, inputs, badges, chips | 4px |
| Cards, panels, modals | 6px |
| Avatars | 50% (circle — only place rounded-full is allowed; black belt is an exception, uses hanko square) |
| Hanko badges | 2px (just enough to feel intentional, not pill) |

**Never `rounded-full` on containers.** No pill buttons. No pill toggles.

### Spacing scale

Base unit `4px`. All margins, padding, gap are multiples of 4.

| Token | Value | Use |
|---|---|---|
| `space-1` | 4px | Tight internal padding, icon gaps |
| `space-2` | 8px | Inline element spacing |
| `space-3` | 12px | Input padding, compact list items |
| `space-4` | 16px | Card internal padding, default section gap |
| `space-6` | 24px | Section separation |
| `space-8` | 32px | Large section gaps |
| `space-12` | 48px | Page-level vertical rhythm |

### Borders & depth

- 1px solid `--color-border`. No thicker. No thinner.
- Hover state: border shifts to `--color-accent` over 150ms.
- **No drop shadows.** Depth comes from surface color stacking (`--color-surface` over `--color-page` etc.), never blur. Sumi-e theme reinforces this — ink doesn't cast shadow.
- **Exception:** modal overlays use a 1px ring + 50% opacity backdrop. That's the only depth cue allowed.

### Layout grid

- Desktop primary: 1280–1440px viewport
- Max content width: 1200px for marketing, 1280px for app shell (with sidebar)
- Sidebar (desktop): 192px expanded, 48px collapsed (icon rail)
- Bottom nav (mobile): 64px tall, fixed, icons + labels

---

## Motion

### Standard rules (apply in both themes)

- Transitions: 150ms (state changes) or 200ms (panel changes). Never longer.
- Easing: `ease-out` for enter, `ease-in` for exit, `ease-in-out` for moves. No bouncing. No spring physics.
- **Forbidden:** confetti, celebratory bursts, modal slide-ins from the bottom, scroll-jacking, parallax, FLIP-style rearrangement.

### Identity motion (Slate Indigo, shipped)

- The cursor `_` blinks at 1Hz on the logo and on streaming/loading states. The only "fun" animation.
- Skeleton shimmer for loads >200ms.

### Landing motion (shipped today)

GSAP **is already in the landing page** (`apps/web/src/pages/LandingPage.tsx`) as a deliberate exception to the "CSS only on product surfaces" rule. The landing is the only marketing surface in the product, and orchestrated motion earns its place there:

- Hero timeline (typewriter + cursor fade + second-line reveal + CTA stagger) consolidates three ad-hoc CSS/setTimeout animations into a single declarative timeline
- `ScrollTrigger.batch` drives the section reveals (one wrapper instead of four IntersectionObservers)
- TerminalDemo cycles three sample sessions with cross-fade — not possible cleanly without a timeline

This is the marketing exception, not a precedent. Cost: ~60KB gzipped, isolated to the landing chunk. Tradeoffs and decision rationale: see [`.kwik-e/memory/project_animation_scope.md`](../.kwik-e/memory/project_animation_scope.md) if present.

### Ink motion (Sumi-e direction)

When Sumi-e ships, GSAP becomes the motion language of the product itself. **DrawSVG** is the load-bearing plugin — free since 2024 when Webflow acquired GSAP. The library is lazy-loaded with the scroll player and kata flow routes only.

**Signature interactions:**

| Surface | Motion | Tech |
|---|---|---|
| Initial page load (`/`) | Enso draws clockwise (~600ms, one stroke) | GSAP DrawSVG |
| Section title appears on scroll-into-view | Brushstroke underline draws below the H1 | GSAP DrawSVG + ScrollTrigger |
| Verdict reveal (kata complete) | Hanko stamps down, no bounce — `scale(1.1, 1.1) → scale(1, 1)` in 200ms | GSAP timeline |
| Belt promotion (`/belts` rank change) | New belt color fades into avatar ring, 300ms. No flash, no sparkle. | GSAP timeline |
| Sensei message streaming | Cursor stays; replaces skeleton shimmer | unchanged (CSS) |
| Page transitions between scroll steps | Ink-wash fade — the outgoing content's opacity decays bottom-up like wet ink lifting | GSAP timeline |

**Felix's (S12) constraint, updated:** GSAP core (~50KB) + ScrollTrigger / DrawSVG plugins load only on the routes that use them. The route split is non-negotiable.

- **Landing (`/`)** — GSAP is in use today. See §Landing motion.
- **Kata flow + scroll player + results + share** — will import GSAP when Sumi-e ships (DrawSVG for motifs).
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

- **Light mode is no longer banned.** The pre-migration stance was "No light mode." The Sumi-e migration opens the washi (light) variant for the catalog and scroll-reading surfaces specifically — those benefit from a calmer reading background. Kata flow stays dark by default in both themes.

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
| Step type animations | `docs/courses/INTERACTIVITY-PATTERNS.md` |
| Belt rubric | `docs/prd/031-belt-progression-rubric.md` |

---

## Migration path

The Sumi-e direction is a sprint of its own. Not a piecemeal sed-and-pray.

### Prerequisites (none of this ships before)

1. **Designer pass on the values.** The hex codes in §Color tokens are v1 first-draft. Real calibration needs a designer with sumi-e eyes (or Adrian iterating against printed paper samples — yes, paper samples).
2. **Audit of every component against both themes.** Cards, buttons, inputs, badges all need contrast pass in both washi and sumi.
3. **GSAP runtime decision finalized** — currently planned: lazy-loaded on kata-flow and scroll-player routes only. If the perf budget shifts, the motion plan shifts.
4. **Theme switcher decision.** OS-preference auto-detect (`prefers-color-scheme`)? User toggle in settings? Both? The decision matters for the migration shape — auto-detect alone is simpler, both is more work.

### Migration order (when it ships)

1. **Sprint kickoff:** the theme switcher ships as a regular feature, not behind a flag. Sole-user constraint — the only person who sees a broken Sumi-e draft is the creator, who can flip to Slate from the sidebar or settings in one click.
2. **Token values:** add CSS classes `[data-theme="sumi"]` and `[data-theme="washi"]` that override the `@theme` defaults. `<html>` carries the attribute based on user preference (localStorage) or OS prefers-color-scheme when set to `auto`.
3. **Motifs first, gradually:** ship Enso Loader on `/scrolls` only behind the flag. Verify rendering, perf, reduced-motion fallback. Then enable on `/katas`. Then everywhere.
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

- Anonymous learners (engawa, public scrolls) need to pick a theme before they have an account — DB sync requires auth
- For v1, the only user is the creator, on the same machine. Multi-device sync is solving a problem nobody has
- Pattern: read `prefers-color-scheme` as the default; on user toggle, persist to `localStorage.dojo-theme`; on subsequent loads, localStorage wins over OS default
- Adding DB sync later is **not breaking** — just promote the localStorage value to the user record when login happens

The toggle lives in `/settings` and as a sidebar icon. The toggle's existence is justified — the same developer might want washi for reading scrolls and sumi for the kata flow on the same day.

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

- CodeMirror already loaded on `/katas/*` and `/scrolls/*`: ~200KB
- Mermaid on scroll-player when used: ~400KB

60KB on routes already at ~600KB is signal under the noise floor. Approved.

**Where GSAP lives today + planned:**

| Route | Status | Reason |
|---|---|---|
| `/` (landing) | shipped | Marketing surface — orchestrated hero + scroll reveals + rotating terminal demo. The exception that earns its keep by consolidating three ad-hoc animations into one declarative timeline. |
| `/katas/*` | planned (post-Sumi-e) | Brushstroke focus indicator, hanko verdict stamp, ink-wash transitions. |
| `/scrolls/*` | planned (post-Sumi-e) | Enso loader, brushstroke H1 underlines, ink-wash between steps. **Note:** Rive owns the per-step interactivity inside scrolls (see §Motion library scope below); GSAP owns the scaffold motion around them. |
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

## Motion library scope: GSAP for the site, Rive for scrolls

> **2026-06-07 status note:** Sprint 026's reversal in [`courses/INTERACTIVITY-PATTERNS.md`](courses/INTERACTIVITY-PATTERNS.md) §Animation tech parked Rive indefinitely on `/scrolls/*` (GSAP + CSS only). This section's two-library framing is preserved as **history** while the migration sprint is still ahead; the canonical motion contract for scrolls today is the one in INTERACTIVITY-PATTERNS.md. When the Sumi-e migration ships, fold this section into a single "GSAP for site motion" subsection and drop Rive from the matrix.

Two animation libraries, scoped by domain (historical framing, see status note above):

- **GSAP (with DrawSVG + ScrollTrigger)** — site motion identity. Owns the landing marketing motion today (hero timeline, scroll reveals, terminal demo carousel). Post-Sumi-e: enso loader, brushstroke reveals on H1, hanko stamp on verdicts, page transitions, the ink-wash between scroll steps. Routes: landing today + (kata flow, scroll player, results, share) post-migration. Bundle: ~60KB lazy-loaded per route, never on dashboard/admin.
- **Rive** — interactive step types inside scrolls. Owns predict state machines (`unanswered → reviewing → revealed`), trace step transitions when path-along-DOM is required. Routes: `/scrolls/*` only. Bundle: ~30KB runtime + small .riv files per step.

They co-load only on `/scrolls/*`. Combined motion runtime on the scroll player: ~90KB, which sits below CodeMirror (~200KB) and Mermaid (~400KB) that already ship on the same routes.

### Why two libraries, honestly

A panel debate happened. Felix (S12) initially pushed for one library (GSAP-only), citing one mental model and no double runtime. The case was: Rive's designer-tool advantage is hypothetical because Dojo doesn't have a dedicated designer.

The creator's call (Adrian, per Kira's principle "the panel advises, the creator decides"): **the designer-author advantage is concrete, not hypothetical.** Rive's state machine editor is genuinely better for the predict reveal flow than a hand-written GSAP timeline. The creator iterates animations in Rive without writing TypeScript — that's the design loop that matters when the step type is the highest-leverage pedagogical surface of the product.

**The honest trade-off:**

- Extra mental model for the engineer (one library per domain). Acceptable for a one-person team.
- ~30KB extra on `/scrolls/*`. Below the noise floor on routes already at ~600KB.
- Two `prefers-reduced-motion` fallbacks to verify. Both libraries respect the OS setting; the testing burden is real but small.
- When contributors arrive (Phase 3+), the two-library learning curve becomes a cost. **Revisit then** — explicitly flagged for Phase 3 panel review.

The decision is documented here, in [`courses/INTERACTIVITY-PATTERNS.md`](courses/INTERACTIVITY-PATTERNS.md), and in Felix's persona update (S12). If the migration sprint discovers either library is poorly suited, this is the section to revise — not the per-step pages.

---

## Related documents

- [`BRANDING.md`](BRANDING.md) — voice, glosario, microcopy, identity strategy
- [`VISION.md`](VISION.md) — product strategy
- [`courses/INTERACTIVITY-PATTERNS.md`](courses/INTERACTIVITY-PATTERNS.md) — step-type animations and motion contracts
- [`prd/031-belt-progression-rubric.md`](prd/031-belt-progression-rubric.md) — belt rank rubric (the colors in §Belt rank colors realize this)
- [`adr/020-ubiquitous-language-pass.md`](adr/020-ubiquitous-language-pass.md) — Sprint 023's rename that introduced `scroll / kata / belt / milestone` as the visible vocabulary
