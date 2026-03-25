import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ExerciseDTO } from '@dojo/shared'
import { api } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import { TypeBadge, DifficultyBadge } from '../components/ui/Badge'

export function KataSelectionPage() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<ExerciseDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState<string | null>(null)

  const stored = sessionStorage.getItem('dojo-start')
  const filters = stored ? (JSON.parse(stored) as { mood?: string; maxDuration?: number }) : {}

  useEffect(() => {
    api
      .getExercises(filters)
      .then(setExercises)
      .finally(() => setLoading(false))
  }, [])

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
    <div className="px-4 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-1">
          {(filters.mood || filters.maxDuration) && (
            <div className="flex gap-2">
              {filters.mood && (
                <span className="text-xs font-mono px-2.5 py-1 bg-surface border border-border/40 rounded-sm text-muted">
                  {filters.mood === 'focused' ? '🔥 on a roll' : filters.mood === 'low_energy' ? '🧠 half here' : '😐 just okay'}
                </span>
              )}
              {filters.maxDuration && (
                <span className="text-xs font-mono px-2.5 py-1 bg-surface border border-border/40 rounded-sm text-muted">
                  ⏱ {filters.maxDuration} min
                </span>
              )}
            </div>
          )}
        </div>
        <h1 className="font-mono text-xl md:text-2xl text-primary">
          select_your_kata<span className="text-accent animate-pulse">|</span>
        </h1>
        <p className="text-muted text-xs font-sans mt-1">
          Choose a clinical trial. Each session is designed to test structural thinking and algorithmic efficiency. High performance is mandatory.
        </p>
      </div>

      {/* Exercise cards */}
      {exercises.length > 0 ? (
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onSelect={() => handleSelect(ex.id)}
              loading={starting === ex.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-secondary font-mono text-sm mb-2">no kata match your current filters.</p>
          <p className="text-muted text-xs mb-6">Try different preferences or a longer duration.</p>
          <button
            onClick={() => navigate('/start')}
            className="px-4 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
          >
            Change preferences
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="text-muted/30 text-xs text-center font-mono mt-10">
        these are your kata. no skip. no reroll.
      </p>

      {/* Subtle escape hatch */}
      <div className="text-center mt-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-muted/20 text-[10px] font-mono hover:text-muted/50 transition-colors"
        >
          skip to dashboard
        </button>
      </div>
    </div>
  )
}

function ExerciseCard({
  exercise: ex,
  onSelect,
  loading,
}: {
  exercise: ExerciseDTO
  onSelect: () => void
  loading: boolean
}) {
  return (
    <button
      onClick={onSelect}
      disabled={loading}
      className="w-full text-left bg-surface border border-border/60 rounded-md p-5 hover:border-accent flex flex-col h-full transition-all duration-150 disabled:opacity-50 group"
    >
      {/* Top: badges */}
      <div className="flex items-center justify-between mb-3">
        <TypeBadge type={ex.type} />
        <DifficultyBadge difficulty={ex.difficulty} />
      </div>

      {/* Title */}
      <h2 className="text-primary font-mono text-sm font-medium mb-2 group-hover:text-accent transition-colors">
        {ex.title.toLowerCase().replace(/\s+/g, '_')}
      </h2>

      {/* Description */}
      <p className="text-secondary text-xs font-sans leading-relaxed line-clamp-3 mb-4 flex-1">
        {ex.description}
      </p>

      {/* Footer: tags + duration */}
      <div className="border-t border-border/30 pt-3 mt-auto">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {ex.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-muted text-[10px] font-mono px-1.5 py-0.5 bg-base rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="font-mono text-muted text-xs">{ex.duration} min</span>
        </div>
      </div>

      {loading && (
        <span className="text-accent font-mono text-xs mt-3 block animate-pulse">
          preparing kata...
        </span>
      )}
    </button>
  )
}
