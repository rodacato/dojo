import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as ApiModule from '../../lib/api'
import { ApiError } from '../../lib/api'
import { TestRunner } from './TestRunner'

const runTestsMock = vi.fn()

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof ApiModule>()
  return { ...actual, api: { runTests: (...args: unknown[]) => runTestsMock(...args) } }
})

beforeEach(() => {
  runTestsMock.mockReset()
})

describe('TestRunner', () => {
  it("runs the editor's code and shows a failing result with its output", async () => {
    runTestsMock.mockResolvedValue({ passed: false, timedOut: false, unavailable: false, output: 'AssertionError: page 1 should return first 3 items' })
    render(<TestRunner sessionId="sess-1" code="const start = page * limit" gated disabled={false} />)

    expect(screen.getByText('Your fix has to pass the tests.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Run tests' }))

    expect(runTestsMock).toHaveBeenCalledWith('sess-1', 'const start = page * limit')
    expect(await screen.findByText('Some tests fail.')).toHaveClass('text-danger-text')
    expect(screen.getByText('AssertionError: page 1 should return first 3 items')).toBeInTheDocument()
  })

  it('says so when every test passes', async () => {
    runTestsMock.mockResolvedValue({ passed: true, timedOut: false, unavailable: false, output: 'All tests passed' })
    render(<TestRunner sessionId="sess-1" code="fixed()" gated={false} disabled={false} />)

    expect(screen.getByText('Run the tests before you submit.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Run tests' }))

    expect(await screen.findByText('All tests pass.')).toHaveClass('text-success-text')
  })

  it('tells the learner to wait when runs are rate limited', async () => {
    runTestsMock.mockRejectedValue(new ApiError(429, 'rate_limited'))
    render(<TestRunner sessionId="sess-1" code="x" gated disabled={false} />)

    await userEvent.click(screen.getByRole('button', { name: 'Run tests' }))

    expect(await screen.findByText('Too many runs. Wait a minute, then run again.')).toBeInTheDocument()
  })

  it('does not run empty code or a locked kata', () => {
    const { rerender } = render(<TestRunner sessionId="sess-1" code="  " gated disabled={false} />)
    expect(screen.getByRole('button', { name: 'Run tests' })).toBeDisabled()

    rerender(<TestRunner sessionId="sess-1" code="x" gated disabled />)
    expect(screen.getByRole('button', { name: 'Run tests' })).toBeDisabled()
  })
})
