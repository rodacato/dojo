import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PageLoader } from './PageLoader'

describe('PageLoader', () => {
  it('surfaces the loading affordance with the accented underscore', () => {
    render(<PageLoader />)

    const loading = screen.getByText(/loading/)
    expect(loading).toBeInTheDocument()
    expect(loading).toHaveTextContent('loading_')
  })

  it('renders an animated loader element so the wait reads as in-progress', () => {
    const { container } = render(<PageLoader />)

    const pulsing = container.querySelector('.animate-pulse')
    expect(pulsing).not.toBeNull()
    expect(pulsing).toHaveTextContent('loading_')
  })
})
