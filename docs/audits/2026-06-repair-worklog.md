# Repair worklog — S033 issue-catalog (live, autonomous cycle 2026-06-21)

> **Purpose:** resume-here log for the Sonar/CodeQL/Dependabot issue repair driven off [`2026-06-issue-catalog.md`](2026-06-issue-catalog.md). Updated continuously during an autonomous cycle (Adrian away). Everything done is **committed locally** (never pushed — Adrian reviews the diff + pushes). Nothing here mutates remote dashboards.
>
> **Last updated:** end of autonomous cycle — R1-R6 done, gate root-cause fixed, S035 pre-planned. **8 unpushed local commits: `git log --oneline origin/master..HEAD` → `84c8f30`..`b376778`** (f1d8633 was already pushed). **Resume:** review/push these, run the Sonar `workflow_dispatch`, then pick from "Next-cycle TODO".

## How to resume

1. `git log --oneline origin/master..HEAD` — see the local-only commits below, review diffs, push when ready.
2. Read the **Batch status** table for where the parallel repair stopped.
3. Read **Next-cycle TODO** for prepared-but-not-executed work (dashboard hygiene, gate scoping, S035).
4. The catalog ([`2026-06-issue-catalog.md`](2026-06-issue-catalog.md)) is the source of truth for batch definitions; this worklog tracks execution state.

## Local commits this cycle (not pushed)

| SHA | What |
|---|---|
| `f1d8633` | ci(security): workflow `contents: read` ×5 + Task 0 baseline |
| `84c8f30` | docs: cross-tool issue catalog + `scripts/sonar-dump.sh` |
| `0ed59b0` | fix(web): a11y + spacing — batches R1+R2 |
| `b9a866d` | docs: this worklog |
| `3862eae` | fix(web,api): replaceAll + Number.* — batches R3+R4+R6 |
| `cd0ea7f` | fix(sonar): web test-file exclusion (broken Ant glob — the red-gate cause) |

_(Earlier this session, already pushed by Adrian: db8d6c6 lint, cf9e1c3 bug fixes, 6f0cf76 de-flake, + the coverage campaign.)_

## Batch status (Reliability fix-now)

| Batch | Files | Status | Commit | Notes |
|---|---|---|---|---|
| R1 — a11y forms/landing | SettingsPage, LandingPage | ✅ done | `0ed59b0` | S6438 left (visible UI text, not a comment) |
| R2 — a11y handlers | EngawaPage, Modal | ✅ done | `0ed59b0` | role=presentation + Escape on Engawa dialog |
| R3 — numerics theme/canvas | useThemeTokens, DotGridBackground(.tsx/.test), brushstrokes | ✅ done | `3862eae` | 10× S7773 applied; **brushstrokes S7767+S7758 rejected (FP)** |
| R4 — content/results pages | KatasPage, ScrollsPage, FurtherReading, ResultsPage, SharePage, markdown.ts, PredictStep | ✅ done | `3862eae` | 5× S7781 + 1× S7773; **S3923 = real bug, ambiguous (Adrian)**; 4× S6772 FP |
| R5 — misc pages spacing | ErrorPage, NotFoundPage, AdminErrorsPage, ChangelogPage, AuthCallbackPage | ✅ done | — (no edits) | **all 6 S6772 are FP** — CSS gap/margin or flush cursor |
| R6 — api replaceAll | practice, admin-katas, share, og | ✅ done | `3862eae` | 8× S7781 applied; clean |

**Net applied:** ~25 issues fixed (Number.* ×11, replaceAll ×13, +R1/R2 a11y). **~15 confirmed false positives** the agents correctly refused (would regress UI or break tests). **1 real bug needing Adrian** (S3923).

## Findings / decisions log

- **R1:** `S6438` at LandingPage:647 is a **false positive** — the `// invites are issued…` is rendered UI text (fake-code-comment styling), not a JSX comment. Converting would delete content. Leave; mark won't-fix in Sonar.
- **R2:** Engawa ask-dialog had no keyboard dismiss (unlike `Modal`, which has a document `keydown` Escape listener). Added Escape-to-close + `tabIndex={-1}`. Inner click-catcher divs → `role="presentation"` (their only handler is `stopPropagation`, no keyboard analog).
- Both HIGH security findings remain **false positives** (see catalog §1): Sonar `S2819` (event.source identity guard) + CodeQL `uuidv5` (spec-mandated SHA-1).
- **R3 — `brushstrokes.ts:31` is a double false positive.** `(h * 31 + s.charCodeAt(i)) | 0` is a polynomial rolling hash; the `| 0` is a deliberate **32-bit signed wraparound** (load-bearing for the seed→value contract, DESIGN.md §Decided #3), not truncation. `Math.trunc` (S7767) changes the output — verified it breaks the pinned `brushstrokes.test.ts` value. `charCodeAt` (S7758) is fine for ASCII seeds; unicode-aware methods would change the hash for non-BMP input that never occurs. **Mark both won't-fix in Sonar.**
- **R4/R5 — ~10 `S6772` "inline spacing" hits are false positives.** Every flagged spot already spaces via CSS (`gap-*`, `mr-*`, `ml-*`) or is an **intentional flush terminal-cursor** (`text_<span class="animate-cursor">_</span>`). Inserting `{' '}` detaches cursors / doubles gaps — a visible regression. The correct Sonar action is to suppress these lines, not "fix" them.
- **R4 — REAL BUG, needs Adrian's call:** `KatasPage.tsx:328` (`SelectablePill`) has `${size === 'md' ? 'text-xs' : 'text-xs'}` — both ternary branches identical (S3923). The `size` prop genuinely differentiates elsewhere (height at :316), so one branch was likely meant to be a different size (e.g. `text-sm` for `md`), OR the ternary is vestigial and should collapse to `'text-xs'`. **Two opposite fixes, no signal to disambiguate — Adrian decides.**
- **R4 — `PredictStep.tsx:94` (S7758):** `String.fromCharCode('A'.charCodeAt(0) + i)` generates option letters A/B/C from an ASCII base — no unicode risk. Low-value, left.

## Tier-2 mechanical sweep — IN PROGRESS (Adrian approved "todo")

Adrian chose **Tier-1 + Tier-2**. Executing Tier-2 first (parallel, disjoint-file buckets), then Tier-1 refactors (test-net-first, careful).

**Scope correction:** test-file maintainability issues are EXCLUDED — they vanish on the next re-scan (the `cd0ea7f` exclusion fix). Real Tier-2 = **source-only: web 361 / api 63 = 424 issues**.

Buckets (manifests in `/tmp/sonar-dump/bucket-*.json`, disjoint files): web ×8 (~45 issues/14 files each), api ×2 (~32 each). Rules: S6759 readonly-props (193), S7764 window→globalThis (127), S7761 dataset, S7735 negated-else, S6478 nested-components, S4325 redundant-casts, S6819, S6582, S1186, S3863, etc. — all mechanical/auto-fixable.

| Wave | Status | Commit |
|---|---|---|
| Tier-2 web ×8 | ⏳ launching | — |
| Tier-2 api ×2 | pending | — |
| Tier-1 refactors (S3776 ×11, S3358, S6479) test-net-first | pending | — |

## Next-cycle TODO (prepared, NOT executed — need Adrian)

### Dashboard hygiene (remote mutations — left for Adrian to run)
Mark the two false-positive HIGHs resolved so the gate stops counting them:
- **Sonar** `S2819` → "Won't fix" (web project, `lib/iframeSandboxRunner.ts`).
- **CodeQL** `js/weak-cryptographic-algorithm` → dismiss "Won't fix":
  ```bash
  # find the alert number, then:
  gh api -X PATCH repos/rodacato/dojo/code-scanning/alerts/<N> \
    -f state=dismissed -f dismissed_reason="won't fix" \
    -f dismissed_comment="SHA-1 is mandated by RFC 4122 v5 UUID generation; deterministic ID derivation, not a security control."
  ```

### Gate scoping — ✅ ROOT CAUSE FOUND & FIXED (`cd0ea7f`)
The red gate was **not** a measurement-philosophy call — it was a **bug in `apps/web/sonar-project.properties`**. The exclusion glob `**/*.test.{ts,tsx}` used brace alternation, which **SonarQube's Ant matcher does not support** (silently matches nothing). So 136 test-file issues leaked into `dojo-web` analysis (= the gate's "137 new issues") and the test files — absent from lcov — were counted as uncovered source, dragging new-code coverage to 0.2%. Verified: web 578 issues, **136 in `*.test.*`**. api/packages were unaffected (they use the working `**/*.test.ts`).

**Fixed:** replaced with explicit `**/*.test.ts` + `**/*.test.tsx` (+ `src/test/**`). **Needs a re-scan to confirm** — Adrian, run the *Sector 7g - Quality* `workflow_dispatch` after pushing; expect the 136 phantom issues gone and a real new-code coverage number.

**Caveat (separate, real):** even clean, web's genuine coverage is ~31%, so the 80% new-code gate may still fail — that's a *real* signal for the **S034 web testing backbone**, not a scoping artifact. Deciding whether 80% is the right web threshold is an S034 call, not this cycle's.

### S035 (deferred by PRD — pre-designed this cycle)
Full plan: **[`2026-06-s035-maintainability-plan.md`](2026-06-s035-maintainability-plan.md)** (`cd0ea7f`+). Honest split:
- **Tier 1 (real value):** `S3776` cognitive-complexity (11 functions, targets + complexity scores in the plan — worst is `KataActivePage.tsx:59` at 43), `S3358` nested ternaries (44), `S6479` array-index keys (28). The `S3776`/`S3358` set is **needs-test-net** (tests first, own commit).
- **Tier 2 (~400, low value):** `S6759` readonly-props ×193 etc. — mostly cosmetic. **Recommendation: skip / opt-in only.** Don't green a rating with ceremony.
