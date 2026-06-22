import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExecutionResultCard } from './ExecutionResultCard'
import type { ExecutionResult } from '../../hooks/useEvaluationStream'

function result(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    stdout: 'hello stdout',
    stderr: '',
    exitCode: 0,
    timedOut: false,
    executionTimeMs: 123,
    ...overrides,
  }
}

describe('ExecutionResultCard', () => {
  it('shows TESTS PASSED and the run time for a zero exit code, collapsed by default', () => {
    render(<ExecutionResultCard result={result()} />)

    expect(screen.getByText('TESTS PASSED')).toBeInTheDocument()
    expect(screen.getByText('123ms')).toBeInTheDocument()
    // Collapsed: details (stdout / exit code) are not rendered yet.
    expect(screen.queryByText('stdout')).not.toBeInTheDocument()
    expect(screen.queryByText(/exit code:/)).not.toBeInTheDocument()
  })

  it('shows TESTS FAILED for a non-zero exit code', () => {
    render(<ExecutionResultCard result={result({ exitCode: 1 })} />)
    expect(screen.getByText('TESTS FAILED')).toBeInTheDocument()
  })

  it('shows TIMED OUT when the run timed out, regardless of exit code', () => {
    render(<ExecutionResultCard result={result({ timedOut: true, exitCode: 1 })} />)
    expect(screen.getByText('TIMED OUT')).toBeInTheDocument()
  })

  it('expands on click to reveal stdout, stderr and the exit code', async () => {
    const user = userEvent.setup()
    render(
      <ExecutionResultCard
        result={result({ stdout: 'out-text', stderr: 'err-text', exitCode: 2 })}
      />,
    )

    await user.click(screen.getByRole('button'))

    expect(screen.getByText('stdout')).toBeInTheDocument()
    expect(screen.getByText('out-text')).toBeInTheDocument()
    expect(screen.getByText('stderr')).toBeInTheDocument()
    expect(screen.getByText('err-text')).toBeInTheDocument()
    expect(screen.getByText('exit code: 2')).toBeInTheDocument()
  })

  it('omits the stdout/stderr blocks when those streams are empty', async () => {
    const user = userEvent.setup()
    render(<ExecutionResultCard result={result({ stdout: '', stderr: '' })} />)

    await user.click(screen.getByRole('button'))

    expect(screen.queryByText('stdout')).not.toBeInTheDocument()
    expect(screen.queryByText('stderr')).not.toBeInTheDocument()
    // The exit-code line is always shown once expanded.
    expect(screen.getByText('exit code: 0')).toBeInTheDocument()
  })
})
