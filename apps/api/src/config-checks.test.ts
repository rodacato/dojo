import { describe, expect, it } from 'vitest'
import { insecureProductionSettings } from './config-checks'

const DEV_SECRET = 'dev-secret-change-me-in-production-must-be-at-least-32-characters'

describe('insecureProductionSettings', () => {
  it('rejects the .env.example session secret in production', () => {
    const problems = insecureProductionSettings({ NODE_ENV: 'production', SESSION_SECRET: DEV_SECRET })

    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain('SESSION_SECRET')
  })

  it('accepts a generated session secret in production', () => {
    const secret = 'f3a9c1d27be84a6091d5e2c7b8a4f60e1d93b7c25a8e4f1067d2c9b3a5e8f410'

    expect(insecureProductionSettings({ NODE_ENV: 'production', SESSION_SECRET: secret })).toEqual([])
  })

  it.each(['development', 'test'])('leaves the dev secret alone in %s so a fresh clone still boots', (NODE_ENV) => {
    expect(insecureProductionSettings({ NODE_ENV, SESSION_SECRET: DEV_SECRET })).toEqual([])
  })
})
