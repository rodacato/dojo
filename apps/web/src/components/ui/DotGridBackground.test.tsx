import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

import { DotGridBackground } from './DotGridBackground'

// jsdom reports 0 for offsetWidth/offsetHeight, which would make the grid empty.
// Stub the layout box so the component can compute cols/rows (gap = 32px).
function stubLayoutBox(width: number, height: number) {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: width })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    value: height,
  })
}

function restoreLayoutBox() {
  delete (HTMLElement.prototype as { offsetWidth?: number }).offsetWidth
  delete (HTMLElement.prototype as { offsetHeight?: number }).offsetHeight
}

// The component reads pointer coords relative to getBoundingClientRect; jsdom
// returns an all-zero rect, so pin the origin to (0,0) for predictable math.
function pinRectToOrigin(el: HTMLElement, width: number, height: number) {
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: width,
      bottom: height,
      width,
      height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect
}

function getRoot(container: HTMLElement): HTMLDivElement {
  const root = container.querySelector<HTMLDivElement>('[aria-hidden="true"]')
  if (!root) throw new Error('DotGridBackground root not found')
  return root
}

function getDots(root: HTMLElement): HTMLDivElement[] {
  return Array.from(root.querySelectorAll<HTMLDivElement>('div'))
}

function dotAt(dots: HTMLDivElement[], index: number): HTMLDivElement {
  const dot = dots.at(index)
  if (!dot) throw new Error(`No dot at index ${index} (length ${dots.length})`)
  return dot
}

const realMatchMedia = window.matchMedia

function setPrefersReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as typeof window.matchMedia
}

afterEach(() => {
  restoreLayoutBox()
  window.matchMedia = realMatchMedia
})

describe('DotGridBackground', () => {
  it('renders a single decorative container hidden from assistive tech', () => {
    stubLayoutBox(0, 0)
    const { container } = render(<DotGridBackground />)

    const root = getRoot(container)
    expect(root).toBeInTheDocument()
    expect(root).toHaveAttribute('aria-hidden', 'true')
  })

  it('merges a caller className onto the base layout classes', () => {
    stubLayoutBox(0, 0)
    const { container } = render(<DotGridBackground className="z-10 bg-canvas" />)

    const root = getRoot(container)
    expect(root).toHaveClass('absolute', 'inset-0', 'overflow-hidden')
    expect(root).toHaveClass('z-10', 'bg-canvas')
  })

  describe('grid generation', () => {
    it('fills the box with one dot per 32px cell (cols × rows)', () => {
      // 320 / 32 = 10 cols, 64 / 32 = 2 rows -> 20 dots.
      stubLayoutBox(320, 64)
      const { container } = render(<DotGridBackground />)

      expect(getDots(getRoot(container))).toHaveLength(20)
    })

    it('floors fractional cell counts instead of overflowing the box', () => {
      // 100 / 32 = 3.125 -> 3 cols; 80 / 32 = 2.5 -> 2 rows -> 6 dots.
      stubLayoutBox(100, 80)
      const { container } = render(<DotGridBackground />)

      expect(getDots(getRoot(container))).toHaveLength(6)
    })

    it('renders no dots when the box is smaller than one cell', () => {
      stubLayoutBox(20, 20)
      const { container } = render(<DotGridBackground />)

      expect(getDots(getRoot(container))).toHaveLength(0)
    })

    it('centers each dot within its cell and records its position on data-x/data-y', () => {
      stubLayoutBox(320, 64)
      const { container } = render(<DotGridBackground />)
      const dots = getDots(getRoot(container))

      // First cell center: (gap/2, gap/2) = (16, 16).
      expect(dotAt(dots, 0)).toHaveAttribute('data-x', '16')
      expect(dotAt(dots, 0)).toHaveAttribute('data-y', '16')
      // Last cell center: col 9 -> 9*32+16 = 304, row 1 -> 1*32+16 = 48.
      expect(dotAt(dots, -1)).toHaveAttribute('data-x', '304')
      expect(dotAt(dots, -1)).toHaveAttribute('data-y', '48')
    })

    it('starts every dot at the resting opacity', () => {
      stubLayoutBox(320, 64)
      const { container } = render(<DotGridBackground />)

      for (const dot of getDots(getRoot(container))) {
        expect(dot.style.opacity).toBe('0.15')
      }
    })
  })

  describe('pointer interaction (motion allowed)', () => {
    it('brightens the dot directly under the cursor to peak opacity', () => {
      stubLayoutBox(320, 64)
      const { container } = render(<DotGridBackground />)
      const root = getRoot(container)
      pinRectToOrigin(root, 320, 64)
      const dots = getDots(root)

      // Hover exactly over the first dot (16,16): dist 0 -> 0.15 + 0.55*1 = 0.7.
      root.dispatchEvent(new MouseEvent('mousemove', { clientX: 16, clientY: 16, bubbles: true }))

      expect(parseFloat(dotAt(dots, 0).style.opacity)).toBeCloseTo(0.7, 5)
    })

    it('leaves dots outside the falloff radius at resting opacity', () => {
      stubLayoutBox(320, 64)
      const { container } = render(<DotGridBackground />)
      const root = getRoot(container)
      pinRectToOrigin(root, 320, 64)
      const dots = getDots(root)

      // Cursor over the first dot; the last dot (304,48) is >120px away.
      root.dispatchEvent(new MouseEvent('mousemove', { clientX: 16, clientY: 16, bubbles: true }))

      expect(dotAt(dots, -1).style.opacity).toBe('0.15')
    })

    it('resets every dot to resting opacity when the cursor leaves', () => {
      stubLayoutBox(320, 64)
      const { container } = render(<DotGridBackground />)
      const root = getRoot(container)
      pinRectToOrigin(root, 320, 64)
      const dots = getDots(root)

      root.dispatchEvent(new MouseEvent('mousemove', { clientX: 16, clientY: 16, bubbles: true }))
      expect(parseFloat(dotAt(dots, 0).style.opacity)).toBeGreaterThan(0.15)

      root.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
      expect(dotAt(dots, 0).style.opacity).toBe('0.15')
    })

    it('animates opacity transitions when motion is allowed', () => {
      stubLayoutBox(320, 64)
      const { container } = render(<DotGridBackground />)

      expect(dotAt(getDots(getRoot(container)), 0).style.transition).toBe('opacity 0.3s ease')
    })
  })

  describe('prefers-reduced-motion', () => {
    beforeEach(() => {
      setPrefersReducedMotion(true)
    })

    it('disables the opacity transition on dots', () => {
      stubLayoutBox(320, 64)
      const { container } = render(<DotGridBackground />)

      expect(dotAt(getDots(getRoot(container)), 0).style.transition).toBe('none')
    })

    it('does not react to pointer movement (dots stay at resting opacity)', () => {
      stubLayoutBox(320, 64)
      const { container } = render(<DotGridBackground />)
      const root = getRoot(container)
      pinRectToOrigin(root, 320, 64)
      const dots = getDots(root)

      root.dispatchEvent(new MouseEvent('mousemove', { clientX: 16, clientY: 16, bubbles: true }))

      expect(dotAt(dots, 0).style.opacity).toBe('0.15')
    })
  })
})
