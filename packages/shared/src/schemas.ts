import { z } from 'zod'

export const difficultySchema = z.enum(['easy', 'medium', 'hard'])
export const exerciseTypeSchema = z.enum(['code', 'chat', 'whiteboard'])
export const exerciseStatusSchema = z.enum(['draft', 'published', 'archived'])
export const sessionStatusSchema = z.enum(['active', 'completed', 'failed'])

export const userSchema = z.object({
  id: z.string().uuid(),
  github_id: z.string(),
  username: z.string(),
  avatar_url: z.string().url(),
  created_at: z.string().datetime(),
})

export const exerciseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  duration: z.number().int().positive(),
  difficulty: difficultySchema,
  category: z.string(),
  type: exerciseTypeSchema,
  status: exerciseStatusSchema,
  language: z.array(z.string()),
  tags: z.array(z.string()),
  topics: z.array(z.string()),
  owner_role: z.string(),
  owner_context: z.string(),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
})

export const variationSchema = z.object({
  id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  owner_role: z.string(),
  owner_context: z.string(),
  created_at: z.string().datetime(),
})

export const sessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  variation_id: z.string().uuid(),
  body: z.string(),
  status: sessionStatusSchema,
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().nullable(),
})

export const attemptSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  user_response: z.string(),
  llm_response: z.string(),
  is_final_evaluation: z.boolean(),
  submitted_at: z.string().datetime(),
})
