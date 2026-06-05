import { describe, expect, it, vi } from 'vitest'
import type { Scroll } from '../../domain/learning/scroll'
import { GenerateNudge, StepNotFoundError } from './GenerateNudge'

function buildScroll(overrides: Partial<Scroll> = {}): Scroll {
  return {
    id: 'scroll-1',
    slug: 'test-scroll',
    title: 'Test',
    description: '',
    language: 'typescript',
    accentColor: '#000',
    status: 'published',
    isPublic: true,
    externalReferences: [],
    lessons: [
      {
        id: 'l1',
        order: 1,
        title: 'Lesson',
        steps: [
          {
            id: '00000000-0000-0000-0000-000000000001',
            order: 1,
            type: 'exercise',
            title: 'Sum two numbers',
            instruction: 'Implement sum(a, b) that returns a + b.',
            starterCode: null,
            testCode: 'assertEquals(sum(1, 2), 3)',
            hint: null,
            solution: null,
            alternativeApproach: null,
          },
        ],
      },
    ],
    ...overrides,
  }
}

function buildDeps(scroll: Scroll | null = buildScroll(), nudgeText = 'Re-check the return path.') {
  const scrollRepo = {
    findById: vi.fn(),
    findBySlug: vi.fn().mockResolvedValue(scroll),
    findAllPublished: vi.fn(),
    findAllPublic: vi.fn(),
  }
  const llm = {
    evaluate: vi.fn(),
    generateSessionBody: vi.fn(),
    generateSessionBodyStream: vi.fn(),
    nudge: vi.fn().mockResolvedValue(nudgeText),
    askSensei: vi.fn(),
  }
  const nudgeRepo = {
    create: vi.fn().mockResolvedValue('nudge-1'),
    setFeedback: vi.fn(),
  }
  return { scrollRepo, llm, nudgeRepo }
}

describe('GenerateNudge', () => {
  it('returns the nudge for a valid step', async () => {
    const deps = buildDeps()
    const useCase = new GenerateNudge(deps)

    const result = await useCase.execute({
      scrollSlug: 'test-scroll',
      stepId: '00000000-0000-0000-0000-000000000001',
      userCode: 'function sum(a, b) { return a - b }',
      userId: null,
    })

    expect(result.nudge).toBe('Re-check the return path.')
    expect(result.id).toBe('nudge-1')
    expect(result.stepId).toBe('00000000-0000-0000-0000-000000000001')
    expect(deps.nudgeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        stepId: '00000000-0000-0000-0000-000000000001',
        response: 'Re-check the return path.',
      }),
    )
  })

  it('passes the step instruction and testCode to the LLM', async () => {
    const deps = buildDeps()
    const useCase = new GenerateNudge(deps)

    await useCase.execute({
      scrollSlug: 'test-scroll',
      stepId: '00000000-0000-0000-0000-000000000001',
      userCode: 'function sum(a, b) { return a - b }',
      stderr: 'expected 3 got -1',
      userId: 'user-42',
    })

    expect(deps.llm.nudge).toHaveBeenCalledWith(
      expect.objectContaining({
        stepInstruction: 'Implement sum(a, b) that returns a + b.',
        testCode: 'assertEquals(sum(1, 2), 3)',
        userCode: 'function sum(a, b) { return a - b }',
        stderr: 'expected 3 got -1',
      }),
    )
  })

  it('throws StepNotFoundError when the scroll does not exist', async () => {
    const deps = buildDeps(null)
    const useCase = new GenerateNudge(deps)

    await expect(
      useCase.execute({
        scrollSlug: 'missing',
        stepId: '00000000-0000-0000-0000-000000000001',
        userCode: '',
        userId: null,
      }),
    ).rejects.toBeInstanceOf(StepNotFoundError)
  })

  it('throws StepNotFoundError when the step is not part of the scroll', async () => {
    const deps = buildDeps()
    const useCase = new GenerateNudge(deps)

    await expect(
      useCase.execute({
        scrollSlug: 'test-scroll',
        stepId: '00000000-0000-0000-0000-000000000099',
        userCode: '',
        userId: null,
      }),
    ).rejects.toBeInstanceOf(StepNotFoundError)
  })
})
