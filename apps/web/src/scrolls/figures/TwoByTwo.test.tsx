import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { TwoByTwo, type TwoByTwoData } from './TwoByTwo'

function makeData(overrides: Partial<TwoByTwoData> = {}): TwoByTwoData {
  return {
    type: 'two-by-two',
    id: 'tradeoffs',
    rowAxis: { label: 'Cost', values: ['Cheap', 'Expensive'] },
    colAxis: { label: 'Speed', values: ['Slow', 'Fast'] },
    cells: [
      [
        { eyebrow: 'A1', title: 'Cell A1', body: 'Body A1' },
        { eyebrow: 'A2', title: 'Cell A2', body: 'Body A2' },
      ],
      [
        { eyebrow: 'B1', title: 'Cell B1', body: 'Body B1' },
        { eyebrow: 'B2', title: 'Cell B2', body: 'Body B2' },
      ],
    ],
    ...overrides,
  }
}

describe('TwoByTwo', () => {
  it('renders all four cells (eyebrow, title, body) from the data grid', () => {
    render(<TwoByTwo data={makeData()} />)

    for (const id of ['A1', 'A2', 'B1', 'B2']) {
      expect(screen.getByText(`Cell ${id}`)).toBeInTheDocument()
      expect(screen.getByText(`Body ${id}`)).toBeInTheDocument()
    }
  })

  it('renders both axis labels and all four axis values', () => {
    render(<TwoByTwo data={makeData()} />)

    expect(screen.getByText('Cost')).toBeInTheDocument()
    expect(screen.getByText('Speed')).toBeInTheDocument()
    expect(screen.getByText('Cheap')).toBeInTheDocument()
    expect(screen.getByText('Expensive')).toBeInTheDocument()
    expect(screen.getByText('Slow')).toBeInTheDocument()
    expect(screen.getByText('Fast')).toBeInTheDocument()
  })

  it('marks only the highlighted cell with the ▸ eyebrow prefix and active styling', () => {
    render(<TwoByTwo data={makeData({ highlightCell: [1, 0] })} />)

    const highlightedEyebrow = screen.getByText('▸ B1')
    expect(highlightedEyebrow).toHaveClass('text-state-active')

    expect(screen.queryByText('▸ A1')).toBeNull()
    expect(screen.getByText('A1')).toBeInTheDocument()

    const highlightedCell = highlightedEyebrow.closest('div')
    expect(highlightedCell).toHaveClass('bg-state-active/10')
  })

  it('highlights no cell when highlightCell is absent', () => {
    render(<TwoByTwo data={makeData()} />)

    for (const id of ['A1', 'A2', 'B1', 'B2']) {
      expect(screen.queryByText(`▸ ${id}`)).toBeNull()
      expect(screen.getByText(id)).toBeInTheDocument()
    }
    expect(document.querySelector('.bg-state-active\\/10')).toBeNull()
  })

  it('renders the caption only when provided', () => {
    const { rerender } = render(<TwoByTwo data={makeData()} />)
    expect(document.querySelector('figcaption')).toBeNull()

    rerender(<TwoByTwo data={makeData({ caption: 'A tradeoff matrix' })} />)
    expect(screen.getByText('A tradeoff matrix')).toBeInTheDocument()
    expect(document.querySelector('figcaption')).not.toBeNull()
  })
})
