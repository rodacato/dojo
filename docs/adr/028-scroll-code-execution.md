# ADR-028: Code execution for embedded scrolls
**Status:** accepted
**Date:** 2026-10-03

## Context
A scroll that teaches a language needs to run the learner's code. Dojo already has a sandbox (Piston, ADRs 018 and 019) behind katas and the playground. A scroll is third-party code (ADR 027), so whatever it can ask the host to run must not open that sandbox to anonymous abuse or hand the scroll a credential.

## Decision
- **Protocol:** `run` (scroll to host) and `result` (host to scroll) leave the reserved list; `llm` stays reserved. The `run` capability is granted only if the manifest declares it, the instance has `FF_CODE_EXECUTION_ENABLED`, and the user is signed in. Without it, `run` is answered with an `error` of code `capability-denied`.
- **Authenticated only.** The host calls `POST /scrolls/:slug/execute` with the user's session; the scroll holds no key.
- **Own queue.** Scrolls get a separate `ExecutionQueue` (`SCROLL_EXEC_MAX_CONCURRENT`, default 2) over the same Piston adapter, so a busy scroll never starves katas or the playground, plus a per-user limit (`SCROLL_EXEC_USER_PER_MINUTE`, default 10).
- **Raw output.** The host returns `{kind, exitCode, stdout, stderr, durationMs}` and never parses stdout. `kind` is `ok`, `compile`, `runtime`, `timeout`, `output-limit` or `unavailable`; when Piston is down or the queue times out the scroll gets `unavailable`, never a hang or a raw error. Results never feed belts.
- **Limits.** The language must be in the manifest's `programmingLanguages`; at most 8 files and 64 KiB in total (Piston's body limit is 100 KB); output is cut to 64 Ki characters per stream. The Piston timeouts and output cap are the existing ones.

## Alternatives Considered
- **Anonymous execution:** scrolls are untrusted clients driving a sandbox that costs CPU; reachable only by signed-in users is the cheap defence. Reversible later behind a flag if a real need appears.
- **Per-scroll API keys:** the scroll would hold a credential, against ADR 027, and rotating or revoking them is work with no gain over the user's session.
- **Parsing a result line (`__DOJO_RESULT__`, as the native scrolls did):** couples the host to one scroll's output format. The scroll reads its own output.

## Consequences
The host depends on Piston being reachable and degrades to `unavailable`. Two queues share one Piston, so total concurrency is the sum of both limits and the Piston container has to be sized for that. A per-user limit is in memory per API process, which is exact with the single API container deployed today.

## Open questions
- Per-scroll quotas (non-goal here), so one popular scroll cannot use the whole instance budget.
- Anonymous execution, and what limit would make it safe.
- The Piston runtime for languages scrolls need that are not in the adapter's language map (dry-rb is Phase 8).
- The sqlite runtime takes the entry file as an argument; other runtimes may need per-language entry conventions.
