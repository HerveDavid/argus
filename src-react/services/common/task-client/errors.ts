export class TaskNotFoundError extends Error {
  readonly _tag = 'TaskNotFoundError';
  constructor(taskId: string) {
    super(`Task '${taskId}' not found`);
  }
}

export class TaskAlreadyExistsError extends Error {
  readonly _tag = 'TaskAlreadyExistsError';
  constructor(taskId: string) {
    super(`Task '${taskId}' already exists`);
  }
}

export class TaskOperationError extends Error {
  readonly _tag = 'TaskOperationError';
  constructor(operation: string, taskId: string, cause: unknown) {
    super(`${operation} failed for task ${taskId}: ${cause}`);
  }
}
