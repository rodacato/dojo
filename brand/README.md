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
| `apps/web/public/apple-touch-icon.svg` | Home-screen icon |

The outputs sit under `site/brand/` because GitHub Pages serves that folder and the
[brand guide](../site/brand.html) links to them as downloads.

## Fonts

The public site ships Inter and JetBrains Mono locally in `site/fonts/` with their licenses. The app
gets the same families from `@fontsource-variable/*`; upgrade both when a font changes.

## Not covered

- The repository's GitHub social preview is uploaded by hand in Settings → General; use
  `site/brand/social-sumi.png`.
- `apps/web/public/og-image.svg` is the app's own link preview and is not generated here.
