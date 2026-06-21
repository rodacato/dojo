import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { KataType, Difficulty, Verdict } from '@dojo/shared'

import { DenseSessionRow } from './DenseSessionRow'

const NOW = new Date('2026-06-21T12:00:00.000Z').getTime()

function minutesAgo(min: number): string {
  return new Date(NOW - min * 60_000).toISOString()
}

interface Overrides {
  type?: KataType
  difficulty?: Difficulty
  title?: string
  verdict?: Verdict | null
  status?: string
  startedAt?: string
  completedAt?: string | null
  onClick?: () => void
  highlightUser?: boolean
}

function renderRow(overrides: Overrides = {}) {
  const onClick = overrides.onClick ?? vi.fn()
  render(
    <DenseSessionRow
      type={overrides.type ?? 'code'}
      difficulty={overrides.difficulty ?? 'medium'}
      title={overrides.title ?? 'Two Sum'}
      verdict={overrides.verdict ?? null}
      status={overrides.status ?? 'completed'}
      startedAt={overrides.startedAt ?? minutesAgo(5)}
      completedAt={'completedAt' in overrides ? (overrides.completedAt ?? null) : null}
      onClick={onClick}
      highlightUser={overrides.highlightUser}
    />,
  )
  return { onClick }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DenseSessionRow', () => {
  it('renders the title, type, and difficulty for the session', () => {
    renderRow({ type: 'whiteboard', difficulty: 'hard', title: 'Design a URL shortener' })

    const row = screen.getByRole('button')
    expect(row).toHaveTextContent('Design a URL shortener')
    expect(row).toHaveTextContent('WHITEBOARD')
    expect(row).toHaveTextContent('HARD')
  })

  it('fires onClick when the row is activated', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const { onClick } = renderRow({ title: 'Clickable' })

    await user.click(screen.getByRole('button', { name: /Clickable/ }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  describe('verdict', () => {
    it.each([
      ['passed', 'PASSED', 'text-success'],
      ['passed_with_notes', 'PASSED W/N', 'text-warning'],
      ['needs_work', 'NEEDS WORK', 'text-danger'],
    ] as const)('shows the %s verdict label with its tone', (verdict, label, toneClass) => {
      renderRow({ verdict })

      const badge = screen.getByText(label)
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass(toneClass)
    })

    it('never shows the Expired marker when a verdict is present', () => {
      // status 'failed' would normally mean expired, but a real verdict wins.
      renderRow({ verdict: 'passed', status: 'failed' })

      expect(screen.getByText('PASSED')).toBeInTheDocument()
      expect(screen.queryByText('Expired')).not.toBeInTheDocument()
    })
  })

  describe('expired state', () => {
    it('shows Expired when the session failed with no verdict', () => {
      renderRow({ verdict: null, status: 'failed' })

      expect(screen.getByText('Expired')).toBeInTheDocument()
    })

    it('shows neither a verdict nor Expired for an in-progress session', () => {
      renderRow({ verdict: null, status: 'in_progress' })

      expect(screen.queryByText('Expired')).not.toBeInTheDocument()
      expect(screen.queryByText('PASSED')).not.toBeInTheDocument()
      expect(screen.queryByText('NEEDS WORK')).not.toBeInTheDocument()
    })
  })

  describe('elapsed time', () => {
    it('renders MM:SS between startedAt and completedAt', () => {
      // started 5m ago, completed 90s after start -> 01:30 elapsed.
      const startedAt = minutesAgo(5)
      const completedAt = new Date(new Date(startedAt).getTime() + 90_000).toISOString()
      renderRow({ startedAt, completedAt })

      expect(screen.getByText('01:30')).toBeInTheDocument()
    })

    it('zero-pads minutes and seconds', () => {
      const startedAt = minutesAgo(5)
      const completedAt = new Date(new Date(startedAt).getTime() + 5_000).toISOString()
      renderRow({ startedAt, completedAt })

      expect(screen.getByText('00:05')).toBeInTheDocument()
    })

    it('falls back to --:-- when the session has no completion time', () => {
      renderRow({ completedAt: null })

      expect(screen.getByText('--:--')).toBeInTheDocument()
    })

    it('falls back to --:-- when completion precedes start (non-positive elapsed)', () => {
      const startedAt = minutesAgo(5)
      const completedAt = new Date(new Date(startedAt).getTime() - 1_000).toISOString()
      renderRow({ startedAt, completedAt })

      expect(screen.getByText('--:--')).toBeInTheDocument()
    })
  })

  describe('relative time', () => {
    it('shows "just now" for a session started seconds ago', () => {
      renderRow({ startedAt: new Date(NOW - 10_000).toISOString() })

      expect(screen.getByText('just now')).toBeInTheDocument()
    })

    it('shows minutes ago', () => {
      renderRow({ startedAt: minutesAgo(7) })

      expect(screen.getByText('7m ago')).toBeInTheDocument()
    })

    it('shows "yesterday" exactly one day out', () => {
      renderRow({ startedAt: new Date(NOW - 25 * 60 * 60 * 1000).toISOString() })

      expect(screen.getByText('yesterday')).toBeInTheDocument()
    })
  })

  describe('highlightUser', () => {
    it('applies the accent tint when highlighted', () => {
      renderRow({ highlightUser: true })
      expect(screen.getByRole('button')).toHaveClass('bg-accent/5')
    })

    it('omits the accent tint by default', () => {
      renderRow({ highlightUser: false })
      expect(screen.getByRole('button')).not.toHaveClass('bg-accent/5')
    })
  })
})
