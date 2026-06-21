import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { AccentCard } from './AccentCard'

describe('AccentCard', () => {
  it('renders its children', () => {
    render(
      <AccentCard>
        <p>Lesson outcome</p>
      </AccentCard>,
    )
    expect(screen.getByText('Lesson outcome')).toBeInTheDocument()
  })

  it('renders rich children, not just text', () => {
    render(
      <AccentCard>
        <button type="button">Continue</button>
      </AccentCard>,
    )
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
  })

  it('applies the accent-rail + surface styling that defines the card', () => {
    render(<AccentCard>body</AccentCard>)
    const card = screen.getByText('body')
    expect(card).toHaveClass('border-l-[3px]', 'border-accent', 'bg-surface')
  })

  it('merges a caller className alongside the built-in styling', () => {
    render(<AccentCard className="mt-4">body</AccentCard>)
    const card = screen.getByText('body')
    expect(card).toHaveClass('mt-4')
    expect(card).toHaveClass('border-accent', 'bg-surface')
  })

  it('renders multiple children together inside the single card surface', () => {
    render(
      <AccentCard>
        <h2>Title</h2>
        <p>Detail</p>
      </AccentCard>,
    )
    const heading = screen.getByRole('heading', { name: 'Title' })
    const detail = screen.getByText('Detail')
    expect(heading).toBeInTheDocument()
    expect(detail).toBeInTheDocument()
    expect(heading.parentElement).toBe(detail.parentElement)
    expect(heading.parentElement).toHaveClass('bg-surface')
  })
})
