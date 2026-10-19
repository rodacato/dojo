import { describe, expect, it } from 'vitest'
import { KATAS, type SeedKata } from './katas'
import { validateKatas } from './seed'

describe('validateKatas', () => {
  it('accepts every kata the seed ships', () => {
    expect(() => validateKatas(KATAS)).not.toThrow()
  })

  it('rejects a point kata whose answer line is not in its starter code', () => {
    const kata: SeedKata = {
      ...KATAS.find((k) => k.rubric?.answer)!,
      starterCode: 'one line\n',
    }
    expect(() => validateKatas([kata])).toThrow(/point answer line/)
  })
})
