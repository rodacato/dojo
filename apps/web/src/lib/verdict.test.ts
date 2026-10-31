import { describe, expect, it } from 'vitest'
import { isVerdict } from './verdict'

describe('isVerdict', () => {
  it.each(['passed', 'passed_with_notes', 'needs_work'])('accepts %s', (value) => {
    expect(isVerdict(value)).toBe(true)
  })

  it.each(['PASSED', 'toString', '', null])('rejects %j', (value) => {
    expect(isVerdict(value)).toBe(false)
  })
})
