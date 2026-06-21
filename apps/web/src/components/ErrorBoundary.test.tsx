import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'

const report = vi.fn()
vi.mock('../lib/observability', () => ({
  errorReporter: { report: (...args: unknown[]) => report(...args) },
}))

function Boom({ message }: { message: string }): never {
  throw new Error(message)
}

function renderBoundary(children: React.ReactNode) {
  return render(<MemoryRouter><ErrorBoundary>{children}</ErrorBoundary></MemoryRouter>)
}

describe('ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    report.mockClear()
    // React logs the caught error to console.error; suppress the expected noise.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('renders the fallback ErrorPage instead of the crashed child when a child throws', () => {
    renderBoundary(<Boom message="kata loop exploded" />)

    expect(screen.getByRole('heading', { name: 'Something broke.' })).toBeInTheDocument()
    expect(screen.getByText('kata loop exploded')).toBeInTheDocument()
  })

  it('passes a non-throwing child through untouched', () => {
    renderBoundary(<p>healthy dojo</p>)

    expect(screen.getByText('healthy dojo')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Something broke.' })).not.toBeInTheDocument()
  })

  it('reports the caught error through the error reporter', () => {
    renderBoundary(<Boom message="reportable failure" />)

    expect(report).toHaveBeenCalledTimes(1)
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'reportable failure' }),
    )
  })
})
