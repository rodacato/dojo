# PRD-004: Local Dev Strategy — Mocks vs Real

> **Status:** exploring
> **Date:** 2026-03-21
> **Author:** Claude (Kira + panel: Tomás, Yemi, Marta)

---

## Idea in one sentence

Define what to mock, what to use real, and how to make the local dev experience fast enough to work without waiting for real LLM calls — while being explicit about what needs to be replaced before production.

---

## The tension

Two competing needs:
1. **Speed:** LLM calls are slow (2–8s per response, streaming). Waiting for real evaluations during frontend development kills momentum.
2. **Fidelity:** Mocks that don't behave like the real thing will hide bugs. The streaming UX, error handling, and verdict parsing all need to be tested against real behavior.

**Resolution:** Use mocks by default in dev. Use real calls in a `MOCK_LLM=false` mode that can be toggled per session. Never use real LLM in automated tests.

---

## Service-by-service strategy

### LLM (Anthropic) — Mock by default

**What already exists:** `MockLLMAdapter` in `apps/api/src/infrastructure/adapters/MockLLMAdapter.ts`

**Current behavior:** Returns a deterministic `EvaluationResult` immediately (no streaming simulation).

**Problem:** The frontend streaming UX (blinking cursor, token-by-token rendering) cannot be developed against an adapter that returns instantly.

**Recommendation:**

Enhance `MockLLMAdapter` to simulate streaming with configurable delay:

```typescript
// .env.local
MOCK_LLM=true
MOCK_LLM_STREAM_DELAY_MS=50   # ms between tokens (simulates real streaming pace)
MOCK_LLM_RESPONSE_TOKENS=80   # number of fake tokens to emit
MOCK_LLM_VERDICT=passed        # passed | passed_with_notes | needs_work
MOCK_LLM_FOLLOW_UP=true        # whether the first exchange triggers a follow-up
```

This gives the frontend team a realistic streaming experience without API costs or latency.

**When to use real:** Set `MOCK_LLM=false` with a real `ANTHROPIC_API_KEY` when:
- Testing the actual prompt behavior
- Validating that the `EvaluationResult` parser handles all real LLM output formats
- Doing a "full loop" test before a deploy

> Yemi's note: **The real LLM adapter should be tested in isolation before wiring the WebSocket.** Write a standalone script `scripts/test-llm.ts` that calls the adapter with a hardcoded submission and prints the streamed result. This is the fastest way to validate prompt behavior without the full app.

---

### PostgreSQL — Real (always)

The devcontainer already has a real Postgres instance (`dojo_dev`). Drizzle migrations run on startup. No reason to mock this — Postgres is fast and the schema is stable.

**What already exists:** `postgres` service in devcontainer, `pnpm db:migrate` in post-install.

**No changes needed.** Use the real DB in all environments (dev, test, production).

---

### GitHub OAuth — Real in dev, skip in E2E tests

**In dev:** Real GitHub OAuth works. The devcontainer exposes port 3001, and `GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback` is set. The flow works as-is.

**In automated tests:** Mock at the `requireAuth` middleware level — inject a fake user into context without hitting GitHub or the session table.

```typescript
// test/helpers/auth.ts
export function withMockUser(user: User) {
  return (c: Context, next: Next) => {
    c.set('user', user)
    return next()
  }
}
```

**No OAuth mock needed in dev** — the real flow is fast and correct.

---

### WebSocket — Real (always)

WebSocket is handled natively by Hono + Node.js. No external dependency. Use the real WebSocket in all environments.

The only difference in dev: the mock LLM adapter emits tokens with configurable delay, so the streaming behavior is testable without a real API.

---

### Drawhaus / WhiteboardPort — Mock in Phase 0

The `WhiteboardPort` connects to `drawhaus.notdefined.dev` (a separate repo). This is not ready for Phase 0 integration.

**Recommendation:**

```typescript
class MockWhiteboardAdapter implements WhiteboardPort {
  async createBoard(): Promise<BoardId> {
    return 'mock-board-id'
  }
  async getBoard(id: BoardId): Promise<Board> {
    return { id, content: '<empty>' }
  }
}
```

**For the frontend:** The WHITEBOARD kata type screen renders a Mermaid editor. In Phase 0, wire the Mermaid editor to a local state object (no Drawhaus API call). The `body` submitted to the sensei is just the Mermaid syntax text.

**Label this explicitly:** Add a `// TODO: Phase 1 — replace with real DrawhausHttpClient` comment in the container.

---

### Share card generation — Defer

The share card is a server-generated 1200×630px image. Options: `satori` (JSX to SVG) + `@resvg/resvg-js` (SVG to PNG), or `puppeteer` (headless Chrome).

**For Phase 0:** Skip entirely. The Results screen shows a simplified inline preview (pure CSS/HTML). Real OG image generation is a Phase 1 item.

---

## Environment configuration by context

| Env var | Phase 0 dev | Phase 0 test | Phase 0 production |
|---|---|---|---|
| `MOCK_LLM` | `true` | `true` | `false` |
| `ANTHROPIC_API_KEY` | optional | — | required |
| `MOCK_LLM_STREAM_DELAY_MS` | `50` | `0` | — |
| `MOCK_LLM_VERDICT` | `needs_work` | `passed` | — |
| `DATABASE_URL` | devcontainer Postgres | devcontainer Postgres | Hetzner Postgres |
| `GITHUB_CLIENT_ID` | dev OAuth app | — | prod OAuth app |
| `GITHUB_CALLBACK_URL` | `http://localhost:3001/...` | mock | prod URL |
| `WHITEBOARD_MOCK` | `true` | `true` | `true` (Phase 0) |

---

## Developer workflow (day-to-day)

```bash
# Start everything (Turborepo watch mode)
pnpm dev

# Frontend available at:  http://localhost:5173
# API available at:       http://localhost:3001
# WebSocket available at: ws://localhost:3001/ws/sessions/:id

# To test with real LLM (one-off):
MOCK_LLM=false pnpm --filter=api dev

# To test a single LLM prompt:
npx tsx scripts/test-llm.ts "Your test submission here"

# To reset the local DB (nuke and re-seed):
pnpm --filter=api db:push && pnpm --filter=api db:seed
```

---

## What needs to be replaced before production

| Mock | Status | Replace with | When |
|---|---|---|---|
| `MockLLMAdapter` | Phase 0 dev | `AnthropicStreamAdapter` | Already planned (sprint-002) |
| `MockWhiteboardAdapter` | Phase 0 | `DrawhausHttpClient` | Phase 1 |
| Share card CSS preview | Phase 0 | Real OG image generator (satori) | Phase 1 |
| `CREATOR_GITHUB_ID` env var | Phase 0 admin auth | `users.is_creator` DB column | Phase 1 |
| `InMemoryEventBus` | Phase 0 | Redis/BullMQ | Phase 2 (when cross-process events needed) |

---

## Provisional conclusion

The dev strategy is layered and explicit: real DB, real WebSocket, real OAuth — mock LLM with streaming simulation, mock Whiteboard, defer share cards. The mocks are configurable and labeled for removal.

The key risk Tomás flags: **The enhanced `MockLLMAdapter` must behave close enough to the real adapter that switching to real doesn't break the WebSocket message protocol.** Both adapters must emit the same `EvaluationToken` types in the same order.

---

## Next step

- [ ] Enhance `MockLLMAdapter` with streaming simulation (configurable delay + token count)
- [ ] Create `MockWhiteboardAdapter` and register in container
- [ ] Add `MOCK_LLM` + related vars to `.env.example` with comments
- [ ] Write `scripts/test-llm.ts` standalone script
- [ ] Document dev workflow in `README.md`
