import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'

import { Disambiguation, type DisambiguationData } from './Disambiguation'

const data: DisambiguationData = {
  type: 'disambiguation',
  id: 'fig-1',
  sharedSkeletonLabel: 'shared skeleton',
  attributes: ['lookup', 'insert', 'ordering'],
  entries: [
    { title: 'HashMap', values: { lookup: 'O(1)', insert: 'O(1)' } },
    { title: 'TreeMap', values: { lookup: 'O(log n)', insert: 'O(log n)', ordering: 'sorted' } },
  ],
  highlightAttribute: 'ordering',
  caption: 'They share the skeleton but diverge on ordering.',
}

describe('Disambiguation', () => {
  it('renders the shared skeleton label and the divergent attribute in the header', () => {
    render(<Disambiguation data={data} />)
    expect(screen.getByText('shared skeleton')).toBeInTheDocument()
    expect(screen.getByText(/divergent: ordering/)).toBeInTheDocument()
  })

  it('renders one column header per entry plus the leading attribute column', () => {
    render(<Disambiguation data={data} />)
    const headerRow = screen.getAllByRole('row')[0]!
    const headerCells = within(headerRow).getAllByRole('columnheader')
    expect(headerCells.map((c) => c.textContent)).toEqual(['attribute', 'HashMap', 'TreeMap'])
  })

  it('renders one body row per attribute', () => {
    render(<Disambiguation data={data} />)
    const bodyRows = screen.getAllByRole('row').slice(1)
    expect(bodyRows).toHaveLength(data.attributes.length)
  })

  it('places each entry value in the cell matching its attribute', () => {
    render(<Disambiguation data={data} />)
    const lookupRow = screen.getByText('lookup').closest('tr')!
    const cells = within(lookupRow).getAllByRole('cell')
    expect(cells.map((c) => c.textContent)).toEqual(['lookup', 'O(1)', 'O(log n)'])
  })

  it('falls back to an em dash when an entry lacks a value for an attribute', () => {
    render(<Disambiguation data={data} />)
    const orderingRow = screen.getByText('ordering').closest('tr')!
    const cells = within(orderingRow).getAllByRole('cell')
    // HashMap has no `ordering` value -> em dash; TreeMap has 'sorted'
    expect(cells.map((c) => c.textContent)).toEqual(['◆ordering', '—', 'sorted'])
  })

  it('marks only the highlight attribute row with the active diamond and emphasis class', () => {
    render(<Disambiguation data={data} />)

    const highlightRow = screen.getByText('ordering').closest('tr')!
    expect(highlightRow).toHaveClass('bg-state-active/10')
    expect(within(highlightRow).getByText('◆')).toBeInTheDocument()

    const plainRow = screen.getByText('lookup').closest('tr')!
    expect(plainRow).not.toHaveClass('bg-state-active/10')
    expect(within(plainRow).queryByText('◆')).toBeNull()
  })

  it('renders the caption when provided and omits the figcaption when absent', () => {
    const { rerender } = render(<Disambiguation data={data} />)
    expect(
      screen.getByText('They share the skeleton but diverge on ordering.'),
    ).toBeInTheDocument()

    rerender(<Disambiguation data={{ ...data, caption: undefined }} />)
    expect(
      screen.queryByText('They share the skeleton but diverge on ordering.'),
    ).toBeNull()
  })
})
