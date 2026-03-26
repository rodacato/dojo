import { GetExerciseOptions } from '../application/practice/GetExerciseOptions'
import { GetSession } from '../application/practice/GetSession'
import { GenerateSessionBody } from '../application/practice/GenerateSessionBody'
import { StartSession } from '../application/practice/StartSession'
import { SubmitAttempt } from '../application/practice/SubmitAttempt'
import { GetExerciseById } from '../application/content/GetExerciseById'
import { CreateExercise } from '../application/content/CreateExercise'
import { UpsertUser } from '../application/identity/UpsertUser'
import { db } from './persistence/drizzle/client'
import { PostgresExerciseRepository } from './persistence/PostgresExerciseRepository'
import { PostgresSessionRepository } from './persistence/PostgresSessionRepository'
import { PostgresUserRepository } from './persistence/PostgresUserRepository'
import { InMemoryEventBus } from './events/InMemoryEventBus'
import { MockLLMAdapter } from './llm/MockLLMAdapter'
import { AnthropicStreamAdapter } from './llm/AnthropicStreamAdapter'
import { OpenAIStreamAdapter } from './llm/OpenAIStreamAdapter'
import { config } from '../config'
import { registerBadgeHandlers } from './events/BadgeEventHandler'
import type { LLMPort } from '../domain/practice/ports'

const sessionRepo = new PostgresSessionRepository(db)
const exerciseRepo = new PostgresExerciseRepository(db)
const userRepo = new PostgresUserRepository(db)

function createLLMAdapter(): LLMPort {
  switch (config.LLM_ADAPTER_FORMAT) {
    case 'anthropic':
      return new AnthropicStreamAdapter(config.LLM_API_KEY)
    case 'openai':
      return new OpenAIStreamAdapter(config.LLM_API_KEY, config.LLM_BASE_URL ?? 'https://api.openai.com')
    default:
      return new MockLLMAdapter()
  }
}

const llm = createLLMAdapter()

export const eventBus = new InMemoryEventBus()

// Register domain event handlers
registerBadgeHandlers(eventBus, db)

export const useCases = {
  startSession: new StartSession({ exerciseRepo, sessionRepo, eventBus }),
  generateSessionBody: new GenerateSessionBody({ exerciseRepo, sessionRepo, llm }),
  submitAttempt: new SubmitAttempt({ sessionRepo, llm, eventBus }),
  getExerciseOptions: new GetExerciseOptions({ exerciseRepo }),
  getExerciseById: new GetExerciseById({ exerciseRepo }),
  createExercise: new CreateExercise({ exerciseRepo }),
  getSession: new GetSession({ sessionRepo }),
  upsertUser: new UpsertUser({ userRepo }),
}
