import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmModal } from './ConfirmModal'

function baseProps() {
  return {
    open: true,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    eyebrow: 'Sign out?',
    title: 'Are you sure you want to sign out?',
    primaryLabel: 'Sign out',
  }
}

describe('ConfirmModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<ConfirmModal {...baseProps()} open={false} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('Sign out?')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Are you sure you want to sign out?' }),
    ).not.toBeInTheDocument()
  })

  it('renders eyebrow, title and the two action buttons when open', () => {
    render(<ConfirmModal {...baseProps()} />)

    expect(screen.getByText('Sign out?')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Are you sure you want to sign out?' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('renders children body content when provided', () => {
    render(
      <ConfirmModal {...baseProps()}>
        <p>You will need to log in again.</p>
      </ConfirmModal>,
    )

    expect(screen.getByText('You will need to log in again.')).toBeInTheDocument()
  })

  it('omits the body wrapper element when no children are passed', () => {
    const { rerender } = render(
      <ConfirmModal {...baseProps()}>
        <p>You will need to log in again.</p>
      </ConfirmModal>,
    )

    const body = screen.getByText('You will need to log in again.').parentElement
    expect(body).toHaveClass('text-secondary', 'leading-relaxed')

    rerender(<ConfirmModal {...baseProps()} />)

    expect(screen.queryByText('You will need to log in again.')).not.toBeInTheDocument()
    expect(document.querySelector('.text-secondary.leading-relaxed')).toBeNull()
  })

  it('uses the default Cancel label and respects a custom one', () => {
    const { rerender } = render(<ConfirmModal {...baseProps()} />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()

    rerender(<ConfirmModal {...baseProps()} cancelLabel="Stay" />)
    expect(screen.getByRole('button', { name: 'Stay' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  describe('tone', () => {
    it('defaults the eyebrow to the muted tone class', () => {
      render(<ConfirmModal {...baseProps()} />)
      expect(screen.getByText('Sign out?')).toHaveClass('text-muted')
    })

    it.each([
      ['amber', 'text-warning'],
      ['red', 'text-danger'],
      ['indigo', 'text-accent'],
      ['muted', 'text-muted'],
    ] as const)('applies the %s tone class to the eyebrow', (tone, expectedClass) => {
      render(<ConfirmModal {...baseProps()} tone={tone} />)
      expect(screen.getByText('Sign out?')).toHaveClass(expectedClass)
    })
  })

  describe('plain confirmation (no typedConfirm)', () => {
    it('fires onConfirm when the primary button is clicked', async () => {
      const user = userEvent.setup()
      const props = baseProps()
      render(<ConfirmModal {...props} />)

      await user.click(screen.getByRole('button', { name: 'Sign out' }))

      expect(props.onConfirm).toHaveBeenCalledTimes(1)
    })

    it('fires onCancel when the cancel button is clicked', async () => {
      const user = userEvent.setup()
      const props = baseProps()
      render(<ConfirmModal {...props} />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(props.onCancel).toHaveBeenCalledTimes(1)
      expect(props.onConfirm).not.toHaveBeenCalled()
    })

    it('enables the primary button immediately (no typed gate)', () => {
      render(<ConfirmModal {...baseProps()} />)
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeEnabled()
    })
  })

  describe('primaryVariant', () => {
    it('renders the danger variant as a filled-red button showing the label', () => {
      render(<ConfirmModal {...baseProps()} primaryVariant="danger" primaryLabel="Delete" />)

      const primary = screen.getByRole('button', { name: 'Delete' })
      expect(primary).toHaveClass('bg-danger')
    })

    it('renders the destructive variant without the filled-red class', () => {
      render(
        <ConfirmModal {...baseProps()} primaryVariant="destructive" primaryLabel="Delete" />,
      )

      const primary = screen.getByRole('button', { name: 'Delete' })
      expect(primary).toHaveClass('text-danger')
      expect(primary).not.toHaveClass('bg-danger')
    })

    it('renders the primary variant with the filled-accent class', () => {
      render(<ConfirmModal {...baseProps()} primaryVariant="primary" primaryLabel="Save" />)

      const primary = screen.getByRole('button', { name: 'Save' })
      expect(primary).toHaveClass('bg-accent')
    })
  })

  describe('busy state', () => {
    it('disables both buttons while busy', () => {
      render(<ConfirmModal {...baseProps()} busy />)

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Sign out' })).toBeDisabled()
    })

    it('does not fire onConfirm when the primary is clicked while busy', async () => {
      const user = userEvent.setup()
      const props = baseProps()
      render(<ConfirmModal {...props} busy />)

      await user.click(screen.getByRole('button', { name: 'Sign out' }))

      expect(props.onConfirm).not.toHaveBeenCalled()
    })

    it('does not fire onCancel when the cancel is clicked while busy', async () => {
      const user = userEvent.setup()
      const props = baseProps()
      render(<ConfirmModal {...props} busy />)

      await user.click(screen.getByRole('button', { name: 'Cancel' }))

      expect(props.onCancel).not.toHaveBeenCalled()
    })

    it('appends an ellipsis to the danger label while busy', () => {
      render(
        <ConfirmModal {...baseProps()} primaryVariant="danger" primaryLabel="Delete" busy />,
      )

      expect(screen.getByRole('button', { name: 'Delete…' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Delete…' })).toBeDisabled()
    })

    it('marks the non-danger primary as busy via aria-busy', () => {
      render(<ConfirmModal {...baseProps()} primaryVariant="primary" busy />)

      expect(screen.getByRole('button', { name: 'Sign out' })).toHaveAttribute(
        'aria-busy',
        'true',
      )
    })

    it('does not close on Escape while busy (flow lock)', async () => {
      const user = userEvent.setup()
      const props = baseProps()
      render(<ConfirmModal {...props} busy />)

      await user.keyboard('{Escape}')

      expect(props.onCancel).not.toHaveBeenCalled()
    })
  })

  describe('Escape and overlay dismissal', () => {
    it('closes via onCancel when Escape is pressed and not busy', async () => {
      const user = userEvent.setup()
      const props = baseProps()
      render(<ConfirmModal {...props} />)

      await user.keyboard('{Escape}')

      expect(props.onCancel).toHaveBeenCalledTimes(1)
    })
  })

  describe('typedConfirm', () => {
    function typedProps() {
      return {
        ...baseProps(),
        eyebrow: 'Wipe scroll content',
        title: 'Type the slug to confirm',
        primaryVariant: 'danger' as const,
        primaryLabel: 'Wipe',
        typedConfirm: {
          expected: 'intro-to-async',
          label: 'Type the scroll slug',
          hint: 'This cannot be undone.',
        },
      }
    }

    it('renders the typed-confirm input with its label', () => {
      render(<ConfirmModal {...typedProps()} />)

      expect(screen.getByLabelText('Type the scroll slug')).toBeInTheDocument()
    })

    it('defaults the input placeholder to the expected value', () => {
      render(<ConfirmModal {...typedProps()} />)

      expect(screen.getByLabelText('Type the scroll slug')).toHaveAttribute(
        'placeholder',
        'intro-to-async',
      )
    })

    it('uses a custom placeholder when provided', () => {
      const props = typedProps()
      render(
        <ConfirmModal
          {...props}
          typedConfirm={{ ...props.typedConfirm, placeholder: 'enter slug' }}
        />,
      )

      expect(screen.getByLabelText('Type the scroll slug')).toHaveAttribute(
        'placeholder',
        'enter slug',
      )
    })

    it('renders the optional hint microcopy', () => {
      render(<ConfirmModal {...typedProps()} />)
      expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
    })

    it('omits the hint when none is provided', () => {
      const props = typedProps()
      render(
        <ConfirmModal
          {...props}
          typedConfirm={{ expected: props.typedConfirm.expected, label: props.typedConfirm.label }}
        />,
      )

      expect(screen.queryByText('This cannot be undone.')).not.toBeInTheDocument()
    })

    it('disables the primary until the typed value matches expected', async () => {
      const user = userEvent.setup()
      const props = typedProps()
      render(<ConfirmModal {...props} />)

      const primary = screen.getByRole('button', { name: 'Wipe' })
      expect(primary).toBeDisabled()

      await user.type(screen.getByLabelText('Type the scroll slug'), 'wrong')
      expect(primary).toBeDisabled()
    })

    it('enables the primary once the exact value is typed and reflects the input value', async () => {
      const user = userEvent.setup()
      const props = typedProps()
      render(<ConfirmModal {...props} />)

      const input = screen.getByLabelText('Type the scroll slug') as HTMLInputElement
      await user.type(input, 'intro-to-async')

      expect(input.value).toBe('intro-to-async')
      expect(screen.getByRole('button', { name: 'Wipe' })).toBeEnabled()
    })

    it('does not fire onConfirm while the typed value is not matched', async () => {
      const user = userEvent.setup()
      const props = typedProps()
      render(<ConfirmModal {...props} />)

      await user.type(screen.getByLabelText('Type the scroll slug'), 'intro')
      await user.click(screen.getByRole('button', { name: 'Wipe' }))

      expect(props.onConfirm).not.toHaveBeenCalled()
    })

    it('fires onConfirm after the value matches and the primary is clicked', async () => {
      const user = userEvent.setup()
      const props = typedProps()
      render(<ConfirmModal {...props} />)

      await user.type(screen.getByLabelText('Type the scroll slug'), 'intro-to-async')
      await user.click(screen.getByRole('button', { name: 'Wipe' }))

      expect(props.onConfirm).toHaveBeenCalledTimes(1)
    })

    it('disables the typed input while busy', () => {
      render(<ConfirmModal {...typedProps()} busy />)

      expect(screen.getByLabelText('Type the scroll slug')).toBeDisabled()
    })
  })
})
