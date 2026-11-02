import { beforeAll, describe, expect, it } from 'vitest'
import type { PistonAdapter as Adapter } from './PistonAdapter'
import { KATAS } from '../persistence/katas'
import { normalizeOutput } from '../../domain/practice/predict-answer'

// Runs real kata-shaped tests against Piston, which the unit tests mock.
// Opt-in with PISTON_TEST_URL (the dev container's is http://piston:2000).
const url = process.env['PISTON_TEST_URL']

describe.skipIf(!url)('PistonAdapter.execute against Piston', () => {
  let adapter: Adapter

  beforeAll(async () => {
    process.env['PISTON_URL'] = url
    const { PistonAdapter } = await import('./PistonAdapter')
    adapter = new PistonAdapter()
  })

  it('passes a TypeScript test that requires the solution and awaits a promise', async () => {
    const result = await adapter.execute({
      language: 'typescript',
      code: 'function topN(arr: number[], n: number): number[] {\n  return [...arr].sort((a, b) => b - a).slice(0, n)\n}\nmodule.exports = { topN }',
      testCode: "const assert = require('assert')\nconst { topN } = require('./solution')\nasync function run() {\n  await Promise.resolve()\n  assert.deepStrictEqual(topN([3, 1, 2], 2), [3, 2])\n  console.log('All tests passed')\n}\nrun()",
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('All tests passed')
  })

  it('still fails a TypeScript test when the solution is wrong', async () => {
    const result = await adapter.execute({
      language: 'typescript',
      code: 'function topN(arr: number[], n: number): number[] {\n  return arr.sort((a, b) => b - a).slice(0, n)\n}\nmodule.exports = { topN }',
      testCode: "const assert = require('assert')\nconst { topN } = require('./solution')\nconst nums = [3, 1, 2]\ntopN(nums, 2)\nassert.deepStrictEqual(nums, [3, 1, 2])",
    })

    expect(result.exitCode).not.toBe(0)
  })

  it.each([
    ['python', 'def f():\n    return 1', 'from solution import f\nassert f() == 1\nprint("All tests passed")'],
    ['ruby', 'def f; 1; end', "require_relative 'solution'\nraise 'wrong' unless f == 1\nputs 'All tests passed'"],
  ])('passes a %s test that loads the solution', async (language, code, testCode) => {
    const result = await adapter.execute({ language, code, testCode })

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('All tests passed')
  })

  // The expected output of a predict kata is never trusted from the author: it must be what the code prints.
  it.each(KATAS.filter((k) => k.rubric?.answer?.shape === 'predict').map((k) => [k.title, k] as const))(
    'predict kata "%s" prints its expected output',
    async (_title, kata) => {
      // The snippet goes in as the entry file, the way a kata's tests run.
      const result = await adapter.execute({ language: kata.languages[0]!, code: '', testCode: kata.starterCode! })
      const answer = kata.rubric!.answer!

      expect(result.exitCode).toBe(0)
      expect(normalizeOutput(result.stdout)).toBe(answer.shape === 'predict' ? normalizeOutput(answer.output) : null)
    },
  )
})

