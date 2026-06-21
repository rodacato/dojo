import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

import { Heatmap, heatmapIntensity } from './Heatmap'

// The component derives its date window from `new Date()` at render time, so the
// only way to assert against concrete dates (tooltips, which cell a count lands
// in) is to pin the clock. Noon UTC keeps toISOString().slice(0,10) on the same
// calendar day regardless of the jsdom timezone.
const NOW = new Date('2026-06-21T12:00:00.000Z')

function dayOffset(daysAgo: number): string {
  const d = new Date(NOW)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

const TODAY = dayOffset(0)

function renderHeatmap(props: Parameters<typeof Heatmap>[0]) {
  const { container } = render(<Heatmap {...props} />)
  const grid = container.firstElementChild as HTMLElement
  const cells = Array.from(grid.children) as HTMLElement[]
  return { grid, cells }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('Heatmap', () => {
  it('renders one cell per day in the default 30-day window', () => {
    const { cells } = renderHeatmap({ data: [] })
    expect(cells).toHaveLength(30)
  })

  it('honors a custom window length (e.g. PublicProfilePage uses 90)', () => {
    const { cells } = renderHeatmap({ data: [], days: 90 })
    expect(cells).toHaveLength(90)
  })

  it('renders the trailing window ending today, oldest-first', () => {
    const { cells } = renderHeatmap({ data: [], days: 30 })

    // Last cell is today; first is 29 days ago.
    expect(cells[cells.length - 1]).toHaveAttribute('title', `${TODAY}: 0 katas`)
    expect(cells[0]).toHaveAttribute('title', `${dayOffset(29)}: 0 katas`)
  })

  it('labels the container with the window size for the hover affordance', () => {
    const { grid } = renderHeatmap({ data: [], days: 90 })
    expect(grid).toHaveAttribute('title', '90-day activity')
  })

  it('places a day count on its matching date cell', () => {
    const target = dayOffset(3)
    const { cells } = renderHeatmap({ data: [{ date: target, count: 2 }] })

    const cell = cells.find((c) => c.getAttribute('title')?.startsWith(target))
    expect(cell).toBeDefined()
    expect(cell).toHaveAttribute('title', `${target}: 2 katas`)
    expect(cell).toHaveClass('bg-accent/45')
  })

  it('treats days absent from data as zero activity (empty cell)', () => {
    const { cells } = renderHeatmap({ data: [{ date: TODAY, count: 4 }] })

    const today = cells[cells.length - 1]
    const empty = cells[0]
    expect(today).toHaveClass('bg-accent')
    expect(empty).toHaveClass('bg-elevated')
  })

  it('ignores data points outside the rendered window', () => {
    // 100 days ago falls well before the 30-day window: no cell should carry it.
    const stale = dayOffset(100)
    const { cells } = renderHeatmap({ data: [{ date: stale, count: 9 }], days: 30 })

    const match = cells.find((c) => c.getAttribute('title')?.startsWith(stale))
    expect(match).toBeUndefined()
    // And every cell stays empty since nothing in-window had activity.
    expect(cells.every((c) => c.className.includes('bg-elevated'))).toBe(true)
  })

  describe('tooltip pluralization', () => {
    it('uses the singular "kata" for exactly one', () => {
      const target = dayOffset(2)
      const { cells } = renderHeatmap({ data: [{ date: target, count: 1 }] })

      const cell = cells.find((c) => c.getAttribute('title')?.startsWith(target))
      expect(cell).toHaveAttribute('title', `${target}: 1 kata`)
    })

    it('uses the plural "katas" for zero', () => {
      const { cells } = renderHeatmap({ data: [] })
      expect(cells[0]).toHaveAttribute('title', `${dayOffset(29)}: 0 katas`)
    })

    it('uses the plural "katas" for many', () => {
      const target = dayOffset(1)
      const { cells } = renderHeatmap({ data: [{ date: target, count: 5 }] })

      const cell = cells.find((c) => c.getAttribute('title')?.startsWith(target))
      expect(cell).toHaveAttribute('title', `${target}: 5 katas`)
    })
  })
})

describe('heatmapIntensity', () => {
  it('renders the neutral elevated step for no activity', () => {
    expect(heatmapIntensity(0)).toBe('bg-elevated')
  })

  it('clamps non-positive counts to the elevated step', () => {
    expect(heatmapIntensity(-5)).toBe('bg-elevated')
  })

  it('ramps opacity up across the 1..3 band', () => {
    expect(heatmapIntensity(1)).toBe('bg-accent/20')
    expect(heatmapIntensity(2)).toBe('bg-accent/45')
    expect(heatmapIntensity(3)).toBe('bg-accent/70')
  })

  it('tops out at full accent for 4 or more', () => {
    expect(heatmapIntensity(4)).toBe('bg-accent')
    expect(heatmapIntensity(50)).toBe('bg-accent')
  })
})
