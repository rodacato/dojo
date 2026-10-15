import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('renders the numeric value and its label', () => {
    render(<StatCard value={42} label="Katas solved" />)

    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Katas solved')).toBeInTheDocument()
  })

  it('renders a string value verbatim (e.g. a formatted percentage)', () => {
    render(<StatCard value="98%" label="Pass rate" />)

    expect(screen.getByText('98%')).toBeInTheDocument()
  })

  it('keeps value and label as distinct nodes so they style independently', () => {
    render(<StatCard value="3" label="Streak" />)

    const value = screen.getByText('3')
    const label = screen.getByText('Streak')
    expect(value).not.toBe(label)
    expect(value).toHaveClass('font-mono', 'text-2xl')
    expect(label).toHaveClass('text-secondary', 'text-xs')
  })

  it('defaults the value color to text-primary when no color is given', () => {
    render(<StatCard value="1" label="Default" />)

    expect(screen.getByText('1')).toHaveClass('text-primary')
  })

  it('applies a caller-provided color to the value instead of the default', () => {
    render(<StatCard value="1" label="Tinted" color="text-warning-text" />)

    const value = screen.getByText('1')
    expect(value).toHaveClass('text-warning-text')
    expect(value).not.toHaveClass('text-primary')
  })

  it('uses the neutral border by default', () => {
    const { container } = render(<StatCard value="1" label="Plain" />)

    const card = container.firstElementChild
    expect(card).toHaveClass('border-border')
  })

})
