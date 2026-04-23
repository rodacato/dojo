import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// Minimal programmatic wrapper around Cloudflare Turnstile. Loads the
// Cloudflare script once, renders an invisible challenge, and calls
// `onToken(token)` when the client earns one. Single-use tokens are the
// rule server-side — the parent component should call `.reset()` via
// the ref after each successful submit so the next request has a fresh
// token waiting.

interface TurnstileOptions {
  sitekey: string
  callback: (token: string) => void
  'error-callback'?: (err?: string) => void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
  size?: 'invisible' | 'compact' | 'normal' | 'flexible'
  appearance?: 'always' | 'execute' | 'interaction-only'
}

interface TurnstileGlobal {
  render: (el: HTMLElement, opts: TurnstileOptions) => string
  remove: (id: string) => void
  reset: (id: string) => void
  execute: (id: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileGlobal
  }
}

export interface TurnstileHandle {
  reset: () => void
}

interface TurnstileWidgetProps {
  siteKey: string
  onToken: (token: string | null) => void
}

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
let scriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = TURNSTILE_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      // window.turnstile may take a tick to attach after onload.
      const poll = (attempts: number) => {
        if (window.turnstile) resolve()
        else if (attempts <= 0) reject(new Error('Turnstile global not available after load'))
        else setTimeout(() => poll(attempts - 1), 50)
      }
      poll(20)
    }
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Turnstile script'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

export const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, onToken }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const onTokenRef = useRef(onToken)
    onTokenRef.current = onToken

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current)
          } catch {
            // Widget already removed or destroyed — nothing to reset.
          }
        }
      },
    }))

    useEffect(() => {
      if (!containerRef.current) return
      let cancelled = false

      loadTurnstileScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token) => onTokenRef.current(token),
            'error-callback': () => onTokenRef.current(null),
            'expired-callback': () => onTokenRef.current(null),
            'timeout-callback': () => onTokenRef.current(null),
            size: 'invisible',
          })
        })
        .catch(() => {
          // Script load failed. Parent sees a null token and the API
          // will reject with turnstile_required — the UI shows a clear
          // message instead of a blank page.
          onTokenRef.current(null)
        })

      return () => {
        cancelled = true
        const id = widgetIdRef.current
        widgetIdRef.current = null
        if (id && window.turnstile) {
          try {
            window.turnstile.remove(id)
          } catch {
            // Widget already gone.
          }
        }
      }
    }, [siteKey])

    return <div ref={containerRef} />
  },
)
