import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { BeltRingAvatar } from './BeltRingAvatar'

const SRC = 'https://example.test/avatar.png'

// An <img alt=""> is treated as decorative -> role "presentation"; a non-empty
// alt makes it role "img". Both keep aria-label="<rank> belt" as the
// accessible name, so we query by that name regardless of the resolved role.
const byBelt = (rank: string) => screen.getByLabelText(`${rank} belt`)

describe('BeltRingAvatar', () => {
  it('renders an image element with the provided src', () => {
    render(<BeltRingAvatar src={SRC} rank="green" />)

    const img = byBelt('green')
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', SRC)
  })

  it('exposes the rank as the accessible name via aria-label', () => {
    render(<BeltRingAvatar src={SRC} rank="brown" />)

    expect(byBelt('brown')).toBeInTheDocument()
  })

  it('forwards a non-empty alt to the image element', () => {
    render(<BeltRingAvatar src={SRC} rank="yellow" alt="Adrian's avatar" />)

    expect(byBelt('yellow')).toHaveAttribute('alt', "Adrian's avatar")
  })

  it('defaults alt to an empty string so undecorated avatars stay decorative', () => {
    render(<BeltRingAvatar src={SRC} rank="white" />)

    expect(byBelt('white')).toHaveAttribute('alt', '')
  })

  describe('geometry by rank', () => {
    it('renders circular geometry for non-black ranks (border-radius 50%)', () => {
      render(<BeltRingAvatar src={SRC} rank="brown" />)

      expect(byBelt('brown')).toHaveStyle({ borderRadius: '50%' })
    })

    it('renders the hanko-square geometry for the black belt (border-radius 2px)', () => {
      render(<BeltRingAvatar src={SRC} rank="black" />)

      const img = byBelt('black')
      expect(img).toHaveStyle({ borderRadius: '2px' })
      expect(img).not.toHaveStyle({ borderRadius: '50%' })
    })
  })

  describe('belt-colored ring', () => {
    it('colors the ring through the belt token for the given rank', () => {
      render(<BeltRingAvatar src={SRC} rank="green" />)

      expect(byBelt('green')).toHaveStyle({
        boxShadow: '0 0 0 2px var(--color-belt-green)',
      })
    })

    it('resolves a different belt token per rank rather than a fixed color', () => {
      render(<BeltRingAvatar src={SRC} rank="black" />)

      expect(byBelt('black')).toHaveStyle({
        boxShadow: '0 0 0 2px var(--color-belt-black)',
      })
    })
  })

  describe('size', () => {
    it('defaults to a 48px square', () => {
      render(<BeltRingAvatar src={SRC} rank="white" />)

      expect(byBelt('white')).toHaveStyle({ width: '48px', height: '48px' })
    })

    it('applies a custom size to both width and height', () => {
      render(<BeltRingAvatar src={SRC} rank="white" size={96} />)

      expect(byBelt('white')).toHaveStyle({ width: '96px', height: '96px' })
    })
  })

  it('merges a caller className alongside the base classes', () => {
    render(<BeltRingAvatar src={SRC} rank="white" className="ring-offset" />)

    const img = byBelt('white')
    expect(img).toHaveClass('ring-offset')
    expect(img).toHaveClass('bg-elevated', 'shrink-0')
  })
})
