import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_URL } from '../lib/config'
import { LogoWordmark } from '../components/Logo'
import { PageLoader } from '../components/PageLoader'
import { ErrorState } from '../components/ui/ErrorState'

interface CourseShareData {
  courseSlug: string
  courseTitle: string
  courseLanguage: string
  courseAccentColor: string
  totalSteps: number
  completedAt: string
  username: string
  avatarUrl: string
}

export function CourseSharePage() {
  const { slug, userId } = useParams<{ slug: string; userId: string }>()
  const [data, setData] = useState<CourseShareData | null>(null)
  const [error, setError] = useState<'notfound' | 'network' | null>(null)
  const [retryTick, setRetryTick] = useState(0)

  useEffect(() => {
    if (!slug || !userId) return
    let cancelled = false
    setError(null)
    fetch(`${API_URL}/share/course/${slug}/${userId}`)
      .then((r) => {
        if (cancelled) return
        if (r.status === 404) {
          setError('notfound')
          return null
        }
        if (!r.ok) {
          setError('network')
          return null
        }
        return r.json()
      })
      .then((d) => { if (!cancelled && d) setData(d as CourseShareData) })
      .catch(() => { if (!cancelled) setError('network') })
    return () => { cancelled = true }
  }, [slug, userId, retryTick])

  if (error === 'notfound') {
    return (
      <ErrorState
        message="This completion doesn't exist yet — finish the course first."
        primaryAction={{ label: 'Browse courses', to: '/learn' }}
      />
    )
  }

  if (error === 'network') {
    return (
      <ErrorState
        message="We couldn't load this completion card."
        primaryAction={{ label: 'Try again', onClick: () => setRetryTick((n) => n + 1) }}
        secondaryAction={{ label: 'Go home', to: '/' }}
      />
    )
  }

  if (!data) return <PageLoader />

  const ogImageUrl = `${API_URL}/share/course/${data.courseSlug}/${userId}.png`
  const completedDate = new Date(data.completedAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  return (
    <>
      <title>{`${data.courseTitle} — completed by @${data.username} | dojo_`}</title>
      <meta property="og:title" content={`${data.courseTitle} — completed`} />
      <meta property="og:description" content={`@${data.username} finished ${data.courseTitle} in the dojo`} />
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:type" content="article" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={`${data.courseTitle} — completed | dojo_`} />
      <meta name="twitter:description" content={`@${data.username} finished ${data.courseTitle} in the dojo`} />
      <meta name="twitter:image" content={ogImageUrl} />

      <div className="min-h-screen bg-base text-primary">
        <nav className="flex items-center justify-between px-4 md:px-8 py-5 border-b border-border/20 max-w-4xl mx-auto">
          <Link to="/">
            <LogoWordmark />
          </Link>
          <Link
            to="/learn"
            className="text-sm font-mono text-muted hover:text-secondary transition-colors"
          >
            Browse courses →
          </Link>
        </nav>

        <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
          <div className="text-center mb-10">
            <span
              className="inline-block font-mono text-xs uppercase tracking-widest px-3 py-1.5 border rounded-sm"
              style={{ color: data.courseAccentColor, borderColor: `${data.courseAccentColor}66` }}
            >
              Course Complete
            </span>
          </div>

          <div className="text-center mb-8">
            <p className="text-muted text-sm font-mono mb-3">Completed</p>
            <h1 className="font-mono text-3xl md:text-4xl text-primary mb-4 leading-tight">
              {data.courseTitle}
            </h1>
            <p
              className="font-mono text-sm"
              style={{ color: data.courseAccentColor }}
            >
              {data.totalSteps} step{data.totalSteps === 1 ? '' : 's'} · {data.courseLanguage}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mt-10 mb-4">
            <img src={data.avatarUrl} alt={data.username} className="w-8 h-8 rounded-sm" />
            <span className="text-secondary text-sm font-mono">@{data.username}</span>
            <span className="text-border">·</span>
            <span className="text-muted text-sm font-mono">{completedDate}</span>
          </div>

          <div className="text-center mt-12 space-y-4">
            <Link
              to={`/learn/${data.courseSlug}`}
              className="inline-block px-8 py-3 font-mono text-sm uppercase tracking-wider rounded-sm transition-colors text-primary"
              style={{ backgroundColor: data.courseAccentColor }}
            >
              Start the course →
            </Link>
            <p className="text-muted/40 text-xs font-mono">
              One step at a time. No shortcuts. No AI assistance.
            </p>
          </div>
        </div>

        <img src={ogImageUrl} alt="" className="hidden" />
      </div>
    </>
  )
}
