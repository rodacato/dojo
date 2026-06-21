import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Difficulty, KataType, Verdict } from '@dojo/shared'

import { DifficultyBadge, TypeBadge, VerdictBadge } from './Badge'

describe('TypeBadge', () => {
  it('uppercases the kata type as the visible label', () => {
    render(<TypeBadge type="code" />)
    expect(screen.getByText('CODE')).toBeInTheDocument()
    // Source value is lowercase; uppercasing is component logic, not the prop.
    expect(screen.queryByText('code')).not.toBeInTheDocument()
  })

  it.each<[KataType, string]>([
    ['code', 'CODE'],
    ['chat', 'CHAT'],
    ['whiteboard', 'WHITEBOARD'],
    ['review', 'REVIEW'],
  ])('renders %s as label %s', (type, label) => {
    render(<TypeBadge type={type} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it.each<[KataType, string]>([
    ['code', 'bg-type-code'],
    ['chat', 'bg-type-chat'],
    ['whiteboard', 'bg-type-whiteboard'],
  ])('applies the token background class for the %s variant', (type, bgClass) => {
    render(<TypeBadge type={type} />)
    expect(screen.getByText(type.toUpperCase())).toHaveClass(bgClass, 'text-primary')
  })

  it('gives the review variant its distinct accent + border styling', () => {
    render(<TypeBadge type="review" />)
    const badge = screen.getByText('REVIEW')
    // review is the only type that draws a border and uses the accent token.
    expect(badge).toHaveClass('bg-accent/20', 'text-accent', 'border', 'border-accent/30')
    expect(badge).not.toHaveClass('text-primary')
  })

  it('uses the shared small badge geometry classes', () => {
    render(<TypeBadge type="chat" />)
    expect(screen.getByText('CHAT')).toHaveClass('font-mono', 'text-xs', 'px-2', 'py-0.5', 'rounded-sm')
  })
})

describe('DifficultyBadge', () => {
  it.each<[Difficulty, string]>([
    ['easy', 'EASY'],
    ['medium', 'MEDIUM'],
    ['hard', 'HARD'],
  ])('renders %s as uppercase label %s', (difficulty, label) => {
    render(<DifficultyBadge difficulty={difficulty} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it.each<[Difficulty, string]>([
    ['easy', 'text-success'],
    ['medium', 'text-warning'],
    ['hard', 'text-danger'],
  ])('colours the %s variant with its semantic token class', (difficulty, colorClass) => {
    render(<DifficultyBadge difficulty={difficulty} />)
    const badge = screen.getByText(difficulty.toUpperCase())
    expect(badge).toHaveClass(colorClass, 'border')
  })

  it('does not bleed colour tokens between difficulty variants', () => {
    render(<DifficultyBadge difficulty="easy" />)
    const badge = screen.getByText('EASY')
    expect(badge).toHaveClass('text-success', 'border-success')
    expect(badge).not.toHaveClass('text-warning')
    expect(badge).not.toHaveClass('text-danger')
  })
})

describe('VerdictBadge', () => {
  it.each<[Verdict, string]>([
    ['passed', 'PASSED'],
    ['passed_with_notes', 'PASSED WITH NOTES'],
    ['needs_work', 'NEEDS WORK'],
  ])('maps verdict %s to its human label "%s"', (verdict, label) => {
    render(<VerdictBadge verdict={verdict} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('renders the friendly label, not the raw enum value', () => {
    render(<VerdictBadge verdict="passed_with_notes" />)
    expect(screen.getByText('PASSED WITH NOTES')).toBeInTheDocument()
    // The snake_case enum must never surface to the user.
    expect(screen.queryByText('passed_with_notes')).not.toBeInTheDocument()
    expect(screen.queryByText('PASSED_WITH_NOTES')).not.toBeInTheDocument()
  })

  it.each<[Verdict, string]>([
    ['passed', 'text-success'],
    ['passed_with_notes', 'text-warning'],
    ['needs_work', 'text-danger'],
  ])('styles verdict %s with its semantic colour token', (verdict, colorClass) => {
    const labels: Record<Verdict, string> = {
      passed: 'PASSED',
      passed_with_notes: 'PASSED WITH NOTES',
      needs_work: 'NEEDS WORK',
    }
    render(<VerdictBadge verdict={verdict} />)
    expect(screen.getByText(labels[verdict])).toHaveClass(colorClass)
  })

  it('uses the larger verdict geometry distinct from the small badges', () => {
    render(<VerdictBadge verdict="passed" />)
    const badge = screen.getByText('PASSED')
    // Verdict badge is text-sm / px-3 / py-1, unlike the text-xs type badge.
    expect(badge).toHaveClass('text-sm', 'px-3', 'py-1', 'rounded-sm')
    expect(badge).not.toHaveClass('text-xs')
  })
})
