import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AchievementBadge } from './AchievementBadge'

const earnedDate = '2026-06-21T12:00:00.000Z'
const localized = new Date(earnedDate).toLocaleDateString()

describe('AchievementBadge', () => {
  it('shows the name and description', () => {
    render(<AchievementBadge name="First Kata" description="Solve your first kata" earned />)

    expect(screen.getByText('First Kata')).toBeInTheDocument()
    expect(screen.getByText('Solve your first kata')).toBeInTheDocument()
  })

  describe('earned state', () => {
    it('renders the earnedAt date (localized) once earned', () => {
      render(
        <AchievementBadge name="Streak" description="Seven days" earned earnedAt={earnedDate} />,
      )

      expect(screen.getByText(localized)).toBeInTheDocument()
    })

    it('uses the foreground (non-dimmed) text tones when earned', () => {
      render(<AchievementBadge name="Streak" description="Seven days" earned />)

      expect(screen.getByText('Streak')).toHaveClass('text-primary')
      expect(screen.getByText('Seven days')).toHaveClass('text-secondary')
    })

    it('does not dim the card when earned', () => {
      const { container } = render(
        <AchievementBadge name="Streak" description="Seven days" earned />,
      )

      expect(container.firstChild).not.toHaveClass('opacity-40')
    })
  })

  describe('locked state', () => {
    it('dims the card and uses muted text when not earned', () => {
      const { container } = render(
        <AchievementBadge name="Locked" description="Not yet" earned={false} />,
      )

      expect(container.firstChild).toHaveClass('opacity-40')
      expect(screen.getByText('Locked')).toHaveClass('text-muted')
    })

    it('hides the earnedAt date when not earned, even if a date is supplied', () => {
      render(
        <AchievementBadge
          name="Locked"
          description="Not yet"
          earned={false}
          earnedAt={earnedDate}
        />,
      )

      expect(screen.queryByText(localized)).not.toBeInTheDocument()
    })
  })

  it('omits the date when earned but no earnedAt is provided', () => {
    render(<AchievementBadge name="Dateless" description="No timestamp" earned />)

    expect(screen.queryByText(localized)).not.toBeInTheDocument()
  })

  it('treats a null earnedAt as no date even when earned', () => {
    render(
      <AchievementBadge name="Nullish" description="Null timestamp" earned earnedAt={null} />,
    )

    expect(screen.queryByText(localized)).not.toBeInTheDocument()
  })

  describe('prestige variant', () => {
    it('renders the larger prestige layout (text-lg name) and keeps content', () => {
      render(
        <AchievementBadge name="Sensei" description="Mastered a belt" earned prestige />,
      )

      const name = screen.getByText('Sensei')
      expect(name).toHaveClass('text-lg')
      expect(name).toHaveClass('text-primary')
      expect(screen.getByText('Mastered a belt')).toBeInTheDocument()
    })

    it('uses the standard (text-sm name) layout when not prestige', () => {
      render(<AchievementBadge name="Regular" description="A normal badge" earned />)

      const name = screen.getByText('Regular')
      expect(name).toHaveClass('text-sm')
      expect(name).not.toHaveClass('text-lg')
    })

    it('still shows the earnedAt date in the prestige layout', () => {
      render(
        <AchievementBadge
          name="Sensei"
          description="Mastered a belt"
          earned
          prestige
          earnedAt={earnedDate}
        />,
      )

      expect(screen.getByText(localized)).toBeInTheDocument()
    })

    it('dims an unearned prestige badge and hides its date', () => {
      const { container } = render(
        <AchievementBadge
          name="Sensei"
          description="Mastered a belt"
          earned={false}
          prestige
          earnedAt={earnedDate}
        />,
      )

      expect(container.firstChild).toHaveClass('opacity-40')
      expect(screen.queryByText(localized)).not.toBeInTheDocument()
    })
  })
})
