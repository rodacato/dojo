import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Disclosure } from './Disclosure'

describe('Disclosure', () => {
  it('starts closed and opens from its summary', async () => {
    render(<Disclosure summary="Original kata"><p>The prompt</p></Disclosure>)
    const details = screen.getByText('Original kata').closest('details')!

    expect(details).not.toHaveAttribute('open')
    await userEvent.click(screen.getByText('Original kata'))
    expect(details).toHaveAttribute('open')
  })

  it('can start open', () => {
    render(<Disclosure summary="Answer" defaultOpen><p>Body</p></Disclosure>)
    expect(screen.getByText('Answer').closest('details')).toHaveAttribute('open')
  })
})
