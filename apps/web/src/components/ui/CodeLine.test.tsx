import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodeLine } from './CodeLine'

describe('CodeLine', () => {
  it('names the line by number and marks the choice as pressed', async () => {
    const onSelect = vi.fn()
    render(<CodeLine number={3} code="return x" selected onSelect={onSelect} />)

    const line = screen.getByRole('button', { name: 'Line 3: return x', pressed: true })
    await userEvent.click(line)

    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('names a blank line so it is not announced as just a number', () => {
    render(<CodeLine number={4} code="" selected={false} onSelect={() => {}} />)

    expect(screen.getByRole('button', { name: 'Line 4: blank line' })).toBeInTheDocument()
  })

  it('does not change the choice while disabled', async () => {
    const onSelect = vi.fn()
    render(<CodeLine number={1} code="a" selected={false} onSelect={onSelect} disabled />)

    await userEvent.click(screen.getByRole('button'))

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('renders as plain text without a handler', () => {
    render(<CodeLine number={1} code="a" selected />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('a')).toBeInTheDocument()
  })
})
