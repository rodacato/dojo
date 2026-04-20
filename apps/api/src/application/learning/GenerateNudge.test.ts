import { describe, expect, it, vi } from 'vitest'
import type { Course } from '../../domain/learning/course'
import { GenerateNudge, StepNotFoundError } from './GenerateNudge'

function buildCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'course-1',
    slug: 'test-course',
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

function buildDeps(course: Course | null = buildCourse(), nudgeText = 'Re-check the return path.') {
  const courseRepo = {
    findById: vi.fn(),
    findBySlug: vi.fn().mockResolvedValue(course),
    findAllPublished: vi.fn(),
    findAllPublic: vi.fn(),
  }
  const llm = {
    evaluate: vi.fn(),
    generateSessionBody: vi.fn(),
    nudge: vi.fn().mockResolvedValue(nudgeText),
  }
  return { courseRepo, llm }
}

describe('GenerateNudge', () => {
  it('returns the nudge for a valid step', async () => {
    const deps = buildDeps()
    const useCase = new GenerateNudge(deps)

    const result = await useCase.execute({
      courseSlug: 'test-course',
      stepId: '00000000-0000-0000-0000-000000000001',
      userCode: 'function sum(a, b) { return a - b }',
    })

    expect(result.nudge).toBe('Re-check the return path.')
    expect(result.stepId).toBe('00000000-0000-0000-0000-000000000001')
  })

  it('passes the step instruction and testCode to the LLM', async () => {
    const deps = buildDeps()
    const useCase = new GenerateNudge(deps)

    await useCase.execute({
      courseSlug: 'test-course',
      stepId: '00000000-0000-0000-0000-000000000001',
      userCode: 'function sum(a, b) { return a - b }',
      stderr: 'expected 3 got -1',
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

  it('throws StepNotFoundError when the course does not exist', async () => {
    const deps = buildDeps(null)
    const useCase = new GenerateNudge(deps)

    await expect(
      useCase.execute({
        courseSlug: 'missing',
        stepId: '00000000-0000-0000-0000-000000000001',
        userCode: '',
      }),
    ).rejects.toBeInstanceOf(StepNotFoundError)
  })

  it('throws StepNotFoundError when the step is not part of the course', async () => {
    const deps = buildDeps()
    const useCase = new GenerateNudge(deps)

    await expect(
      useCase.execute({
        courseSlug: 'test-course',
        stepId: '00000000-0000-0000-0000-000000000099',
        userCode: '',
      }),
    ).rejects.toBeInstanceOf(StepNotFoundError)
  })
})
