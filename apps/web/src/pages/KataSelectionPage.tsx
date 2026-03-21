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

  useEffect(() => {
    const stored = sessionStorage.getItem('dojo-start')
    const filters = stored
      ? (JSON.parse(stored) as { mood: string; maxDuration: number })
      : {}
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
    <div className="min-h-screen bg-base px-4 py-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-mono text-xl text-primary">Choose your kata.</h1>
        <p className="text-muted text-sm mt-1">No skip. No reroll. These are your exercises.</p>
      </div>

      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onSelect={() => handleSelect(ex.id)}
            loading={starting === ex.id}
          />
        ))}
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
      className="w-full text-left bg-surface border border-border rounded-md p-4 hover:border-accent transition-colors duration-150 disabled:opacity-50"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-2">
          <TypeBadge type={ex.type} />
          <DifficultyBadge difficulty={ex.difficulty} />
        </div>
        <span className="font-mono text-secondary text-sm">{ex.duration}m</span>
      </div>
      <h2 className="text-primary font-medium">{ex.title}</h2>
      {ex.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {ex.tags.map((tag) => (
            <span
              key={tag}
              className="text-muted text-xs font-mono px-1.5 py-0.5 bg-elevated rounded-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      {loading && (
        <span className="text-accent font-mono text-xs mt-2 block">Loading kata...</span>
      )}
    </button>
  )
}
