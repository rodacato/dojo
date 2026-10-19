import { type SeedKata, uuidv5 } from './types'

// Five-minute point kata (D52): tap the line with the bug, explain why.
// The code lives in starterCode and rubric.answer.line is 1-based within it.

export const microKatas: SeedKata[] = [
  {
    id: uuidv5('kata-micro-001-pagination-off-by-one'),
    title: 'Off-by-one in pagination',
    description:
      'Pages are 1-based: page 1 should return the first `limit` items. Users report that the first page of results never shows up.',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['micro', 'off-by-one'],
    topics: ['debugging', 'edge-cases'],
    starterCode: `function paginate<T>(items: T[], page: number, limit: number): T[] {
  if (page < 1 || limit < 1) return []
  const start = page * limit
  const end = start + limit
  return items.slice(start, end)
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'start treats a 1-based page as 0-based',
          severity: 'high',
          why: 'With page = 1, start is limit, so the slice begins at the second page and the first page is unreachable. start should be (page - 1) * limit.',
        },
      ],
      answer: { shape: 'point', line: 3 },
    },
    variations: [
      {
        ownerRole: 'Senior backend engineer who has shipped a dozen paginated APIs',
        ownerContext:
          'Credit a why that connects the 1-based contract to the slice offset. "Off by one" alone is a restatement, not a why.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-002-mutable-default-argument'),
    title: 'Tags that remember',
    description:
      'Each call should start with an empty list of tags. The second call prints both tags instead of only "billing".',
    duration: 5,
    difficulty: 'easy',
    type: 'review',
    category: 'debugging',
    languages: ['python'],
    tags: ['micro', 'python'],
    topics: ['debugging', 'python'],
    starterCode: `def add_tag(tag, tags=[]):
    if tag in tags:
        return tags
    tags.append(tag)
    return tags

first = add_tag("urgent")
second = add_tag("billing")
print(second)
`,
    rubric: {
      expectedIssues: [
        {
          title: 'Mutable default argument is shared across calls',
          severity: 'high',
          why: 'Python evaluates the default [] once, when the function is defined, so every call without tags appends to the same list. The fix is tags=None and creating a new list inside the function.',
        },
      ],
      answer: { shape: 'point', line: 1 },
    },
    variations: [
      {
        ownerRole: 'Python engineer who reviews a lot of code written by people coming from other languages',
        ownerContext:
          'The key insight is when the default is evaluated. A why that only says "the list is shared" without saying why it is shared is partial.',
      },
    ],
  },
  {
    id: uuidv5('kata-micro-003-async-foreach'),
    title: 'Zero emails sent',
    description:
      'Every user gets their email, yet notifyAll always reports that 0 emails were sent.',
    duration: 5,
    difficulty: 'medium',
    type: 'review',
    category: 'debugging',
    languages: ['typescript'],
    tags: ['micro', 'async'],
    topics: ['debugging', 'concurrency'],
    starterCode: `async function notifyAll(userIds: string[]): Promise<number> {
  let sent = 0
  userIds.forEach(async (id) => {
    await sendEmail(id)
    sent++
  })
  return sent
}
`,
    rubric: {
      expectedIssues: [
        {
          title: 'forEach does not wait for async callbacks',
          severity: 'high',
          why: 'forEach ignores the promises its callbacks return, so notifyAll returns before any sendEmail resolves and sent is still 0. Use for...of with await, or Promise.all over map.',
        },
      ],
      answer: { shape: 'point', line: 3 },
    },
    variations: [
      {
        ownerRole: 'Senior Node.js engineer who has debugged this exact report in production',
        ownerContext:
          'Credit a why that explains that the returned promises are dropped. Pointing at line 7 with a correct explanation is close but the cause is the forEach on line 3.',
      },
    ],
  },
]
