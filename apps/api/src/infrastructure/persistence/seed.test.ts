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
    expect(() => validateKatas([kata])).toThrow(/point answer lines/)
  })

  it('rejects an equally right line that is not in the starter code', () => {
    const base = KATAS.find((k) => k.rubric?.answer?.shape === 'point')!
    const kata: SeedKata = { ...base, rubric: { ...base.rubric!, answer: { shape: 'point', line: 1, also: [999] } } }
    expect(() => validateKatas([kata])).toThrow(/point answer lines 1, 999/)
  })

  it('rejects an artifact kata that is not answered by pointing', () => {
    const kata: SeedKata = { ...KATAS.find((k) => k.rubric?.answer?.shape === 'predict')!, languages: ['log'] }
    expect(() => validateKatas([kata])).toThrow(/a log is only answered by pointing/)
  })

  it.each([
    ['without starter code', { starterCode: undefined }],
    ['without an expected output', { rubric: { expectedIssues: [{ title: 't', severity: 'high' as const, why: 'w' }], answer: { shape: 'predict' as const, output: ' \n' } } }],
    ['that is not a review kata', { type: 'code' as const }],
  ])('rejects a predict kata %s', (_label, over) => {
    const kata: SeedKata = { ...KATAS.find((k) => k.rubric?.answer?.shape === 'predict')!, ...over }
    expect(() => validateKatas([kata])).toThrow(/predict kata/)
  })

  it.each([
    ['with a line outside the starter code', { accepted: [[1, 99]] }],
    ['with a line used twice', { accepted: [[1, 1]] }],
  ])('rejects an order kata %s', (_label, answer) => {
    const base = KATAS.find((k) => k.rubric?.answer?.shape === 'order')!
    const kata: SeedKata = { ...base, rubric: { ...base.rubric!, answer: { shape: 'order', ...answer } } }
    expect(() => validateKatas([kata])).toThrow(/order kata/)
  })

  it('rejects a topic outside the canonical vocabulary', () => {
    const kata: SeedKata = { ...KATAS[0]!, topics: ['window-functions', 'partition-by'] }
    expect(() => validateKatas([kata])).toThrow(/topics not in TOPICS: partition-by/)
  })

  it('rejects a kata with no topics', () => {
    const kata: SeedKata = { ...KATAS[0]!, topics: [] }
    expect(() => validateKatas([kata])).toThrow(/no topics/)
  })

  it('rejects a bug-fix kata without a reference fix', () => {
    const kata: SeedKata = { ...KATAS.find((k) => k.category === 'debugging' && k.testCode)!, fixCode: undefined }
    expect(() => validateKatas([kata])).toThrow(/reference fix/)
  })

  it('rejects an order kata without an orderCheck', () => {
    const kata: SeedKata = { ...KATAS.find((k) => k.rubric?.answer?.shape === 'order')!, orderCheck: undefined }
    expect(() => validateKatas([kata])).toThrow(/orderCheck/)
  })

  it('rejects an order kata that is not a review kata', () => {
    const kata: SeedKata = { ...KATAS.find((k) => k.rubric?.answer?.shape === 'order')!, type: 'code' }
    expect(() => validateKatas([kata])).toThrow(/order kata/)
  })
})
