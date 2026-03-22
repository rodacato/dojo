import { describe, expect, it, vi } from 'vitest'
import { User } from '../../domain/identity/user'
import { UpsertUser } from './UpsertUser'

describe('UpsertUser', () => {
  it('returns existing user when found by githubId', async () => {
    const existing = User.create({
      githubId: '12345',
      username: 'existinguser',
      avatarUrl: 'https://github.com/avatar/12345',
    })
    const userRepo = {
      findByGithubId: vi.fn().mockResolvedValue(existing),
      save: vi.fn(),
    }

    const useCase = new UpsertUser({ userRepo })
    const result = await useCase.execute({
      githubId: '12345',
      username: 'existinguser',
      avatarUrl: 'https://github.com/avatar/12345',
    })

    expect(result).toBe(existing)
    expect(userRepo.save).not.toHaveBeenCalled()
  })

  it('creates and saves new user when not found', async () => {
    const userRepo = {
      findByGithubId: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    }

    const useCase = new UpsertUser({ userRepo })
    const result = await useCase.execute({
      githubId: '99999',
      username: 'newuser',
      avatarUrl: 'https://github.com/avatar/99999',
    })

    expect(result.githubId).toBe('99999')
    expect(result.username).toBe('newuser')
    expect(result.id).toBeDefined()
    expect(userRepo.save).toHaveBeenCalledWith(result)
  })
})
