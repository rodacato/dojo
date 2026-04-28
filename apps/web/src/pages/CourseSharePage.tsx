import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_URL } from '../lib/config'
import { PublicPageLayout } from '../components/PublicPageLayout'
import { PageLoader } from '../components/PageLoader'
import { ErrorState } from '../components/ui/ErrorState'
import { buttonClasses } from '../components/ui/Button'

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
        kind="not-found"
        message="This completion doesn't exist yet — finish the course first."
        primaryAction={{ label: 'Browse courses', to: '/learn' }}
      />
    )
  }

  if (error === 'network') {
    return (
      <ErrorState
        kind="internal"
        message="We couldn't load this completion card."
        primaryAction={{ label: 'Try again', onClick: () => setRetryTick((n) => n + 1) }}
        secondaryAction={{ label: 'Go home', to: '/' }}
      />
    )
  }

  if (!data) return <PageLoader />

  const ogImageUrl = `${API_URL}/share/course/${data.courseSlug}/${userId}.png`
  const completedDate = new Date(data.completedAt).toISOString().slice(0, 10)
  const langGlyph = data.courseLanguage.slice(0, 4).toUpperCase()

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

      <PublicPageLayout>
        <div className="max-w-180 mx-auto px-4 md:px-6 pt-12 md:pt-20 pb-16">
          <article className="bg-surface border border-border rounded-md p-6 md:p-12 text-center flex flex-col items-center">
            {/* Eyebrow */}
            <p className="font-mono text-[11px] tracking-[0.08em] uppercase text-success border border-success/40 bg-success/10 px-2 py-1 rounded-sm">
              Course complete
            </p>

            {/* Title */}
            <h1 className="text-primary text-2xl md:text-[32px] font-semibold leading-tight tracking-tight mt-5 md:mt-6">
              {data.courseTitle}
            </h1>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap justify-center mt-3">
              <span
                className="font-mono text-[10px] tracking-[0.08em] uppercase border px-2 py-1 rounded-sm"
                style={{
                  color: data.courseAccentColor,
                  borderColor: `${data.courseAccentColor}66`,
                  backgroundColor: `${data.courseAccentColor}1a`,
                }}
              >
                {data.courseLanguage}
              </span>
              <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted border border-border px-2 py-1 rounded-sm">
                {data.totalSteps} steps
              </span>
            </div>

            {/* Course icon mark — typographic */}
            <div
              className="mt-8 md:mt-10 w-24 h-24 bg-elevated border border-border rounded-md flex items-center justify-center"
              aria-hidden
            >
              <span
                className="font-mono text-3xl md:text-[40px] font-bold tracking-[0.04em]"
                style={{ color: data.courseAccentColor }}
              >
                {langGlyph}
              </span>
            </div>

            {/* Body */}
            <p className="text-secondary text-base md:text-lg leading-relaxed mt-8 md:mt-10 max-w-md">
              Completed all {data.totalSteps} steps. Pulled it apart and put it back together
              under the timer.
            </p>

            {/* User identity + completion date */}
            <div className="flex flex-col items-center gap-1 mt-6 md:mt-8">
              <div className="flex items-center gap-2">
                <img
                  src={data.avatarUrl}
                  alt=""
                  aria-hidden
                  className="w-8 h-8 rounded-full bg-elevated"
                />
                <span className="text-secondary text-[15px]">@{data.username}</span>
              </div>
              <p className="font-mono text-[11px] tracking-[0.04em] text-muted">
                Completed {completedDate}
              </p>
            </div>

            {/* CTA */}
            <Link
              to={`/learn/${data.courseSlug}`}
              className={`${buttonClasses({ variant: 'primary', size: 'lg' })} w-full mt-8 md:mt-10`}
            >
              Start the course →
            </Link>
            <p className="text-muted text-[11px] font-mono tracking-[0.04em] mt-3">
              Free. No account required to begin.
            </p>
          </article>
        </div>

        <img src={ogImageUrl} alt="" className="hidden" />
      </PublicPageLayout>
    </>
  )
}
