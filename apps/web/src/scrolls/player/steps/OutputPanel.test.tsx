import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ExecuteStepResponse } from '@dojo/shared'

import { OutputPanel } from './OutputPanel'

function makeResult(overrides: Partial<ExecuteStepResponse> = {}): ExecuteStepResponse {
  return {
    passed: true,
    output: '',
    stdout: '',
    stderr: '',
    testResults: [],
    ...overrides,
  }
}

type PanelProps = Parameters<typeof OutputPanel>[0]

function renderPanel(overrides: Partial<PanelProps> = {}) {
  const props: PanelProps = {
    result: null,
    tab: 'tests',
    onTabChange: vi.fn(),
    isCompleted: false,
    solutionCode: null,
    alternativeApproach: null,
    solutionError: null,
    onSolutionRetry: vi.fn(),
    editorLanguage: 'javascript',
    isPlayground: false,
    ...overrides,
  }
  return { ...render(<OutputPanel {...props} />), props }
}

describe('OutputPanel — playground mode', () => {
  it('shows only the Output tab (no Tests / Solution) and an idle prompt', () => {
    renderPanel({ isPlayground: true, result: null })

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveTextContent('Output')
    expect(screen.queryByText('Tests')).toBeNull()
    expect(screen.queryByText(/Solution/)).toBeNull()
    expect(screen.getByText(/Try the code above/)).toBeInTheDocument()
  })

  it('renders captured stdout once a result exists, ignoring the stale tab prop', () => {
    // tab is 'solution' but playground forces Output — proves the override.
    renderPanel({
      isPlayground: true,
      tab: 'solution',
      result: makeResult({ stdout: 'hello playground' }),
    })

    expect(screen.getByText('hello playground')).toBeInTheDocument()
    expect(screen.queryByText(/reference solution/)).toBeNull()
  })
})

describe('OutputPanel — tab structure & routing', () => {
  it('renders the three tabs with the Solution tab locked until completed', () => {
    renderPanel({ isCompleted: false })

    expect(screen.getByRole('button', { name: /Tests/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Output/ })).toBeInTheDocument()
    const solution = screen.getByRole('button', { name: /Solution/ })
    expect(solution).toBeDisabled()
    expect(solution).toHaveAttribute(
      'title',
      'Pass the step to unlock the reference solution',
    )
  })

  it('unlocks the Solution tab once the step is completed', () => {
    renderPanel({ isCompleted: true })
    expect(screen.getByRole('button', { name: /Solution/ })).toBeEnabled()
  })

  it('fires onTabChange when a tab is clicked', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    renderPanel({ tab: 'tests', onTabChange })

    await user.click(screen.getByRole('button', { name: /Output/ }))
    expect(onTabChange).toHaveBeenCalledWith('output')
  })

  it('shows a run-first prompt when there is no result yet (non-solution tab)', () => {
    renderPanel({ tab: 'tests', result: null })
    expect(screen.getByText(/Run your code to see test results/)).toBeInTheDocument()
  })

  it('shows the passed/total counter on the Tests tab label', () => {
    renderPanel({
      tab: 'tests',
      result: makeResult({
        passed: false,
        testResults: [
          { name: 'a', passed: true },
          { name: 'b', passed: false },
        ],
      }),
    })
    expect(screen.getByText('(1/2)')).toBeInTheDocument()
  })
})

describe('OutputPanel — Tests tab body', () => {
  it('lists each test result with pass/fail markers and failure messages', () => {
    renderPanel({
      tab: 'tests',
      result: makeResult({
        passed: false,
        testResults: [
          { name: 'adds numbers', passed: true },
          { name: 'handles zero', passed: false, message: 'expected 0 got 1' },
        ],
      }),
    })

    expect(screen.getByText('adds numbers')).toBeInTheDocument()
    expect(screen.getByText('handles zero')).toBeInTheDocument()
    expect(screen.getByText('expected 0 got 1')).toBeInTheDocument()
  })

  it('hides the message for a passing test (message only surfaces on failure)', () => {
    renderPanel({
      tab: 'tests',
      result: makeResult({
        testResults: [{ name: 'ok', passed: true, message: 'should-be-hidden' }],
      }),
    })
    expect(screen.queryByText('should-be-hidden')).toBeNull()
  })

  it('renders a dedicated error card (not the test list) when execution errored', () => {
    renderPanel({
      tab: 'tests',
      result: makeResult({
        passed: false,
        errorKind: 'sandbox',
        errorMessage: 'Could not reach the runner',
        stderr: 'connection refused',
      }),
    })

    expect(screen.getByText('Could not reach the runner')).toBeInTheDocument()
    expect(screen.getByText('connection refused')).toBeInTheDocument()
    // labelForErrorKind('sandbox') label appears in the card header.
    expect(screen.getByText(/Sandbox unavailable/)).toBeInTheDocument()
  })

  it('falls back to the error-kind label when no errorMessage is given', () => {
    renderPanel({
      tab: 'tests',
      result: makeResult({ passed: false, errorKind: 'timeout' }),
    })
    expect(screen.getAllByText(/Timed out/).length).toBeGreaterThan(0)
  })
})

describe('OutputPanel — Output tab body', () => {
  it('renders both stdout and stderr sections when present', () => {
    renderPanel({
      tab: 'output',
      result: makeResult({ stdout: 'out line', stderr: 'err line' }),
    })

    expect(screen.getByText('stdout')).toBeInTheDocument()
    expect(screen.getByText('out line')).toBeInTheDocument()
    expect(screen.getByText('stderr')).toBeInTheDocument()
    expect(screen.getByText('err line')).toBeInTheDocument()
  })

  it('shows the empty-output hint when stdout/stderr are blank', () => {
    renderPanel({
      tab: 'output',
      result: makeResult({ stdout: '   ', stderr: '' }),
    })
    expect(screen.getByText(/No output\./)).toBeInTheDocument()
    expect(screen.queryByText('stdout')).toBeNull()
  })
})

describe('OutputPanel — Solution tab', () => {
  it('gates the solution behind completion even on the solution tab', () => {
    renderPanel({ tab: 'solution', isCompleted: false, solutionCode: 'x = 1' })
    expect(screen.getByText(/Pass the step to see one reference solution/)).toBeInTheDocument()
    expect(screen.queryByText('x = 1')).toBeNull()
  })

  it('shows a loading state while the solution is still null', () => {
    renderPanel({ tab: 'solution', isCompleted: true, solutionCode: null })
    expect(screen.getByText(/Loading solution/)).toBeInTheDocument()
  })

  it('renders the reference code with a language class once loaded', () => {
    const { container } = renderPanel({
      tab: 'solution',
      isCompleted: true,
      solutionCode: 'const answer = 42',
      editorLanguage: 'typescript',
    })

    const code = container.querySelector('code.language-typescript')
    expect(code).not.toBeNull()
    expect(code).toHaveTextContent('const answer = 42')
  })

  it('reports an empty-solution message when the code is blank', () => {
    renderPanel({ tab: 'solution', isCompleted: true, solutionCode: '   ' })
    expect(screen.getByText(/No reference solution recorded/)).toBeInTheDocument()
  })

  it('shows the error and wires the Retry button to onSolutionRetry', async () => {
    const user = userEvent.setup()
    const onSolutionRetry = vi.fn()
    renderPanel({
      tab: 'solution',
      isCompleted: true,
      solutionError: 'network down',
      onSolutionRetry,
    })

    expect(screen.getByText(/network down/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Retry/ }))
    expect(onSolutionRetry).toHaveBeenCalledTimes(1)
  })

  it('renders the optional alternative approach inside a disclosure', () => {
    renderPanel({
      tab: 'solution',
      isCompleted: true,
      solutionCode: 'x = 1',
      alternativeApproach: 'You could also use recursion.',
    })

    expect(screen.getByText('Alternative approach')).toBeInTheDocument()
    expect(screen.getByText('You could also use recursion.')).toBeInTheDocument()
  })
})
