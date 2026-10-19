# Recognition proposal — contrast evidence

Measured 2026-10-19 from the canonical [main.css](../../apps/web/src/styles/main.css), using `themeTokens` from [brand-assets.mjs](../../scripts/brand-assets.mjs). Ratios use sRGB relative luminance and `(lighter + 0.05) / (darker + 0.05)`, before rounding. This report covers the pairs used in the proposal, not a whole-app accessibility audit.

| Foreground / background role | Sumi | Washi | Use / minimum |
|---|---|---|---|
| primary / page | 17.05 | 15.19 | Text · 4.5 |
| secondary / page | 7.16 | 6.61 | Text and meaningful outlines · 4.5 / 3 |
| primary / surface | 16.15 | 13.89 | Text · 4.5 |
| secondary / surface | 6.78 | 6.05 | Text and meaningful outlines · 4.5 / 3 |
| secondary / elevated | 6.36 | 5.45 | Control text · 4.5 |
| on-accent / accent | 4.92 | 5.36 | Primary control and hanko lettering · 4.5 |
| accent-text / page | 4.78 | 5.09 | Existing accent text · 4.5 |
| danger-text / page | 4.82 | 6.62 | NEEDS WORK heading / rule · 4.5 |

All listed text pairs pass AA. The selection indicator also uses border width and weight. Stripe slots pair fill/outline with a written count. Decorative dividers use `color-border`; they carry no unique state. Rank color never carries the rank alone. No text is placed on a belt-color swatch.

Full screens are drawn in Sumi. Washi token checks pass; a Washi layout and keyboard, native-share and reduced-motion behavior remain implementation validation, not claims made by these static artboards. Slate and the shared kit are unchanged.
