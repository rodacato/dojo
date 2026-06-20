import { describe, expect, it } from 'vitest'
import {
  isPredictData,
  isPlaygroundData,
  isReadInlineData,
  type PredictData,
  type PlaygroundData,
  type ReadInlineData,
} from './types'

const predict: PredictData = {
  snippet: 's',
  options: [{ id: '1', text: 'a' }],
  correct: '1',
  feedback: { '1': 'ok' },
}
const playground: PlaygroundData = { kind: 'playground' }
const readInline: ReadInlineData = {
  interactions: [{ kind: 'reveal', after: 'm', prompt: 'p', answer: 'a' }],
}

describe('StepData type guards', () => {
  it('isPredictData narrows only predict data', () => {
    expect(isPredictData(predict)).toBe(true)
    expect(isPredictData(playground)).toBe(false)
    expect(isPredictData(null)).toBe(false)
  })

  it('isPlaygroundData narrows only playground data', () => {
    expect(isPlaygroundData(playground)).toBe(true)
    expect(isPlaygroundData(predict)).toBe(false)
    expect(isPlaygroundData(null)).toBe(false)
  })

  it('isReadInlineData narrows only read+inline data', () => {
    expect(isReadInlineData(readInline)).toBe(true)
    expect(isReadInlineData(playground)).toBe(false)
    expect(isReadInlineData(null)).toBe(false)
  })
})
