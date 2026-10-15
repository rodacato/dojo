import { test, expect } from '@playwright/test'

// Complete-kata smoke — exercises the full pick → start → solve flow
// against a real deploy. By design we do NOT assert the LLM evaluation
// itself: that goes through the WebSocket adapter and burns tokens
// against the live model. What we assert is everything up to (and
// including) the attempt submission, which is enough to catch:
//   - kata listing breakage  (GET /exercises)
//   - session start breakage (POST /sessions)
//   - body-generation regression (GET /sessions/:id keeps polling
//     until `body` is non-null, then validates structure)
//   - attempt acceptance (POST /sessions/:id/attempts → 202 + attemptId)
//
// Intended to run against a target where `LLM_ADAPTER_FORMAT=mock` —
// keeps the suite token-free and deterministic. When that env is not
// configured the test is skipped via SMOKE_USE_MOCK_LLM gating, so the
// suite stays green on prod runs that don't carry a mock adapter.

const API_URL = process.env['SMOKE_API_URL']!
const AUTH_TOKEN = process.env['SMOKE_AUTH_TOKEN']
const USE_MOCK_LLM = process.env['SMOKE_USE_MOCK_LLM'] === '1'

interface ExerciseOption {
  id: string
  title: string
  type: string
}

interface SessionStartResponse {
  sessionId: string
}

interface SessionDetail {
  id: string
  body: string | null
  status: string
  exercise: { id: string; title: string }
}

test.describe('smoke: complete kata', () => {
  test.skip(!AUTH_TOKEN, 'SMOKE_AUTH_TOKEN is required')
  test.skip(!USE_MOCK_LLM, 'SMOKE_USE_MOCK_LLM=1 is required (target must run LLM_ADAPTER_FORMAT=mock)')

  test('pick → start → solve flow accepts an attempt end-to-end', async ({ request }) => {
    const auth = { Authorization: `Bearer ${AUTH_TOKEN}` }

    // 1. Pick — the exercise list must come back populated.
    const exercisesRes = await request.get(`${API_URL}/exercises`, { headers: auth })
    expect(exercisesRes.status(), 'GET /exercises should return 200').toBe(200)
    const exercises = (await exercisesRes.json()) as ExerciseOption[]
    expect(exercises.length, 'at least one exercise must be available').toBeGreaterThan(0)
    const exercise = exercises[0]!

    // 2. Start — POST /sessions kicks off body generation in the background.
    const startRes = await request.post(`${API_URL}/sessions`, {
      headers: auth,
      data: { exerciseId: exercise.id },
    })
    expect(startRes.status(), 'POST /sessions should return 201').toBe(201)
    const { sessionId } = (await startRes.json()) as SessionStartResponse
    expect(sessionId, 'sessionId must be returned').toBeTruthy()

    // 3. Poll for body — mock adapter resolves near-instantly, but we
    // give it up to 8s so a slow staging cold-start doesn't flake.
    const deadline = Date.now() + 8_000
    let session: SessionDetail | null = null
    while (Date.now() < deadline) {
      const res = await request.get(`${API_URL}/sessions/${sessionId}`, { headers: auth })
      expect(res.status(), `GET /sessions/${sessionId} should return 200`).toBe(200)
      session = (await res.json()) as SessionDetail
      if (session.body) break
      await new Promise((r) => setTimeout(r, 250))
    }
    expect(session?.body, 'session body must be populated within 8s').toBeTruthy()
    expect(session?.status).toBe('active')

    // 4. Solve — submit a non-empty attempt. The API enqueues it for
    // the WS evaluator and returns 202 + attemptId. Asserting the
    // accept handshake is sufficient for a smoke test; the WS path
    // is exercised by the unit + integration suites.
    const attemptRes = await request.post(`${API_URL}/sessions/${sessionId}/attempts`, {
      headers: auth,
      data: { userResponse: 'smoke test response' },
    })
    expect(attemptRes.status(), 'POST attempt should return 202').toBe(202)
    const attempt = (await attemptRes.json()) as { attemptId: string }
    expect(attempt.attemptId, 'attemptId must be returned').toBeTruthy()
  })
})
