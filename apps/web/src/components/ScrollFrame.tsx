import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MAX_RESIZE_HEIGHT, type ScrollManifest } from '@dojo/shared'
import {
  createScrollHost,
  type ScrollHost,
  type ScrollHostCallbacks,
  type ScrollInitialState,
  type ScrollTheme,
} from '../lib/scrollHost'
import { preferredLocale, resolveLocale } from '../lib/scrollLocale'
import { useThemeTokens, type ThemeTokens } from '../hooks/useThemeTokens'
import { Banner } from './ui/Banner'
import { Button } from './ui/Button'
import { ErrorState } from './ui/ErrorState'

type FrameStatus = 'loading' | 'ready' | 'error'

const MIN_FRAME_HEIGHT = 120

const THEME_KEYS = ['page', 'surface', 'elevated', 'border', 'accent', 'success', 'danger', 'warning', 'primary', 'secondary', 'muted'] as const

function themeFromTokens(tokens: ThemeTokens): ScrollTheme {
  return Object.fromEntries(THEME_KEYS.map((key) => [`--color-${key}`, tokens[key]]))
}

interface ScrollFrameProps {
  title: string
  src: string
  origin: string
  manifest: ScrollManifest
  authenticated: boolean
  initial?: ScrollInitialState
  onProgress?: ScrollHostCallbacks['onProgress']
  onComplete?: ScrollHostCallbacks['onComplete']
}

export function ScrollFrame({
  title,
  src,
  origin,
  manifest,
  authenticated,
  initial,
  onProgress,
  onComplete,
}: Readonly<ScrollFrameProps>) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hostRef = useRef<ScrollHost | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const loadCount = useRef(0)
  const [status, setStatus] = useState<FrameStatus>('loading')
  const [attempt, setAttempt] = useState(0)
  const [height, setHeight] = useState<number | null>(null)
  const [reported, setReported] = useState<{ code: string; message: string } | null>(null)

  const tokens = useThemeTokens()
  const theme = useMemo(() => themeFromTokens(tokens), [tokens])
  const locale = resolveLocale(manifest.locales, preferredLocale())
  const latest = useRef({ locale, theme })
  const failed = status === 'error'
  const reports = useRef({ onProgress, onComplete })
  const initialRef = useRef(initial)

  useEffect(() => {
    reports.current = { onProgress, onComplete }
  }, [onProgress, onComplete])

  useEffect(() => {
    latest.current = { locale, theme }
    hostRef.current?.setLocale(locale)
    hostRef.current?.setTheme(theme)
  }, [locale, theme])

  useEffect(() => {
    if (failed) errorRef.current?.focus()
  }, [failed])

  useLayoutEffect(() => {
    const frame = iframeRef.current?.contentWindow
    if (!frame) return
    loadCount.current = 0
    const host = createScrollHost({
      frame,
      listener: globalThis.window,
      scrollOrigin: origin,
      manifest,
      authenticated,
      initial: initialRef.current,
      ...latest.current,
      callbacks: {
        onProgress: (message) => reports.current.onProgress?.(message),
        onComplete: (message) => reports.current.onComplete?.(message),
        onReady: () => setStatus('ready'),
        onTimeout: () => setStatus('error'),
        onResize: (next) => setHeight(Math.min(next, MAX_RESIZE_HEIGHT)),
        onError: ({ code, message }) => setReported({ code, message }),
      },
    })
    hostRef.current = host
    return () => {
      host.destroy()
      hostRef.current = null
    }
  }, [origin, manifest, authenticated, attempt, failed])

  function handleLoad() {
    loadCount.current += 1
    if (loadCount.current === 1) return
    hostRef.current?.reset()
    setStatus('loading')
    setReported(null)
  }

  function retry() {
    setStatus('loading')
    setHeight(null)
    setReported(null)
    setAttempt((n) => n + 1)
  }

  if (failed) {
    return (
      <div ref={errorRef} tabIndex={-1} role="alert" className="outline-none">
        <span data-testid="scroll-status" className="sr-only">
          error
        </span>
        <ErrorState
          variant="inline"
          eyebrow="SCROLL · NO RESPONSE"
          title="This scroll did not start."
          message="It never said hello to the dojo, so it was not loaded. It may be down or built for a different protocol."
          primaryAction={{ label: 'Try again', onClick: retry }}
        />
      </div>
    )
  }

  return (
    <div>
      <span data-testid="scroll-status" className="sr-only">
        {status === 'ready' ? 'connected' : 'loading'}
      </span>
      <div className="relative rounded-md border border-border bg-surface overflow-hidden">
        <iframe
          key={attempt}
          ref={iframeRef}
          src={src}
          title={title}
          data-testid="scroll-frame"
          sandbox="allow-scripts allow-same-origin"
          allow=""
          onLoad={handleLoad}
          className="block w-full border-0 bg-surface"
          style={{ height: height === null ? '70vh' : Math.max(height, MIN_FRAME_HEIGHT) }}
        />
        {status === 'loading' && (
          <div
            role="status"
            className="absolute inset-0 flex items-center justify-center bg-surface font-mono text-muted"
          >
            <span className="animate-pulse">
              loading scroll<span className="text-accent">_</span>
            </span>
          </div>
        )}
      </div>
      {reported && (
        <Banner
          tone="warning"
          eyebrow={`Scroll reported · ${reported.code}`}
          className="mt-4"
          action={
            <Button variant="ghost" size="sm" onClick={() => setReported(null)}>
              Dismiss
            </Button>
          }
        >
          {reported.message}
        </Banner>
      )}
    </div>
  )
}
