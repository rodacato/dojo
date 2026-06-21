import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import type { ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { within } from '@testing-library/dom'
import { Timer } from './Timer'

// Environment note: @testing-library/react's bundled react-dom resolves to a
// different module instance than the component's `react` under this vitest
// setup, which nulls the hooks dispatcher ("Invalid hook call") for any
// hook-using component. To render the real Timer we drive react-dom/client
// imported in THIS module so the react graph is shared. Queries come from
// @testing-library/dom (no react dependency) against the live document.

// react-dom/client's act() requires this flag; @testing-library/react would
// normally set it, but we drive createRoot ourselves.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const NOW = new Date('2026-06-21T12:00:00.000Z').getTime()

function startedSecondsAgo(seconds: number): string {
  return new Date(NOW - seconds * 1000).toISOString()
}

interface Mounted {
  container: HTMLDivElement
  root: Root
}

const mounted: Mounted[] = []

// Fresh mount per call: Timer seeds its countdown from useState(initial), which
// ignores prop changes on re-render, so each scenario needs its own tree.
// Returns a scoped query API so coexisting mounts don't collide on getByText.
function renderTimer(ui: ReactElement): ReturnType<typeof within> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => {
    root.render(ui)
  })
  mounted.push({ container, root })
  return within(container)
}

beforeEach(() => {
  // Fake only the clock/timer APIs the component reads; faking the full set
  // breaks React 19's dev scheduler.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  for (const { container, root } of mounted) {
    act(() => {
      root.unmount()
    })
    container.remove()
  }
  mounted.length = 0
  vi.useRealTimers()
})

describe('Timer', () => {
  it('formats the remaining time as MM:SS from duration and startedAt', () => {
    // 10 min duration, started 90s ago -> 8:30 remaining.
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(90)} />)

    expect(ui.getByText('08:30')).toBeInTheDocument()
  })

  it('zero-pads minutes and seconds below ten', () => {
    // 5 min duration, started 3s ago -> 04:57.
    const ui = renderTimer(<Timer durationMinutes={5} startedAt={startedSecondsAgo(3)} />)

    expect(ui.getByText('04:57')).toBeInTheDocument()
  })

  it('counts down as the interval ticks', () => {
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(90)} />)

    expect(ui.getByText('08:30')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(ui.getByText('08:28')).toBeInTheDocument()
    expect(ui.queryByText('08:30')).not.toBeInTheDocument()
  })

  it('renders 00:00 and never goes negative once past the duration', () => {
    // started 2s after the full duration elapsed -> remaining is negative.
    const ui = renderTimer(<Timer durationMinutes={1} startedAt={startedSecondsAgo(62)} />)

    expect(ui.getByText('00:00')).toBeInTheDocument()
  })

  it('uses the primary tone with plenty of time left (>20%)', () => {
    // 10 min, started 60s ago -> 9:00 (90% remaining).
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(60)} />)

    const node = ui.getByText('09:00')
    expect(node).toHaveClass('text-primary')
    expect(node).not.toHaveClass('text-warning')
    expect(node).not.toHaveClass('text-danger')
  })

  it('switches to the warning tone between 10% and 20% remaining', () => {
    // 10 min (600s) total. 15% remaining = 90s left -> started 510s ago.
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(510)} />)

    const node = ui.getByText('01:30')
    expect(node).toHaveClass('text-warning')
    expect(node).not.toHaveClass('text-danger')
    expect(node).not.toHaveClass('text-primary')
  })

  it('switches to the danger tone at or below 10% remaining', () => {
    // 10 min (600s). 5% remaining = 30s left -> started 570s ago.
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(570)} />)

    const node = ui.getByText('00:30')
    expect(node).toHaveClass('text-danger')
    expect(node).not.toHaveClass('text-warning')
    expect(node).not.toHaveClass('text-primary')
  })

  it('uses the muted tone when expired', () => {
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(700)} />)

    const node = ui.getByText('00:00')
    expect(node).toHaveClass('text-muted')
    expect(node).not.toHaveClass('text-danger')
  })

  it('shows the blinking cursor in the danger window', () => {
    // 5% remaining -> danger -> cursor visible.
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(570)} />)

    const cursor = ui.getByText('_')
    expect(cursor).toBeInTheDocument()
    expect(cursor).toHaveClass('animate-cursor')
  })

  it('omits the cursor when there is comfortable time left', () => {
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(60)} />)

    expect(ui.queryByText('_')).not.toBeInTheDocument()
  })

  it('hides the cursor once expired (danger requires not-expired)', () => {
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(700)} />)

    expect(ui.queryByText('_')).not.toBeInTheDocument()
  })

  it('marks the cursor decorative with aria-hidden', () => {
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(570)} />)

    expect(ui.getByText('_')).toHaveAttribute('aria-hidden')
  })

  it('announces politely via aria-live while in danger', () => {
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(570)} />)

    expect(ui.getByText('00:30')).toHaveAttribute('aria-live', 'polite')
  })

  it('keeps aria-live off when not in danger', () => {
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(60)} />)

    expect(ui.getByText('09:00')).toHaveAttribute('aria-live', 'off')
  })

  it('applies the sm size class', () => {
    const ui = renderTimer(
      <Timer durationMinutes={10} startedAt={startedSecondsAgo(60)} size="sm" />,
    )
    expect(ui.getByText('09:00')).toHaveClass('text-lg')
  })

  it('applies the lg size class', () => {
    const ui = renderTimer(
      <Timer durationMinutes={10} startedAt={startedSecondsAgo(60)} size="lg" />,
    )
    expect(ui.getByText('09:00')).toHaveClass('text-5xl')
  })

  it('defaults to the md size class when no size prop is given', () => {
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(60)} />)

    const node = ui.getByText('09:00')
    expect(node).toHaveClass('text-2xl')
    expect(node).not.toHaveClass('text-lg')
    expect(node).not.toHaveClass('text-5xl')
  })

  it('fires onExpired exactly once when the countdown reaches zero', () => {
    const onExpired = vi.fn()
    // 1 min duration, started 58s ago -> 2s left.
    renderTimer(
      <Timer durationMinutes={1} startedAt={startedSecondsAgo(58)} onExpired={onExpired} />,
    )

    expect(onExpired).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onExpired).toHaveBeenCalledTimes(1)

    // Interval is cleared on expiry -> no further calls.
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(onExpired).toHaveBeenCalledTimes(1)
  })

  it('does not call onExpired while time still remains', () => {
    const onExpired = vi.fn()
    renderTimer(
      <Timer durationMinutes={10} startedAt={startedSecondsAgo(60)} onExpired={onExpired} />,
    )

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(onExpired).not.toHaveBeenCalled()
  })

  it('renders without an onExpired handler and still expires safely', () => {
    const ui = renderTimer(<Timer durationMinutes={1} startedAt={startedSecondsAgo(58)} />)

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(3000)
      })
    }).not.toThrow()

    expect(ui.getByText('00:00')).toBeInTheDocument()
  })

  it('always uses the monospace tabular-nums styling for stable layout', () => {
    const ui = renderTimer(<Timer durationMinutes={10} startedAt={startedSecondsAgo(60)} />)

    const node = ui.getByText('09:00')
    expect(node).toHaveClass('font-mono')
    expect(node).toHaveClass('tabular-nums')
  })
})
