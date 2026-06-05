# Sprint 023 — Dojo language pass

> **Status:** code & docs done; calibration harness ready (awaiting real-LLM run); visual polish + staging smoke pending
> **Plan:** [PRD-032](../prd/032-sprint-023-planning.md)
> **Dependent PRDs:** [PRD-030](../prd/030-dojo-terminology-routes.md), [PRD-031](../prd/031-belt-progression-rubric.md)
> **Spec:** [Spec 028](../specs/028-dojo-language-pass.md) · **ADR:** [ADR 020](../adr/020-ubiquitous-language-pass.md)
> **Branch:** merged to `master` (was `sprint-023-language-pass`)

## Done (this sprint)

- Shared package: `Kata*`, `Scroll*`, `Belt*`, `Milestone*` DTOs + schemas; `topicCluster()` helper with `Record<Topic, TopicCluster>` compile-time invariant; tolerant `topicClustersFor` (silently skips unknown legacy slugs)
- Domain layer: `Kata` (was Exercise), `Scroll` (was Course), `Milestone` (was Badge), new `Belt` value object + `BELT_THRESHOLDS` + `rankFromFactors()` + `computeBeltFromHistory()` state-machine walk + `countActiveDaysIn30()` helper
- Application: use cases renamed + new `CalculateBelt` (real computation from session history) + `ListUserMilestones`
- Infrastructure: PostgresKataRepository, PostgresScrollRepository, PostgresScrollProgressRepository, PostgresMilestoneRepository; MilestoneEventHandler (was BadgeEventHandler); routes admin-katas, admin-scrolls, scrolls, new `belts.ts`; container wiring; new `SessionRepository.listCompletedKataHistoryForBelt` projection (single JOIN, ordered)
- `drizzle/schema.ts` — exports renamed to dojo-native names (DB table names stay legacy via `pgTable('exercises', ...)`); column property names also follow ubiquitous language (see ADR 020 for why this deviates from the original "alias on import" spec)
- Frontend: page renames (KatasPage, BeltsPage, EngawaPage, ScrollsPage, ScrollPlayerPage, ScrollSharePage, AdminKatasPage etc); App.tsx routes; Sidebar + BottomNav labels; API client (`/scrolls`, `/engawa`, `/belts`); BeltsPage redesigned around belt rank + factors + milestones; KumitePlaceholderPage created
- `/leaderboard` deleted end-to-end — route, page, endpoint, types, client method
- Sensei prompts: literal `EXERCISE:` → `KATA:` and "bug-fix exercise" → "bug-fix kata" applied; calibration harness shipped (see Day 6 procedure below)
- Docs: ARCHITECTURE.md, README.md, AGENTS.md, BRANDING.md (with new Glosario + Belts & Milestones sections), CHANGELOG entry, ROADMAP sprint/spec/ADR/PRD index entries
- Build: `pnpm typecheck` green across the monorepo; `pnpm test --filter=api` — 141 passing (8 new in belt domain + 4 in CalculateBelt)

## Day 6 — Sensei calibration procedure

Sensei prompt literals updated in `apps/api/src/prompts/sensei.ts` (`EXERCISE:` → `KATA:`, "bug-fix exercise" → "bug-fix kata", "the following exercise" → "the following kata", "A developer is about to start the following exercise" → "kata"). A self-contained calibration harness ships alongside:

- **Script:** [apps/api/src/scripts/calibrate-sensei.ts](../../apps/api/src/scripts/calibrate-sensei.ts) — embeds the pre-rename ("legacy") prompt as a string baseline, runs the new ("dojo") prompt against the same 10-kata fixture, parses verdicts, reports per-difficulty drift, exits 1 if any bucket exceeds ±10pt.
- **Fixture:** [apps/api/src/scripts/calibrate-sensei.fixture.ts](../../apps/api/src/scripts/calibrate-sensei.fixture.ts) — 3 easy + 4 medium + 3 hard kata, mixed categories (backend, database, api-design, reliability, architecture, system-design, debugging). Each case has a `userResponse` deliberately chosen to land ambiguously so drift surfaces.
- **Smoke verified** with `pnpm --filter=api calibrate:sensei --smoke` (uses a fake runner; confirms the pipeline parses the `<evaluation>` block correctly and the gate math works).

To run the real gate (costs Anthropic tokens — roughly 10 cases × 2 prompts × ~3k tokens each):

```bash
cd apps/api
LLM_API_KEY=sk-ant-... LLM_MODEL=claude-sonnet-4-6 pnpm calibrate:sensei
```

If the gate passes (drift ≤ ±10pt on every bucket), the prompt rename is validated — delete the embedded legacy prompt from the script in a follow-up. If it fails, revert the prompt-literal changes in `prompts/sensei.ts` (the variable renames stay) and re-run.

## Open (deferred, not blocking the sprint close)

- **Day 8 — visual polish.** Belt color tokens, sidebar avatar ring component, share card belt variant. Soren-led; happens against the existing functional surface.
- **Staging smoke environment** (carry-forward from S022). Stand up staging deploy with `LLM_ADAPTER_FORMAT=mock` + Turnstile dummy keys so `complete-kata` and `engawa-anon-run` smoke specs run on every deploy.
- **Day 10 — dogfooding buffer.** ≥ 3 katas E2E on the new build over ≥ 2 days before declaring the sprint closed.
- **First friend invite dispatch** (carry-forward from S022). Humans-only. Audit doc waits at `docs/audits/2026-04-friend-feedback.md`.

## Out of scope, parked

- Kumite feature itself — only the `/kumite` placeholder ships
- Per-track belt marks, rust indicator (PRD-031 v1.1)
- DB table renames (mapping at adapter layer per ADR 020)
- Aggressive sensei voice rewrite — moderate register only, behind calibration gate
