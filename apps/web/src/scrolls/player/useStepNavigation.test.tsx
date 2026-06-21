import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { ScrollDetailDTO } from '@dojo/shared'
import { useStepNavigation } from './useStepNavigation'

type Step = { id: string }
type Lesson = { steps: Step[] }

function makeScroll(lessons: Lesson[]): ScrollDetailDTO {
  return { lessons } as unknown as ScrollDetailDTO
}

const SCROLL = makeScroll([
  { steps: [{ id: 's1' }, { id: 's2' }] },
  { steps: [{ id: 's3' }] },
])

// Renders the hook at /scrolls/:slug/:stepId and exposes the live URL so we can
// assert navigation side-effects through the real router.
function renderAtStep(scroll: ScrollDetailDTO | null, initialPath: string) {
  let location = ''
  function LocationProbe() {
    location = useLocation().pathname
    return null
  }
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/scrolls/:slug/:stepId"
          element={
            <>
              <LocationProbe />
              {children}
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
  const hook = renderHook(() => useStepNavigation(scroll), { wrapper })
  return { ...hook, getLocation: () => location }
}

describe('useStepNavigation', () => {
  it('resolves activeStepId to the :stepId param when it names a real step', () => {
    const { result } = renderAtStep(SCROLL, '/scrolls/intro/s2')
    expect(result.current.activeStepId).toBe('s2')
  })

  it('resolves activeStepId to null when the param names no existing step', () => {
    const { result } = renderAtStep(SCROLL, '/scrolls/intro/ghost')
    expect(result.current.activeStepId).toBeNull()
  })

  it('returns null activeStepId when scroll is null even if the URL has a stepId', () => {
    const { result } = renderAtStep(null, '/scrolls/intro/s1')
    expect(result.current.activeStepId).toBeNull()
  })

  it('navigateToStep pushes /scrolls/:slug/:id for an arbitrary id', () => {
    const { result, getLocation } = renderAtStep(SCROLL, '/scrolls/intro/s1')
    act(() => {
      result.current.navigateToStep('s3')
    })
    expect(getLocation()).toBe('/scrolls/intro/s3')
  })

  it('advanceToNextStep moves to the next step, crossing lesson boundaries', () => {
    const { result, getLocation } = renderAtStep(SCROLL, '/scrolls/intro/s2')
    act(() => {
      result.current.advanceToNextStep()
    })
    // s2 is the last step of lesson 1; next is s3, the first of lesson 2.
    expect(getLocation()).toBe('/scrolls/intro/s3')
  })

  it('advanceToNextStep is a no-op on the final step', () => {
    const { result, getLocation } = renderAtStep(SCROLL, '/scrolls/intro/s3')
    act(() => {
      result.current.advanceToNextStep()
    })
    expect(getLocation()).toBe('/scrolls/intro/s3')
  })

  it('advanceToNextStep is a no-op when activeStepId does not resolve', () => {
    const { result, getLocation } = renderAtStep(SCROLL, '/scrolls/intro/ghost')
    act(() => {
      result.current.advanceToNextStep()
    })
    expect(getLocation()).toBe('/scrolls/intro/ghost')
  })
})
