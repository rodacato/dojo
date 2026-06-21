# Repair worklog — S033 issue-catalog (live, autonomous cycle 2026-06-21)

> **Purpose:** resume-here log for the Sonar/CodeQL/Dependabot issue repair driven off [`2026-06-issue-catalog.md`](2026-06-issue-catalog.md). Updated continuously during an autonomous cycle (Adrian away). Everything done is **committed locally** (never pushed — Adrian reviews the diff + pushes). Nothing here mutates remote dashboards.
>
> **Last updated:** after R1+R2 commit. **Session:** Max 5x, ~77% used, resets ~3h.

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

_(Earlier this session, already pushed by Adrian: db8d6c6 lint, cf9e1c3 bug fixes, 6f0cf76 de-flake, + the coverage campaign.)_

## Batch status (Reliability fix-now)

| Batch | Files | Status | Commit | Notes |
|---|---|---|---|---|
| R1 — a11y forms/landing | SettingsPage, LandingPage | ✅ done | `0ed59b0` | S6438 left (visible UI text, not a comment) |
| R2 — a11y handlers | EngawaPage, Modal | ✅ done | `0ed59b0` | role=presentation + Escape on Engawa dialog |
| R3 — numerics theme/canvas | useThemeTokens, DotGridBackground(.tsx/.test), brushstrokes | ⏳ running | — | S7773/S7767/S7758 |
| R4 — content/results pages | KatasPage, ScrollsPage, FurtherReading, ResultsPage, SharePage, markdown.ts, PredictStep | ⏳ running | — | incl. S3923 (read carefully) |
| R5 — misc pages spacing | ErrorPage, NotFoundPage, AdminErrorsPage, ChangelogPage, AuthCallbackPage | ⏳ running | — | S6772 only |
| R6 — api replaceAll | practice, admin-katas, share, og | ⏳ running | — | S7781 |

## Findings / decisions log

- **R1:** `S6438` at LandingPage:647 is a **false positive** — the `// invites are issued…` is rendered UI text (fake-code-comment styling), not a JSX comment. Converting would delete content. Leave; mark won't-fix in Sonar.
- **R2:** Engawa ask-dialog had no keyboard dismiss (unlike `Modal`, which has a document `keydown` Escape listener). Added Escape-to-close + `tabIndex={-1}`. Inner click-catcher divs → `role="presentation"` (their only handler is `stopPropagation`, no keyboard analog).
- Both HIGH security findings remain **false positives** (see catalog §1): Sonar `S2819` (event.source identity guard) + CodeQL `uuidv5` (spec-mandated SHA-1).

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

### Gate scoping (the real red-gate cause — proposed change documented below)
The gate fails on new-code coverage 0.2% + 137 new issues, both inflated by the campaign's own `*.test.*` files. Proposed (per-project `sonar-project.properties`): add test globs to `sonar.coverage.exclusions` (already?) and consider `sonar.exclusions` for the issue count, OR move the new-code baseline past `8cd6007`. **Not applied yet** — it's a deliberate measurement decision; see catalog §Gate scoping. Status: _to design in detail this cycle ↓._

### S035 (deferred by PRD — parallelizable later)
- Maintainability sweep (640) — pre-designed batch breakdown: _to add this cycle ↓._
- Refactor-shaped `needs-test-net`: `S3776` cognitive-complexity (api ×6), `S3358` nested ternaries — write characterization tests FIRST. Candidate targets: _to identify this cycle ↓._
