import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSolution } from './useSolution'
import { api } from '../../../lib/api'
import { getAnonymousId } from '../../../lib/anonymousId'

vi.mock('../../../lib/api', () => ({
  api: { getStepSolution: vi.fn() },
}))
vi.mock('../../../lib/anonymousId', () => ({
  getAnonymousId: vi.fn(),
}))

const getStepSolution = vi.mocked(api.getStepSolution)
const mockGetAnonymousId = vi.mocked(getAnonymousId)

type Props = Parameters<typeof useSolution>[0]

function baseProps(overrides: Partial<Props> = {}): Props {
  return {
    scrollSlug: 'big-o',
    stepId: 'step-1',
    isCompleted: true,
    tab: 'solution',
    isIframeLang: false,
    ...overrides,
  }
}

describe('useSolution', () => {
  beforeEach(() => {
    mockGetAnonymousId.mockReturnValue('anon-123')
    getStepSolution.mockResolvedValue({ solution: 'print(1)', alternativeApproach: 'use a set' })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch while the solution tab is not active', () => {
    renderHook(() => useSolution(baseProps({ tab: 'tests' })))
    expect(getStepSolution).not.toHaveBeenCalled()
  })

  it('does not fetch until the step is completed', () => {
    renderHook(() => useSolution(baseProps({ isCompleted: false })))
    expect(getStepSolution).not.toHaveBeenCalled()
  })

  it('fetches and exposes the solution once the tab is open and step completed', async () => {
    const { result } = renderHook(() => useSolution(baseProps()))

    await waitFor(() => expect(result.current.solutionCode).toBe('print(1)'))
    expect(result.current.alternativeApproach).toBe('use a set')
    expect(result.current.solutionError).toBeNull()
    expect(getStepSolution).toHaveBeenCalledWith('big-o', 'step-1', 'anon-123')
  })

  it('omits the anonymous id for iframe languages', async () => {
    const { result } = renderHook(() => useSolution(baseProps({ isIframeLang: true })))

    await waitFor(() => expect(result.current.solutionCode).toBe('print(1)'))
    expect(getStepSolution).toHaveBeenCalledWith('big-o', 'step-1', undefined)
    expect(mockGetAnonymousId).not.toHaveBeenCalled()
  })

  it('records the error message when the fetch rejects', async () => {
    getStepSolution.mockRejectedValueOnce(new Error('forbidden'))
    const { result } = renderHook(() => useSolution(baseProps()))

    await waitFor(() => expect(result.current.solutionError).toBe('forbidden'))
    expect(result.current.solutionCode).toBeNull()
  })

  it('retry clears the error and re-arms the fetch', async () => {
    getStepSolution.mockRejectedValueOnce(new Error('forbidden'))
    const { result } = renderHook(() => useSolution(baseProps()))

    await waitFor(() => expect(result.current.solutionError).toBe('forbidden'))
    expect(getStepSolution).toHaveBeenCalledTimes(1)

    result.current.retry()

    await waitFor(() => expect(result.current.solutionCode).toBe('print(1)'))
    expect(result.current.solutionError).toBeNull()
    expect(getStepSolution).toHaveBeenCalledTimes(2)
  })

  it('does not refetch once a solution is already loaded', async () => {
    const { result, rerender } = renderHook((props: Props) => useSolution(props), {
      initialProps: baseProps(),
    })
    await waitFor(() => expect(result.current.solutionCode).toBe('print(1)'))
    expect(getStepSolution).toHaveBeenCalledTimes(1)

    rerender(baseProps())
    expect(getStepSolution).toHaveBeenCalledTimes(1)
  })

  it('resets state and refetches when the step changes', async () => {
    const { result, rerender } = renderHook((props: Props) => useSolution(props), {
      initialProps: baseProps(),
    })
    await waitFor(() => expect(result.current.solutionCode).toBe('print(1)'))

    getStepSolution.mockResolvedValueOnce({ solution: 'print(2)', alternativeApproach: null })
    rerender(baseProps({ stepId: 'step-2' }))

    await waitFor(() => expect(result.current.solutionCode).toBe('print(2)'))
    expect(getStepSolution).toHaveBeenLastCalledWith('big-o', 'step-2', 'anon-123')
  })

  it('coerces a null solution field to an empty string', async () => {
    getStepSolution.mockResolvedValueOnce({ solution: null, alternativeApproach: null })
    const { result } = renderHook(() => useSolution(baseProps()))

    await waitFor(() => expect(result.current.solutionCode).toBe(''))
    expect(result.current.alternativeApproach).toBeNull()
  })
})
