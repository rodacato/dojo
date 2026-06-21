import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TabbedCard, type TabbedCardData } from './TabbedCard'

function makeData(overrides: Partial<TabbedCardData> = {}): TabbedCardData {
  return {
    type: 'tabbed-card',
    id: 'demo',
    tabs: [
      { label: 'First', body: 'Alpha body' },
      { label: 'Second', body: 'Beta body' },
      { label: 'Third', body: 'Gamma body' },
    ],
    ...overrides,
  }
}

describe('TabbedCard', () => {
  it('renders one tab button per tab, with the labels as accessible names', () => {
    render(<TabbedCard data={makeData()} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(3)
    expect(tabs.map((t) => t.textContent)).toEqual(['First', 'Second', 'Third'])
  })

  it('selects the first tab by default and shows only that tab body', () => {
    render(<TabbedCard data={makeData()} />)

    expect(screen.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute('aria-selected', 'false')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('Alpha body')
    expect(panel).not.toHaveTextContent('Beta body')
  })

  it('switches the visible panel when a different tab is clicked', async () => {
    const user = userEvent.setup()
    render(<TabbedCard data={makeData()} />)

    await user.click(screen.getByRole('tab', { name: 'Second' }))

    expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'First' })).toHaveAttribute('aria-selected', 'false')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('Beta body')
    expect(panel).not.toHaveTextContent('Alpha body')
  })

  it('honors defaultTab to open a non-first tab', () => {
    render(<TabbedCard data={makeData({ defaultTab: 2 })} />)

    expect(screen.getByRole('tab', { name: 'Third' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gamma body')
  })

  it('clamps an out-of-range defaultTab to the last tab instead of crashing', () => {
    render(<TabbedCard data={makeData({ defaultTab: 99 })} />)

    expect(screen.getByRole('tab', { name: 'Third' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gamma body')
  })

  it('wires the active tab to its panel via aria-controls / aria-labelledby', () => {
    render(<TabbedCard data={makeData()} />)

    const activeTab = screen.getByRole('tab', { name: 'First' })
    const panel = screen.getByRole('tabpanel')
    expect(activeTab.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(activeTab.id)
  })

  it('renders inline markdown in the tab body (e.g. bold) rather than literal markers', () => {
    render(<TabbedCard data={makeData({ tabs: [{ label: 'Only', body: 'a **bold** word' }] })} />)

    const panel = screen.getByRole('tabpanel')
    expect(panel.querySelector('strong')).toHaveTextContent('bold')
    expect(panel).not.toHaveTextContent('**bold**')
  })

  it('renders an optional caption inside the figcaption', () => {
    render(<TabbedCard data={makeData({ caption: 'A taxonomy of states' })} />)
    expect(screen.getByText('A taxonomy of states').tagName).toBe('FIGCAPTION')
  })
})
