/**
 * Generic tagged error interface
 */
export interface TaggedError<T extends string> extends Error {
  _tag: T;
  cause?: unknown;
}

/**
 * Generic error factory
 */
export const createTaggedError = <T extends string>(
  tag: T,
  message: string,
  cause?: unknown,
): TaggedError<T> => {
  const error = new Error(message) as TaggedError<T>;
  error._tag = tag;
  error.name = tag;
  error.cause = cause;
  return error;
};
