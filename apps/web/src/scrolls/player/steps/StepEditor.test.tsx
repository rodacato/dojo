import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExecuteStepResponse, StepDTO } from '@dojo/shared'
import { StepEditor } from './StepEditor'
import type { StepComponentProps } from './types'
import { api } from '../../../lib/api'
import { runInIframe } from '../../../lib/iframeSandboxRunner'

// Boundaries: the execute/api surface (network) and the iframe sandbox runner.
vi.mock('../../../lib/api', () => ({
  api: {
    executeStep: vi.fn(),
    getStepSolution: vi.fn(),
    requestNudge: vi.fn(),
    submitNudgeFeedback: vi.fn(),
  },
}))
vi.mock('../../../lib/iframeSandboxRunner', () => ({
  runInIframe: vi.fn(),
}))
vi.mock('../../../lib/anonymousId', () => ({
  getAnonymousId: vi.fn(() => 'anon-1'),
}))

// CodeEditor wraps CodeMirror — heavy and DOM-hostile under jsdom. Swap for a
// controlled textarea that preserves the value/onChange contract so we can
// assert what code reaches the execute boundary.
vi.mock('../../../components/ui/CodeEditor', () => ({
  CodeEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="Code editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}))

const executeStep = vi.mocked(api.executeStep)
const mockRunInIframe = vi.mocked(runInIframe)
const requestNudge = vi.mocked(api.requestNudge)

function makeStep(overrides: Partial<StepDTO> = {}): StepDTO {
  return {
    id: 'step-1',
    order: 1,
    type: 'code',
    title: 'Sum two numbers',
    instruction: '# Sum two numbers\n\nReturn the sum.',
    starterCode: 'function sum(a, b) {}',
    testCode: 'assert(sum(1, 2) === 3)',
    hint: null,
    hints: null,
    data: null,
    ...overrides,
  }
}

function passResult(overrides: Partial<ExecuteStepResponse> = {}): ExecuteStepResponse {
  return {
    passed: true,
    output: 'ok',
    stdout: '',
    stderr: '',
    testResults: [{ name: 'adds', passed: true }],
    ...overrides,
  }
}

function failResult(overrides: Partial<ExecuteStepResponse> = {}): ExecuteStepResponse {
  return {
    passed: false,
    output: '',
    stdout: '',
    stderr: '',
    testResults: [{ name: 'adds', passed: false, message: 'expected 3' }],
    ...overrides,
  }
}

function renderEditor(props: Partial<StepComponentProps> = {}) {
  const onMarkComplete = vi.fn()
  const onAdvance = vi.fn()
  const merged: StepComponentProps = {
    step: makeStep(),
    scrollSlug: 'big-o',
    language: 'javascript',
    isCompleted: false,
    onMarkComplete,
    onAdvance,
    ...props,
  }
  const utils = render(<StepEditor {...merged} />)
  return { ...utils, onMarkComplete, onAdvance }
}

describe('StepEditor', () => {
  beforeEach(() => {
    executeStep.mockResolvedValue(passResult())
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the step title and a Run button for a kata', () => {
    renderEditor()
    expect(screen.getByRole('heading', { name: 'Sum two numbers' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '▶ Run' })).toBeInTheDocument()
  })

  it('sends the edited code to the execute API and marks complete on pass without advancing', async () => {
    const user = userEvent.setup()
    const { onMarkComplete, onAdvance } = renderEditor()

    const editor = screen.getByLabelText('Code editor')
    await user.clear(editor)
    await user.type(editor, 'return a + b')

    await user.click(screen.getByRole('button', { name: '▶ Run' }))

    await waitFor(() =>
      expect(executeStep).toHaveBeenCalledWith({
        code: 'return a + b',
        testCode: 'assert(sum(1, 2) === 3)',
        language: 'javascript',
      }),
    )
    expect(onMarkComplete).toHaveBeenCalledTimes(1)
    // Pass must NOT auto-advance — the learner stays so Solution unlocks.
    expect(onAdvance).not.toHaveBeenCalled()
    expect(await screen.findByText('✓ All tests passed')).toBeInTheDocument()
  })

  it('escalates the hint on a failed attempt and shows tier 1', async () => {
    const user = userEvent.setup()
    executeStep.mockResolvedValue(failResult())
    renderEditor({ step: makeStep({ hints: ['Look at the return', 'You forgot to return'] }) })

    expect(screen.queryByText('Look at the return')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '▶ Run' }))

    // Auto-opens tier 1 on the first failure; tier 2 stays hidden until the second.
    expect(await screen.findByText('Look at the return')).toBeInTheDocument()
    expect(screen.queryByText('You forgot to return')).not.toBeInTheDocument()
    expect(screen.getByText(/of 1 test failed/)).toBeInTheDocument()
  })

  it('routes javascript-dom katas through the iframe sandbox, not the execute API', async () => {
    const user = userEvent.setup()
    mockRunInIframe.mockResolvedValue(passResult())
    renderEditor({ language: 'javascript-dom' })

    expect(screen.getByText('Runs in browser')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '▶ Run' }))

    await waitFor(() => expect(mockRunInIframe).toHaveBeenCalledTimes(1))
    expect(executeStep).not.toHaveBeenCalled()
  })

  it('renders a sandbox error when the execute call rejects', async () => {
    const user = userEvent.setup()
    executeStep.mockRejectedValue(new Error('network down'))
    const { onMarkComplete } = renderEditor()

    await user.click(screen.getByRole('button', { name: '▶ Run' }))

    // Network drop surfaces as the sandbox-unavailable verdict, and the stderr
    // lands in the Output tab the catch path forces open.
    expect(await screen.findByText('⚠ Sandbox unavailable')).toBeInTheDocument()
    expect(screen.getByText(/Network or server error/)).toBeInTheDocument()
    expect(onMarkComplete).not.toHaveBeenCalled()
  })

  it('hides the verdict and shows the explored chip for a playground step', async () => {
    const user = userEvent.setup()
    executeStep.mockResolvedValue(passResult())
    renderEditor({
      step: makeStep({ data: { kind: 'playground' } }),
    })

    expect(screen.getByRole('button', { name: '↻ Try it' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '↻ Try it' }))

    // Playground feedback is the explored chip, never the graded verdict.
    expect(await screen.findByText('↻ explored')).toBeInTheDocument()
    expect(screen.queryByText('✓ All tests passed')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ask the sensei/ })).not.toBeInTheDocument()
  })

  it('shows a Next button only once the step is completed and advances on click', async () => {
    const user = userEvent.setup()
    const { onAdvance, rerender } = renderEditor()
    expect(screen.queryByRole('button', { name: 'Next →' })).not.toBeInTheDocument()

    rerender(
      <StepEditor
        step={makeStep()}
        scrollSlug="big-o"
        language="javascript"
        isCompleted={true}
        onMarkComplete={vi.fn()}
        onAdvance={onAdvance}
      />,
    )

    const next = screen.getByRole('button', { name: 'Next →' })
    await user.click(next)
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('asks the sensei with the run context after a result exists', async () => {
    const user = userEvent.setup()
    executeStep.mockResolvedValue(failResult({ stdout: 'got 5', stderr: 'boom' }))
    requestNudge.mockResolvedValue({ id: 'n1', nudge: 'Check your base case.', stepId: 'step-1' })
    renderEditor()

    // Sensei button appears only after a result is present.
    expect(screen.queryByRole('button', { name: /Ask the sensei/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    const ask = await screen.findByRole('button', { name: /Ask the sensei/ })
    await user.click(ask)

    await waitFor(() =>
      expect(requestNudge).toHaveBeenCalledWith(
        expect.objectContaining({ scrollSlug: 'big-o', stepId: 'step-1', stdout: 'got 5', stderr: 'boom' }),
      ),
    )
    expect(await screen.findByText('Check your base case.')).toBeInTheDocument()
  })

  it('resets code and result when the step changes', async () => {
    const user = userEvent.setup()
    const { rerender } = renderEditor()

    await user.click(screen.getByRole('button', { name: '▶ Run' }))
    expect(await screen.findByText('✓ All tests passed')).toBeInTheDocument()

    rerender(
      <StepEditor
        step={makeStep({ id: 'step-2', title: 'Next kata', starterCode: 'next()' })}
        scrollSlug="big-o"
        language="javascript"
        isCompleted={false}
        onMarkComplete={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    expect(screen.queryByText('✓ All tests passed')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Code editor')).toHaveValue('next()')
  })
})
