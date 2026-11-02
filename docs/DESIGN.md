# Dojo — Design System

> Roles, invariants and rules for how the product looks and moves. **Values live in code:** token hex values are in [`apps/web/src/styles/main.css`](../apps/web/src/styles/main.css), the primitives in [`apps/web/src/components/ui/`](../apps/web/src/components/ui/). Voice, glossary and microcopy are in the [brand guide](../design/brand/README.md).

---

## Themes

Two palettes share one set of token names; only the values differ.

- **Sumi** (ink, dark) and **Washi** (paper, light) are the brand. The default `auto` resolves to one or the other from the OS preference (`apps/web/src/lib/theme.ts`).
- The choice is persisted in `localStorage` (`dojo-theme`), with no DB column: anonymous learners pick a theme before they have an account.

Both brand themes use a single accent, **vermillion**.

## Principles

- **Calm over cool.** The kata flow is intense; the surrounding UI is not.
- **Brutal honesty extends to visuals.** No celebratory bursts, no encouraging gradients. A graphic element that carries no signal is removed.
- **Distinct, not novel.** Paper and ink are a borrowed, well-worn visual language; it is not invented originality.
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

**Accent is reserved** for: the primary action, links, focus rings, the logo mark and its `_` cursor, loaders, data fills (heatmap, bars), keyword color in the code editor and the landing terminal mock. The verdict block takes the verdict color, not accent. Selection, stat numbers and eyebrows stay neutral and carry a non-color cue. Anything else in accent is a bug.

**Vermillion vs danger** are close cousins on purpose: accent is the positive seal, danger is a deeper variant for failure.

### Kata type colors

Each kata type keeps a stable color across themes so the user learns the code: `CODE`, `CHAT`, `WHITEBOARD`, `REVIEW`. Values: `Badge.tsx` and `main.css`.

### Belt rank colors

White, yellow, green, brown and black. Same in every theme. They are used for the avatar ring (`BeltRingAvatar`) and the share-card belt variant. The rubric is [`prd/031-belt-progression-rubric.md`](prd/031-belt-progression-rubric.md); values are in code.

## Typography

JetBrains Mono for the product's identity surfaces: eyebrows (small, uppercase, tracked) and verdicts (caps, never softened, never followed by encouraging copy). Error states show the actual error message verbatim. Voice rules are in `design/brand/README.md`.

Sizes come from the scale in `main.css`. Off-scale prototype sizes map onto it, never onto new sizes:

| Design size (px) | Tailwind |
|---|---|
| 8 to 12 | `text-xs` |
| 13 | `text-sm` |
| 14 to 16 | `text-base` |
| 17 to 19 | `text-lg` |
| 20 to 25 | `text-xl` |
| 26 to 36 | `text-2xl` |
| Page headings | `.paper-heading` |

`text-3xl` is smaller than `text-2xl` in this scale, so never use it. Inputs stay at 16px so iOS does not zoom on focus.

## Layout

Every signed-in screen shares one chrome: the rail (`layout/Sidebar.tsx`) on desktop, `BottomNav` on phones, and `FocusedHeader` on the kata and review flow. Page type uses the `.paper-*` classes in `main.css` (`paper-heading`, `paper-eyebrow`, `paper-body`, `paper-note`). A state with no side column is centered under the page title.

## Motifs

Enso (`EnsoLoader`) and the belt colors (`BeltRingAvatar`). The brushstroke and the hanko seal are brand concepts with no component in the app.

## Motion

CSS handles binary state, fades, hovers and simple transitions. **GSAP** is reserved for timeline-shaped motion: choreographed sequences, paths CSS cannot draw, and procedural transforms. Today only `EnsoLoader` uses it. Dashboard and `/admin/*` stay CSS-only by brand contract.

`prefers-reduced-motion: reduce` resolves every GSAP animation to its final state instantly. The 1Hz cursor blink stays. There is no shared hook for the check yet; see the project memory on animation scope before adding GSAP somewhere new.

Scrolls are external apps embedded by iframe (ADR 025), so their interior motion is the scroll author's concern.

## What we don't do

- No glassmorphism, no neumorphism, no corners larger than 6px on cards.
- No emoji as UI iconography, no stock photography. Illustration only from the brand's own paper-diorama scenes, chosen per surface, never as filler (D72), plus the pixel practitioner on public profiles and the result receipt, code-drawn on a logical pixel grid (D66), the illustrated `/belts` room ([ADR-032](adr/032-belts-room.md)) and the sensei's avatar on the review screens ([ADR-033](adr/033-sensei-art.md)).
- No "Premium" anything, no achievement-style badges (Discord, Steam, Duolingo); badges are typographic.
- No watercolor fills, no cherry blossoms, no mascot. The sensei is a voice with an avatar, not a mascot: the figure gives that voice some personality, never reacts to a verdict, never celebrates, and appears only beside the review and the verdict ([ADR-033](adr/033-sensei-art.md)).
- No "ceremony" framing in microcopy: the dojo is a workspace, not a temple.

## Accessibility floor

- Text meets WCAG AA on its actual background, in every theme.
- Interactive elements have a visible focus ring (2px solid `accent`).
- Icon-only buttons carry an `aria-label` or tooltip.
- Color is never the only signal: verdict states pair color with explicit text.

## Share cards

Share cards are PNGs rendered server-side in `apps/api/src/infrastructure/http/routes/share.ts`, using `@resvg/resvg-js`. The card uses the Sumi palette and still draws the superseded Open Gate mark (lockup: mark in accent, `dojo_` in primary), not the Paper Gate; the verdict color is a per-share input.

## Related

- [`design/brand/README.md`](../design/brand/README.md): brand guide — voice, glossary, microcopy, identity, brand assets
- [`VISION.md`](VISION.md): product strategy
- [`adr/020-ubiquitous-language-pass.md`](adr/020-ubiquitous-language-pass.md): the `scroll / kata / belt / milestone` vocabulary
