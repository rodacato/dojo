import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { PageLoader } from '../components/PageLoader'
import type { CourseDTO } from '@dojo/shared'

export function LearnPage() {
  const [courses, setCourses] = useState<CourseDTO[] | null>(null)

  useEffect(() => {
    api.getCourses().then(setCourses).catch(() => setCourses([]))
  }, [])

  if (!courses) return <PageLoader />

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border/40 bg-surface">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 flex items-center justify-between">
          <div>
            <Link to="/" className="text-muted text-xs font-mono hover:text-secondary transition-colors">
              ← dojo
            </Link>
            <h1 className="text-2xl font-mono text-primary mt-1">
              learn<span className="text-accent">_</span>
            </h1>
            <p className="text-sm text-muted mt-1">Free courses — no account required</p>
          </div>
        </div>
      </header>

      {/* Course grid */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {courses.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted font-mono">No courses available yet.</p>
            <p className="text-muted/60 text-sm mt-2">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function CourseCard({ course }: { course: CourseDTO }) {
  return (
    <Link
      to={`/learn/${course.slug}`}
      className="group bg-surface rounded-md border border-border/40 hover:border-accent/40 transition-all p-5 flex flex-col"
      style={{ borderTopColor: course.accentColor, borderTopWidth: '3px' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ backgroundColor: course.accentColor + '20', color: course.accentColor }}
        >
          {course.language}
        </span>
      </div>
      <h2 className="text-lg font-mono text-primary group-hover:text-accent transition-colors">
        {course.title}
      </h2>
      <p className="text-sm text-muted mt-2 flex-1">{course.description}</p>
      <div className="flex items-center gap-3 mt-4 text-xs text-muted/60 font-mono">
        <span>{course.lessonCount} lessons</span>
        <span>·</span>
        <span>{course.stepCount} steps</span>
      </div>
    </Link>
  )
}
