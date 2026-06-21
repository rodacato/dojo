import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'

import {
  Skeleton,
  SkeletonCard,
  SkeletonDashboard,
  SkeletonHero,
  SkeletonList,
  SkeletonListRow,
  SkeletonText,
} from './SkeletonLoader'

// Skeletons are decorative placeholders: every primitive must be aria-hidden so
// screen readers skip the loading scaffold. We assert that contract plus the
// structural wiring (shimmer on/off, size/width mapping, row counts) that a
// realistic regression would break.

function bone(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[aria-hidden]')
  if (!el) throw new Error('expected a Skeleton element')
  return el
}

describe('Skeleton', () => {
  it('renders a decorative (aria-hidden) placeholder so AT skips it', () => {
    const { container } = render(<Skeleton />)
    expect(bone(container)).toHaveAttribute('aria-hidden')
  })

  it('applies the shimmer animation by default', () => {
    const { container } = render(<Skeleton />)
    const el = bone(container)
    expect(el.style.animation).toBe('var(--animate-skeleton)')
    expect(el.style.backgroundSize).toBe('200% 100%')
  })

  it('drops the shimmer when flat (parent already shimmers)', () => {
    const { container } = render(<Skeleton flat />)
    const el = bone(container)
    expect(el.style.animation).toBe('')
    expect(el.style.background).toBe('')
  })

  it('merges the caller className onto the base bone classes', () => {
    const { container } = render(<Skeleton className="h-4 w-12" />)
    const el = bone(container)
    expect(el).toHaveClass('bg-elevated', 'rounded-sm', 'h-4', 'w-12')
  })
})

describe('SkeletonText', () => {
  it('defaults to full width and md height', () => {
    const { container } = render(<SkeletonText />)
    expect(bone(container)).toHaveClass('w-full', 'h-3')
  })

  it('maps the size prop to its height class', () => {
    const { container } = render(<SkeletonText size="lg" />)
    const el = bone(container)
    expect(el).toHaveClass('h-4')
    expect(el).not.toHaveClass('h-3')
  })

  it('maps the fractional width prop to its width class', () => {
    const { container } = render(<SkeletonText width="2/3" />)
    const el = bone(container)
    expect(el).toHaveClass('w-2/3')
    expect(el).not.toHaveClass('w-full')
  })
})

describe('SkeletonList', () => {
  it('renders one row per requested count', () => {
    const { container } = render(<SkeletonList rows={4} />)
    expect(container.querySelectorAll('.h-12')).toHaveLength(4)
  })

  it('defaults to six rows', () => {
    const { container } = render(<SkeletonList />)
    expect(container.querySelectorAll('.h-12')).toHaveLength(6)
  })

  it('keeps every bone decorative', () => {
    const { container } = render(<SkeletonList rows={3} />)
    const allDivs = container.querySelectorAll('div')
    const bones = container.querySelectorAll('[aria-hidden]')
    // Each row has 4 bones; the wrapper/row divs are not aria-hidden.
    expect(bones).toHaveLength(3 * 4)
    expect(bones.length).toBeLessThan(allDivs.length)
  })
})

describe('SkeletonListRow', () => {
  it('renders the four-column row shape used by History/Invitations', () => {
    const { container } = render(<SkeletonListRow />)
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(4)
  })
})

describe('SkeletonCard', () => {
  it('renders a label bone plus three text lines', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(4)
  })
})

describe('SkeletonHero', () => {
  it('renders the eyebrow + headline + subline + CTA bones', () => {
    const { container } = render(<SkeletonHero />)
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(4)
  })
})

describe('SkeletonDashboard', () => {
  it('composes a hero, two cards, and a five-row list', () => {
    const { container } = render(<SkeletonDashboard />)
    // hero(4) + 2 cards(4 each) + list(5 rows x 4) = 4 + 8 + 20 = 32 bones.
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(32)
    expect(container.querySelectorAll('.h-12')).toHaveLength(5)
  })
})
