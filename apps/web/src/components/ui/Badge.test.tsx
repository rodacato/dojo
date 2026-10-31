import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Difficulty, KataType } from '@dojo/shared'

import { DifficultyBadge, TypeBadge, TypeRuleBadge } from './Badge'

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

  it('gives the review variant its distinct type-colour + border styling', () => {
    render(<TypeBadge type="review" />)
    const badge = screen.getByText('REVIEW')
    // review is the only type that draws a border and uses its own type token.
    expect(badge).toHaveClass('bg-type-review/20', 'text-primary', 'border', 'border-type-review/40')
  })

  it('uses the shared small badge geometry classes', () => {
    render(<TypeBadge type="chat" />)
    expect(screen.getByText('CHAT')).toHaveClass('font-mono', 'text-xs', 'px-2', 'py-0.5', 'rounded-sm')
  })
})

describe('TypeRuleBadge', () => {
  it.each<[KataType, string]>([
    ['code', 'border-l-type-code'],
    ['chat', 'border-l-type-chat'],
    ['whiteboard', 'border-l-type-whiteboard'],
    ['review', 'border-l-type-review'],
  ])('carries %s on a rule with primary text and no fill', (type, ruleClass) => {
    render(<TypeRuleBadge type={type} />)
    const badge = screen.getByText(type)
    expect(badge).toHaveClass(ruleClass, 'text-primary')
    expect(badge.className).not.toMatch(/\bbg-/)
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
    ['easy', 'text-success-text'],
    ['medium', 'text-warning-text'],
    ['hard', 'text-danger-text'],
  ])('colours the %s variant with its semantic token class', (difficulty, colorClass) => {
    render(<DifficultyBadge difficulty={difficulty} />)
    const badge = screen.getByText(difficulty.toUpperCase())
    expect(badge).toHaveClass(colorClass, 'border')
  })

  it('does not bleed colour tokens between difficulty variants', () => {
    render(<DifficultyBadge difficulty="easy" />)
    const badge = screen.getByText('EASY')
    expect(badge).toHaveClass('text-success-text', 'border-success')
    expect(badge).not.toHaveClass('text-warning-text')
    expect(badge).not.toHaveClass('text-danger-text')
  })
})
