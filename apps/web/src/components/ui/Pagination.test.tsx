import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

function getPageButton(label: string): HTMLButtonElement {
  return screen.getByRole('button', { name: label }) as HTMLButtonElement
}

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when totalPages is zero', () => {
    const { container } = render(<Pagination page={1} totalPages={0} onChange={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a nav with the default accessible label', () => {
    render(<Pagination page={1} totalPages={3} onChange={vi.fn()} />)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
  })

  it('uses a custom aria-label when provided', () => {
    render(<Pagination page={1} totalPages={3} onChange={vi.fn()} ariaLabel="Results pages" />)
    expect(screen.getByRole('navigation', { name: 'Results pages' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
  })

  it('renders every page button when total pages is small (<= 7)', () => {
    render(<Pagination page={1} totalPages={5} onChange={vi.fn()} />)
    for (const n of ['1', '2', '3', '4', '5']) {
      expect(getPageButton(n)).toBeInTheDocument()
    }
    expect(screen.queryByText('…')).not.toBeInTheDocument()
  })

  it('marks the current page with aria-current and the accent border class', () => {
    render(<Pagination page={3} totalPages={5} onChange={vi.fn()} />)
    const current = getPageButton('3')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current).toHaveClass('border-accent')

    const other = getPageButton('2')
    expect(other).not.toHaveAttribute('aria-current')
    expect(other).not.toHaveClass('border-accent')
  })

  it('calls onChange with the target page when a page number is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Pagination page={1} totalPages={5} onChange={onChange} />)

    await user.click(getPageButton('4'))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(4)
  })

  describe('Prev button', () => {
    it('is disabled on the first page and does not call onChange', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<Pagination page={1} totalPages={5} onChange={onChange} />)

      const prev = screen.getByRole('button', { name: '← Prev' })
      expect(prev).toBeDisabled()

      await user.click(prev)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('moves to the previous page when enabled', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<Pagination page={3} totalPages={5} onChange={onChange} />)

      await user.click(screen.getByRole('button', { name: '← Prev' }))
      expect(onChange).toHaveBeenCalledWith(2)
    })
  })

  describe('Next button', () => {
    it('is disabled on the last page and does not call onChange', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<Pagination page={5} totalPages={5} onChange={onChange} />)

      const next = screen.getByRole('button', { name: 'Next →' })
      expect(next).toBeDisabled()

      await user.click(next)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('moves to the next page when enabled', async () => {
      const onChange = vi.fn()
      const user = userEvent.setup()
      render(<Pagination page={3} totalPages={5} onChange={onChange} />)

      await user.click(screen.getByRole('button', { name: 'Next →' }))
      expect(onChange).toHaveBeenCalledWith(4)
    })

    it('is enabled on the first page (when more than one page exists)', () => {
      render(<Pagination page={1} totalPages={5} onChange={vi.fn()} />)
      expect(screen.getByRole('button', { name: 'Next →' })).toBeEnabled()
    })
  })

  describe('page windowing for large totals (> 7)', () => {
    it('shows leading and trailing ellipses when on a middle page', () => {
      render(<Pagination page={10} totalPages={20} onChange={vi.fn()} />)

      // First, last, and the window around 10 are present.
      expect(getPageButton('1')).toBeInTheDocument()
      expect(getPageButton('9')).toBeInTheDocument()
      expect(getPageButton('10')).toBeInTheDocument()
      expect(getPageButton('11')).toBeInTheDocument()
      expect(getPageButton('20')).toBeInTheDocument()

      // Two ellipsis separators (before and after the window).
      expect(screen.getAllByText('…')).toHaveLength(2)

      // Pages far from the window are collapsed away.
      expect(screen.queryByRole('button', { name: '5' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '15' })).not.toBeInTheDocument()
    })

    it('omits the leading ellipsis when near the start', () => {
      render(<Pagination page={2} totalPages={20} onChange={vi.fn()} />)

      // Window 1,2,3 is contiguous from the start: no leading gap, only trailing.
      expect(getPageButton('1')).toBeInTheDocument()
      expect(getPageButton('2')).toBeInTheDocument()
      expect(getPageButton('3')).toBeInTheDocument()
      expect(getPageButton('20')).toBeInTheDocument()
      expect(screen.getAllByText('…')).toHaveLength(1)
    })

    it('omits the trailing ellipsis when near the end', () => {
      render(<Pagination page={19} totalPages={20} onChange={vi.fn()} />)

      expect(getPageButton('1')).toBeInTheDocument()
      expect(getPageButton('18')).toBeInTheDocument()
      expect(getPageButton('19')).toBeInTheDocument()
      expect(getPageButton('20')).toBeInTheDocument()
      expect(screen.getAllByText('…')).toHaveLength(1)
    })

    it('renders ellipses as non-interactive text, not buttons', () => {
      render(<Pagination page={10} totalPages={20} onChange={vi.fn()} />)
      expect(screen.queryByRole('button', { name: '…' })).not.toBeInTheDocument()
    })
  })

  describe('size variants', () => {
    it('uses the medium cell size and text by default', () => {
      render(<Pagination page={1} totalPages={5} onChange={vi.fn()} />)

      expect(screen.getByRole('navigation')).toHaveClass('text-sm')
      const cell = getPageButton('1')
      expect(cell).toHaveClass('w-8', 'h-8')

      // Default md: prev/next are not uppercased.
      expect(screen.getByRole('button', { name: '← Prev' })).not.toHaveClass('uppercase')
    })

    it('applies small variant classes when size="sm"', () => {
      render(<Pagination page={1} totalPages={5} onChange={vi.fn()} size="sm" />)

      expect(screen.getByRole('navigation')).toHaveClass('text-xs')
      expect(screen.getByRole('navigation')).not.toHaveClass('text-sm')

      const cell = getPageButton('1')
      expect(cell).toHaveClass('w-7', 'h-7')
      expect(cell).not.toHaveClass('w-8')

      expect(screen.getByRole('button', { name: '← Prev' })).toHaveClass('uppercase', 'tracking-wider')
      expect(screen.getByRole('button', { name: 'Next →' })).toHaveClass('uppercase', 'tracking-wider')
    })
  })

  it('shows exactly 7 page buttons at the boundary (totalPages === 7, no ellipsis)', () => {
    render(<Pagination page={4} totalPages={7} onChange={vi.fn()} />)
    expect(screen.queryByText('…')).not.toBeInTheDocument()
    for (const n of ['1', '2', '3', '4', '5', '6', '7']) {
      expect(getPageButton(n)).toBeInTheDocument()
    }
  })
})
