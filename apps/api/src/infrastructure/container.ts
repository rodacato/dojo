import { GetExerciseOptions } from '../application/practice/GetExerciseOptions'
import { GetSession } from '../application/practice/GetSession'
import { StartSession } from '../application/practice/StartSession'
import { SubmitAttempt } from '../application/practice/SubmitAttempt'
import { GetExerciseById } from '../application/content/GetExerciseById'
import { UpsertUser } from '../application/identity/UpsertUser'
import { db } from './persistence/drizzle/client'
import { PostgresExerciseRepository } from './persistence/PostgresExerciseRepository'
import { PostgresSessionRepository } from './persistence/PostgresSessionRepository'
import { PostgresUserRepository } from './persistence/PostgresUserRepository'
import { InMemoryEventBus } from './events/InMemoryEventBus'
import { MockLLMAdapter } from './llm/MockLLMAdapter'
import { AnthropicStreamAdapter } from './llm/AnthropicStreamAdapter'
import { config } from '../config'

const sessionRepo = new PostgresSessionRepository(db)
const exerciseRepo = new PostgresExerciseRepository(db)
const userRepo = new PostgresUserRepository(db)
const llm = config.LLM_ADAPTER === 'anthropic' ? new AnthropicStreamAdapter(config.LLM_API_KEY) : new MockLLMAdapter()

export const eventBus = new InMemoryEventBus()

export const useCases = {
  startSession: new StartSession({ exerciseRepo, sessionRepo, llm, eventBus }),
  submitAttempt: new SubmitAttempt({ sessionRepo, llm, eventBus }),
  getExerciseOptions: new GetExerciseOptions({ exerciseRepo }),
  getExerciseById: new GetExerciseById({ exerciseRepo }),
  getSession: new GetSession({ sessionRepo }),
  upsertUser: new UpsertUser({ userRepo }),
}
