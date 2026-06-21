import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { EnsoLoader } from './EnsoLoader'

// GSAP note: useGSAP reads window.matchMedia via gsap.matchMedia(). The test
// setup stubs matchMedia to { matches: false } for every query, so neither the
// no-preference nor the reduce branch fires — getTotalLength() is never called
// (jsdom lacks it) and the SVG stays in its static authored state. These tests
// assert the structural/accessibility output, which is what a user perceives
// regardless of which animation branch runs.

describe('EnsoLoader', () => {
  it('exposes a status role so assistive tech announces the loading state', () => {
    render(<EnsoLoader />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('defaults the accessible name and visually-hidden text to "Loading"', () => {
    render(<EnsoLoader />)
    const status = screen.getByRole('status', { name: 'Loading' })
    expect(status).toHaveAttribute('aria-label', 'Loading')
    expect(screen.getByText('Loading')).toHaveClass('sr-only')
  })

  it('uses a caller-provided label for both aria-label and the sr-only text', () => {
    render(<EnsoLoader label="Compiling kata" />)
    expect(screen.getByRole('status', { name: 'Compiling kata' })).toBeInTheDocument()
    expect(screen.getByText('Compiling kata')).toHaveClass('sr-only')
    expect(screen.queryByText('Loading')).not.toBeInTheDocument()
  })

  it('defaults the SVG to a 40px square when no size is given', () => {
    const { container } = render(<EnsoLoader />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '40')
    expect(svg).toHaveAttribute('height', '40')
  })

  it('renders the SVG at the requested size for width and height', () => {
    const { container } = render(<EnsoLoader size={96} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '96')
    expect(svg).toHaveAttribute('height', '96')
  })

  it('hides the decorative SVG from assistive tech (text carries the meaning)', () => {
    const { container } = render(<EnsoLoader />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden')
  })

  it('draws the open enso arc as a single stroked path with no fill', () => {
    const { container } = render(<EnsoLoader />)
    const paths = container.querySelectorAll('path')
    expect(paths).toHaveLength(1)
    const path = paths[0]
    expect(path).toHaveAttribute('fill', 'none')
    expect(path).toHaveAttribute('stroke', 'currentColor')
  })

  it('merges a caller className alongside the base layout classes', () => {
    render(<EnsoLoader className="mx-auto" />)
    const status = screen.getByRole('status')
    expect(status).toHaveClass('mx-auto')
    expect(status).toHaveClass('inline-block', 'text-accent')
  })
})
