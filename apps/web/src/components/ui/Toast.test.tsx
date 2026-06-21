import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { badgeUnlockToast, toast, ToastContainer } from './Toast'

// The toast API is module-level pub/sub: `toast.*()` pushes an entry to the
// `pushFn` registered by a mounted <ToastContainer/>. So every test mounts the
// container, then drives it through the real public API and asserts the DOM the
// user sees. Pushes happen outside a React event, so they're wrapped in act().
function emit(fn: () => void) {
  act(() => {
    fn()
  })
}

describe('ToastContainer', () => {
  it('renders nothing until a toast is pushed', () => {
    const { container } = render(<ToastContainer />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument()
  })

  it('shows the eyebrow and body of a pushed toast inside the notifications region', () => {
    render(<ToastContainer />)
    emit(() => toast.success('SAVED', 'Your draft was stored'))

    const region = screen.getByRole('region', { name: 'Notifications' })
    expect(region).toBeInTheDocument()

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('SAVED')
    expect(status).toHaveTextContent('Your draft was stored')
  })

  it('omits the body line when no body is provided', () => {
    render(<ToastContainer />)
    emit(() => toast.info('PINGED'))

    expect(screen.getByText('PINGED')).toBeInTheDocument()
    // Body wrapper carries text-secondary; eyebrow carries text-accent.
    expect(document.querySelector('.text-secondary.leading-relaxed')).toBeNull()
  })

  it('stacks multiple toasts as separate status entries', () => {
    render(<ToastContainer />)
    emit(() => toast.info('FIRST'))
    emit(() => toast.warning('SECOND'))

    const statuses = screen.getAllByRole('status')
    expect(statuses).toHaveLength(2)
    expect(statuses[0]).toHaveTextContent('FIRST')
    expect(statuses[1]).toHaveTextContent('SECOND')
  })
})

describe('ToastContainer — kind variants', () => {
  it('success applies success border + text tone classes', () => {
    render(<ToastContainer />)
    emit(() => toast.success('OK'))

    expect(screen.getByRole('status')).toHaveClass('border-l-success')
    expect(screen.getByText('OK')).toHaveClass('text-success')
  })

  it('info applies accent tone classes', () => {
    render(<ToastContainer />)
    emit(() => toast.info('FYI'))

    expect(screen.getByRole('status')).toHaveClass('border-l-accent')
    expect(screen.getByText('FYI')).toHaveClass('text-accent')
  })

  it('warning applies warning tone classes', () => {
    render(<ToastContainer />)
    emit(() => toast.warning('CAREFUL'))

    expect(screen.getByRole('status')).toHaveClass('border-l-warning')
    expect(screen.getByText('CAREFUL')).toHaveClass('text-warning')
  })

  it('error applies danger tone classes', () => {
    render(<ToastContainer />)
    emit(() => toast.error('BOOM'))

    expect(screen.getByRole('status')).toHaveClass('border-l-danger')
    expect(screen.getByText('BOOM')).toHaveClass('text-danger')
  })

  it('defaults to the info tone when toast() is called without a kind', () => {
    render(<ToastContainer />)
    emit(() => toast({ eyebrow: 'PLAIN' }))

    expect(screen.getByRole('status')).toHaveClass('border-l-accent')
    expect(screen.getByText('PLAIN')).toHaveClass('text-accent')
  })
})

describe('ToastContainer — action button', () => {
  it('renders the action label and calls onClick when clicked', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<ToastContainer />)
    emit(() => toast.success('COPIED', 'ID copied', { action: { label: 'Copy ID', onClick } }))

    const actionBtn = screen.getByRole('button', { name: 'Copy ID' })
    expect(actionBtn).toBeInTheDocument()

    await user.click(actionBtn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not render an action button when no action is given', () => {
    render(<ToastContainer />)
    emit(() => toast.success('SAVED'))

    // Only the dismiss button should exist, no extra action button.
    expect(screen.queryByRole('button', { name: 'Copy ID' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})

describe('ToastContainer — dismiss', () => {
  it('removes the toast from the DOM when the dismiss button is clicked', async () => {
    const user = userEvent.setup()
    render(<ToastContainer />)
    emit(() => toast.error('FATAL'))

    expect(screen.getByText('FATAL')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }))

    expect(screen.queryByText('FATAL')).not.toBeInTheDocument()
    // Region collapses to nothing once the last toast is gone.
    expect(screen.queryByRole('region', { name: 'Notifications' })).not.toBeInTheDocument()
  })

  it('only removes the dismissed toast, leaving the others', async () => {
    const user = userEvent.setup()
    render(<ToastContainer />)
    emit(() => toast.error('KEEP-ONE'))
    emit(() => toast.error('REMOVE-ME'))

    const dismissButtons = screen.getAllByRole('button', { name: 'Dismiss notification' })
    expect(dismissButtons).toHaveLength(2)

    await user.click(dismissButtons[1]!)

    expect(screen.queryByText('REMOVE-ME')).not.toBeInTheDocument()
    expect(screen.getByText('KEEP-ONE')).toBeInTheDocument()
  })
})

describe('ToastContainer — auto-dismiss durations', () => {
  it('auto-dismisses a success toast after its default 3s', () => {
    vi.useFakeTimers()
    try {
      render(<ToastContainer />)
      emit(() => toast.success('TEMP'))
      expect(screen.getByText('TEMP')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(2999)
      })
      expect(screen.getByText('TEMP')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.queryByText('TEMP')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps a warning toast past 3s and dismisses at its 6s default', () => {
    vi.useFakeTimers()
    try {
      render(<ToastContainer />)
      emit(() => toast.warning('SLOW'))

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.getByText('SLOW')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(3000)
      })
      expect(screen.queryByText('SLOW')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('never auto-dismisses an error toast (manual dismiss only)', () => {
    vi.useFakeTimers()
    try {
      render(<ToastContainer />)
      emit(() => toast.error('STICKY'))

      act(() => {
        vi.advanceTimersByTime(60_000)
      })
      expect(screen.getByText('STICKY')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('honors a durationMs override over the kind default', () => {
    vi.useFakeTimers()
    try {
      render(<ToastContainer />)
      emit(() => toast.error('CUSTOM', undefined, { durationMs: 1000 }))

      act(() => {
        vi.advanceTimersByTime(999)
      })
      expect(screen.getByText('CUSTOM')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.queryByText('CUSTOM')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('badgeUnlockToast', () => {
  it('renders the "Badge earned" eyebrow with the badge name and description', () => {
    render(<ToastContainer />)
    emit(() => badgeUnlockToast({ badgeName: 'POLYGLOT', description: 'Solved katas in 5 languages' }))

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Badge earned')
    expect(status).toHaveTextContent('POLYGLOT')
    expect(status).toHaveTextContent('Solved katas in 5 languages')
    // Badge unlock uses the info tone.
    expect(status).toHaveClass('border-l-accent')
  })

  it('renders a "View all badges" action that calls onView', async () => {
    const onView = vi.fn()
    const user = userEvent.setup()
    render(<ToastContainer />)
    emit(() =>
      badgeUnlockToast({ badgeName: 'STREAK', description: '7 days running', onView }),
    )

    const viewBtn = screen.getByRole('button', { name: /View all badges/ })
    await user.click(viewBtn)
    expect(onView).toHaveBeenCalledTimes(1)
  })

  it('omits the action button when no onView callback is supplied', () => {
    render(<ToastContainer />)
    emit(() => badgeUnlockToast({ badgeName: 'LONER', description: 'No callback here' }))

    expect(screen.queryByRole('button', { name: /View all badges/ })).not.toBeInTheDocument()
    // Just the dismiss button remains.
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
