import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// UUIDv5 — deterministic UUIDs, no external dependency
// ---------------------------------------------------------------------------

const DOJO_NAMESPACE = 'a4c5d7e2-9b3f-4e1a-8c6d-2f0b7e5a1d9c'

export function uuidv5(name: string): string {
  const nsBytes = Buffer.from(DOJO_NAMESPACE.replace(/-/g, ''), 'hex')
  const nameBytes = Buffer.from(name, 'utf8')
  const hash = createHash('sha1').update(Buffer.concat([nsBytes, nameBytes])).digest()

  hash[6] = (hash[6]! & 0x0f) | 0x50
  hash[8] = (hash[8]! & 0x3f) | 0x80

  const hex = hash.subarray(0, 16).toString('hex')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20, 32)].join('-')
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

import type { Rubric } from '@dojo/shared'

export interface SeedExercise {
  id: string
  title: string
  description: string
  duration: number
  difficulty: 'easy' | 'medium' | 'hard'
  type: 'code' | 'chat' | 'whiteboard' | 'review'
  category: string
  languages: string[]
  tags: string[]
  topics: string[]
  testCode?: string // predefined tests for code execution (Piston)
  starterCode?: string // pre-filled code for fix-the-bug / scaffold exercises
  // Review-kata rubric (PRD 027). Only set when type === 'review'; hidden
  // from the learner until they submit.
  rubric?: Rubric
  variations: Array<{ ownerRole: string; ownerContext: string }>
}
