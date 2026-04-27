import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ExerciseDTO } from '@dojo/shared'
import { api } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'

const MOOD_LABEL: Record<string, string> = {
  focused: 'In flow',
  regular: 'Ok',
  low_energy: 'Foggy',
}

interface StoredFilters {
  mood?: string
  maxDuration?: number
}

export function KataSelectionPage() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<ExerciseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  const filters = useMemo<StoredFilters>(() => {
    const stored = sessionStorage.getItem('dojo-start')
    return stored ? (JSON.parse(stored) as StoredFilters) : {}
  }, [])

  useEffect(() => {
    api
      .getExercises(filters)
      .then(setExercises)
      .finally(() => setLoading(false))
  }, [filters])

  async function handleSelect(exerciseId: string) {
    setStarting(exerciseId)
    try {
      const { sessionId } = await api.startSession(exerciseId)
      navigate(`/kata/${sessionId}`)
    } catch {
      setStarting(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="px-4 py-10 md:py-14 max-w-3xl mx-auto">
      <FilterStrip filters={filters} onDismiss={() => navigate('/start')} />

      <header className="mt-4 mb-8">
        <h1 className="font-mono text-3xl md:text-4xl text-primary leading-tight inline-flex items-baseline">
          Three kata. One choice
          <span className="text-accent animate-cursor ml-0.5">|</span>
        </h1>
        <p className="text-secondary text-sm mt-2">
          These are your kata. No skip. No reroll.
        </p>
      </header>

      {exercises.length > 0 ? (
        <div className="flex flex-col gap-4">
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onSelect={() => handleSelect(ex.id)}
              starting={starting === ex.id}
              disabled={starting !== null && starting !== ex.id}
            />
          ))}
        </div>
      ) : (
        <EmptyResults onChange={() => navigate('/start')} />
      )}

      <p className="text-muted/40 text-[11px] font-mono uppercase tracking-wider text-center mt-12">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="hover:text-muted transition-colors"
        >
          ← back to dashboard
        </button>
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Filter strip                                                       */
/* ------------------------------------------------------------------ */

function FilterStrip({ filters, onDismiss }: { filters: StoredFilters; onDismiss: () => void }) {
  const today = useMemo(() => new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()).toLowerCase(), [])
  if (!filters.mood && !filters.maxDuration) return null
  const parts: string[] = ['Today']
  const moodLabel = filters.mood ? MOOD_LABEL[filters.mood] : undefined
  if (moodLabel) parts.push(moodLabel)
  if (filters.maxDuration) parts.push(`${filters.maxDuration} min`)
  return (
    <div className="flex items-center justify-between gap-4">
      <p
        className="text-muted text-xs font-mono uppercase tracking-wider"
        title={`Filters from ${today}`}
      >
        {parts.join(' · ')}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Change filters"
        className="text-muted hover:text-primary transition-colors p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:ring-accent rounded-sm"
      >
        ×
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Exercise card                                                      */
/* ------------------------------------------------------------------ */

function ExerciseCard({
  exercise: ex,
  onSelect,
  starting,
  disabled,
}: {
  exercise: ExerciseDTO
  onSelect: () => void
  starting: boolean
  disabled: boolean
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled || starting}
      aria-busy={starting || undefined}
      className="group w-full text-left bg-surface border border-border/60 rounded-md transition-colors hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-page focus-visible:ring-accent flex"
    >
      <div className="flex-1 min-w-0 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <TypeBadge type={ex.type} />
          <DifficultyBadge difficulty={ex.difficulty} />
        </div>

        <h2 className="text-primary font-mono text-lg md:text-xl mb-2">{ex.title}</h2>

        <p className="text-secondary text-sm font-sans leading-relaxed line-clamp-3 mb-4">
          {ex.description}
        </p>

        {ex.tags.length > 0 && (
          <div className="flex flex-wrap gap-x-2 gap-y-1 font-mono text-[11px]">
            {ex.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-secondary">
                <span className="text-accent">#</span>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end justify-between gap-3 px-5 md:px-6 py-5 md:py-6 border-l border-border/40 min-w-26 md:min-w-30">
        <div className="text-right">
          <p className="text-muted text-[10px] font-mono uppercase tracking-wider mb-1">Est. time</p>
          <p className="text-primary text-xl md:text-2xl font-mono">
            {ex.duration} <span className="text-muted text-sm">min</span>
          </p>
        </div>
        <span
          className={`text-xl ${starting ? 'text-accent animate-cursor' : 'text-accent group-hover:translate-x-0.5 transition-transform'}`}
          aria-hidden
        >
          {starting ? '_' : '→'}
        </span>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyResults({ onChange }: { onChange: () => void }) {
  return (
    <div className="bg-surface border border-border/40 rounded-md p-10 text-center">
      <p className="text-muted text-xs font-mono uppercase tracking-wider mb-3">No matches</p>
      <h2 className="font-mono text-xl text-primary mb-2">No kata matched these filters.</h2>
      <p className="text-secondary text-sm mb-6 max-w-md mx-auto">
        Loosen mood, time, or interests — or start without filters and see what shows up.
      </p>
      <Button variant="primary" size="md" onClick={onChange}>
        Change filters
      </Button>
    </div>
  )
}
