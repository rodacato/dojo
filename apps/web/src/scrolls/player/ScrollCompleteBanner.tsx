import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from '../../lib/config'

export function ScrollCompleteBanner({
  scrollTitle,
  scrollSlug,
  userId,
  lessonCount,
  stepCount,
}: Readonly<{
  scrollTitle: string
  scrollSlug: string
  // Null for anonymous finishers — they get the same completion moment, but the
  // share card (which is keyed by user) is replaced with an offer to sign in.
  userId?: string | null
  lessonCount: number
  stepCount: number
}>) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (!userId) return
    const shareUrl = `${globalThis.location.origin}/share/scroll/${scrollSlug}/${userId}`
    const text = `Completed ${scrollTitle} in dojo_`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'dojo_ scroll complete', text, url: shareUrl })
        return
      } catch {
        // Fall through to clipboard if the user dismisses the share sheet.
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
        '_blank',
      )
    }
  }

  const linkClasses =
    'font-mono text-xs tracking-[0.08em] uppercase border border-border text-secondary hover:border-accent hover:text-primary transition-colors px-4 h-9 inline-flex items-center justify-center rounded-sm'

  return (
    <section className="px-4 md:px-8 py-10 md:py-12 max-w-3xl mx-auto text-center">
      <p className="font-mono text-xs tracking-[0.08em] uppercase text-success">Scroll · Complete</p>
      <h2 className="text-primary text-3xl md:text-5xl font-semibold leading-tight tracking-tight mt-4">
        {scrollTitle}
      </h2>
      <p className="font-mono text-xs tracking-[0.08em] uppercase text-muted mt-3">
        {lessonCount} lessons · {stepCount} steps
      </p>

      {/* Verdict-style block — emerald LEFT BORDER for completion (NOT indigo). */}
      <div className="bg-surface border border-border border-l-4 border-l-success rounded-md p-6 md:p-8 mt-8 text-left">
        <p className="font-mono text-xs tracking-[0.08em] uppercase text-secondary">[Sensei]</p>
        <p className="text-primary text-base leading-relaxed mt-3">
          You pulled apart everything you swore you understood. Some answers were elegant. Some
          you brute-forced. Both worked. The cursor disagrees and keeps blinking.
        </p>
      </div>

      {!userId && (
        <p className="text-secondary text-sm leading-relaxed mt-6 max-w-md mx-auto">
          You finished without an account — this is saved in this browser. Sign in to keep it
          across devices and unlock your share card.
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-2 mt-8">
        <Link to="/scrolls" className={linkClasses}>
          ← Back to scrolls
        </Link>
        {userId ? (
          <button type="button" onClick={handleShare} className={linkClasses}>
            {copied ? 'Link copied!' : 'Share completion'}
          </button>
        ) : (
          <a href={`${API_URL}/auth/github`} className={linkClasses}>
            Sign in to save &amp; share →
          </a>
        )}
        <Link
          to="/"
          className="font-mono text-xs tracking-[0.08em] uppercase bg-accent text-on-accent hover:bg-accent/90 transition-colors px-4 h-9 inline-flex items-center justify-center rounded-sm"
        >
          Try the dojo →
        </Link>
      </div>
    </section>
  )
}
