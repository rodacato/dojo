import { useEffect, useState } from 'react'
import { useOnline } from '../../hooks/useOnline'
import { Banner } from '../ui/Banner'

/**
 * Persistent offline banner — fixed at the top of the viewport while
 * offline, dismisses automatically when reconnected. Per stitch/batches/
 * 10-edge-states-modals.md SCREEN 3 — "OFFLINE BANNER".
 */
export function OfflineBanner() {
  const { online, offlineSince } = useOnline()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (online) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [online])

  if (online || !offlineSince) return null

  const seconds = Math.max(0, Math.floor((now - offlineSince) / 1000))
  const eyebrow = `Offline · Last connected ${formatAge(seconds)} ago`

  return (
    <div className="sticky top-0 z-40">
      <Banner
        tone="danger"
        eyebrow={eyebrow}
        bottomBorder
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-mono text-[11px] uppercase tracking-wider text-secondary hover:text-primary transition-colors"
          >
            Retry now
          </button>
        }
      >
        We'll reconnect when your network returns. Active kata are paused at the last sync.
      </Banner>
    </div>
  )
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h`
}
