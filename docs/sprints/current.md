# Sprint 023 — Dojo language pass

> **Status:** code & docs ~95% — calibration + visual polish pending
> **Plan:** [PRD-032](../prd/032-sprint-023-planning.md)
> **Dependent PRDs:** [PRD-030](../prd/030-dojo-terminology-routes.md), [PRD-031](../prd/031-belt-progression-rubric.md)
> **Spec:** [Spec 028](../specs/028-dojo-language-pass.md) · **ADR:** [ADR 020](../adr/020-ubiquitous-language-pass.md)
> **Branch:** `sprint-023-language-pass`

## Done (this sprint)

- Shared package: `Kata*`, `Scroll*`, `Belt*`, `Milestone*` DTOs + schemas; `topicCluster()` helper with `Record<Topic, TopicCluster>` compile-time invariant
- Domain layer: `Kata` (was Exercise), `Scroll` (was Course), `Milestone` (was Badge), new `Belt` value object + `BELT_THRESHOLDS` + `rankFromFactors()` pure computation
- Application: use cases renamed + new `CalculateBelt` (stub returning white belt) + `ListUserMilestones`
- Infrastructure: PostgresKataRepository, PostgresScrollRepository, PostgresScrollProgressRepository, PostgresMilestoneRepository; MilestoneEventHandler (was BadgeEventHandler); routes admin-katas, admin-scrolls, scrolls, new `belts.ts`; container wiring
- `drizzle/schema.ts` — exports renamed to dojo-native names (DB table names stay legacy via `pgTable('exercises', ...)`); column property names also follow ubiquitous language (see ADR 020 for why this deviates from the original "alias on import" spec)
- Frontend: page renames (KatasPage, BeltsPage, EngawaPage, ScrollsPage, ScrollPlayerPage, ScrollSharePage, AdminKatasPage etc); App.tsx routes; Sidebar + BottomNav labels; API client (`/scrolls`, `/engawa`, `/belts`); BeltsPage redesigned around belt rank + factors + milestones; KumitePlaceholderPage created
- `/leaderboard` deleted end-to-end — route, page, endpoint, types, client method
- Docs: ARCHITECTURE.md, README.md, AGENTS.md, BRANDING.md (with new Glosario + Belts & Milestones sections), CHANGELOG entry, ROADMAP sprint/spec/ADR/PRD index entries
- Build: `pnpm typecheck` green across the monorepo

## Open (deferred, not blocking)

- **Day 5 finish — full belt computation.** `CalculateBelt` is stubbed to white belt. The remaining work is the SessionRepository projection (trailing-30 active days + topic clusters touched + earliest-rank-crossing timestamp for `daysAtRank`). Recalculable from existing data; no migration debt.
- **Day 6 — sensei voice calibration.** Literal prompt strings still say *"Exercise:"* and *"this is a bug-fix exercise"*. Updating them ships behind the calibration test (10-kata fixed set, ≤ ±10pt verdict-distribution drift per difficulty bucket). Variables/props in `prompts/sensei.ts` are already renamed; only literal strings remain.
- **Day 8 — visual polish.** Belt color tokens, sidebar avatar ring component, share card belt variant. Soren-led; happens against the existing functional surface.
- **Staging smoke environment** (carry-forward from S022). Stand up staging deploy with `LLM_ADAPTER_FORMAT=mock` + Turnstile dummy keys so `complete-kata` and `engawa-anon-run` smoke specs run on every deploy.
- **Day 10 — dogfooding buffer.** ≥ 3 katas E2E on the new build over ≥ 2 days before declaring the sprint closed.
- **First friend invite dispatch** (carry-forward from S022). Humans-only. Audit doc waits at `docs/audits/2026-04-friend-feedback.md`.

## Out of scope, parked

- Kumite feature itself — only the `/kumite` placeholder ships
- Per-track belt marks, rust indicator (PRD-031 v1.1)
- DB table renames (mapping at adapter layer per ADR 020)
- Aggressive sensei voice rewrite — moderate register only, behind calibration gate
