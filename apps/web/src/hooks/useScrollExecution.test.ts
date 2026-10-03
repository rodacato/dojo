import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api/client'

const { getScrollExecutionStatus, executeScrollCode } = vi.hoisted(() => ({
  getScrollExecutionStatus: vi.fn(),
  executeScrollCode: vi.fn(),
}))

vi.mock('../lib/api', () => ({ api: { getScrollExecutionStatus, executeScrollCode } }))

import { useScrollExecution } from './useScrollExecution'

const request = { language: 'ruby', files: [{ name: 'main.rb', content: 'puts 1' }] }
const outcome = { kind: 'ok' as const, exitCode: 0, stdout: '1\n', stderr: '', durationMs: 4 }

beforeEach(() => {
  getScrollExecutionStatus.mockReset()
  executeScrollCode.mockReset()
})

describe('useScrollExecution', () => {
  it('allows run for a signed-in user on an instance that executes code', async () => {
    getScrollExecutionStatus.mockResolvedValue({ enabled: true })
    const { result } = renderHook(() => useScrollExecution('circuit', true))
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.allowRun).toBe(true)
  })

  it('never allows run for an anonymous visitor, and never asks the server', async () => {
    const { result } = renderHook(() => useScrollExecution('circuit', false))
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.allowRun).toBe(false)
    expect(getScrollExecutionStatus).not.toHaveBeenCalled()
  })

  it('does not allow run when the instance has execution disabled or the status call fails', async () => {
    getScrollExecutionStatus.mockResolvedValueOnce({ enabled: false })
    const disabled = renderHook(() => useScrollExecution('circuit', true))
    await waitFor(() => expect(disabled.result.current.ready).toBe(true))
    expect(disabled.result.current.allowRun).toBe(false)

    getScrollExecutionStatus.mockRejectedValueOnce(new Error('down'))
    const failing = renderHook(() => useScrollExecution('circuit', true))
    await waitFor(() => expect(failing.result.current.ready).toBe(true))
    expect(failing.result.current.allowRun).toBe(false)
  })

  it('runs through the API and returns the raw outcome', async () => {
    getScrollExecutionStatus.mockResolvedValue({ enabled: true })
    executeScrollCode.mockResolvedValue(outcome)
    const { result } = renderHook(() => useScrollExecution('circuit', true))

    await expect(result.current.run({ ...request, stdin: 'in' })).resolves.toEqual(outcome)
    expect(executeScrollCode).toHaveBeenCalledWith('circuit', { ...request, stdin: 'in' })
  })

  it('omits stdin when the scroll sent none', async () => {
    getScrollExecutionStatus.mockResolvedValue({ enabled: true })
    executeScrollCode.mockResolvedValue(outcome)
    const { result } = renderHook(() => useScrollExecution('circuit', true))
    await result.current.run(request)
    expect(executeScrollCode).toHaveBeenCalledWith('circuit', request)
  })

  it('turns an API failure into an unavailable result instead of throwing', async () => {
    getScrollExecutionStatus.mockResolvedValue({ enabled: true })
    executeScrollCode.mockRejectedValue(new ApiError(429, 'rate_limited'))
    const { result } = renderHook(() => useScrollExecution('circuit', true))

    await expect(result.current.run(request)).resolves.toEqual({
      kind: 'unavailable',
      exitCode: null,
      stdout: '',
      stderr: 'rate_limited',
      durationMs: 0,
    })
  })
})
