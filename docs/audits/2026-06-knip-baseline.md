# Knip dead-code baseline — 2026-06-20 (Sprint 033, Track 3)

> Tool: `knip@6.17.1` (root devDep). Run: `pnpm exec knip`. Config: [`knip.json`](../../knip.json) (ignores the `apps/e2e` workspace — its playwright config throws without runtime env — and the `playwright` binary used via `pnpm exec` in CI).
>
> This is a **baseline + triage**, not a cleanup sweep. Per PRD-033 Track 3: fix the unambiguous wins, commit the baseline, defer the judgment calls. Knip is **not** wired into `pnpm lint` yet — the list below still has signal-vs-noise to settle first.

## Fixed this sprint (unambiguous wins)

- **Removed 2 genuinely-unused web dependencies** (zero imports, verified; typecheck + build green after removal):
  - `@codemirror/theme-one-dark` — the editor uses a custom theme, not this one.
  - `@lezer/common` — not imported directly; codemirror packages pull it transitively where needed.

## Deferred — judgment calls (do NOT bulk-delete)

### Unused files (9)
| File | Why deferred |
|---|---|
| `apps/api/src/domain/recognition/events.ts`, `ports.ts` | The recognition/belts bounded context — likely scaffolding for the parked belts feature (PRD-031, `/kumite` placeholder). Confirm against the belts roadmap before deleting. |
| `apps/api/src/infrastructure/http/validation.ts` | A validation helper with no importers — could be genuinely orphaned. Check git blame + intent. |
| `apps/web/src/components/ui/{AccentCard,AchievementBadge,StatCard}.tsx` | UI primitives; AchievementBadge/StatCard read as belts/dashboard-future. AccentCard may be a design-kit component kept on purpose. Designer's call. |
| `apps/web/src/components/ui/Input.tsx` | A form primitive in a product that's mostly auth-via-OAuth — may be genuinely unused or kept for forms-to-come. |
| `apps/web/src/pages/LoginPage.tsx` | **Risky** — auth is GitHub OAuth redirect, so a login page may be dead, but deleting a routed page needs a deliberate check of the router + any redirect target. |
| `scripts/test-llm.ts` | A root dev script (manual LLM probe) — like the `apps/api/src/scripts` CLIs, a kept tool, not dead code. Keep or move under a `scripts` convention. |

### Unused exports (20) and exported types (25)
- Mostly UI internals (`VerdictBadge`, `Skeleton*`, `toast`, `badgeUnlockToast`, the `brushstrokes` helpers) and api internals (`eventBus`, the rate limiters, `playground-quota` functions). An "unused export" is **not** automatically dead — some are public-API-by-intent, some are reached dynamically, some are test seams (`_resetPlaygroundQuotaCache`). Each needs a per-symbol look; bulk-removing exports is how you break a dynamic import.
- **Real smell worth a follow-up:** the API types are **triplicated** — `AttemptDTO` / `SessionAttempt` / `StartSessionResponse` / `SubmitAttemptResponse` appear in `apps/web/src/lib/api.ts`, `api/index.ts`, AND `api/types.ts`. That reads like a half-finished `lib/api.ts` → `lib/api/` split. Worth consolidating (S035 arch debt — and gated on tests-before-refactor).

### Duplicate exports (1) — intentional, not a win
- `apps/api/src/prompts/sensei.ts` exports the same function as both `buildPromptA` and `buildPrompt`. `buildPromptA` is the A/B/C naming the prompt test compares against; `buildPrompt` is the production alias the LLM adapters use. Both names are live. Leave it (or unify naming as a deliberate refactor).

## Findings to act on (not dead code, but surfaced by knip)

- **`eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` are declared in `apps/web` but wired into nothing** — the root `eslint.config.mjs` only registers `eslint-plugin-import`. So the React app gets **no react-hooks linting**. Don't delete the plugins — **wire them into the eslint flat config** (a quality follow-up, S034-adjacent). Knip flagged them as "unused devDependencies"; the honest fix is to use them, not drop them.

## Before wiring knip into `pnpm lint` (deferred)

The baseline still mixes signal and noise (intentional unused-exports, future-feature files). Wiring it into the gate now would block CI on false positives. Settle the deferred list above first, then add `knip` (or `knip --production`) to a `quality` script. Tracked for the back half of S033 / S034.
