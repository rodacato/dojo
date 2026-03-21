import { GetExerciseOptions } from '../application/practice/GetExerciseOptions'
import { StartSession } from '../application/practice/StartSession'
import { SubmitAttempt } from '../application/practice/SubmitAttempt'
import { UpsertUser } from '../application/identity/UpsertUser'
import { db } from './persistence/drizzle/client'
import { PostgresExerciseRepository } from './persistence/PostgresExerciseRepository'
import { PostgresSessionRepository } from './persistence/PostgresSessionRepository'
import { PostgresUserRepository } from './persistence/PostgresUserRepository'
import { InMemoryEventBus } from './events/InMemoryEventBus'
// LLM adapter (AnthropicStreamAdapter) added in later phase
import { MockLLMAdapter } from './llm/MockLLMAdapter'

const sessionRepo = new PostgresSessionRepository(db)
const exerciseRepo = new PostgresExerciseRepository(db)
const userRepo = new PostgresUserRepository(db)
const llm = new MockLLMAdapter()

export const eventBus = new InMemoryEventBus()

export const useCases = {
  startSession: new StartSession({ exerciseRepo, sessionRepo, llm, eventBus }),
  submitAttempt: new SubmitAttempt({ sessionRepo, llm, eventBus }),
  getExerciseOptions: new GetExerciseOptions({ exerciseRepo }),
  upsertUser: new UpsertUser({ userRepo }),
}
