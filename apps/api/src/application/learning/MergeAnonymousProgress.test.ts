import { describe, expect, it, vi } from 'vitest'
import type { CourseProgress } from '../../domain/learning/ports'
import { MergeAnonymousProgress } from './MergeAnonymousProgress'

function makeRepo(anonList: CourseProgress[], userProgress: Map<string, CourseProgress>) {
  return {
    findByOwnerAndCourse: vi.fn(async (owner, courseId) => {
      if (owner.kind !== 'user') return null
      return userProgress.get(courseId) ?? null
    }),
    findAllForAnonymous: vi.fn(async () => anonList),
    save: vi.fn(async (p: CourseProgress) => {
      userProgress.set(p.courseId, p)
    }),
    deleteAnonymous: vi.fn(async () => {}),
  }
}

describe('MergeAnonymousProgress', () => {
  it('merges with overlap — union of steps, max lastAccessedAt', async () => {
    const anon: CourseProgress = {
      owner: { kind: 'anonymous', sessionId: 'anon-1' },
      courseId: 'course-1',
      completedSteps: ['step-1', 'step-2'],
      lastAccessedAt: new Date('2026-03-28T10:00:00Z'),
    }
    const user: CourseProgress = {
      owner: { kind: 'user', userId: 'user-1' },
      courseId: 'course-1',
      completedSteps: ['step-2', 'step-3'],
      lastAccessedAt: new Date('2026-03-27T10:00:00Z'),
    }
    const userMap = new Map([['course-1', user]])
    const repo = makeRepo([anon], userMap)

    await new MergeAnonymousProgress({ progressRepo: repo }).execute({
      userId: 'user-1',
      anonymousSessionId: 'anon-1',
    })

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: { kind: 'user', userId: 'user-1' },
        courseId: 'course-1',
        completedSteps: ['step-2', 'step-3', 'step-1'],
        lastAccessedAt: new Date('2026-03-28T10:00:00Z'),
      }),
    )
    expect(repo.deleteAnonymous).toHaveBeenCalledWith('anon-1')
  })

  it('merges without overlap — user has no prior progress', async () => {
    const anon: CourseProgress = {
      owner: { kind: 'anonymous', sessionId: 'anon-1' },
      courseId: 'course-1',
      completedSteps: ['step-1'],
      lastAccessedAt: new Date(),
    }
    const repo = makeRepo([anon], new Map())

    await new MergeAnonymousProgress({ progressRepo: repo }).execute({
      userId: 'user-1',
      anonymousSessionId: 'anon-1',
    })

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: { kind: 'user', userId: 'user-1' },
        courseId: 'course-1',
        completedSteps: ['step-1'],
      }),
    )
    expect(repo.deleteAnonymous).toHaveBeenCalledWith('anon-1')
  })

  it('no-ops when anonymous session has no progress', async () => {
    const repo = makeRepo([], new Map())

    await new MergeAnonymousProgress({ progressRepo: repo }).execute({
      userId: 'user-1',
      anonymousSessionId: 'anon-empty',
    })

    expect(repo.save).not.toHaveBeenCalled()
    expect(repo.deleteAnonymous).not.toHaveBeenCalled()
  })
})
