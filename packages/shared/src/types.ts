export type Difficulty = 'easy' | 'medium' | 'hard'
export type ExerciseType = 'code' | 'chat' | 'whiteboard'
export type ExerciseStatus = 'draft' | 'published' | 'archived'
export type SessionStatus = 'active' | 'completed' | 'failed'

export interface User {
  id: string
  github_id: string
  username: string
  avatar_url: string
  created_at: string
}

export interface Exercise {
  id: string
  title: string
  description: string
  duration: number
  difficulty: Difficulty
  category: string
  type: ExerciseType
  status: ExerciseStatus
  language: string[]
  tags: string[]
  topics: string[]
  owner_role: string
  owner_context: string
  created_by: string
  created_at: string
}

export interface Variation {
  id: string
  exercise_id: string
  owner_role: string
  owner_context: string
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  exercise_id: string
  variation_id: string
  body: string
  status: SessionStatus
  started_at: string
  completed_at: string | null
}

export interface Attempt {
  id: string
  session_id: string
  user_response: string
  llm_response: string
  is_final_evaluation: boolean
  submitted_at: string
}
