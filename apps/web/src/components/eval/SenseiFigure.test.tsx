import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SenseiFigure } from './SenseiFigure'

describe('SenseiFigure', () => {
  it('stays out of the accessibility tree', () => {
    render(<SenseiFigure pose="review" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('sensei-review')).toHaveAttribute('src', '/art/sensei/review.webp')
  })

  it('disappears when the image cannot load', () => {
    render(<SenseiFigure pose="explain" />)

    fireEvent.error(screen.getByTestId('sensei-explain'))

    expect(screen.queryByTestId('sensei-explain')).not.toBeInTheDocument()
  })
})
