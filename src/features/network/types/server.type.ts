import { createTaggedError, TaggedError } from '@/types/tagged-error.type';

export interface ServerSldResponse {}

export type ServerSldError = TaggedError<'ServerSldError'>;

export const createServerSldError = (
  message: string,
  cause?: unknown,
): ServerSldError => createTaggedError('ServerSldError', message, cause);
