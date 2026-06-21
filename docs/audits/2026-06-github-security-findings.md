# GitHub security scan findings — gitleaks + trivy + semgrep (2026-06-21)

> The `quality.yml` security job calls `rodacato/sector-7g` which runs three scanners. **They run `blocking: false` → `continue-on-error: true`, so they REPORT but do NOT fail the workflow** (the run shows "success" with red step-annotations). This is a **to-do backlog**, not a live gate block. Companion to [`2026-06-issue-catalog.md`](2026-06-issue-catalog.md).
>
> Source: `gh run view <id> --log` on the *Sector 7g - Quality* `security` job (run on `91eb9ba`).

## gitleaks (secret scan) — 4 findings, all FALSE POSITIVE → FIXED

| Finding | Location | Verdict |
|---|---|---|
| `curl-auth-user` ×2 | `scripts/sonar-dump.sh:26,31` | FP — `curl -u "$SONAR_TOKEN:"` is an **env var** injected at runtime, no literal secret in the file. |
| `generic-api-key` ×2 | `exercises/security.ts:69`, `seed.ts:676` (git **history**) | FP — `sk-prod-a8f3…` + `DB_PASSWORD='hunter2'` are **teaching fixtures** inside the "spot the hardcoded secret" code-review kata. The files no longer exist / were rewritten at HEAD; the matches are historical. |

**Fixed:** added [`.gitleaks.toml`](../../.gitleaks.toml) — extends the default ruleset and allowlists these by value-regex (`sk-prod-…`, `hunter2`, `$SONAR_TOKEN`) and path (`scripts/sonar-dump.sh`, the kata fixture). gitleaks-action@v3 auto-loads it from the repo root. **No real secret was ever committed** — verified the historical content is markdown teaching fixtures.

## trivy (deps + secrets + IaC) — to triage/fix

| Class | Count | Notes |
|---|---|---|
| Secrets | 3 | Same fixtures as gitleaks. trivy uses its own secret engine — needs a `trivy.yaml`/`.trivyignore` allowlist (or `# trivy:ignore` on the kata fixture). **TODO** — gitleaks is allowlisted; trivy isn't yet. |
| Dependencies | 1 HIGH (pnpm-lock) | Overlaps the Dependabot/audit transitive set (all dev-only — see catalog §1). trivy's DB may rate one HIGH where npm-audit rates moderate. **TODO: pull the exact CVE from job logs**, confirm it's the same dev-transitive, then `.trivyignore` or bump. |
| IaC misconfig | ~8 (Dockerfile) | `Dockerfile` + `apps/api/Dockerfile`: runs as **root** (no `USER`), `:latest`/unpinned base, likely missing `HEALTHCHECK`. **Real hardening** — see "Real fixes" below. |

## semgrep (SAST) — 19 findings

| Rule | Count | Triage |
|---|---|---|
| `detect-replaceall-sanitization` | 12 | **Self-inflicted churn.** My Tier-2 sweep converted `replace(/x/g)` → `replaceAll` (Sonar S7781 wanted it); semgrep now flags `replaceAll` in sanitization context. For the `escapeHtml` fns (`practice.ts`, `og.ts`) the escaping is **complete and correct** (escapes `& < > " '` in sequence) → FP. **Honest read: Tier-2's S7781 fix was net-neutral — traded a Sonar nit for a semgrep nit.** Options: revert those specific `replaceAll`→`replace` (satisfies semgrep, re-opens Sonar), or `// nosemgrep`, or accept as report-only noise. Adrian's call. |
| `unsafe-formatstring` | 3 | `ConsoleErrorReporter` (api+web), `parse-insight`. `console.error` with a non-literal first arg. Low risk (logging, not eval); triage per site. |
| `detect-non-literal-regexp` | 2 | `PredictStep.tsx`, `markdown.ts` — `new RegExp(dynamic)`. Check if the input is user-controlled (ReDoS risk) or static; likely static → FP, confirm. |
| `run-shell-injection` | 1 | `.github/workflows/accessory-reboot.yml` — `${{ }}` interpolated directly into a `run:` block. **Real** — move the value into an `env:` var and reference `$VAR`. |
| `missing-user` | 1 | Dockerfile runs as root. **Real** — same as trivy IaC. |

## Real fixes worth doing (not FP)

1. **Dockerfile hardening** (`Dockerfile` + `apps/api/Dockerfile`): add a non-root `USER`, pin the base image, add `HEALTHCHECK`. Test the container still boots + writes where it needs to (Kamal deploy). Careful — infra-touching.
2. **`run-shell-injection`** in `accessory-reboot.yml`: hoist the `${{ }}` into `env:` and use `"$VAR"` in the script. Quick + safe.
3. **trivy secret allowlist** (`trivy.yaml`): mirror the `.gitleaks.toml` allowlist so the fixtures stop flagging there too.
4. **trivy HIGH dep**: pull the CVE, confirm dev-transitive, `.trivyignore` with reason or bump.

## What's already done

- ✅ gitleaks: `.gitleaks.toml` allowlist (this commit).
- The 10 `actions/missing-workflow-permissions` (CodeQL) were fixed earlier (`f1d8633`).

## Honest note

Several of these (replaceall-sanitization ×12, the secret fixtures) are **noise/FP**, and one batch of noise (replaceall) was **introduced by the Sonar Tier-2 sweep** — a concrete example of why chasing one tool's "A" rating can light up another tool. The genuinely worthwhile items are few: Dockerfile non-root + the one workflow shell-injection. Prioritize those; allowlist the rest with reasons.
