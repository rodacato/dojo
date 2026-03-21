import { GetExerciseOptions } from '../application/practice/GetExerciseOptions'
import { StartSession } from '../application/practice/StartSession'
import { SubmitAttempt } from '../application/practice/SubmitAttempt'
import { UpsertUser } from '../application/identity/UpsertUser'
import { InMemoryEventBus } from './events/InMemoryEventBus'
// Database adapters imported in Phase 3

// Phase 0: stubs for repositories (replaced with real adapters in Phase 3)
const stubSessionRepo = {
  save: async () => {},
  findById: async () => null,
  findActiveByUserId: async () => null,
}

const stubExerciseRepo = {
  findEligible: async () => [],
  findById: async () => null,
  save: async () => {},
}

const stubUserRepo = {
  findByGithubId: async () => null,
  save: async () => {},
}

const stubLlm = {
  evaluate: async function* () {},
  generateSessionBody: async () => '',
}

export const eventBus = new InMemoryEventBus()

export const useCases = {
  startSession: new StartSession({
    exerciseRepo: stubExerciseRepo,
    sessionRepo: stubSessionRepo,
    llm: stubLlm,
    eventBus,
  }),
  submitAttempt: new SubmitAttempt({ sessionRepo: stubSessionRepo, llm: stubLlm, eventBus }),
  getExerciseOptions: new GetExerciseOptions({ exerciseRepo: stubExerciseRepo }),
  upsertUser: new UpsertUser({ userRepo: stubUserRepo }),
}
