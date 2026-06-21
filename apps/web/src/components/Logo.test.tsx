import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LogoMark, LogoWordmark } from './Logo'

describe('LogoMark', () => {
  it('renders an svg with the torii stroke path', () => {
    const { container } = render(<LogoMark />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    const path = container.querySelector('path')
    expect(path).toHaveAttribute('stroke', 'currentColor')
    expect(path?.getAttribute('d')).toContain('M5 10 H35')
  })

  it('applies the size prop to width and height', () => {
    const { container } = render(<LogoMark size={64} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '64')
    expect(svg).toHaveAttribute('height', '64')
  })

  it('forwards a custom className', () => {
    const { container } = render(<LogoMark className="custom-mark" />)
    expect(container.querySelector('svg')).toHaveClass('custom-mark')
  })
})

describe('LogoWordmark', () => {
  it('renders the dojo wordmark text', () => {
    render(<LogoWordmark />)
    expect(screen.getByText('dojo')).toBeInTheDocument()
    expect(screen.getByText('_')).toBeInTheDocument()
  })

  it('includes the mark svg by default', () => {
    const { container } = render(<LogoWordmark />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('omits the mark svg when showMark is false', () => {
    const { container } = render(<LogoWordmark showMark={false} />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
    expect(screen.getByText('dojo')).toBeInTheDocument()
  })
})
