# Sprint 024 — Maintenance pass + Sumi-e theme foundation

> **Status:** Closed — merged to `master` and deployed 2026-06-06
> **ADR:** [ADR 021](../../adr/021-sumi-e-dual-theme-architecture.md)
> **Companion docs:** [DESIGN.md](../../DESIGN.md), [BRANDING.md](../../BRANDING.md)

## What this sprint was

Started as a maintenance sweep — brand-violation cleanup, perf, bugs, dead code, drift between docs and reality. Mid-sprint expanded into the Sumi-e theme foundation that S023 had marked as a prerequisite for Phase 1 polish ("Day 8 visual polish"). Closed both threads in the same block because the type-scale normalization and the design-system audit were natural staging ground for shipping the theme infrastructure cleanly.

## Done — maintenance pass

- **4 brand-honesty violations** — fake `api / db / llm · ok` status dots removed from the dashboard (were hardcoded to true); access-request form surfaces real errors instead of fake "Received"; weekly goal target no longer defaults to 3 invented out of thin air; PracticePatternsCard gated to ≥3 completed kata so empty users don't see "Avg time 00:00".
- **XSS hardening** — `POST /access-requests` zod-validated to the actual GitHub username grammar (`^@?[a-zA-Z0-9](?:[a-zA-Z0-9-]){0,38}$`) + HTML-escaped all interpolated values in the outbound email (defense in depth).
- **/dashboard perf** — 10 sequential DB awaits collapsed into 1 barrier (active-row UPDATE) + `Promise.all` of 9 reads. P95 drops 5-6× at steady state.
- **Bug fixes** — `avgTime` formatting (broke at ≥100 min), `useEvaluationStream` redirect timer leak on unmount, sensei evaluating without `kataTitle` (degraded prompt quality on review katas).
- **GitHub stats proxy** — landing was calling `api.github.com` directly, rate-limited at 60/hr per visitor IP. Moved to a new `/landing/repo-stats` endpoint with 10min in-memory cache + graceful fallback.
- **Dashboard belt strip** — `DESIGN.md` designates belts as the core progression metric; the dashboard never mentioned them. Added compact strip showing rank + four factors (no progress bars — brand forbids).
- **Heatmap** — was deriving the weekly activity from `recentSessions` (capped to 5 server-side); now uses the dedicated `heatmapData` field that was already in the payload.

## Done — type scale normalization

- Introduced brand type scale (`--text-xs/sm/base/lg/xl/2xl/3xl/4xl/5xl`) in `@theme` per `DESIGN.md` spec. Tailwind 4 binds the utility classes to these values, overriding the defaults. Visual shifts at `xl` / `2xl` / `4xl` are intentional — the brand spec wins.
- Migrated 411 arbitrary `text-[Npx]` callsites across 55 files to the named utilities. Single source of truth for type sizes now lives in `main.css`.

## Done — Sumi-e theme foundation

- **Theme infrastructure** — `[data-theme="sumi" | "washi"]` CSS overrides in `main.css` re-bind every `--color-*` token. `lib/theme.ts` + `useTheme` hook handle OS auto-detect (`prefers-color-scheme`) + `localStorage` persistence. Toggle ships in `/settings` (4 pills) + sidebar (3-state cycle). No feature flag — single-creator constraint, instant rollback via the Slate option in the toggle.
- **Belt color tokens** — `--color-belt-{white,yellow,green,brown,black}` added to `@theme` with DESIGN-canonical hex; `lib/belt-colors.ts` centralizes the rank→token mapping; the two `RANK_COLOR` duplicates in `DashboardPage` and `BeltsPage` retired.
- **Brand motifs as components** — `EnsoLoader` (clockwise DrawSVG-style stroke via dashoffset; ~600ms once, loops if loading >2s), `HankoBadge` (char-stack for single words / word-stack for phrases; dimmed+grayscale when unearned), `BrushstrokeUnderline` (deterministic seed picks one of 6 geometric placeholders, draws on viewport entry via IntersectionObserver), `BeltRingAvatar` (2px boxShadow ring colored by rank, hanko-square geometry for black belt), `lib/brushstrokes.ts` library (3 underlines + 3 ticks, hash-seeded).
- **Motif integration across surfaces** — `HankoBadge` on `/belts` milestone cards (regular + prestige), `BrushstrokeUnderline` under kata title (ResultsPage) and belt rank header (BeltsPage), `BeltRingAvatar` on `/settings` Account section + `/u/:username` header, belt-color band on the public profile header, faint enso wash behind sensei chat-avatar initials, ink-wash heatmap ramp consolidated into shared `Heatmap` component, drawn vermillion brushstroke (CSS `@keyframes brushstroke-draw`) replacing the verdict block's solid left bar.
- **Editor themes follow brand** — new `useThemeTokens` hook reads resolved `--color-*` from the DOM and re-emits on `data-theme` mutation (MutationObserver). `CodeEditor` rebuilds CodeMirror's `EditorView.theme` + `HighlightStyle` from the resolved tokens; `MermaidEditor` re-runs `mermaid.initialize` and re-renders the active diagram. Highlight tokens map to brand colors (keyword → accent, string → success, number → warning, comment → muted).

## Done — landing GSAP polish (continued from prior block)

- Hero `TypewriterText` + `SecondLine` + manual delay math swapped for a single declarative `gsap.timeline`.
- 4 `ScrollFadeIn` IntersectionObserver wrappers collapsed into one `ScrollTrigger.batch`. `ScrollFadeIn.tsx` deleted.
- `TerminalDemo` cycles 3 sample sessions on a repeating timeline instead of rendering one static fake.
- `DESIGN.md` `§Motion` updated to declare landing as a deliberate GSAP exception to the "CSS-only on product surfaces" rule. The rest of the GSAP/Rive scope policy carries unchanged.

## Done — cleanup

- Toast `shadow-lg` removed (brand prohibits drop shadows).
- DTOs consolidated to `@dojo/shared` — `HeatmapDayDTO`, `SessionSummaryDTO`, `PublicSessionDTO` were declared inline in both `DashboardData` and `PublicProfileData`.
- `BRANDING.md` rewritten to own voice/IA/microcopy; visual specs now live exclusively in `DESIGN.md` (split made explicit in the doc preamble).
- `stitch/` retired — was gitignored AI-design scratch space with stale token names. Repo cleaned of 17 references (DESIGN.md ×14, CHANGELOG ×1, code-comment breadcrumbs ×2).
- 14 GSAP-rule references in `DESIGN.md` updated to reflect the actual shipped policy.
- E2E specs synced with S023 rename (landing copy, `/learn` → `/scrolls`, `exercise` → `kata` in `MOCK_SESSION`, `belt` added to mock dashboards, `public-courses.spec.ts` renamed to `public-scrolls.spec.ts`).
- `/dashboard` route handler covered by 5 unit tests (mock chain via recursive Proxy + `vi.hoisted`).
- `EXPERTS.md` Soren persona referenced stale `--color-surface-base` / `--color-accent-primary` token names that never existed; updated to point at `DESIGN.md` with the real names.
- Landing's duplicated "Sign up →" CTA in the sticky nav dropped — hero "Enter dojo →" carries conversion alone.

## Closes S023 deferred

- **Day 8 — visual polish.** Belt color tokens + `BeltRingAvatar` + integration on `/settings`, `/u/:username`, dashboard belt strip shipped. Share-card hanko stamp variant still pending Satori integration (parked below).

## Out of scope, parked

- **Designer pass on Sumi-e v1 hex values** — `DESIGN.md` flags them as draft; values stand until calibration against paper samples.
- **6 CC0 brushstroke SVG paths** sourced from Wikimedia / Unsplash; the `lib/brushstrokes.ts` placeholders are deterministic Béziers, marked TODO in the file. Integration ready when paths arrive.
- **Verdict hanko stamp on share cards** (Satori-rendered) — deferred until share card layout audit.
- **Staging smoke environment** (carried forward from S022, still open).
- **S023 sensei calibration real-LLM run** (still in flight per `sprints/current.md`).

## Verification

- `pnpm typecheck` green across the monorepo (shared + api + web)
- `pnpm lint` green
- `pnpm test --filter=@dojo/api` — 146 passing (5 new in `dashboard.test.ts`)
- `pnpm test --filter=@dojo/web` — 23 passing
- E2E specs typecheck; runtime gated on dev-server availability (out of scope here)
- Production deploy verified by the creator after merge
