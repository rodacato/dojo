# Sprint 032 — Ship the set, then close the reshape loop

> **Status:** Closed 2026-06-20.
> **Phase:** 1 — Alpha
> **Predecessor:** [Sprint 031 — Go crash scroll](sprint-031-go-scroll.md)

## What triggered it

S031 left two things staged but not landed: the Go scroll (published in source, not deployed) and the S030 reshape's player/recognition layer (catalog + landing shipped; the step-player polish, completion/error states, and share surface were carried). The set was built — this sprint shipped it and closed the loop, rather than starting new content.

## What shipped

- **The five-language set went live.** Adrian deployed and reseeded prod; the Go scroll is `published` + `isPublic`, and the reseed carried the S031 Ruby `parameters_of` fix that had been dead in prod (the kata every learner failed). Verified Go live via the prod catalog: 6 lessons, 20 steps, ~100 min, accent `#00ADD8`.
- **The solo-authored Go prose got its review — as the deploy gate.** S031 flagged that the Go scroll was authored solo against a spec that called for a panel + audience read that never happened. Ran a three-lens fresh-eyes read (Go 1.16.2 correctness, pedagogy/spec alignment, polyglot audience) before the deploy. The content held — both trap predicts and the 1.16-vs-1.22 loop-capture contract verified correct, no false takeaways. Two real gaps fixed (below).
- **Step-player consistency pass.** Terminal `scroll/<lang>` contract strip in the player header (accent, path-style, doubles as the back-to-overview affordance) matching the reshaped catalog/landing; a proactive `OfflineBanner` on the public `/scrolls/*` routes. The completion moment (`ScrollCompleteBanner`) and run-error states (`OutputPanel` `ErrorCard`) already matched the catalog-era look — left as-is.
- **Completed-scroll share reshape.** Surfaced and fixed a live bug: the share JSON returned `courseAccentColor` while the page read `scrollAccentColor`, so the card had been rendering with no language accent (invalid `undefined66` borders). Repaired the key, aligned the OG image's "COURSE COMPLETE" → "SCROLL COMPLETE", bumped the title to the reshaped scale.
- **`lessons.outcome` field** — the §4.4 "what changed in the learner's head" landing line (landed earlier in the sprint).
- **Public changelog backfill.** The `/changelog` page had been frozen at 2026-03-22, missing the entire scrolls era. Three curated user-facing entries added; the doc-sync gap that let it rot closed in CLAUDE.md.

## Key decisions (and the honest ones)

- **The fresh-eyes read was the deploy gate, not a formality.** It found two real gaps, both shipped before deploy: (1) the `Notifier` challenge (2.4) test only asserted `err != nil`, so a bare `return err` passed while skipping the `%w` wrap + index the challenge teaches — now asserts `errors.Is` through a sentinel and the named index; (2) the spec advertised 22 steps + a playground the seed never shipped, with internally inconsistent arithmetic — reconciled `go.md` to the shipped 20 steps, playground design kept as canon but marked CUT.
- **The contract box was merged into the terminal header, not added as a separate block.** The orientation landing is already the full contract surface; a persistent duplicate in a fixed-height player is redundant chrome. The header strip carries the contract compactly — the same move the landing makes. Flagged to Adrian; he agreed.
- **The share glyph mark was left untouched.** The typographic mark truncates the language to 4 chars (`PYTH`, `TYPE`, `SQL-`, and a misleading `JAVA` for `javascript-dom`). What it should show is a design call (Amara C7) — flagged, not invented.

## The honest findings

- **Deploying code is not publishing.** The reseed is a separate, manual step — it is **not** in the deploy pipeline (no seed step in `deploy.yml`, no seed alias in `deploy.api.yml`). Until the reseed runs, new scroll content is not live. Worth a future operational note or a deploy-time hook so it isn't a foot-gun at the next reseed.
- **The public changelog rotted because it wasn't in the doc-sync checklist.** Fixed the checklist, not just the page.

## Verification

- Go scroll confirmed live in prod via `GET /scrolls` — `published`, `isPublic`, 20 steps, matching the reconciled count.
- `validate:scrolls` green: `validated=64 failures=0` (all 5 scrolls + Go, against real Piston Go 1.16.2), including the hardened 2.4 challenge test.
- typecheck + lint clean across web and api on every commit.
- **Not confirmed here:** the `piston-execute-smoke` cron green *post-deploy* (Adrian's — needs the production `CRON_SECRET`; Go is covered as `critical: true`). A visual browser check of the player header + share card.

## Carry-forward to S033

- **S033 (maintenance) opens from [PRD-033](../prd/033-sprint-033-maintenance-planning.md)** — security/deps, coverage measured + gated honestly across all three workspaces, dead-code tooling. Its groundwork (per-workspace Sonar split, coverage measurement, shared CI quality kit) landed early during S032.
- **Open design question:** the share card's language glyph mark (Amara C7).
- **Backlog, unchanged:** Turnstile on `/scrolls/execute` (precautionary); local Piston Go reliability (devcontainer flake); render-test infra (jsdom).
