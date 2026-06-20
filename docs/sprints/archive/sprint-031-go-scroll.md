# Sprint 031 — Go crash scroll + the carried smoke

> **Status:** Closed 2026-06-20 (work 2026-06-19 – 06-20).
> **Phase:** 1 — Alpha
> **Predecessor:** [Sprint 030 — scrolls presentation reshape](sprint-030-scrolls-reshape.md) *(re-scoped from Go; Go landed here)*

## What triggered it

S030 deferred Go to ship the scrolls presentation reshape, carrying two things into S031: the full-set Piston smoke (owed since S029) and the Go scroll itself. This sprint paid both — and the Go scroll closes the five-language anchored set (Ruby, Python, Rust, TypeScript, Go) committed in ADR 022.

## What shipped

- **W1 — the carried full-set smoke, and it caught a live bug.** `validate:scrolls` against real Piston flagged `parameters_of` in the *published* Ruby scroll: its fixtures lived in `starterCode` not `testCode` (the recorded solution had nothing to introspect), and `fixture_mixed` used invalid Ruby parameter order (`*rest` after a keyword — a parse error). The kata never compiled; every learner Run failed. Fixed both; smoke green.
- **W2 — graduated the reviewed Go spec** from `.kwik-e/` to `docs/courses/curricula/go/go.md` (the S030 reshape was the "courses refactor" it was parked behind).
- **W3 infra — the Go harness, de-risked before any lesson seeded.** `PistonAdapter` `isGo` branch (marker-insertion combine, `main.go`); the harness hand-rolls JSON because `encoding/json` crashes the sandbox keeper on 1.16.2. Validated against Piston Go 1.16.2.
- **W3 content — the Go scroll, 22 steps / 6 lessons.** Context, errors-as-values, structural interfaces, structs/composition, concurrency, and a 3-lesson capstone. 10 katas (incl. two broken→fix), 4 predicts, 6 reads, a mid-scroll challenge. All 10 katas smoke green (`validated=64`).
- **W4 — published** (staged): `status: published`, `isPublic: true`, `go` whitelisted. Final full-set smoke green. Voice gate clean (no minimizers).

## Key decisions (and the honest ones)

- **De-risked the highest-risk infra item first**, as the spec demanded — found *two* blockers (the marker-insertion need, the encoding/json sandbox crash) at the first smoke, before authoring. Cheaper than finding them at lesson 4.
- **Hand-rolled JSON over `encoding/json`** — not a style choice; the import crashes the Piston sandbox on 1.16.2. Recorded in the spec §5 so the next author doesn't re-discover it.
- **Retry transient sandbox crashes in the smoke** rather than chase the host-memory flake — the `Sandbox keeper…` marker distinguishes infra flake (retryable) from content drift (deterministic). The right control for a flake we can't fix from inside the container.
- **Capstone Option A (sequential)** — ratified at spec sign-off; no contrived goroutine fan-out (G3 lives in kata 4.4). README §5.3: the capstone tests the learner's competence, not the author's cleverness.

## The honest findings

- **The devcontainer Piston is ~50-90% flaky for Go** under host memory pressure (multiple devcontainers sharing the host — same root cause as the S030 vite-build OOM). The smoke survives it via retries; the content is correct (every kata validated when Piston cooperates). A clean local smoke wants reduced memory pressure; prod/CI Piston is the reliable verifier.
- **The Go prose was authored solo.** The spec calls for panel + audience prose review; that didn't happen. Flagged as the open recommendation: a fresh-eyes read before the deploy that takes it live.

## Verification

- `validate:scrolls` green: `validated=64 failures=0` (all 5 scrolls + Go's 10 katas, against real Piston Go 1.16.2).
- typecheck 5/5, lint clean across every commit. Voice gate (no `simply`/`obviously`/`just …`) clean.
- **Not done:** the live deploy (Adrian's, per the commit-locally discipline); a human prose review.

## Carry-forward to S032

- **Deploy** the five-language set incl. Go (operational; reseed runs the Ruby `parameters_of` fix and the Go scroll live). Read the Go prose first.
- **S030 reshape follow-ups:** the step-player consistency pass (terminal header, contract box) + completion/error states; the completed-scroll share reshape; a `lessons.outcome` field for the §4.4 landing line.
- **Turnstile on `/scrolls/execute`** (precautionary, backlog).
