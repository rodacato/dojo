import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ExecuteStepResponse, TestResultDTO } from '@dojo/shared'

import { ExploredChip, StatusChip, labelForErrorKind } from './verdict'

function makeResult(overrides: Partial<ExecuteStepResponse> = {}): ExecuteStepResponse {
  return {
    passed: false,
    output: '',
    stdout: '',
    stderr: '',
    testResults: [],
    ...overrides,
  }
}

function test(name: string, passed: boolean): TestResultDTO {
  return { name, passed }
}

describe('labelForErrorKind', () => {
  it('maps every error kind to a distinct human-readable label', () => {
    expect(labelForErrorKind('sandbox')).toBe('Sandbox unavailable')
    expect(labelForErrorKind('timeout')).toBe('Timed out')
    expect(labelForErrorKind('compile')).toBe('Compile error')
    expect(labelForErrorKind('runtime')).toBe('Runtime error')
    expect(labelForErrorKind('output-exceeded')).toBe('Too much output')
  })
})

describe('StatusChip', () => {
  it('shows the error label (not a test verdict) when errorKind is set, even if testResults exist', () => {
    render(
      <StatusChip
        result={makeResult({
          errorKind: 'timeout',
          testResults: [test('a', false), test('b', false)],
        })}
      />,
    )
    expect(screen.getByText(/Timed out/)).toBeInTheDocument()
    expect(screen.queryByText(/test/)).toBeNull()
  })

  it('reports all tests passed when passed is true', () => {
    render(<StatusChip result={makeResult({ passed: true, testResults: [test('a', true)] })} />)
    expect(screen.getByText(/All tests passed/)).toBeInTheDocument()
  })

  it('counts the failed tests against the total when some fail', () => {
    render(
      <StatusChip
        result={makeResult({
          testResults: [test('a', true), test('b', false), test('c', false)],
        })}
      />,
    )
    expect(screen.getByText(/2 of 3 tests failed/)).toBeInTheDocument()
  })

  it('uses the singular "test" when there is exactly one test total', () => {
    render(<StatusChip result={makeResult({ testResults: [test('only', false)] })} />)
    const chip = screen.getByText(/failed/)
    expect(chip).toHaveTextContent('1 of 1 test failed')
    expect(chip).not.toHaveTextContent('tests failed')
  })

  it('prioritizes errorKind over the passed flag', () => {
    render(<StatusChip result={makeResult({ passed: true, errorKind: 'sandbox' })} />)
    expect(screen.getByText(/Sandbox unavailable/)).toBeInTheDocument()
    expect(screen.queryByText(/All tests passed/)).toBeNull()
  })
})

describe('ExploredChip', () => {
  it('renders an acknowledgement so a trivially-true playground run never reads as broken', () => {
    render(<ExploredChip />)
    expect(screen.getByText(/explored/)).toBeInTheDocument()
  })
})
