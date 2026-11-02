import { describe, expect, it } from 'vitest'
import { buildPromptA, buildPromptB, buildPromptC, buildSessionBodyPrompt, type PromptParams } from './sensei'

const baseParams: PromptParams = {
  ownerRole: 'Principal Engineer',
  ownerContext: 'You care about correctness over cleverness.',
  kataTitle: 'Fix: Off-by-one in pagination',
  kataDescription: 'The paginate function has a bug.',
  userResponse: 'function paginate(items, page, limit) { ... }',
}

describe('sensei prompts — debugging context', () => {
  const variants = [
    { name: 'A', fn: buildPromptA },
    { name: 'B', fn: buildPromptB },
    { name: 'C', fn: buildPromptC },
  ]

  for (const { name, fn } of variants) {
    it(`variant ${name} injects debugging context when category === 'debugging'`, () => {
      const prompt = fn({ ...baseParams, category: 'debugging' })
      expect(prompt).toContain('DEBUGGING KATA')
      expect(prompt).toContain('root cause')
    })

    it(`variant ${name} omits debugging context for other categories`, () => {
      const prompt = fn({ ...baseParams, category: 'sql' })
      expect(prompt).not.toContain('DEBUGGING KATA')
    })

    it(`variant ${name} omits debugging context when category is undefined`, () => {
      const prompt = fn({ ...baseParams })
      expect(prompt).not.toContain('DEBUGGING KATA')
    })
  }
})

describe('buildSessionBodyPrompt', () => {
  const body = { ownerRole: 'Staff Engineer', ownerContext: 'Payments.', kataDescription: 'Design a rate limiter.' }

  it('leaves decisions to a senior instead of specifying them', () => {
    const prompt = buildSessionBodyPrompt({ ...body, level: 'senior' })
    expect(prompt).toContain("THE DEVELOPER'S LEVEL:\nThe developer is senior.")
    expect(prompt).toContain('incomplete specification')
  })

  it('spells out the constraints for a junior', () => {
    expect(buildSessionBodyPrompt({ ...body, level: 'junior' })).toContain('Spell out the requirements and the constraints')
  })

  it('writes the body as before when the session has no level', () => {
    expect(buildSessionBodyPrompt(body)).not.toContain("THE DEVELOPER'S LEVEL")
  })
})
