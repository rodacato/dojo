import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { GitHubIcon } from './GitHubIcon'

describe('GitHubIcon', () => {
  it('renders an svg with a path drawn in the current color', () => {
    const { container } = render(<GitHubIcon />)

    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    expect(svg).toHaveAttribute('fill', 'currentColor')

    const path = svg?.querySelector('path')
    expect(path).not.toBeNull()
    expect(path?.getAttribute('d')).toBeTruthy()
  })

  it('forwards className to the svg root', () => {
    const { container } = render(<GitHubIcon className="size-6 text-ink" />)

    expect(container.querySelector('svg')).toHaveClass('size-6', 'text-ink')
  })
})
