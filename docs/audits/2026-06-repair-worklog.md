# Repair worklog — S033 issue-catalog (live, autonomous cycle 2026-06-21)

> **Purpose:** resume-here log for the Sonar/CodeQL/Dependabot issue repair driven off [`2026-06-issue-catalog.md`](2026-06-issue-catalog.md). Updated continuously during an autonomous cycle (Adrian away). Everything done is **committed locally** (never pushed — Adrian reviews the diff + pushes). Nothing here mutates remote dashboards.
>
> **Last updated:** Tier-2 mechanical sweep COMPLETE (web+api, ~270 fixes, all green). Tier-1 refactors deliberately paused (see below). **Unpushed local commits: `git log --oneline origin/master..HEAD`** (through `3517f39` + this worklog). **Resume:** review/push, run the Sonar `workflow_dispatch` (expect a big drop: 136 phantom test issues + ~270 mechanical), then the Tier-1 careful refactor pass.

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
| Tier-2 web ×8 | ✅ done — ~228 fixes, 108 files | `645916b` |
| Tier-2 api ×2 | ✅ done — ~42 fixes, 19 files | `3517f39` |
| Tier-1 refactors (S3776 ×11, S3358, S6479) test-net-first | ⏸ **deliberately not rushed** — see below | — |

**Tier-2 result:** ~270 mechanical fixes across 127 files, all behavior-preserving. Verified: web tsc 0 + **1210/1210** tests; api tsc 0 + **545/545** tests. The agents rejected/deferred everything that wasn't trivially safe (see backlog).

**Caught regression:** an agent applied `String.raw` to share.ts's Hono route patterns (S7780) — that broke Hono's literal-type param inference (`param()` → `string|undefined`, 3 tsc errors). Reverted; **S7780 is a false positive on Hono route strings** (they must stay string literals).

### Careful-pass backlog (deferred by agents — refactor-shaped, NOT mechanical)
These need individual care, not a parallel sweep:
- **S6478** hoist nested components out of parent render — `KataBody.tsx` (×12, the `react-markdown` renderers), others. Real fix (avoids remount-on-render) but needs prop-threading.
- **S6819** `role=` → native semantic tag — `EnsoLoader`/`Banner`/`Toast`/`OnboardingOverlay`/`EngawaPage`/`AuthCallbackPage`/`KataActivePage`/`ReadInlineStep`. Each changes default element semantics/layout (`<dialog>` needs `showModal()`, `<output>`/`<fieldset>`/`<progress>` carry built-in styling) — per-case judgment.
- **S2004** nested functions too deep — `useEvaluationStream`, `Toast`, `TurnstileWidget` (closures over state).
- **S1874** `FormEvent` "deprecated" — `AdminInvitationsPage`, `LandingPage` (React's type isn't really deprecated; ambiguous).
- **S4043** `.toSorted()` — needs a TS `lib` bump (target < es2023). Project-wide decision.
- `index.ts` S3863 side-effect import order; `landing.ts` S6551 `String()` coercion.

### Tier-1 (S3776 ×11, S3358 ×44, S6479 ×28) — why paused, not done
Targets are in [`2026-06-s035-maintainability-plan.md`](2026-06-s035-maintainability-plan.md). **Brutally honest call:** these reshape control flow in complex orchestration logic (`KataActivePage.tsx:59` is complexity **43**; ws-handlers, stream adapters, the kata session loop). Rushing 11 careful refactors at the tail of a long autonomous session — risking a subtle behavior change that passes existing tests but breaks an untested edge — is exactly what the tests-before-refactor rule guards against. **Recommend a focused, awake session:** per function, confirm/extend the test-net first (own commit), then refactor, then verify. Do `KataActivePage:59` (43) last.

## Post-sweep Sonar gate diagnosis (2026-06-21, re-scan on 91eb9ba)

**Huge wins:** new issues 137→**12**, coverage 0.2%→**69.7%** (the `cd0ea7f` glob fix worked). But the gate is **still red on 3 conditions** — and the honest finding is that **the campaign itself caused most of the remaining new-code damage:**

1. **12 new issues** — mostly self-inflicted:
   - **8× S7741** (`typeof globalThis.window === 'undefined'` → compare directly) — created by the Tier-2 `S7764 window→globalThis` + `S7735` edits, which pulled these SSR-guard lines into "new code". Trivial to fix (`globalThis.window === undefined`).
   - **2× S6819** (`role="presentation"` → `<img alt>`) — from the **R2 a11y fix** (Modal/Engawa backdrops). Sonar's suggestion is nonsense for a click-catcher div. **FP — won't-fix.**
   - **2× S3358** nested ternary (`config.ts:13`, `OutputPanel.tsx:92`) — pre-existing, Tier-1.
2. **Coverage 69.7% < 80%** — real web gap (S034). 80% is aspirational for web right now.
3. **Duplications 4.52% > 3%** — pre-existing duplication (`BottomNav` 55%, `Sidebar` 25% repeated SVG icons; admin form boilerplate) **pulled into "new code" because the sweep touched those files**. Real S035 refactor (extract shared icons), not a quick fix.

**Brutally honest conclusion (for the retro):** the Tier-2 mechanical sweep — approved as "todo" *after* I flagged it as ceremony — **made the new-code gate worse**, not better. It churned 127 files, dragging pre-existing duplication + new typeof/role nits into the new-code window, while the real lever (coverage) is untouched. It improved the *Overall Code* trend but the gate scores *New Code*. **This vindicates the original "skip Tier-2" recommendation.**

**Fixing the 12 issues will NOT green the gate** — coverage (80%) and duplications (3%) remain. The honest options (Adrian's call, not whack-a-mole):
- **(a)** Move the Sonar new-code baseline past the sweep commits → the churn stops counting as "new"; the gate scores future work cleanly. *Recommended.*
- **(b)** Treat the web gate as aspirational (PRD-033 already called it "decorative") — track Overall Code, not the New Code gate, until S034 raises web coverage.
- **(c)** Tune web thresholds (80% cov / 3% dup) to realistic values for the current web state.

## GitHub security backlog (sector-7g — report-only)
Full triage in [`2026-06-github-security-findings.md`](2026-06-github-security-findings.md). gitleaks: 4 FP → **fixed** (`.gitleaks.toml`). trivy (Dockerfile IaC, 1 HIGH dep, secret fixtures) + semgrep (12 replaceall-sanitization **from this sweep**, 1 shell-injection, 1 missing-USER) → documented, non-blocking. Real items: Dockerfile non-root USER + the one workflow shell-injection.

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
