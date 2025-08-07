export class FeederNotFoundError extends Error {
  readonly _tag = 'FeederNotFoundError';
  constructor(feederId: string) {
    super(`Feeder '${feederId}' not found`);
  }
}

export class FeederAlreadyExistsError extends Error {
  readonly _tag = 'FeederAlreadyExistsError';
  constructor(feederId: string) {
    super(`Feeder '${feederId}' already exists`);
  }
}

export class FeederOperationError extends Error {
  readonly _tag = 'FeederOperationError';
  constructor(operation: string, feederId: string, cause: unknown) {
    super(`${operation} failed for feeder ${feederId}: ${cause}`);
  }
}
