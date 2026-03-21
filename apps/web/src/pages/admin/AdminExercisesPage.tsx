import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ExerciseType, Difficulty } from '@dojo/shared'
import { api, type AdminExerciseDTO } from '../../lib/api'
import { TypeBadge, DifficultyBadge } from '../../components/ui/Badge'

export function AdminExercisesPage() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState<AdminExerciseDTO[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getAdminExercises()
      .then(setExercises)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-mono text-xl text-primary">Exercises</h1>
        <button
          onClick={() => navigate('/admin/exercises/new')}
          className="px-4 py-2 bg-accent text-primary font-mono text-sm rounded-sm hover:bg-accent/90 transition-colors"
        >
          + New exercise
        </button>
      </div>

      {loading ? (
        <div className="text-muted font-mono text-sm">Loading...</div>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">
                  Title
                </th>
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">
                  Type
                </th>
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">
                  Difficulty
                </th>
                <th className="text-right px-4 py-2 text-muted font-mono text-xs uppercase">
                  Sessions
                </th>
                <th className="text-right px-4 py-2 text-muted font-mono text-xs uppercase">
                  Avg score
                </th>
                <th className="text-left px-4 py-2 text-muted font-mono text-xs uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {exercises.map((ex) => (
                <tr key={ex.id} className="hover:bg-surface transition-colors">
                  <td className="px-4 py-3 text-primary">{ex.title}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={ex.type as ExerciseType} />
                  </td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={ex.difficulty as Difficulty} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-secondary">
                    {ex.sessionCount}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-secondary">
                    {ex.avgScore !== null ? `${Math.round(ex.avgScore * 100)}%` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ex.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    published: 'text-success border border-success/30',
    draft: 'text-muted border border-muted/30',
    archived: 'text-danger border border-danger/30',
  }
  return (
    <span
      className={`font-mono text-xs px-2 py-0.5 rounded-sm ${styles[status] ?? styles['draft']}`}
    >
      {status.toUpperCase()}
    </span>
  )
}
