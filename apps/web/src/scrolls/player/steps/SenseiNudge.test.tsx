import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SenseiNudgePanel, useNudge } from './SenseiNudge'

const requestNudge = vi.fn()
const submitNudgeFeedback = vi.fn()

vi.mock('../../../lib/api', () => ({
  api: {
    requestNudge: (...args: unknown[]) => requestNudge(...args),
    submitNudgeFeedback: (...args: unknown[]) => submitNudgeFeedback(...args),
  },
}))

const context = { userCode: 'print(1)', stdout: '1\n' }

beforeEach(() => {
  requestNudge.mockReset()
  submitNudgeFeedback.mockReset()
})

describe('useNudge', () => {
  it('forwards step/scroll/context to the API and exposes the returned nudge', async () => {
    requestNudge.mockResolvedValue({ id: 'n1', nudge: 'Check your loop bound.', stepId: 's1' })
    const { result } = renderHook(() => useNudge({ scrollSlug: 'binary-search', stepId: 's1' }))

    await act(async () => {
      await result.current.askSensei(context)
    })

    expect(requestNudge).toHaveBeenCalledWith({
      scrollSlug: 'binary-search',
      stepId: 's1',
      userCode: 'print(1)',
      stdout: '1\n',
      stderr: undefined,
    })
    expect(result.current.nudge).toEqual({ id: 'n1', text: 'Check your loop bound.' })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('latches disabled when the API reports the feature flag is off', async () => {
    requestNudge.mockResolvedValue({ disabled: true })
    const { result } = renderHook(() => useNudge({ scrollSlug: 's', stepId: 's1' }))

    await act(async () => {
      await result.current.askSensei(context)
    })

    expect(result.current.disabled).toBe(true)
    expect(result.current.nudge).toBeNull()

    // Once disabled, a subsequent ask must short-circuit without hitting the API.
    await act(async () => {
      await result.current.askSensei(context)
    })
    expect(requestNudge).toHaveBeenCalledTimes(1)
  })

  it('surfaces the error message when the request throws', async () => {
    requestNudge.mockRejectedValue(new Error('The sensei is unavailable right now.'))
    const { result } = renderHook(() => useNudge({ scrollSlug: 's', stepId: 's1' }))

    await act(async () => {
      await result.current.askSensei(context)
    })

    expect(result.current.error).toBe('The sensei is unavailable right now.')
    expect(result.current.nudge).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('falls back to a generic message for a non-Error rejection', async () => {
    requestNudge.mockRejectedValue('boom')
    const { result } = renderHook(() => useNudge({ scrollSlug: 's', stepId: 's1' }))

    await act(async () => {
      await result.current.askSensei(context)
    })

    expect(result.current.error).toBe('The sensei is unavailable right now.')
  })

  it('ignores re-entrant asks while a request is in flight', async () => {
    let resolve!: (v: { id: string; nudge: string; stepId: string }) => void
    requestNudge.mockReturnValue(new Promise((r) => (resolve = r)))
    const { result } = renderHook(() => useNudge({ scrollSlug: 's', stepId: 's1' }))

    let first!: Promise<void>
    act(() => {
      first = result.current.askSensei(context)
    })
    expect(result.current.loading).toBe(true)

    // Second call while loading must be a no-op (no second API hit).
    await act(async () => {
      await result.current.askSensei(context)
    })
    expect(requestNudge).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolve({ id: 'n1', nudge: 'done', stepId: 's1' })
      await first
    })
    expect(result.current.nudge).toEqual({ id: 'n1', text: 'done' })
  })

  it('records the rating optimistically and persists it once', async () => {
    requestNudge.mockResolvedValue({ id: 'n7', nudge: 'hint', stepId: 's1' })
    submitNudgeFeedback.mockResolvedValue({ ok: true })
    const { result } = renderHook(() => useNudge({ scrollSlug: 's', stepId: 's1' }))

    await act(async () => {
      await result.current.askSensei(context)
    })
    await act(async () => {
      await result.current.rateNudge('up')
    })

    expect(result.current.feedback).toBe('up')
    expect(submitNudgeFeedback).toHaveBeenCalledWith('n7', 'up')

    // Already rated → second rate is gated and never re-persists.
    await act(async () => {
      await result.current.rateNudge('down')
    })
    expect(submitNudgeFeedback).toHaveBeenCalledTimes(1)
    expect(result.current.feedback).toBe('up')
  })

  it('keeps the optimistic rating even if persistence fails', async () => {
    requestNudge.mockResolvedValue({ id: 'n7', nudge: 'hint', stepId: 's1' })
    submitNudgeFeedback.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useNudge({ scrollSlug: 's', stepId: 's1' }))

    await act(async () => {
      await result.current.askSensei(context)
    })
    await act(async () => {
      await result.current.rateNudge('up')
    })

    expect(result.current.feedback).toBe('up')
  })

  it('does not call the API when rating with no active nudge', async () => {
    const { result } = renderHook(() => useNudge({ scrollSlug: 's', stepId: 's1' }))

    await act(async () => {
      await result.current.rateNudge('up')
    })

    expect(submitNudgeFeedback).not.toHaveBeenCalled()
    expect(result.current.feedback).toBeNull()
  })

  it('dismiss clears the nudge and error but preserves the disabled latch', async () => {
    requestNudge.mockResolvedValue({ id: 'n1', nudge: 'hint', stepId: 's1' })
    const { result } = renderHook(() => useNudge({ scrollSlug: 's', stepId: 's1' }))

    await act(async () => {
      await result.current.askSensei(context)
    })
    expect(result.current.nudge).not.toBeNull()

    act(() => {
      result.current.dismiss()
    })
    expect(result.current.nudge).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('resets transient state when the active step changes', async () => {
    requestNudge.mockResolvedValue({ id: 'n1', nudge: 'hint', stepId: 's1' })
    const { result, rerender } = renderHook(({ stepId }) => useNudge({ scrollSlug: 's', stepId }), {
      initialProps: { stepId: 's1' },
    })

    await act(async () => {
      await result.current.askSensei(context)
    })
    expect(result.current.nudge).not.toBeNull()

    rerender({ stepId: 's2' })

    expect(result.current.nudge).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.feedback).toBeNull()
  })
})

describe('SenseiNudgePanel', () => {
  const noop = () => {}

  it('renders nothing when there is neither a nudge nor an error', () => {
    const { container } = render(
      <SenseiNudgePanel nudge={null} error={null} feedback={null} onRate={noop} onDismiss={noop} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the nudge text with thumbs controls when unrated', () => {
    render(
      <SenseiNudgePanel
        nudge={{ id: 'n1', text: 'Watch the off-by-one.' }}
        error={null}
        feedback={null}
        onRate={noop}
        onDismiss={noop}
      />,
    )

    expect(screen.getByText('Watch the off-by-one.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'This nudge helped' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'This nudge did not help' })).toBeInTheDocument()
  })

  it('replaces the thumbs with a thank-you once feedback is given', () => {
    render(
      <SenseiNudgePanel
        nudge={{ id: 'n1', text: 'hint' }}
        error={null}
        feedback="up"
        onRate={noop}
        onDismiss={noop}
      />,
    )

    expect(screen.getByText('Thanks — noted.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'This nudge helped' })).toBeNull()
  })

  it('wires the rate and dismiss callbacks', async () => {
    const user = userEvent.setup()
    const onRate = vi.fn()
    const onDismiss = vi.fn()
    render(
      <SenseiNudgePanel
        nudge={{ id: 'n1', text: 'hint' }}
        error={null}
        feedback={null}
        onRate={onRate}
        onDismiss={onDismiss}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'This nudge did not help' }))
    expect(onRate).toHaveBeenCalledWith('down')

    await user.click(screen.getByRole('button', { name: 'Dismiss nudge' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('shows the error instead of nudge content when only an error is present', () => {
    render(
      <SenseiNudgePanel
        nudge={null}
        error="The sensei is unavailable right now."
        feedback={null}
        onRate={noop}
        onDismiss={noop}
      />,
    )

    expect(screen.getByText('The sensei is unavailable right now.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'This nudge helped' })).toBeNull()
    // Dismiss is still available so the learner can clear the error.
    expect(screen.getByRole('button', { name: 'Dismiss nudge' })).toBeInTheDocument()
  })
})

// Guard: loading flips true during an in-flight ask and back to false after.
describe('useNudge loading lifecycle', () => {
  it('toggles loading around the request', async () => {
    let resolve!: (v: { id: string; nudge: string; stepId: string }) => void
    requestNudge.mockReturnValue(new Promise((r) => (resolve = r)))
    const { result } = renderHook(() => useNudge({ scrollSlug: 's', stepId: 's1' }))

    let pending!: Promise<void>
    act(() => {
      pending = result.current.askSensei(context)
    })
    expect(result.current.loading).toBe(true)

    await act(async () => {
      resolve({ id: 'n1', nudge: 'x', stepId: 's1' })
      await pending
    })
    await waitFor(() => expect(result.current.loading).toBe(false))
  })
})
