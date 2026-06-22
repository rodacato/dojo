import { useEffect, useRef, useState } from 'react'

/**
 * Gradually reveals text character-by-character to simulate typing rhythm.
 * If text is being streamed naturally (small chunks), passes through unchanged.
 * Only kicks in when a large chunk appears at once (non-streaming mode).
 */
export function useTypingReveal(text: string, done: boolean): string {
  const [revealed, setRevealed] = useState('')
  const rafRef = useRef<number>(0)
  const indexRef = useRef(0)
  const prevLenRef = useRef(0)

  useEffect(() => {
    const delta = text.length - prevLenRef.current
    prevLenRef.current = text.length

    // Small chunks (streaming) — pass through immediately
    if (delta <= 20) {
      setRevealed(text)
      indexRef.current = text.length
      return
    }

    // Large chunk — drip it out
    const startIdx = indexRef.current
    const charsPerFrame = Math.max(2, Math.floor(delta / 60)) // ~1s reveal at 60fps

    // A frame already queued when the effect tears down must not re-schedule:
    // after unmount the rAF global may be gone (test env teardown), and a
    // stale tick rescheduling itself would throw. The flag short-circuits it.
    let cancelled = false

    function tick() {
      if (cancelled) return
      indexRef.current = Math.min(indexRef.current + charsPerFrame, text.length)
      setRevealed(text.slice(0, indexRef.current))

      if (indexRef.current < text.length) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    if (startIdx < text.length) {
      rafRef.current = requestAnimationFrame(tick)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
    }
  }, [text])

  // When done, ensure full text is shown
  useEffect(() => {
    if (done) {
      cancelAnimationFrame(rafRef.current)
      setRevealed(text)
      indexRef.current = text.length
    }
  }, [done, text])

  return revealed
}
