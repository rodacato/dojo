# ADR 014: Piston for sandboxed code execution

**Status:** Accepted
**Date:** 2026-03-26
**Context:** Sprint 011 — code execution for kata evaluation

## Decision

Use [Piston](https://github.com/engineer-man/piston) (self-hosted) as the code execution engine for `type: 'code'` kata that have predefined tests.

## Why Piston

- Single container with REST API — minimal operational complexity
- nsjail sandboxing (namespace isolation, no network, CPU/RAM limits)
- 6 languages out of the box: TypeScript, Python, Ruby, Go, Rust, SQL (SQLite)
- 100-500ms latency — fast enough for post-submit evaluation
- Stateless — each execution is independent, no REPL state to manage
- Adapter pattern (`CodeExecutionPort`) allows swapping to DIY docker or Firecracker later

## Alternatives considered

| Option | Why not (for now) |
|---|---|
| DIY `docker run --rm` | More setup, slower spin-up, more security surface |
| Judge0 | Overkill for Phase 0 — designed for thousands of concurrent users |
| Firecracker microVMs | Requires KVM, 1-2 weeks setup, not justified yet |
| Browser-only (Sandpack) | Only works for frontend — backend languages need server-side execution |

## How it integrates

```
submit → IF exercise.testCode:
  → ExecutionQueue.enqueue() → PistonAdapter.execute()
  → WS: {type: 'executing'} → {type: 'execution_result'}
→ LLM receives code + test results as context
→ Sensei evaluation streams as normal
```

Code that doesn't compile or fails tests is NOT rejected — it's information for the sensei. The execution result enriches the evaluation, it doesn't gate it.

## Configuration

```env
CODE_EXECUTION_ENABLED=true
PISTON_URL=http://piston:2000
PISTON_MAX_CONCURRENT=3
PISTON_RUN_TIMEOUT=15000
PISTON_COMPILE_TIMEOUT=30000
```

## Risks

- Piston container adds ~300MB RAM idle
- Queue depth under load — mitigated by concurrency limit + timeout
- SQLite != Postgres for SQL kata — acceptable for 90% of SQL exercises
- Upgrade path: if Piston is insufficient → swap adapter to DIY docker without domain changes

## Ref

Full implementation plan: `docs/wip/EXECUTION_PLAN.md`
