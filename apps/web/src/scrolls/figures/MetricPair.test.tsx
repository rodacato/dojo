import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { MetricPair, type MetricPairData } from './MetricPair'

function makeData(overrides: Partial<MetricPairData> = {}): MetricPairData {
  return {
    type: 'metric-pair',
    id: 'fig-1',
    metric: 'Time complexity',
    entries: [
      { label: 'Linear scan', value: 'O(n)' },
      { label: 'Binary search', value: 'O(log n)', detail: 'sorted input' },
    ],
    ...overrides,
  }
}

describe('MetricPair', () => {
  it('renders the metric label and one cell per entry with its value + label', () => {
    render(<MetricPair data={makeData()} />)

    expect(screen.getByText('Time complexity')).toBeInTheDocument()
    expect(screen.getByText('O(n)')).toBeInTheDocument()
    expect(screen.getByText('Linear scan')).toBeInTheDocument()
    expect(screen.getByText('O(log n)')).toBeInTheDocument()
    expect(screen.getByText('Binary search')).toBeInTheDocument()
  })

  it('sizes the grid to the number of entries', () => {
    const { container } = render(<MetricPair data={makeData()} />)
    const grid = container.querySelector('.grid') as HTMLElement

    expect(grid.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))')
  })

  it('renders an optional detail only for entries that have one', () => {
    render(<MetricPair data={makeData()} />)

    expect(screen.getByText('sorted input')).toBeInTheDocument()
    // first entry has no detail; only the second one's detail node exists
    expect(screen.getAllByText('sorted input')).toHaveLength(1)
  })

  it('applies active styling to the highlighted entry and not to the others', () => {
    render(<MetricPair data={makeData({ highlight: 1 })} />)

    const highlightedValue = screen.getByText('O(log n)')
    const plainValue = screen.getByText('O(n)')

    expect(highlightedValue).toHaveClass('text-state-active')
    expect(plainValue).toHaveClass('text-primary')

    const highlightedCell = highlightedValue.closest('div') as HTMLElement
    const plainCell = plainValue.closest('div') as HTMLElement
    expect(highlightedCell.className).toContain('border-state-active/60')
    expect(plainCell.className).toContain('border-border')
  })

  it('leaves every cell in the plain state when highlight is omitted', () => {
    render(<MetricPair data={makeData()} />)

    expect(screen.getByText('O(n)')).toHaveClass('text-primary')
    expect(screen.getByText('O(log n)')).toHaveClass('text-primary')
  })

  it('renders the caption inside a figcaption when provided', () => {
    const { container } = render(
      <MetricPair data={makeData({ caption: 'Lower is better.' })} />,
    )

    const figcaption = container.querySelector('figcaption')
    expect(figcaption).not.toBeNull()
    expect(figcaption).toHaveTextContent('Lower is better.')
  })

  it('omits the figcaption entirely when no caption is given', () => {
    const { container } = render(<MetricPair data={makeData()} />)

    expect(container.querySelector('figcaption')).toBeNull()
  })
})
