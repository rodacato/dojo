import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { FigureRenderer } from './FigureRenderer'
import { PYTHON_FIGURES } from './data/python-figures'
import { RUBY_FIGURES, type FigureData } from './data/ruby-figures'
import { RUST_FIGURES } from './data/rust-figures'
import { TYPESCRIPT_FIGURES } from './data/typescript-figures'

const REGISTRY: Record<string, FigureData> = {
  ...RUBY_FIGURES,
  ...PYTHON_FIGURES,
  ...RUST_FIGURES,
  ...TYPESCRIPT_FIGURES,
}

// Resolve a real registered id for a given figure type so the test survives
// data-file renames instead of hardcoding ids that drift.
function idForType(type: FigureData['type']): string {
  const entry = Object.entries(REGISTRY).find(([, fig]) => fig.type === type)
  if (!entry) throw new Error(`no registered figure of type "${type}"`)
  return entry[0]
}

describe('FigureRenderer dispatch', () => {
  it('renders the fallback notice for an id that is not registered', () => {
    render(<FigureRenderer id="totally-made-up-id" />)
    expect(screen.queryByRole('figure')).not.toBeInTheDocument()
    expect(screen.getByText('totally-made-up-id')).toBeInTheDocument()
    expect(screen.getByText(/data not registered/)).toBeInTheDocument()
  })

  it('routes a before-after id to the BeforeAfter figure (before/after panes)', () => {
    const id = idForType('before-after')
    const data = REGISTRY[id] as Extract<FigureData, { type: 'before-after' }>
    render(<FigureRenderer id={id} />)

    expect(screen.getByText('before')).toBeInTheDocument()
    expect(screen.getByText('after')).toBeInTheDocument()
    expect(screen.getByText(data.left.title)).toBeInTheDocument()
    expect(screen.getByText(data.right.title)).toBeInTheDocument()
  })

  it('routes a metric-pair id to the MetricPair figure (metric label + each value)', () => {
    const id = idForType('metric-pair')
    const data = REGISTRY[id] as Extract<FigureData, { type: 'metric-pair' }>
    render(<FigureRenderer id={id} />)

    expect(screen.getByText(data.metric)).toBeInTheDocument()
    for (const entry of data.entries) {
      expect(screen.getByText(entry.label)).toBeInTheDocument()
    }
  })

  it('routes a disambiguation id to the Disambiguation figure (table + divergent header)', () => {
    const id = idForType('disambiguation')
    const data = REGISTRY[id] as Extract<FigureData, { type: 'disambiguation' }>
    render(<FigureRenderer id={id} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`divergent:\\s*${data.highlightAttribute}`)),
    ).toBeInTheDocument()
    for (const entry of data.entries) {
      expect(screen.getByRole('columnheader', { name: entry.title })).toBeInTheDocument()
    }
  })

  it('routes a two-by-two id to the TwoByTwo figure (all four cell titles)', () => {
    const id = idForType('two-by-two')
    const data = REGISTRY[id] as Extract<FigureData, { type: 'two-by-two' }>
    render(<FigureRenderer id={id} />)

    for (const row of data.cells) {
      for (const cell of row) {
        expect(screen.getByText(cell.title)).toBeInTheDocument()
      }
    }
  })

  it('routes an array-track id to the ArrayTrack figure (input row + track labels)', () => {
    const id = idForType('array-track')
    const data = REGISTRY[id] as Extract<FigureData, { type: 'array-track' }>
    render(<FigureRenderer id={id} />)

    expect(screen.getByText('input')).toBeInTheDocument()
    for (const track of data.tracks) {
      expect(screen.getByText(track.label)).toBeInTheDocument()
    }
  })

  it('routes a tabbed-card id to the TabbedCard figure (tablist + a tab per entry)', () => {
    const id = idForType('tabbed-card')
    const data = REGISTRY[id] as Extract<FigureData, { type: 'tabbed-card' }>
    render(<FigureRenderer id={id} />)

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(data.tabs.length)
    for (const tab of data.tabs) {
      expect(screen.getByRole('tab', { name: tab.label })).toBeInTheDocument()
    }
  })
})
