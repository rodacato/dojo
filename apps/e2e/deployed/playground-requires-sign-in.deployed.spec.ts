import { test, expect } from '@playwright/test'

// Anonymous code must never reach the privileged sandbox (ADR 035).
const API_URL = process.env['SMOKE_API_URL']!

test.describe('smoke: playground requires sign-in', () => {
  test('an anonymous run is refused before it reaches Piston', async ({ request }) => {
    const res = await request.post(`${API_URL}/engawa/run`, {
      data: { language: 'python', version: '3.12.0', code: 'print("smoke")' },
    })

    expect(res.status(), `POST /engawa/run without a session returned ${res.status()}: ${await res.text()}`).toBe(401)
  })
})
