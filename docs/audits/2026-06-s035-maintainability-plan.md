# S035 maintainability plan — pre-designed (2026-06-21)

> Pre-work for the **S035 architecture-debt sprint**. The 640 SonarQube Maintainability findings, split by *actual value* (not by auto-fixability), with parallelizable batches. **Honest stance up front:** most of this is low-value style ceremony. The gate's real blocker was already fixed ([`cd0ea7f`](2026-06-repair-worklog.md) — the test-file exclusion), so chasing Maintainability to an "A" is optional polish, **not** a reason the gate is red. Do the high-value subset; treat the rest as opt-in.
>
> Counts are pre-rescan. The `S7781` group (api ×12) was already fixed in reliability batch R6 and will drop on the next scan.

## The honest split

### Tier 1 — real value (do in S035, test-net where noted)

| Rule | What | Count | Where | Note |
|---|---|---|---|---|
| `S3776` | Cognitive Complexity too high | **11 fns** | api 6 / web 5 | **needs-test-net.** Real logic readability. Targets ↓. |
| `S3358` | Nested ternaries | 44 | web 37 / api 7 | **needs-test-net** (reshapes branching). Often a real readability win. |
| `S6479` | Array index as JSX `key` | 28 | web | **Judgment — can mask real React reconciliation bugs.** Worth a look per list. |
| `S6478` | React components nested in render | ~? | web | Judgment — can cause remount/perf bugs. |

### Tier 2 — mechanical, behavior-preserving, but low value (opt-in sweep)

| Rule | What | Count | Auto |
|---|---|---|---|
| `S6759` | React props should be `readonly` | 193 | type-only, near-zero value, huge diff |
| `S7764` | prefer modern syntax | 127 | yes |
| `S7761` | data-attrs via `dataset` | 30 | yes |
| `S6819` | prefer semantic tag over ARIA role | 9 | a11y, yes |
| `S4325` | redundant casts / non-null assertions | 9 | yes (same rule a recent commit already swept in api) |
| `S2933` | fields readonly | 7 (api) | type-only |
| `S7735` | negated condition with else | 6 (api) | yes |
| `S6582` | optional chaining | 5 (api) | yes |
| `S6594` | prefer `.find()` over `.filter()[0]` | 10 (api) | yes, minor perf |

**Recommendation (cost-justified):** Tier-2 is ~400 issues of mostly-cosmetic churn. `S6759` (readonly props ×193) alone is a massive diff for a type-only nicety. **Do not unleash agents on Tier 2 without Adrian's explicit OK** — it's the kind of "ceremony for a green rating" the project's working rules push back on. If a green Maintainability rating is wanted, it's *one* opt-in mechanical sweep (parallelizable by the same disjoint-file scheme as the R-batches), but it buys little.

## Tier-1 refactor targets — `S3776` cognitive complexity (11 functions)

Each needs a behavior-pinning test landing **first**, in its own commit, before the refactor (the tests-before-refactor gate). Many already have partial coverage from the S033 campaign — check before writing new tests.

**api (6):**
| File:line | Complexity | Likely covered by campaign? |
|---|---|---|
| `infrastructure/events/MilestoneEventHandler.ts:18` | 28 | check `MilestoneEventHandler.test.ts` |
| `infrastructure/http/routes/ws-handlers.ts:45` | 26 | partial — ws route tests exist |
| `infrastructure/execution/PistonAdapter.ts:101` | 19 | check PistonAdapter tests |
| `infrastructure/llm/OpenAIStreamAdapter.ts:23` | 18 | stream adapter tests exist |
| `infrastructure/http/routes/auth.ts:39` | 17 | auth route tested |
| `infrastructure/llm/AnthropicStreamAdapter.ts:26` | 17 | stream adapter tests exist |

**web (5):**
| File:line | Complexity | Note |
|---|---|---|
| `pages/KataActivePage.tsx:59` | **43** | worst offender — the kata session orchestration; big refactor, needs solid tests first |
| `pages/KataActivePage.tsx:31` | 22 | same file, second function |
| `lib/api/playground.ts:31` | 31 | API client logic |
| `lib/api/practice.ts:14` | 27 | API client logic |
| `pages/EngawaPage.tsx:211` | 16 | just over threshold |

## Parallelization (when S035 runs)

Same rule as the reliability batches: **disjoint file buckets**, one subagent each. Tier-1 refactors are NOT parallel-mechanical — each is a `write-tests → verify → refactor → verify` pipeline per function, best done with a critic. Tier-2, if approved, partitions cleanly by file.

## Next-cycle entry point

1. Re-scan Sonar (post-push) to get clean counts — the gate-exclusion fix + R-batches will move these numbers.
2. Decide Tier-2: skip (recommended) or one opt-in sweep.
3. Tier-1: start with the api `S3776` set (logic, well-bounded), test-net-first. Save `KataActivePage.tsx:59` (43) for last — it's the deepest.
