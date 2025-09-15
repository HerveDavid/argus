import { Data } from 'effect';

export class EcsError extends Data.TaggedError('EcsError')<{
  readonly message: string;
}> {}
