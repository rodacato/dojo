# Recognition — art direction and voice

> **Status:** Design proposal for [PRD-035](../../docs/prd/035-recognition-revamp.md); no runtime changes. Direction accepted in this conversation on 2026-10-19; D63–D65 in [DECISIONS](../DECISIONS.md).

## Brief

| Question | Grounded answer |
|---|---|
| For whom | The practitioner who wants to keep thinking independently, starting with the creator and their self-hosted group. [VISION](../../docs/VISION.md) defines the audience and excludes certification. |
| Today | [BeltsPage](../../apps/web/src/pages/BeltsPage.tsx) displays a rank, four counters and milestones. [ResultsPage](../../apps/web/src/pages/ResultsPage.tsx) shows the verdict, reasoning and feedback. Stripes, the revised collection and promotion cards are proposed. |
| Distinctive experience | A short surprise kata, independent reasoning and an honest sensei. Recognition makes the resulting practice history legible; it promises neither expertise nor a kinder verdict. |
| Existing identity | Preserve Open Gate, `dojo_`, Sumi/Washi, Inter, JetBrains Mono, typographic hanko and existing belt colors. Sources are in the [brand guide](README.md), [DESIGN](../../docs/DESIGN.md) and [main.css](../../apps/web/src/styles/main.css). |
| Surfaces | Art-direction sheet; `/belts` desktop and mobile; mobile collection and post-kata receipt; a promotion card. Editable source: `design/_playground.pen`. PNG review exports: `design/exports/recognition/`. No hosting or publication is requested. |

## Concept

**Practice leaves a mark.** A dated ink impression records something the practitioner actually did, while small stripes make a long trajectory readable. The result feels like a working practice ledger: restrained, precise and worth keeping.

Preserve is the selected mode. A new logo, illustrated collectible world or consumer reward economy would disconnect this feature from the kata loop. [#189](https://github.com/rodacato/dojo/issues/189) owns the separate Folded Belt mark work; this proposal uses the shipped avatar ring, textual rank and stripe notches until those marks land.

## Visual grammar

- **Rank:** one label, four clearly separated stripe slots, a dated practice fact and the next requirement. Slots are structural indicators, not a new brand mark. Each slot has a text equivalent such as "2 of 4 stripes". Black remains readable through text and an outline.
- **Paths:** a ledger of actual topics practiced. A tier is written as "Tier I", "Tier II" or "Tier III", with a distinct-day count; never "expert" or "mastered". Use existing `HankoBadge` form and English lettering, not Japanese glyphs.
- **Earned state:** vermillion is reserved for the dated recognition imprint and existing actions. Current rank uses its belt color with a text label. Unearned slots have a neutral outline; no opacity-reduced text that becomes unreadable.
- **Density:** generous space around the current rank; compact ruled rows for collection entries. Earned items and a few next entries stay visible without a trophy grid.
- **Result:** evaluation and solution lead. One small recognition receipt follows, including after NEEDS WORK. Share is secondary; Done remains the only filled exit.
- **Motion:** static proposal. The implemented receipt must be immediately readable with reduced motion. Any later motion needs a separate review; preserve the existing HankoBadge restriction against a stamping celebration.

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

New strings below are authored for the requested future design; they are not shipped UI. Existing flows continue to mirror code. All example dates, counts, user handles and progression targets are fictional fixtures, not final thresholds or observed users.

| Surface | Proposed strings |
|---|---|
| Progress | "Your practice, recorded." · "White belt" · "2 of 4 stripes" · "24 practice days" · "Next: third stripe" · "4 more practice days" · "One credited day per date. Every verdict counts." |
| Collection | "Back to belts" · "Collection" · "Practice" · "Paths" · "First practice" · "You came back" · "Database practice" · "System design practice" · "Tier I" · "6 practice days" · "View all milestones" |
| Result receipt | "Practice recorded" · "Third stripe earned" · "28 practice days" · "NEEDS WORK counts here, too." · "Share promotion" |
| Promotion card | "Third stripe earned" · "White belt · 3 of 4 stripes" · "28 practice days" · "Earned 19 Oct 2026" · "Practice leaves a mark." |
| Prototype context | "DESIGN PROPOSAL · EXAMPLE DATA" · "Illustrative targets; final rubric pending." |
| Terminal rank sample | "Black belt · terminal"; outline and label keep the black rank visible on ink. No next stripe is offered. |

Existing result, navigation and feedback strings come from their current components. The concept does not rename routes or replace D60–D62. Example card identity is `example_practitioner` on `dojo.example`, a fictional host.

## Assets and preview

| Source | Output | How to reproduce |
|---|---|---|
| `design/_playground.pen`, Recognition artboards | `design/exports/recognition/direction.png`, `progress-desktop.png`, `progress-mobile.png`, `collection-mobile.png`, `result-mobile.png`, `promotion-card.png` | Open this exact file in Pencil; export the named Recognition artboards as PNG at 1× into a temporary directory, then name them as listed. |
| Existing `LogoMark` and `LogoWordmark` vendored components | Used in the artboards | Existing Open Gate source and `pnpm brand:assets` remain authoritative. |

PNG exports are review artifacts, not captures of a running implementation. Source artboards are named `Recognition / ...`; briefs describe proposal-only states and reference this copy source. No generated runtime assets are changed.

Open the [review gallery](../exports/recognition/README.md) to compare all six exports. The full-height result image represents scrollable content, not a 1340 px phone viewport.

Static exports support layout and contrast review only. Keyboard interaction, native sharing, live feedback persistence, rest calculations and animation require implementation testing. Review the complete result at 390 px and the desktop surface at 1440 px; preserve the readable next requirement and the evaluation-first order.
