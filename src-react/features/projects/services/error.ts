import { Data } from 'effect';

export class ProjectError extends Data.TaggedError('ProjectError')<{
  readonly message: string;
}> {}