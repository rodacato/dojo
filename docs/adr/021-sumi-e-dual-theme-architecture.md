# ADR 021: Sumi-e dual-theme architecture

**Status:** Accepted
**Date:** 2026-06-06
**Context:** Sprint 024 — see [sprint write-up](../sprints/archive/sprint-024-maintenance-sumi-e.md), [DESIGN.md](../DESIGN.md), [BRANDING.md](../BRANDING.md)

## Decision

Ship the Sumi-e visual direction as a **dual-theme system that runs on the same token names as the existing Slate Indigo theme**, switchable at runtime per user, without a feature flag.

The mechanism:

1. **Single source of token names.** `apps/web/src/styles/main.css` declares the canonical `--color-*` (and `--text-*`, `--font-*`, `--radius-*`) tokens inside a Tailwind 4 `@theme` block. Slate Indigo values are the default render — what shipped pre-Sumi-e keeps rendering identically when no theme attribute is set on `<html>`.
2. **Theme override layer.** Two CSS selectors — `[data-theme="sumi"]` and `[data-theme="washi"]` — re-bind every `--color-*` token to the Sumi-e palette values (dark ink and warm rice paper respectively). Tokens not overridden (typography, radius, spacing) flow through from `@theme`.
3. **User preference, not flag.** `lib/theme.ts` + `useTheme` hook keep a `ThemeChoice = 'auto' | 'sumi' | 'washi' | 'slate'` in `localStorage`. `'auto'` resolves to `'sumi'` or `'washi'` based on the OS `prefers-color-scheme`. `'slate'` removes the `data-theme` attribute entirely, falling back to the `@theme` defaults (the legacy escape hatch). Toggle UI ships in `/settings` (4 pills) and in the sidebar (3-state cycle).
4. **Initial paint integrity.** `initTheme()` runs in `main.tsx` *before* React mounts, so the first paint has the right palette — no FOUC flash from a default theme to the user's stored choice.
5. **Token-bound libraries** that take literal hex strings (CodeMirror's `EditorView.theme`, `mermaid.initialize`) read resolved hex values out of the DOM via `useThemeTokens` + `MutationObserver`, rebuilding their theme when `data-theme` changes.

## Why no feature flag

Standard rollout instinct said "behind `FF_SUMI_THEME_ENABLED` until calibration." I started there and then ripped it out because the cost/benefit didn't hold:

- **Single user this sprint.** The dojo's only viewer at this phase is the creator. The flag's job — protect a real audience from a half-tuned palette — was protecting nobody.
- **The toggle *is* the kill switch.** The `'slate'` choice in the user-facing toggle removes `data-theme`, falling back to the @theme defaults. One click reverts the visual to exactly what shipped pre-Sumi-e. No re-deploy, no revert commit.
- **The flag added two ways to fail.** Forget to flip the env var at deploy and the new toggle UI is invisible despite shipping. Set the flag inconsistently across environments and the toggle works in some places, silently noops in others. The deletion removed that ambient surface area.

If a second user appears before designer calibration finishes, the contract is unchanged for them: `auto` will land them in `sumi` or `washi` per their OS, and if they hate it they have a settings toggle. No more, no less.

## What deviates from the earlier "migration sprint" plan in DESIGN.md

`DESIGN.md` §Migration path originally framed Sumi-e as a single dedicated sprint with 6 ordered steps (kickoff, tokens, motifs gradually, verdict+share, belt+heatmap+avatar, cleanup). The actual delivery interleaved differently:

- **Infrastructure first** (theme detection, [data-theme] overrides, toggle UI) — the original step 2.
- **Components in parallel** — `EnsoLoader`, `HankoBadge`, `BrushstrokeUnderline`, `BeltRingAvatar` shipped as standalone components in `components/ui/` *before* any integration site forced them.
- **Integration distributed across surfaces** — instead of "ship Enso on /scrolls first, then /katas, then everywhere" the components went into the sites that already wanted them in the same sprint (`/belts` for HankoBadge, ResultsPage for BrushstrokeUnderline, sensei avatar for the enso wash, etc.).

This worked because the toggle gave per-user reversibility: the partial integration is safe to ship since any user can flip away from it. The original ordering assumed a more conservative rollout that the no-audience constraint makes unnecessary.

## What stays open

- **Designer pass on Sumi-e v1 hex values.** `DESIGN.md` §Color tokens flags every Sumi/Washi value as v1 draft. The architecture doesn't depend on the values being final — calibration is a `main.css` edit when ready.
- **6 CC0 brushstroke SVG paths.** `lib/brushstrokes.ts` ships deterministic Bézier placeholders marked TODO; replacing them is a constants swap, no consumer change.
- **Verdict hanko stamp on share cards** (Satori-rendered). Server-side render path; deferred until share card layout audit.
- **Theme persistence in DB.** Currently `localStorage` only. Multi-device sync becomes relevant only when a second-device user appears. Promoting `localStorage` to `userPreferences.theme` is non-breaking — copy on login, server sets `data-theme` cookie, hydrate on next visit.

## Consequences

- The Sumi-e theme infrastructure is **live in production today** even though the visual is v1 draft, because the user-facing default is `auto` and the OS preference is what most users have set deliberately. A first-time visitor sees Sumi (dark) or Washi (light) immediately; if either looks wrong, the toggle is one click away.
- The token contract becomes the single load-bearing surface for theme work. Anyone adding a color in code uses `--color-*` tokens; the theme-switching machinery handles the rest. Raw hex in components is now banned by convention (enforced by audit; not yet by lint).
- Library theming (CodeMirror, Mermaid) follows automatically via `useThemeTokens`. Any future library that takes a color config plugs into the same hook without re-deriving theme awareness.
- The retired `FF_SUMI_THEME_ENABLED` is documented but absent from the codebase. If a future need for staged rollout appears, the pattern is in this ADR and in git history.

## Related artifacts

- [DESIGN.md](../DESIGN.md) §Two themes one system, §Color tokens, §Brand motifs, §Motion, §Migration path
- [BRANDING.md](../BRANDING.md) §Tema y dirección visual, §Motion como firma
- [sprints/archive/sprint-024-maintenance-sumi-e.md](../sprints/archive/sprint-024-maintenance-sumi-e.md) — the sprint write-up that delivered this
