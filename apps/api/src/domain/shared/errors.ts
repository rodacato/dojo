export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class SessionNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Session not found: ${id}`, 'SESSION_NOT_FOUND')
  }
}

export class SessionAlreadyCompletedError extends DomainError {
  constructor(id: string) {
    super(`Session is already completed or failed: ${id}`, 'SESSION_ALREADY_COMPLETED')
  }
}

export class ExerciseNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Exercise not found: ${id}`, 'EXERCISE_NOT_FOUND')
  }
}

export class NoEligibleExercisesError extends DomainError {
  constructor() {
    super('No eligible exercises found for the given filters', 'NO_ELIGIBLE_EXERCISES')
  }
}
