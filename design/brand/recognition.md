# Recognition — art direction and voice

> **Status:** Design proposal for [PRD-035](../../docs/prd/035-recognition-revamp.md); no runtime changes. Direction accepted in this conversation on 2026-10-19; D63–D65 in [DECISIONS](../DECISIONS.md).
>
> **Visual mode superseded by D66 (2026-10-20):** pixel practitioner + personal dojo, prototyped in [proposals/practitioner](proposals/practitioner/index.html). The Preserve artboards were removed (recoverable from `fd3a36e`); the voice, honesty and copy rules below still apply.

## Brief

| Question | Grounded answer |
|---|---|
| For whom | The practitioner who wants to keep thinking independently, starting with the creator and their self-hosted group. [VISION](../../docs/VISION.md) defines the audience and excludes certification. |
| Today | [BeltsPage](../../apps/web/src/pages/BeltsPage.tsx) displays a rank, four counters and milestones. [ResultsPage](../../apps/web/src/pages/ResultsPage.tsx) shows the verdict, reasoning and feedback. Stripes, the practitioner, the dojo and the share card are proposed. |
| Distinctive experience | A short surprise kata, independent reasoning and an honest sensei. Recognition makes the resulting practice history legible; it promises neither expertise nor a kinder verdict. |
| Existing identity | Keep Open Gate, `dojo_`, the Sumi palette, Inter, JetBrains Mono and existing belt colors. Sources are in the [brand guide](README.md), [DESIGN](../../docs/DESIGN.md) and [main.css](../../apps/web/src/styles/main.css). |
| Surfaces | `/belts` with Practitioner and Dojo tabs, the post-kata receipt, the collection, a piece detail and the share card. Source: the prototype in `proposals/practitioner/`; review artboards in `design/_playground.pen`. No hosting or publication is requested. |

## Concept

**Two tracks, opposite difficulty** (D66). The **practitioner** is a pixel avatar dressed with pieces earned by showing up: practice days, a return, a share, seasons, invites. It is easy on purpose and may carry promotion. The **dojo** is a pixel room furnished with pieces earned by verdicts on hard kata; each piece names its kata, verdict and date, and none is promotional. The belt on the avatar mirrors rank and is never a piece.

The interactive prototype is the source for layout, art and proposal copy: [proposals/practitioner](proposals/practitioner/index.html). Its renderer draws on a logical pixel grid (avatar 20 × 34, room 160 × 90) with the Sumi palette.

## Visual grammar

- **Earned vs locked:** earned pieces render in color; locked ones are the piece's silhouette with a segmented progress bar and the written condition. Never a wall of locked trophies: the collection leads with the room and three "Next up" pieces.
- **Proof:** a dojo piece always shows what earned it in mono text; a practitioner piece shows its source ("7 practice days").
- **Color roles:** vermillion marks the practitioner track and primary actions; marigold marks the dojo track and seasonal pieces. Text never relies on either alone.
- **Result:** evaluation and solution lead (D65). Below them, at most a new-piece receipt (before → after on the avatar, "Try it on") and, after NEEDS WORK, a comeback toward the Moon window. Done remains the only filled exit.
- **Motion:** static proposal. Any reveal needs a ui-motion review and must resolve instantly under reduced motion.

## Tokens and type

The sole runtime token source remains [main.css](../../apps/web/src/styles/main.css); the playground vendors the existing kit at 0.4.0. No palette, font, component or kit version is added here.

| Role | Usage |
|---|---|
| `color-page`, `color-surface` | Ink canvas and contained sections |
| `color-primary`, `color-secondary` | Headings, copy, requirements and readable secondary labels |
| `color-accent`, `color-on-accent` | Hanko fill and its lettering; existing primary actions |
| `color-accent-text` | Small accent text on page/surface |
| `color-belt-*` | Rank cues, always paired with a written rank |
| `color-border` | Decorative separators only; meaningful unearned slots use `color-secondary` |
| `font-mono` / `font-sans` | Rank, facts and identity / explanatory copy and controls |

Body and control copy is at least 14 px in the proposal; small uppercase metadata is 12 px. Inter and JetBrains Mono are the existing OFL font dependencies. Existing fonts and the Open Gate geometry are reused; no new downloadable mark is introduced.

Contrast is calculated from the current CSS, not sampled from PNGs. See [contrast report](recognition-contrast.md) for the exact used pairs. Theme values shown on the artboard are explanatory swatches; the editable designs reference tokens.

## Voice and marketing

| Trait | Use | Avoid |
|---|---|---|
| Factual | "24 practice days"; "4 more practice days" | "Your skills increased 40%" |
| Earned | "Third stripe earned"; "Recorded 19 Oct 2026" | "Reward unlocked!"; "The sensei grants you a stripe" |
| Unfinished | "You came back. Practice continues." | "Don't lose your streak"; "You fell behind" |

The public Dojo headline remains **Practice thinking for yourself**. **Practice leaves a mark** is a proposed recognition-system line, not a replacement product position. Supporting concept copy: "A record of the days you practiced, the paths you explored, and the moments you earned."

Use an earned promotion as the shareable story. Lead with its concrete fact and the instance's identity. Do not claim learning gains, technical seniority, trusted-reviewer status or availability of an unimplemented feature. No launch, testimonial, usage statistic or acquisition campaign is part of this work.

### Proposal copy source

Proposal strings live in the [prototype](proposals/practitioner/index.html), the single copy source for the pixel direction; they are not shipped UI. Piece names, thresholds, kata names, dates and the handle are fictional fixtures, not final rules or observed users.

Existing result, navigation and feedback strings come from their current components. The concept does not rename routes or replace D60–D62. Example card identity is `example_practitioner` on `dojo.example`, a fictional host.

## Assets and preview

The PNGs in [exports/recognition](../exports/recognition/README.md) are renders of the prototype, embedded by the `Recognition / Pixel / …` artboards in `design/_playground.pen`. Regenerate them from the prototype; never redraw them on the canvas. They support layout and contrast review only: keyboard interaction, native sharing, persistence and motion require implementation testing.
