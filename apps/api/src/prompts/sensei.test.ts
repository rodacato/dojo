import { describe, expect, it } from 'vitest'
import { buildPromptA, buildPromptB, buildPromptC, type PromptParams } from './sensei'

const baseParams: PromptParams = {
  ownerRole: 'Principal Engineer',
  ownerContext: 'You care about correctness over cleverness.',
  exerciseTitle: 'Fix: Off-by-one in pagination',
  exerciseDescription: 'The paginate function has a bug.',
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
      expect(prompt).toContain('DEBUGGING EXERCISE')
      expect(prompt).toContain('root cause')
    })

    it(`variant ${name} omits debugging context for other categories`, () => {
      const prompt = fn({ ...baseParams, category: 'sql' })
      expect(prompt).not.toContain('DEBUGGING EXERCISE')
    })

    it(`variant ${name} omits debugging context when category is undefined`, () => {
      const prompt = fn({ ...baseParams })
      expect(prompt).not.toContain('DEBUGGING EXERCISE')
    })
  }
})
