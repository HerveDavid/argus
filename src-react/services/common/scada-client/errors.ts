import { Data } from 'effect';

export class ScadaError extends Data.TaggedError('ScadaError')<{
  readonly message: string;
}> {}
