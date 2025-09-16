import { Data } from 'effect';

export class GameMasterError extends Data.TaggedError('GameMasterError')<{
  readonly message: string;
}> {}
