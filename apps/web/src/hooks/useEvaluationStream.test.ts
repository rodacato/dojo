import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEvaluationStream } from './useEvaluationStream'
import type { EvaluationResult, ExecutionResult } from './useEvaluationStream'

const navigateMock = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

interface SentFrame {
  type: string
  attemptId?: string
}

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  static last(): FakeWebSocket {
    const ws = FakeWebSocket.instances.at(-1)
    if (!ws) throw new Error('no WebSocket was constructed')
    return ws
  }

  url: string
  sent: SentFrame[] = []
  closed = false
  onmessage: ((event: { data: string }) => void) | null = null
  onerror: (() => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  send(data: string): void {
    this.sent.push(JSON.parse(data) as SentFrame)
  }

  close(): void {
    this.closed = true
  }

  emit(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) })
  }
}

const passingResult: EvaluationResult = {
  verdict: 'passed',
  analysis: 'Clean solution.',
  topicsToReview: ['recursion'],
  followUpQuestion: 'What is the base case?',
  isFinalEvaluation: false,
}

const finalResult: EvaluationResult = {
  ...passingResult,
  isFinalEvaluation: true,
}

const execResult: ExecutionResult = {
  stdout: '42\n',
  stderr: '',
  exitCode: 0,
  timedOut: false,
  executionTimeMs: 12,
}

const SESSION = 'sess-123'

function setup() {
  return renderHook(() => useEvaluationStream(SESSION))
}

describe('useEvaluationStream', () => {
  beforeEach(() => {
    FakeWebSocket.instances = []
    navigateMock.mockClear()
    localStorage.clear()
    vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts idle and opens a token-bearing socket on connect', () => {
    localStorage.setItem('dojo_token', 'jwt-abc')
    const { result } = setup()

    expect(result.current.state).toEqual({ status: 'idle' })

    act(() => result.current.connect())

    expect(result.current.state).toEqual({ status: 'connecting' })
    expect(FakeWebSocket.last().url).toContain(`/ws/sessions/${SESSION}`)
    expect(FakeWebSocket.last().url).toContain('token=jwt-abc')
  })

  it('moves to ready on a ready message', () => {
    const { result } = setup()
    act(() => result.current.connect())

    act(() => FakeWebSocket.last().emit({ type: 'ready' }))

    expect(result.current.state).toEqual({ status: 'ready' })
  })

  it('moves to executing on an executing message', () => {
    const { result } = setup()
    act(() => result.current.connect())

    act(() => FakeWebSocket.last().emit({ type: 'executing' }))

    expect(result.current.state).toEqual({ status: 'executing' })
  })

  it('accumulates streamed token chunks into a single tokens string', () => {
    const { result } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()

    act(() => ws.emit({ type: 'token', chunk: 'Looks ' }))
    act(() => ws.emit({ type: 'token', chunk: 'good' }))

    expect(result.current.state).toMatchObject({
      status: 'streaming',
      tokens: 'Looks good',
    })
  })

  it('carries the execution result through to the streaming state', () => {
    const { result } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()

    act(() => ws.emit({ type: 'execution_result', result: execResult }))
    expect(result.current.state).toEqual({
      status: 'execution_done',
      executionResult: execResult,
    })

    act(() => ws.emit({ type: 'token', chunk: 'hi' }))
    expect(result.current.state).toMatchObject({
      status: 'streaming',
      tokens: 'hi',
      executionResult: execResult,
    })
  })

  it('reaches complete carrying the evaluation result and accumulated tokens', () => {
    const { result } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()

    act(() => ws.emit({ type: 'token', chunk: 'verdict: ' }))
    act(() => ws.emit({ type: 'evaluation', result: passingResult }))
    act(() => ws.emit({ type: 'complete' }))

    expect(result.current.state).toMatchObject({
      status: 'complete',
      result: passingResult,
      tokens: 'verdict: ',
    })
  })

  it('completes from a batched evaluation+complete via the stored latest result', () => {
    const { result } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()

    // The hook stashes the evaluation result in a ref so a complete frame that
    // lands before React flushes the evaluation state still resolves.
    act(() => {
      ws.emit({ type: 'evaluation', result: passingResult })
      ws.emit({ type: 'complete' })
    })

    expect(result.current.state).toMatchObject({
      status: 'complete',
      result: passingResult,
    })
  })

  it('does not redirect on a non-final completion', () => {
    vi.useFakeTimers()
    const { result } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()

    act(() => ws.emit({ type: 'evaluation', result: passingResult }))
    act(() => ws.emit({ type: 'complete' }))
    act(() => vi.advanceTimersByTime(5000))

    expect(navigateMock).not.toHaveBeenCalled()
  })

  it('navigates to the result page 1500ms after a final completion', () => {
    vi.useFakeTimers()
    const { result } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()

    act(() => ws.emit({ type: 'evaluation', result: finalResult }))
    act(() => ws.emit({ type: 'complete' }))

    expect(navigateMock).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1500))
    expect(navigateMock).toHaveBeenCalledWith(`/katas/${SESSION}/result`)
  })

  it('surfaces an error message from the server', () => {
    const { result } = setup()
    act(() => result.current.connect())

    act(() =>
      FakeWebSocket.last().emit({
        type: 'error',
        code: 'RATE_LIMIT',
        message: 'Too many submissions',
      }),
    )

    expect(result.current.state).toEqual({
      status: 'error',
      code: 'RATE_LIMIT',
      message: 'Too many submissions',
    })
  })

  it('surfaces a transport error from ws.onerror', () => {
    const { result } = setup()
    act(() => result.current.connect())

    act(() => FakeWebSocket.last().onerror?.())

    expect(result.current.state).toEqual({
      status: 'error',
      code: 'WS_ERROR',
      message: 'Connection error',
    })
  })

  it('treats an unexpected close as an error', () => {
    const { result } = setup()
    act(() => result.current.connect())
    act(() => FakeWebSocket.last().emit({ type: 'ready' }))

    act(() => FakeWebSocket.last().onclose?.({ code: 1006 }))

    expect(result.current.state).toEqual({
      status: 'error',
      code: 'WS_CLOSED_1006',
      message: 'Connection lost before the evaluation finished. You can reconnect.',
    })
  })

  it('leaves a completed state untouched on a clean close', () => {
    const { result } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()
    act(() => ws.emit({ type: 'evaluation', result: passingResult }))
    act(() => ws.emit({ type: 'complete' }))

    act(() => ws.onclose?.({ code: 1000 }))

    expect(result.current.state).toMatchObject({ status: 'complete' })
  })

  it('clears the token and redirects when the session expires (close 4001)', () => {
    localStorage.setItem('dojo_token', 'jwt-abc')
    const originalLocation = window.location
    const assignedHrefs: string[] = []
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        set href(value: string) {
          assignedHrefs.push(value)
        },
      },
    })

    try {
      const { result } = setup()
      act(() => result.current.connect())

      act(() => FakeWebSocket.last().onclose?.({ code: 4001 }))

      expect(localStorage.getItem('dojo_token')).toBeNull()
      expect(assignedHrefs).toContain('/?error=session_expired')
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      })
    }
  })

  it('sends a submit frame and resets to empty streaming', () => {
    const { result } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()
    act(() => ws.emit({ type: 'execution_result', result: execResult }))

    act(() => result.current.submit('attempt-9'))

    expect(ws.sent).toContainEqual({ type: 'submit', attemptId: 'attempt-9' })
    expect(result.current.state).toEqual({ status: 'streaming', tokens: '' })
  })

  it('sends a reconnect frame and resets to empty streaming', () => {
    const { result } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()

    act(() => result.current.reconnect('attempt-9'))

    expect(ws.sent).toContainEqual({ type: 'reconnect', attemptId: 'attempt-9' })
    expect(result.current.state).toEqual({ status: 'streaming', tokens: '' })
  })

  it('closes the socket on unmount', () => {
    const { result, unmount } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()
    expect(ws.closed).toBe(false)

    unmount()

    expect(ws.closed).toBe(true)
  })

  it('cancels the pending redirect timer on unmount', () => {
    vi.useFakeTimers()
    const { result, unmount } = setup()
    act(() => result.current.connect())
    const ws = FakeWebSocket.last()
    act(() => ws.emit({ type: 'evaluation', result: finalResult }))
    act(() => ws.emit({ type: 'complete' }))

    unmount()
    act(() => vi.advanceTimersByTime(5000))

    expect(navigateMock).not.toHaveBeenCalled()
  })
})
