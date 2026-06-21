import { describe, expect, it, vi } from 'vitest'
import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button, buttonClasses } from './Button'

describe('Button', () => {
  it('renders an accessible button with its children as the label', () => {
    render(<Button>Save kata</Button>)
    expect(screen.getByRole('button', { name: 'Save kata' })).toBeInTheDocument()
  })

  it('defaults to type="button" so it never submits a surrounding form by accident', () => {
    render(<Button>Click</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('honors an explicit type override (e.g. submit)', () => {
    render(<Button type="submit">Go</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  it('fires onClick when the user clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Run</Button>)

    await user.click(screen.getByRole('button', { name: 'Run' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  describe('variants', () => {
    it('defaults to the primary (filled accent) variant', () => {
      render(<Button>CTA</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-accent', 'text-primary')
    })

    it('renders the ghost variant with a border and transparent background', () => {
      render(<Button variant="ghost">Secondary</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveClass('bg-transparent', 'border-border')
      expect(btn).not.toHaveClass('bg-accent')
    })

    it('renders the subtle variant as text-only secondary', () => {
      render(<Button variant="subtle">Nav</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveClass('bg-transparent', 'text-secondary', 'border-transparent')
    })

    it('renders the destructive variant with danger text, never filled red', () => {
      render(<Button variant="destructive">Delete</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveClass('text-danger', 'bg-transparent')
      expect(btn).not.toHaveClass('bg-danger')
    })
  })

  describe('sizes', () => {
    it('defaults to md height (h-9)', () => {
      render(<Button>Md</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-9')
    })

    it('renders sm height (h-7)', () => {
      render(<Button size="sm">Sm</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveClass('h-7')
      expect(btn).not.toHaveClass('h-9')
    })

    it('renders lg height (h-11)', () => {
      render(<Button size="lg">Lg</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveClass('h-11')
      expect(btn).not.toHaveClass('h-9')
    })
  })

  describe('disabled', () => {
    it('marks the button disabled and blocks the click handler', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(
        <Button disabled onClick={onClick}>
          Locked
        </Button>,
      )

      const btn = screen.getByRole('button', { name: 'Locked' })
      expect(btn).toBeDisabled()

      await user.click(btn)
      expect(onClick).not.toHaveBeenCalled()
    })

    it('does not set aria-busy when merely disabled (not loading)', () => {
      render(<Button disabled>Locked</Button>)
      expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy')
    })
  })

  describe('loading', () => {
    it('disables the button and exposes aria-busy while loading', () => {
      render(<Button loading>Submitting</Button>)
      const btn = screen.getByRole('button', { name: 'Submitting' })
      expect(btn).toBeDisabled()
      expect(btn).toHaveAttribute('aria-busy', 'true')
    })

    it('blocks the click handler while loading', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(
        <Button loading onClick={onClick}>
          Submitting
        </Button>,
      )

      await user.click(screen.getByRole('button'))
      expect(onClick).not.toHaveBeenCalled()
    })

    it('renders the blinking cursor affordance only while loading', () => {
      const { rerender } = render(<Button>Idle</Button>)
      expect(document.querySelector('.animate-cursor')).toBeNull()

      rerender(<Button loading>Idle</Button>)
      const cursor = document.querySelector('.animate-cursor')
      expect(cursor).not.toBeNull()
      expect(cursor).toHaveAttribute('aria-hidden')
      expect(cursor).toHaveTextContent('_')
    })

    it('keeps the label visible (dimmed) while loading so the button does not jump', () => {
      render(<Button loading>Submitting</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveTextContent('Submitting')
      const label = screen.getByText('Submitting')
      expect(label).toHaveClass('opacity-60')
    })
  })

  describe('passthrough props', () => {
    it('merges a caller className alongside the variant classes', () => {
      render(<Button className="w-full">Wide</Button>)
      const btn = screen.getByRole('button')
      expect(btn).toHaveClass('w-full')
      expect(btn).toHaveClass('bg-accent')
    })

    it('forwards arbitrary DOM attributes like aria-label', () => {
      render(<Button aria-label="Close dialog">x</Button>)
      expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
    })

    it('forwards the ref to the underlying button element', () => {
      const ref = createRef<HTMLButtonElement>()
      render(<Button ref={ref}>Ref</Button>)
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current).toHaveTextContent('Ref')
    })
  })

  describe('keyboard', () => {
    it('activates onClick when focused and Enter/Space is pressed', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(<Button onClick={onClick}>Press</Button>)

      await user.tab()
      expect(screen.getByRole('button')).toHaveFocus()

      await user.keyboard('{Enter}')
      await user.keyboard(' ')
      expect(onClick).toHaveBeenCalledTimes(2)
    })

    it('is not focusable via Tab when disabled', async () => {
      const user = userEvent.setup()
      render(<Button disabled>Locked</Button>)

      await user.tab()
      expect(screen.getByRole('button')).not.toHaveFocus()
    })
  })
})

describe('buttonClasses', () => {
  it('produces primary/md classes by default', () => {
    const cls = buttonClasses()
    expect(cls).toContain('bg-accent')
    expect(cls).toContain('h-9')
  })

  it('reflects the requested variant and size', () => {
    const cls = buttonClasses({ variant: 'destructive', size: 'lg' })
    expect(cls).toContain('text-danger')
    expect(cls).toContain('h-11')
    expect(cls).not.toContain('bg-accent')
  })

  it('always includes the shared base classes (used by Link composition)', () => {
    const cls = buttonClasses({ variant: 'ghost' })
    expect(cls).toContain('font-mono')
    expect(cls).toContain('uppercase')
  })
})
