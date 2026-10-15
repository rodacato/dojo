# Brand

Dojo's identity is **Open Gate**: a curved lintel, a crossbar and two open posts, next to the
`dojo_` wordmark. Voice and vocabulary are in [docs/BRANDING.md](../docs/BRANDING.md); tokens and
components are in [docs/DESIGN.md](../docs/DESIGN.md).

## What is canonical

Edit these, never the generated files.

| File | What it owns |
| --- | --- |
| [`apps/web/src/brand/logo.json`](../apps/web/src/brand/logo.json) | Mark geometry, read by `LogoMark` and the generator |
| [`wordmark.svg`](wordmark.svg) | Outlined `dojo_` wordmark, so lockups never depend on installed fonts |
| [`social-template.svg`](social-template.svg) | Outlined 1200 × 630 card composition with `{{role}}` color placeholders |
| [`apps/web/src/styles/main.css`](../apps/web/src/styles/main.css) | Washi and Sumi color roles. The generated CSS is a snapshot of it |

## What is generated

`pnpm brand:assets` writes these; `pnpm brand:check` fails when any is stale or a link in `site/` is
broken.

| Output | Use |
| --- | --- |
| `site/brand/mark.svg` | Mark alone, for navigation and composition |
| `site/brand/logo-{washi,sumi,mono}.svg` | Lockups. Mono inherits `currentColor` |
| `site/brand/icon-{washi,sumi}.svg` | App icon artwork |
| `site/brand/social-{washi,sumi}.{svg,png}` | Project link-preview card. Not a personal session image |
| `site/brand/tokens.css` | Theme variables for the public site |
| `site/favicon.svg`, `apps/web/public/favicon.svg` | Favicon |
| `apps/web/public/og-image.png` | App link preview, the Sumi social card (1200 × 630) |
| `apps/web/public/apple-touch-icon.png`, `site/apple-touch-icon.png` | 180 × 180 opaque Sumi icon, no baked corners (iOS rounds it) |
| `apps/web/public/icon-{192,512}.png`, `icon-maskable-512.png` | Manifest icons; the maskable one keeps the mark inside the safe zone |
| `apps/web/public/favicon.ico`, `site/favicon.ico` | 16, 32 and 48 px fallback |
| `apps/web/public/manifest.webmanifest` | Name and Sumi colors for the app; not a PWA, no service worker |

The outputs sit under `site/brand/` because GitHub Pages serves that folder and the
[brand guide](../site/brand.html) links to them as downloads.

## Fonts

The public site ships Inter and JetBrains Mono locally in `site/fonts/` with their licenses. The app
gets the same families from `@fontsource-variable/*`; upgrade both when a font changes.

## Not covered

- The repository's GitHub social preview is uploaded by hand in Settings → General; use
  `site/brand/social-sumi.png`.
