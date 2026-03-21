#!/usr/bin/env npx tsx
/**
 * Standalone LLM prompt tester.
 *
 * Usage:
 *   npx tsx scripts/test-llm.ts --variation A --case strong
 *   npx tsx scripts/test-llm.ts --variation B --case wrong
 *   npx tsx scripts/test-llm.ts --variation C --case partial
 *
 * Test cases: strong | partial | pattern | wrong | brief | excellent
 * Variations: A | B | C
 *
 * Requires: LLM_API_KEY in .env (or ANTHROPIC_API_KEY env var)
 */

import Anthropic from '@anthropic-ai/sdk'
import { buildPromptA, buildPromptB, buildPromptC } from '../apps/api/src/prompts/sensei'
import { EvaluationStreamParser } from '../apps/api/src/infrastructure/llm/evaluation-parser'

const args = process.argv.slice(2)
const variation = getArg(args, '--variation') ?? 'A'
const testCase = getArg(args, '--case') ?? 'strong'

const OWNER_ROLE = 'a senior backend engineer with 10 years of experience in Node.js and distributed systems'
const OWNER_CONTEXT = `You have strong opinions about error handling, observability, and API design. You have been burned by N+1 queries and unhandled promise rejections in production. You expect developers to think about the failure modes of their solutions, not just the happy path.`

const EXERCISE_TITLE = 'Handle Async Errors in Express'
const EXERCISE_DESCRIPTION = `You have an Express.js route that fetches a user from the database and returns their profile. The current implementation crashes the server when the database is unavailable.

Write a version of this route that:
1. Handles the database error without crashing the server
2. Returns an appropriate HTTP status code to the client
3. Logs the error with enough context to debug it

\`\`\`javascript
app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id)
  res.json(user)
})
\`\`\``

const TEST_CASES: Record<string, string> = {
  strong: `app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.findUser(req.params.id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (err) {
    logger.error({ err, userId: req.params.id }, 'Failed to fetch user')
    res.status(503).json({ error: 'Service temporarily unavailable' })
  }
})`,

  partial: `app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.findUser(req.params.id)
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
})`,

  pattern: `app.get('/users/:id', async (req, res, next) => {
  db.findUser(req.params.id)
    .then(user => res.json(user))
    .catch(next)
})`,

  wrong: `app.get('/users/:id', async (req, res) => {
  const user = await db.findUser(req.params.id).catch(() => null)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json(user)
})`,

  brief: `Wrap it in a try/catch and return 500.`,

  excellent: `app.get('/users/:id', async (req, res) => {
  try {
    const user = await db.findUser(req.params.id)
    if (!user) {
      return res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: \`No user with id \${req.params.id}\`
      })
    }
    res.json(user)
  } catch (err) {
    if (err instanceof DatabaseUnavailableError) {
      logger.error({ err, userId: req.params.id, query: 'findUser' }, 'Database unavailable')
      return res.status(503).json({
        error: 'SERVICE_UNAVAILABLE',
        retryAfter: 30
      })
    }
    logger.error({ err, userId: req.params.id }, 'Unexpected error fetching user')
    res.status(500).json({ error: 'INTERNAL_ERROR' })
  }
})`,
}

const PROMPT_BUILDERS: Record<string, typeof buildPromptA> = {
  A: buildPromptA,
  B: buildPromptB,
  C: buildPromptC,
}

async function main() {
  const apiKey = process.env['LLM_API_KEY'] ?? process.env['ANTHROPIC_API_KEY']
  if (!apiKey) {
    console.error('LLM_API_KEY (or ANTHROPIC_API_KEY) is required')
    process.exit(1)
  }

  const userResponse = TEST_CASES[testCase]
  if (!userResponse) {
    console.error(`Unknown test case: ${testCase}. Valid: ${Object.keys(TEST_CASES).join(', ')}`)
    process.exit(1)
  }

  const buildPromptFn = PROMPT_BUILDERS[variation]
  if (!buildPromptFn) {
    console.error(`Unknown variation: ${variation}. Valid: A, B, C`)
    process.exit(1)
  }

  const prompt = buildPromptFn({
    ownerRole: OWNER_ROLE,
    ownerContext: OWNER_CONTEXT,
    exerciseTitle: EXERCISE_TITLE,
    exerciseDescription: EXERCISE_DESCRIPTION,
    userResponse,
  })

  const model = process.env['LLM_MODEL'] ?? 'claude-opus-4-6'
  console.log(`\n=== VARIATION ${variation} — TEST CASE: ${testCase} (model: ${model}) ===\n`)

  const client = new Anthropic({ apiKey })
  const parser = new EvaluationStreamParser()

  process.stdout.write('[PROSE] ')

  const stream = client.messages.stream({
    model,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      const prose = parser.push(event.delta.text)
      if (prose) process.stdout.write(prose)
    }
  }

  const { result, error } = parser.finalize()

  console.log('\n\n[EVALUATION RESULT]')
  if (error) {
    console.error('Parse error:', error)
    process.exit(1)
  } else {
    console.log(JSON.stringify(result, null, 2))
  }
}

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] : undefined
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
