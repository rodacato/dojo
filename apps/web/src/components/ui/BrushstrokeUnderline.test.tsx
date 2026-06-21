import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'

// GSAP is a real external animation engine (not installed in the test env and
// not the unit under test). Mock the boundary so the component's render/observe
// wiring runs without driving a real timeline. matchMedia/IntersectionObserver
// closures are inert here; the structural SVG output is what a user observes.
const gsapTo = vi.fn()
const gsapSet = vi.fn()
const matchMediaAdd = vi.fn()

vi.mock('gsap', () => ({
  default: {
    to: (...args: unknown[]) => gsapTo(...args),
    set: (...args: unknown[]) => gsapSet(...args),
    matchMedia: () => ({ add: (...args: unknown[]) => matchMediaAdd(...args) }),
  },
}))

vi.mock('@gsap/react', () => ({
  useGSAP: (fn: () => void) => fn(),
}))

import { BrushstrokeUnderline } from './BrushstrokeUnderline'
import { pickUnderline } from '../../lib/brushstrokes'

type ObservedNode = Element

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []
  observed: ObservedNode[] = []
  disconnected = false
  readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    FakeIntersectionObserver.instances.push(this)
  }

  observe(node: ObservedNode) {
    this.observed.push(node)
  }

  disconnect() {
    this.disconnected = true
  }

  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  /** Drive the observer as if the SVG scrolled into view. */
  triggerIntersect(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

beforeEach(() => {
  gsapTo.mockClear()
  gsapSet.mockClear()
  matchMediaAdd.mockClear()
  FakeIntersectionObserver.instances = []
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function svgEl(container: HTMLElement): SVGSVGElement {
  const svg = container.querySelector('svg')
  if (!svg) throw new Error('expected an svg to render')
  return svg
}

describe('BrushstrokeUnderline', () => {
  it('renders the deterministic stroke for the given seed into the path geometry', () => {
    const seed = 'Kata: Two Sum'
    const expected = pickUnderline(seed)

    const { container } = render(<BrushstrokeUnderline seed={seed} />)

    const svg = svgEl(container)
    expect(svg).toHaveAttribute('viewBox', expected.viewBox)

    const path = svg.querySelector('path')
    expect(path).not.toBeNull()
    expect(path).toHaveAttribute('d', expected.d)
    expect(path).toHaveAttribute('stroke-width', String(expected.strokeWidth))
  })

  it('varies the stroke geometry by seed (deterministic pick is actually wired)', () => {
    // Two seeds that hash to different underline entries; if the component
    // ignored the seed and hardcoded a stroke, these would match.
    const seedA = 'a'
    const seedB = 'b'
    expect(pickUnderline(seedA).d).not.toBe(pickUnderline(seedB).d)

    const { container: a } = render(<BrushstrokeUnderline seed={seedA} />)
    const { container: b } = render(<BrushstrokeUnderline seed={seedB} />)

    expect(svgEl(a).querySelector('path')).toHaveAttribute('d', pickUnderline(seedA).d)
    expect(svgEl(b).querySelector('path')).toHaveAttribute('d', pickUnderline(seedB).d)
  })

  it('is decorative: the svg is aria-hidden so screen readers skip the ink', () => {
    const { container } = render(<BrushstrokeUnderline seed="x" />)
    expect(svgEl(container)).toHaveAttribute('aria-hidden')
  })

  it('keeps the brand accent color class and merges a caller className', () => {
    const { container } = render(<BrushstrokeUnderline seed="x" className="mt-2 w-32" />)
    const svg = svgEl(container)
    expect(svg).toHaveClass('text-accent')
    expect(svg).toHaveClass('mt-2', 'w-32')
  })

  it('applies only the accent class when no className is supplied', () => {
    const { container } = render(<BrushstrokeUnderline seed="x" />)
    const svg = svgEl(container)
    expect(svg).toHaveClass('text-accent')
    expect(svg.classList).toHaveLength(1)
  })

  it('draws the stroke with currentColor and rounded caps (ink-stroke styling)', () => {
    const { container } = render(<BrushstrokeUnderline seed="x" />)
    const path = svgEl(container).querySelector('path')
    expect(path).toHaveAttribute('stroke', 'currentColor')
    expect(path).toHaveAttribute('fill', 'none')
    expect(path).toHaveAttribute('stroke-linecap', 'round')
  })

  it('observes the svg so the reveal can trigger on first viewport entry', () => {
    const { container } = render(<BrushstrokeUnderline seed="x" />)
    const svg = svgEl(container)

    expect(FakeIntersectionObserver.instances).toHaveLength(1)
    const observer = FakeIntersectionObserver.instances[0]!
    expect(observer.observed).toContain(svg)
  })

  it('animates the draw-in and disconnects once the underline scrolls into view', () => {
    const { container } = render(<BrushstrokeUnderline seed="x" />)
    const path = svgEl(container).querySelector('path')
    const observer = FakeIntersectionObserver.instances[0]!

    expect(gsapTo).not.toHaveBeenCalled()

    observer.triggerIntersect(true)

    expect(gsapTo).toHaveBeenCalledTimes(1)
    const [target, vars] = gsapTo.mock.calls[0]!
    expect(target).toBe(path)
    expect(vars).toMatchObject({ strokeDashoffset: 0 })
    expect(observer.disconnected).toBe(true)
  })

  it('does not animate or disconnect while the underline stays out of view', () => {
    render(<BrushstrokeUnderline seed="x" />)
    const observer = FakeIntersectionObserver.instances[0]!

    observer.triggerIntersect(false)

    expect(gsapTo).not.toHaveBeenCalled()
    expect(observer.disconnected).toBe(false)
  })

  it('skips the IntersectionObserver entirely under prefers-reduced-motion', () => {
    const reduced = vi.fn((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    vi.stubGlobal('matchMedia', reduced)

    render(<BrushstrokeUnderline seed="x" />)

    // No observer is created when motion is reduced (the path is already drawn).
    expect(FakeIntersectionObserver.instances).toHaveLength(0)
    expect(gsapTo).not.toHaveBeenCalled()
  })
})
