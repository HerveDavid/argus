import { Data } from 'effect';

export class PowsyblError extends Data.TaggedError('PowsyblError')<{
  readonly message: string;
}> {}
