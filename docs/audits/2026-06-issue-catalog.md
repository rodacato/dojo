# Issue catalog — SonarQube + CodeQL + Dependabot (2026-06-21, Sprint 033)

> Cross-tool catalog of **Reliability**, **Security**, and **Maintainability** findings across the three workspaces (`dojo-api`, `dojo-web`, `dojo-packages`), so repairs can be worked rule-by-rule off one list. Companion to the [Task 0 baseline](2026-06-sonar-baseline.md).
>
> **Sources & reproducibility:**
> - SonarQube (`sonarqube.notdefined.dev`): pulled via `/api/issues/search?impactSoftwareQualities=…` — re-runnable with [`scripts/sonar-dump.sh`](../../scripts/sonar-dump.sh). Counts use the **Clean Code taxonomy** (impactSoftwareQualities), which is what the dashboard cards show — *not* the legacy BUG/VULNERABILITY/CODE_SMELL types (those report different numbers).
> - CodeQL: `gh api repos/rodacato/dojo/code-scanning/alerts`.
> - Dependabot: `gh api repos/rodacato/dojo/dependabot/alerts` + `pnpm audit`.
>
> **Disposition legend:** `fix-now` (trivial or security-real, this sprint) · `S035` (architecture/long-tail, deferred; `needs-test-net` if refactor-shaped) · `won't-fix` (false positive / intended, with reason).

## TL;DR — the honest headline

The quality gate is red, but **almost none of the high-severity findings are real**:

- **Both HIGH security findings are false positives.** CodeQL's `js/weak-cryptographic-algorithm` (SHA-1 in the v5-UUID generator — spec-mandated, not a security control) and Sonar's `S2819` (postMessage origin — the code already validates `event.source === iframe.contentWindow`, which is *stronger* than an origin check for a `srcdoc` sandbox whose origin is the opaque `null`).
- **The 5 HIGH "reliability" findings are all in test files** — `Array.sort()` without a comparator in `.test.*` assertions, where alphabetical sort is intended. Cosmetic.
- **Net real security work beyond the workflow-permissions already fixed: zero code changes.**
- The gate fails on **new-code coverage (0.2% < 80%)** and **137 new issues** — and a large share of both was introduced by the S033 coverage campaign's own test files (the new-code window starts at `8cd6007`, the testing-backbone commit). That's a measurement artifact, not product rot. See [§New-code gate](#new-code-gate-the-real-blocker).

So this catalog is mostly a **mechanical-sweep + a11y backlog for S035**, not a fire. The only fix-now code item is one `Math.trunc` one-liner.

## Snapshot (impactSoftwareQualities, 2026-06-21)

| Project | Reliability | Security | Maintainability | Coverage | Gate |
|---|---|---|---|---|---|
| dojo-api | 12 | 0 | 76 | 56.8% | ❌ (new-code cov) |
| dojo-web | 50 | 1 | 563 | 31.3% | ❌ (new-code cov + issues) |
| dojo-packages | 0 | 0 | 1 | 100% | ✅ |

---

## 1. Security

| # | Source | Finding | Location | Sev | Disposition |
|---|---|---|---|---|---|
| S1 | Sonar `S2819` | "Verify origin of received message" | `web` `lib/iframeSandboxRunner.ts:98` | HIGH | **won't-fix** — handler already guards `event.source !== iframe.contentWindow` (line 42). For a `srcdoc` sandbox the origin is the opaque `null`; source-identity is the correct, stronger check. Mark "won't fix" in Sonar. |
| S2 | CodeQL `js/weak-cryptographic-algorithm` | SHA-1 in `uuidv5` | `api` `…/katas/types.ts:12` | high | **won't-fix** — SHA-1 is mandated by RFC 4122 v5; deterministic ID derivation, not a security control. Dismiss in code-scanning. |
| S3 | CodeQL `actions/missing-workflow-permissions` ×10 | unscoped `GITHUB_TOKEN` | 5 workflows | medium | **done** — `contents: read` added (commit `f1d8633`). |
| S4 | Dependabot / audit | `@opentelemetry/core` — unbounded memory in W3C Baggage | transitive (`pnpm-lock`) | medium | **S035 / monitor** — not a direct prod dep; no patched version pulled yet. Bump when the transitive lands. |
| S5 | Dependabot / audit | `js-yaml` — quadratic DoS in merge keys | transitive via `eslint` | medium | **won't-fix (dev-only)** — lint tooling, never in the request path. Clears when eslint updates `minimatch`/`js-yaml`. |
| S6 | Dependabot / audit | `@babel/core` — file read via `sourceMappingURL` | transitive (dev) | low | **won't-fix (dev-only)**. |
| S7 | Dependabot / audit | `esbuild` — dev-server arbitrary file read | transitive via `vitest`/`tsx`/`drizzle-kit` | low | **won't-fix (dev-only)** — build-time only; no esbuild dev server runs in prod. |

**Net:** `pnpm audit` critical + high = **0** (was 1 critical / 12 high at S033 start). The 10 moderate + 3 low remaining are all dev/transitive. Nothing production-reachable.

---

## 2. Reliability (Sonar — 62 issues)

Grouped by rule, highest severity first. None block runtime correctness in a shipped path; the cluster worth real attention is the **a11y group** (labels, keyboard events) — genuine UX, not ceremony.

### HIGH (7) — all false-positive or trivial

| Rule | What | Count | Locations | Disposition |
|---|---|---|---|---|
| `S2871` | `Array.sort()` needs a comparator | 5 | `web` `…/StepContent.test.tsx:88,89`, `LegalPage.test.tsx:106`, `belt-colors.test.ts:19` (×2) | **won't-fix** — all in test assertions where alphabetical sort is intended. Add a `localeCompare` comparator only if it silences the gate cheaply. |
| `S7767` | `Math.trunc` over bitwise `\| 0` | 1 | `web` `lib/brushstrokes.ts:31` | **fix-now** — one-liner, clearer, and `\| 0` is genuinely wrong above 2³¹ (values here are small, so no live bug). Exempt from needs-test-net. |

### MEDIUM (a11y + correctness, ~12)

| Rule | What | Count | Notable locations | Disposition |
|---|---|---|---|---|
| `S6853` | `<label>` needs text + associated control | 4 | `SettingsPage.tsx:284,296`, `LandingPage.tsx:651,663` | **fix-now (a11y)** — real screen-reader gap. |
| `S6848`/`S6847`/`S1082` | non-interactive elements with handlers / mouse without keyboard | 2+1+3 | `EngawaPage.tsx:401,407`, `Modal.tsx:30` | **fix-now (a11y)** — keyboard-navigation gap; same handful of nodes. |
| `S7773` | `Number.*` static over global `parseInt`/`isNaN` | 11 | `hooks/useThemeTokens.ts:50-52,110-112`, `DotGridBackground.tsx` | **S035 sweep** — mechanical, auto-fixable. |
| `S6772` | explicit spacing between inline JSX elements | 13 | spread across pages | **S035 sweep** — cosmetic. |
| `S3923` | conditional branches should differ | 1 | `KatasPage.tsx:328` | **fix-now** — look once; usually a real copy-paste bug. |
| `S6438` | JSX comment in curly braces | 1 | `LandingPage.tsx:646` | **S035 sweep**. |

### LOW (~8)

`S7758` Unicode-aware string methods (3) · `S7781` `replaceAll` over `replace(/g)` (5, web). **S035 sweep**, auto-fixable.

### dojo-api reliability (12 — all LOW)

All `S7781` (`replaceAll` over `replace(/g)`): `practice.ts:56-60`, `admin-katas.ts:280`, `share.ts:78`, `og.ts:38,73`. **S035 sweep** — mechanical, one PR.

---

## 3. Maintainability (Sonar — 640, the S035 long tail)

Not enumerated — per PRD-033 aggressive smell cleanup is explicitly **S035**. Rule-facet counts (top) so the sweep can be scoped:

**dojo-web (563):**

| Rule | Count | Likely | |
|---|---|---|---|
| `S6759` | 193 | React props should be `readonly` | auto-fixable |
| `S7764` | 127 | (prefer-modern-syntax sweep) | auto-fixable |
| `S3358` | 37 | nested ternaries | needs-test-net per file |
| `S7761` | 30 | | auto-fixable |
| `S6479` | 28 | no array index as key | judgment |
| `S7735` / `S6772` / `S6478` / `S6819` / `S4325` | 14/13/12/9/9 | mixed style | mostly auto-fixable |

**dojo-api (76):** `S7781` ×12, `S6594` ×10 (prefer `.find`), `S3358` ×7 (nested ternary), `S2933` ×7 (readonly fields), `S7735` ×6, `S3776` ×6 (**cognitive complexity** — the only refactor-shaped group; `needs-test-net`), `S6582` ×5 (optional chaining).

**The only group that needs the tests-before-refactor gate:** `S3776` cognitive-complexity (api ×6) and `S3358` nested-ternary — these reshape control flow. Everything else is mechanical/auto-fixable.

---

## New-code gate (the real blocker)

The gate's two failing conditions are on **new code** (since `8cd6007`, ~13h ago):

1. **New issues = 137 (required 0).** A large share are the rules above landing in the **test files the coverage campaign just added** (e.g. `S6759` readonly-props on test components, `S2871` sort-in-tests). Honest read: the campaign traded product coverage for a batch of new lint debt.
2. **New-code coverage = 0.2% (required ≥80%).** The "new lines" are dominated by `.test.*` files (which don't get covered themselves). The lcov→Sonar wiring is correct; the metric is just measuring test files as uncovered new code.

**These are gate-tuning, not repair work.** Options for S034 (not this catalog): exclude `**/*.test.*` from Sonar's `sonar.coverage.exclusions` *and* `sonar.exclusions` for the issue count, or move the new-code baseline past the campaign. Decide deliberately — don't chase 137 cosmetic issues to green a gate that's mis-scoped.

---

## Parallelizable repair batches

Designed for **concurrent subagents**: each batch owns a **disjoint file set** (no file appears in two batches), so agents can run in parallel in one working tree without colliding. All fix-now batches are mechanical or a11y — **behavior-preserving, no refactor → no test-net required**; verification is `tsc` + the existing tests for those files. Pick up any batch independently.

### Fix-now batches (Reliability — ~50 issues, all non-refactor)

| Batch | Files (disjoint) | Issues to fix | Fix pattern |
|---|---|---|---|
| **R1 — a11y: forms & landing** | `web` `pages/SettingsPage.tsx`, `pages/LandingPage.tsx` | `S6853` labels (Settings:284,296; Landing:651,663) · `S6438` JSX comment (Landing:646) · `S6772` spacing (Landing:665) | associate each `<label htmlFor>`/wrap control; move JSX comment into `{/* */}`; add explicit `{' '}` between inline els |
| **R2 — a11y: interactive handlers** | `web` `pages/EngawaPage.tsx`, `components/ui/Modal.tsx` | `S6848`/`S6847`/`S1082` (Engawa:401,407; Modal:30) · `S6772` spacing (Engawa:340,506) | give non-interactive nodes with handlers a `role`+`tabIndex`+keyboard handler, or move the handler to a `<button>`; pair mouse with keyboard |
| **R3 — numerics: theme & canvas** | `web` `hooks/useThemeTokens.ts`, `components/ui/DotGridBackground.tsx`, `components/ui/DotGridBackground.test.tsx`, `lib/brushstrokes.ts` | `S7773` Number.* (useThemeTokens:50-52,110-112; DotGrid:25,26 + test:151,175) · `S7767` `Math.trunc` (brushstrokes:31) · `S7758` unicode (brushstrokes:31) | `parseInt`→`Number.parseInt`, `isNaN`→`Number.isNaN`; `\| 0`→`Math.trunc()`; `.charCodeAt`/iteration → unicode-aware |
| **R4 — content/results pages** | `web` `pages/KatasPage.tsx`, `pages/ScrollsPage.tsx`, `scrolls/player/FurtherReading.tsx`, `pages/ResultsPage.tsx`, `pages/SharePage.tsx`, `scrolls/figures/markdown.ts`, `scrolls/player/steps/PredictStep.tsx` | `S7773` (Katas:538) · `S6772` (Katas:261,168; Scrolls:110; FurtherReading:21) · `S3923` identical branches (Katas:328 — **look, likely real**) · `S7781` replaceAll (markdown:24; Results:339,351,387; Share:84) · `S7758` (PredictStep:94) | `replace(/x/g,…)`→`replaceAll`; spacing; **read S3923 carefully** before touching |
| **R5 — misc pages: spacing** | `web` `pages/ErrorPage.tsx`, `pages/NotFoundPage.tsx`, `pages/AdminErrorsPage.tsx`, `pages/ChangelogPage.tsx`, `pages/AuthCallbackPage.tsx` | `S6772` spacing (Error:36; NotFound:25,31; AdminErrors:328; Changelog:100; AuthCallback:54) | explicit `{' '}` between inline els |
| **R6 — api: replaceAll** | `api` `…/routes/practice.ts`, `admin-katas.ts`, `share.ts`, `og.ts` | `S7781` (practice:56-60; admin-katas:280; share:78; og:38,73) | `replace(/x/g,…)`→`replaceAll` |

**Per-batch verify:** `pnpm --filter=@dojo/<web|api> exec tsc --noEmit` + `pnpm --filter=@dojo/<web|api> exec vitest run <changed files>`. **Final gate (after all merge):** `pnpm typecheck && pnpm lint && pnpm test`.

### Won't-fix (no agent — dashboard hygiene only)

- `S2819` (iframeSandboxRunner) + CodeQL `uuidv5` → mark "won't fix" in the dashboards (false positives, reasons in §1 / §2).
- `S2871` ×5 → test-file sorts; leave (alphabetical sort is intended in those assertions).

### Deferred to S035 (parallelizable later, NOT now)

- **Maintainability sweep (640).** Same disjoint-file scheme works, but it's a big churn for a gate that's mis-scoped on new code — **fix the gate scoping first** (below). Mostly auto-fixable rule-classes (`S6759` readonly-props ×193, `S7764` ×127, …).
- **Refactor-shaped, `needs-test-net`:** `S3776` cognitive-complexity (api ×6), `S3358` nested ternaries — behavior-pinning tests land first, in their own commit. **Never** in a parallel mechanical batch.

### Gate scoping (S034, before trusting the gate)

The red gate is driven by new-code coverage (0.2%) + 137 new issues, both inflated by the campaign's own test files — see [§New-code gate](#new-code-gate-the-real-blocker). Add `**/*.test.*` to `sonar.exclusions`/`sonar.coverage.exclusions` or move the new-code baseline. Do this before chasing issues to green it.
