import { describe, expect, it, vi } from 'vitest'
import { Session } from '../../domain/practice/session'
import { ExerciseId, SessionId, UserId, VariationId } from '../../domain/shared/types'
import { GetSession } from './GetSession'

const makeSession = () =>
  new Session({
    id: SessionId('session-1'),
    userId: UserId('user-1'),
    exerciseId: ExerciseId('ex-1'),
    variationId: VariationId('var-1'),
    body: 'Review this code...',
    status: 'active',
    attempts: [],
    startedAt: new Date(),
    completedAt: null,
  })

describe('GetSession', () => {
  it('returns session when found', async () => {
    const session = makeSession()
    const sessionRepo = {
      save: vi.fn(),
      updateBody: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn().mockResolvedValue(session),
      findActiveByUserId: vi.fn(),
    }

    const useCase = new GetSession({ sessionRepo })
    const result = await useCase.execute(SessionId('session-1'))

    expect(result).toBe(session)
    expect(sessionRepo.findById).toHaveBeenCalledWith(SessionId('session-1'))
  })

  it('returns null when session does not exist', async () => {
    const sessionRepo = {
      save: vi.fn(),
      updateBody: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findActiveByUserId: vi.fn(),
    }

    const useCase = new GetSession({ sessionRepo })
    const result = await useCase.execute(SessionId('nonexistent'))

    expect(result).toBeNull()
  })
})
