# Dojo — Design System

> Roles, invariants and rules for how the product looks and moves. **Values live in code:** token hex values are in [`apps/web/src/styles/main.css`](../apps/web/src/styles/main.css), the primitives in [`apps/web/src/components/ui/`](../apps/web/src/components/ui/). Voice, glossary and microcopy are in the [brand guide](../design/brand/README.md).

---

## Themes

Three palettes share one set of token names; only the values differ.

- **Sumi** (ink, dark) and **Washi** (paper, light) are the brand. The default `auto` resolves to one or the other from the OS preference (`apps/web/src/lib/theme.ts`). The kata flow stays dark by default.
- **Slate Indigo** is the `@theme` default in `main.css`, rendered only when picked in the toggle. It is the escape hatch, not the brand.
- The choice is persisted in `localStorage` (`dojo-theme`), with no DB column: anonymous learners pick a theme before they have an account.

Both brand themes use a single accent, the **hanko vermillion**.

## Principles

- **Calm over cool.** The kata flow is intense; the surrounding UI is not.
- **Brutal honesty extends to visuals.** No celebratory bursts, no encouraging gradients. A graphic element that carries no signal is removed.
- **Distinct, not novel.** Sumi-e is a borrowed, well-worn visual language; it is not invented originality.
- **Self-host friendly.** No third-party fonts beyond the declared two, no CDN-locked assets.

Three checks: it would not embarrass a developer on a Friday demo; it could not appear on a 2019 B2B SaaS landing; it does not pat the user on the back.

## Color tokens

Tokens are referenced by name, never raw hex. Roles:

| Group | Tokens | Role |
|---|---|---|
| Surface | `page`, `surface`, `elevated`, `border` | Background, cards and modals, hover and popovers, 1px dividers |
| Text | `primary`, `secondary`, `muted` | Content, descriptions and labels, placeholders and disabled |
| Accent | `accent`, `on-accent` | Filled primary action, focus rings, the mark; label color on a filled accent |
| Status | `success`, `danger`, `warning` | Fills, borders and dots only |
| Status text | `accent-text`, `success-text`, `danger-text`, `warning-text` | Text-sized variants |

**Why the `-text` variants exist:** the fill colors fail AA contrast as small text on one theme or the other (`accent` and `danger` on sumi, `success` and `warning` on washi). Fills use the base token; text uses the `-text` token.

**Accent is reserved** for: the primary action, links, focus rings, the logo mark and its `_` cursor, the hanko seal, loaders, data fills (heatmap, bars), keyword color in the code editor and the landing terminal mock. The verdict block takes the verdict color, not accent. Selection, stat numbers and eyebrows stay neutral and carry a non-color cue. Anything else in accent is a bug.

**Vermillion vs danger** are close cousins on purpose: accent is the positive seal, danger is a deeper variant for failure.

### Kata type colors

Each kata type keeps a stable color across themes so the user learns the code: `CODE`, `CHAT`, `WHITEBOARD`, `REVIEW`. Values: `Badge.tsx` and `main.css`.

### Belt rank colors

White, yellow, green, brown and black. Same in every theme. They are used for the avatar ring (`BeltRingAvatar`) and the share-card belt variant. The rubric is [`prd/031-belt-progression-rubric.md`](prd/031-belt-progression-rubric.md); values are in code.

## Typography

JetBrains Mono for the product's identity surfaces: eyebrows (small, uppercase, tracked) and verdicts (caps, never softened, never followed by encouraging copy). Error states show the actual error message verbatim. Voice rules are in `design/brand/README.md`.

## Motifs

Brushstroke, enso (loader and section mark), hanko (square seal: milestone earned, verdict stamp) and belt colors. Implemented in `ui/`: `EnsoLoader`, `BrushstrokeUnderline`, `HankoBadge`, `BeltRingAvatar`.

- Hanko text is the English slug in monospace caps (`FIRST KATA`): the hanko is Japanese in form, not in text.
- Brushstrokes are never AI-generated or procedural; they fail the brand test.

## Motion

CSS handles binary state, fades, hovers and simple transitions. **GSAP** (core, DrawSVG, ScrollTrigger) is reserved for timeline-shaped motion: choreographed sequences, DrawSVG paths CSS cannot draw, and procedural transforms. It loads lazily, per route.

| Surface | GSAP |
|---|---|
| Landing (`/`) | In use |
| Brand primitives (`EnsoLoader`, `BrushstrokeUnderline`) | In use |
| Dashboard and `/admin/*` | Never: CSS-only by brand contract |

`prefers-reduced-motion: reduce` resolves every GSAP animation to its final state instantly. The 1Hz cursor blink stays. There is no shared hook for the check yet; see the project memory on animation scope before adding GSAP somewhere new.

Scrolls are external apps embedded by iframe (ADR 025), so their interior motion is the scroll author's concern.

## What we don't do

- No glassmorphism, no neumorphism, no corners larger than 6px on cards.
- No emoji as UI iconography, no stock photography or illustration.
- No "Premium" anything, no achievement-style badges (Discord, Steam, Duolingo); badges are typographic or hanko-stamped.
- No watercolor fills, no cherry blossoms, no mascot (the sensei is a voice, never an avatar).
- No "ceremony" framing in microcopy: the dojo is a workspace, not a temple.

## Accessibility floor

- Text meets WCAG AA on its actual background, in every theme.
- Interactive elements have a visible focus ring (2px solid `accent`).
- Icon-only buttons carry an `aria-label` or tooltip.
- Color is never the only signal: verdict states pair color with explicit text.

## Share cards

Share cards are PNGs rendered server-side in `apps/api/src/infrastructure/http/routes/share.ts`, using `@resvg/resvg-js`. The card uses the Sumi palette and the Open Gate mark (lockup: mark in accent, `dojo_` in primary), with the verdict color as a per-share input. It does not draw a hanko yet.

## Related

- [`design/brand/README.md`](../design/brand/README.md): brand guide — voice, glossary, microcopy, identity, brand assets
- [`VISION.md`](VISION.md): product strategy
- [`adr/020-ubiquitous-language-pass.md`](adr/020-ubiquitous-language-pass.md): the `scroll / kata / belt / milestone` vocabulary
